import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Flex, Text, Heading, Input, InputGroup, InputLeftElement,
  InputRightElement, IconButton, Button, Badge, Spinner, SimpleGrid,
} from '@chakra-ui/react';
import {
  SearchIcon, CloseIcon, RepeatIcon, ExternalLinkIcon, CopyIcon, CheckIcon,
} from '@chakra-ui/icons';
import { AnimatePresence, motion } from 'framer-motion';

const MotionBox = motion(Box);

// ── Constants ─────────────────────────────────────────────────────────────────
const API    = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const ACCENT = '#68D391';   // green — "go" / search theme
const BLUE   = '#63B3ED';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const PURPLE = '#9F7AEA';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const PAGE_SIZES = [15, 30, 50, 100];

// ── Category colour map ───────────────────────────────────────────────────────
const CAT_COLOR = {
  'Files Containing Passwords':  RED,
  'Files Containing Usernames':  ORANGE,
  'Sensitive Directories':       PURPLE,
  'Vulnerable Servers':          RED,
  'Error Messages':              ORANGE,
  'Files Containing Juicy Info': ACCENT,
  'Various Online Devices':      BLUE,
  'Advisories and Vulnerabilities': RED,
  'Network or Vulnerability Data':  BLUE,
  'Pages Containing Login Portals': ORANGE,
  'Web Server Detection':        BLUE,
  'Footholds':                   RED,
};
const catColor = (cat) => CAT_COLOR[cat] || BLUE;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? d.slice(0, 10) : '—';

// ── Label ─────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, delay = 0 }) => (
  <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay }}
    px={4} py={3} borderRadius="12px" bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Text fontSize="22px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
    <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{label}</Text>
  </MotionBox>
);

// ── Run Dork Panel (inline below row) ─────────────────────────────────────────
const RunPanel = ({ dork, onClose }) => {
  const [extra,   setExtra]   = useState('');
  const [copied,  setCopied]  = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const finalDork = extra.trim() ? `${dork} ${extra.trim()}` : dork;

  const open = () => window.open(
    `https://www.google.com/search?q=${encodeURIComponent(finalDork)}`,
    '_blank', 'noopener,noreferrer'
  );

  const copy = () => {
    navigator.clipboard.writeText(finalDork);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <MotionBox initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} overflow="hidden">
      <Box px={4} pb={4} pt={2} bg={`${ACCENT}06`}
        borderTop="1px solid rgba(255,255,255,0.06)">
        <Flex align="center" gap={2} mb={3}>
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">Customize Dork</Text>
          <Text fontSize="10px" color="var(--dash-text-muted)">(optional — add company, domain, or extra operators)</Text>
        </Flex>

        {/* Base dork display */}
        <Box px={3} py={2} mb={3} borderRadius="8px"
          bg="rgba(0,0,0,0.3)" border="1px solid rgba(255,255,255,0.07)">
          <Text fontSize="10px" color="var(--dash-text-muted)" mb={1}>Base dork</Text>
          <Text fontSize="12px" color={ACCENT} fontFamily="monospace">{dork}</Text>
        </Box>

        {/* Extra params input */}
        <Flex gap={2} mb={3}>
          <Input
            ref={inputRef}
            value={extra}
            onChange={e => setExtra(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') open(); if (e.key === 'Escape') onClose(); }}
            placeholder='site:company.com  OR  filetype:pdf  OR  "company name"'
            variant="unstyled"
            bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.12)"
            borderRadius="10px" px={4} h="38px" fontSize="sm"
            fontFamily="monospace" color="var(--dash-text-primary)"
            _placeholder={{ color: 'var(--dash-text-muted)', fontFamily: 'sans-serif' }}
            _focus={{ border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` }}
          />
          <Button size="sm" leftIcon={<ExternalLinkIcon />} borderRadius="8px" px={4}
            bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
            _hover={{ bg: `${ACCENT}35` }} fontWeight="bold" fontSize="12px"
            flexShrink={0} onClick={open}>
            Run in Google
          </Button>
          <IconButton icon={copied ? <CheckIcon /> : <CopyIcon />} size="sm" borderRadius="8px"
            variant="ghost" color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.1)"
            _hover={{ color: 'white' }} aria-label="Copy" onClick={copy} />
          <IconButton icon={<CloseIcon boxSize={2.5} />} size="sm" borderRadius="8px"
            variant="ghost" color="var(--dash-text-muted)"
            _hover={{ color: 'white' }} aria-label="Close" onClick={onClose} />
        </Flex>

        {/* Final dork preview */}
        {extra.trim() && (
          <Box px={3} py={2} borderRadius="8px"
            bg={`${ACCENT}08`} border={`1px solid ${ACCENT}25`}>
            <Text fontSize="10px" color="var(--dash-text-muted)" mb={1}>Final dork</Text>
            <Text fontSize="12px" color="white" fontFamily="monospace">{finalDork}</Text>
          </Box>
        )}
      </Box>
    </MotionBox>
  );
};

// ── Dork Row ──────────────────────────────────────────────────────────────────
const DorkRow = ({ entry, expanded, onToggle }) => {
  const cc = catColor(entry.category);
  return (
    <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      bg={expanded ? `${ACCENT}06` : 'var(--dash-card-bg)'}
      border="1px solid"
      borderColor={expanded ? `${ACCENT}30` : 'var(--dash-card-border)'}
      borderRadius="10px" overflow="hidden"
      style={{ transition: 'border-color 0.12s, background 0.12s' }}>

      {/* Main row */}
      <Flex px={4} py={3} align="center" gap={3}
        cursor="pointer" onClick={onToggle}
        _hover={{ bg: expanded ? `${ACCENT}08` : 'rgba(255,255,255,0.03)' }}>

        {/* Date */}
        <Text fontSize="10px" color="var(--dash-text-muted)" flexShrink={0} w="78px"
          fontFamily="monospace">{fmtDate(entry.dateAdded)}</Text>

        {/* Dork */}
        <Text flex={1} fontSize="12px" fontFamily="monospace" color={ACCENT}
          noOfLines={1} title={entry.dork}>{entry.dork}</Text>

        {/* Category */}
        <Flex align="center" gap={1.5} px={2} py="2px" borderRadius="5px"
          bg={`${cc}12`} border={`1px solid ${cc}30`} flexShrink={0} maxW="200px">
          <Box w="5px" h="5px" borderRadius="full" bg={cc} flexShrink={0} />
          <Text fontSize="9px" fontWeight="bold" color={cc}
            textTransform="uppercase" letterSpacing="wide" noOfLines={1}>
            {entry.category}
          </Text>
        </Flex>

        {/* Author */}
        <Text fontSize="11px" color="var(--dash-text-muted)" flexShrink={0}
          w="110px" noOfLines={1} textAlign="right">{entry.author}</Text>

        {/* Run button */}
        <Flex align="center" gap={1} px={2.5} py={1} borderRadius="6px"
          bg={expanded ? `${ACCENT}20` : `${ACCENT}10`}
          border={`1px solid ${ACCENT}${expanded ? '50' : '25'}`}
          flexShrink={0}
          style={{ transition: 'all 0.12s' }}>
          <ExternalLinkIcon boxSize={2.5} color={ACCENT} />
          <Text fontSize="9px" fontWeight="bold" color={ACCENT}>
            {expanded ? 'CLOSE' : 'RUN'}
          </Text>
        </Flex>
      </Flex>

      {/* Expandable run panel */}
      <AnimatePresence>
        {expanded && <RunPanel dork={entry.dork} onClose={onToggle} />}
      </AnimatePresence>
    </MotionBox>
  );
};

// ── Category pill ─────────────────────────────────────────────────────────────
const CatPill = ({ name, count, active, onClick }) => {
  const cc = catColor(name);
  return (
    <Flex align="center" justify="space-between" gap={2}
      px={3} py={2} borderRadius="8px" cursor="pointer"
      bg={active ? `${cc}12` : 'rgba(255,255,255,0.03)'}
      border={active ? `1px solid ${cc}40` : '1px solid rgba(255,255,255,0.06)'}
      _hover={{ bg: `${cc}10`, borderColor: `${cc}35` }}
      style={{ transition: 'all 0.12s' }}
      onClick={onClick}>
      <Flex align="center" gap={2} minW={0}>
        <Box w="6px" h="6px" borderRadius="full" bg={cc} flexShrink={0} />
        <Text fontSize="11px" fontWeight={active ? 'semibold' : 'normal'}
          color={active ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)'}
          noOfLines={1}>{name}</Text>
      </Flex>
      <Text fontSize="9px" color="var(--dash-text-muted)"
        fontWeight="bold">{count}</Text>
    </Flex>
  );
};

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ page, pages, total, pageSize, onPage, onSize }) => {
  const window_pages = [];
  const start = Math.max(1, page - 2);
  const end   = Math.min(pages, page + 2);
  for (let i = start; i <= end; i++) window_pages.push(i);

  return (
    <Flex align="center" justify="space-between" mt={4} flexWrap="wrap" gap={3}>
      <Text fontSize="11px" color="var(--dash-text-muted)">
        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of{' '}
        <Text as="span" fontWeight="bold" color="var(--dash-text-primary)">{total.toLocaleString()}</Text> entries
      </Text>

      <Flex align="center" gap={2}>
        {/* Page size */}
        <Flex align="center" gap={1.5}>
          <Text fontSize="10px" color="var(--dash-text-muted)">Show</Text>
          {PAGE_SIZES.map(s => (
            <Box key={s} px={2} py={0.5} borderRadius="5px" cursor="pointer" fontSize="10px"
              fontWeight={pageSize === s ? 'bold' : 'normal'}
              color={pageSize === s ? ACCENT : 'var(--dash-text-muted)'}
              bg={pageSize === s ? `${ACCENT}15` : 'transparent'}
              border={pageSize === s ? `1px solid ${ACCENT}40` : '1px solid transparent'}
              onClick={() => onSize(s)}>
              {s}
            </Box>
          ))}
        </Flex>

        {/* Page buttons */}
        <Flex gap={1}>
          <Box px={2} py={1} borderRadius="5px" cursor={page > 1 ? 'pointer' : 'default'}
            fontSize="10px" color={page > 1 ? 'var(--dash-text-secondary)' : 'var(--dash-text-muted)'}
            _hover={page > 1 ? { color: 'white' } : {}}
            onClick={() => page > 1 && onPage(1)}>FIRST</Box>
          <Box px={2} py={1} borderRadius="5px" cursor={page > 1 ? 'pointer' : 'default'}
            fontSize="10px" color={page > 1 ? 'var(--dash-text-secondary)' : 'var(--dash-text-muted)'}
            _hover={page > 1 ? { color: 'white' } : {}}
            onClick={() => page > 1 && onPage(page - 1)}>PREV</Box>

          {window_pages.map(p => (
            <Box key={p} px={2.5} py={1} borderRadius="5px" cursor="pointer"
              fontSize="10px" fontWeight={p === page ? 'bold' : 'normal'}
              color={p === page ? ACCENT : 'var(--dash-text-muted)'}
              bg={p === page ? `${ACCENT}15` : 'transparent'}
              border={p === page ? `1px solid ${ACCENT}40` : '1px solid transparent'}
              onClick={() => onPage(p)}>{p}</Box>
          ))}

          <Box px={2} py={1} borderRadius="5px" cursor={page < pages ? 'pointer' : 'default'}
            fontSize="10px" color={page < pages ? 'var(--dash-text-secondary)' : 'var(--dash-text-muted)'}
            _hover={page < pages ? { color: 'white' } : {}}
            onClick={() => page < pages && onPage(page + 1)}>NEXT</Box>
          <Box px={2} py={1} borderRadius="5px" cursor={page < pages ? 'pointer' : 'default'}
            fontSize="10px" color={page < pages ? 'var(--dash-text-secondary)' : 'var(--dash-text-muted)'}
            _hover={page < pages ? { color: 'white' } : {}}
            onClick={() => page < pages && onPage(pages)}>LAST</Box>
        </Flex>
      </Flex>
    </Flex>
  );
};

// ── Main view ─────────────────────────────────────────────────────────────────
export default function GoogleDorkingView() {
  const [entries,    setEntries]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta,       setMeta]       = useState({ total: 0, lastSync: null });
  const [loading,    setLoading]    = useState(false);
  const [syncing,    setSyncing]    = useState(false);
  const [error,      setError]      = useState(null);
  const [query,      setQuery]      = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selCat,     setSelCat]     = useState('');
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(15);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const debounceRef = useRef(null);

  // ── Debounce search ──────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── Fetch entries ────────────────────────────────────────────────────────────
  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q:       debouncedQ,
        category: selCat,
        page:    String(page),
        limit:   String(pageSize),
      });
      const res  = await fetch(`${API}/ghdb?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setEntries(data.entries || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setMeta(m => ({ ...m, lastSync: data.lastSync, total: data.totalDb || data.total }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, selCat, page, pageSize]);

  // ── Fetch categories ─────────────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/ghdb/categories`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setCategories(data || []);
    } catch { /* silent */ }
  }, []);

  // ── Fetch meta ───────────────────────────────────────────────────────────────
  const loadMeta = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/ghdb/meta`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setMeta(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadMeta(); loadCategories(); }, [loadMeta, loadCategories]);
  useEffect(() => { loadEntries(); }, [loadEntries]);

  // ── Import from file (written by Python scraper) ─────────────────────────────
  const handleImport = async () => {
    if (syncing) return;
    setSyncing(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/ghdb/import`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.hint || 'Import failed');
      await Promise.all([loadMeta(), loadCategories(), loadEntries()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const fmtSync = (d) => {
    if (!d) return 'Never';
    const diff  = Date.now() - new Date(d);
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const dbEmpty = meta.total === 0 && !loading;

  return (
    <Box px={6} pb={12} pt={5}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Google <Text as="span" color="red.400">Dorking</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Exploit-DB Google Hacking Database ·{' '}
            <Text as="span" color={ACCENT} fontWeight="semibold">
              {meta.total.toLocaleString()} dorks
            </Text>
            {' '}· last synced{' '}
            <Text as="span" color="var(--dash-text-primary)" fontWeight="semibold">
              {fmtSync(meta.lastSync)}
            </Text>
          </Text>
        </Box>
        <Button size="sm" leftIcon={syncing ? <Spinner size="xs" /> : <RepeatIcon />}
          borderRadius="8px"
          bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
          _hover={{ bg: `${ACCENT}35` }} fontWeight="bold" fontSize="12px"
          isLoading={syncing} loadingText="Importing…"
          onClick={handleImport}>
          {meta.total === 0 ? 'Import from File' : 'Re-import'}
        </Button>
      </Flex>

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px"
        bg="rgba(104,211,145,0.07)" border="1px solid rgba(104,211,145,0.25)">
        <Flex align="center" gap={2} mb={1.5}>
          <Box w="6px" h="6px" borderRadius="full" bg={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            Google Hacking Database
          </Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {[
            '7,900+ passive Google dorks for finding exposed assets',
            'Click "Run" on any dork to customise and open directly in Google',
            'Add site:, filetype:, or company name before running',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <SimpleGrid columns={4} gap={4} mb={6}>
        <StatCard label="Total Dorks"   value={meta.total.toLocaleString()}     color={ACCENT}  delay={0}    />
        <StatCard label="Categories"    value={categories.length}               color={BLUE}    delay={0.04} />
        <StatCard label="Showing"       value={total.toLocaleString()}          color={ORANGE}  delay={0.08} />
        <StatCard label="Last Synced"   value={fmtSync(meta.lastSync)}          color={PURPLE}  delay={0.12} />
      </SimpleGrid>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <Flex gap={6} align="flex-start">

        {/* ── Left: category filters ──────────────────────────────────────── */}
        <Box w="240px" flexShrink={0}>
          <Box pos="sticky" top={0}>
            <Label>Categories</Label>
            <Flex direction="column" gap={1.5}>
              <CatPill
                name="All categories"
                count={meta.total}
                active={selCat === ''}
                onClick={() => { setSelCat(''); setPage(1); }} />
              {categories.map(c => (
                <CatPill key={c.name}
                  name={c.name} count={c.count}
                  active={selCat === c.name}
                  onClick={() => { setSelCat(c.name); setPage(1); setExpandedId(null); }} />
              ))}
            </Flex>
          </Box>
        </Box>

        {/* ── Right: search + table ───────────────────────────────────────── */}
        <Box flex={1} minW={0}>

          {/* Search */}
          <Box mb={4}>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none" pl={1}>
                {loading
                  ? <Spinner size="xs" color={ACCENT} />
                  : <SearchIcon boxSize={4} color="var(--dash-text-muted)" />}
              </InputLeftElement>
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search dorks, categories, authors…"
                bg="var(--dash-card-bg)" borderColor="var(--dash-card-border)"
                borderRadius="10px" color="var(--dash-text-primary)"
                fontSize="sm" fontFamily="monospace"
                _placeholder={{ color: 'var(--dash-text-muted)', fontFamily: 'sans-serif' }}
                _hover={{ borderColor: `${ACCENT}60` }}
                _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}55` }}
                pr={query ? '44px' : undefined}
              />
              {query && (
                <InputRightElement>
                  <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                    color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                    aria-label="Clear" onClick={() => setQuery('')} />
                </InputRightElement>
              )}
            </InputGroup>
          </Box>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <MotionBox initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} mb={4} px={4} py={3} borderRadius="10px"
                bg="rgba(252,129,129,0.07)" border="1px solid rgba(252,129,129,0.3)">
                <Text fontSize="12px" color={RED}>{error}</Text>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Empty — not synced yet */}
          {dbEmpty && !syncing && !error && (
            <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              px={6} py={10} borderRadius="14px"
              bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              pos="relative" overflow="hidden">
              <Box pos="absolute" top={0} left={0} right={0} h="2px"
                style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />
              <Flex direction="column" align="center" gap={4}>
                <Flex w="48px" h="48px" borderRadius="12px"
                  bg={`${ACCENT}12`} border={`1px solid ${ACCENT}25`}
                  align="center" justify="center">
                  <SearchIcon boxSize={5} color={ACCENT} />
                </Flex>
                <Box textAlign="center">
                  <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
                    Database not loaded yet
                  </Text>
                  <Text fontSize="12px" color="var(--dash-text-muted)">
                    Run the scraper first, then import the file below.
                  </Text>
                </Box>

                {/* Step instructions */}
                <Box w="100%" maxW="480px" bg="rgba(0,0,0,0.25)"
                  border="1px solid rgba(255,255,255,0.07)" borderRadius="10px" p={4}>
                  <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                    textTransform="uppercase" letterSpacing="wider" mb={3}>
                    Setup (one-time)
                  </Text>
                  {[
                    { step: '1', label: 'Install dependency', cmd: 'pip install requests' },
                    { step: '2', label: 'Run the scraper',    cmd: 'python scripts/scrape_ghdb.py' },
                    { step: '3', label: 'Import into DB',     cmd: 'Click "Import from File" below' },
                  ].map(({ step, label, cmd }) => (
                    <Flex key={step} align="flex-start" gap={3} mb={step === '3' ? 0 : 3}>
                      <Flex w="20px" h="20px" borderRadius="full" flexShrink={0}
                        bg={`${ACCENT}20`} border={`1px solid ${ACCENT}40`}
                        align="center" justify="center">
                        <Text fontSize="9px" fontWeight="bold" color={ACCENT}>{step}</Text>
                      </Flex>
                      <Box>
                        <Text fontSize="11px" color="var(--dash-text-secondary)" mb={0.5}>{label}</Text>
                        <Box px={2.5} py={1} borderRadius="6px" display="inline-block"
                          bg="rgba(0,0,0,0.3)" border="1px solid rgba(255,255,255,0.08)">
                          <Text fontSize="11px" fontFamily="monospace" color={ACCENT}>{cmd}</Text>
                        </Box>
                      </Box>
                    </Flex>
                  ))}
                </Box>

                <Button size="sm" leftIcon={<RepeatIcon />} borderRadius="8px"
                  bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                  _hover={{ bg: `${ACCENT}35` }} fontWeight="bold" fontSize="12px"
                  isLoading={syncing} loadingText="Importing…"
                  onClick={handleImport}>
                  Import from File
                </Button>
              </Flex>
            </MotionBox>
          )}

          {/* Table header */}
          {!dbEmpty && (
            <>
              <Flex px={4} py={2} mb={1} align="center" gap={3}>
                <Text fontSize="9px" color="var(--dash-text-muted)" fontWeight="bold"
                  textTransform="uppercase" letterSpacing="wider" w="78px" flexShrink={0}>Date</Text>
                <Text fontSize="9px" color="var(--dash-text-muted)" fontWeight="bold"
                  textTransform="uppercase" letterSpacing="wider" flex={1}>Dork</Text>
                <Text fontSize="9px" color="var(--dash-text-muted)" fontWeight="bold"
                  textTransform="uppercase" letterSpacing="wider" w="200px" flexShrink={0}>Category</Text>
                <Text fontSize="9px" color="var(--dash-text-muted)" fontWeight="bold"
                  textTransform="uppercase" letterSpacing="wider" w="110px" flexShrink={0} textAlign="right">Author</Text>
                <Box w="50px" flexShrink={0} />
              </Flex>

              {/* Rows */}
              <Flex direction="column" gap={2} mb={4}>
                <AnimatePresence mode="popLayout">
                  {loading && entries.length === 0 ? (
                    <MotionBox key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }} px={5} py={8} borderRadius="14px" textAlign="center"
                      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
                      <Flex direction="column" align="center" gap={3}>
                        <Spinner size="md" color={ACCENT} thickness="2px" />
                        <Text fontSize="12px" color="var(--dash-text-muted)">Loading dorks…</Text>
                      </Flex>
                    </MotionBox>
                  ) : entries.length === 0 ? (
                    <MotionBox key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }} px={5} py={8} borderRadius="12px" textAlign="center"
                      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
                      <Text fontSize="12px" color="var(--dash-text-muted)">
                        No dorks match your search
                      </Text>
                    </MotionBox>
                  ) : entries.map(entry => (
                    <DorkRow
                      key={entry._id || entry.ghdbId}
                      entry={entry}
                      expanded={expandedId === (entry._id || entry.ghdbId)}
                      onToggle={() => setExpandedId(
                        expandedId === (entry._id || entry.ghdbId) ? null : (entry._id || entry.ghdbId)
                      )}
                    />
                  ))}
                </AnimatePresence>
              </Flex>

              {/* Pagination */}
              <Pagination
                page={page} pages={pages} total={total}
                pageSize={pageSize}
                onPage={(p) => { setPage(p); setExpandedId(null); }}
                onSize={(s) => { setPageSize(s); setPage(1); }}
              />
            </>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
