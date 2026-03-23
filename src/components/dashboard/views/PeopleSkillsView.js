import { useState } from 'react';
import {
  Box, Flex, Text, Button, Input, Heading,
  Stack, SimpleGrid, IconButton, Slider,
  SliderTrack, SliderFilledTrack, SliderThumb,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CheckIcon } from '@chakra-ui/icons';
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

  if (!eng) return null;

  const teamSkills = eng.teamSkills || [];
  const operators  = eng.operators  || [];

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
      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="14px" p={5} mb={5}>
        <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" mb={4}>
          Assigned Operators
        </Text>
        {allUsers.length === 0 ? (
          <Text fontSize="sm" color="var(--dash-text-muted)">No users found in the database.</Text>
        ) : (
          <Flex gap={3} flexWrap="wrap">
            {allUsers.map((user) => {
              const uid      = String(user.id);
              const assigned = operators.map(String).includes(uid);
              const initials = user.callsign.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <Flex
                  key={uid} align="center" gap={2}
                  px={4} py={3} borderRadius="10px"
                  bg={assigned ? 'rgba(255,80,95,0.08)' : 'rgba(255,255,255,0.02)'}
                  border={assigned ? '1px solid rgba(255,80,95,0.2)' : '1px solid rgba(255,255,255,0.06)'}
                  opacity={assigned ? 1 : 0.45}
                >
                  <Box
                    w="28px" h="28px" borderRadius="full"
                    bg={assigned ? 'rgba(255,80,95,0.2)' : 'rgba(255,255,255,0.05)'}
                    border={assigned ? '1px solid rgba(255,80,95,0.35)' : '1px solid rgba(255,255,255,0.1)'}
                    display="flex" alignItems="center" justifyContent="center"
                    fontSize="11px" fontWeight="bold"
                    color={assigned ? 'red.300' : 'var(--dash-text-muted)'}
                  >
                    {initials}
                  </Box>
                  <Box>
                    <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)">{user.callsign}</Text>
                    <Text fontSize="10px" color="var(--dash-text-muted)">
                      {assigned ? user.email : 'Not assigned'}
                    </Text>
                  </Box>
                </Flex>
              );
            })}
          </Flex>
        )}
      </Box>

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
