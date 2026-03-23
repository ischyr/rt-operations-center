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
    bg="rgba(255,255,255,0.03)"
    border="1px solid rgba(255,255,255,0.07)"
    borderRadius="12px"
    p={5}
  >
    <Flex align="center" gap={2} mb={5}>
      <LinkIcon boxSize={3} color="red.400" />
      <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="gray.500" textTransform="uppercase">
        Resource Utilization
      </Text>
    </Flex>

    <Flex direction="column" gap={4}>
      {resources.map((r) => (
        <Box key={r.label}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="12px" color="gray.400">{r.label}</Text>
            <Text fontSize="11px" color="gray.500">{r.used} / {r.total} in use</Text>
          </Flex>
          <Box h="4px" bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden">
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
