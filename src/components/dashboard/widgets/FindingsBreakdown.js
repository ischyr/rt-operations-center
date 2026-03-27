import { Box, Flex, Text } from '@chakra-ui/react';
import { useEngagements } from '../../../contexts/EngagementContext';

const ACCENT = 'rgba(246,173,85,0.85)';

const ROWS = [
  { label: 'Critical', key: 'Critical', color: '#FC8181' },
  { label: 'High',     key: 'High',     color: '#F6AD55' },
  { label: 'Medium',   key: 'Medium',   color: '#F6E05E' },
  { label: 'Low',      key: 'Low',      color: '#68D391' },
  { label: 'Info',     key: 'Info',     color: '#76E4F7' },
];

const FindingsBreakdown = () => {
  const { dashboardStats } = useEngagements();
  const { totalFindings, findingsBySeverity } = dashboardStats;

  return (
    <Box
      pos="relative"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="14px" p={5} overflow="hidden"
      transition="transform 0.22s ease, box-shadow 0.22s ease"
      _hover={{ transform: 'translateY(-4px)', boxShadow: `0 8px 28px rgba(0,0,0,0.4), 0 0 0 1px ${ACCENT}20` }}
    >
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${ACCENT}, transparent)` }} />

      <Flex align="center" gap={2} mb={5}>
        <Box w="3px" h="14px" borderRadius="full" bg={ACCENT} flexShrink={0} />
        <Text fontSize="11px" fontWeight="bold" letterSpacing="widest"
          color="var(--dash-text-muted)" textTransform="uppercase">
          Findings Breakdown
        </Text>
      </Flex>

      {totalFindings === 0 ? (
        <Text fontSize="sm" color="var(--dash-text-muted)" textAlign="center" py={4}>
          No findings logged yet.
        </Text>
      ) : (
        <Flex direction="column" gap={3}>
          {ROWS.map((row) => {
            const count = findingsBySeverity[row.key] || 0;
            if (count === 0) return null;
            return (
              <Box key={row.label}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="12px" color="var(--dash-text-secondary)">{row.label}</Text>
                  <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)">{count}</Text>
                </Flex>
                <Box h="5px" bg="var(--dash-progress-track)" borderRadius="full" overflow="hidden">
                  <Box
                    h="100%" w={`${(count / totalFindings) * 100}%`}
                    bg={row.color} borderRadius="full" transition="width 0.6s ease"
                  />
                </Box>
              </Box>
            );
          })}
        </Flex>
      )}

      <Box mt={5} pt={4} borderTop="1px solid var(--dash-divider)">
        <Flex justify="space-between">
          <Text fontSize="11px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider">
            Total Findings
          </Text>
          <Text fontSize="16px" fontWeight="black" color="var(--dash-text-primary)">{totalFindings}</Text>
        </Flex>
      </Box>
    </Box>
  );
};

export default FindingsBreakdown;
