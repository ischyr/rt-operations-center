import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input,
  Spinner, Tooltip, useToast, Modal, ModalOverlay,
  ModalContent, ModalBody, ModalCloseButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchIcon, DeleteIcon, CopyIcon, CheckIcon, RepeatIcon, ExternalLinkIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Theme ──────────────────────────────────────────────────────────────────────
const ACCENT  = '#A78BFA';   // purple — visual recon
const A_S     = 'rgba(167,139,250,0.07)';
const A_B     = 'rgba(167,139,250,0.25)';
const GREEN   = '#68D391';
const RED     = '#FC8181';
const ORANGE  = '#F6AD55';
const BLUE    = '#63B3ED';
const PINK    = '#F687B3';
const MUTED   = 'var(--dash-text-muted)';
const CARD_BG = 'var(--dash-card-bg)';
const CARD_BD = 'var(--dash-card-border)';

const tok   = () => localStorage.getItem('token') || '';
const lsKey = (id) => `domain-flyover-active-${id}`;

// ── Status code → color ────────────────────────────────────────────────────────
const statusColor = (code) => {
  if (!code) return MUTED;
  if (code >= 200 && code < 300) return GREEN;
  if (code >= 300 && code < 400) return BLUE;
  if (code >= 400 && code < 500) return ORANGE;
  return RED;
};

// ── fmtRelative ────────────────────────────────────────────────────────────────
const fmtRelative = (d) => {
  if (!d) return '';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ── CopyBtn ────────────────────────────────────────────────────────────────────
const CopyBtn = ({ text, size = 'xs' }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <Tooltip label={copied ? 'Copied!' : 'Copy'} hasArrow fontSize="10px">
      <IconButton icon={copied ? <CheckIcon /> : <CopyIcon />} size={size}
        variant="ghost" color={copied ? GREEN : MUTED} _hover={{ color: 'white' }}
        onClick={copy} aria-label="copy" />
    </Tooltip>
  );
};

// ── ScreenshotCard ─────────────────────────────────────────────────────────────
const ScreenshotCard = ({ item, index, onExpand }) => {
  const sc = statusColor(item.statusCode);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.6) }}
      borderRadius="12px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
      overflow="hidden" role="group"
      _hover={{ borderColor: `${ACCENT}40`, transform: 'translateY(-2px)', boxShadow: `0 8px 28px rgba(167,139,250,0.12)` }}
      style={{ transition: 'all 0.18s ease' }}
      cursor="pointer">

      {/* Screenshot thumbnail */}
      <Box w="100%" h="158px" bg="rgba(0,0,0,0.45)" pos="relative" overflow="hidden"
        onClick={() => item.screenshot && onExpand(item)}>

        {item.screenshot ? (
          <Box as="img"
            src={`data:image/png;base64,${item.screenshot}`}
            alt={item.url} w="100%" h="100%"
            style={{ objectFit: 'cover', objectPosition: 'top' }} />
        ) : (
          <Flex align="center" justify="center" h="100%" direction="column" gap={2} opacity={0.25}>
            <Box as="svg" viewBox="0 0 24 24" w="30px" h="30px" fill="none"
              stroke={MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </Box>
            <Text fontSize="10px" color={MUTED}>No screenshot</Text>
          </Flex>
        )}

        {/* Status badge overlay */}
        <Box pos="absolute" top={2} left={2}>
          <Box px="6px" py="2px" borderRadius="5px" display="inline-block"
            bg="rgba(0,0,0,0.72)" border={`1px solid ${sc}45`} backdropFilter="blur(4px)">
            <Text fontSize="10px" fontWeight="bold" color={sc} fontFamily="mono">
              {item.statusCode || '—'}
            </Text>
          </Box>
        </Box>

        {/* Expand hint — visible on hover */}
        {item.screenshot && (
          <Flex pos="absolute" top={2} right={2}
            opacity={0} _groupHover={{ opacity: 1 }} transition="opacity 0.15s"
            align="center" gap={1} px="6px" py="4px" borderRadius="5px"
            bg="rgba(0,0,0,0.72)" border={`1px solid ${A_B}`} backdropFilter="blur(4px)">
            <ExternalLinkIcon boxSize={2.5} color={ACCENT} />
            <Text fontSize="9px" color={ACCENT} fontWeight="bold">expand</Text>
          </Flex>
        )}
      </Box>

      {/* Card body */}
      <Box px={3} pt={3} pb="11px">
        {/* URL row */}
        <Flex align="center" gap={1} mb={item.title ? 1.5 : 0}>
          <Text fontSize="11px" fontWeight="semibold" color="var(--dash-text-primary)"
            fontFamily="mono" noOfLines={1} flex="1" title={item.url}>
            {item.url}
          </Text>
          <Tooltip label="Open in browser" hasArrow fontSize="10px">
            <IconButton icon={<ExternalLinkIcon boxSize={2.5} />} size="xs" variant="ghost"
              color={MUTED} _hover={{ color: ACCENT }} flexShrink={0}
              onClick={e => { e.stopPropagation(); window.open(item.url, '_blank'); }}
              aria-label="open" />
          </Tooltip>
          <CopyBtn text={item.url} />
        </Flex>

        {/* Title */}
        {item.title && (
          <Text fontSize="10px" color="var(--dash-text-secondary)" noOfLines={1} title={item.title}>
            {item.title}
          </Text>
        )}

        {/* Final URL (if redirect) */}
        {item.finalUrl && item.finalUrl !== item.url && (
          <Flex align="center" gap={1} mt={1}>
            <Box w="3px" h="3px" borderRadius="full" bg={BLUE} flexShrink={0} />
            <Text fontSize="9px" color={BLUE} fontFamily="mono" noOfLines={1}
              title={item.finalUrl} opacity={0.75}>
              → {item.finalUrl}
            </Text>
          </Flex>
        )}
      </Box>
    </MotionBox>
  );
};

// ── Main View ──────────────────────────────────────────────────────────────────
const DomainFlyoverView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const [inputMode,    setInputMode]    = useState('single');
  const [singleInput,  setSingleInput]  = useState('');
  const [importedFile, setImportedFile] = useState(null);
  const [activeScan,   setActiveScan]   = useState(null);
  const [history,      setHistory]      = useState([]);
  const [showRaw,      setShowRaw]      = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedItem, setExpandedItem] = useState(null);

  const pollRef = useRef(null);
  const termRef = useRef(null);
  const fileRef = useRef(null);

  const isScanning = activeScan?.status === 'scanning';
  const liveOutput = activeScan?.liveOutput || '';
  const results    = activeScan?.results   || [];

  // Auto-scroll terminal
  useEffect(() => {
    if (isScanning && termRef.current)
      termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [liveOutput, isScanning]);

  // ── Parse import file ────────────────────────────────────────────────────────
  const parseFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      let domains = [];
      let meta    = null;

      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.totalUnique)) {
            const root = parsed.domain ? [parsed.domain] : [];
            domains = [...new Set([...root, ...parsed.totalUnique])];
            meta = { rootDomain: parsed.domain, scannedAt: parsed.scannedAt };
          } else if (Array.isArray(parsed)) {
            domains = parsed.filter(d => typeof d === 'string' && d.trim()).map(d => d.trim());
          } else {
            const arr = Object.values(parsed).find(v => Array.isArray(v) && v.every(i => typeof i === 'string'));
            domains = arr ? arr.map(d => d.trim()).filter(Boolean) : [];
          }
        } catch {
          toast({ title: 'Invalid JSON file', status: 'error', duration: 3000, isClosable: true });
          return;
        }
      } else {
        domains = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      }

      if (!domains.length) {
        toast({ title: 'No domains found in file', status: 'warning', duration: 3000, isClosable: true });
        return;
      }

      setImportedFile({ name: file.name, count: domains.length, domains, meta });
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) parseFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = '';
  };

  // ── API helpers ──────────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!engId) return;
    try {
      const r = await fetch(`/api/domain-flyover/${engId}/history`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      setHistory(await r.json());
    } catch (_) {}
  }, [engId]);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const pollScan = useCallback(async (scanId) => {
    try {
      const r = await fetch(`/api/domain-flyover/${engId}/scan/${scanId}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (!r.ok) { stopPolling(); return; }
      const data = await r.json();
      setActiveScan(data);
      if (data.status !== 'scanning') {
        stopPolling();
        localStorage.removeItem(lsKey(engId));
        fetchHistory();
      }
    } catch (_) {}
  }, [engId, fetchHistory]); // eslint-disable-line

  const startPolling = useCallback((scanId) => {
    stopPolling();
    pollScan(scanId);
    pollRef.current = setInterval(() => pollScan(scanId), 2500);
  }, [pollScan]);

  useEffect(() => {
    if (!engId) return;
    fetchHistory();
    const saved = localStorage.getItem(lsKey(engId));
    if (saved) startPolling(saved);
    return () => stopPolling();
  }, [engId]); // eslint-disable-line

  // ── Start flyover ─────────────────────────────────────────────────────────────
  const handleScan = async () => {
    const domains = inputMode === 'file'
      ? (importedFile?.domains || [])
      : [singleInput.trim()].filter(Boolean);

    if (!domains.length) {
      toast({
        title: inputMode === 'file' ? 'Import a domain list first' : 'Enter a domain',
        status: 'warning', duration: 2000, isClosable: true,
      });
      return;
    }
    try {
      const r = await fetch(`/api/domain-flyover/${engId}/scan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      localStorage.setItem(lsKey(engId), data.scanId);
      startPolling(data.scanId);
      fetchHistory();
      setShowRaw(false);
      setStatusFilter('all');
    } catch (e) {
      toast({ title: 'Could not start flyover', description: e.message, status: 'error', duration: 4000, isClosable: true });
    }
  };

  const handleCancel = async () => {
    if (!activeScan?._id) return;
    try {
      await fetch(`/api/domain-flyover/${engId}/scan/${activeScan._id}/cancel`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      stopPolling();
      localStorage.removeItem(lsKey(engId));
      setActiveScan(p => ({ ...p, status: 'error', error: 'Cancelled' }));
      fetchHistory();
    } catch (_) {}
  };

  const loadScan = async (scan) => {
    stopPolling();
    localStorage.removeItem(lsKey(engId));
    try {
      const r = await fetch(`/api/domain-flyover/${engId}/scan/${scan._id}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const full = await r.json();
      setActiveScan(full);
      setShowRaw(false);
      setStatusFilter('all');
    } catch (_) {}
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/domain-flyover/${engId}/scan/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      if (activeScan?._id === id) { setActiveScan(null); stopPolling(); localStorage.removeItem(lsKey(engId)); }
      setHistory(p => p.filter(s => s._id !== id));
    } catch (_) {}
  };

  // ── Stats & filter ───────────────────────────────────────────────────────────
  const total2xx   = results.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;
  const totalOther = results.filter(r => r.statusCode && (r.statusCode < 200 || r.statusCode >= 300)).length;
  const totalShots = results.filter(r => r.screenshot).length;

  const filterRanges = {
    all:   () => true,
    '2xx': r => r.statusCode >= 200 && r.statusCode < 300,
    '3xx': r => r.statusCode >= 300 && r.statusCode < 400,
    '4xx': r => r.statusCode >= 400 && r.statusCode < 500,
    '5xx': r => r.statusCode >= 500,
  };
  const filtered = results.filter(filterRanges[statusFilter] || (() => true));

  const filterCounts = {
    all:   results.length,
    '2xx': results.filter(filterRanges['2xx']).length,
    '3xx': results.filter(filterRanges['3xx']).length,
    '4xx': results.filter(filterRanges['4xx']).length,
    '5xx': results.filter(filterRanges['5xx']).length,
  };
  const filterColor = { all: ACCENT, '2xx': GREEN, '3xx': BLUE, '4xx': ORANGE, '5xx': RED };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Box>

      {/* ── Screenshot modal ──────────────────────────────────────────────── */}
      <Modal isOpen={!!expandedItem} onClose={() => setExpandedItem(null)} size="6xl" isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.88)" backdropFilter="blur(8px)" />
        <ModalContent bg="#0d0f14" border={`1px solid ${A_B}`} borderRadius="16px" overflow="hidden" mx={4}>
          <ModalCloseButton color={MUTED} _hover={{ color: 'white' }} zIndex={10} top={3} right={4} />
          <ModalBody p={0}>
            {expandedItem && (
              <>
                {/* Modal header */}
                <Flex align="center" justify="space-between" px={5} py="11px"
                  borderBottom={`1px solid ${CARD_BD}`} bg="rgba(255,255,255,0.02)">
                  <Flex align="center" gap={3} minW={0} flex={1}>
                    {expandedItem.statusCode > 0 && (
                      <Box px="7px" py="2px" borderRadius="5px" flexShrink={0}
                        bg={`${statusColor(expandedItem.statusCode)}15`}
                        border={`1px solid ${statusColor(expandedItem.statusCode)}35`}>
                        <Text fontSize="11px" fontWeight="bold" fontFamily="mono"
                          color={statusColor(expandedItem.statusCode)}>
                          {expandedItem.statusCode}
                        </Text>
                      </Box>
                    )}
                    <Box minW={0} flex={1}>
                      <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)"
                        fontFamily="mono" noOfLines={1}>{expandedItem.url}</Text>
                      {expandedItem.finalUrl && expandedItem.finalUrl !== expandedItem.url && (
                        <Text fontSize="10px" color={BLUE} fontFamily="mono" noOfLines={1} mt="2px">
                          → {expandedItem.finalUrl}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                  <Flex align="center" gap={1} flexShrink={0} ml={4}>
                    <CopyBtn text={expandedItem.url} />
                    <Tooltip label="Open in browser" hasArrow fontSize="10px">
                      <IconButton icon={<ExternalLinkIcon boxSize={3} />} size="sm" variant="ghost"
                        color={MUTED} _hover={{ color: ACCENT }}
                        onClick={() => window.open(expandedItem.url, '_blank')} aria-label="open" />
                    </Tooltip>
                  </Flex>
                </Flex>

                {/* Full screenshot */}
                <Box maxH="76vh" overflowY="auto"
                  css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: A_B } }}>
                  <Box as="img"
                    src={`data:image/png;base64,${expandedItem.screenshot}`}
                    alt={expandedItem.url} w="100%" display="block" />
                </Box>

                {/* Footer title */}
                {expandedItem.title && (
                  <Flex px={5} py={3} borderTop={`1px solid ${CARD_BD}`}
                    bg="rgba(255,255,255,0.02)" align="center">
                    <Text fontSize="11px" color="var(--dash-text-secondary)" noOfLines={1}>
                      {expandedItem.title}
                    </Text>
                  </Flex>
                )}
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box mb={5}>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
          Domain <Text as="span" color="red.400">Flyover</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          {eng?.name} · Visual screenshot capture via leonjza/gowitness · scans persist while you navigate
        </Text>
      </Box>

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px" bg={A_S} border={`1px solid ${A_B}`}>
        <Flex align="center" gap={2} mb={1.5}>
          <Box as="svg" viewBox="0 0 24 24" w="12px" h="12px" fill="none" stroke={ACCENT}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" flexShrink={0}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </Box>
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            Visual Recon — Docker Required (Chrome headless inside container)
          </Text>
        </Flex>
        <Flex gap={5} flexWrap="wrap">
          {[
            'Full-page screenshots via leonjza/gowitness',
            'Headless Chrome renders each target',
            'HTTP status codes & page titles captured',
            'Import a .txt or .json file for bulk flyovers',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color={MUTED}>{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <Flex gap={0} align="flex-start">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <Flex direction="column" flex="1" gap={4} pr={6} minW={0}>

          {/* Hidden file input */}
          <input ref={fileRef} type="file" accept=".txt,.csv,.list,.json"
            style={{ display: 'none' }} onChange={handleFileChange} />

          {/* ── Input card ─────────────────────────────────────────────────── */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />

            <Flex align="center" justify="space-between" px={5} py={3}
              borderBottom={`1px solid ${CARD_BD}`}>
              <Flex align="center" gap={2}>
                <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">
                  {inputMode === 'file' ? 'Import Domain List' : 'Target Domain'}
                </Text>
              </Flex>
              <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="7px"
                border={`1px solid ${CARD_BD}`} p="3px">
                {['single', 'file'].map(m => (
                  <Button key={m} size="xs" h="22px" px={3} borderRadius="5px"
                    fontSize="10px" fontWeight="bold"
                    bg={inputMode === m ? `${ACCENT}18` : 'transparent'}
                    color={inputMode === m ? ACCENT : MUTED}
                    border={inputMode === m ? `1px solid ${A_B}` : '1px solid transparent'}
                    _hover={{ color: ACCENT }}
                    onClick={() => { setInputMode(m); setImportedFile(null); setSingleInput(''); }}>
                    {m === 'single' ? 'Single' : 'Import File'}
                  </Button>
                ))}
              </Flex>
            </Flex>

            <Box px={5} py={4}>
              {inputMode === 'single' ? (
                <Box pos="relative">
                  <Box pos="absolute" left={4} top="50%" transform="translateY(-50%)"
                    pointerEvents="none" zIndex={1}>
                    <SearchIcon boxSize={3.5} color={MUTED} />
                  </Box>
                  <Input
                    pl={10} h="44px" fontSize="sm" borderRadius="10px" fontFamily="mono"
                    bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                    color="var(--dash-text-primary)"
                    _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '13px' }}
                    _hover={{ borderColor: `${ACCENT}40` }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder="example.com  ·  https://target.local  ·  192.168.1.1"
                    value={singleInput}
                    onChange={e => setSingleInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !isScanning && handleScan()}
                    isDisabled={isScanning}
                  />
                </Box>
              ) : importedFile ? (
                <MotionBox initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}>
                  <Flex align="center" gap={4} px={5} py={4} borderRadius="10px"
                    bg="rgba(104,211,145,0.06)" border="1px solid rgba(104,211,145,0.25)">
                    <Box flexShrink={0} w="36px" h="36px" borderRadius="9px"
                      bg="rgba(104,211,145,0.12)" border="1px solid rgba(104,211,145,0.3)"
                      display="flex" alignItems="center" justifyContent="center">
                      <Box as="svg" viewBox="0 0 24 24" w="16px" h="16px" fill="none"
                        stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </Box>
                    </Box>
                    <Box flex="1" minW={0}>
                      <Text fontSize="13px" fontWeight="semibold"
                        color="var(--dash-text-primary)" noOfLines={1}>
                        {importedFile.name}
                      </Text>
                      <Flex align="center" gap={2} mt={0.5} flexWrap="wrap">
                        <Text fontSize="11px" color={GREEN}>
                          {importedFile.count.toLocaleString()} domain{importedFile.count !== 1 ? 's' : ''} ready
                        </Text>
                        {importedFile.meta?.rootDomain && (
                          <>
                            <Box w="3px" h="3px" borderRadius="full" bg={MUTED} flexShrink={0} />
                            <Text fontSize="11px" color={ACCENT} fontFamily="mono">
                              {importedFile.meta.rootDomain}
                            </Text>
                          </>
                        )}
                        {importedFile.meta?.scannedAt && (
                          <>
                            <Box w="3px" h="3px" borderRadius="full" bg={MUTED} flexShrink={0} />
                            <Text fontSize="10px" color={MUTED}>
                              exported {fmtRelative(importedFile.meta.scannedAt)}
                            </Text>
                          </>
                        )}
                      </Flex>
                    </Box>
                    <Tooltip label="Change file" hasArrow fontSize="10px">
                      <IconButton icon={
                        <Box as="svg" viewBox="0 0 24 24" w="13px" h="13px" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </Box>
                      } size="sm" variant="ghost" color={MUTED} _hover={{ color: 'white' }}
                        onClick={() => fileRef.current?.click()} aria-label="change file"
                        isDisabled={isScanning} />
                    </Tooltip>
                    <Tooltip label="Clear" hasArrow fontSize="10px">
                      <IconButton icon={<DeleteIcon />} size="sm" variant="ghost"
                        color={MUTED} _hover={{ color: RED }}
                        onClick={() => setImportedFile(null)} aria-label="clear"
                        isDisabled={isScanning} />
                    </Tooltip>
                  </Flex>
                </MotionBox>
              ) : (
                <Box borderRadius="10px" border={`2px dashed ${dragOver ? A_B : CARD_BD}`}
                  bg={dragOver ? A_S : 'rgba(255,255,255,0.02)'}
                  transition="all 0.2s" cursor="pointer" py={8}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => !isScanning && fileRef.current?.click()}>
                  <Flex direction="column" align="center" gap={3}>
                    <Box w="44px" h="44px" borderRadius="12px"
                      bg={dragOver ? A_S : 'rgba(255,255,255,0.04)'}
                      border={`1px solid ${dragOver ? A_B : CARD_BD}`}
                      display="flex" alignItems="center" justifyContent="center"
                      transition="all 0.2s">
                      <Box as="svg" viewBox="0 0 24 24" w="20px" h="20px" fill="none"
                        stroke={dragOver ? ACCENT : MUTED} strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </Box>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="13px" fontWeight="semibold"
                        color={dragOver ? ACCENT : 'var(--dash-text-primary)'}>
                        {dragOver ? 'Drop to import' : 'Import domain list'}
                      </Text>
                      <Text fontSize="11px" color={MUTED} mt={1}>
                        Click or drag & drop — .txt (one per line) or .json (subdomain export)
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              )}

              {/* Action row */}
              <Flex align="center" justify="space-between" mt={3}>
                <Text fontSize="10px" color={MUTED}>
                  {inputMode === 'file'
                    ? importedFile
                      ? `${importedFile.count.toLocaleString()} targets queued · gowitness scan file`
                      : 'Supports .txt (one per line) or .json subdomain export'
                    : 'Bare domains get https:// prefix automatically'}
                </Text>
                <Flex gap={2} align="center">
                  {isScanning && (
                    <Flex align="center" gap={2} px={3} py="5px" borderRadius="7px"
                      bg={A_S} border={`1px solid ${A_B}`}>
                      <Spinner size="xs" color={ACCENT} speed="0.7s" />
                      <Text fontSize="11px" color={ACCENT} fontWeight="semibold">
                        {results.length} captured
                      </Text>
                    </Flex>
                  )}
                  {isScanning ? (
                    <Button size="sm" h="36px" px={5} borderRadius="9px" fontWeight="semibold"
                      fontSize="12px"
                      bg="rgba(255,80,95,0.12)" border="1px solid rgba(255,80,95,0.4)"
                      color="rgba(255,130,130,0.95)" _hover={{ bg: 'rgba(255,80,95,0.2)' }}
                      leftIcon={<Spinner size="xs" />} onClick={handleCancel}>
                      Cancel
                    </Button>
                  ) : (
                    <Button size="sm" h="36px" px={5} borderRadius="9px" fontWeight="semibold"
                      fontSize="12px"
                      bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
                      color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                      leftIcon={<SearchIcon boxSize={3} />} onClick={handleScan}>
                      Flyover
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Box>
          </Box>

          {/* ── Stats strip ──────────────────────────────────────────────────── */}
          {activeScan && (
            <Flex gap={3}>
              {[
                { label: 'Probed',      value: results.length, color: ACCENT },
                { label: '2xx Live',    value: total2xx,       color: GREEN  },
                { label: 'Other',       value: totalOther,     color: ORANGE },
                { label: 'Screenshots', value: totalShots,     color: PINK   },
              ].map(({ label, value, color }, i) => (
                <MotionBox key={label} flex="1"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  px={4} py={3} borderRadius="12px" bg={CARD_BG}
                  border={`1px solid ${CARD_BD}`} pos="relative" overflow="hidden">
                  <Box pos="absolute" top={0} left={0} right={0} h="2px"
                    style={{ background: `linear-gradient(to right, transparent, ${color}70, transparent)` }} />
                  <Text fontSize="10px" fontWeight="bold" color={MUTED}
                    textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
                  <Text fontSize="22px" fontWeight="black" color={color} lineHeight={1}>{value}</Text>
                </MotionBox>
              ))}
            </Flex>
          )}

          {/* ── Results card ─────────────────────────────────────────────────── */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />

            {/* Header */}
            <Flex align="center" justify="space-between" px={5} py={3}
              borderBottom={`1px solid ${CARD_BD}`} bg="rgba(255,255,255,0.01)">
              <Flex align="center" gap={2}>
                <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">Screenshots</Text>
                {results.length > 0 && (
                  <Box px="7px" py="1px" borderRadius="full" bg={A_S} border={`1px solid ${A_B}`}>
                    <Text fontSize="10px" fontWeight="bold" color={ACCENT}>
                      {filtered.length}{statusFilter !== 'all' ? ` / ${results.length}` : ''}
                    </Text>
                  </Box>
                )}
              </Flex>
              <Flex align="center" gap={2}>
                {isScanning && <Spinner size="xs" color={ACCENT} />}
                {!isScanning && results.length > 0 && (
                  <Button size="xs" variant="ghost" color={MUTED} fontSize="10px"
                    _hover={{ color: 'white' }} onClick={() => setShowRaw(p => !p)}>
                    {showRaw ? 'Hide raw' : 'Raw output'}
                  </Button>
                )}
              </Flex>
            </Flex>

            {/* Filter pills */}
            {results.length > 0 && (
              <Flex align="center" px={5} py="9px"
                borderBottom={`1px solid ${CARD_BD}`} bg="rgba(255,255,255,0.01)" gap={1.5} flexWrap="wrap">
                {['all', '2xx', '3xx', '4xx', '5xx'].map(f => {
                  const cnt    = filterCounts[f];
                  const col    = filterColor[f];
                  const active = statusFilter === f;
                  if (f !== 'all' && cnt === 0) return null;
                  return (
                    <Button key={f} size="xs" h="22px" px={3} borderRadius="5px"
                      fontSize="10px" fontWeight="bold"
                      bg={active ? `${col}18` : 'transparent'}
                      color={active ? col : MUTED}
                      border={active ? `1px solid ${col}40` : `1px solid transparent`}
                      _hover={{ color: col, bg: `${col}10` }}
                      onClick={() => setStatusFilter(f)}>
                      {f === 'all' ? 'All' : f}
                      <Box as="span" ml={1.5} opacity={0.7}>{cnt}</Box>
                    </Button>
                  );
                })}
              </Flex>
            )}

            {/* Screenshot grid */}
            {filtered.length > 0 && (
              <Box p={5}>
                <Box display="grid"
                  gridTemplateColumns="repeat(auto-fill, minmax(265px, 1fr))"
                  gap={4}>
                  <AnimatePresence>
                    {filtered.map((item, i) => (
                      <ScreenshotCard key={item.url + i} item={item} index={i} onExpand={setExpandedItem} />
                    ))}
                  </AnimatePresence>
                </Box>
              </Box>
            )}

            {/* Empty states */}
            {!activeScan && (
              <Flex direction="column" align="center" justify="center" py={16} gap={4} opacity={0.4}>
                <Box as="svg" viewBox="0 0 24 24" w="44px" h="44px" fill="none"
                  stroke={MUTED} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)">
                    Enter domains to begin flyover
                  </Text>
                  <Text fontSize="12px" color={MUTED} mt={1}>
                    gowitness screenshots every live web target
                  </Text>
                </Box>
              </Flex>
            )}
            {activeScan && results.length === 0 && isScanning && (
              <Flex direction="column" align="center" justify="center" py={14} gap={3}>
                <Spinner size="lg" color={ACCENT} thickness="2px" speed="0.7s" />
                <Text fontSize="13px" color={MUTED}>
                  Flying over {activeScan.domains?.length} target(s)…
                </Text>
                <Text fontSize="11px" color={MUTED} opacity={0.6}>
                  First run pulls the gowitness Docker image — may take a moment
                </Text>
              </Flex>
            )}
            {activeScan && results.length === 0 && !isScanning && (
              <Flex direction="column" align="center" justify="center" py={10} gap={2}>
                {activeScan.status === 'error' ? (
                  <>
                    <Text fontSize="13px" color={RED} fontWeight="semibold">Flyover failed</Text>
                    {activeScan.error && (
                      <Box maxW="480px" px={4} py={2} borderRadius="8px"
                        bg="rgba(252,129,129,0.07)" border="1px solid rgba(252,129,129,0.2)">
                        <Text fontSize="11px" color={RED} fontFamily="mono"
                          whiteSpace="pre-wrap" textAlign="center">{activeScan.error}</Text>
                      </Box>
                    )}
                  </>
                ) : (
                  <Text fontSize="13px" color={MUTED} opacity={0.5}>
                    No hosts responded — all targets timed out or unreachable
                  </Text>
                )}
              </Flex>
            )}
          </Box>

          {/* ── Live Docker terminal ─────────────────────────────────────────── */}
          <AnimatePresence>
            {isScanning && (
              <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}
                borderRadius="12px" border={`1px solid ${A_B}`}
                overflow="hidden" bg="rgba(6,8,12,0.95)">
                <Flex align="center" justify="space-between" px={5} py="10px"
                  borderBottom={`1px solid ${A_B}`} bg={A_S}>
                  <Flex align="center" gap={2}>
                    <Spinner size="xs" color={ACCENT} speed="0.8s" />
                    <Text fontSize="10px" color={ACCENT} textTransform="uppercase"
                      letterSpacing="wider" fontWeight="bold">Docker Output</Text>
                  </Flex>
                  <Flex align="center" gap={1.5}>
                    <Box w="7px" h="7px" borderRadius="full" bg="#FF5F56" />
                    <Box w="7px" h="7px" borderRadius="full" bg="#FFBD2E" />
                    <Box w="7px" h="7px" borderRadius="full" bg="#27C93F" />
                  </Flex>
                </Flex>
                <Box ref={termRef} px={5} py={4} h="220px" overflowY="auto"
                  css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: A_B } }}>
                  {liveOutput ? (
                    <Text fontSize="11px" color="#c4b5fd" fontFamily="'Courier New', monospace"
                      whiteSpace="pre-wrap" lineHeight="1.8">{liveOutput}</Text>
                  ) : (
                    <Flex align="center" gap={2} opacity={0.4}>
                      <Spinner size="xs" color={ACCENT} />
                      <Text fontSize="11px" color={MUTED} fontFamily="mono">Waiting for Docker…</Text>
                    </Flex>
                  )}
                </Box>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* ── Raw output (post-scan) ───────────────────────────────────────── */}
          <AnimatePresence>
            {showRaw && !isScanning && activeScan?.results?.length > 0 && (
              <MotionBox initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                borderRadius="12px" border={`1px solid ${CARD_BD}`}
                bg={CARD_BG} overflow="hidden">
                <Flex align="center" justify="space-between" px={5} py={3}
                  borderBottom={`1px solid ${CARD_BD}`}>
                  <Flex align="center" gap={2}>
                    <Box w="3px" h="12px" borderRadius="full" bg={MUTED} />
                    <Text fontSize="10px" color={MUTED} textTransform="uppercase"
                      letterSpacing="wider" fontWeight="bold">Raw JSON Output</Text>
                  </Flex>
                  <CopyBtn text={results.map(r => {
                    const { screenshot: _ss, ...rest } = r; return JSON.stringify(rest);
                  }).join('\n')} />
                </Flex>
                <Box px={5} py={4} maxH="300px" overflowY="auto"
                  css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)' } }}>
                  <Text fontSize="11px" color={MUTED} fontFamily="mono"
                    whiteSpace="pre-wrap" lineHeight="1.7">
                    {results.map(r => {
                      const { screenshot: _ss, ...rest } = r;
                      return JSON.stringify(rest, null, 2);
                    }).join('\n')}
                  </Text>
                </Box>
              </MotionBox>
            )}
          </AnimatePresence>
        </Flex>

        {/* ── Right: history panel ─────────────────────────────────────────── */}
        <Box w="260px" flexShrink={0} borderLeft={`1px solid ${CARD_BD}`} pl={5}>

          <Flex align="center" justify="space-between" mb={4}>
            <Flex align="center" gap={2}>
              <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
              <Text fontSize="10px" color={MUTED} textTransform="uppercase"
                letterSpacing="widest" fontWeight="bold">Flyover History</Text>
            </Flex>
            <Flex align="center" gap={2}>
              {history.length > 0 && (
                <Box px={2} py="1px" borderRadius="full" bg={A_S} border={`1px solid ${A_B}`}>
                  <Text fontSize="10px" color={ACCENT} fontWeight="bold">{history.length}</Text>
                </Box>
              )}
              <Tooltip label="Refresh" hasArrow fontSize="10px">
                <IconButton icon={<RepeatIcon />} size="xs" variant="ghost"
                  color={MUTED} _hover={{ color: 'white' }}
                  onClick={fetchHistory} aria-label="refresh" />
              </Tooltip>
            </Flex>
          </Flex>

          <Flex direction="column" gap={1}>
            {history.length === 0 ? (
              <Flex align="center" justify="center" py={10}>
                <Text fontSize="11px" color={MUTED} opacity={0.4}>No flyovers yet</Text>
              </Flex>
            ) : history.map(scan => {
              const isLive   = scan.status === 'scanning';
              const isActive = activeScan?._id === scan._id;
              return (
                <MotionBox key={scan._id}
                  initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  px={3} py="10px" borderRadius="9px" cursor="pointer"
                  bg={isActive ? `${ACCENT}0D` : 'transparent'}
                  border={isActive ? `1px solid ${A_B}` : '1px solid transparent'}
                  _hover={{ bg: isActive ? `${ACCENT}12` : 'rgba(255,255,255,0.04)' }}
                  style={{ transition: 'all 0.15s' }}
                  onClick={() => isLive ? startPolling(scan._id) : loadScan(scan)}>

                  <Flex align="center" justify="space-between" mb={1.5}>
                    <Flex align="center" gap={1.5} minW={0} flex={1}>
                      <Text fontSize="11px" fontWeight="semibold"
                        color="var(--dash-text-primary)" fontFamily="mono" noOfLines={1}>
                        {scan.domains?.[0] || 'Flyover'}
                        {scan.domains?.length > 1 && (
                          <Text as="span" color={MUTED}> +{scan.domains.length - 1}</Text>
                        )}
                      </Text>
                      {isLive && <Spinner size="xs" color={ACCENT} />}
                    </Flex>
                    <Tooltip label="Delete" hasArrow fontSize="10px">
                      <IconButton icon={<DeleteIcon />} size="xs" variant="ghost"
                        color={MUTED} _hover={{ color: RED }} flexShrink={0}
                        onClick={e => { e.stopPropagation(); handleDelete(scan._id); }}
                        aria-label="delete" />
                    </Tooltip>
                  </Flex>

                  <Flex align="center" justify="space-between">
                    <Flex gap={1.5}>
                      <Box px="6px" py="1px" borderRadius="4px" fontSize="9px"
                        fontWeight="bold" bg={`${ACCENT}12`} border={`1px solid ${ACCENT}25`} color={ACCENT}>
                        {isLive ? '…' : (scan.domains?.length || 0).toLocaleString()} targets
                      </Box>
                      {scan.status === 'error' && (
                        <Box px="6px" py="1px" borderRadius="4px" fontSize="9px"
                          fontWeight="bold" bg={`${RED}12`} border={`1px solid ${RED}25`} color={RED}>
                          {scan.error === 'Cancelled' ? 'cancelled' : 'error'}
                        </Box>
                      )}
                    </Flex>
                    <Text fontSize="10px" color={MUTED} flexShrink={0} ml={2}>
                      {fmtRelative(scan.createdAt)}
                    </Text>
                  </Flex>
                </MotionBox>
              );
            })}
          </Flex>

          {/* Command preview */}
          <Box mt={5} pt={4} borderTop={`1px solid ${CARD_BD}`}>
            <Text fontSize="9px" color={MUTED} textTransform="uppercase"
              letterSpacing="wider" fontWeight="bold" mb={2}>Command</Text>
            <Flex align="center" gap={2} bg="rgba(255,255,255,0.03)"
              borderRadius="8px" px={3} py="8px">
              <Text fontSize="10px" color="var(--dash-text-secondary)" fontFamily="mono"
                flex="1" noOfLines={2} lineHeight="1.5">
                gowitness scan file -f targets.txt --screenshot-path ./screenshots --threads 3
              </Text>
              <CopyBtn text="docker run --rm -v $(pwd):/data leonjza/gowitness scan file -f /data/targets.txt --screenshot-path /data/screenshots --threads 3" />
            </Flex>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default DomainFlyoverView;
