import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Button, Input, Textarea, Select,
  Stack, IconButton, Tooltip, Menu, MenuButton, MenuList, MenuItem,
  Image,
} from '@chakra-ui/react';
import { ChevronLeftIcon, AddIcon, DeleteIcon, CheckIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Colors ──────────────────────────────────────────────────────────────────
const ACCENT = '#9F7AEA';
const RED    = '#FC8181';
const CYAN   = '#76E4F7';
const ORANGE = '#F6AD55';

const LANGUAGES = [
  '', 'bash', 'python', 'javascript', 'powershell', 'csharp', 'java',
  'ruby', 'go', 'sql', 'xml', 'json', 'yaml', 'html', 'css', 'php', 'other',
];

// ── Category metadata ────────────────────────────────────────────────────────
const CATEGORY_META = {
  'initial-access': { title: 'Initial Access', color: '#ef4444', backPath: 'ttps/initial-access' },
  windows:          { title: 'Windows',        color: '#3b82f6', backPath: 'ttps/windows' },
  linux:            { title: 'Linux',          color: '#22c55e', backPath: 'ttps/linux' },
  'active-directory': { title: 'Active Directory', color: '#f59e0b', backPath: 'ttps/active-directory' },
  network:          { title: 'Network',        color: '#8b5cf6', backPath: 'ttps/network' },
};

// ── SVG Icons ───────────────────────────────────────────────────────────────
const CodeIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </Box>
);

const ImageIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </Box>
);

const TextIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </Box>
);

const TrashIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Box>
);

const ArrowUpIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
  </Box>
);

const ArrowDownIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
  </Box>
);

const TagIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </Box>
);

// ── Shared styles ───────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT}50` },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

// ── Code Block Editor ───────────────────────────────────────────────────────
const CodeBlockEditor = ({ value, onInput }) => {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.value = value || ''; }, []);
  return (
    <textarea
      ref={ref}
      defaultValue={value || ''}
      onInput={e => onInput(e.target.value)}
      spellCheck={false}
      style={{
        width: '100%', minHeight: '200px', maxHeight: '600px',
        resize: 'vertical', padding: '14px 16px',
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontSize: '12px', lineHeight: '1.6',
        color: '#a5f3fc', background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
        outline: 'none', tabSize: 2,
      }}
      onFocus={e => { e.target.style.borderColor = `${ACCENT}80`; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
      onKeyDown={e => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const t = e.target, s = t.selectionStart, end = t.selectionEnd;
          t.value = t.value.substring(0, s) + '  ' + t.value.substring(end);
          t.selectionStart = t.selectionEnd = s + 2;
          onInput(t.value);
        }
      }}
    />
  );
};

// ── Block type config ───────────────────────────────────────────────────────
const BLOCK_META = {
  text:  { icon: TextIcon,  label: 'Text',  color: ACCENT },
  code:  { icon: CodeIcon,  label: 'Code',  color: CYAN },
  image: { icon: ImageIcon, label: 'Image', color: ORANGE },
};

// ── Block Editor ────────────────────────────────────────────────────────────
const BlockEditor = ({ block, index, total, onUpdate, onDelete, onMove }) => {
  const meta = BLOCK_META[block.type];
  const Icon = meta.icon;
  const fileRef = useRef(null);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdate({ content: reader.result });
    reader.readAsDataURL(file);
  }, [onUpdate]);

  return (
    <MotionBox layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }} transition={{ duration: 0.18 }}
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="12px" overflow="hidden">
      <Flex align="center" gap={2} px={4} py={2.5}
        borderBottom="1px solid rgba(255,255,255,0.05)" bg="rgba(255,255,255,0.015)">
        <Flex w="22px" h="22px" borderRadius="5px" bg={`${meta.color}12`}
          border={`1px solid ${meta.color}30`} align="center" justify="center" flexShrink={0}>
          <Icon boxSize="11px" color={meta.color} />
        </Flex>
        <Text fontSize="10px" fontWeight="bold" color={meta.color}
          textTransform="uppercase" letterSpacing="wider">{meta.label}</Text>

        {block.type === 'code' && (
          <Select value={block.language || ''} size="xs"
            w="120px" ml={2} fontSize="10px" h="24px" borderRadius="5px"
            bg="rgba(255,255,255,0.04)" borderColor="rgba(255,255,255,0.08)"
            color="var(--dash-text-secondary)" focusBorderColor={`${ACCENT}60`}
            sx={{ '& option': { background: '#1a1a1f !important' } }}
            onChange={e => onUpdate({ language: e.target.value })}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l || 'language...'}</option>)}
          </Select>
        )}

        <Flex ml="auto" gap={1}>
          {index > 0 && (
            <IconButton icon={<ArrowUpIcon boxSize="11px" />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="5px" minW="22px" h="22px"
              _hover={{ color: 'white' }} onClick={() => onMove(-1)} aria-label="Move up" />
          )}
          {index < total - 1 && (
            <IconButton icon={<ArrowDownIcon boxSize="11px" />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="5px" minW="22px" h="22px"
              _hover={{ color: 'white' }} onClick={() => onMove(1)} aria-label="Move down" />
          )}
          <IconButton icon={<TrashIcon boxSize="11px" />} size="xs" variant="ghost"
            color="var(--dash-text-muted)" borderRadius="5px" minW="22px" h="22px"
            _hover={{ color: RED }} onClick={onDelete} aria-label="Delete block" />
        </Flex>
      </Flex>

      <Box p={4}>
        {block.type === 'text' && (
          <Textarea value={block.content} onChange={e => onUpdate({ content: e.target.value })}
            minH="100px" resize="vertical" fontSize="sm"
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
            borderRadius="8px" color="var(--dash-text-primary)" px={4} py={3}
            _placeholder={{ color: 'var(--dash-text-muted)' }}
            _focus={{ borderColor: `${ACCENT}60`, boxShadow: 'none' }}
            placeholder="Describe the technique, prerequisites, notes..." />
        )}
        {block.type === 'code' && (
          <CodeBlockEditor value={block.content} onInput={v => onUpdate({ content: v })} />
        )}
        {block.type === 'image' && (
          <Stack spacing={3}>
            {block.content ? (
              <Box borderRadius="10px" overflow="hidden" border="1px solid rgba(255,255,255,0.08)"
                bg="rgba(0,0,0,0.3)" pos="relative" role="group">
                <Image src={block.content} w="100%" maxH="500px" objectFit="contain" />
                <Button size="xs" pos="absolute" top={2} right={2} variant="ghost"
                  color="var(--dash-text-muted)" bg="rgba(0,0,0,0.6)" borderRadius="6px"
                  opacity={0} _groupHover={{ opacity: 1 }} _hover={{ color: RED }}
                  onClick={() => onUpdate({ content: '' })}>Remove</Button>
              </Box>
            ) : (
              <Flex direction="column" align="center" justify="center" py={8}
                borderRadius="10px" border="2px dashed rgba(255,255,255,0.1)"
                bg="rgba(255,255,255,0.015)" cursor="pointer"
                _hover={{ borderColor: `${ACCENT}40`, bg: 'rgba(255,255,255,0.025)' }}
                onClick={() => fileRef.current?.click()}>
                <ImageIcon boxSize="28px" color="var(--dash-text-muted)" mb={2} />
                <Text fontSize="12px" color="var(--dash-text-muted)" fontWeight="semibold">Click to upload image</Text>
                <Text fontSize="10px" color="var(--dash-text-muted)" mt={1}>PNG, JPG, GIF</Text>
              </Flex>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
            <Input value={block.caption || ''} placeholder="Caption (optional)"
              onChange={e => onUpdate({ caption: e.target.value })}
              {...inputSx} h="34px" fontSize="12px" />
          </Stack>
        )}
      </Box>
    </MotionBox>
  );
};

// ── Block View (read-only) ──────────────────────────────────────────────────
const BlockView = ({ block }) => {
  if (block.type === 'text') {
    return (
      <Text fontSize="sm" color="var(--dash-text-secondary)" whiteSpace="pre-wrap" lineHeight="tall">
        {block.content}
      </Text>
    );
  }
  if (block.type === 'code') {
    const lines = (block.content || '').split('\n');
    return (
      <Box borderRadius="10px" overflow="hidden" border="1px solid rgba(255,255,255,0.06)">
        {block.language && (
          <Flex align="center" gap={2} px={4} py={2}
            bg="rgba(255,255,255,0.03)" borderBottom="1px solid rgba(255,255,255,0.05)">
            <CodeIcon boxSize="11px" color={CYAN} />
            <Text fontSize="10px" fontWeight="bold" color={CYAN}
              textTransform="uppercase" letterSpacing="wider">{block.language}</Text>
            <Text fontSize="10px" color="var(--dash-text-muted)" ml="auto">
              {lines.length} lines
            </Text>
          </Flex>
        )}
        <Box bg="rgba(0,0,0,0.4)" overflowX="auto" p={0}>
          <Flex>
            <Box as="pre" py={4} px={3} textAlign="right" userSelect="none"
              borderRight="1px solid rgba(255,255,255,0.06)" minW="45px"
              color="rgba(255,255,255,0.2)" fontSize="11px"
              fontFamily="'Fira Code', monospace" lineHeight="1.7">
              {lines.map((_, i) => <Box key={i}>{i + 1}</Box>)}
            </Box>
            <Box as="pre" flex="1" py={4} px={4} fontSize="12px"
              fontFamily="'Fira Code', 'Cascadia Code', 'Consolas', monospace"
              color="#a5f3fc" lineHeight="1.7" whiteSpace="pre" overflowX="auto">
              {block.content}
            </Box>
          </Flex>
        </Box>
      </Box>
    );
  }
  if (block.type === 'image' && block.content) {
    return (
      <Box>
        <Box borderRadius="10px" overflow="hidden" border="1px solid rgba(255,255,255,0.08)"
          bg="rgba(0,0,0,0.3)">
          <Image src={block.content} w="100%" maxH="600px" objectFit="contain" />
        </Box>
        {block.caption && (
          <Text fontSize="11px" color="var(--dash-text-muted)" mt={2} textAlign="center" fontStyle="italic">
            {block.caption}
          </Text>
        )}
      </Box>
    );
  }
  return null;
};

// ═════════════════════════════════════════════════════════════════════════════
const TTPDetailView = ({ category }) => {
  const { slug, ttpId } = useParams();
  const navigate = useNavigate();
  const { getBySlug, updateEngagement } = useEngagements();
  const eng = getBySlug(slug);
  const ttp = (eng?.ttps || []).find(t => (t._id || t.id) === ttpId);

  const meta = CATEGORY_META[category];

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ttp && !form) {
      setForm({
        title:       ttp.title,
        description: ttp.description || '',
        tags:        (ttp.tags || []).join(', '),
        blocks:      ttp.blocks || [],
      });
    }
  }, [ttp, form]);

  if (!eng || !ttp || !form) {
    return (
      <Flex direction="column" align="center" justify="center" h="60vh" gap={4}>
        <Flex w="56px" h="56px" borderRadius="14px" bg={`${meta.color}12`}
          border={`2px solid ${meta.color}40`} align="center" justify="center">
          <CodeIcon boxSize="24px" color={meta.color} />
        </Flex>
        <Text fontWeight="bold" color="var(--dash-text-primary)">Technique not found</Text>
        <Button size="sm" leftIcon={<ChevronLeftIcon />} variant="ghost"
          color="var(--dash-text-secondary)" _hover={{ color: 'white' }}
          onClick={() => navigate(`/dashboard/${slug}/${meta.backPath}`)}>
          Back to {meta.title}
        </Button>
      </Flex>
    );
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addBlock = (type) => {
    set('blocks', [...(form.blocks || []), { type, content: '', language: '', caption: '' }]);
  };
  const updateBlock = (index, updates) => {
    const updated = [...(form.blocks || [])];
    updated[index] = { ...updated[index], ...updates };
    set('blocks', updated);
  };
  const deleteBlock = (index) => set('blocks', (form.blocks || []).filter((_, i) => i !== index));
  const moveBlock = (index, dir) => {
    const arr = [...(form.blocks || [])];
    const to = index + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[index], arr[to]] = [arr[to], arr[index]];
    set('blocks', arr);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const updatedTTPs = (eng.ttps || []).map(t =>
      (t._id || t.id) === ttpId ? { ...t, title: form.title, description: form.description, tags, blocks: form.blocks } : t
    );
    await updateEngagement(eng.id, { ttps: updatedTTPs });
    setEditing(false);
    setForm(null);
    setSaving(false);
  };

  const deleteTTP = async () => {
    if (!window.confirm(`Delete "${ttp.title}"? This cannot be undone.`)) return;
    await updateEngagement(eng.id, {
      ttps: (eng.ttps || []).filter(t => (t._id || t.id) !== ttpId),
    });
    navigate(`/dashboard/${slug}/${meta.backPath}`);
  };

  const tags = ttp.tags || [];
  const blocks = editing ? form.blocks : (ttp.blocks || []);
  const blockCount = blocks.length;

  return (
    <MotionBox px={6} pb={8}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}>

      {/* Top nav */}
      <Flex justify="space-between" align="center" mb={6}>
        <Button size="sm" leftIcon={<ChevronLeftIcon />} variant="ghost"
          color="var(--dash-text-muted)" fontSize="12px" borderRadius="8px"
          _hover={{ color: 'white', bg: 'rgba(255,255,255,0.05)' }}
          onClick={() => navigate(`/dashboard/${slug}/${meta.backPath}`)}>
          {meta.title} TTPs
        </Button>
        <Flex gap={2}>
          {editing ? (
            <>
              <Button size="sm" variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
                _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                onClick={() => { setEditing(false); setForm(null); }}>
                Cancel
              </Button>
              <Button size="sm" leftIcon={<CheckIcon boxSize={3} />}
                bg={`${meta.color}18`} border={`1px solid ${meta.color}50`}
                color={meta.color} fontWeight="bold" borderRadius="8px" fontSize="12px"
                _hover={{ bg: `${meta.color}28` }}
                isLoading={saving} loadingText="Saving..."
                onClick={save}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" leftIcon={<TextIcon boxSize="12px" />}
                bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                color="var(--dash-text-secondary)" fontSize="12px" borderRadius="8px"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.09)' }}
                onClick={() => setEditing(true)}>
                Edit
              </Button>
              <IconButton icon={<TrashIcon boxSize="14px" />} size="sm" variant="ghost"
                color="var(--dash-text-muted)" borderRadius="8px"
                _hover={{ color: RED, bg: `${RED}08` }}
                onClick={deleteTTP} aria-label="Delete technique" />
            </>
          )}
        </Flex>
      </Flex>

      {/* Title card */}
      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="14px" p={5} mb={5} pos="relative" overflow="hidden">
        <Box pos="absolute" top={0} left={0} right={0} h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${meta.color}80, transparent)` }} />

        {editing ? (
          <Flex direction="column" gap={4}>
            <Box>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="Technique name" {...inputSx} />
            </Box>
            <Box>
              <Label>Description</Label>
              <Input value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Short summary" {...inputSx} />
            </Box>
            <Box>
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder="e.g. privilege-escalation, persistence" {...inputSx} />
            </Box>
          </Flex>
        ) : (
          <>
            <Flex align="center" gap={3} mb={3} flexWrap="wrap">
              <Flex px="10px" py="3px" borderRadius="6px" fontSize="10px" fontWeight="bold"
                letterSpacing="wider" align="center" gap="6px"
                bg={`${meta.color}14`} border={`1px solid ${meta.color}35`} color={meta.color}>
                <Box w="6px" h="6px" borderRadius="full" bg={meta.color} />
                {meta.title.toUpperCase()}
              </Flex>
              {ttp.createdAt && (
                <Text fontSize="11px" color="var(--dash-text-muted)">
                  Added {new Date(ttp.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              )}
              {blockCount > 0 && (
                <Box px="8px" py="2px" borderRadius="5px" bg={`${CYAN}10`}
                  border={`1px solid ${CYAN}25`}>
                  <Text fontSize="9px" fontWeight="bold" color={CYAN} letterSpacing="wider">
                    {blockCount} {blockCount === 1 ? 'block' : 'blocks'}
                  </Text>
                </Box>
              )}
            </Flex>
            <Text fontSize="xl" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
              {ttp.title}
            </Text>
            {ttp.description && (
              <Text fontSize="sm" color="var(--dash-text-secondary)" mt={1}>
                {ttp.description}
              </Text>
            )}
            {tags.length > 0 && (
              <Flex gap={1.5} mt={3} flexWrap="wrap" align="center">
                <TagIcon boxSize="12px" color="var(--dash-text-muted)" />
                {tags.map(tag => (
                  <Box key={tag} px="8px" py="2px" borderRadius="5px" fontSize="9px" fontWeight="bold"
                    bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
                    color="var(--dash-text-secondary)" letterSpacing="wider" textTransform="uppercase">
                    {tag}
                  </Box>
                ))}
              </Flex>
            )}
          </>
        )}
      </Box>

      {/* Content Blocks */}
      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="14px" pos="relative">
        <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
          style={{ background: `linear-gradient(to right, transparent, ${CYAN}60, transparent)` }} />

        <Flex align="center" gap={3} px={5} pt={5} pb={editing ? 4 : (blockCount > 0 ? 4 : 5)}>
          <Flex w="30px" h="30px" borderRadius="8px" bg={`${CYAN}12`}
            border={`1px solid ${CYAN}30`} align="center" justify="center" flexShrink={0}>
            <CodeIcon boxSize="14px" color={CYAN} />
          </Flex>
          <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
            textTransform="uppercase" letterSpacing="wider">Content</Text>
          {!editing && blockCount > 0 && (
            <Box px="8px" py="2px" borderRadius="5px" bg={`${CYAN}10`}
              border={`1px solid ${CYAN}25`}>
              <Text fontSize="9px" fontWeight="bold" color={CYAN} letterSpacing="wider">
                {blockCount} {blockCount === 1 ? 'block' : 'blocks'}
              </Text>
            </Box>
          )}
        </Flex>

        <Box px={5} pb={5}>
          {editing ? (
            <Stack spacing={3}>
              <AnimatePresence initial={false}>
                {(form.blocks || []).map((block, i) => (
                  <BlockEditor key={block._id || block.id || `b-${i}`}
                    block={block} index={i} total={(form.blocks || []).length}
                    onUpdate={u => updateBlock(i, u)}
                    onDelete={() => deleteBlock(i)}
                    onMove={dir => moveBlock(i, dir)} />
                ))}
              </AnimatePresence>

              <Menu strategy="fixed">
                <MenuButton as={Button} size="sm" variant="ghost"
                  leftIcon={<AddIcon boxSize={2.5} />} rightIcon={<ChevronDownIcon />}
                  w="100%" borderRadius="10px" fontSize="11px" fontWeight="bold"
                  color="var(--dash-text-muted)"
                  border="2px dashed rgba(255,255,255,0.08)"
                  _hover={{ borderColor: `${meta.color}30`, color: meta.color, bg: 'rgba(255,255,255,0.015)' }}
                  _active={{ bg: 'rgba(255,255,255,0.03)' }}
                  h="44px">
                  Add Block
                </MenuButton>
                <MenuList bg="#1a1a1f" border="1px solid rgba(255,255,255,0.1)"
                  borderRadius="10px" py={1} minW="180px" boxShadow="xl" zIndex={10}>
                  {Object.entries(BLOCK_META).map(([type, bm]) => {
                    const BIcon = bm.icon;
                    return (
                      <MenuItem key={type} onClick={() => addBlock(type)}
                        bg="transparent" fontSize="12px" fontWeight="semibold"
                        color="var(--dash-text-secondary)" borderRadius="6px" mx={1}
                        _hover={{ bg: 'rgba(255,255,255,0.06)', color: 'white' }}
                        icon={<BIcon boxSize="14px" color={bm.color} />}>
                        {bm.label} Block
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </Menu>
            </Stack>
          ) : blockCount === 0 ? (
            <Text fontSize="sm" color="var(--dash-text-muted)" fontStyle="italic">
              No content yet — click Edit to add commands, notes, and screenshots.
            </Text>
          ) : (
            <Stack spacing={4}>
              {(ttp.blocks || []).map((block, i) => (
                <BlockView key={block._id || block.id || `v-${i}`} block={block} />
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
};

export default TTPDetailView;
