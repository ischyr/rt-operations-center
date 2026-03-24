import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Flex, Text, Heading, Input, InputGroup, InputLeftElement,
  InputRightElement, IconButton, Spinner, SimpleGrid, Link,
} from '@chakra-ui/react';
import { SearchIcon, ExternalLinkIcon, CloseIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const PAGE_SIZE = 24;

// ── Helpers ────────────────────────────────────────────────────────────────────
const PLATFORM_COLORS = {
  'Windows':      { bg: 'rgba(147,197,253,0.1)',  border: 'rgba(147,197,253,0.25)', text: '#93c5fd' },
  'Linux':        { bg: 'rgba(110,231,183,0.1)',  border: 'rgba(110,231,183,0.25)', text: '#6ee7b7' },
  'macOS':        { bg: 'rgba(209,213,219,0.1)',  border: 'rgba(209,213,219,0.2)',  text: '#d1d5db' },
  'Network':      { bg: 'rgba(252,211,77,0.1)',   border: 'rgba(252,211,77,0.25)',  text: '#fcd34d' },
  'Cloud':        { bg: 'rgba(165,180,252,0.1)',  border: 'rgba(165,180,252,0.25)', text: '#a5b4fc' },
  'Android':      { bg: 'rgba(134,239,172,0.1)',  border: 'rgba(134,239,172,0.25)', text: '#86efac' },
  'iOS':          { bg: 'rgba(209,213,219,0.1)',  border: 'rgba(209,213,219,0.2)',  text: '#d1d5db' },
  'Containers':   { bg: 'rgba(118,228,247,0.1)',  border: 'rgba(118,228,247,0.25)', text: '#76e4f7' },
  'Office 365':   { bg: 'rgba(246,173,85,0.1)',   border: 'rgba(246,173,85,0.25)',  text: '#f6ad55' },
  'Azure AD':     { bg: 'rgba(165,180,252,0.1)',  border: 'rgba(165,180,252,0.25)', text: '#a5b4fc' },
  'SaaS':         { bg: 'rgba(183,148,244,0.1)',  border: 'rgba(183,148,244,0.25)', text: '#b794f4' },
};

const platformStyle = (p) =>
  PLATFORM_COLORS[p] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: 'var(--dash-text-muted)' };

const typeStyle = (type) =>
  type === 'tool'
    ? { bg: 'rgba(147,197,253,0.1)', border: 'rgba(147,197,253,0.3)', text: '#93c5fd', label: 'TOOL' }
    : { bg: 'rgba(252,129,129,0.1)', border: 'rgba(252,129,129,0.3)', text: '#fc8181', label: 'MALWARE' };

const strip = (md) => md?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '').replace(/`/g, '') || '';

// ── Tool card ──────────────────────────────────────────────────────────────────
const ToolCard = ({ tool }) => {
  const tc = typeStyle(tool.type);

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      bg="var(--dash-card-bg)"
      border="1px solid var(--dash-card-border)"
      borderRadius="12px" p={4}
      display="flex" flexDirection="column" gap={3}
      pos="relative" overflow="hidden"
      transition2="transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease"
      _hover={{ transform: 'translateY(-3px)', boxShadow: '0 8px 28px rgba(0,0,0,0.4)', borderColor: tc.border }}
    >
      {/* Top accent */}
      <Box pos="absolute" top="0" left="0" right="0" h="1.5px"
        style={{ background: `linear-gradient(to right, transparent, ${tc.text}, transparent)` }} />

      {/* Header */}
      <Flex align="flex-start" justify="space-between" gap={2}>
        <Box flex="1" minW="0">
          <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)"
            noOfLines={1} mb="2px">
            {tool.name}
          </Text>
          <Flex align="center" gap={1.5} flexWrap="wrap">
            {/* MITRE ID */}
            {tool.id && (
              <Box px="5px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                letterSpacing="wider" bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                color="var(--dash-text-muted)" fontFamily="mono">
                {tool.id}
              </Box>
            )}
            {/* Type badge */}
            <Box px="5px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
              letterSpacing="wider" bg={tc.bg} border={`1px solid ${tc.border}`} color={tc.text}>
              {tc.label}
            </Box>
          </Flex>
        </Box>

        {/* MITRE link */}
        {tool.url && (
          <Link href={tool.url} isExternal flexShrink={0}
            color="var(--dash-text-muted)" _hover={{ color: 'var(--dash-text-primary)' }}
            transition="color 0.15s">
            <ExternalLinkIcon boxSize={3.5} />
          </Link>
        )}
      </Flex>

      {/* Description */}
      <Text fontSize="11px" color="var(--dash-text-secondary)" lineHeight="tall" noOfLines={3} flex="1">
        {strip(tool.description) || 'No description available.'}
      </Text>

      {/* Platforms */}
      {tool.platforms.length > 0 && (
        <Flex gap={1} flexWrap="wrap">
          {tool.platforms.slice(0, 5).map((p) => {
            const ps = platformStyle(p);
            return (
              <Box key={p} px="5px" py="1px" borderRadius="4px" fontSize="9px"
                fontWeight="semibold" letterSpacing="wider"
                bg={ps.bg} border={`1px solid ${ps.border}`} color={ps.text}>
                {p.toUpperCase()}
              </Box>
            );
          })}
          {tool.platforms.length > 5 && (
            <Box px="5px" py="1px" borderRadius="4px" fontSize="9px"
              bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
              color="var(--dash-text-muted)">
              +{tool.platforms.length - 5}
            </Box>
          )}
        </Flex>
      )}

      {/* Aliases */}
      {tool.aliases.length > 0 && (
        <Flex align="center" gap={1.5} flexWrap="wrap">
          <Text fontSize="9px" color="var(--dash-text-muted)" flexShrink={0}>AKA</Text>
          {tool.aliases.slice(0, 3).map((a) => (
            <Text key={a} fontSize="9px" color="var(--dash-text-muted)"
              fontStyle="italic" fontFamily="mono">
              {a}
            </Text>
          ))}
          {tool.aliases.length > 3 && (
            <Text fontSize="9px" color="var(--dash-text-muted)">+{tool.aliases.length - 3}</Text>
          )}
        </Flex>
      )}
    </MotionBox>
  );
};

// ── Filter pill ────────────────────────────────────────────────────────────────
const FilterPill = ({ label, active, count, color, onClick }) => (
  <Box
    as="button" onClick={onClick}
    px={3} py="5px" borderRadius="8px" fontSize="11px" fontWeight="semibold"
    transition="all 0.18s ease"
    bg={active ? (color?.bg || 'rgba(255,80,95,0.15)') : 'rgba(255,255,255,0.04)'}
    border={`1px solid ${active ? (color?.border || 'rgba(255,80,95,0.35)') : 'rgba(255,255,255,0.08)'}`}
    color={active ? (color?.text || 'red.400') : 'var(--dash-text-muted)'}
    _hover={{ borderColor: color?.border || 'rgba(255,80,95,0.35)', color: color?.text || 'red.400' }}
  >
    {label}
    {count != null && (
      <Text as="span" ml={1.5} opacity={0.7} fontSize="10px">({count})</Text>
    )}
  </Box>
);

// ── Pagination ─────────────────────────────────────────────────────────────────
const Pagination = ({ page, total, pageSize, onChange }) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i;
    if (page < 4) return i;
    if (page > totalPages - 4) return totalPages - 7 + i;
    return page - 3 + i;
  });

  return (
    <Flex align="center" justify="center" gap={1.5} mt={8}>
      <Box as="button" onClick={() => onChange(page - 1)} disabled={page === 0}
        px={3} py="5px" borderRadius="7px" fontSize="11px"
        bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
        color={page === 0 ? 'var(--dash-text-muted)' : 'var(--dash-text-secondary)'}
        opacity={page === 0 ? 0.4 : 1} cursor={page === 0 ? 'not-allowed' : 'pointer'}
        _hover={page === 0 ? {} : { bg: 'rgba(255,255,255,0.08)' }}>
        ←
      </Box>
      {pages.map((p) => (
        <Box key={p} as="button" onClick={() => onChange(p)}
          w="30px" h="30px" borderRadius="7px" fontSize="11px" fontWeight="semibold"
          display="flex" alignItems="center" justifyContent="center"
          bg={p === page ? 'rgba(255,80,95,0.15)' : 'rgba(255,255,255,0.04)'}
          border={`1px solid ${p === page ? 'rgba(255,80,95,0.35)' : 'rgba(255,255,255,0.08)'}`}
          color={p === page ? 'red.400' : 'var(--dash-text-muted)'}
          _hover={p === page ? {} : { bg: 'rgba(255,255,255,0.08)' }}>
          {p + 1}
        </Box>
      ))}
      <Box as="button" onClick={() => onChange(page + 1)} disabled={page === totalPages - 1}
        px={3} py="5px" borderRadius="7px" fontSize="11px"
        bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
        color={page === totalPages - 1 ? 'var(--dash-text-muted)' : 'var(--dash-text-secondary)'}
        opacity={page === totalPages - 1 ? 0.4 : 1}
        cursor={page === totalPages - 1 ? 'not-allowed' : 'pointer'}
        _hover={page === totalPages - 1 ? {} : { bg: 'rgba(255,255,255,0.08)' }}>
        →
      </Box>
    </Flex>
  );
};

// ── Main view ──────────────────────────────────────────────────────────────────
const ToolsView = () => {
  const [allTools,  setAllTools]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [query,     setQuery]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'tool' | 'malware'
  const [page,      setPage]      = useState(0);
  const topRef = useRef(null);

  // Fetch all tools once
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch('/api/tools');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAllTools(data.tools || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Client-side filter
  const filtered = useMemo(() => {
    let list = allTools;
    if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q)        ||
        strip(t.description).toLowerCase().includes(q) ||
        t.aliases.some(a => a.toLowerCase().includes(q)) ||
        t.platforms.some(p => p.toLowerCase().includes(q)) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTools, query, typeFilter]);

  // Reset page on filter change
  const handleQuery = useCallback((v) => { setQuery(v); setPage(0); }, []);
  const handleType  = useCallback((v) => { setTypeFilter(v); setPage(0); }, []);

  // Scroll to top on page change
  const handlePage = useCallback((p) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toolCount    = allTools.filter(t => t.type === 'tool').length;
  const malwareCount = allTools.filter(t => t.type === 'malware').length;

  return (
    <Box pb={8} ref={topRef}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} wrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            MITRE ATT&amp;CK{' '}
            <Text as="span" color="red.400">Software</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Complete tool &amp; malware mapping · sourced from{' '}
            <Link href="https://attack.mitre.org/software/" isExternal
              color="rgba(165,180,252,0.8)" _hover={{ color: '#a5b4fc' }}>
              attack.mitre.org/software
            </Link>
          </Text>
        </Box>
        {!loading && (
          <Flex align="center" gap={2} px={3} py="6px"
            bg="rgba(255,80,95,0.08)" border="1px solid rgba(255,80,95,0.2)"
            borderRadius="8px">
            <Text fontSize="11px" color="red.300" fontWeight="semibold">
              {allTools.length} entries
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Search + Filters */}
      <Flex gap={3} mb={5} wrap="wrap" align="center">
        {/* Search bar */}
        <InputGroup flex="1" minW="220px">
          <InputLeftElement h="36px" pointerEvents="none">
            <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
          </InputLeftElement>
          <Input
            h="36px" pl="32px" fontSize="12px"
            placeholder="Search by name, keyword, platform… e.g. tunnel, shellcode, beacon"
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="8px" color="var(--dash-text-primary)"
            _placeholder={{ color: 'var(--dash-text-muted)' }}
            _focus={{ borderColor: 'red.500', boxShadow: '0 0 0 1px rgba(255,80,95,0.35)' }}
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
          />
          {query && (
            <InputRightElement h="36px">
              <IconButton icon={<CloseIcon boxSize={2} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                onClick={() => handleQuery('')} aria-label="Clear" />
            </InputRightElement>
          )}
        </InputGroup>

        {/* Type filter */}
        <Flex gap={2} flexShrink={0}>
          <FilterPill label="All" count={allTools.length} active={typeFilter === 'all'}
            onClick={() => handleType('all')} />
          <FilterPill label="Tools" count={toolCount} active={typeFilter === 'tool'}
            color={{ bg: 'rgba(147,197,253,0.1)', border: 'rgba(147,197,253,0.3)', text: '#93c5fd' }}
            onClick={() => handleType('tool')} />
          <FilterPill label="Malware" count={malwareCount} active={typeFilter === 'malware'}
            color={{ bg: 'rgba(252,129,129,0.1)', border: 'rgba(252,129,129,0.3)', text: '#fc8181' }}
            onClick={() => handleType('malware')} />
        </Flex>
      </Flex>

      {/* Results count */}
      {!loading && query && (
        <Text fontSize="11px" color="var(--dash-text-muted)" mb={4}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </Text>
      )}

      {/* States */}
      {loading ? (
        <Flex align="center" justify="center" direction="column" h="360px" gap={4}>
          <Spinner size="lg" color="red.400" thickness="2px" />
          <Box textAlign="center">
            <Text fontSize="13px" color="var(--dash-text-primary)" fontWeight="semibold" mb={1}>
              Fetching MITRE ATT&amp;CK data…
            </Text>
            <Text fontSize="11px" color="var(--dash-text-muted)">
              Downloading software index from GitHub — this only happens once per 24 h
            </Text>
          </Box>
        </Flex>
      ) : error ? (
        <Flex align="center" justify="center" direction="column" h="300px" gap={2}
          bg="rgba(252,129,129,0.05)" border="1px solid rgba(252,129,129,0.15)"
          borderRadius="12px">
          <Text fontSize="13px" color="red.400" fontWeight="semibold">Failed to load</Text>
          <Text fontSize="11px" color="var(--dash-text-muted)" maxW="320px" textAlign="center">
            {error}
          </Text>
        </Flex>
      ) : filtered.length === 0 ? (
        <Flex align="center" justify="center" direction="column" h="280px" gap={2}
          bg="rgba(255,255,255,0.02)" border="1px dashed rgba(255,255,255,0.08)"
          borderRadius="12px">
          <Text fontSize="13px" color="var(--dash-text-muted)">No tools match &ldquo;{query}&rdquo;</Text>
          <Text fontSize="11px" color="var(--dash-text-muted)" opacity={0.6}>
            Try a different keyword — e.g. proxy, inject, lateral, exfil
          </Text>
        </Flex>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
            <AnimatePresence mode="popLayout" initial={false}>
              {paged.map((tool) => (
                <ToolCard key={tool.id + tool.name} tool={tool} />
              ))}
            </AnimatePresence>
          </SimpleGrid>

          <Pagination
            page={page}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onChange={handlePage}
          />

          <Text fontSize="10px" color="var(--dash-text-muted)" textAlign="center" mt={4}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            {query ? ` results` : ` entries`}
          </Text>
        </>
      )}
    </Box>
  );
};

export default ToolsView;
