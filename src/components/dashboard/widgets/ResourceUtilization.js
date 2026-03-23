import { Box, Flex, Text } from '@chakra-ui/react';
import { LinkIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const ResourceUtilization = () => {
  const { dashboardStats } = useEngagements();
  const navigate = useNavigate();
  const { resources } = dashboardStats;

  return (
    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="12px" p={5}>
      <Flex align="center" gap={2} mb={5}>
        <LinkIcon boxSize={3} color="red.400" />
        <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)" textTransform="uppercase">
          Resource Utilization
        </Text>
      </Flex>

      {resources.length === 0 ? (
        <Flex direction="column" align="center" py={4} gap={1}>
          <Text fontSize="sm" color="var(--dash-text-muted)" textAlign="center">
            No resources tracked yet.
          </Text>
          <Text
            fontSize="11px" color="red.400" cursor="pointer" mt={1}
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate('/dashboard/engagements')}
          >
            Add via an engagement → Team → Resources
          </Text>
        </Flex>
      ) : (
        <Flex direction="column" gap={4}>
          {resources.map((r) => (
            <Box key={r.name}>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="12px" color="var(--dash-text-secondary)">{r.name}</Text>
                <Text fontSize="11px" color="var(--dash-text-muted)">
                  {r.used} / {r.total} in use
                </Text>
              </Flex>
              <Box h="4px" bg="var(--dash-progress-track)" borderRadius="full" overflow="hidden">
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
      )}
    </Box>
  );
};

export default ResourceUtilization;
