import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select, Textarea,
  Spinner, Tooltip, useToast, SimpleGrid,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, CheckIcon, RepeatIcon, EditIcon, TimeIcon,
  WarningTwoIcon, CopyIcon, ChevronDownIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

const MotionBox = motion(Box);

// ── Theme ──────────────────────────────────────────────────────────────────────
const ACCENT  = '#4FD1C5';                // teal — "live pulse"
const A_S     = 'rgba(79,209,197,0.07)';
const A_B     = 'rgba(79,209,197,0.28)';
const GREEN   = '#68D391';
const RED     = '#FC8181';
const ORANGE  = '#F6AD55';
const BLUE    = '#63B3ED';
const GOLD    = '#ECC94B';
const VIOLET  = '#B794F4';
const MUTED   = 'var(--dash-text-muted)';
const CARD_BG = 'var(--dash-card-bg)';
const CARD_BD = 'var(--dash-card-border)';

const tok = () => localStorage.getItem('token') || '';

// ── Presets ────────────────────────────────────────────────────────────────────
const ACTION_PRESETS = [
  'Recon',
  'Port Scan',
  'Web Enumeration',
  'Exploitation',
  'Phishing',
  'Credential Attack',
  'Password Spray',
  'Kerberoast',
  'AS-REP Roast',
  'Cred Stuffing',
  'Lateral Movement',
  'Priv Escalation',
  'Persistence',
  'Data Exfil',
  'Cleanup',
  'Other',
];

const TOOL_PRESETS = [
  'nmap', 'masscan', 'rustscan', 'crackmapexec', 'evil-winrm',
  'impacket', 'hashcat', 'john', 'bloodhound', 'sharphound',
  'rubeus', 'mimikatz', 'kerbrute', 'msolspray', 'trevorspray',
  'gophish', 'evilginx', 'burp', 'metasploit',
  'sliver', 'havoc', 'cobalt-strike', 'custom',
];

const RISK_META = {
  low:    { color: GREEN,  label: 'Low',    desc: 'quiet — passive recon' },
  medium: { color: ORANGE, label: 'Medium', desc: 'noisy — generates logs' },
  high:   { color: RED,    label: 'High',   desc: 'loud — likely detection' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtDuration = (s) => {
  if (s < 60)   return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const fmtRelative = (d) => {
  if (!d) return '';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// Deterministic color for an operator name so each user gets a distinct dot
const hashHue = (str = '') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
};

// ── Avatar dot ─────────────────────────────────────────────────────────────────
const OperatorDot = ({ name, size = 7 }) => (
  <Box
    w={`${size}px`} h={`${size}px`} borderRadius="full" flexShrink={0}
    bg={`hsl(${hashHue(name)}, 65%, 60%)`}
    boxShadow={`0 0 6px hsl(${hashHue(name)}, 65%, 60%)80`}
  />
);

// ── Copy button ────────────────────────────────────────────────────────────────
const CopyBtn = ({ text, size = 'xs' }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <Tooltip label={copied ? 'Copied!' : 'Copy'} hasArrow fontSize="10px">
      <IconButton icon={copied ? <CheckIcon /> : <CopyIcon />} size={size}
        variant="ghost" color={copied ? GREEN : MUTED} _hover={{ color: 'white' }}
        onClick={copy} aria-label="copy" />
    </Tooltip>
  );
};

// ── Session Card (active/paused) ───────────────────────────────────────────────
const SessionCard = ({ session, isMine, isCollision, tick, onPatch, onDelete }) => {
  const { target, action, tool, operatorName, status, riskLevel, notes, startedAt } = session;
  const risk = RISK_META[riskLevel] || RISK_META.low;
  const paused = status === 'paused';

  // tick is passed to force re-render every second for live duration
  const duration = useMemo(() => {
    return Math.max(0, Math.round((Date.now() - new Date(startedAt)) / 1000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, tick]);

  const borderColor = isCollision ? RED : (paused ? `${GOLD}40` : A_B);
  const glow        = isCollision ? `0 0 0 1px ${RED}40, 0 0 24px rgba(252,129,129,0.18)`
                      : (paused ? 'none' : `0 0 22px rgba(79,209,197,0.08)`);

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      borderRadius="14px" bg={CARD_BG}
      border={`1px solid ${borderColor}`} pos="relative" overflow="hidden"
      boxShadow={glow}
      _hover={{ borderColor: isCollision ? RED : ACCENT }}>

      {/* Top gradient bar */}
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${isCollision ? RED : paused ? GOLD : ACCENT}90, transparent)` }} />

      {/* Collision ribbon */}
      {isCollision && (
        <Flex align="center" gap={1.5} px={4} py="6px"
          bg="rgba(252,129,129,0.08)" borderBottom="1px solid rgba(252,129,129,0.2)">
          <WarningTwoIcon boxSize={2.5} color={RED} />
          <Text fontSize="10px" fontWeight="bold" color={RED}
            textTransform="uppercase" letterSpacing="wider">
            Collision — another operator is on this target
          </Text>
        </Flex>
      )}

      <Box p={4}>
        {/* Header: operator + live pulse */}
        <Flex align="center" justify="space-between" mb={3}>
          <Flex align="center" gap={2} minW={0}>
            <OperatorDot name={operatorName} />
            <Text fontSize="11px" fontWeight="semibold" color="var(--dash-text-primary)" noOfLines={1}>
              {operatorName}
            </Text>
            {isMine && (
              <Box px="5px" py="1px" borderRadius="4px" bg={`${ACCENT}15`}
                border={`1px solid ${A_B}`}>
                <Text fontSize="8px" fontWeight="black" color={ACCENT}
                  textTransform="uppercase" letterSpacing="wider">you</Text>
              </Box>
            )}
          </Flex>
          <Flex align="center" gap={1.5}>
            {/* Live pulse */}
            {!paused && (
              <Box w="6px" h="6px" borderRadius="full" bg={GREEN}
                boxShadow={`0 0 6px ${GREEN}`}
                animation="pulse 1.6s ease-in-out infinite"
                sx={{
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%':      { opacity: 0.3 },
                  },
                }} />
            )}
            <Text fontSize="10px" fontWeight="bold" fontFamily="mono"
              color={paused ? GOLD : GREEN} textTransform="uppercase" letterSpacing="wider">
              {paused ? 'paused' : 'active'}
            </Text>
          </Flex>
        </Flex>

        {/* Target */}
        <Flex align="center" gap={2} mb={2}>
          <Text fontSize="10px" fontWeight="bold" color={MUTED}
            textTransform="uppercase" letterSpacing="wider" flexShrink={0}>target</Text>
          <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)"
            fontFamily="mono" noOfLines={1} flex={1}>
            {target}
          </Text>
          <CopyBtn text={target} />
        </Flex>

        {/* Action + Tool + Risk row */}
        <Flex align="center" gap={2} mb={3} flexWrap="wrap">
          <Box px="8px" py="3px" borderRadius="6px"
            bg={`${ACCENT}10`} border={`1px solid ${A_B}`}>
            <Text fontSize="10px" fontWeight="bold" color={ACCENT}>
              {action}
            </Text>
          </Box>
          {tool && (
            <Box px="7px" py="3px" borderRadius="6px"
              bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}>
              <Text fontSize="10px" fontFamily="mono" color="var(--dash-text-secondary)">
                {tool}
              </Text>
            </Box>
          )}
          <Tooltip label={risk.desc} hasArrow fontSize="10px">
            <Flex align="center" gap={1} px="7px" py="3px" borderRadius="6px"
              bg={`${risk.color}10`} border={`1px solid ${risk.color}30`} cursor="help">
              <Box w="5px" h="5px" borderRadius="full" bg={risk.color} />
              <Text fontSize="10px" fontWeight="bold" color={risk.color}>
                {risk.label}
              </Text>
            </Flex>
          </Tooltip>
        </Flex>

        {/* Notes */}
        {notes && (
          <Text fontSize="11px" color="var(--dash-text-secondary)" mb={3}
            lineHeight="1.5" noOfLines={2}>
            {notes}
          </Text>
        )}

        {/* Footer: duration + actions */}
        <Flex align="center" justify="space-between" pt={3}
          borderTop={`1px solid ${CARD_BD}`}>
          <Flex align="center" gap={1.5}>
            <TimeIcon boxSize={2.5} color={MUTED} />
            <Text fontSize="11px" fontFamily="mono" color="var(--dash-text-secondary)">
              {fmtDuration(duration)}
            </Text>
          </Flex>

          <Flex align="center" gap={1}>
            {paused ? (
              <Tooltip label="Resume" hasArrow fontSize="10px">
                <IconButton size="xs" variant="ghost" color={GREEN}
                  _hover={{ bg: `${GREEN}15`, color: GREEN }}
                  onClick={() => onPatch(session._id, { status: 'active' })}
                  icon={
                    <Box as="svg" viewBox="0 0 24 24" w="11px" h="11px" fill="currentColor">
                      <polygon points="6 4 20 12 6 20 6 4"/>
                    </Box>
                  } aria-label="resume" />
              </Tooltip>
            ) : (
              <Tooltip label="Pause" hasArrow fontSize="10px">
                <IconButton size="xs" variant="ghost" color={GOLD}
                  _hover={{ bg: `${GOLD}15`, color: GOLD }}
                  onClick={() => onPatch(session._id, { status: 'paused' })}
                  icon={
                    <Box as="svg" viewBox="0 0 24 24" w="11px" h="11px" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </Box>
                  } aria-label="pause" />
              </Tooltip>
            )}
            <Tooltip label="Complete" hasArrow fontSize="10px">
              <IconButton size="xs" variant="ghost" color={ACCENT} icon={<CheckIcon />}
                _hover={{ bg: A_S, color: ACCENT }}
                onClick={() => onPatch(session._id, { status: 'completed' })}
                aria-label="complete" />
            </Tooltip>
            <Tooltip label="Abort" hasArrow fontSize="10px">
              <IconButton size="xs" variant="ghost" color={MUTED}
                _hover={{ bg: 'rgba(252,129,129,0.12)', color: RED }}
                onClick={() => onPatch(session._id, { status: 'aborted' })}
                icon={
                  <Box as="svg" viewBox="0 0 24 24" w="11px" h="11px" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12"/>
                  </Box>
                }
                aria-label="abort" />
            </Tooltip>
            <Tooltip label="Delete" hasArrow fontSize="10px">
              <IconButton size="xs" variant="ghost" color={MUTED} icon={<DeleteIcon />}
                _hover={{ bg: 'rgba(252,129,129,0.12)', color: RED }}
                onClick={() => onDelete(session._id)} aria-label="delete" />
            </Tooltip>
          </Flex>
        </Flex>
      </Box>
    </MotionBox>
  );
};

// ── Main View ──────────────────────────────────────────────────────────────────
const OperatorSessionsView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const { user }      = useAuth();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const [sessions,  setSessions]  = useState([]);
  const [filter,    setFilter]    = useState('active');  // active | paused | mine | collisions | history | all
  const [loading,   setLoading]   = useState(false);
  const [tick,      setTick]      = useState(0);         // forces 1s re-render

  // Start-session form state
  const [target,     setTarget]   = useState('');
  const [action,     setAction]   = useState('Port Scan');
  const [tool,       setTool]     = useState('');
  const [riskLevel,  setRiskLevel]= useState('low');
  const [notes,      setNotes]    = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pollRef = useRef(null);
  const tickRef = useRef(null);

  // ── Fetch sessions ───────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async (silent = false) => {
    if (!engId) return;
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`/api/operator-sessions/${engId}/sessions`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (!r.ok) throw new Error('Failed');
      setSessions(await r.json());
    } catch (_) {
      // silent on poll errors
    } finally {
      if (!silent) setLoading(false);
    }
  }, [engId]);

  // ── Poll every 5s ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!engId) return;
    fetchSessions();
    pollRef.current = setInterval(() => fetchSessions(true), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [engId, fetchSessions]);

  // ── Tick every 1s for live durations ─────────────────────────────────────────
  useEffect(() => {
    tickRef.current = setInterval(() => setTick(t => t + 1), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  // ── Collision detection: active sessions with matching target ────────────────
  const collisionSet = useMemo(() => {
    const byTarget = new Map();
    for (const s of sessions) {
      if (s.status !== 'active' && s.status !== 'paused') continue;
      const key = s.target.trim().toLowerCase();
      if (!byTarget.has(key)) byTarget.set(key, []);
      byTarget.get(key).push(s._id);
    }
    const colliding = new Set();
    for (const ids of byTarget.values()) {
      if (ids.length > 1) ids.forEach(id => colliding.add(id));
    }
    return colliding;
  }, [sessions]);

  // ── Operator identity ────────────────────────────────────────────────────────
  const myId = user?._id || user?.id;

  // ── Buckets ──────────────────────────────────────────────────────────────────
  const active    = sessions.filter(s => s.status === 'active');
  const paused    = sessions.filter(s => s.status === 'paused');
  const live      = [...active, ...paused];
  const history   = sessions.filter(s => s.status === 'completed' || s.status === 'aborted');
  const mine      = sessions.filter(s => s.operatorId === myId);
  const collList  = live.filter(s => collisionSet.has(s._id));

  // Filter application
  const visibleLive =
      filter === 'active'     ? active
    : filter === 'paused'     ? paused
    : filter === 'mine'       ? mine.filter(s => s.status === 'active' || s.status === 'paused')
    : filter === 'collisions' ? collList
    : filter === 'all'        ? live
    : filter === 'history'    ? []
    : live;

  const showHistory = filter === 'all' || filter === 'history';

  // Count unique operators online
  const operatorsOnline = new Set(active.map(s => s.operatorId)).size;

  // ── Create ───────────────────────────────────────────────────────────────────
  const startSession = async () => {
    if (!target.trim()) {
      toast({ title: 'Target is required', status: 'warning', duration: 2000, isClosable: true });
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`/api/operator-sessions/${engId}/sessions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, action, tool, riskLevel, notes }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start session');
      }
      const created = await r.json();
      setSessions(p => [created, ...p]);

      // Warn if this creates a collision
      const collides = live.some(s => s.target.trim().toLowerCase() === target.trim().toLowerCase());
      if (collides) {
        toast({
          title: 'Collision detected',
          description: `Another operator already has an active session on "${target}".`,
          status: 'warning', duration: 5000, isClosable: true,
        });
      }

      // Reset form (keep action + risk, clear target/notes/tool)
      setTarget(''); setTool(''); setNotes('');
    } catch (e) {
      toast({ title: 'Error', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  const patchSession = async (id, patch) => {
    try {
      const r = await fetch(`/api/operator-sessions/${engId}/sessions/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error('Failed');
      const updated = await r.json();
      setSessions(p => p.map(s => s._id === id ? updated : s));
    } catch (_) {
      toast({ title: 'Update failed', status: 'error', duration: 2000, isClosable: true });
    }
  };

  const deleteSession = async (id) => {
    try {
      await fetch(`/api/operator-sessions/${engId}/sessions/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      setSessions(p => p.filter(s => s._id !== id));
    } catch (_) {}
  };

  // Operator breakdown for right sidebar
  const operatorStats = useMemo(() => {
    const map = new Map();
    for (const s of active) {
      const k = s.operatorId;
      if (!map.has(k)) map.set(k, { name: s.operatorName, id: k, count: 0, targets: new Set() });
      const rec = map.get(k);
      rec.count++;
      rec.targets.add(s.target);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [active]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Box>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box mb={5}>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
          Operator <Text as="span" color="red.400">Sessions</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          {eng?.name} · who's doing what, on which target, right now · prevents operator collisions
        </Text>
      </Box>

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px" bg={A_S} border={`1px solid ${A_B}`}>
        <Flex align="center" gap={2} mb={1.5}>
          <Box as="svg" viewBox="0 0 24 24" w="12px" h="12px" fill="none" stroke={ACCENT}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" flexShrink={0}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </Box>
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            Live Team Activity — Collision Prevention
          </Text>
        </Flex>
        <Flex gap={5} flexWrap="wrap">
          {[
            'Start a session before you touch a target — the team sees it live',
            'Automatic collision detection when two operators pick the same host',
            'Risk levels flag noisy activities that may trigger blue-team alerts',
            'All closed sessions stay in history for post-engagement review',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color={MUTED}>{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <Flex gap={0} align="flex-start">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <Flex direction="column" flex="1" gap={4} pr={6} minW={0}>

          {/* ── Start Session card ────────────────────────────────────────── */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />

            <Flex align="center" gap={2} px={5} py={3}
              borderBottom={`1px solid ${CARD_BD}`}>
              <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
              <Text fontSize="10px" fontWeight="bold" color={MUTED}
                textTransform="uppercase" letterSpacing="wider">Start Session</Text>
            </Flex>

            <Box px={5} py={4}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={3}>
                {/* Target */}
                <Box gridColumn={{ md: 'span 2' }}>
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">Target *</Text>
                  <Input
                    h="38px" fontSize="sm" borderRadius="9px" fontFamily="mono"
                    bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                    color="var(--dash-text-primary)"
                    _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '13px' }}
                    _hover={{ borderColor: `${ACCENT}40` }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder="192.168.1.10  ·  dc01.corp.local  ·  alice@target.com"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !submitting && startSession()}
                    isDisabled={submitting}
                  />
                </Box>

                {/* Action */}
                <Box>
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">Action *</Text>
                  <Select h="38px" fontSize="sm" borderRadius="9px"
                    bg="rgba(255,255,255,0.03)" borderColor={CARD_BD}
                    color="var(--dash-text-primary)"
                    _hover={{ borderColor: `${ACCENT}40` }}
                    focusBorderColor={A_B}
                    value={action} onChange={e => setAction(e.target.value)}
                    sx={{ '& option': { background: '#14181f' } }}
                    isDisabled={submitting}>
                    {ACTION_PRESETS.map(a => <option key={a} value={a}>{a}</option>)}
                  </Select>
                </Box>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={3}>
                {/* Tool */}
                <Box>
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">Tool</Text>
                  <Input
                    h="38px" fontSize="sm" borderRadius="9px" fontFamily="mono"
                    bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                    color="var(--dash-text-primary)"
                    _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '13px' }}
                    _hover={{ borderColor: `${ACCENT}40` }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder="nmap, crackmapexec, …"
                    list="operator-tools"
                    value={tool}
                    onChange={e => setTool(e.target.value)}
                    isDisabled={submitting}
                  />
                  <datalist id="operator-tools">
                    {TOOL_PRESETS.map(t => <option key={t} value={t} />)}
                  </datalist>
                </Box>

                {/* Risk */}
                <Box>
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">Risk / Noise</Text>
                  <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="9px"
                    border={`1px solid ${CARD_BD}`} p="3px" h="38px">
                    {['low', 'medium', 'high'].map(r => {
                      const meta   = RISK_META[r];
                      const active = riskLevel === r;
                      return (
                        <Button key={r} flex={1} size="xs" h="auto" borderRadius="6px"
                          fontSize="10px" fontWeight="bold"
                          bg={active ? `${meta.color}18` : 'transparent'}
                          color={active ? meta.color : MUTED}
                          border={active ? `1px solid ${meta.color}40` : '1px solid transparent'}
                          _hover={{ color: meta.color }}
                          onClick={() => setRiskLevel(r)}
                          isDisabled={submitting}>
                          {meta.label}
                        </Button>
                      );
                    })}
                  </Flex>
                </Box>

                {/* Start button */}
                <Flex align="flex-end">
                  <Button w="full" h="38px" borderRadius="9px" fontWeight="semibold" fontSize="12px"
                    bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
                    color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                    leftIcon={submitting ? <Spinner size="xs" /> : <AddIcon boxSize={3} />}
                    onClick={startSession} isDisabled={submitting}>
                    Start Session
                  </Button>
                </Flex>
              </SimpleGrid>

              {/* Notes (optional) */}
              <Textarea
                fontSize="12px" borderRadius="9px" minH="60px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-primary)"
                _placeholder={{ color: MUTED }}
                _hover={{ borderColor: `${ACCENT}40` }}
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                placeholder="Optional notes — what you're trying to do, flags set, findings so far…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                resize="vertical"
                isDisabled={submitting}
              />
            </Box>
          </Box>

          {/* ── Stats strip ──────────────────────────────────────────────── */}
          <Flex gap={3}>
            {[
              { label: 'Active',     value: active.length,          color: GREEN   },
              { label: 'Paused',     value: paused.length,          color: GOLD    },
              { label: 'Operators',  value: operatorsOnline,        color: ACCENT  },
              { label: 'Collisions', value: collList.length,        color: collList.length ? RED : MUTED },
            ].map(({ label, value, color }, i) => (
              <MotionBox key={label} flex="1"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                px={4} py={3} borderRadius="12px" bg={CARD_BG}
                border={`1px solid ${CARD_BD}`} pos="relative" overflow="hidden">
                <Box pos="absolute" top={0} left={0} right={0} h="2px"
                  style={{ background: `linear-gradient(to right, transparent, ${color}70, transparent)` }} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
                <Text fontSize="22px" fontWeight="black" color={color} lineHeight={1}>{value}</Text>
              </MotionBox>
            ))}
          </Flex>

          {/* ── Filter pills ─────────────────────────────────────────────── */}
          <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
            <Flex gap={1.5} flexWrap="wrap">
              {[
                { k: 'active',     label: 'Active',     color: GREEN,  count: active.length },
                { k: 'paused',     label: 'Paused',     color: GOLD,   count: paused.length },
                { k: 'mine',       label: 'Mine',       color: ACCENT, count: mine.filter(s => s.status === 'active' || s.status === 'paused').length },
                { k: 'collisions', label: 'Collisions', color: RED,    count: collList.length },
                { k: 'all',        label: 'All Live',   color: VIOLET, count: live.length },
                { k: 'history',    label: 'History',    color: BLUE,   count: history.length },
              ].map(({ k, label, color, count }) => {
                const isActive = filter === k;
                if (k !== 'active' && k !== 'history' && k !== 'all' && count === 0 && !isActive) return null;
                return (
                  <Button key={k} size="xs" h="26px" px={3} borderRadius="7px"
                    fontSize="10px" fontWeight="bold"
                    bg={isActive ? `${color}18` : 'transparent'}
                    color={isActive ? color : MUTED}
                    border={isActive ? `1px solid ${color}40` : `1px solid ${CARD_BD}`}
                    _hover={{ color, bg: `${color}10` }}
                    onClick={() => setFilter(k)}>
                    {label}
                    <Box as="span" ml={1.5} opacity={0.7}>{count}</Box>
                  </Button>
                );
              })}
            </Flex>
            <Tooltip label="Refresh" hasArrow fontSize="10px">
              <IconButton size="xs" h="26px" w="26px" borderRadius="7px" variant="ghost"
                icon={<RepeatIcon />} color={MUTED} _hover={{ color: ACCENT }}
                onClick={() => fetchSessions()} aria-label="refresh" />
            </Tooltip>
          </Flex>

          {/* ── Live sessions grid ───────────────────────────────────────── */}
          {!showHistory && (
            <Box>
              {loading && sessions.length === 0 ? (
                <Flex align="center" justify="center" py={14}>
                  <Spinner color={ACCENT} size="lg" thickness="2px" />
                </Flex>
              ) : visibleLive.length === 0 ? (
                <Box borderRadius="14px" bg={CARD_BG} border={`1px dashed ${CARD_BD}`} py={14}>
                  <Flex direction="column" align="center" gap={3} opacity={0.45}>
                    <Box as="svg" viewBox="0 0 24 24" w="44px" h="44px" fill="none"
                      stroke={MUTED} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
                        {filter === 'collisions' ? 'No collisions — team is clear'
                          : filter === 'mine'    ? 'No sessions open on your account'
                          : filter === 'paused'  ? 'No paused sessions'
                          :                        'No live sessions — start one above'}
                      </Text>
                      <Text fontSize="11px" color={MUTED} mt={1}>
                        {filter === 'active' && 'Once operators start sessions, they appear here in real time'}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={3}>
                  <AnimatePresence>
                    {visibleLive.map(s => (
                      <SessionCard
                        key={s._id}
                        session={s}
                        isMine={s.operatorId === myId}
                        isCollision={collisionSet.has(s._id)}
                        tick={tick}
                        onPatch={patchSession}
                        onDelete={deleteSession}
                      />
                    ))}
                  </AnimatePresence>
                </SimpleGrid>
              )}
            </Box>
          )}

          {/* ── History table ────────────────────────────────────────────── */}
          {showHistory && (
            <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
              overflow="hidden" pos="relative">
              <Box pos="absolute" top={0} left={0} right={0} h="2px"
                style={{ background: `linear-gradient(to right, transparent, ${BLUE}70, transparent)` }} />
              <Flex align="center" gap={2} px={5} py={3}
                borderBottom={`1px solid ${CARD_BD}`}>
                <Box w="3px" h="13px" borderRadius="full" bg={BLUE} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">History</Text>
                <Box px="7px" py="1px" borderRadius="full"
                  bg={`${BLUE}10`} border={`1px solid ${BLUE}25`}>
                  <Text fontSize="10px" fontWeight="bold" color={BLUE}>{history.length}</Text>
                </Box>
              </Flex>
              {history.length === 0 ? (
                <Flex align="center" justify="center" py={10}>
                  <Text fontSize="11px" color={MUTED} opacity={0.45}>No closed sessions yet</Text>
                </Flex>
              ) : (
                <Flex direction="column">
                  <Flex px={5} py="7px" gap={3} bg="rgba(255,255,255,0.015)"
                    borderBottom={`1px solid ${CARD_BD}`}>
                    {[
                      { lbl: 'Operator', flex: '0 0 160px' },
                      { lbl: 'Target',   flex: '1'         },
                      { lbl: 'Action',   flex: '0 0 140px' },
                      { lbl: 'Status',   flex: '0 0 90px'  },
                      { lbl: 'Duration', flex: '0 0 90px'  },
                      { lbl: 'When',     flex: '0 0 90px'  },
                      { lbl: '',         flex: '0 0 32px'  },
                    ].map(({ lbl, flex }) => (
                      <Text key={lbl || Math.random()} fontSize="9px" fontWeight="bold"
                        color={MUTED} textTransform="uppercase"
                        letterSpacing="wider" flex={flex}>
                        {lbl}
                      </Text>
                    ))}
                  </Flex>
                  {history.map(s => {
                    const dur = s.endedAt
                      ? Math.max(0, Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 1000))
                      : 0;
                    const col = s.status === 'completed' ? GREEN : RED;
                    return (
                      <Flex key={s._id} align="center" gap={3} px={5} py="9px"
                        borderBottom={`1px solid ${CARD_BD}`}
                        _hover={{ bg: 'rgba(255,255,255,0.025)' }}>
                        <Flex align="center" gap={2} flex="0 0 160px" minW={0}>
                          <OperatorDot name={s.operatorName} size={6} />
                          <Text fontSize="11px" color="var(--dash-text-primary)" noOfLines={1}>
                            {s.operatorName}
                          </Text>
                        </Flex>
                        <Text fontSize="11px" fontFamily="mono"
                          color="var(--dash-text-primary)" flex="1" noOfLines={1}>
                          {s.target}
                        </Text>
                        <Text fontSize="11px" color="var(--dash-text-secondary)"
                          flex="0 0 140px" noOfLines={1}>{s.action}</Text>
                        <Box flex="0 0 90px">
                          <Box px="6px" py="1px" borderRadius="4px" display="inline-block"
                            bg={`${col}12`} border={`1px solid ${col}30`}>
                            <Text fontSize="9px" fontWeight="bold" color={col}
                              textTransform="uppercase">{s.status}</Text>
                          </Box>
                        </Box>
                        <Text fontSize="10px" color={MUTED} fontFamily="mono"
                          flex="0 0 90px">{fmtDuration(dur)}</Text>
                        <Text fontSize="10px" color={MUTED}
                          flex="0 0 90px">{fmtRelative(s.endedAt || s.startedAt)}</Text>
                        <IconButton icon={<DeleteIcon />} size="xs" variant="ghost"
                          color={MUTED} _hover={{ color: RED }} flex="0 0 32px"
                          onClick={() => deleteSession(s._id)} aria-label="delete" />
                      </Flex>
                    );
                  })}
                </Flex>
              )}
            </Box>
          )}
        </Flex>

        {/* ── Right column: team activity ────────────────────────────────── */}
        <Box w="260px" flexShrink={0} borderLeft={`1px solid ${CARD_BD}`} pl={5}>

          <Flex align="center" gap={2} mb={4}>
            <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
            <Text fontSize="10px" color={MUTED} textTransform="uppercase"
              letterSpacing="widest" fontWeight="bold">Team Activity</Text>
            {operatorsOnline > 0 && (
              <Box px={2} py="1px" borderRadius="full" bg={A_S} border={`1px solid ${A_B}`}>
                <Text fontSize="10px" color={ACCENT} fontWeight="bold">{operatorsOnline} live</Text>
              </Box>
            )}
          </Flex>

          {operatorStats.length === 0 ? (
            <Box py={6} textAlign="center">
              <Text fontSize="11px" color={MUTED} opacity={0.45}>No operators active</Text>
            </Box>
          ) : (
            <Flex direction="column" gap={1}>
              {operatorStats.map(op => {
                const isMe  = op.id === myId;
                return (
                  <Box key={op.id} px={3} py="9px" borderRadius="9px"
                    bg={isMe ? `${ACCENT}0D` : 'transparent'}
                    border={isMe ? `1px solid ${A_B}` : '1px solid transparent'}
                    _hover={{ bg: isMe ? `${ACCENT}14` : 'rgba(255,255,255,0.04)' }}
                    transition="all 0.15s">
                    <Flex align="center" gap={2} mb={1}>
                      <OperatorDot name={op.name} />
                      <Text fontSize="11px" fontWeight="semibold"
                        color="var(--dash-text-primary)" noOfLines={1} flex={1}>
                        {op.name}
                      </Text>
                      {isMe && (
                        <Text fontSize="8px" color={ACCENT} fontWeight="black"
                          textTransform="uppercase" letterSpacing="wider">you</Text>
                      )}
                    </Flex>
                    <Flex align="center" gap={1.5}>
                      <Box w="5px" h="5px" borderRadius="full" bg={GREEN}
                        boxShadow={`0 0 4px ${GREEN}80`} />
                      <Text fontSize="10px" color={MUTED}>
                        {op.count} active session{op.count !== 1 ? 's' : ''}
                      </Text>
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          )}

          {/* Collision alert */}
          {collList.length > 0 && (
            <Box mt={5} pt={4} borderTop={`1px solid ${CARD_BD}`}>
              <Flex align="center" gap={2} mb={3}>
                <WarningTwoIcon boxSize={3} color={RED} />
                <Text fontSize="10px" color={RED} textTransform="uppercase"
                  letterSpacing="wider" fontWeight="bold">Collisions</Text>
                <Box px={2} py="1px" borderRadius="full"
                  bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.3)">
                  <Text fontSize="10px" color={RED} fontWeight="bold">{collList.length}</Text>
                </Box>
              </Flex>
              <Text fontSize="10px" color={MUTED} lineHeight="1.5">
                Two or more operators are working on the same target. Coordinate via chat before continuing.
              </Text>
              <Button mt={2} size="xs" h="24px" w="full" borderRadius="6px" fontSize="10px"
                bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.28)"
                color={RED} _hover={{ bg: 'rgba(252,129,129,0.18)' }}
                onClick={() => setFilter('collisions')}>
                Show colliding sessions
              </Button>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default OperatorSessionsView;
