import { useState } from 'react';
import {
  Box, Flex, Text, Button, Input, Select, Textarea,
  SimpleGrid, IconButton, Stack,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

const SEVERITY_COLORS = {
  Critical: { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   text: '#fca5a5', dot: '#ef4444' },
  High:     { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  text: '#fcd34d', dot: '#f59e0b' },
  Medium:   { bg: 'rgba(234,179,8,0.15)',   border: 'rgba(234,179,8,0.4)',   text: '#fef08a', dot: '#eab308' },
  Low:      { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)',  text: '#93c5fd', dot: '#3b82f6' },
  Info:     { bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.35)',text: '#9ca3af', dot: '#6b7280' },
};
const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];

const SeverityBadge = ({ severity }) => {
  const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.Info;
  return (
    <Flex
      px="8px" py="2px" borderRadius="5px" fontSize="10px" fontWeight="bold"
      letterSpacing="wider" flexShrink={0} align="center" gap="5px"
      bg={c.bg} border={`1px solid ${c.border}`} color={c.text}
    >
      <Box w="5px" h="5px" borderRadius="full" bg={c.dot} flexShrink={0} />
      {severity.toUpperCase()}
    </Flex>
  );
};

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1}>
    {children}
  </Text>
);

const inputSx = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  px: 4,
  h: '40px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

const selectSx = {
  bg: 'rgba(255,255,255,0.04)',
  borderColor: 'rgba(255,255,255,0.08)',
  borderRadius: '10px',
  h: '40px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  cursor: 'pointer',
  focusBorderColor: 'rgba(255,80,95,0.7)',
  _hover: { borderColor: 'rgba(255,80,95,0.4)' },
  sx: { option: { bg: '#1a1a1f', color: 'white' } },
};

const textareaSx = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  px: 4,
  py: 3,
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
  resize: 'vertical',
  minH: '80px',
};

const EMPTY = { title: '', severity: 'High', description: '', observation: '', proofOfConcept: '', remediation: '' };

const FindingsView = () => {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const { getBySlug, updateEngagement } = useEngagements();
  const eng = getBySlug(slug);

  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  if (!eng) return null;

  const findings = [...(eng.findings || [])].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

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

  const counts = findings.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc; }, {});

  return (
    <Box pb={8}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6}>
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="var(--dash-text-primary)" mb={2}>Findings</Text>
          <Flex gap={2} flexWrap="wrap">
            {SEVERITY_ORDER.filter(s => counts[s]).map(s => {
              const c = SEVERITY_COLORS[s];
              return (
                <Flex key={s} px="8px" py="2px" borderRadius="5px" fontSize="10px" fontWeight="bold"
                  bg={c.bg} border={`1px solid ${c.border}`} color={c.text} align="center" gap="4px">
                  <Box w="4px" h="4px" borderRadius="full" bg={c.dot} />
                  {counts[s]} {s}
                </Flex>
              );
            })}
            {findings.length === 0 && (
              <Text fontSize="12px" color="var(--dash-text-muted)">No findings logged yet.</Text>
            )}
          </Flex>
        </Box>
        <Button
          size="sm" leftIcon={<AddIcon boxSize={2.5} />}
          bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.25)"
          color="rgba(255,130,130,0.9)" fontSize="12px" borderRadius="8px"
          _hover={{ bg: 'rgba(255,80,95,0.18)' }}
          onClick={() => setShowForm(v => !v)}
        >
          New Finding
        </Button>
      </Flex>

      {/* New Finding Form */}
      <AnimatePresence>
        {showForm && (
          <MotionBox
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            overflow="hidden" mb={6}
          >
            <Box bg="var(--dash-card-bg)" border="1px solid rgba(255,80,95,0.2)" borderRadius="14px" p={5}>
              <Text fontSize="11px" fontWeight="bold" color="red.400" mb={4}
                textTransform="uppercase" letterSpacing="wider">
                New Finding
              </Text>

              <Stack spacing={4} mb={4}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Box gridColumn={{ base: '1', md: '1 / 3' }}>
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={e => set('title', e.target.value)}
                      placeholder="e.g. Password Spraying — Valid Credentials Found" {...inputSx} />
                  </Box>
                  <Box>
                    <Label>Severity *</Label>
                    <Select value={form.severity} onChange={e => set('severity', e.target.value)} {...selectSx}>
                      {SEVERITY_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Box>
                </SimpleGrid>

                <Box>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Short one-line summary" {...inputSx} />
                </Box>

                <Box>
                  <Label>Observation</Label>
                  <Textarea value={form.observation} onChange={e => set('observation', e.target.value)}
                    placeholder="What was observed during the engagement..." {...textareaSx} />
                </Box>

                <Box>
                  <Label>Proof of Concept</Label>
                  <Textarea value={form.proofOfConcept} onChange={e => set('proofOfConcept', e.target.value)}
                    placeholder="Steps to reproduce, commands, code snippets..."
                    {...textareaSx} fontFamily="mono" fontSize="xs" minH="140px" />
                </Box>

                <Box>
                  <Label>Remediation</Label>
                  <Textarea value={form.remediation} onChange={e => set('remediation', e.target.value)}
                    placeholder="Recommended fix or mitigation..." {...textareaSx} />
                </Box>
              </Stack>

              <Flex gap={2}>
                <Button size="sm" variant="ghost" color="var(--dash-text-muted)"
                  _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                  onClick={() => { setShowForm(false); setForm(EMPTY); }}>
                  Cancel
                </Button>
                <Button size="sm" leftIcon={<AddIcon boxSize={3} />}
                  bgGradient="linear(to-r, red.700, red.500)" color="white"
                  _hover={{ bgGradient: 'linear(to-r, red.600, red.400)' }}
                  isLoading={saving} loadingText="Saving..."
                  onClick={addFinding}>
                  Add Finding
                </Button>
              </Flex>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Findings List */}
      {findings.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={16} gap={3}>
          <Text fontSize="3xl">🔍</Text>
          <Text fontWeight="semibold" color="var(--dash-text-secondary)">No findings yet</Text>
          <Text fontSize="sm" color="var(--dash-text-muted)">Click "New Finding" to log your first finding.</Text>
        </Flex>
      ) : (
        <AnimatePresence initial={false}>
          {findings.map(f => {
            const fid = f._id || f.id;
            const c   = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.Info;
            return (
              <motion.div
                key={fid}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, x: 40, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{ marginBottom: '12px' }}
              >
              <Flex
                bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="12px" px={5} py={4}
                align="center" gap={4}
                cursor="pointer"
                onClick={() => navigate(`/dashboard/${slug}/reporting/findings/${fid}`)}
                _hover={{ border: `1px solid ${c.border}`, bg: 'rgba(255,255,255,0.02)' }}
                transition="all 0.18s"
                role="group"
              >
                <SeverityBadge severity={f.severity} />
                <Box flex="1" minW={0}>
                  <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)" noOfLines={1}>
                    {f.title}
                  </Text>
                  {f.description && (
                    <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1} mt="2px">
                      {f.description}
                    </Text>
                  )}
                </Box>
                <Flex align="center" gap={2} flexShrink={0}>
                  {f.proofOfConcept && (
                    <Flex px="6px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                      bg="rgba(159,122,234,0.1)" border="1px solid rgba(159,122,234,0.2)"
                      color="#b794f4" letterSpacing="wider">
                      PoC
                    </Flex>
                  )}
                  {f.createdAt && (
                    <Text fontSize="10px" color="var(--dash-text-muted)">
                      {new Date(f.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                  )}
                  <IconButton
                    icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
                    color="var(--dash-text-muted)"
                    _hover={{ color: 'red.400', bg: 'rgba(255,55,55,0.08)' }}
                    onClick={e => deleteFinding(fid, e)}
                    aria-label="Delete finding"
                  />
                  <ChevronRightIcon boxSize={4} color="var(--dash-text-muted)" />
                </Flex>
              </Flex>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </Box>
  );
};

export default FindingsView;
