import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, Input, Textarea,
  SimpleGrid, IconButton, Spinner, Tooltip, Image,
  Menu, MenuButton, MenuList, MenuItem, Stack, Select,
} from '@chakra-ui/react';
import {
  AddIcon, DeleteIcon, ChevronRightIcon, SearchIcon,
  CheckIcon, CloseIcon, ChevronDownIcon,
} from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Colors ───────────────────────────────────────────────────────────────────
const ACCENT = '#9F7AEA';
const RED    = '#FC8181';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const ORANGE = '#F6AD55';
const CYAN   = '#76E4F7';

// ── Category metadata ────────────────────────────────────────────────────────
const CATEGORY_META = {
  'initial-access': {
    title: 'Initial Access',
    subtitle: 'Phishing, password spraying, exploit chains, and entry techniques',
    color: '#ef4444',
    icon: (p) => (
      <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
      </Box>
    ),
  },
  windows: {
    title: 'Windows',
    subtitle: 'Privilege escalation, persistence, lateral movement on Windows',
    color: '#3b82f6',
    icon: (p) => (
      <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </Box>
    ),
  },
  linux: {
    title: 'Linux',
    subtitle: 'Enumeration, privilege escalation, persistence on Linux systems',
    color: '#22c55e',
    icon: (p) => (
      <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
      </Box>
    ),
  },
  'active-directory': {
    title: 'Active Directory',
    subtitle: 'Kerberoasting, DCSync, delegation abuse, domain escalation',
    color: '#f59e0b',
    icon: (p) => (
      <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </Box>
    ),
  },
  network: {
    title: 'Network',
    subtitle: 'Pivoting, tunneling, firewall evasion, network attacks',
    color: '#8b5cf6',
    icon: (p) => (
      <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <rect x="1" y="1" width="6" height="6" /><rect x="17" y="1" width="6" height="6" />
        <rect x="9" y="17" width="6" height="6" /><line x1="4" y1="7" x2="4" y2="14" />
        <line x1="20" y1="7" x2="20" y2="14" /><line x1="12" y1="14" x2="12" y2="17" />
        <path d="M4 14h16" />
      </Box>
    ),
  },
};

// ── SVG Icons ────────────────────────────────────────────────────────────────
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

const TextBlockIcon = (props) => (
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

const BookIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </Box>
);

const TagIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </Box>
);

// ── Input styles ─────────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT}50` },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

const LANGUAGES = [
  '', 'bash', 'python', 'javascript', 'powershell', 'csharp', 'java',
  'ruby', 'go', 'sql', 'xml', 'json', 'yaml', 'html', 'css', 'php', 'other',
];

const BLOCK_META = {
  text:  { icon: TextBlockIcon, label: 'Text',  color: ACCENT },
  code:  { icon: CodeIcon,      label: 'Code',  color: CYAN },
  image: { icon: ImageIcon,     label: 'Image', color: ORANGE },
};

// ── Code Block Editor ────────────────────────────────────────────────────────
const CodeBlockEditor = ({ value, onInput }) => {
  const ref = useRef(null);
  return (
    <textarea
      ref={ref}
      defaultValue={value || ''}
      onInput={e => onInput(e.target.value)}
      spellCheck={false}
      style={{
        width: '100%', minHeight: '160px', maxHeight: '500px',
        resize: 'vertical', padding: '12px 14px',
        fontFamily: "'Fira Code', 'Consolas', monospace",
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

// ── Mini Block Editor ────────────────────────────────────────────────────────
const MiniBlockEditor = ({ block, index, total, onUpdate, onDelete, onMove }) => {
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
    <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)"
      borderRadius="10px" overflow="hidden">
      <Flex align="center" gap={2} px={3} py={2}
        borderBottom="1px solid rgba(255,255,255,0.04)" bg="rgba(255,255,255,0.015)">
        <Flex w="20px" h="20px" borderRadius="4px" bg={`${meta.color}12`}
          border={`1px solid ${meta.color}30`} align="center" justify="center" flexShrink={0}>
          <Icon boxSize="10px" color={meta.color} />
        </Flex>
        <Text fontSize="9px" fontWeight="bold" color={meta.color}
          textTransform="uppercase" letterSpacing="wider">{meta.label}</Text>

        {block.type === 'code' && (
          <Select value={block.language || ''} size="xs"
            w="110px" ml={1} fontSize="9px" h="22px" borderRadius="4px"
            bg="rgba(255,255,255,0.04)" borderColor="rgba(255,255,255,0.08)"
            color="var(--dash-text-secondary)" focusBorderColor={`${ACCENT}60`}
            sx={{ '& option': { background: '#1a1a1f !important' } }}
            onChange={e => onUpdate({ language: e.target.value })}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l || 'language...'}</option>)}
          </Select>
        )}

        <Flex ml="auto" gap={0.5}>
          {index > 0 && (
            <IconButton icon={<ArrowUpIcon boxSize="10px" />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="4px" minW="20px" h="20px"
              _hover={{ color: 'white' }} onClick={() => onMove(-1)} aria-label="Up" />
          )}
          {index < total - 1 && (
            <IconButton icon={<ArrowDownIcon boxSize="10px" />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="4px" minW="20px" h="20px"
              _hover={{ color: 'white' }} onClick={() => onMove(1)} aria-label="Down" />
          )}
          <IconButton icon={<TrashIcon boxSize="10px" />} size="xs" variant="ghost"
            color="var(--dash-text-muted)" borderRadius="4px" minW="20px" h="20px"
            _hover={{ color: RED }} onClick={onDelete} aria-label="Delete" />
        </Flex>
      </Flex>

      <Box p={3}>
        {block.type === 'text' && (
          <Textarea value={block.content} onChange={e => onUpdate({ content: e.target.value })}
            minH="80px" resize="vertical" fontSize="sm"
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
            borderRadius="8px" color="var(--dash-text-primary)" px={3} py={2.5}
            _placeholder={{ color: 'var(--dash-text-muted)' }}
            _focus={{ borderColor: `${ACCENT}60`, boxShadow: 'none' }}
            placeholder="Describe the technique, when to use it..." />
        )}
        {block.type === 'code' && (
          <CodeBlockEditor value={block.content} onInput={v => onUpdate({ content: v })} />
        )}
        {block.type === 'image' && (
          <Stack spacing={2}>
            {block.content ? (
              <Box borderRadius="8px" overflow="hidden" border="1px solid rgba(255,255,255,0.06)"
                bg="rgba(0,0,0,0.3)" pos="relative" role="group">
                <Image src={block.content} w="100%" maxH="300px" objectFit="contain" />
                <Button size="xs" pos="absolute" top={2} right={2} variant="ghost"
                  color="var(--dash-text-muted)" bg="rgba(0,0,0,0.6)" borderRadius="5px"
                  opacity={0} _groupHover={{ opacity: 1 }} _hover={{ color: RED }}
                  onClick={() => onUpdate({ content: '' })}>Remove</Button>
              </Box>
            ) : (
              <Flex direction="column" align="center" justify="center" py={6}
                borderRadius="8px" border="2px dashed rgba(255,255,255,0.08)"
                bg="rgba(255,255,255,0.01)" cursor="pointer"
                _hover={{ borderColor: `${ACCENT}30` }}
                onClick={() => fileRef.current?.click()}>
                <ImageIcon boxSize="22px" color="var(--dash-text-muted)" mb={1.5} />
                <Text fontSize="11px" color="var(--dash-text-muted)">Click to upload</Text>
              </Flex>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
            <Input value={block.caption || ''} placeholder="Caption (optional)"
              onChange={e => onUpdate({ caption: e.target.value })}
              {...inputSx} h="30px" fontSize="11px" />
          </Stack>
        )}
      </Box>
    </Box>
  );
};

// ── Blocks Section ───────────────────────────────────────────────────────────
const BlocksSection = ({ blocks, onChange, accentColor }) => {
  const addBlock = (type) => {
    onChange([...(blocks || []), { type, content: '', language: '', caption: '' }]);
  };
  const updateBlock = (i, u) => {
    const arr = [...(blocks || [])]; arr[i] = { ...arr[i], ...u }; onChange(arr);
  };
  const deleteBlock = (i) => onChange((blocks || []).filter((_, j) => j !== i));
  const moveBlock = (i, dir) => {
    const arr = [...(blocks || [])];
    const to = i + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[i], arr[to]] = [arr[to], arr[i]];
    onChange(arr);
  };

  return (
    <Box>
      <Flex align="center" gap={2} mb={2}>
        <Flex w="22px" h="22px" borderRadius="5px" bg={`${CYAN}12`}
          border={`1px solid ${CYAN}25`} align="center" justify="center" flexShrink={0}>
          <CodeIcon boxSize="11px" color={CYAN} />
        </Flex>
        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
          textTransform="uppercase" letterSpacing="wider">Content Blocks</Text>
        {blocks?.length > 0 && (
          <Box px="6px" py="1px" borderRadius="4px" bg={`${CYAN}10`} border={`1px solid ${CYAN}20`}>
            <Text fontSize="8px" fontWeight="bold" color={CYAN}>{blocks.length}</Text>
          </Box>
        )}
      </Flex>
      <Stack spacing={2}>
        {(blocks || []).map((block, i) => (
          <MiniBlockEditor key={`b-${i}`} block={block} index={i} total={blocks.length}
            onUpdate={u => updateBlock(i, u)} onDelete={() => deleteBlock(i)}
            onMove={dir => moveBlock(i, dir)} />
        ))}
        <Menu strategy="fixed">
          <MenuButton as={Button} size="xs" variant="ghost"
            leftIcon={<AddIcon boxSize={2} />} rightIcon={<ChevronDownIcon boxSize={3} />}
            w="100%" borderRadius="8px" fontSize="10px" fontWeight="bold"
            color="var(--dash-text-muted)" h="34px"
            border="1px dashed rgba(255,255,255,0.08)"
            _hover={{ borderColor: `${accentColor || CYAN}30`, color: accentColor || CYAN }}
            _active={{ bg: 'rgba(255,255,255,0.02)' }}>
            Add Block
          </MenuButton>
          <MenuList bg="#1a1a1f" border="1px solid rgba(255,255,255,0.1)"
            borderRadius="10px" py={1} minW="160px" boxShadow="xl" zIndex={10}>
            {Object.entries(BLOCK_META).map(([type, meta]) => {
              const BIcon = meta.icon;
              return (
                <MenuItem key={type} onClick={() => addBlock(type)}
                  bg="transparent" fontSize="11px" fontWeight="semibold"
                  color="var(--dash-text-secondary)" borderRadius="6px" mx={1}
                  _hover={{ bg: 'rgba(255,255,255,0.06)', color: 'white' }}
                  icon={<BIcon boxSize="13px" color={meta.color} />}>
                  {meta.label}
                </MenuItem>
              );
            })}
          </MenuList>
        </Menu>
      </Stack>
    </Box>
  );
};

// ── Label ────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

// ═════════════════════════════════════════════════════════════════════════════
const TTPsView = ({ category }) => {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const { getBySlug, updateEngagement } = useEngagements();
  const eng = getBySlug(slug);

  const meta = CATEGORY_META[category];
  const CatIcon = meta.icon;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', tags: '', blocks: [] });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const allTTPs = useMemo(() => {
    if (!eng) return [];
    return [...(eng.ttps || [])].filter(t => t.category === category)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [eng, category]);

  if (!eng) return (
    <Flex align="center" justify="center" h="60vh"><Spinner size="lg" color={ACCENT} /></Flex>
  );

  const ttps = allTTPs.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      || (t.tags || []).some(tag => tag.toLowerCase().includes(q));
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addTTP = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const newTTP = { ...form, tags, category };
    await updateEngagement(eng.id, { ttps: [...(eng.ttps || []), newTTP] });
    setForm({ title: '', description: '', tags: '', blocks: [] });
    setShowForm(false);
    setSaving(false);
  };

  const deleteTTP = (id, e) => {
    e.stopPropagation();
    updateEngagement(eng.id, {
      ttps: (eng.ttps || []).filter(t => (t._id || t.id) !== id),
    });
  };

  return (
    <Box px={6} pb={12}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            {meta.title.split(' ')[0]}{' '}
            <Text as="span" color="red.400">
              {meta.title.split(' ').slice(1).join(' ') || meta.title.split(' ')[0] === meta.title ? '' : ''}
            </Text>
            {meta.title.split(' ').length === 1 && (
              <Text as="span" color="red.400"> TTPs</Text>
            )}
            {meta.title.split(' ').length > 1 && (
              <Text as="span" color="red.400">
                {' '}{meta.title.split(' ').slice(1).join(' ')}
              </Text>
            )}
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {meta.subtitle}
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" fontWeight="bold"
          borderRadius="8px" bg={`${meta.color}18`} border={`1px solid ${meta.color}50`}
          color={meta.color} _hover={{ bg: `${meta.color}28` }}
          onClick={() => setShowForm(v => !v)}>
          New TTP
        </Button>
      </Flex>

      {/* Stats bar */}
      <Flex gap={4} mb={6}>
        <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="12px" px={5} py={4} pos="relative" overflow="hidden" flex="1">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${meta.color}80, transparent)` }} />
          <Flex align="center" gap={3}>
            <Flex w="40px" h="40px" borderRadius="10px" bg={`${meta.color}12`}
              border={`1px solid ${meta.color}30`} align="center" justify="center">
              <CatIcon boxSize="18px" color={meta.color} />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="black" color={meta.color}>{allTTPs.length}</Text>
              <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider">Techniques</Text>
            </Box>
          </Flex>
        </MotionBox>

        <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="12px" px={5} py={4} pos="relative" overflow="hidden" flex="1">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${CYAN}80, transparent)` }} />
          <Flex align="center" gap={3}>
            <Flex w="40px" h="40px" borderRadius="10px" bg={`${CYAN}12`}
              border={`1px solid ${CYAN}30`} align="center" justify="center">
              <CodeIcon boxSize="18px" color={CYAN} />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="black" color={CYAN}>
                {allTTPs.reduce((sum, t) => sum + (t.blocks?.filter(b => b.type === 'code').length || 0), 0)}
              </Text>
              <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider">Code Snippets</Text>
            </Box>
          </Flex>
        </MotionBox>

        <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="12px" px={5} py={4} pos="relative" overflow="hidden" flex="1">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${ORANGE}80, transparent)` }} />
          <Flex align="center" gap={3}>
            <Flex w="40px" h="40px" borderRadius="10px" bg={`${ORANGE}12`}
              border={`1px solid ${ORANGE}30`} align="center" justify="center">
              <TagIcon boxSize="18px" color={ORANGE} />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="black" color={ORANGE}>
                {new Set(allTTPs.flatMap(t => t.tags || [])).size}
              </Text>
              <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider">Unique Tags</Text>
            </Box>
          </Flex>
        </MotionBox>
      </Flex>

      {/* New TTP Form */}
      <AnimatePresence>
        {showForm && (
          <MotionBox
            initial={{ opacity: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: 'top' }}
            mb={6}>
            <Box bg="var(--dash-card-bg)" border={`1px solid ${meta.color}30`} borderRadius="14px"
              p={5} pos="relative">
              <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
                style={{ background: `linear-gradient(to right, transparent, ${meta.color}80, transparent)` }} />

              <Flex align="center" gap={2} mb={4}>
                <Flex w="28px" h="28px" borderRadius="7px" bg={`${meta.color}12`}
                  border={`1px solid ${meta.color}30`} align="center" justify="center">
                  <AddIcon boxSize={3} color={meta.color} />
                </Flex>
                <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
                  textTransform="uppercase" letterSpacing="wider">New Technique</Text>
              </Flex>

              <Flex direction="column" gap={4} mb={4}>
                <Box>
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => set('title', e.target.value)}
                    placeholder="e.g. Kerberoasting, Pass-the-Hash, SSH Tunneling..." {...inputSx} />
                </Box>

                <Box>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Short summary of when and how to use this technique" {...inputSx} />
                </Box>

                <Box>
                  <Label>Tags (comma-separated)</Label>
                  <Input value={form.tags} onChange={e => set('tags', e.target.value)}
                    placeholder="e.g. privilege-escalation, lateral-movement, persistence" {...inputSx} />
                </Box>

                <BlocksSection blocks={form.blocks} onChange={v => set('blocks', v)} accentColor={meta.color} />
              </Flex>

              <Flex gap={3}>
                <Button size="sm" variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
                  _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                  onClick={() => { setShowForm(false); setForm({ title: '', description: '', tags: '', blocks: [] }); }}>
                  Cancel
                </Button>
                <Button size="sm" leftIcon={<CheckIcon boxSize={2.5} />} fontWeight="bold"
                  borderRadius="8px" bg={`${meta.color}18`} border={`1px solid ${meta.color}50`}
                  color={meta.color} _hover={{ bg: `${meta.color}28` }}
                  isLoading={saving} loadingText="Saving..." onClick={addTTP}>
                  Add Technique
                </Button>
              </Flex>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Search bar */}
      {allTTPs.length > 0 && (
        <Flex justify="space-between" align="center" mb={3} gap={3}>
          <Flex align="center" gap={2}>
            <Box w="3px" h="12px" borderRadius="full" bg={meta.color} />
            <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
              letterSpacing="wider" fontWeight="bold">Inventory</Text>
            <Box px={2} py="1px" borderRadius="full" bg={`${meta.color}10`} border={`1px solid ${meta.color}30`}>
              <Text fontSize="9px" fontWeight="bold" color={meta.color}>{ttps.length}</Text>
            </Box>
          </Flex>
          <Box pos="relative" w="220px">
            <Box pos="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
              <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
            </Box>
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search techniques..." {...inputSx} pl={8} h="32px" fontSize="11px" />
          </Box>
        </Flex>
      )}

      {/* TTP List */}
      {allTTPs.length === 0 ? (
        <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}>
          <Flex direction="column" align="center" justify="center" py={16} gap={3}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="16px"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${meta.color}60, transparent)` }} />
            <Flex w="56px" h="56px" borderRadius="14px" bg={`${meta.color}12`}
              border={`2px solid ${meta.color}40`} align="center" justify="center">
              <BookIcon boxSize="24px" color={meta.color} />
            </Flex>
            <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">No techniques yet</Text>
            <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center" maxW="380px">
              Start building your {meta.title.toLowerCase()} inventory — add commands, procedures, and notes
              that will help across engagements.
            </Text>
          </Flex>
        </MotionBox>
      ) : (
        <AnimatePresence initial={false}>
          {ttps.map((t, i) => {
            const tid = t._id || t.id;
            const blockCount = t.blocks?.length || 0;
            const codeCount  = t.blocks?.filter(b => b.type === 'code').length || 0;
            const tags = t.tags || [];
            return (
              <motion.div key={tid} layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                style={{ marginBottom: '10px' }}>
                <Flex
                  bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  borderRadius="12px" px={5} py={4} align="center" gap={4}
                  cursor="pointer"
                  onClick={() => navigate(`/dashboard/${slug}/ttps/${category}/${tid}`)}
                  _hover={{ borderColor: `${meta.color}50`, bg: 'rgba(255,255,255,0.015)' }}
                  style={{ transition: 'all 0.15s' }} role="group"
                  pos="relative" overflow="hidden">

                  <Box pos="absolute" top={0} left={0} bottom={0} w="3px" bg={meta.color}
                    borderRadius="0 3px 3px 0" opacity={0.6} />

                  <Flex w="32px" h="32px" borderRadius="8px" bg={`${meta.color}12`}
                    border={`1px solid ${meta.color}25`} align="center" justify="center" flexShrink={0}>
                    <CatIcon boxSize="14px" color={meta.color} />
                  </Flex>

                  <Box flex="1" minW={0}>
                    <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={1}>
                      {t.title}
                    </Text>
                    {t.description && (
                      <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1} mt="2px">
                        {t.description}
                      </Text>
                    )}
                    {tags.length > 0 && (
                      <Flex gap={1} mt={1.5} flexWrap="wrap">
                        {tags.slice(0, 4).map(tag => (
                          <Box key={tag} px="6px" py="1px" borderRadius="4px" fontSize="8px" fontWeight="bold"
                            bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)"
                            color="var(--dash-text-muted)" letterSpacing="wider" textTransform="uppercase">
                            {tag}
                          </Box>
                        ))}
                        {tags.length > 4 && (
                          <Text fontSize="8px" color="var(--dash-text-muted)" alignSelf="center">+{tags.length - 4}</Text>
                        )}
                      </Flex>
                    )}
                  </Box>

                  <Flex align="center" gap={2} flexShrink={0}>
                    {codeCount > 0 && (
                      <Box px="6px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                        bg={`${CYAN}10`} border={`1px solid ${CYAN}25`}
                        color={CYAN} letterSpacing="wider">{codeCount} cmd</Box>
                    )}
                    {blockCount > 0 && (
                      <Box px="6px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                        bg={`${ACCENT}10`} border={`1px solid ${ACCENT}25`}
                        color={ACCENT} letterSpacing="wider">{blockCount} blocks</Box>
                    )}
                    {t.createdAt && (
                      <Text fontSize="10px" color="var(--dash-text-muted)">
                        {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </Text>
                    )}
                    <Tooltip label="Delete" fontSize="10px">
                      <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
                        color="var(--dash-text-muted)" borderRadius="6px"
                        _hover={{ color: RED, bg: `${RED}08` }}
                        onClick={e => deleteTTP(tid, e)} aria-label="Delete" />
                    </Tooltip>
                    <ChevronRightIcon boxSize={4} color="var(--dash-text-muted)"
                      _groupHover={{ color: meta.color }} style={{ transition: 'color 0.15s' }} />
                  </Flex>
                </Flex>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {search.trim() && ttps.length === 0 && allTTPs.length > 0 && (
        <Flex justify="center" py={8}>
          <Text fontSize="12px" color="var(--dash-text-muted)">No techniques match "{search}"</Text>
        </Flex>
      )}
    </Box>
  );
};

export default TTPsView;
