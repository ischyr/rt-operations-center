import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select, Textarea,
  Spinner, Tooltip, useToast,
  Modal, ModalOverlay, ModalContent, ModalBody, ModalHeader, ModalFooter, ModalCloseButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, EditIcon, RepeatIcon, TimeIcon,
  WarningTwoIcon, CheckIcon, ChevronRightIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

const MotionBox = motion(Box);

// ── Theme ──────────────────────────────────────────────────────────────────────
const ACCENT  = '#4FD1C5';
const A_S     = 'rgba(79,209,197,0.07)';
const A_B     = 'rgba(79,209,197,0.28)';
const MUTED   = 'var(--dash-text-muted)';
const CARD_BG = 'var(--dash-card-bg)';
const CARD_BD = 'var(--dash-card-border)';

// Per-phase palette
const BLUE    = '#63B3ED';
const ORANGE  = '#F6AD55';
const VIOLET  = '#B794F4';
const RED     = '#FC8181';
const GREEN   = '#68D391';
const GOLD    = '#ECC94B';

const PHASES = [
  { key: 'recon',    label: 'Recon',    color: BLUE,    desc: 'Enumeration & intel'   },
  { key: 'foothold', label: 'Foothold', color: ORANGE,  desc: 'Initial access'        },
  { key: 'priv-esc', label: 'Priv-Esc', color: ACCENT,  desc: 'Privilege escalation' },
  { key: 'lateral',  label: 'Lateral',  color: VIOLET,  desc: 'Lateral movement'     },
  { key: 'exfil',    label: 'Exfil',    color: RED,     desc: 'Data exfil / objective'},
  { key: 'done',     label: 'Done',     color: GREEN,   desc: 'Complete / cleaned up' },
];

const TYPES = [
  { key: 'host',       label: 'Host'       },
  { key: 'user',       label: 'User'       },
  { key: 'webapp',     label: 'Web App'    },
  { key: 'network',    label: 'Network'    },
  { key: 'credential', label: 'Credential' },
  { key: 'other',      label: 'Other'      },
];

const PRIORITY_META = {
  low:      { color: MUTED,  label: 'Low'      },
  medium:   { color: BLUE,   label: 'Medium'   },
  high:     { color: ORANGE, label: 'High'     },
  critical: { color: RED,    label: 'Critical' },
};

const tok = () => localStorage.getItem('token') || '';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtRelative = (d) => {
  if (!d) return '';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const hashHue = (str = '') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
};

// ── Small SVG icons for target types ──────────────────────────────────────────
const TypeIcon = ({ type, color, size = 11 }) => {
  const common = { as: 'svg', viewBox: '0 0 24 24', w: `${size}px`, h: `${size}px`,
    fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (type) {
    case 'user':
      return <Box {...common}><circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></Box>;
    case 'webapp':
      return <Box {...common}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Box>;
    case 'network':
      return <Box {...common}><rect x="2" y="3" width="20" height="6" rx="1"/><rect x="2" y="15" width="20" height="6" rx="1"/><path d="M6 9v6"/><path d="M18 9v6"/></Box>;
    case 'credential':
      return <Box {...common}><circle cx="8" cy="15" r="4"/><path d="M10.85 12.15L19 4"/><path d="M18 5l3 3"/><path d="M15 8l3 3"/></Box>;
    case 'other':
      return <Box {...common}><circle cx="12" cy="12" r="10"/><path d="M9 9h.01"/><path d="M15 9h.01"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></Box>;
    case 'host':
    default:
      return <Box {...common}><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></Box>;
  }
};

// ── Operator dot ──────────────────────────────────────────────────────────────
const OperatorDot = ({ name, size = 6 }) => (
  <Box w={`${size}px`} h={`${size}px`} borderRadius="full" flexShrink={0}
    bg={name ? `hsl(${hashHue(name)}, 65%, 60%)` : 'rgba(255,255,255,0.12)'}
    boxShadow={name ? `0 0 5px hsl(${hashHue(name)}, 65%, 60%)80` : 'none'} />
);

// ── Attack Card (draggable) ───────────────────────────────────────────────────
const AttackCard = ({ card, phase, isMine, onDragStart, onDragEnd, onClick, isDragging }) => {
  const prio = PRIORITY_META[card.priority] || PRIORITY_META.medium;
  const assignee = card.assignedOperatorName || '';

  return (
    <MotionBox
      layout
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      whileHover={{ y: -1 }}
      borderRadius="10px" bg={CARD_BG}
      border={`1px solid ${CARD_BD}`}
      pos="relative" overflow="hidden" cursor="grab"
      onClick={() => onClick(card)}
      _hover={{ borderColor: `${phase.color}60`, boxShadow: `0 2px 16px rgba(0,0,0,0.3)` }}
      _active={{ cursor: 'grabbing' }}
      sx={{ transition: 'border-color 0.15s, box-shadow 0.15s' }}>

      {/* Left phase-colored bar */}
      <Box pos="absolute" left={0} top={0} bottom={0} w="3px" bg={phase.color} />

      <Box p={3} pl={4}>
        {/* Row 1: type icon + priority */}
        <Flex align="center" justify="space-between" mb={1.5}>
          <Flex align="center" gap={1.5}>
            <TypeIcon type={card.targetType} color={phase.color} size={11} />
            <Text fontSize="9px" color={MUTED} textTransform="uppercase"
              letterSpacing="wider" fontWeight="bold">
              {TYPES.find(t => t.key === card.targetType)?.label || 'Host'}
            </Text>
          </Flex>
          <Flex align="center" gap={1}>
            {card.priority === 'critical' && (
              <Box w="5px" h="5px" borderRadius="full" bg={RED}
                boxShadow={`0 0 6px ${RED}`} />
            )}
            <Text fontSize="9px" fontWeight="bold" color={prio.color}
              textTransform="uppercase" letterSpacing="wider">
              {prio.label}
            </Text>
          </Flex>
        </Flex>

        {/* Target */}
        <Text fontSize="12px" fontWeight="bold" fontFamily="mono"
          color="var(--dash-text-primary)" noOfLines={1} mb={1.5}>
          {card.target}
        </Text>

        {/* Intel preview */}
        {card.intel && (
          <Text fontSize="10px" color="var(--dash-text-secondary)" noOfLines={2}
            lineHeight="1.45" mb={2}>
            {card.intel}
          </Text>
        )}

        {/* Footer: assignee + time */}
        <Flex align="center" justify="space-between" gap={2}>
          <Flex align="center" gap={1.5} minW={0} flex={1}>
            <OperatorDot name={assignee} />
            {assignee ? (
              <Text fontSize="10px" color="var(--dash-text-secondary)" noOfLines={1}>
                {assignee}
              </Text>
            ) : (
              <Text fontSize="10px" color={MUTED} fontStyle="italic" noOfLines={1}>
                unassigned
              </Text>
            )}
            {isMine && (
              <Box px="4px" py="0px" borderRadius="3px" bg={`${ACCENT}18`}
                border={`1px solid ${A_B}`}>
                <Text fontSize="8px" fontWeight="black" color={ACCENT}
                  textTransform="uppercase" letterSpacing="wider">you</Text>
              </Box>
            )}
          </Flex>
          <Flex align="center" gap={1}>
            <TimeIcon boxSize={2} color={MUTED} />
            <Text fontSize="9px" color={MUTED} fontFamily="mono">
              {fmtRelative(card.updatedAt || card.createdAt)}
            </Text>
          </Flex>
        </Flex>
      </Box>
    </MotionBox>
  );
};

// ── Kanban Column ─────────────────────────────────────────────────────────────
const Column = ({ phase, cards, myId, draggedCardId, dropHoverPhase,
                  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onCardClick }) => {
  const isHovered = dropHoverPhase === phase.key;
  return (
    <Flex direction="column" w="290px" flexShrink={0}
      onDragOver={(e) => { e.preventDefault(); onDragOver(phase.key); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, phase.key)}>

      {/* Column header */}
      <Box borderRadius="12px 12px 0 0" bg={CARD_BG}
        border={`1px solid ${CARD_BD}`} borderBottom="none" pos="relative" overflow="hidden">
        <Box pos="absolute" top={0} left={0} right={0} h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${phase.color}90, transparent)` }} />
        <Flex align="center" justify="space-between" px={4} py="10px">
          <Flex align="center" gap={2}>
            <Box w="8px" h="8px" borderRadius="full" bg={phase.color}
              boxShadow={`0 0 8px ${phase.color}80`} />
            <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)"
              textTransform="uppercase" letterSpacing="wider">
              {phase.label}
            </Text>
          </Flex>
          <Box px="7px" py="1px" borderRadius="full"
            bg={`${phase.color}12`} border={`1px solid ${phase.color}30`}>
            <Text fontSize="10px" fontWeight="bold" color={phase.color}>
              {cards.length}
            </Text>
          </Box>
        </Flex>
        <Text fontSize="9px" color={MUTED} px={4} pb="8px">
          {phase.desc}
        </Text>
      </Box>

      {/* Drop zone body */}
      <Box flex={1} minH="420px" p={2.5}
        borderRadius="0 0 12px 12px"
        border={`1px solid ${isHovered ? phase.color + '60' : CARD_BD}`}
        borderTop="none"
        bg={isHovered ? `${phase.color}08` : 'rgba(255,255,255,0.012)'}
        transition="all 0.15s">

        {cards.length === 0 && !isHovered && (
          <Flex direction="column" align="center" justify="center" py={10} gap={2} opacity={0.4}>
            <Box as="svg" viewBox="0 0 24 24" w="28px" h="28px" fill="none"
              stroke={MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M12 8v8"/><path d="M8 12h8"/>
            </Box>
            <Text fontSize="10px" color={MUTED}>Drop cards here</Text>
          </Flex>
        )}

        {isHovered && cards.length === 0 && (
          <Flex direction="column" align="center" justify="center" py={10} gap={2}>
            <Box w="32px" h="32px" borderRadius="8px"
              bg={`${phase.color}20`} border={`1px dashed ${phase.color}60`}
              display="flex" alignItems="center" justifyContent="center">
              <ChevronRightIcon boxSize={3.5} color={phase.color}
                transform="rotate(90deg)" />
            </Box>
            <Text fontSize="10px" color={phase.color} fontWeight="semibold">
              Release to move here
            </Text>
          </Flex>
        )}

        <Flex direction="column" gap={2}>
          <AnimatePresence mode="popLayout">
            {cards.map(card => (
              <AttackCard
                key={card._id}
                card={card}
                phase={phase}
                isMine={card.assignedOperatorId === myId ||
                        card.assignedOperatorName?.toLowerCase() ===
                        (card._meOperatorName || '').toLowerCase()}
                isDragging={draggedCardId === card._id}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={onCardClick}
              />
            ))}
          </AnimatePresence>
        </Flex>
      </Box>
    </Flex>
  );
};

// ── Card edit / create modal ──────────────────────────────────────────────────
const CardModal = ({ isOpen, onClose, card, onSave, onDelete, knownOperators }) => {
  const editing = !!card?._id;

  const [target,     setTarget]     = useState('');
  const [targetType, setTargetType] = useState('host');
  const [phase,      setPhase]      = useState('recon');
  const [priority,   setPriority]   = useState('medium');
  const [assignee,   setAssignee]   = useState('');
  const [intel,      setIntel]      = useState('');
  const [handoffNote,setHandoffNote]= useState('');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTarget(card?.target || '');
    setTargetType(card?.targetType || 'host');
    setPhase(card?.phase || 'recon');
    setPriority(card?.priority || 'medium');
    setAssignee(card?.assignedOperatorName || '');
    setIntel(card?.intel || '');
    setHandoffNote('');
  }, [isOpen, card]);

  const handleSave = async () => {
    if (!target.trim()) return;
    setSaving(true);
    try {
      await onSave({
        target, targetType, phase, priority,
        assignedOperatorName: assignee, intel, handoffNote,
      });
      onClose();
    } finally { setSaving(false); }
  };

  const phaseMeta = PHASES.find(p => p.key === phase) || PHASES[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay backdropFilter="blur(8px)" bg="rgba(0,0,0,0.55)" />
      <ModalContent bg={CARD_BG} border={`1px solid ${CARD_BD}`} borderRadius="14px">
        <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
          style={{ background: `linear-gradient(to right, transparent, ${phaseMeta.color}90, transparent)` }} />

        <ModalHeader fontSize="16px" color="var(--dash-text-primary)" pb={2}>
          {editing ? 'Edit Attack Card' : 'New Attack Card'}
        </ModalHeader>
        <ModalCloseButton color={MUTED} />

        <ModalBody>
          <Flex direction="column" gap={3}>
            {/* Target + Type */}
            <Flex gap={3}>
              <Box flex={2}>
                <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                  textTransform="uppercase" letterSpacing="wider">Target *</Text>
                <Input h="38px" fontSize="sm" fontFamily="mono" borderRadius="9px"
                  bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                  color="var(--dash-text-primary)"
                  _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '13px' }}
                  _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                  placeholder="dc01.corp.local  ·  alice@target.com  ·  payroll.corp.local"
                  value={target} onChange={e => setTarget(e.target.value)} />
              </Box>
              <Box flex={1}>
                <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                  textTransform="uppercase" letterSpacing="wider">Type</Text>
                <Select h="38px" fontSize="sm" borderRadius="9px"
                  bg="rgba(255,255,255,0.03)" borderColor={CARD_BD}
                  color="var(--dash-text-primary)"
                  focusBorderColor={A_B}
                  sx={{ '& option': { background: '#14181f' } }}
                  value={targetType} onChange={e => setTargetType(e.target.value)}>
                  {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </Select>
              </Box>
            </Flex>

            {/* Phase pills */}
            <Box>
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1.5}
                textTransform="uppercase" letterSpacing="wider">Phase</Text>
              <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="9px"
                border={`1px solid ${CARD_BD}`} p="3px">
                {PHASES.map(p => {
                  const act = phase === p.key;
                  return (
                    <Button key={p.key} flex={1} size="xs" h="30px" borderRadius="6px"
                      fontSize="10px" fontWeight="bold"
                      bg={act ? `${p.color}18` : 'transparent'}
                      color={act ? p.color : MUTED}
                      border={act ? `1px solid ${p.color}40` : '1px solid transparent'}
                      _hover={{ color: p.color }}
                      onClick={() => setPhase(p.key)}>
                      {p.label}
                    </Button>
                  );
                })}
              </Flex>
            </Box>

            {/* Priority + Assignee */}
            <Flex gap={3}>
              <Box flex={1}>
                <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1.5}
                  textTransform="uppercase" letterSpacing="wider">Priority</Text>
                <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="9px"
                  border={`1px solid ${CARD_BD}`} p="3px" h="38px">
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
              <Box flex={1}>
                <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                  textTransform="uppercase" letterSpacing="wider">Assigned Operator</Text>
                <Input h="38px" fontSize="sm" borderRadius="9px"
                  bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                  color="var(--dash-text-primary)"
                  _placeholder={{ color: MUTED, fontSize: '13px' }}
                  _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                  placeholder="name · leave blank for unassigned"
                  list="relay-operators"
                  value={assignee} onChange={e => setAssignee(e.target.value)} />
                <datalist id="relay-operators">
                  {knownOperators.map(n => <option key={n} value={n} />)}
                </datalist>
              </Box>
            </Flex>

            {/* Intel */}
            <Box>
              <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                textTransform="uppercase" letterSpacing="wider">Intel / Context</Text>
              <Textarea fontSize="12px" borderRadius="9px" minH="84px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                color="var(--dash-text-primary)"
                _placeholder={{ color: MUTED }}
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                placeholder="What have we learned? Open ports, creds tried, findings, blockers…"
                value={intel} onChange={e => setIntel(e.target.value)} resize="vertical" />
            </Box>

            {/* Handoff note (only meaningful when phase changed / on save) */}
            {editing && (
              <Box>
                <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                  textTransform="uppercase" letterSpacing="wider">
                  Handoff Note <Text as="span" color={MUTED} textTransform="none" fontWeight="normal">
                    · attached to the next phase move
                  </Text>
                </Text>
                <Input h="38px" fontSize="sm" borderRadius="9px"
                  bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                  color="var(--dash-text-primary)"
                  _placeholder={{ color: MUTED, fontSize: '13px' }}
                  _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                  placeholder="Short note for the next operator picking this up"
                  value={handoffNote} onChange={e => setHandoffNote(e.target.value)} />
              </Box>
            )}

            {/* History (edit mode) */}
            {editing && card?.history?.length > 0 && (
              <Box>
                <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={2}
                  textTransform="uppercase" letterSpacing="wider">Timeline</Text>
                <Box borderRadius="9px" bg="rgba(255,255,255,0.02)"
                  border={`1px solid ${CARD_BD}`} p={3} maxH="140px" overflowY="auto">
                  <Flex direction="column" gap={2}>
                    {[...card.history].reverse().map((h, i) => {
                      const fromMeta = PHASES.find(p => p.key === h.from);
                      const toMeta   = PHASES.find(p => p.key === h.to);
                      return (
                        <Flex key={i} align="center" gap={2} fontSize="10px">
                          <OperatorDot name={h.operatorName} />
                          <Text color="var(--dash-text-primary)" fontWeight="semibold">
                            {h.operatorName}
                          </Text>
                          {h.from ? (
                            <Flex align="center" gap={1}>
                              <Text color={fromMeta?.color || MUTED} fontWeight="bold">
                                {fromMeta?.label || h.from}
                              </Text>
                              <ChevronRightIcon boxSize={2.5} color={MUTED} />
                              <Text color={toMeta?.color || MUTED} fontWeight="bold">
                                {toMeta?.label || h.to}
                              </Text>
                            </Flex>
                          ) : (
                            <Text color={toMeta?.color || MUTED} fontStyle="italic">created</Text>
                          )}
                          {h.note && (
                            <Text color={MUTED} noOfLines={1} flex={1}>— {h.note}</Text>
                          )}
                          <Text color={MUTED} ml="auto" flexShrink={0}>
                            {fmtRelative(h.at)}
                          </Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                </Box>
              </Box>
            )}
          </Flex>
        </ModalBody>

        <ModalFooter gap={2}>
          {editing && (
            <Button size="sm" variant="ghost" color={MUTED}
              _hover={{ color: RED, bg: 'rgba(252,129,129,0.1)' }}
              leftIcon={<DeleteIcon />} onClick={() => onDelete(card._id)}>
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
            onClick={handleSave} isDisabled={saving || !target.trim()}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ── Main View ──────────────────────────────────────────────────────────────────
const AttackRelayView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const { user }      = useAuth();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const myId   = user?._id || user?.id;
  const myName = user?.name || user?.email || '';

  const [cards,     setCards]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [filter,    setFilter]    = useState('all');  // all | mine | critical | unassigned

  const [draggedCardId,  setDraggedCardId]  = useState(null);
  const [dropHoverPhase, setDropHoverPhase] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editCard,  setEditCard]  = useState(null);

  const pollRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchCards = useCallback(async (silent = false) => {
    if (!engId) return;
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`/api/attack-relay/${engId}/cards`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (!r.ok) throw new Error('Failed');
      setCards(await r.json());
    } catch (_) {} finally {
      if (!silent) setLoading(false);
    }
  }, [engId]);

  useEffect(() => {
    if (!engId) return;
    fetchCards();
    pollRef.current = setInterval(() => fetchCards(true), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [engId, fetchCards]);

  // ── Known operator names (for datalist) ──────────────────────────────────────
  const knownOperators = useMemo(() => {
    const s = new Set();
    cards.forEach(c => {
      if (c.createdByOperatorName) s.add(c.createdByOperatorName);
      if (c.assignedOperatorName)  s.add(c.assignedOperatorName);
      c.history?.forEach(h => h.operatorName && s.add(h.operatorName));
    });
    return [...s];
  }, [cards]);

  // ── Filters ──────────────────────────────────────────────────────────────────
  const visibleCards = useMemo(() => {
    const byFilter = (c) => {
      if (filter === 'mine')       return c.assignedOperatorId === myId ||
                                          c.assignedOperatorName?.toLowerCase() === myName.toLowerCase();
      if (filter === 'critical')   return c.priority === 'critical' || c.priority === 'high';
      if (filter === 'unassigned') return !c.assignedOperatorName?.trim();
      return true;
    };
    return cards.filter(byFilter);
  }, [cards, filter, myId, myName]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const total       = cards.length;
  const minePending = cards.filter(c =>
    (c.assignedOperatorId === myId ||
     c.assignedOperatorName?.toLowerCase() === myName.toLowerCase()) && c.phase !== 'done').length;
  const critCount   = cards.filter(c => c.priority === 'critical').length;
  const stuckCount  = cards.filter(c => {
    if (c.phase === 'done') return false;
    const last = new Date(c.updatedAt || c.createdAt).getTime();
    return Date.now() - last > 24 * 3600 * 1000;   // stuck > 24h
  }).length;

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const onDragStart = (e, card) => {
    setDraggedCardId(card._id);
    try { e.dataTransfer.setData('text/plain', card._id); } catch (_) {}
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  };
  const onDragEnd = () => { setDraggedCardId(null); setDropHoverPhase(null); };
  const onDragOver = (phaseKey) => { if (dropHoverPhase !== phaseKey) setDropHoverPhase(phaseKey); };
  const onDragLeave = () => { setDropHoverPhase(null); };

  const onDrop = async (e, targetPhaseKey) => {
    e.preventDefault();
    const id = draggedCardId || e.dataTransfer?.getData('text/plain');
    setDraggedCardId(null); setDropHoverPhase(null);
    if (!id) return;
    const card = cards.find(c => c._id === id);
    if (!card || card.phase === targetPhaseKey) return;

    // Optimistic update
    setCards(p => p.map(c => c._id === id ? { ...c, phase: targetPhaseKey, updatedAt: new Date() } : c));

    try {
      const r = await fetch(`/api/attack-relay/${engId}/cards/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: targetPhaseKey }),
      });
      if (!r.ok) throw new Error('Failed');
      const updated = await r.json();
      setCards(p => p.map(c => c._id === id ? updated : c));

      const toPhase = PHASES.find(p => p.key === targetPhaseKey);
      toast({
        title: `Moved to ${toPhase?.label}`,
        description: `${card.target} · handoff notes editable via the card`,
        status: 'success', duration: 2000, isClosable: true,
      });
    } catch (_) {
      // revert
      fetchCards(true);
      toast({ title: 'Move failed', status: 'error', duration: 2000, isClosable: true });
    }
  };

  // ── Save / delete ────────────────────────────────────────────────────────────
  const saveCard = async (payload) => {
    try {
      const url  = editCard?._id
        ? `/api/attack-relay/${engId}/cards/${editCard._id}`
        : `/api/attack-relay/${engId}/cards`;
      const method = editCard?._id ? 'PATCH' : 'POST';
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
      setCards(p => {
        const exists = p.some(c => c._id === saved._id);
        return exists ? p.map(c => c._id === saved._id ? saved : c) : [saved, ...p];
      });
      toast({ title: editCard?._id ? 'Card updated' : 'Card created',
        status: 'success', duration: 1800, isClosable: true });
    } catch (e) {
      toast({ title: 'Save failed', description: e.message,
        status: 'error', duration: 3000, isClosable: true });
    }
  };

  const deleteCard = async (id) => {
    try {
      await fetch(`/api/attack-relay/${engId}/cards/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      setCards(p => p.filter(c => c._id !== id));
      setModalOpen(false); setEditCard(null);
    } catch (_) {
      toast({ title: 'Delete failed', status: 'error', duration: 2000, isClosable: true });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Box>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box mb={5}>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
          Attack <Text as="span" color="red.400">Relay</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          {eng?.name} · targets move across kill-chain phases · drag to hand off, everyone stays in sync
        </Text>
      </Box>

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px" bg={A_S} border={`1px solid ${A_B}`}>
        <Flex align="center" gap={2} mb={1.5}>
          <Box as="svg" viewBox="0 0 24 24" w="12px" h="12px" fill="none" stroke={ACCENT}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" flexShrink={0}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </Box>
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            Collaborative Kill-Chain — Drag to Hand Off
          </Text>
        </Flex>
        <Flex gap={5} flexWrap="wrap">
          {[
            'Each card is a target — hosts, users, web apps, networks, creds',
            'Drag between phases as work progresses — Recon → Foothold → Priv-Esc → Lateral → Exfil → Done',
            'Attach intel + handoff notes so the next operator picks up with context',
            'Full timeline per card shows who moved what, when, and why',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color={MUTED}>{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <Flex gap={3} mb={4}>
        {[
          { label: 'Total',       value: total,       color: ACCENT },
          { label: 'Assigned to me', value: minePending, color: BLUE   },
          { label: 'Critical',    value: critCount,   color: RED    },
          { label: 'Stuck >24h',  value: stuckCount,  color: stuckCount ? GOLD : MUTED },
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
            <Text fontSize="22px" fontWeight="black" color={color} lineHeight={1}>{value}</Text>
          </MotionBox>
        ))}
      </Flex>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <Flex align="center" justify="space-between" gap={3} mb={4} flexWrap="wrap">
        <Flex gap={1.5} flexWrap="wrap">
          {[
            { k: 'all',        label: 'All',         color: ACCENT, count: cards.length },
            { k: 'mine',       label: 'Mine',        color: BLUE,
              count: cards.filter(c => c.assignedOperatorId === myId ||
                c.assignedOperatorName?.toLowerCase() === myName.toLowerCase()).length },
            { k: 'critical',   label: 'Critical',    color: RED,
              count: cards.filter(c => c.priority === 'critical' || c.priority === 'high').length },
            { k: 'unassigned', label: 'Unassigned',  color: GOLD,
              count: cards.filter(c => !c.assignedOperatorName?.trim()).length },
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
        <Flex gap={2}>
          <Tooltip label="Refresh" hasArrow fontSize="10px">
            <IconButton size="xs" h="32px" w="32px" borderRadius="7px" variant="ghost"
              icon={<RepeatIcon />} color={MUTED} _hover={{ color: ACCENT }}
              onClick={() => fetchCards()} aria-label="refresh" />
          </Tooltip>
          <Button size="sm" h="32px" px={4} borderRadius="8px" fontWeight="semibold" fontSize="12px"
            bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
            color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
            leftIcon={<AddIcon boxSize={2.5} />}
            onClick={() => { setEditCard(null); setModalOpen(true); }}>
            New Card
          </Button>
        </Flex>
      </Flex>

      {/* ── Kanban board ─────────────────────────────────────────────────────── */}
      {loading && cards.length === 0 ? (
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
            {PHASES.map(phase => (
              <Column
                key={phase.key}
                phase={phase}
                cards={visibleCards.filter(c => c.phase === phase.key)
                  .map(c => ({ ...c, _meOperatorName: myName }))}
                myId={myId}
                draggedCardId={draggedCardId}
                dropHoverPhase={dropHoverPhase}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onCardClick={(card) => { setEditCard(card); setModalOpen(true); }}
              />
            ))}
          </Flex>
        </Box>
      )}

      {/* ── Edit modal ──────────────────────────────────────────────────────── */}
      <CardModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditCard(null); }}
        card={editCard}
        onSave={saveCard}
        onDelete={deleteCard}
        knownOperators={knownOperators}
      />
    </Box>
  );
};

export default AttackRelayView;
