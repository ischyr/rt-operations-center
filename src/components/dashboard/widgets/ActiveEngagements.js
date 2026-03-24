import { useState } from 'react';
import { Box, Flex, Text, IconButton } from '@chakra-ui/react';
import { WarningIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const PAGE_SIZE = 3;
const MotionFlex = motion(Flex);

const STATUS_COLORS = {
  'PREPARING':   { text: '#a5b4fc', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.28)'  },
  'IN PROGRESS': { text: '#fcd34d', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)'  },
  'REPORTING':   { text: '#93c5fd', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.28)'  },
  'COMPLETED':   { text: '#6ee7b7', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.28)'  },
  'PAUSED':      { text: '#9ca3af', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.28)' },
};

const PROGRESS_COLORS = {
  'PREPARING':   ['rgba(99,102,241,0.7)',  'rgba(165,180,252,0.9)'],
  'IN PROGRESS': ['rgba(220,38,38,0.8)',   'rgba(255,80,95,0.9)'  ],
  'REPORTING':   ['rgba(37,99,235,0.8)',   'rgba(147,197,253,0.9)'],
  'COMPLETED':   ['rgba(5,150,105,0.8)',   'rgba(110,231,183,0.9)'],
  'PAUSED':      ['rgba(75,85,99,0.8)',    'rgba(156,163,175,0.9)'],
};

const daysLeft = (endDate) => {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / 86400000);
};

const fmt = (d) => {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const FindingChip = ({ label, count, color }) => (
  <Flex
    align="center" gap={1} px="6px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
    bg={`${color}18`} border={`1px solid ${color}40`} color={color}
  >
    <Box w="4px" h="4px" borderRadius="full" bg={color} flexShrink={0} />
    {count} {label}
  </Flex>
);

const EngCard = ({ eng, getUserById }) => {
  const navigate = useNavigate();
  const sc  = STATUS_COLORS[eng.status] || STATUS_COLORS['PREPARING'];
  const [pgFrom, pgTo] = PROGRESS_COLORS[eng.status] || PROGRESS_COLORS['PREPARING'];
  const dl  = daysLeft(eng.endDate);

  const byS = (sev) => (eng.findings || []).filter((f) => f.severity === sev).length;

  return (
    <Box
      bg="rgba(255,255,255,0.025)" border={`1px solid ${sc.border}`}
      borderRadius="12px" p={4} cursor="pointer"
      onClick={() => navigate(`/dashboard/${eng.slug}`)}
      _hover={{ bg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,80,95,0.35)' }}
      transition="all 0.18s"
    >
      <Flex justify="space-between" align="flex-start" mb={3}>
        <Box flex="1" mr={3}>
          <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={1}>
            {eng.name}
          </Text>
          <Text fontSize="11px" color="var(--dash-text-secondary)" mt="1px">
            {eng.company} · {eng.type}
          </Text>
        </Box>
        <Flex
          px="8px" py="2px" borderRadius="6px" fontSize="9px" fontWeight="bold"
          letterSpacing="wider" flexShrink={0}
          bg={sc.bg} border={`1px solid ${sc.border}`} color={sc.text}
        >
          {eng.status}
        </Flex>
      </Flex>

      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="10px" color="var(--dash-text-muted)">
          {fmt(eng.startDate)} → {fmt(eng.endDate)}
          {dl !== null && (
            <Text as="span" ml={1.5}
              color={dl < 0 ? 'red.400' : dl <= 7 ? 'orange.300' : 'var(--dash-text-muted)'}>
              {dl < 0 ? `(${Math.abs(dl)}d overdue)` : dl === 0 ? '(due today)' : `(${dl}d left)`}
            </Text>
          )}
        </Text>
        {eng.operators?.length > 0 && (
          <Text fontSize="10px" color="var(--dash-text-secondary)">
            {eng.operators.map((id) => getUserById(id)?.callsign || id).join(', ')}
          </Text>
        )}
      </Flex>

      <Flex align="center" gap={2} mb={2}>
        {eng.stage && <Text fontSize="10px" color={sc.text} fontWeight="semibold">{eng.stage}</Text>}
        <Text fontSize="10px" color="var(--dash-text-muted)" ml="auto">{eng.progress}%</Text>
      </Flex>
      <Box h="4px" bg="var(--dash-progress-track)" borderRadius="full" overflow="hidden">
        <Box
          h="100%" w={`${eng.progress}%`} borderRadius="full" transition="width 0.6s ease"
          style={{ background: `linear-gradient(to right, ${pgFrom}, ${pgTo})` }}
        />
      </Box>

      {eng.findings?.length > 0 && (
        <Flex gap={2} mt={3} flexWrap="wrap">
          {byS('Critical') > 0 && <FindingChip label="CRIT" count={byS('Critical')} color="#FC8181" />}
          {byS('High')     > 0 && <FindingChip label="HIGH" count={byS('High')}     color="#F6AD55" />}
          {byS('Medium')   > 0 && <FindingChip label="MED"  count={byS('Medium')}   color="#F6E05E" />}
          {byS('Low')      > 0 && <FindingChip label="LOW"  count={byS('Low')}      color="#68D391" />}
        </Flex>
      )}
    </Box>
  );
};

const ActiveEngagements = () => {
  const { dashboardStats, loading, getUserById } = useEngagements();
  const { activeEngagements } = dashboardStats;
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(activeEngagements.length / PAGE_SIZE);
  const visible    = activeEngagements.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const goTo = (newPage) => setPage(newPage);

  // Fixed slot height: 3 cards × 160px + 2 gaps × 12px = 504px
  const CARDS_H = '504px';

  return (
    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="12px" p={5}
      transition="transform 0.22s ease, box-shadow 0.22s ease"
      _hover={{ transform: 'translateY(-4px)', boxShadow: '0 8px 28px rgba(0,0,0,0.4)' }}
    >
      <Flex align="center" gap={2} mb={5}>
        <WarningIcon boxSize={3} color="red.500" />
        <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)" textTransform="uppercase">
          Active Engagements
        </Text>
        {activeEngagements.length > 0 && (
          <Box ml="auto" px="7px" py="1px" borderRadius="20px"
            bg="rgba(255,80,95,0.12)" border="1px solid rgba(255,80,95,0.25)">
            <Text fontSize="10px" fontWeight="bold" color="red.400">{activeEngagements.length}</Text>
          </Box>
        )}
      </Flex>

      {/* Fixed-height card slot — always sized for 3 cards */}
      <Box h={CARDS_H} overflow="hidden">
        {loading ? (
          <Flex h="100%" align="center" justify="center">
            <Text fontSize="sm" color="var(--dash-text-muted)">Loading...</Text>
          </Flex>
        ) : activeEngagements.length === 0 ? (
          <Flex h="100%" direction="column" align="center" justify="center" gap={2} color="var(--dash-text-muted)">
            <Text fontSize="2xl">⚡</Text>
            <Text fontSize="sm">No active engagements.</Text>
            <Text fontSize="11px">Create one from the Engagements page.</Text>
          </Flex>
        ) : (
          <AnimatePresence mode="wait">
            <MotionFlex
              key={page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              direction="column"
              gap={3}
            >
              {visible.map((e) => <EngCard key={e.id} eng={e} getUserById={getUserById} />)}
            </MotionFlex>
          </AnimatePresence>
        )}
      </Box>

      {/* Pagination — always directly below the card slot */}
      {totalPages > 1 && (
        <Flex align="center" justify="center" gap={3} mt={4}>
          <IconButton
            icon={<ChevronLeftIcon boxSize={4} />}
            size="xs" variant="ghost" borderRadius="full"
            color={page === 0 ? 'var(--dash-text-muted)' : 'var(--dash-text-secondary)'}
            isDisabled={page === 0}
            onClick={() => goTo(page - 1)}
            _hover={{ bg: 'rgba(255,255,255,0.07)', color: 'white' }}
            aria-label="Previous"
          />
          <Flex gap={1.5} align="center">
            {Array.from({ length: totalPages }).map((_, i) => (
              <Box
                key={i}
                w={i === page ? '16px' : '5px'} h="5px"
                borderRadius="full"
                bg={i === page ? 'red.500' : 'rgba(255,255,255,0.15)'}
                transition="all 0.22s ease"
                cursor="pointer"
                onClick={() => goTo(i)}
              />
            ))}
          </Flex>
          <IconButton
            icon={<ChevronRightIcon boxSize={4} />}
            size="xs" variant="ghost" borderRadius="full"
            color={page === totalPages - 1 ? 'var(--dash-text-muted)' : 'var(--dash-text-secondary)'}
            isDisabled={page === totalPages - 1}
            onClick={() => goTo(page + 1)}
            _hover={{ bg: 'rgba(255,255,255,0.07)', color: 'white' }}
            aria-label="Next"
          />
        </Flex>
      )}
    </Box>
  );
};

export default ActiveEngagements;
