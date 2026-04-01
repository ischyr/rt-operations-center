import { useState, useCallback, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, Input, InputGroup, InputLeftElement,
  InputRightElement, IconButton, Spinner, SimpleGrid, Button,
  Table, Thead, Tbody, Tr, Th, Td, Tooltip, Tag, Divider,
} from '@chakra-ui/react';
import {
  SearchIcon, CloseIcon, DeleteIcon, CopyIcon, CheckIcon,
  RepeatIcon, ChevronDownIcon, ChevronUpIcon, InfoIcon,
} from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT = '#9F7AEA';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const ORANGE = '#F6AD55';
const CYAN   = '#76E4F7';
const RED    = '#FC8181';
const YELLOW = '#ECC94B';

// ── API ───────────────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// ── Cache helpers ─────────────────────────────────────────────────────────────
const cacheKey  = (slug) => `recon_cache_${slug}`;
const loadCache = (slug) => { try { return JSON.parse(localStorage.getItem(cacheKey(slug)) || '{}'); } catch { return {}; } };
const saveCache = (slug, data) => localStorage.setItem(cacheKey(slug), JSON.stringify(data));

const DNS_TYPES  = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'];
const DNS_COLORS = { A: GREEN, AAAA: CYAN, MX: BLUE, TXT: ORANGE, NS: ACCENT, CNAME: '#A0AEC0', SOA: '#718096' };

const fmtRelative = (iso) => {
  if (!iso) return '';
  const diff  = Date.now() - new Date(iso);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const extractWhois = (data) => {
  if (!data) return {};
  return {
    name:        data.ldhName || data.unicodeName || '',
    status:      Array.isArray(data.status) ? data.status.join(', ') : data.status || '',
    registered:  data.events?.find(e => e.eventAction === 'registration')?.eventDate,
    expires:     data.events?.find(e => e.eventAction === 'expiration')?.eventDate,
    updated:     data.events?.find(e => e.eventAction === 'last changed')?.eventDate,
    registrar:   data.entities?.find(e => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3] || '',
    nameservers: (data.nameservers || []).map(n => n.ldhName || n.unicodeName).filter(Boolean),
  };
};

// ── Info banner ───────────────────────────────────────────────────────────────
const InfoBanner = () => (
  <Box mb={5} px={4} py={3} borderRadius="10px"
    bg="rgba(159,122,234,0.07)" border="1px solid rgba(159,122,234,0.25)">
    <Flex align="center" gap={2} mb={2}>
      <InfoIcon boxSize={3} color={ACCENT} />
      <Text fontSize="10px" fontWeight="bold" color={ACCENT}
        textTransform="uppercase" letterSpacing="wider">
        Passive Recon — No active scanning
      </Text>
    </Flex>
    <Flex gap={4} flexWrap="wrap">
      {[
        'DNS records via Google DoH (A, AAAA, MX, TXT, NS, CNAME, SOA)',
        'WHOIS / RDAP registration data',
        'ASN & IP range via iptoasn.com',
        'Certificate transparency via crt.sh',
      ].map(t => (
        <Flex key={t} align="center" gap={1.5}>
          <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
          <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
        </Flex>
      ))}
    </Flex>
  </Box>
);

// ── Copy button ───────────────────────────────────────────────────────────────
const CopyBtn = ({ value }) => {
  const [ok, setOk] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value).then(() => { setOk(true); setTimeout(() => setOk(false), 1800); }); };
  return (
    <Tooltip label={ok ? 'Copied!' : 'Copy'} fontSize="10px">
      <IconButton icon={ok ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
        size="xs" variant="ghost" color={ok ? GREEN : 'var(--dash-text-muted)'}
        borderRadius="6px" minW="24px" h="24px"
        _hover={{ color: ok ? GREEN : 'white', bg: 'rgba(255,255,255,0.06)' }}
        aria-label="copy" onClick={copy} />
    </Tooltip>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, delay = 0 }) => (
  <MotionBox
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay }}
    px={4} py={3} borderRadius="12px" bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Text fontSize="22px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
    <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{label}</Text>
  </MotionBox>
);

// ── Result banner ─────────────────────────────────────────────────────────────
const ResultBanner = ({ domain, cur, onRerun, rerunning }) => {
  const aCount    = cur.dns?.A?.length      || 0;
  const mxCount   = cur.dns?.MX?.length     || 0;
  const txtCount  = cur.dns?.TXT?.length    || 0;
  const certCount = cur.certs?.length       || 0;
  const totalDns  = Object.values(cur.dns || {}).flat().length;

  return (
    <MotionBox
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      px={5} py={4} borderRadius="14px" mb={5}
      bg="rgba(159,122,234,0.07)" border="1px solid rgba(159,122,234,0.28)"
      pos="relative" overflow="hidden">
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />
      <Flex align="center" gap={4} justify="space-between" flexWrap="wrap">
        <Flex align="center" gap={3}>
          <Flex w="42px" h="42px" borderRadius="10px" flexShrink={0}
            bg={`${ACCENT}18`} border={`1px solid ${ACCENT}40`}
            align="center" justify="center">
            <SearchIcon boxSize={4} color={ACCENT} />
          </Flex>
          <Box>
            <Flex align="center" gap={2} flexWrap="wrap" mb={0.5}>
              <Text fontSize="15px" fontWeight="bold" color="var(--dash-text-primary)"
                fontFamily="monospace">{domain}</Text>
              {[
                { l: 'A',     v: aCount,    c: GREEN  },
                { l: 'MX',    v: mxCount,   c: BLUE   },
                { l: 'TXT',   v: txtCount,  c: ORANGE },
                { l: 'Certs', v: certCount, c: ACCENT },
              ].map(s => (
                <Box key={s.l} px={2} py="1px" borderRadius="4px"
                  bg={`${s.c}15`} border={`1px solid ${s.c}35`}>
                  <Text fontSize="9px" fontWeight="bold" color={s.c}>{s.v} {s.l}</Text>
                </Box>
              ))}
              {cur.fetchedAt && (
                <Flex align="center" gap={1} px={2} py="1px" borderRadius="4px"
                  bg="rgba(255,255,255,0.07)" border="1px solid rgba(255,255,255,0.12)">
                  <Text fontSize="9px" color="var(--dash-text-muted)" fontWeight="bold">
                    {fmtRelative(cur.fetchedAt)}
                  </Text>
                </Flex>
              )}
            </Flex>
            <Text fontSize="11px" color="var(--dash-text-secondary)">
              {totalDns} DNS records · {certCount} certificate{certCount !== 1 ? 's' : ''}
            </Text>
          </Box>
        </Flex>
        <Button size="sm" leftIcon={<RepeatIcon />} variant="ghost"
          color="var(--dash-text-muted)" borderRadius="8px"
          border="1px solid rgba(255,255,255,0.1)"
          _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
          isLoading={rerunning} loadingText="Running…"
          onClick={onRerun}>
          Re-run
        </Button>
      </Flex>
    </MotionBox>
  );
};

// ── Collapsible section ───────────────────────────────────────────────────────
const Section = ({ title, color, count, badge, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box mb={5}>
      <Flex align="center" justify="space-between" cursor="pointer" mb={open ? 3 : 0}
        onClick={() => setOpen(v => !v)} role="button" userSelect="none"
        _hover={{ opacity: 0.85 }}>
        <Flex align="center" gap={2}>
          <Box w="3px" h="14px" borderRadius="full" bg={color} />
          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider">{title}</Text>
          {count !== undefined && (
            <Box px="7px" py="1px" borderRadius="4px" bg={`${color}12`} border={`1px solid ${color}30`}>
              <Text fontSize="9px" fontWeight="bold" color={color}>{count}</Text>
            </Box>
          )}
          {badge && badge}
        </Flex>
        <Box color="var(--dash-text-muted)">
          {open ? <ChevronUpIcon boxSize={3.5} /> : <ChevronDownIcon boxSize={3.5} />}
        </Box>
      </Flex>
      <AnimatePresence initial={false}>
        {open && (
          <MotionBox key="content"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
            overflow="hidden">
            {children}
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
};

// ── DNS table ─────────────────────────────────────────────────────────────────
const DnsTable = ({ records }) => {
  if (!records?.length) return (
    <Text fontSize="11px" color="var(--dash-text-muted)" px={2} py={1}>No records found.</Text>
  );
  return (
    <Table size="sm" variant="unstyled">
      <Thead>
        <Tr>
          <Th color="var(--dash-text-muted)" fontSize="9px" letterSpacing="widest"
            textTransform="uppercase" pb={1} w="30%">Name</Th>
          <Th color="var(--dash-text-muted)" fontSize="9px" letterSpacing="widest"
            textTransform="uppercase" pb={1} w="12%">TTL</Th>
          <Th color="var(--dash-text-muted)" fontSize="9px" letterSpacing="widest"
            textTransform="uppercase" pb={1}>Data</Th>
          <Th w="28px" />
        </Tr>
      </Thead>
      <Tbody>
        {records.map((r, i) => (
          <Tr key={i} borderBottom="1px solid rgba(255,255,255,0.03)">
            <Td py={1} fontSize="10px" color="var(--dash-text-secondary)" fontFamily="monospace"
              maxW="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{r.name || '—'}</Td>
            <Td py={1} fontSize="10px" color="var(--dash-text-muted)">{r.TTL || '—'}</Td>
            <Td py={1} fontSize="11px" color="var(--dash-text-primary)" fontFamily="monospace"
              wordBreak="break-all" lineHeight="1.5">{r.data || '—'}</Td>
            <Td py={1}><CopyBtn value={r.data || ''} /></Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

// ── KV row ────────────────────────────────────────────────────────────────────
const KVRow = ({ label, value }) => {
  if (!value) return null;
  const d = Array.isArray(value) ? value.join(', ') : String(value);
  return (
    <Flex py="4px" borderBottom="1px solid rgba(255,255,255,0.04)" gap={2} align="flex-start">
      <Text fontSize="10px" color="var(--dash-text-muted)" w="110px" flexShrink={0} mt="1px">{label}</Text>
      <Text fontSize="11px" color="var(--dash-text-primary)" fontFamily="monospace" flex="1" wordBreak="break-all">{d}</Text>
      <CopyBtn value={d} />
    </Flex>
  );
};

// ── History item ──────────────────────────────────────────────────────────────
const HistoryItem = ({ item, onSelect, onDelete, isActive }) => {
  const aCount    = item.dns?.A?.length   || 0;
  const mxCount   = item.dns?.MX?.length  || 0;
  const certCount = item.certs?.length    || 0;
  return (
    <MotionBox
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      px={3} py={2.5} borderRadius="8px" cursor="pointer"
      bg={isActive ? `${ACCENT}12` : 'rgba(255,255,255,0.03)'}
      border={isActive ? `1px solid ${ACCENT}40` : '1px solid rgba(255,255,255,0.07)'}
      _hover={{ bg: isActive ? `${ACCENT}16` : 'rgba(255,255,255,0.06)', borderColor: `${ACCENT}40` }}
      style={{ transition: 'all 0.12s' }}
      onClick={() => onSelect(item)}>
      <Flex align="center" justify="space-between" gap={2}>
        <Box flex={1} minW={0}>
          <Text fontSize="11px" fontWeight="semibold" color="var(--dash-text-primary)"
            noOfLines={1} fontFamily="monospace">{item.domain}</Text>
          <Flex align="center" gap={2} mt={0.5} flexWrap="wrap">
            {[
              { l: 'A',    v: aCount,    c: GREEN  },
              { l: 'MX',   v: mxCount,   c: BLUE   },
              { l: 'CRT',  v: certCount, c: ACCENT },
            ].map(s => (
              <Box key={s.l} px={1.5} py="1px" borderRadius="3px"
                bg={`${s.c}10`} border={`1px solid ${s.c}25`}>
                <Text fontSize="8px" fontWeight="bold" color={s.c}>{s.v} {s.l}</Text>
              </Box>
            ))}
            <Text fontSize="9px" color="var(--dash-text-muted)" ml="auto">
              {fmtRelative(item.fetchedAt)}
            </Text>
          </Flex>
        </Box>
        <IconButton icon={<DeleteIcon boxSize={2.5} />} size="xs" variant="ghost"
          color="var(--dash-text-muted)" _hover={{ color: RED }}
          aria-label="Delete"
          onClick={e => { e.stopPropagation(); onDelete(item.domain); }} />
      </Flex>
    </MotionBox>
  );
};

// ── Main view ─────────────────────────────────────────────────────────────────
const DomainReconView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const eng           = getBySlug(slug);

  const [query,     setQuery]     = useState('');
  const [cache,     setCache]     = useState(() => loadCache(slug));
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    const c = loadCache(slug);
    setCache(c); setSelected(null);
  }, [slug]);

  const runRecon = useCallback(async (domain, isRerun = false) => {
    if (!domain) return;
    if (isRerun) setRerunning(true); else setLoading(true);
    setError('');
    const hdr = authHeaders();
    try {
      const dnsPromises = DNS_TYPES.map(t =>
        fetch(`${API_BASE}/api/recon/dns?domain=${encodeURIComponent(domain)}&type=${t}`, { headers: hdr })
          .then(r => r.json()).then(data => ({ type: t, data })).catch(() => ({ type: t, data: null }))
      );
      const [whoisRes, asnRes, certsRes, ...dnsResults] = await Promise.all([
        fetch(`${API_BASE}/api/recon/whois?domain=${encodeURIComponent(domain)}`, { headers: hdr }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/recon/asn?domain=${encodeURIComponent(domain)}`, { headers: hdr }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/recon/certs?domain=${encodeURIComponent(domain)}`, { headers: hdr }).then(r => r.json()).catch(() => null),
        ...dnsPromises,
      ]);
      const dns = {};
      dnsResults.forEach(({ type, data }) => { dns[type] = data?.Answer || []; });
      const result = { domain, fetchedAt: new Date().toISOString(), dns, whois: whoisRes, asn: asnRes, certs: Array.isArray(certsRes) ? certsRes : [] };
      const updated = { ...loadCache(slug), [domain]: result };
      setCache(updated); saveCache(slug, updated); setSelected(domain);
    } catch (e) { setError(e.message || 'Recon failed'); }
    finally { if (isRerun) setRerunning(false); else setLoading(false); }
  }, [slug]);

  const deleteDomain = (d) => {
    const updated = { ...cache }; delete updated[d];
    setCache(updated); saveCache(slug, updated);
    if (selected === d) setSelected(null);
  };

  const cur     = selected ? cache[selected] : null;
  const history = Object.values(cache).sort((a, b) => new Date(b.fetchedAt) - new Date(a.fetchedAt));

  if (!eng) return null;

  return (
    <Box px={6} pb={12}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Domain <Text as="span" color="red.400">Recon</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · WHOIS, DNS, ASN &amp; certificate transparency via{' '}
            <Text as="span" color={ACCENT} fontWeight="semibold">passive sources</Text>
          </Text>
        </Box>
      </Flex>

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <InfoBanner />

      {/* ── Main layout ──────────────────────────────────────────────────────── */}
      <Flex gap={6} align="flex-start" direction={{ base: 'column', xl: 'row' }}>

        {/* ── Left: search + results ─────────────────────────────────────────── */}
        <Box flex={1} minW={0}>

          {/* Search bar */}
          <Box mb={5}>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none" pl={1}>
                {loading
                  ? <Spinner size="xs" color={ACCENT} />
                  : <SearchIcon boxSize={4} color="var(--dash-text-muted)" />}
              </InputLeftElement>
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const d = query.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*/, '');
                    if (d) { setQuery(''); runRecon(d); }
                  }
                }}
                placeholder="example.com"
                bg="var(--dash-card-bg)" borderColor="var(--dash-card-border)"
                borderRadius="10px" color="var(--dash-text-primary)"
                fontSize="sm" fontFamily="monospace"
                _placeholder={{ color: 'var(--dash-text-muted)', fontFamily: 'sans-serif' }}
                _hover={{ borderColor: `${ACCENT}60` }}
                _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}55` }}
                pr={query ? '116px' : '44px'}
              />
              {query && (
                <InputRightElement w="116px">
                  <Flex gap={1}>
                    <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                      color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                      aria-label="Clear" onClick={() => setQuery('')} />
                    <Button size="xs" borderRadius="6px" px={3}
                      bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                      _hover={{ bg: `${ACCENT}35` }} fontWeight="bold" fontSize="11px"
                      isLoading={loading}
                      onClick={() => {
                        const d = query.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*/, '');
                        if (d) { setQuery(''); runRecon(d); }
                      }}>
                      Run Recon
                    </Button>
                  </Flex>
                </InputRightElement>
              )}
            </InputGroup>
          </Box>

          {/* Loading state */}
          <AnimatePresence>
            {loading && (
              <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                mb={5} px={5} py={6} borderRadius="14px" textAlign="center"
                bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
                <Flex direction="column" align="center" gap={3}>
                  <Spinner size="lg" color={ACCENT} thickness="2px" />
                  <Text fontSize="13px" color="var(--dash-text-secondary)" fontWeight="semibold">
                    Running recon…
                  </Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)">
                    Fetching DNS, WHOIS, ASN and certificate data in parallel
                  </Text>
                </Flex>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && !loading && (
              <MotionBox initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} mb={5} px={4} py={3} borderRadius="10px"
                bg="rgba(252,129,129,0.07)" border="1px solid rgba(252,129,129,0.3)">
                <Text fontSize="12px" color={RED}>{error}</Text>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!loading && !cur && !error && (
            <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              px={5} py={10} borderRadius="14px" textAlign="center"
              bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
              <Flex direction="column" align="center" gap={3}>
                <Flex w="44px" h="44px" borderRadius="12px"
                  bg={`${ACCENT}12`} border={`1px solid ${ACCENT}25`}
                  align="center" justify="center">
                  <SearchIcon boxSize={5} color={ACCENT} />
                </Flex>
                <Box>
                  <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-secondary)">
                    Enter a domain to begin recon
                  </Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>
                    Runs DNS, WHOIS, ASN and certificate lookups in parallel — all passive
                  </Text>
                </Box>
              </Flex>
            </MotionBox>
          )}

          {/* Results */}
          <AnimatePresence mode="wait">
            {!loading && cur && (
              <MotionBox key={selected}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>

                {/* Result banner */}
                <ResultBanner
                  domain={selected} cur={cur}
                  onRerun={() => runRecon(selected, true)}
                  rerunning={rerunning}
                />

                {/* Stat cards */}
                <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={6}>
                  <StatCard label="A Records"   value={cur.dns?.A?.length      || 0} color={GREEN}  delay={0}    />
                  <StatCard label="MX Records"  value={cur.dns?.MX?.length     || 0} color={BLUE}   delay={0.05} />
                  <StatCard label="TXT Records" value={cur.dns?.TXT?.length    || 0} color={ORANGE} delay={0.1}  />
                  <StatCard label="Certificates" value={cur.certs?.length      || 0} color={ACCENT} delay={0.15} />
                </SimpleGrid>

                {/* ── DNS Records ── */}
                <Section title="DNS Records" color={GREEN}
                  count={Object.values(cur.dns || {}).flat().length}>
                  <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                    borderRadius="12px" overflow="hidden">
                    {DNS_TYPES.map((type, ti) => {
                      const records = cur.dns?.[type] || [];
                      const spf     = type === 'TXT' ? records.filter(r => r.data?.toLowerCase().startsWith('v=spf'))   : [];
                      const dmarc   = type === 'TXT' ? records.filter(r => r.data?.toLowerCase().startsWith('v=dmarc')) : [];
                      return (
                        <Box key={type}
                          borderBottom={ti < DNS_TYPES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}>
                          <Flex align="center" gap={2} px={3} py={2} bg="rgba(255,255,255,0.02)">
                            <Box px="6px" py="1px" borderRadius="4px"
                              bg={`${DNS_COLORS[type]}15`} border={`1px solid ${DNS_COLORS[type]}35`}>
                              <Text fontSize="9px" fontWeight="bold" color={DNS_COLORS[type]}>{type}</Text>
                            </Box>
                            <Text fontSize="10px" color="var(--dash-text-muted)">
                              {records.length} record{records.length !== 1 ? 's' : ''}
                            </Text>
                            {spf.length   > 0 && <Tag size="sm" colorScheme="blue"   fontSize="9px" py={0} px={2}>SPF</Tag>}
                            {dmarc.length > 0 && <Tag size="sm" colorScheme="purple" fontSize="9px" py={0} px={2}>DMARC</Tag>}
                          </Flex>
                          {records.length > 0 && (
                            <Box px={3} pb={2}><DnsTable records={records} /></Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Section>

                <Divider borderColor="var(--dash-card-border)" my={4} />

                {/* ── WHOIS + ASN side by side ── */}
                <Flex gap={4} mb={5} align="flex-start" flexWrap="wrap">
                  <Box flex="1" minW="220px">
                    <Section title="WHOIS / RDAP" color={BLUE}>
                      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                        borderRadius="12px" p={3}>
                        {cur.whois ? (() => {
                          const f = extractWhois(cur.whois);
                          return (
                            <>
                              <KVRow label="Domain"       value={f.name} />
                              <KVRow label="Status"       value={f.status} />
                              <KVRow label="Registrar"    value={f.registrar} />
                              <KVRow label="Registered"   value={f.registered ? new Date(f.registered).toLocaleDateString() : null} />
                              <KVRow label="Expires"      value={f.expires    ? new Date(f.expires).toLocaleDateString()    : null} />
                              <KVRow label="Updated"      value={f.updated    ? new Date(f.updated).toLocaleDateString()    : null} />
                              <KVRow label="Name Servers" value={f.nameservers?.join('\n')} />
                            </>
                          );
                        })() : <Text fontSize="11px" color="var(--dash-text-muted)">No WHOIS data.</Text>}
                      </Box>
                    </Section>
                  </Box>
                  <Box flex="1" minW="200px">
                    <Section title="ASN Info" color={CYAN}>
                      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                        borderRadius="12px" p={3}>
                        {cur.asn ? (
                          <>
                            <KVRow label="IP Address" value={cur.asn.ip} />
                            <KVRow label="AS Number"  value={cur.asn.announced ? `AS${cur.asn.as_number}` : null} />
                            <KVRow label="AS Name"    value={cur.asn.as_description} />
                            <KVRow label="Country"    value={cur.asn.as_country_code} />
                            <KVRow label="Announced"  value={cur.asn.announced ? 'Yes' : 'No'} />
                            <KVRow label="IP Range"   value={cur.asn.first_ip && cur.asn.last_ip ? `${cur.asn.first_ip} – ${cur.asn.last_ip}` : null} />
                          </>
                        ) : <Text fontSize="11px" color="var(--dash-text-muted)">No ASN data.</Text>}
                      </Box>
                    </Section>
                  </Box>
                </Flex>

                <Divider borderColor="var(--dash-card-border)" my={4} />

                {/* ── Certificates ── */}
                <Section title="Certificate Transparency" color={ACCENT} count={cur.certs.length}>
                  {cur.certs.length === 0 ? (
                    <Text fontSize="11px" color="var(--dash-text-muted)">No certificates found.</Text>
                  ) : (
                    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                      borderRadius="12px" overflow="hidden">
                      {cur.certs.map((c, i) => (
                        <MotionBox key={i}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ duration: 0.1, delay: Math.min(i * 0.006, 0.3) }}
                          px={3} py={2}
                          borderBottom={i < cur.certs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                          _hover={{ bg: 'rgba(255,255,255,0.025)' }}>
                          <Flex align="center" justify="space-between" gap={2}>
                            <Text fontSize="11px" color="var(--dash-text-primary)"
                              fontFamily="monospace" noOfLines={1} flex={1}>
                              {c.common_name}
                            </Text>
                            <Flex gap={2} align="center" flexShrink={0}>
                              {c.not_after && (
                                <Text fontSize="9px" color={
                                  new Date(c.not_after) < new Date() ? RED :
                                  new Date(c.not_after) < new Date(Date.now() + 30*24*60*60*1000) ? YELLOW :
                                  'var(--dash-text-muted)'
                                }>
                                  exp {c.not_after?.slice(0, 10)}
                                </Text>
                              )}
                              <CopyBtn value={c.common_name} />
                            </Flex>
                          </Flex>
                          <Text fontSize="9px" color="var(--dash-text-muted)" noOfLines={1}>
                            {c.issuer_name?.split('O=')[1]?.split(',')[0] || c.issuer_name}
                          </Text>
                        </MotionBox>
                      ))}
                    </Box>
                  )}
                </Section>

                {/* Raw RDAP (collapsed) */}
                {cur.whois && (
                  <>
                    <Divider borderColor="var(--dash-card-border)" my={4} />
                    <Section title="Raw RDAP Response" color="var(--dash-text-muted)" defaultOpen={false}>
                      <Box bg="rgba(0,0,0,0.35)" borderRadius="10px"
                        border="1px solid rgba(255,255,255,0.06)"
                        fontSize="10px" fontFamily="monospace" color="var(--dash-text-secondary)"
                        whiteSpace="pre-wrap" wordBreak="break-all" p={3} lineHeight="1.6">
                        {JSON.stringify(cur.whois, null, 2)}
                      </Box>
                    </Section>
                  </>
                )}

              </MotionBox>
            )}
          </AnimatePresence>
        </Box>

        {/* ── Right: history sidebar ────────────────────────────────────────── */}
        <Box w={{ base: '100%', xl: '280px' }} flexShrink={0}>
          <Flex align="center" gap={2} mb={3}>
            <Box w="3px" h="14px" borderRadius="full" bg={ACCENT} />
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider">
              Recon History
            </Text>
            {history.length > 0 && (
              <Box ml="auto" px="7px" py="1px" borderRadius="20px"
                bg={`${ACCENT}12`} border={`1px solid ${ACCENT}25`}>
                <Text fontSize="10px" fontWeight="bold" color={ACCENT}>{history.length}</Text>
              </Box>
            )}
          </Flex>

          {history.length === 0 ? (
            <Box px={4} py={6} borderRadius="10px" textAlign="center"
              bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
              <Text fontSize="12px" color="var(--dash-text-muted)">No recon history yet</Text>
            </Box>
          ) : (
            <Flex direction="column" gap={1.5}>
              {history.map(item => (
                <HistoryItem
                  key={item.domain}
                  item={item}
                  isActive={selected === item.domain}
                  onSelect={i => setSelected(i.domain)}
                  onDelete={deleteDomain}
                />
              ))}
            </Flex>
          )}
        </Box>

      </Flex>
    </Box>
  );
};

export default DomainReconView;
