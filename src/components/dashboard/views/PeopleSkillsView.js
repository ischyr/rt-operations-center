import { useState, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Button, Input,
  SimpleGrid, IconButton, Tag, TagLabel, TagCloseButton,
  Wrap, WrapItem, Spinner, Tooltip,
  Modal, ModalOverlay, ModalContent, ModalBody,
} from '@chakra-ui/react';
import {
  AddIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon,
  ChevronRightIcon, SearchIcon, CloseIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Colors ──────────────────────────────────────────────────────────────────
const ACCENT = '#9F7AEA';
const GREEN  = '#68D391';
const TEAL   = '#4fd1c5';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const YELLOW = '#F6E05E';
const BLUE   = '#63B3ED';
const CYAN   = '#76E4F7';

// ── SVG Icons ───────────────────────────────────────────────────────────────
const UsersIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Box>
);

const ShieldIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Box>
);

const TargetIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </Box>
);

const UserPlusIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
  </Box>
);

const ZapIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Box>
);

const BarChartIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
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

const SUGGESTED_SKILLS = [
  'Active Directory', 'Web App Testing', 'OSINT', 'Network Pentesting',
  'Cloud Security', 'Malware Development', 'Social Engineering', 'Physical Security',
  'Wireless', 'Mobile Testing', 'Reverse Engineering', 'Phishing',
];

// ── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, iconColor, label, value, sub }) => (
  <MotionBox
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="12px" p={4} pos="relative" overflow="hidden"
  >
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${iconColor}60, transparent)` }} />
    <Flex justify="space-between" align="flex-start">
      <Box>
        <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
          textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
        <Text fontSize="2xl" fontWeight="black" color={iconColor}>{value}</Text>
        {sub && <Text fontSize="10px" color="var(--dash-text-muted)" mt={0.5}>{sub}</Text>}
      </Box>
      <Flex w="32px" h="32px" borderRadius="8px" bg={`${iconColor}12`}
        border={`1px solid ${iconColor}30`} align="center" justify="center" flexShrink={0}>
        <Icon boxSize="15px" color={iconColor} />
      </Flex>
    </Flex>
  </MotionBox>
);

// ── Coverage Bar ────────────────────────────────────────────────────────────
const CoverageBar = ({ label, count, total, operators: ops }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = pct >= 80 ? GREEN : pct >= 50 ? YELLOW : pct >= 30 ? ORANGE : RED;

  return (
    <Box py={3} borderBottom="1px solid rgba(255,255,255,0.04)" _last={{ borderBottom: 'none' }}>
      <Flex justify="space-between" align="center" mb={2}>
        <Flex align="center" gap={2}>
          <Flex w="22px" h="22px" borderRadius="5px" bg={`${color}12`}
            border={`1px solid ${color}25`} align="center" justify="center" flexShrink={0}>
            <TargetIcon boxSize="11px" color={color} />
          </Flex>
          <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">{label}</Text>
        </Flex>
        <Flex align="center" gap={2}>
          <Text fontSize="12px" fontWeight="bold" color={color}>{count}/{total}</Text>
          <Box px="8px" py="2px" borderRadius="5px" bg={`${color}10`} border={`1px solid ${color}25`}>
            <Text fontSize="10px" fontWeight="bold" color={color}>{pct}%</Text>
          </Box>
        </Flex>
      </Flex>

      {/* Progress bar */}
      <Box w="100%" h="6px" bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden" mb={2}>
        <Box h="100%" borderRadius="full" bg={color}
          style={{ width: `${pct}%`, transition: 'width 0.4s ease' }} />
      </Box>

      {/* Operator avatars */}
      {ops.length > 0 && (
        <Flex gap={1.5} flexWrap="wrap">
          {ops.map(op => (
            <Tooltip key={op.uid} label={`${op.name} — ${op.has ? 'has skill' : 'missing'}`} fontSize="10px">
              <Flex w="22px" h="22px" borderRadius="full" flexShrink={0}
                bg={op.has ? `${color}15` : 'rgba(255,255,255,0.04)'}
                border={`1px solid ${op.has ? `${color}40` : 'rgba(255,255,255,0.08)'}`}
                align="center" justify="center"
                fontSize="8px" fontWeight="bold"
                color={op.has ? color : 'var(--dash-text-muted)'}>
                {op.initials}
              </Flex>
            </Tooltip>
          ))}
        </Flex>
      )}
    </Box>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
const PeopleSkillsView = () => {
  const { slug } = useParams();
  const { getBySlug, updateEngagement, allUsers, getUserById } = useEngagements();
  const eng = getBySlug(slug);

  const [expandedOp, setExpandedOp] = useState(null);
  const [newOpSkill, setNewOpSkill] = useState('');
  const [opSearch, setOpSearch]     = useState('');
  const [opPage, setOpPage]         = useState(0);
  const [opModal, setOpModal]       = useState(null);
  const OP_PAGE_SIZE = 6;

  const operators      = eng?.operators || [];
  const operatorSkills = eng?.operatorSkills || {};
  const assignedIds    = operators.map(String);

  // ── Auto-computed skill coverage (must be before early return) ─────────
  const { allSkills, coverageData, avgCoverage } = useMemo(() => {
    if (!eng) return { allSkills: [], coverageData: [], avgCoverage: 0 };
    const skillSet = new Set();
    assignedIds.forEach(uid => {
      (operatorSkills[uid] || []).forEach(s => skillSet.add(s));
    });
    const skills = [...skillSet].sort();
    const data = skills.map(skill => {
      const ops = assignedIds.map(uid => {
        const user = allUsers.find(u => String(u.id) === uid);
        const has = (operatorSkills[uid] || []).includes(skill);
        return {
          uid,
          name: user?.callsign || uid,
          initials: (user?.callsign || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          has,
        };
      });
      return { skill, count: ops.filter(o => o.has).length, total: assignedIds.length, operators: ops };
    });
    const avg = data.length > 0
      ? Math.round(data.reduce((sum, c) => sum + (c.count / c.total) * 100, 0) / data.length)
      : 0;
    return { allSkills: skills, coverageData: data, avgCoverage: avg };
  }, [eng, allUsers]);

  if (!eng) return (
    <Flex align="center" justify="center" h="60vh"><Spinner size="lg" color={ACCENT} /></Flex>
  );

  // ── Operator list ───────────────────────────────────────────────────────
  const filteredUsers = allUsers
    .filter(u =>
      u.callsign.toLowerCase().includes(opSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(opSearch.toLowerCase())
    )
    .sort((a, b) => {
      const aA = assignedIds.includes(String(a.id));
      const bA = assignedIds.includes(String(b.id));
      if (aA && !bA) return -1;
      if (!aA && bA)  return 1;
      return a.callsign.localeCompare(b.callsign);
    });

  const totalOpPages = Math.ceil(filteredUsers.length / OP_PAGE_SIZE);
  const pagedUsers   = filteredUsers.slice(opPage * OP_PAGE_SIZE, opPage * OP_PAGE_SIZE + OP_PAGE_SIZE);

  const confirmOp = () => {
    if (!opModal) return;
    const { user, action } = opModal;
    const uid = String(user.id);
    if (action === 'add') {
      updateEngagement(eng.id, { operators: [...operators, uid] });
    } else {
      updateEngagement(eng.id, { operators: operators.filter(o => String(o) !== uid) });
      if (expandedOp === uid) setExpandedOp(null);
    }
    setOpModal(null);
  };

  const addOpSkill = (uid) => {
    const trimmed = newOpSkill.trim();
    if (!trimmed) return;
    const existing = operatorSkills[uid] || [];
    if (existing.includes(trimmed)) return;
    updateEngagement(eng.id, {
      operatorSkills: { ...operatorSkills, [uid]: [...existing, trimmed] },
    });
    setNewOpSkill('');
  };

  const removeOpSkill = (uid, skill) => {
    updateEngagement(eng.id, {
      operatorSkills: { ...operatorSkills, [uid]: (operatorSkills[uid] || []).filter(s => s !== skill) },
    });
  };

  return (
    <Box px={6} pb={12}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            People & <Text as="span" color="red.400">Skills</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · manage operators and track skill coverage
          </Text>
        </Box>
      </Flex>

      {/* Stats row */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={6}>
        <StatCard icon={UsersIcon} iconColor={ACCENT} label="Operators"
          value={operators.length} sub={`of ${allUsers.length} total`} />
        <StatCard icon={ZapIcon} iconColor={CYAN} label="Unique Skills"
          value={allSkills.length} />
        <StatCard icon={BarChartIcon} iconColor={avgCoverage >= 60 ? GREEN : ORANGE}
          label="Avg Coverage" value={`${avgCoverage}%`} />
        <StatCard icon={ShieldIcon} iconColor={GREEN} label="Full Coverage"
          value={coverageData.filter(c => c.count === c.total && c.total > 0).length}
          sub={`of ${allSkills.length} skills`} />
      </SimpleGrid>

      {/* Two-column layout */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={5}>

        {/* ── Left: Operators ────────────────────────────────────────── */}
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="14px" p={5} pos="relative">
          <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
            style={{ background: `linear-gradient(to right, transparent, ${ACCENT}60, transparent)` }} />

          <Flex align="center" gap={2} mb={4}>
            <Flex w="26px" h="26px" borderRadius="7px" bg={`${ACCENT}12`}
              border={`1px solid ${ACCENT}30`} align="center" justify="center">
              <UsersIcon boxSize="13px" color={ACCENT} />
            </Flex>
            <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)"
              textTransform="uppercase" letterSpacing="wider">Operators</Text>
            {operators.length > 0 && (
              <Box px="8px" py="2px" borderRadius="5px" bg={`${ACCENT}10`} border={`1px solid ${ACCENT}25`}>
                <Text fontSize="9px" fontWeight="bold" color={ACCENT}>{operators.length} assigned</Text>
              </Box>
            )}
          </Flex>

          {/* Search */}
          <Box pos="relative" mb={3}>
            <Box pos="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
              <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
            </Box>
            <Input value={opSearch}
              onChange={e => { setOpSearch(e.target.value); setOpPage(0); }}
              placeholder="Search operators…" {...inputSx} pl={9} h="36px" fontSize="12px" />
          </Box>

          {allUsers.length === 0 ? (
            <Text fontSize="sm" color="var(--dash-text-muted)">No users found.</Text>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <MotionBox key={`${opPage}-${opSearch}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}>
                  <Flex direction="column" gap={2}>
                    {pagedUsers.length === 0 ? (
                      <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center" py={4}>
                        No match for "{opSearch}"
                      </Text>
                    ) : pagedUsers.map(user => {
                      const uid = String(user.id);
                      const assigned = assignedIds.includes(uid);
                      const initials = user.callsign.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      const opSkills = operatorSkills[uid] || [];
                      const isExpanded = expandedOp === uid;

                      return (
                        <Box key={uid} borderRadius="10px"
                          bg={assigned ? `${ACCENT}08` : 'rgba(255,255,255,0.02)'}
                          border={assigned ? `1px solid ${ACCENT}20` : '1px solid rgba(255,255,255,0.06)'}
                          _hover={!assigned ? { borderColor: `${TEAL}40`, bg: `${TEAL}06` } : {}}
                          style={{ transition: 'all 0.15s' }}>

                          <Flex align="center" gap={2} px={4} py="10px" cursor="pointer"
                            onClick={() => assigned
                              ? setExpandedOp(isExpanded ? null : uid)
                              : setOpModal({ user, action: 'add' })
                            }>

                            <Flex w="30px" h="30px" borderRadius="8px" flexShrink={0}
                              bg={assigned ? `${ACCENT}15` : 'rgba(255,255,255,0.05)'}
                              border={`1px solid ${assigned ? `${ACCENT}35` : 'rgba(255,255,255,0.1)'}`}
                              align="center" justify="center"
                              fontSize="11px" fontWeight="bold"
                              color={assigned ? ACCENT : 'var(--dash-text-muted)'}>
                              {initials}
                            </Flex>

                            <Box flex="1" minW={0}>
                              <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)"
                                noOfLines={1}>{user.callsign}</Text>
                              <Text fontSize="10px" color={assigned ? 'var(--dash-text-muted)' : `${TEAL}90`}
                                noOfLines={1}>
                                {assigned ? (opSkills.length > 0 ? `${opSkills.length} skill${opSkills.length !== 1 ? 's' : ''}` : 'No skills yet') : 'Click to assign'}
                              </Text>
                            </Box>

                            {assigned ? (
                              <Flex align="center" gap={1.5}>
                                {isExpanded
                                  ? <ChevronUpIcon boxSize={3.5} color="var(--dash-text-muted)" />
                                  : <ChevronDownIcon boxSize={3.5} color="var(--dash-text-muted)" />}
                                <Box as="button"
                                  onClick={e => { e.stopPropagation(); setOpModal({ user, action: 'remove' }); }}
                                  w="22px" h="22px" borderRadius="6px" flexShrink={0}
                                  bg={`${RED}08`} border={`1px solid ${RED}20`}
                                  display="flex" alignItems="center" justifyContent="center"
                                  color={`${RED}90`}
                                  _hover={{ bg: `${RED}18`, borderColor: `${RED}50`, color: RED }}
                                  style={{ transition: 'all 0.15s' }}>
                                  <CloseIcon boxSize="7px" />
                                </Box>
                              </Flex>
                            ) : (
                              <Flex w="24px" h="24px" borderRadius="6px" flexShrink={0}
                                bg={`${TEAL}10`} border={`1px solid ${TEAL}25`}
                                align="center" justify="center" color={TEAL}>
                                <AddIcon boxSize={2.5} />
                              </Flex>
                            )}
                          </Flex>

                          {/* Expanded skills panel */}
                          <AnimatePresence>
                            {isExpanded && assigned && (
                              <MotionBox
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                overflow="hidden">
                                <Box px={4} pb={4} borderTop={`1px solid ${ACCENT}12`}>
                                  <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
                                    letterSpacing="wider" mb={2} mt={3} fontWeight="bold">
                                    Skills
                                  </Text>
                                  <Wrap spacing={2} mb={3}>
                                    {opSkills.map(skill => (
                                      <WrapItem key={skill}>
                                        <Tag size="sm" borderRadius="6px"
                                          bg={`${ACCENT}10`} border={`1px solid ${ACCENT}25`} color={ACCENT}>
                                          <TagLabel fontSize="11px">{skill}</TagLabel>
                                          <TagCloseButton onClick={() => removeOpSkill(uid, skill)} />
                                        </Tag>
                                      </WrapItem>
                                    ))}
                                    {opSkills.length === 0 && (
                                      <Text fontSize="11px" color="var(--dash-text-muted)" fontStyle="italic">
                                        No skills — add below
                                      </Text>
                                    )}
                                  </Wrap>
                                  <Flex gap={2}>
                                    <Input value={newOpSkill}
                                      onChange={e => setNewOpSkill(e.target.value)}
                                      onKeyDown={e => e.key === 'Enter' && addOpSkill(uid)}
                                      placeholder="Add skill (e.g. OSINT)"
                                      list="op-skill-suggestions"
                                      {...inputSx} h="32px" fontSize="12px" />
                                    <datalist id="op-skill-suggestions">
                                      {SUGGESTED_SKILLS.map(s => <option key={s} value={s} />)}
                                    </datalist>
                                    <IconButton icon={<AddIcon boxSize={2.5} />}
                                      size="sm" h="32px" w="32px" minW="32px"
                                      bg={`${ACCENT}12`} border={`1px solid ${ACCENT}30`}
                                      color={ACCENT} borderRadius="8px"
                                      _hover={{ bg: `${ACCENT}22` }}
                                      onClick={() => addOpSkill(uid)} aria-label="Add skill" />
                                  </Flex>
                                </Box>
                              </MotionBox>
                            )}
                          </AnimatePresence>
                        </Box>
                      );
                    })}
                  </Flex>
                </MotionBox>
              </AnimatePresence>

              {/* Pagination */}
              {totalOpPages > 1 && (
                <Flex align="center" justify="center" gap={3} mt={4}>
                  <IconButton icon={<ChevronLeftIcon boxSize={4} />}
                    size="xs" variant="ghost" borderRadius="full"
                    color={opPage === 0 ? 'var(--dash-text-muted)' : 'var(--dash-text-secondary)'}
                    isDisabled={opPage === 0} onClick={() => setOpPage(p => p - 1)}
                    _hover={{ bg: 'rgba(255,255,255,0.07)', color: 'white' }} aria-label="Prev" />
                  <Flex gap={1.5} align="center">
                    {Array.from({ length: totalOpPages }).map((_, i) => (
                      <Box key={i}
                        w={i === opPage ? '16px' : '5px'} h="5px" borderRadius="full"
                        bg={i === opPage ? ACCENT : 'rgba(255,255,255,0.15)'}
                        style={{ transition: 'all 0.22s ease' }}
                        cursor="pointer" onClick={() => setOpPage(i)} />
                    ))}
                  </Flex>
                  <IconButton icon={<ChevronRightIcon boxSize={4} />}
                    size="xs" variant="ghost" borderRadius="full"
                    color={opPage === totalOpPages - 1 ? 'var(--dash-text-muted)' : 'var(--dash-text-secondary)'}
                    isDisabled={opPage === totalOpPages - 1} onClick={() => setOpPage(p => p + 1)}
                    _hover={{ bg: 'rgba(255,255,255,0.07)', color: 'white' }} aria-label="Next" />
                </Flex>
              )}
            </>
          )}
        </Box>

        {/* ── Right: Skill Coverage (auto-computed) ──────────────────── */}
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="14px" p={5} pos="relative" alignSelf="start">
          <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
            style={{ background: `linear-gradient(to right, transparent, ${GREEN}60, transparent)` }} />

          <Flex align="center" gap={2} mb={4}>
            <Flex w="26px" h="26px" borderRadius="7px" bg={`${GREEN}12`}
              border={`1px solid ${GREEN}30`} align="center" justify="center">
              <TargetIcon boxSize="13px" color={GREEN} />
            </Flex>
            <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)"
              textTransform="uppercase" letterSpacing="wider">Skill Coverage</Text>
            {allSkills.length > 0 && (
              <Box px="8px" py="2px" borderRadius="5px" bg={`${GREEN}10`} border={`1px solid ${GREEN}25`}>
                <Text fontSize="9px" fontWeight="bold" color={GREEN}>{allSkills.length} tracked</Text>
              </Box>
            )}
          </Flex>

          {operators.length === 0 ? (
            <Flex direction="column" align="center" py={10} gap={3}>
              <Flex w="48px" h="48px" borderRadius="12px" bg={`${ACCENT}12`}
                border={`2px solid ${ACCENT}35`} align="center" justify="center">
                <UserPlusIcon boxSize="22px" color={ACCENT} />
              </Flex>
              <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
                No operators assigned
              </Text>
              <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" maxW="260px">
                Assign operators and add their skills to see automatic coverage tracking.
              </Text>
            </Flex>
          ) : allSkills.length === 0 ? (
            <Flex direction="column" align="center" py={10} gap={3}>
              <Flex w="48px" h="48px" borderRadius="12px" bg={`${CYAN}12`}
                border={`2px solid ${CYAN}35`} align="center" justify="center">
                <ZapIcon boxSize="22px" color={CYAN} />
              </Flex>
              <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
                No skills added yet
              </Text>
              <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" maxW="260px">
                Expand an operator and add skills. Coverage is calculated automatically.
              </Text>
            </Flex>
          ) : (
            <Flex direction="column">
              {coverageData.map(c => (
                <CoverageBar key={c.skill} label={c.skill}
                  count={c.count} total={c.total} operators={c.operators} />
              ))}
            </Flex>
          )}
        </Box>

      </SimpleGrid>

      {/* ── Confirm modal ── */}
      <Modal isOpen={!!opModal} onClose={() => setOpModal(null)} isCentered size="sm">
        <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px" p={0} overflow="hidden">
          <ModalBody p={0}>
            {opModal && (() => {
              const isAdd = opModal.action === 'add';
              const name  = opModal.user.callsign;
              const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const accentColor = isAdd ? TEAL : RED;
              return (
                <Box p={6}>
                  <Box h="2px" pos="absolute" top="0" left="0" right="0"
                    style={{ background: `linear-gradient(to right, transparent, ${accentColor}B0, transparent)` }} />
                  <Flex direction="column" align="center" mb={5}>
                    <Flex w="56px" h="56px" borderRadius="14px" align="center" justify="center"
                      fontSize="18px" fontWeight="bold" fontFamily="mono" mb={3}
                      bg={`${accentColor}12`} border={`1px solid ${accentColor}35`} color={accentColor}>
                      {initials}
                    </Flex>
                    <Text fontSize="16px" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
                      {name}
                    </Text>
                    <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" maxW="260px">
                      {isAdd ? 'Assign this operator to the engagement?' : 'Remove this operator from the engagement?'}
                    </Text>
                    {!isAdd && (
                      <Text fontSize="10px" color={`${RED}80`} mt={1} textAlign="center">
                        Their skills and data will remain saved.
                      </Text>
                    )}
                  </Flex>
                  <Flex gap={3}>
                    <Button flex="1" size="sm" variant="ghost"
                      color="var(--dash-text-muted)" borderRadius="10px"
                      border="1px solid rgba(255,255,255,0.08)"
                      _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                      onClick={() => setOpModal(null)}>
                      Cancel
                    </Button>
                    <Button flex="1" size="sm" borderRadius="10px"
                      bg={`${accentColor}15`} border={`1px solid ${accentColor}40`}
                      color={accentColor} fontWeight="semibold"
                      _hover={{ bg: `${accentColor}25` }}
                      onClick={confirmOp}>
                      {isAdd ? '+ Assign' : '− Remove'}
                    </Button>
                  </Flex>
                </Box>
              );
            })()}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PeopleSkillsView;
