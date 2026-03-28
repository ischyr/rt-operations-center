import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select,
  Textarea, SimpleGrid, Spinner, Tooltip,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, EditIcon, CopyIcon, CheckIcon, CloseIcon,
  SearchIcon, StarIcon, ViewIcon, ViewOffIcon, LockIcon,
  ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon, InfoIcon,
  SettingsIcon, AttachmentIcon,
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

const ACCENT = '#9F7AEA';
const RED    = '#FC8181';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const ORANGE = '#F6AD55';
const YELLOW = '#ECC94B';
const CYAN   = '#76E4F7';
const PINK   = '#F687B3';

const CATEGORIES = [
  'Login', 'Server', 'API Key', 'SSH Key', 'Certificate',
  'Wi-Fi', 'Database', 'Note', 'Other',
];

const CAT_ICONS = {
  'Login':       LockIcon,
  'Server':      SettingsIcon,
  'API Key':     AttachmentIcon,
  'SSH Key':     LockIcon,
  'Certificate': CheckIcon,
  'Wi-Fi':       ExternalLinkIcon,
  'Database':    ViewIcon,
  'Note':        EditIcon,
  'Other':       InfoIcon,
};

const CAT_COLORS = {
  'Login':       { color: ACCENT, bg: 'rgba(159,122,234,0.1)' },
  'Server':      { color: BLUE,   bg: 'rgba(99,179,237,0.1)' },
  'API Key':     { color: ORANGE, bg: 'rgba(246,173,85,0.1)' },
  'SSH Key':     { color: CYAN,   bg: 'rgba(118,228,247,0.1)' },
  'Certificate': { color: GREEN,  bg: 'rgba(104,211,145,0.1)' },
  'Wi-Fi':       { color: PINK,   bg: 'rgba(246,135,179,0.1)' },
  'Database':    { color: YELLOW, bg: 'rgba(236,201,75,0.1)' },
  'Note':        { color: '#A0AEC0', bg: 'rgba(160,174,192,0.1)' },
  'Other':       { color: '#718096', bg: 'rgba(113,128,150,0.1)' },
};

const EMPTY_FORM = {
  title: '', category: 'Login', username: '', password: '',
  url: '', notes: '', tags: '', customFields: [], favorite: false,
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtRelative = (iso) => {
  if (!iso) return '';
  const diff  = Date.now() - new Date(iso);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ── Input styles ─────────────────────────────────────────────────────────────

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
  _hover: { border: `1px solid ${ACCENT}50` },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

const selSx = {
  bg: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px',
  h: '40px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  cursor: 'pointer',
  focusBorderColor: `${ACCENT}80`,
  _hover: { borderColor: `${ACCENT}50` },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

// ── Sub-components ───────────────────────────────────────────────────────────

const CategoryBadge = ({ cat, small }) => {
  const s = CAT_COLORS[cat] || CAT_COLORS['Other'];
  const Icon = CAT_ICONS[cat] || InfoIcon;
  return (
    <Flex align="center" gap={1}
      px={small ? 1.5 : 2} py="2px"
      borderRadius="5px"
      bg={s.bg} border={`1px solid ${s.color}35`}
      flexShrink={0}>
      <Icon boxSize={small ? 2.5 : 3} color={s.color} />
      <Text fontSize={small ? '9px' : '10px'} fontWeight="bold" color={s.color}>{cat}</Text>
    </Flex>
  );
};

const TagChip = ({ label }) => (
  <Box px={2} py="1px" borderRadius="4px"
    fontSize="10px" fontWeight="semibold"
    color="var(--dash-text-secondary)"
    bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)">
    {label}
  </Box>
);

const SecretField = ({ label, value, mono }) => {
  const [visible, setVisible] = useState(false);
  const [copied,  setCopied]  = useState(false);

  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box>
      <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
        textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
      <Flex align="center" gap={2} px={3} py={2} borderRadius="8px"
        bg="rgba(0,0,0,0.25)" border="1px solid rgba(255,255,255,0.06)">
        <Text flex={1} fontSize="13px" color="var(--dash-text-primary)"
          fontFamily={mono ? 'mono' : 'inherit'} noOfLines={1}
          letterSpacing={!visible && mono ? '2px' : 'normal'}>
          {visible ? value : '\u2022'.repeat(Math.min(value.length, 24))}
        </Text>
        <Tooltip label={visible ? 'Hide' : 'Show'} fontSize="10px">
          <IconButton
            icon={visible ? <ViewOffIcon boxSize={3.5} /> : <ViewIcon boxSize={3.5} />}
            size="xs" variant="ghost" color="var(--dash-text-muted)"
            _hover={{ color: ACCENT }}
            onClick={() => setVisible((p) => !p)}
            aria-label="Toggle visibility"
          />
        </Tooltip>
        <Tooltip label={copied ? 'Copied!' : 'Copy'} fontSize="10px">
          <IconButton
            icon={copied ? <CheckIcon boxSize={3} /> : <CopyIcon boxSize={3} />}
            size="xs" variant="ghost"
            color={copied ? GREEN : 'var(--dash-text-muted)'}
            _hover={{ color: copied ? GREEN : ACCENT }}
            onClick={handleCopy}
            aria-label="Copy"
          />
        </Tooltip>
      </Flex>
    </Box>
  );
};

const CopyableField = ({ label, value, mono }) => {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box>
      <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
        textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
      <Flex align="center" gap={2} px={3} py={2} borderRadius="8px"
        bg="rgba(0,0,0,0.15)" border="1px solid rgba(255,255,255,0.06)">
        <Text flex={1} fontSize="13px" color="var(--dash-text-primary)"
          fontFamily={mono ? 'mono' : 'inherit'} noOfLines={1}>
          {value}
        </Text>
        <Tooltip label={copied ? 'Copied!' : 'Copy'} fontSize="10px">
          <IconButton
            icon={copied ? <CheckIcon boxSize={3} /> : <CopyIcon boxSize={3} />}
            size="xs" variant="ghost"
            color={copied ? GREEN : 'var(--dash-text-muted)'}
            _hover={{ color: copied ? GREEN : ACCENT }}
            onClick={handleCopy}
            aria-label="Copy"
          />
        </Tooltip>
      </Flex>
    </Box>
  );
};

// ── Custom field editor ─────────────────────────────────────────────────────

const CustomFieldEditor = ({ fields, onChange }) => {
  const addField = () => onChange([...fields, { label: '', value: '', hidden: true }]);
  const removeField = (i) => onChange(fields.filter((_, idx) => idx !== i));
  const updateField = (i, key, val) => {
    const next = [...fields];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={2}>
        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
          textTransform="uppercase" letterSpacing="wider">Custom Fields</Text>
        <Button size="xs" variant="ghost" color={ACCENT} leftIcon={<AddIcon boxSize={2.5} />}
          onClick={addField} fontSize="10px">
          Add Field
        </Button>
      </Flex>
      <Flex direction="column" gap={2}>
        {fields.map((f, i) => (
          <Flex key={i} gap={2} align="center">
            <Input {...inputSx} placeholder="Label" value={f.label} flex={1}
              onChange={(e) => updateField(i, 'label', e.target.value)} h="34px" fontSize="12px" />
            <Input {...inputSx} placeholder="Value"
              type={f.hidden ? 'password' : 'text'}
              value={f.value} flex={2}
              onChange={(e) => updateField(i, 'value', e.target.value)} h="34px" fontSize="12px" />
            <Tooltip label={f.hidden ? 'Hidden' : 'Visible'} fontSize="10px">
              <IconButton icon={f.hidden ? <ViewOffIcon boxSize={3} /> : <ViewIcon boxSize={3} />}
                size="xs" variant="ghost" color="var(--dash-text-muted)"
                onClick={() => updateField(i, 'hidden', !f.hidden)} aria-label="Toggle" />
            </Tooltip>
            <IconButton icon={<CloseIcon boxSize={2} />}
              size="xs" variant="ghost" color="var(--dash-text-muted)" _hover={{ color: RED }}
              onClick={() => removeField(i)} aria-label="Remove" />
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

// ── Sidebar entry ───────────────────────────────────────────────────────────

const VaultSidebarItem = ({ entry, isSelected, onClick, onFavorite, onDelete }) => {
  const s = CAT_COLORS[entry.category] || CAT_COLORS['Other'];
  const Icon = CAT_ICONS[entry.category] || InfoIcon;

  return (
    <MotionBox
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      px={3} py={2.5} borderRadius="10px" cursor="pointer"
      bg={isSelected ? `${ACCENT}12` : 'rgba(255,255,255,0.02)'}
      border={isSelected ? `1px solid ${ACCENT}40` : '1px solid rgba(255,255,255,0.05)'}
      _hover={{ bg: isSelected ? `${ACCENT}18` : 'rgba(255,255,255,0.05)', borderColor: `${ACCENT}30` }}
      style={{ transition: 'all 0.12s' }}
      onClick={onClick}>
      <Flex align="center" gap={2.5}>
        <Flex w="32px" h="32px" borderRadius="8px" flexShrink={0}
          bg={s.bg} border={`1px solid ${s.color}30`}
          align="center" justify="center">
          <Icon boxSize={3.5} color={s.color} />
        </Flex>
        <Box flex={1} minW={0}>
          <Flex align="center" gap={1.5}>
            <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
              noOfLines={1} lineHeight="short">{entry.title}</Text>
            {entry.favorite && <StarIcon boxSize={2.5} color={YELLOW} />}
          </Flex>
          <Flex align="center" gap={1.5} mt={0.5}>
            <Text fontSize="9px" color={s.color} fontWeight="semibold">{entry.category}</Text>
            {entry.username && (
              <Text fontSize="9px" color="var(--dash-text-muted)" fontFamily="mono" noOfLines={1}>
                {entry.username}
              </Text>
            )}
          </Flex>
        </Box>
        <Flex direction="column" gap={0.5} flexShrink={0}>
          <IconButton icon={<StarIcon boxSize={2.5} />} size="xs" variant="ghost"
            color={entry.favorite ? YELLOW : 'var(--dash-text-muted)'}
            _hover={{ color: YELLOW }}
            onClick={(e) => { e.stopPropagation(); onFavorite(entry._id); }}
            aria-label="Favorite" />
        </Flex>
      </Flex>
    </MotionBox>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

const TeamVaultView = () => {
  const { slug } = useParams();
  const { getBySlug, fetchEngagements } = useEngagements();
  const { user } = useAuth();
  const eng = getBySlug(slug);

  const [selected,      setSelected]      = useState(null);
  const [mode,          setMode]          = useState('view');   // view | edit | add
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);
  const [search,        setSearch]        = useState('');
  const [filterCat,     setFilterCat]     = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showFavsOnly,  setShowFavsOnly]  = useState(false);

  const vault = eng?.vault || [];

  // ── Filtering ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => vault.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      item.title.toLowerCase().includes(q) ||
      (item.username || '').toLowerCase().includes(q) ||
      (item.url || '').toLowerCase().includes(q) ||
      (item.notes || '').toLowerCase().includes(q) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(q));
    const matchCat = filterCat === 'all' || item.category === filterCat;
    const matchFav = !showFavsOnly || item.favorite;
    return matchSearch && matchCat && matchFav;
  }), [vault, search, filterCat, showFavsOnly]);

  // Sort: favorites first, then by updatedAt
  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }), [filtered]);

  // Stats
  const stats = useMemo(() => {
    const catCounts = {};
    CATEGORIES.forEach((c) => { catCounts[c] = 0; });
    vault.forEach((v) => { catCounts[v.category] = (catCounts[v.category] || 0) + 1; });
    const recentEntries = [...vault]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
    const operators = {};
    vault.forEach((v) => {
      if (v.createdByCallsign) operators[v.createdByCallsign] = (operators[v.createdByCallsign] || 0) + 1;
    });
    return {
      total:     vault.length,
      favorites: vault.filter((v) => v.favorite).length,
      logins:    vault.filter((v) => v.category === 'Login').length,
      recent:    vault.filter((v) => Date.now() - new Date(v.updatedAt) < 7 * 86400000).length,
      catCounts,
      recentEntries,
      operators,
    };
  }, [vault]);

  // ── CRUD ────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        tags: typeof form.tags === 'string'
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : form.tags,
      };
      await fetch(`${API}/vault/${eng._id}/vault`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      await fetchEngagements();
      setForm(EMPTY_FORM);
      setMode('view');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.title.trim() || !selected) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        tags: typeof form.tags === 'string'
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : form.tags,
      };
      await fetch(`${API}/vault/${eng._id}/vault/${selected}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
      });
      await fetchEngagements();
      setMode('view');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API}/vault/${eng._id}/vault/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      await fetchEngagements();
      if (selected === id) { setSelected(null); setMode('view'); }
      setDeleteConfirm(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      await fetch(`${API}/vault/${eng._id}/vault/${id}/favorite`, {
        method: 'PATCH', headers: authHeaders(),
      });
      await fetchEngagements();
    } catch (e) {
      console.error(e);
    }
  };

  const startAdd = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setMode('add');
  };

  const startEdit = (entry) => {
    setSelected(entry._id);
    setForm({
      title:        entry.title,
      category:     entry.category,
      username:     entry.username || '',
      password:     entry.password || '',
      url:          entry.url || '',
      notes:        entry.notes || '',
      tags:         (entry.tags || []).join(', '),
      customFields: entry.customFields || [],
      favorite:     entry.favorite || false,
    });
    setMode('edit');
  };

  const selectEntry = (entry) => {
    if (selected === entry._id) {
      setSelected(null);
    } else {
      setSelected(entry._id);
    }
    setMode('view');
  };

  const cancelEdit = () => {
    setMode('view');
    if (mode === 'add') setSelected(null);
  };

  const selectedEntry = vault.find((v) => v._id === selected);

  if (!eng) return (
    <Flex align="center" justify="center" h="60vh">
      <Spinner size="lg" color={ACCENT} />
    </Flex>
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Box px={6} pb={12}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Team <Text as="span" color="red.400">Vault</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · shared credential &amp; secret storage for the team
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon boxSize={3} />}
          bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
          borderRadius="8px" fontWeight="bold" fontSize="12px"
          _hover={{ bg: `${ACCENT}35` }}
          onClick={startAdd}>
          New Entry
        </Button>
      </Flex>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={5}>
        <StatCard label="Total Entries" value={stats.total}     color={ACCENT} />
        <StatCard label="Favorites"     value={stats.favorites} color={YELLOW} />
        <StatCard label="Logins"        value={stats.logins}    color={BLUE} />
        <StatCard label="This Week"     value={stats.recent}    color={GREEN} />
      </SimpleGrid>

      <Flex gap={6} align="flex-start" direction={{ base: 'column', xl: 'row' }}>

        {/* Left sidebar: entry list */}
        <Box w={{ base: '100%', xl: '320px' }} flexShrink={0}>

          {/* Search + filters */}
          <Flex gap={2} mb={3}>
            <Box flex={1} pos="relative">
              <Box pos="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                <SearchIcon boxSize={3.5} color="var(--dash-text-muted)" />
              </Box>
              <Input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vault…"
                {...inputSx} pl={9} h="36px" fontSize="12px"
              />
            </Box>
            <Tooltip label={showFavsOnly ? 'Show all' : 'Favorites only'} fontSize="10px">
              <IconButton
                icon={<StarIcon boxSize={3} />} size="sm"
                variant="ghost" borderRadius="8px"
                color={showFavsOnly ? YELLOW : 'var(--dash-text-muted)'}
                border={showFavsOnly ? `1px solid ${YELLOW}50` : '1px solid rgba(255,255,255,0.08)'}
                bg={showFavsOnly ? `${YELLOW}15` : 'transparent'}
                _hover={{ color: YELLOW }}
                onClick={() => setShowFavsOnly((p) => !p)}
                aria-label="Filter favorites"
              />
            </Tooltip>
          </Flex>

          <Select size="sm" mb={3} {...selSx} h="34px" fontSize="12px" borderRadius="8px"
            value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>

          {/* Entry list */}
          <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="14px" overflow="hidden">
            <Flex align="center" gap={2} px={4} py={3}
              borderBottom="1px solid var(--dash-card-border)">
              <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" flex={1}>
                Entries
              </Text>
              <Text fontSize="10px" color="var(--dash-text-muted)">
                {sorted.length} / {vault.length}
              </Text>
            </Flex>

            <Box px={2} py={2} maxH="calc(100vh - 420px)" overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { width: '3px' },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '3px' },
              }}>
              {sorted.length === 0 ? (
                <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" py={6}>
                  {vault.length === 0 ? 'No entries yet — click "New Entry" to add one' : 'No entries match your filters'}
                </Text>
              ) : (
                <Flex direction="column" gap={1.5}>
                  {sorted.map((entry) => (
                    <VaultSidebarItem
                      key={entry._id}
                      entry={entry}
                      isSelected={selected === entry._id}
                      onClick={() => selectEntry(entry)}
                      onFavorite={handleToggleFavorite}
                      onDelete={handleDelete}
                    />
                  ))}
                </Flex>
              )}
            </Box>
          </Box>
        </Box>

        {/* Right: detail / form */}
        <Box flex={1} minW={0}>
          <AnimatePresence mode="wait">

            {/* ── Add / Edit form ── */}
            {(mode === 'add' || mode === 'edit') && (
              <MotionBox key="form"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="14px" pos="relative">
                <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
                  style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />

                <Box px={6} py={5}>
                  <Flex direction="column" gap={5}>

                    {/* Title */}
                    <Box>
                      <Flex align="center" gap={2} mb={2}>
                        <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
                        <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                          textTransform="uppercase" letterSpacing="wider">Title *</Text>
                      </Flex>
                      <Input {...inputSx} placeholder="e.g. Domain Admin"
                        value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </Box>

                    {/* Category + Username */}
                    <SimpleGrid columns={2} gap={4}>
                      <Box>
                        <Flex align="center" gap={2} mb={2}>
                          <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
                          <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                            textTransform="uppercase" letterSpacing="wider">Category</Text>
                        </Flex>
                        <Select {...selSx} value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                      </Box>
                      <Box>
                        <Flex align="center" gap={2} mb={2}>
                          <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
                          <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                            textTransform="uppercase" letterSpacing="wider">Username</Text>
                        </Flex>
                        <Input {...inputSx} placeholder="admin"
                          value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                      </Box>
                    </SimpleGrid>

                    {/* Password + URL */}
                    <SimpleGrid columns={2} gap={4}>
                      <Box>
                        <Flex align="center" gap={2} mb={2}>
                          <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
                          <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                            textTransform="uppercase" letterSpacing="wider">Password / Secret</Text>
                        </Flex>
                        <Input {...inputSx} placeholder="••••••••" type="password"
                          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                      </Box>
                      <Box>
                        <Flex align="center" gap={2} mb={2}>
                          <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
                          <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                            textTransform="uppercase" letterSpacing="wider">URL</Text>
                        </Flex>
                        <Input {...inputSx} placeholder="https://target.example.com/login"
                          value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                      </Box>
                    </SimpleGrid>

                    {/* Notes */}
                    <Box>
                      <Flex align="center" gap={2} mb={2}>
                        <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
                        <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                          textTransform="uppercase" letterSpacing="wider">Notes</Text>
                      </Flex>
                      <Textarea
                        value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Additional notes…"
                        bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                        borderRadius="10px" fontSize="sm" color="var(--dash-text-primary)"
                        _placeholder={{ color: 'var(--dash-text-muted)' }}
                        _hover={{ borderColor: `${ACCENT}50` }}
                        _focus={{ borderColor: `${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` }}
                        rows={4} resize="vertical"
                      />
                    </Box>

                    {/* Tags */}
                    <Box>
                      <Flex align="center" gap={2} mb={2}>
                        <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
                        <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                          textTransform="uppercase" letterSpacing="wider">Tags (comma-separated)</Text>
                      </Flex>
                      <Input {...inputSx} placeholder="dc, admin, prod"
                        value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                    </Box>

                    {/* Custom fields */}
                    <CustomFieldEditor
                      fields={form.customFields}
                      onChange={(fields) => setForm({ ...form, customFields: fields })}
                    />

                    {/* Actions */}
                    <Flex gap={3} pt={1}>
                      <Button
                        size="sm" borderRadius="10px"
                        bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                        _hover={{ bg: `${ACCENT}35` }} fontWeight="bold" fontSize="12px"
                        isLoading={saving} loadingText="Saving…"
                        onClick={mode === 'add' ? handleAdd : handleUpdate}>
                        {mode === 'add' ? 'Save' : 'Save Changes'}
                      </Button>
                      <Button size="sm" borderRadius="10px" variant="ghost"
                        color="var(--dash-text-muted)" fontSize="12px"
                        _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                        onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </Flex>
                  </Flex>
                </Box>
              </MotionBox>
            )}

            {/* ── View entry detail ── */}
            {mode === 'view' && selectedEntry && (
              <MotionBox key={`view-${selected}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="14px" overflow="hidden" pos="relative">

                {/* Accent line */}
                <Box pos="absolute" top={0} left={0} right={0} h="2px"
                  style={{ background: `linear-gradient(to right, transparent, ${(CAT_COLORS[selectedEntry.category] || CAT_COLORS['Other']).color}80, transparent)` }} />

                {/* Header */}
                <Flex align="center" gap={3} px={5} py={4}
                  borderBottom="1px solid var(--dash-card-border)">
                  {(() => {
                    const s = CAT_COLORS[selectedEntry.category] || CAT_COLORS['Other'];
                    const Icon = CAT_ICONS[selectedEntry.category] || InfoIcon;
                    return (
                      <Flex w="40px" h="40px" borderRadius="10px" flexShrink={0}
                        bg={s.bg} border={`1px solid ${s.color}40`}
                        align="center" justify="center">
                        <Icon boxSize={4} color={s.color} />
                      </Flex>
                    );
                  })()}
                  <Box flex={1}>
                    <Flex align="center" gap={2}>
                      <Text fontSize="16px" fontWeight="bold" color="var(--dash-text-primary)">
                        {selectedEntry.title}
                      </Text>
                      {selectedEntry.favorite && <StarIcon boxSize={3} color={YELLOW} />}
                    </Flex>
                    <Flex align="center" gap={2} mt={0.5}>
                      <CategoryBadge cat={selectedEntry.category} small />
                      <Text fontSize="10px" color="var(--dash-text-muted)">
                        {fmtRelative(selectedEntry.updatedAt)}
                      </Text>
                      {selectedEntry.createdByCallsign && (
                        <Text fontSize="10px" color="var(--dash-text-muted)">
                          by {selectedEntry.createdByCallsign}
                        </Text>
                      )}
                    </Flex>
                  </Box>
                  <Flex gap={1}>
                    <Tooltip label="Edit" fontSize="10px">
                      <IconButton icon={<EditIcon boxSize={3.5} />}
                        size="sm" variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
                        border="1px solid rgba(255,255,255,0.08)"
                        _hover={{ color: ACCENT, borderColor: `${ACCENT}40` }}
                        onClick={() => startEdit(selectedEntry)}
                        aria-label="Edit" />
                    </Tooltip>
                    {deleteConfirm === selectedEntry._id ? (
                      <Flex gap={1}>
                        <IconButton icon={<CheckIcon boxSize={3} />}
                          size="sm" variant="ghost" color={RED} borderRadius="8px"
                          border={`1px solid ${RED}40`}
                          _hover={{ bg: `${RED}15` }}
                          onClick={() => handleDelete(selectedEntry._id)}
                          aria-label="Confirm delete" />
                        <IconButton icon={<CloseIcon boxSize={2.5} />}
                          size="sm" variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
                          border="1px solid rgba(255,255,255,0.08)"
                          onClick={() => setDeleteConfirm(null)}
                          aria-label="Cancel delete" />
                      </Flex>
                    ) : (
                      <Tooltip label="Delete" fontSize="10px">
                        <IconButton icon={<DeleteIcon boxSize={3} />}
                          size="sm" variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
                          border="1px solid rgba(255,255,255,0.08)"
                          _hover={{ color: RED, borderColor: `${RED}40` }}
                          onClick={() => setDeleteConfirm(selectedEntry._id)}
                          aria-label="Delete" />
                      </Tooltip>
                    )}
                  </Flex>
                </Flex>

                {/* Detail body */}
                <Box px={5} py={5}>
                  <Flex direction="column" gap={4}>

                    {/* Credentials section */}
                    <CopyableField label="Username" value={selectedEntry.username} mono />
                    <SecretField label="Password / Secret" value={selectedEntry.password} mono />

                    {/* URL */}
                    {selectedEntry.url && (
                      <Box>
                        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                          textTransform="uppercase" letterSpacing="wider" mb={1}>URL</Text>
                        <Flex align="center" gap={2} px={3} py={2} borderRadius="8px"
                          bg="rgba(0,0,0,0.15)" border="1px solid rgba(255,255,255,0.06)">
                          <Text flex={1} fontSize="13px" color={BLUE} fontFamily="mono" noOfLines={1}>
                            {selectedEntry.url}
                          </Text>
                          <Tooltip label="Open" fontSize="10px">
                            <IconButton
                              as="a" href={selectedEntry.url} target="_blank" rel="noopener noreferrer"
                              icon={<ExternalLinkIcon boxSize={3} />}
                              size="xs" variant="ghost" color="var(--dash-text-muted)"
                              _hover={{ color: BLUE }}
                              aria-label="Open URL" />
                          </Tooltip>
                        </Flex>
                      </Box>
                    )}

                    {/* Custom fields */}
                    {selectedEntry.customFields?.length > 0 && (
                      <Box>
                        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                          textTransform="uppercase" letterSpacing="wider" mb={2}>Custom Fields</Text>
                        <Flex direction="column" gap={2}>
                          {selectedEntry.customFields.map((cf, i) => (
                            cf.hidden
                              ? <SecretField key={i} label={cf.label || `Field ${i + 1}`} value={cf.value} mono />
                              : <CopyableField key={i} label={cf.label || `Field ${i + 1}`} value={cf.value} mono />
                          ))}
                        </Flex>
                      </Box>
                    )}

                    {/* Notes */}
                    {selectedEntry.notes && (
                      <Box>
                        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                          textTransform="uppercase" letterSpacing="wider" mb={1}>Notes</Text>
                        <Box px={3} py={2.5} borderRadius="8px"
                          bg="rgba(0,0,0,0.15)" border="1px solid rgba(255,255,255,0.06)">
                          <Text fontSize="12px" color="var(--dash-text-secondary)"
                            whiteSpace="pre-wrap" lineHeight="tall">
                            {selectedEntry.notes}
                          </Text>
                        </Box>
                      </Box>
                    )}

                    {/* Tags */}
                    {selectedEntry.tags?.length > 0 && (
                      <Box>
                        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                          textTransform="uppercase" letterSpacing="wider" mb={1.5}>Tags</Text>
                        <Flex gap={1.5} flexWrap="wrap">
                          {selectedEntry.tags.map((t) => <TagChip key={t} label={t} />)}
                        </Flex>
                      </Box>
                    )}

                    {/* Meta */}
                    <Flex gap={4} pt={2} borderTop="1px solid var(--dash-card-border)" flexWrap="wrap">
                      <Text fontSize="10px" color="var(--dash-text-muted)">
                        Created: <Text as="span" color="var(--dash-text-secondary)">{fmtDate(selectedEntry.createdAt)}</Text>
                      </Text>
                      <Text fontSize="10px" color="var(--dash-text-muted)">
                        Updated: <Text as="span" color="var(--dash-text-secondary)">{fmtDate(selectedEntry.updatedAt)}</Text>
                      </Text>
                      {selectedEntry.createdByCallsign && (
                        <Text fontSize="10px" color="var(--dash-text-muted)">
                          By: <Text as="span" color="var(--dash-text-secondary)">{selectedEntry.createdByCallsign}</Text>
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                </Box>
              </MotionBox>
            )}

            {/* ── Mini dashboard / empty state ── */}
            {mode === 'view' && !selectedEntry && (
              <MotionBox key="dashboard"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                {vault.length === 0 ? (
                  /* True empty state */
                  <Flex direction="column" align="center" justify="center" gap={3} py={20}
                    color="var(--dash-text-muted)">
                    <Flex w="56px" h="56px" borderRadius="14px"
                      bg={`${ACCENT}12`} border={`2px solid ${ACCENT}40`}
                      align="center" justify="center">
                      <LockIcon boxSize={5} color={ACCENT} />
                    </Flex>
                    <Box textAlign="center">
                      <Text fontSize="sm" fontWeight="semibold" color="var(--dash-text-secondary)">
                        Team Vault
                      </Text>
                      <Text fontSize="xs" mt={1} maxW="300px">
                        Store credentials, API keys, SSH keys, and secrets shared across the team
                      </Text>
                    </Box>
                    <Button size="sm" leftIcon={<AddIcon boxSize={3} />} mt={2}
                      bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                      borderRadius="8px" fontWeight="bold" fontSize="12px"
                      _hover={{ bg: `${ACCENT}35` }}
                      onClick={startAdd}>
                      Add First Entry
                    </Button>
                  </Flex>
                ) : (
                  /* Mini dashboard */
                  <Flex direction="column" gap={5}>

                    {/* Category breakdown */}
                    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                      borderRadius="14px" overflow="hidden" pos="relative">
                      <Box pos="absolute" top={0} left={0} right={0} h="2px"
                        style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />
                      <Flex align="center" gap={2} px={5} py={3}
                        borderBottom="1px solid var(--dash-card-border)">
                        <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
                        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                          textTransform="uppercase" letterSpacing="wider">Categories</Text>
                      </Flex>
                      <Box px={5} py={4}>
                        <Flex direction="column" gap={2.5}>
                          {CATEGORIES.filter((c) => stats.catCounts[c] > 0).map((cat) => {
                            const s = CAT_COLORS[cat] || CAT_COLORS['Other'];
                            const Icon = CAT_ICONS[cat] || InfoIcon;
                            const count = stats.catCounts[cat];
                            const pct = Math.round((count / stats.total) * 100);
                            return (
                              <Flex key={cat} align="center" gap={3}>
                                <Flex w="28px" h="28px" borderRadius="7px" flexShrink={0}
                                  bg={s.bg} border={`1px solid ${s.color}30`}
                                  align="center" justify="center">
                                  <Icon boxSize={3} color={s.color} />
                                </Flex>
                                <Box flex={1} minW={0}>
                                  <Flex align="center" justify="space-between" mb={1}>
                                    <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)">{cat}</Text>
                                    <Text fontSize="11px" fontWeight="bold" color={s.color}>{count}</Text>
                                  </Flex>
                                  <Box h="4px" borderRadius="full" bg="rgba(255,255,255,0.06)" overflow="hidden">
                                    <Box h="100%" borderRadius="full" bg={s.color}
                                      style={{ width: `${pct}%`, transition: 'width 0.5s ease-out' }} />
                                  </Box>
                                </Box>
                              </Flex>
                            );
                          })}
                          {CATEGORIES.every((c) => !stats.catCounts[c]) && (
                            <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" py={2}>
                              No entries yet
                            </Text>
                          )}
                        </Flex>
                      </Box>
                    </Box>

                    {/* Recent entries */}
                    {stats.recentEntries.length > 0 && (
                      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                        borderRadius="14px" overflow="hidden" pos="relative">
                        <Box pos="absolute" top={0} left={0} right={0} h="2px"
                          style={{ background: `linear-gradient(to right, transparent, ${BLUE}80, transparent)` }} />
                        <Flex align="center" gap={2} px={5} py={3}
                          borderBottom="1px solid var(--dash-card-border)">
                          <Box w="3px" h="12px" borderRadius="full" bg={BLUE} />
                          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                            textTransform="uppercase" letterSpacing="wider">Recent Activity</Text>
                        </Flex>
                        <Box px={3} py={3}>
                          <Flex direction="column" gap={1.5}>
                            {stats.recentEntries.map((entry) => {
                              const s = CAT_COLORS[entry.category] || CAT_COLORS['Other'];
                              const Icon = CAT_ICONS[entry.category] || InfoIcon;
                              return (
                                <Flex key={entry._id} align="center" gap={2.5}
                                  px={3} py={2} borderRadius="8px" cursor="pointer"
                                  bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)"
                                  _hover={{ bg: 'rgba(255,255,255,0.05)', borderColor: `${ACCENT}30` }}
                                  style={{ transition: 'all 0.12s' }}
                                  onClick={() => selectEntry(entry)}>
                                  <Flex w="26px" h="26px" borderRadius="6px" flexShrink={0}
                                    bg={s.bg} border={`1px solid ${s.color}25`}
                                    align="center" justify="center">
                                    <Icon boxSize={2.5} color={s.color} />
                                  </Flex>
                                  <Box flex={1} minW={0}>
                                    <Flex align="center" gap={1.5}>
                                      <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={1}>
                                        {entry.title}
                                      </Text>
                                      {entry.favorite && <StarIcon boxSize={2} color={YELLOW} />}
                                    </Flex>
                                    <Flex align="center" gap={2} mt={0.5}>
                                      <Text fontSize="9px" color={s.color} fontWeight="semibold">{entry.category}</Text>
                                      {entry.username && (
                                        <Text fontSize="9px" color="var(--dash-text-muted)" fontFamily="mono" noOfLines={1}>
                                          {entry.username}
                                        </Text>
                                      )}
                                    </Flex>
                                  </Box>
                                  <Text fontSize="9px" color="var(--dash-text-muted)" flexShrink={0}>
                                    {fmtRelative(entry.updatedAt)}
                                  </Text>
                                </Flex>
                              );
                            })}
                          </Flex>
                        </Box>
                      </Box>
                    )}

                    {/* Contributors */}
                    {Object.keys(stats.operators).length > 0 && (
                      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                        borderRadius="14px" overflow="hidden" pos="relative">
                        <Box pos="absolute" top={0} left={0} right={0} h="2px"
                          style={{ background: `linear-gradient(to right, transparent, ${GREEN}80, transparent)` }} />
                        <Flex align="center" gap={2} px={5} py={3}
                          borderBottom="1px solid var(--dash-card-border)">
                          <Box w="3px" h="12px" borderRadius="full" bg={GREEN} />
                          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                            textTransform="uppercase" letterSpacing="wider">Contributors</Text>
                        </Flex>
                        <Box px={5} py={4}>
                          <Flex gap={3} flexWrap="wrap">
                            {Object.entries(stats.operators)
                              .sort(([, a], [, b]) => b - a)
                              .map(([name, count]) => (
                                <Flex key={name} align="center" gap={2}
                                  px={3} py={2} borderRadius="8px"
                                  bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)">
                                  <Flex w="24px" h="24px" borderRadius="full" flexShrink={0}
                                    bg={`${GREEN}18`} border={`1px solid ${GREEN}35`}
                                    align="center" justify="center">
                                    <Text fontSize="10px" fontWeight="bold" color={GREEN}>
                                      {name.charAt(0).toUpperCase()}
                                    </Text>
                                  </Flex>
                                  <Box>
                                    <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)">{name}</Text>
                                    <Text fontSize="9px" color="var(--dash-text-muted)">{count} entr{count !== 1 ? 'ies' : 'y'}</Text>
                                  </Box>
                                </Flex>
                              ))}
                          </Flex>
                        </Box>
                      </Box>
                    )}
                  </Flex>
                )}
              </MotionBox>
            )}

          </AnimatePresence>
        </Box>
      </Flex>
    </Box>
  );
};

// ── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color }) => {
  const c = color || ACCENT;
  return (
    <MotionBox flex={1} px={4} py={3} borderRadius="12px"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      pos="relative" overflow="hidden"
      whileHover={{ y: -2, boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px ${c}30` }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${c}99, transparent)` }} />
      <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
        textTransform="uppercase" letterSpacing="wider" mb={0.5}>{label}</Text>
      <Text fontSize="2xl" fontWeight="bold" color={c} lineHeight={1}>{value}</Text>
    </MotionBox>
  );
};

export default TeamVaultView;
