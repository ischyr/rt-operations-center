import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Textarea,
  Spinner, Tooltip, useToast, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalBody, ModalHeader, ModalFooter, ModalCloseButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StarIcon, CheckIcon, RepeatIcon, TimeIcon, DeleteIcon,
  WarningTwoIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

const MotionBox = motion(Box);

// ── Theme ──────────────────────────────────────────────────────────────────────
const ACCENT  = '#ED8936';               // bright orange = achievement / fire
const A_S     = 'rgba(237,137,54,0.08)';
const A_B     = 'rgba(237,137,54,0.32)';
const GREEN   = '#68D391';
const RED     = '#FC8181';
const BLUE    = '#63B3ED';
const VIOLET  = '#B794F4';
const TEAL    = '#4FD1C5';
const GOLD    = '#ECC94B';
const MUTED   = 'var(--dash-text-muted)';
const CARD_BG = 'var(--dash-card-bg)';
const CARD_BD = 'var(--dash-card-border)';

const CATEGORY_META = {
  recon:      { color: BLUE,   label: 'Recon'  },
  access:     { color: ACCENT, label: 'Access' },
  escalation: { color: RED,    label: 'Esc.'   },
  lateral:    { color: VIOLET, label: 'Lateral'},
  exfil:      { color: TEAL,   label: 'Exfil'  },
  special:    { color: GOLD,   label: 'Special'},
};

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

// Given a cell index (0-24), return all line-keys that include it
const linesWithCell = (idx) => {
  const r = Math.floor(idx / 5);
  const c = idx % 5;
  const lines = [`row-${r}`, `col-${c}`];
  if (r === c)         lines.push('diag-tl');
  if (r + c === 4)     lines.push('diag-tr');
  return lines;
};

const lineLabel = (key) => {
  if (key === 'full')    return 'Full Board Blackout';
  if (key === 'diag-tl') return '↘ Diagonal';
  if (key === 'diag-tr') return '↙ Diagonal';
  if (key.startsWith('row-')) return `Row ${parseInt(key.slice(4), 10) + 1}`;
  if (key.startsWith('col-')) return `Column ${parseInt(key.slice(4), 10) + 1}`;
  return key;
};

// ── Operator dot ──────────────────────────────────────────────────────────────
const OperatorDot = ({ name, size = 20 }) => (
  <Box w={`${size}px`} h={`${size}px`} borderRadius="full" flexShrink={0}
    display="flex" alignItems="center" justifyContent="center"
    bg={`hsl(${hashHue(name)}, 65%, 56%)`}
    boxShadow={`0 0 8px hsl(${hashHue(name)}, 65%, 56%)70`}>
    <Text fontSize={`${Math.max(8, size * 0.4)}px`} fontWeight="black" color="white">
      {initials(name)}
    </Text>
  </Box>
);

// ── Bingo square ──────────────────────────────────────────────────────────────
const BingoSquare = ({ sq, index, isMine, isCelebrating, isWinning, onClick }) => {
  const cat = CATEGORY_META[sq.category] || CATEGORY_META.special;
  const claimed = sq.isFree || !!sq.claimedByOperatorId;
  const operatorHue = sq.claimedByOperatorName ? hashHue(sq.claimedByOperatorName) : null;

  // Border / glow state
  const borderColor = sq.isFree            ? `${GOLD}70`
                    : isCelebrating        ? ACCENT
                    : isWinning            ? `${ACCENT}80`
                    : isMine               ? A_B
                    : claimed              ? `hsl(${operatorHue}, 65%, 55%, 0.45)`
                    :                        CARD_BD;

  const glow = isCelebrating ? `0 0 32px ${ACCENT}b0, 0 0 0 2px ${ACCENT}`
             : isWinning     ? `0 0 18px ${ACCENT}55`
             : isMine        ? `0 0 14px ${ACCENT}30`
             : 'none';

  return (
    <MotionBox
      layout
      onClick={() => onClick(sq, index)}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{
        opacity: 1, scale: 1,
        ...(isCelebrating ? {
          boxShadow: [
            `0 0 0 0 ${ACCENT}00`,
            `0 0 36px 4px ${ACCENT}cc, 0 0 0 2px ${ACCENT}`,
            `0 0 0 0 ${ACCENT}00`,
          ],
        } : { boxShadow: glow }),
      }}
      transition={isCelebrating
        ? { boxShadow: { duration: 1.2, repeat: 3, repeatType: 'reverse' }, default: { duration: 0.2 } }
        : { duration: 0.2, delay: Math.min(index * 0.015, 0.3) }}
      whileHover={{ y: -2, scale: 1.015 }}
      cursor="pointer"
      pos="relative" overflow="hidden"
      borderRadius="12px" bg={CARD_BG}
      border={`1px solid ${borderColor}`}
      aspectRatio="1"
      sx={{ transition: 'border-color 0.2s' }}
      >

      {/* FREE square gradient */}
      {sq.isFree && (
        <Box pos="absolute" inset={0}
          style={{ background: `radial-gradient(circle at center, ${GOLD}22 0%, transparent 70%)` }} />
      )}

      {/* Operator color stripe on top for claimed squares (not mine) */}
      {claimed && !sq.isFree && !isMine && (
        <Box pos="absolute" top={0} left={0} right={0} h="2px"
          style={{ background: `linear-gradient(to right, transparent, hsl(${operatorHue}, 65%, 55%), transparent)` }} />
      )}
      {/* Mine accent stripe */}
      {isMine && !sq.isFree && (
        <Box pos="absolute" top={0} left={0} right={0} h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${ACCENT}, transparent)` }} />
      )}

      <Flex direction="column" justify="space-between" h="100%" p="10px">
        {/* Top row: category + points */}
        <Flex align="center" justify="space-between">
          <Text fontSize="8px" fontWeight="black" color={cat.color}
            textTransform="uppercase" letterSpacing="wider">
            {sq.isFree ? 'FREE' : cat.label}
          </Text>
          {!sq.isFree && sq.points > 0 && (
            <Flex align="center" gap={0.5} px="5px" py="1px" borderRadius="4px"
              bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}>
              <Text fontSize="8px" fontWeight="bold" color={MUTED}>+</Text>
              <Text fontSize="9px" fontWeight="black" color={ACCENT}>{sq.points}</Text>
            </Flex>
          )}
        </Flex>

        {/* Center: text */}
        <Flex flex={1} align="center" justify="center" px={1} py={2}>
          <Text fontSize="11px" fontWeight={sq.isFree ? 'black' : 'semibold'}
            color={sq.isFree ? GOLD
                  : claimed ? 'var(--dash-text-primary)'
                  :            'var(--dash-text-secondary)'}
            textAlign="center" lineHeight="1.25" noOfLines={4}>
            {sq.text}
          </Text>
        </Flex>

        {/* Bottom: claimer or hint */}
        <Flex align="center" justify="center" minH="20px">
          {sq.isFree ? (
            <Box w="14px" h="14px" borderRadius="full" bg={`${GOLD}30`}
              border={`1px solid ${GOLD}60`}
              display="flex" alignItems="center" justifyContent="center">
              <StarIcon boxSize="7px" color={GOLD} />
            </Box>
          ) : claimed ? (
            <Tooltip label={`${sq.claimedByOperatorName} · ${fmtRelative(sq.claimedAt)}`}
              hasArrow fontSize="10px">
              <Flex align="center" gap={1}>
                <OperatorDot name={sq.claimedByOperatorName} size={16} />
                <CheckIcon boxSize={2.5} color={GREEN} />
              </Flex>
            </Tooltip>
          ) : (
            <Text fontSize="9px" color={MUTED} opacity={0.5}>click to claim</Text>
          )}
        </Flex>
      </Flex>
    </MotionBox>
  );
};

// ── Claim modal ───────────────────────────────────────────────────────────────
const SquareModal = ({ square, isMine, onClose, onClaim, onUnclaim }) => {
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setEvidence(square?.evidence || ''); }, [square?.id]);

  if (!square) return null;
  const cat = CATEGORY_META[square.category] || CATEGORY_META.special;
  const claimed = !!square.claimedByOperatorId;

  const doClaim = async () => {
    setSubmitting(true);
    try { await onClaim(square.id, evidence); } finally { setSubmitting(false); }
  };
  const doUnclaim = async () => {
    setSubmitting(true);
    try { await onUnclaim(square.id); } finally { setSubmitting(false); }
  };

  return (
    <Modal isOpen={!!square} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(8px)" bg="rgba(0,0,0,0.55)" />
      <ModalContent bg={CARD_BG} border={`1px solid ${CARD_BD}`} borderRadius="14px">
        <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
          style={{ background: `linear-gradient(to right, transparent, ${cat.color}90, transparent)` }} />

        <ModalHeader pb={2} pr={10}>
          <Flex align="center" gap={2} mb={1}>
            <Text fontSize="9px" fontWeight="black" color={cat.color}
              textTransform="uppercase" letterSpacing="wider">
              {cat.label}
            </Text>
            {square.points > 0 && (
              <>
                <Box w="3px" h="3px" borderRadius="full" bg={MUTED} />
                <Text fontSize="10px" fontWeight="bold" color={ACCENT}>
                  +{square.points} pts
                </Text>
              </>
            )}
          </Flex>
          <Text fontSize="15px" color="var(--dash-text-primary)" lineHeight={1.3}>
            {square.text}
          </Text>
        </ModalHeader>
        <ModalCloseButton color={MUTED} />

        <ModalBody>
          {claimed && (
            <Box mb={4} p={3} borderRadius="10px"
              bg={isMine ? A_S : 'rgba(255,255,255,0.02)'}
              border={`1px solid ${isMine ? A_B : CARD_BD}`}>
              <Flex align="center" gap={2} mb={1}>
                <OperatorDot name={square.claimedByOperatorName} size={20} />
                <Text fontSize="11px" fontWeight="semibold" color="var(--dash-text-primary)">
                  {square.claimedByOperatorName}
                </Text>
                {isMine && (
                  <Box px="5px" py="1px" borderRadius="3px" bg={A_S} border={`1px solid ${A_B}`}>
                    <Text fontSize="8px" fontWeight="black" color={ACCENT}
                      textTransform="uppercase" letterSpacing="wider">you</Text>
                  </Box>
                )}
                <Text fontSize="10px" color={MUTED} ml="auto">
                  {fmtRelative(square.claimedAt)}
                </Text>
              </Flex>
              {square.evidence && (
                <Text fontSize="11px" color="var(--dash-text-secondary)"
                  lineHeight="1.5" mt={2}>
                  {square.evidence}
                </Text>
              )}
            </Box>
          )}

          <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
            textTransform="uppercase" letterSpacing="wider">
            Evidence / Notes
          </Text>
          <Textarea fontSize="12px" borderRadius="9px" minH="80px"
            bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
            color="var(--dash-text-primary)"
            _placeholder={{ color: MUTED }}
            _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
            placeholder="What happened? Paste command output, link to finding, screenshot reference…"
            value={evidence} onChange={e => setEvidence(e.target.value)} resize="vertical" />
        </ModalBody>

        <ModalFooter gap={2}>
          {claimed && (
            <Button size="sm" variant="ghost" color={MUTED}
              _hover={{ color: RED, bg: 'rgba(252,129,129,0.1)' }}
              leftIcon={<DeleteIcon />} onClick={doUnclaim}
              isDisabled={submitting}>
              Unclaim
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
            leftIcon={submitting ? <Spinner size="xs" /> : <CheckIcon boxSize={3} />}
            onClick={doClaim} isDisabled={submitting}>
            {claimed ? 'Update Evidence' : 'Claim Square'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ── Template switch confirm modal ─────────────────────────────────────────────
const TemplateConfirm = ({ target, onClose, onConfirm }) => (
  <Modal isOpen={!!target} onClose={onClose} size="md" isCentered>
    <ModalOverlay backdropFilter="blur(8px)" bg="rgba(0,0,0,0.55)" />
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
              Switch to {target?.name}?
            </Text>
            <Text fontSize="12px" color="var(--dash-text-secondary)">
              This wipes all current claims and achievements on the board
            </Text>
          </Box>
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
          bg={`${ACCENT}15`} border={`1px solid ${A_B}`} color={ACCENT}
          _hover={{ bg: `${ACCENT}25` }} onClick={onConfirm}>
          Reset & Switch
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

// ── Main View ──────────────────────────────────────────────────────────────────
const BingoView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const { user }      = useAuth();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const myId   = user?._id || user?.id;
  const myName = user?.name || user?.email || 'Operator';

  const [card,        setCard]        = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading,     setLoading]     = useState(true);

  const [selectedSq,  setSelectedSq]  = useState(null);
  const [templateConfirm, setTemplateConfirm] = useState(null);
  const [celebrating, setCelebrating] = useState([]);

  const pollRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (silent = false) => {
    if (!engId) return;
    if (!silent) setLoading(true);
    try {
      const [cardR, lbR] = await Promise.all([
        fetch(`/api/bingo/${engId}/card`,        { headers: { Authorization: `Bearer ${tok()}` } }),
        fetch(`/api/bingo/${engId}/leaderboard`, { headers: { Authorization: `Bearer ${tok()}` } }),
      ]);
      if (cardR.ok) setCard(await cardR.json());
      if (lbR.ok)   setLeaderboard(await lbR.json());
    } catch (_) {} finally {
      if (!silent) setLoading(false);
    }
  }, [engId]);

  useEffect(() => {
    if (!engId) return;
    fetchAll();
    pollRef.current = setInterval(() => fetchAll(true), 6000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [engId, fetchAll]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const squares = card?.squares || [];
  const claimedCount = squares.filter(s => s.claimedByOperatorId || s.isFree).length;
  const pointsEarned = squares.reduce((n, s) => n + (s.claimedByOperatorId ? (s.points || 0) : 0), 0);
  const pointsMax    = squares.reduce((n, s) => n + (s.isFree ? 0 : (s.points || 0)), 0);
  const achievements = card?.achievements || [];
  const achievedLineSet = useMemo(() => new Set(achievements.map(a => a.line)), [achievements]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const claimSquare = async (squareId, evidence) => {
    try {
      const r = await fetch(`/api/bingo/${engId}/squares/${squareId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidence }),
      });
      if (!r.ok) throw new Error('Failed');
      const { card: updated, newBingos } = await r.json();
      setCard(updated);
      setSelectedSq(null);

      // Celebration!
      if (newBingos?.length) {
        setCelebrating(newBingos);
        for (const line of newBingos) {
          toast({
            title: `🎯 BINGO — ${lineLabel(line)}`,
            description: `${myName} just completed a line`,
            status: 'success', duration: 4500, isClosable: true,
            position: 'top',
          });
        }
        setTimeout(() => setCelebrating([]), 5000);
      } else {
        toast({ title: 'Square claimed', status: 'success', duration: 1500, isClosable: true });
      }
      // refresh leaderboard
      fetch(`/api/bingo/${engId}/leaderboard`, {
        headers: { Authorization: `Bearer ${tok()}` },
      }).then(r => r.json()).then(setLeaderboard).catch(() => {});
    } catch (_) {
      toast({ title: 'Claim failed', status: 'error', duration: 2000, isClosable: true });
    }
  };

  const unclaimSquare = async (squareId) => {
    try {
      const r = await fetch(`/api/bingo/${engId}/squares/${squareId}/claim`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      if (!r.ok) throw new Error('Failed');
      setCard(await r.json());
      setSelectedSq(null);
      fetchAll(true);
      toast({ title: 'Square unclaimed', status: 'info', duration: 1500, isClosable: true });
    } catch (_) {
      toast({ title: 'Unclaim failed', status: 'error', duration: 2000, isClosable: true });
    }
  };

  const switchTemplate = async (key) => {
    try {
      const r = await fetch(`/api/bingo/${engId}/card/template`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: key }),
      });
      if (!r.ok) throw new Error('Failed');
      setCard(await r.json());
      setTemplateConfirm(null);
      setLeaderboard([]);
      toast({ title: 'Board reset', status: 'success', duration: 1500, isClosable: true });
    } catch (_) {
      toast({ title: 'Switch failed', status: 'error', duration: 2000, isClosable: true });
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box mb={5}>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
          Engagement <Text as="span" color="red.400">Bingo</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          {eng?.name} · claim goals as the team achieves them · complete a row, column, or diagonal for a BINGO
        </Text>
      </Box>

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px" bg={A_S} border={`1px solid ${A_B}`}>
        <Flex align="center" gap={2} mb={1.5}>
          <StarIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            Team Achievement Board
          </Text>
        </Flex>
        <Flex gap={5} flexWrap="wrap">
          {[
            'Each square is a goal — click to claim it as your operator',
            'Points are awarded per square · FREE center counts toward lines',
            'Row, column, diagonal, or full blackout = BINGO achievement',
            'Leaderboard ranks by points, then bingos, then squares claimed',
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
        {/* ── Left ──────────────────────────────────────────────────────── */}
        <Flex direction="column" flex="1" gap={4} pr={6} minW={0}>

          {/* Template + stats strip */}
          <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
            <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="8px"
              border={`1px solid ${CARD_BD}`} p="3px">
              {(card?.templates || []).map(t => {
                const act = card?.template === t.key;
                return (
                  <Tooltip key={t.key} label={t.description} hasArrow fontSize="10px">
                    <Button size="xs" h="28px" px={3} borderRadius="6px"
                      fontSize="10px" fontWeight="bold"
                      bg={act ? A_S : 'transparent'}
                      color={act ? ACCENT : MUTED}
                      border={act ? `1px solid ${A_B}` : '1px solid transparent'}
                      _hover={{ color: ACCENT }}
                      onClick={() => {
                        if (act) return;
                        setTemplateConfirm({ key: t.key, name: t.name });
                      }}>
                      {t.name}
                    </Button>
                  </Tooltip>
                );
              })}
            </Flex>
            <Tooltip label="Refresh" hasArrow fontSize="10px">
              <IconButton size="xs" h="28px" w="28px" borderRadius="6px" variant="ghost"
                icon={<RepeatIcon />} color={MUTED} _hover={{ color: ACCENT }}
                onClick={() => fetchAll()} aria-label="refresh" />
            </Tooltip>
          </Flex>

          {/* Stats strip */}
          <Flex gap={3}>
            {[
              { label: 'Claimed',  value: `${claimedCount - (squares.some(s => s.isFree) ? 1 : 0)}/24`, color: ACCENT },
              { label: 'Points',   value: `${pointsEarned} / ${pointsMax}`,         color: GREEN  },
              { label: 'Bingos',   value: achievements.length,                       color: GOLD   },
              { label: 'Operators',value: leaderboard.length,                        color: BLUE   },
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

          {/* Bingo card */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />

            <Flex align="center" justify="space-between" px={5} py={3}
              borderBottom={`1px solid ${CARD_BD}`}>
              <Flex align="center" gap={2}>
                <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">
                  {card?.templates?.find(t => t.key === card?.template)?.name || 'Bingo Card'}
                </Text>
              </Flex>
              <Text fontSize="10px" color={MUTED}>
                {card?.templates?.find(t => t.key === card?.template)?.description}
              </Text>
            </Flex>

            <Box p={4}>
              {loading ? (
                <Flex align="center" justify="center" py={16}>
                  <Spinner color={ACCENT} size="lg" thickness="2px" />
                </Flex>
              ) : (
                <SimpleGrid columns={5} spacing={2.5}>
                  {squares.map((sq, i) => {
                    const isMine = sq.claimedByOperatorId === myId;
                    const myLines = linesWithCell(i);
                    const isCelebrating = myLines.some(l => celebrating.includes(l));
                    const isWinning     = myLines.some(l => achievedLineSet.has(l));
                    return (
                      <BingoSquare key={sq.id} sq={sq} index={i}
                        isMine={isMine}
                        isCelebrating={isCelebrating}
                        isWinning={isWinning}
                        onClick={(s) => s.isFree ? null : setSelectedSq(s)} />
                    );
                  })}
                </SimpleGrid>
              )}
            </Box>
          </Box>

          {/* Bingo achievements list */}
          {achievements.length > 0 && (
            <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
              overflow="hidden" pos="relative">
              <Box pos="absolute" top={0} left={0} right={0} h="2px"
                style={{ background: `linear-gradient(to right, transparent, ${GOLD}70, transparent)` }} />
              <Flex align="center" gap={2} px={5} py={3}
                borderBottom={`1px solid ${CARD_BD}`}>
                <Box w="3px" h="13px" borderRadius="full" bg={GOLD} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">Bingos Achieved</Text>
                <Box px="7px" py="1px" borderRadius="full"
                  bg={`${GOLD}12`} border={`1px solid ${GOLD}30`}>
                  <Text fontSize="10px" fontWeight="bold" color={GOLD}>
                    {achievements.length}
                  </Text>
                </Box>
              </Flex>
              <Flex direction="column">
                {[...achievements].reverse().map((a, i) => (
                  <Flex key={i} align="center" gap={3} px={5} py="10px"
                    borderBottom={`1px solid ${CARD_BD}`}
                    _hover={{ bg: 'rgba(255,255,255,0.02)' }}>
                    <Box w="32px" h="32px" borderRadius="8px"
                      bg={`${GOLD}12`} border={`1px solid ${GOLD}30`}
                      display="flex" alignItems="center" justifyContent="center">
                      <StarIcon boxSize={3.5} color={GOLD} />
                    </Box>
                    <Box flex={1} minW={0}>
                      <Text fontSize="12px" fontWeight="semibold"
                        color="var(--dash-text-primary)">
                        {lineLabel(a.line)}
                      </Text>
                      <Flex align="center" gap={1.5} mt={0.5}>
                        <OperatorDot name={a.operatorName} size={12} />
                        <Text fontSize="10px" color={MUTED}>
                          {a.operatorName} · {fmtRelative(a.at)}
                        </Text>
                      </Flex>
                    </Box>
                    <TimeIcon boxSize={2.5} color={MUTED} />
                  </Flex>
                ))}
              </Flex>
            </Box>
          )}
        </Flex>

        {/* ── Right: Leaderboard ───────────────────────────────────────────── */}
        <Box w="260px" flexShrink={0} borderLeft={`1px solid ${CARD_BD}`} pl={5}>

          <Flex align="center" gap={2} mb={4}>
            <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
            <Text fontSize="10px" color={MUTED} textTransform="uppercase"
              letterSpacing="widest" fontWeight="bold">Leaderboard</Text>
            {leaderboard.length > 0 && (
              <Box px={2} py="1px" borderRadius="full" bg={A_S} border={`1px solid ${A_B}`}>
                <Text fontSize="10px" color={ACCENT} fontWeight="bold">
                  {leaderboard.length}
                </Text>
              </Box>
            )}
          </Flex>

          {leaderboard.length === 0 ? (
            <Box py={10} textAlign="center">
              <Text fontSize="11px" color={MUTED} opacity={0.4}>
                No squares claimed yet
              </Text>
              <Text fontSize="10px" color={MUTED} opacity={0.35} mt={1}>
                Be the first to score!
              </Text>
            </Box>
          ) : (
            <Flex direction="column" gap={1.5}>
              {leaderboard.map((op, i) => {
                const isMe = op.operatorId === myId;
                const isTop = i === 0 && op.points > 0;
                return (
                  <MotionBox key={op.operatorId}
                    layout
                    initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    px={3} py="10px" borderRadius="10px"
                    bg={isTop ? `${GOLD}0D` : isMe ? A_S : 'transparent'}
                    border={`1px solid ${isTop ? `${GOLD}30` : isMe ? A_B : 'transparent'}`}
                    _hover={{ bg: isTop ? `${GOLD}14` : isMe ? A_S : 'rgba(255,255,255,0.04)' }}>

                    <Flex align="center" gap={2} mb={1.5}>
                      <Box minW="20px" textAlign="center">
                        {isTop ? (
                          <StarIcon boxSize={3} color={GOLD} />
                        ) : (
                          <Text fontSize="10px" fontWeight="black" color={MUTED}
                            fontFamily="mono">#{i + 1}</Text>
                        )}
                      </Box>
                      <OperatorDot name={op.operatorName} size={20} />
                      <Text flex={1} fontSize="11px" fontWeight="semibold"
                        color={isTop ? GOLD : 'var(--dash-text-primary)'} noOfLines={1}>
                        {op.operatorName}
                      </Text>
                      {isMe && (
                        <Text fontSize="8px" color={ACCENT} fontWeight="black"
                          textTransform="uppercase" letterSpacing="wider">you</Text>
                      )}
                    </Flex>

                    {/* Points bar */}
                    <Flex align="center" gap={2} mb={1.5}>
                      <Text fontSize="15px" fontWeight="black"
                        color={isTop ? GOLD : ACCENT} lineHeight={1}>
                        {op.points}
                      </Text>
                      <Text fontSize="9px" color={MUTED}>pts</Text>
                      <Box flex={1} h="4px" borderRadius="full"
                        bg="rgba(255,255,255,0.06)" overflow="hidden">
                        <Box h="full"
                          w={pointsMax ? `${Math.min(100, (op.points / pointsMax) * 100)}%` : '0%'}
                          bg={isTop ? GOLD : ACCENT} borderRadius="full"
                          transition="width 0.4s" />
                      </Box>
                    </Flex>

                    {/* Badges */}
                    <Flex gap={1.5} flexWrap="wrap">
                      <Tooltip label="Squares claimed" hasArrow fontSize="10px">
                        <Box px="5px" py="1px" borderRadius="3px"
                          bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}>
                          <Text fontSize="9px" color={MUTED}>
                            <Text as="span" color="var(--dash-text-primary)" fontWeight="bold">
                              {op.squares}
                            </Text> squares
                          </Text>
                        </Box>
                      </Tooltip>
                      {op.bingos > 0 && (
                        <Tooltip label="Bingos scored" hasArrow fontSize="10px">
                          <Box px="5px" py="1px" borderRadius="3px"
                            bg={`${GOLD}12`} border={`1px solid ${GOLD}30`}>
                            <Text fontSize="9px" color={GOLD} fontWeight="bold">
                              {op.bingos} 🎯
                            </Text>
                          </Box>
                        </Tooltip>
                      )}
                      {op.firstClaims > 0 && (
                        <Tooltip label="First-to-claim in a category" hasArrow fontSize="10px">
                          <Box px="5px" py="1px" borderRadius="3px"
                            bg={`${VIOLET}12`} border={`1px solid ${VIOLET}30`}>
                            <Text fontSize="9px" color={VIOLET} fontWeight="bold">
                              {op.firstClaims} 🥇
                            </Text>
                          </Box>
                        </Tooltip>
                      )}
                    </Flex>
                  </MotionBox>
                );
              })}
            </Flex>
          )}

          {/* Legend */}
          <Box mt={5} pt={4} borderTop={`1px solid ${CARD_BD}`}>
            <Text fontSize="9px" color={MUTED} textTransform="uppercase"
              letterSpacing="wider" fontWeight="bold" mb={2}>Categories</Text>
            <Flex direction="column" gap={1}>
              {Object.entries(CATEGORY_META).map(([k, v]) => (
                <Flex key={k} align="center" gap={2}>
                  <Box w="6px" h="6px" borderRadius="full" bg={v.color} />
                  <Text fontSize="10px" color="var(--dash-text-secondary)">{v.label}</Text>
                </Flex>
              ))}
            </Flex>
          </Box>
        </Box>
      </Flex>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <SquareModal
        square={selectedSq}
        isMine={selectedSq?.claimedByOperatorId === myId}
        onClose={() => setSelectedSq(null)}
        onClaim={claimSquare}
        onUnclaim={unclaimSquare}
      />
      <TemplateConfirm
        target={templateConfirm}
        onClose={() => setTemplateConfirm(null)}
        onConfirm={() => switchTemplate(templateConfirm?.key)}
      />
    </Box>
  );
};

export default BingoView;
