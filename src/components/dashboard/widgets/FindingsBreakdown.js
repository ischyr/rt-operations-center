import { Box, Flex, Text } from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';

const findings = [
  { label: 'Critical', count: 7,  total: 45, color: '#FC8181' },
  { label: 'High',     count: 13, total: 45, color: '#F6AD55' },
  { label: 'Medium',   count: 17, total: 45, color: '#F6E05E' },
  { label: 'Low',      count: 8,  total: 45, color: '#68D391' },
];

const FindingsBreakdown = () => (
  <Box
    bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)"
    borderRadius="12px"
    p={5}
  >
    <Flex align="center" gap={2} mb={5}>
      <WarningTwoIcon boxSize={3} color="red.400" />
      <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)" textTransform="uppercase">
        Findings Breakdown
      </Text>
    </Flex>

    <Flex direction="column" gap={3}>
      {findings.map((f) => (
        <Box key={f.label}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="12px" color="var(--dash-text-secondary)">{f.label}</Text>
            <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)">{f.count}</Text>
          </Flex>
          <Box h="5px" bg="var(--dash-progress-track)" borderRadius="full" overflow="hidden">
            <Box
              h="100%"
              w={`${(f.count / f.total) * 100}%`}
              bg={f.color}
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
          Total Findings
        </Text>
        <Text fontSize="16px" fontWeight="black" color="var(--dash-text-primary)">45</Text>
      </Flex>
    </Box>
  </Box>
);

export default FindingsBreakdown;
