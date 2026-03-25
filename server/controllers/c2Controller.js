const { spawn }  = require('child_process');
const fs          = require('fs');
const path        = require('path');
const Engagement  = require('../models/Engagement');

// ── Workspace / cache directories ─────────────────────────────────────────────
const C2_DIR          = path.join(__dirname, '..', 'c2');
const WORKSPACES_DIR  = path.join(C2_DIR, 'workspaces');
const PLUGIN_CACHE    = path.join(C2_DIR, '.terraform-plugin-cache');

[WORKSPACES_DIR, PLUGIN_CACHE].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── In-memory live output per deployment ─────────────────────────────────────
const liveBuffers = {};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getWorkspaceDir = (engId, deployId) =>
  path.join(WORKSPACES_DIR, String(engId), String(deployId));

/**
 * Convert an absolute path to Docker-mountable format.
 * On Windows: C:\path\to\dir → C:/path/to/dir (Docker Desktop accepts this).
 * On Linux/Mac: unchanged.
 */
const toDockerPath = (absPath) =>
  process.platform === 'win32' ? absPath.replace(/\\/g, '/') : absPath;

/**
 * Run a terraform command inside Docker, streaming output.
 * Resolves with the full combined stdout+stderr string on exit 0.
 * Rejects with an Error (with .output attached) on non-zero exit.
 */
const runTerraform = (workspaceDir, args, envVars = {}, onChunk = null) =>
  new Promise((resolve, reject) => {
    const wsMounted    = toDockerPath(workspaceDir);
    const cacheMounted = toDockerPath(PLUGIN_CACHE);

    const dockerArgs = [
      'run', '--rm',
      '-v', `${wsMounted}:/workspace`,
      '-v', `${cacheMounted}:/plugin-cache`,
      '-e', 'TF_PLUGIN_CACHE_DIR=/plugin-cache',
      '-w', '/workspace',
      ...Object.entries(envVars).flatMap(([k, v]) => ['-e', `${k}=${v}`]),
      'hashicorp/terraform',
      ...args,
    ];

    const proc = spawn('docker', dockerArgs);
    let output = '';

    const handle = (data) => {
      const chunk = data.toString();
      output += chunk;
      if (onChunk) onChunk(chunk);
    };

    proc.stdout.on('data', handle);
    proc.stderr.on('data', handle);
    proc.on('close', (code) => {
      if (code === 0) resolve(output);
      else {
        const err = new Error(`Terraform exited with code ${code}`);
        err.output = output;
        reject(err);
      }
    });
    proc.on('error', (err) => {
      err.output = output;
      reject(err);
    });
  });

/**
 * Generate main.tf content for a DigitalOcean droplet.
 * Non-sensitive values (hostname, region, size, image) are hardcoded.
 * Sensitive values (token, root password) are passed via TF_VAR_* env vars.
 */
const generateMainTf = (cfg) => `terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

variable "do_token" {
  type      = string
  sensitive = true
}

variable "root_password" {
  type      = string
  sensitive = true
  default   = ""
}

resource "digitalocean_droplet" "c2_node" {
  name   = "${cfg.hostname}"
  region = "${cfg.region}"
  size   = "${cfg.size}"
  image  = "${cfg.image}"

  user_data = <<-USERDATA
    #!/bin/bash
    # Set root password — base64-encoded to safely handle special characters
    _rtoc_pass=$(echo "\${base64encode(var.root_password)}" | base64 -d)
    printf '%s:%s\\n' root "$_rtoc_pass" | chpasswd

    # Ubuntu 22.04+ uses sshd_config.d/ which OVERRIDES the main config
    mkdir -p /etc/ssh/sshd_config.d
    printf 'PasswordAuthentication yes\\nPermitRootLogin yes\\n' > /etc/ssh/sshd_config.d/99-rtoc.conf

    # Also patch the main sshd_config for older distros (Debian, CentOS, Fedora)
    sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/^#*PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config

    # Restart SSH (service name differs by distro)
    systemctl restart ssh 2>/dev/null || systemctl restart sshd 2>/dev/null || service ssh restart 2>/dev/null || true
    USERDATA
}

output "droplet_ip" {
  value = digitalocean_droplet.c2_node.ipv4_address
}

output "droplet_id" {
  value = digitalocean_droplet.c2_node.id
}
`;

// ── Async deploy workflow ─────────────────────────────────────────────────────
const deployWorkflow = async (workspaceDir, cfg, engId, deployId) => {
  const envVars = {
    TF_VAR_do_token:      cfg.doToken,
    TF_VAR_root_password: cfg.rootPassword || '',
  };

  const append = (text) => {
    liveBuffers[deployId] = (liveBuffers[deployId] || '') + text;
  };

  const flush = async (status, extra = {}) => {
    try {
      const setFields = {
        'c2Deployments.$.status':    status,
        'c2Deployments.$.output':    liveBuffers[deployId] || '',
        'c2Deployments.$.updatedAt': new Date(),
      };
      Object.entries(extra).forEach(([k, v]) => { setFields[`c2Deployments.$.${k}`] = v; });
      await Engagement.findOneAndUpdate(
        { _id: engId, 'c2Deployments._id': deployId },
        { $set: setFields }
      );
    } catch (e) { console.error('[c2] db flush error:', e.message); }
  };

  try {
    append('[RTOC] Starting Terraform deployment workflow...\n\n');

    // ── Step 1: init ──────────────────────────────────────────────────────────
    append('════════════════════════════════════════\n');
    append(' STEP 1/3  terraform init\n');
    append('════════════════════════════════════════\n');
    await runTerraform(workspaceDir, ['init', '-no-color'], {}, append);
    await flush('deploying');

    // ── Step 2: apply ─────────────────────────────────────────────────────────
    append('\n════════════════════════════════════════\n');
    append(' STEP 2/3  terraform apply\n');
    append('════════════════════════════════════════\n');
    await runTerraform(workspaceDir, ['apply', '-auto-approve', '-no-color'], envVars, append);

    // ── Step 3: get outputs ───────────────────────────────────────────────────
    append('\n════════════════════════════════════════\n');
    append(' STEP 3/3  Reading outputs\n');
    append('════════════════════════════════════════\n');
    const outputRaw = await runTerraform(workspaceDir, ['output', '-json', '-no-color'], {});

    let ip = '';
    try {
      const parsed = JSON.parse(outputRaw);
      ip = parsed?.droplet_ip?.value || '';
    } catch {}

    append(`\n✓ DEPLOYMENT COMPLETE\n`);
    append(`  Droplet IP : ${ip || '(see output above)'}\n`);
    append(`  SSH        : ssh root@${ip || '<ip>'}\n`);
    append(`  Note       : Password auth via user_data runs on first boot — allow 60s.\n`);

    await flush('running', { ipAddress: ip });
  } catch (err) {
    append(`\n✗ DEPLOYMENT FAILED\n`);
    append(`  ${err.message}\n`);
    if (err.output) append(err.output);
    await flush('failed');
  } finally {
    // Keep buffer 30 min, then release memory
    setTimeout(() => { delete liveBuffers[deployId]; }, 30 * 60 * 1000);
  }
};

// ── Async destroy workflow ────────────────────────────────────────────────────
const destroyWorkflow = async (workspaceDir, config, engId, deployId) => {
  const envVars = {
    TF_VAR_do_token:      config.doToken || '',
    TF_VAR_root_password: '',
  };

  const append = (text) => {
    liveBuffers[deployId] = (liveBuffers[deployId] || '') + text;
  };

  const flush = async (status) => {
    try {
      await Engagement.findOneAndUpdate(
        { _id: engId, 'c2Deployments._id': deployId },
        { $set: {
          'c2Deployments.$.status':    status,
          'c2Deployments.$.output':    liveBuffers[deployId] || '',
          'c2Deployments.$.updatedAt': new Date(),
        }}
      );
    } catch (e) { console.error('[c2] db flush error:', e.message); }
  };

  try {
    append('\n════════════════════════════════════════\n');
    append(' terraform destroy\n');
    append('════════════════════════════════════════\n');
    await runTerraform(workspaceDir, ['destroy', '-auto-approve', '-no-color'], envVars, append);
    append(`\n✓ INFRASTRUCTURE DESTROYED\n`);
    await flush('destroyed');
    // Clean up workspace files
    try { fs.rmSync(workspaceDir, { recursive: true, force: true }); } catch {}
  } catch (err) {
    append(`\n✗ DESTROY FAILED\n  ${err.message}\n`);
    if (err.output) append(err.output);
    await flush('failed');
  } finally {
    setTimeout(() => { delete liveBuffers[deployId]; }, 30 * 60 * 1000);
  }
};

// ── Controllers ───────────────────────────────────────────────────────────────

// POST /api/c2/:engId/deploy
exports.deploy = async (req, res) => {
  try {
    const eng = await Engagement.findOne({
      _id: req.params.engId,
      $or: [{ user: req.user._id }, { operators: String(req.user._id) }],
    });
    if (!eng) return res.status(404).json({ message: 'Engagement not found.' });

    const { deployName, doToken, hostname, region, size, image, rootPassword } = req.body;

    if (!doToken?.trim())      return res.status(400).json({ message: 'DigitalOcean API token required.' });
    if (!hostname?.trim())     return res.status(400).json({ message: 'Hostname required.' });
    if (!rootPassword?.trim()) return res.status(400).json({ message: 'Root password required.' });

    // Add deployment record
    eng.c2Deployments.push({
      template:          'digitalocean-droplet',
      name:              deployName?.trim() || hostname.trim(),
      status:            'deploying',
      config: {
        doToken,        // stored for destroy
        rootPassword,   // stored for copy-to-clipboard on card
        hostname:  hostname.trim(),
        region:    region   || 'nyc3',
        size:      size     || 's-1vcpu-1gb',
        image:     image    || 'ubuntu-22-04-x64',
      },
      output:            '',
      ipAddress:         '',
      createdBy:         String(req.user._id),
      createdByCallsign: req.user.callsign || '',
    });

    await eng.save();

    const deployment = eng.c2Deployments[eng.c2Deployments.length - 1];
    const deployId   = String(deployment._id);
    const workspaceDir = getWorkspaceDir(String(eng._id), deployId);

    // Create workspace + write terraform files
    fs.mkdirSync(workspaceDir, { recursive: true });
    fs.writeFileSync(
      path.join(workspaceDir, 'main.tf'),
      generateMainTf(deployment.config)
    );

    // Start async workflow (fire & forget)
    liveBuffers[deployId] = '';
    deployWorkflow(workspaceDir, { doToken, rootPassword }, String(eng._id), deployId);

    res.json({ deploymentId: deployId, status: 'deploying' });
  } catch (err) {
    console.error('[c2] deploy error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/c2/:engId/destroy/:deployId
exports.destroy = async (req, res) => {
  try {
    const eng = await Engagement.findOne({
      _id: req.params.engId,
      $or: [{ user: req.user._id }, { operators: String(req.user._id) }],
    });
    if (!eng) return res.status(404).json({ message: 'Engagement not found.' });

    const deployment = eng.c2Deployments.id(req.params.deployId);
    if (!deployment) return res.status(404).json({ message: 'Deployment not found.' });

    if (['destroying', 'destroyed'].includes(deployment.status)) {
      return res.status(400).json({ message: `Cannot destroy: already ${deployment.status}.` });
    }

    deployment.status = 'destroying';
    await eng.save();

    const workspaceDir = getWorkspaceDir(String(eng._id), String(deployment._id));
    const deployId     = String(deployment._id);

    if (!fs.existsSync(path.join(workspaceDir, 'terraform.tfstate'))) {
      // No state file — mark destroyed without running terraform
      await Engagement.findOneAndUpdate(
        { _id: eng._id, 'c2Deployments._id': deployment._id },
        { $set: { 'c2Deployments.$.status': 'destroyed' }}
      );
      return res.json({ status: 'destroyed', note: 'No state found — marked as destroyed.' });
    }

    liveBuffers[deployId] = (liveBuffers[deployId] || '') + '[RTOC] Initiating destroy...\n';
    destroyWorkflow(workspaceDir, deployment.config, String(eng._id), deployId);

    res.json({ status: 'destroying' });
  } catch (err) {
    console.error('[c2] destroy error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/c2/:engId/status/:deployId
exports.getStatus = async (req, res) => {
  try {
    const eng = await Engagement.findOne({
      _id: req.params.engId,
      $or: [{ user: req.user._id }, { operators: String(req.user._id) }],
    });
    if (!eng) return res.status(404).json({ message: 'Engagement not found.' });

    const deployment = eng.c2Deployments.id(req.params.deployId);
    if (!deployment) return res.status(404).json({ message: 'Deployment not found.' });

    const deployId = String(deployment._id);
    const output   = liveBuffers[deployId] ?? deployment.output ?? '';

    res.json({
      status:    deployment.status,
      ipAddress: deployment.ipAddress,
      updatedAt: deployment.updatedAt,
      output,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/c2/:engId/deployments/:deployId  — remove record from DB
exports.deleteDeployment = async (req, res) => {
  try {
    const eng = await Engagement.findOne({
      _id: req.params.engId,
      $or: [{ user: req.user._id }, { operators: String(req.user._id) }],
    });
    if (!eng) return res.status(404).json({ message: 'Engagement not found.' });

    eng.c2Deployments.pull({ _id: req.params.deployId });
    await eng.save();

    // Clean up workspace if it exists
    const workspaceDir = getWorkspaceDir(String(eng._id), req.params.deployId);
    try { fs.rmSync(workspaceDir, { recursive: true, force: true }); } catch {}

    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
