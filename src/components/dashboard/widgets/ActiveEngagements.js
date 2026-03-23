import { Box, Flex, Text } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import EngagementCard from './EngagementCard';

const engagements = [
  {
    name: 'Operation Nightfall',
    client: 'Nexus Financial Group · External + Internal',
    started: 'Feb 15', ends: 'Mar 28',
    operators: 'Iulian, Andrei, Kelyan',
    phase: 'Lateral Movement',
    progress: 62,
    status: 'IN PROGRESS',
    progressGradient: 'linear(to-r, red.700, pink.400)',
    borderColor: '#e53e3e',
    findings: [
      { sev: 'CRITICAL', count: 3 },
      { sev: 'HIGH',     count: 5 },
      { sev: 'MED',      count: 7 },
      { sev: 'LOW',      count: 3 },
    ],
  },
  {
    name: 'Operation Specter',
    client: 'MedCore Health Systems · Full Scope',
    started: 'Jan 20', ends: 'Mar 25',
    operators: 'Andrei, Kelyan',
    phase: 'Final Report',
    progress: 88,
    status: 'REPORTING',
    progressGradient: 'linear(to-r, purple.700, purple.400)',
    borderColor: '#805ad5',
    findings: [
      { sev: 'CRITICAL', count: 4  },
      { sev: 'HIGH',     count: 8  },
      { sev: 'MED',      count: 10 },
      { sev: 'LOW',      count: 5  },
    ],
  },
];

const ActiveEngagements = () => (
  <Box
    bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)"
    borderRadius="12px"
    p={5}
    h="100%"
  >
    <Flex align="center" gap={2} mb={5}>
      <WarningIcon boxSize={3} color="red.500" />
      <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)" textTransform="uppercase">
        Active Engagements
      </Text>
    </Flex>
    <Flex direction="column" gap={4}>
      {engagements.map((e) => (
        <EngagementCard key={e.name} {...e} />
      ))}
    </Flex>
  </Box>
);

export default ActiveEngagements;
