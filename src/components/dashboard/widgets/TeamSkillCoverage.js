import { Box, Flex, Text } from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';

const skills = [
  { label: 'Active Directory',   pct: 90 },
  { label: 'Web App Testing',    pct: 85 },
  { label: 'OSINT',              pct: 80 },
  { label: 'Network Pentesting', pct: 70 },
  { label: 'Cloud Security',     pct: 65 },
  { label: 'Malware Dev',        pct: 55 },
];

const TeamSkillCoverage = () => (
  <Box
    bg="rgba(255,255,255,0.03)"
    border="1px solid rgba(255,255,255,0.07)"
    borderRadius="12px"
    p={5}
  >
    <Flex align="center" gap={2} mb={5}>
      <StarIcon boxSize={3} color="red.400" />
      <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="gray.500" textTransform="uppercase">
        Team Skill Coverage
      </Text>
    </Flex>

    <Flex direction="column" gap={3}>
      {skills.map((s) => (
        <Box key={s.label}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="12px" color="gray.400">{s.label}</Text>
            <Text fontSize="11px" fontWeight="bold" color={s.pct >= 80 ? 'green.400' : s.pct >= 65 ? 'yellow.400' : 'orange.400'}>
              {s.pct}%
            </Text>
          </Flex>
          <Box h="4px" bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden">
            <Box
              h="100%"
              w={`${s.pct}%`}
              bgGradient={s.pct >= 80 ? 'linear(to-r, green.700, green.400)' : s.pct >= 65 ? 'linear(to-r, yellow.700, yellow.400)' : 'linear(to-r, orange.700, orange.400)'}
              borderRadius="full"
              transition="width 0.6s ease"
            />
          </Box>
        </Box>
      ))}
    </Flex>
  </Box>
);

export default TeamSkillCoverage;
