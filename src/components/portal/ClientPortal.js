import { useState, useEffect, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Button, Input, SimpleGrid,
  Spinner, Image, Stack,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Colors ──────────────────────────────────────────────────────────────────
const ACCENT = '#9F7AEA';
const RED    = '#FC8181';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const ORANGE = '#F6AD55';
const CYAN   = '#76E4F7';
const YELLOW = '#ECC94B';

const SEVERITY_COLORS = {
  Critical: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#fca5a5', dot: '#ef4444' },
  High:     { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#fcd34d', dot: '#f59e0b' },
  Medium:   { bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.35)',  text: '#fef08a', dot: '#eab308' },
  Low:      { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#93c5fd', dot: '#3b82f6' },
  Info:     { bg: 'rgba(107,114,128,0.12)',border: 'rgba(107,114,128,0.30)',text: '#9ca3af', dot: '#6b7280' },
};
const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];

const STATUS_COLORS = {
  ACTIVE: GREEN, 'IN PROGRESS': GREEN, PREPARING: ORANGE, REPORTING: BLUE,
  COMPLETED: CYAN, PAUSED: YELLOW, CANCELLED: RED,
};

const ACTIVITY_COLORS = {
  engagement: BLUE, finding: RED, milestone: GREEN, resource: ORANGE, team: ACCENT,
};

// ── SVG Icons ───────────────────────────────────────────────────────────────
const ShieldIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Box>
);
const AlertIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </Box>
);
const CodeIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </Box>
);
const EyeIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </Box>
);
const LogOutIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </Box>
);
const CalendarIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </Box>
);
const UsersIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </Box>
);
const ActivityIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </Box>
);
const BoxIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </Box>
);
const PersonIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </Box>
);
const TargetIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </Box>
);

// ── Block View (read-only) ──────────────────────────────────────────────────
const BlockView = ({ block }) => {
  if (block.type === 'text') {
    return <Text fontSize="sm" color="rgba(255,255,255,0.75)" whiteSpace="pre-wrap" lineHeight="tall">{block.content}</Text>;
  }
  if (block.type === 'code') {
    const lines = (block.content || '').split('\n');
    return (
      <Box borderRadius="10px" overflow="hidden" border="1px solid rgba(255,255,255,0.06)">
        {block.language && (
          <Flex align="center" gap={2} px={4} py={2}
            bg="rgba(255,255,255,0.03)" borderBottom="1px solid rgba(255,255,255,0.05)">
            <CodeIcon boxSize="11px" color={CYAN} />
            <Text fontSize="10px" fontWeight="bold" color={CYAN}
              textTransform="uppercase" letterSpacing="wider">{block.language}</Text>
            <Text fontSize="10px" color="rgba(255,255,255,0.3)" ml="auto">{lines.length} lines</Text>
          </Flex>
        )}
        <Box bg="rgba(0,0,0,0.4)" overflowX="auto">
          <Flex>
            <Box as="pre" py={4} px={3} textAlign="right" userSelect="none"
              borderRight="1px solid rgba(255,255,255,0.06)" minW="45px"
              color="rgba(255,255,255,0.2)" fontSize="11px" fontFamily="'Fira Code', monospace" lineHeight="1.7">
              {lines.map((_, i) => <Box key={i}>{i + 1}</Box>)}
            </Box>
            <Box as="pre" flex="1" py={4} px={4} fontSize="12px"
              fontFamily="'Fira Code', monospace" color="#a5f3fc" lineHeight="1.7"
              whiteSpace="pre" overflowX="auto">
              {block.content}
            </Box>
          </Flex>
        </Box>
      </Box>
    );
  }
  if (block.type === 'image' && block.content) {
    return (
      <Box>
        <Box borderRadius="10px" overflow="hidden" border="1px solid rgba(255,255,255,0.08)" bg="rgba(0,0,0,0.3)">
          <Image src={block.content} w="100%" maxH="500px" objectFit="contain" />
        </Box>
        {block.caption && (
          <Text fontSize="11px" color="rgba(255,255,255,0.4)" mt={2} textAlign="center" fontStyle="italic">{block.caption}</Text>
        )}
      </Box>
    );
  }
  return null;
};

// ── Section display (for findings) ──────────────────────────────────────────
const FindingSection = ({ title, icon: Icon, iconColor, blocks, legacyContent }) => {
  const hasContent = blocks?.length > 0 || legacyContent;
  if (!hasContent) return null;
  return (
    <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)"
      borderRadius="12px" pos="relative">
      <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="12px 12px 0 0"
        style={{ background: `linear-gradient(to right, transparent, ${iconColor}50, transparent)` }} />
      <Flex align="center" gap={2} px={5} pt={4} pb={3}>
        <Flex w="24px" h="24px" borderRadius="6px" bg={`${iconColor}12`}
          border={`1px solid ${iconColor}25`} align="center" justify="center" flexShrink={0}>
          <Icon boxSize="12px" color={iconColor} />
        </Flex>
        <Text fontSize="10px" fontWeight="bold" color="rgba(255,255,255,0.6)"
          textTransform="uppercase" letterSpacing="wider">{title}</Text>
      </Flex>
      <Box px={5} pb={5}>
        <Stack spacing={3}>
          {(!blocks || blocks.length === 0) && legacyContent && (
            <Text fontSize="sm" color="rgba(255,255,255,0.65)" whiteSpace="pre-wrap" lineHeight="tall">{legacyContent}</Text>
          )}
          {(blocks || []).map((b, i) => <BlockView key={b._id || i} block={b} />)}
        </Stack>
      </Box>
    </Box>
  );
};

// ── Portal Section Header ───────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, iconColor, title, count, badge }) => (
  <Flex align="center" gap={2} mb={4}>
    <Flex w="28px" h="28px" borderRadius="7px" bg={`${iconColor}12`}
      border={`1px solid ${iconColor}25`} align="center" justify="center" flexShrink={0}>
      <Icon boxSize="13px" color={iconColor} />
    </Flex>
    <Text fontSize="12px" fontWeight="bold" color="rgba(255,255,255,0.6)"
      textTransform="uppercase" letterSpacing="wider">{title}</Text>
    {count !== undefined && (
      <Box px={2} py="1px" borderRadius="full" bg={`${iconColor}10`}
        border={`1px solid ${iconColor}25`}>
        <Text fontSize="9px" fontWeight="bold" color={iconColor}>{count}</Text>
      </Box>
    )}
    {badge}
  </Flex>
);

// ── Portal Card ─────────────────────────────────────────────────────────────
const Card = ({ children, gradient, ...rest }) => (
  <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
    borderRadius="14px" pos="relative" overflow="hidden" {...rest}>
    {gradient && (
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${gradient}60, transparent)` }} />
    )}
    {children}
  </Box>
);

// ── Navigation Tabs ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'Overview',        icon: TargetIcon,   color: RED },
  { key: 'findings',  label: 'Findings',        icon: ShieldIcon,   color: ORANGE },
  { key: 'calendar',  label: 'Calendar',        icon: CalendarIcon, color: BLUE },
  { key: 'activity',  label: 'Activity',        icon: ActivityIcon, color: GREEN },
  { key: 'team',      label: 'Team',            icon: UsersIcon,    color: ACCENT },
  { key: 'resources', label: 'Resources',       icon: BoxIcon,      color: CYAN },
  { key: 'personas',  label: 'Personas',        icon: PersonIcon,   color: YELLOW },
];

// ═════════════════════════════════════════════════════════════════════════════
//  LOGIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); setLoading(false); return; }
      onLogin(data.token, data.tenant);
    } catch {
      setError('Network error — try again');
    }
    setLoading(false);
  };

  return (
    <Flex minH="100vh" bg="#0d0d12" align="center" justify="center" px={4}>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} w="100%" maxW="420px">

        <Flex direction="column" align="center" mb={8}>
          <Flex w="56px" h="56px" borderRadius="16px" bg="rgba(252,129,129,0.1)"
            border="2px solid rgba(252,129,129,0.3)" align="center" justify="center" mb={4}>
            <ShieldIcon boxSize="26px" color={RED} />
          </Flex>
          <Text fontSize="22px" fontWeight="bold" color="white">Client Portal</Text>
          <Text fontSize="13px" color="rgba(255,255,255,0.4)" mt={1}>Sign in to view your engagement</Text>
        </Flex>

        <Box as="form" onSubmit={handleSubmit}
          bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
          borderRadius="16px" p={6}>
          {error && (
            <Flex bg="rgba(252,129,129,0.08)" border="1px solid rgba(252,129,129,0.25)"
              borderRadius="10px" px={4} py={3} mb={4} align="center" gap={2}>
              <AlertIcon boxSize="14px" color={RED} flexShrink={0} />
              <Text fontSize="12px" color={RED}>{error}</Text>
            </Flex>
          )}
          <Box mb={4}>
            <Text fontSize="10px" fontWeight="bold" color="rgba(255,255,255,0.4)"
              textTransform="uppercase" letterSpacing="wider" mb={2}>Email</Text>
            <Input value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="your@email.com" autoComplete="email"
              variant="unstyled" bg="rgba(255,255,255,0.05)"
              border="1px solid rgba(255,255,255,0.1)" borderRadius="10px"
              px={4} h="44px" fontSize="sm" color="white"
              _placeholder={{ color: 'rgba(255,255,255,0.3)' }}
              _focus={{ borderColor: 'rgba(252,129,129,0.5)', boxShadow: '0 0 0 1px rgba(252,129,129,0.2)' }} />
          </Box>
          <Box mb={5}>
            <Text fontSize="10px" fontWeight="bold" color="rgba(255,255,255,0.4)"
              textTransform="uppercase" letterSpacing="wider" mb={2}>Password</Text>
            <Input value={password} onChange={e => setPassword(e.target.value)}
              type="password" placeholder="••••••••" autoComplete="current-password"
              variant="unstyled" bg="rgba(255,255,255,0.05)"
              border="1px solid rgba(255,255,255,0.1)" borderRadius="10px"
              px={4} h="44px" fontSize="sm" color="white"
              _placeholder={{ color: 'rgba(255,255,255,0.3)' }}
              _focus={{ borderColor: 'rgba(252,129,129,0.5)', boxShadow: '0 0 0 1px rgba(252,129,129,0.2)' }} />
          </Box>
          <Button type="submit" w="100%" h="44px" borderRadius="10px"
            bg="rgba(252,129,129,0.15)" border="1px solid rgba(252,129,129,0.4)"
            color={RED} fontWeight="bold" fontSize="13px"
            _hover={{ bg: 'rgba(252,129,129,0.25)' }}
            isLoading={loading} loadingText="Signing in...">
            Sign In
          </Button>
        </Box>
        <Text fontSize="11px" color="rgba(255,255,255,0.2)" textAlign="center" mt={6}>
          Red Team Operations Center · Client Portal
        </Text>
      </MotionBox>
    </Flex>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  CLIENT DASHBOARD (read-only)
// ═════════════════════════════════════════════════════════════════════════════
const ClientDashboard = ({ tenant, token, onLogout }) => {
  const [eng, setEng]                     = useState(null);
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]         = useState(null);
  const [activeTab, setActiveTab]         = useState('overview');
  const [selectedFinding, setSelectedFinding] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/portal/engagement`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setEng(await res.json());
        } else {
          let serverMsg = '';
          try { serverMsg = (await res.json())?.message || ''; } catch { /* non-JSON response */ }
          setLoadError({ status: res.status, message: serverMsg || res.statusText || 'Request failed' });
        }
      } catch (err) {
        setLoadError({ status: 0, message: err?.message || 'Network error — backend unreachable' });
      }
      setLoading(false);
    })();
  }, [token]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const findings = useMemo(() =>
    [...(eng?.findings || [])].sort(
      (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
    ), [eng]);

  const findingCounts = useMemo(() =>
    SEVERITY_ORDER.reduce((acc, s) => {
      acc[s] = findings.filter(f => f.severity === s).length; return acc;
    }, {}), [findings]);

  const activityLogs = useMemo(() =>
    [...(eng?.activityLog || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 30), [eng]);

  const calendarEvents = useMemo(() =>
    [...(eng?.calendarEvents || [])].sort(
      (a, b) => a.date.localeCompare(b.date)
    ), [eng]);

  const skillCoverage = useMemo(() => {
    if (!eng) return [];
    const ops = (eng.operators || []).map(String);
    const opSkills = eng.operatorSkills || {};
    if (ops.length === 0) return [];
    const skills = new Set();
    ops.forEach(uid => (opSkills[uid] || []).forEach(s => skills.add(s)));
    return [...skills].map(skill => {
      const count = ops.filter(uid => (opSkills[uid] || []).includes(skill)).length;
      return { label: skill, count, total: ops.length, pct: Math.round((count / ops.length) * 100) };
    }).sort((a, b) => b.pct - a.pct);
  }, [eng]);

  if (loading) return (
    <Flex minH="100vh" bg="#0d0d12" align="center" justify="center"><Spinner size="xl" color={RED} /></Flex>
  );
  if (!eng) {
    const status = loadError?.status;
    const reason =
      status === 401 ? 'Your session has expired or your tenant account has been disabled. Sign out and sign back in, or contact your operator.'
      : status === 403 ? 'Your tenant account has been disabled by the operator team.'
      : status === 404 ? 'The engagement linked to your tenant account no longer exists. The operator team needs to re-link your tenant to a current engagement.'
      : status === 0   ? 'The backend is unreachable. Check that the server is running and try again.'
      : 'The server returned an unexpected error.';

    return (
      <Flex minH="100vh" bg="#0d0d12" align="center" justify="center" px={6}>
        <Box maxW="560px" w="100%">
          <Flex direction="column" align="center" mb={5}>
            <Flex w="56px" h="56px" borderRadius="14px" bg="rgba(252,129,129,0.10)"
              border="1px solid rgba(252,129,129,0.30)" align="center" justify="center" mb={4}>
              <AlertIcon boxSize="24px" color={RED} />
            </Flex>
            <Text fontSize="18px" fontWeight="bold" color="white">Unable to load engagement data</Text>
            <Text fontSize="12px" color="rgba(255,255,255,0.45)" mt={1} textAlign="center">{reason}</Text>
          </Flex>

          {loadError && (
            <Box bg="rgba(252,129,129,0.06)" border="1px solid rgba(252,129,129,0.25)"
              borderRadius="10px" px={4} py={3} mb={4}>
              <Text fontSize="10px" fontWeight="bold" color={RED}
                textTransform="uppercase" letterSpacing="wider" mb={1}>
                Server response{loadError.status ? ` · ${loadError.status}` : ''}
              </Text>
              <Text fontSize="12px" color="rgba(255,255,255,0.75)" fontFamily="'Fira Code', monospace">
                {loadError.message}
              </Text>
            </Box>
          )}

          <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
            borderRadius="12px" px={5} py={4} mb={4}>
            <Text fontSize="11px" fontWeight="bold" color="rgba(255,255,255,0.5)"
              textTransform="uppercase" letterSpacing="wider" mb={3}>
              What needs to happen
            </Text>
            <Stack spacing={2.5}>
              {[
                ['1', 'An operator creates an engagement in the dashboard.'],
                ['2', 'The operator creates a tenant for that engagement (Reporting → Client Portal) with your company, your email, and a password.'],
                ['3', 'You sign into this portal with that email and password.'],
                ['4', 'The tenant must stay enabled and linked to an existing engagement.'],
              ].map(([n, t]) => (
                <Flex key={n} gap={3} align="flex-start">
                  <Flex w="18px" h="18px" borderRadius="full" bg={`${RED}20`}
                    border={`1px solid ${RED}40`} align="center" justify="center" flexShrink={0} mt="1px">
                    <Text fontSize="9px" fontWeight="bold" color={RED}>{n}</Text>
                  </Flex>
                  <Text fontSize="12px" color="rgba(255,255,255,0.7)" lineHeight="1.6">{t}</Text>
                </Flex>
              ))}
            </Stack>
          </Box>

          <Flex gap={2}>
            <Button flex={1} h="40px" borderRadius="10px"
              bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
              color="rgba(255,255,255,0.7)" fontSize="12px" fontWeight="semibold"
              _hover={{ bg: 'rgba(255,255,255,0.08)', color: 'white' }}
              onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button flex={1} h="40px" borderRadius="10px"
              bg="rgba(252,129,129,0.12)" border="1px solid rgba(252,129,129,0.35)"
              color={RED} fontSize="12px" fontWeight="bold"
              leftIcon={<LogOutIcon boxSize="13px" />}
              _hover={{ bg: 'rgba(252,129,129,0.20)' }}
              onClick={onLogout}>
              Sign Out
            </Button>
          </Flex>

          <Text fontSize="10px" color="rgba(255,255,255,0.2)" textAlign="center" mt={6}>
            Signed in as {tenant?.contactEmail || tenant?.company || 'unknown tenant'}
          </Text>
        </Box>
      </Flex>
    );
  }

  const sc = STATUS_COLORS[eng.status] || BLUE;
  const daysLeft = eng.endDate ? Math.max(0, Math.ceil((new Date(eng.endDate) - new Date()) / 86400000)) : null;
  const operators = eng.operatorDetails || [];
  const resources = eng.resources || [];
  const personas  = eng.personas || [];

  // ── Tab Content Renderers ─────────────────────────────────────────────────

  const renderOverview = () => (
    <>
      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 5 }} gap={3} mb={6}>
        {[
          { label: 'Status', value: eng.status, color: sc },
          { label: 'Progress', value: `${eng.progress || 0}%`, color: GREEN },
          { label: 'Total Findings', value: findings.length, color: RED },
          { label: 'Critical', value: findingCounts.Critical || 0, color: '#ef4444' },
          { label: daysLeft !== null ? 'Days Left' : 'Operators', value: daysLeft !== null ? daysLeft : operators.length, color: BLUE },
        ].map((s, i) => (
          <MotionBox key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}>
            <Card p={4}>
              <Text fontSize="9px" fontWeight="bold" color="rgba(255,255,255,0.3)"
                textTransform="uppercase" letterSpacing="wider" mb={1}>{s.label}</Text>
              <Text fontSize="2xl" fontWeight="black" color={s.color}>{s.value}</Text>
            </Card>
          </MotionBox>
        ))}
      </SimpleGrid>

      {/* Progress bar */}
      <Card gradient={sc} p={5} mb={6}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="10px" fontWeight="bold" color="rgba(255,255,255,0.4)"
            textTransform="uppercase" letterSpacing="wider">Engagement Progress</Text>
          <Text fontSize="13px" fontWeight="bold" color={sc}>{eng.progress || 0}%</Text>
        </Flex>
        <Box w="100%" h="6px" bg="rgba(255,255,255,0.06)" borderRadius="full">
          <Box h="100%" borderRadius="full" bg={sc}
            style={{ width: `${eng.progress || 0}%`, transition: 'width 0.5s ease' }} />
        </Box>
        <Flex justify="space-between" mt={3}>
          <Text fontSize="11px" color="rgba(255,255,255,0.4)">
            {eng.startDate && new Date(eng.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          <Text fontSize="11px" color="rgba(255,255,255,0.4)">
            {eng.endDate && new Date(eng.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </Flex>
      </Card>

      {/* Scope & Objectives */}
      {(eng.scope || eng.objectives) && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={6}>
          {eng.scope && (
            <Card gradient={ACCENT} p={5}>
              <Text fontSize="10px" fontWeight="bold" color="rgba(255,255,255,0.3)"
                textTransform="uppercase" letterSpacing="wider" mb={3}>Scope</Text>
              <Text fontSize="sm" color="rgba(255,255,255,0.65)" whiteSpace="pre-wrap">{eng.scope}</Text>
            </Card>
          )}
          {eng.objectives && (
            <Card gradient={GREEN} p={5}>
              <Text fontSize="10px" fontWeight="bold" color="rgba(255,255,255,0.3)"
                textTransform="uppercase" letterSpacing="wider" mb={3}>Objectives</Text>
              <Text fontSize="sm" color="rgba(255,255,255,0.65)" whiteSpace="pre-wrap">{eng.objectives}</Text>
            </Card>
          )}
        </SimpleGrid>
      )}

      {/* Severity breakdown */}
      <Card gradient={RED} p={5} mb={6}>
        <Text fontSize="10px" fontWeight="bold" color="rgba(255,255,255,0.3)"
          textTransform="uppercase" letterSpacing="wider" mb={3}>Findings Breakdown</Text>
        <Flex gap={4} flexWrap="wrap">
          {SEVERITY_ORDER.map(sev => {
            const count = findingCounts[sev] || 0;
            const c = SEVERITY_COLORS[sev];
            return (
              <Flex key={sev} direction="column" align="center" gap={1}>
                <Text fontSize="xl" fontWeight="black" color={count > 0 ? c.text : 'rgba(255,255,255,0.15)'}>{count}</Text>
                <Flex px="8px" py="1px" borderRadius="4px" fontSize="8px" fontWeight="bold"
                  letterSpacing="wider" bg={c.bg} border={`1px solid ${c.border}`} color={c.text}
                  align="center" gap="4px">
                  <Box w="4px" h="4px" borderRadius="full" bg={c.dot} />{sev.toUpperCase()}
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      </Card>

      {/* Team quick view */}
      {operators.length > 0 && (
        <Card gradient={ACCENT} p={5} mb={6}>
          <Text fontSize="10px" fontWeight="bold" color="rgba(255,255,255,0.3)"
            textTransform="uppercase" letterSpacing="wider" mb={3}>Assigned Operators</Text>
          <Flex gap={3} flexWrap="wrap">
            {operators.map(op => (
              <Flex key={op._id} align="center" gap={2} px={3} py={2} borderRadius="8px"
                bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)">
                <Flex w="28px" h="28px" borderRadius="7px" bg={`${ACCENT}18`}
                  border={`1px solid ${ACCENT}30`} align="center" justify="center" flexShrink={0}>
                  {op.avatar
                    ? <Image src={op.avatar} w="100%" h="100%" borderRadius="7px" objectFit="cover" />
                    : <Text fontSize="11px" fontWeight="bold" color={ACCENT}>{op.callsign?.[0]?.toUpperCase()}</Text>
                  }
                </Flex>
                <Text fontSize="12px" fontWeight="semibold" color="rgba(255,255,255,0.8)">{op.callsign}</Text>
              </Flex>
            ))}
          </Flex>
        </Card>
      )}

      {/* Recent activity preview */}
      {activityLogs.length > 0 && (
        <Card gradient={BLUE} p={5}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="10px" fontWeight="bold" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="wider">Recent Activity</Text>
            <Button size="xs" variant="ghost" color="rgba(255,255,255,0.3)" fontSize="10px"
              _hover={{ color: 'white' }} onClick={() => setActiveTab('activity')}>
              View All
            </Button>
          </Flex>
          {activityLogs.slice(0, 5).map((log, i) => {
            const c = ACTIVITY_COLORS[log.type] || BLUE;
            return (
              <Flex key={log._id || i} align="center" gap={3} py={2}
                borderBottom={i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none'}>
                <Flex w="6px" h="6px" borderRadius="full" bg={c} flexShrink={0} />
                <Text fontSize="12px" color="rgba(255,255,255,0.6)" flex={1} noOfLines={1}>
                  <Text as="span" fontWeight="semibold" color="rgba(255,255,255,0.85)">{log.action}</Text>
                  {log.description && ` — ${log.description}`}
                </Text>
                {log.createdAt && (
                  <Text fontSize="10px" color="rgba(255,255,255,0.2)" flexShrink={0}>
                    {new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </Text>
                )}
              </Flex>
            );
          })}
        </Card>
      )}
    </>
  );

  const renderFindings = () => (
    <>
      {/* Severity bar */}
      {findings.length > 0 && (
        <Flex gap={2} mb={4} flexWrap="wrap">
          {SEVERITY_ORDER.map(sev => {
            const count = findingCounts[sev] || 0;
            if (count === 0) return null;
            const c = SEVERITY_COLORS[sev];
            return (
              <Flex key={sev} px="10px" py="3px" borderRadius="6px" fontSize="10px"
                fontWeight="bold" letterSpacing="wider" align="center" gap="5px"
                bg={c.bg} border={`1px solid ${c.border}`} color={c.text}>
                <Box w="5px" h="5px" borderRadius="full" bg={c.dot} />
                {sev.toUpperCase()} {count}
              </Flex>
            );
          })}
        </Flex>
      )}

      {findings.length === 0 ? (
        <Card p={12}>
          <Flex direction="column" align="center">
            <ShieldIcon boxSize="32px" color="rgba(255,255,255,0.15)" mb={3} />
            <Text fontSize="13px" color="rgba(255,255,255,0.4)">No findings reported yet</Text>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" gap={3}>
          {findings.map((f, fi) => {
            const c = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.Info;
            const isOpen = selectedFinding === (f._id || f.id);
            return (
              <MotionBox key={f._id || f.id} layout
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: fi * 0.02 }}>
                <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)"
                  borderRadius="12px" overflow="hidden" pos="relative" cursor="pointer"
                  onClick={() => setSelectedFinding(isOpen ? null : (f._id || f.id))}
                  _hover={{ borderColor: c.border }} style={{ transition: 'border-color 0.15s' }}>
                  <Box pos="absolute" top={0} left={0} bottom={0} w="3px" bg={c.dot}
                    borderRadius="0 3px 3px 0" opacity={0.5} />
                  <Flex align="center" gap={3} px={5} py={4}>
                    <Flex px="8px" py="2px" borderRadius="5px" fontSize="9px" fontWeight="bold"
                      letterSpacing="wider" flexShrink={0} align="center" gap="5px"
                      bg={c.bg} border={`1px solid ${c.border}`} color={c.text}>
                      <Box w="5px" h="5px" borderRadius="full" bg={c.dot} />{f.severity.toUpperCase()}
                    </Flex>
                    <Box flex={1} minW={0}>
                      <Text fontSize="13px" fontWeight="bold" color="white" noOfLines={1}>{f.title}</Text>
                      {f.description && <Text fontSize="11px" color="rgba(255,255,255,0.4)" noOfLines={1} mt="1px">{f.description}</Text>}
                    </Box>
                    {f.createdAt && (
                      <Text fontSize="10px" color="rgba(255,255,255,0.25)" flexShrink={0}>
                        {new Date(f.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </Text>
                    )}
                  </Flex>
                  <AnimatePresence>
                    {isOpen && (
                      <MotionBox initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        overflow="hidden">
                        <Box px={5} pb={5} borderTop="1px solid rgba(255,255,255,0.04)">
                          <Stack spacing={4} mt={4}>
                            <FindingSection title="Observation" icon={EyeIcon} iconColor={ACCENT}
                              blocks={f.observationBlocks} legacyContent={f.observation} />
                            <FindingSection title="Proof of Concept" icon={CodeIcon} iconColor={CYAN}
                              blocks={f.proofOfConceptBlocks} legacyContent={f.proofOfConcept} />
                            <FindingSection title="Remediation" icon={ShieldIcon} iconColor={GREEN}
                              blocks={f.remediationBlocks} legacyContent={f.remediation} />
                          </Stack>
                        </Box>
                      </MotionBox>
                    )}
                  </AnimatePresence>
                </Box>
              </MotionBox>
            );
          })}
        </Flex>
      )}
    </>
  );

  const renderCalendar = () => {
    if (calendarEvents.length === 0) return (
      <Card p={12}><Flex direction="column" align="center">
        <CalendarIcon boxSize="32px" color="rgba(255,255,255,0.15)" mb={3} />
        <Text fontSize="13px" color="rgba(255,255,255,0.4)">No scheduled events</Text>
      </Flex></Card>
    );

    // Group by date
    const grouped = {};
    calendarEvents.forEach(ev => {
      if (!grouped[ev.date]) grouped[ev.date] = [];
      grouped[ev.date].push(ev);
    });

    return (
      <Flex direction="column" gap={4}>
        {Object.entries(grouped).map(([date, events], gi) => {
          const d = new Date(date + 'T00:00:00');
          const isToday = new Date().toISOString().slice(0, 10) === date;
          const isPast = new Date(date) < new Date(new Date().toISOString().slice(0, 10));
          return (
            <MotionBox key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: gi * 0.04 }}>
              <Card gradient={isToday ? GREEN : BLUE}>
                <Flex align="center" gap={3} px={5} pt={4} pb={2}>
                  <Flex w="36px" h="36px" borderRadius="9px" direction="column"
                    align="center" justify="center" flexShrink={0}
                    bg={isToday ? 'rgba(104,211,145,0.12)' : 'rgba(99,179,237,0.08)'}
                    border={`1px solid ${isToday ? 'rgba(104,211,145,0.3)' : 'rgba(99,179,237,0.2)'}`}>
                    <Text fontSize="14px" fontWeight="black" color={isToday ? GREEN : BLUE} lineHeight={1}>
                      {d.getDate()}
                    </Text>
                    <Text fontSize="8px" fontWeight="bold" color={isToday ? GREEN : BLUE}
                      textTransform="uppercase" letterSpacing="wider" lineHeight={1} mt="1px">
                      {d.toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                  </Flex>
                  <Box>
                    <Text fontSize="12px" fontWeight="bold" color="rgba(255,255,255,0.85)">
                      {d.toLocaleDateString('en-US', { weekday: 'long' })}
                    </Text>
                    <Flex align="center" gap={2}>
                      {isToday && (
                        <Box px="6px" py="1px" borderRadius="4px" fontSize="8px" fontWeight="bold"
                          bg="rgba(104,211,145,0.12)" border="1px solid rgba(104,211,145,0.3)"
                          color={GREEN} letterSpacing="wider">TODAY</Box>
                      )}
                      {isPast && !isToday && (
                        <Text fontSize="10px" color="rgba(255,255,255,0.25)">Past</Text>
                      )}
                      <Text fontSize="10px" color="rgba(255,255,255,0.3)">
                        {events.length} event{events.length !== 1 ? 's' : ''}
                      </Text>
                    </Flex>
                  </Box>
                </Flex>
                <Box px={5} pb={4}>
                  {events.map((ev, ei) => {
                    const isBlocker = ev.type === 'blocker';
                    const evc = isBlocker ? RED : BLUE;
                    return (
                      <Flex key={ev._id || ei} align="center" gap={3} py={2.5}
                        borderTop={ei > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none'}>
                        <Box w="3px" h="24px" borderRadius="full" bg={evc} opacity={0.5} flexShrink={0} />
                        <Box flex={1}>
                          <Flex align="center" gap={2}>
                            <Text fontSize="12px" fontWeight="semibold" color="rgba(255,255,255,0.85)">{ev.title}</Text>
                            {isBlocker && (
                              <Box px="5px" py="1px" borderRadius="3px" fontSize="8px" fontWeight="bold"
                                bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.25)"
                                color={RED} letterSpacing="wider">BLOCKER</Box>
                            )}
                          </Flex>
                          {ev.createdByCallsign && (
                            <Text fontSize="10px" color="rgba(255,255,255,0.3)" mt="1px">{ev.createdByCallsign}</Text>
                          )}
                        </Box>
                        {(ev.startTime || ev.endTime) && (
                          <Text fontSize="10px" color="rgba(255,255,255,0.3)" flexShrink={0}>
                            {ev.startTime}{ev.endTime ? ` — ${ev.endTime}` : ''}
                          </Text>
                        )}
                      </Flex>
                    );
                  })}
                </Box>
              </Card>
            </MotionBox>
          );
        })}
      </Flex>
    );
  };

  const renderActivity = () => {
    if (activityLogs.length === 0) return (
      <Card p={12}><Flex direction="column" align="center">
        <ActivityIcon boxSize="32px" color="rgba(255,255,255,0.15)" mb={3} />
        <Text fontSize="13px" color="rgba(255,255,255,0.4)">No activity logged yet</Text>
      </Flex></Card>
    );
    return (
      <Card>
        {activityLogs.map((log, i) => {
          const c = ACTIVITY_COLORS[log.type] || BLUE;
          return (
            <MotionBox key={log._id || i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: i * 0.02 }}>
              <Flex align="center" gap={3} px={5} py={3.5}
                borderBottom={i < activityLogs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                _hover={{ bg: 'rgba(255,255,255,0.01)' }} style={{ transition: 'background 0.15s' }}>
                <Flex w="8px" h="8px" borderRadius="full" bg={c} flexShrink={0}
                  boxShadow={`0 0 6px ${c}40`} />
                <Box flex={1}>
                  <Text fontSize="12px" color="rgba(255,255,255,0.75)">
                    <Text as="span" fontWeight="bold" color="rgba(255,255,255,0.9)">{log.action}</Text>
                    {log.description && ` — ${log.description}`}
                  </Text>
                </Box>
                <Flex direction="column" align="flex-end" flexShrink={0}>
                  <Box px="6px" py="1px" borderRadius="3px" fontSize="8px" fontWeight="bold"
                    bg={`${c}10`} border={`1px solid ${c}25`} color={c}
                    letterSpacing="wider" textTransform="uppercase" mb="2px">
                    {log.type || 'log'}
                  </Box>
                  {log.createdAt && (
                    <Text fontSize="9px" color="rgba(255,255,255,0.2)">
                      {new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {' · '}
                      {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </Flex>
              </Flex>
            </MotionBox>
          );
        })}
      </Card>
    );
  };

  const renderTeam = () => (
    <>
      {/* Operators */}
      <SectionHeader icon={UsersIcon} iconColor={ACCENT} title="Operators" count={operators.length} />
      {operators.length === 0 ? (
        <Card p={8} mb={6}><Flex direction="column" align="center">
          <UsersIcon boxSize="28px" color="rgba(255,255,255,0.15)" mb={2} />
          <Text fontSize="12px" color="rgba(255,255,255,0.4)">No operators assigned</Text>
        </Flex></Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3} mb={6}>
          {operators.map((op, i) => {
            const opSkills = (eng.operatorSkills || {})[op._id] || [];
            return (
              <MotionBox key={op._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}>
                <Card gradient={ACCENT} p={4}>
                  <Flex align="center" gap={3} mb={opSkills.length > 0 ? 3 : 0}>
                    <Flex w="40px" h="40px" borderRadius="10px" bg={`${ACCENT}15`}
                      border={`1px solid ${ACCENT}30`} align="center" justify="center" flexShrink={0}>
                      {op.avatar
                        ? <Image src={op.avatar} w="100%" h="100%" borderRadius="10px" objectFit="cover" />
                        : <Text fontSize="15px" fontWeight="bold" color={ACCENT}>{op.callsign?.[0]?.toUpperCase()}</Text>
                      }
                    </Flex>
                    <Box>
                      <Text fontSize="13px" fontWeight="bold" color="rgba(255,255,255,0.9)">{op.callsign}</Text>
                      <Text fontSize="10px" color="rgba(255,255,255,0.35)">
                        {opSkills.length} skill{opSkills.length !== 1 ? 's' : ''}
                      </Text>
                    </Box>
                  </Flex>
                  {opSkills.length > 0 && (
                    <Flex gap={1} flexWrap="wrap">
                      {opSkills.map(skill => (
                        <Box key={skill} px="6px" py="2px" borderRadius="4px" fontSize="8px"
                          fontWeight="bold" letterSpacing="wider" textTransform="uppercase"
                          bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
                          color="rgba(255,255,255,0.5)">{skill}</Box>
                      ))}
                    </Flex>
                  )}
                </Card>
              </MotionBox>
            );
          })}
        </SimpleGrid>
      )}

      {/* Skill Coverage */}
      {skillCoverage.length > 0 && (
        <>
          <SectionHeader icon={TargetIcon} iconColor={GREEN} title="Skill Coverage" count={skillCoverage.length} />
          <Card gradient={GREEN} p={5}>
            <Stack spacing={3}>
              {skillCoverage.map((s, i) => {
                const barColor = s.pct >= 80 ? GREEN : s.pct >= 50 ? YELLOW : ORANGE;
                return (
                  <MotionBox key={s.label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.03 }}>
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text fontSize="12px" fontWeight="semibold" color="rgba(255,255,255,0.75)">{s.label}</Text>
                      <Flex align="center" gap={2}>
                        <Text fontSize="10px" color="rgba(255,255,255,0.3)">{s.count}/{s.total}</Text>
                        <Text fontSize="11px" fontWeight="bold" color={barColor}>{s.pct}%</Text>
                      </Flex>
                    </Flex>
                    <Box w="100%" h="4px" bg="rgba(255,255,255,0.06)" borderRadius="full">
                      <Box h="100%" borderRadius="full" bg={barColor}
                        style={{ width: `${s.pct}%`, transition: 'width 0.4s ease' }} />
                    </Box>
                  </MotionBox>
                );
              })}
            </Stack>
          </Card>
        </>
      )}
    </>
  );

  const renderResources = () => {
    if (resources.length === 0) return (
      <Card p={12}><Flex direction="column" align="center">
        <BoxIcon boxSize="32px" color="rgba(255,255,255,0.15)" mb={3} />
        <Text fontSize="13px" color="rgba(255,255,255,0.4)">No resources tracked</Text>
      </Flex></Card>
    );
    return (
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        {resources.map((r, i) => {
          const pct = r.total > 0 ? Math.round((r.used / r.total) * 100) : 0;
          const rc = r.color || CYAN;
          return (
            <MotionBox key={r._id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}>
              <Card gradient={rc} p={5}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Flex align="center" gap={2}>
                    <Box w="8px" h="8px" borderRadius="2px" bg={rc} />
                    <Text fontSize="13px" fontWeight="bold" color="rgba(255,255,255,0.85)">{r.name}</Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Text fontSize="11px" color="rgba(255,255,255,0.4)">
                      {r.used} / {r.total} in use
                    </Text>
                    <Text fontSize="12px" fontWeight="bold" color={rc}>{pct}%</Text>
                  </Flex>
                </Flex>
                <Box w="100%" h="5px" bg="rgba(255,255,255,0.06)" borderRadius="full">
                  <Box h="100%" borderRadius="full" bg={rc}
                    style={{ width: `${pct}%`, transition: 'width 0.4s ease' }} />
                </Box>
                <Text fontSize="10px" color="rgba(255,255,255,0.25)" mt={2}>{r.category}</Text>
              </Card>
            </MotionBox>
          );
        })}
      </SimpleGrid>
    );
  };

  const renderPersonas = () => {
    if (personas.length === 0) return (
      <Card p={12}><Flex direction="column" align="center">
        <PersonIcon boxSize="32px" color="rgba(255,255,255,0.15)" mb={3} />
        <Text fontSize="13px" color="rgba(255,255,255,0.4)">No personas created</Text>
      </Flex></Card>
    );
    return (
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        {personas.map((p, i) => (
          <MotionBox key={p._id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}>
            <Card gradient={YELLOW} p={5}>
              <Flex align="center" gap={3} mb={3}>
                <Flex w="40px" h="40px" borderRadius="10px" bg={`${YELLOW}12`}
                  border={`1px solid ${YELLOW}30`} align="center" justify="center" flexShrink={0}>
                  <Text fontSize="15px" fontWeight="bold" color={YELLOW}>
                    {(p.fullName || '?')[0].toUpperCase()}
                  </Text>
                </Flex>
                <Box>
                  <Text fontSize="14px" fontWeight="bold" color="rgba(255,255,255,0.9)">{p.fullName || 'Unnamed'}</Text>
                  <Text fontSize="10px" color="rgba(255,255,255,0.35)">
                    {[p.occupation, p.company].filter(Boolean).join(' · ') || 'No occupation set'}
                  </Text>
                </Box>
              </Flex>
              <SimpleGrid columns={2} gap={2}>
                {[
                  { label: 'Email', value: p.email },
                  { label: 'Username', value: p.username },
                  { label: 'Phone', value: p.phone },
                  { label: 'Location', value: [p.city, p.country].filter(Boolean).join(', ') },
                  { label: 'Nationality', value: p.nationality },
                  { label: 'Gender', value: p.gender },
                ].filter(f => f.value).map(f => (
                  <Box key={f.label}>
                    <Text fontSize="9px" fontWeight="bold" color="rgba(255,255,255,0.25)"
                      textTransform="uppercase" letterSpacing="wider">{f.label}</Text>
                    <Text fontSize="11px" color="rgba(255,255,255,0.6)" noOfLines={1}>{f.value}</Text>
                  </Box>
                ))}
              </SimpleGrid>
              {p.notes && (
                <Box mt={3} pt={3} borderTop="1px solid rgba(255,255,255,0.04)">
                  <Text fontSize="11px" color="rgba(255,255,255,0.45)" noOfLines={2}>{p.notes}</Text>
                </Box>
              )}
              {p.createdByCallsign && (
                <Text fontSize="9px" color="rgba(255,255,255,0.2)" mt={2}>
                  Created by {p.createdByCallsign}
                </Text>
              )}
            </Card>
          </MotionBox>
        ))}
      </SimpleGrid>
    );
  };

  // ── Tab content map ───────────────────────────────────────────────────────
  const tabContent = {
    overview:  renderOverview,
    findings:  renderFindings,
    calendar:  renderCalendar,
    activity:  renderActivity,
    team:      renderTeam,
    resources: renderResources,
    personas:  renderPersonas,
  };

  const activeTabMeta = TABS.find(t => t.key === activeTab);

  return (
    <Box minH="100vh" bg="#0d0d12">
      {/* Top bar */}
      <Flex bg="rgba(255,255,255,0.02)" borderBottom="1px solid rgba(255,255,255,0.06)"
        px={6} py={3} align="center" justify="space-between" pos="sticky" top={0} zIndex={10}
        backdropFilter="blur(12px)">
        <Flex align="center" gap={3}>
          <Flex w="32px" h="32px" borderRadius="8px" bg="rgba(252,129,129,0.1)"
            border="1px solid rgba(252,129,129,0.25)" align="center" justify="center">
            <ShieldIcon boxSize="15px" color={RED} />
          </Flex>
          <Box>
            <Text fontSize="13px" fontWeight="bold" color="white">{tenant.company}</Text>
            <Text fontSize="10px" color="rgba(255,255,255,0.4)">Client Portal · Read Only</Text>
          </Box>
        </Flex>
        <Button size="sm" variant="ghost" color="rgba(255,255,255,0.4)"
          borderRadius="8px" fontSize="11px" leftIcon={<LogOutIcon boxSize="13px" />}
          _hover={{ color: 'white', bg: 'rgba(255,255,255,0.05)' }}
          onClick={onLogout}>
          Sign Out
        </Button>
      </Flex>

      <Box maxW="1200px" mx="auto" px={6} py={8}>

        {/* Engagement header */}
        <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }} mb={6}>
          <Heading fontSize="2xl" fontWeight="bold" color="white" lineHeight={1.2}>
            {eng.name}
          </Heading>
          <Flex align="center" gap={3} mt={2}>
            <Box px="8px" py="2px" borderRadius="5px" fontSize="10px" fontWeight="bold"
              letterSpacing="wider" bg={`${sc}15`} border={`1px solid ${sc}40`} color={sc}>
              {eng.status}
            </Box>
            {eng.type && <Text fontSize="11px" color="rgba(255,255,255,0.4)">{eng.type}</Text>}
            {eng.company && <Text fontSize="11px" color="rgba(255,255,255,0.4)">· {eng.company}</Text>}
          </Flex>
        </MotionBox>

        {/* Navigation tabs */}
        <Flex gap={1} mb={6} overflowX="auto" pb={1}
          css={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const TabIcon = tab.icon;
            return (
              <Button key={tab.key} size="sm" variant="ghost" borderRadius="8px"
                px={4} h="36px" fontSize="11px" fontWeight="bold"
                color={isActive ? tab.color : 'rgba(255,255,255,0.35)'}
                bg={isActive ? `${tab.color}10` : 'transparent'}
                border={isActive ? `1px solid ${tab.color}25` : '1px solid transparent'}
                _hover={{ color: isActive ? tab.color : 'rgba(255,255,255,0.6)', bg: isActive ? `${tab.color}10` : 'rgba(255,255,255,0.03)' }}
                leftIcon={<TabIcon boxSize="13px" />}
                onClick={() => setActiveTab(tab.key)}
                flexShrink={0}>
                {tab.label}
              </Button>
            );
          })}
        </Flex>

        {/* Section header */}
        {activeTab !== 'overview' && activeTabMeta && (
          <SectionHeader icon={activeTabMeta.icon} iconColor={activeTabMeta.color}
            title={activeTabMeta.label}
            count={
              activeTab === 'findings' ? findings.length
              : activeTab === 'calendar' ? calendarEvents.length
              : activeTab === 'activity' ? activityLogs.length
              : activeTab === 'team' ? operators.length
              : activeTab === 'resources' ? resources.length
              : activeTab === 'personas' ? personas.length
              : undefined
            } />
        )}

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <MotionBox key={activeTab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}>
            {tabContent[activeTab]?.()}
          </MotionBox>
        </AnimatePresence>

        <Text fontSize="10px" color="rgba(255,255,255,0.15)" textAlign="center" mt={12}>
          Red Team Operations Center · Client Portal · Read-Only Access
        </Text>
      </Box>
    </Box>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN PORTAL COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const ClientPortal = () => {
  const [token, setToken]   = useState(() => localStorage.getItem('portal_token'));
  const [tenant, setTenant] = useState(() => {
    try { return JSON.parse(localStorage.getItem('portal_tenant')); } catch { return null; }
  });

  const handleLogin = (tok, ten) => {
    localStorage.setItem('portal_token', tok);
    localStorage.setItem('portal_tenant', JSON.stringify(ten));
    setToken(tok);
    setTenant(ten);
  };

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_tenant');
    setToken(null);
    setTenant(null);
  };

  if (!token || !tenant) return <LoginScreen onLogin={handleLogin} />;
  return <ClientDashboard tenant={tenant} token={token} onLogout={handleLogout} />;
};

export default ClientPortal;
