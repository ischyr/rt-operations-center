import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Input, InputGroup, InputLeftElement,
  InputRightElement, IconButton, Spinner, SimpleGrid, Button,
  Badge,
} from '@chakra-ui/react';
import {
  SearchIcon, CloseIcon, CheckIcon, RepeatIcon, DeleteIcon,
  InfoIcon, SettingsIcon, WarningTwoIcon, CopyIcon, DownloadIcon,
} from '@chakra-ui/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE   = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ACCENT     = '#F6AD55';
const GREEN      = '#68D391';
const RED        = '#FC8181';
const BLUE       = '#63B3ED';
const PURPLE     = '#9F7AEA';
const CACHE_KEY  = (slug) => `emails_cache_${slug}`;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const loadCache = (slug) => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY(slug)) || '{}'); }
  catch { return {}; }
};
const saveCache = (slug, data) =>
  localStorage.setItem(CACHE_KEY(slug), JSON.stringify(data));

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

// ── Info banner ───────────────────────────────────────────────────────────────
const InfoBanner = () => (
  <Box mb={5} px={4} py={3} borderRadius="10px"
    bg="rgba(99,179,237,0.07)" border="1px solid rgba(99,179,237,0.25)">
    <Flex align="center" gap={2} mb={2}>
      <InfoIcon boxSize={3} color={BLUE} />
      <Text fontSize="10px" fontWeight="bold" color={BLUE}
        textTransform="uppercase" letterSpacing="wider">
        IntelX Phonebook
      </Text>
    </Flex>
    <Flex gap={4} flexWrap="wrap">
      {[
        'Searches 268B+ indexed records',
        'Extracts email addresses from certificate & breach data',
        'Results cached locally per engagement',
      ].map(t => (
        <Flex key={t} align="center" gap={1.5}>
          <Box w="4px" h="4px" borderRadius="full" bg={BLUE} flexShrink={0} />
          <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
        </Flex>
      ))}
    </Flex>
  </Box>
);

// ── API key section ───────────────────────────────────────────────────────────
const ApiKeySection = ({ onKeySaved }) => {
  const [open,       setOpen]       = useState(false);
  const [keyVal,     setKeyVal]     = useState('');
  const [masked,     setMasked]     = useState(null);
  const [configured, setConfigured] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState(null);
  const [ok,         setOk]         = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/emails/apikey`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) { setConfigured(data.configured); setMasked(data.masked); }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleSave = async () => {
    if (!keyVal.trim()) return;
    setSaving(true); setErr(null); setOk(false);
    try {
      const res  = await fetch(`${API_BASE}/api/emails/apikey`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ key: keyVal.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setOk(true); setKeyVal(''); setOpen(false);
      await loadStatus();
      onKeySaved?.();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Box mb={5} px={4} py={3} borderRadius="10px"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
      <Flex align="center" justify="space-between" gap={3}>
        <Flex align="center" gap={2}>
          <SettingsIcon boxSize={3} color={ACCENT} />
          <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider">
            IntelX API Key
          </Text>
          {configured ? (
            <Flex align="center" gap={1} px={2} py="1px" borderRadius="4px"
              bg="rgba(104,211,145,0.1)" border="1px solid rgba(104,211,145,0.3)">
              <CheckIcon boxSize={2.5} color={GREEN} />
              <Text fontSize="9px" fontWeight="bold" color={GREEN}>CONFIGURED</Text>
            </Flex>
          ) : (
            <Flex align="center" gap={1} px={2} py="1px" borderRadius="4px"
              bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.3)">
              <WarningTwoIcon boxSize={2.5} color={RED} />
              <Text fontSize="9px" fontWeight="bold" color={RED}>NOT SET</Text>
            </Flex>
          )}
          {configured && masked && (
            <Text fontSize="11px" color="var(--dash-text-muted)"
              fontFamily="monospace">{masked}</Text>
          )}
        </Flex>
        <Button size="xs" variant="ghost" color={ACCENT} borderRadius="6px"
          border={`1px solid ${ACCENT}40`} _hover={{ bg: `${ACCENT}15` }}
          onClick={() => { setOpen(p => !p); setErr(null); setOk(false); }}>
          {open ? 'Cancel' : configured ? 'Update Key' : 'Set Key'}
        </Button>
      </Flex>

      <AnimatePresence>
        {open && (
          <MotionBox initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} overflow="hidden">
            <Flex mt={3} gap={2}>
              <Input value={keyVal} onChange={e => setKeyVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                placeholder="Paste your IntelX API key…"
                type="password" size="sm" borderRadius="8px"
                fontFamily="monospace" fontSize="12px"
                bg="rgba(0,0,0,0.2)" borderColor="var(--dash-card-border)"
                _placeholder={{ color: 'var(--dash-text-muted)' }}
                _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}55` }}
              />
              <Button size="sm" borderRadius="8px" px={4} flexShrink={0}
                bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                _hover={{ bg: `${ACCENT}35` }} fontWeight="bold" fontSize="12px"
                isLoading={saving} loadingText="Saving…"
                onClick={handleSave}>
                Save
              </Button>
            </Flex>
            {err && <Text fontSize="11px" color={RED} mt={1.5}>{err}</Text>}
            {ok  && <Text fontSize="11px" color={GREEN} mt={1.5}>API key saved successfully.</Text>}
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
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
const ResultBanner = ({ domain, count, fetchedAt, onRerun, rerunning }) => (
  <MotionBox
    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    px={5} py={4} borderRadius="14px" mb={5}
    bg="rgba(246,173,85,0.07)" border="1px solid rgba(246,173,85,0.28)"
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
            <Text fontSize="15px" fontWeight="bold" color={ACCENT}>
              {count} email{count !== 1 ? 's' : ''} found
            </Text>
            <Badge fontSize="9px" px={2} py="1px" borderRadius="4px"
              bg={`${PURPLE}20`} color={PURPLE} border={`1px solid ${PURPLE}40`}
              textTransform="uppercase">
              phonebook
            </Badge>
            {fetchedAt && (
              <Flex align="center" gap={1} px={2} py="1px" borderRadius="4px"
                bg="rgba(255,255,255,0.07)" border="1px solid rgba(255,255,255,0.12)">
                <Text fontSize="9px" color="var(--dash-text-muted)" fontWeight="bold">
                  {fmtRelative(fetchedAt)}
                </Text>
              </Flex>
            )}
          </Flex>
          <Text fontSize="12px" color="var(--dash-text-secondary)">
            <Text as="span" fontWeight="semibold" color="var(--dash-text-primary)"
              fontFamily="monospace">{domain}</Text>
          </Text>
        </Box>
      </Flex>
      <Button size="sm" leftIcon={<RepeatIcon />} variant="ghost"
        color="var(--dash-text-muted)" borderRadius="8px"
        border="1px solid rgba(255,255,255,0.1)"
        _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
        isLoading={rerunning} loadingText="Searching…"
        onClick={onRerun}>
        Re-run
      </Button>
    </Flex>
  </MotionBox>
);

// ── Email row (no motion — used inside virtual list) ──────────────────────────
const ITEM_H = 44; // px, must match py below

const EmailRow = ({ email, onCopy, copied, style }) => {
  const [local, domain] = email.split('@');
  return (
    <Box
      px={4} py={2.5} borderRadius="6px"
      bg={copied === email ? 'rgba(246,173,85,0.07)' : 'rgba(246,173,85,0.03)'}
      border="1px solid transparent"
      _hover={{ bg: 'rgba(246,173,85,0.07)', borderColor: `${ACCENT}20` }}
      style={{ transition: 'background 0.12s, border-color 0.12s', ...style }}>
      <Flex align="center" justify="space-between" gap={2}>
        <Flex align="center" gap={2.5} flex={1} minW={0}>
          <Box w="5px" h="5px" borderRadius="full" bg={ACCENT} flexShrink={0} />
          <Text fontSize="12px" fontFamily="monospace" noOfLines={1}>
            <Text as="span" color={ACCENT} fontWeight="semibold">{local}</Text>
            <Text as="span" color="var(--dash-text-muted)">@{domain}</Text>
          </Text>
        </Flex>
        <Flex align="center" gap={1.5} flexShrink={0}>
          {copied === email && (
            <Text fontSize="10px" color={GREEN} fontWeight="600">copied!</Text>
          )}
          <IconButton
            icon={copied === email ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
            size="xs" variant="ghost"
            color={copied === email ? GREEN : 'var(--dash-text-muted)'}
            _hover={{ color: copied === email ? GREEN : 'white' }}
            onClick={() => onCopy(email)}
            aria-label="Copy" />
        </Flex>
      </Flex>
    </Box>
  );
};

// ── Virtual email list ────────────────────────────────────────────────────────
const OVERSCAN   = 8;
const LIST_HEIGHT = 560; // px, scrollable window height

const VirtualEmailList = ({ emails, onCopy, copied }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_H) - OVERSCAN);
  const visible  = Math.ceil(LIST_HEIGHT / ITEM_H) + OVERSCAN * 2;
  const endIdx   = Math.min(emails.length - 1, startIdx + visible);

  const totalH  = emails.length * ITEM_H;
  const offsetY = startIdx * ITEM_H;

  return (
    <Box
      ref={containerRef}
      h={`${LIST_HEIGHT}px`}
      overflowY="auto"
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
      px={2} py={2}
      sx={{ '&::-webkit-scrollbar': { w: '4px' }, '&::-webkit-scrollbar-thumb': { bg: 'rgba(246,173,85,0.3)', borderRadius: '4px' } }}>
      <Box h={`${totalH}px`} pos="relative">
        <Box pos="absolute" top={`${offsetY}px`} left={0} right={0}>
          {emails.slice(startIdx, endIdx + 1).map((email) => (
            <EmailRow key={email} email={email} onCopy={onCopy} copied={copied} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// ── History item ──────────────────────────────────────────────────────────────
const HistoryItem = ({ item, onSelect, onDelete, isActive }) => (
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
        <Flex align="center" gap={2} mt={0.5}>
          <Box w="5px" h="5px" borderRadius="full" flexShrink={0}
            bg={item.emails.length > 0 ? GREEN : 'var(--dash-text-muted)'} />
          <Text fontSize="9px" color="var(--dash-text-muted)">
            {item.emails.length} email{item.emails.length !== 1 ? 's' : ''}
            {' · '}{fmtRelative(item.fetchedAt)}
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

// ── Main view ─────────────────────────────────────────────────────────────────
const EmailsView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const eng           = getBySlug(slug);

  const [query,     setQuery]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [error,     setError]     = useState(null);
  const [pollMsg,   setPollMsg]   = useState('');
  const [cache,     setCache]     = useState(() => loadCache(slug));
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState('');
  const [copied,    setCopied]    = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    const c = loadCache(slug);
    setCache(c); setSelected(null);
  }, [slug]);

  const pollResult = useCallback((id, domain, isRerun = false) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 × 2s = 60s max

    const attempt = async () => {
      attempts++;
      try {
        const r = await fetch(
          `${API_BASE}/api/emails/result?id=${encodeURIComponent(id)}`,
          { headers: authHeaders() }
        );
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Poll failed');

        if (d.status === 2 && attempts < maxAttempts) {
          setPollMsg(`Indexing… ${d.emails?.length || 0} emails found so far`);
          pollRef.current = setTimeout(attempt, 2000);
          return;
        }

        const result = { domain, fetchedAt: new Date().toISOString(), emails: d.emails || [] };
        const updated = { ...loadCache(slug), [domain]: result };
        setCache(updated); saveCache(slug, updated);
        setSelected(domain); setPollMsg('');
      } catch (e) {
        setError(e.message || 'Failed to fetch results');
        setPollMsg('');
      } finally {
        if (attempts >= maxAttempts) { setPollMsg(''); }
        if (isRerun) setRerunning(false); else setLoading(false);
      }
    };

    attempt();
  }, [slug]);

  const doSearch = useCallback(async (domainArg, isRerun = false) => {
    const d = (domainArg || query).trim().toLowerCase()
      .replace(/^https?:\/\//, '').replace(/\/.*/, '');
    if (!d) return;

    clearTimeout(pollRef.current);
    if (isRerun) setRerunning(true); else setLoading(true);
    setError(null);
    setPollMsg('Initiating search…');

    try {
      const r = await fetch(`${API_BASE}/api/emails/search`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ domain: d }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Search failed');
      if (!isRerun) setQuery('');
      setPollMsg('Querying IntelX phonebook…');
      pollResult(data.id, d, isRerun);
    } catch (e) {
      setError(e.message || 'Search failed');
      setPollMsg('');
      if (isRerun) setRerunning(false); else setLoading(false);
    }
  }, [query, pollResult]);

  const deleteDomain = (d) => {
    const updated = { ...cache }; delete updated[d];
    setCache(updated); saveCache(slug, updated);
    if (selected === d) setSelected(null);
  };

  const handleCopy = (email) => {
    navigator.clipboard.writeText(email);
    setCopied(email);
    setTimeout(() => setCopied(''), 1500);
  };

  const copyAll = () => {
    if (!cur) return;
    navigator.clipboard.writeText(filtered.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const exportTxt = () => {
    if (!cur) return;
    const blob = new Blob([cur.emails.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emails_${cur.domain}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const cur         = selected ? cache[selected] : null;
  const filtered    = useMemo(
    () => cur ? cur.emails.filter(e => !filter || e.includes(filter.toLowerCase())) : [],
    [cur, filter],
  );
  const history     = useMemo(
    () => Object.values(cache).sort((a, b) => new Date(b.fetchedAt) - new Date(a.fetchedAt)),
    [cache],
  );
  const totalEmails = useMemo(
    () => Object.values(cache).reduce((s, v) => s + (v.emails?.length || 0), 0),
    [cache],
  );

  if (!eng) return null;

  return (
    <Box px={6} pb={12}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Email <Text as="span" color="red.400">Harvester</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · passive email enumeration via{' '}
            <Text as="span" color={ACCENT} fontWeight="semibold">IntelX Phonebook</Text>
          </Text>
        </Box>
      </Flex>

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <InfoBanner />

      {/* ── API key section ──────────────────────────────────────────────────── */}
      <ApiKeySection onKeySaved={() => {}} />

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
                onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
                placeholder="target-domain.com"
                bg="var(--dash-card-bg)" borderColor="var(--dash-card-border)"
                borderRadius="10px" color="var(--dash-text-primary)"
                fontSize="sm" fontFamily="monospace"
                _placeholder={{ color: 'var(--dash-text-muted)', fontFamily: 'sans-serif' }}
                _hover={{ borderColor: `${ACCENT}60` }}
                _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}55` }}
                pr={query ? '96px' : '44px'}
              />
              {query && (
                <InputRightElement w="96px">
                  <Flex gap={1}>
                    <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                      color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                      aria-label="Clear" onClick={() => setQuery('')} />
                    <Button size="xs" borderRadius="6px" px={3}
                      bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                      _hover={{ bg: `${ACCENT}35` }} fontWeight="bold" fontSize="11px"
                      isLoading={loading}
                      onClick={() => doSearch()}>
                      Search
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
                    {pollMsg || 'Searching…'}
                  </Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)">
                    IntelX phonebook searches can take a few seconds
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
                <Flex align="center" gap={2}>
                  <WarningTwoIcon boxSize={3} color={RED} />
                  <Text fontSize="12px" color={RED}>{error}</Text>
                </Flex>
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
                    Enter a domain to harvest emails
                  </Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>
                    Searches IntelX phonebook for email addresses associated with the target domain
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
                  domain={cur.domain}
                  count={cur.emails.length}
                  fetchedAt={cur.fetchedAt}
                  onRerun={() => doSearch(cur.domain, true)}
                  rerunning={rerunning}
                />

                {/* Stats */}
                <SimpleGrid columns={3} gap={3} mb={5}>
                  <StatCard label="Emails found"   value={cur.emails.length}    color={ACCENT}  delay={0}    />
                  <StatCard label="After filter"   value={filtered.length}      color={GREEN}   delay={0.05} />
                  <StatCard label="Total harvested" value={totalEmails}          color={PURPLE}  delay={0.1}  />
                </SimpleGrid>

                {/* Email list card */}
                {cur.emails.length > 0 && (
                  <Box borderRadius="14px" bg="var(--dash-card-bg)"
                    border="1px solid var(--dash-card-border)"
                    overflow="hidden" pos="relative">
                    <Box pos="absolute" top={0} left={0} right={0} h="2px"
                      style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />

                    {/* Card header */}
                    <Flex align="center" justify="space-between" px={5} py={3}
                      borderBottom="1px solid var(--dash-card-border)">
                      <Flex align="center" gap={2}>
                        <Box w="3px" h="14px" borderRadius="full" bg={ACCENT} />
                        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                          textTransform="uppercase" letterSpacing="wider">
                          {filtered.length} email{filtered.length !== 1 ? 's' : ''}
                        </Text>
                      </Flex>
                      <Flex gap={2}>
                        <Button size="xs" leftIcon={copiedAll ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
                          fontSize="10px" borderRadius="7px" px={3}
                          bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                          color={copiedAll ? GREEN : 'var(--dash-text-muted)'}
                          _hover={{ color: 'white', bg: 'rgba(255,255,255,0.09)' }}
                          onClick={copyAll}>
                          {copiedAll ? 'Copied!' : 'Copy all'}
                        </Button>
                        <Button size="xs" leftIcon={<DownloadIcon boxSize={2.5} />}
                          fontSize="10px" borderRadius="7px" px={3}
                          bg={`${ACCENT}10`} border={`1px solid ${ACCENT}30`}
                          color={ACCENT} _hover={{ bg: `${ACCENT}20` }}
                          onClick={exportTxt}>
                          Export .txt
                        </Button>
                      </Flex>
                    </Flex>

                    {/* Filter */}
                    <Box px={4} py={2.5} borderBottom="1px solid var(--dash-card-border)">
                      <InputGroup size="sm">
                        <InputLeftElement pointerEvents="none">
                          <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
                        </InputLeftElement>
                        <Input value={filter} onChange={e => setFilter(e.target.value)}
                          placeholder="Filter emails…" borderRadius="8px" fontSize="12px"
                          bg="rgba(0,0,0,0.2)" borderColor="rgba(255,255,255,0.08)"
                          _placeholder={{ color: 'var(--dash-text-muted)' }}
                          _focus={{ borderColor: `${ACCENT}60`, boxShadow: `0 0 0 1px ${ACCENT}30` }}
                        />
                      </InputGroup>
                    </Box>

                    {/* Rows — virtual list for smooth rendering with 1000s of emails */}
                    {filtered.length === 0 ? (
                      <Flex align="center" justify="center" py={6}>
                        <Text fontSize="12px" color="var(--dash-text-muted)">
                          No matches for "{filter}"
                        </Text>
                      </Flex>
                    ) : (
                      <VirtualEmailList
                        emails={filtered}
                        onCopy={handleCopy}
                        copied={copied}
                      />
                    )}
                  </Box>
                )}

                {cur.emails.length === 0 && (
                  <Flex align="center" justify="center" direction="column" gap={2}
                    py={8} borderRadius="12px"
                    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
                    <Text fontSize="13px" color="var(--dash-text-secondary)">No emails found</Text>
                    <Text fontSize="11px" color="var(--dash-text-muted)">
                      IntelX returned no results for {cur.domain}
                    </Text>
                  </Flex>
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
              Search History
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
              <Text fontSize="12px" color="var(--dash-text-muted)">No searches yet</Text>
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

export default EmailsView;
