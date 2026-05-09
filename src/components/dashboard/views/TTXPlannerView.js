import { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Textarea,
  SimpleGrid, Modal, ModalOverlay, ModalContent, ModalBody, Icon,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CloseIcon } from '@chakra-ui/icons';
import { FaMap } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEngagements } from '../../../contexts/EngagementContext';

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_META = {
  'Pending':     { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.25)' },
  'In Progress': { color: '#fcd34d', bg: 'rgba(252,211,77,0.1)',   border: 'rgba(252,211,77,0.25)'  },
  'Done':        { color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)',  border: 'rgba(110,231,183,0.25)' },
  'Blocked':     { color: '#fc8181', bg: 'rgba(252,129,129,0.1)',  border: 'rgba(252,129,129,0.25)' },
};
const STATUS_CYCLE = {
  'Pending': 'In Progress', 'In Progress': 'Done', 'Done': 'Blocked', 'Blocked': 'Pending',
};

const SUGGESTED_PHASES = [
  { title: 'Reconnaissance',       tactics: 'TA0043', tools: 'Shodan, OSINT Framework, theHarvester' },
  { title: 'Initial Access',       tactics: 'TA0001', tools: 'Phishing, Exploit Public-Facing Application' },
  { title: 'Execution',            tactics: 'TA0002', tools: 'PowerShell, cmd, mshta' },
  { title: 'Persistence',          tactics: 'TA0003', tools: 'Registry Run Keys, Scheduled Tasks' },
  { title: 'Privilege Escalation', tactics: 'TA0004', tools: 'BloodHound, PowerUp, BeRoot' },
  { title: 'Defense Evasion',      tactics: 'TA0005', tools: 'AMSI Bypass, LOLBins, Obfuscation' },
  { title: 'Credential Access',    tactics: 'TA0006', tools: 'Mimikatz, Rubeus, Responder' },
  { title: 'Lateral Movement',     tactics: 'TA0008', tools: 'PsExec, WMI, Pass-the-Hash' },
  { title: 'Exfiltration',         tactics: 'TA0010', tools: 'DNS Tunneling, HTTPS, FTP' },
  { title: 'Impact',               tactics: 'TA0040', tools: 'Ransomware sim, Data Destruction sim' },
];

const inputBase = {
  bg: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: 'var(--dash-text-primary)',
  fontSize: 'sm',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.35)' },
  _focus: { border: '1px solid rgba(255,80,95,0.65)', boxShadow: '0 0 0 1px rgba(255,80,95,0.25)', outline: 'none' },
};

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1.5}>{children}</Text>
);

// ── Auto-save textarea ─────────────────────────────────────────────────────────
const AutoTextarea = ({ value: ext, onSave, placeholder, rows = 3 }) => {
  const [val, setVal] = useState(ext || '');
  useEffect(() => { setVal(ext || ''); }, [ext]);
  return (
    <Textarea value={val} onChange={e => setVal(e.target.value)}
      onBlur={() => { if (val !== (ext || '')) onSave(val); }}
      placeholder={placeholder} variant="unstyled"
      px={4} py={3} rows={rows} resize="none" {...inputBase} />
  );
};

// ── Operator chip ──────────────────────────────────────────────────────────────
const OperatorChip = ({ user, selected, onToggle }) => (
  <Flex as="button" align="center" gap={1.5} px={2} py={1} borderRadius="7px"
    cursor="pointer" transition="all 0.12s"
    bg={selected ? 'rgba(79,209,197,0.12)' : 'rgba(255,255,255,0.03)'}
    border={`1px solid ${selected ? 'rgba(79,209,197,0.35)' : 'rgba(255,255,255,0.08)'}`}
    _hover={{ borderColor: 'rgba(79,209,197,0.4)', bg: 'rgba(79,209,197,0.08)' }}
    onClick={() => onToggle(String(user.id))}>
    <Flex w="18px" h="18px" borderRadius="5px" align="center" justify="center"
      bg={selected ? 'rgba(79,209,197,0.2)' : 'rgba(255,255,255,0.06)'}
      fontSize="7px" fontWeight="bold"
      color={selected ? '#4fd1c5' : 'var(--dash-text-muted)'} fontFamily="mono">
      {user.callsign.slice(0, 2).toUpperCase()}
    </Flex>
    <Text fontSize="11px" color={selected ? '#4fd1c5' : 'var(--dash-text-secondary)'}
      fontWeight={selected ? 'semibold' : 'normal'}>
      {user.callsign}
    </Text>
  </Flex>
);

// ── Drag handle icon ───────────────────────────────────────────────────────────
const DragHandleIcon = ({ isDragging }) => (
  <Flex direction="column" gap="3px" px={1} cursor={isDragging ? 'grabbing' : 'grab'}
    opacity={0.35} _hover={{ opacity: 0.8 }} transition="opacity 0.15s" flexShrink={0}>
    {[0, 1, 2].map(i => (
      <Flex key={i} gap="3px">
        <Box w="3px" h="3px" borderRadius="full" bg="var(--dash-text-muted)" />
        <Box w="3px" h="3px" borderRadius="full" bg="var(--dash-text-muted)" />
      </Flex>
    ))}
  </Flex>
);

// ── Expand / Collapse button ───────────────────────────────────────────────────
const ExpandBtn = ({ expanded, onClick }) => (
  <Flex
    as="button" align="center" gap={1.5} px={3} py={1.5} borderRadius="8px"
    fontSize="11px" fontWeight="semibold" cursor="pointer" transition="all 0.15s"
    bg={expanded ? 'rgba(255,80,95,0.1)' : 'rgba(255,255,255,0.05)'}
    border={`1px solid ${expanded ? 'rgba(255,80,95,0.35)' : 'rgba(255,255,255,0.1)'}`}
    color={expanded ? 'rgba(255,130,130,0.9)' : 'var(--dash-text-muted)'}
    _hover={{ bg: 'rgba(255,80,95,0.1)', borderColor: 'rgba(255,80,95,0.35)', color: 'rgba(255,130,130,0.9)' }}
    onClick={onClick}
  >
    {expanded ? 'Collapse' : 'Details'}
    <Box
      as="span" transition="transform 0.2s"
      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
    >
      ▾
    </Box>
  </Flex>
);

// ── Sortable Phase card ────────────────────────────────────────────────────────
const PhaseCard = ({ phase, index, allUsers, onUpdate, onDelete }) => {
  const pid = phase.id || String(phase._id);
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: pid });

  const [expanded, setExpanded] = useState(false);
  const sm = STATUS_META[phase.status] || STATUS_META['Pending'];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity:   isDragging ? 0.4 : 1,
    zIndex:    isDragging ? 50 : 'auto',
  };

  const update = (patch) => onUpdate(pid, patch);

  const toggleAssignee = (uid) => {
    const curr = phase.assignedTo || [];
    update({ assignedTo: curr.includes(uid) ? curr.filter(id => id !== uid) : [...curr, uid] });
  };

  const assignees = (phase.assignedTo || [])
    .map(id => allUsers.find(u => String(u.id) === String(id)))
    .filter(Boolean);

  return (
    <Box ref={setNodeRef} style={style} pos="relative" bg="var(--dash-card-bg)"
      border={`1px solid ${isDragging ? 'rgba(255,80,95,0.4)' : 'var(--dash-card-border)'}`}
      borderRadius="14px" overflow="hidden"
      boxShadow={isDragging ? '0 8px 32px rgba(0,0,0,0.4)' : 'none'}
      transition="border-color 0.18s, box-shadow 0.18s">

      {/* Status accent bar */}
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${sm.color}88, transparent)` }} />

      {/* Header row */}
      <Flex align="center" gap={3} px={3} pt={3} pb={expanded ? 2 : 3}>

        {/* Drag handle */}
        <Box {...attributes} {...listeners}>
          <DragHandleIcon isDragging={isDragging} />
        </Box>

        {/* Phase number badge */}
        <Flex w="26px" h="26px" borderRadius="8px" align="center" justify="center"
          flexShrink={0} fontFamily="mono" fontSize="11px" fontWeight="bold"
          bg={sm.bg} border={`1px solid ${sm.border}`} color={sm.color}>
          {index + 1}
        </Flex>

        {/* Title — inline edit */}
        <Input
          value={phase.title}
          onChange={e => update({ title: e.target.value })}
          variant="unstyled" fontSize="13px" fontWeight="semibold" flex="1"
          color="var(--dash-text-primary)"
          _placeholder={{ color: 'var(--dash-text-muted)' }}
          placeholder="Phase title…" px={0}
        />

        {/* Assignee avatars (collapsed only) */}
        {assignees.length > 0 && !expanded && (
          <Flex gap={1} flexShrink={0}>
            {assignees.slice(0, 3).map(u => (
              <Flex key={u.id} w="22px" h="22px" borderRadius="6px" align="center" justify="center"
                bg="rgba(79,209,197,0.1)" border="1px solid rgba(79,209,197,0.2)"
                fontSize="8px" fontWeight="bold" color="#4fd1c5" fontFamily="mono"
                title={u.callsign}>
                {u.callsign.slice(0, 2).toUpperCase()}
              </Flex>
            ))}
            {assignees.length > 3 && (
              <Flex w="22px" h="22px" borderRadius="6px" align="center" justify="center"
                bg="rgba(255,255,255,0.05)" fontSize="8px" color="var(--dash-text-muted)">
                +{assignees.length - 3}
              </Flex>
            )}
          </Flex>
        )}

        {/* Status cycle */}
        <Box as="button" flexShrink={0} px={2.5} py="4px" borderRadius="20px"
          fontSize="9px" fontWeight="bold" letterSpacing="wide" textTransform="uppercase"
          cursor="pointer" transition="all 0.15s" whiteSpace="nowrap"
          bg={sm.bg} border={`1px solid ${sm.border}`} color={sm.color}
          _hover={{ filter: 'brightness(1.25)' }}
          onClick={() => update({ status: STATUS_CYCLE[phase.status] })}>
          {phase.status}
        </Box>

        {/* Expand button */}
        <ExpandBtn expanded={expanded} onClick={() => setExpanded(p => !p)} />

        {/* Delete */}
        <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
          color="var(--dash-text-muted)" borderRadius="7px"
          _hover={{ color: 'red.400', bg: 'rgba(255,80,95,0.1)' }}
          onClick={() => onDelete(pid)} aria-label="Delete phase" />
      </Flex>

      {/* Expanded body */}
      {expanded && (
        <Box px={4} pb={4}>
          <Box h="1px" bg="rgba(255,255,255,0.05)" mb={4} />

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <Box>
              <Label>Description / Approach</Label>
              <AutoTextarea value={phase.description}
                onSave={v => update({ description: v })}
                placeholder="What is the goal of this phase? How will it be executed?"
                rows={3} />
            </Box>
            <Box>
              <Box mb={3}>
                <Label>MITRE Tactics / TTPs</Label>
                <AutoTextarea value={phase.tactics}
                  onSave={v => update({ tactics: v })}
                  placeholder="e.g. TA0001, Spearphishing, Kerberoasting…"
                  rows={1} />
              </Box>
              <Box>
                <Label>Tools & Techniques</Label>
                <AutoTextarea value={phase.tools}
                  onSave={v => update({ tools: v })}
                  placeholder="e.g. Rubeus, BloodHound, Mimikatz…"
                  rows={1} />
              </Box>
            </Box>
          </SimpleGrid>

          <Box>
            <Label>Assigned Operators</Label>
            <Flex gap={1.5} flexWrap="wrap">
              {allUsers.map(u => (
                <OperatorChip key={u.id} user={u}
                  selected={(phase.assignedTo || []).includes(String(u.id))}
                  onToggle={toggleAssignee} />
              ))}
              {allUsers.length === 0 && (
                <Text fontSize="11px" color="var(--dash-text-muted)" fontStyle="italic">No users found</Text>
              )}
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// ── Add Phase Modal ────────────────────────────────────────────────────────────
const AddPhaseModal = ({ isOpen, onClose, onAdd }) => {
  const [mode,  setMode]  = useState('custom');
  const [title, setTitle] = useState('');

  const handleAdd = (t) => {
    if (!t?.trim()) return;
    const s = SUGGESTED_PHASES.find(p => p.title === t);
    onAdd({ title: t.trim(), tactics: s?.tactics || '', tools: s?.tools || '', description: '', assignedTo: [], status: 'Pending' });
    setTitle('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
      <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden" p={0}>
        <ModalBody p={0}>
          <Box p={6} pos="relative">
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,80,95,0.5), transparent)' }} />

            <Flex justify="space-between" align="center" mb={5}>
              <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">Add Phase</Text>
              <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" borderRadius="8px"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                onClick={onClose} aria-label="Close" />
            </Flex>

            <Flex gap={2} mb={4}>
              {['custom', 'suggested'].map(m => (
                <Box key={m} as="button" flex="1" py={2} borderRadius="9px" fontSize="12px"
                  fontWeight="semibold" textTransform="capitalize" cursor="pointer" transition="all 0.15s"
                  bg={mode === m ? 'rgba(255,80,95,0.1)' : 'rgba(255,255,255,0.03)'}
                  border={`1px solid ${mode === m ? 'rgba(255,80,95,0.35)' : 'rgba(255,255,255,0.08)'}`}
                  color={mode === m ? 'rgba(255,130,130,0.9)' : 'var(--dash-text-muted)'}
                  onClick={() => setMode(m)}>
                  {m === 'custom' ? 'Custom Phase' : 'From Template'}
                </Box>
              ))}
            </Flex>

            {mode === 'custom' ? (
              <>
                <Box mb={5}>
                  <Label>Phase Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd(title)}
                    placeholder="e.g. Lateral Movement, Persistence…"
                    variant="unstyled" {...inputBase} px={4} h="40px" autoFocus />
                </Box>
                <Flex gap={3}>
                  <Button flex="1" size="sm" variant="ghost" borderRadius="10px"
                    color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.08)"
                    _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                    onClick={onClose}>Cancel</Button>
                  <Button flex="1" size="sm" borderRadius="10px" fontWeight="semibold"
                    bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
                    color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.18)' }}
                    onClick={() => handleAdd(title)}>Add Phase</Button>
                </Flex>
              </>
            ) : (
              <Box>
                <Label>Choose a Template Phase</Label>
                <Flex direction="column" gap={1.5} maxH="280px" overflowY="auto"
                  css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)' } }}>
                  {SUGGESTED_PHASES.map(p => (
                    <Flex key={p.title} align="center" justify="space-between"
                      px={3} py={2.5} borderRadius="9px" cursor="pointer"
                      bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
                      _hover={{ bg: 'rgba(255,80,95,0.07)', borderColor: 'rgba(255,80,95,0.25)' }}
                      transition="all 0.12s" onClick={() => handleAdd(p.title)}>
                      <Box>
                        <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)">{p.title}</Text>
                        <Text fontSize="10px" color="var(--dash-text-muted)" noOfLines={1}>{p.tactics} · {p.tools}</Text>
                      </Box>
                      <AddIcon boxSize={2.5} color="var(--dash-text-muted)" />
                    </Flex>
                  ))}
                </Flex>
              </Box>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// ── Main view ──────────────────────────────────────────────────────────────────
const TTXPlannerView = () => {
  const { slug } = useParams();
  const { getBySlug, updateEngagement, allUsers } = useEngagements();
  const eng = getBySlug(slug);
  const [addModal, setAddModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  if (!eng) return null;

  const phases = [...(eng.ttxPhases || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const phaseIds = phases.map(p => p.id || String(p._id));

  // ── Drag end ────────────────────────────────────────────────────────────────
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = phases.findIndex(p => (p.id || String(p._id)) === active.id);
    const newIdx = phases.findIndex(p => (p.id || String(p._id)) === over.id);
    const reordered = arrayMove(phases, oldIdx, newIdx).map((p, i) => ({ ...p, order: i }));
    updateEngagement(eng.id, { ttxPhases: reordered });
  };

  // ── Phase CRUD ───────────────────────────────────────────────────────────────
  const addPhase = (data) => {
    updateEngagement(eng.id, {
      ttxPhases: [...phases, { id: Date.now().toString(), order: phases.length, ...data }],
    });
  };

  const updatePhase = (pid, patch) => {
    updateEngagement(eng.id, {
      ttxPhases: phases.map(p => (p.id || String(p._id)) === pid ? { ...p, ...patch } : p),
    });
  };

  const deletePhase = (pid) => {
    updateEngagement(eng.id, {
      ttxPhases: phases.filter(p => (p.id || String(p._id)) !== pid).map((p, i) => ({ ...p, order: i })),
    });
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const done     = phases.filter(p => p.status === 'Done').length;
  const blocked  = phases.filter(p => p.status === 'Blocked').length;
  const inProg   = phases.filter(p => p.status === 'In Progress').length;
  const progress = phases.length > 0 ? Math.round((done / phases.length) * 100) : 0;

  return (
    <Box px={6} pb={12}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            TTX <Text as="span" color="red.400">Planner</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · drag to reorder phases, click Details to expand
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" borderRadius="8px"
          bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
          color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.18)' }}
          onClick={() => setAddModal(true)}>
          Add Phase
        </Button>
      </Flex>

      {/* Progress bar */}
      {phases.length > 0 && (
        <Box mb={6} p={4} bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="14px">
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontSize="11px" color="var(--dash-text-muted)">
              {done} of {phases.length} phases complete
            </Text>
            <Flex gap={3}>
              {inProg  > 0 && <Text fontSize="10px" color="#fcd34d">{inProg} in progress</Text>}
              {blocked > 0 && <Text fontSize="10px" color="#fc8181">{blocked} blocked</Text>}
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-secondary)">{progress}%</Text>
            </Flex>
          </Flex>
          <Box h="5px" borderRadius="full" bg="rgba(255,255,255,0.06)" overflow="hidden">
            <Box h="full" borderRadius="full" transition="width 0.5s ease"
              style={{ width: `${progress}%` }}
              bg={progress === 100 ? '#6ee7b7' : blocked > 0 ? '#fc8181' : '#fcd34d'} />
          </Box>
          <Flex gap={1.5} mt={3} flexWrap="wrap">
            {phases.map((p, i) => {
              const sm = STATUS_META[p.status] || STATUS_META['Pending'];
              return (
                <Box key={p.id || String(p._id)} px={2} py="2px" borderRadius="5px"
                  fontSize="9px" fontWeight="semibold" whiteSpace="nowrap"
                  bg={sm.bg} border={`1px solid ${sm.border}`} color={sm.color}>
                  {i + 1}. {p.title}
                </Box>
              );
            })}
          </Flex>
        </Box>
      )}

      {/* Objective + Notes */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mb={6}>
        <Box p={4} bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="14px">
          <Flex align="center" gap={2} mb={3}>
            <Box w="3px" h="16px" borderRadius="full" bg="rgba(255,80,95,0.7)" />
            <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
              textTransform="uppercase" letterSpacing="wider">Mission Objective</Text>
          </Flex>
          <AutoTextarea value={eng.ttxObjective}
            onSave={v => updateEngagement(eng.id, { ttxObjective: v })}
            placeholder="What is the goal? What are we trying to prove or test? Define success criteria…"
            rows={4} />
        </Box>

        <Box p={4} bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="14px">
          <Flex align="center" gap={2} mb={3}>
            <Box w="3px" h="16px" borderRadius="full" bg="rgba(99,102,241,0.7)" />
            <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
              textTransform="uppercase" letterSpacing="wider">Collaborative Notes</Text>
          </Flex>
          <AutoTextarea value={eng.ttxNotes}
            onSave={v => updateEngagement(eng.id, { ttxNotes: v })}
            placeholder="Assumptions, constraints, rules of engagement, out-of-scope items…"
            rows={4} />
        </Box>
      </SimpleGrid>

      {/* Phases */}
      {phases.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={16} gap={3}
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="16px">
          <Flex
            align="center" justify="center"
            w="48px" h="48px" borderRadius="12px"
            bg="rgba(255,80,95,0.10)" border="1px solid rgba(255,80,95,0.25)"
          >
            <Icon as={FaMap} boxSize={5} color="red.300" />
          </Flex>
          <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)">No phases planned yet</Text>
          <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center" maxW="380px">
            Break the engagement into phases — Recon, Initial Access, Lateral Movement — assign
            operators to each and track progress as the operation unfolds.
          </Text>
          <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} mt={2} fontSize="12px"
            borderRadius="8px" bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
            color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.18)' }}
            onClick={() => setAddModal(true)}>
            Add First Phase
          </Button>
        </Flex>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={phaseIds} strategy={verticalListSortingStrategy}>
              <Flex direction="column" gap={3}>
                {phases.map((phase, idx) => (
                  <PhaseCard
                    key={phase.id || String(phase._id)}
                    phase={phase}
                    index={idx}
                    allUsers={allUsers}
                    onUpdate={updatePhase}
                    onDelete={deletePhase}
                  />
                ))}
              </Flex>
            </SortableContext>
          </DndContext>

          <Flex justify="center" mt={4}>
            <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px"
              borderRadius="8px" variant="ghost"
              color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.08)"
              _hover={{ color: 'white', bg: 'rgba(255,255,255,0.05)' }}
              onClick={() => setAddModal(true)}>
              Add Phase
            </Button>
          </Flex>
        </>
      )}

      <AddPhaseModal isOpen={addModal} onClose={() => setAddModal(false)} onAdd={addPhase} />
    </Box>
  );
};

export default TTXPlannerView;
