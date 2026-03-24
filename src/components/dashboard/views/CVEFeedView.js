import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Input, InputGroup, InputLeftElement,
  InputRightElement, IconButton, Spinner, Divider, Link,
} from '@chakra-ui/react';
import {
  SearchIcon, WarningTwoIcon, ExternalLinkIcon, RepeatIcon, TimeIcon, CloseIcon,
} from '@chakra-ui/icons';
import { AnimatePresence, motion } from 'framer-motion';

const MotionBox = motion(Box);

const POLL_MS   = 60_000; // refresh feed every 60 s
const FEED_SIZE = 5;

// ── Helpers ────────────────────────────────────────────────────────────────────
const cvssInfo = (score) => {
  if (score == null) return { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.2)', label: 'N/A' };
  if (score >= 9)    return { color: '#fc8181', bg: 'rgba(252,129,129,0.12)', border: 'rgba(252,129,129,0.3)', label: 'CRITICAL' };
  if (score >= 7)    return { color: '#f6ad55', bg: 'rgba(246,173,85,0.12)',  border: 'rgba(246,173,85,0.3)',  label: 'HIGH'     };
  if (score >= 4)    return { color: '#fcd34d', bg: 'rgba(252,211,77,0.12)',  border: 'rgba(252,211,77,0.3)',  label: 'MEDIUM'   };
  return               { color: '#68d391', bg: 'rgba(104,211,145,0.12)', border: 'rgba(104,211,145,0.3)', label: 'LOW'      };
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const topScore = (cve) => cve?.cvss ?? cve?.cvss_v2 ?? null;

// ── Feed card ──────────────────────────────────────────────────────────────────
const FeedCard = ({ cve, fresh }) => {
  const score = topScore(cve);
  const c     = cvssInfo(score);

  return (
    <MotionBox
      layout
      key={cve.cve_id}
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1,  y: 0   }}
      exit={{    opacity: 0,  x: 60, transition: { duration: 0.28, ease: 'easeIn' } }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
      bg="var(--dash-card-bg)"
      border={`1px solid ${fresh ? c.border : 'var(--dash-card-border)'}`}
      borderRadius="10px" p={4} pos="relative" overflow="hidden"
      _hover={{ borderColor: c.border, boxShadow: `0 4px 20px rgba(0,0,0,0.35)` }}
      transition2="border-color 0.2s ease, box-shadow 0.2s ease"
    >
      {/* accent top line for new entries */}
      {fresh && (
        <Box pos="absolute" top="0" left="0" right="0" h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${c.color}, transparent)` }} />
      )}

      <Flex align="flex-start" justify="space-between" gap={3} mb={1.5}>
        {/* CVE ID */}
        <Text fontSize="13px" fontWeight="bold" color={c.color} fontFamily="mono" letterSpacing="wide">
          {cve.cve_id}
        </Text>

        {/* Score badge */}
        <Flex align="center" gap={1.5} flexShrink={0}>
          {score != null && (
            <Flex
              px="6px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
              letterSpacing="wider" bg={c.bg} border={`1px solid ${c.border}`} color={c.color}
              align="center" gap={1}
            >
              <Text>{score.toFixed(1)}</Text>
              <Text>{c.label}</Text>
            </Flex>
          )}
          {fresh && (
            <Flex
              px="5px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
              letterSpacing="wider" bg="rgba(255,80,95,0.12)" border="1px solid rgba(255,80,95,0.3)"
              color="red.400"
            >
              NEW
            </Flex>
          )}
        </Flex>
      </Flex>

      {/* Summary */}
      <Text fontSize="11px" color="var(--dash-text-secondary)" lineHeight="tall" noOfLines={2} mb={2}>
        {cve.summary || 'No description available.'}
      </Text>

      {/* Footer */}
      <Flex align="center" justify="space-between">
        <Text fontSize="10px" color="var(--dash-text-muted)">
          Published: {fmtDate(cve.published_time)}
        </Text>
        {cve.epss != null && (
          <Text fontSize="10px" color="var(--dash-text-muted)">
            EPSS: {(cve.epss * 100).toFixed(2)}%
          </Text>
        )}
      </Flex>
    </MotionBox>
  );
};

// ── Detail panel ───────────────────────────────────────────────────────────────
const DetailRow = ({ label, value, mono }) => (
  <Flex direction={{ base: 'column', md: 'row' }} gap={2} py={2}
    borderBottom="1px solid var(--dash-divider)" _last={{ border: 'none' }}>
    <Text fontSize="10px" fontWeight="bold" letterSpacing="wider" textTransform="uppercase"
      color="var(--dash-text-muted)" w={{ md: '130px' }} flexShrink={0} pt="1px">
      {label}
    </Text>
    <Text fontSize="12px" color="var(--dash-text-primary)" lineHeight="tall"
      fontFamily={mono ? 'mono' : 'inherit'} flex="1" wordBreak="break-word">
      {value ?? '—'}
    </Text>
  </Flex>
);

const CveDetail = ({ cve }) => {
  const score  = topScore(cve);
  const c      = cvssInfo(score);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1,  y: 0  }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
      bg="var(--dash-card-bg)"
      border={`1px solid ${c.border}`}
      borderRadius="12px" overflow="hidden"
    >
      {/* Header band */}
      <Box
        px={5} py={4}
        style={{ background: `linear-gradient(135deg, ${c.bg}, transparent)` }}
        borderBottom={`1px solid ${c.border}`}
      >
        <Flex align="flex-start" justify="space-between" gap={3} mb={1}>
          <Text fontSize="18px" fontWeight="black" color={c.color} fontFamily="mono" letterSpacing="wide">
            {cve.cve_id}
          </Text>
          <Flex gap={2} flexShrink={0} flexWrap="wrap" justify="flex-end">
            {score != null && (
              <Flex
                px="8px" py="2px" borderRadius="6px" fontSize="11px" fontWeight="bold"
                bg={c.bg} border={`1px solid ${c.border}`} color={c.color}
                align="center" gap={1.5}
              >
                <Text fontSize="15px" fontWeight="black">{score.toFixed(1)}</Text>
                <Text letterSpacing="widest">{c.label}</Text>
              </Flex>
            )}
          </Flex>
        </Flex>
        <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="tall">
          {cve.summary || 'No description available.'}
        </Text>
      </Box>

      {/* Details grid */}
      <Box px={5} py={3}>
        <DetailRow label="CVE ID"     value={cve.cve_id}      mono />
        <DetailRow label="Published"  value={fmtDateTime(cve.published_time)} />
        <DetailRow label="Modified"   value={fmtDateTime(cve.modified_time)} />
        {cve.cvss     != null && <DetailRow label="CVSS v3"    value={`${cve.cvss} (${cvssInfo(cve.cvss).label})`} />}
        {cve.cvss_v2  != null && <DetailRow label="CVSS v2"    value={`${cve.cvss_v2} (${cvssInfo(cve.cvss_v2).label})`} />}
        {cve.epss     != null && <DetailRow label="EPSS Score" value={`${(cve.epss * 100).toFixed(4)}%`} />}
        {cve.propose_action && <DetailRow label="Recommended Action" value={cve.propose_action} />}
      </Box>

      {/* Affected products */}
      {cve.cpes?.length > 0 && (
        <Box px={5} pb={3}>
          <Text fontSize="10px" fontWeight="bold" letterSpacing="wider" textTransform="uppercase"
            color="var(--dash-text-muted)" mb={2}>
            Affected Products
          </Text>
          <Flex gap={1.5} flexWrap="wrap">
            {cve.cpes.slice(0, 12).map((cpe, i) => (
              <Box key={i} px="7px" py="2px" borderRadius="4px" fontSize="10px"
                fontFamily="mono" bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                color="var(--dash-text-muted)">
                {cpe}
              </Box>
            ))}
            {cve.cpes.length > 12 && (
              <Box px="7px" py="2px" borderRadius="4px" fontSize="10px"
                bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
                color="var(--dash-text-muted)">
                +{cve.cpes.length - 12} more
              </Box>
            )}
          </Flex>
        </Box>
      )}

      {/* References */}
      {cve.references?.length > 0 && (
        <Box px={5} pb={4} borderTop="1px solid var(--dash-divider)" pt={3}>
          <Text fontSize="10px" fontWeight="bold" letterSpacing="wider" textTransform="uppercase"
            color="var(--dash-text-muted)" mb={2}>
            References
          </Text>
          <Flex direction="column" gap={1}>
            {cve.references.slice(0, 6).map((ref, i) => (
              <Link key={i} href={ref} isExternal
                fontSize="11px" color="rgba(165,180,252,0.8)"
                _hover={{ color: '#a5b4fc', textDecoration: 'underline' }}
                display="flex" alignItems="center" gap={1}
                noOfLines={1}
              >
                <ExternalLinkIcon boxSize={2.5} flexShrink={0} />
                {ref}
              </Link>
            ))}
            {cve.references.length > 6 && (
              <Text fontSize="10px" color="var(--dash-text-muted)" mt={0.5}>
                +{cve.references.length - 6} more references
              </Text>
            )}
          </Flex>
        </Box>
      )}
    </MotionBox>
  );
};

// ── Main view ──────────────────────────────────────────────────────────────────
const CVEFeedView = () => {
  const [feed,       setFeed]       = useState([]);      // top-5 list
  const [newIds,     setNewIds]     = useState(new Set()); // IDs that are "fresh"
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError,  setFeedError]  = useState(null);
  const [countdown,  setCountdown]  = useState(POLL_MS / 1000);

  const [query,      setQuery]      = useState('');
  const [searching,  setSearching]  = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError,  setSearchError]  = useState(null);

  const prevIdsRef = useRef(new Set());
  const timerRef   = useRef(null);
  const cdRef      = useRef(null);

  // ── Fetch latest feed ────────────────────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
    try {
      const res  = await fetch('/api/cve/feed');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = (data.cves ?? data ?? []).slice(0, FEED_SIZE);

      const incoming = new Set(list.map((c) => c.cve_id));
      const fresh    = new Set([...incoming].filter((id) => !prevIdsRef.current.has(id)));
      prevIdsRef.current = incoming;

      setFeed(list);
      setNewIds(fresh);
      setFeedError(null);

      // Clear "fresh" markers after 8 s
      setTimeout(() => setNewIds(new Set()), 8000);
    } catch (e) {
      setFeedError(e.message || 'Failed to fetch CVE feed');
    } finally {
      setFeedLoading(false);
      setCountdown(POLL_MS / 1000);
    }
  }, []);

  // ── Polling + countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchFeed();
    timerRef.current = setInterval(fetchFeed, POLL_MS);
    cdRef.current    = setInterval(() => setCountdown((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(cdRef.current);
    };
  }, [fetchFeed]);

  // ── Search by CVE ID ─────────────────────────────────────────────────────────
  const handleSearch = async () => {
    const id = query.trim().toUpperCase();
    if (!id) return;
    setSearching(true);
    setSearchResult(null);
    setSearchError(null);
    try {
      const res = await fetch(`/api/cve/${encodeURIComponent(id)}`);
      if (res.status === 404) throw new Error(`${id} not found`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSearchResult(data);
    } catch (e) {
      setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResult(null);
    setSearchError(null);
  };

  return (
    <Box pb={8}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            CVE <Text as="span" color="red.400">Feed</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Live vulnerability intelligence · Shodan CVE DB
          </Text>
        </Box>

        {/* Live indicator + countdown */}
        <Flex align="center" gap={3}>
          <Flex align="center" gap={1.5}>
            <Box w="6px" h="6px" borderRadius="full" bg="green.400"
              boxShadow="0 0 8px rgba(104,211,145,0.8)"
              style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            <Text fontSize="11px" color="green.400" fontWeight="semibold">LIVE</Text>
          </Flex>
          <Flex
            align="center" gap={1.5} px={3} py="5px"
            bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
            borderRadius="8px" cursor="pointer"
            onClick={() => { fetchFeed(); }}
            _hover={{ bg: 'rgba(255,255,255,0.07)' }} transition="background 0.15s"
          >
            <RepeatIcon boxSize={3} color="var(--dash-text-muted)" />
            <Text fontSize="11px" color="var(--dash-text-muted)">
              Refresh in {countdown}s
            </Text>
          </Flex>
        </Flex>
      </Flex>

      {/* Two-column layout */}
      <Flex gap={6} direction={{ base: 'column', xl: 'row' }} align="flex-start">

        {/* ── Left: Live feed ─────────────────────────────────────── */}
        <Box flex="1" minW="0">
          <Flex align="center" gap={2} mb={4}>
            <WarningTwoIcon boxSize={3.5} color="red.400" />
            <Text fontSize="11px" fontWeight="bold" letterSpacing="widest"
              color="var(--dash-text-muted)" textTransform="uppercase">
              Latest {FEED_SIZE} CVEs
            </Text>
          </Flex>

          {feedLoading ? (
            <Flex align="center" justify="center" h="300px" gap={3}>
              <Spinner size="sm" color="red.400" />
              <Text fontSize="13px" color="var(--dash-text-muted)">Loading CVE feed…</Text>
            </Flex>
          ) : feedError ? (
            <Flex
              align="center" justify="center" direction="column" h="300px" gap={2}
              bg="rgba(252,129,129,0.05)" border="1px solid rgba(252,129,129,0.15)"
              borderRadius="12px"
            >
              <Text fontSize="13px" color="red.400" fontWeight="semibold">Feed unavailable</Text>
              <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" maxW="260px">
                {feedError}. This may be a CORS restriction — consider proxying via the backend.
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" gap={3}>
              <AnimatePresence mode="popLayout" initial={false}>
                {feed.map((cve) => (
                  <FeedCard key={cve.cve_id} cve={cve} fresh={newIds.has(cve.cve_id)} />
                ))}
              </AnimatePresence>
            </Flex>
          )}
        </Box>

        {/* ── Right: Search ────────────────────────────────────────── */}
        <Box w={{ base: '100%', xl: '440px' }} flexShrink={0}>
          <Flex align="center" gap={2} mb={4}>
            <SearchIcon boxSize={3.5} color="red.400" />
            <Text fontSize="11px" fontWeight="bold" letterSpacing="widest"
              color="var(--dash-text-muted)" textTransform="uppercase">
              Search CVE ID
            </Text>
          </Flex>

          {/* Search input */}
          <Flex gap={2} mb={4}>
            <InputGroup flex="1">
              <InputLeftElement h="36px" pointerEvents="none">
                <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
              </InputLeftElement>
              <Input
                h="36px" pl="32px" fontSize="12px" placeholder="e.g. CVE-2024-12345"
                bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="8px" color="var(--dash-text-primary)"
                _placeholder={{ color: 'var(--dash-text-muted)' }}
                _focus={{ borderColor: 'red.500', boxShadow: '0 0 0 1px rgba(255,80,95,0.35)' }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                fontFamily="mono"
              />
              {query && (
                <InputRightElement h="36px">
                  <IconButton
                    icon={<CloseIcon boxSize={2} />} size="xs" variant="ghost"
                    color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                    onClick={clearSearch} aria-label="Clear"
                  />
                </InputRightElement>
              )}
            </InputGroup>
            <Box
              as="button" onClick={handleSearch}
              h="36px" px={4} borderRadius="8px" fontSize="12px" fontWeight="semibold"
              bg="rgba(255,80,95,0.12)" border="1px solid rgba(255,80,95,0.3)"
              color="red.400" flexShrink={0}
              _hover={{ bg: 'rgba(255,80,95,0.2)' }} transition="background 0.15s"
              display="flex" alignItems="center" justifyContent="center"
            >
              {searching ? <Spinner size="xs" /> : 'Search'}
            </Box>
          </Flex>

          {/* Search states */}
          <AnimatePresence mode="wait">
            {searching && (
              <MotionBox key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Flex align="center" justify="center" h="200px" gap={3}>
                  <Spinner size="sm" color="red.400" />
                  <Text fontSize="13px" color="var(--dash-text-muted)">Looking up {query.trim().toUpperCase()}…</Text>
                </Flex>
              </MotionBox>
            )}

            {!searching && searchError && (
              <MotionBox key="error"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                bg="rgba(252,129,129,0.06)" border="1px solid rgba(252,129,129,0.2)"
                borderRadius="10px" p={4}
              >
                <Text fontSize="13px" color="red.400" fontWeight="semibold" mb={1}>Not Found</Text>
                <Text fontSize="12px" color="var(--dash-text-muted)">{searchError}</Text>
              </MotionBox>
            )}

            {!searching && searchResult && (
              <MotionBox key="result"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CveDetail cve={searchResult} />
              </MotionBox>
            )}

            {!searching && !searchResult && !searchError && (
              <MotionBox key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Flex
                  direction="column" align="center" justify="center" h="200px" gap={2}
                  bg="rgba(255,255,255,0.02)" border="1px dashed rgba(255,255,255,0.08)"
                  borderRadius="10px"
                >
                  <TimeIcon boxSize={5} color="var(--dash-text-muted)" />
                  <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center">
                    Enter a CVE ID to view full details
                  </Text>
                  <Text fontSize="10px" color="var(--dash-text-muted)" opacity={0.6}>
                    e.g. CVE-2024-21413
                  </Text>
                </Flex>
              </MotionBox>
            )}
          </AnimatePresence>
        </Box>
      </Flex>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1);   }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </Box>
  );
};

export default CVEFeedView;
