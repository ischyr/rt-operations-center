import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select,
  Textarea, Spinner, SimpleGrid,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, EditIcon, CheckIcon, CloseIcon,
  SearchIcon, AttachmentIcon, ChevronLeftIcon, ChevronRightIcon,
  ArrowBackIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from '@dnd-kit/core';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

const MotionBox = motion(Box);

// ── Constants ────────────────────────────────────────────────────────────────

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const ARTIFACT_TYPES = ['File', 'Registry', 'Process', 'Network', 'Credential', 'Service', 'Script', 'Other'];

// Orange accent — distinct from Evidence Vault (teal) and Loot Tracker (red)
const ACCENT        = '#ED8936';
const ACCENT_DIM    = 'rgba(237,137,54,0.12)';
const ACCENT_BORDER = 'rgba(237,137,54,0.35)';
const ACCENT_GLOW   = 'rgba(237,137,54,0.22)';

const CLEANED_COLOR  = '#68D391';
const PENDING_COLOR  = '#FC8181';

const TYPE_STYLES = {
  'File':        { color: '#F6AD55', bg: 'rgba(246,173,85,0.1)'  },
  'Registry':    { color: '#FC8181', bg: 'rgba(252,129,129,0.1)' },
  'Process':     { color: '#4FD1C5', bg: 'rgba(79,209,197,0.1)'  },
  'Network':     { color: '#63B3ED', bg: 'rgba(99,179,237,0.1)'  },
  'Credential':  { color: '#9F7AEA', bg: 'rgba(159,122,234,0.1)' },
  'Service':     { color: '#ECC94B', bg: 'rgba(236,201,75,0.1)'  },
  'Script':      { color: '#68D391', bg: 'rgba(104,211,145,0.1)' },
  'Other':       { color: '#718096', bg: 'rgba(113,128,150,0.1)' },
};

const EMPTY_FORM = {
  title:        '',
  artifactType: 'File',
  path:         '',
  commands:     '',
  beforeProof:  '',
  afterProof:   '',
  beforeImages: [],
  afterImages:  [],
  notes:        '',
  tags:         '',
  status:       'Pending',
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

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <Flex align="center" gap={2} mb={2}>
    <Box w="3px" h="12px" borderRadius="full" bg={ACCENT_BORDER} />
    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
      textTransform="uppercase" letterSpacing="wider">
      {children}
    </Text>
  </Flex>
);

const TypeBadge = ({ type, small }) => {
  const s = TYPE_STYLES[type] || TYPE_STYLES['Other'];
  return (
    <Box px={small ? 1.5 : 2} py="1px" borderRadius="4px"
      fontSize={small ? '9px' : '10px'} fontWeight="bold"
      color={s.color} bg={s.bg} border={`1px solid ${s.color}40`}
      whiteSpace="nowrap" flexShrink={0}>
      {type}
    </Box>
  );
};

const StatusBadge = ({ status }) => {
  const cleaned = status === 'Cleaned';
  return (
    <Flex align="center" gap={1} px={2} py="1px" borderRadius="4px"
      fontSize="9px" fontWeight="bold" whiteSpace="nowrap" flexShrink={0}
      color={cleaned ? CLEANED_COLOR : PENDING_COLOR}
      bg={cleaned ? 'rgba(104,211,145,0.1)' : 'rgba(252,129,129,0.1)'}
      border={`1px solid ${cleaned ? CLEANED_COLOR : PENDING_COLOR}40`}>
      <Box w="5px" h="5px" borderRadius="full"
        bg={cleaned ? CLEANED_COLOR : PENDING_COLOR} flexShrink={0} />
      {cleaned ? 'Cleaned' : 'Pending'}
    </Flex>
  );
};

const Tag = ({ label }) => (
  <Box px={2} py="1px" borderRadius="4px" fontSize="10px" fontWeight="semibold"
    color="var(--dash-text-secondary)" bg="rgba(255,255,255,0.06)"
    border="1px solid rgba(255,255,255,0.1)" whiteSpace="nowrap">
    {label}
  </Box>
);

// ── Input styles ─────────────────────────────────────────────────────────────

const inputSx = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4, h: '40px',
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
  h: '40px', fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  cursor: 'pointer',
  focusBorderColor: ACCENT,
  _hover: { borderColor: ACCENT_BORDER },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

const textareaSx = {
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4, py: 3,
  fontSize: 'xs', fontFamily: 'mono',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT_BORDER}` },
  _focus: { border: `1px solid ${ACCENT}`, boxShadow: `0 0 0 1px ${ACCENT_GLOW}` },
  resize: 'vertical',
};

// ── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color }) => {
  const c = color || ACCENT;
  return (
    <MotionBox flex={1} px={4} py={3} borderRadius="10px"
      bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
      pos="relative" overflow="hidden"
      whileHover={{ y: -3, boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px ${c}30` }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${c}99, transparent)` }} />
      <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
        textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
      <Text fontSize="xl" fontWeight="bold" color={c} lineHeight={1}>{value}</Text>
    </MotionBox>
  );
};

// ── Lightbox ─────────────────────────────────────────────────────────────────

const Lightbox = ({ images, index, onClose, onPrev, onNext }) => (
  <Flex position="fixed" inset={0} zIndex={9999}
    bg="rgba(0,0,0,0.92)" align="center" justify="center" onClick={onClose}>
    <IconButton icon={<CloseIcon />} position="absolute" top={4} right={4}
      size="sm" variant="ghost" color="white" _hover={{ bg: 'rgba(255,255,255,0.1)' }}
      onClick={onClose} />
    {images.length > 1 && (
      <IconButton icon={<ChevronLeftIcon boxSize={6} />} position="absolute" left={4}
        size="md" variant="ghost" color="white" _hover={{ bg: 'rgba(255,255,255,0.1)' }}
        onClick={(e) => { e.stopPropagation(); onPrev(); }} />
    )}
    <Box as="img" src={images[index]} maxW="90vw" maxH="90vh"
      objectFit="contain" borderRadius="8px" onClick={(e) => e.stopPropagation()} />
    {images.length > 1 && (
      <>
        <IconButton icon={<ChevronRightIcon boxSize={6} />} position="absolute" right={4}
          size="md" variant="ghost" color="white" _hover={{ bg: 'rgba(255,255,255,0.1)' }}
          onClick={(e) => { e.stopPropagation(); onNext(); }} />
        <Text position="absolute" bottom={4} color="rgba(255,255,255,0.5)" fontSize="sm">
          {index + 1} / {images.length}
        </Text>
      </>
    )}
  </Flex>
);

// ── Board Card ───────────────────────────────────────────────────────────────

const BoardCard = ({ item, isActive, onClick }) => {
  const s = TYPE_STYLES[item.artifactType] || TYPE_STYLES['Other'];
  return (
    <MotionBox
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      p={3} borderRadius="10px" cursor="pointer"
      bg={isActive ? ACCENT_DIM : 'rgba(255,255,255,0.03)'}
      border={`1px solid ${isActive ? ACCENT_BORDER : 'rgba(255,255,255,0.07)'}`}
      _hover={{ bg: isActive ? ACCENT_DIM : 'rgba(255,255,255,0.06)', borderColor: isActive ? ACCENT_BORDER : s.color + '40' }}
      transition="all 0.15s"
      onClick={onClick}
    >
      <Flex justify="space-between" align="flex-start" gap={2} mb={1.5}>
        <Text fontSize="xs" fontWeight="semibold" color="var(--dash-text-primary)" noOfLines={1} flex={1}>
          {item.title}
        </Text>
        <TypeBadge type={item.artifactType} small />
      </Flex>

      {item.path && (
        <Text fontSize="9px" color="var(--dash-text-muted)" fontFamily="mono" noOfLines={1} mb={1.5}>
          {item.path}
        </Text>
      )}

      {/* Proof indicators */}
      <Flex gap={1.5} align="center" mb={item.tags?.length ? 1.5 : 0}>
        <Box px={1.5} py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
          color={item.beforeProof || item.beforeImages?.length ? '#F6AD55' : 'var(--dash-text-muted)'}
          bg={item.beforeProof || item.beforeImages?.length ? 'rgba(246,173,85,0.1)' : 'rgba(255,255,255,0.04)'}
          border={`1px solid ${item.beforeProof || item.beforeImages?.length ? 'rgba(246,173,85,0.3)' : 'rgba(255,255,255,0.08)'}`}>
          BEFORE
        </Box>
        <Box px={1.5} py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
          color={item.afterProof || item.afterImages?.length ? CLEANED_COLOR : 'var(--dash-text-muted)'}
          bg={item.afterProof || item.afterImages?.length ? 'rgba(104,211,145,0.1)' : 'rgba(255,255,255,0.04)'}
          border={`1px solid ${item.afterProof || item.afterImages?.length ? 'rgba(104,211,145,0.3)' : 'rgba(255,255,255,0.08)'}`}>
          AFTER
        </Box>
        <Text fontSize="9px" color="var(--dash-text-muted)" ml="auto">
          {formatDate(item.createdAt)}
        </Text>
      </Flex>

      {item.tags?.length > 0 && (
        <Flex gap={1} flexWrap="wrap">
          {item.tags.slice(0, 3).map((t) => <Tag key={t} label={t} />)}
          {item.tags.length > 3 && <Text fontSize="9px" color="var(--dash-text-muted)">+{item.tags.length - 3}</Text>}
        </Flex>
      )}
    </MotionBox>
  );
};

// ── Draggable board card ──────────────────────────────────────────────────────

const DraggableBoardCard = ({ item, isActive, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item._id,
    data: { item },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <Box ref={setNodeRef} style={style} opacity={isDragging ? 0.3 : 1}
      cursor="grab" {...attributes} {...listeners}>
      <BoardCard item={item} isActive={isActive} onClick={onClick} />
    </Box>
  );
};

// ── Droppable board column ────────────────────────────────────────────────────

const BoardColumn = ({ title, items, accentColor, page, setPage, dropId, selected, onSelect }) => {
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  const PAGE_SIZE = 5;
  const total = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const p = Math.min(page, total - 1);
  const pageItems = items.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE);
  return (
    <Flex direction="column" flex={1} minW={0} gap={0}>
      {/* Column header */}
      <Flex align="center" gap={2} mb={3}>
        <Box w="3px" h="14px" borderRadius="full" bg={accentColor} />
        <Text fontSize="10px" fontWeight="bold" color={accentColor}
          textTransform="uppercase" letterSpacing="wider">
          {title}
        </Text>
        <Box px={2} py="1px" borderRadius="full" ml={1}
          bg={`${accentColor}18`} border={`1px solid ${accentColor}35`}>
          <Text fontSize="9px" fontWeight="bold" color={accentColor}>{items.length}</Text>
        </Box>
        {total > 1 && (
          <Flex align="center" gap={1} ml="auto">
            <IconButton icon={<ChevronLeftIcon />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" _hover={{ color: 'white' }}
              isDisabled={p === 0} onClick={() => setPage((x) => Math.max(0, x - 1))}
              aria-label="prev" />
            <Text fontSize="9px" color="var(--dash-text-muted)" minW="32px" textAlign="center">
              {p + 1}/{total}
            </Text>
            <IconButton icon={<ChevronRightIcon />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" _hover={{ color: 'white' }}
              isDisabled={p >= total - 1} onClick={() => setPage((x) => Math.min(total - 1, x + 1))}
              aria-label="next" />
          </Flex>
        )}
      </Flex>

      {/* Cards — the entire area is the drop target */}
      <Flex direction="column" gap={2} flex={1} ref={setNodeRef} minH="80px"
        borderRadius="10px" transition="background 0.15s, outline 0.15s"
        bg={isOver ? `${accentColor}08` : 'transparent'}
        outline={isOver ? `2px dashed ${accentColor}55` : '2px solid transparent'}
        p={isOver ? 2 : 0}>
        {items.length === 0 ? (
          <Flex align="center" justify="center" h="80px"
            bg="rgba(255,255,255,0.02)" border="1px dashed rgba(255,255,255,0.08)"
            borderRadius="10px">
            <Text fontSize="xs" color="var(--dash-text-muted)">
              {isOver ? 'Drop here' : 'None'}
            </Text>
          </Flex>
        ) : (
          pageItems.map((item) => (
            <DraggableBoardCard key={item._id} item={item}
              isActive={selected === item._id}
              onClick={() => onSelect(item._id)} />
          ))
        )}
      </Flex>
    </Flex>
  );
};

// ── Image upload strip ───────────────────────────────────────────────────────

const ImageStrip = ({ images, onRemove, onAdd, fileInputRef, label }) => (
  <Box mb={4}>
    <SectionLabel>{label} (optional)</SectionLabel>
    <input type="file" accept="image/*" multiple ref={fileInputRef}
      style={{ display: 'none' }} onChange={onAdd} />
    <Button size="sm" variant="outline"
      borderColor="rgba(255,255,255,0.1)" color="var(--dash-text-secondary)"
      _hover={{ borderColor: ACCENT_BORDER, color: ACCENT }}
      borderRadius="8px" leftIcon={<AttachmentIcon />}
      onClick={() => fileInputRef.current?.click()}>
      Attach Screenshots
    </Button>
    {images.length > 0 && (
      <Flex gap={2} mt={3} flexWrap="wrap">
        {images.map((src, idx) => (
          <Box key={idx} position="relative" flexShrink={0}>
            <Box as="img" src={src} w="72px" h="72px" objectFit="cover"
              borderRadius="8px" border="1px solid rgba(255,255,255,0.1)" />
            <IconButton icon={<CloseIcon boxSize="8px" />}
              size="xs" position="absolute" top={1} right={1}
              bg="rgba(0,0,0,0.7)" color="white" _hover={{ bg: 'rgba(0,0,0,0.9)' }}
              borderRadius="full" onClick={() => onRemove(idx)} aria-label="Remove" />
          </Box>
        ))}
      </Flex>
    )}
  </Box>
);

// ── Proof Block (detail view) ─────────────────────────────────────────────────

const ProofBlock = ({ label, color, text, images, onImageClick }) => (
  <Box flex={1} minW={0}
    bg="rgba(255,255,255,0.02)" border={`1px solid ${color}25`}
    borderRadius="10px" p={4}>
    <Flex align="center" gap={2} mb={3}>
      <Box w="3px" h="12px" borderRadius="full" bg={color} />
      <Text fontSize="9px" fontWeight="bold" color={color}
        textTransform="uppercase" letterSpacing="wider">{label}</Text>
    </Flex>
    {text ? (
      <Box bg="rgba(0,0,0,0.35)" border="1px solid rgba(255,255,255,0.06)"
        borderRadius="8px" px={3} py={2.5} mb={images?.length ? 3 : 0}
        fontSize="xs" fontFamily="mono" color="var(--dash-text-secondary)"
        whiteSpace="pre-wrap" wordBreak="break-word" maxH="160px" overflowY="auto">
        {text}
      </Box>
    ) : !images?.length ? (
      <Text fontSize="xs" color="var(--dash-text-muted)">No proof provided</Text>
    ) : null}
    {images?.length > 0 && (
      <Flex gap={2} flexWrap="wrap">
        {images.map((src, idx) => (
          <Box key={idx} as="img" src={src} w="80px" h="60px"
            objectFit="cover" borderRadius="6px"
            border={`1px solid ${color}30`} cursor="pointer"
            transition="transform 0.1s" _hover={{ transform: 'scale(1.05)' }}
            onClick={() => onImageClick(idx)} />
        ))}
      </Flex>
    )}
  </Box>
);

// ── Main Component ────────────────────────────────────────────────────────────

const CleanupTrackerView = () => {
  const { slug }  = useParams();
  const { getBySlug, fetchEngagements } = useEngagements();
  const { user }  = useAuth();
  const eng = getBySlug(slug);

  const [selected,      setSelected]      = useState(null);
  const [mode,          setMode]          = useState('board'); // 'board' | 'detail' | 'add' | 'edit'
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);
  const [search,        setSearch]        = useState('');
  const [filterType,    setFilterType]    = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [lightbox,      setLightbox]      = useState({ open: false, images: [], index: 0 });
  const [pendingPage,   setPendingPage]   = useState(0);
  const [cleanedPage,   setCleanedPage]   = useState(0);

  const beforeFileRef = useRef(null);
  const afterFileRef  = useRef(null);

  const cleanup = eng?.cleanup || [];

  useEffect(() => { setPendingPage(0); setCleanedPage(0); }, [search, filterType]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = cleanup.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      item.title.toLowerCase().includes(q) ||
      (item.path || '').toLowerCase().includes(q) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(q));
    const matchType = filterType === 'all' || item.artifactType === filterType;
    return matchSearch && matchType;
  });

  const pending = filtered.filter((i) => i.status === 'Pending');
  const cleaned = filtered.filter((i) => i.status === 'Cleaned');
  const selectedItem = selected ? cleanup.find((c) => c._id === selected) : null;

  // ── Stats ──────────────────────────────────────────────────────────────────

  const typeCount = new Set(cleanup.map((c) => c.artifactType)).size;
  const withBoth  = cleanup.filter((c) => (c.beforeProof || c.beforeImages?.length) && (c.afterProof || c.afterImages?.length)).length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openAdd = useCallback(() => {
    setForm(EMPTY_FORM);
    setSelected(null);
    setMode('add');
  }, []);

  const openEdit = useCallback((item) => {
    setForm({
      title:        item.title,
      artifactType: item.artifactType,
      path:         item.path || '',
      commands:     item.commands || '',
      beforeProof:  item.beforeProof || '',
      afterProof:   item.afterProof || '',
      beforeImages: item.beforeImages || [],
      afterImages:  item.afterImages || [],
      notes:        item.notes || '',
      tags:         (item.tags || []).join(', '),
      status:       item.status || 'Pending',
    });
    setMode('edit');
  }, []);

  const cancelForm = useCallback(() => {
    setMode(selected ? 'detail' : 'board');
    setForm(EMPTY_FORM);
  }, [selected]);

  const handleImageChange = useCallback(async (e, field) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const resized = await Promise.all(files.map(resizeImage));
    setForm((p) => ({ ...p, [field]: [...p[field], ...resized] }));
    e.target.value = '';
  }, []);

  const removeImage = useCallback((field, idx) => {
    setForm((p) => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.title.trim() || !eng) return;
    setSaving(true);
    try {
      const body = {
        title:        form.title.trim(),
        artifactType: form.artifactType,
        path:         form.path,
        commands:     form.commands,
        beforeProof:  form.beforeProof,
        afterProof:   form.afterProof,
        beforeImages: form.beforeImages,
        afterImages:  form.afterImages,
        notes:        form.notes,
        tags:         form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        status:       form.status,
      };

      if (mode === 'add') {
        const res = await fetch(`${API}/cleanup/${eng._id}/cleanup`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
        });
        if (res.ok) {
          const created = await res.json();
          await fetchEngagements();
          setSelected(created._id);
          setMode('detail');
          setForm(EMPTY_FORM);
        }
      } else if (mode === 'edit' && selected) {
        const res = await fetch(`${API}/cleanup/${eng._id}/cleanup/${selected}`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
        });
        if (res.ok) {
          await fetchEngagements();
          setMode('detail');
          setForm(EMPTY_FORM);
        }
      }
    } finally {
      setSaving(false);
    }
  }, [form, mode, eng, selected, fetchEngagements]);

  const handleDelete = useCallback(async (id) => {
    if (!eng) return;
    const res = await fetch(`${API}/cleanup/${eng._id}/cleanup/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    if (res.ok) {
      await fetchEngagements();
      setSelected(null);
      setMode('board');
      setDeleteConfirm(null);
    }
  }, [eng, fetchEngagements]);

  const toggleStatus = useCallback(async (item) => {
    if (!eng) return;
    const res = await fetch(`${API}/cleanup/${eng._id}/cleanup/${item._id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ status: item.status === 'Pending' ? 'Cleaned' : 'Pending' }),
    });
    if (res.ok) await fetchEngagements();
  }, [eng, fetchEngagements]);

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = useCallback(({ active }) => setActiveId(active.id), []);

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const draggedItem = cleanup.find((c) => c._id === active.id);
    if (!draggedItem || over.id === draggedItem.status) return;
    await toggleStatus(draggedItem);
  }, [cleanup, toggleStatus]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!eng) return (
    <Flex align="center" justify="center" h="60vh">
      <Spinner color={ACCENT} />
    </Flex>
  );

  const showForm = mode === 'add' || mode === 'edit';

  return (
    <Box h="100%" display="flex" flexDirection="column" overflow="hidden">

      {/* ── Header ── */}
      <Flex align="center" justify="space-between" px={6} py={4} flexShrink={0}
        borderBottom="1px solid var(--dash-card-border)">
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Cleanup <Text as="span" color="red.400">Tracker</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · track artifacts for removal and verify post-engagement cleanup
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon />}
          bg={ACCENT_DIM} color={ACCENT} border={`1px solid ${ACCENT_BORDER}`}
          _hover={{ bg: ACCENT_GLOW }} borderRadius="8px" fontWeight="semibold"
          onClick={openAdd}>
          Log Artifact
        </Button>
      </Flex>

      {/* ── Stats bar ── */}
      <Flex px={6} py={3} gap={3} flexShrink={0}
        borderBottom="1px solid var(--dash-card-border)">
        <StatCard label="Total Artifacts" value={cleanup.length} />
        <StatCard label="Pending"         value={cleanup.filter((c) => c.status === 'Pending').length} color={PENDING_COLOR} />
        <StatCard label="Cleaned"         value={cleanup.filter((c) => c.status === 'Cleaned').length} color={CLEANED_COLOR} />
        <StatCard label="Fully Proven"    value={withBoth} color="#9F7AEA" />
      </Flex>

      {/* ── Main area ── */}
      <Box flex={1} overflow="hidden" display="flex" flexDirection="column">

        {/* ── Board view ── */}
        {mode === 'board' && (
          <Box flex={1} overflow="hidden" display="flex" flexDirection="column">
            {/* Search + filter */}
            <Flex px={6} py={3} gap={3} flexShrink={0} align="center"
              borderBottom="1px solid var(--dash-card-border)">
              <Flex align="center" gap={2} flex={1} maxW="260px"
                bg="rgba(255,255,255,0.05)" borderRadius="8px"
                border="1px solid rgba(255,255,255,0.1)" px={3} h="34px">
                <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
                <Input variant="unstyled" placeholder="Search artifacts..."
                  fontSize="xs" color="var(--dash-text-primary)"
                  _placeholder={{ color: 'var(--dash-text-muted)' }}
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </Flex>
              <Flex gap={1} flexWrap="wrap">
                {['all', ...ARTIFACT_TYPES.filter((t) => cleanup.some((c) => c.artifactType === t))].map((t) => {
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
                      onClick={() => setFilterType(t)}>
                      {isAll ? 'All' : t}
                    </Box>
                  );
                })}
              </Flex>
            </Flex>

            {/* Board columns */}
            {cleanup.length === 0 ? (
              <Flex flex={1} direction="column" align="center" justify="center" gap={3}
                color="var(--dash-text-muted)">
                <Box w="52px" h="52px" borderRadius="12px"
                  border={`2px solid ${ACCENT_BORDER}`} bg={ACCENT_DIM}
                  display="flex" alignItems="center" justifyContent="center">
                  <Box w="26px" h="22px" borderRadius="3px"
                    border={`2px solid ${ACCENT}`} position="relative">
                    <Box position="absolute" top="3px" left="3px" right="3px" h="2px"
                      borderRadius="full" bg={ACCENT} />
                    <Box position="absolute" top="8px" left="3px" right="3px" h="2px"
                      borderRadius="full" bg={`${ACCENT}80`} />
                  </Box>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="sm" fontWeight="semibold" color="var(--dash-text-secondary)">
                    Cleanup Tracker
                  </Text>
                  <Text fontSize="xs" mt={1}>
                    No artifacts logged yet — hit "Log Artifact" to start
                  </Text>
                </Box>
              </Flex>
            ) : (
              <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <Flex flex={1} gap={0} overflow="hidden">
                  {/* Pending column */}
                  <Box flex={1} px={6} py={4} overflowY="auto"
                    borderRight="1px solid var(--dash-card-border)">
                    <BoardColumn
                      title="Pending Cleanup" items={pending} dropId="Pending"
                      accentColor={PENDING_COLOR}
                      page={pendingPage} setPage={setPendingPage}
                      selected={selected}
                      onSelect={(id) => { setSelected(id); setMode('detail'); }}
                    />
                  </Box>
                  {/* Cleaned column */}
                  <Box flex={1} px={6} py={4} overflowY="auto">
                    <BoardColumn
                      title="Cleaned" items={cleaned} dropId="Cleaned"
                      accentColor={CLEANED_COLOR}
                      page={cleanedPage} setPage={setCleanedPage}
                      selected={selected}
                      onSelect={(id) => { setSelected(id); setMode('detail'); }}
                    />
                  </Box>
                </Flex>
                <DragOverlay dropAnimation={null}>
                  {activeId ? (
                    <Box opacity={0.92} transform="rotate(1.5deg)"
                      boxShadow="0 20px 40px rgba(0,0,0,0.55)" pointerEvents="none">
                      <BoardCard
                        item={cleanup.find((c) => c._id === activeId)}
                        isActive={false} onClick={() => {}}
                      />
                    </Box>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </Box>
        )}

        {/* ── Detail view ── */}
        {mode === 'detail' && selectedItem && (
          <Box flex={1} overflowY="auto" px={6} py={5}>
            {/* Top bar */}
            <Flex align="center" justify="space-between" mb={5} gap={4}>
              <Flex align="flex-start" gap={3}>
                <IconButton icon={<ArrowBackIcon />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" _hover={{ color: 'white' }} mt="2px"
                  aria-label="Back to board" onClick={() => { setSelected(null); setMode('board'); }} />
                <Box>
                  <Flex align="center" gap={2} mb={2}>
                    <TypeBadge type={selectedItem.artifactType} />
                    <StatusBadge status={selectedItem.status} />
                  </Flex>
                  <Heading fontSize="lg" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
                    {selectedItem.title}
                  </Heading>
                </Box>
              </Flex>
              <Flex gap={1} flexShrink={0}>
                {/* Toggle status */}
                <Button size="xs"
                  bg={selectedItem.status === 'Pending' ? 'rgba(104,211,145,0.1)' : 'rgba(252,129,129,0.1)'}
                  color={selectedItem.status === 'Pending' ? CLEANED_COLOR : PENDING_COLOR}
                  border={`1px solid ${selectedItem.status === 'Pending' ? 'rgba(104,211,145,0.3)' : 'rgba(252,129,129,0.3)'}`}
                  _hover={{ opacity: 0.85 }} borderRadius="7px"
                  onClick={() => toggleStatus(selectedItem)}>
                  {selectedItem.status === 'Pending' ? 'Mark Cleaned' : 'Mark Pending'}
                </Button>
                <IconButton icon={<EditIcon />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" _hover={{ color: ACCENT }}
                  aria-label="Edit" onClick={() => openEdit(selectedItem)} />
                {deleteConfirm === selectedItem._id ? (
                  <Flex align="center" gap={1}
                    bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
                    borderRadius="8px" px={2} py={1}>
                    <Text fontSize="xs" color="rgba(255,100,115,0.9)" whiteSpace="nowrap">Are you sure?</Text>
                    <IconButton icon={<CheckIcon />} size="xs" variant="ghost"
                      color="rgba(255,100,115,0.9)" _hover={{ bg: 'rgba(255,80,95,0.2)' }}
                      onClick={() => handleDelete(selectedItem._id)} />
                    <IconButton icon={<CloseIcon />} size="xs" variant="ghost"
                      color="var(--dash-text-muted)" _hover={{ bg: 'rgba(255,255,255,0.07)' }}
                      onClick={() => setDeleteConfirm(null)} />
                  </Flex>
                ) : (
                  <IconButton icon={<DeleteIcon />} size="xs" variant="ghost"
                    color="var(--dash-text-muted)"
                    _hover={{ color: 'rgba(255,100,115,0.9)', bg: 'rgba(255,80,95,0.08)' }}
                    aria-label="Delete" onClick={() => setDeleteConfirm(selectedItem._id)} />
                )}
              </Flex>
            </Flex>

            {/* Path */}
            {selectedItem.path && (
              <Box mb={5}>
                <SectionLabel>Path / Location</SectionLabel>
                <Box bg="rgba(0,0,0,0.3)" border="1px solid rgba(255,255,255,0.08)"
                  borderRadius="8px" px={3} py={2}
                  fontSize="xs" fontFamily="mono" color="var(--dash-text-secondary)">
                  {selectedItem.path}
                </Box>
              </Box>
            )}

            {/* Commands */}
            {selectedItem.commands && (
              <Box mb={5}>
                <SectionLabel>Commands Used</SectionLabel>
                <Box bg="rgba(0,0,0,0.35)" border="1px solid rgba(255,255,255,0.08)"
                  borderRadius="10px" px={4} py={3}
                  fontSize="xs" fontFamily="mono" color="var(--dash-text-secondary)"
                  whiteSpace="pre-wrap" wordBreak="break-word">
                  {selectedItem.commands}
                </Box>
              </Box>
            )}

            {/* Before / After proof side by side */}
            <Box mb={5}>
              <SectionLabel>Proof</SectionLabel>
              <Flex gap={3}>
                <ProofBlock
                  label="Before (artifact exists)"
                  color="#F6AD55"
                  text={selectedItem.beforeProof}
                  images={selectedItem.beforeImages}
                  onImageClick={(idx) => setLightbox({ open: true, images: selectedItem.beforeImages, index: idx })}
                />
                <ProofBlock
                  label="After (artifact removed)"
                  color={CLEANED_COLOR}
                  text={selectedItem.afterProof}
                  images={selectedItem.afterImages}
                  onImageClick={(idx) => setLightbox({ open: true, images: selectedItem.afterImages, index: idx })}
                />
              </Flex>
            </Box>

            {/* Notes */}
            {selectedItem.notes && (
              <Box mb={5}>
                <SectionLabel>Notes</SectionLabel>
                <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
                  borderRadius="10px" px={4} py={3}
                  fontSize="xs" color="var(--dash-text-secondary)"
                  whiteSpace="pre-wrap">
                  {selectedItem.notes}
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

            {/* Meta */}
            <Text fontSize="9px" color="var(--dash-text-muted)" mt={2}>
              Logged by {selectedItem.cleanedByCallsign || '—'} · {formatDate(selectedItem.createdAt)}
            </Text>
          </Box>
        )}

        {/* ── Add / Edit form ── */}
        {showForm && (
          <Box flex={1} overflowY="auto" px={6} py={5}>
            <Heading size="xs" color="var(--dash-text-primary)" mb={5}>
              {mode === 'add' ? 'Log New Artifact' : 'Edit Artifact'}
            </Heading>

            {/* Title + Type */}
            <Flex gap={3} mb={4}>
              <Box flex={2}>
                <SectionLabel>Title</SectionLabel>
                <Input {...inputSx} placeholder="e.g. Mimikatz binary dropped on DC01"
                  value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </Box>
              <Box flex={1}>
                <SectionLabel>Artifact Type</SectionLabel>
                <Select {...selSx} value={form.artifactType}
                  onChange={(e) => setForm((p) => ({ ...p, artifactType: e.target.value }))}>
                  {ARTIFACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Box>
              <Box flex={1}>
                <SectionLabel>Status</SectionLabel>
                <Select {...selSx} value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="Pending">Pending</option>
                  <option value="Cleaned">Cleaned</option>
                </Select>
              </Box>
            </Flex>

            {/* Path */}
            <Box mb={4}>
              <SectionLabel>Path / Location</SectionLabel>
              <Input {...inputSx} placeholder="e.g. C:\Windows\Temp\mimi.exe"
                fontFamily="mono" fontSize="xs"
                value={form.path} onChange={(e) => setForm((p) => ({ ...p, path: e.target.value }))} />
            </Box>

            {/* Commands */}
            <Box mb={4}>
              <SectionLabel>Commands Used</SectionLabel>
              <Textarea {...textareaSx} rows={4}
                placeholder="Commands run to place / remove the artifact..."
                value={form.commands} onChange={(e) => setForm((p) => ({ ...p, commands: e.target.value }))} />
            </Box>

            {/* Before / After proof */}
            <SimpleGrid columns={2} spacing={4} mb={4}>
              <Box>
                <SectionLabel>Before Proof (artifact exists)</SectionLabel>
                <Textarea {...textareaSx} rows={4}
                  placeholder="Output confirming the artifact is present..."
                  value={form.beforeProof}
                  onChange={(e) => setForm((p) => ({ ...p, beforeProof: e.target.value }))} />
              </Box>
              <Box>
                <SectionLabel>After Proof (artifact removed)</SectionLabel>
                <Textarea {...textareaSx} rows={4}
                  placeholder="Output confirming the artifact is gone..."
                  value={form.afterProof}
                  onChange={(e) => setForm((p) => ({ ...p, afterProof: e.target.value }))} />
              </Box>
            </SimpleGrid>

            {/* Image uploads */}
            <SimpleGrid columns={2} spacing={4} mb={4}>
              <ImageStrip label="Before Screenshots"
                images={form.beforeImages}
                fileInputRef={beforeFileRef}
                onAdd={(e) => handleImageChange(e, 'beforeImages')}
                onRemove={(idx) => removeImage('beforeImages', idx)} />
              <ImageStrip label="After Screenshots"
                images={form.afterImages}
                fileInputRef={afterFileRef}
                onAdd={(e) => handleImageChange(e, 'afterImages')}
                onRemove={(idx) => removeImage('afterImages', idx)} />
            </SimpleGrid>

            {/* Notes + Tags */}
            <Box mb={4}>
              <SectionLabel>Notes</SectionLabel>
              <Textarea {...textareaSx} rows={3}
                placeholder="Any additional notes..."
                value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </Box>
            <Box mb={6}>
              <SectionLabel>Tags (comma-separated)</SectionLabel>
              <Input {...inputSx} placeholder="e.g. dc01, mimikatz, persistence"
                value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
            </Box>

            {/* Actions */}
            <Flex gap={3}>
              <Button size="sm" bg={ACCENT_DIM} color={ACCENT}
                border={`1px solid ${ACCENT_BORDER}`} _hover={{ bg: ACCENT_GLOW }}
                borderRadius="8px" fontWeight="semibold"
                isLoading={saving} isDisabled={!form.title.trim()}
                onClick={handleSave}>
                {mode === 'add' ? 'Save' : 'Update'}
              </Button>
              <Button size="sm" variant="ghost" color="var(--dash-text-muted)"
                _hover={{ color: 'white' }} onClick={cancelForm}>
                Cancel
              </Button>
            </Flex>
          </Box>
        )}
      </Box>

      {/* ── Lightbox ── */}
      {lightbox.open && (
        <Lightbox
          images={lightbox.images} index={lightbox.index}
          onClose={() => setLightbox((l) => ({ ...l, open: false }))}
          onPrev={() => setLightbox((l) => ({ ...l, index: (l.index - 1 + l.images.length) % l.images.length }))}
          onNext={() => setLightbox((l) => ({ ...l, index: (l.index + 1) % l.images.length }))}
        />
      )}
    </Box>
  );
};

export default CleanupTrackerView;
