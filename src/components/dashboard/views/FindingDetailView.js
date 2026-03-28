import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Button, Input, Select, Textarea,
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

const SEVERITY_COLORS = {
  Critical: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#fca5a5', dot: '#ef4444' },
  High:     { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#fcd34d', dot: '#f59e0b' },
  Medium:   { bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.35)',  text: '#fef08a', dot: '#eab308' },
  Low:      { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#93c5fd', dot: '#3b82f6' },
  Info:     { bg: 'rgba(107,114,128,0.12)',border: 'rgba(107,114,128,0.30)',text: '#9ca3af', dot: '#6b7280' },
};
const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];

const LANGUAGES = [
  '', 'bash', 'python', 'javascript', 'powershell', 'csharp', 'java',
  'ruby', 'go', 'sql', 'xml', 'json', 'yaml', 'html', 'css', 'php', 'other',
];

// ── SVG Icons ───────────────────────────────────────────────────────────────
const EyeIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Box>
);

const CodeIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </Box>
);

const ImageIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </Box>
);

const TextIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
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

// ── Shared styles ───────────────────────────────────────────────────────────
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

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

const SeverityBadge = ({ severity }) => {
  const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.Info;
  return (
    <Flex px="10px" py="3px" borderRadius="6px" fontSize="10px" fontWeight="bold"
      letterSpacing="wider" align="center" gap="6px"
      bg={c.bg} border={`1px solid ${c.border}`} color={c.text}>
      <Box w="6px" h="6px" borderRadius="full" bg={c.dot} />
      {severity.toUpperCase()}
    </Flex>
  );
};

// ── Code Block Editor (plain textarea for performance) ──────────────────────
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
          const t = e.target;
          const s = t.selectionStart, end = t.selectionEnd;
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
  image: { icon: ImageIcon, label: 'Image', color: '#F6AD55' },
};

// ── Single Block Editor ─────────────────────────────────────────────────────
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
    <MotionBox
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      transition={{ duration: 0.18 }}
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="12px" overflow="hidden"
    >
      {/* Block header */}
      <Flex align="center" gap={2} px={4} py={2.5}
        borderBottom="1px solid rgba(255,255,255,0.05)"
        bg="rgba(255,255,255,0.015)">
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

        {block.type === 'image' && block.content && (
          <Text fontSize="10px" color="var(--dash-text-muted)" ml={1}>
            {(block.content.length / 1024).toFixed(0)} KB
          </Text>
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

      {/* Block content */}
      <Box p={4}>
        {block.type === 'text' && (
          <Textarea
            value={block.content}
            onChange={e => onUpdate({ content: e.target.value })}
            minH="100px" resize="vertical" fontSize="sm"
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
            borderRadius="8px" color="var(--dash-text-primary)" px={4} py={3}
            _placeholder={{ color: 'var(--dash-text-muted)' }}
            _focus={{ borderColor: `${ACCENT}60`, boxShadow: 'none' }}
            placeholder="Write your observation or notes..."
          />
        )}
        {block.type === 'code' && (
          <CodeBlockEditor
            value={block.content}
            onInput={v => onUpdate({ content: v })}
          />
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
                  onClick={() => onUpdate({ content: '' })}>
                  Remove
                </Button>
              </Box>
            ) : (
              <Flex direction="column" align="center" justify="center" py={8}
                borderRadius="10px" border="2px dashed rgba(255,255,255,0.1)"
                bg="rgba(255,255,255,0.015)" cursor="pointer"
                _hover={{ borderColor: `${ACCENT}40`, bg: 'rgba(255,255,255,0.025)' }}
                onClick={() => fileRef.current?.click()}>
                <ImageIcon boxSize="28px" color="var(--dash-text-muted)" mb={2} />
                <Text fontSize="12px" color="var(--dash-text-muted)" fontWeight="semibold">
                  Click to upload image
                </Text>
                <Text fontSize="10px" color="var(--dash-text-muted)" mt={1}>
                  PNG, JPG, GIF — max 10MB
                </Text>
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
            <Box
              as="pre"
              py={4} px={3}
              textAlign="right"
              userSelect="none"
              borderRight="1px solid rgba(255,255,255,0.06)"
              minW="45px"
              color="rgba(255,255,255,0.2)"
              fontSize="11px"
              fontFamily="'Fira Code', monospace"
              lineHeight="1.7"
            >
              {lines.map((_, i) => (
                <Box key={i}>{i + 1}</Box>
              ))}
            </Box>
            <Box
              as="pre"
              flex="1"
              py={4} px={4}
              fontSize="12px"
              fontFamily="'Fira Code', 'Cascadia Code', 'Consolas', monospace"
              color="#a5f3fc"
              lineHeight="1.7"
              whiteSpace="pre"
              overflowX="auto"
            >
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

// ── Section Component ───────────────────────────────────────────────────────
const SectionCard = ({ title, icon: SectionIcon, iconColor, blocks, editing, onBlocksChange, legacyContent }) => {
  const hasContent = blocks?.length > 0 || legacyContent;

  const addBlock = (type) => {
    const newBlock = { type, content: '', language: '', caption: '' };
    onBlocksChange([...(blocks || []), newBlock]);
  };

  const updateBlock = (index, updates) => {
    const updated = [...(blocks || [])];
    updated[index] = { ...updated[index], ...updates };
    onBlocksChange(updated);
  };

  const deleteBlock = (index) => {
    onBlocksChange((blocks || []).filter((_, i) => i !== index));
  };

  const moveBlock = (index, dir) => {
    const arr = [...(blocks || [])];
    const to = index + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[index], arr[to]] = [arr[to], arr[index]];
    onBlocksChange(arr);
  };

  return (
    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="14px" pos="relative">
      <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
        style={{ background: `linear-gradient(to right, transparent, ${iconColor}60, transparent)` }} />

      {/* Section header */}
      <Flex align="center" gap={3} px={5} pt={5} pb={editing ? 4 : (hasContent ? 4 : 5)}>
        <Flex w="30px" h="30px" borderRadius="8px" bg={`${iconColor}12`}
          border={`1px solid ${iconColor}30`} align="center" justify="center" flexShrink={0}>
          <SectionIcon boxSize="14px" color={iconColor} />
        </Flex>
        <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
          textTransform="uppercase" letterSpacing="wider">{title}</Text>
        {!editing && blocks?.length > 0 && (
          <Box px="8px" py="2px" borderRadius="5px" bg={`${iconColor}10`}
            border={`1px solid ${iconColor}25`}>
            <Text fontSize="9px" fontWeight="bold" color={iconColor} letterSpacing="wider">
              {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
            </Text>
          </Box>
        )}
      </Flex>

      {/* Content */}
      <Box px={5} pb={5}>
        {editing ? (
          <Stack spacing={3}>
            <AnimatePresence initial={false}>
              {(blocks || []).map((block, i) => (
                <BlockEditor
                  key={block._id || block.id || `b-${i}`}
                  block={block} index={i} total={(blocks || []).length}
                  onUpdate={u => updateBlock(i, u)}
                  onDelete={() => deleteBlock(i)}
                  onMove={dir => moveBlock(i, dir)}
                />
              ))}
            </AnimatePresence>

            {/* Add block menu */}
            <Menu strategy="fixed">
              <MenuButton as={Button} size="sm" variant="ghost"
                leftIcon={<AddIcon boxSize={2.5} />}
                rightIcon={<ChevronDownIcon />}
                w="100%" borderRadius="10px" fontSize="11px" fontWeight="bold"
                color="var(--dash-text-muted)"
                border="2px dashed rgba(255,255,255,0.08)"
                _hover={{ borderColor: `${ACCENT}30`, color: ACCENT, bg: 'rgba(255,255,255,0.015)' }}
                _active={{ bg: 'rgba(255,255,255,0.03)' }}
                h="44px">
                Add Block
              </MenuButton>
              <MenuList bg="#1a1a1f" border="1px solid rgba(255,255,255,0.1)"
                borderRadius="10px" py={1} minW="180px" boxShadow="xl" zIndex={10}>
                {Object.entries(BLOCK_META).map(([type, meta]) => {
                  const BIcon = meta.icon;
                  return (
                    <MenuItem key={type} onClick={() => addBlock(type)}
                      bg="transparent" fontSize="12px" fontWeight="semibold"
                      color="var(--dash-text-secondary)" borderRadius="6px" mx={1}
                      _hover={{ bg: 'rgba(255,255,255,0.06)', color: 'white' }}
                      icon={<BIcon boxSize="14px" color={meta.color} />}>
                      {meta.label} Block
                    </MenuItem>
                  );
                })}
              </MenuList>
            </Menu>
          </Stack>
        ) : !hasContent ? (
          <Text fontSize="sm" color="var(--dash-text-muted)" fontStyle="italic">
            No content — click Edit to add blocks.
          </Text>
        ) : (
          <Stack spacing={4}>
            {/* Show legacy text if no blocks */}
            {(!blocks || blocks.length === 0) && legacyContent && (
              <Text fontSize="sm" color="var(--dash-text-secondary)" whiteSpace="pre-wrap" lineHeight="tall">
                {legacyContent}
              </Text>
            )}
            {/* Show blocks */}
            {(blocks || []).map((block, i) => (
              <BlockView key={block._id || block.id || `v-${i}`} block={block} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
const FindingDetailView = () => {
  const { slug, findingId } = useParams();
  const navigate = useNavigate();
  const { getBySlug, updateEngagement } = useEngagements();
  const eng     = getBySlug(slug);
  const finding = (eng?.findings || []).find(f => (f._id || f.id) === findingId);

  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (finding && !form) {
      setForm({
        title:                finding.title,
        severity:             finding.severity,
        description:          finding.description || '',
        observationBlocks:    finding.observationBlocks || [],
        proofOfConceptBlocks: finding.proofOfConceptBlocks || [],
        remediationBlocks:    finding.remediationBlocks || [],
      });
    }
  }, [finding, form]);

  if (!eng || !finding || !form) {
    return (
      <Flex direction="column" align="center" justify="center" h="60vh" gap={4}>
        <Flex w="56px" h="56px" borderRadius="14px" bg={`${ACCENT}12`}
          border={`2px solid ${ACCENT}40`} align="center" justify="center">
          <EyeIcon boxSize="24px" color={ACCENT} />
        </Flex>
        <Text fontWeight="bold" color="var(--dash-text-primary)">Finding not found</Text>
        <Button size="sm" leftIcon={<ChevronLeftIcon />} variant="ghost"
          color="var(--dash-text-secondary)" _hover={{ color: 'white' }}
          onClick={() => navigate(`/dashboard/${slug}/reporting/findings`)}>
          Back to Findings
        </Button>
      </Flex>
    );
  }

  const c   = SEVERITY_COLORS[finding.severity] || SEVERITY_COLORS.Info;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const updatedFindings = (eng.findings || []).map(f =>
      (f._id || f.id) === findingId ? { ...f, ...form } : f
    );
    await updateEngagement(eng.id, { findings: updatedFindings });
    setEditing(false);
    setForm(null);
    setSaving(false);
  };

  const deleteFinding = async () => {
    if (!window.confirm(`Delete "${finding.title}"? This cannot be undone.`)) return;
    await updateEngagement(eng.id, {
      findings: (eng.findings || []).filter(f => (f._id || f.id) !== findingId),
    });
    navigate(`/dashboard/${slug}/reporting/findings`);
  };

  const totalBlocks = (form.observationBlocks?.length || 0)
    + (form.proofOfConceptBlocks?.length || 0)
    + (form.remediationBlocks?.length || 0);

  return (
    <MotionBox
      px={6} pb={8}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Top nav */}
      <Flex justify="space-between" align="center" mb={6}>
        <Button
          size="sm" leftIcon={<ChevronLeftIcon />} variant="ghost"
          color="var(--dash-text-muted)" fontSize="12px" borderRadius="8px"
          _hover={{ color: 'white', bg: 'rgba(255,255,255,0.05)' }}
          onClick={() => navigate(`/dashboard/${slug}/reporting/findings`)}
        >
          All Findings
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
                bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
                color={ACCENT} fontWeight="bold" borderRadius="8px" fontSize="12px"
                _hover={{ bg: `${ACCENT}25` }}
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
              <IconButton
                icon={<TrashIcon boxSize="14px" />} size="sm" variant="ghost"
                color="var(--dash-text-muted)" borderRadius="8px"
                _hover={{ color: RED, bg: `${RED}08` }}
                onClick={deleteFinding} aria-label="Delete finding"
              />
            </>
          )}
        </Flex>
      </Flex>

      {/* Title / Severity card */}
      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="14px" p={5} mb={5} pos="relative" overflow="hidden">
        <Box pos="absolute" top={0} left={0} right={0} h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${c.dot}80, transparent)` }} />

        {editing ? (
          <Flex gap={4} align="flex-end" flexWrap="wrap">
            <Box flex="1" minW="200px">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="Finding title" {...inputSx} />
            </Box>
            <Box w="160px">
              <Label>Severity</Label>
              <Select value={form.severity} onChange={e => set('severity', e.target.value)} {...selSx}>
                {SEVERITY_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Box>
            <Box flex="1" minW="200px">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Short description" {...inputSx} />
            </Box>
          </Flex>
        ) : (
          <>
            <Flex align="center" gap={3} mb={3} flexWrap="wrap">
              <SeverityBadge severity={finding.severity} />
              {finding.createdAt && (
                <Text fontSize="11px" color="var(--dash-text-muted)">
                  Logged {new Date(finding.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              )}
              {totalBlocks > 0 && (
                <Box px="8px" py="2px" borderRadius="5px" bg={`${CYAN}10`}
                  border={`1px solid ${CYAN}25`}>
                  <Text fontSize="9px" fontWeight="bold" color={CYAN} letterSpacing="wider">
                    {totalBlocks} {totalBlocks === 1 ? 'block' : 'blocks'}
                  </Text>
                </Box>
              )}
            </Flex>
            <Text fontSize="xl" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
              {finding.title}
            </Text>
            {finding.description && (
              <Text fontSize="sm" color="var(--dash-text-secondary)" mt={1}>
                {finding.description}
              </Text>
            )}
          </>
        )}
      </Box>

      {/* Detail sections */}
      <Stack spacing={5}>
        <SectionCard
          title="Observation"
          icon={EyeIcon}
          iconColor={ACCENT}
          blocks={editing ? form.observationBlocks : (finding.observationBlocks || [])}
          editing={editing}
          onBlocksChange={b => set('observationBlocks', b)}
          legacyContent={finding.observation}
        />
        <SectionCard
          title="Proof of Concept"
          icon={CodeIcon}
          iconColor={CYAN}
          blocks={editing ? form.proofOfConceptBlocks : (finding.proofOfConceptBlocks || [])}
          editing={editing}
          onBlocksChange={b => set('proofOfConceptBlocks', b)}
          legacyContent={finding.proofOfConcept}
        />
        <SectionCard
          title="Remediation"
          icon={TextIcon}
          iconColor="#68D391"
          blocks={editing ? form.remediationBlocks : (finding.remediationBlocks || [])}
          editing={editing}
          onBlocksChange={b => set('remediationBlocks', b)}
          legacyContent={finding.remediation}
        />
      </Stack>
    </MotionBox>
  );
};

export default FindingDetailView;
