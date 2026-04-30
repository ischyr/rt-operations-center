import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select, Textarea,
  Spinner, Tooltip, useToast, Checkbox,
  Modal, ModalOverlay, ModalContent, ModalBody, ModalHeader, ModalFooter, ModalCloseButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, CheckIcon, CopyIcon, RepeatIcon, SearchIcon,
  WarningTwoIcon, EditIcon, ChevronDownIcon, ChevronUpIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Theme — sky blue accent ────────────────────────────────────────────────────
const ACCENT  = '#0EA5E9';
const A_S     = 'rgba(14,165,233,0.07)';
const A_B     = 'rgba(14,165,233,0.30)';
const GREEN   = '#68D391';
const RED     = '#FC8181';
const ORANGE  = '#F6AD55';
const BLUE    = '#63B3ED';
const VIOLET  = '#B794F4';
const GOLD    = '#ECC94B';
const TEAL    = '#4FD1C5';
const MUTED   = 'var(--dash-text-muted)';
const CARD_BG = 'var(--dash-card-bg)';
const CARD_BD = 'var(--dash-card-border)';

const RISK_META = {
  critical: { color: RED,    label: 'Critical' },
  high:     { color: ORANGE, label: 'High'     },
  medium:   { color: BLUE,   label: 'Medium'   },
  low:      { color: MUTED,  label: 'Low'      },
};

const STATUS_META = {
  open:     { color: GREEN,  label: 'OPEN'     },
  filtered: { color: GOLD,   label: 'FILTERED' },
  closed:   { color: MUTED,  label: 'CLOSED'   },
  unknown:  { color: MUTED,  label: 'UNKNOWN'  },
};

const PROTO_OPTS = ['tcp', 'udp', 'icmp', 'unknown'];

const tok = () => localStorage.getItem('token') || '';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtRelative = (d) => {
  if (!d) return '';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const hashHue = (str = '') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
};

// ── Copy button ────────────────────────────────────────────────────────────────
const CopyBtn = ({ text, size = 'xs', label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e?.stopPropagation?.();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <Tooltip label={copied ? 'Copied!' : label} hasArrow fontSize="10px">
      <IconButton icon={copied ? <CheckIcon /> : <CopyIcon />} size={size}
        variant="ghost" color={copied ? GREEN : MUTED} _hover={{ color: 'white' }}
        onClick={copy} aria-label="copy" />
    </Tooltip>
  );
};

// ── Service detail / edit modal ───────────────────────────────────────────────
const ServiceModal = ({ isOpen, onClose, service, engId, onUpdate, onDelete }) => {
  const toast = useToast();
  const [host,    setHost]    = useState('');
  const [ip,      setIp]      = useState('');
  const [port,    setPort]    = useState('');
  const [proto,   setProto]   = useState('tcp');
  const [svc,     setSvc]     = useState('');
  const [version, setVersion] = useState('');
  const [banner,  setBanner]  = useState('');
  const [status,  setStatus]  = useState('open');
  const [risk,    setRisk]    = useState('low');
  const [tags,    setTags]    = useState('');
  const [cves,    setCves]    = useState('');
  const [notes,   setNotes]   = useState('');
  const [attempted, setAttempted] = useState(false);
  const [exploited, setExploited] = useState(false);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (!isOpen || !service) return;
    setHost(service.host || '');
    setIp(service.ip || '');
    setPort(String(service.port || ''));
    setProto(service.protocol || 'tcp');
    setSvc(service.service || '');
    setVersion(service.version || '');
    setBanner(service.banner || '');
    setStatus(service.status || 'open');
    setRisk(service.riskLevel || 'low');
    setTags((service.tags || []).join(', '));
    setCves((service.cves || []).join(', '));
    setNotes(service.notes || '');
    setAttempted(!!service.attempted);
    setExploited(!!service.exploited);
  }, [isOpen, service]);

  if (!service) return null;

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/service-catalog/${engId}/services/${service._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host, ip, port: parseInt(port, 10), protocol: proto,
          service: svc, version, banner, status, riskLevel: risk,
          tags, cves, notes, attempted, exploited,
        }),
      });
      if (!r.ok) throw new Error('Failed');
      onUpdate(await r.json());
      toast({ title: 'Saved', status: 'success', duration: 1500, isClosable: true });
      onClose();
    } catch (e) {
      toast({ title: 'Save failed', status: 'error', duration: 2000, isClosable: true });
    } finally { setSaving(false); }
  };

  const riskMeta   = RISK_META[risk] || RISK_META.low;
  const statusMeta = STATUS_META[status] || STATUS_META.open;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(8px)" bg="rgba(0,0,0,0.55)" />
      <ModalContent bg={CARD_BG} border={`1px solid ${CARD_BD}`} borderRadius="14px" maxH="85vh">
        <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
          style={{ background: `linear-gradient(to right, transparent, ${ACCENT}90, transparent)` }} />

        <ModalHeader pb={2} pr={10}>
          <Flex align="center" gap={2} mb={1}>
            <Box px="6px" py="2px" borderRadius="4px"
              bg={`${statusMeta.color}14`} border={`1px solid ${statusMeta.color}30`}>
              <Text fontSize="9px" fontWeight="black" color={statusMeta.color}>
                {statusMeta.label}
              </Text>
            </Box>
            <Box px="6px" py="2px" borderRadius="4px"
              bg={`${riskMeta.color}14`} border={`1px solid ${riskMeta.color}30`}>
              <Text fontSize="9px" fontWeight="black" color={riskMeta.color}
                textTransform="uppercase">{riskMeta.label}</Text>
            </Box>
            {attempted && (
              <Box px="6px" py="2px" borderRadius="4px"
                bg={`${ACCENT}14`} border={`1px solid ${A_B}`}>
                <Text fontSize="9px" fontWeight="black" color={ACCENT}
                  textTransform="uppercase">Attempted</Text>
              </Box>
            )}
            {exploited && (
              <Box px="6px" py="2px" borderRadius="4px"
                bg={`${GREEN}14`} border={`1px solid ${GREEN}30`}>
                <Text fontSize="9px" fontWeight="black" color={GREEN}
                  textTransform="uppercase">Exploited</Text>
              </Box>
            )}
          </Flex>
          <Text fontSize="16px" fontFamily="mono" color="var(--dash-text-primary)">
            {host}:{port} <Text as="span" color={MUTED} fontSize="13px">({proto})</Text>
          </Text>
          {svc && (
            <Text fontSize="12px" color={ACCENT} fontFamily="mono" mt={1}>
              {svc}{version ? ` · ${version}` : ''}
            </Text>
          )}
        </ModalHeader>
        <ModalCloseButton color={MUTED} />

        <ModalBody>
          {/* Host / Port / Proto */}
          <Flex gap={3} mb={3} flexWrap="wrap">
            <Box flex={2} minW="200px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                textTransform="uppercase" letterSpacing="wider">Host *</Text>
              <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-primary)"
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                value={host} onChange={e => setHost(e.target.value)} />
            </Box>
            <Box flex={1} minW="120px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                textTransform="uppercase" letterSpacing="wider">IP</Text>
              <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-primary)"
                _placeholder={{ color: MUTED }}
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                value={ip} onChange={e => setIp(e.target.value)} placeholder="—" />
            </Box>
            <Box w="80px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                textTransform="uppercase" letterSpacing="wider">Port *</Text>
              <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-primary)"
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                value={port} onChange={e => setPort(e.target.value)} type="number" />
            </Box>
            <Box w="100px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                textTransform="uppercase" letterSpacing="wider">Protocol</Text>
              <Select h="36px" fontSize="sm" borderRadius="8px"
                bg="rgba(255,255,255,0.03)" borderColor={CARD_BD}
                color="var(--dash-text-primary)" focusBorderColor={A_B}
                sx={{ '& option': { background: '#14181f' } }}
                value={proto} onChange={e => setProto(e.target.value)}>
                {PROTO_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Box>
          </Flex>

          {/* Service / Version / Banner */}
          <Flex gap={3} mb={3} flexWrap="wrap">
            <Box flex={1} minW="160px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                textTransform="uppercase" letterSpacing="wider">Service</Text>
              <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-primary)"
                _placeholder={{ color: MUTED }}
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                placeholder="ssh / smb / http / mssql"
                value={svc} onChange={e => setSvc(e.target.value)} />
            </Box>
            <Box flex={2} minW="200px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                textTransform="uppercase" letterSpacing="wider">Version</Text>
              <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-primary)"
                _placeholder={{ color: MUTED }}
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                placeholder="OpenSSH 8.2p1 Ubuntu 4ubuntu0.5"
                value={version} onChange={e => setVersion(e.target.value)} />
            </Box>
          </Flex>

          <Box mb={3}>
            <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
              textTransform="uppercase" letterSpacing="wider">Banner / Raw</Text>
            <Textarea fontSize="11px" fontFamily="mono" borderRadius="8px" minH="70px"
              bg="rgba(6,8,12,0.4)" border={`1px solid ${CARD_BD}`}
              color="#a8d8c8"
              _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
              value={banner} onChange={e => setBanner(e.target.value)} resize="vertical" />
          </Box>

          {/* Status / Risk */}
          <Flex gap={3} mb={3} flexWrap="wrap">
            <Box flex={1} minW="200px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1.5}
                textTransform="uppercase" letterSpacing="wider">Status</Text>
              <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="8px"
                border={`1px solid ${CARD_BD}`} p="3px">
                {Object.entries(STATUS_META).map(([k, m]) => {
                  const act = status === k;
                  return (
                    <Button key={k} flex={1} size="xs" h="28px" borderRadius="6px"
                      fontSize="9px" fontWeight="bold"
                      bg={act ? `${m.color}18` : 'transparent'}
                      color={act ? m.color : MUTED}
                      border={act ? `1px solid ${m.color}40` : '1px solid transparent'}
                      _hover={{ color: m.color }}
                      onClick={() => setStatus(k)}>
                      {m.label}
                    </Button>
                  );
                })}
              </Flex>
            </Box>
            <Box flex={1} minW="200px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1.5}
                textTransform="uppercase" letterSpacing="wider">Risk</Text>
              <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="8px"
                border={`1px solid ${CARD_BD}`} p="3px">
                {['low', 'medium', 'high', 'critical'].map(k => {
                  const m = RISK_META[k];
                  const act = risk === k;
                  return (
                    <Button key={k} flex={1} size="xs" h="28px" borderRadius="6px"
                      fontSize="10px" fontWeight="bold"
                      bg={act ? `${m.color}18` : 'transparent'}
                      color={act ? m.color : MUTED}
                      border={act ? `1px solid ${m.color}40` : '1px solid transparent'}
                      _hover={{ color: m.color }}
                      onClick={() => setRisk(k)}>
                      {m.label}
                    </Button>
                  );
                })}
              </Flex>
            </Box>
          </Flex>

          {/* Attempted / Exploited */}
          <Flex gap={4} mb={3}>
            <Checkbox isChecked={attempted} onChange={e => setAttempted(e.target.checked)}
              colorScheme="blue" size="sm">
              <Text fontSize="11px" color="var(--dash-text-secondary)">Attempted</Text>
            </Checkbox>
            <Checkbox isChecked={exploited} onChange={e => setExploited(e.target.checked)}
              colorScheme="green" size="sm">
              <Text fontSize="11px" color="var(--dash-text-secondary)">Exploited</Text>
            </Checkbox>
          </Flex>

          {/* Tags / CVEs */}
          <Flex gap={3} mb={3} flexWrap="wrap">
            <Box flex={1} minW="200px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                textTransform="uppercase" letterSpacing="wider">Tags (comma)</Text>
              <Input h="36px" fontSize="sm" borderRadius="8px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-primary)"
                _placeholder={{ color: MUTED, fontSize: '12px' }}
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                placeholder="dc, ad, low-hanging"
                value={tags} onChange={e => setTags(e.target.value)} />
            </Box>
            <Box flex={1} minW="200px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                textTransform="uppercase" letterSpacing="wider">CVEs (comma)</Text>
              <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-primary)"
                _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '12px' }}
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                placeholder="CVE-2021-1234"
                value={cves} onChange={e => setCves(e.target.value)} />
            </Box>
          </Flex>

          <Box mb={3}>
            <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
              textTransform="uppercase" letterSpacing="wider">Notes</Text>
            <Textarea fontSize="12px" borderRadius="8px" minH="80px"
              bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
              color="var(--dash-text-primary)"
              _placeholder={{ color: MUTED }}
              _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
              placeholder="What we tried, what worked, follow-ups…"
              value={notes} onChange={e => setNotes(e.target.value)}
              resize="vertical" />
          </Box>

          {/* Metadata */}
          <Flex gap={3} fontSize="10px" color={MUTED} flexWrap="wrap">
            {service.createdByOperatorName && (
              <Text>Added by <Text as="span" color="var(--dash-text-secondary)">
                {service.createdByOperatorName}
              </Text> {fmtRelative(service.createdAt)}</Text>
            )}
            {service.attemptedByOperatorName && (
              <Text>· Attempted by <Text as="span" color={ACCENT}>
                {service.attemptedByOperatorName}
              </Text> {fmtRelative(service.attemptedAt)}</Text>
            )}
            {service.source && <Text>· source: {service.source}</Text>}
          </Flex>
        </ModalBody>

        <ModalFooter gap={2}>
          <Button size="sm" variant="ghost" color={MUTED}
            _hover={{ color: RED, bg: 'rgba(252,129,129,0.1)' }}
            leftIcon={<DeleteIcon />} onClick={() => onDelete(service._id)}>
            Delete
          </Button>
          <Box flex={1} />
          <Button size="sm" variant="ghost" color={MUTED}
            _hover={{ color: 'white' }} onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" fontWeight="semibold" fontSize="12px"
            bg={`${ACCENT}15`} border={`1px solid ${A_B}`} color={ACCENT}
            _hover={{ bg: `${ACCENT}25` }}
            leftIcon={saving ? <Spinner size="xs" /> : <CheckIcon boxSize={3} />}
            onClick={save} isDisabled={saving}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ── Confirm delete ────────────────────────────────────────────────────────────
const ConfirmDelete = ({ target, onClose, onConfirm }) => (
  <Modal isOpen={!!target} onClose={onClose} size="sm" isCentered>
    <ModalOverlay backdropFilter="blur(8px)" bg="rgba(0,0,0,0.6)" />
    <ModalContent bg={CARD_BG} border={`1px solid ${CARD_BD}`} borderRadius="14px">
      <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
        style={{ background: `linear-gradient(to right, transparent, ${RED}90, transparent)` }} />
      <ModalBody py={6}>
        <Flex direction="column" align="center" gap={4}>
          <Box w="48px" h="48px" borderRadius="full"
            bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.28)"
            display="flex" alignItems="center" justifyContent="center">
            <WarningTwoIcon boxSize={5} color={RED} />
          </Box>
          <Box textAlign="center">
            <Text fontSize="15px" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
              Remove this service?
            </Text>
            {target && (
              <Text fontSize="11px" fontFamily="mono" color={MUTED}>
                {target.host}:{target.port} ({target.protocol})
              </Text>
            )}
          </Box>
        </Flex>
      </ModalBody>
      <ModalFooter gap={2} pt={0}>
        <Button flex={1} size="sm" h="36px" borderRadius="8px" fontWeight="semibold" fontSize="12px"
          bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}
          color="var(--dash-text-secondary)" onClick={onClose}>Cancel</Button>
        <Button flex={1} size="sm" h="36px" borderRadius="8px" fontWeight="semibold" fontSize="12px"
          bg="rgba(252,129,129,0.14)" border={`1px solid ${RED}50`}
          color={RED} _hover={{ bg: 'rgba(252,129,129,0.24)' }}
          leftIcon={<DeleteIcon boxSize={2.5} />} onClick={onConfirm}>Remove</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

// ── Main View ─────────────────────────────────────────────────────────────────
const ServiceCatalogView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const [items,   setItems]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('all');     // all|attempted|unattempted|critical|open
  const [query,  setQuery]  = useState('');
  const [hostFilter,    setHostFilter]    = useState(null);
  const [serviceFilter, setServiceFilter] = useState(null);

  // Add form state — single mode
  const [addMode, setAddMode] = useState('single');   // single | bulk
  const [singleHost,  setSingleHost]  = useState('');
  const [singlePort,  setSinglePort]  = useState('');
  const [singleProto, setSingleProto] = useState('tcp');
  const [singleSvc,   setSingleSvc]   = useState('');
  const [singleVer,   setSingleVer]   = useState('');
  const [singleNotes, setSingleNotes] = useState('');

  // Bulk paste
  const [bulkText,    setBulkText]    = useState('');
  const [bulkHost,    setBulkHost]    = useState('');
  const [bulkSubmit,  setBulkSubmit]  = useState(false);

  // Modals
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Sort
  const [sortKey,  setSortKey]  = useState('host');
  const [sortDesc, setSortDesc] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    if (!engId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/service-catalog/${engId}/services`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (r.ok) setItems(await r.json());
    } catch (_) {} finally { setLoading(false); }
  }, [engId]);

  const fetchStats = useCallback(async () => {
    if (!engId) return;
    try {
      const r = await fetch(`/api/service-catalog/${engId}/stats`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (r.ok) setStats(await r.json());
    } catch (_) {}
  }, [engId]);

  useEffect(() => { fetchItems(); fetchStats(); }, [fetchItems, fetchStats]);

  // ── Filtered + sorted view ──────────────────────────────────────────────────
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = items.filter(s => {
      if (filter === 'attempted'   && !s.attempted) return false;
      if (filter === 'unattempted' &&  s.attempted) return false;
      if (filter === 'critical' && s.riskLevel !== 'critical' && s.riskLevel !== 'high') return false;
      if (filter === 'open' && s.status !== 'open') return false;
      if (hostFilter    && s.host    !== hostFilter)    return false;
      if (serviceFilter && s.service !== serviceFilter) return false;
      if (q) {
        const hay = `${s.host} ${s.service} ${s.version} ${s.banner} ${s.notes} ${(s.tags||[]).join(' ')} ${s.port}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    arr = [...arr].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (va === vb) return 0;
      if (typeof va === 'number' || typeof vb === 'number') {
        return ((+va || 0) - (+vb || 0)) * (sortDesc ? -1 : 1);
      }
      return (String(va || '').localeCompare(String(vb || ''))) * (sortDesc ? -1 : 1);
    });
    return arr;
  }, [items, query, filter, hostFilter, serviceFilter, sortKey, sortDesc]);

  // ── Add single ──────────────────────────────────────────────────────────────
  const submitSingle = async () => {
    if (!singleHost.trim() || !singlePort.trim()) {
      toast({ title: 'Host and port required', status: 'warning',
        duration: 2000, isClosable: true });
      return;
    }
    try {
      const r = await fetch(`/api/service-catalog/${engId}/services`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: singleHost, port: parseInt(singlePort, 10),
          protocol: singleProto, service: singleSvc, version: singleVer,
          notes: singleNotes,
        }),
      });
      if (!r.ok) throw new Error('Failed');
      const created = await r.json();
      setItems(p => {
        const idx = p.findIndex(x => x._id === created._id);
        return idx >= 0 ? p.map(x => x._id === created._id ? created : x) : [created, ...p];
      });
      fetchStats();
      setSingleHost(''); setSinglePort(''); setSingleSvc('');
      setSingleVer(''); setSingleNotes('');
      toast({ title: 'Service added', status: 'success', duration: 1500, isClosable: true });
    } catch (e) {
      toast({ title: 'Add failed', status: 'error', duration: 2000, isClosable: true });
    }
  };

  // ── Bulk paste ──────────────────────────────────────────────────────────────
  const submitBulk = async () => {
    if (!bulkText.trim()) {
      toast({ title: 'Paste some output', status: 'warning',
        duration: 2000, isClosable: true });
      return;
    }
    setBulkSubmit(true);
    try {
      const r = await fetch(`/api/service-catalog/${engId}/services/bulk`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bulkText, defaultHost: bulkHost, source: 'bulk-paste' }),
      });
      if (!r.ok) throw new Error('Failed');
      const data = await r.json();
      fetchItems(); fetchStats();
      setBulkText(''); setBulkHost('');
      toast({
        title: 'Imported',
        description: `${data.imported} new · ${data.updated || 0} updated · ${data.skipped} skipped`,
        status: 'success', duration: 3500, isClosable: true,
      });
    } catch (_) {
      toast({ title: 'Import failed', status: 'error', duration: 2000, isClosable: true });
    } finally { setBulkSubmit(false); }
  };

  // ── Quick toggle attempted ──────────────────────────────────────────────────
  const toggleAttempted = async (s, e) => {
    e?.stopPropagation?.();
    try {
      const r = await fetch(`/api/service-catalog/${engId}/services/${s._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempted: !s.attempted }),
      });
      if (!r.ok) throw new Error('Failed');
      const upd = await r.json();
      setItems(p => p.map(x => x._id === s._id ? upd : x));
      fetchStats();
    } catch (_) {}
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteService = async (id) => {
    try {
      await fetch(`/api/service-catalog/${engId}/services/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      setItems(p => p.filter(x => x._id !== id));
      setSelected(null); setDeleting(null);
      fetchStats();
      toast({ title: 'Removed', status: 'success', duration: 1500, isClosable: true });
    } catch (_) {
      toast({ title: 'Delete failed', status: 'error', duration: 2000, isClosable: true });
    }
  };

  // ── Sort toggle ─────────────────────────────────────────────────────────────
  const setSort = (key) => {
    if (sortKey === key) setSortDesc(d => !d);
    else { setSortKey(key); setSortDesc(false); }
  };

  // ── Filter counts for pills ─────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:         items.length,
    attempted:   items.filter(s => s.attempted).length,
    unattempted: items.filter(s => !s.attempted).length,
    critical:    items.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high').length,
    open:        items.filter(s => s.status === 'open').length,
  }), [items]);

  // ── Sort caret ──────────────────────────────────────────────────────────────
  const Caret = ({ k }) => sortKey !== k ? null
    : sortDesc ? <ChevronDownIcon boxSize={2.5} ml={1} color={ACCENT} />
               : <ChevronUpIcon   boxSize={2.5} ml={1} color={ACCENT} />;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box mb={5}>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
          Service <Text as="span" color="red.400">Catalog</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          {eng?.name} · every discovered service in one place · paste nmap / masscan output to import
        </Text>
      </Box>

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px" bg={A_S} border={`1px solid ${A_B}`}>
        <Flex align="center" gap={2} mb={1.5}>
          <SearchIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            Engagement-Wide Service Inventory
          </Text>
        </Flex>
        <Flex gap={5} flexWrap="wrap">
          {[
            'Add services manually or paste nmap / masscan output for bulk import',
            'Auto-detect service from common port + auto-rate risk by service type',
            'Mark each service attempted/exploited with operator attribution',
            'Tag, annotate, and link CVEs — feeds Findings + Attack Relay context',
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

        {/* ── Left ──────────────────────────────────────────────────────── */}
        <Flex direction="column" flex="1" gap={4} pr={6} minW={0}>

          {/* ── Add card ─────────────────────────────────────────────────── */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />
            <Flex align="center" justify="space-between" px={5} py={3}
              borderBottom={`1px solid ${CARD_BD}`}>
              <Flex align="center" gap={2}>
                <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">Add Services</Text>
              </Flex>
              <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="7px"
                border={`1px solid ${CARD_BD}`} p="3px">
                {['single', 'bulk'].map(m => {
                  const act = addMode === m;
                  return (
                    <Button key={m} size="xs" h="22px" px={3} borderRadius="5px"
                      fontSize="10px" fontWeight="bold"
                      bg={act ? A_S : 'transparent'}
                      color={act ? ACCENT : MUTED}
                      border={act ? `1px solid ${A_B}` : '1px solid transparent'}
                      _hover={{ color: ACCENT }}
                      onClick={() => setAddMode(m)}>
                      {m === 'single' ? 'Single' : 'Bulk Paste'}
                    </Button>
                  );
                })}
              </Flex>
            </Flex>

            <Box px={5} py={4}>
              {addMode === 'single' ? (
                <>
                  <Flex gap={2} mb={3} flexWrap="wrap">
                    <Box flex={2} minW="180px">
                      <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                        textTransform="uppercase" letterSpacing="wider">Host *</Text>
                      <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                        bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                        color="var(--dash-text-primary)"
                        _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '12px' }}
                        _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                        placeholder="dc01.corp.local · 10.0.0.5"
                        value={singleHost} onChange={e => setSingleHost(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitSingle()} />
                    </Box>
                    <Box w="80px">
                      <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                        textTransform="uppercase" letterSpacing="wider">Port *</Text>
                      <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                        bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                        color="var(--dash-text-primary)"
                        _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                        type="number" placeholder="445"
                        _placeholder={{ color: MUTED }}
                        value={singlePort} onChange={e => setSinglePort(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitSingle()} />
                    </Box>
                    <Box w="90px">
                      <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                        textTransform="uppercase" letterSpacing="wider">Proto</Text>
                      <Select h="36px" fontSize="sm" borderRadius="8px"
                        bg="rgba(255,255,255,0.03)" borderColor={CARD_BD}
                        color="var(--dash-text-primary)" focusBorderColor={A_B}
                        sx={{ '& option': { background: '#14181f' } }}
                        value={singleProto} onChange={e => setSingleProto(e.target.value)}>
                        {PROTO_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </Select>
                    </Box>
                    <Box flex={1} minW="120px">
                      <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                        textTransform="uppercase" letterSpacing="wider">Service</Text>
                      <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                        bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                        color="var(--dash-text-primary)"
                        _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '12px' }}
                        _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                        placeholder="auto"
                        value={singleSvc} onChange={e => setSingleSvc(e.target.value)} />
                    </Box>
                    <Box flex={1} minW="160px">
                      <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                        textTransform="uppercase" letterSpacing="wider">Version</Text>
                      <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                        bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                        color="var(--dash-text-primary)"
                        _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '12px' }}
                        _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                        placeholder="OpenSSH 8.2p1"
                        value={singleVer} onChange={e => setSingleVer(e.target.value)} />
                    </Box>
                  </Flex>

                  <Flex align="center" gap={2}>
                    <Input flex={1} h="36px" fontSize="sm" borderRadius="8px"
                      bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                      color="var(--dash-text-primary)"
                      _placeholder={{ color: MUTED, fontSize: '12px' }}
                      _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                      placeholder="Notes (optional)"
                      value={singleNotes} onChange={e => setSingleNotes(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitSingle()} />
                    <Button size="sm" h="36px" px={5} borderRadius="8px" fontWeight="semibold" fontSize="12px"
                      bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
                      color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                      leftIcon={<AddIcon boxSize={2.5} />}
                      onClick={submitSingle}>
                      Add
                    </Button>
                  </Flex>
                </>
              ) : (
                <>
                  <Flex gap={3} mb={2} flexWrap="wrap">
                    <Box flex={1} minW="200px">
                      <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                        textTransform="uppercase" letterSpacing="wider">
                        Default Host <Text as="span" color={MUTED} textTransform="none" fontWeight="normal">
                          · used when paste lacks a host
                        </Text>
                      </Text>
                      <Input h="34px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                        bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                        color="var(--dash-text-primary)"
                        _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '12px' }}
                        _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                        placeholder="optional · e.g. 10.0.0.5"
                        value={bulkHost} onChange={e => setBulkHost(e.target.value)} />
                    </Box>
                  </Flex>
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">
                    Paste Output · supports nmap · masscan · host:port · CSV
                  </Text>
                  <Textarea fontSize="11px" fontFamily="mono" borderRadius="8px" minH="160px"
                    bg="rgba(6,8,12,0.6)" border={`1px solid ${CARD_BD}`}
                    color="#a8d8c8"
                    _placeholder={{ color: MUTED, fontFamily: 'sans-serif' }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder={'22/tcp   open  ssh     OpenSSH 8.2p1\n80/tcp   open  http    nginx 1.18.0\nDiscovered open port 445/tcp on 10.0.0.5'}
                    value={bulkText} onChange={e => setBulkText(e.target.value)}
                    resize="vertical" />
                  <Flex justify="flex-end" mt={3}>
                    <Button size="sm" h="36px" px={5} borderRadius="8px" fontWeight="semibold" fontSize="12px"
                      bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
                      color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                      leftIcon={bulkSubmit ? <Spinner size="xs" /> : <AddIcon boxSize={2.5} />}
                      onClick={submitBulk} isDisabled={bulkSubmit}>
                      Import
                    </Button>
                  </Flex>
                </>
              )}
            </Box>
          </Box>

          {/* ── Stats strip ─────────────────────────────────────────────── */}
          <Flex gap={3}>
            {[
              { label: 'Services',     value: stats?.total          ?? items.length, color: ACCENT },
              { label: 'Hosts',        value: stats?.uniqueHosts    ?? 0,            color: BLUE   },
              { label: 'Attempted',    value: stats?.attempted      ?? 0,            color: TEAL   },
              { label: 'High / Crit',  value: (stats?.high ?? 0) + (stats?.critical ?? 0),
                color: (stats?.critical ?? 0) ? RED : ORANGE },
            ].map(({ label, value, color }, i) => (
              <MotionBox key={label} flex="1"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                px={4} py={3} borderRadius="12px" bg={CARD_BG}
                border={`1px solid ${CARD_BD}`} pos="relative" overflow="hidden">
                <Box pos="absolute" top={0} left={0} right={0} h="2px"
                  style={{ background: `linear-gradient(to right, transparent, ${color}70, transparent)` }} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
                <Text fontSize="22px" fontWeight="black" color={color} lineHeight={1}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </Text>
              </MotionBox>
            ))}
          </Flex>

          {/* ── Search + filter bar ─────────────────────────────────────── */}
          <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
            <Flex flex={1} minW="280px" align="center" gap={2} h="34px" px={3}
              borderRadius="8px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
              _focusWithin={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}` }}>
              <SearchIcon boxSize={3} color={MUTED} />
              <Input variant="unstyled" fontSize="12px"
                placeholder="Search host, port, service, version, banner, tags, notes…"
                _placeholder={{ color: MUTED }}
                color="var(--dash-text-primary)"
                value={query} onChange={e => setQuery(e.target.value)} />
              {query && (
                <IconButton size="xs" variant="ghost" icon={<DeleteIcon boxSize={2.5} />}
                  color={MUTED} _hover={{ color: RED }}
                  onClick={() => setQuery('')} aria-label="clear" />
              )}
            </Flex>
            <Flex gap={1.5} flexWrap="wrap">
              {[
                { k: 'all',         label: 'All',          color: ACCENT },
                { k: 'open',        label: 'Open',         color: GREEN  },
                { k: 'attempted',   label: 'Attempted',    color: TEAL   },
                { k: 'unattempted', label: 'Unattempted',  color: GOLD   },
                { k: 'critical',    label: 'High / Crit',  color: RED    },
              ].map(({ k, label, color }) => {
                const act = filter === k;
                const c = counts[k] || 0;
                return (
                  <Button key={k} size="xs" h="26px" px={3} borderRadius="7px"
                    fontSize="10px" fontWeight="bold"
                    bg={act ? `${color}18` : 'transparent'}
                    color={act ? color : MUTED}
                    border={act ? `1px solid ${color}40` : `1px solid ${CARD_BD}`}
                    _hover={{ color, bg: `${color}10` }}
                    onClick={() => setFilter(k)}>
                    {label}
                    <Box as="span" ml={1.5} opacity={0.7}>{c}</Box>
                  </Button>
                );
              })}
            </Flex>
            <Tooltip label="Refresh" hasArrow fontSize="10px">
              <IconButton size="xs" h="26px" w="26px" borderRadius="7px" variant="ghost"
                icon={<RepeatIcon />} color={MUTED} _hover={{ color: ACCENT }}
                onClick={() => { fetchItems(); fetchStats(); }} aria-label="refresh" />
            </Tooltip>
          </Flex>

          {(hostFilter || serviceFilter) && (
            <Flex align="center" gap={2} px={3} py={2} borderRadius="8px"
              bg={A_S} border={`1px solid ${A_B}`}>
              <Text fontSize="10px" color={MUTED}>Filtered by:</Text>
              {hostFilter && (
                <Box px="6px" py="1px" borderRadius="4px" bg={`${ACCENT}14`}
                  border={`1px solid ${A_B}`}>
                  <Text fontSize="10px" fontFamily="mono" color={ACCENT}>{hostFilter}</Text>
                </Box>
              )}
              {serviceFilter && (
                <Box px="6px" py="1px" borderRadius="4px" bg={`${VIOLET}14`}
                  border={`1px solid ${VIOLET}30`}>
                  <Text fontSize="10px" fontFamily="mono" color={VIOLET}>{serviceFilter}</Text>
                </Box>
              )}
              <Box flex={1} />
              <Button size="xs" variant="ghost" color={MUTED}
                onClick={() => { setHostFilter(null); setServiceFilter(null); }}
                _hover={{ color: 'white' }}>
                Clear
              </Button>
            </Flex>
          )}

          {/* ── Service list ────────────────────────────────────────────── */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />

            {/* Column headers */}
            <Flex align="center" gap={3} px={5} py="9px"
              bg="rgba(255,255,255,0.015)"
              borderBottom={`1px solid ${CARD_BD}`}>
              <Text flex="0 0 64px" fontSize="9px" fontWeight="bold" color={MUTED}
                textTransform="uppercase" letterSpacing="wider">Status</Text>
              <Flex flex="0 0 220px" align="center" cursor="pointer"
                onClick={() => setSort('host')}
                _hover={{ color: ACCENT }}>
                <Text fontSize="9px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">Host</Text>
                <Caret k="host" />
              </Flex>
              <Flex flex="0 0 70px" align="center" cursor="pointer"
                onClick={() => setSort('port')}
                _hover={{ color: ACCENT }}>
                <Text fontSize="9px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">Port</Text>
                <Caret k="port" />
              </Flex>
              <Flex flex="0 0 130px" align="center" cursor="pointer"
                onClick={() => setSort('service')}
                _hover={{ color: ACCENT }}>
                <Text fontSize="9px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">Service</Text>
                <Caret k="service" />
              </Flex>
              <Text flex={1} fontSize="9px" fontWeight="bold" color={MUTED}
                textTransform="uppercase" letterSpacing="wider">Version / Banner</Text>
              <Text flex="0 0 80px" fontSize="9px" fontWeight="bold" color={MUTED}
                textTransform="uppercase" letterSpacing="wider" textAlign="center">Risk</Text>
              <Text flex="0 0 100px" fontSize="9px" fontWeight="bold" color={MUTED}
                textTransform="uppercase" letterSpacing="wider" textAlign="center">Attempted</Text>
              <Box flex="0 0 28px" />
            </Flex>

            {loading && items.length === 0 ? (
              <Flex align="center" justify="center" py={12}>
                <Spinner color={ACCENT} size="md" thickness="2px" />
              </Flex>
            ) : visible.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={14} gap={3} opacity={0.45}>
                <Box as="svg" viewBox="0 0 24 24" w="40px" h="40px" fill="none"
                  stroke={MUTED} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2"/>
                  <rect x="2" y="14" width="20" height="8" rx="2"/>
                  <line x1="6" y1="6" x2="6.01" y2="6"/>
                  <line x1="6" y1="18" x2="6.01" y2="18"/>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
                    {items.length === 0 ? 'No services catalogued yet' : 'Nothing matches the current filters'}
                  </Text>
                  {items.length === 0 && (
                    <Text fontSize="11px" color={MUTED} mt={1}>
                      Add a service above or paste nmap / masscan output to bulk-import
                    </Text>
                  )}
                </Box>
              </Flex>
            ) : (
              <AnimatePresence>
                {visible.map((s, i) => {
                  const risk   = RISK_META[s.riskLevel] || RISK_META.low;
                  const status = STATUS_META[s.status]  || STATUS_META.open;
                  return (
                    <MotionBox key={s._id}
                      layout
                      initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.14, delay: Math.min(i * 0.012, 0.25) }}>
                      <Flex align="center" gap={3} px={5} py="11px"
                        borderBottom={`1px solid ${CARD_BD}`}
                        cursor="pointer"
                        _hover={{ bg: 'rgba(255,255,255,0.025)' }}
                        onClick={() => setSelected(s)}>

                        {/* Status */}
                        <Box flex="0 0 64px">
                          <Box px="6px" py="2px" borderRadius="4px" display="inline-block"
                            bg={`${status.color}14`} border={`1px solid ${status.color}30`}>
                            <Flex align="center" gap={1}>
                              <Box w="5px" h="5px" borderRadius="full" bg={status.color}
                                boxShadow={s.status === 'open' ? `0 0 5px ${status.color}` : 'none'} />
                              <Text fontSize="9px" fontWeight="black" color={status.color}>
                                {status.label}
                              </Text>
                            </Flex>
                          </Box>
                        </Box>

                        {/* Host */}
                        <Box flex="0 0 220px" minW={0}>
                          <Flex align="center" gap={1}>
                            <Text fontSize="11px" fontWeight="semibold"
                              color="var(--dash-text-primary)" fontFamily="mono"
                              noOfLines={1}>
                              {s.host}
                            </Text>
                            {s.host && (
                              <IconButton icon={<SearchIcon boxSize={2} />} size="xs"
                                variant="ghost" color={MUTED} _hover={{ color: ACCENT }}
                                onClick={(e) => { e.stopPropagation(); setHostFilter(s.host); }}
                                aria-label="filter host" />
                            )}
                          </Flex>
                        </Box>

                        {/* Port */}
                        <Box flex="0 0 70px">
                          <Text fontSize="11px" fontFamily="mono" color={ACCENT}>
                            {s.port}<Text as="span" color={MUTED} fontSize="9px">/{s.protocol}</Text>
                          </Text>
                        </Box>

                        {/* Service */}
                        <Box flex="0 0 130px" minW={0}>
                          {s.service ? (
                            <Flex align="center" gap={1}>
                              <Box px="5px" py="1px" borderRadius="3px"
                                bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}>
                                <Text fontSize="10px" fontFamily="mono"
                                  color={`hsl(${hashHue(s.service)}, 65%, 70%)`} noOfLines={1}>
                                  {s.service}
                                </Text>
                              </Box>
                              <IconButton icon={<SearchIcon boxSize={2} />} size="xs"
                                variant="ghost" color={MUTED} _hover={{ color: ACCENT }}
                                onClick={(e) => { e.stopPropagation(); setServiceFilter(s.service); }}
                                aria-label="filter service" />
                            </Flex>
                          ) : (
                            <Text fontSize="10px" color={MUTED} fontStyle="italic">—</Text>
                          )}
                        </Box>

                        {/* Version / Banner */}
                        <Box flex={1} minW={0}>
                          <Text fontSize="11px" color="var(--dash-text-secondary)"
                            fontFamily="mono" noOfLines={1}>
                            {s.version || s.banner || (
                              <Text as="span" color={MUTED} fontStyle="italic">—</Text>
                            )}
                          </Text>
                          {s.tags?.length > 0 && (
                            <Flex gap={1} mt={0.5}>
                              {s.tags.slice(0, 3).map(t => (
                                <Box key={t} px="4px" py="0px" borderRadius="3px"
                                  fontSize="9px"
                                  bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}
                                  color={MUTED}>
                                  #{t}
                                </Box>
                              ))}
                              {s.tags.length > 3 && (
                                <Text fontSize="9px" color={MUTED}>+{s.tags.length - 3}</Text>
                              )}
                            </Flex>
                          )}
                        </Box>

                        {/* Risk */}
                        <Box flex="0 0 80px" textAlign="center">
                          <Box px="6px" py="2px" borderRadius="4px" display="inline-block"
                            bg={`${risk.color}12`} border={`1px solid ${risk.color}30`}>
                            <Text fontSize="9px" fontWeight="black" color={risk.color}
                              textTransform="uppercase">{risk.label}</Text>
                          </Box>
                        </Box>

                        {/* Attempted toggle */}
                        <Flex flex="0 0 100px" justify="center">
                          <Tooltip
                            label={s.attempted
                              ? `Attempted by ${s.attemptedByOperatorName || 'someone'}`
                              : 'Mark as attempted'}
                            hasArrow fontSize="10px">
                            <Button size="xs" h="22px" px={2} borderRadius="5px"
                              fontSize="10px" fontWeight="bold"
                              bg={s.attempted ? `${TEAL}14` : 'transparent'}
                              color={s.attempted ? TEAL : MUTED}
                              border={`1px solid ${s.attempted ? TEAL + '40' : CARD_BD}`}
                              _hover={{ color: TEAL, borderColor: `${TEAL}50` }}
                              onClick={(e) => toggleAttempted(s, e)}
                              leftIcon={s.attempted ? <CheckIcon boxSize={2} /> : null}>
                              {s.attempted ? 'yes' : 'no'}
                            </Button>
                          </Tooltip>
                        </Flex>

                        {/* Delete */}
                        <Box flex="0 0 28px">
                          <IconButton icon={<DeleteIcon boxSize={2.5} />} size="xs"
                            variant="ghost" color={MUTED}
                            _hover={{ color: RED, bg: 'rgba(252,129,129,0.1)' }}
                            onClick={(e) => { e.stopPropagation(); setDeleting(s); }}
                            aria-label="delete" />
                        </Box>
                      </Flex>
                    </MotionBox>
                  );
                })}
              </AnimatePresence>
            )}
          </Box>
        </Flex>

        {/* ── Right column ────────────────────────────────────────────────── */}
        <Box w="260px" flexShrink={0} borderLeft={`1px solid ${CARD_BD}`} pl={5}>

          <Flex align="center" gap={2} mb={4}>
            <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
            <Text fontSize="10px" color={MUTED} textTransform="uppercase"
              letterSpacing="widest" fontWeight="bold">Top Hosts</Text>
            {stats?.uniqueHosts > 0 && (
              <Box px={2} py="1px" borderRadius="full" bg={A_S} border={`1px solid ${A_B}`}>
                <Text fontSize="10px" color={ACCENT} fontWeight="bold">
                  {stats.uniqueHosts}
                </Text>
              </Box>
            )}
          </Flex>

          {!stats?.topHosts?.length ? (
            <Flex align="center" justify="center" py={8}>
              <Text fontSize="11px" color={MUTED} opacity={0.4}>No hosts yet</Text>
            </Flex>
          ) : (
            <Flex direction="column" gap={1}>
              {stats.topHosts.map(h => {
                const act = hostFilter === h.host;
                return (
                  <Box key={h.host} px={3} py="8px" borderRadius="9px" cursor="pointer"
                    bg={act ? `${ACCENT}0D` : 'transparent'}
                    border={`1px solid ${act ? A_B : 'transparent'}`}
                    _hover={{ bg: act ? `${ACCENT}14` : 'rgba(255,255,255,0.04)' }}
                    onClick={() => setHostFilter(act ? null : h.host)}>
                    <Text fontSize="11px" fontFamily="mono" fontWeight="semibold"
                      color="var(--dash-text-primary)" noOfLines={1}>
                      {h.host}
                    </Text>
                    <Flex align="center" gap={2} mt={0.5}>
                      <Text fontSize="9px" color={ACCENT} fontWeight="bold">
                        {h.count} svc
                      </Text>
                      {h.attempted > 0 && (
                        <>
                          <Box w="3px" h="3px" borderRadius="full" bg={MUTED} />
                          <Text fontSize="9px" color={TEAL} fontWeight="bold">
                            {h.attempted} tried
                          </Text>
                        </>
                      )}
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          )}

          {stats?.topServices?.length > 0 && (
            <Box mt={5} pt={4} borderTop={`1px solid ${CARD_BD}`}>
              <Text fontSize="9px" color={MUTED} textTransform="uppercase"
                letterSpacing="wider" fontWeight="bold" mb={2}>Top Services</Text>
              <Flex direction="column" gap={1}>
                {stats.topServices.slice(0, 8).map(s => {
                  const act = serviceFilter === s.name;
                  return (
                    <Flex key={s.name} align="center" justify="space-between" px={2} py="4px"
                      borderRadius="6px" cursor="pointer"
                      bg={act ? A_S : 'transparent'}
                      _hover={{ bg: act ? `${ACCENT}14` : 'rgba(255,255,255,0.03)' }}
                      onClick={() => setServiceFilter(act ? null : s.name)}>
                      <Text fontSize="11px" fontFamily="mono"
                        color={act ? ACCENT :
                          `hsl(${hashHue(s.name)}, 65%, 70%)`} noOfLines={1}>
                        {s.name}
                      </Text>
                      <Text fontSize="10px" color={MUTED} fontWeight="bold">{s.count}</Text>
                    </Flex>
                  );
                })}
              </Flex>
            </Box>
          )}

          {stats?.topPorts?.length > 0 && (
            <Box mt={5} pt={4} borderTop={`1px solid ${CARD_BD}`}>
              <Text fontSize="9px" color={MUTED} textTransform="uppercase"
                letterSpacing="wider" fontWeight="bold" mb={2}>Top Ports</Text>
              <Flex direction="column" gap={1}>
                {stats.topPorts.slice(0, 6).map(p => (
                  <Flex key={p.port} align="center" justify="space-between" px={2} py="3px">
                    <Text fontSize="11px" fontFamily="mono" color={ACCENT}>
                      {p.port}
                    </Text>
                    <Text fontSize="10px" color={MUTED}>{p.count}</Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          )}
        </Box>
      </Flex>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <ServiceModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        service={selected}
        engId={engId}
        onUpdate={(upd) => setItems(p => p.map(x => x._id === upd._id ? upd : x))}
        onDelete={(id) => setDeleting(items.find(x => x._id === id) || selected)}
      />
      <ConfirmDelete
        target={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteService(deleting._id)}
      />
    </Box>
  );
};

export default ServiceCatalogView;
