import { Box, Flex, Text } from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const TYPE_COLORS = {
  engagement: '#FC8181',
  finding:    '#F6AD55',
  milestone:  '#4FD1C5',
  resource:   '#ECC94B',
  team:       '#9F7AEA',
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const RecentActivity = () => {
  const { dashboardStats } = useEngagements();
  const navigate = useNavigate();
  const { activityLogs } = dashboardStats;

  return (
    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="12px" p={5}>
      <Flex align="center" gap={2} mb={5}>
        <RepeatIcon boxSize={3} color="red.400" />
        <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)" textTransform="uppercase">
          Recent Activity
        </Text>
      </Flex>

      {activityLogs.length === 0 ? (
        <Text fontSize="sm" color="var(--dash-text-muted)" textAlign="center" py={6}>
          No activity yet. Start an engagement to see logs here.
        </Text>
      ) : (
        <Flex direction="column" gap={3}>
          {activityLogs.slice(0, 5).map((a, i) => (
            <Flex key={i} align="flex-start" gap={3}>
              <Box
                w="6px" h="6px" borderRadius="full" mt="5px" flexShrink={0}
                bg={TYPE_COLORS[a.type] || TYPE_COLORS.engagement}
                boxShadow={`0 0 6px ${TYPE_COLORS[a.type] || TYPE_COLORS.engagement}`}
              />
              <Box flex="1">
                <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="short">
                  {a.engagementName && (
                    <Text
                      as="span" color="var(--dash-text-primary)" fontWeight="semibold"
                      cursor="pointer" _hover={{ color: 'red.400' }}
                      onClick={() => navigate(`/dashboard/${a.engagementSlug}`)}
                    >
                      {a.engagementName.replace('Operation ', '')}
                    </Text>
                  )}
                  {a.engagementName ? ' · ' : ''}{a.description}
                </Text>
                <Text fontSize="10px" color="var(--dash-text-muted)" mt="2px">
                  {timeAgo(a.createdAt)}
                </Text>
              </Box>
            </Flex>
          ))}
        </Flex>
      )}
      {activityLogs.length > 5 && (
        <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" mt={2}>
          +{activityLogs.length - 5} more — go to an engagement → Operations → Activity Log
        </Text>
      )}
    </Box>
  );
};

export default RecentActivity;
