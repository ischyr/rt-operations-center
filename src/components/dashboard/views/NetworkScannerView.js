import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input,
  SimpleGrid, Spinner, Tooltip, Badge, useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, DeleteIcon, CopyIcon, CheckIcon, RepeatIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Theme ─────────────────────────────────────────────────────────────────────
const ACCENT = '#63B3ED';
const A_S    = 'rgba(99,179,237,0.10)';
const A_B    = 'rgba(99,179,237,0.28)';
const GREEN  = '#68D391';
const RED    = '#FC8181';
const MUTED  = 'var(--dash-text-muted)';
const BORDER = 'rgba(255,255,255,0.07)';
const CARD   = 'rgba(255,255,255,0.03)';

// ── Port category ─────────────────────────────────────────────────────────────
const portCategory = (port, service = '') => {
  const s = service.toLowerCase();
  if ([80,8080,8000,8888,3000,5000].includes(port) || s==='http'||s==='http-proxy') return { label:'WEB',   color:'#63B3ED' };
  if ([443,8443].includes(port) || s.includes('https'))                              return { label:'HTTPS', color:'#68D391' };
  if (port===22  || s==='ssh')                                                       return { label:'SSH',   color:'#68D391' };
  if (port===3389 || s.includes('rdp'))                                              return { label:'RDP',   color:'#FC8181' };
  if ([445,139,135].includes(port)||s.includes('smb')||s.includes('netbios'))       return { label:'SMB',   color:'#F6AD55' };
  if ([1433,3306,5432,1521,27017,6379,9200].includes(port)||s.includes('sql')||s.includes('mongo')||s.includes('redis')||s.includes('elastic')) return { label:'DB', color:'#9F7AEA' };
  if (port===21  || s==='ftp')                                                       return { label:'FTP',   color:'#F6AD55' };
  if ([25,110,143,993,995,465,587].includes(port)||s.includes('smtp')||s.includes('imap')||s.includes('pop')) return { label:'MAIL', color:'#76E4F7' };
  if (port===53  || s==='dns')                                                       return { label:'DNS',   color:'#A0AEC0' };
  if ([88,389,636,464].includes(port)||s.includes('ldap')||s.includes('kerberos'))  return { label:'AD',    color:'#FC8181' };
  if ([5985,5986].includes(port)||s.includes('winrm'))                              return { label:'WINRM', color:'#F6AD55' };
  if (port===5900 || s==='vnc')                                                      return { label:'VNC',   color:'#FC8181' };
  return { label:'TCP', color:'#718096' };
};

const tok = () => localStorage.getItem('token') || '';
const lsKey = (engId) => `net-scan-active-${engId}`;

// ── CopyBtn ───────────────────────────────────────────────────────────────────
const CopyBtn = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <Tooltip label={copied ? 'Copied!' : (label||'Copy')} hasArrow fontSize="10px">
      <IconButton icon={copied ? <CheckIcon /> : <CopyIcon />} size="xs" variant="ghost"
        color={copied ? GREEN : MUTED} _hover={{ color:'white' }} onClick={copy} aria-label="copy" />
    </Tooltip>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, sub }) => (
  <Box borderRadius="12px" bg={CARD} border={`1px solid ${BORDER}`} px={4} py={3}>
    <Text fontSize="10px" color={MUTED} textTransform="uppercase" letterSpacing="wider"
      fontWeight="bold" mb={1}>{label}</Text>
    <Text fontSize="22px" fontWeight="bold" color={color||'var(--dash-text-primary)'}
      lineHeight={1}>{value ?? '—'}</Text>
    {sub && <Text fontSize="10px" color={MUTED} mt={1} noOfLines={1}>{sub}</Text>}
  </Box>
);

// ── PortRow ───────────────────────────────────────────────────────────────────
const PortRow = ({ item }) => {
  const cat = portCategory(item.port, item.service);
  return (
    <MotionBox initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.18 }}>
      <Flex align="center" gap={3} px={5} py="11px"
        borderBottom={`1px solid ${BORDER}`}
        _hover={{ bg:'rgba(255,255,255,0.025)' }} transition="background 0.15s">
        <Box flex="0 0 90px">
          <Text fontSize="15px" fontWeight="bold" color="var(--dash-text-primary)"
            fontFamily="mono">{item.port}</Text>
          <Text fontSize="10px" color={MUTED} fontFamily="mono">{item.protocol}</Text>
        </Box>
        <Box flex="0 0 80px">
          <Badge fontSize="10px" px={2} py="2px" borderRadius="5px"
            bg={`${cat.color}18`} color={cat.color}
            border={`1px solid ${cat.color}35`}>{cat.label}</Badge>
        </Box>
        <Box flex="0 0 140px">
          <Text fontSize="12px" fontWeight="semibold"
            color={item.service ? 'var(--dash-text-primary)' : MUTED}>
            {item.service || '—'}
          </Text>
        </Box>
        <Box flex="1" minW={0}>
          <Text fontSize="11px" color={MUTED} fontFamily="mono" noOfLines={1}>
            {item.version || ''}
          </Text>
        </Box>
        <CopyBtn text={`${item.port}/${item.protocol}`} label="Copy port" />
      </Flex>
    </MotionBox>
  );
};

// ── HistoryItem ───────────────────────────────────────────────────────────────
const HistoryItem = ({ scan, isActive, isLive, onClick, onDelete }) => (
  <Flex align="center" gap={3} px={3} py="10px" borderRadius="8px" cursor="pointer"
    bg={isActive ? 'rgba(255,255,255,0.06)' : 'transparent'}
    border={isActive ? `1px solid ${BORDER}` : '1px solid transparent'}
    _hover={{ bg:'rgba(255,255,255,0.04)' }} transition="all 0.15s"
    onClick={onClick}>
    <Box flex="1" minW={0}>
      <Flex align="center" gap={2}>
        <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)"
          noOfLines={1} fontFamily="mono">{scan.target}</Text>
        {isLive && <Spinner size="xs" color={ACCENT} />}
      </Flex>
      <Text fontSize="10px" color={MUTED} mt={0.5}>
        {scan.openCount} open · {new Date(scan.createdAt).toLocaleDateString()}
      </Text>
    </Box>
    <Badge fontSize="10px" bg={isLive ? A_S : 'rgba(255,255,255,0.06)'}
      color={isLive ? ACCENT : MUTED}
      border={`1px solid ${isLive ? A_B : BORDER}`} borderRadius="full" px={2} flexShrink={0}>
      {isLive ? 'LIVE' : scan.openCount}
    </Badge>
    <Tooltip label="Delete scan" hasArrow fontSize="10px">
      <IconButton icon={<DeleteIcon />} size="xs" variant="ghost"
        color={MUTED} _hover={{ color:RED }}
        onClick={e => { e.stopPropagation(); onDelete(scan._id); }}
        aria-label="delete" />
    </Tooltip>
  </Flex>
);

// ── Main View ─────────────────────────────────────────────────────────────────
const NetworkScannerView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const [target,     setTarget]     = useState('');
  const [activeScan, setActiveScan] = useState(null);   // full scan object being viewed
  const [history,    setHistory]    = useState([]);
  const [showRaw,    setShowRaw]    = useState(false);

  const pollRef    = useRef(null);
  const termRef    = useRef(null);

  const isScanning  = activeScan?.status === 'scanning';
  const liveOutput  = activeScan?.liveOutput || '';

  // Auto-scroll terminal to bottom as new lines arrive
  useEffect(() => {
    if (isScanning && termRef.current)
      termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [liveOutput, isScanning]);
  const ports      = activeScan?.ports || [];

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmtElapsed  = (s) => !s ? '—' : s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;
  const fmtRelative = (d) => {
    if (!d) return '';
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };
  const webPorts   = ports.filter(p => portCategory(p.port, p.service).label.match(/WEB|HTTPS/)).length;
  const riskPorts  = ports.filter(p => ['RDP','SMB','WINRM','VNC'].includes(portCategory(p.port, p.service).label)).length;

  // ── Fetch history ──────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!engId) return;
    try {
      const r = await fetch(`/api/network-scanner/${engId}/history`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      setHistory(await r.json());
    } catch (_) {}
  }, [engId]);

  // ── Poll a scan ────────────────────────────────────────────────────────────
  const pollScan = useCallback(async (scanId) => {
    try {
      const r = await fetch(`/api/network-scanner/${engId}/scan/${scanId}`, {
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

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = useCallback((scanId) => {
    stopPolling();
    pollScan(scanId); // immediate first fetch
    pollRef.current = setInterval(() => pollScan(scanId), 2500);
  }, [pollScan]);

  // ── On mount: resume any active scan for this engagement ──────────────────
  useEffect(() => {
    if (!engId) return;
    fetchHistory();

    const savedId = localStorage.getItem(lsKey(engId));
    if (savedId) startPolling(savedId);

    return () => stopPolling();
  }, [engId]); // eslint-disable-line

  // ── Start scan ─────────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (!target.trim()) {
      toast({ title:'Enter an IP or domain', status:'warning', duration:2000, isClosable:true });
      return;
    }
    try {
      const r = await fetch(`/api/network-scanner/${engId}/scan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to start scan');

      localStorage.setItem(lsKey(engId), data.scanId);
      startPolling(data.scanId);
      fetchHistory();
    } catch (e) {
      toast({ title:'Could not start scan', description: e.message, status:'error', duration:4000, isClosable:true });
    }
  };

  // ── Cancel scan ────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!activeScan?._id) return;
    try {
      await fetch(`/api/network-scanner/${engId}/scan/${activeScan._id}/cancel`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      stopPolling();
      localStorage.removeItem(lsKey(engId));
      setActiveScan(p => ({ ...p, status: 'error', error: 'Cancelled' }));
      fetchHistory();
    } catch (_) {}
  };

  // ── Load a historical scan ─────────────────────────────────────────────────
  const loadScan = async (scan) => {
    stopPolling();
    localStorage.removeItem(lsKey(engId));
    try {
      const r = await fetch(`/api/network-scanner/${engId}/scan/${scan._id}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const full = await r.json();
      setActiveScan(full);
      setTarget(full.target);
      setShowRaw(false);
    } catch (_) {}
  };

  // ── Delete scan ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await fetch(`/api/network-scanner/${engId}/scan/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      if (activeScan?._id === id) { setActiveScan(null); stopPolling(); localStorage.removeItem(lsKey(engId)); }
      setHistory(p => p.filter(s => s._id !== id));
    } catch (_) {}
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Box mb={5}>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
          Network <Text as="span" color="red.400">Scanner</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          {eng?.name} · port scanning via RustScan · scans persist while you navigate away
        </Text>
      </Box>

      {/* ── Info banner ──────────────────────────────────────────────────── */}
      <Box mb={4} px={4} py={3} borderRadius="10px" bg={A_S} border={`1px solid ${A_B}`}>
        <Flex align="center" gap={2} mb={1.5}>
          <Box as="svg" viewBox="0 0 24 24" w="12px" h="12px" fill="none" stroke={ACCENT}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" flexShrink={0}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </Box>
          <Text fontSize="10px" fontWeight="bold" color={ACCENT} textTransform="uppercase" letterSpacing="wider">
            Active Scanning — Docker Required
          </Text>
        </Flex>
        <Flex gap={5} flexWrap="wrap">
          {[
            'TCP port discovery via rustscan/rustscan -b 500',
            'Service & version detection via nmap follow-up',
            'Results saved live — leave the page and come back',
            'Supports single IP, CIDR range, or hostname',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color={MUTED}>{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <Flex gap={0} align="flex-start">

        {/* ── Left: input + results ──────────────────────────────────────── */}
        <Flex direction="column" flex="1" gap={4} pr={6} minW={0}>

          {/* Input row */}
          <Flex gap={3} align="center">
            <Box flex="1" pos="relative">
              <Box pos="absolute" left={4} top="50%" transform="translateY(-50%)" pointerEvents="none" zIndex={1}>
                <SearchIcon boxSize={3.5} color={MUTED} />
              </Box>
              <Input
                pl={10} h="46px" fontSize="sm" borderRadius="12px" fontFamily="mono"
                bg="rgba(255,255,255,0.04)" border={`1px solid ${BORDER}`}
                color="var(--dash-text-primary)"
                _placeholder={{ color: MUTED, fontFamily:'sans-serif', fontSize:'13px' }}
                _hover={{ borderColor:'rgba(255,255,255,0.15)' }}
                _focus={{ borderColor: A_B, boxShadow:`0 0 0 1px ${A_B}`, outline:'none', bg:'rgba(255,255,255,0.05)' }}
                placeholder="192.168.1.1  ·  10.0.0.0/24  ·  target.com"
                value={target}
                onChange={e => setTarget(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isScanning && handleScan()}
                isDisabled={isScanning}
              />
            </Box>
            {isScanning ? (
              <Button h="46px" px={6} borderRadius="12px" fontSize="13px" fontWeight="semibold"
                bg="rgba(255,80,95,0.12)" border="1px solid rgba(255,80,95,0.4)"
                color="rgba(255,130,130,0.95)" _hover={{ bg:'rgba(255,80,95,0.2)' }}
                leftIcon={<Spinner size="xs" />}
                onClick={handleCancel} flexShrink={0}>
                Cancel
              </Button>
            ) : (
              <Button h="46px" px={6} borderRadius="12px" fontSize="13px" fontWeight="semibold"
                bg="rgba(255,80,95,0.12)" border="1px solid rgba(255,80,95,0.4)"
                color="rgba(255,130,130,0.95)" _hover={{ bg:'rgba(255,80,95,0.2)' }}
                leftIcon={<SearchIcon boxSize={3} />}
                onClick={handleScan} flexShrink={0}>
                Scan
              </Button>
            )}
            {isScanning && (
              <Flex align="center" gap={2} px={3} py="6px" borderRadius="8px" flexShrink={0}
                bg={A_S} border={`1px solid ${A_B}`}>
                <Spinner size="xs" color={ACCENT} speed="0.7s" />
                <Text fontSize="12px" color={ACCENT} fontWeight="semibold" whiteSpace="nowrap">
                  {ports.length} ports found
                </Text>
              </Flex>
            )}
          </Flex>

          {/* Stats strip */}
          {activeScan && (
            <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3}>
              <StatCard label="Open Ports" value={ports.length}  color={GREEN} />
              <StatCard label="Web Ports"  value={webPorts}      color={ACCENT} />
              <StatCard label="Risk Ports" value={riskPorts}     color={RED} sub="RDP · SMB · WinRM · VNC" />
              <StatCard label="Duration"   value={fmtElapsed(activeScan.duration)} />
            </SimpleGrid>
          )}

          {/* Ports table */}
          <Box borderRadius="12px" border={`1px solid ${BORDER}`} bg={CARD} overflow="hidden">
            {ports.length > 0 && (
              <Flex px={5} py="9px" borderBottom={`1px solid ${BORDER}`}
                bg="rgba(255,255,255,0.02)" align="center" justify="space-between">
                <Flex gap={5}>
                  {['PORT / PROTO','CATEGORY','SERVICE','VERSION'].map(l => (
                    <Text key={l} fontSize="9px" color={MUTED} textTransform="uppercase"
                      letterSpacing="wider" fontWeight="bold">{l}</Text>
                  ))}
                </Flex>
                <Flex align="center" gap={3}>
                  {!isScanning && activeScan?.rawOutput && (
                    <Button size="xs" variant="ghost" color={MUTED} fontSize="10px"
                      _hover={{ color:'white' }} onClick={() => setShowRaw(p => !p)}>
                      {showRaw ? 'Hide raw' : 'Raw output'}
                    </Button>
                  )}
                  {isScanning && <Spinner size="xs" color={ACCENT} />}
                  <Text fontSize="10px" color={MUTED}>{ports.length} open</Text>
                </Flex>
              </Flex>
            )}

            <AnimatePresence>
              {ports.map((p, i) => <PortRow key={`${p.port}-${i}`} item={p} />)}
            </AnimatePresence>

            {!activeScan && (
              <Flex direction="column" align="center" justify="center" py={16} gap={4} opacity={0.4}>
                <Box as="svg" viewBox="0 0 24 24" w="42px" h="42px" fill="none"
                  stroke={MUTED} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2"/>
                  <rect x="2" y="14" width="20" height="8" rx="2"/>
                  <line x1="6" y1="6" x2="6.01" y2="6"/>
                  <line x1="6" y1="18" x2="6.01" y2="18"/>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)">
                    Enter a target to begin scanning
                  </Text>
                  <Text fontSize="12px" color={MUTED} mt={1}>
                    Supports single IP, CIDR range, or hostname
                  </Text>
                </Box>
              </Flex>
            )}
            {activeScan && ports.length === 0 && isScanning && (
              <Flex direction="column" align="center" justify="center" py={14} gap={3}>
                <Spinner size="lg" color={ACCENT} thickness="2px" speed="0.7s" />
                <Text fontSize="13px" color={MUTED}>Scanning {activeScan.target}…</Text>
                <Text fontSize="11px" color={MUTED} opacity={0.6}>First run pulls the Docker image</Text>
              </Flex>
            )}
            {activeScan && ports.length === 0 && !isScanning && (
              <Flex justify="center" py={10}>
                <Text fontSize="13px" color={MUTED} opacity={0.5}>No open ports found</Text>
              </Flex>
            )}
          </Box>

          {/* Live Docker terminal */}
          <AnimatePresence>
            {isScanning && (
              <MotionBox initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:8 }} transition={{ duration:0.25 }}
                borderRadius="12px" border={`1px solid ${A_B}`} overflow="hidden"
                bg="rgba(8,8,12,0.9)">
                <Flex align="center" justify="space-between" px={5} py="10px"
                  borderBottom={`1px solid ${A_B}`} bg="rgba(99,179,237,0.05)">
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
                  css={{ '&::-webkit-scrollbar': { width:'3px' }, '&::-webkit-scrollbar-thumb': { background: A_B } }}>
                  {liveOutput ? (
                    <Text fontSize="11px" color="#a8d8a8" fontFamily="'Courier New', monospace"
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
            {showRaw && !isScanning && activeScan?.rawOutput && (
              <MotionBox initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-8 }} transition={{ duration:0.2 }}
                borderRadius="12px" border={`1px solid ${BORDER}`} bg={CARD} overflow="hidden">
                <Flex align="center" justify="space-between" px={5} py={3}
                  borderBottom={`1px solid ${BORDER}`}>
                  <Flex align="center" gap={2}>
                    <Box w="3px" h="12px" borderRadius="full" bg={MUTED} />
                    <Text fontSize="10px" color={MUTED} textTransform="uppercase"
                      letterSpacing="wider" fontWeight="bold">Raw Output</Text>
                  </Flex>
                  <CopyBtn text={activeScan.rawOutput} label="Copy raw" />
                </Flex>
                <Box px={5} py={4} maxH="300px" overflowY="auto"
                  css={{ '&::-webkit-scrollbar':{ width:'3px' }, '&::-webkit-scrollbar-thumb':{ background:'rgba(255,255,255,0.08)' } }}>
                  <Text fontSize="11px" color={MUTED} fontFamily="mono" whiteSpace="pre-wrap" lineHeight="1.7">
                    {activeScan.rawOutput}
                  </Text>
                </Box>
              </MotionBox>
            )}
          </AnimatePresence>
        </Flex>

        {/* ── Right: history panel (Domain Recon style) ───────────────────── */}
        <Box w="260px" flexShrink={0} borderLeft={`1px solid ${BORDER}`} pl={5}>

          <Flex align="center" justify="space-between" mb={4}>
            <Flex align="center" gap={2}>
              <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
              <Text fontSize="10px" color={MUTED} textTransform="uppercase"
                letterSpacing="widest" fontWeight="bold">Scan History</Text>
            </Flex>
            <Flex align="center" gap={2}>
              {history.length > 0 && (
                <Box px={2} py="1px" borderRadius="full" bg={A_S}
                  border={`1px solid ${A_B}`}>
                  <Text fontSize="10px" color={ACCENT} fontWeight="bold">{history.length}</Text>
                </Box>
              )}
              <Tooltip label="Refresh" hasArrow fontSize="10px">
                <IconButton icon={<RepeatIcon />} size="xs" variant="ghost"
                  color={MUTED} _hover={{ color:'white' }} onClick={fetchHistory} aria-label="refresh" />
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
                const webCnt   = (scan.ports||[]).filter(p => portCategory(p.port, p.service).label.match(/WEB|HTTPS/)).length;
                const riskCnt  = (scan.ports||[]).filter(p => ['RDP','SMB','WINRM','VNC'].includes(portCategory(p.port, p.service).label)).length;

                return (
                  <Box key={scan._id} px={3} py="10px" borderRadius="9px" cursor="pointer"
                    bg={isActive ? 'rgba(255,255,255,0.06)' : 'transparent'}
                    _hover={{ bg:'rgba(255,255,255,0.04)' }} transition="all 0.15s"
                    onClick={() => isLive ? startPolling(scan._id) : loadScan(scan)}>
                    <Flex align="center" justify="space-between" mb={1.5}>
                      <Flex align="center" gap={1.5} minW={0}>
                        <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)"
                          fontFamily="mono" noOfLines={1}>{scan.target}</Text>
                        {isLive && <Spinner size="xs" color={ACCENT} />}
                      </Flex>
                      <Tooltip label="Delete" hasArrow fontSize="10px">
                        <IconButton icon={<DeleteIcon />} size="xs" variant="ghost"
                          color={MUTED} _hover={{ color:RED }} flexShrink={0}
                          onClick={e => { e.stopPropagation(); handleDelete(scan._id); }}
                          aria-label="delete" />
                      </Tooltip>
                    </Flex>
                    <Flex align="center" justify="space-between">
                      <Flex gap={1.5} flexWrap="wrap">
                        <Badge fontSize="9px" px="6px" py="1px" borderRadius="4px"
                          bg={`${GREEN}18`} color={GREEN} border={`1px solid ${GREEN}30`}>
                          {isLive ? '…' : scan.openCount} OPEN
                        </Badge>
                        {webCnt > 0 && (
                          <Badge fontSize="9px" px="6px" py="1px" borderRadius="4px"
                            bg={`${ACCENT}15`} color={ACCENT} border={`1px solid ${ACCENT}30`}>
                            {webCnt} WEB
                          </Badge>
                        )}
                        {riskCnt > 0 && (
                          <Badge fontSize="9px" px="6px" py="1px" borderRadius="4px"
                            bg={`${RED}15`} color={RED} border={`1px solid ${RED}30`}>
                            {riskCnt} RISK
                          </Badge>
                        )}
                      </Flex>
                      <Text fontSize="10px" color={MUTED} flexShrink={0} ml={2}>
                        {fmtRelative(scan.createdAt)}
                      </Text>
                    </Flex>
                  </Box>
                );
              })
            )}
          </Flex>

          {/* Command preview */}
          {target && (
            <Box mt={5} pt={4} borderTop={`1px solid ${BORDER}`}>
              <Text fontSize="9px" color={MUTED} textTransform="uppercase"
                letterSpacing="wider" fontWeight="bold" mb={2}>Command</Text>
              <Flex align="center" gap={2} bg="rgba(255,255,255,0.04)"
                borderRadius="8px" px={3} py="7px">
                <Text fontSize="10px" color="var(--dash-text-secondary)" fontFamily="mono"
                  flex="1" noOfLines={1}>{`rustscan -a ${target} -b 500`}</Text>
                <CopyBtn text={`docker run --rm rustscan/rustscan -a ${target} -b 500`} label="Copy" />
              </Flex>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default NetworkScannerView;
