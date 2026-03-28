import { useState, useEffect, useCallback } from 'react';
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
  ACTIVE:    GREEN,
  PREPARING: ORANGE,
  COMPLETE:  BLUE,
  PAUSED:    YELLOW,
  CANCELLED: RED,
};

// ── SVG Icons ───────────────────────────────────────────────────────────────
const ShieldIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Box>
);

const AlertIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </Box>
);

const CodeIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </Box>
);

const EyeIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </Box>
);

const ClockIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </Box>
);

const LogOutIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
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

// ── Section display ─────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, iconColor, blocks, legacyContent }) => {
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
      <MotionBox
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        w="100%" maxW="420px">

        <Flex direction="column" align="center" mb={8}>
          <Flex w="56px" h="56px" borderRadius="16px" bg="rgba(252,129,129,0.1)"
            border="2px solid rgba(252,129,129,0.3)" align="center" justify="center" mb={4}>
            <ShieldIcon boxSize="26px" color={RED} />
          </Flex>
          <Text fontSize="22px" fontWeight="bold" color="white">Client Portal</Text>
          <Text fontSize="13px" color="rgba(255,255,255,0.4)" mt={1}>
            Sign in to view your engagement
          </Text>
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
  const [eng, setEng]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/portal/engagement`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setEng(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [token]);

  if (loading) return (
    <Flex minH="100vh" bg="#0d0d12" align="center" justify="center">
      <Spinner size="xl" color={RED} />
    </Flex>
  );

  if (!eng) return (
    <Flex minH="100vh" bg="#0d0d12" align="center" justify="center">
      <Text color="rgba(255,255,255,0.5)">Unable to load engagement data.</Text>
    </Flex>
  );

  const findings = [...(eng.findings || [])].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );
  const findingCounts = SEVERITY_ORDER.reduce((acc, s) => {
    acc[s] = findings.filter(f => f.severity === s).length; return acc;
  }, {});

  const sc = STATUS_COLORS[eng.status] || BLUE;
  const daysLeft = eng.endDate
    ? Math.max(0, Math.ceil((new Date(eng.endDate) - new Date()) / 86400000))
    : null;

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
            {eng.type && (
              <Text fontSize="11px" color="rgba(255,255,255,0.4)">{eng.type}</Text>
            )}
            {eng.company && (
              <Text fontSize="11px" color="rgba(255,255,255,0.4)">· {eng.company}</Text>
            )}
          </Flex>
        </MotionBox>

        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={8}>
          <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
            borderRadius="12px" p={4}>
            <Text fontSize="9px" fontWeight="bold" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="wider" mb={1}>Total Findings</Text>
            <Text fontSize="2xl" fontWeight="black" color={RED}>{findings.length}</Text>
          </Box>
          <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
            borderRadius="12px" p={4}>
            <Text fontSize="9px" fontWeight="bold" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="wider" mb={1}>Critical</Text>
            <Text fontSize="2xl" fontWeight="black" color="#ef4444">{findingCounts.Critical || 0}</Text>
          </Box>
          <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
            borderRadius="12px" p={4}>
            <Text fontSize="9px" fontWeight="bold" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="wider" mb={1}>High</Text>
            <Text fontSize="2xl" fontWeight="black" color="#f59e0b">{findingCounts.High || 0}</Text>
          </Box>
          <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
            borderRadius="12px" p={4}>
            <Text fontSize="9px" fontWeight="bold" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="wider" mb={1}>
              {daysLeft !== null ? 'Days Left' : 'Status'}</Text>
            <Text fontSize="2xl" fontWeight="black" color={sc}>
              {daysLeft !== null ? daysLeft : eng.status}
            </Text>
          </Box>
        </SimpleGrid>

        {/* Engagement details */}
        {(eng.scope || eng.objectives) && (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={8}>
            {eng.scope && (
              <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
                borderRadius="12px" p={5}>
                <Text fontSize="10px" fontWeight="bold" color="rgba(255,255,255,0.3)"
                  textTransform="uppercase" letterSpacing="wider" mb={3}>Scope</Text>
                <Text fontSize="sm" color="rgba(255,255,255,0.65)" whiteSpace="pre-wrap">{eng.scope}</Text>
              </Box>
            )}
            {eng.objectives && (
              <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
                borderRadius="12px" p={5}>
                <Text fontSize="10px" fontWeight="bold" color="rgba(255,255,255,0.3)"
                  textTransform="uppercase" letterSpacing="wider" mb={3}>Objectives</Text>
                <Text fontSize="sm" color="rgba(255,255,255,0.65)" whiteSpace="pre-wrap">{eng.objectives}</Text>
              </Box>
            )}
          </SimpleGrid>
        )}

        {/* Findings section header */}
        <Flex align="center" gap={2} mb={4}>
          <Box w="3px" h="14px" borderRadius="full" bg={RED} />
          <Text fontSize="11px" fontWeight="bold" color="rgba(255,255,255,0.5)"
            textTransform="uppercase" letterSpacing="wider">Findings</Text>
          <Box px={2} py="1px" borderRadius="full" bg="rgba(252,129,129,0.1)"
            border="1px solid rgba(252,129,129,0.25)">
            <Text fontSize="9px" fontWeight="bold" color={RED}>{findings.length}</Text>
          </Box>
        </Flex>

        {/* Severity breakdown bar */}
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

        {/* Findings list */}
        {findings.length === 0 ? (
          <Flex direction="column" align="center" py={12}
            bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)"
            borderRadius="14px">
            <ShieldIcon boxSize="32px" color="rgba(255,255,255,0.15)" mb={3} />
            <Text fontSize="13px" color="rgba(255,255,255,0.4)">No findings reported yet</Text>
          </Flex>
        ) : (
          <Flex direction="column" gap={3}>
            {findings.map(f => {
              const c = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.Info;
              const isOpen = selectedFinding === (f._id || f.id);
              return (
                <MotionBox key={f._id || f.id} layout
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}>
                  <Box
                    bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)"
                    borderRadius="12px" overflow="hidden" pos="relative"
                    cursor="pointer"
                    onClick={() => setSelectedFinding(isOpen ? null : (f._id || f.id))}
                    _hover={{ borderColor: `${c.border}` }}
                    style={{ transition: 'border-color 0.15s' }}>

                    <Box pos="absolute" top={0} left={0} bottom={0} w="3px"
                      bg={c.dot} borderRadius="0 3px 3px 0" opacity={0.5} />

                    {/* Finding header */}
                    <Flex align="center" gap={3} px={5} py={4}>
                      <Flex px="8px" py="2px" borderRadius="5px" fontSize="9px"
                        fontWeight="bold" letterSpacing="wider" flexShrink={0}
                        align="center" gap="5px" bg={c.bg} border={`1px solid ${c.border}`} color={c.text}>
                        <Box w="5px" h="5px" borderRadius="full" bg={c.dot} />
                        {f.severity.toUpperCase()}
                      </Flex>
                      <Box flex={1} minW={0}>
                        <Text fontSize="13px" fontWeight="bold" color="white" noOfLines={1}>{f.title}</Text>
                        {f.description && (
                          <Text fontSize="11px" color="rgba(255,255,255,0.4)" noOfLines={1} mt="1px">{f.description}</Text>
                        )}
                      </Box>
                      {f.createdAt && (
                        <Text fontSize="10px" color="rgba(255,255,255,0.25)" flexShrink={0}>
                          {new Date(f.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </Text>
                      )}
                    </Flex>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isOpen && (
                        <MotionBox
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          overflow="hidden">
                          <Box px={5} pb={5} borderTop="1px solid rgba(255,255,255,0.04)">
                            <Stack spacing={4} mt={4}>
                              <Section title="Observation" icon={EyeIcon} iconColor={ACCENT}
                                blocks={f.observationBlocks} legacyContent={f.observation} />
                              <Section title="Proof of Concept" icon={CodeIcon} iconColor={CYAN}
                                blocks={f.proofOfConceptBlocks} legacyContent={f.proofOfConcept} />
                              <Section title="Remediation" icon={ShieldIcon} iconColor={GREEN}
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

        {/* Activity log */}
        {eng.activityLogs?.length > 0 && (
          <Box mt={8}>
            <Flex align="center" gap={2} mb={4}>
              <Box w="3px" h="14px" borderRadius="full" bg={BLUE} />
              <Text fontSize="11px" fontWeight="bold" color="rgba(255,255,255,0.5)"
                textTransform="uppercase" letterSpacing="wider">Recent Activity</Text>
            </Flex>
            <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)"
              borderRadius="12px" overflow="hidden">
              {eng.activityLogs.slice(0, 15).map((log, i) => (
                <Flex key={log._id || i} px={5} py={3} align="center" gap={3}
                  borderBottom={i < 14 ? '1px solid rgba(255,255,255,0.04)' : 'none'}>
                  <Flex w="6px" h="6px" borderRadius="full" bg={BLUE} flexShrink={0} opacity={0.5} />
                  <Box flex={1}>
                    <Text fontSize="12px" color="rgba(255,255,255,0.7)" noOfLines={1}>
                      <Text as="span" fontWeight="semibold" color="white">{log.action}</Text>
                      {' — '}{log.description}
                    </Text>
                  </Box>
                  {log.createdAt && (
                    <Text fontSize="10px" color="rgba(255,255,255,0.2)" flexShrink={0}>
                      {new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                  )}
                </Flex>
              ))}
            </Box>
          </Box>
        )}

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

  if (!token || !tenant) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <ClientDashboard tenant={tenant} token={token} onLogout={handleLogout} />;
};

export default ClientPortal;
