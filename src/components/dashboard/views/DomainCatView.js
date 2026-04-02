import { useState, useRef } from 'react';
import {
  Box, Flex, Text, Heading, Input, Button, IconButton,
  SimpleGrid, Spinner, Collapse, Tooltip, Link,
} from '@chakra-ui/react';
import {
  SearchIcon, CheckIcon, WarningIcon, InfoIcon, ExternalLinkIcon,
  SettingsIcon, CloseIcon, CopyIcon, LockIcon,
} from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const API_BASE    = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT = '#9F7AEA';
const GREEN  = '#68D391';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const YELLOW = '#ECC94B';
const BLUE   = '#63B3ED';
const CYAN   = '#76E4F7';

const STATUS_CONFIG = {
  clean:          { label: 'Clean',          color: GREEN,  icon: CheckIcon  },
  malicious:      { label: 'Malicious',      color: RED,    icon: WarningIcon },
  suspicious:     { label: 'Suspicious',     color: ORANGE, icon: WarningIcon },
  manual:         { label: 'Manual Check',   color: BLUE,   icon: ExternalLinkIcon },
  no_key:         { label: 'API Key Needed', color: YELLOW, icon: LockIcon   },
  error:          { label: 'Error',          color: '#718096', icon: CloseIcon },
  not_found:      { label: 'Not Found',      color: '#718096', icon: InfoIcon },
  not_configured: { label: 'Not Configured', color: '#718096', icon: SettingsIcon },
  timeout:        { label: 'Timeout',        color: ORANGE, icon: WarningIcon },
  checking:       { label: 'Checking…',      color: ACCENT, icon: null },
};

const VENDOR_COLORS = {
  'VirusTotal':          '#3D84F5',
  'AbuseIPDB':           '#FC8181',
  'URLhaus':             '#F6AD55',
  'Talos':               '#1BA0D7',
  'BlueCoat / Symantec': '#FFC72C',
  'McAfee WebAdvisor':   '#C01818',
  'BrightCloud':         '#00A4E4',
  'Palo Alto':           '#FA582D',
  'Watchguard':          '#CC0000',
  'Cisco Umbrella':      '#1BA0D7',
  'Lightspeed':          '#0077C8',
};

// ── Copy btn ──────────────────────────────────────────────────────────────────
const CopyBtn = ({ value }) => {
  const [ok, setOk] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value).then(() => { setOk(true); setTimeout(() => setOk(false), 1800); }); };
  return (
    <Tooltip label={ok ? 'Copied!' : 'Copy'} fontSize="10px">
      <IconButton icon={ok ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
        size="xs" variant="ghost" borderRadius="5px"
        color={ok ? GREEN : 'var(--dash-text-muted)'}
        _hover={{ color: ok ? GREEN : 'white', bg: 'rgba(255,255,255,0.06)' }}
        aria-label="copy" onClick={copy} />
    </Tooltip>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
  <Box px={4} py={3} borderRadius="12px" bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Text fontSize="22px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
    <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{label}</Text>
  </Box>
);

// ── Vendor card ───────────────────────────────────────────────────────────────
const VendorCard = ({ result }) => {
  const [open, setOpen] = useState(false);
  const sc     = STATUS_CONFIG[result.status] || STATUS_CONFIG.error;
  const vc     = VENDOR_COLORS[result.vendor] || ACCENT;
  const Icon   = sc.icon;
  const isManual = result.status === 'manual';

  const hasDetails = result.categories?.length > 0 || result.score !== undefined ||
    result.urlCount !== undefined || result.category || result.ip ||
    result.threats?.length > 0 || result.reputation !== null;

  return (
    <MotionBox
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      borderRadius="12px" overflow="hidden"
      bg="var(--dash-card-bg)" border={`1px solid ${isManual ? 'var(--dash-card-border)' : sc.color + '30'}`}
      _hover={{ borderColor: `${vc}40` }}
      style={{ transition: 'border-color 0.15s' }}
      pos="relative" opacity={result.status === 'error' || result.status === 'not_found' ? 0.6 : 1}>

      {/* Top gradient */}
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${vc}80, transparent)` }} />

      <Box px={4} pt={4} pb={3}>
        {/* Vendor name + status */}
        <Flex align="center" justify="space-between" gap={2} mb={2}>
          <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)">{result.vendor}</Text>
          <Flex align="center" gap={1.5} px={2} py="3px" borderRadius="6px"
            bg={`${sc.color}15`} border={`1px solid ${sc.color}30`} flexShrink={0}>
            {result.status === 'checking'
              ? <Spinner size="xs" color={sc.color} speed="0.7s" />
              : Icon && <Icon boxSize={2.5} color={sc.color} />}
            <Text fontSize="9px" fontWeight="bold" color={sc.color}>{sc.label}</Text>
          </Flex>
        </Flex>

        {/* Quick info row */}
        {result.status === 'malicious' || result.status === 'suspicious' ? (
          <Flex gap={2} flexWrap="wrap" mb={hasDetails ? 2 : 0}>
            {result.malicious > 0 && (
              <Box px={1.5} py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                bg={`${RED}15`} color={RED} border={`1px solid ${RED}30`}>
                {result.malicious} malicious
              </Box>
            )}
            {result.suspicious > 0 && (
              <Box px={1.5} py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                bg={`${ORANGE}15`} color={ORANGE} border={`1px solid ${ORANGE}30`}>
                {result.suspicious} suspicious
              </Box>
            )}
            {result.score !== undefined && (
              <Box px={1.5} py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                bg={`${RED}15`} color={RED} border={`1px solid ${RED}30`}>
                Abuse score: {result.score}%
              </Box>
            )}
            {result.urlCount > 0 && (
              <Box px={1.5} py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                bg={`${ORANGE}15`} color={ORANGE} border={`1px solid ${ORANGE}30`}>
                {result.urlCount} malicious URLs
              </Box>
            )}
          </Flex>
        ) : result.status === 'clean' ? (
          <Text fontSize="11px" color="var(--dash-text-muted)" mb={hasDetails ? 1 : 0}>
            {result.category || result.categories?.[0] || 'No threats detected'}
            {result.score === 0 && ' · Abuse score 0%'}
            {result.urlCount === 0 && ' · No malicious URLs'}
            {result.reputation !== null && result.reputation !== undefined && ` · Rep: ${result.reputation}`}
          </Text>
        ) : result.status === 'no_key' ? (
          <Text fontSize="11px" color="var(--dash-text-muted)">Configure API key in settings below</Text>
        ) : result.status === 'manual' ? (
          <Text fontSize="11px" color="var(--dash-text-muted)">Requires browser — open manually</Text>
        ) : result.detail ? (
          <Text fontSize="10px" color="var(--dash-text-muted)" fontFamily="mono" noOfLines={1}>{result.detail}</Text>
        ) : null}

        {/* Action buttons */}
        <Flex gap={2} mt={3}>
          {result.link && (
            <Link href={result.link} isExternal _hover={{ textDecoration: 'none' }}>
              <Flex align="center" gap={1} px={2.5} py={1} borderRadius="6px" fontSize="10px"
                fontWeight="semibold" cursor="pointer"
                bg={`${vc}12`} border={`1px solid ${vc}30`} color={vc}
                _hover={{ bg: `${vc}22` }} style={{ transition: 'all 0.12s' }}>
                <ExternalLinkIcon boxSize={2.5} />
                {isManual ? 'Check' : 'View'}
              </Flex>
            </Link>
          )}
          {result.submitLink && (
            <Link href={result.submitLink} isExternal _hover={{ textDecoration: 'none' }}>
              <Flex align="center" gap={1} px={2.5} py={1} borderRadius="6px" fontSize="10px"
                fontWeight="semibold" cursor="pointer"
                bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
                color="var(--dash-text-muted)"
                _hover={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                style={{ transition: 'all 0.12s' }}>
                Recategorize
              </Flex>
            </Link>
          )}
          {hasDetails && !isManual && (
            <Box as="button" px={2.5} py={1} borderRadius="6px" fontSize="10px"
              fontWeight="semibold" cursor="pointer"
              bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
              color="var(--dash-text-muted)"
              _hover={{ color: 'white' }}
              style={{ transition: 'all 0.12s' }}
              onClick={() => setOpen(p => !p)}>
              {open ? 'Less ▲' : 'Details ▼'}
            </Box>
          )}
        </Flex>

        {/* Expanded details */}
        <AnimatePresence>
          {open && (
            <MotionBox initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} overflow="hidden">
              <Box mt={3} pt={3} borderTop="1px solid rgba(255,255,255,0.07)">
                {result.categories?.length > 0 && (
                  <Box mb={2}>
                    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wide" mb={1}>Categories</Text>
                    <Flex gap={1} flexWrap="wrap">
                      {result.categories.map(c => (
                        <Box key={c} px={2} py="2px" borderRadius="4px" fontSize="10px"
                          bg={`${ACCENT}12`} color={ACCENT} border={`1px solid ${ACCENT}25`}>{c}</Box>
                      ))}
                    </Flex>
                  </Box>
                )}
                {result.ip && (
                  <Flex align="center" gap={2} mb={1}>
                    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wide" minW="80px">IP</Text>
                    <Text fontSize="11px" color="var(--dash-text-primary)" fontFamily="mono">{result.ip}</Text>
                    <CopyBtn value={result.ip} />
                  </Flex>
                )}
                {result.isp && (
                  <Flex align="center" gap={2} mb={1}>
                    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wide" minW="80px">ISP</Text>
                    <Text fontSize="11px" color="var(--dash-text-primary)">{result.isp}</Text>
                  </Flex>
                )}
                {result.country && (
                  <Flex align="center" gap={2} mb={1}>
                    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wide" minW="80px">Country</Text>
                    <Text fontSize="11px" color="var(--dash-text-primary)">{result.country}</Text>
                  </Flex>
                )}
                {result.threats?.length > 0 && (
                  <Flex align="center" gap={2} mb={1}>
                    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wide" minW="80px">Threats</Text>
                    <Text fontSize="11px" color={RED}>{result.threats.join(', ')}</Text>
                  </Flex>
                )}
                {result.totalReports > 0 && (
                  <Flex align="center" gap={2} mb={1}>
                    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wide" minW="80px">Reports</Text>
                    <Text fontSize="11px" color="var(--dash-text-primary)">{result.totalReports}</Text>
                  </Flex>
                )}
                {result.category && (
                  <Flex align="center" gap={2} mb={1}>
                    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wide" minW="80px">Category</Text>
                    <Text fontSize="11px" color="var(--dash-text-primary)">{result.category}</Text>
                  </Flex>
                )}
                {result.reputation !== null && result.reputation !== undefined && (
                  <Flex align="center" gap={2} mb={1}>
                    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wide" minW="80px">Reputation</Text>
                    <Text fontSize="11px" color="var(--dash-text-primary)">{result.reputation}</Text>
                  </Flex>
                )}
                {typeof result.blacklists === 'object' && Object.keys(result.blacklists).length > 0 && (
                  <Box mt={1}>
                    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wide" mb={1}>Blacklists</Text>
                    {Object.entries(result.blacklists).map(([k, v]) => (
                      <Flex key={k} align="center" gap={2} mb="2px">
                        <Box w="5px" h="5px" borderRadius="full" flexShrink={0}
                          bg={v === 'listed' ? RED : GREEN} />
                        <Text fontSize="10px" color="var(--dash-text-muted)">{k}:</Text>
                        <Text fontSize="10px" color={v === 'listed' ? RED : GREEN} fontWeight="semibold">{v}</Text>
                      </Flex>
                    ))}
                  </Box>
                )}
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>
    </MotionBox>
  );
};

// ── Classifier output panel ───────────────────────────────────────────────────
const ClassifierPanel = ({ result }) => {
  if (!result) return null;
  const color = result.status === 'done' ? GREEN : result.status === 'timeout' ? ORANGE : RED;
  return (
    <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      borderRadius="12px" overflow="hidden"
      bg="var(--dash-card-bg)" border={`1px solid ${color}30`} pos="relative" mt={5}>
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
      <Flex align="center" gap={2} px={4} pt={4} pb={2}>
        <Box w="3px" h="12px" borderRadius="full" bg={color} />
        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
          textTransform="uppercase" letterSpacing="wider">KaynRO/Classifier Output</Text>
        <Box px="7px" py="1px" borderRadius="20px" bg={`${color}15`} border={`1px solid ${color}30`}>
          <Text fontSize="9px" fontWeight="bold" color={color}>{result.status}</Text>
        </Box>
      </Flex>
      {result.output && (
        <Box px={4} pb={4}>
          <Box bg="rgba(0,0,0,0.4)" borderRadius="8px" px={3} py={3}
            border="1px solid rgba(255,255,255,0.06)" maxH="320px" overflowY="auto"
            css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)' } }}>
            <Text fontSize="11px" fontFamily="'Fira Code', monospace" color={color}
              whiteSpace="pre-wrap" wordBreak="break-all">{result.output}</Text>
          </Box>
        </Box>
      )}
      {result.detail && (
        <Box px={4} pb={4}>
          <Text fontSize="11px" color="var(--dash-text-muted)" fontFamily="mono">{result.detail}</Text>
        </Box>
      )}
    </MotionBox>
  );
};

// ── Main View ─────────────────────────────────────────────────────────────────
const DomainCatView = () => {
  const [domain,         setDomain]         = useState('');
  const [results,        setResults]        = useState(null);
  const [classifierOut,  setClassifierOut]  = useState(null);
  const [checking,       setChecking]       = useState(false);
  const [checkedDomain,  setCheckedDomain]  = useState('');
  const [showSettings,   setShowSettings]   = useState(false);

  // Settings stored in localStorage
  const [vtKey,           setVtKey]          = useState(() => localStorage.getItem('dc_vt_key')     || '');
  const [abuseKey,        setAbuseKey]       = useState(() => localStorage.getItem('dc_abuse_key')  || '');
  const [classifierPath,  setClassifierPath] = useState(() => localStorage.getItem('dc_clf_path')   || '');

  const saveSettings = () => {
    localStorage.setItem('dc_vt_key',    vtKey);
    localStorage.setItem('dc_abuse_key', abuseKey);
    localStorage.setItem('dc_clf_path',  classifierPath);
    setShowSettings(false);
  };

  const check = async () => {
    if (!domain.trim() || checking) return;
    setChecking(true);
    setResults(null);
    setClassifierOut(null);
    setCheckedDomain(domain.trim());

    try {
      const res = await fetch(`${API_BASE}/api/domain-cat/check`, {
        method:  'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          domain:         domain.trim(),
          vtKey:          vtKey  || undefined,
          abuseKey:       abuseKey || undefined,
          classifierPath: classifierPath || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.results || []);
      setClassifierOut(data.classifierResult || null);
    } catch (e) {
      setResults([]);
    } finally {
      setChecking(false);
    }
  };

  const malicious  = results?.filter(r => r.status === 'malicious').length  || 0;
  const suspicious = results?.filter(r => r.status === 'suspicious').length || 0;
  const clean      = results?.filter(r => r.status === 'clean').length      || 0;
  const autoResults = results?.filter(r => r.status !== 'manual') || [];
  const manualResults = results?.filter(r => r.status === 'manual') || [];

  const inputSx = {
    bg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: '8px', color: 'var(--dash-text-primary)', fontSize: 'sm',
    _placeholder: { color: 'var(--dash-text-muted)' },
    _hover: { borderColor: `${ACCENT}50` },
    _focus: { borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}40` },
  };

  return (
    <Box pb={12}>

      {/* ── Header ── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Domain Categorization <Text as="span" color="red.400">Checker</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Check domain reputation and categorization across security vendors ·{' '}
            <Link href="https://github.com/KaynRO/classifier" isExternal color={ACCENT} fontSize="12px">
              KaynRO/classifier <ExternalLinkIcon boxSize={2.5} />
            </Link>
          </Text>
        </Box>
        <Tooltip label="API Keys & Classifier Settings" fontSize="10px">
          <IconButton icon={<SettingsIcon boxSize={4} />} size="sm" variant="ghost"
            color={showSettings ? ACCENT : 'var(--dash-text-muted)'}
            bg={showSettings ? `${ACCENT}15` : 'transparent'}
            border={`1px solid ${showSettings ? ACCENT + '40' : 'transparent'}`}
            borderRadius="8px" _hover={{ color: ACCENT }}
            aria-label="Settings" onClick={() => setShowSettings(p => !p)} />
        </Tooltip>
      </Flex>

      {/* ── Settings panel ── */}
      <Collapse in={showSettings} animateOpacity>
        <MotionBox mb={5} px={5} py={4} borderRadius="14px"
          bg="var(--dash-card-bg)" border={`1px solid ${ACCENT}30`} pos="relative" overflow="hidden">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />
          <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wide" mb={4}>Configuration</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={4}>
            <Box>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wide" mb={1.5}>VirusTotal API Key</Text>
              <Input value={vtKey} onChange={e => setVtKey(e.target.value)}
                placeholder="VT API key (free tier works)" size="sm" type="password" {...inputSx} />
            </Box>
            <Box>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wide" mb={1.5}>AbuseIPDB API Key</Text>
              <Input value={abuseKey} onChange={e => setAbuseKey(e.target.value)}
                placeholder="AbuseIPDB API key" size="sm" type="password" {...inputSx} />
            </Box>
          </SimpleGrid>
          <Box mb={4}>
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wide" mb={1.5}>
              KaynRO/Classifier Path (optional)
            </Text>
            <Input value={classifierPath} onChange={e => setClassifierPath(e.target.value)}
              placeholder="/opt/classifier/classifier.py" size="sm" fontFamily="mono" {...inputSx} />
            <Text fontSize="10px" color="var(--dash-text-muted)" mt={1}>
              If configured, runs{' '}
              <Text as="span" fontFamily="mono" color={ACCENT}>python3 classifier.py --domain DOMAIN --headless check</Text>
              {' '}and shows full output. Setup:{' '}
              <Link href="https://github.com/KaynRO/classifier" isExternal color={ACCENT}>
                github.com/KaynRO/classifier <ExternalLinkIcon boxSize={2} />
              </Link>
            </Text>
          </Box>
          <Flex gap={2}>
            <Button size="sm" borderRadius="8px" fontWeight="bold"
              bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
              _hover={{ bg: `${ACCENT}35` }} onClick={saveSettings}>
              Save Settings
            </Button>
            <Button size="sm" variant="ghost" borderRadius="8px"
              color="var(--dash-text-muted)" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
          </Flex>
        </MotionBox>
      </Collapse>

      {/* ── Input ── */}
      <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        mb={5} px={5} py={4} borderRadius="14px"
        bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        pos="relative" overflow="hidden">
        <Box pos="absolute" top={0} left={0} right={0} h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />
        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
          textTransform="uppercase" letterSpacing="wide" mb={2}>Domain</Text>
        <Flex gap={3}>
          <Input
            value={domain} onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="example.com" flex={1}
            size="md" fontFamily="mono" fontSize="13px" {...inputSx}
            h="42px" px={4} border="1px solid rgba(255,255,255,0.08)"
          />
          <Button h="42px" px={6} borderRadius="10px" fontWeight="bold" fontSize="13px"
            leftIcon={checking ? <Spinner size="xs" /> : <SearchIcon boxSize={3} />}
            bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
            color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
            isDisabled={!domain.trim() || checking}
            onClick={check}>
            {checking ? 'Checking…' : 'Check'}
          </Button>
        </Flex>
        <Flex gap={4} mt={3} flexWrap="wrap">
          {[
            { label: '3 auto-checked vendors (no key)', color: GREEN  },
            { label: 'VirusTotal + AbuseIPDB (API key)', color: BLUE   },
            { label: '7 manual check links', color: ORANGE },
            { label: 'KaynRO/Classifier if configured', color: ACCENT },
          ].map(t => (
            <Flex key={t.label} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={t.color} flexShrink={0} />
              <Text fontSize="10px" color="var(--dash-text-muted)">{t.label}</Text>
            </Flex>
          ))}
        </Flex>
      </MotionBox>

      {/* ── Results ── */}
      <AnimatePresence>
        {results && (
          <MotionBox key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* Stats */}
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={5}>
              <StatCard label="Domain Checked" value={checkedDomain} color={ACCENT} />
              <StatCard label="Malicious"       value={malicious}     color={RED}    />
              <StatCard label="Suspicious"      value={suspicious}    color={ORANGE} />
              <StatCard label="Clean"           value={clean}         color={GREEN}  />
            </SimpleGrid>

            {/* Auto-checked vendors */}
            {autoResults.length > 0 && (
              <Box mb={5}>
                <Flex align="center" gap={2} mb={3}>
                  <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
                  <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                    textTransform="uppercase" letterSpacing="wider">Automated Checks</Text>
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                  {autoResults.map(r => <VendorCard key={r.vendor} result={r} />)}
                </SimpleGrid>
              </Box>
            )}

            {/* Manual check vendors */}
            {manualResults.length > 0 && (
              <Box mb={5}>
                <Flex align="center" gap={2} mb={3}>
                  <Box w="3px" h="12px" borderRadius="full" bg={BLUE} />
                  <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                    textTransform="uppercase" letterSpacing="wider">Manual Check</Text>
                  <Text fontSize="10px" color="var(--dash-text-muted)">
                    — browser automation required, links pre-filled with your domain
                  </Text>
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                  {manualResults.map(r => <VendorCard key={r.vendor} result={r} />)}
                </SimpleGrid>
              </Box>
            )}

            {/* Classifier output */}
            <ClassifierPanel result={classifierOut} />
          </MotionBox>
        )}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {!results && !checking && (
        <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          textAlign="center" py={14} borderRadius="14px"
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
          <Flex w="52px" h="52px" borderRadius="14px" mx="auto" mb={4}
            bg={`${ACCENT}12`} border={`1px solid ${ACCENT}30`}
            align="center" justify="center">
            <SearchIcon boxSize={5} color={ACCENT} />
          </Flex>
          <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)" mb={1}>
            Enter a domain to check
          </Text>
          <Text fontSize="12px" color="var(--dash-text-muted)" maxW="440px" mx="auto">
            Checks VirusTotal, AbuseIPDB, URLhaus, Talos and provides direct links to BlueCoat, McAfee, BrightCloud, Palo Alto and more.
            Optionally runs KaynRO/classifier for full browser-automated checks.
          </Text>
        </MotionBox>
      )}
    </Box>
  );
};

export default DomainCatView;
