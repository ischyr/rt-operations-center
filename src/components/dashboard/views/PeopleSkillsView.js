import { useState } from 'react';
import {
  Box, Flex, Text, Button, Input, Heading,
  Stack, SimpleGrid, IconButton, Slider,
  SliderTrack, SliderFilledTrack, SliderThumb, Tag, TagLabel, TagCloseButton, Wrap, WrapItem,
  InputGroup, InputLeftElement,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

const inputStyles = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4,
  h: '40px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" fontWeight="semibold" mb={1}>
    {children}
  </Text>
);

const SUGGESTED_SKILLS = [
  'Active Directory', 'Web App Testing', 'OSINT', 'Network Pentesting',
  'Cloud Security', 'Malware Development', 'Social Engineering', 'Physical Security',
  'Wireless', 'Mobile Testing', 'Reverse Engineering', 'Phishing',
];

const PeopleSkillsView = () => {
  const { slug } = useParams();
  const { getBySlug, updateEngagement, allUsers, getUserById } = useEngagements();
  const eng = getBySlug(slug);

  const [showAdd, setShowAdd] = useState(false);
  const [newSkill, setNewSkill] = useState({ label: '', pct: 75 });
  const [expandedOp, setExpandedOp] = useState(null);
  const [newOpSkill, setNewOpSkill] = useState('');
  const [opSearch, setOpSearch] = useState('');
  const [opPage, setOpPage] = useState(0);
  const OP_PAGE_SIZE = 5;

  if (!eng) return null;

  const teamSkills     = eng.teamSkills     || [];
  const operators      = eng.operators      || [];
  const operatorSkills = eng.operatorSkills || {};

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
    const updated = (operatorSkills[uid] || []).filter((s) => s !== skill);
    updateEngagement(eng.id, {
      operatorSkills: { ...operatorSkills, [uid]: updated },
    });
  };

  const saveSkill = () => {
    if (!newSkill.label.trim()) return;
    const exists = teamSkills.find((s) => s.label.toLowerCase() === newSkill.label.trim().toLowerCase());
    if (exists) return;
    updateEngagement(eng.id, {
      teamSkills: [...teamSkills, { label: newSkill.label.trim(), pct: newSkill.pct }],
    });
    setNewSkill({ label: '', pct: 75 });
    setShowAdd(false);
  };

  const updatePct = (label, pct) => {
    updateEngagement(eng.id, {
      teamSkills: teamSkills.map((s) => s.label === label ? { ...s, pct } : s),
    });
  };

  const removeSkill = (label) => {
    updateEngagement(eng.id, {
      teamSkills: teamSkills.filter((s) => s.label !== label),
    });
  };

  return (
    <Box pb={8}>
      <Flex justify="space-between" align="flex-start" mb={6}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            People & <Text as="span" color="red.400">Skills</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · team coverage feeds the dashboard
          </Text>
        </Box>
        <Button
          leftIcon={<AddIcon boxSize={3} />}
          bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
          color="rgba(255,130,130,0.9)" fontSize="sm" borderRadius="10px" h="40px" px={4}
          _hover={{ bg: 'rgba(255,80,95,0.18)' }}
          onClick={() => setShowAdd(!showAdd)}
        >
          Add Skill
        </Button>
      </Flex>

      {/* Assigned operators */}
      {(() => {
        const filteredUsers = allUsers.filter((u) =>
          u.callsign.toLowerCase().includes(opSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(opSearch.toLowerCase())
        );
        const totalOpPages = Math.ceil(filteredUsers.length / OP_PAGE_SIZE);
        const pagedUsers   = filteredUsers.slice(opPage * OP_PAGE_SIZE, opPage * OP_PAGE_SIZE + OP_PAGE_SIZE);

        return (
          <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="14px" p={5} mb={5}>
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider">
                Assigned Operators
                {operators.length > 0 && (
                  <Text as="span" ml={2} px="6px" py="1px" borderRadius="20px"
                    bg="rgba(255,80,95,0.12)" border="1px solid rgba(255,80,95,0.25)"
                    color="red.400" fontSize="9px">{operators.length} assigned</Text>
                )}
              </Text>
            </Flex>

            {allUsers.length === 0 ? (
              <Text fontSize="sm" color="var(--dash-text-muted)">No users found in the database.</Text>
            ) : (
              <>
                {/* Search */}
                <InputGroup mb={3}>
                  <InputLeftElement h="36px" pl={3} pointerEvents="none">
                    <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search operators..."
                    value={opSearch}
                    onChange={(e) => { setOpSearch(e.target.value); setOpPage(0); }}
                    {...inputStyles}
                    h="36px"
                    pl={9}
                    fontSize="12px"
                  />
                </InputGroup>

                <Flex direction="column" gap={2}>
                  <AnimatePresence mode="wait">
                    <MotionBox
                      key={`${opPage}-${opSearch}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Flex direction="column" gap={2}>
                        {pagedUsers.length === 0 ? (
                          <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center" py={4}>
                            No operators match "{opSearch}"
                          </Text>
                        ) : pagedUsers.map((user) => {
                          const uid        = String(user.id);
                          const assigned   = operators.map(String).includes(uid);
                          const initials   = user.callsign.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                          const opSkills   = operatorSkills[uid] || [];
                          const isExpanded = expandedOp === uid;
                          return (
                            <Box key={uid}
                              borderRadius="10px"
                              bg={assigned ? 'rgba(255,80,95,0.08)' : 'rgba(255,255,255,0.02)'}
                              border={assigned ? '1px solid rgba(255,80,95,0.2)' : '1px solid rgba(255,255,255,0.06)'}
                              opacity={assigned ? 1 : 0.45}
                              overflow="hidden"
                            >
                              <Flex
                                align="center" gap={2} px={4} py="10px"
                                cursor={assigned ? 'pointer' : 'default'}
                                onClick={() => assigned && setExpandedOp(isExpanded ? null : uid)}
                                _hover={assigned ? { bg: 'rgba(255,80,95,0.04)' } : {}}
                                transition="background 0.15s"
                              >
                                <Box
                                  w="28px" h="28px" borderRadius="full" flexShrink={0}
                                  bg={assigned ? 'rgba(255,80,95,0.2)' : 'rgba(255,255,255,0.05)'}
                                  border={assigned ? '1px solid rgba(255,80,95,0.35)' : '1px solid rgba(255,255,255,0.1)'}
                                  display="flex" alignItems="center" justifyContent="center"
                                  fontSize="11px" fontWeight="bold"
                                  color={assigned ? 'red.300' : 'var(--dash-text-muted)'}
                                >
                                  {initials}
                                </Box>
                                <Box flex="1">
                                  <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)">{user.callsign}</Text>
                                  <Text fontSize="10px" color="var(--dash-text-muted)">
                                    {assigned ? user.email : 'Not assigned'}
                                  </Text>
                                </Box>
                                {assigned && (
                                  <Flex align="center" gap={2}>
                                    {opSkills.length > 0 && (
                                      <Text fontSize="10px" color="var(--dash-text-muted)">{opSkills.length} skill{opSkills.length !== 1 ? 's' : ''}</Text>
                                    )}
                                    {isExpanded ? <ChevronUpIcon boxSize={3} color="var(--dash-text-muted)" /> : <ChevronDownIcon boxSize={3} color="var(--dash-text-muted)" />}
                                  </Flex>
                                )}
                              </Flex>

                              <AnimatePresence>
                                {isExpanded && assigned && (
                                  <MotionBox
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    overflow="hidden"
                                  >
                                    <Box px={4} pb={4} borderTop="1px solid rgba(255,80,95,0.1)">
                                      <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" mb={2} mt={3} fontWeight="semibold">
                                        Operator Skills
                                      </Text>
                                      <Wrap spacing={2} mb={3}>
                                        {opSkills.map((skill) => (
                                          <WrapItem key={skill}>
                                            <Tag size="sm" borderRadius="6px"
                                              bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.25)"
                                              color="rgba(255,130,130,0.9)"
                                            >
                                              <TagLabel fontSize="11px">{skill}</TagLabel>
                                              <TagCloseButton onClick={() => removeOpSkill(uid, skill)} />
                                            </Tag>
                                          </WrapItem>
                                        ))}
                                        {opSkills.length === 0 && (
                                          <Text fontSize="11px" color="var(--dash-text-muted)">No skills added yet.</Text>
                                        )}
                                      </Wrap>
                                      <Flex gap={2}>
                                        <Input
                                          value={newOpSkill}
                                          onChange={(e) => setNewOpSkill(e.target.value)}
                                          onKeyDown={(e) => e.key === 'Enter' && addOpSkill(uid)}
                                          placeholder="Add skill (e.g. OSINT)"
                                          list="op-skill-suggestions"
                                          size="sm"
                                          {...inputStyles}
                                          h="32px"
                                        />
                                        <datalist id="op-skill-suggestions">
                                          {SUGGESTED_SKILLS.map((s) => <option key={s} value={s} />)}
                                        </datalist>
                                        <IconButton
                                          icon={<AddIcon boxSize={2.5} />}
                                          size="sm" h="32px" w="32px" minW="32px"
                                          bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
                                          color="rgba(255,130,130,0.9)" borderRadius="8px"
                                          _hover={{ bg: 'rgba(255,80,95,0.2)' }}
                                          onClick={() => addOpSkill(uid)}
                                          aria-label="Add skill"
                                        />
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
                </Flex>

                {/* Pagination */}
                {totalOpPages > 1 && (
                  <Flex align="center" justify="center" gap={3} mt={4}>
                    <IconButton
                      icon={<ChevronLeftIcon boxSize={4} />}
                      size="xs" variant="ghost" borderRadius="full"
                      color={opPage === 0 ? 'var(--dash-text-muted)' : 'var(--dash-text-secondary)'}
                      isDisabled={opPage === 0}
                      onClick={() => setOpPage((p) => p - 1)}
                      _hover={{ bg: 'rgba(255,255,255,0.07)', color: 'white' }}
                      aria-label="Previous"
                    />
                    <Flex gap={1.5} align="center">
                      {Array.from({ length: totalOpPages }).map((_, i) => (
                        <Box
                          key={i}
                          w={i === opPage ? '16px' : '5px'} h="5px"
                          borderRadius="full"
                          bg={i === opPage ? 'red.500' : 'rgba(255,255,255,0.15)'}
                          transition="all 0.22s ease"
                          cursor="pointer"
                          onClick={() => setOpPage(i)}
                        />
                      ))}
                    </Flex>
                    <IconButton
                      icon={<ChevronRightIcon boxSize={4} />}
                      size="xs" variant="ghost" borderRadius="full"
                      color={opPage === totalOpPages - 1 ? 'var(--dash-text-muted)' : 'var(--dash-text-secondary)'}
                      isDisabled={opPage === totalOpPages - 1}
                      onClick={() => setOpPage((p) => p + 1)}
                      _hover={{ bg: 'rgba(255,255,255,0.07)', color: 'white' }}
                      aria-label="Next"
                    />
                  </Flex>
                )}
              </>
            )}
          </Box>
        );
      })()}

      {/* Operator Skills Summary */}
      {(() => {
        const withSkills = operators
          .map((id) => {
            const uid  = String(id);
            const user = allUsers.find((u) => String(u.id) === uid);
            const skills = operatorSkills[uid] || [];
            return user && skills.length > 0 ? { user, uid, skills } : null;
          })
          .filter(Boolean);

        if (withSkills.length === 0) return null;

        return (
          <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="14px" p={5} mb={5}>
            <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" mb={4}>
              Operator Skills Overview
            </Text>
            <Flex direction="column" gap={4}>
              {withSkills.map(({ user, uid, skills }) => {
                const initials = user.callsign.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <Box key={uid}>
                    <Flex align="center" gap={2} mb={2}>
                      <Box
                        w="24px" h="24px" borderRadius="full" flexShrink={0}
                        bg="rgba(255,80,95,0.2)" border="1px solid rgba(255,80,95,0.35)"
                        display="flex" alignItems="center" justifyContent="center"
                        fontSize="10px" fontWeight="bold" color="red.300"
                      >
                        {initials}
                      </Box>
                      <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)">{user.callsign}</Text>
                      <Text fontSize="10px" color="var(--dash-text-muted)" ml={1}>{skills.length} skill{skills.length !== 1 ? 's' : ''}</Text>
                    </Flex>
                    <Wrap spacing={2} pl="32px">
                      {skills.map((skill) => (
                        <WrapItem key={skill}>
                          <Tag size="sm" borderRadius="6px"
                            bg="rgba(255,80,95,0.08)" border="1px solid rgba(255,80,95,0.2)"
                            color="rgba(255,130,130,0.85)"
                          >
                            <TagLabel fontSize="11px">{skill}</TagLabel>
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                );
              })}
            </Flex>
          </Box>
        );
      })()}

      {/* Add skill form */}
      <AnimatePresence>
        {showAdd && (
          <MotionBox
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} overflow="hidden" mb={5}
          >
            <Box bg="var(--dash-card-bg)" border="1px solid rgba(255,80,95,0.2)" borderRadius="14px" p={5}>
              <Text fontSize="11px" fontWeight="bold" color="red.400" mb={4} textTransform="uppercase" letterSpacing="wider">
                New Skill
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <Box>
                  <Label>Skill / Technique</Label>
                  <Input
                    value={newSkill.label}
                    onChange={(e) => setNewSkill((p) => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. Active Directory"
                    list="skill-suggestions"
                    {...inputStyles}
                  />
                  <datalist id="skill-suggestions">
                    {SUGGESTED_SKILLS.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </Box>
                <Box>
                  <Label>Team Coverage — {newSkill.pct}%</Label>
                  <Box pt={2}>
                    <Slider
                      value={newSkill.pct} min={0} max={100} step={5}
                      onChange={(v) => setNewSkill((p) => ({ ...p, pct: v }))}
                    >
                      <SliderTrack bg="var(--dash-progress-track)" h="6px" borderRadius="full">
                        <SliderFilledTrack bgGradient="linear(to-r, red.700, red.400)" />
                      </SliderTrack>
                      <SliderThumb boxSize={4} bg="red.400" boxShadow="0 0 8px rgba(255,80,95,0.6)" />
                    </Slider>
                  </Box>
                </Box>
              </SimpleGrid>
              <Flex gap={2}>
                <Button size="sm" variant="ghost" color="var(--dash-text-muted)"
                  _hover={{ bg: 'rgba(255,255,255,0.05)' }} onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button size="sm" leftIcon={<AddIcon boxSize={3} />}
                  bgGradient="linear(to-r, red.700, red.500)" color="white"
                  _hover={{ bgGradient: 'linear(to-r, red.600, red.400)' }}
                  onClick={saveSkill}>Add Skill</Button>
              </Flex>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Skills list */}
      {teamSkills.length === 0 ? (
        <Flex direction="column" align="center" py={16} gap={3}
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="14px">
          <Text fontSize="2xl">🎯</Text>
          <Text fontWeight="semibold" color="var(--dash-text-primary)">No skills tracked</Text>
          <Text fontSize="sm" color="var(--dash-text-muted)" textAlign="center" maxW="300px">
            Add team skill coverage levels. These aggregate on the dashboard's Team Skill Coverage widget.
          </Text>
        </Flex>
      ) : (
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="14px" p={5}>
          <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" mb={5}>
            Skill Coverage — {teamSkills.length} tracked
          </Text>
          <AnimatePresence initial={false}>
            {teamSkills.map((s) => {
              const color = s.pct >= 80 ? '#68D391' : s.pct >= 60 ? '#F6E05E' : '#F6AD55';
              return (
                <MotionBox
                  key={s.label}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  mb={5}
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">{s.label}</Text>
                    <Flex align="center" gap={2}>
                      <Text fontSize="12px" fontWeight="bold" color={color}>{s.pct}%</Text>
                      <IconButton
                        icon={<DeleteIcon />} size="xs" variant="ghost"
                        color="var(--dash-text-muted)" _hover={{ color: 'red.400' }}
                        onClick={() => removeSkill(s.label)} aria-label="Remove skill"
                      />
                    </Flex>
                  </Flex>
                  <Slider
                    value={s.pct} min={0} max={100} step={5}
                    onChange={(v) => updatePct(s.label, v)}
                  >
                    <SliderTrack bg="var(--dash-progress-track)" h="6px" borderRadius="full">
                      <SliderFilledTrack bg={color} />
                    </SliderTrack>
                    <SliderThumb boxSize={4} bg={color} boxShadow={`0 0 8px ${color}80`} />
                  </Slider>
                </MotionBox>
              );
            })}
          </AnimatePresence>
        </Box>
      )}
    </Box>
  );
};

export default PeopleSkillsView;
