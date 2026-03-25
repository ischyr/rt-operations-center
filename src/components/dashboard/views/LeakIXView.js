import { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input,
  SimpleGrid, Modal, ModalOverlay, ModalContent, ModalBody,
  Spinner, Badge,
} from '@chakra-ui/react';
import {
  SearchIcon, DeleteIcon, CloseIcon, ViewIcon, ViewOffIcon,
  CheckIcon, RepeatIcon, ChevronRightIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

const API = 'http://localhost:5000/api';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const inputStyles = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const fmtBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0; let v = bytes;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const SEVERITY_COLORS = {
  critical: '#FC8181', high: '#F6AD55', medium: '#ECC94B',
  low: '#68D391', info: '#76E4F7', '': '#718096',
};
const sevColor = (s) => SEVERITY_COLORS[(s || '').toLowerCase()] || '#718096';

const countryFlag = (iso) => {
  if (!iso || iso.length !== 2) return '';
  return String.fromCodePoint(
    ...[...iso.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
};

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1}>{children}</Text>
);

// ── Service / Leak row ────────────────────────────────────────────────────────
const ServiceRow = ({ ev }) => {
  const [open, setOpen] = useState(false);
  const title  = ev.http?.title || ev.service?.software?.name || ev.event_source || '—';
  const sev    = (ev.leak?.severity || ev.severity || '').toLowerCase();
  const sevCol = sevColor(sev);

  return (
    <Box border="1px solid var(--dash-card-border)" borderRadius="10px"
      bg="rgba(255,255,255,0.02)" transition="border-color 0.15s"
      _hover={{ borderColor: 'rgba(255,255,255,0.15)' }}>
      <Flex align="center" gap={3} px={3} py={2.5} cursor="pointer" onClick={() => setOpen(o => !o)}>
        {/* Severity dot */}
        <Box w="7px" h="7px" borderRadius="full" flexShrink={0}
          bg={sevCol} boxShadow={sev ? `0 0 5px ${sevCol}66` : 'none'} />
        {/* IP:Port */}
        <Text fontSize="12px" fontFamily="monospace" color="var(--dash-text-secondary)"
          minW="160px" flexShrink={0}>
          {ev.ip}:{ev.port}
        </Text>
        {/* Protocol badge */}
        <Box px={1.5} py="1px" borderRadius="4px" fontSize="9px" fontWeight="700"
          textTransform="uppercase" letterSpacing="wider" flexShrink={0}
          bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)"
          color="var(--dash-text-muted)">
          {ev.protocol || ev.transport?.[0] || '—'}
        </Box>
        {/* Title */}
        <Text fontSize="12px" color="var(--dash-text-primary)" flex="1" noOfLines={1}>{title}</Text>
        {/* Geo */}
        <Text fontSize="11px" color="var(--dash-text-muted)" flexShrink={0}>
          {countryFlag(ev.geoip?.country_iso_code)} {ev.geoip?.country_name || '—'}
        </Text>
        {/* Tags */}
        {(ev.tags || []).slice(0, 2).map(t => (
          <Box key={t} px={1.5} py="1px" borderRadius="4px" fontSize="9px"
            bg="rgba(255,80,95,0.08)" border="1px solid rgba(255,80,95,0.2)"
            color="rgba(255,130,130,0.8)" flexShrink={0}>{t}</Box>
        ))}
        <ChevronRightIcon color="var(--dash-text-muted)" boxSize={3} flexShrink={0}
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
      </Flex>

      {open && (
        <Box borderTop="1px solid var(--dash-card-border)" px={3} py={3}>
          <SimpleGrid columns={3} spacing={4} mb={ev.leak?.type ? 3 : 0}>
            <Box>
              <Label>Host</Label>
              <Text fontSize="12px" color="var(--dash-text-secondary)" fontFamily="monospace">
                {ev.host || ev.ip}
              </Text>
            </Box>
            <Box>
              <Label>Organisation</Label>
              <Text fontSize="12px" color="var(--dash-text-secondary)">
                {ev.network?.organization_name || '—'} {ev.network?.asn ? `(AS${ev.network.asn})` : ''}
              </Text>
            </Box>
            <Box>
              <Label>First seen</Label>
              <Text fontSize="12px" color="var(--dash-text-secondary)">{fmtDate(ev.time)}</Text>
            </Box>
            {ev.http?.status ? (
              <Box>
                <Label>HTTP Status</Label>
                <Text fontSize="12px" color="var(--dash-text-secondary)">{ev.http.status}</Text>
              </Box>
            ) : null}
            {ev.ssl?.enabled ? (
              <Box>
                <Label>TLS CN</Label>
                <Text fontSize="12px" color="var(--dash-text-secondary)" fontFamily="monospace">
                  {ev.ssl.certificate?.cn || '—'}
                </Text>
              </Box>
            ) : null}
            {ev.service?.software?.name ? (
              <Box>
                <Label>Software</Label>
                <Text fontSize="12px" color="var(--dash-text-secondary)">
                  {ev.service.software.name} {ev.service.software.version}
                </Text>
              </Box>
            ) : null}
          </SimpleGrid>

          {/* Leak dataset */}
          {ev.leak?.type && (
            <Box mt={2} p={2.5} borderRadius="8px"
              bg={`${sevCol}08`} border={`1px solid ${sevCol}30`}>
              <Flex align="center" gap={2} mb={2}>
                <Box w="6px" h="6px" borderRadius="full" bg={sevCol} />
                <Text fontSize="11px" fontWeight="700" color={sevCol} textTransform="uppercase"
                  letterSpacing="wider">{ev.leak.severity} · {ev.leak.type}</Text>
                {ev.leak.stage && (
                  <Box px={1.5} py="1px" borderRadius="4px" fontSize="9px"
                    bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)"
                    color="var(--dash-text-muted)">{ev.leak.stage}</Box>
                )}
              </Flex>
              <SimpleGrid columns={4} spacing={3}>
                {[
                  ['Rows',        ev.leak.dataset?.rows?.toLocaleString()       ],
                  ['Files',       ev.leak.dataset?.files?.toLocaleString()      ],
                  ['Size',        fmtBytes(ev.leak.dataset?.size)               ],
                  ['Collections', ev.leak.dataset?.collections?.toLocaleString()],
                ].map(([lbl, val]) => (
                  <Box key={lbl}>
                    <Label>{lbl}</Label>
                    <Text fontSize="12px" color="var(--dash-text-secondary)">{val || '0'}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* HTTP summary */}
          {ev.summary && (
            <Box mt={2} p={2} borderRadius="8px" bg="rgba(0,0,0,0.4)"
              fontFamily="monospace" fontSize="10px" color="#A0E0A0"
              whiteSpace="pre-wrap" wordBreak="break-all"
              maxH="120px" overflowY="auto"
              css={{ '&::-webkit-scrollbar': { width: '2px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)' } }}>
              {ev.summary.slice(0, 600)}{ev.summary.length > 600 ? '…' : ''}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

// ── Scan Detail ───────────────────────────────────────────────────────────────
const ScanDetail = ({ scan, onDelete, onRescan, rescanning }) => {
  const [tab, setTab] = useState('services');
  const services = scan.data?.Services || [];
  const leaks    = scan.data?.Leaks    || [];
  const ips      = new Set([...services, ...leaks].map(e => e.ip).filter(Boolean));

  const highestSev = [...leaks].reduce((acc, e) => {
    const order = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
    const s = (e.leak?.severity || '').toLowerCase();
    return (order[s] ?? -1) > (order[acc] ?? -1) ? s : acc;
  }, '');

  const items = tab === 'services' ? services : leaks;

  return (
    <Box flex="1" minW={0}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Box>
          <Flex align="center" gap={2} mb={1}>
            <Text fontSize="18px" fontWeight="bold" color="var(--dash-text-primary)"
              fontFamily="monospace">{scan.domain}</Text>
            {highestSev && (
              <Box px={2} py="2px" borderRadius="6px" fontSize="10px" fontWeight="700"
                textTransform="uppercase" letterSpacing="wider"
                bg={`${sevColor(highestSev)}15`} border={`1px solid ${sevColor(highestSev)}40`}
                color={sevColor(highestSev)}>{highestSev}</Box>
            )}
          </Flex>
          <Text fontSize="11px" color="var(--dash-text-muted)">
            Last scanned {fmtDate(scan.updatedAt || scan.createdAt)}
            {scan.scannedByCallsign ? ` · by ${scan.scannedByCallsign}` : ''}
          </Text>
        </Box>
        <Flex gap={2} align="center">
          <Button size="xs" leftIcon={<RepeatIcon boxSize={2.5} />} fontSize="10px" borderRadius="7px"
            bg="rgba(255,80,95,0.08)" border="1px solid rgba(255,80,95,0.25)"
            color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.16)' }}
            isLoading={rescanning} loadingText="Scanning…"
            onClick={() => onRescan(scan.domain)}>
            Re-scan
          </Button>
          <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
            color="var(--dash-text-muted)" borderRadius="7px"
            _hover={{ color: '#FC8181', bg: 'rgba(252,129,129,0.08)' }}
            onClick={() => onDelete(scan._id)} aria-label="Delete scan" />
        </Flex>
      </Flex>

      {/* Stats */}
      <SimpleGrid columns={3} spacing={3} mb={4}>
        {[
          { label: 'Services',   value: services.length, color: '#76E4F7' },
          { label: 'Leaks',      value: leaks.length,    color: leaks.length > 0 ? '#FC8181' : '#68D391' },
          { label: 'Unique IPs', value: ips.size,        color: '#A0AEC0' },
        ].map(({ label, value, color }) => (
          <Box key={label} p={3} borderRadius="10px"
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
            <Text fontSize="22px" fontWeight="bold" color={color}>{value}</Text>
            <Text fontSize="11px" color="var(--dash-text-muted)" textTransform="uppercase"
              letterSpacing="wider" fontWeight="600">{label}</Text>
          </Box>
        ))}
      </SimpleGrid>

      {/* Tabs */}
      <Flex gap={1} mb={3} p={1} borderRadius="10px"
        bg="rgba(255,255,255,0.03)" border="1px solid var(--dash-card-border)" w="fit-content">
        {['services', 'leaks'].map(t => (
          <Button key={t} size="xs" borderRadius="7px" fontSize="11px" fontWeight="600"
            px={4} h="28px" textTransform="capitalize"
            bg={tab === t ? 'rgba(255,80,95,0.15)' : 'transparent'}
            border={tab === t ? '1px solid rgba(255,80,95,0.35)' : '1px solid transparent'}
            color={tab === t ? 'rgba(255,130,130,0.95)' : 'var(--dash-text-muted)'}
            _hover={{ color: tab === t ? 'rgba(255,130,130,0.95)' : 'var(--dash-text-primary)' }}
            onClick={() => setTab(t)}>
            {t === 'services' ? `Services (${services.length})` : `Leaks (${leaks.length})`}
          </Button>
        ))}
      </Flex>

      {/* List */}
      {items.length === 0 ? (
        <Flex align="center" justify="center" h="120px" borderRadius="12px"
          bg="rgba(255,255,255,0.02)" border="1px solid var(--dash-card-border)">
          <Text fontSize="13px" color="var(--dash-text-muted)">
            No {tab} found for this domain.
          </Text>
        </Flex>
      ) : (
        <Flex direction="column" gap={1.5}>
          {items.map((ev, i) => <ServiceRow key={ev.event_fingerprint || i} ev={ev} />)}
        </Flex>
      )}
    </Box>
  );
};

// ── Delete confirm modal ──────────────────────────────────────────────────────
const DeleteConfirm = ({ domain, onClose, onConfirm, loading }) => (
  <Modal isOpen onClose={onClose} size="sm" isCentered>
    <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
    <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="16px" overflow="hidden">
      <ModalBody p={0}>
        <Box p={6} pos="relative">
          <Box pos="absolute" top="0" left="0" right="0" h="2px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(252,129,129,0.6), transparent)' }} />
          <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)" mb={2}>
            Delete scan?
          </Text>
          <Text fontSize="13px" color="var(--dash-text-secondary)" mb={4} lineHeight="1.6">
            Remove the saved results for{' '}
            <Text as="span" fontFamily="monospace" color="rgba(255,130,130,0.9)">{domain}</Text>.
            The domain can be re-scanned at any time.
          </Text>
          <Flex gap={3}>
            <Button flex="1" size="sm" variant="ghost" borderRadius="10px" h="38px"
              color="var(--dash-text-muted)" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
              onClick={onClose}>Cancel</Button>
            <Button flex="1" size="sm" h="38px" borderRadius="10px" fontWeight="semibold"
              bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.35)"
              color="#FC8181" _hover={{ bg: 'rgba(252,129,129,0.18)' }}
              isLoading={loading} loadingText="Deleting…" onClick={onConfirm}>
              Yes, Delete
            </Button>
          </Flex>
        </Box>
      </ModalBody>
    </ModalContent>
  </Modal>
);

// ── Main View ─────────────────────────────────────────────────────────────────
const LeakIXView = () => {
  const { slug }                       = useParams();
  const { getBySlug, fetchEngagements } = useEngagements();
  const { user }                       = useAuth();
  const eng                            = getBySlug(slug);

  const [scans,        setScans]        = useState([]);
  const [selected,     setSelected]     = useState(null); // scan _id
  const [domain,       setDomain]       = useState('');
  const [apiKey,       setApiKey]       = useState('');
  const [showKey,      setShowKey]      = useState(false);
  const [saveKey,      setSaveKey]      = useState(true);
  const [scanning,     setScanning]     = useState(false);
  const [rescanning,   setRescanning]   = useState(false);
  const [scanError,    setScanError]    = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [keySaved,     setKeySaved]     = useState(false);

  // Sync scans from context
  useEffect(() => { fetchEngagements(); }, []); // eslint-disable-line
  useEffect(() => {
    if (!eng) return;
    setScans(eng.leakxScans || []);
    if (!apiKey && eng.leakxConfig?.apiKey) {
      setApiKey(eng.leakxConfig.apiKey);
      setKeySaved(true);
    }
  }, [eng]); // eslint-disable-line

  const activeScan = scans.find(s => String(s._id) === String(selected));

  const handleScan = useCallback(async (domainOverride) => {
    if (!eng) return;
    const target = (domainOverride || domain).trim();
    if (!target)  { setScanError('Enter a domain to scan.'); return; }
    if (!apiKey.trim()) { setScanError('Enter your LeakIX API key.'); return; }

    const isRescan = !!domainOverride;
    if (isRescan) setRescanning(true); else setScanning(true);
    setScanError('');

    try {
      const res  = await fetch(`${API}/leakx/${eng._id}/scan`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ domain: target, apiKey: apiKey.trim(), saveKey }),
      });
      const data = await res.json();
      if (!res.ok) { setScanError(data.message || 'Scan failed'); return; }

      setKeySaved(saveKey);
      await fetchEngagements();
      setSelected(String(data._id));
      if (!isRescan) setDomain('');
    } catch { setScanError('Network error'); }
    finally { setScanning(false); setRescanning(false); }
  }, [eng, domain, apiKey, saveKey, fetchEngagements]);

  const handleDelete = async () => {
    if (!eng || !deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`${API}/leakx/${eng._id}/scans/${deleteTarget._id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      setScans(prev => prev.filter(s => String(s._id) !== String(deleteTarget._id)));
      if (String(selected) === String(deleteTarget._id)) setSelected(null);
      await fetchEngagements();
    } catch {}
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  if (!eng) return null;

  return (
    <Box pb={10}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} gap={4} flexWrap="wrap">
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            Leak<Text as="span" color="red.400">IX</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · domain intelligence via LeakIX API
          </Text>
        </Box>
      </Flex>

      {/* API Key + Search bar */}
      <Box mb={6} p={4} borderRadius="14px" bg="var(--dash-card-bg)"
        border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
        <Box pos="absolute" top="0" left="0" right="0" h="2px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(255,80,95,0.5), transparent)' }} />

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {/* API Key */}
          <Box>
            <Flex justify="space-between" align="center" mb={1}>
              <Label>LeakIX API Key</Label>
              {keySaved && (
                <Flex align="center" gap={1}>
                  <CheckIcon boxSize={2.5} color="#68D391" />
                  <Text fontSize="10px" color="#68D391">Saved for this engagement</Text>
                </Flex>
              )}
            </Flex>
            <Flex gap={2}>
              <Input type={showKey ? 'text' : 'password'}
                value={apiKey} onChange={e => { setApiKey(e.target.value); setKeySaved(false); }}
                placeholder="Your LeakIX API key…" {...inputStyles} flex="1" />
              <IconButton icon={showKey ? <ViewOffIcon /> : <ViewIcon />}
                onClick={() => setShowKey(v => !v)}
                size="sm" variant="ghost" color="var(--dash-text-muted)"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                borderRadius="10px" border="1px solid rgba(255,255,255,0.1)"
                bg="rgba(255,255,255,0.05)" h="40px" w="40px" aria-label="Toggle key" />
            </Flex>
            <Flex align="center" gap={2} mt={1.5} cursor="pointer" onClick={() => setSaveKey(v => !v)}>
              <Box w="14px" h="14px" borderRadius="4px" flexShrink={0}
                bg={saveKey ? 'rgba(255,80,95,0.15)' : 'rgba(255,255,255,0.05)'}
                border={`1px solid ${saveKey ? 'rgba(255,80,95,0.5)' : 'rgba(255,255,255,0.15)'}`}
                display="flex" alignItems="center" justifyContent="center">
                {saveKey && <CheckIcon boxSize={2} color="rgba(255,130,130,0.9)" />}
              </Box>
              <Text fontSize="10px" color="var(--dash-text-muted)" userSelect="none">
                Save key for this engagement
              </Text>
            </Flex>
          </Box>

          {/* Domain search */}
          <Box>
            <Label>Domain to scan</Label>
            <Flex gap={2}>
              <Input value={domain}
                onChange={e => { setDomain(e.target.value); setScanError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="example.com" {...inputStyles} flex="1" />
              <Button size="sm" h="40px" px={5} borderRadius="10px" fontWeight="semibold"
                leftIcon={scanning ? <Spinner size="xs" /> : <SearchIcon boxSize={3} />}
                bg="rgba(255,80,95,0.12)" border="1px solid rgba(255,80,95,0.4)"
                color="rgba(255,130,130,0.95)" _hover={{ bg: 'rgba(255,80,95,0.2)' }}
                isDisabled={!domain.trim() || !apiKey.trim() || scanning}
                onClick={() => handleScan()}>
                {scanning ? 'Scanning…' : 'Scan'}
              </Button>
            </Flex>
            {scanError && (
              <Text fontSize="11px" color="#FC8181" mt={1.5}>{scanError}</Text>
            )}
          </Box>
        </SimpleGrid>
      </Box>

      {/* Body */}
      {scans.length === 0 ? (
        <Flex direction="column" align="center" justify="center" gap={3} py={16}
          borderRadius="14px" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
          <Text fontSize="28px">🔍</Text>
          <Text fontWeight="bold" color="var(--dash-text-primary)">No scans yet</Text>
          <Text fontSize="sm" color="var(--dash-text-muted)">
            Enter a domain above and hit Scan to get started.
          </Text>
        </Flex>
      ) : (
        <Flex gap={4} align="flex-start">
          {/* Saved scans sidebar */}
          <Box w="220px" flexShrink={0}>
            <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
              letterSpacing="wider" fontWeight="600" mb={2}>Saved scans ({scans.length})</Text>
            <Flex direction="column" gap={1.5}>
              {[...scans].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                .map(scan => {
                  const srvCount  = (scan.data?.Services || []).length;
                  const lkCount   = (scan.data?.Leaks    || []).length;
                  const isActive  = String(scan._id) === String(selected);
                  const maxSev    = (scan.data?.Leaks || []).reduce((acc, e) => {
                    const order = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
                    const s     = (e.leak?.severity || '').toLowerCase();
                    return (order[s] ?? -1) > (order[acc] ?? -1) ? s : acc;
                  }, '');

                  return (
                    <Box key={String(scan._id)}
                      px={3} py={2.5} borderRadius="10px" cursor="pointer"
                      bg={isActive ? 'rgba(255,80,95,0.1)' : 'var(--dash-card-bg)'}
                      border={`1px solid ${isActive ? 'rgba(255,80,95,0.35)' : 'var(--dash-card-border)'}`}
                      transition="all 0.15s"
                      _hover={{ borderColor: isActive ? 'rgba(255,80,95,0.35)' : 'rgba(255,255,255,0.15)' }}
                      onClick={() => setSelected(String(scan._id))}>
                      <Text fontSize="12px" fontWeight="600" fontFamily="monospace"
                        color={isActive ? 'rgba(255,130,130,0.95)' : 'var(--dash-text-primary)'}
                        noOfLines={1}>{scan.domain}</Text>
                      <Flex align="center" gap={2} mt={1}>
                        {maxSev && (
                          <Box w="5px" h="5px" borderRadius="full" bg={sevColor(maxSev)}
                            flexShrink={0} boxShadow={`0 0 4px ${sevColor(maxSev)}88`} />
                        )}
                        <Text fontSize="10px" color="var(--dash-text-muted)">
                          {srvCount}s · {lkCount}l
                        </Text>
                        <Text fontSize="9px" color="var(--dash-text-muted)" noOfLines={1} flex="1">
                          {fmtDate(scan.updatedAt || scan.createdAt).split(' ').slice(0, 2).join(' ')}
                        </Text>
                      </Flex>
                    </Box>
                  );
                })}
            </Flex>
          </Box>

          {/* Detail panel */}
          {activeScan ? (
            <ScanDetail
              scan={activeScan}
              onDelete={(id) => setDeleteTarget(scans.find(s => String(s._id) === id))}
              onRescan={(d) => handleScan(d)}
              rescanning={rescanning}
            />
          ) : (
            <Flex flex="1" align="center" justify="center" h="200px" borderRadius="14px"
              bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
              <Text fontSize="13px" color="var(--dash-text-muted)">
                Select a scan from the list to view results.
              </Text>
            </Flex>
          )}
        </Flex>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirm
          domain={deleteTarget.domain}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </Box>
  );
};

export default LeakIXView;
