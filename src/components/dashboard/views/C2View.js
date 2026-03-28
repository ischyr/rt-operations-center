import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select,
  SimpleGrid, Modal, ModalOverlay, ModalContent, ModalBody, Spinner, Tooltip,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, CloseIcon, ViewIcon, ViewOffIcon, CopyIcon,
  CheckIcon, SettingsIcon, ExternalLinkIcon, InfoIcon, SearchIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

const MotionBox = motion(Box);

// ── Colors ───────────────────────────────────────────────────────────────────
const ACCENT = '#9F7AEA';
const RED    = '#FC8181';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const ORANGE = '#F6AD55';
const CYAN   = '#76E4F7';
const YELLOW = '#ECC94B';

// ── API ──────────────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// ── Input styles ─────────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT}50` },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

const selSx = {
  bg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px', h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  cursor: 'pointer', focusBorderColor: `${ACCENT}80`,
  _hover: { borderColor: `${ACCENT}50` },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

// ── SVG Icons ────────────────────────────────────────────────────────────────
const ServerIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </Box>
);

const CloudIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </Box>
);

const TerminalIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </Box>
);

const BoltIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Box>
);

const ShieldIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Box>
);

const GlobeIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Box>
);

// ── Static data ──────────────────────────────────────────────────────────────
const DO_REGIONS = [
  { value: 'nyc1', label: 'New York 1', flag: 'US' },
  { value: 'nyc3', label: 'New York 3', flag: 'US' },
  { value: 'sfo3', label: 'San Francisco 3', flag: 'US' },
  { value: 'ams3', label: 'Amsterdam 3', flag: 'NL' },
  { value: 'sgp1', label: 'Singapore 1', flag: 'SG' },
  { value: 'lon1', label: 'London 1', flag: 'GB' },
  { value: 'fra1', label: 'Frankfurt 1', flag: 'DE' },
  { value: 'tor1', label: 'Toronto 1', flag: 'CA' },
  { value: 'blr1', label: 'Bangalore 1', flag: 'IN' },
  { value: 'syd1', label: 'Sydney 1', flag: 'AU' },
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
  deploying:  { color: YELLOW,   label: 'Deploying' },
  running:    { color: GREEN,    label: 'Running' },
  destroying: { color: ORANGE,   label: 'Destroying' },
  destroyed:  { color: '#718096', label: 'Destroyed' },
  failed:     { color: RED,      label: 'Failed' },
};

const ACTIVE_STATUSES = ['pending', 'deploying', 'destroying'];
const SSH_READY_SECONDS = 90;

// ── Helpers ──────────────────────────────────────────────────────────────────
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

const fmtRelative = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ── Label ────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

// ── Countdown badge ──────────────────────────────────────────────────────────
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
    <Flex align="center" gap={2} p={2.5} borderRadius="10px"
      bg={`${YELLOW}08`} border={`1px solid ${YELLOW}25`} mb={3}>
      <Box pos="relative" w="26px" h="26px" flexShrink={0}>
        <svg width="26" height="26" viewBox="0 0 26 26" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="13" cy="13" r="10" fill="none" stroke={`${YELLOW}20`} strokeWidth="2.5" />
          <circle cx="13" cy="13" r="10" fill="none" stroke={YELLOW} strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 10}`}
            strokeDashoffset={`${2 * Math.PI * 10 * (1 - pct / 100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <Text pos="absolute" top="50%" left="50%" transform="translate(-50%,-50%)"
          fontSize="7px" fontWeight="bold" color={YELLOW} lineHeight={1}>
          {remaining}
        </Text>
      </Box>
      <Box>
        <Text fontSize="11px" fontWeight="semibold" color={YELLOW}>cloud-init running</Text>
        <Text fontSize="10px" color="var(--dash-text-muted)">SSH password auth ready in ~{remaining}s</Text>
      </Box>
    </Flex>
  );
};

// ── Copiable field ───────────────────────────────────────────────────────────
const CopyField = ({ value, label, color = GREEN, masked = false }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Flex align="center" gap={1.5} p={2} borderRadius="8px"
      bg={`${color}08`} border={`1px solid ${color}18`} w="fit-content">
      {label && <Text fontSize="10px" color="var(--dash-text-muted)" mr={0.5}>{label}</Text>}
      <Text fontSize="12px" color={color} fontFamily="monospace" fontWeight="600">
        {masked ? '••••••••' : value}
      </Text>
      <IconButton icon={copied ? <CheckIcon boxSize={2.5} color={color} /> : <CopyIcon boxSize={2.5} />}
        size="xs" variant="ghost" minW="20px" h="20px"
        color={copied ? color : 'var(--dash-text-muted)'}
        _hover={{ color }} onClick={copy} aria-label="Copy" />
    </Flex>
  );
};

// ── Deployment card ──────────────────────────────────────────────────────────
const DeploymentCard = ({ dep, onViewLogs, onDestroy, onDelete }) => {
  const sm = STATUS_META[dep.status] || STATUS_META.failed;
  const isActive = ACTIVE_STATUSES.includes(dep.status);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      pos="relative" bg="var(--dash-card-bg)"
      border="1px solid var(--dash-card-border)" borderRadius="14px"
      overflow="hidden" _hover={{ borderColor: `${sm.color}55` }}
      style={{ transition: 'border-color 0.18s' }}>
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${sm.color}99, transparent)` }} />
      <Box p={4}>
        {/* Name + status */}
        <Flex justify="space-between" align="flex-start" mb={2.5}>
          <Box flex="1" minW={0} pr={2}>
            <Flex align="center" gap={2}>
              <Flex w="30px" h="30px" borderRadius="8px" bg={`${sm.color}12`}
                border={`1px solid ${sm.color}30`} align="center" justify="center" flexShrink={0}>
                <ServerIcon boxSize="14px" color={sm.color} />
              </Flex>
              <Box>
                <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={1}>
                  {dep.name}
                </Text>
                <Text fontSize="10px" color="var(--dash-text-muted)" mt="1px">
                  DigitalOcean · {dep.config?.region || '—'} · {dep.config?.size || '—'}
                </Text>
              </Box>
            </Flex>
          </Box>
          <Flex align="center" gap={1.5} px={2} py={1} borderRadius="6px"
            bg={`${sm.color}15`} border={`1px solid ${sm.color}40`} flexShrink={0}>
            {isActive
              ? <Spinner size="xs" color={sm.color} />
              : <Box w="6px" h="6px" borderRadius="full" bg={sm.color}
                  boxShadow={dep.status === 'running' ? `0 0 6px ${sm.color}` : 'none'} />}
            <Text fontSize="9px" fontWeight="700" color={sm.color}
              textTransform="uppercase" letterSpacing="wider">{sm.label}</Text>
          </Flex>
        </Flex>

        {/* Image tag */}
        <Box display="inline-block" mb={3} px={2} py="2px" borderRadius="5px"
          fontSize="9px" fontWeight="bold" letterSpacing="wider" textTransform="uppercase"
          bg={`${ACCENT}10`} border={`1px solid ${ACCENT}25`} color={ACCENT}>
          {dep.config?.image || 'unknown image'}
        </Box>

        {/* 90s countdown */}
        <CountdownBadge dep={dep} />

        {/* IP */}
        {dep.ipAddress ? (
          <Box mb={3}><CopyField value={dep.ipAddress} color={GREEN} /></Box>
        ) : dep.status !== 'destroyed' && (
          <Flex align="center" gap={1.5} mb={3} p={2} borderRadius="8px"
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)" w="fit-content">
            <Text fontSize="11px" color="var(--dash-text-muted)">
              {isActive ? 'Waiting for IP…' : 'No IP assigned'}
            </Text>
          </Flex>
        )}

        {/* Password */}
        {dep.config?.rootPassword && (
          <Box mb={3}><CopyField value={dep.config.rootPassword} label="root pass" color={ACCENT} masked /></Box>
        )}

        {/* Footer */}
        <Flex justify="space-between" align="center" pt={2}
          borderTop="1px solid rgba(255,255,255,0.05)">
          <Flex align="center" gap={1.5}>
            <Text fontSize="10px" color="var(--dash-text-muted)">
              {dep.createdByCallsign || '—'}
            </Text>
            {dep.updatedAt && (
              <Text fontSize="9px" color="var(--dash-text-muted)">· {fmtRelative(dep.updatedAt)}</Text>
            )}
          </Flex>
          <Flex gap={1}>
            <Tooltip label="View Logs" fontSize="10px">
              <IconButton icon={<TerminalIcon boxSize="13px" />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" borderRadius="6px"
                _hover={{ color: CYAN, bg: `${CYAN}12` }}
                onClick={() => onViewLogs(dep)} aria-label="Logs" />
            </Tooltip>
            {dep.status === 'running' && (
              <Button size="xs" fontSize="10px" fontWeight="bold" borderRadius="6px"
                bg={`${RED}12`} border={`1px solid ${RED}30`}
                color={RED} _hover={{ bg: `${RED}20` }}
                onClick={() => onDestroy(dep)}>Destroy</Button>
            )}
            {['destroyed', 'failed'].includes(dep.status) && (
              <Tooltip label="Remove record" fontSize="10px">
                <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" borderRadius="6px"
                  _hover={{ color: RED, bg: `${RED}08` }}
                  onClick={() => onDelete(dep._id)} aria-label="Remove" />
              </Tooltip>
            )}
          </Flex>
        </Flex>
      </Box>
    </MotionBox>
  );
};

// ── Terminal ─────────────────────────────────────────────────────────────────
const Terminal = ({ output, status }) => {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [output]);
  return (
    <Box bg="rgba(0,0,0,0.5)" border="1px solid rgba(255,255,255,0.06)"
      borderRadius="12px" h="360px" overflowY="auto" p={4} fontFamily="monospace" fontSize="12px"
      css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
      {ACTIVE_STATUSES.includes(status) && (
        <Flex align="center" gap={2} mb={2}>
          <Spinner size="xs" color={YELLOW} />
          <Text color={YELLOW} fontSize="11px" fontWeight="semibold">
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

// ── Deploy Modal ─────────────────────────────────────────────────────────────
const DeployModal = ({ isOpen, onClose, onDeploy, loading, error, savedToken }) => {
  const [form, setForm] = useState({
    deployName: '', doToken: savedToken || '',
    hostname: '', region: 'nyc3',
    distro: 'Ubuntu', osVersion: 'ubuntu-22-04-x64',
    planType: 'Basic', size: 's-1vcpu-1gb',
    rootPassword: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [saveToken, setSaveToken] = useState(true);

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
      <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(6px)" />
      <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden" p={0}
        maxH="90vh" overflowY="auto"
        css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
        <ModalBody p={0}>
          <Box p={6} pos="relative">
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${BLUE}80, transparent)` }} />

            {/* Header */}
            <Flex justify="space-between" align="flex-start" mb={5}>
              <Flex align="center" gap={3}>
                <Flex w="38px" h="38px" borderRadius="10px" align="center" justify="center"
                  bg={`${BLUE}15`} border={`1px solid ${BLUE}35`}>
                  <CloudIcon boxSize="18px" color={BLUE} />
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
                    <CheckIcon boxSize={2.5} color={GREEN} />
                    <Text fontSize="10px" color={GREEN} fontWeight="semibold">Saved for this engagement</Text>
                  </Flex>
                )}
              </Flex>
              <Flex gap={2}>
                <Input type={showToken ? 'text' : 'password'}
                  value={form.doToken} onChange={set('doToken')}
                  placeholder="dop_v1_…" {...inputSx} flex="1" />
                <IconButton icon={showToken ? <ViewOffIcon boxSize={3.5} /> : <ViewIcon boxSize={3.5} />}
                  onClick={() => setShowToken(t => !t)}
                  size="sm" variant="ghost" color="var(--dash-text-muted)"
                  _hover={{ color: ACCENT }}
                  borderRadius="10px" border="1px solid rgba(255,255,255,0.1)"
                  bg="rgba(255,255,255,0.05)" h="40px" w="40px" aria-label="Toggle" />
              </Flex>
              <Flex align="center" gap={2} mt={1.5} cursor="pointer"
                onClick={() => setSaveToken(s => !s)}>
                <Box w="14px" h="14px" borderRadius="4px" flexShrink={0}
                  bg={saveToken ? `${ACCENT}15` : 'rgba(255,255,255,0.05)'}
                  border={`1px solid ${saveToken ? `${ACCENT}50` : 'rgba(255,255,255,0.15)'}`}
                  display="flex" alignItems="center" justifyContent="center">
                  {saveToken && <CheckIcon boxSize={2} color={ACCENT} />}
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
                  placeholder="My C2 Node" {...inputSx} />
              </Box>
              <Box>
                <Label>Hostname</Label>
                <Input value={form.hostname} onChange={set('hostname')}
                  placeholder="c2-node-01" {...inputSx} />
              </Box>
            </SimpleGrid>

            {/* Region */}
            <Box mb={3}>
              <Label>Region</Label>
              <Select value={form.region} onChange={set('region')} {...selSx}>
                {DO_REGIONS.map(r => <option key={r.value} value={r.value}>{r.flag} — {r.label}</option>)}
              </Select>
            </Box>

            {/* OS Image */}
            <SimpleGrid columns={2} spacing={3} mb={3}>
              <Box>
                <Label>Distribution</Label>
                <Select value={form.distro} onChange={set('distro')} {...selSx}>
                  {Object.keys(DO_IMAGES).map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </Box>
              <Box>
                <Label>Version</Label>
                <Select value={form.osVersion} onChange={set('osVersion')} {...selSx}>
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
                <Select value={form.planType} onChange={set('planType')} {...selSx}>
                  {Object.keys(DO_SIZES).map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Box>
              <Box>
                <Label>Size</Label>
                <Select value={form.size} onChange={set('size')} {...selSx}>
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
                  placeholder="Min. 8 characters" {...inputSx} flex="1" />
                <IconButton icon={showPass ? <ViewOffIcon boxSize={3.5} /> : <ViewIcon boxSize={3.5} />}
                  onClick={() => setShowPass(t => !t)}
                  size="sm" variant="ghost" color="var(--dash-text-muted)"
                  _hover={{ color: ACCENT }}
                  borderRadius="10px" border="1px solid rgba(255,255,255,0.1)"
                  bg="rgba(255,255,255,0.05)" h="40px" w="40px" aria-label="Toggle" />
                <Button onClick={() => setForm(f => ({ ...f, rootPassword: genPassword() }))}
                  size="sm" variant="ghost" h="40px" px={4} borderRadius="10px" fontSize="12px"
                  bg={`${ACCENT}12`} border={`1px solid ${ACCENT}35`}
                  color={ACCENT} fontWeight="bold"
                  _hover={{ bg: `${ACCENT}20` }}>
                  Generate
                </Button>
              </Flex>
              <Text fontSize="10px" color="var(--dash-text-muted)" mt={1}>
                Set via cloud-init on first boot. Allow ~90s after deploy.
              </Text>
            </Box>

            {error && (
              <Box mb={4} p={3} borderRadius="10px"
                bg={`${RED}10`} border={`1px solid ${RED}30`}>
                <Text fontSize="12px" color={RED}>{error}</Text>
              </Box>
            )}

            <Flex gap={3}>
              <Button flex="1" size="sm" variant="ghost" borderRadius="10px" h="40px"
                color="var(--dash-text-muted)" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                onClick={onClose}>Cancel</Button>
              <Button flex="1" size="sm" h="40px" borderRadius="10px" fontWeight="bold"
                bg={`${ACCENT}15`} border={`1px solid ${ACCENT}50`}
                color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                isDisabled={!canSubmit} isLoading={loading} loadingText="Starting…"
                onClick={submit}>
                Deploy Droplet
              </Button>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// ── Logs Modal ───────────────────────────────────────────────────────────────
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
      <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(6px)" />
      <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden">
        <ModalBody p={0}>
          <Box p={5} pos="relative">
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${sm.color}88, transparent)` }} />
            <Flex justify="space-between" align="center" mb={4}>
              <Flex align="center" gap={3}>
                <Flex w="32px" h="32px" borderRadius="8px" bg={`${sm.color}12`}
                  border={`1px solid ${sm.color}30`} align="center" justify="center">
                  <TerminalIcon boxSize="14px" color={sm.color} />
                </Flex>
                <Box>
                  <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">{dep.name}</Text>
                  <Flex align="center" gap={2} mt="2px">
                    {ACTIVE_STATUSES.includes(live.status)
                      ? <Spinner size="xs" color={sm.color} />
                      : <Box w="6px" h="6px" borderRadius="full" bg={sm.color} />}
                    <Text fontSize="10px" color={sm.color} textTransform="uppercase" fontWeight="bold"
                      letterSpacing="wider">{sm.label}</Text>
                    {live.ipAddress && (
                      <Text fontSize="11px" color={GREEN} fontFamily="monospace">· {live.ipAddress}</Text>
                    )}
                  </Flex>
                </Box>
              </Flex>
              <Flex align="center" gap={2}>
                {live.status === 'running' && (
                  <Button size="xs" fontSize="10px" fontWeight="bold" borderRadius="6px"
                    bg={`${RED}10`} border={`1px solid ${RED}30`}
                    color={RED} _hover={{ bg: `${RED}20` }}
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
              <Box mt={3} p={3} borderRadius="12px"
                bg={`${GREEN}08`} border={`1px solid ${GREEN}18`}>
                <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                  letterSpacing="wider" fontWeight="bold" mb={1}>Quick connect</Text>
                <Text fontSize="13px" color={GREEN} fontFamily="monospace" fontWeight="600">
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

// ── Destroy Confirm ──────────────────────────────────────────────────────────
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
      if (onRefresh) onRefresh();
    } catch { setErr('Network error'); setLoading(false); }
  };

  if (!dep) return null;

  return (
    <Modal isOpen onClose={onClose} size="sm" isCentered>
      <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(6px)" />
      <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden">
        <ModalBody p={0}>
          <Box p={6} pos="relative">
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${RED}80, transparent)` }} />
            <Flex align="center" gap={3} mb={4}>
              <Flex w="36px" h="36px" borderRadius="10px" bg={`${RED}12`}
                border={`1px solid ${RED}30`} align="center" justify="center">
                <ShieldIcon boxSize="16px" color={RED} />
              </Flex>
              <Box>
                <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">
                  Destroy Droplet?
                </Text>
                <Text fontSize="11px" color="var(--dash-text-muted)">This action cannot be undone</Text>
              </Box>
            </Flex>
            <Text fontSize="12px" color="var(--dash-text-secondary)" mb={4} lineHeight="1.7">
              This will run{' '}
              <Text as="span" fontFamily="monospace" fontSize="11px" color={RED}
                bg={`${RED}10`} px={1.5} py="1px" borderRadius="4px">terraform destroy</Text>{' '}
              and permanently delete{' '}
              <Text as="span" fontWeight="bold" color="var(--dash-text-primary)">{dep.name}</Text>
              {dep.ipAddress ? ` (${dep.ipAddress})` : ''}.
            </Text>
            {err && (
              <Box mb={3} p={2.5} borderRadius="10px"
                bg={`${RED}08`} border={`1px solid ${RED}25`}>
                <Text fontSize="12px" color={RED}>{err}</Text>
              </Box>
            )}
            <Flex gap={3}>
              <Button flex="1" size="sm" variant="ghost" borderRadius="10px" h="38px"
                color="var(--dash-text-muted)" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                onClick={onClose}>Cancel</Button>
              <Button flex="1" size="sm" h="38px" borderRadius="10px" fontWeight="bold"
                bg={`${RED}12`} border={`1px solid ${RED}40`}
                color={RED} _hover={{ bg: `${RED}20` }}
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

// ═════════════════════════════════════════════════════════════════════════════
// ── Main View ────────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

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

  useEffect(() => { fetchEngagements(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (eng?.c2Deployments) setDeployments(eng.c2Deployments);
  }, [eng]);

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

      if (formData.saveToken && formData.doToken) {
        await updateEngagement(eng.id, {
          c2Config: { ...(eng.c2Config || {}), doToken: formData.doToken },
        });
      }

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
    setDeployments(prev => prev.filter(d => String(d._id) !== String(deployId)));
    try {
      await fetch(`${API}/c2/${eng._id}/deployments/${deployId}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      await fetchEngagements();
    } catch {}
  };

  if (!eng) return (
    <Flex align="center" justify="center" h="60vh"><Spinner size="lg" color={ACCENT} /></Flex>
  );

  const savedToken   = eng.c2Config?.doToken || '';
  const runningCount = deployments.filter(d => d.status === 'running').length;
  const activeCount  = deployments.filter(d => ACTIVE_STATUSES.includes(d.status)).length;
  const destroyedCount = deployments.filter(d => d.status === 'destroyed').length;
  const totalCount = deployments.length;

  return (
    <Box px={6} pb={12}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            C2 <Text as="span" color="red.400">Infrastructure</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · provision and manage C2 nodes via Terraform + Docker
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" fontWeight="bold"
          borderRadius="8px" bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
          color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
          onClick={() => { setDeployError(''); setShowDeploy(true); }}>
          New Deployment
        </Button>
      </Flex>

      {/* Stats row */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={6}>
        {[
          { label: 'Total Nodes', value: totalCount, color: ACCENT, icon: ServerIcon },
          { label: 'Running', value: runningCount, color: GREEN, icon: CheckIcon },
          { label: 'In Progress', value: activeCount, color: YELLOW, icon: SettingsIcon },
          { label: 'Destroyed', value: destroyedCount, color: '#718096', icon: DeleteIcon },
        ].map(({ label, value, color, icon: Icon }) => (
          <MotionBox key={label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="12px" p={4} pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
            <Flex justify="space-between" align="flex-start">
              <Box>
                <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
                <Text fontSize="2xl" fontWeight="black" color={color}>{value}</Text>
              </Box>
              <Flex w="32px" h="32px" borderRadius="8px" bg={`${color}10`}
                border={`1px solid ${color}25`} align="center" justify="center">
                {typeof Icon === 'function' && Icon.render
                  ? <Icon boxSize={3.5} color={color} />
                  : <Icon boxSize="14px" color={color} />}
              </Flex>
            </Flex>
          </MotionBox>
        ))}
      </SimpleGrid>

      {/* Infrastructure Templates */}
      <Flex align="center" gap={2} mb={3}>
        <Box w="3px" h="12px" borderRadius="full" bg={BLUE} />
        <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
          letterSpacing="wider" fontWeight="bold">Infrastructure Templates</Text>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
        {/* DigitalOcean */}
        <MotionBox
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          pos="relative" bg="var(--dash-card-bg)"
          border="1px solid var(--dash-card-border)" borderRadius="14px"
          overflow="hidden" cursor="pointer"
          _hover={{ borderColor: `${BLUE}50` }}
          style={{ transition: 'border-color 0.18s' }}
          onClick={() => { setDeployError(''); setShowDeploy(true); }}>
          <Box pos="absolute" top="0" left="0" right="0" h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${BLUE}80, transparent)` }} />
          <Box p={4}>
            <Flex align="center" gap={3} mb={3}>
              <Flex w="40px" h="40px" borderRadius="10px" align="center" justify="center"
                bg={`${BLUE}12`} border={`1px solid ${BLUE}30`}>
                <CloudIcon boxSize="18px" color={BLUE} />
              </Flex>
              <Box>
                <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">DigitalOcean</Text>
                <Text fontSize="10px" color="var(--dash-text-muted)">Droplet</Text>
              </Box>
              {savedToken && (
                <Flex ml="auto" align="center" gap={1} px={2} py={1} borderRadius="6px"
                  bg={`${GREEN}08`} border={`1px solid ${GREEN}25`}>
                  <CheckIcon boxSize={2.5} color={GREEN} />
                  <Text fontSize="9px" color={GREEN} fontWeight="bold">Token saved</Text>
                </Flex>
              )}
            </Flex>
            <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="1.6" mb={3}>
              Spin up a VPS in any DO region. Ubuntu, Debian, CentOS or Fedora. Root password via cloud-init.
            </Text>
            <Flex gap={1.5} flexWrap="wrap">
              {['Terraform', 'Docker', 'Password Auth'].map(tag => (
                <Box key={tag} px={2} py="2px" borderRadius="5px" fontSize="9px" fontWeight="bold"
                  letterSpacing="wider" textTransform="uppercase"
                  bg={`${BLUE}10`} border={`1px solid ${BLUE}25`} color={BLUE}>{tag}</Box>
              ))}
            </Flex>
          </Box>
        </MotionBox>

        {/* Coming soon */}
        {[
          { name: 'AWS EC2', sub: 'Amazon Web Services', Icon: GlobeIcon, color: ORANGE },
          { name: 'Vultr VPS', sub: 'Vultr Cloud Compute', Icon: BoltIcon, color: CYAN },
        ].map(({ name, sub, Icon, color }) => (
          <MotionBox key={name}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.4, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            pos="relative" bg="var(--dash-card-bg)"
            border="1px solid var(--dash-card-border)" borderRadius="14px" overflow="hidden">
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }} />
            <Box p={4}>
              <Flex align="center" gap={3} mb={3}>
                <Flex w="40px" h="40px" borderRadius="10px" align="center" justify="center"
                  bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)">
                  <Icon boxSize="18px" color="var(--dash-text-muted)" />
                </Flex>
                <Box>
                  <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">{name}</Text>
                  <Text fontSize="10px" color="var(--dash-text-muted)">{sub}</Text>
                </Box>
              </Flex>
              <Text fontSize="12px" color="var(--dash-text-muted)" lineHeight="1.6" mb={3}>
                Template not yet available.
              </Text>
              <Box display="inline-block" px={2} py="2px" borderRadius="5px"
                fontSize="9px" fontWeight="bold" letterSpacing="wider" textTransform="uppercase"
                bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                color="var(--dash-text-muted)">Coming Soon</Box>
            </Box>
          </MotionBox>
        ))}
      </SimpleGrid>

      {/* Deployments */}
      {deployments.length > 0 && (
        <>
          <Flex align="center" gap={3} mb={3}>
            <Box w="3px" h="12px" borderRadius="full" bg={GREEN} />
            <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
              letterSpacing="wider" fontWeight="bold">Active Deployments</Text>
            {runningCount > 0 && (
              <Box px={2} py="1px" borderRadius="full" bg={`${GREEN}10`} border={`1px solid ${GREEN}30`}>
                <Text fontSize="9px" fontWeight="bold" color={GREEN}>{runningCount} running</Text>
              </Box>
            )}
            {activeCount > 0 && (
              <Box px={2} py="1px" borderRadius="full" bg={`${YELLOW}10`} border={`1px solid ${YELLOW}30`}>
                <Text fontSize="9px" fontWeight="bold" color={YELLOW}>{activeCount} in progress</Text>
              </Box>
            )}
          </Flex>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            <AnimatePresence>
              {deployments.map(dep => (
                <DeploymentCard key={dep._id} dep={dep}
                  onViewLogs={setLogsTarget} onDestroy={setDestroyTarget}
                  onDelete={handleDeleteRecord} />
              ))}
            </AnimatePresence>
          </SimpleGrid>
        </>
      )}

      {deployments.length === 0 && (
        <MotionBox
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}>
          <Flex direction="column" align="center" justify="center" py={16} gap={3}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="16px"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}60, transparent)` }} />
            <Flex w="56px" h="56px" borderRadius="14px" bg={`${ACCENT}12`}
              border={`2px solid ${ACCENT}40`} align="center" justify="center">
              <ServerIcon boxSize="24px" color={ACCENT} />
            </Flex>
            <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">
              No deployments yet
            </Text>
            <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center" maxW="340px">
              Select the DigitalOcean template above to provision your first C2 node.
            </Text>
            <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" fontWeight="bold" mt={2}
              borderRadius="8px" bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
              color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
              onClick={() => { setDeployError(''); setShowDeploy(true); }}>
              Deploy First Node
            </Button>
          </Flex>
        </MotionBox>
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
