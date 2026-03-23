import { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, Button, Progress,
  Divider, Stack, Input, Select, SimpleGrid,
  Alert, AlertIcon, IconButton,
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

const STATUS_COLORS = {
  'PREPARING':   { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.35)',  text: '#a5b4fc' },
  'IN PROGRESS': { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)',  text: '#fcd34d' },
  'REPORTING':   { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.35)',  text: '#93c5fd' },
  'COMPLETED':   { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.35)',  text: '#6ee7b7' },
  'PAUSED':      { bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.35)', text: '#9ca3af' },
};

const STATUS_ORDER = ['PREPARING', 'IN PROGRESS', 'REPORTING', 'COMPLETED', 'PAUSED'];

const TYPE_COLORS = {
  'External':            '#fc8181',
  'Internal':            '#4fd1c5',
  'External + Internal': '#f6ad55',
  'Full Scope':          '#fc8181',
  'Phishing':            '#b794f4',
  'Web Application':     '#76e4f7',
};

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

const selectStyles = {
  ...inputStyles,
  cursor: 'pointer',
  sx: { option: { bg: '#1a1a1f', color: 'white' }, '& option': { background: '#1a1a1f !important' } },
};

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" fontWeight="semibold" mb={1}>
    {children}
  </Text>
);

const SEVERITY_COLORS = {
  Critical: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#fca5a5' },
  High:     { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fcd34d' },
  Medium:   { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',  text: '#fef08a' },
  Low:      { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd' },
  Info:     { bg: 'rgba(107,114,128,0.15)',border: 'rgba(107,114,128,0.35)',text: '#9ca3af' },
};

const EngagementDetailView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getBySlug, updateEngagement, deleteEngagement, allUsers, getUserById } = useEngagements();

  const eng = getBySlug(slug);

  // All hooks must be declared unconditionally before any early return
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() =>
    eng ? {
      status:    eng.status,
      stage:     eng.stage,
      progress:  eng.progress,
      operators: eng.operators || [],
      startDate: eng.startDate,
      endDate:   eng.endDate,
      type:      eng.type,
      notes:     eng.notes || '',
    } : null
  );
  const [showFinding, setShowFinding] = useState(false);
  const [newF, setNewF] = useState({ title: '', severity: 'High', description: '' });

  // Sync form when engagement loads from API (lazy init may produce null if eng not ready yet)
  useEffect(() => {
    if (eng && !form) {
      setForm({
        status:    eng.status,
        stage:     eng.stage,
        progress:  eng.progress,
        operators: eng.operators || [],
        startDate: eng.startDate,
        endDate:   eng.endDate,
        type:      eng.type,
        notes:     eng.notes || '',
      });
    }
  }, [eng, form]);

  if (!eng || !form) {
    return (
      <Flex direction="column" align="center" justify="center" h="60vh" gap={3}>
        <Text fontSize="4xl">⏳</Text>
        <Text color="var(--dash-text-muted)" fontSize="sm">Loading engagement...</Text>
      </Flex>
    );
  }

  const sc = STATUS_COLORS[eng.status] || STATUS_COLORS['PREPARING'];
  const tc = TYPE_COLORS[eng.type] || '#9ca3af';

  const toggleOp = (name) =>
    setForm((p) => ({
      ...p,
      operators: p.operators.includes(name)
        ? p.operators.filter((o) => o !== name)
        : [...p.operators, name],
    }));

  const save = () => {
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      return setError('End date must be after start date.');
    }
    setError('');
    updateEngagement(eng.id, form);
    setEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${eng.name}"? This cannot be undone.`)) {
      deleteEngagement(eng.id);
      navigate('/dashboard/engagements');
    }
  };

  const addFinding = () => {
    if (!newF.title.trim()) return;
    updateEngagement(eng.id, {
      findings: [...(eng.findings || []), { id: Date.now().toString(), ...newF, createdAt: new Date().toISOString() }],
    });
    setNewF({ title: '', severity: 'High', description: '' });
    setShowFinding(false);
  };

  const removeFinding = (id) =>
    updateEngagement(eng.id, { findings: (eng.findings || []).filter((f) => f.id !== id || f._id !== id) });

  return (
    <Box pb={8}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6}>
        <Box>
          <Flex align="center" gap={3} mb={1} flexWrap="wrap">
            <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">{eng.name}</Heading>
            <Flex
              px={3} py="3px" borderRadius="7px" fontSize="10px" fontWeight="bold" letterSpacing="wider"
              bg={sc.bg} border={`1px solid ${sc.border}`} color={sc.text} flexShrink={0}
            >
              {eng.status}
            </Flex>
            <Flex
              px="7px" py="2px" borderRadius="5px" fontSize="10px" fontWeight="semibold"
              bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.08)"
              color={tc} align="center" gap={1}
            >
              <Box w="5px" h="5px" borderRadius="full" bg={tc} flexShrink={0} />
              {eng.type}
            </Flex>
          </Flex>
          <Text fontSize="13px" color="var(--dash-text-secondary)">{eng.company}</Text>
        </Box>
        <Flex gap={2}>
          <Button
            size="sm" leftIcon={<EditIcon boxSize={3} />}
            bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
            color="var(--dash-text-secondary)" fontSize="12px" borderRadius="8px"
            _hover={{ color: 'white', bg: 'rgba(255,255,255,0.09)' }}
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancel' : 'Edit'}
          </Button>
          <IconButton
            icon={<DeleteIcon />} size="sm" variant="ghost"
            color="var(--dash-text-muted)" borderRadius="8px"
            _hover={{ color: 'red.400', bg: 'rgba(255,55,55,0.08)' }}
            onClick={handleDelete} aria-label="Delete engagement"
          />
        </Flex>
      </Flex>

      {/* Inline editor */}
      <AnimatePresence>
        {editing && (
          <MotionBox
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            overflow="hidden" mb={6}
          >
            <Box
              bg="var(--dash-card-bg)" border="1px solid rgba(255,80,95,0.2)"
              borderRadius="14px" p={5}
            >
              <Text fontSize="11px" fontWeight="bold" color="red.400" mb={4} textTransform="uppercase" letterSpacing="wider">
                Edit Engagement
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <Box>
                  <Label>Status</Label>
                  <Select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} {...selectStyles}>
                    {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </Box>
                <Box>
                  <Label>Progress (%)</Label>
                  <Input
                    type="number" min={0} max={100} value={form.progress}
                    onChange={(e) => setForm((p) => ({ ...p, progress: Math.min(100, Math.max(0, +e.target.value)) }))}
                    {...inputStyles}
                  />
                </Box>
                <Box>
                  <Label>Current Stage</Label>
                  <Input
                    value={form.stage}
                    onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value }))}
                    placeholder="e.g. Lateral Movement"
                    {...inputStyles}
                  />
                </Box>
                <Box>
                  <Label>Type</Label>
                  <Select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} {...selectStyles}>
                    {['External','Internal','External + Internal','Full Scope','Phishing','Web Application'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Label>Start Date</Label>
                  <Input
                    type="date" value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                    {...inputStyles}
                    sx={{ colorScheme: 'dark', '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.5)' } }}
                  />
                </Box>
                <Box>
                  <Label>End Date</Label>
                  <Input
                    type="date" value={form.endDate}
                    onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                    {...inputStyles}
                    sx={{ colorScheme: 'dark', '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.5)' } }}
                  />
                </Box>
              </SimpleGrid>
              <Box mb={4}>
                <Label>Operators</Label>
                <Flex gap={2} flexWrap="wrap">
                  {allUsers.length === 0 && (
                    <Text fontSize="12px" color="var(--dash-text-muted)">No users in database.</Text>
                  )}
                  {allUsers.map((user) => {
                    const uid    = String(user.id);
                    const active = form.operators.map(String).includes(uid);
                    return (
                      <Box
                        key={uid} as="button" onClick={() => toggleOp(uid)}
                        px={3} py="5px" borderRadius="8px" fontSize="12px"
                        border={active ? '1px solid rgba(255,80,95,0.55)' : '1px solid rgba(255,255,255,0.1)'}
                        bg={active ? 'rgba(255,80,95,0.1)' : 'rgba(255,255,255,0.04)'}
                        color={active ? 'white' : 'var(--dash-text-muted)'}
                        cursor="pointer" transition="all 0.18s"
                        _hover={{ borderColor: 'rgba(255,80,95,0.4)', color: 'white' }}
                      >
                        {active && <Box as="span" mr={1} color="red.400">✓</Box>}
                        {user.callsign}
                      </Box>
                    );
                  })}
                </Flex>
              </Box>
              {error && (
                <Alert status="warning" borderRadius="8px" fontSize="sm" mb={3}
                  bg="rgba(251,191,36,0.1)" border="1px solid rgba(251,191,36,0.2)">
                  <AlertIcon />{error}
                </Alert>
              )}
              <Flex gap={2}>
                <Button size="sm" variant="ghost" color="var(--dash-text-muted)"
                  _hover={{ bg: 'rgba(255,255,255,0.05)' }} onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" leftIcon={<CheckIcon boxSize={3} />}
                  bgGradient="linear(to-r, red.700, red.500)" color="white"
                  _hover={{ bgGradient: 'linear(to-r, red.600, red.400)' }}
                  onClick={save}>
                  Save Changes
                </Button>
              </Flex>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        {[
          { label: 'Progress', value: `${eng.progress}%`, color: 'red.400' },
          { label: 'Findings', value: eng.findings?.length || 0, color: '#fcd34d' },
          { label: 'Operators', value: eng.operators?.length || 0, color: '#4fd1c5' },
          { label: 'Stage', value: eng.stage || 'Preparing', color: '#a5b4fc' },
        ].map((stat) => (
          <Box
            key={stat.label}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="12px" p={4}
          >
            <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" mb={1}>
              {stat.label}
            </Text>
            <Text fontSize="xl" fontWeight="bold" color={stat.color}>{stat.value}</Text>
          </Box>
        ))}
      </SimpleGrid>

      {/* Progress bar */}
      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="14px" p={5} mb={6}>
        <Flex justify="space-between" mb={3}>
          <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">Engagement Progress</Text>
          <Text fontSize="13px" fontWeight="bold" color="red.400">{eng.progress}%</Text>
        </Flex>
        <Progress
          value={eng.progress} borderRadius="full" h="8px"
          bg="var(--dash-progress-track)"
          sx={{ '& > div': { background: 'linear-gradient(to right, rgba(185,28,28,0.9), rgba(255,80,95,1))' } }}
        />
        <Flex justify="space-between" mt={2}>
          {['Preparing', 'Recon', 'Access', 'Post-Exploit', 'Reporting', 'Done'].map((label, i) => (
            <Text key={label} fontSize="9px" textTransform="uppercase" letterSpacing="wider"
              color={eng.progress >= i * 20 ? 'red.400' : 'var(--dash-text-muted)'}>
              {label}
            </Text>
          ))}
        </Flex>
      </Box>

      {/* Info grid */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        {[
          { label: 'Company',    value: eng.company },
          { label: 'Start Date', value: eng.startDate ? new Date(eng.startDate + 'T00:00:00').toLocaleDateString('en-GB') : '—' },
          { label: 'End Date',   value: eng.endDate   ? new Date(eng.endDate   + 'T00:00:00').toLocaleDateString('en-GB') : '—' },
          { label: 'Operators',  value: eng.operators?.length ? eng.operators.map(id => getUserById(id)?.callsign || id).join(', ') : 'Unassigned' },
          { label: 'Created',    value: new Date(eng.createdAt).toLocaleDateString('en-GB') },
          { label: 'ID',         value: eng.id?.slice(-8).toUpperCase() },
        ].map((item) => (
          <Box key={item.label} bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="10px" p={4}>
            <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" mb={1}>{item.label}</Text>
            <Text fontSize="sm" color="var(--dash-text-primary)">{item.value}</Text>
          </Box>
        ))}
      </SimpleGrid>

      {/* Findings summary */}
      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="14px" p={5}>
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)">
            Recent Findings
            {eng.findings?.length > 0 && (
              <Text as="span" ml={2} fontSize="11px" color="var(--dash-text-muted)" fontWeight="normal">
                ({eng.findings.length} total)
              </Text>
            )}
          </Text>
          <Button
            size="xs" leftIcon={<AddIcon boxSize={2.5} />}
            bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.25)"
            color="rgba(255,130,130,0.9)" fontSize="11px" borderRadius="7px"
            _hover={{ bg: 'rgba(255,80,95,0.18)' }}
            onClick={() => setShowFinding(!showFinding)}
          >
            Add Finding
          </Button>
        </Flex>

        <AnimatePresence>
          {showFinding && (
            <MotionBox
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} overflow="hidden" mb={4}
            >
              <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)" borderRadius="10px" p={4}>
                <SimpleGrid columns={2} spacing={3} mb={3}>
                  <Box gridColumn="1 / -1">
                    <Label>Title</Label>
                    <Input value={newF.title} onChange={(e) => setNewF((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Password spraying — valid credentials" {...inputStyles} />
                  </Box>
                  <Box>
                    <Label>Severity</Label>
                    <Select value={newF.severity} onChange={(e) => setNewF((p) => ({ ...p, severity: e.target.value }))} {...selectStyles}>
                      {Object.keys(SEVERITY_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Box>
                </SimpleGrid>
                <Flex gap={2}>
                  <Button size="sm" variant="ghost" color="var(--dash-text-muted)"
                    _hover={{ bg: 'rgba(255,255,255,0.05)' }} onClick={() => setShowFinding(false)}>Cancel</Button>
                  <Button size="sm" leftIcon={<AddIcon boxSize={3} />}
                    bgGradient="linear(to-r, red.700, red.500)" color="white"
                    _hover={{ bgGradient: 'linear(to-r, red.600, red.400)' }}
                    onClick={addFinding}>Add</Button>
                </Flex>
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>

        {!eng.findings?.length ? (
          <Text fontSize="sm" color="var(--dash-text-muted)" py={4} textAlign="center">
            No findings yet. Use the sidebar → Reporting → Findings for full management.
          </Text>
        ) : (
          <Stack spacing={2}>
            {(eng.findings || []).slice(0, 5).map((f) => {
              const fc = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS['Info'];
              return (
                <Flex key={f._id || f.id} align="center" gap={3}
                  bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)"
                  borderRadius="8px" px={3} py={2}>
                  <Flex px="6px" py="1px" borderRadius="4px" fontSize="10px" fontWeight="bold"
                    letterSpacing="wider" flexShrink={0}
                    bg={fc.bg} border={`1px solid ${fc.border}`} color={fc.text}>
                    {f.severity}
                  </Flex>
                  <Text fontSize="12px" color="var(--dash-text-primary)" flex="1" noOfLines={1}>{f.title}</Text>
                  <IconButton
                    icon={<DeleteIcon />} size="xs" variant="ghost"
                    color="var(--dash-text-muted)" _hover={{ color: 'red.400' }}
                    onClick={() => removeFinding(f._id || f.id)} aria-label="Remove"
                  />
                </Flex>
              );
            })}
            {eng.findings.length > 5 && (
              <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" pt={1}>
                +{eng.findings.length - 5} more — view all in Reporting → Findings
              </Text>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default EngagementDetailView;
