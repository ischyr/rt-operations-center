import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select,
  SimpleGrid, Modal, ModalOverlay, ModalContent, ModalBody, Spinner,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CloseIcon, ViewIcon, ViewOffIcon, CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

// ── API / styles ───────────────────────────────────────────────────────────────
const API = 'http://localhost:5000/api';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const inputStyles = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

const selectStyles = {
  bg: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px', h: '40px', fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  cursor: 'pointer', focusBorderColor: 'rgba(255,80,95,0.7)',
  _hover: { borderColor: 'rgba(255,80,95,0.4)' },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

// ── Static data ───────────────────────────────────────────────────────────────
const DO_REGIONS = [
  { value: 'nyc1', label: '🇺🇸  New York 1' },
  { value: 'nyc3', label: '🇺🇸  New York 3' },
  { value: 'sfo3', label: '🇺🇸  San Francisco 3' },
  { value: 'ams3', label: '🇳🇱  Amsterdam 3' },
  { value: 'sgp1', label: '🇸🇬  Singapore 1' },
  { value: 'lon1', label: '🇬🇧  London 1' },
  { value: 'fra1', label: '🇩🇪  Frankfurt 1' },
  { value: 'tor1', label: '🇨🇦  Toronto 1' },
  { value: 'blr1', label: '🇮🇳  Bangalore 1' },
  { value: 'syd1', label: '🇦🇺  Sydney 1' },
];

const DO_IMAGES = {
  Ubuntu: [
    { value: 'ubuntu-24-04-x64', label: '24.04 LTS (Noble)' },
    { value: 'ubuntu-22-04-x64', label: '22.04 LTS (Jammy)' },
    { value: 'ubuntu-20-04-x64', label: '20.04 LTS (Focal)' },
  ],
  Debian: [
    { value: 'debian-12-x64', label: '12 (Bookworm)' },
    { value: 'debian-11-x64', label: '11 (Bullseye)' },
  ],
  CentOS: [{ value: 'centos-stream-9-x64', label: 'Stream 9' }],
  Fedora: [
    { value: 'fedora-40-x64', label: '40' },
    { value: 'fedora-39-x64', label: '39' },
  ],
};

const DO_SIZES = {
  'Basic': [
    { value: 's-1vcpu-1gb',  label: '1 vCPU · 1 GB · $6/mo' },
    { value: 's-1vcpu-2gb',  label: '1 vCPU · 2 GB · $12/mo' },
    { value: 's-2vcpu-2gb',  label: '2 vCPU · 2 GB · $18/mo' },
    { value: 's-2vcpu-4gb',  label: '2 vCPU · 4 GB · $24/mo' },
    { value: 's-4vcpu-8gb',  label: '4 vCPU · 8 GB · $48/mo' },
    { value: 's-8vcpu-16gb', label: '8 vCPU · 16 GB · $96/mo' },
  ],
  'Premium Intel': [
    { value: 's-1vcpu-2gb-intel', label: '1 vCPU · 2 GB · $18/mo' },
    { value: 's-2vcpu-4gb-intel', label: '2 vCPU · 4 GB · $36/mo' },
    { value: 's-4vcpu-8gb-intel', label: '4 vCPU · 8 GB · $72/mo' },
  ],
  'CPU-Optimized': [
    { value: 'c-2', label: '2 vCPU · 4 GB · $42/mo' },
    { value: 'c-4', label: '4 vCPU · 8 GB · $84/mo' },
    { value: 'c-8', label: '8 vCPU · 16 GB · $168/mo' },
  ],
};

const STATUS_META = {
  pending:    { color: '#A0AEC0', label: 'Pending' },
  deploying:  { color: '#ECC94B', label: 'Deploying' },
  running:    { color: '#68D391', label: 'Running' },
  destroying: { color: '#F6AD55', label: 'Destroying' },
  destroyed:  { color: '#718096', label: 'Destroyed' },
  failed:     { color: '#FC8181', label: 'Failed' },
};

const ACTIVE_STATUSES = ['pending', 'deploying', 'destroying'];
const SSH_READY_SECONDS = 90;

// ── Helpers ───────────────────────────────────────────────────────────────────
const genPassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#*';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const getSshCountdown = (dep) => {
  if (dep.status !== 'running' || !dep.updatedAt) return null;
  const elapsed = Math.floor((Date.now() - new Date(dep.updatedAt).getTime()) / 1000);
  const remaining = SSH_READY_SECONDS - elapsed;
  return remaining > 0 ? remaining : null;
};

// ── Label ─────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1}>{children}</Text>
);

// ── Countdown badge ───────────────────────────────────────────────────────────
const CountdownBadge = ({ dep }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = getSshCountdown(dep);
  if (!remaining) return null;
  const pct = ((SSH_READY_SECONDS - remaining) / SSH_READY_SECONDS) * 100;
  return (
    <Flex align="center" gap={2} p={2} borderRadius="8px"
      bg="rgba(236,201,75,0.06)" border="1px solid rgba(236,201,75,0.2)" mb={3}>
      <Box pos="relative" w="24px" h="24px" flexShrink={0}>
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(236,201,75,0.15)" strokeWidth="2.5" />
          <circle cx="12" cy="12" r="10" fill="none" stroke="#ECC94B" strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 10}`}
            strokeDashoffset={`${2 * Math.PI * 10 * (1 - pct / 100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <Text pos="absolute" top="50%" left="50%" transform="translate(-50%,-50%)"
          fontSize="7px" fontWeight="bold" color="#ECC94B" lineHeight={1}>
          {remaining}
        </Text>
      </Box>
      <Box>
        <Text fontSize="11px" fontWeight="semibold" color="#ECC94B">cloud-init running</Text>
        <Text fontSize="10px" color="var(--dash-text-muted)">SSH password auth ready in ~{remaining}s</Text>
      </Box>
    </Flex>
  );
};

// ── Deployment card ───────────────────────────────────────────────────────────
const DeploymentCard = ({ dep, onViewLogs, onDestroy, onDelete }) => {
  const [copiedIp,   setCopiedIp]   = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const sm = STATUS_META[dep.status] || STATUS_META.failed;
  const isActive = ACTIVE_STATUSES.includes(dep.status);

  const copyIp = () => {
    navigator.clipboard.writeText(dep.ipAddress);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 1500);
  };

  const copyPass = () => {
    navigator.clipboard.writeText(dep.config?.rootPassword || '');
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 1500);
  };

  return (
    <Box pos="relative" bg="var(--dash-card-bg)"
      border="1px solid var(--dash-card-border)" borderRadius="14px"
      overflow="hidden" transition="border-color 0.18s"
      _hover={{ borderColor: sm.color + '55' }}>
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${sm.color}99, transparent)` }} />
      <Box p={4}>
        {/* Name + status */}
        <Flex justify="space-between" align="flex-start" mb={2}>
          <Box flex="1" minW={0} pr={2}>
            <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={1}>
              {dep.name}
            </Text>
            <Text fontSize="11px" color="var(--dash-text-muted)" mt="2px">
              DigitalOcean · {dep.config?.region || '—'} · {dep.config?.size || '—'}
            </Text>
          </Box>
          <Flex align="center" gap={1.5} px={2} py={1} borderRadius="6px"
            bg={sm.color + '18'} border={`1px solid ${sm.color}44`} flexShrink={0}>
            {isActive
              ? <Spinner size="xs" color={sm.color} />
              : <Box w="6px" h="6px" borderRadius="full" bg={sm.color}
                  boxShadow={dep.status === 'running' ? `0 0 6px ${sm.color}` : 'none'} />}
            <Text fontSize="10px" fontWeight="700" color={sm.color}
              textTransform="uppercase" letterSpacing="wider">{sm.label}</Text>
          </Flex>
        </Flex>

        {/* Image */}
        <Box display="inline-block" mb={3} px={2} py="2px" borderRadius="5px"
          fontSize="9px" fontWeight="semibold" letterSpacing="wider" textTransform="uppercase"
          bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)"
          color="var(--dash-text-muted)">
          {dep.config?.image || 'unknown image'}
        </Box>

        {/* 90s countdown after running */}
        <CountdownBadge dep={dep} />

        {/* IP */}
        {dep.ipAddress ? (
          <Flex align="center" gap={1.5} mb={3} p={2} borderRadius="8px"
            bg="rgba(104,211,145,0.06)" border="1px solid rgba(104,211,145,0.15)" w="fit-content">
            <Text fontSize="12px" color="#68D391" fontFamily="monospace" fontWeight="600">
              {dep.ipAddress}
            </Text>
            <IconButton icon={copiedIp ? <CheckIcon color="#68D391" /> : <CopyIcon />}
              size="xs" variant="ghost"
              color={copiedIp ? '#68D391' : 'var(--dash-text-muted)'}
              _hover={{ color: '#68D391' }} onClick={copyIp} aria-label="Copy IP" />
          </Flex>
        ) : dep.status !== 'destroyed' && (
          <Flex align="center" gap={1.5} mb={3} p={2} borderRadius="8px"
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)" w="fit-content">
            <Text fontSize="11px" color="var(--dash-text-muted)">
              {isActive ? 'Waiting for IP…' : 'No IP assigned'}
            </Text>
          </Flex>
        )}

        {/* Password copy */}
        {dep.config?.rootPassword && (
          <Flex align="center" gap={1.5} mb={3} p={2} borderRadius="8px"
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)" w="fit-content">
            <Text fontSize="11px" color="var(--dash-text-muted)" mr={1}>Root password</Text>
            <Text fontSize="12px" color="var(--dash-text-secondary)" fontFamily="monospace" letterSpacing="wider">
              {'•'.repeat(8)}
            </Text>
            <IconButton
              icon={copiedPass ? <CheckIcon color="rgba(255,130,130,0.9)" /> : <CopyIcon />}
              size="xs" variant="ghost"
              color={copiedPass ? 'rgba(255,130,130,0.9)' : 'var(--dash-text-muted)'}
              _hover={{ color: 'rgba(255,130,130,0.9)' }}
              onClick={copyPass} aria-label="Copy password" />
          </Flex>
        )}

        {/* Footer */}
        <Flex justify="space-between" align="center">
          <Text fontSize="11px" color="var(--dash-text-muted)">
            By <Text as="span" color="var(--dash-text-secondary)">{dep.createdByCallsign || '—'}</Text>
          </Text>
          <Flex gap={1}>
            <Button size="xs" variant="ghost" fontSize="10px" fontWeight="600"
              color="var(--dash-text-muted)" borderRadius="6px"
              _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
              onClick={() => onViewLogs(dep)}>Logs</Button>
            {dep.status === 'running' && (
              <Button size="xs" fontSize="10px" fontWeight="600" borderRadius="6px"
                bg="rgba(252,129,129,0.08)" border="1px solid rgba(252,129,129,0.25)"
                color="#FC8181" _hover={{ bg: 'rgba(252,129,129,0.16)' }}
                onClick={() => onDestroy(dep)}>Destroy</Button>
            )}
            {['destroyed', 'failed'].includes(dep.status) && (
              <IconButton icon={<DeleteIcon />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" _hover={{ color: '#FC8181', bg: 'rgba(252,129,129,0.08)' }}
                onClick={() => onDelete(dep._id)} aria-label="Remove record" />
            )}
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

// ── Terminal ──────────────────────────────────────────────────────────────────
const Terminal = ({ output, status }) => {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [output]);
  return (
    <Box bg="rgba(0,0,0,0.6)" border="1px solid rgba(255,255,255,0.07)"
      borderRadius="10px" h="360px" overflowY="auto" p={3} fontFamily="monospace" fontSize="12px"
      css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
      {ACTIVE_STATUSES.includes(status) && (
        <Flex align="center" gap={2} mb={2}>
          <Spinner size="xs" color="#ECC94B" />
          <Text color="#ECC94B" fontSize="11px">
            {status === 'deploying' ? 'Deploying infrastructure…' : 'Destroying infrastructure…'}
          </Text>
        </Flex>
      )}
      <Text color="#A0E0A0" whiteSpace="pre-wrap" wordBreak="break-word" lineHeight="1.6">
        {output || 'Waiting for output…'}
      </Text>
      <div ref={bottomRef} />
    </Box>
  );
};

// ── Deploy Modal ──────────────────────────────────────────────────────────────
const DeployModal = ({ isOpen, onClose, onDeploy, loading, error, savedToken }) => {
  const [form, setForm] = useState({
    deployName: '', doToken: savedToken || '',
    hostname: '', region: 'nyc3',
    distro: 'Ubuntu', osVersion: 'ubuntu-22-04-x64',
    planType: 'Basic', size: 's-1vcpu-1gb',
    rootPassword: '',
  });
  const [showToken, setShowToken]   = useState(false);
  const [showPass,  setShowPass]    = useState(false);
  const [saveToken, setSaveToken]   = useState(true);

  // Sync savedToken into form when modal opens
  useEffect(() => {
    if (isOpen) setForm(f => ({ ...f, doToken: savedToken || f.doToken }));
  }, [isOpen, savedToken]);

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm(prev => {
      const next = { ...prev, [k]: v };
      if (k === 'distro')   next.osVersion = DO_IMAGES[v]?.[0]?.value || '';
      if (k === 'planType') next.size = DO_SIZES[v]?.[0]?.value || '';
      return next;
    });
  };

  const submit = () => onDeploy({
    deployName:   form.deployName || form.hostname,
    doToken:      form.doToken,
    hostname:     form.hostname,
    region:       form.region,
    size:         form.size,
    image:        form.osVersion,
    rootPassword: form.rootPassword,
    saveToken,
  });

  const canSubmit = form.doToken.trim() && form.hostname.trim() && form.rootPassword.trim() && !loading;
  const tokenSaved = savedToken && form.doToken === savedToken;

  if (!isOpen) return null;

  return (
    <Modal isOpen onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
      <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden" p={0}
        maxH="90vh" overflowY="auto"
        css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
        <ModalBody p={0}>
          <Box p={6} pos="relative">
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(0,128,255,0.6), transparent)' }} />

            {/* Header */}
            <Flex justify="space-between" align="flex-start" mb={5}>
              <Flex align="center" gap={3}>
                <Flex w="36px" h="36px" borderRadius="10px" align="center" justify="center"
                  bg="rgba(0,128,255,0.1)" border="1px solid rgba(0,128,255,0.25)" fontSize="18px">
                  🌊
                </Flex>
                <Box>
                  <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">
                    Deploy DigitalOcean Droplet
                  </Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mt="2px">
                    Provisioned via Terraform · Docker
                  </Text>
                </Box>
              </Flex>
              <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" borderRadius="8px"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                onClick={onClose} aria-label="Close" />
            </Flex>

            {/* Provider token */}
            <Box mb={3}>
              <Flex justify="space-between" align="center" mb={1}>
                <Label>DigitalOcean API Token</Label>
                {tokenSaved && (
                  <Flex align="center" gap={1}>
                    <CheckIcon boxSize={2.5} color="#68D391" />
                    <Text fontSize="10px" color="#68D391">Saved for this engagement</Text>
                  </Flex>
                )}
              </Flex>
              <Flex gap={2}>
                <Input type={showToken ? 'text' : 'password'}
                  value={form.doToken} onChange={set('doToken')}
                  placeholder="dop_v1_…" {...inputStyles} flex="1" />
                <IconButton icon={showToken ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowToken(t => !t)}
                  size="sm" variant="ghost" color="var(--dash-text-muted)"
                  _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                  borderRadius="10px" border="1px solid rgba(255,255,255,0.1)"
                  bg="rgba(255,255,255,0.05)" h="40px" w="40px" aria-label="Toggle" />
              </Flex>
              {/* Save token checkbox */}
              <Flex align="center" gap={2} mt={1.5} cursor="pointer"
                onClick={() => setSaveToken(s => !s)}>
                <Box w="14px" h="14px" borderRadius="4px" flexShrink={0}
                  bg={saveToken ? 'rgba(255,80,95,0.15)' : 'rgba(255,255,255,0.05)'}
                  border={`1px solid ${saveToken ? 'rgba(255,80,95,0.5)' : 'rgba(255,255,255,0.15)'}`}
                  display="flex" alignItems="center" justifyContent="center">
                  {saveToken && <CheckIcon boxSize={2} color="rgba(255,130,130,0.9)" />}
                </Box>
                <Text fontSize="10px" color="var(--dash-text-muted)" userSelect="none">
                  Save token for this engagement (no need to enter next time)
                </Text>
              </Flex>
            </Box>

            {/* Identity */}
            <SimpleGrid columns={2} spacing={3} mb={3}>
              <Box>
                <Label>Deployment Name</Label>
                <Input value={form.deployName} onChange={set('deployName')}
                  placeholder="My C2 Node" {...inputStyles} />
              </Box>
              <Box>
                <Label>Hostname</Label>
                <Input value={form.hostname} onChange={set('hostname')}
                  placeholder="c2-node-01" {...inputStyles} />
              </Box>
            </SimpleGrid>

            {/* Region */}
            <Box mb={3}>
              <Label>Region</Label>
              <Select value={form.region} onChange={set('region')} {...selectStyles}>
                {DO_REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </Box>

            {/* OS Image */}
            <SimpleGrid columns={2} spacing={3} mb={3}>
              <Box>
                <Label>Distribution</Label>
                <Select value={form.distro} onChange={set('distro')} {...selectStyles}>
                  {Object.keys(DO_IMAGES).map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </Box>
              <Box>
                <Label>Version</Label>
                <Select value={form.osVersion} onChange={set('osVersion')} {...selectStyles}>
                  {(DO_IMAGES[form.distro] || []).map(v => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </Select>
              </Box>
            </SimpleGrid>

            {/* Plan */}
            <SimpleGrid columns={2} spacing={3} mb={3}>
              <Box>
                <Label>CPU Type</Label>
                <Select value={form.planType} onChange={set('planType')} {...selectStyles}>
                  {Object.keys(DO_SIZES).map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Box>
              <Box>
                <Label>Size</Label>
                <Select value={form.size} onChange={set('size')} {...selectStyles}>
                  {(DO_SIZES[form.planType] || []).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
              </Box>
            </SimpleGrid>

            {/* Security */}
            <Box mb={5}>
              <Label>Root Password</Label>
              <Flex gap={2}>
                <Input type={showPass ? 'text' : 'password'}
                  value={form.rootPassword} onChange={set('rootPassword')}
                  placeholder="Min. 8 characters" {...inputStyles} flex="1" />
                <IconButton icon={showPass ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowPass(t => !t)}
                  size="sm" variant="ghost" color="var(--dash-text-muted)"
                  _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                  borderRadius="10px" border="1px solid rgba(255,255,255,0.1)"
                  bg="rgba(255,255,255,0.05)" h="40px" w="40px" aria-label="Toggle" />
                <Button onClick={() => setForm(f => ({ ...f, rootPassword: genPassword() }))}
                  size="sm" variant="ghost" h="40px" px={4} borderRadius="10px" fontSize="12px"
                  bg="rgba(255,80,95,0.08)" border="1px solid rgba(255,80,95,0.25)"
                  color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.15)' }}>
                  Generate
                </Button>
              </Flex>
              <Text fontSize="10px" color="var(--dash-text-muted)" mt={1}>
                Set via cloud-init on first boot. Allow ~90s after deploy.
              </Text>
            </Box>

            {error && (
              <Box mb={4} p={3} borderRadius="10px"
                bg="rgba(252,129,129,0.08)" border="1px solid rgba(252,129,129,0.25)">
                <Text fontSize="12px" color="#FC8181">{error}</Text>
              </Box>
            )}

            <Flex gap={3}>
              <Button flex="1" size="sm" variant="ghost" borderRadius="10px" h="40px"
                color="var(--dash-text-muted)" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                onClick={onClose}>Cancel</Button>
              <Button flex="1" size="sm" h="40px" borderRadius="10px" fontWeight="semibold"
                bg="rgba(255,80,95,0.12)" border="1px solid rgba(255,80,95,0.4)"
                color="rgba(255,130,130,0.95)" _hover={{ bg: 'rgba(255,80,95,0.2)' }}
                isDisabled={!canSubmit} isLoading={loading} loadingText="Starting…"
                onClick={submit}>
                🚀 Deploy Droplet
              </Button>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// ── Logs Modal ────────────────────────────────────────────────────────────────
const LogsModal = ({ dep, engId, onClose, onDestroy }) => {
  const [live, setLive] = useState({ output: dep?.output || '', status: dep?.status, ipAddress: dep?.ipAddress });
  const pollRef = useRef(null);

  const fetch_ = useCallback(async () => {
    if (!dep || !engId) return;
    try {
      const res  = await fetch(`${API}/c2/${engId}/status/${dep._id}`, { headers: authHeaders() });
      const data = await res.json();
      setLive(data);
      if (!ACTIVE_STATUSES.includes(data.status)) clearInterval(pollRef.current);
    } catch {}
  }, [dep, engId]);

  useEffect(() => {
    if (!dep) return;
    fetch_();
    if (ACTIVE_STATUSES.includes(dep.status)) {
      pollRef.current = setInterval(fetch_, 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [dep, fetch_]);

  if (!dep) return null;
  const sm = STATUS_META[live.status] || STATUS_META.failed;

  return (
    <Modal isOpen onClose={onClose} size="2xl" isCentered>
      <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(4px)" />
      <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden">
        <ModalBody p={0}>
          <Box p={5} pos="relative">
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${sm.color}88, transparent)` }} />
            <Flex justify="space-between" align="center" mb={4}>
              <Box>
                <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">{dep.name}</Text>
                <Flex align="center" gap={2} mt="2px">
                  {ACTIVE_STATUSES.includes(live.status)
                    ? <Spinner size="xs" color={sm.color} />
                    : <Box w="6px" h="6px" borderRadius="full" bg={sm.color} />}
                  <Text fontSize="11px" color={sm.color} textTransform="uppercase" fontWeight="semibold">
                    {sm.label}
                  </Text>
                  {live.ipAddress && (
                    <Text fontSize="11px" color="#68D391" fontFamily="monospace">· {live.ipAddress}</Text>
                  )}
                </Flex>
              </Box>
              <Flex align="center" gap={2}>
                {live.status === 'running' && (
                  <Button size="xs" fontSize="10px" fontWeight="600" borderRadius="6px"
                    bg="rgba(252,129,129,0.08)" border="1px solid rgba(252,129,129,0.25)"
                    color="#FC8181" _hover={{ bg: 'rgba(252,129,129,0.16)' }}
                    onClick={() => { onClose(); onDestroy(dep); }}>Destroy</Button>
                )}
                <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" borderRadius="8px"
                  _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                  onClick={onClose} aria-label="Close" />
              </Flex>
            </Flex>
            <Terminal output={live.output} status={live.status} />
            {live.ipAddress && live.status === 'running' && (
              <Box mt={3} p={3} borderRadius="10px"
                bg="rgba(104,211,145,0.06)" border="1px solid rgba(104,211,145,0.15)">
                <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                  letterSpacing="wider" mb={1}>Quick connect</Text>
                <Text fontSize="13px" color="#68D391" fontFamily="monospace">
                  ssh root@{live.ipAddress}
                </Text>
              </Box>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// ── Destroy Confirm ───────────────────────────────────────────────────────────
const DestroyConfirm = ({ dep, engId, onClose, onConfirmed, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  const confirm = async () => {
    setLoading(true); setErr('');
    try {
      const res  = await fetch(`${API}/c2/${engId}/destroy/${dep._id}`, {
        method: 'POST', headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || 'Error'); setLoading(false); return; }
      onConfirmed(dep._id, data.status || 'destroying');
      onClose();
      // Sync context so destroy state persists across navigation
      if (onRefresh) onRefresh();
    } catch { setErr('Network error'); setLoading(false); }
  };

  if (!dep) return null;

  return (
    <Modal isOpen onClose={onClose} size="sm" isCentered>
      <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
      <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden">
        <ModalBody p={0}>
          <Box p={6} pos="relative">
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(252,129,129,0.6), transparent)' }} />
            <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)" mb={2}>
              Destroy Droplet?
            </Text>
            <Text fontSize="13px" color="var(--dash-text-secondary)" mb={4} lineHeight="1.6">
              This will run{' '}
              <Text as="span" fontFamily="monospace" fontSize="12px"
                color="rgba(255,130,130,0.9)">terraform destroy</Text>{' '}
              and permanently delete{' '}
              <Text as="span" fontWeight="semibold" color="var(--dash-text-primary)">{dep.name}</Text>
              {dep.ipAddress ? ` (${dep.ipAddress})` : ''}. This cannot be undone.
            </Text>
            {err && (
              <Box mb={3} p={2} borderRadius="8px"
                bg="rgba(252,129,129,0.08)" border="1px solid rgba(252,129,129,0.2)">
                <Text fontSize="12px" color="#FC8181">{err}</Text>
              </Box>
            )}
            <Flex gap={3}>
              <Button flex="1" size="sm" variant="ghost" borderRadius="10px" h="38px"
                color="var(--dash-text-muted)" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                onClick={onClose}>Cancel</Button>
              <Button flex="1" size="sm" h="38px" borderRadius="10px" fontWeight="semibold"
                bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.35)"
                color="#FC8181" _hover={{ bg: 'rgba(252,129,129,0.18)' }}
                isLoading={loading} loadingText="Destroying…" onClick={confirm}>
                Yes, Destroy
              </Button>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// ── Main View ─────────────────────────────────────────────────────────────────
const C2View = () => {
  const { slug } = useParams();
  const { getBySlug, updateEngagement, fetchEngagements } = useEngagements();
  const { user } = useAuth();
  const eng = getBySlug(slug);

  const [deployments,   setDeployments]   = useState([]);
  const [showDeploy,    setShowDeploy]    = useState(false);
  const [deploying,     setDeploying]     = useState(false);
  const [deployError,   setDeployError]   = useState('');
  const [logsTarget,    setLogsTarget]    = useState(null);
  const [destroyTarget, setDestroyTarget] = useState(null);
  const activePollRef   = useRef(null);

  // Fetch fresh data on mount so status is never stale when navigating back
  useEffect(() => { fetchEngagements(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync from engagement context whenever eng changes (handles navigation back)
  useEffect(() => {
    if (eng?.c2Deployments) setDeployments(eng.c2Deployments);
  }, [eng]);

  // Poll active deployments every 5s to pick up IP / status from server
  const refreshActive = useCallback(async () => {
    if (!eng) return;
    const actives = deployments.filter(d => ACTIVE_STATUSES.includes(d.status));
    if (!actives.length) return;
    for (const dep of actives) {
      try {
        const res  = await fetch(`${API}/c2/${eng._id}/status/${dep._id}`, { headers: authHeaders() });
        const data = await res.json();
        setDeployments(prev => prev.map(d =>
          String(d._id) === String(dep._id)
            ? { ...d, status: data.status, ipAddress: data.ipAddress, updatedAt: data.updatedAt || d.updatedAt }
            : d
        ));
      } catch {}
    }
  }, [eng, deployments]);

  useEffect(() => {
    const hasActive = deployments.some(d => ACTIVE_STATUSES.includes(d.status));
    if (hasActive) { activePollRef.current = setInterval(refreshActive, 5000); }
    else            { clearInterval(activePollRef.current); }
    return () => clearInterval(activePollRef.current);
  }, [deployments, refreshActive]);

  const handleDeploy = async (formData) => {
    if (!eng) return;
    setDeploying(true); setDeployError('');
    try {
      const res  = await fetch(`${API}/c2/${eng._id}/deploy`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setDeployError(data.message || 'Deploy failed'); setDeploying(false); return; }

      // Save DO token to engagement if requested
      if (formData.saveToken && formData.doToken) {
        await updateEngagement(eng.id, {
          c2Config: { ...(eng.c2Config || {}), doToken: formData.doToken },
        });
      }

      // Refresh engagement context so deployment persists across navigation
      await fetchEngagements();

      setShowDeploy(false);
      setDeploying(false);
    } catch { setDeployError('Network error'); setDeploying(false); }
  };

  const handleDestroyConfirmed = (deployId, newStatus) => {
    setDeployments(prev => prev.map(d =>
      String(d._id) === String(deployId) ? { ...d, status: newStatus } : d
    ));
  };

  const handleDeleteRecord = async (deployId) => {
    if (!eng) return;
    // Optimistic removal
    setDeployments(prev => prev.filter(d => String(d._id) !== String(deployId)));
    try {
      await fetch(`${API}/c2/${eng._id}/deployments/${deployId}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      // Sync context so removal persists across navigation
      await fetchEngagements();
    } catch {}
  };

  if (!eng) return null;

  const savedToken   = eng.c2Config?.doToken || '';
  const runningCount = deployments.filter(d => d.status === 'running').length;
  const activeCount  = deployments.filter(d => ACTIVE_STATUSES.includes(d.status)).length;

  return (
    <Box px={6} pb={10}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            C2 <Text as="span" color="red.400">Infrastructure</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · provision and manage C2 nodes via Terraform + Docker
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" borderRadius="8px"
          bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
          color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.18)' }}
          onClick={() => { setDeployError(''); setShowDeploy(true); }}>
          New Deployment
        </Button>
      </Flex>

      {/* Template cards */}
      <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
        letterSpacing="wider" fontWeight="semibold" mb={3}>Infrastructure Templates</Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
        {/* DigitalOcean */}
        <Box pos="relative" bg="var(--dash-card-bg)"
          border="1px solid var(--dash-card-border)" borderRadius="14px"
          overflow="hidden" cursor="pointer" transition="border-color 0.18s"
          _hover={{ borderColor: 'rgba(0,128,255,0.5)' }}
          onClick={() => { setDeployError(''); setShowDeploy(true); }}>
          <Box pos="absolute" top="0" left="0" right="0" h="2px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(0,128,255,0.7), transparent)' }} />
          <Box p={4}>
            <Flex align="center" gap={3} mb={3}>
              <Flex w="40px" h="40px" borderRadius="10px" align="center" justify="center"
                bg="rgba(0,128,255,0.1)" border="1px solid rgba(0,128,255,0.2)" fontSize="20px">
                🌊
              </Flex>
              <Box>
                <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">DigitalOcean</Text>
                <Text fontSize="11px" color="var(--dash-text-muted)">Droplet</Text>
              </Box>
              {savedToken && (
                <Flex ml="auto" align="center" gap={1} px={2} py={1} borderRadius="6px"
                  bg="rgba(104,211,145,0.08)" border="1px solid rgba(104,211,145,0.2)">
                  <CheckIcon boxSize={2.5} color="#68D391" />
                  <Text fontSize="10px" color="#68D391" fontWeight="semibold">Token saved</Text>
                </Flex>
              )}
            </Flex>
            <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="1.6" mb={3}>
              Spin up a VPS in any DO region. Ubuntu, Debian, CentOS or Fedora. Root password via cloud-init.
            </Text>
            <Flex gap={1.5} flexWrap="wrap">
              {['Terraform', 'Docker', 'Password Auth'].map(tag => (
                <Box key={tag} px={2} py="2px" borderRadius="5px" fontSize="9px" fontWeight="semibold"
                  letterSpacing="wider" textTransform="uppercase"
                  bg="rgba(0,128,255,0.1)" border="1px solid rgba(0,128,255,0.2)"
                  color="rgba(96,165,250,0.9)">{tag}</Box>
              ))}
            </Flex>
          </Box>
        </Box>

        {/* Coming soon */}
        {[
          { name: 'AWS EC2', sub: 'Amazon Web Services', icon: '☁️', color: 'rgba(255,153,0,0.5)' },
          { name: 'Vultr VPS', sub: 'Vultr Cloud Compute', icon: '⚡', color: 'rgba(0,210,190,0.5)' },
        ].map(({ name, sub, icon, color }) => (
          <Box key={name} pos="relative" bg="var(--dash-card-bg)"
            border="1px solid var(--dash-card-border)" borderRadius="14px"
            overflow="hidden" opacity={0.45}>
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${color}, transparent)` }} />
            <Box p={4}>
              <Flex align="center" gap={3} mb={3}>
                <Flex w="40px" h="40px" borderRadius="10px" align="center" justify="center"
                  bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)" fontSize="20px">
                  {icon}
                </Flex>
                <Box>
                  <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">{name}</Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)">{sub}</Text>
                </Box>
              </Flex>
              <Text fontSize="12px" color="var(--dash-text-muted)" lineHeight="1.6" mb={3}>
                Template not yet available.
              </Text>
              <Box display="inline-block" px={2} py="2px" borderRadius="5px"
                fontSize="9px" fontWeight="semibold" letterSpacing="wider" textTransform="uppercase"
                bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                color="var(--dash-text-muted)">Coming Soon</Box>
            </Box>
          </Box>
        ))}
      </SimpleGrid>

      {/* Deployments */}
      {deployments.length > 0 && (
        <>
          <Flex align="center" gap={3} mb={3}>
            <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
              letterSpacing="wider" fontWeight="semibold">Active Deployments</Text>
            {runningCount > 0 && (
              <Box px={2} py="1px" borderRadius="full" bg="rgba(104,211,145,0.1)"
                border="1px solid rgba(104,211,145,0.25)">
                <Text fontSize="10px" fontWeight="bold" color="#68D391">{runningCount} running</Text>
              </Box>
            )}
            {activeCount > 0 && (
              <Box px={2} py="1px" borderRadius="full" bg="rgba(236,201,75,0.1)"
                border="1px solid rgba(236,201,75,0.25)">
                <Text fontSize="10px" fontWeight="bold" color="#ECC94B">{activeCount} in progress</Text>
              </Box>
            )}
          </Flex>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {deployments.map(dep => (
              <DeploymentCard key={dep._id} dep={dep}
                onViewLogs={setLogsTarget} onDestroy={setDestroyTarget}
                onDelete={handleDeleteRecord} />
            ))}
          </SimpleGrid>
        </>
      )}

      {deployments.length === 0 && (
        <Flex direction="column" align="center" justify="center" py={16} gap={3}
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="16px">
          <Text fontSize="36px">🖥️</Text>
          <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)">
            No deployments yet
          </Text>
          <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center" maxW="340px">
            Select the DigitalOcean template above to provision your first C2 node.
          </Text>
          <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" mt={2}
            borderRadius="8px" bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
            color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.18)' }}
            onClick={() => { setDeployError(''); setShowDeploy(true); }}>
            Deploy First Node
          </Button>
        </Flex>
      )}

      {/* Modals */}
      <DeployModal isOpen={showDeploy} onClose={() => setShowDeploy(false)}
        onDeploy={handleDeploy} loading={deploying} error={deployError} savedToken={savedToken} />
      {logsTarget && (
        <LogsModal dep={logsTarget} engId={eng._id}
          onClose={() => setLogsTarget(null)} onDestroy={setDestroyTarget} />
      )}
      {destroyTarget && (
        <DestroyConfirm dep={destroyTarget} engId={eng._id}
          onClose={() => setDestroyTarget(null)} onConfirmed={handleDestroyConfirmed}
          onRefresh={fetchEngagements} />
      )}
    </Box>
  );
};

export default C2View;
