import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select,
  Textarea, Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  AddIcon, DeleteIcon, EditIcon, CopyIcon, CheckIcon, CloseIcon,
  SearchIcon, ChevronLeftIcon, ChevronRightIcon, AttachmentIcon,
  TimeIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

const MotionBox = motion(Box);

// ── Constants ────────────────────────────────────────────────────────────────

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const TYPES = ['Command', 'Finding', 'Access', 'Network', 'Exfil', 'Screenshot', 'Note', 'Other'];

// Evidence vault uses teal/cyan accent (vs loot tracker's red) so the
// operator immediately knows they're on a different page.
const ACCENT        = '#38B2AC'; // teal-400
const ACCENT_DIM    = 'rgba(56,178,172,0.15)';
const ACCENT_BORDER = 'rgba(56,178,172,0.35)';
const ACCENT_GLOW   = 'rgba(56,178,172,0.25)';

const TYPE_STYLES = {
  'Command':    { color: '#4FD1C5', bg: 'rgba(79,209,197,0.1)'  },
  'Finding':    { color: '#FC8181', bg: 'rgba(252,129,129,0.1)' },
  'Access':     { color: '#68D391', bg: 'rgba(104,211,145,0.1)' },
  'Network':    { color: '#63B3ED', bg: 'rgba(99,179,237,0.1)'  },
  'Exfil':      { color: '#F6AD55', bg: 'rgba(246,173,85,0.1)'  },
  'Screenshot': { color: '#9F7AEA', bg: 'rgba(159,122,234,0.1)' },
  'Note':       { color: '#A0AEC0', bg: 'rgba(160,174,192,0.1)' },
  'Other':      { color: '#718096', bg: 'rgba(113,128,150,0.1)' },
};

// Date → display string "DD.MM.YYYY - HH:MM"
const toDisplayTs = (date) => {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Display string → Date (handles multiple formats)
const parseDisplayTs = (str) => {
  if (!str?.trim()) return new Date();
  // "DD.MM.YYYY - HH:MM" or "DD.MM.YYYY HH:MM"
  const dot = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s*[-–]?\s*(\d{1,2}):(\d{2})/);
  if (dot) {
    const [, dd, mm, yyyy, hh, min] = dot;
    return new Date(+yyyy, +mm - 1, +dd, +hh, +min);
  }
  // "DD/MM/YYYY - HH:MM"
  const slash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[-–]?\s*(\d{1,2}):(\d{2})/);
  if (slash) {
    const [, dd, mm, yyyy, hh, min] = slash;
    return new Date(+yyyy, +mm - 1, +dd, +hh, +min);
  }
  // Fallback to native parsing (ISO, etc.)
  const fallback = new Date(str);
  return isNaN(fallback) ? new Date() : fallback;
};

// Date → datetime-local value for the hidden picker
const toLocalInput = (date) => {
  const d = date ? new Date(date) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY_FORM = {
  title:     '',
  type:      'Command',
  content:   '',
  tags:      '',
  images:    [],
  timestamp: toDisplayTs(new Date()),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const resizeImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1920;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

const formatTs = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ── Sub-components ───────────────────────────────────────────────────────────

const TypeBadge = ({ type, small }) => {
  const s = TYPE_STYLES[type] || TYPE_STYLES['Other'];
  return (
    <Box
      px={small ? 1.5 : 2} py="1px"
      borderRadius="4px"
      fontSize={small ? '9px' : '10px'}
      fontWeight="bold"
      color={s.color} bg={s.bg}
      border={`1px solid ${s.color}40`}
      whiteSpace="nowrap" flexShrink={0}
    >
      {type}
    </Box>
  );
};

const Tag = ({ label }) => (
  <Box
    px={2} py="1px" borderRadius="4px"
    fontSize="10px" fontWeight="semibold"
    color="var(--dash-text-secondary)"
    bg="rgba(255,255,255,0.06)"
    border="1px solid rgba(255,255,255,0.1)"
    whiteSpace="nowrap"
  >
    {label}
  </Box>
);

const SectionLabel = ({ children }) => (
  <Flex align="center" gap={2} mb={2}>
    <Box w="3px" h="12px" borderRadius="full" bg={ACCENT_BORDER} />
    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
      textTransform="uppercase" letterSpacing="wider">
      {children}
    </Text>
  </Flex>
);

// ── Input style ──────────────────────────────────────────────────────────────

const inputSx = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: '10px',
  px: 4,
  h: '40px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT_BORDER}` },
  _focus: { border: `1px solid ${ACCENT}`, boxShadow: `0 0 0 1px ${ACCENT_GLOW}` },
};

const selSx = {
  bg: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px',
  h: '40px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  cursor: 'pointer',
  focusBorderColor: ACCENT,
  _hover: { borderColor: ACCENT_BORDER },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

// ── Lightbox ─────────────────────────────────────────────────────────────────

const Lightbox = ({ images, index, onClose, onPrev, onNext }) => (
  <Flex
    position="fixed" inset={0} zIndex={9999}
    bg="rgba(0,0,0,0.92)" align="center" justify="center"
    onClick={onClose}
  >
    <IconButton
      icon={<CloseIcon />} position="absolute" top={4} right={4}
      size="sm" variant="ghost" color="white" _hover={{ bg: 'rgba(255,255,255,0.1)' }}
      onClick={onClose}
    />
    {images.length > 1 && (
      <IconButton
        icon={<ChevronLeftIcon boxSize={6} />}
        position="absolute" left={4}
        size="md" variant="ghost" color="white" _hover={{ bg: 'rgba(255,255,255,0.1)' }}
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
      />
    )}
    <Box
      as="img" src={images[index]}
      maxW="90vw" maxH="90vh"
      objectFit="contain" borderRadius="8px"
      onClick={(e) => e.stopPropagation()}
    />
    {images.length > 1 && (
      <IconButton
        icon={<ChevronRightIcon boxSize={6} />}
        position="absolute" right={4}
        size="md" variant="ghost" color="white" _hover={{ bg: 'rgba(255,255,255,0.1)' }}
        onClick={(e) => { e.stopPropagation(); onNext(); }}
      />
    )}
    {images.length > 1 && (
      <Text position="absolute" bottom={4} color="rgba(255,255,255,0.5)" fontSize="sm">
        {index + 1} / {images.length}
      </Text>
    )}
  </Flex>
);

// ── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color }) => {
  const c = color || ACCENT;
  return (
    <MotionBox
      flex={1}
      px={4} py={3}
      borderRadius="10px"
      bg="rgba(255,255,255,0.03)"
      border="1px solid rgba(255,255,255,0.08)"
      pos="relative" overflow="hidden"
      whileHover={{ y: -3, boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px ${c}30` }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${c}99, transparent)` }} />
      <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
        textTransform="uppercase" letterSpacing="wider" mb={1}>
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="bold" color={c} lineHeight={1}>
        {value}
      </Text>
    </MotionBox>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const EvidenceVaultView = () => {
  const { slug } = useParams();
  const { getBySlug, fetchEngagements } = useEngagements();
  const { user } = useAuth();
  const eng = getBySlug(slug);

  const [selected,      setSelected]      = useState(null);
  const [mode,          setMode]          = useState('view');
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);
  const [search,        setSearch]        = useState('');
  const [filterType,    setFilterType]    = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [lightbox,      setLightbox]      = useState({ open: false, images: [], index: 0 });
  const [copied,        setCopied]        = useState(false);
  const [sidebarPage,   setSidebarPage]   = useState(0);
  const [overviewPage,  setOverviewPage]  = useState(0);

  // Reset sidebar page when filters change
  useEffect(() => { setSidebarPage(0); }, [search, filterType]);

  const fileInputRef = useRef(null);
  const tsPickerRef  = useRef(null);

  const evidence = eng?.evidence || [];

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = evidence.filter((item) => {
    const matchSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.content || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === 'all' || item.type === filterType;
    return matchSearch && matchType;
  });

  const selectedItem = selected ? evidence.find((e) => e._id === selected) : null;

  // ── Stats ──────────────────────────────────────────────────────────────────

  const cmdCount  = evidence.filter((e) => e.type === 'Command').length;
  const imgCount  = evidence.reduce((n, e) => n + (e.images?.length || 0), 0);
  const latest    = evidence.length
    ? evidence.reduce((a, b) => new Date(a.timestamp) > new Date(b.timestamp) ? a : b)
    : null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openAdd = useCallback(() => {
    setForm({ ...EMPTY_FORM, timestamp: toDisplayTs(new Date()) });
    setSelected(null);
    setMode('add');
  }, []);

  const openEdit = useCallback((item) => {
    setForm({
      title:     item.title,
      type:      item.type,
      content:   item.content || '',
      tags:      (item.tags || []).join(', '),
      images:    item.images || [],
      timestamp: toDisplayTs(item.timestamp || new Date()),
    });
    setMode('edit');
  }, []);

  const cancelForm = useCallback(() => {
    setMode('view');
    setForm(EMPTY_FORM);
  }, []);

  const handleFileChange = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const resized = await Promise.all(files.map(resizeImage));
    setForm((prev) => ({ ...prev, images: [...prev.images, ...resized] }));
    e.target.value = '';
  }, []);

  const removeImage = useCallback((idx) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) return;
    if (!eng) return;
    setSaving(true);
    try {
      const body = {
        title:     form.title.trim(),
        type:      form.type,
        content:   form.content,
        images:    form.images,
        tags:      form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        timestamp: parseDisplayTs(form.timestamp).toISOString(),
      };

      if (mode === 'add') {
        const res = await fetch(`${API}/evidence/${eng._id}/evidence`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
        });
        if (res.ok) {
          const created = await res.json();
          await fetchEngagements();
          setSelected(created._id);
          setMode('view');
          setForm(EMPTY_FORM);
        }
      } else if (mode === 'edit' && selected) {
        const res = await fetch(`${API}/evidence/${eng._id}/evidence/${selected}`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
        });
        if (res.ok) {
          await fetchEngagements();
          setMode('view');
          setForm(EMPTY_FORM);
        }
      }
    } finally {
      setSaving(false);
    }
  }, [form, mode, eng, selected, fetchEngagements]);

  const handleDelete = useCallback(async (evId) => {
    if (!eng) return;
    const res = await fetch(`${API}/evidence/${eng._id}/evidence/${evId}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    if (res.ok) {
      await fetchEngagements();
      if (selected === evId) { setSelected(null); setMode('view'); }
      setDeleteConfirm(null);
    }
  }, [eng, selected, fetchEngagements]);

  const copyContent = useCallback(() => {
    if (!selectedItem?.content) return;
    navigator.clipboard.writeText(selectedItem.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedItem]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!eng) {
    return (
      <Flex align="center" justify="center" h="60vh">
        <Spinner color={ACCENT} />
      </Flex>
    );
  }

  const showForm = mode === 'add' || mode === 'edit';

  return (
    <Box h="100%" display="flex" flexDirection="column" overflow="hidden">
      {/* ── Header ── */}
      <Flex align="center" justify="space-between" px={6} py={4} flexShrink={0}
        borderBottom="1px solid var(--dash-card-border)">
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Evidence <Text as="span" color={ACCENT}>Vault</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · log command outputs, screenshots and operational evidence
          </Text>
        </Box>
        <Button
          size="sm" leftIcon={<AddIcon />}
          bg={ACCENT_DIM} color={ACCENT}
          border={`1px solid ${ACCENT_BORDER}`}
          _hover={{ bg: ACCENT_GLOW }}
          borderRadius="8px" fontWeight="semibold"
          onClick={openAdd}
        >
          Log Evidence
        </Button>
      </Flex>

      {/* ── Stats bar ── */}
      <Flex px={6} py={3} gap={3} flexShrink={0}
        borderBottom="1px solid var(--dash-card-border)">
        <StatCard label="Total Records" value={evidence.length} />
        <StatCard label="Commands"      value={cmdCount} />
        <StatCard label="Screenshots"   value={imgCount} color="#9F7AEA" />
        <Box
          bg="rgba(255,255,255,0.03)"
          border="1px solid rgba(255,255,255,0.08)"
          borderRadius="10px"
          px={4} py={3} flex={1}
        >
          <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider" mb={1}>
            Last Activity
          </Text>
          <Text fontSize="xs" fontWeight="semibold" color="var(--dash-text-secondary)"
            lineHeight={1.3} noOfLines={1}>
            {latest ? formatTs(latest.timestamp) : '—'}
          </Text>
        </Box>
      </Flex>

      {/* ── Body (sidebar + detail) ── */}
      <Flex flex={1} overflow="hidden">

        {/* ── Sidebar ── */}
        <Box
          w="280px" flexShrink={0}
          borderRight="1px solid var(--dash-card-border)"
          display="flex" flexDirection="column"
          overflow="hidden"
        >
          {/* Search + type filter */}
          <Box px={3} py={3} borderBottom="1px solid var(--dash-card-border)" flexShrink={0}>
            <Flex align="center" gap={2} mb={2}
              bg="rgba(255,255,255,0.05)" borderRadius="8px"
              border="1px solid rgba(255,255,255,0.1)"
              px={3} h="36px"
            >
              <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
              <Input
                variant="unstyled"
                placeholder="Search evidence..."
                fontSize="xs"
                color="var(--dash-text-primary)"
                _placeholder={{ color: 'var(--dash-text-muted)' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Flex>
            <Flex gap={1} flexWrap="wrap">
              {['all', ...TYPES.filter((t) => evidence.some((e) => e.type === t))].map((t) => {
                const isAll = t === 'all';
                const active = filterType === t;
                const s = isAll ? null : TYPE_STYLES[t];
                return (
                  <Box key={t} as="button" px={2} py="3px" borderRadius="5px"
                    fontSize="9px" fontWeight="600" cursor="pointer" transition="all 0.12s"
                    bg={active ? (isAll ? ACCENT_DIM : s.bg) : 'rgba(255,255,255,0.04)'}
                    border={`1px solid ${active ? (isAll ? ACCENT_BORDER : s.color + '50') : 'rgba(255,255,255,0.08)'}`}
                    color={active ? (isAll ? ACCENT : s.color) : 'var(--dash-text-muted)'}
                    _hover={{ borderColor: isAll ? ACCENT_BORDER : (s?.color + '40' || '') }}
                    onClick={() => setFilterType(t)}
                  >
                    {isAll ? 'All' : t}
                  </Box>
                );
              })}
            </Flex>
          </Box>

          {/* List — paginated */}
          {(() => {
            const PAGE_SIZE = 5;
            const reversed = [...filtered].reverse();
            const totalPages = Math.max(1, Math.ceil(reversed.length / PAGE_SIZE));
            const page = Math.min(sidebarPage, totalPages - 1);
            const pageItems = reversed.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
            return (
              <Box flex={1} display="flex" flexDirection="column" overflow="hidden">
                <Box flex={1} overflowY="auto" py={1}>
                  {filtered.length === 0 && (
                    <Flex direction="column" align="center" justify="center" h="120px" gap={1}>
                      <Text fontSize="xs" color="var(--dash-text-muted)">
                        {evidence.length === 0 ? 'No evidence yet' : 'No results'}
                      </Text>
                    </Flex>
                  )}
                  {pageItems.map((item) => {
                    const isActive = selected === item._id;
                    return (
                      <MotionBox
                        key={item._id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        px={3} py={2.5} mx={1} mb={0.5}
                        borderRadius="8px"
                        cursor="pointer"
                        bg={isActive ? ACCENT_DIM : 'transparent'}
                        border={`1px solid ${isActive ? ACCENT_BORDER : 'transparent'}`}
                        _hover={{ bg: isActive ? ACCENT_DIM : 'rgba(255,255,255,0.04)' }}
                        onClick={() => {
                          if (selected === item._id) { setSelected(null); setMode('view'); }
                          else { setSelected(item._id); setMode('view'); }
                        }}
                      >
                        <Flex align="flex-start" justify="space-between" gap={1}>
                          <Text fontSize="xs" fontWeight="semibold"
                            color={isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)'}
                            noOfLines={1} flex={1}>
                            {item.title}
                          </Text>
                          <TypeBadge type={item.type} small />
                        </Flex>
                        <Flex align="center" gap={1} mt={1}>
                          <TimeIcon boxSize="9px" color="var(--dash-text-muted)" />
                          <Text fontSize="9px" color="var(--dash-text-muted)" noOfLines={1}>
                            {formatTs(item.timestamp)}
                          </Text>
                        </Flex>
                        {item.tags?.length > 0 && (
                          <Flex gap={1} mt={1} flexWrap="wrap">
                            {item.tags.slice(0, 2).map((t) => <Tag key={t} label={t} />)}
                            {item.tags.length > 2 && (
                              <Text fontSize="9px" color="var(--dash-text-muted)">+{item.tags.length - 2}</Text>
                            )}
                          </Flex>
                        )}
                      </MotionBox>
                    );
                  })}
                </Box>
                {totalPages > 1 && (
                  <Flex align="center" justify="center" gap={2} py={2}
                    borderTop="1px solid var(--dash-card-border)" flexShrink={0}>
                    <IconButton
                      icon={<ChevronLeftIcon />} size="xs" variant="ghost"
                      color="var(--dash-text-muted)" _hover={{ color: ACCENT }}
                      isDisabled={page === 0}
                      onClick={() => setSidebarPage((p) => Math.max(0, p - 1))}
                      aria-label="Previous page"
                    />
                    <Text fontSize="10px" color="var(--dash-text-muted)" minW="40px" textAlign="center">
                      {page + 1} / {totalPages}
                    </Text>
                    <IconButton
                      icon={<ChevronRightIcon />} size="xs" variant="ghost"
                      color="var(--dash-text-muted)" _hover={{ color: ACCENT }}
                      isDisabled={page >= totalPages - 1}
                      onClick={() => setSidebarPage((p) => Math.min(totalPages - 1, p + 1))}
                      aria-label="Next page"
                    />
                  </Flex>
                )}
              </Box>
            );
          })()}
        </Box>

        {/* ── Detail / Form panel ── */}
        <Box flex={1} overflow="hidden" display="flex" flexDirection="column">

          {/* ── ADD / EDIT form ── */}
          {showForm && (
            <Box flex={1} overflowY="auto" px={6} py={5}>
              <Heading size="xs" color="var(--dash-text-primary)" mb={5}>
                {mode === 'add' ? 'Log New Evidence' : 'Edit Evidence'}
              </Heading>

              {/* Title */}
              <Box mb={4}>
                <SectionLabel>Title</SectionLabel>
                <Input {...inputSx}
                  placeholder="Evidence title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </Box>

              {/* Type + Timestamp */}
              <Flex gap={3} mb={4}>
                <Box flex={1}>
                  <SectionLabel>Type</SectionLabel>
                  <Select {...selSx}
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </Box>
                <Box flex={2}>
                  <SectionLabel>Timestamp</SectionLabel>
                  {/* Free-text input + hidden picker triggered by calendar icon */}
                  <Flex
                    align="center"
                    bg="rgba(255,255,255,0.05)"
                    border={`1px solid rgba(255,255,255,0.1)`}
                    borderRadius="10px"
                    px={3} h="40px"
                    _focusWithin={{ border: `1px solid ${ACCENT}`, boxShadow: `0 0 0 1px ${ACCENT_GLOW}` }}
                    _hover={{ border: `1px solid ${ACCENT_BORDER}` }}
                    transition="border 0.15s"
                  >
                    <Input
                      variant="unstyled"
                      flex={1}
                      fontSize="sm"
                      color="var(--dash-text-primary)"
                      _placeholder={{ color: 'var(--dash-text-muted)' }}
                      placeholder="DD.MM.YYYY - HH:MM"
                      value={form.timestamp}
                      onChange={(e) => setForm((p) => ({ ...p, timestamp: e.target.value }))}
                    />
                    {/* Hidden native picker — calendar icon opens it */}
                    <Box position="relative" flexShrink={0}>
                      <input
                        ref={tsPickerRef}
                        type="datetime-local"
                        style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
                        onChange={(e) => {
                          if (e.target.value) setForm((p) => ({ ...p, timestamp: toDisplayTs(new Date(e.target.value)) }));
                        }}
                      />
                      <IconButton
                        icon={<TimeIcon />}
                        size="xs" variant="ghost"
                        color="var(--dash-text-muted)"
                        _hover={{ color: ACCENT }}
                        aria-label="Pick date"
                        onClick={() => tsPickerRef.current?.showPicker?.()}
                      />
                    </Box>
                  </Flex>
                </Box>
              </Flex>

              {/* Command / Content */}
              <Box mb={4}>
                <SectionLabel>Command / Content</SectionLabel>
                <Textarea
                  bg="rgba(255,255,255,0.05)"
                  border="1px solid rgba(255,255,255,0.1)"
                  borderRadius="10px"
                  px={4} py={3}
                  fontSize="xs"
                  fontFamily="mono"
                  color="var(--dash-text-primary)"
                  _placeholder={{ color: 'var(--dash-text-muted)' }}
                  _hover={{ border: `1px solid ${ACCENT_BORDER}` }}
                  _focus={{ border: `1px solid ${ACCENT}`, boxShadow: `0 0 0 1px ${ACCENT_GLOW}` }}
                  placeholder={
                    form.type === 'Command'
                      ? 'e.g.  nmap -sV -p- 10.10.10.5  |  output goes here...'
                      : 'Description, notes, or output...'
                  }
                  rows={8}
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  resize="vertical"
                />
              </Box>

              {/* Tags */}
              <Box mb={4}>
                <SectionLabel>Tags (comma-separated)</SectionLabel>
                <Input {...inputSx}
                  placeholder="e.g. nmap, recon, 10.10.10.5"
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                />
              </Box>

              {/* Screenshots / attachments (optional) */}
              <Box mb={4}>
                <SectionLabel>Screenshots (optional)</SectionLabel>
                <input
                  type="file" accept="image/*" multiple
                  ref={fileInputRef} style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <Button
                  size="sm" variant="outline"
                  borderColor="rgba(255,255,255,0.1)"
                  color="var(--dash-text-secondary)"
                  _hover={{ borderColor: ACCENT_BORDER, color: ACCENT }}
                  borderRadius="8px"
                  leftIcon={<AttachmentIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Attach Images
                </Button>
                {form.images.length > 0 && (
                  <Flex gap={2} mt={3} flexWrap="wrap">
                    {form.images.map((src, idx) => (
                      <Box key={idx} position="relative" flexShrink={0}>
                        <Box
                          as="img" src={src}
                          w="72px" h="72px"
                          objectFit="cover"
                          borderRadius="8px"
                          border="1px solid rgba(255,255,255,0.1)"
                        />
                        <IconButton
                          icon={<CloseIcon boxSize="8px" />}
                          size="xs" position="absolute" top={1} right={1}
                          bg="rgba(0,0,0,0.7)" color="white"
                          _hover={{ bg: 'rgba(0,0,0,0.9)' }}
                          borderRadius="full"
                          onClick={() => removeImage(idx)}
                          aria-label="Remove image"
                        />
                      </Box>
                    ))}
                  </Flex>
                )}
              </Box>

              {/* Actions */}
              <Flex gap={3} mt={2}>
                <Button
                  size="sm"
                  bg={ACCENT_DIM} color={ACCENT}
                  border={`1px solid ${ACCENT_BORDER}`}
                  _hover={{ bg: ACCENT_GLOW }}
                  borderRadius="8px" fontWeight="semibold"
                  isLoading={saving}
                  isDisabled={!form.title.trim()}
                  onClick={handleSave}
                >
                  {mode === 'add' ? 'Save' : 'Update'}
                </Button>
                <Button
                  size="sm" variant="ghost"
                  color="var(--dash-text-muted)"
                  _hover={{ color: 'white' }}
                  onClick={cancelForm}
                >
                  Cancel
                </Button>
              </Flex>
            </Box>
          )}

          {/* ── View detail ── */}
          {!showForm && selectedItem && (
            <Box flex={1} overflowY="auto" px={6} py={5}>
              {/* Top bar */}
              <Flex align="flex-start" justify="space-between" mb={4} gap={4}>
                <Box flex={1}>
                  <Flex align="center" gap={2} mb={1}>
                    <TypeBadge type={selectedItem.type} />
                  </Flex>
                  <Heading size="sm" color="var(--dash-text-primary)" mt={1}>
                    {selectedItem.title}
                  </Heading>
                  <Flex align="center" gap={1} mt={1}>
                    <TimeIcon boxSize="10px" color={ACCENT} />
                    <Text fontSize="xs" color="var(--dash-text-muted)">
                      {formatTs(selectedItem.timestamp)}
                    </Text>
                  </Flex>
                </Box>
                <Flex gap={1} flexShrink={0}>
                  <IconButton
                    icon={copied ? <CheckIcon /> : <CopyIcon />}
                    size="xs" variant="ghost"
                    color={copied ? ACCENT : 'var(--dash-text-muted)'}
                    _hover={{ color: ACCENT }}
                    aria-label="Copy content"
                    onClick={copyContent}
                    isDisabled={!selectedItem.content}
                  />
                  <IconButton
                    icon={<EditIcon />}
                    size="xs" variant="ghost"
                    color="var(--dash-text-muted)"
                    _hover={{ color: ACCENT }}
                    aria-label="Edit"
                    onClick={() => openEdit(selectedItem)}
                  />
                  {deleteConfirm === selectedItem._id ? (
                    <Flex align="center" gap={1}
                      bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
                      borderRadius="8px" px={2} py={1}>
                      <Text fontSize="xs" color="rgba(255,100,115,0.9)" whiteSpace="nowrap">
                        Are you sure?
                      </Text>
                      <IconButton
                        icon={<CheckIcon />} size="xs" variant="ghost"
                        color="rgba(255,100,115,0.9)"
                        _hover={{ bg: 'rgba(255,80,95,0.2)' }}
                        onClick={() => handleDelete(selectedItem._id)}
                      />
                      <IconButton
                        icon={<CloseIcon />} size="xs" variant="ghost"
                        color="var(--dash-text-muted)"
                        _hover={{ bg: 'rgba(255,255,255,0.07)' }}
                        onClick={() => setDeleteConfirm(null)}
                      />
                    </Flex>
                  ) : (
                    <IconButton
                      icon={<DeleteIcon />} size="xs" variant="ghost"
                      color="var(--dash-text-muted)"
                      _hover={{ color: 'rgba(255,100,115,0.9)', bg: 'rgba(255,80,95,0.08)' }}
                      aria-label="Delete"
                      onClick={() => setDeleteConfirm(selectedItem._id)}
                    />
                  )}
                </Flex>
              </Flex>

              {/* Captured by */}
              {selectedItem.capturedByCallsign && (
                <Flex align="center" gap={2} mb={4}>
                  <Box
                    px={2} py="2px" borderRadius="5px"
                    fontSize="10px" fontWeight="semibold"
                    color={ACCENT} bg={ACCENT_DIM}
                    border={`1px solid ${ACCENT_BORDER}`}
                  >
                    {selectedItem.capturedByCallsign}
                  </Box>
                  <Text fontSize="10px" color="var(--dash-text-muted)">captured this</Text>
                </Flex>
              )}

              {/* Content */}
              {selectedItem.content && (
                <Box mb={5}>
                  <SectionLabel>
                    {selectedItem.type === 'Command' ? 'Command / Output' : 'Content'}
                  </SectionLabel>
                  <Box
                    bg="rgba(0,0,0,0.35)"
                    border={`1px solid rgba(255,255,255,0.08)`}
                    borderRadius="10px"
                    px={4} py={3}
                    fontSize="xs"
                    fontFamily="mono"
                    color="var(--dash-text-secondary)"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                  >
                    {selectedItem.content}
                  </Box>
                </Box>
              )}

              {/* Tags */}
              {selectedItem.tags?.length > 0 && (
                <Box mb={5}>
                  <SectionLabel>Tags</SectionLabel>
                  <Flex gap={1} flexWrap="wrap">
                    {selectedItem.tags.map((t) => <Tag key={t} label={t} />)}
                  </Flex>
                </Box>
              )}

              {/* Images */}
              {selectedItem.images?.length > 0 && (
                <Box mb={4}>
                  <SectionLabel>Screenshots ({selectedItem.images.length})</SectionLabel>
                  <Flex gap={2} flexWrap="wrap">
                    {selectedItem.images.map((src, idx) => (
                      <Box
                        key={idx}
                        as="img" src={src}
                        w="110px" h="80px"
                        objectFit="cover"
                        borderRadius="8px"
                        border={`1px solid ${ACCENT_BORDER}`}
                        cursor="pointer"
                        transition="transform 0.1s"
                        _hover={{ transform: 'scale(1.04)' }}
                        onClick={() => setLightbox({ open: true, images: selectedItem.images, index: idx })}
                      />
                    ))}
                  </Flex>
                </Box>
              )}
            </Box>
          )}

          {/* ── Empty state (no records yet) ── */}
          {!showForm && !selectedItem && evidence.length === 0 && (
            <Flex flex={1} direction="column" align="center" justify="center" gap={3}
              color="var(--dash-text-muted)">
              <Box
                w="52px" h="52px" borderRadius="12px"
                border={`2px solid ${ACCENT_BORDER}`}
                bg={ACCENT_DIM}
                display="flex" alignItems="center" justifyContent="center"
              >
                <Box w="22px" h="26px" borderRadius="4px"
                  border={`2px solid ${ACCENT}`} position="relative">
                  <Box position="absolute" bottom="-6px" left="50%"
                    transform="translateX(-50%)"
                    w="8px" h="8px" borderRadius="full"
                    border={`2px solid ${ACCENT}`} bg="transparent" />
                </Box>
              </Box>
              <Box textAlign="center">
                <Text fontSize="sm" fontWeight="semibold" color="var(--dash-text-secondary)">
                  Evidence Vault
                </Text>
                <Text fontSize="xs" mt={1}>
                  No evidence logged yet — hit "Log Evidence" to start
                </Text>
              </Box>
            </Flex>
          )}

          {/* ── Overview / Recent (deselected, records exist) ── */}
          {!showForm && !selectedItem && evidence.length > 0 && (
            <Box flex={1} overflowY="auto" p={6}>
              {(() => {
                const PAGE_SIZE = 5;
                const sorted = [...evidence].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
                const page = Math.min(overviewPage, totalPages - 1);
                const pageItems = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
                return (
                  <>
                    <Flex align="center" justify="space-between" mb={3}>
                      <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                        letterSpacing="wider" fontWeight="semibold">
                        Recent
                      </Text>
                      {totalPages > 1 && (
                        <Flex align="center" gap={1}>
                          <IconButton
                            icon={<ChevronLeftIcon />} size="xs" variant="ghost"
                            color="var(--dash-text-muted)" _hover={{ color: ACCENT }}
                            isDisabled={page === 0}
                            onClick={() => setOverviewPage((p) => Math.max(0, p - 1))}
                            aria-label="Previous page"
                          />
                          <Text fontSize="10px" color="var(--dash-text-muted)" minW="40px" textAlign="center">
                            {page + 1} / {totalPages}
                          </Text>
                          <IconButton
                            icon={<ChevronRightIcon />} size="xs" variant="ghost"
                            color="var(--dash-text-muted)" _hover={{ color: ACCENT }}
                            isDisabled={page >= totalPages - 1}
                            onClick={() => setOverviewPage((p) => Math.min(totalPages - 1, p + 1))}
                            aria-label="Next page"
                          />
                        </Flex>
                      )}
                    </Flex>
                    <Flex direction="column" gap={2}>
                      {pageItems.map((item) => {
                        const s = TYPE_STYLES[item.type] || TYPE_STYLES['Other'];
                        return (
                          <Flex key={item._id} align="center" gap={3} px={4} py={3} borderRadius="10px"
                            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                            cursor="pointer" transition="border-color 0.15s"
                            _hover={{ borderColor: s.color + '50' }}
                            onClick={() => { setSelected(item._id); setMode('view'); }}>
                            <Box w="3px" h="32px" borderRadius="full" bg={s.color} flexShrink={0} />
                            <Box flex={1} minW={0}>
                              <Text fontSize="13px" fontWeight="600" color="var(--dash-text-primary)" noOfLines={1}>
                                {item.title}
                              </Text>
                              {item.content && (
                                <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1} mt={0.5} fontFamily="monospace">
                                  {item.content.slice(0, 60)}{item.content.length > 60 ? '…' : ''}
                                </Text>
                              )}
                            </Box>
                            <Flex gap={2} align="center" flexShrink={0}>
                              {item.images?.length > 0 && (
                                <Text fontSize="10px" color="var(--dash-text-muted)">{item.images.length} img</Text>
                              )}
                              <TypeBadge type={item.type} small />
                              <Text fontSize="10px" color="var(--dash-text-muted)">{formatTs(item.timestamp)}</Text>
                            </Flex>
                          </Flex>
                        );
                      })}
                    </Flex>
                  </>
                );
              })()}
            </Box>
          )}
        </Box>
      </Flex>

      {/* ── Lightbox ── */}
      {lightbox.open && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox((l) => ({ ...l, open: false }))}
          onPrev={() => setLightbox((l) => ({ ...l, index: (l.index - 1 + l.images.length) % l.images.length }))}
          onNext={() => setLightbox((l) => ({ ...l, index: (l.index + 1) % l.images.length }))}
        />
      )}
    </Box>
  );
};

export default EvidenceVaultView;
