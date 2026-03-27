import { Box, Flex, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const ACCENT = 'rgba(79,209,197,0.85)';

const ResourceUtilization = ({ ...rest }) => {
  const { dashboardStats } = useEngagements();
  const navigate = useNavigate();
  const { resources } = dashboardStats;

  return (
    <Box
      pos="relative"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="14px" p={5} overflow="hidden"
      display="flex" flexDirection="column"
      transition="transform 0.22s ease, box-shadow 0.22s ease"
      _hover={{ transform: 'translateY(-4px)', boxShadow: `0 8px 28px rgba(0,0,0,0.4), 0 0 0 1px ${ACCENT}20` }}
      {...rest}
    >
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${ACCENT}, transparent)` }} />

      <Flex align="center" gap={2} mb={5}>
        <Box w="3px" h="14px" borderRadius="full" bg={ACCENT} flexShrink={0} />
        <Text fontSize="11px" fontWeight="bold" letterSpacing="widest"
          color="var(--dash-text-muted)" textTransform="uppercase">
          Resource Utilization
        </Text>
      </Flex>

      {resources.length === 0 ? (
        <Flex direction="column" align="center" justify="center" flex={1} gap={1}>
          <Text fontSize="sm" color="var(--dash-text-muted)" textAlign="center">
            No resources tracked yet.
          </Text>
          <Text
            fontSize="11px" color="rgba(79,209,197,0.8)" cursor="pointer" mt={1}
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate('/dashboard/engagements')}
          >
            Add via an engagement → Team → Resources
          </Text>
        </Flex>
      ) : (
        <>
          <Flex direction="column" gap={3} flex={1}>
            {[...resources]
              .sort((a, b) => (b.total > 0 ? b.used / b.total : 0) - (a.total > 0 ? a.used / a.total : 0))
              .slice(0, 5)
              .map((r) => (
                <Box key={r.name}>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="12px" color="var(--dash-text-secondary)">{r.name}</Text>
                    <Text fontSize="11px" color="var(--dash-text-muted)">
                      {r.used} / {r.total} in use
                    </Text>
                  </Flex>
                  <Box h="5px" bg="var(--dash-progress-track)" borderRadius="full" overflow="hidden">
                    <Box
                      h="100%"
                      w={`${r.total > 0 ? Math.min(100, (r.used / r.total) * 100) : 0}%`}
                      bg={r.color}
                      borderRadius="full"
                      transition="width 0.6s ease"
                    />
                  </Box>
                </Box>
              ))}
          </Flex>

          <Box mt={5} pt={4} borderTop="1px solid var(--dash-divider)">
            <Flex justify="space-between">
              <Text fontSize="11px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider">
                {resources.length > 5 ? `Top 5 of ${resources.length} resources` : 'Total Resources'}
              </Text>
              <Text fontSize="16px" fontWeight="black" color="var(--dash-text-primary)">{resources.length}</Text>
            </Flex>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ResourceUtilization;
