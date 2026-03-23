import { Box, Flex, Text } from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';

const findings = [
  { label: 'Critical', count: 7,  total: 45, color: '#FC8181', bg: 'rgba(252,129,129,0.15)' },
  { label: 'High',     count: 13, total: 45, color: '#F6AD55', bg: 'rgba(246,173,85,0.15)'  },
  { label: 'Medium',   count: 17, total: 45, color: '#F6E05E', bg: 'rgba(246,224,94,0.15)'  },
  { label: 'Low',      count: 8,  total: 45, color: '#68D391', bg: 'rgba(104,211,145,0.15)' },
];

const FindingsBreakdown = () => (
  <Box
    bg="rgba(255,255,255,0.03)"
    border="1px solid rgba(255,255,255,0.07)"
    borderRadius="12px"
    p={5}
  >
    <Flex align="center" gap={2} mb={5}>
      <WarningTwoIcon boxSize={3} color="red.400" />
      <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="gray.500" textTransform="uppercase">
        Findings Breakdown
      </Text>
    </Flex>

    <Flex direction="column" gap={3}>
      {findings.map((f) => (
        <Box key={f.label}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="12px" color="gray.400">{f.label}</Text>
            <Text fontSize="12px" fontWeight="bold" color="white">{f.count}</Text>
          </Flex>
          <Box h="5px" bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden">
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

    {/* Total */}
    <Box mt={5} pt={4} borderTop="1px solid rgba(255,255,255,0.06)">
      <Flex justify="space-between">
        <Text fontSize="11px" color="gray.600" textTransform="uppercase" letterSpacing="wider">Total Findings</Text>
        <Text fontSize="16px" fontWeight="black" color="white">45</Text>
      </Flex>
    </Box>
  </Box>
);

export default FindingsBreakdown;
