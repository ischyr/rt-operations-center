import { useState, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Input, InputGroup, InputLeftElement,
  InputRightElement, IconButton, Spinner, Link, SimpleGrid,
} from '@chakra-ui/react';
import {
  SearchIcon, ExternalLinkIcon, CloseIcon, WarningTwoIcon,
} from '@chakra-ui/icons';
import { AnimatePresence, motion } from 'framer-motion';

const MotionBox = motion(Box);

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT        = '#FC8181';          // crimson-red — ransomware threat theme
const ACCENT_DIM    = 'rgba(252,129,129,0.1)';
const ACCENT_BORDER = 'rgba(252,129,129,0.3)';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

// Known ransomware group accent colours
const GROUP_COLORS = {
  lockbit:       '#f6ad55',
  alphv:         '#9f7aea',
  blackcat:      '#9f7aea',
  cl0p:          '#63b3ed',
  clop:          '#63b3ed',
  blackbasta:    '#fc8181',
  hive:          '#68d391',
  ransomhouse:   '#fbd38d',
  akira:         '#4fd1c5',
  royal:         '#b794f4',
  play:          '#76e4f7',
  medusa:        '#f687b3',
  rhysida:       '#fbb6ce',
  hunters:       '#fed7aa',
  'hunters international': '#fed7aa',
  bianlian:      '#a3bffa',
  '8base':       '#f6ad55',
  default:       '#718096',
};

const groupColor = (name = '') => {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(GROUP_COLORS)) {
    if (key.includes(k)) return v;
  }
  return GROUP_COLORS.default;
};

const fmtDate = (raw) => {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color, icon }) => {
  const c = color || ACCENT;
  return (
    <MotionBox flex={1} px={4} py={3} borderRadius="12px"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      pos="relative" overflow="hidden"
      whileHover={{ y: -2, boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px ${c}30` }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${c}99, transparent)` }} />
      <Flex align="center" gap={2} mb={1}>
        {icon && <Box as={icon} boxSize={3} color={c} />}
        <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
          textTransform="uppercase" letterSpacing="wider">{label}</Text>
      </Flex>
      <Text fontSize="2xl" fontWeight="bold" color={c} lineHeight={1}>{value}</Text>
    </MotionBox>
  );
};

// ── Victim card ───────────────────────────────────────────────────────────────

const VictimCard = ({ item, index }) => {
  const gc = groupColor(item.group);

  // Normalise website to a display-friendly form
  const websiteDisplay = (() => {
    if (!item.website) return null;
    try {
      const u = item.website.startsWith('http') ? item.website : `https://${item.website}`;
      return { href: u, label: new URL(u).hostname.replace(/^www\./, '') };
    } catch {
      return { href: `https://${item.website}`, label: item.website };
    }
  })();

  return (
    <MotionBox
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: 'easeOut', delay: Math.min(index * 0.04, 0.4) }}
      bg="var(--dash-card-bg)" borderRadius="12px"
      border="1px solid var(--dash-card-border)"
      pos="relative" overflow="hidden"
      _hover={{ borderColor: `${gc}55`, boxShadow: `0 6px 24px rgba(0,0,0,0.4), 0 0 0 1px ${gc}20` }}
      transition2="border-color 0.2s, box-shadow 0.2s"
    >
      {/* Group-coloured top gradient line */}
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${gc}90, transparent)` }} />

      {/* Group header bar */}
      {item.group && (
        <Flex align="center" gap={2} px={4} py={2}
          bg={`${gc}0d`} borderBottom={`1px solid ${gc}25`}>
          <Box w="6px" h="6px" borderRadius="full" bg={gc} flexShrink={0} />
          <Text fontSize="11px" fontWeight="bold" color={gc} letterSpacing="wide" flex={1} noOfLines={1}>
            {item.group}
          </Text>
          {item.link && (
            <Link href={item.link} isExternal>
              <Flex align="center" gap={1} px={1.5} py="1px" borderRadius="4px"
                bg={`${gc}18`} border={`1px solid ${gc}40`}
                _hover={{ bg: `${gc}28` }} cursor="pointer">
                <Text fontSize="9px" fontWeight="bold" color={gc}>POST</Text>
                <ExternalLinkIcon boxSize={2.5} color={gc} />
              </Flex>
            </Link>
          )}
        </Flex>
      )}

      <Box px={4} pt={3} pb={3}>
        {/* Victim name */}
        <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)"
          noOfLines={2} lineHeight="short" mb={websiteDisplay ? 1 : 2}>
          {item.victim || '—'}
        </Text>

        {/* Website */}
        {websiteDisplay && (
          <Link href={websiteDisplay.href} isExternal _hover={{ textDecoration: 'none' }}>
            <Flex align="center" gap={1} mb={2}>
              <ExternalLinkIcon boxSize={2.5} color="var(--dash-text-muted)" />
              <Text fontSize="11px" color="rgba(165,180,252,0.75)" fontFamily="mono"
                _hover={{ color: 'rgba(165,180,252,1)' }} noOfLines={1}>
                {websiteDisplay.label}
              </Text>
            </Flex>
          </Link>
        )}

        {/* Badges row */}
        <Flex gap={2} flexWrap="wrap" align="center" mb={item.date ? 2 : 0}>
          {/* Country */}
          {item.country && (
            <Flex align="center" gap={1} px={2} py="2px" borderRadius="5px"
              bg={ACCENT_DIM} border={`1px solid ${ACCENT_BORDER}`}>
              <Text fontSize="10px" fontWeight="bold" color={ACCENT} whiteSpace="nowrap">
                {item.country}
              </Text>
            </Flex>
          )}

          {/* Sector */}
          {item.sector && (
            <Flex px={2} py="2px" borderRadius="5px"
              bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)">
              <Text fontSize="10px" color="var(--dash-text-secondary)" whiteSpace="nowrap">
                {item.sector}
              </Text>
            </Flex>
          )}
        </Flex>

        {/* Date */}
        {item.date && (
          <Text fontSize="10px" color="var(--dash-text-muted)">
            {fmtDate(item.date) || item.date}
          </Text>
        )}
      </Box>
    </MotionBox>
  );
};

// ── Empty / error states ──────────────────────────────────────────────────────

const EmptyState = ({ searched }) => (
  <Flex direction="column" align="center" justify="center" gap={3} py={16}
    color="var(--dash-text-muted)">
    <Box w="52px" h="52px" borderRadius="12px"
      border={`2px solid ${ACCENT_BORDER}`} bg={ACCENT_DIM}
      display="flex" alignItems="center" justifyContent="center">
      <WarningTwoIcon boxSize={5} color={ACCENT} />
    </Box>
    <Box textAlign="center">
      <Text fontSize="sm" fontWeight="semibold" color="var(--dash-text-secondary)">
        {searched ? 'No victims found' : 'Search ransomware victims'}
      </Text>
      <Text fontSize="xs" mt={1}>
        {searched
          ? 'Try a different country or organisation name'
          : 'Enter a country name or organisation to search RansomFeed.it'}
      </Text>
    </Box>
  </Flex>
);

// ── Main view ─────────────────────────────────────────────────────────────────

const RansomFeedView = () => {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res  = await fetch(`${API}/ransom/search?q=${encodeURIComponent(q.trim())}`, {
        headers: authHeaders(),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error(`Server returned non-JSON response (HTTP ${res.status})`); }
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResults(data.results || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKey = (e) => { if (e.key === 'Enter') doSearch(query); };
  const clearSearch = () => { setQuery(''); setResults([]); setSearched(false); setError(null); };

  // Derived stats
  const uniqueGroups    = new Set(results.map((r) => r.group).filter(Boolean)).size;
  const uniqueCountries = new Set(results.map((r) => r.country).filter(Boolean)).size;

  // Quick-pick countries
  const QUICK = ['United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Canada', 'Australia', 'Romania', 'Brazil', 'Japan'];

  return (
    <Box px={6} pb={12}>

      {/* ── Header ── */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Ransom <Text as="span" color="red.400">Feed</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Search ransomware victims by country or organisation · powered by RansomFeed.it
          </Text>
        </Box>
      </Flex>

      {/* ── Search bar ── */}
      <Box mb={5} maxW="540px">
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none" pl={1}>
            {loading
              ? <Spinner size="xs" color={ACCENT} />
              : <SearchIcon boxSize={4} color="var(--dash-text-muted)" />}
          </InputLeftElement>
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search by country or organisation (e.g. Romania)…"
            bg="var(--dash-card-bg)" borderColor="var(--dash-card-border)" borderRadius="10px"
            color="var(--dash-text-primary)" fontSize="sm"
            _placeholder={{ color: 'var(--dash-text-muted)' }}
            _hover={{ borderColor: ACCENT_BORDER }}
            _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}55` }}
            pr={query ? '80px' : '44px'}
          />
          {query && (
            <InputRightElement w="80px">
              <Flex gap={1}>
                <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                  aria-label="Clear" onClick={clearSearch} />
                <Box
                  as="button" px={2} py={1} borderRadius="6px" fontSize="11px" fontWeight="bold"
                  bg={ACCENT_DIM} color={ACCENT} border={`1px solid ${ACCENT_BORDER}`}
                  _hover={{ bg: 'rgba(252,129,129,0.18)' }}
                  onClick={() => doSearch(query)}
                >
                  Search
                </Box>
              </Flex>
            </InputRightElement>
          )}
        </InputGroup>

        {/* Quick picks */}
        <Flex gap={2} mt={3} flexWrap="wrap">
          {QUICK.map((c) => (
            <Box key={c} as="button" px={2.5} py="3px" borderRadius="6px"
              fontSize="10px" fontWeight="600" cursor="pointer"
              bg={query === c ? ACCENT_DIM : 'rgba(255,255,255,0.04)'}
              border={`1px solid ${query === c ? ACCENT_BORDER : 'rgba(255,255,255,0.08)'}`}
              color={query === c ? ACCENT : 'var(--dash-text-muted)'}
              _hover={{ borderColor: ACCENT_BORDER, color: ACCENT }}
              transition="all 0.12s"
              onClick={() => { setQuery(c); doSearch(c); }}>
              {c}
            </Box>
          ))}
        </Flex>
      </Box>

      {/* ── Error ── */}
      {error && (
        <Box mb={5} px={4} py={3} borderRadius="10px"
          bg="rgba(252,129,129,0.08)" border="1px solid rgba(252,129,129,0.3)">
          <Text fontSize="sm" color={ACCENT}>{error}</Text>
        </Box>
      )}

      {/* ── Stats (only when results exist) ── */}
      {results.length > 0 && (
        <SimpleGrid columns={{ base: 2, md: 3 }} gap={3} mb={6}>
          <StatCard label="Victims Found"   value={results.length}  color={ACCENT} />
          <StatCard label="Ransomware Groups" value={uniqueGroups}  color="#9F7AEA" />
          <StatCard label="Countries"       value={uniqueCountries} color="#63B3ED" />
        </SimpleGrid>
      )}

      {/* ── Results grid ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <Flex justify="center" py={16}>
            <Spinner size="lg" color={ACCENT} thickness="3px" />
          </Flex>
        ) : results.length === 0 ? (
          <EmptyState searched={searched} />
        ) : (
          <MotionBox
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Results header */}
            <Flex align="center" gap={2} mb={4}>
              <Box w="3px" h="14px" borderRadius="full" bg={ACCENT} />
              <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider">
                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </Text>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
              <AnimatePresence>
                {results.map((item, i) => (
                  <VictimCard key={`${item.victim}-${i}`} item={item} index={i} />
                ))}
              </AnimatePresence>
            </SimpleGrid>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default RansomFeedView;
