import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input,
  Spinner, Tooltip, useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchIcon, DeleteIcon, CopyIcon, CheckIcon, RepeatIcon, ExternalLinkIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Theme ──────────────────────────────────────────────────────────────────────
const ACCENT  = '#76E4F7';   // cyan — HTTP/web focused
const A_S     = 'rgba(118,228,247,0.07)';
const A_B     = 'rgba(118,228,247,0.25)';
const GREEN   = '#68D391';
const RED     = '#FC8181';
const ORANGE  = '#F6AD55';
const BLUE    = '#63B3ED';
const MUTED   = 'var(--dash-text-muted)';
const CARD_BG = 'var(--dash-card-bg)';
const CARD_BD = 'var(--dash-card-border)';

const tok    = () => localStorage.getItem('token') || '';
const lsKey  = (id) => `ws-enum-active-${id}`;

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

// ── ResultRow ──────────────────────────────────────────────────────────────────
const ResultRow = ({ item, index }) => {
  const sc    = statusColor(item.statusCode);
  const techs = item.tech?.slice(0, 4) || [];

  return (
    <MotionBox
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay: index * 0.02 }}>
      <Flex align="center" gap={3} px={5} py="11px"
        borderBottom={`1px solid ${CARD_BD}`}
        _hover={{ bg: 'rgba(255,255,255,0.025)' }} transition="background 0.15s">

        {/* Status code */}
        <Box flex="0 0 52px" textAlign="center">
          <Box px="6px" py="2px" borderRadius="5px" display="inline-block"
            bg={`${sc}15`} border={`1px solid ${sc}35`}>
            <Text fontSize="11px" fontWeight="bold" color={sc} fontFamily="mono">
              {item.statusCode || '—'}
            </Text>
          </Box>
        </Box>

        {/* URL */}
        <Box flex="1" minW={0}>
          <Flex align="center" gap={2}>
            <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)"
              fontFamily="mono" noOfLines={1}>{item.url}</Text>
            <Tooltip label="Open in browser" hasArrow fontSize="10px">
              <IconButton icon={<ExternalLinkIcon boxSize={2.5} />} size="xs" variant="ghost"
                color={MUTED} _hover={{ color: ACCENT }} flexShrink={0}
                onClick={() => window.open(item.url, '_blank')} aria-label="open" />
            </Tooltip>
            <CopyBtn text={item.url} />
          </Flex>
        </Box>

        {/* Title */}
        <Box flex="0 0 200px" minW={0}>
          <Text fontSize="11px" color="var(--dash-text-secondary)" noOfLines={1}
            title={item.title}>
            {item.title || <Text as="span" color={MUTED} fontStyle="italic">No title</Text>}
          </Text>
        </Box>

        {/* Tech badges */}
        <Flex flex="0 0 220px" gap={1} flexWrap="wrap">
          {techs.map(t => (
            <Box key={t} px="5px" py="1px" borderRadius="4px" fontSize="9px"
              fontWeight="bold" bg={`${ACCENT}10`} border={`1px solid ${ACCENT}25`}
              color={ACCENT} whiteSpace="nowrap">
              {t}
            </Box>
          ))}
          {(item.tech?.length || 0) > 4 && (
            <Text fontSize="9px" color={MUTED}>+{item.tech.length - 4}</Text>
          )}
          {item.webserver && !techs.includes(item.webserver) && techs.length < 4 && (
            <Box px="5px" py="1px" borderRadius="4px" fontSize="9px"
              fontWeight="bold" bg="rgba(255,255,255,0.05)"
              border="1px solid rgba(255,255,255,0.12)" color="var(--dash-text-secondary)">
              {item.webserver}
            </Box>
          )}
        </Flex>
      </Flex>
    </MotionBox>
  );
};

// ── Main View ──────────────────────────────────────────────────────────────────
const WebserverEnumView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const [inputMode,   setInputMode]   = useState('single'); // 'single' | 'file'
  const [singleInput, setSingleInput] = useState('');
  const [importedFile, setImportedFile] = useState(null);  // { name, domains[], count }
  const [activeScan,  setActiveScan]  = useState(null);
  const [history,     setHistory]     = useState([]);
  const [showRaw,     setShowRaw]     = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | '2xx' | '3xx' | '4xx' | '5xx'

  const pollRef  = useRef(null);
  const termRef  = useRef(null);
  const fileRef  = useRef(null);

  const isScanning = activeScan?.status === 'scanning';
  const liveOutput = activeScan?.liveOutput || '';
  const results    = activeScan?.results   || [];

  // Auto-scroll terminal
  useEffect(() => {
    if (isScanning && termRef.current)
      termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [liveOutput, isScanning]);

  // ── Parse file ───────────────────────────────────────────────────────────────
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
          // Subdomain export format: { domain, totalUnique: [...] }
          if (Array.isArray(parsed.totalUnique)) {
            // Include the root domain itself + all subdomains
            const root = parsed.domain ? [parsed.domain] : [];
            domains = [...new Set([...root, ...parsed.totalUnique])];
            meta = { rootDomain: parsed.domain, scannedAt: parsed.scannedAt };
          } else if (Array.isArray(parsed)) {
            // Plain JSON array of strings
            domains = parsed.filter(d => typeof d === 'string' && d.trim()).map(d => d.trim());
          } else {
            // Try to find any array of strings in the object
            const arr = Object.values(parsed).find(v => Array.isArray(v) && v.every(i => typeof i === 'string'));
            domains = arr ? arr.map(d => d.trim()).filter(Boolean) : [];
          }
        } catch {
          toast({ title: 'Invalid JSON file', status: 'error', duration: 3000, isClosable: true });
          return;
        }
      } else {
        // Plain text — one domain per line
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
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) parseFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = ''; // reset so same file can be re-selected
  };

  // ── Fetch history ────────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!engId) return;
    try {
      const r = await fetch(`/api/webserver-enum/${engId}/history`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      setHistory(await r.json());
    } catch (_) {}
  }, [engId]);

  // ── Poll ─────────────────────────────────────────────────────────────────────
  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const pollScan = useCallback(async (scanId) => {
    try {
      const r = await fetch(`/api/webserver-enum/${engId}/scan/${scanId}`, {
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

  // ── Mount: resume active scan ────────────────────────────────────────────────
  useEffect(() => {
    if (!engId) return;
    fetchHistory();
    const saved = localStorage.getItem(lsKey(engId));
    if (saved) startPolling(saved);
    return () => stopPolling();
  }, [engId]); // eslint-disable-line

  // ── Start scan ───────────────────────────────────────────────────────────────
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
      const r = await fetch(`/api/webserver-enum/${engId}/scan`, {
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
      toast({ title: 'Could not start scan', description: e.message, status: 'error', duration: 4000, isClosable: true });
    }
  };

  // ── Cancel ───────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!activeScan?._id) return;
    try {
      await fetch(`/api/webserver-enum/${engId}/scan/${activeScan._id}/cancel`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      stopPolling();
      localStorage.removeItem(lsKey(engId));
      setActiveScan(p => ({ ...p, status: 'error', error: 'Cancelled' }));
      fetchHistory();
    } catch (_) {}
  };

  // ── Load historical ──────────────────────────────────────────────────────────
  const loadScan = async (scan) => {
    stopPolling();
    localStorage.removeItem(lsKey(engId));
    try {
      const r = await fetch(`/api/webserver-enum/${engId}/scan/${scan._id}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const full = await r.json();
      setActiveScan(full);
      setShowRaw(false);
      setStatusFilter('all');
    } catch (_) {}
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await fetch(`/api/webserver-enum/${engId}/scan/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      if (activeScan?._id === id) { setActiveScan(null); stopPolling(); localStorage.removeItem(lsKey(engId)); }
      setHistory(p => p.filter(s => s._id !== id));
    } catch (_) {}
  };

  // ── Stats & filter ───────────────────────────────────────────────────────────
  const total200   = results.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;
  const totalOther = results.filter(r => r.statusCode && (r.statusCode < 200 || r.statusCode >= 300)).length;
  const totalTech  = [...new Set(results.flatMap(r => r.tech || []))].length;

  const filterRanges = {
    all:  () => true,
    '2xx': r => r.statusCode >= 200 && r.statusCode < 300,
    '3xx': r => r.statusCode >= 300 && r.statusCode < 400,
    '4xx': r => r.statusCode >= 400 && r.statusCode < 500,
    '5xx': r => r.statusCode >= 500,
  };
  const filtered = results.filter(filterRanges[statusFilter] || (() => true));

  const filterCounts = {
    all:  results.length,
    '2xx': results.filter(filterRanges['2xx']).length,
    '3xx': results.filter(filterRanges['3xx']).length,
    '4xx': results.filter(filterRanges['4xx']).length,
    '5xx': results.filter(filterRanges['5xx']).length,
  };

  const filterColor = { all: ACCENT, '2xx': GREEN, '3xx': BLUE, '4xx': ORANGE, '5xx': RED };

  // ── Export filtered URLs ──────────────────────────────────────────────────────
  const exportUrls = () => {
    const urls = filtered.map(r => r.url).join('\n');
    const blob = new Blob([urls], { type: 'text/plain' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `httpx-${statusFilter}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Box>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box mb={5}>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
          Webserver <Text as="span" color="red.400">Enumeration</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          {eng?.name} · HTTP/S probing via projectdiscovery/httpx · scans persist while you navigate
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
            Active Probing — Docker Required
          </Text>
        </Flex>
        <Flex gap={5} flexWrap="wrap">
          {[
            'HTTP/HTTPS status codes via projectdiscovery/httpx',
            'Page title extraction with -title flag',
            'Technology fingerprinting via -tech-detect',
            'Import a .txt file (5,000+ domains) or test a single target',
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

          {/* Input card */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />

            {/* Card header + mode toggle */}
            <Flex align="center" justify="space-between" px={5} py={3}
              borderBottom={`1px solid ${CARD_BD}`}>
              <Flex align="center" gap={2}>
                <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">
                  {inputMode === 'file' ? 'Import Domain List' : 'Target Domain'}
                </Text>
              </Flex>
              {/* Mode pills */}
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
                /* ── Single domain input ── */
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
                    placeholder="example.com  ·  192.168.1.1  ·  target.local"
                    value={singleInput}
                    onChange={e => setSingleInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !isScanning && handleScan()}
                    isDisabled={isScanning}
                  />
                </Box>
              ) : (
                /* ── File import drop zone ── */
                importedFile ? (
                  /* File loaded — show info */
                  <MotionBox initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}>
                    <Flex align="center" gap={4} px={5} py={4} borderRadius="10px"
                      bg="rgba(104,211,145,0.06)" border="1px solid rgba(104,211,145,0.25)">
                      {/* File icon */}
                      <Box flexShrink={0} w="36px" h="36px" borderRadius="9px"
                        bg="rgba(104,211,145,0.12)" border="1px solid rgba(104,211,145,0.3)"
                        display="flex" alignItems="center" justifyContent="center">
                        <Box as="svg" viewBox="0 0 24 24" w="16px" h="16px" fill="none"
                          stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
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
                  /* Drop zone */
                  <Box
                    borderRadius="10px" border={`2px dashed ${dragOver ? A_B : CARD_BD}`}
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
                          strokeLinecap="round" strokeLinejoin="round" transition="all 0.2s">
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
                        <Text fontSize="10px" color={MUTED} mt={0.5} opacity={0.6}>
                          Handles 5,000+ domains efficiently
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                )
              )}

              {/* Action row */}
              <Flex align="center" justify="space-between" mt={3}>
                <Text fontSize="10px" color={MUTED}>
                  {inputMode === 'file'
                    ? importedFile
                      ? `${importedFile.count.toLocaleString()} targets queued · httpx -c 100`
                      : 'Supports .txt (one per line) or .json subdomain export'
                    : 'Press Enter or click Enumerate'}
                </Text>
                <Flex gap={2} align="center">
                  {isScanning && (
                    <Flex align="center" gap={2} px={3} py="5px" borderRadius="7px"
                      bg={A_S} border={`1px solid ${A_B}`}>
                      <Spinner size="xs" color={ACCENT} speed="0.7s" />
                      <Text fontSize="11px" color={ACCENT} fontWeight="semibold">
                        {results.length} probed
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
                      Enumerate
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Box>
          </Box>

          {/* Stats strip */}
          {activeScan && (
            <Flex gap={3}>
              {[
                { label: 'Probed',   value: results.length,  color: ACCENT },
                { label: '2xx Live', value: total200,        color: GREEN },
                { label: 'Other',    value: totalOther,      color: ORANGE },
                { label: 'Tech',     value: totalTech,       color: BLUE },
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

          {/* Results card */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />

            {/* Results header */}
            <Flex align="center" justify="space-between" px={5} py={3}
              borderBottom={`1px solid ${CARD_BD}`} bg="rgba(255,255,255,0.01)">
              <Flex align="center" gap={2}>
                <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">Results</Text>
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

            {/* Filter bar */}
            {results.length > 0 && (
              <Flex align="center" justify="space-between" px={5} py="9px"
                borderBottom={`1px solid ${CARD_BD}`} bg="rgba(255,255,255,0.01)" gap={3}>

                {/* Status filter pills */}
                <Flex gap={1.5} flexWrap="wrap">
                  {['all', '2xx', '3xx', '4xx', '5xx'].map(f => {
                    const cnt   = filterCounts[f];
                    const col   = filterColor[f];
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

                {/* Export button */}
                <Tooltip label={`Export ${filtered.length} URLs to .txt`} hasArrow fontSize="10px">
                  <Button size="xs" h="26px" px={3} borderRadius="6px" fontSize="10px"
                    fontWeight="bold" flexShrink={0}
                    bg={`${ACCENT}12`} border={`1px solid ${A_B}`} color={ACCENT}
                    _hover={{ bg: `${ACCENT}22` }}
                    leftIcon={
                      <Box as="svg" viewBox="0 0 24 24" w="11px" h="11px" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </Box>
                    }
                    onClick={exportUrls}
                    isDisabled={filtered.length === 0}>
                    Export {statusFilter !== 'all' ? statusFilter : ''} URLs
                  </Button>
                </Tooltip>
              </Flex>
            )}

            {/* Column headers */}
            {filtered.length > 0 && (
              <Flex px={5} py="7px" gap={3} bg="rgba(255,255,255,0.015)"
                borderBottom={`1px solid ${CARD_BD}`}>
                <Text fontSize="9px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider" flex="0 0 52px">Status</Text>
                <Text fontSize="9px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider" flex="1">URL</Text>
                <Text fontSize="9px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider" flex="0 0 200px">Title</Text>
                <Text fontSize="9px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider" flex="0 0 220px">Technologies</Text>
              </Flex>
            )}

            <AnimatePresence>
              {filtered.map((item, i) => <ResultRow key={item.url + i} item={item} index={i} />)}
            </AnimatePresence>

            {/* Empty states */}
            {!activeScan && (
              <Flex direction="column" align="center" justify="center" py={16} gap={4} opacity={0.4}>
                <Box as="svg" viewBox="0 0 24 24" w="44px" h="44px" fill="none"
                  stroke={MUTED} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)">
                    Enter domains to begin enumeration
                  </Text>
                  <Text fontSize="12px" color={MUTED} mt={1}>
                    Detects HTTP/S, page titles, and technology stacks
                  </Text>
                </Box>
              </Flex>
            )}
            {activeScan && results.length === 0 && isScanning && (
              <Flex direction="column" align="center" justify="center" py={14} gap={3}>
                <Spinner size="lg" color={ACCENT} thickness="2px" speed="0.7s" />
                <Text fontSize="13px" color={MUTED}>
                  Probing {activeScan.domains?.length} target(s)…
                </Text>
                <Text fontSize="11px" color={MUTED} opacity={0.6}>
                  First run pulls the Docker image — may take a moment
                </Text>
              </Flex>
            )}
            {activeScan && results.length === 0 && !isScanning && (
              <Flex direction="column" align="center" justify="center" py={10} gap={2}>
                {activeScan.status === 'error' ? (
                  <>
                    <Text fontSize="13px" color={RED} fontWeight="semibold">Scan failed</Text>
                    {activeScan.error && (
                      <Box maxW="480px" px={4} py={2} borderRadius="8px"
                        bg="rgba(252,129,129,0.07)" border="1px solid rgba(252,129,129,0.2)">
                        <Text fontSize="11px" color={RED} fontFamily="mono"
                          whiteSpace="pre-wrap" textAlign="center">
                          {activeScan.error}
                        </Text>
                      </Box>
                    )}
                  </>
                ) : (
                  <Text fontSize="13px" color={MUTED} opacity={0.5}>
                    No hosts responded — all targets timed out or have no HTTP/HTTPS
                  </Text>
                )}
              </Flex>
            )}
          </Box>

          {/* Live Docker terminal */}
          <AnimatePresence>
            {isScanning && (
              <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}
                borderRadius="12px" border={`1px solid ${A_B}`}
                overflow="hidden" bg="rgba(6,8,12,0.95)">
                {/* Terminal titlebar */}
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
                    <Text fontSize="11px" color="#a8d8c8" fontFamily="'Courier New', monospace"
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

          {/* Raw output (post-scan) */}
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
                  <CopyBtn text={results.map(r => JSON.stringify(r)).join('\n')} />
                </Flex>
                <Box px={5} py={4} maxH="300px" overflowY="auto"
                  css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)' } }}>
                  <Text fontSize="11px" color={MUTED} fontFamily="mono"
                    whiteSpace="pre-wrap" lineHeight="1.7">
                    {results.map(r => JSON.stringify(r, null, 2)).join('\n')}
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
                letterSpacing="widest" fontWeight="bold">Scan History</Text>
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
                <Text fontSize="11px" color={MUTED} opacity={0.4}>No scans yet</Text>
              </Flex>
            ) : (
              history.map(scan => {
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
                    transition="all 0.15s"
                    onClick={() => isLive ? startPolling(scan._id) : loadScan(scan)}>

                    <Flex align="center" justify="space-between" mb={1.5}>
                      <Flex align="center" gap={1.5} minW={0} flex={1}>
                        <Text fontSize="11px" fontWeight="semibold"
                          color="var(--dash-text-primary)" fontFamily="mono"
                          noOfLines={1}>
                          {scan.domains?.[0] || 'Scan'}
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
                          fontWeight="bold" bg={`${ACCENT}12`}
                          border={`1px solid ${ACCENT}25`} color={ACCENT}>
                          {isLive ? '…' : (scan.domains?.length || 0).toLocaleString()} targets
                        </Box>
                        {scan.status === 'error' && (
                          <Box px="6px" py="1px" borderRadius="4px" fontSize="9px"
                            fontWeight="bold" bg={`${RED}12`}
                            border={`1px solid ${RED}25`} color={RED}>
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
              })
            )}
          </Flex>

          {/* Command preview */}
          <Box mt={5} pt={4} borderTop={`1px solid ${CARD_BD}`}>
            <Text fontSize="9px" color={MUTED} textTransform="uppercase"
              letterSpacing="wider" fontWeight="bold" mb={2}>Command</Text>
            <Flex align="center" gap={2} bg="rgba(255,255,255,0.03)"
              borderRadius="8px" px={3} py="8px">
              <Text fontSize="10px" color="var(--dash-text-secondary)" fontFamily="mono"
                flex="1" noOfLines={2} lineHeight="1.5">
                httpx -l domains.txt -status-code -title -tech-detect -json -silent
              </Text>
              <CopyBtn text="docker run --rm -i projectdiscovery/httpx -status-code -title -tech-detect -json -silent" />
            </Flex>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default WebserverEnumView;
