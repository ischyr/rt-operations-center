import { useState } from 'react';
import {
  Box, Flex, Text, Heading, Grid, Badge, Button,
  Progress, Divider, Input, Select,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon, WarningTwoIcon } from '@chakra-ui/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';
import NewEngagementModal from '../engagements/NewEngagementModal';

const MotionBox = motion(Box);

const STATUS_COLORS = {
  'PREPARING':   { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.35)',  text: '#a5b4fc' },
  'IN PROGRESS': { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)',  text: '#fcd34d' },
  'REPORTING':   { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.35)',  text: '#93c5fd' },
  'COMPLETED':   { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.35)',  text: '#6ee7b7' },
  'PAUSED':      { bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.35)', text: '#9ca3af' },
};

const TYPE_COLORS = {
  'External':           '#fc8181',
  'Internal':           '#4fd1c5',
  'External + Internal':'#f6ad55',
  'Full Scope':         '#fc8181',
  'Phishing':           '#b794f4',
  'Web Application':    '#76e4f7',
};

const formatDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const daysLeft = (endDate) => {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate) - new Date()) / 86400000);
  return diff;
};

const EngagementCard = ({ eng, getUserById }) => {
  const navigate = useNavigate();
  const sc = STATUS_COLORS[eng.status] || STATUS_COLORS['PREPARING'];
  const tc = TYPE_COLORS[eng.type] || '#9ca3af';
  const dl = daysLeft(eng.endDate);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      bg="var(--dash-card-bg)"
      border="1px solid var(--dash-card-border)"
      borderRadius="14px"
      overflow="hidden"
      cursor="pointer"
      onClick={() => navigate(`/dashboard/${eng.slug}`)}
      _hover={{ borderColor: 'rgba(255,80,95,0.3)', transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
      transition="all 0.18s ease"
      pos="relative"
    >
      {/* Top accent bar — color by status */}
      <Box h="2px" bgGradient={`linear(to-r, transparent, ${sc.text}, transparent)`} />

      <Box p={5}>
        {/* Header row */}
        <Flex justify="space-between" align="flex-start" mb={3}>
          <Box flex="1" mr={3}>
            <Text fontSize="15px" fontWeight="bold" color="var(--dash-text-primary)" lineHeight="short" noOfLines={1}>
              {eng.name}
            </Text>
            <Text fontSize="12px" color="var(--dash-text-secondary)" mt="2px">{eng.company}</Text>
          </Box>
          <Flex
            px="8px" py="3px" borderRadius="6px" fontSize="10px" fontWeight="bold"
            letterSpacing="wider" flexShrink={0}
            bg={sc.bg} border={`1px solid ${sc.border}`} color={sc.text}
          >
            {eng.status}
          </Flex>
        </Flex>

        {/* Type + stage row */}
        <Flex gap={2} mb={4} flexWrap="wrap">
          <Flex
            px="7px" py="2px" borderRadius="5px" fontSize="10px" fontWeight="semibold"
            bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.08)"
            color={tc} align="center" gap={1}
          >
            <Box w="5px" h="5px" borderRadius="full" bg={tc} flexShrink={0} />
            {eng.type}
          </Flex>
          {eng.stage && (
            <Flex
              px="7px" py="2px" borderRadius="5px" fontSize="10px"
              bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)"
              color="var(--dash-text-muted)"
            >
              {eng.stage}
            </Flex>
          )}
        </Flex>

        {/* Progress */}
        <Box mb={4}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider">Progress</Text>
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-secondary)">{eng.progress}%</Text>
          </Flex>
          <Progress
            value={eng.progress} size="xs" borderRadius="full"
            bg="var(--dash-progress-track)"
            sx={{ '& > div': { background: `linear-gradient(to right, rgba(220,38,38,0.8), rgba(255,80,95,0.9))` } }}
          />
        </Box>

        <Divider borderColor="var(--dash-divider)" mb={4} />

        {/* Dates + operators */}
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="10px" color="var(--dash-text-muted)" mb="2px">Timeline</Text>
            <Text fontSize="11px" color="var(--dash-text-secondary)">
              {formatDate(eng.startDate)} → {formatDate(eng.endDate)}
            </Text>
            {dl !== null && (
              <Text fontSize="10px" mt="1px" color={dl < 0 ? 'red.400' : dl <= 7 ? 'orange.300' : 'var(--dash-text-muted)'}>
                {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : `${dl}d remaining`}
              </Text>
            )}
          </Box>

          {eng.operators && eng.operators.length > 0 && (
            <Flex gap={1} flexWrap="wrap" justify="flex-end" maxW="120px">
              {eng.operators.map((id) => (
                <Box
                  key={id}
                  px="6px" py="2px" borderRadius="5px" fontSize="10px"
                  bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.2)"
                  color="rgba(255,130,130,0.9)"
                >
                  {getUserById(id)?.callsign || id}
                </Box>
              ))}
            </Flex>
          )}
        </Flex>
      </Box>
    </MotionBox>
  );
};

const EmptyState = ({ onNew }) => (
  <Flex
    direction="column" align="center" justify="center"
    py={20} px={8} gap={4}
    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="16px"
  >
    <Box
      w="48px" h="48px" borderRadius="12px"
      bg="rgba(255,80,95,0.10)" border="1px solid rgba(255,80,95,0.25)"
      display="flex" alignItems="center" justifyContent="center"
    >
      <WarningTwoIcon boxSize={5} color="red.300" />
    </Box>
    <Box textAlign="center">
      <Text fontWeight="bold" color="var(--dash-text-primary)" mb={1}>No engagements yet</Text>
      <Text fontSize="sm" color="var(--dash-text-muted)">Start your first operation to track your red team campaigns.</Text>
    </Box>
    <Button
      leftIcon={<AddIcon boxSize={2.5} />}
      fontSize="sm" borderRadius="8px" h="40px" px={5}
      bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
      color="rgba(255,130,130,0.9)"
      _hover={{ bg: 'rgba(255,80,95,0.18)' }}
      onClick={onNew}
    >
      New Engagement
    </Button>
  </Flex>
);

const EngagementsView = () => {
  const { engagements, loading, getUserById } = useEngagements();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState('');

  const search = searchParams.get('q') || '';

  const filtered = engagements.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || e.name.toLowerCase().includes(q)
      || (e.company || '').toLowerCase().includes(q)
      || (e.type || '').toLowerCase().includes(q)
      || (e.status || '').toLowerCase().includes(q);
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <Box pb={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            Engagements{' '}
            <Text as="span" color="red.400">Center</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {engagements.length === 0
              ? 'No operations running'
              : `${engagements.length} operation${engagements.length !== 1 ? 's' : ''} · ${engagements.filter(e => e.status === 'IN PROGRESS').length} active`}
          </Text>
        </Box>
        <Button
          leftIcon={<AddIcon boxSize={2.5} />}
          fontSize="sm" borderRadius="8px" h="40px" px={5}
          bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
          color="rgba(255,130,130,0.9)"
          _hover={{ bg: 'rgba(255,80,95,0.18)' }}
          onClick={() => setIsModalOpen(true)}
        >
          New Engagement
        </Button>
      </Flex>

      {/* Filters */}
      {engagements.length > 0 && (
        <Flex gap={3} mb={6}>
          <Flex
            flex="1" align="center" gap={2}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="10px" px={3} h="40px"
            _focusWithin={{ borderColor: 'rgba(255,80,95,0.5)' }}
            transition="border-color 0.18s"
          >
            <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
            <Input
              variant="unstyled" fontSize="sm" color="var(--dash-text-primary)"
              placeholder="Search operations..." value={search}
              onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
              _placeholder={{ color: 'var(--dash-text-muted)' }}
            />
          </Flex>
          <Select
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            w="180px" h="40px" fontSize="sm" borderRadius="10px"
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            color="var(--dash-text-secondary)"
            _hover={{ borderColor: 'rgba(255,80,95,0.4)' }}
            sx={{ option: { bg: '#1a1a1f', color: 'white' }, '& option': { background: '#1a1a1f !important' } }}
          >
            <option value="">All Statuses</option>
            <option value="PREPARING">Preparing</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="REPORTING">Reporting</option>
            <option value="COMPLETED">Completed</option>
            <option value="PAUSED">Paused</option>
          </Select>
        </Flex>
      )}

      {/* Content */}
      {loading ? (
        <Flex align="center" justify="center" py={20} color="var(--dash-text-muted)">
          <Text fontSize="sm">Loading engagements...</Text>
        </Flex>
      ) : engagements.length === 0 ? (
        <EmptyState onNew={() => setIsModalOpen(true)} />
      ) : filtered.length === 0 ? (
        <Flex
          direction="column" align="center" py={12} gap={2}
          color="var(--dash-text-muted)"
        >
          <Text fontSize="2xl">🔍</Text>
          <Text fontSize="sm">No engagements match your search.</Text>
        </Flex>
      ) : (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }} gap={4}>
          {filtered.map((eng) => (
            <EngagementCard key={eng.id} eng={eng} getUserById={getUserById} />
          ))}
        </Grid>
      )}

      <NewEngagementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Box>
  );
};

export default EngagementsView;
