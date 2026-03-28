import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, Input, Select, Textarea,
  SimpleGrid, IconButton, Spinner, Tooltip, Image,
  Menu, MenuButton, MenuList, MenuItem, Stack,
} from '@chakra-ui/react';
import {
  AddIcon, DeleteIcon, ChevronRightIcon, SearchIcon,
  CheckIcon, CloseIcon, EditIcon, ChevronDownIcon,
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

const SEVERITY_COLORS = {
  Critical: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#fca5a5', dot: '#ef4444' },
  High:     { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#fcd34d', dot: '#f59e0b' },
  Medium:   { bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.35)',  text: '#fef08a', dot: '#eab308' },
  Low:      { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#93c5fd', dot: '#3b82f6' },
  Info:     { bg: 'rgba(107,114,128,0.12)',border: 'rgba(107,114,128,0.30)',text: '#9ca3af', dot: '#6b7280' },
};
const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];

// ── SVG Icons ────────────────────────────────────────────────────────────────
const ShieldIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Box>
);

const AlertIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Box>
);

const FileTextIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
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

const selSx = {
  bg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px', h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  cursor: 'pointer', focusBorderColor: `${ACCENT}80`,
  _hover: { borderColor: `${ACCENT}50` },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

const textareaSx = {
  bg: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', px: 4, py: 3, fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { borderColor: `${ACCENT}50` },
  _focus: { borderColor: `${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
  resize: 'vertical', minH: '80px',
};

// ── Components ───────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

const SeverityBadge = ({ severity, size = 'sm' }) => {
  const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.Info;
  return (
    <Flex px={size === 'sm' ? '8px' : '10px'} py="2px" borderRadius="5px"
      fontSize={size === 'sm' ? '9px' : '10px'} fontWeight="bold"
      letterSpacing="wider" flexShrink={0} align="center" gap="5px"
      bg={c.bg} border={`1px solid ${c.border}`} color={c.text}>
      <Box w="5px" h="5px" borderRadius="full" bg={c.dot} flexShrink={0} />
      {severity.toUpperCase()}
    </Flex>
  );
};

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

const EyeIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
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

const LANGUAGES = [
  '', 'bash', 'python', 'javascript', 'powershell', 'csharp', 'java',
  'ruby', 'go', 'sql', 'xml', 'json', 'yaml', 'html', 'css', 'php', 'other',
];

const BLOCK_META = {
  text:  { icon: TextBlockIcon, label: 'Text',  color: ACCENT },
  code:  { icon: CodeIcon,      label: 'Code',  color: CYAN },
  image: { icon: ImageIcon,     label: 'Image', color: ORANGE },
};

const SECTION_META = [
  { key: 'observationBlocks',    title: 'Observation',       icon: EyeIcon,       color: ACCENT },
  { key: 'proofOfConceptBlocks', title: 'Proof of Concept',  icon: CodeIcon,       color: CYAN },
  { key: 'remediationBlocks',    title: 'Remediation',       icon: TextBlockIcon,  color: GREEN },
];

// ── Code Block Editor (plain textarea for perf) ─────────────────────────────
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

// ── Mini Block Editor ───────────────────────────────────────────────────────
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
      {/* Block header */}
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

      {/* Block body */}
      <Box p={3}>
        {block.type === 'text' && (
          <Textarea value={block.content} onChange={e => onUpdate({ content: e.target.value })}
            minH="80px" resize="vertical" fontSize="sm"
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
            borderRadius="8px" color="var(--dash-text-primary)" px={3} py={2.5}
            _placeholder={{ color: 'var(--dash-text-muted)' }}
            _focus={{ borderColor: `${ACCENT}60`, boxShadow: 'none' }}
            placeholder="Write your notes..." />
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

// ── Form Section with blocks ────────────────────────────────────────────────
const FormSection = ({ title, icon: SIcon, iconColor, blocks, onChange }) => {
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
        <Flex w="22px" h="22px" borderRadius="5px" bg={`${iconColor}12`}
          border={`1px solid ${iconColor}25`} align="center" justify="center" flexShrink={0}>
          <SIcon boxSize="11px" color={iconColor} />
        </Flex>
        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
          textTransform="uppercase" letterSpacing="wider">{title}</Text>
        {blocks?.length > 0 && (
          <Box px="6px" py="1px" borderRadius="4px" bg={`${iconColor}10`} border={`1px solid ${iconColor}20`}>
            <Text fontSize="8px" fontWeight="bold" color={iconColor}>{blocks.length}</Text>
          </Box>
        )}
      </Flex>
      <Stack spacing={2}>
        {(blocks || []).map((block, i) => (
          <MiniBlockEditor key={`fb-${i}`} block={block} index={i} total={blocks.length}
            onUpdate={u => updateBlock(i, u)} onDelete={() => deleteBlock(i)}
            onMove={dir => moveBlock(i, dir)} />
        ))}
        <Menu strategy="fixed">
          <MenuButton as={Button} size="xs" variant="ghost"
            leftIcon={<AddIcon boxSize={2} />} rightIcon={<ChevronDownIcon boxSize={3} />}
            w="100%" borderRadius="8px" fontSize="10px" fontWeight="bold"
            color="var(--dash-text-muted)" h="34px"
            border="1px dashed rgba(255,255,255,0.08)"
            _hover={{ borderColor: `${iconColor}30`, color: iconColor }}
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

const EMPTY = {
  title: '', severity: 'High', description: '',
  observationBlocks: [], proofOfConceptBlocks: [], remediationBlocks: [],
};

// ═════════════════════════════════════════════════════════════════════════════
const FindingsView = () => {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const { getBySlug, updateEngagement } = useEngagements();
  const eng = getBySlug(slug);

  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [filterSev, setFilterSev] = useState('');

  if (!eng) return (
    <Flex align="center" justify="center" h="60vh"><Spinner size="lg" color={ACCENT} /></Flex>
  );

  const allFindings = [...(eng.findings || [])].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

  const findings = allFindings.filter(f => {
    if (filterSev && f.severity !== filterSev) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return f.title?.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = allFindings.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc; }, {});
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addFinding = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await updateEngagement(eng.id, { findings: [...(eng.findings || []), { ...form }] });
    setForm(EMPTY);
    setShowForm(false);
    setSaving(false);
  };

  const deleteFinding = (id, e) => {
    e.stopPropagation();
    updateEngagement(eng.id, {
      findings: (eng.findings || []).filter(f => (f._id || f.id) !== id),
    });
  };

  return (
    <Box px={6} pb={12}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Findings <Text as="span" color={ACCENT}>Vault</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · log command outputs, screenshots and operational evidence
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" fontWeight="bold"
          borderRadius="8px" bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
          color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
          onClick={() => setShowForm(v => !v)}>
          New Finding
        </Button>
      </Flex>

      {/* Stats row */}
      <SimpleGrid columns={{ base: 2, md: 5 }} gap={3} mb={6}>
        {SEVERITY_ORDER.map(sev => {
          const c = SEVERITY_COLORS[sev];
          const count = counts[sev] || 0;
          const isActive = filterSev === sev;
          return (
            <MotionBox key={sev}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              bg="var(--dash-card-bg)" border={isActive ? `1px solid ${c.border}` : '1px solid var(--dash-card-border)'}
              borderRadius="12px" p={4} pos="relative" overflow="hidden"
              cursor="pointer" onClick={() => setFilterSev(isActive ? '' : sev)}
              _hover={{ borderColor: c.border }}
              style={{ transition: 'border-color 0.15s' }}>
              <Box pos="absolute" top={0} left={0} right={0} h="2px"
                style={{ background: `linear-gradient(to right, transparent, ${c.dot}80, transparent)` }} />
              <Flex justify="space-between" align="flex-start">
                <Box>
                  <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                    textTransform="uppercase" letterSpacing="wider" mb={1}>{sev}</Text>
                  <Text fontSize="2xl" fontWeight="black" color={c.text}>{count}</Text>
                </Box>
                <Box w="6px" h="6px" borderRadius="full" bg={c.dot} mt={1}
                  boxShadow={count > 0 ? `0 0 8px ${c.dot}` : 'none'} />
              </Flex>
            </MotionBox>
          );
        })}
      </SimpleGrid>

      {/* New Finding Form */}
      <AnimatePresence>
        {showForm && (
          <MotionBox
            initial={{ opacity: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: 'top' }}
            mb={6}>
            <Box bg="var(--dash-card-bg)" border={`1px solid ${ACCENT}30`} borderRadius="14px"
              p={5} pos="relative">
              <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
                style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />

              <Flex align="center" gap={2} mb={4}>
                <Flex w="28px" h="28px" borderRadius="7px" bg={`${ACCENT}12`}
                  border={`1px solid ${ACCENT}30`} align="center" justify="center">
                  <AddIcon boxSize={3} color={ACCENT} />
                </Flex>
                <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
                  textTransform="uppercase" letterSpacing="wider">New Finding</Text>
              </Flex>

              <Flex direction="column" gap={4} mb={4}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Box gridColumn={{ base: '1', md: '1 / 3' }}>
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={e => set('title', e.target.value)}
                      placeholder="e.g. Password Spraying — Valid Credentials Found" {...inputSx} />
                  </Box>
                  <Box>
                    <Label>Severity *</Label>
                    <Select value={form.severity} onChange={e => set('severity', e.target.value)} {...selSx}>
                      {SEVERITY_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Box>
                </SimpleGrid>

                <Box>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Short one-line summary" {...inputSx} />
                </Box>

                {/* Block-based sections */}
                {SECTION_META.map(sec => (
                  <FormSection key={sec.key} title={sec.title} icon={sec.icon} iconColor={sec.color}
                    blocks={form[sec.key]} onChange={v => set(sec.key, v)} />
                ))}
              </Flex>

              <Flex gap={3}>
                <Button size="sm" variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
                  _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                  onClick={() => { setShowForm(false); setForm(EMPTY); }}>
                  Cancel
                </Button>
                <Button size="sm" leftIcon={<CheckIcon boxSize={2.5} />} fontWeight="bold"
                  borderRadius="8px" bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
                  color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                  isLoading={saving} loadingText="Saving…" onClick={addFinding}>
                  Add Finding
                </Button>
              </Flex>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Search + filter bar */}
      {allFindings.length > 0 && (
        <Flex justify="space-between" align="center" mb={3} gap={3}>
          <Flex align="center" gap={2}>
            <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
            <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
              letterSpacing="wider" fontWeight="bold">
              {filterSev ? `${filterSev} Findings` : 'All Findings'}
            </Text>
            <Box px={2} py="1px" borderRadius="full" bg={`${ACCENT}10`} border={`1px solid ${ACCENT}30`}>
              <Text fontSize="9px" fontWeight="bold" color={ACCENT}>{findings.length}</Text>
            </Box>
            {filterSev && (
              <Button size="xs" variant="ghost" color="var(--dash-text-muted)" fontSize="10px"
                borderRadius="5px" _hover={{ color: 'white' }}
                onClick={() => setFilterSev('')}>
                <CloseIcon boxSize={2} mr={1} /> Clear filter
              </Button>
            )}
          </Flex>
          <Box pos="relative" w="220px">
            <Box pos="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
              <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
            </Box>
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search findings…" {...inputSx} pl={8} h="32px" fontSize="11px" />
          </Box>
        </Flex>
      )}

      {/* Findings List */}
      {allFindings.length === 0 ? (
        <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}>
          <Flex direction="column" align="center" justify="center" py={16} gap={3}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="16px"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}60, transparent)` }} />
            <Flex w="56px" h="56px" borderRadius="14px" bg={`${ACCENT}12`}
              border={`2px solid ${ACCENT}40`} align="center" justify="center">
              <ShieldIcon boxSize="24px" color={ACCENT} />
            </Flex>
            <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">No findings yet</Text>
            <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center" maxW="340px">
              Click "New Finding" to log your first vulnerability or observation.
            </Text>
          </Flex>
        </MotionBox>
      ) : (
        <AnimatePresence initial={false}>
          {findings.map((f, i) => {
            const fid = f._id || f.id;
            const c   = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.Info;
            const hasBlocks = (f.observationBlocks?.length || 0) + (f.proofOfConceptBlocks?.length || 0) + (f.remediationBlocks?.length || 0);
            return (
              <motion.div key={fid} layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                style={{ marginBottom: '10px' }}>
                <Flex
                  bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  borderRadius="12px" px={5} py={4} align="center" gap={4}
                  cursor="pointer"
                  onClick={() => navigate(`/dashboard/${slug}/reporting/findings/${fid}`)}
                  _hover={{ borderColor: `${c.border}`, bg: 'rgba(255,255,255,0.015)' }}
                  style={{ transition: 'all 0.15s' }} role="group"
                  pos="relative" overflow="hidden">

                  <Box pos="absolute" top={0} left={0} bottom={0} w="3px" bg={c.dot}
                    borderRadius="0 3px 3px 0" opacity={0.6} />

                  <SeverityBadge severity={f.severity} />

                  <Box flex="1" minW={0}>
                    <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={1}>
                      {f.title}
                    </Text>
                    {f.description && (
                      <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1} mt="2px">
                        {f.description}
                      </Text>
                    )}
                  </Box>

                  <Flex align="center" gap={2} flexShrink={0}>
                    {(f.proofOfConcept || f.proofOfConceptBlocks?.length > 0) && (
                      <Box px="6px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                        bg={`${ACCENT}10`} border={`1px solid ${ACCENT}25`}
                        color={ACCENT} letterSpacing="wider">PoC</Box>
                    )}
                    {hasBlocks > 0 && (
                      <Box px="6px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                        bg={`${CYAN}10`} border={`1px solid ${CYAN}25`}
                        color={CYAN} letterSpacing="wider">{hasBlocks} blocks</Box>
                    )}
                    {f.createdAt && (
                      <Text fontSize="10px" color="var(--dash-text-muted)">
                        {new Date(f.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </Text>
                    )}
                    <Tooltip label="Delete" fontSize="10px">
                      <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
                        color="var(--dash-text-muted)" borderRadius="6px"
                        _hover={{ color: RED, bg: `${RED}08` }}
                        onClick={e => deleteFinding(fid, e)} aria-label="Delete" />
                    </Tooltip>
                    <ChevronRightIcon boxSize={4} color="var(--dash-text-muted)"
                      _groupHover={{ color: ACCENT }} style={{ transition: 'color 0.15s' }} />
                  </Flex>
                </Flex>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {search.trim() && findings.length === 0 && allFindings.length > 0 && (
        <Flex justify="center" py={8}>
          <Text fontSize="12px" color="var(--dash-text-muted)">No findings match "{search}"</Text>
        </Flex>
      )}
    </Box>
  );
};

export default FindingsView;
