import { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, Button, Progress,
  Input, Select, SimpleGrid, Alert, AlertIcon, IconButton,
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, DeleteIcon, AddIcon, TriangleUpIcon, WarningIcon, StarIcon, TimeIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  'PREPARING':   { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.35)',  text: '#a5b4fc' },
  'IN PROGRESS': { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)',  text: '#fcd34d' },
  'REPORTING':   { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.35)',  text: '#93c5fd' },
  'COMPLETED':   { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.35)',  text: '#6ee7b7' },
  'PAUSED':      { bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.35)', text: '#9ca3af' },
};
const STATUS_ORDER = ['PREPARING', 'IN PROGRESS', 'REPORTING', 'COMPLETED', 'PAUSED'];
const PHASES = [
  { label: 'Preparing',    progress: 0   },
  { label: 'Recon',        progress: 20  },
  { label: 'Access',       progress: 40  },
  { label: 'Post-Exploit', progress: 60  },
  { label: 'Reporting',    progress: 80  },
  { label: 'Done',         progress: 100 },
];
const TYPE_COLORS = {
  'External':            '#fc8181',
  'Internal':            '#4fd1c5',
  'External + Internal': '#f6ad55',
  'Full Scope':          '#fc8181',
  'Phishing':            '#b794f4',
  'Web Application':     '#76e4f7',
};
const SEVERITY_META = {
  Critical: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#fca5a5', bar: '#ef4444' },
  High:     { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fcd34d', bar: '#f59e0b' },
  Medium:   { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',  text: '#fef08a', bar: '#eab308' },
  Low:      { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd', bar: '#3b82f6' },
  Info:     { bg: 'rgba(107,114,128,0.15)',border: 'rgba(107,114,128,0.35)',text: '#9ca3af', bar: '#6b7280' },
};
const SORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];

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
  bg: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px',
  h: '40px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  cursor: 'pointer',
  focusBorderColor: 'rgba(255,80,95,0.7)',
  _hover: { borderColor: 'rgba(255,80,95,0.4)' },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

// ── Reusable primitives ────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1}>{children}</Text>
);

const SCard = ({ accent, title, subtitle, action, noHover, children, ...rest }) => (
  <Box
    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="14px" p={5} pos="relative" overflow="hidden"
    transition="transform 0.22s, box-shadow 0.22s"
    {...(!noHover && { _hover: { transform: 'translateY(-3px)', boxShadow: '0 8px 28px rgba(0,0,0,0.4)' } })}
    {...rest}
  >
    {accent && (
      <Box pos="absolute" top="0" left="0" right="0" h="1.5px"
        style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
    )}
    {(title || action) && (
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">{title}</Text>
          {subtitle && <Text fontSize="10px" color="var(--dash-text-muted)" mt="1px">{subtitle}</Text>}
        </Box>
        {action}
      </Flex>
    )}
    {children}
  </Box>
);

const StatCard = ({ label, value, sub, accent, icon }) => (
  <Box
    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="12px" p={4} pos="relative" overflow="hidden"
    transition="transform 0.22s, box-shadow 0.22s"
    _hover={{ transform: 'translateY(-4px)', boxShadow: '0 8px 28px rgba(0,0,0,0.4)' }}
  >
    <Box pos="absolute" top="0" left="0" right="0" h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
    <Flex justify="space-between" align="flex-start">
      <Box flex="1" minW="0">
        <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
          letterSpacing="wider" mb={1}>{label}</Text>
        <Text fontSize="22px" fontWeight="bold" lineHeight="1" color={accent}>{value}</Text>
        {sub && (
          <Text fontSize="10px" color="var(--dash-text-muted)" mt={1.5} noOfLines={1}>{sub}</Text>
        )}
      </Box>
      <Box p={2} borderRadius="8px" flexShrink={0} ml={2} w="32px" h="32px"
        bg={`${accent}18`} border={`1px solid ${accent}35`}
        display="flex" alignItems="center" justifyContent="center"
        color={accent}>
        {icon}
      </Box>
    </Flex>
  </Box>
);

const SkillBar = ({ label, pct }) => {
  const color = pct >= 80 ? '#6ee7b7' : pct >= 60 ? '#93c5fd' : pct >= 40 ? '#fcd34d' : '#fc8181';
  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="11px" color="var(--dash-text-secondary)">{label}</Text>
        <Text fontSize="10px" fontWeight="bold" color={color}>{pct}%</Text>
      </Flex>
      <Box h="4px" bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 999 }}
        />
      </Box>
    </Box>
  );
};

const ResourceBar = ({ name, used, total, color }) => {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const barColor = pct >= 90 ? '#fca5a5' : pct >= 70 ? '#fcd34d' : (color || '#a5b4fc');
  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="11px" color="var(--dash-text-secondary)">{name}</Text>
        <Flex align="center" gap={1.5}>
          <Text fontSize="10px" color="var(--dash-text-muted)">{used}/{total}</Text>
          <Text fontSize="10px" fontWeight="bold" color={barColor}>{Math.round(pct)}%</Text>
        </Flex>
      </Flex>
      <Box h="4px" bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ height: '100%', background: barColor, borderRadius: 999 }}
        />
      </Box>
    </Box>
  );
};

const OpAvatar = ({ callsign, skills = [] }) => (
  <Flex direction="column" align="center" gap={1.5} minW="60px" pos="relative" role="group">
    {/* Skill hover card */}
    {skills.length > 0 && (
      <Box
        pos="absolute" bottom="calc(100% + 8px)" left="50%" transform="translateX(-50%)"
        zIndex={1500} w="max-content" maxW="180px"
        bg="rgba(15,15,22,0.97)" border="1px solid rgba(79,209,197,0.25)"
        borderRadius="10px" p={3} pointerEvents="none"
        opacity={0} _groupHover={{ opacity: 1 }}
        transition="opacity 0.18s ease"
        boxShadow="0 8px 24px rgba(0,0,0,0.5)"
      >
        <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
          letterSpacing="wider" mb={2} fontWeight="semibold">Skills</Text>
        <Flex gap={1.5} flexWrap="wrap">
          {skills.map(s => (
            <Box key={s} px="6px" py="2px" borderRadius="4px" fontSize="10px"
              bg="rgba(79,209,197,0.1)" border="1px solid rgba(79,209,197,0.22)" color="#4fd1c5">
              {s}
            </Box>
          ))}
        </Flex>
        {/* Arrow */}
        <Box pos="absolute" bottom="-5px" left="50%" transform="translateX(-50%)"
          w="8px" h="8px" bg="rgba(15,15,22,0.97)"
          border="1px solid rgba(79,209,197,0.25)" borderTop="none" borderLeft="none"
          style={{ transform: 'translateX(-50%) rotate(45deg)' }} />
      </Box>
    )}
    <Flex
      w="44px" h="44px" borderRadius="12px" align="center" justify="center"
      fontSize="13px" fontWeight="bold" fontFamily="mono" letterSpacing="wider"
      bg="rgba(79,209,197,0.1)" border="1px solid rgba(79,209,197,0.3)" color="#4fd1c5"
      transition="all 0.18s"
      _groupHover={{ transform: 'translateY(-3px)', boxShadow: '0 6px 16px rgba(79,209,197,0.15)' }}
    >
      {callsign.slice(0, 2).toUpperCase()}
    </Flex>
    <Text fontSize="9px" color="var(--dash-text-secondary)" noOfLines={1} maxW="60px" textAlign="center">
      {callsign}
    </Text>
    <Box px="5px" py="1px" borderRadius="4px" fontSize="8px" fontWeight="bold"
      letterSpacing="wider" bg="rgba(79,209,197,0.08)" border="1px solid rgba(79,209,197,0.18)"
      color="rgba(79,209,197,0.7)">
      ACTIVE
    </Box>
  </Flex>
);

const EmptySlate = ({ main, sub }) => (
  <Flex align="center" justify="center" direction="column" py={6} gap={1}
    bg="rgba(255,255,255,0.02)" border="1px dashed rgba(255,255,255,0.07)" borderRadius="10px">
    <Text fontSize="13px" color="var(--dash-text-muted)">{main}</Text>
    {sub && <Text fontSize="11px" color="var(--dash-text-muted)" opacity={0.6}>{sub}</Text>}
  </Flex>
);

// ── Main component ─────────────────────────────────────────────────────────────
const EngagementDetailView = () => {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { getBySlug, updateEngagement, deleteEngagement, allUsers, getUserById } = useEngagements();

  const eng = getBySlug(slug);

  const [editing,     setEditing]     = useState(false);
  const [error,       setError]       = useState('');
  const [showFinding, setShowFinding] = useState(false);
  const [newF,        setNewF]        = useState({ title: '', severity: 'High', description: '' });

  const resolvePhase = (e) => {
    if (PHASES.find(p => p.label === e.stage)) return e.stage;
    return [...PHASES].sort((a, b) =>
      Math.abs(a.progress - e.progress) - Math.abs(b.progress - e.progress)
    )[0]?.label || 'Preparing';
  };

  const [form, setForm] = useState(() =>
    eng ? {
      status: eng.status, stage: resolvePhase(eng), progress: eng.progress,
      operators: eng.operators || [], startDate: eng.startDate, endDate: eng.endDate,
      type: eng.type, notes: eng.notes || '',
    } : null
  );

  useEffect(() => {
    if (eng && !form) {
      setForm({
        status: eng.status, stage: resolvePhase(eng), progress: eng.progress,
        operators: eng.operators || [], startDate: eng.startDate, endDate: eng.endDate,
        type: eng.type, notes: eng.notes || '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eng]);

  if (!eng || !form) {
    return (
      <Flex direction="column" align="center" justify="center" h="60vh" gap={3}>
        <Text fontSize="4xl">⏳</Text>
        <Text color="var(--dash-text-muted)" fontSize="sm">Loading engagement…</Text>
      </Flex>
    );
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const sc           = STATUS_COLORS[eng.status] || STATUS_COLORS['PREPARING'];
  const tc           = TYPE_COLORS[eng.type]     || '#9ca3af';
  const findings     = eng.findings       || [];
  const skills       = (eng.teamSkills    || []).sort((a, b) => b.pct - a.pct);
  const resources    = (eng.resources     || []).filter(r => r.total > 0);
  const operators    = (eng.operators     || []).map(id => getUserById(id)).filter(Boolean);
  const opSkillsMap  = eng.operatorSkills || {};

  const findingCounts = SORDER.reduce((acc, s) => {
    acc[s] = findings.filter(f => f.severity === s).length;
    return acc;
  }, {});
  const topSev = SORDER.find(s => findingCounts[s] > 0);

  const daysRemaining = eng.endDate
    ? Math.ceil((new Date(eng.endDate + 'T00:00:00') - new Date()) / 86400000)
    : null;
  const daysColor =
    daysRemaining === null ? '#9ca3af'
    : daysRemaining < 0   ? '#fca5a5'
    : daysRemaining <= 3  ? '#fca5a5'
    : daysRemaining <= 7  ? '#fcd34d'
    : '#6ee7b7';
  const daysLabel =
    daysRemaining === null ? '—'
    : daysRemaining < 0   ? 'Overdue'
    : String(daysRemaining);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const toggleOp = (uid) =>
    setForm(p => ({
      ...p,
      operators: p.operators.includes(uid)
        ? p.operators.filter(o => o !== uid)
        : [...p.operators, uid],
    }));

  const save = () => {
    if (form.endDate && form.startDate && form.endDate < form.startDate)
      return setError('End date must be after start date.');
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
      findings: [...findings, { id: Date.now().toString(), ...newF, createdAt: new Date().toISOString() }],
    });
    setNewF({ title: '', severity: 'High', description: '' });
    setShowFinding(false);
  };

  const removeFinding = (id) =>
    updateEngagement(eng.id, { findings: findings.filter(f => (f._id || f.id) !== id) });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Box pb={10}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6}>
        <Box>
          <Flex align="center" gap={3} mb={1} flexWrap="wrap">
            <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
              {eng.name}
            </Heading>
            <Flex px={3} py="3px" borderRadius="7px" fontSize="10px" fontWeight="bold"
              letterSpacing="wider" bg={sc.bg} border={`1px solid ${sc.border}`} color={sc.text} flexShrink={0}>
              {eng.status}
            </Flex>
            <Flex px="7px" py="2px" borderRadius="5px" fontSize="10px" fontWeight="semibold"
              bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.08)"
              color={tc} align="center" gap={1}>
              <Box w="5px" h="5px" borderRadius="full" bg={tc} flexShrink={0} />
              {eng.type}
            </Flex>
          </Flex>
          <Text fontSize="13px" color="var(--dash-text-secondary)">{eng.company}</Text>
        </Box>
        <Flex gap={2}>
          <Button size="sm" leftIcon={<EditIcon boxSize={3} />}
            bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
            color="var(--dash-text-secondary)" fontSize="12px" borderRadius="8px"
            _hover={{ color: 'white', bg: 'rgba(255,255,255,0.09)' }}
            onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
          <IconButton icon={<DeleteIcon />} size="sm" variant="ghost"
            color="var(--dash-text-muted)" borderRadius="8px"
            _hover={{ color: 'red.400', bg: 'rgba(255,55,55,0.08)' }}
            onClick={handleDelete} aria-label="Delete engagement" />
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
            <Box bg="var(--dash-card-bg)" border="1px solid rgba(255,80,95,0.2)"
              borderRadius="14px" p={5}>
              <Text fontSize="11px" fontWeight="bold" color="red.400" mb={4}
                textTransform="uppercase" letterSpacing="wider">Edit Engagement</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <Box>
                  <Label>Status</Label>
                  <Select value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    {...selectStyles}>
                    {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </Box>
                <Box>
                  <Label>Current Phase</Label>
                  <Select value={form.stage}
                    onChange={e => {
                      const ph = PHASES.find(p => p.label === e.target.value);
                      setForm(p => ({ ...p, stage: e.target.value, progress: ph ? ph.progress : p.progress }));
                    }}
                    {...selectStyles}>
                    {PHASES.map(p => (
                      <option key={p.label} value={p.label}>{p.label} — {p.progress}%</option>
                    ))}
                  </Select>
                  <Text fontSize="10px" color="var(--dash-text-muted)" mt={1}>
                    Progress auto-fills to {PHASES.find(p => p.label === form.stage)?.progress ?? form.progress}%
                  </Text>
                </Box>
                <Box>
                  <Label>Type</Label>
                  <Select value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    {...selectStyles}>
                    {['External','Internal','External + Internal','Full Scope','Phishing','Web Application']
                      .map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </Box>
                <Box>
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate}
                    onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    {...inputStyles}
                    sx={{ colorScheme: 'dark', '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.5)' } }} />
                </Box>
                <Box>
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate}
                    onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                    {...inputStyles}
                    sx={{ colorScheme: 'dark', '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.5)' } }} />
                </Box>
              </SimpleGrid>
              <Box mb={4}>
                <Label>Operators</Label>
                <Flex gap={2} flexWrap="wrap">
                  {allUsers.length === 0
                    ? <Text fontSize="12px" color="var(--dash-text-muted)">No users in database.</Text>
                    : allUsers.map(user => {
                        const uid    = String(user.id);
                        const active = form.operators.map(String).includes(uid);
                        return (
                          <Box key={uid} as="button" onClick={() => toggleOp(uid)}
                            px={3} py="5px" borderRadius="8px" fontSize="12px"
                            border={active ? '1px solid rgba(255,80,95,0.55)' : '1px solid rgba(255,255,255,0.1)'}
                            bg={active ? 'rgba(255,80,95,0.1)' : 'rgba(255,255,255,0.04)'}
                            color={active ? 'white' : 'var(--dash-text-muted)'}
                            cursor="pointer" transition="all 0.18s"
                            _hover={{ borderColor: 'rgba(255,80,95,0.4)', color: 'white' }}>
                            {active && <Box as="span" mr={1} color="red.400">✓</Box>}
                            {user.callsign}
                          </Box>
                        );
                      })
                  }
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
                  _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                  onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" leftIcon={<CheckIcon boxSize={3} />}
                  bgGradient="linear(to-r, red.700, red.500)" color="white"
                  _hover={{ bgGradient: 'linear(to-r, red.600, red.400)' }}
                  onClick={save}>Save Changes</Button>
              </Flex>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Stat cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        <StatCard
          label="Progress"
          value={`${eng.progress}%`}
          sub={eng.stage || 'Preparing'}
          accent="#fc8181"
          icon={<TriangleUpIcon boxSize={3.5} />}
        />
        <StatCard
          label="Findings"
          value={findings.length}
          sub={topSev ? `Highest: ${topSev}` : 'None recorded'}
          accent="#fcd34d"
          icon={<WarningIcon boxSize={3.5} />}
        />
        <StatCard
          label="Operators"
          value={eng.operators?.length || 0}
          sub={operators.length > 0 ? operators.map(o => o.callsign).join(', ') : 'Unassigned'}
          accent="#4fd1c5"
          icon={<StarIcon boxSize={3.5} />}
        />
        <StatCard
          label="Days Remaining"
          value={daysLabel}
          sub={eng.endDate
            ? `Due ${new Date(eng.endDate + 'T00:00:00').toLocaleDateString('en-GB')}`
            : 'No end date set'}
          accent={daysColor}
          icon={<TimeIcon boxSize={3.5} />}
        />
      </SimpleGrid>

      {/* Progress timeline */}
      <SCard noHover accent="rgba(255,80,95,0.55)" mb={6}>
        <Flex justify="space-between" mb={3}>
          <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
            Engagement Progress
          </Text>
          <Text fontSize="13px" fontWeight="bold" color="red.400">{eng.progress}%</Text>
        </Flex>
        <Progress
          value={eng.progress} borderRadius="full" h="8px"
          bg="var(--dash-progress-track)"
          sx={{ '& > div': { background: 'linear-gradient(to right, rgba(185,28,28,0.9), rgba(255,80,95,1))' } }}
        />
        <Flex justify="space-between" mt={2}>
          {PHASES.map(ph => (
            <Text key={ph.label} fontSize="9px" textTransform="uppercase" letterSpacing="wider"
              color={eng.progress >= ph.progress ? 'red.400' : 'var(--dash-text-muted)'}
              fontWeight={eng.stage === ph.label ? 'bold' : 'normal'}>
              {ph.label}
            </Text>
          ))}
        </Flex>
      </SCard>

      {/* Findings + Operators */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mb={4}>

        {/* Findings card */}
        <SCard
          accent="#fcd34d"
          title="Findings"
          subtitle={`${findings.length} total`}
          action={
            <Button size="xs" leftIcon={<AddIcon boxSize={2.5} />}
              bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.25)"
              color="rgba(255,130,130,0.9)" fontSize="11px" borderRadius="7px"
              _hover={{ bg: 'rgba(255,80,95,0.18)' }}
              onClick={() => setShowFinding(!showFinding)}>
              Add Finding
            </Button>
          }
        >
          {/* Severity stacked bar */}
          {findings.length > 0 && (
            <Box mb={4}>
              <Flex h="5px" borderRadius="full" overflow="hidden" mb={2.5} gap="1px">
                {SORDER.map(s => findingCounts[s] > 0 && (
                  <Box key={s} flex={findingCounts[s]} bg={SEVERITY_META[s].bar} opacity={0.85} />
                ))}
              </Flex>
              <Flex gap={3} flexWrap="wrap">
                {SORDER.map(s => (
                  <Flex key={s} align="center" gap={1.5} opacity={findingCounts[s] ? 1 : 0.3}>
                    <Box w="6px" h="6px" borderRadius="1px" bg={SEVERITY_META[s].bar} />
                    <Text fontSize="10px" color="var(--dash-text-secondary)">
                      {s}{' '}
                      <Text as="span" fontWeight="bold" color={SEVERITY_META[s].text}>
                        {findingCounts[s]}
                      </Text>
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          )}

          {/* Add finding form */}
          <AnimatePresence>
            {showFinding && (
              <MotionBox
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                overflow="hidden" mb={3}
              >
                <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
                  borderRadius="10px" p={4}>
                  <SimpleGrid columns={2} spacing={3} mb={3}>
                    <Box gridColumn="1 / -1">
                      <Label>Title</Label>
                      <Input value={newF.title}
                        onChange={e => setNewF(p => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Password spraying — valid credentials"
                        {...inputStyles} />
                    </Box>
                    <Box>
                      <Label>Severity</Label>
                      <Select value={newF.severity}
                        onChange={e => setNewF(p => ({ ...p, severity: e.target.value }))}
                        {...selectStyles}>
                        {SORDER.map(s => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </Box>
                  </SimpleGrid>
                  <Flex gap={2}>
                    <Button size="sm" variant="ghost" color="var(--dash-text-muted)"
                      _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                      onClick={() => setShowFinding(false)}>Cancel</Button>
                    <Button size="sm" leftIcon={<AddIcon boxSize={3} />}
                      bgGradient="linear(to-r, red.700, red.500)" color="white"
                      _hover={{ bgGradient: 'linear(to-r, red.600, red.400)' }}
                      onClick={addFinding}>Add</Button>
                  </Flex>
                </Box>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Findings list */}
          {findings.length === 0 ? (
            <EmptySlate main="No findings yet" sub="Use Reporting → Findings for full management" />
          ) : (
            <>
              <AnimatePresence initial={false}>
                {[...findings]
                  .sort((a, b) => SORDER.indexOf(a.severity) - SORDER.indexOf(b.severity))
                  .slice(0, 5)
                  .map(f => {
                  const fid = f._id || f.id;
                  const fm  = SEVERITY_META[f.severity] || SEVERITY_META['Info'];
                  return (
                    <motion.div key={fid} layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.2 }}
                      style={{ marginBottom: 6 }}
                    >
                      <Flex align="center" gap={3}
                        bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)"
                        borderRadius="8px" px={3} py="9px"
                        sx={{ transition: 'border-color 0.15s', '&:hover': { borderColor: 'rgba(255,255,255,0.1)' } }}
                      >
                        <Box w="3px" h="24px" borderRadius="full" bg={fm.bar} flexShrink={0} opacity={0.85} />
                        <Flex px="5px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                          letterSpacing="wider" flexShrink={0}
                          bg={fm.bg} border={`1px solid ${fm.border}`} color={fm.text}>
                          {f.severity.toUpperCase()}
                        </Flex>
                        <Text fontSize="12px" color="var(--dash-text-primary)" flex="1" noOfLines={1}>
                          {f.title}
                        </Text>
                        <IconButton icon={<DeleteIcon />} size="xs" variant="ghost"
                          color="var(--dash-text-muted)" _hover={{ color: 'red.400' }}
                          onClick={() => removeFinding(fid)} aria-label="Remove" />
                      </Flex>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {findings.length > 5 && (
                <Flex
                  as="button" w="full" justify="center" align="center" gap={2}
                  pt={2} pb={1} borderRadius="8px" mt={1}
                  color="var(--dash-text-muted)" fontSize="11px"
                  transition="color 0.15s"
                  _hover={{ color: '#fcd34d' }}
                  onClick={() => navigate(`/dashboard/${slug}/reporting/findings`)}
                >
                  <Text>+{findings.length - 5} more</Text>
                  <Text opacity={0.5}>·</Text>
                  <Text>View all findings →</Text>
                </Flex>
              )}
            </>
          )}
        </SCard>

        {/* Operators card */}
        <SCard
          accent="#4fd1c5"
          title="Operators"
          subtitle={`${eng.operators?.length || 0} assigned to this engagement`}
          overflow="visible"
        >
          {operators.length === 0 ? (
            <EmptySlate main="No operators assigned" sub="Edit engagement to assign operators" />
          ) : (
            <Flex gap={4} flexWrap="wrap" mb={5}>
              {operators.map(op => (
                <OpAvatar key={op.id} callsign={op.callsign} skills={opSkillsMap[String(op.id)] || []} />
              ))}
            </Flex>
          )}

          {/* Compact info grid */}
          <Box
            pt={operators.length > 0 ? 4 : 0}
            mt={operators.length > 0 ? 4 : 0}
            borderTop={operators.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none'}
          >
            <SimpleGrid columns={2} spacing={3}>
              {[
                { label: 'Company', value: eng.company,   mono: false },
                { label: 'Type',    value: eng.type,      mono: false },
                { label: 'Start',   value: eng.startDate ? new Date(eng.startDate + 'T00:00:00').toLocaleDateString('en-GB') : '—', mono: false },
                { label: 'End',     value: eng.endDate   ? new Date(eng.endDate   + 'T00:00:00').toLocaleDateString('en-GB') : '—', mono: false },
                { label: 'Created', value: new Date(eng.createdAt).toLocaleDateString('en-GB'), mono: false },
                { label: 'ID',      value: eng.id?.slice(-8).toUpperCase(), mono: true },
              ].map(item => (
                <Box key={item.label}>
                  <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
                    letterSpacing="wider" mb="2px">{item.label}</Text>
                  <Text fontSize="12px" color="var(--dash-text-secondary)" noOfLines={1}
                    fontFamily={item.mono ? 'mono' : 'inherit'}>
                    {item.value}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </SCard>
      </SimpleGrid>

      {/* Skills + Resources */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>

        <SCard
          accent="#a5b4fc"
          title="Team Skill Coverage"
          subtitle="Capability distribution for this engagement"
        >
          {skills.length === 0 ? (
            <EmptySlate main="No skill data yet" sub="Add skills via Team → People & Skills" />
          ) : (
            <Flex direction="column" gap={3}>
              {skills.map(s => <SkillBar key={s.label} label={s.label} pct={s.pct} />)}
            </Flex>
          )}
        </SCard>

        <SCard
          accent="#f6ad55"
          title="Resource Utilization"
          subtitle="Infrastructure & tool allocation"
        >
          {resources.length === 0 ? (
            <EmptySlate main="No resources tracked" sub="Add resources via Team → Resources" />
          ) : (
            <Flex direction="column" gap={3}>
              {resources.map(r => (
                <ResourceBar key={r.name} name={r.name} used={r.used} total={r.total} color={r.color} />
              ))}
            </Flex>
          )}
        </SCard>

      </SimpleGrid>
    </Box>
  );
};

export default EngagementDetailView;
