/* ── Cookie Exporter — popup.js ───────────────────────────────────────────── */

let allCookies   = [];   // all cookies for current tab's domain(s)
let filtered     = [];   // currently visible (after path/domain filter)
let selectedKeys = new Set(); // "name|domain" combos that are checked
let currentTab   = null;
let activeFilter = 'all';

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  const url = new URL(tab.url);
  document.getElementById('current-url').textContent = url.hostname;

  await loadCookies(url);
  document.getElementById('btn-export').addEventListener('click', exportJSON);
  document.getElementById('btn-copy').addEventListener('click', copyJSON);
});

// ── Load cookies for the current tab ─────────────────────────────────────────
async function loadCookies(url) {
  // Get cookies for the exact URL (respects httpOnly, secure flags)
  const byUrl    = await browser.cookies.getAll({ url: url.href });
  // Also get by domain to catch parent-domain cookies (e.g. .microsoft.com)
  const domain   = url.hostname;
  const parts    = domain.split('.');
  const baseDomain = parts.length >= 2 ? '.' + parts.slice(-2).join('.') : domain;
  const byDomain = await browser.cookies.getAll({ domain: baseDomain });

  // Deduplicate by name+domain
  const seen = new Set();
  allCookies = [];
  for (const c of [...byUrl, ...byDomain]) {
    const key = `${c.name}|${c.domain}`;
    if (!seen.has(key)) { seen.add(key); allCookies.push(c); }
  }

  allCookies.sort((a, b) => a.name.localeCompare(b.name));

  // Default: select all
  selectedKeys = new Set(allCookies.map(c => `${c.name}|${c.domain}`));

  buildFilters();
  applyFilter('all');
  updateCount();
}

// ── Build domain/path filter buttons ─────────────────────────────────────────
function buildFilters() {
  const domains = [...new Set(allCookies.map(c => c.domain))];
  const row = document.getElementById('filter-row');
  row.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.textContent = `All (${allCookies.length})`;
  allBtn.dataset.filter = 'all';
  allBtn.addEventListener('click', () => applyFilter('all', allBtn));
  row.appendChild(allBtn);

  for (const d of domains) {
    const count = allCookies.filter(c => c.domain === d).length;
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = `${d.replace(/^\./, '')} (${count})`;
    btn.dataset.filter = d;
    btn.addEventListener('click', () => applyFilter(d, btn));
    row.appendChild(btn);
  }
}

function applyFilter(filterVal, clickedBtn) {
  activeFilter = filterVal;

  // Update button styles
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (clickedBtn) clickedBtn.classList.add('active');
  else document.querySelector('[data-filter="all"]')?.classList.add('active');

  filtered = filterVal === 'all'
    ? [...allCookies]
    : allCookies.filter(c => c.domain === filterVal);

  renderList();
  updateButtons();
}

// ── Render cookie list ────────────────────────────────────────────────────────
function renderList() {
  const listEl = document.getElementById('cookie-list');
  listEl.innerHTML = '';

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No cookies found for this page.</div>';
    return;
  }

  // Select-all row
  const allRow = document.createElement('div');
  allRow.className = 'select-all-row';
  const allChk = document.createElement('input');
  allChk.type = 'checkbox';
  allChk.id = 'chk-all';
  const allSelected = filtered.every(c => selectedKeys.has(`${c.name}|${c.domain}`));
  allChk.checked = allSelected;
  allChk.indeterminate = !allSelected && filtered.some(c => selectedKeys.has(`${c.name}|${c.domain}`));
  allChk.addEventListener('change', () => {
    if (allChk.checked) {
      filtered.forEach(c => selectedKeys.add(`${c.name}|${c.domain}`));
    } else {
      filtered.forEach(c => selectedKeys.delete(`${c.name}|${c.domain}`));
    }
    renderList();
    updateButtons();
  });
  const allLabel = document.createElement('label');
  allLabel.htmlFor = 'chk-all';
  allLabel.textContent = `Select all (${filtered.length})`;
  allRow.appendChild(allChk);
  allRow.appendChild(allLabel);
  listEl.appendChild(allRow);

  // Individual cookies
  for (const cookie of filtered) {
    const key = `${cookie.name}|${cookie.domain}`;
    const row = document.createElement('div');
    row.className = 'cookie-item';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = selectedKeys.has(key);
    chk.addEventListener('change', () => {
      if (chk.checked) selectedKeys.add(key);
      else selectedKeys.delete(key);
      updateButtons();
      updateSelectAll();
    });

    const nameEl = document.createElement('div');
    nameEl.className = 'cookie-name';
    nameEl.textContent = cookie.name;
    nameEl.title = cookie.name;

    const valEl = document.createElement('div');
    valEl.className = 'cookie-value';
    valEl.textContent = cookie.value.length > 20 ? cookie.value.slice(0, 20) + '…' : cookie.value;
    valEl.title = cookie.value;

    row.appendChild(chk);
    row.appendChild(nameEl);
    row.appendChild(valEl);
    listEl.appendChild(row);
  }
}

function updateSelectAll() {
  const allChk = document.getElementById('chk-all');
  if (!allChk) return;
  const allSelected = filtered.every(c => selectedKeys.has(`${c.name}|${c.domain}`));
  const noneSelected = !filtered.some(c => selectedKeys.has(`${c.name}|${c.domain}`));
  allChk.checked = allSelected;
  allChk.indeterminate = !allSelected && !noneSelected;
}

function updateCount() {
  document.getElementById('total-count').textContent = allCookies.length;
}

function updateButtons() {
  const hasSelected = selectedKeys.size > 0;
  document.getElementById('btn-export').disabled = !hasSelected;
  document.getElementById('btn-copy').disabled = !hasSelected;
}

// ── Build export payload ──────────────────────────────────────────────────────
function buildPayload() {
  const url = new URL(currentTab.url);
  const selected = allCookies.filter(c => selectedKeys.has(`${c.name}|${c.domain}`));

  return {
    exportedAt:  new Date().toISOString(),
    tabUrl:      currentTab.url,
    hostname:    url.hostname,
    cookieCount: selected.length,
    cookies: selected.map(c => ({
      name:     c.name,
      value:    c.value,
      domain:   c.domain,
      path:     c.path,
      secure:   c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
      session:  c.session,
      expirationDate: c.expirationDate || null,
    })),
  };
}

// ── Export as JSON file ───────────────────────────────────────────────────────
function exportJSON() {
  const payload = buildPayload();
  const hostname = payload.hostname.replace(/[^a-z0-9.-]/gi, '_');
  const ts = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const filename = `cookies_${hostname}_${ts}.json`;

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showSuccess(`Exported ${payload.cookieCount} cookies as ${filename}`);
}

// ── Copy JSON to clipboard ────────────────────────────────────────────────────
async function copyJSON() {
  const payload = buildPayload();
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  showSuccess(`Copied ${payload.cookieCount} cookies to clipboard`);
}

// ── Success feedback ──────────────────────────────────────────────────────────
function showSuccess(msg) {
  const bar = document.getElementById('success-bar');
  document.getElementById('success-msg').textContent = msg;
  bar.classList.add('show');
  setTimeout(() => bar.classList.remove('show'), 3000);
}
