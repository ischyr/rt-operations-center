import { useState } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const TYPE_META = {
  engagement: { color: '#FC8181', label: 'Engagement', glow: 'rgba(252,129,129,0.5)' },
  finding:    { color: '#F6AD55', label: 'Finding',    glow: 'rgba(246,173,85,0.5)'  },
  milestone:  { color: '#4FD1C5', label: 'Milestone',  glow: 'rgba(79,209,197,0.5)'  },
  resource:   { color: '#ECC94B', label: 'Resource',   glow: 'rgba(236,201,75,0.5)'  },
  team:       { color: '#9F7AEA', label: 'Team',       glow: 'rgba(159,122,234,0.5)' },
};

const FILTERS = ['All', 'Engagement', 'Finding', 'Milestone', 'Resource', 'Team'];

const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d >= today)     return 'Today';
  if (d >= yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const groupByDay = (logs) => {
  const groups = [];
  let currentDay = null;
  for (const log of logs) {
    const day = log.createdAt
      ? new Date(log.createdAt).toDateString()
      : 'Unknown';
    if (day !== currentDay) {
      currentDay = day;
      groups.push({ day, label: formatDate(log.createdAt), logs: [] });
    }
    groups[groups.length - 1].logs.push(log);
  }
  return groups;
};

const ActivityView = () => {
  const { slug } = useParams();
  const { getBySlug } = useEngagements();
  const eng = getBySlug(slug);

  const [filter, setFilter] = useState('All');

  if (!eng) return null;

  const allLogs = [...(eng.activityLog || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const filtered = filter === 'All'
    ? allLogs
    : allLogs.filter(l => l.type === filter.toLowerCase());

  const groups = groupByDay(filtered);

  return (
    <Box pb={8}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
            Activity Log
          </Text>
          <Text fontSize="12px" color="var(--dash-text-muted)">
            {allLogs.length} event{allLogs.length !== 1 ? 's' : ''} recorded for this engagement
          </Text>
        </Box>

        {/* Type filter chips */}
        <Flex gap={2} flexWrap="wrap">
          {FILTERS.map(f => {
            const meta = TYPE_META[f.toLowerCase()];
            const active = filter === f;
            return (
              <Button
                key={f}
                size="xs"
                h="26px"
                px={3}
                borderRadius="20px"
                fontSize="10px"
                fontWeight="semibold"
                letterSpacing="wide"
                bg={active ? (meta ? `${meta.color}20` : 'rgba(255,80,95,0.12)') : 'rgba(255,255,255,0.04)'}
                border={active
                  ? `1px solid ${meta ? meta.color + '60' : 'rgba(255,80,95,0.4)'}`
                  : '1px solid rgba(255,255,255,0.08)'}
                color={active ? (meta ? meta.color : '#FC8181') : 'var(--dash-text-muted)'}
                _hover={{ bg: meta ? `${meta.color}18` : 'rgba(255,80,95,0.08)', color: meta ? meta.color : '#FC8181' }}
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            );
          })}
        </Flex>
      </Flex>

      {filtered.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={16} gap={3}>
          <Text fontSize="3xl">📋</Text>
          <Text fontWeight="semibold" color="var(--dash-text-secondary)">No activity yet</Text>
          <Text fontSize="sm" color="var(--dash-text-muted)">
            {filter === 'All'
              ? 'Events will appear here as the engagement progresses.'
              : `No "${filter}" events recorded yet.`}
          </Text>
        </Flex>
      ) : (
        <Box>
          {groups.map((group, gi) => (
            <Box key={gi} mb={6}>
              {/* Day label */}
              <Flex align="center" gap={3} mb={4}>
                <Text
                  fontSize="10px" fontWeight="bold" letterSpacing="widest"
                  color="var(--dash-text-muted)" textTransform="uppercase"
                  flexShrink={0}
                >
                  {group.label}
                </Text>
                <Box flex="1" h="1px" bg="var(--dash-card-border)" />
                <Text fontSize="10px" color="var(--dash-text-muted)" flexShrink={0}>
                  {group.logs.length} event{group.logs.length !== 1 ? 's' : ''}
                </Text>
              </Flex>

              {/* Timeline */}
              <Box pos="relative" pl="28px">
                {/* Vertical line */}
                <Box
                  pos="absolute" left="8px" top="10px"
                  bottom={gi === groups.length - 1 ? '0' : '-24px'}
                  w="1px" bg="var(--dash-card-border)"
                />

                <Flex direction="column" gap={1}>
                  {group.logs.map((log, li) => {
                    const meta = TYPE_META[log.type] || TYPE_META.engagement;
                    const isLast = li === group.logs.length - 1;
                    return (
                      <Flex
                        key={log._id || li}
                        align="flex-start" gap={3}
                        bg="var(--dash-card-bg)"
                        border="1px solid var(--dash-card-border)"
                        borderRadius="10px"
                        px={4} py={3}
                        mb={isLast ? 0 : 2}
                        _hover={{ borderColor: `${meta.color}40`, bg: 'rgba(255,255,255,0.02)' }}
                        transition="all 0.18s"
                        pos="relative"
                      >
                        {/* Dot on the line */}
                        <Box
                          pos="absolute"
                          left="-24px" top="14px"
                          w="9px" h="9px"
                          borderRadius="full"
                          bg={meta.color}
                          boxShadow={`0 0 8px ${meta.glow}`}
                          border="2px solid var(--dash-card-bg)"
                          flexShrink={0}
                        />

                        {/* Type badge */}
                        <Flex
                          px="6px" py="1px" borderRadius="4px" fontSize="9px"
                          fontWeight="bold" letterSpacing="wider" flexShrink={0}
                          bg={`${meta.color}18`} border={`1px solid ${meta.color}40`}
                          color={meta.color} align="center" mt="1px"
                        >
                          {meta.label}
                        </Flex>

                        {/* Content */}
                        <Box flex="1" minW={0}>
                          <Text fontSize="12px" color="var(--dash-text-primary)" lineHeight="short">
                            {log.description}
                          </Text>
                        </Box>

                        {/* Time */}
                        <Text fontSize="10px" color="var(--dash-text-muted)" flexShrink={0} mt="1px">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </Text>
                      </Flex>
                    );
                  })}
                </Flex>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ActivityView;
