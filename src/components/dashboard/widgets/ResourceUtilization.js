import { Box, Flex, Text } from '@chakra-ui/react';
import { LinkIcon } from '@chakra-ui/icons';

const resources = [
  { label: 'Hardware',    used: 8, total: 20, color: '#ECC94B' },
  { label: 'Virtual IPs', used: 2, total: 7,  color: '#4FD1C5' },
  { label: 'Domains',     used: 2, total: 7,  color: '#FC8181' },
  { label: 'C2 Servers',  used: 3, total: 5,  color: '#9F7AEA' },
];

const ResourceUtilization = () => (
  <Box
    bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)"
    borderRadius="12px"
    p={5}
  >
    <Flex align="center" gap={2} mb={5}>
      <LinkIcon boxSize={3} color="red.400" />
      <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)" textTransform="uppercase">
        Resource Utilization
      </Text>
    </Flex>

    <Flex direction="column" gap={4}>
      {resources.map((r) => (
        <Box key={r.label}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="12px" color="var(--dash-text-secondary)">{r.label}</Text>
            <Text fontSize="11px" color="var(--dash-text-muted)">{r.used} / {r.total} in use</Text>
          </Flex>
          <Box h="4px" bg="var(--dash-progress-track)" borderRadius="full" overflow="hidden">
            <Box
              h="100%"
              w={`${(r.used / r.total) * 100}%`}
              bg={r.color}
              borderRadius="full"
              transition="width 0.6s ease"
            />
          </Box>
        </Box>
      ))}
    </Flex>
  </Box>
);

export default ResourceUtilization;
