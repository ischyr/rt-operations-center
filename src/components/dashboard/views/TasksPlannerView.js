import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select, Textarea,
  Spinner, Tooltip, useToast, Stack, Image, Checkbox,
  Modal, ModalOverlay, ModalContent, ModalBody, ModalHeader, ModalFooter, ModalCloseButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, CheckIcon, RepeatIcon, TimeIcon, EditIcon,
  AttachmentIcon, WarningTwoIcon, ChevronUpIcon, ChevronDownIcon, CalendarIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

// ── Name helper ────────────────────────────────────────────────────────────────
const displayName = (u) => u?.callsign || u?.name || u?.email || 'Operator';

const MotionBox = motion(Box);

// ── Theme — indigo accent for planning/structure ──────────────────────────────
const ACCENT  = '#818CF8';
const A_S     = 'rgba(129,140,248,0.07)';
const A_B     = 'rgba(129,140,248,0.28)';
const GREEN   = '#68D391';
const RED     = '#FC8181';
const ORANGE  = '#F6AD55';
const BLUE    = '#63B3ED';
const VIOLET  = '#B794F4';
const GOLD    = '#ECC94B';
const CYAN    = '#76E4F7';
const MUTED   = 'var(--dash-text-muted)';
const CARD_BG = 'var(--dash-card-bg)';
const CARD_BD = 'var(--dash-card-border)';

const STATUSES = [
  { key: 'backlog',     label: 'Backlog',     color: MUTED   },
  { key: 'in-progress', label: 'In Progress', color: ACCENT  },
  { key: 'blocked',     label: 'Blocked',     color: RED     },
  { key: 'review',      label: 'Review',      color: GOLD    },
  { key: 'done',        label: 'Done',        color: GREEN   },
];

const PRIORITY_META = {
  low:      { color: MUTED,  label: 'Low'      },
  medium:   { color: BLUE,   label: 'Medium'   },
  high:     { color: ORANGE, label: 'High'     },
  critical: { color: RED,    label: 'Critical' },
};

const LANGUAGES = [
  '', 'bash', 'powershell', 'python', 'javascript', 'typescript', 'csharp', 'java',
  'go', 'ruby', 'rust', 'php', 'sql', 'xml', 'json', 'yaml', 'html', 'css', 'text',
];

const tok = () => localStorage.getItem('token') || '';

// ── Helpers ────────────────────────────────────────────────────────────────────
const hashHue = (str = '') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
};

const initials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] || '?').toUpperCase();
  return ((parts[0][0] || '') + (parts[parts.length - 1][0] || '')).toUpperCase();
};

const fmtRelative = (d) => {
  if (!d) return '';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const fmtDue = (d) => {
  if (!d) return '';
  const due = new Date(d);
  const now = Date.now();
  const diff = due.getTime() - now;
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7)   return `in ${days}d`;
  return due.toLocaleDateString();
};

const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate).getTime() < Date.now();
};

const OperatorDot = ({ name, size = 20 }) => (
  <Box w={`${size}px`} h={`${size}px`} borderRadius="full" flexShrink={0}
    display="flex" alignItems="center" justifyContent="center"
    bg={name ? `hsl(${hashHue(name)}, 65%, 56%)` : 'rgba(255,255,255,0.1)'}
    boxShadow={name ? `0 0 6px hsl(${hashHue(name)}, 65%, 56%)60` : 'none'}>
    {name && (
      <Text fontSize={`${Math.max(8, size * 0.4)}px`} fontWeight="black" color="white">
        {initials(name)}
      </Text>
    )}
  </Box>
);

// ── Code block textarea (monospace, tab support) ──────────────────────────────
const CodeTextarea = ({ value, onChange }) => {
  const ref = useRef(null);
  return (
    <textarea
      ref={ref}
      defaultValue={value || ''}
      onInput={e => onChange(e.target.value)}
      spellCheck={false}
      style={{
        width: '100%', minHeight: '160px', maxHeight: '520px',
        resize: 'vertical', padding: '12px 14px',
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontSize: '12px', lineHeight: '1.6',
        color: '#a5f3fc', background: 'rgba(0,0,0,0.45)',
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
          onChange(t.value);
        }
      }}
    />
  );
};

// ── Block config ──────────────────────────────────────────────────────────────
const BLOCK_META = {
  text:  { label: 'Text',  color: ACCENT },
  code:  { label: 'Code',  color: CYAN   },
  image: { label: 'Image', color: ORANGE },
};

// ── Block editor ──────────────────────────────────────────────────────────────
const BlockEditor = ({ block, index, total, onUpdate, onDelete, onMove }) => {
  const meta    = BLOCK_META[block.type] || BLOCK_META.text;
  const fileRef = useRef(null);

  const handleImage = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdate({ content: reader.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [onUpdate]);

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      bg={CARD_BG} border={`1px solid ${CARD_BD}`}
      borderRadius="11px" overflow="hidden">

      <Flex align="center" gap={2} px={3} py="7px"
        borderBottom={`1px solid ${CARD_BD}`}
        bg="rgba(255,255,255,0.015)">
        <Flex w="22px" h="22px" borderRadius="5px"
          bg={`${meta.color}15`} border={`1px solid ${meta.color}30`}
          align="center" justify="center">
          <Text fontSize="9px" fontWeight="black" color={meta.color}>
            {block.type === 'text' ? 'T' : block.type === 'code' ? '</>' : '📷'}
          </Text>
        </Flex>
        <Text fontSize="10px" fontWeight="bold" color={meta.color}
          textTransform="uppercase" letterSpacing="wider">
          {meta.label}
        </Text>

        {block.type === 'code' && (
          <Select value={block.language || ''} size="xs"
            w="130px" ml={1} fontSize="10px" h="24px" borderRadius="5px"
            bg="rgba(255,255,255,0.04)" borderColor="rgba(255,255,255,0.08)"
            color="var(--dash-text-secondary)" focusBorderColor={`${ACCENT}60`}
            sx={{ '& option': { background: '#14181f !important' } }}
            onChange={e => onUpdate({ language: e.target.value })}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l || 'language…'}</option>)}
          </Select>
        )}

        {block.type === 'image' && block.content && (
          <Text fontSize="10px" color={MUTED} ml={1}>
            {(block.content.length / 1024).toFixed(0)} KB
          </Text>
        )}

        <Flex ml="auto" gap={1}>
          {index > 0 && (
            <IconButton icon={<ChevronUpIcon boxSize={3} />} size="xs" variant="ghost"
              color={MUTED} h="22px" minW="22px" borderRadius="5px"
              _hover={{ color: 'white' }} onClick={() => onMove(-1)}
              aria-label="move up" />
          )}
          {index < total - 1 && (
            <IconButton icon={<ChevronDownIcon boxSize={3} />} size="xs" variant="ghost"
              color={MUTED} h="22px" minW="22px" borderRadius="5px"
              _hover={{ color: 'white' }} onClick={() => onMove(1)}
              aria-label="move down" />
          )}
          <IconButton icon={<DeleteIcon boxSize={2.5} />} size="xs" variant="ghost"
            color={MUTED} h="22px" minW="22px" borderRadius="5px"
            _hover={{ color: RED }} onClick={onDelete} aria-label="delete" />
        </Flex>
      </Flex>

      <Box p={3}>
        {block.type === 'text' && (
          <Textarea
            value={block.content || ''}
            onChange={e => onUpdate({ content: e.target.value })}
            minH="90px" resize="vertical" fontSize="13px"
            bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
            borderRadius="8px" color="var(--dash-text-primary)" px={3} py={2.5}
            _placeholder={{ color: MUTED }}
            _focus={{ borderColor: `${ACCENT}60`, boxShadow: 'none' }}
            placeholder="Write notes, checklist items, context for the next operator…"
          />
        )}
        {block.type === 'code' && (
          <CodeTextarea value={block.content}
            onChange={v => onUpdate({ content: v })} />
        )}
        {block.type === 'image' && (
          <Stack spacing={2}>
            {block.content ? (
              <Box borderRadius="10px" overflow="hidden"
                border={`1px solid ${CARD_BD}`} bg="rgba(0,0,0,0.3)"
                pos="relative" role="group">
                <Image src={block.content} w="100%" maxH="380px" objectFit="contain" />
                <Button size="xs" pos="absolute" top={2} right={2}
                  bg="rgba(0,0,0,0.7)" color={MUTED} borderRadius="5px"
                  opacity={0} _groupHover={{ opacity: 1 }}
                  _hover={{ color: RED }}
                  onClick={() => onUpdate({ content: '' })}>
                  Remove
                </Button>
              </Box>
            ) : (
              <Flex direction="column" align="center" justify="center" py={6}
                borderRadius="9px" border={`2px dashed ${CARD_BD}`}
                bg="rgba(255,255,255,0.015)" cursor="pointer"
                _hover={{ borderColor: `${ACCENT}40`, bg: A_S }}
                onClick={() => fileRef.current?.click()}>
                <AttachmentIcon boxSize={5} color={MUTED} mb={2} />
                <Text fontSize="12px" color={MUTED} fontWeight="semibold">
                  Click to upload image
                </Text>
                <Text fontSize="10px" color={MUTED} mt={0.5} opacity={0.6}>
                  PNG · JPG · GIF · WebP — paste supported
                </Text>
              </Flex>
            )}
            <input ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handleImage} />
            <Input
              value={block.caption || ''} placeholder="Caption (optional)"
              onChange={e => onUpdate({ caption: e.target.value })}
              h="32px" fontSize="12px" borderRadius="7px"
              bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
              color="var(--dash-text-primary)"
              _placeholder={{ color: MUTED }}
              _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
            />
          </Stack>
        )}
      </Box>
    </MotionBox>
  );
};

// ── Task Card (board) ─────────────────────────────────────────────────────────
const TaskCard = ({ task, phase, isMine, onDragStart, onDragEnd, onClick, isDragging }) => {
  const prio       = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const doneCount  = (task.checklist || []).filter(c => c.done).length;
  const checkTotal = (task.checklist || []).length;
  const overdue    = isOverdue(task.dueDate, task.status);

  return (
    <MotionBox
      layout
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      whileHover={{ y: -1 }}
      borderRadius="10px" bg={CARD_BG}
      border={`1px solid ${CARD_BD}`}
      pos="relative" overflow="hidden" cursor="grab"
      onClick={() => onClick(task)}
      _hover={{ borderColor: `${phase.color}60` }}
      _active={{ cursor: 'grabbing' }}
      sx={{ transition: 'border-color 0.15s' }}>

      {/* Left phase-colored bar */}
      <Box pos="absolute" left={0} top={0} bottom={0} w="3px" bg={phase.color} />

      <Box p={3} pl={4}>
        {/* Row 1: priority + overdue */}
        <Flex align="center" justify="space-between" mb={1.5}>
          <Flex align="center" gap={1}>
            <Box w="5px" h="5px" borderRadius="full" bg={prio.color}
              boxShadow={prio.color !== MUTED ? `0 0 6px ${prio.color}` : 'none'} />
            <Text fontSize="9px" color={prio.color} fontWeight="black"
              textTransform="uppercase" letterSpacing="wider">
              {prio.label}
            </Text>
          </Flex>
          {overdue && (
            <Flex align="center" gap={0.5} px="5px" py="1px" borderRadius="3px"
              bg="rgba(252,129,129,0.12)" border={`1px solid ${RED}30`}>
              <WarningTwoIcon boxSize={2} color={RED} />
              <Text fontSize="8px" color={RED} fontWeight="bold"
                textTransform="uppercase">overdue</Text>
            </Flex>
          )}
        </Flex>

        {/* Title */}
        <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)"
          noOfLines={3} lineHeight={1.35} mb={2}>
          {task.title}
        </Text>

        {/* Tags */}
        {task.tags?.length > 0 && (
          <Flex gap={1} flexWrap="wrap" mb={2}>
            {task.tags.slice(0, 3).map(t => (
              <Box key={t} px="5px" py="1px" borderRadius="3px" fontSize="9px"
                bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-secondary)">
                #{t}
              </Box>
            ))}
            {task.tags.length > 3 && (
              <Text fontSize="9px" color={MUTED}>+{task.tags.length - 3}</Text>
            )}
          </Flex>
        )}

        {/* Footer */}
        <Flex align="center" justify="space-between" pt={2}
          borderTop={`1px solid ${CARD_BD}`} gap={2}>
          <Flex align="center" gap={1} minW={0}>
            {task.assignedOperatorName ? (
              <>
                <OperatorDot name={task.assignedOperatorName} size={14} />
                <Text fontSize="10px" color="var(--dash-text-secondary)" noOfLines={1}>
                  {task.assignedOperatorName.split(' ')[0]}
                </Text>
                {isMine && (
                  <Box px="4px" py="0px" borderRadius="3px"
                    bg={A_S} border={`1px solid ${A_B}`}>
                    <Text fontSize="8px" color={ACCENT} fontWeight="black"
                      textTransform="uppercase">you</Text>
                  </Box>
                )}
              </>
            ) : (
              <Text fontSize="10px" color={MUTED} fontStyle="italic">unassigned</Text>
            )}
          </Flex>
          <Flex align="center" gap={2}>
            {checkTotal > 0 && (
              <Tooltip label={`${doneCount} of ${checkTotal} checklist items`} hasArrow fontSize="10px">
                <Flex align="center" gap={0.5}>
                  <CheckIcon boxSize={2} color={doneCount === checkTotal ? GREEN : MUTED} />
                  <Text fontSize="9px" color={doneCount === checkTotal ? GREEN : MUTED}
                    fontWeight="bold">
                    {doneCount}/{checkTotal}
                  </Text>
                </Flex>
              </Tooltip>
            )}
            {task.dueDate && (
              <Tooltip label={new Date(task.dueDate).toLocaleString()} hasArrow fontSize="10px">
                <Flex align="center" gap={0.5}>
                  <CalendarIcon boxSize={2} color={overdue ? RED : MUTED} />
                  <Text fontSize="9px" color={overdue ? RED : MUTED} fontFamily="mono">
                    {fmtDue(task.dueDate)}
                  </Text>
                </Flex>
              </Tooltip>
            )}
          </Flex>
        </Flex>
      </Box>
    </MotionBox>
  );
};

// ── Column ────────────────────────────────────────────────────────────────────
const Column = ({ phase, tasks, myId, myName, draggedTaskId, dropHoverPhase,
                  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onCardClick }) => {
  const isHovered = dropHoverPhase === phase.key;
  return (
    <Flex direction="column" w="280px" flexShrink={0}
      onDragOver={(e) => { e.preventDefault(); onDragOver(phase.key); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, phase.key)}>

      <Box borderRadius="12px 12px 0 0" bg={CARD_BG}
        border={`1px solid ${CARD_BD}`} borderBottom="none" pos="relative" overflow="hidden">
        <Box pos="absolute" top={0} left={0} right={0} h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${phase.color}90, transparent)` }} />
        <Flex align="center" justify="space-between" px={4} py="10px">
          <Flex align="center" gap={2}>
            <Box w="8px" h="8px" borderRadius="full" bg={phase.color}
              boxShadow={`0 0 8px ${phase.color}70`} />
            <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)"
              textTransform="uppercase" letterSpacing="wider">
              {phase.label}
            </Text>
          </Flex>
          <Box px="7px" py="1px" borderRadius="full"
            bg={`${phase.color}12`} border={`1px solid ${phase.color}30`}>
            <Text fontSize="10px" fontWeight="bold" color={phase.color}>
              {tasks.length}
            </Text>
          </Box>
        </Flex>
      </Box>

      <Box flex={1} minH="400px" p={2.5}
        borderRadius="0 0 12px 12px"
        border={`1px solid ${isHovered ? phase.color + '60' : CARD_BD}`}
        borderTop="none"
        bg={isHovered ? `${phase.color}08` : 'rgba(255,255,255,0.012)'}
        transition="all 0.15s">

        {tasks.length === 0 && !isHovered && (
          <Flex direction="column" align="center" justify="center" py={10} gap={2} opacity={0.4}>
            <Box as="svg" viewBox="0 0 24 24" w="26px" h="26px" fill="none"
              stroke={MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
            </Box>
            <Text fontSize="10px" color={MUTED}>No tasks</Text>
          </Flex>
        )}
        {isHovered && tasks.length === 0 && (
          <Flex direction="column" align="center" justify="center" py={10} gap={2}>
            <Box w="32px" h="32px" borderRadius="8px"
              bg={`${phase.color}18`} border={`1px dashed ${phase.color}60`}
              display="flex" alignItems="center" justifyContent="center">
              <AddIcon boxSize={3} color={phase.color} />
            </Box>
            <Text fontSize="10px" color={phase.color} fontWeight="semibold">
              Drop here
            </Text>
          </Flex>
        )}

        <Flex direction="column" gap={2}>
          <AnimatePresence mode="popLayout">
            {tasks.map(task => (
              <TaskCard key={task._id}
                task={task} phase={phase}
                isMine={task.assignedOperatorId === myId ||
                        (task.assignedOperatorName || '').toLowerCase() === (myName || '').toLowerCase()}
                isDragging={draggedTaskId === task._id}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={onCardClick} />
            ))}
          </AnimatePresence>
        </Flex>
      </Box>
    </Flex>
  );
};

// ── Task Modal (create / edit with rich blocks + checklist) ───────────────────
const TaskModal = ({ isOpen, onClose, task, onSave, onDelete, teamOperators, myId }) => {
  const editing = !!task?._id;

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [status,      setStatus]      = useState('backlog');
  const [priority,    setPriority]    = useState('medium');
  const [assigneeId,  setAssigneeId]  = useState('');
  const [dueDate,     setDueDate]     = useState('');
  const [tagsText,    setTagsText]    = useState('');
  const [blocks,      setBlocks]      = useState([]);
  const [checklist,   setChecklist]   = useState([]);
  const [newCheck,    setNewCheck]    = useState('');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(task?.title || '');
    setDescription(task?.description || '');
    setStatus(task?.status || 'backlog');
    setPriority(task?.priority || 'medium');
    setAssigneeId(task?.assignedOperatorId || '');
    setDueDate(task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
    setTagsText((task?.tags || []).join(', '));
    setBlocks(task?.blocks || []);
    setChecklist(task?.checklist || []);
    setNewCheck('');
  }, [isOpen, task]);

  const selectedAssignee = teamOperators.find(o => String(o.id) === String(assigneeId));

  // Block helpers
  const addBlock = (type) => setBlocks(p => [...p,
    { type, content: '', language: '', caption: '' }]);
  const updateBlock = (idx, updates) =>
    setBlocks(p => p.map((b, i) => i === idx ? { ...b, ...updates } : b));
  const deleteBlock = (idx) => setBlocks(p => p.filter((_, i) => i !== idx));
  const moveBlock = (idx, dir) => setBlocks(p => {
    const a = [...p]; const to = idx + dir;
    if (to < 0 || to >= a.length) return p;
    [a[idx], a[to]] = [a[to], a[idx]]; return a;
  });

  // Checklist
  const addChecklistItem = () => {
    if (!newCheck.trim()) return;
    setChecklist(p => [...p, { text: newCheck.trim(), done: false }]);
    setNewCheck('');
  };
  const toggleCheck = (idx) => setChecklist(p => p.map((c, i) =>
    i === idx ? { ...c, done: !c.done } : c));
  const removeCheck = (idx) => setChecklist(p => p.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title, description, status, priority,
        assignedOperatorId:   assigneeId || '',
        assignedOperatorName: selectedAssignee ? displayName(selectedAssignee) : '',
        dueDate: dueDate || null,
        tags: tagsText.split(',').map(t => t.trim()).filter(Boolean),
        blocks, checklist,
      });
      onClose();
    } finally { setSaving(false); }
  };

  const statusMeta   = STATUSES.find(s => s.key === status) || STATUSES[0];
  const priorityMeta = PRIORITY_META[priority] || PRIORITY_META.medium;
  const doneCount    = checklist.filter(c => c.done).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(8px)" bg="rgba(0,0,0,0.55)" />
      <ModalContent bg={CARD_BG} border={`1px solid ${CARD_BD}`} borderRadius="14px" maxH="90vh">
        <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
          style={{ background: `linear-gradient(to right, transparent, ${statusMeta.color}90, transparent)` }} />

        <ModalHeader pb={2} pr={10}>
          <Flex align="center" gap={2} mb={2}>
            <Box px="7px" py="2px" borderRadius="5px"
              bg={`${statusMeta.color}14`} border={`1px solid ${statusMeta.color}30`}>
              <Text fontSize="9px" fontWeight="black" color={statusMeta.color}
                textTransform="uppercase" letterSpacing="wider">
                {statusMeta.label}
              </Text>
            </Box>
            <Flex align="center" gap={1} px="7px" py="2px" borderRadius="5px"
              bg={`${priorityMeta.color}10`} border={`1px solid ${priorityMeta.color}28`}>
              <Box w="5px" h="5px" borderRadius="full" bg={priorityMeta.color} />
              <Text fontSize="9px" fontWeight="bold" color={priorityMeta.color}
                textTransform="uppercase">
                {priorityMeta.label}
              </Text>
            </Flex>
            {editing && task?.createdByOperatorName && (
              <>
                <Box w="3px" h="3px" borderRadius="full" bg={MUTED} ml={1} />
                <Text fontSize="10px" color={MUTED}>
                  created by {task.createdByOperatorName}
                </Text>
              </>
            )}
          </Flex>
          <Input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Task title…"
            fontSize="18px" fontWeight="bold" color="var(--dash-text-primary)"
            variant="unstyled" border="none"
            _placeholder={{ color: MUTED, fontWeight: 'bold' }}
            px={0} h="auto" lineHeight={1.3}
          />
        </ModalHeader>
        <ModalCloseButton color={MUTED} />

        <ModalBody pb={0}>
          {/* ─── Metadata grid ─────────────────────────────────────────────── */}
          <Flex gap={3} mb={4} flexWrap="wrap">
            <Box flex={1} minW="200px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1.5}
                textTransform="uppercase" letterSpacing="wider">Status</Text>
              <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="8px"
                border={`1px solid ${CARD_BD}`} p="3px">
                {STATUSES.map(s => {
                  const act = status === s.key;
                  return (
                    <Button key={s.key} flex={1} size="xs" h="28px" borderRadius="5px"
                      fontSize="9px" fontWeight="bold"
                      bg={act ? `${s.color}18` : 'transparent'}
                      color={act ? s.color : MUTED}
                      border={act ? `1px solid ${s.color}40` : '1px solid transparent'}
                      _hover={{ color: s.color }}
                      onClick={() => setStatus(s.key)}>
                      {s.label}
                    </Button>
                  );
                })}
              </Flex>
            </Box>
          </Flex>

          <Flex gap={3} mb={4} flexWrap="wrap">
            <Box flex={1} minW="160px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1.5}
                textTransform="uppercase" letterSpacing="wider">Priority</Text>
              <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="8px"
                border={`1px solid ${CARD_BD}`} p="3px" h="36px">
                {['low', 'medium', 'high', 'critical'].map(p => {
                  const meta = PRIORITY_META[p];
                  const act  = priority === p;
                  return (
                    <Button key={p} flex={1} size="xs" h="auto" borderRadius="6px"
                      fontSize="10px" fontWeight="bold"
                      bg={act ? `${meta.color}18` : 'transparent'}
                      color={act ? meta.color : MUTED}
                      border={act ? `1px solid ${meta.color}40` : '1px solid transparent'}
                      _hover={{ color: meta.color }}
                      onClick={() => setPriority(p)}>
                      {meta.label}
                    </Button>
                  );
                })}
              </Flex>
            </Box>

            <Box flex={1} minW="200px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                textTransform="uppercase" letterSpacing="wider">Assigned Operator</Text>
              <Flex align="center" gap={2}>
                <OperatorDot name={selectedAssignee ? displayName(selectedAssignee) : ''} size={28} />
                <Select h="36px" fontSize="sm" borderRadius="8px" flex={1}
                  bg="rgba(255,255,255,0.03)" borderColor={CARD_BD}
                  color="var(--dash-text-primary)"
                  focusBorderColor={A_B}
                  sx={{ '& option': { background: '#14181f' } }}
                  value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {teamOperators.map(op => (
                    <option key={op.id} value={op.id}>
                      {displayName(op)}{String(op.id) === String(myId) ? ' (you)' : ''}
                    </option>
                  ))}
                </Select>
              </Flex>
              {teamOperators.length === 0 && (
                <Text fontSize="10px" color={MUTED} mt={1} fontStyle="italic">
                  No operators assigned to this engagement yet
                </Text>
              )}
            </Box>

            <Box flex={1} minW="180px">
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                textTransform="uppercase" letterSpacing="wider">Due Date</Text>
              <Input h="36px" fontSize="sm" borderRadius="8px" type="datetime-local"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-primary)"
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                sx={{ colorScheme: 'dark' }}
                value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </Box>
          </Flex>

          <Box mb={4}>
            <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
              textTransform="uppercase" letterSpacing="wider">Tags (comma-separated)</Text>
            <Input h="36px" fontSize="sm" borderRadius="8px"
              bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
              color="var(--dash-text-primary)"
              _placeholder={{ color: MUTED, fontSize: '12px' }}
              _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
              placeholder="ad, kerberoast, high-value, pre-phase-2"
              value={tagsText} onChange={e => setTagsText(e.target.value)} />
          </Box>

          {/* ─── Description ─────────────────────────────────────────────── */}
          <Box mb={4}>
            <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
              textTransform="uppercase" letterSpacing="wider">Summary / Description</Text>
            <Textarea fontSize="13px" borderRadius="9px" minH="70px"
              bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
              color="var(--dash-text-primary)"
              _placeholder={{ color: MUTED }}
              _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
              placeholder="What needs to happen? One or two sentences…"
              value={description} onChange={e => setDescription(e.target.value)}
              resize="vertical" />
          </Box>

          {/* ─── Rich content blocks ─────────────────────────────────────── */}
          <Box mb={4}>
            <Flex align="center" justify="space-between" mb={2}>
              <Text fontSize="9px" fontWeight="bold" color={MUTED}
                textTransform="uppercase" letterSpacing="wider">
                Details · {blocks.length} block{blocks.length !== 1 ? 's' : ''}
              </Text>
              <Flex gap={1}>
                <Button size="xs" h="26px" px={3} borderRadius="6px"
                  fontSize="10px" fontWeight="bold"
                  bg={`${ACCENT}10`} border={`1px solid ${ACCENT}30`}
                  color={ACCENT} _hover={{ bg: `${ACCENT}20` }}
                  leftIcon={<AddIcon boxSize={2} />}
                  onClick={() => addBlock('text')}>Text</Button>
                <Button size="xs" h="26px" px={3} borderRadius="6px"
                  fontSize="10px" fontWeight="bold"
                  bg={`${CYAN}10`} border={`1px solid ${CYAN}30`}
                  color={CYAN} _hover={{ bg: `${CYAN}20` }}
                  leftIcon={<AddIcon boxSize={2} />}
                  onClick={() => addBlock('code')}>Code</Button>
                <Button size="xs" h="26px" px={3} borderRadius="6px"
                  fontSize="10px" fontWeight="bold"
                  bg={`${ORANGE}10`} border={`1px solid ${ORANGE}30`}
                  color={ORANGE} _hover={{ bg: `${ORANGE}20` }}
                  leftIcon={<AddIcon boxSize={2} />}
                  onClick={() => addBlock('image')}>Image</Button>
              </Flex>
            </Flex>

            {blocks.length === 0 ? (
              <Box py={6} borderRadius="9px" border={`1px dashed ${CARD_BD}`}
                bg="rgba(255,255,255,0.015)" textAlign="center">
                <Text fontSize="11px" color={MUTED} opacity={0.5}>
                  Add text notes, code blocks, or screenshots to document the task
                </Text>
              </Box>
            ) : (
              <Flex direction="column" gap={2}>
                <AnimatePresence>
                  {blocks.map((b, i) => (
                    <BlockEditor key={b._id || i}
                      block={b} index={i} total={blocks.length}
                      onUpdate={u => updateBlock(i, u)}
                      onDelete={() => deleteBlock(i)}
                      onMove={d => moveBlock(i, d)} />
                  ))}
                </AnimatePresence>
              </Flex>
            )}
          </Box>

          {/* ─── Checklist ───────────────────────────────────────────────── */}
          <Box mb={4}>
            <Flex align="center" justify="space-between" mb={2}>
              <Flex align="center" gap={2}>
                <Text fontSize="9px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">
                  Checklist
                </Text>
                {checklist.length > 0 && (
                  <Box px="7px" py="1px" borderRadius="full"
                    bg={doneCount === checklist.length ? `${GREEN}12` : A_S}
                    border={`1px solid ${doneCount === checklist.length ? `${GREEN}30` : A_B}`}>
                    <Text fontSize="9px" fontWeight="bold"
                      color={doneCount === checklist.length ? GREEN : ACCENT}>
                      {doneCount}/{checklist.length}
                    </Text>
                  </Box>
                )}
              </Flex>
            </Flex>

            {/* Progress bar */}
            {checklist.length > 0 && (
              <Box h="3px" borderRadius="full" bg="rgba(255,255,255,0.06)"
                overflow="hidden" mb={2}>
                <Box h="full" borderRadius="full" bg={GREEN}
                  w={`${(doneCount / checklist.length) * 100}%`}
                  transition="width 0.3s" />
              </Box>
            )}

            <Flex direction="column" gap={1} mb={2}>
              {checklist.map((item, i) => (
                <Flex key={i} align="center" gap={2} px={3} py="6px"
                  borderRadius="7px" _hover={{ bg: 'rgba(255,255,255,0.025)' }}
                  role="group">
                  <Checkbox
                    isChecked={item.done}
                    onChange={() => toggleCheck(i)}
                    colorScheme="purple"
                    size="sm" />
                  <Text flex={1} fontSize="12px"
                    color={item.done ? MUTED : 'var(--dash-text-primary)'}
                    textDecoration={item.done ? 'line-through' : 'none'}
                    noOfLines={1}>
                    {item.text}
                  </Text>
                  <IconButton icon={<DeleteIcon boxSize={2.5} />}
                    size="xs" variant="ghost" color={MUTED}
                    opacity={0} _groupHover={{ opacity: 1 }}
                    _hover={{ color: RED }}
                    onClick={() => removeCheck(i)} aria-label="remove" />
                </Flex>
              ))}
            </Flex>

            <Flex gap={2}>
              <Input h="32px" fontSize="12px" borderRadius="7px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-primary)"
                _placeholder={{ color: MUTED, fontSize: '12px' }}
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                placeholder="Add a checklist item…"
                value={newCheck} onChange={e => setNewCheck(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())} />
              <Button size="sm" h="32px" px={3} borderRadius="7px" fontSize="11px"
                bg={A_S} border={`1px solid ${A_B}`} color={ACCENT}
                _hover={{ bg: `${ACCENT}20` }}
                onClick={addChecklistItem} isDisabled={!newCheck.trim()}>
                Add
              </Button>
            </Flex>
          </Box>
        </ModalBody>

        <ModalFooter gap={2}>
          {editing && (
            <Button size="sm" variant="ghost" color={MUTED}
              _hover={{ color: RED, bg: 'rgba(252,129,129,0.1)' }}
              leftIcon={<DeleteIcon />} onClick={() => onDelete(task._id)}>
              Delete
            </Button>
          )}
          <Box flex={1} />
          <Button size="sm" variant="ghost" color={MUTED}
            _hover={{ color: 'white' }} onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" fontWeight="semibold" fontSize="12px"
            bg={`${ACCENT}15`} border={`1px solid ${A_B}`} color={ACCENT}
            _hover={{ bg: `${ACCENT}25` }}
            leftIcon={saving ? <Spinner size="xs" /> : <CheckIcon boxSize={3} />}
            onClick={handleSave} isDisabled={saving || !title.trim()}>
            {editing ? 'Save Task' : 'Create Task'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ── Confirm delete modal ──────────────────────────────────────────────────────
const ConfirmDelete = ({ target, onClose, onConfirm }) => (
  <Modal isOpen={!!target} onClose={onClose} size="md" isCentered>
    <ModalOverlay backdropFilter="blur(8px)" bg="rgba(0,0,0,0.6)" />
    <ModalContent bg={CARD_BG} border={`1px solid ${CARD_BD}`} borderRadius="14px">
      <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
        style={{ background: `linear-gradient(to right, transparent, ${RED}90, transparent)` }} />
      <ModalBody py={6}>
        <Flex direction="column" align="center" gap={4}>
          <Box w="52px" h="52px" borderRadius="full"
            bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.28)"
            display="flex" alignItems="center" justifyContent="center">
            <WarningTwoIcon boxSize={5} color={RED} />
          </Box>
          <Box textAlign="center">
            <Text fontSize="16px" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
              Delete this task?
            </Text>
            <Text fontSize="12px" color="var(--dash-text-secondary)">
              All notes, blocks, and checklist items will be lost
            </Text>
          </Box>
          {target && (
            <Box w="full" p={3} borderRadius="9px"
              bg="rgba(255,255,255,0.025)" border={`1px solid ${CARD_BD}`}>
              <Text fontSize="12px" fontWeight="semibold"
                color="var(--dash-text-primary)" noOfLines={1}>
                {target.title}
              </Text>
            </Box>
          )}
        </Flex>
      </ModalBody>
      <ModalFooter gap={2} pt={0}>
        <Button flex={1} size="sm" h="38px" borderRadius="9px" fontWeight="semibold" fontSize="12px"
          bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}
          color="var(--dash-text-secondary)"
          _hover={{ bg: 'rgba(255,255,255,0.08)' }} onClick={onClose}>
          Cancel
        </Button>
        <Button flex={1} size="sm" h="38px" borderRadius="9px" fontWeight="semibold" fontSize="12px"
          bg="rgba(252,129,129,0.14)" border={`1px solid ${RED}50`}
          color={RED} _hover={{ bg: 'rgba(252,129,129,0.24)' }}
          leftIcon={<DeleteIcon boxSize={2.5} />} onClick={onConfirm}>
          Delete
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

// ── Main View ─────────────────────────────────────────────────────────────────
const TasksPlannerView = () => {
  const { slug }      = useParams();
  const { getBySlug, getUserById } = useEngagements();
  const { user }      = useAuth();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const myId   = user?._id || user?.id;
  const myName = user?.callsign || user?.name || user?.email || '';

  // ── Operators assigned to THIS engagement ────────────────────────────────────
  const teamOperators = useMemo(() => {
    const ids = (eng?.operators || []).map(String);
    return ids
      .map(id => {
        const u = getUserById(id);
        return u ? { ...u, id: String(u.id) } : null;
      })
      .filter(Boolean);
  }, [eng?.operators, getUserById]);

  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [filter,    setFilter]    = useState('all');   // all|mine|unassigned|overdue|critical

  const [draggedTaskId,  setDraggedTaskId]  = useState(null);
  const [dropHoverPhase, setDropHoverPhase] = useState(null);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editTask,  setEditTask]    = useState(null);      // full object from GET
  const [deleting,  setDeleting]    = useState(null);

  // Quick-add form
  const [qTitle,      setQTitle]      = useState('');
  const [qPriority,   setQPriority]   = useState('medium');
  const [qAssigneeId, setQAssigneeId] = useState('');
  const [qStatus,     setQStatus]     = useState('backlog');
  const [creating,    setCreating]    = useState(false);

  const pollRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async (silent = false) => {
    if (!engId) return;
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`/api/tasks/${engId}/tasks`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (r.ok) setTasks(await r.json());
    } catch (_) {} finally {
      if (!silent) setLoading(false);
    }
  }, [engId]);

  useEffect(() => {
    if (!engId) return;
    fetchTasks();
    pollRef.current = setInterval(() => fetchTasks(true), 6000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [engId, fetchTasks]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const mineMatch = (t) => String(t.assignedOperatorId || '') === String(myId || '');

  const visibleTasks = useMemo(() => tasks.filter(t => {
    if (filter === 'mine')       return mineMatch(t);
    if (filter === 'unassigned') return !t.assignedOperatorName?.trim();
    if (filter === 'overdue')    return isOverdue(t.dueDate, t.status);
    if (filter === 'critical')   return t.priority === 'critical' || t.priority === 'high';
    return true;
  }), [tasks, filter, myId, myName]);

  // Stats
  const total     = tasks.length;
  const mineCnt   = tasks.filter(mineMatch).filter(t => t.status !== 'done').length;
  const overdueCnt= tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const doneCnt   = tasks.filter(t => t.status === 'done').length;

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const onDragStart = (e, task) => {
    setDraggedTaskId(task._id);
    try { e.dataTransfer.setData('text/plain', task._id); } catch (_) {}
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  };
  const onDragEnd    = () => { setDraggedTaskId(null); setDropHoverPhase(null); };
  const onDragOver   = (phaseKey) => { if (dropHoverPhase !== phaseKey) setDropHoverPhase(phaseKey); };
  const onDragLeave  = () => setDropHoverPhase(null);

  const onDrop = async (e, statusKey) => {
    e.preventDefault();
    const id = draggedTaskId || e.dataTransfer?.getData('text/plain');
    setDraggedTaskId(null); setDropHoverPhase(null);
    if (!id) return;
    const task = tasks.find(t => t._id === id);
    if (!task || task.status === statusKey) return;

    // Optimistic
    setTasks(p => p.map(t => t._id === id
      ? { ...t, status: statusKey, updatedAt: new Date() } : t));

    try {
      const r = await fetch(`/api/tasks/${engId}/tasks/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusKey }),
      });
      if (!r.ok) throw new Error('Failed');
      const updated = await r.json();
      setTasks(p => p.map(t => t._id === id ? updated : t));
    } catch (_) {
      fetchTasks(true);
      toast({ title: 'Move failed', status: 'error', duration: 2000, isClosable: true });
    }
  };

  // ── Card click → fetch full task then open modal ─────────────────────────────
  const openTask = async (taskLight) => {
    try {
      const r = await fetch(`/api/tasks/${engId}/tasks/${taskLight._id}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (r.ok) {
        setEditTask(await r.json());
        setModalOpen(true);
      }
    } catch (_) {
      toast({ title: 'Could not open task', status: 'error', duration: 2000, isClosable: true });
    }
  };

  // ── Quick-create ────────────────────────────────────────────────────────────
  const quickCreate = async () => {
    if (!qTitle.trim()) return;
    setCreating(true);
    try {
      const op = teamOperators.find(o => String(o.id) === String(qAssigneeId));
      const r = await fetch(`/api/tasks/${engId}/tasks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: qTitle, priority: qPriority, status: qStatus,
          assignedOperatorId:   op ? op.id : '',
          assignedOperatorName: op ? displayName(op) : '',
        }),
      });
      if (!r.ok) throw new Error('Failed');
      const created = await r.json();
      const light = { ...created }; delete light.blocks; delete light.comments;
      setTasks(p => [light, ...p]);
      setQTitle(''); setQAssigneeId('');
      toast({ title: 'Task created', status: 'success', duration: 1500, isClosable: true });
    } catch (e) {
      toast({ title: 'Create failed', status: 'error', duration: 2000, isClosable: true });
    } finally { setCreating(false); }
  };

  // ── Save (from modal — create or update) ─────────────────────────────────────
  const saveTask = async (payload) => {
    const url    = editTask?._id
      ? `/api/tasks/${engId}/tasks/${editTask._id}`
      : `/api/tasks/${engId}/tasks`;
    const method = editTask?._id ? 'PATCH' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || 'Failed');
      }
      const saved = await r.json();
      const light = { ...saved }; delete light.blocks; delete light.comments;
      setTasks(p => {
        const idx = p.findIndex(x => x._id === saved._id);
        return idx === -1 ? [light, ...p] : p.map(x => x._id === saved._id ? light : x);
      });
      toast({ title: editTask?._id ? 'Task saved' : 'Task created',
        status: 'success', duration: 1500, isClosable: true });
    } catch (e) {
      toast({ title: 'Save failed', description: e.message,
        status: 'error', duration: 3000, isClosable: true });
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteTask = async (id) => {
    try {
      await fetch(`/api/tasks/${engId}/tasks/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      setTasks(p => p.filter(t => t._id !== id));
      setDeleting(null);
      setModalOpen(false); setEditTask(null);
      toast({ title: 'Deleted', status: 'success', duration: 1500, isClosable: true });
    } catch (_) {
      toast({ title: 'Delete failed', status: 'error', duration: 2000, isClosable: true });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box mb={5}>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
          Tasks <Text as="span" color="red.400">Planner</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          {eng?.name} · plan the work · attach notes, code, screenshots · assign and track to done
        </Text>
      </Box>

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px" bg={A_S} border={`1px solid ${A_B}`}>
        <Flex align="center" gap={2} mb={1.5}>
          <EditIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            Rich Task Board — Backlog to Done
          </Text>
        </Flex>
        <Flex gap={5} flexWrap="wrap">
          {[
            'Drag cards across Backlog → In Progress → Blocked → Review → Done',
            'Click a card to add text notes, code blocks, images, and checklists',
            'Assign operators, set due dates, tag by theme, priority-sort',
            'Everything persists — pick up where a teammate left off',
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

        {/* ── Left ────────────────────────────────────────────────────────── */}
        <Flex direction="column" flex="1" gap={4} pr={6} minW={0}>

          {/* ── Quick-add card ──────────────────────────────────────────── */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />
            <Flex align="center" gap={2} px={5} py={3}
              borderBottom={`1px solid ${CARD_BD}`}>
              <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
              <Text fontSize="10px" fontWeight="bold" color={MUTED}
                textTransform="uppercase" letterSpacing="wider">Quick Add</Text>
              <Box flex={1} />
              <Button size="xs" h="26px" px={3} borderRadius="6px"
                fontSize="10px" fontWeight="bold"
                bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-secondary)"
                _hover={{ borderColor: A_B, color: ACCENT }}
                leftIcon={<EditIcon boxSize={2.5} />}
                onClick={() => { setEditTask(null); setModalOpen(true); }}>
                Full Editor
              </Button>
            </Flex>

            <Box px={5} py={3}>
              <Flex gap={2} flexWrap="wrap">
                <Input flex={2} minW="200px" h="36px" fontSize="sm" borderRadius="8px"
                  bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                  color="var(--dash-text-primary)"
                  _placeholder={{ color: MUTED, fontSize: '12px' }}
                  _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                  placeholder="Task title · one line"
                  value={qTitle} onChange={e => setQTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !creating && quickCreate()} />

                <Select w="130px" h="36px" fontSize="sm" borderRadius="8px"
                  bg="rgba(255,255,255,0.03)" borderColor={CARD_BD}
                  color="var(--dash-text-primary)"
                  focusBorderColor={A_B}
                  sx={{ '& option': { background: '#14181f' } }}
                  value={qStatus} onChange={e => setQStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </Select>

                <Select w="120px" h="36px" fontSize="sm" borderRadius="8px"
                  bg="rgba(255,255,255,0.03)" borderColor={CARD_BD}
                  color="var(--dash-text-primary)"
                  focusBorderColor={A_B}
                  sx={{ '& option': { background: '#14181f' } }}
                  value={qPriority} onChange={e => setQPriority(e.target.value)}>
                  {Object.keys(PRIORITY_META).map(p => (
                    <option key={p} value={p}>{PRIORITY_META[p].label}</option>
                  ))}
                </Select>

                <Select w="180px" h="36px" fontSize="sm" borderRadius="8px"
                  bg="rgba(255,255,255,0.03)" borderColor={CARD_BD}
                  color="var(--dash-text-primary)"
                  focusBorderColor={A_B}
                  sx={{ '& option': { background: '#14181f' } }}
                  value={qAssigneeId} onChange={e => setQAssigneeId(e.target.value)}
                  isDisabled={teamOperators.length === 0}>
                  <option value="">Unassigned</option>
                  {teamOperators.map(op => (
                    <option key={op.id} value={op.id}>
                      {displayName(op)}{String(op.id) === String(myId) ? ' (you)' : ''}
                    </option>
                  ))}
                </Select>

                <Button size="sm" h="36px" px={4} borderRadius="8px" fontWeight="semibold" fontSize="12px"
                  bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
                  color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                  leftIcon={creating ? <Spinner size="xs" /> : <AddIcon boxSize={2.5} />}
                  onClick={quickCreate} isDisabled={creating || !qTitle.trim()}>
                  Create
                </Button>
              </Flex>
            </Box>
          </Box>

          {/* ── Stats strip ─────────────────────────────────────────────── */}
          <Flex gap={3}>
            {[
              { label: 'Total',      value: total,       color: ACCENT },
              { label: 'Assigned to me', value: mineCnt, color: BLUE   },
              { label: 'Overdue',    value: overdueCnt,  color: overdueCnt ? RED : MUTED },
              { label: 'Completed',  value: doneCnt,     color: GREEN  },
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
                  {value}
                </Text>
              </MotionBox>
            ))}
          </Flex>

          {/* ── Toolbar ──────────────────────────────────────────────────── */}
          <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
            <Flex gap={1.5} flexWrap="wrap">
              {[
                { k: 'all',         label: 'All',        color: ACCENT, count: tasks.length },
                { k: 'mine',        label: 'Mine',       color: BLUE,
                  count: tasks.filter(mineMatch).length },
                { k: 'unassigned',  label: 'Unassigned', color: GOLD,
                  count: tasks.filter(t => !t.assignedOperatorName?.trim()).length },
                { k: 'overdue',     label: 'Overdue',    color: RED,
                  count: overdueCnt },
                { k: 'critical',    label: 'High/Crit',  color: ORANGE,
                  count: tasks.filter(t => t.priority === 'critical' || t.priority === 'high').length },
              ].map(({ k, label, color, count }) => {
                const act = filter === k;
                return (
                  <Button key={k} size="xs" h="26px" px={3} borderRadius="7px"
                    fontSize="10px" fontWeight="bold"
                    bg={act ? `${color}18` : 'transparent'}
                    color={act ? color : MUTED}
                    border={act ? `1px solid ${color}40` : `1px solid ${CARD_BD}`}
                    _hover={{ color, bg: `${color}10` }}
                    onClick={() => setFilter(k)}>
                    {label}
                    <Box as="span" ml={1.5} opacity={0.7}>{count}</Box>
                  </Button>
                );
              })}
            </Flex>
            <Tooltip label="Refresh" hasArrow fontSize="10px">
              <IconButton size="xs" h="26px" w="26px" borderRadius="7px" variant="ghost"
                icon={<RepeatIcon />} color={MUTED} _hover={{ color: ACCENT }}
                onClick={() => fetchTasks()} aria-label="refresh" />
            </Tooltip>
          </Flex>

          {/* ── Kanban board ─────────────────────────────────────────────── */}
          {loading && tasks.length === 0 ? (
            <Flex align="center" justify="center" py={20}>
              <Spinner color={ACCENT} size="lg" thickness="2px" />
            </Flex>
          ) : (
            <Box overflowX="auto" pb={3}
              css={{
                '&::-webkit-scrollbar': { height: '7px' },
                '&::-webkit-scrollbar-thumb': { background: A_B, borderRadius: '4px' },
              }}>
              <Flex gap={3} align="stretch" minW="min-content">
                {STATUSES.map(phase => (
                  <Column key={phase.key} phase={phase}
                    tasks={visibleTasks.filter(t => t.status === phase.key)}
                    myId={myId} myName={myName}
                    draggedTaskId={draggedTaskId} dropHoverPhase={dropHoverPhase}
                    onDragStart={onDragStart} onDragEnd={onDragEnd}
                    onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                    onCardClick={openTask} />
                ))}
              </Flex>
            </Box>
          )}
        </Flex>

        {/* ── Right column ────────────────────────────────────────────────── */}
        <Box w="260px" flexShrink={0} borderLeft={`1px solid ${CARD_BD}`} pl={5}>

          <Flex align="center" gap={2} mb={4}>
            <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
            <Text fontSize="10px" color={MUTED} textTransform="uppercase"
              letterSpacing="widest" fontWeight="bold">My Tasks</Text>
            {mineCnt > 0 && (
              <Box px={2} py="1px" borderRadius="full"
                bg={A_S} border={`1px solid ${A_B}`}>
                <Text fontSize="10px" color={ACCENT} fontWeight="bold">{mineCnt}</Text>
              </Box>
            )}
          </Flex>

          {tasks.filter(mineMatch).filter(t => t.status !== 'done').length === 0 ? (
            <Flex align="center" justify="center" py={10}>
              <Text fontSize="11px" color={MUTED} opacity={0.4}>
                Nothing assigned to you
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" gap={1}>
              {tasks.filter(mineMatch).filter(t => t.status !== 'done')
                .sort((a, b) => {
                  const prioOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                  return prioOrder[a.priority] - prioOrder[b.priority];
                })
                .slice(0, 10)
                .map(t => {
                  const prio = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                  const stat = STATUSES.find(s => s.key === t.status);
                  const over = isOverdue(t.dueDate, t.status);
                  return (
                    <Box key={t._id} px={3} py="9px" borderRadius="9px" cursor="pointer"
                      border="1px solid transparent"
                      _hover={{ bg: 'rgba(255,255,255,0.04)', borderColor: A_B }}
                      onClick={() => openTask(t)}>
                      <Flex align="center" gap={1.5} mb={1}>
                        <Box w="5px" h="5px" borderRadius="full" bg={prio.color}
                          boxShadow={prio.color !== MUTED ? `0 0 5px ${prio.color}70` : 'none'} />
                        <Text fontSize="11px" fontWeight="semibold"
                          color="var(--dash-text-primary)" noOfLines={1} flex={1}>
                          {t.title}
                        </Text>
                      </Flex>
                      <Flex align="center" gap={1.5} flexWrap="wrap">
                        <Box px="5px" py="1px" borderRadius="3px"
                          bg={`${stat.color}12`} border={`1px solid ${stat.color}30`}>
                          <Text fontSize="9px" fontWeight="bold" color={stat.color}>
                            {stat.label}
                          </Text>
                        </Box>
                        {over && (
                          <Text fontSize="9px" color={RED} fontWeight="bold">
                            {fmtDue(t.dueDate)}
                          </Text>
                        )}
                        {t.dueDate && !over && (
                          <Text fontSize="9px" color={MUTED}>{fmtDue(t.dueDate)}</Text>
                        )}
                      </Flex>
                    </Box>
                  );
                })}
            </Flex>
          )}

          {/* Priority breakdown */}
          <Box mt={5} pt={4} borderTop={`1px solid ${CARD_BD}`}>
            <Text fontSize="9px" color={MUTED} textTransform="uppercase"
              letterSpacing="wider" fontWeight="bold" mb={2}>By Priority</Text>
            <Flex direction="column" gap={1.5}>
              {['critical', 'high', 'medium', 'low'].map(p => {
                const meta = PRIORITY_META[p];
                const cnt  = tasks.filter(t => t.priority === p && t.status !== 'done').length;
                if (cnt === 0) return null;
                return (
                  <Flex key={p} align="center" gap={2} px={2} py="3px">
                    <Box w="6px" h="6px" borderRadius="full" bg={meta.color} />
                    <Text fontSize="11px" color="var(--dash-text-secondary)" flex={1}>
                      {meta.label}
                    </Text>
                    <Text fontSize="11px" color={meta.color} fontWeight="bold">
                      {cnt}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </Box>
      </Flex>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        task={editTask}
        onSave={saveTask}
        onDelete={(id) => setDeleting(tasks.find(t => t._id === id) || editTask)}
        teamOperators={teamOperators}
        myId={myId}
      />

      <ConfirmDelete
        target={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteTask(deleting._id)}
      />
    </Box>
  );
};

export default TasksPlannerView;
