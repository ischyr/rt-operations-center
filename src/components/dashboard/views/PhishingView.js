import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select,
  Textarea, SimpleGrid, Spinner, Tooltip,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, EditIcon, CopyIcon, CheckIcon, CloseIcon,
  SearchIcon, ExternalLinkIcon, InfoIcon, SettingsIcon, EmailIcon,
  ViewIcon, ViewOffIcon, LockIcon, StarIcon, AttachmentIcon,
  ArrowUpIcon,
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
const CYAN   = '#76E4F7';
const PINK   = '#F687B3';

const WEB_CATEGORIES = ['Login Page', 'Portal', 'Document', 'Update', 'Survey', 'Custom'];
const EMAIL_CATEGORIES = ['Credential Harvest', 'Malware Delivery', 'Callback', 'Recon', 'Custom'];

const MODULES = [
  { key: 'web',    label: 'Web Templates',   icon: ExternalLinkIcon, color: BLUE },
  { key: 'email',  label: 'Email Templates',  icon: EmailIcon,        color: ORANGE },
  { key: 'config', label: 'Configuration',    icon: SettingsIcon,     color: ACCENT },
];

const fmtRelative = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ── Input styles ─────────────────────────────────────────────────────────────

const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT}50` },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

const selSx = {
  bg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px', h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  cursor: 'pointer', focusBorderColor: `${ACCENT}80`,
  _hover: { borderColor: `${ACCENT}50` },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

// ── Secret field (for config) ────────────────────────────────────────────────

const SecretInput = ({ value, onChange, placeholder }) => {
  const [visible, setVisible] = useState(false);
  return (
    <Flex gap={1} align="center">
      <Input {...inputSx} flex={1} type={visible ? 'text' : 'password'}
        placeholder={placeholder} value={value} onChange={onChange} />
      <IconButton icon={visible ? <ViewOffIcon boxSize={3} /> : <ViewIcon boxSize={3} />}
        size="sm" variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
        _hover={{ color: ACCENT }}
        onClick={() => setVisible((p) => !p)} aria-label="Toggle" />
    </Flex>
  );
};

// ── Template sidebar item ───────────────────────────────────────────────────

const TemplateSidebarItem = ({ item, isSelected, onClick, color }) => (
  <MotionBox
    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.15 }}
    px={3} py={2.5} borderRadius="10px" cursor="pointer"
    bg={isSelected ? `${color}12` : 'rgba(255,255,255,0.02)'}
    border={isSelected ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.05)'}
    _hover={{ bg: isSelected ? `${color}18` : 'rgba(255,255,255,0.05)', borderColor: `${color}30` }}
    style={{ transition: 'all 0.12s' }}
    onClick={onClick}>
    <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
      noOfLines={1} lineHeight="short">{item.title}</Text>
    <Flex align="center" gap={2} mt={0.5}>
      <Text fontSize="9px" color={color} fontWeight="semibold">{item.category}</Text>
      <Text fontSize="9px" color="var(--dash-text-muted)">{fmtRelative(item.updatedAt)}</Text>
    </Flex>
  </MotionBox>
);

// ── Fullscreen icon (expand arrows) ─────────────────────────────────────────

const ExpandIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </Box>
);

const ShrinkIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </Box>
);

// ── Mini dashboard for when no template selected ────────────────────────────

const TemplateDashboard = ({ templates, color, typeLabel, icon: Icon, categories, onStartAdd }) => {
  const catCounts = useMemo(() => {
    const counts = {};
    categories.forEach((c) => { counts[c] = 0; });
    templates.forEach((t) => { counts[t.category] = (counts[t.category] || 0) + 1; });
    return counts;
  }, [templates, categories]);

  const recent = useMemo(() =>
    [...templates].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
  [templates]);

  const total = templates.length;

  return (
    <Box>
      {/* Stats row */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={5}>
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="12px" p={4} pos="relative" overflow="hidden">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
          <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider" mb={1}>Total</Text>
          <Text fontSize="2xl" fontWeight="black" color={color}>{total}</Text>
          <Text fontSize="9px" color="var(--dash-text-muted)">templates</Text>
        </Box>
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="12px" p={4} pos="relative" overflow="hidden">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${GREEN}80, transparent)` }} />
          <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider" mb={1}>Categories</Text>
          <Text fontSize="2xl" fontWeight="black" color={GREEN}>
            {Object.values(catCounts).filter((c) => c > 0).length}
          </Text>
          <Text fontSize="9px" color="var(--dash-text-muted)">in use</Text>
        </Box>
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="12px" p={4} pos="relative" overflow="hidden">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${CYAN}80, transparent)` }} />
          <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider" mb={1}>Last Updated</Text>
          <Text fontSize="sm" fontWeight="bold" color={CYAN} mt={1}>
            {recent[0] ? fmtRelative(recent[0].updatedAt) : '—'}
          </Text>
          <Text fontSize="9px" color="var(--dash-text-muted)" noOfLines={1}>
            {recent[0]?.title || 'no templates'}
          </Text>
        </Box>
        <Flex bg="var(--dash-card-bg)" border={`1px dashed ${color}40`}
          borderRadius="12px" p={4} direction="column" align="center" justify="center"
          cursor="pointer" _hover={{ bg: `${color}08`, borderColor: `${color}60` }}
          transition="all 0.15s" onClick={onStartAdd}>
          <AddIcon boxSize={4} color={color} mb={1} />
          <Text fontSize="10px" fontWeight="bold" color={color}>New Template</Text>
        </Flex>
      </SimpleGrid>

      <Flex gap={4} direction={{ base: 'column', lg: 'row' }}>
        {/* Category breakdown */}
        <Box flex={1} bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="12px" overflow="hidden">
          <Flex align="center" gap={2} px={4} py={3}
            borderBottom="1px solid var(--dash-card-border)">
            <Box w="3px" h="10px" borderRadius="full" bg={color} />
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider">By Category</Text>
          </Flex>
          <Box px={4} py={3}>
            {categories.map((cat) => {
              const count = catCounts[cat] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <Flex key={cat} align="center" gap={3} mb={2.5}>
                  <Text fontSize="11px" color="var(--dash-text-secondary)" minW="120px"
                    noOfLines={1}>{cat}</Text>
                  <Box flex={1} h="6px" bg="rgba(255,255,255,0.05)" borderRadius="3px"
                    overflow="hidden">
                    <Box h="100%" w={`${pct}%`} bg={color} borderRadius="3px"
                      transition="width 0.3s" opacity={count > 0 ? 1 : 0.3} />
                  </Box>
                  <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                    minW="20px" textAlign="right">{count}</Text>
                </Flex>
              );
            })}
          </Box>
        </Box>

        {/* Recent templates */}
        <Box flex={1} bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="12px" overflow="hidden">
          <Flex align="center" gap={2} px={4} py={3}
            borderBottom="1px solid var(--dash-card-border)">
            <Box w="3px" h="10px" borderRadius="full" bg={CYAN} />
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider">Recent Templates</Text>
          </Flex>
          <Box px={4} py={2}>
            {recent.length === 0 ? (
              <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" py={4}>
                No templates yet — create your first one
              </Text>
            ) : recent.map((tpl) => (
              <Flex key={tpl._id} align="center" gap={3} py={2}
                borderBottom="1px solid rgba(255,255,255,0.04)">
                <Flex w="28px" h="28px" borderRadius="7px" bg={`${color}12`}
                  border={`1px solid ${color}30`} align="center" justify="center" flexShrink={0}>
                  <Icon boxSize={3} color={color} />
                </Flex>
                <Box flex={1} minW={0}>
                  <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)"
                    noOfLines={1}>{tpl.title}</Text>
                  <Text fontSize="9px" color="var(--dash-text-muted)">
                    {tpl.category} · {fmtDate(tpl.updatedAt)}
                  </Text>
                </Box>
                {tpl.createdByCallsign && (
                  <Text fontSize="9px" color="var(--dash-text-muted)">{tpl.createdByCallsign}</Text>
                )}
              </Flex>
            ))}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

// ── Debounced iframe preview ─────────────────────────────────────────────────

const IframePreview = ({ html }) => {
  const ref = useRef(null);
  const debounceRef = useRef(null);
  const latestHtml = useRef(html);
  latestHtml.current = html;

  const writeToFrame = useCallback((node) => {
    if (!node) return;
    const doc = node.contentDocument;
    if (doc) { doc.open(); doc.write(latestHtml.current || ''); doc.close(); }
  }, []);

  // Debounced update — 300ms after last change
  useEffect(() => {
    if (!ref.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => writeToFrame(ref.current), 300);
    return () => clearTimeout(debounceRef.current);
  }, [html, writeToFrame]);

  // Write immediately on mount via callback ref
  const setRef = useCallback((node) => {
    ref.current = node;
    if (node) writeToFrame(node);
  }, [writeToFrame]);

  return (
    <iframe ref={setRef} title="Preview"
      style={{ width: '100%', height: '100%', border: 'none' }}
      sandbox="allow-same-origin" />
  );
};

// ── Optimized code editor (plain textarea, no Chakra overhead) ──────────────

const CodeEditor = ({ value, onChange, readOnly }) => {
  const textareaRef = useRef(null);
  const isControlled = useRef(false);

  // Sync external value into textarea only when value changes from outside
  useEffect(() => {
    if (textareaRef.current && !isControlled.current) {
      textareaRef.current.value = value || '';
    }
    isControlled.current = false;
  }, [value]);

  const handleInput = useCallback((e) => {
    if (onChange) {
      isControlled.current = true;
      onChange(e.target.value);
    }
  }, [onChange]);

  return (
    <textarea
      ref={textareaRef}
      defaultValue={value || ''}
      onInput={handleInput}
      readOnly={readOnly}
      spellCheck={false}
      style={{
        width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none',
        background: 'rgba(0,0,0,0.3)', fontSize: '12px', color: '#e2e8f0',
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        padding: '16px', lineHeight: '1.65', tabSize: 2,
        boxSizing: 'border-box',
      }}
    />
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ── WEB TEMPLATES MODULE ────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const WebTemplatesModule = ({ eng, fetchEngagements }) => {
  const { user } = useAuth();
  const templates = eng?.phishingWebTemplates || [];

  const [selected, setSelected] = useState(null);
  const [mode,     setMode]     = useState('view');
  const [form,     setForm]     = useState({ title: '', description: '', html: '', category: 'Login Page', tags: '' });
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewMode, setPreviewMode] = useState('split');
  const [fullscreen, setFullscreen] = useState(false);
  const fileInputRef = useRef(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter((t) =>
      t.title.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)
    );
  }, [templates, search]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
  [filtered]);

  const selectedTpl = templates.find((t) => t._id === selected);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      await fetch(`${API}/phishing/${eng._id}/web`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      await fetchEngagements();
      setMode('view'); setForm({ title: '', description: '', html: '', category: 'Login Page', tags: '' });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!form.title.trim() || !selected) return;
    setSaving(true);
    try {
      const body = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      await fetch(`${API}/phishing/${eng._id}/web/${selected}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
      });
      await fetchEngagements();
      setMode('view');
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/phishing/${eng._id}/web/${id}`, { method: 'DELETE', headers: authHeaders() });
    await fetchEngagements();
    if (selected === id) { setSelected(null); setMode('view'); }
    setDeleteConfirm(null);
  };

  const startAdd = () => {
    setSelected(null);
    setForm({
      title: '', description: '',
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Login</title>\n  <style>\n    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }\n    .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }\n    h2 { margin-top: 0; }\n    input { width: 100%; padding: 10px; margin: 8px 0; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; }\n    button { width: 100%; padding: 12px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <h2>Sign In</h2>\n    <form>\n      <input type="email" placeholder="Email" />\n      <input type="password" placeholder="Password" />\n      <button type="submit">Sign In</button>\n    </form>\n  </div>\n</body>\n</html>',
      category: 'Login Page', tags: '',
    });
    setMode('add');
  };

  const startEdit = (tpl) => {
    setSelected(tpl._id);
    setForm({
      title: tpl.title, description: tpl.description || '',
      html: tpl.html || '', category: tpl.category || 'Login Page',
      tags: (tpl.tags || []).join(', '),
    });
    setMode('edit');
  };

  const selectTpl = (tpl) => {
    if (selected === tpl._id) setSelected(null);
    else setSelected(tpl._id);
    setMode('view');
  };

  const handleImportHTML = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const html = ev.target.result;
      if (mode === 'add' || mode === 'edit') {
        setForm((prev) => ({ ...prev, html }));
      } else {
        // Start add mode with imported HTML
        setSelected(null);
        setForm({
          title: file.name.replace(/\.html?$/i, ''), description: '',
          html, category: 'Custom', tags: '',
        });
        setMode('add');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentHtml = mode === 'view' ? (selectedTpl?.html || '') : form.html;
  const showEditor = mode === 'add' || mode === 'edit';

  const editorContent = (
    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius={fullscreen ? '0' : '14px'} overflow="hidden" pos="relative"
      h={fullscreen ? '100%' : 'auto'}>
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${BLUE}80, transparent)` }} />

      {/* Toolbar */}
      <Flex align="center" gap={2} px={4} py={3}
        borderBottom="1px solid var(--dash-card-border)" flexWrap="wrap">
        {showEditor ? (
          <>
            <Input {...inputSx} placeholder="Template title…" h="32px" fontSize="12px" maxW="200px"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Select {...selSx} h="32px" fontSize="11px" maxW="140px" borderRadius="8px"
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {WEB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input {...inputSx} placeholder="Tags (comma-sep)" h="32px" fontSize="11px" maxW="160px"
              value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </>
        ) : (
          <>
            <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" flex={1}>
              {selectedTpl?.title}
            </Text>
            <Box px={2} py="1px" borderRadius="4px" bg={`${BLUE}15`} border={`1px solid ${BLUE}30`}>
              <Text fontSize="9px" fontWeight="bold" color={BLUE}>{selectedTpl?.category}</Text>
            </Box>
          </>
        )}

        <Box flex={showEditor ? 1 : 'none'} />

        {/* Import HTML */}
        <input type="file" accept=".html,.htm" ref={fileInputRef}
          style={{ display: 'none' }} onChange={handleImportHTML} />
        {showEditor && (
          <Tooltip label="Import HTML file" fontSize="10px">
            <IconButton icon={<AttachmentIcon boxSize={3} />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="5px"
              _hover={{ color: BLUE, bg: `${BLUE}15` }}
              onClick={() => fileInputRef.current?.click()} aria-label="Import HTML" />
          </Tooltip>
        )}

        {/* View mode toggles */}
        <Flex gap={1} bg="rgba(255,255,255,0.04)" borderRadius="6px" p="2px">
          {['split', 'code', 'preview'].map((m) => (
            <Button key={m} size="xs" borderRadius="5px" px={2.5}
              bg={previewMode === m ? `${ACCENT}25` : 'transparent'}
              color={previewMode === m ? ACCENT : 'var(--dash-text-muted)'}
              fontSize="10px" fontWeight="bold" textTransform="capitalize"
              _hover={{ bg: previewMode === m ? `${ACCENT}35` : 'rgba(255,255,255,0.06)' }}
              onClick={() => setPreviewMode(m)}>
              {m}
            </Button>
          ))}
        </Flex>

        {/* Fullscreen toggle */}
        <Tooltip label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} fontSize="10px">
          <IconButton
            icon={fullscreen ? <ShrinkIcon boxSize="14px" /> : <ExpandIcon boxSize="14px" />}
            size="xs" variant="ghost" color="var(--dash-text-muted)" borderRadius="5px"
            _hover={{ color: ACCENT, bg: `${ACCENT}15` }}
            onClick={() => setFullscreen((p) => !p)} aria-label="Toggle fullscreen" />
        </Tooltip>

        {!showEditor && (
          <Flex gap={1}>
            <Tooltip label="Edit" fontSize="10px">
              <IconButton icon={<EditIcon boxSize={3} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" _hover={{ color: ACCENT }}
                onClick={() => selectedTpl && startEdit(selectedTpl)} aria-label="Edit" />
            </Tooltip>
            {deleteConfirm === selectedTpl?._id ? (
              <Flex gap={1}>
                <IconButton icon={<CheckIcon boxSize={2.5} />} size="xs" variant="ghost"
                  color={RED} onClick={() => handleDelete(selectedTpl._id)} aria-label="Confirm" />
                <IconButton icon={<CloseIcon boxSize={2} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" onClick={() => setDeleteConfirm(null)} aria-label="Cancel" />
              </Flex>
            ) : (
              <Tooltip label="Delete" fontSize="10px">
                <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" _hover={{ color: RED }}
                  onClick={() => setDeleteConfirm(selectedTpl?._id)} aria-label="Delete" />
              </Tooltip>
            )}
          </Flex>
        )}

        {showEditor && (
          <Flex gap={2}>
            <Button size="xs" borderRadius="6px" bg={`${ACCENT}20`} color={ACCENT}
              border={`1px solid ${ACCENT}50`} _hover={{ bg: `${ACCENT}35` }}
              fontWeight="bold" fontSize="11px"
              isLoading={saving} onClick={mode === 'add' ? handleAdd : handleUpdate}>
              {mode === 'add' ? 'Save' : 'Update'}
            </Button>
            <Button size="xs" variant="ghost" color="var(--dash-text-muted)" fontSize="11px"
              onClick={() => { setMode('view'); if (mode === 'add') setSelected(null); }}>
              Cancel
            </Button>
          </Flex>
        )}
      </Flex>

      {/* Code + Preview */}
      <Flex h={fullscreen ? 'calc(100vh - 60px)' : 'calc(100vh - 340px)'} minH="400px">
        {/* Code editor */}
        {(previewMode === 'split' || previewMode === 'code') && (
          <Box flex={1} minW={0} borderRight={previewMode === 'split' ? '1px solid var(--dash-card-border)' : 'none'}>
            <CodeEditor
              value={showEditor ? form.html : (selectedTpl?.html || '')}
              onChange={showEditor ? (val) => setForm((prev) => ({ ...prev, html: val })) : undefined}
              readOnly={!showEditor}
            />
          </Box>
        )}
        {/* Preview iframe */}
        {(previewMode === 'split' || previewMode === 'preview') && (
          <Box flex={1} minW={0} bg="white">
            <IframePreview html={currentHtml} />
          </Box>
        )}
      </Flex>
    </Box>
  );

  // Fullscreen overlay
  if (fullscreen && (showEditor || selectedTpl)) {
    return (
      <>
        <Box pos="fixed" top={0} left={0} right={0} bottom={0} bg="var(--dash-bg, #0d0d12)"
          zIndex={1500} overflow="hidden">
          {editorContent}
        </Box>
        {/* Hidden file input still needs to be in DOM */}
        <input type="file" accept=".html,.htm" ref={fileInputRef}
          style={{ display: 'none' }} onChange={handleImportHTML} />
      </>
    );
  }

  return (
    <Flex gap={5} align="flex-start" direction={{ base: 'column', xl: 'row' }} h="100%">

      {/* Template list */}
      <Box w={{ base: '100%', xl: '260px' }} flexShrink={0}>
        <Flex gap={2} mb={3}>
          <Box flex={1} pos="relative">
            <Box pos="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
              <SearchIcon boxSize={3.5} color="var(--dash-text-muted)" />
            </Box>
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…" {...inputSx} pl={9} h="34px" fontSize="11px" />
          </Box>
          <Tooltip label="Import HTML" fontSize="10px">
            <IconButton icon={<AttachmentIcon boxSize={3} />} size="sm" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="8px"
              border="1px solid rgba(255,255,255,0.1)"
              _hover={{ color: BLUE, bg: `${BLUE}10` }}
              onClick={() => fileInputRef.current?.click()} aria-label="Import" />
          </Tooltip>
          <Tooltip label="New template" fontSize="10px">
            <IconButton icon={<AddIcon boxSize={3} />} size="sm" variant="ghost"
              color={ACCENT} borderRadius="8px" border={`1px solid ${ACCENT}40`}
              _hover={{ bg: `${ACCENT}15` }} onClick={startAdd} aria-label="Add" />
          </Tooltip>
        </Flex>

        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="12px" overflow="hidden">
          <Flex align="center" gap={2} px={3} py={2.5}
            borderBottom="1px solid var(--dash-card-border)">
            <Box w="3px" h="10px" borderRadius="full" bg={BLUE} />
            <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider" flex={1}>Web Templates</Text>
            <Text fontSize="9px" color="var(--dash-text-muted)">{templates.length}</Text>
          </Flex>
          <Box px={2} py={2} maxH="calc(100vh - 380px)" overflowY="auto"
            css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '3px' } }}>
            {sorted.length === 0 ? (
              <Text fontSize="10px" color="var(--dash-text-muted)" textAlign="center" py={4}>
                {templates.length === 0 ? 'No templates yet' : 'No matches'}
              </Text>
            ) : (
              <Flex direction="column" gap={1.5}>
                {sorted.map((tpl) => (
                  <TemplateSidebarItem key={tpl._id} item={tpl} color={BLUE}
                    isSelected={selected === tpl._id} onClick={() => selectTpl(tpl)} />
                ))}
              </Flex>
            )}
          </Box>
        </Box>

        {/* Hidden file input */}
        <input type="file" accept=".html,.htm" ref={fileInputRef}
          style={{ display: 'none' }} onChange={handleImportHTML} />
      </Box>

      {/* Editor / Preview area */}
      <Box flex={1} minW={0}>
        {(showEditor || selectedTpl) ? editorContent : (
          <TemplateDashboard templates={templates} color={BLUE} typeLabel="Web"
            icon={ExternalLinkIcon} categories={WEB_CATEGORIES} onStartAdd={startAdd} />
        )}
      </Box>
    </Flex>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ── EMAIL TEMPLATES MODULE ──────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const EmailTemplatesModule = ({ eng, fetchEngagements }) => {
  const { user } = useAuth();
  const templates = eng?.phishingEmailTemplates || [];

  const [selected, setSelected] = useState(null);
  const [mode,     setMode]     = useState('view');
  const [form,     setForm]     = useState({
    title: '', description: '', subject: '', senderName: '', senderEmail: '',
    html: '', textBody: '', category: 'Credential Harvest', tags: '',
  });
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewMode, setPreviewMode] = useState('split');
  const [fullscreen, setFullscreen] = useState(false);
  const fileInputRef = useRef(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter((t) =>
      t.title.toLowerCase().includes(q) || (t.subject || '').toLowerCase().includes(q)
    );
  }, [templates, search]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
  [filtered]);

  const selectedTpl = templates.find((t) => t._id === selected);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      await fetch(`${API}/phishing/${eng._id}/email`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      await fetchEngagements();
      setMode('view'); setForm({ title: '', description: '', subject: '', senderName: '', senderEmail: '', html: '', textBody: '', category: 'Credential Harvest', tags: '' });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!form.title.trim() || !selected) return;
    setSaving(true);
    try {
      const body = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      await fetch(`${API}/phishing/${eng._id}/email/${selected}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
      });
      await fetchEngagements();
      setMode('view');
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/phishing/${eng._id}/email/${id}`, { method: 'DELETE', headers: authHeaders() });
    await fetchEngagements();
    if (selected === id) { setSelected(null); setMode('view'); }
    setDeleteConfirm(null);
  };

  const startAdd = () => {
    setSelected(null);
    setForm({
      title: '', description: '', subject: 'Action Required: Verify Your Account',
      senderName: 'IT Support', senderEmail: 'support@company.com',
      html: '<!DOCTYPE html>\n<html>\n<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <h2>Action Required</h2>\n  <p>Dear {{name}},</p>\n  <p>Please verify your account by clicking the link below:</p>\n  <p><a href="{{url}}" style="display: inline-block; padding: 12px 24px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px;">Verify Account</a></p>\n  <p>Best regards,<br/>IT Support</p>\n</body>\n</html>',
      textBody: '', category: 'Credential Harvest', tags: '',
    });
    setMode('add');
  };

  const startEdit = (tpl) => {
    setSelected(tpl._id);
    setForm({
      title: tpl.title, description: tpl.description || '',
      subject: tpl.subject || '', senderName: tpl.senderName || '',
      senderEmail: tpl.senderEmail || '', html: tpl.html || '',
      textBody: tpl.textBody || '', category: tpl.category || 'Credential Harvest',
      tags: (tpl.tags || []).join(', '),
    });
    setMode('edit');
  };

  const selectTpl = (tpl) => {
    if (selected === tpl._id) setSelected(null);
    else setSelected(tpl._id);
    setMode('view');
  };

  const handleImportHTML = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const html = ev.target.result;
      if (mode === 'add' || mode === 'edit') {
        setForm((prev) => ({ ...prev, html }));
      } else {
        setSelected(null);
        setForm({
          title: file.name.replace(/\.html?$/i, ''), description: '',
          subject: '', senderName: '', senderEmail: '',
          html, textBody: '', category: 'Custom', tags: '',
        });
        setMode('add');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentHtml = mode === 'view' ? (selectedTpl?.html || '') : form.html;
  const showEditor = mode === 'add' || mode === 'edit';

  const editorContent = (
    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius={fullscreen ? '0' : '14px'} overflow="hidden" pos="relative"
      h={fullscreen ? '100%' : 'auto'}>
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${ORANGE}80, transparent)` }} />

      {/* Toolbar */}
      <Flex align="center" gap={2} px={4} py={3}
        borderBottom="1px solid var(--dash-card-border)" flexWrap="wrap">
        {showEditor ? (
          <>
            <Input {...inputSx} placeholder="Template title…" h="32px" fontSize="12px" maxW="180px"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Select {...selSx} h="32px" fontSize="11px" maxW="150px" borderRadius="8px"
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {EMAIL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </>
        ) : (
          <>
            <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" flex={1}>
              {selectedTpl?.title}
            </Text>
            <Box px={2} py="1px" borderRadius="4px" bg={`${ORANGE}15`} border={`1px solid ${ORANGE}30`}>
              <Text fontSize="9px" fontWeight="bold" color={ORANGE}>{selectedTpl?.category}</Text>
            </Box>
          </>
        )}

        <Box flex={showEditor ? 1 : 'none'} />

        {/* Import HTML */}
        <input type="file" accept=".html,.htm" ref={fileInputRef}
          style={{ display: 'none' }} onChange={handleImportHTML} />
        {showEditor && (
          <Tooltip label="Import HTML file" fontSize="10px">
            <IconButton icon={<AttachmentIcon boxSize={3} />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="5px"
              _hover={{ color: ORANGE, bg: `${ORANGE}15` }}
              onClick={() => fileInputRef.current?.click()} aria-label="Import HTML" />
          </Tooltip>
        )}

        <Flex gap={1} bg="rgba(255,255,255,0.04)" borderRadius="6px" p="2px">
          {['split', 'code', 'preview'].map((m) => (
            <Button key={m} size="xs" borderRadius="5px" px={2.5}
              bg={previewMode === m ? `${ACCENT}25` : 'transparent'}
              color={previewMode === m ? ACCENT : 'var(--dash-text-muted)'}
              fontSize="10px" fontWeight="bold" textTransform="capitalize"
              _hover={{ bg: previewMode === m ? `${ACCENT}35` : 'rgba(255,255,255,0.06)' }}
              onClick={() => setPreviewMode(m)}>
              {m}
            </Button>
          ))}
        </Flex>

        {/* Fullscreen toggle */}
        <Tooltip label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} fontSize="10px">
          <IconButton
            icon={fullscreen ? <ShrinkIcon boxSize="14px" /> : <ExpandIcon boxSize="14px" />}
            size="xs" variant="ghost" color="var(--dash-text-muted)" borderRadius="5px"
            _hover={{ color: ACCENT, bg: `${ACCENT}15` }}
            onClick={() => setFullscreen((p) => !p)} aria-label="Toggle fullscreen" />
        </Tooltip>

        {!showEditor && (
          <Flex gap={1}>
            <Tooltip label="Edit" fontSize="10px">
              <IconButton icon={<EditIcon boxSize={3} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" _hover={{ color: ORANGE }}
                onClick={() => selectedTpl && startEdit(selectedTpl)} aria-label="Edit" />
            </Tooltip>
            {deleteConfirm === selectedTpl?._id ? (
              <Flex gap={1}>
                <IconButton icon={<CheckIcon boxSize={2.5} />} size="xs" variant="ghost"
                  color={RED} onClick={() => handleDelete(selectedTpl._id)} aria-label="Confirm" />
                <IconButton icon={<CloseIcon boxSize={2} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" onClick={() => setDeleteConfirm(null)} aria-label="Cancel" />
              </Flex>
            ) : (
              <Tooltip label="Delete" fontSize="10px">
                <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" _hover={{ color: RED }}
                  onClick={() => setDeleteConfirm(selectedTpl?._id)} aria-label="Delete" />
              </Tooltip>
            )}
          </Flex>
        )}

        {showEditor && (
          <Flex gap={2}>
            <Button size="xs" borderRadius="6px" bg={`${ACCENT}20`} color={ACCENT}
              border={`1px solid ${ACCENT}50`} _hover={{ bg: `${ACCENT}35` }}
              fontWeight="bold" fontSize="11px"
              isLoading={saving} onClick={mode === 'add' ? handleAdd : handleUpdate}>
              {mode === 'add' ? 'Save' : 'Update'}
            </Button>
            <Button size="xs" variant="ghost" color="var(--dash-text-muted)" fontSize="11px"
              onClick={() => { setMode('view'); if (mode === 'add') setSelected(null); }}>
              Cancel
            </Button>
          </Flex>
        )}
      </Flex>

      {/* Email metadata bar (when editing) */}
      {showEditor && (
        <Flex px={4} py={2.5} gap={3} borderBottom="1px solid var(--dash-card-border)"
          bg="rgba(0,0,0,0.1)" flexWrap="wrap">
          <Input {...inputSx} placeholder="Subject line" h="30px" fontSize="11px" flex={2} minW="160px"
            value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Input {...inputSx} placeholder="Sender name" h="30px" fontSize="11px" flex={1} minW="120px"
            value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} />
          <Input {...inputSx} placeholder="sender@email.com" h="30px" fontSize="11px" flex={1} minW="140px"
            value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} />
        </Flex>
      )}

      {/* Email metadata bar (when viewing) */}
      {!showEditor && selectedTpl && (selectedTpl.subject || selectedTpl.senderName || selectedTpl.senderEmail) && (
        <Flex px={4} py={2.5} gap={4} borderBottom="1px solid var(--dash-card-border)"
          bg="rgba(0,0,0,0.1)" flexWrap="wrap">
          {selectedTpl.subject && (
            <Text fontSize="11px" color="var(--dash-text-muted)">
              Subject: <Text as="span" color="var(--dash-text-primary)" fontWeight="semibold">{selectedTpl.subject}</Text>
            </Text>
          )}
          {selectedTpl.senderName && (
            <Text fontSize="11px" color="var(--dash-text-muted)">
              From: <Text as="span" color="var(--dash-text-primary)" fontWeight="semibold">
                {selectedTpl.senderName} {selectedTpl.senderEmail && `<${selectedTpl.senderEmail}>`}
              </Text>
            </Text>
          )}
        </Flex>
      )}

      {/* Code + Preview */}
      <Flex h={fullscreen ? `calc(100vh - ${showEditor ? '120px' : '60px'})` : 'calc(100vh - 400px)'} minH="350px">
        {(previewMode === 'split' || previewMode === 'code') && (
          <Box flex={1} minW={0} borderRight={previewMode === 'split' ? '1px solid var(--dash-card-border)' : 'none'}>
            <CodeEditor
              value={showEditor ? form.html : (selectedTpl?.html || '')}
              onChange={showEditor ? (val) => setForm((prev) => ({ ...prev, html: val })) : undefined}
              readOnly={!showEditor}
            />
          </Box>
        )}
        {(previewMode === 'split' || previewMode === 'preview') && (
          <Box flex={1} minW={0} bg="white">
            <IframePreview html={currentHtml} />
          </Box>
        )}
      </Flex>
    </Box>
  );

  // Fullscreen overlay
  if (fullscreen && (showEditor || selectedTpl)) {
    return (
      <>
        <Box pos="fixed" top={0} left={0} right={0} bottom={0} bg="var(--dash-bg, #0d0d12)"
          zIndex={1500} overflow="hidden">
          {editorContent}
        </Box>
        <input type="file" accept=".html,.htm" ref={fileInputRef}
          style={{ display: 'none' }} onChange={handleImportHTML} />
      </>
    );
  }

  return (
    <Flex gap={5} align="flex-start" direction={{ base: 'column', xl: 'row' }} h="100%">

      {/* Template list */}
      <Box w={{ base: '100%', xl: '260px' }} flexShrink={0}>
        <Flex gap={2} mb={3}>
          <Box flex={1} pos="relative">
            <Box pos="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
              <SearchIcon boxSize={3.5} color="var(--dash-text-muted)" />
            </Box>
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…" {...inputSx} pl={9} h="34px" fontSize="11px" />
          </Box>
          <Tooltip label="Import HTML" fontSize="10px">
            <IconButton icon={<AttachmentIcon boxSize={3} />} size="sm" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="8px"
              border="1px solid rgba(255,255,255,0.1)"
              _hover={{ color: ORANGE, bg: `${ORANGE}10` }}
              onClick={() => fileInputRef.current?.click()} aria-label="Import" />
          </Tooltip>
          <Tooltip label="New template" fontSize="10px">
            <IconButton icon={<AddIcon boxSize={3} />} size="sm" variant="ghost"
              color={ORANGE} borderRadius="8px" border={`1px solid ${ORANGE}40`}
              _hover={{ bg: `${ORANGE}15` }} onClick={startAdd} aria-label="Add" />
          </Tooltip>
        </Flex>

        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="12px" overflow="hidden">
          <Flex align="center" gap={2} px={3} py={2.5}
            borderBottom="1px solid var(--dash-card-border)">
            <Box w="3px" h="10px" borderRadius="full" bg={ORANGE} />
            <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider" flex={1}>Email Templates</Text>
            <Text fontSize="9px" color="var(--dash-text-muted)">{templates.length}</Text>
          </Flex>
          <Box px={2} py={2} maxH="calc(100vh - 380px)" overflowY="auto"
            css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '3px' } }}>
            {sorted.length === 0 ? (
              <Text fontSize="10px" color="var(--dash-text-muted)" textAlign="center" py={4}>
                {templates.length === 0 ? 'No templates yet' : 'No matches'}
              </Text>
            ) : (
              <Flex direction="column" gap={1.5}>
                {sorted.map((tpl) => (
                  <TemplateSidebarItem key={tpl._id} item={tpl} color={ORANGE}
                    isSelected={selected === tpl._id} onClick={() => selectTpl(tpl)} />
                ))}
              </Flex>
            )}
          </Box>
        </Box>

        {/* Hidden file input */}
        <input type="file" accept=".html,.htm" ref={fileInputRef}
          style={{ display: 'none' }} onChange={handleImportHTML} />
      </Box>

      {/* Editor / Preview */}
      <Box flex={1} minW={0}>
        {(showEditor || selectedTpl) ? editorContent : (
          <TemplateDashboard templates={templates} color={ORANGE} typeLabel="Email"
            icon={EmailIcon} categories={EMAIL_CATEGORIES} onStartAdd={startAdd} />
        )}
      </Box>
    </Flex>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ── CONFIGURATION MODULE ────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const ConfigModule = ({ eng, fetchEngagements }) => {
  const cfg = eng?.phishingConfig || {};
  const [form, setForm] = useState({
    smtpHost: '', smtpPort: 587, smtpUsername: '', smtpPassword: '', smtpTLS: true,
    senderEmail: '', senderName: '', domain: '', landingDomain: '',
    gophishUrl: '', gophishApiKey: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    setForm({
      smtpHost:       cfg.smtpHost       || '',
      smtpPort:       cfg.smtpPort       || 587,
      smtpUsername:    cfg.smtpUsername    || '',
      smtpPassword:   cfg.smtpPassword   || '',
      smtpTLS:        cfg.smtpTLS !== undefined ? cfg.smtpTLS : true,
      senderEmail:    cfg.senderEmail    || '',
      senderName:     cfg.senderName     || '',
      domain:         cfg.domain         || '',
      landingDomain:  cfg.landingDomain  || '',
      gophishUrl:     cfg.gophishUrl     || '',
      gophishApiKey:  cfg.gophishApiKey  || '',
      notes:          cfg.notes          || '',
    });
  }, [cfg.smtpHost, cfg.smtpPort, cfg.smtpUsername, cfg.smtpPassword, cfg.smtpTLS,
      cfg.senderEmail, cfg.senderName, cfg.domain, cfg.landingDomain,
      cfg.gophishUrl, cfg.gophishApiKey, cfg.notes]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${API}/phishing/${eng._id}/config`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(form),
      });
      await fetchEngagements();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const SectionTitle = ({ title, color, icon: Icon }) => (
    <Flex align="center" gap={2} mb={3}>
      <Flex w="28px" h="28px" borderRadius="7px" bg={`${color}15`} border={`1px solid ${color}35`}
        align="center" justify="center" flexShrink={0}>
        <Icon boxSize={3} color={color} />
      </Flex>
      <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)">{title}</Text>
    </Flex>
  );

  return (
    <Box maxW="800px">
      <Flex direction="column" gap={6}>

        {/* SMTP Configuration */}
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="14px" overflow="hidden" pos="relative">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${BLUE}80, transparent)` }} />
          <Box px={5} py={4}>
            <SectionTitle title="SMTP Server" color={BLUE} icon={SettingsIcon} />
            <Flex direction="column" gap={3}>
              <SimpleGrid columns={2} gap={3}>
                <Box>
                  <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                    textTransform="uppercase" letterSpacing="wider" mb={1.5}>SMTP Host</Text>
                  <Input {...inputSx} placeholder="smtp.gmail.com"
                    value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} />
                </Box>
                <Box>
                  <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                    textTransform="uppercase" letterSpacing="wider" mb={1.5}>Port</Text>
                  <Input {...inputSx} placeholder="587" type="number"
                    value={form.smtpPort} onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })} />
                </Box>
              </SimpleGrid>
              <SimpleGrid columns={2} gap={3}>
                <Box>
                  <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                    textTransform="uppercase" letterSpacing="wider" mb={1.5}>Username</Text>
                  <Input {...inputSx} placeholder="user@gmail.com"
                    value={form.smtpUsername} onChange={(e) => setForm({ ...form, smtpUsername: e.target.value })} />
                </Box>
                <Box>
                  <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                    textTransform="uppercase" letterSpacing="wider" mb={1.5}>Password</Text>
                  <SecretInput placeholder="App password" value={form.smtpPassword}
                    onChange={(e) => setForm({ ...form, smtpPassword: e.target.value })} />
                </Box>
              </SimpleGrid>
              <Button size="sm" variant="ghost" color="var(--dash-text-muted)" fontSize="11px"
                alignSelf="flex-start"
                onClick={() => setForm({ ...form, smtpTLS: !form.smtpTLS })}>
                {form.smtpTLS ? <CheckIcon boxSize={3} color={GREEN} mr={1.5} /> : <CloseIcon boxSize={2} color={RED} mr={1.5} />}
                TLS / STARTTLS
              </Button>
            </Flex>
          </Box>
        </Box>

        {/* Sender Identity */}
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="14px" overflow="hidden" pos="relative">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${ORANGE}80, transparent)` }} />
          <Box px={5} py={4}>
            <SectionTitle title="Sender Identity" color={ORANGE} icon={EmailIcon} />
            <SimpleGrid columns={2} gap={3}>
              <Box>
                <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider" mb={1.5}>Sender Name</Text>
                <Input {...inputSx} placeholder="IT Support"
                  value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} />
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider" mb={1.5}>Sender Email</Text>
                <Input {...inputSx} placeholder="support@company.com"
                  value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} />
              </Box>
            </SimpleGrid>
          </Box>
        </Box>

        {/* Domains */}
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="14px" overflow="hidden" pos="relative">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${GREEN}80, transparent)` }} />
          <Box px={5} py={4}>
            <SectionTitle title="Domains" color={GREEN} icon={ExternalLinkIcon} />
            <SimpleGrid columns={2} gap={3}>
              <Box>
                <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider" mb={1.5}>Sending Domain</Text>
                <Input {...inputSx} placeholder="mail.company-secure.com"
                  value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider" mb={1.5}>Landing Page Domain</Text>
                <Input {...inputSx} placeholder="login.company-secure.com"
                  value={form.landingDomain} onChange={(e) => setForm({ ...form, landingDomain: e.target.value })} />
              </Box>
            </SimpleGrid>
          </Box>
        </Box>

        {/* GoPhish Integration */}
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="14px" overflow="hidden" pos="relative">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />
          <Box px={5} py={4}>
            <SectionTitle title="GoPhish / Framework Integration" color={ACCENT} icon={LockIcon} />
            <SimpleGrid columns={2} gap={3} mb={3}>
              <Box>
                <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider" mb={1.5}>GoPhish URL</Text>
                <Input {...inputSx} placeholder="https://gophish.local:3333"
                  value={form.gophishUrl} onChange={(e) => setForm({ ...form, gophishUrl: e.target.value })} />
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider" mb={1.5}>API Key</Text>
                <SecretInput placeholder="GoPhish API key" value={form.gophishApiKey}
                  onChange={(e) => setForm({ ...form, gophishApiKey: e.target.value })} />
              </Box>
            </SimpleGrid>
          </Box>
        </Box>

        {/* Notes */}
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="14px" overflow="hidden" pos="relative">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${CYAN}80, transparent)` }} />
          <Box px={5} py={4}>
            <SectionTitle title="Notes" color={CYAN} icon={EditIcon} />
            <Textarea
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="DNS records, SPF/DKIM setup notes, testing results…"
              rows={4} resize="vertical"
              bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
              borderRadius="10px" fontSize="sm" color="var(--dash-text-primary)"
              _placeholder={{ color: 'var(--dash-text-muted)' }}
              _hover={{ borderColor: `${ACCENT}50` }}
              _focus={{ borderColor: `${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` }}
            />
          </Box>
        </Box>

        {/* Save button */}
        <Flex gap={3} align="center">
          <Button
            size="md" borderRadius="10px" px={8}
            bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
            _hover={{ bg: `${ACCENT}35` }} fontWeight="bold" fontSize="13px"
            isLoading={saving} loadingText="Saving…"
            onClick={handleSave}>
            Save Configuration
          </Button>
          {saved && (
            <Flex align="center" gap={1.5}>
              <CheckIcon boxSize={3} color={GREEN} />
              <Text fontSize="12px" color={GREEN} fontWeight="semibold">Saved</Text>
            </Flex>
          )}
          {cfg.updatedByCallsign && (
            <Text fontSize="10px" color="var(--dash-text-muted)">
              Last updated by {cfg.updatedByCallsign} · {fmtRelative(cfg.updatedAt)}
            </Text>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ── MAIN PHISHING VIEW ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const PhishingView = () => {
  const { slug } = useParams();
  const { getBySlug, fetchEngagements } = useEngagements();
  const eng = getBySlug(slug);

  const [activeModule, setActiveModule] = useState('web');

  if (!eng) return (
    <Flex align="center" justify="center" h="60vh"><Spinner size="lg" color={ACCENT} /></Flex>
  );

  return (
    <Box px={6} pb={12}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Phishing <Text as="span" color="red.400">Infrastructure</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · web &amp; email templates, SMTP config, and framework integration
          </Text>
        </Box>
      </Flex>

      {/* Module tabs */}
      <Flex gap={2} mb={5}>
        {MODULES.map((m) => {
          const active = activeModule === m.key;
          return (
            <Button key={m.key} size="sm" borderRadius="8px" px={4}
              fontWeight="bold" fontSize="12px"
              bg={active ? `${m.color}25` : 'transparent'}
              color={active ? m.color : 'var(--dash-text-muted)'}
              border={active ? `1px solid ${m.color}60` : '1px solid var(--dash-card-border)'}
              _hover={{ bg: active ? `${m.color}35` : 'rgba(255,255,255,0.05)' }}
              onClick={() => setActiveModule(m.key)}>
              <m.icon boxSize={3} mr={1.5} />{m.label}
            </Button>
          );
        })}
      </Flex>

      {/* Active module content */}
      <AnimatePresence mode="wait">
        <MotionBox key={activeModule}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {activeModule === 'web' && <WebTemplatesModule eng={eng} fetchEngagements={fetchEngagements} />}
          {activeModule === 'email' && <EmailTemplatesModule eng={eng} fetchEngagements={fetchEngagements} />}
          {activeModule === 'config' && <ConfigModule eng={eng} fetchEngagements={fetchEngagements} />}
        </MotionBox>
      </AnimatePresence>
    </Box>
  );
};

export default PhishingView;
