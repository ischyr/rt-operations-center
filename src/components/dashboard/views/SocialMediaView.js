import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input,
  SimpleGrid, Spinner, Tooltip, Badge, useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, DeleteIcon, ExternalLinkIcon, RepeatIcon, CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox  = motion(Box);
const MotionFlex = motion(Flex);

// ── Theme ─────────────────────────────────────────────────────────────────────
const ACCENT = '#FC8181';
const GREEN  = '#68D391';
const MUTED  = 'var(--dash-text-muted)';
const BORDER = 'rgba(255,255,255,0.07)';
const CARD   = 'rgba(255,255,255,0.03)';
const A_S    = 'rgba(252,129,129,0.08)';

// ── Platform accent colors ────────────────────────────────────────────────────
const PLATFORM_COLOR = {
  twitter:   '#1DA1F2', x: '#E7E9EA',
  github:    '#8B949E', instagram: '#E4405F',
  linkedin:  '#0A66C2', facebook: '#1877F2',
  reddit:    '#FF4500', tiktok: '#69C9D0',
  youtube:   '#FF0000', pinterest: '#BD081C',
  snapchat:  '#FFFC00', twitch: '#9146FF',
  discord:   '#5865F2', telegram: '#26A5E4',
  mastodon:  '#6364FF', bluesky: '#0085FF',
  tumblr:    '#35465C', flickr: '#FF0084',
  vimeo:     '#1AB7EA', medium: '#00AB6C',
  behance:   '#1769FF', dribbble: '#EA4C89',
  devto:     '#0A0A0A', hackernews: '#FF6600',
  stackoverflow: '#F58025', gitlab: '#FC6D26',
  bitbucket: '#0052CC', steam: '#00ADEE',
  xbox:      '#107C10', playstation: '#003087',
  spotify:   '#1ED760', soundcloud: '#FF5500',
  lastfm:    '#D51007', bandcamp: '#1DA0C3',
  patreon:   '#FF424D', ko_fi: '#FF5E5B',
  onlyfans:  '#00AFF0', cashapp: '#00D64F',
  venmo:     '#3D95CE', paypal: '#003087',
};

const platformColor = (name) => {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return PLATFORM_COLOR[key] || '#A0AEC0';
};

const platformInitial = (name) => name.slice(0, 2).toUpperCase();

// ── API ───────────────────────────────────────────────────────────────────────
const tok = () => localStorage.getItem('token') || '';

// ── CopyBtn ───────────────────────────────────────────────────────────────────
const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <Tooltip label={copied ? 'Copied!' : 'Copy URL'} hasArrow fontSize="10px">
      <IconButton icon={copied ? <CheckIcon /> : <CopyIcon />} size="xs"
        variant="ghost" color={copied ? GREEN : MUTED}
        _hover={{ color: 'white' }} onClick={copy} aria-label="copy" />
    </Tooltip>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
  <Box borderRadius="12px" bg={CARD} border={`1px solid ${BORDER}`} px={4} py={3}>
    <Text fontSize="10px" color={MUTED} textTransform="uppercase" letterSpacing="wider"
      fontWeight="bold" mb={1}>{label}</Text>
    <Text fontSize="22px" fontWeight="bold" color={color || 'var(--dash-text-primary)'}
      lineHeight={1}>{value ?? '—'}</Text>
  </Box>
);

// ── ResultRow ─────────────────────────────────────────────────────────────────
const ResultRow = ({ item, found }) => {
  const color = found ? platformColor(item.platform) : 'rgba(255,255,255,0.15)';
  return (
    <MotionFlex
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      align="center" gap={3} px={4} py="10px"
      borderBottom={`1px solid ${BORDER}`}
      _hover={{ bg: 'rgba(255,255,255,0.025)' }} transition="background 0.15s"
    >
      {/* Platform avatar */}
      <Box w="30px" h="30px" borderRadius="8px" flexShrink={0}
        bg={`${color}20`} border={`1px solid ${color}40`}
        display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="10px" fontWeight="bold" color={color}>
          {platformInitial(item.platform)}
        </Text>
      </Box>

      {/* Platform name */}
      <Text fontSize="13px" fontWeight="semibold"
        color={found ? 'var(--dash-text-primary)' : MUTED}
        flex="0 0 150px" minW="120px">{item.platform}</Text>

      {/* URL / status */}
      <Box flex="1" minW={0}>
        {found ? (
          <Text fontSize="12px" color={GREEN} fontFamily="mono" noOfLines={1}>{item.url}</Text>
        ) : (
          <Text fontSize="11px" color={MUTED} opacity={0.5}>Not Found</Text>
        )}
      </Box>

      {/* Actions */}
      <Flex align="center" gap={1} flexShrink={0}>
        {found && <CopyBtn text={item.url} />}
        {found && (
          <Tooltip label="Open profile" hasArrow fontSize="10px">
            <IconButton as="a" href={item.url} target="_blank" rel="noopener noreferrer"
              icon={<ExternalLinkIcon />} size="xs" variant="ghost"
              color={MUTED} _hover={{ color: GREEN }} aria-label="open" />
          </Tooltip>
        )}
      </Flex>

      {/* Badge */}
      <Box w="60px" textAlign="right" flexShrink={0}>
        {found
          ? <Badge fontSize="9px" bg={`${GREEN}15`} color={GREEN} border={`1px solid ${GREEN}30`}
              borderRadius="full" px={2}>Found</Badge>
          : <Badge fontSize="9px" bg="rgba(255,255,255,0.04)" color={MUTED}
              border={`1px solid ${BORDER}`} borderRadius="full" px={2}>Not Found</Badge>
        }
      </Box>
    </MotionFlex>
  );
};

// ── HistoryItem ───────────────────────────────────────────────────────────────
const HistoryItem = ({ scan, isActive, onClick, onDelete }) => (
  <Flex align="center" gap={3} px={3} py="10px" borderRadius="8px" cursor="pointer"
    bg={isActive ? 'rgba(255,255,255,0.06)' : 'transparent'}
    border={isActive ? `1px solid ${BORDER}` : '1px solid transparent'}
    _hover={{ bg: 'rgba(255,255,255,0.04)' }} transition="all 0.15s"
    onClick={onClick}>
    <Box flex="1" minW={0}>
      <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)"
        noOfLines={1}>@{scan.username}</Text>
      <Text fontSize="10px" color={MUTED} mt={0.5}>
        {scan.found?.length || 0} found · {new Date(scan.createdAt).toLocaleDateString()}
      </Text>
    </Box>
    <Badge fontSize="10px" bg={`${GREEN}15`} color={GREEN}
      border={`1px solid ${GREEN}25`} borderRadius="full" px={2} flexShrink={0}>
      {scan.found?.length || 0}
    </Badge>
    <Tooltip label="Delete scan" hasArrow fontSize="10px">
      <IconButton icon={<DeleteIcon />} size="xs" variant="ghost"
        color={MUTED} _hover={{ color: ACCENT }}
        onClick={e => { e.stopPropagation(); onDelete(scan._id); }}
        aria-label="delete" />
    </Tooltip>
  </Flex>
);

// ── Main View ─────────────────────────────────────────────────────────────────
const SocialMediaView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const [username,    setUsername]    = useState('');
  const [scanning,    setScanning]    = useState(false);
  const [results,     setResults]     = useState([]);   // [{platform, url, found}]
  const [stats,       setStats]       = useState(null); // {found, total, duration}
  const [filter,      setFilter]      = useState('all');
  const [history,     setHistory]     = useState([]);
  const [activeScan,  setActiveScan]  = useState(null); // viewing a past scan
  const [elapsed,     setElapsed]     = useState(0);
  const [infoMsgs,    setInfoMsgs]    = useState([]);
  const abortRef  = useRef(null);
  const timerRef  = useRef(null);
  const bottomRef = useRef(null);

  // ── Fetch history ──────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!engId) return;
    try {
      const r = await fetch(`/api/social-media/${engId}/history`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d = await r.json();
      setHistory(Array.isArray(d) ? d : []);
    } catch (_) {}
  }, [engId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Start scan ─────────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (!username.trim()) {
      toast({ title: 'Enter a username', status: 'warning', duration: 2000, isClosable: true });
      return;
    }
    if (scanning) {
      // cancel
      abortRef.current?.abort();
      return;
    }

    setScanning(true);
    setResults([]);
    setStats(null);
    setInfoMsgs([]);
    setActiveScan(null);
    setElapsed(0);

    // elapsed timer
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(`/api/social-media/${engId}/scan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tok()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Scan failed');
      }

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let   buf     = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'found') {
              setResults(p => [...p, { platform: ev.platform, url: ev.url, found: true }]);
              setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            } else if (ev.type === 'not_found') {
              setResults(p => [...p, { platform: ev.platform, found: false }]);
            } else if (ev.type === 'info') {
              setInfoMsgs(p => [...p.slice(-4), ev.message]);
            } else if (ev.type === 'error') {
              toast({ title: 'Scan error', description: ev.message, status: 'error', duration: 5000, isClosable: true });
            } else if (ev.type === 'done') {
              setStats({ found: ev.found, total: ev.total, duration: ev.duration });
              fetchHistory();
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        toast({ title: 'Scan failed', description: e.message, status: 'error', duration: 4000, isClosable: true });
      }
    } finally {
      clearInterval(timerRef.current);
      setScanning(false);
    }
  };

  // ── Delete scan ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await fetch(`/api/social-media/${engId}/scan/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok()}` },
      });
      setHistory(p => p.filter(s => s._id !== id));
      if (activeScan?._id === id) setActiveScan(null);
    } catch (_) {}
  };

  // ── Load historical scan ───────────────────────────────────────────────────
  const loadScan = (scan) => {
    if (scanning) return;
    setActiveScan(scan);
    const rows = [
      ...(scan.found    || []).map(f  => ({ ...f,             found: true  })),
      ...(scan.notFound || []).map(pf => ({ platform: pf,     found: false })),
    ];
    setResults(rows);
    setStats({ found: scan.found?.length || 0, total: scan.total || 0, duration: scan.duration });
    setUsername(scan.username);
    setFilter('all');
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const displayed = filter === 'found' ? results.filter(r => r.found) : results;
  const foundCount   = results.filter(r =>  r.found).length;
  const checkedCount = results.length;

  const fmtElapsed = (s) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;

  return (
    <Box>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Social <Text as="span" color="red.400">Media</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng?.name} · username recon via Sherlock · find accounts across 400+ platforms
          </Text>
        </Box>
        {scanning && (
          <Flex align="center" gap={2}>
            <Spinner size="xs" color={GREEN} />
            <Text fontSize="12px" color={GREEN} fontFamily="mono">{fmtElapsed(elapsed)}</Text>
          </Flex>
        )}
      </Flex>

      {/* ── Input row ────────────────────────────────────────────────────── */}
      <Flex align="center" gap={3} mb={5}>
        <Box flex="1" pos="relative">
          <Box pos="absolute" left={3} top="50%" transform="translateY(-50%)" pointerEvents="none">
            <Text fontSize="13px" color={MUTED}>@</Text>
          </Box>
          <Input
            pl={7} h="42px" fontSize="sm" borderRadius="10px"
            bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
            color="var(--dash-text-primary)"
            _placeholder={{ color: MUTED }}
            _hover={{ borderColor: 'rgba(255,255,255,0.2)' }}
            _focus={{ borderColor: 'rgba(255,255,255,0.3)', boxShadow: 'none' }}
            placeholder="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            isDisabled={scanning}
          />
        </Box>

        <Button
          h="42px" px={6} borderRadius="10px" fontSize="13px" fontWeight="bold"
          variant="outline"
          color="red.400"
          borderColor={scanning ? 'rgba(252,129,129,0.35)' : 'red.400'}
          bg={scanning ? 'rgba(252,129,129,0.08)' : 'transparent'}
          leftIcon={scanning ? <Spinner size="xs" color="red.400" /> : <SearchIcon boxSize={3} />}
          _hover={{ bg: 'rgba(252,129,129,0.12)', borderColor: 'red.300', color: 'red.300' }}
          transition="all 0.2s" onClick={handleScan}>
          {scanning ? 'Stop' : 'Scan'}
        </Button>

        {results.length > 0 && (
          <Flex gap={1} p="3px" borderRadius="9px" bg="rgba(255,255,255,0.04)"
            border={`1px solid ${BORDER}`}>
            {['all', 'found'].map(f => (
              <Box key={f} px={3} py="5px" borderRadius="7px" cursor="pointer"
                fontSize="11px" fontWeight="semibold"
                bg={filter === f ? 'rgba(255,255,255,0.09)' : 'transparent'}
                color={filter === f ? 'var(--dash-text-primary)' : MUTED}
                onClick={() => setFilter(f)} transition="all 0.15s" textTransform="capitalize">
                {f === 'all' ? `All (${checkedCount})` : `Found (${foundCount})`}
              </Box>
            ))}
          </Flex>
        )}
      </Flex>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      {(stats || scanning) && (
        <SimpleGrid columns={4} spacing={4} mb={5}>
          <StatCard label="Found"     value={foundCount}                    color={GREEN} />
          <StatCard label="Checked"   value={checkedCount}                               />
          <StatCard label="Not Found" value={checkedCount - foundCount}     color={MUTED} />
          <StatCard label="Duration"  value={stats ? fmtElapsed(stats.duration) : fmtElapsed(elapsed)} />
        </SimpleGrid>
      )}

      {/* ── Live ticker ──────────────────────────────────────────────────── */}
      {scanning && infoMsgs.length > 0 && (
        <Flex align="center" gap={2} mb={3}>
          <Spinner size="xs" color={MUTED} />
          <Text fontSize="11px" color={MUTED} fontFamily="mono" noOfLines={1}>
            {infoMsgs[infoMsgs.length - 1]}
          </Text>
        </Flex>
      )}

      {/* ── Main two-column layout ────────────────────────────────────────── */}
      <Flex gap={5} align="flex-start">

        {/* Results panel */}
        <Box flex="1" borderRadius="14px" border={`1px solid ${BORDER}`}
          bg={CARD} overflow="hidden" minH="200px">

          {/* Table head */}
          {results.length > 0 && (
            <Flex px={4} py="9px" borderBottom={`1px solid ${BORDER}`}
              bg="rgba(255,255,255,0.02)">
              <Text fontSize="9px" color={MUTED} textTransform="uppercase"
                letterSpacing="wider" fontWeight="bold" flex="0 0 180px">Platform</Text>
              <Text fontSize="9px" color={MUTED} textTransform="uppercase"
                letterSpacing="wider" fontWeight="bold" flex="1">Profile URL</Text>
              <Box w="110px" />
            </Flex>
          )}

          <AnimatePresence>
            {displayed.map((item, i) => (
              <ResultRow key={`${item.platform}-${i}`} item={item} found={item.found} />
            ))}
          </AnimatePresence>

          {!scanning && results.length === 0 && (
            <Flex direction="column" align="center" justify="center" py={16} gap={4} opacity={0.45}>
              <Box as="svg" viewBox="0 0 24 24" w="36px" h="36px" fill="none"
                stroke={MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </Box>
              <Text fontSize="13px" color={MUTED} textAlign="center">
                Enter a username and hit Scan
                <br /><Text as="span" fontSize="11px">Sherlock searches 400+ platforms</Text>
              </Text>
            </Flex>
          )}

          {scanning && results.length === 0 && (
            <Flex direction="column" align="center" justify="center" py={16} gap={3}>
              <Spinner size="lg" color={GREEN} thickness="2px" speed="0.8s" />
              <Text fontSize="13px" color={MUTED}>Scanning…</Text>
              <Text fontSize="11px" color={MUTED} opacity={0.6}>First run pulls the Docker image — may take a moment</Text>
            </Flex>
          )}

          <Box ref={bottomRef} />
        </Box>

        {/* History panel */}
        <Flex direction="column" w="250px" flexShrink={0} borderRadius="14px"
          border={`1px solid ${BORDER}`} bg={CARD} overflow="hidden">

          <Flex align="center" justify="space-between" px={4} py={3}
            borderBottom={`1px solid ${BORDER}`}>
            <Text fontSize="10px" color={MUTED} textTransform="uppercase"
              letterSpacing="wider" fontWeight="bold">Scan History</Text>
            <Tooltip label="Refresh" hasArrow fontSize="10px">
              <IconButton icon={<RepeatIcon />} size="xs" variant="ghost"
                color={MUTED} _hover={{ color:'white' }} onClick={fetchHistory} aria-label="refresh" />
            </Tooltip>
          </Flex>

          <Box px={2} py={2} maxH="500px" overflowY="auto"
            css={{ '&::-webkit-scrollbar': { width:'2px' }, '&::-webkit-scrollbar-thumb': { background:'rgba(255,255,255,0.06)' } }}>
            {history.length === 0 ? (
              <Flex align="center" justify="center" py={8}>
                <Text fontSize="11px" color={MUTED} opacity={0.5}>No scans yet</Text>
              </Flex>
            ) : (
              history.map(scan => (
                <HistoryItem key={scan._id} scan={scan}
                  isActive={activeScan?._id === scan._id}
                  onClick={() => loadScan(scan)} onDelete={handleDelete} />
              ))
            )}
          </Box>

          <Flex align="flex-start" gap={2} px={4} py={3} borderTop={`1px solid ${BORDER}`}>
            <Box as="svg" viewBox="0 0 24 24" w="11px" h="11px" fill="none"
              stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              flexShrink={0} mt="1px">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </Box>
            <Text fontSize="10px" color={MUTED} lineHeight="1.5">
              Requires Docker with{' '}
              <Text as="span" fontFamily="mono" color="var(--dash-text-secondary)">sherlock/sherlock</Text>
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};

export default SocialMediaView;
