import { useState, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select,
  Textarea, SimpleGrid, Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  AddIcon, DeleteIcon, EditIcon, CopyIcon, CheckIcon, CloseIcon,
  SearchIcon, ChevronLeftIcon, ChevronRightIcon, AttachmentIcon,
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

const CATEGORIES = [
  'Credentials', 'Password File', 'Config File', 'Hash',
  'SSH Key', 'Network Location', 'Screenshot', 'Note', 'Other',
];

const CAT_STYLES = {
  'Credentials':      { color: '#FC8181', bg: 'rgba(252,129,129,0.1)' },
  'Password File':    { color: '#F6AD55', bg: 'rgba(246,173,85,0.1)' },
  'Config File':      { color: '#9F7AEA', bg: 'rgba(159,122,234,0.1)' },
  'Hash':             { color: '#ECC94B', bg: 'rgba(236,201,75,0.1)' },
  'SSH Key':          { color: '#4FD1C5', bg: 'rgba(79,209,197,0.1)' },
  'Network Location': { color: '#63B3ED', bg: 'rgba(99,179,237,0.1)' },
  'Screenshot':       { color: '#68D391', bg: 'rgba(104,211,145,0.1)' },
  'Note':             { color: '#A0AEC0', bg: 'rgba(160,174,192,0.1)' },
  'Other':            { color: '#718096', bg: 'rgba(113,128,150,0.1)' },
};

const EMPTY_FORM = { title: '', category: 'Other', content: '', tags: '', images: [] };

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
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Sub-components ───────────────────────────────────────────────────────────

const CategoryBadge = ({ cat, small }) => {
  const s = CAT_STYLES[cat] || CAT_STYLES['Other'];
  return (
    <Box
      px={small ? 1.5 : 2} py="1px"
      borderRadius="4px"
      fontSize={small ? '9px' : '10px'}
      fontWeight="bold"
      color={s.color}
      bg={s.bg}
      border={`1px solid ${s.color}40`}
      whiteSpace="nowrap"
      flexShrink={0}
    >
      {cat}
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
    <Box w="3px" h="12px" borderRadius="full" bg="rgba(255,80,95,0.7)" />
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
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4,
  h: '40px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

const selSx = {
  bg: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px',
  h: '40px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  cursor: 'pointer',
  focusBorderColor: 'rgba(255,80,95,0.7)',
  _hover: { borderColor: 'rgba(255,80,95,0.4)' },
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
      as="img"
      src={images[index]}
      maxW="90vw" maxH="90vh"
      objectFit="contain"
      borderRadius="8px"
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

// ── Main Component ───────────────────────────────────────────────────────────

const LootTrackerView = () => {
  const { slug } = useParams();
  const { getBySlug, fetchEngagements } = useEngagements();
  const { user } = useAuth();
  const eng = getBySlug(slug);

  const [selected,      setSelected]      = useState(null);
  const [mode,          setMode]          = useState('view');
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);
  const [search,        setSearch]        = useState('');
  const [filterCat,     setFilterCat]     = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [lightbox,      setLightbox]      = useState({ open: false, images: [], index: 0 });
  const [copied,        setCopied]        = useState(false);

  const fileInputRef = useRef(null);

  const loot = eng?.loot || [];

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = loot.filter((item) => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.content || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCat === 'all' || item.category === filterCat;
    return matchSearch && matchCat;
  });

  const selectedItem = selected ? loot.find((l) => l._id === selected) : null;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const openAdd = useCallback(() => {
    setForm(EMPTY_FORM);
    setSelected(null);
    setMode('add');
  }, []);

  const openEdit = useCallback((item) => {
    setForm({
      title:    item.title,
      category: item.category,
      content:  item.content || '',
      tags:     (item.tags || []).join(', '),
      images:   item.images || [],
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
        title:    form.title.trim(),
        category: form.category,
        content:  form.content,
        images:   form.images,
        tags:     form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };

      if (mode === 'add') {
        const res = await fetch(`${API}/loot/${eng._id}/loot`, {
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
        const res = await fetch(`${API}/loot/${eng._id}/loot/${selected}`, {
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

  const handleDelete = useCallback(async (lootId) => {
    if (!eng) return;
    const res = await fetch(`${API}/loot/${eng._id}/loot/${lootId}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    if (res.ok) {
      await fetchEngagements();
      if (selected === lootId) { setSelected(null); setMode('view'); }
      setDeleteConfirm(null);
    }
  }, [eng, selected, fetchEngagements]);

  const copyContent = useCallback(() => {
    if (!selectedItem?.content) return;
    navigator.clipboard.writeText(selectedItem.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedItem]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!eng) {
    return (
      <Flex align="center" justify="center" h="60vh">
        <Spinner color="rgba(255,80,95,0.8)" />
      </Flex>
    );
  }

  const showForm = mode === 'add' || mode === 'edit';

  return (
    <Box h="100%" display="flex" flexDirection="column" overflow="hidden">
      {/* Header */}
      <Flex align="center" justify="space-between" px={6} py={4} flexShrink={0}
        borderBottom="1px solid var(--dash-card-border)">
        <Box>
          <Heading size="sm" color="var(--dash-text-primary)" fontWeight="bold">
            Loot Tracker
          </Heading>
          <Text fontSize="xs" color="var(--dash-text-muted)" mt={0.5}>
            {loot.length} item{loot.length !== 1 ? 's' : ''} captured
          </Text>
        </Box>
        <Button
          size="sm" leftIcon={<AddIcon />}
          bg="rgba(255,80,95,0.15)" color="rgba(255,100,115,0.9)"
          border="1px solid rgba(255,80,95,0.3)"
          _hover={{ bg: 'rgba(255,80,95,0.25)' }}
          borderRadius="8px" fontWeight="semibold"
          onClick={openAdd}
        >
          Add Loot
        </Button>
      </Flex>

      {/* Body */}
      <Flex flex={1} overflow="hidden">
        {/* Sidebar */}
        <Box
          w="280px" flexShrink={0}
          borderRight="1px solid var(--dash-card-border)"
          display="flex" flexDirection="column"
          overflow="hidden"
        >
          {/* Search + filter */}
          <Box px={3} py={3} borderBottom="1px solid var(--dash-card-border)" flexShrink={0}>
            <Flex align="center" gap={2} mb={2}
              bg="rgba(255,255,255,0.05)" borderRadius="8px"
              border="1px solid rgba(255,255,255,0.1)"
              px={3} h="36px"
            >
              <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
              <Input
                variant="unstyled"
                placeholder="Search loot..."
                fontSize="xs"
                color="var(--dash-text-primary)"
                _placeholder={{ color: 'var(--dash-text-muted)' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Flex>
            <Flex gap={1} flexWrap="wrap">
              {['all', ...CATEGORIES.filter(c => loot.some(l => l.category === c))].map(c => {
                const isAll = c === 'all';
                const active = filterCat === c;
                const s = isAll ? null : CAT_STYLES[c];
                return (
                  <Box key={c} as="button" px={2} py="3px" borderRadius="5px"
                    fontSize="9px" fontWeight="600" cursor="pointer" transition="all 0.12s"
                    bg={active ? (isAll ? 'rgba(255,80,95,0.15)' : s.bg) : 'rgba(255,255,255,0.04)'}
                    border={`1px solid ${active ? (isAll ? 'rgba(255,80,95,0.4)' : s.color + '50') : 'rgba(255,255,255,0.08)'}`}
                    color={active ? (isAll ? 'rgba(255,130,130,0.95)' : s.color) : 'var(--dash-text-muted)'}
                    _hover={{ borderColor: isAll ? 'rgba(255,80,95,0.35)' : (s?.color + '40' || '') }}
                    onClick={() => setFilterCat(c)}>
                    {isAll ? 'All' : c}
                  </Box>
                );
              })}
            </Flex>
          </Box>

          {/* List */}
          <Box flex={1} overflowY="auto" py={1}>
            {filtered.length === 0 && (
              <Flex direction="column" align="center" justify="center" h="120px" gap={1}>
                <Text fontSize="xs" color="var(--dash-text-muted)">
                  {loot.length === 0 ? 'No loot yet' : 'No results'}
                </Text>
              </Flex>
            )}
            {filtered.map((item) => {
              const isActive = selected === item._id;
              return (
                <Box
                  key={item._id}
                  px={3} py={3} mx={1} mb="2px"
                  borderRadius="8px"
                  cursor="pointer"
                  bg={isActive ? 'rgba(255,80,95,0.1)' : 'transparent'}
                  border={isActive ? '1px solid rgba(255,80,95,0.3)' : '1px solid transparent'}
                  _hover={{ bg: isActive ? 'rgba(255,80,95,0.12)' : 'rgba(255,255,255,0.04)' }}
                  onClick={() => {
                    if (selected === item._id) { setSelected(null); setMode('view'); }
                    else { setSelected(item._id); setMode('view'); }
                  }}
                >
                  <Flex align="center" gap={2} mb={1} justify="space-between">
                    <Text
                      fontSize="xs" fontWeight="semibold"
                      color="var(--dash-text-primary)"
                      noOfLines={1} flex={1}
                    >
                      {item.title}
                    </Text>
                    <CategoryBadge cat={item.category} small />
                  </Flex>
                  {item.content && (
                    <Text fontSize="10px" color="var(--dash-text-muted)" noOfLines={1} mb={1}>
                      {item.content.slice(0, 50)}{item.content.length > 50 ? '…' : ''}
                    </Text>
                  )}
                  <Flex align="center" justify="space-between">
                    <Text fontSize="9px" color="var(--dash-text-muted)">
                      {formatDate(item.createdAt)}
                    </Text>
                    {item.images?.length > 0 && (
                      <Text fontSize="9px" color="var(--dash-text-muted)">
                        {item.images.length} img{item.images.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </Flex>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Right Panel */}
        <Box flex={1} overflow="hidden" display="flex" flexDirection="column">
          {/* ── Empty state ─────────────────────────────────────────────── */}
          {!showForm && !selectedItem && loot.length === 0 && (
            <Flex flex={1} direction="column" align="center" justify="center" gap={4}>
              <Box
                p={6} borderRadius="16px"
                bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                textAlign="center"
              >
                <Text fontSize="3xl" mb={3}>🗃️</Text>
                <Text fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
                  No loot captured yet
                </Text>
                <Text fontSize="sm" color="var(--dash-text-muted)" mb={4}>
                  Start tracking credentials, configs, and other findings.
                </Text>
                <Button
                  size="sm" leftIcon={<AddIcon />}
                  bg="rgba(255,80,95,0.15)" color="rgba(255,100,115,0.9)"
                  border="1px solid rgba(255,80,95,0.3)"
                  _hover={{ bg: 'rgba(255,80,95,0.25)' }}
                  borderRadius="8px" fontWeight="semibold"
                  onClick={openAdd}
                >
                  Add your first loot
                </Button>
              </Box>
            </Flex>
          )}

          {/* ── Overview dashboard (no selection) ──────────────────────── */}
          {!showForm && !selectedItem && loot.length > 0 && (
            <Box flex={1} overflowY="auto" p={6}>
              {/* Stats row */}
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={6}>
                {[
                  { label: 'Total Captured', value: loot.length, color: '#fc8181' },
                  { label: 'With Content',   value: loot.filter(l => l.content?.trim()).length, color: '#9F7AEA' },
                  { label: 'With Images',    value: loot.filter(l => l.images?.length > 0).length, color: '#68D391' },
                  { label: 'Categories',     value: new Set(loot.map(l => l.category)).size, color: '#63B3ED' },
                ].map(s => (
                  <MotionBox key={s.label} p={4} borderRadius="12px"
                    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                    pos="relative" overflow="hidden"
                    whileHover={{ y: -5, boxShadow: `0 12px 28px rgba(0,0,0,0.4), 0 0 0 1px ${s.color}30` }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                    <Box pos="absolute" top="0" left="0" right="0" h="2px"
                      style={{ background: `linear-gradient(to right, transparent, ${s.color}99, transparent)` }} />
                    <Text fontSize="22px" fontWeight="bold" color={s.color} lineHeight="1">{s.value}</Text>
                    <Text fontSize="10px" color="var(--dash-text-muted)" mt={1} textTransform="uppercase" letterSpacing="wider">{s.label}</Text>
                  </MotionBox>
                ))}
              </SimpleGrid>

              {/* By category breakdown */}
              <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                letterSpacing="wider" fontWeight="semibold" mb={3}>By Category</Text>
              <Flex gap={2} flexWrap="wrap" mb={6}>
                {CATEGORIES.filter(c => loot.some(l => l.category === c)).map(c => {
                  const s = CAT_STYLES[c] || CAT_STYLES['Other'];
                  const count = loot.filter(l => l.category === c).length;
                  return (
                    <Flex key={c} align="center" gap={2} px={3} py={2} borderRadius="8px"
                      bg={s.bg} border={`1px solid ${s.color}35`}
                      cursor="pointer" _hover={{ borderColor: s.color + '70' }}
                      onClick={() => setFilterCat(c)}>
                      <Box w="6px" h="6px" borderRadius="full" bg={s.color} />
                      <Text fontSize="12px" fontWeight="600" color={s.color}>{c}</Text>
                      <Box px={1.5} py="1px" borderRadius="full" bg={`${s.color}20`}>
                        <Text fontSize="10px" fontWeight="bold" color={s.color}>{count}</Text>
                      </Box>
                    </Flex>
                  );
                })}
              </Flex>

              {/* Recent loot */}
              <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                letterSpacing="wider" fontWeight="semibold" mb={3}>Recent</Text>
              <Flex direction="column" gap={2}>
                {[...loot].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map(item => {
                  const s = CAT_STYLES[item.category] || CAT_STYLES['Other'];
                  return (
                    <Flex key={item._id} align="center" gap={3} px={4} py={3} borderRadius="10px"
                      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                      cursor="pointer" transition="border-color 0.15s"
                      _hover={{ borderColor: s.color + '50' }}
                      onClick={() => { setSelected(item._id); setMode('view'); }}>
                      <Box w="3px" h="32px" borderRadius="full" bg={s.color} flexShrink={0} />
                      <Box flex={1} minW={0}>
                        <Text fontSize="13px" fontWeight="600" color="var(--dash-text-primary)" noOfLines={1}>{item.title}</Text>
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
                        <CategoryBadge cat={item.category} small />
                        <Text fontSize="10px" color="var(--dash-text-muted)">{formatDate(item.createdAt)}</Text>
                      </Flex>
                    </Flex>
                  );
                })}
              </Flex>
            </Box>
          )}

          {/* ── Add / Edit Form ─────────────────────────────────────────── */}
          {showForm && (
            <Box flex={1} overflowY="auto" p={6}>
              <Flex align="center" justify="space-between" mb={5}>
                <Heading size="xs" color="var(--dash-text-primary)" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                  {mode === 'add' ? 'Add Loot' : 'Edit Loot'}
                </Heading>
              </Flex>

              <Flex direction="column" gap={4} maxW="700px">
                {/* Title */}
                <Box>
                  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                    letterSpacing="wider" fontWeight="semibold" mb={1}>
                    Title *
                  </Text>
                  <Input
                    {...inputSx}
                    placeholder="e.g. Domain Admin Credentials"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </Box>

                {/* Category */}
                <Box>
                  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                    letterSpacing="wider" fontWeight="semibold" mb={2}>
                    Category
                  </Text>
                  <Flex gap={2} flexWrap="wrap">
                    {CATEGORIES.map(c => {
                      const s = CAT_STYLES[c] || CAT_STYLES['Other'];
                      const active = form.category === c;
                      return (
                        <Box key={c} as="button" px={3} py={1.5} borderRadius="8px"
                          fontSize="11px" fontWeight="600" cursor="pointer" transition="all 0.15s"
                          bg={active ? s.bg : 'rgba(255,255,255,0.04)'}
                          border={`1px solid ${active ? s.color + '60' : 'rgba(255,255,255,0.08)'}`}
                          color={active ? s.color : 'var(--dash-text-muted)'}
                          _hover={{ bg: s.bg, borderColor: s.color + '40', color: s.color }}
                          onClick={() => setForm(p => ({ ...p, category: c }))}>
                          {c}
                        </Box>
                      );
                    })}
                  </Flex>
                </Box>

                {/* Tags */}
                <Box>
                  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                    letterSpacing="wider" fontWeight="semibold" mb={1}>
                    Tags (comma-separated)
                  </Text>
                  <Input
                    {...inputSx}
                    placeholder="e.g. domain-admin, kerberoast, ntlm"
                    value={form.tags}
                    onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                  />
                </Box>

                {/* Content */}
                <Box>
                  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                    letterSpacing="wider" fontWeight="semibold" mb={1}>
                    Content / Code Block
                  </Text>
                  <Textarea
                    variant="unstyled"
                    bg="rgba(0,0,0,0.4)"
                    border="1px solid rgba(255,255,255,0.1)"
                    borderRadius="10px"
                    px={4} py={3}
                    fontSize="sm"
                    fontFamily="mono"
                    color="var(--dash-text-primary)"
                    _placeholder={{ color: 'var(--dash-text-muted)' }}
                    _hover={{ border: '1px solid rgba(255,80,95,0.4)' }}
                    _focus={{ border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' }}
                    placeholder="Paste credentials, config, hashes, notes..."
                    minH="200px"
                    resize="vertical"
                    value={form.content}
                    onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  />
                </Box>

                {/* Images */}
                <Box>
                  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                    letterSpacing="wider" fontWeight="semibold" mb={2}>
                    Screenshots / Images
                  </Text>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <Button
                    size="sm" leftIcon={<AttachmentIcon />}
                    variant="ghost"
                    color="var(--dash-text-secondary)"
                    border="1px dashed rgba(255,255,255,0.15)"
                    _hover={{ bg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,80,95,0.4)' }}
                    borderRadius="8px"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Attach Images
                  </Button>

                  {form.images.length > 0 && (
                    <SimpleGrid columns={3} gap={2} mt={3}>
                      {form.images.map((src, idx) => (
                        <Box key={idx} position="relative" borderRadius="8px" overflow="hidden"
                          border="1px solid rgba(255,255,255,0.1)">
                          <Box as="img" src={src} w="100%" h="80px" objectFit="cover" />
                          <IconButton
                            icon={<CloseIcon boxSize={2} />}
                            size="xs" position="absolute" top={1} right={1}
                            bg="rgba(0,0,0,0.7)" color="white"
                            _hover={{ bg: 'rgba(255,80,95,0.8)' }}
                            borderRadius="full"
                            onClick={() => removeImage(idx)}
                          />
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}
                </Box>

                {/* Actions */}
                <Flex gap={3} mt={2}>
                  <Button
                    size="sm"
                    bg="rgba(255,80,95,0.15)" color="rgba(255,100,115,0.9)"
                    border="1px solid rgba(255,80,95,0.3)"
                    _hover={{ bg: 'rgba(255,80,95,0.25)' }}
                    borderRadius="8px" fontWeight="semibold"
                    isLoading={saving}
                    isDisabled={!form.title.trim()}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    color="var(--dash-text-muted)"
                    _hover={{ color: 'var(--dash-text-primary)', bg: 'rgba(255,255,255,0.05)' }}
                    borderRadius="8px"
                    onClick={cancelForm}
                  >
                    Cancel
                  </Button>
                </Flex>
              </Flex>
            </Box>
          )}

          {/* ── Detail View ─────────────────────────────────────────────── */}
          {!showForm && selectedItem && (
            <Box flex={1} overflowY="auto" p={6}>
              {/* Header */}
              <Flex align="flex-start" justify="space-between" mb={4} gap={4}>
                <Box flex={1} minW={0}>
                  <Flex align="center" gap={2} mb={1} flexWrap="wrap">
                    <Text fontSize="lg" fontWeight="bold" color="var(--dash-text-primary)">
                      {selectedItem.title}
                    </Text>
                    <CategoryBadge cat={selectedItem.category} />
                  </Flex>
                  {selectedItem.capturedByCallsign && (
                    <Text fontSize="11px" color="var(--dash-text-muted)">
                      Captured by {selectedItem.capturedByCallsign} · {formatDate(selectedItem.createdAt)}
                    </Text>
                  )}
                </Box>
                <Flex gap={1} flexShrink={0}>
                  <IconButton
                    icon={<EditIcon />} size="sm" variant="ghost"
                    color="var(--dash-text-muted)"
                    _hover={{ color: 'var(--dash-text-primary)', bg: 'rgba(255,255,255,0.07)' }}
                    borderRadius="8px"
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
                      icon={<DeleteIcon />} size="sm" variant="ghost"
                      color="var(--dash-text-muted)"
                      _hover={{ color: 'rgba(255,100,115,0.9)', bg: 'rgba(255,80,95,0.08)' }}
                      borderRadius="8px"
                      onClick={() => setDeleteConfirm(selectedItem._id)}
                    />
                  )}
                </Flex>
              </Flex>

              {/* Tags */}
              {selectedItem.tags?.length > 0 && (
                <Flex gap={1} flexWrap="wrap" mb={5}>
                  {selectedItem.tags.map((t) => <Tag key={t} label={t} />)}
                </Flex>
              )}

              {/* Content */}
              {selectedItem.content && (
                <Box mb={5}>
                  <SectionLabel>Content</SectionLabel>
                  <Box position="relative">
                    <Box
                      bg="rgba(0,0,0,0.4)"
                      border="1px solid rgba(255,255,255,0.08)"
                      borderRadius="10px"
                      p={4}
                      maxH="400px"
                      overflowY="auto"
                    >
                      <Text
                        as="pre"
                        fontSize="xs"
                        fontFamily="mono"
                        color="var(--dash-text-primary)"
                        whiteSpace="pre-wrap"
                        wordBreak="break-all"
                      >
                        {selectedItem.content}
                      </Text>
                    </Box>
                    <IconButton
                      icon={copied ? <CheckIcon /> : <CopyIcon />}
                      size="xs"
                      position="absolute" top={2} right={2}
                      variant="ghost"
                      color={copied ? 'rgba(104,211,145,0.9)' : 'var(--dash-text-muted)'}
                      _hover={{ bg: 'rgba(255,255,255,0.1)', color: 'var(--dash-text-primary)' }}
                      borderRadius="6px"
                      onClick={copyContent}
                    />
                  </Box>
                </Box>
              )}

              {/* Screenshots */}
              {selectedItem.images?.length > 0 && (
                <Box>
                  <SectionLabel>Screenshots</SectionLabel>
                  <SimpleGrid columns={3} gap={3}>
                    {selectedItem.images.map((src, idx) => (
                      <Box
                        key={idx}
                        borderRadius="8px" overflow="hidden"
                        border="1px solid rgba(255,255,255,0.1)"
                        cursor="pointer"
                        _hover={{ border: '1px solid rgba(255,80,95,0.4)' }}
                        transition="border 0.15s"
                        onClick={() => setLightbox({ open: true, images: selectedItem.images, index: idx })}
                      >
                        <Box as="img" src={src} w="100%" h="120px" objectFit="cover" />
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Flex>

      {/* Lightbox */}
      {lightbox.open && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox({ open: false, images: [], index: 0 })}
          onPrev={() => setLightbox((p) => ({ ...p, index: (p.index - 1 + p.images.length) % p.images.length }))}
          onNext={() => setLightbox((p) => ({ ...p, index: (p.index + 1) % p.images.length }))}
        />
      )}
    </Box>
  );
};

export default LootTrackerView;
