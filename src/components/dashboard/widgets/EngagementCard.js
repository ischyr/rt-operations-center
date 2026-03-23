import { Box, Flex, Text, Heading, Badge } from '@chakra-ui/react';
import { CalendarIcon, AtSignIcon, InfoIcon } from '@chakra-ui/icons';

const sevColors = { CRITICAL: 'red', HIGH: 'orange', MED: 'yellow', LOW: 'green' };

const statusStyles = {
  'IN PROGRESS': { bg: 'rgba(237,137,54,0.15)', color: 'orange.300', border: 'rgba(237,137,54,0.35)' },
  'REPORTING':   { bg: 'rgba(128,90,213,0.15)', color: 'purple.300', border: 'rgba(128,90,213,0.35)' },
  'PLANNING':    { bg: 'rgba(66,153,225,0.15)',  color: 'blue.300',   border: 'rgba(66,153,225,0.35)'  },
  'COMPLETED':   { bg: 'rgba(72,187,120,0.15)',  color: 'green.300',  border: 'rgba(72,187,120,0.35)'  },
};

const EngagementCard = ({ name, client, started, ends, operators, phase, progress, status, progressGradient, findings, borderColor }) => {
  const ss = statusStyles[status] || statusStyles['IN PROGRESS'];

  return (
    <Box
      pos="relative"
      bg="var(--dash-card-bg)"
      border="1px solid var(--dash-card-border)"
      borderRadius="10px"
      p={5} pl={6}
      overflow="hidden"
    >
      <Box pos="absolute" left="0" top="0" bottom="0" w="3px" bg={borderColor} borderRadius="10px 0 0 10px" />

      <Flex justify="space-between" align="flex-start" mb={1}>
        <Box>
          <Heading fontSize="lg" fontWeight="bold" color="var(--dash-text-primary)">{name}</Heading>
          <Text fontSize="12px" color="var(--dash-text-muted)" mt="2px">{client}</Text>
        </Box>
        <Box
          px={3} py="4px" borderRadius="6px" fontSize="10px" fontWeight="bold"
          letterSpacing="wider" color={ss.color} bg={ss.bg}
          border={`1px solid ${ss.border}`}
          flexShrink={0} ml={3}
        >
          {status}
        </Box>
      </Flex>

      <Flex gap={5} mt={2} mb={4} flexWrap="wrap">
        <Flex align="center" gap={1}>
          <CalendarIcon boxSize={3} color="var(--dash-text-muted)" />
          <Text fontSize="11px" color="var(--dash-text-secondary)">Started {started}</Text>
        </Flex>
        <Flex align="center" gap={1}>
          <CalendarIcon boxSize={3} color="var(--dash-text-muted)" />
          <Text fontSize="11px" color="var(--dash-text-secondary)">Ends {ends}</Text>
        </Flex>
        <Flex align="center" gap={1}>
          <AtSignIcon boxSize={3} color="var(--dash-text-muted)" />
          <Text fontSize="11px" color="var(--dash-text-secondary)">{operators}</Text>
        </Flex>
        <Flex align="center" gap={1}>
          <InfoIcon boxSize={3} color="var(--dash-text-muted)" />
          <Text fontSize="11px" color="var(--dash-text-secondary)">{phase}</Text>
        </Flex>
      </Flex>

      <Flex justify="space-between" align="center" mb={1}>
        <Text fontSize="10px" color="var(--dash-text-muted)" letterSpacing="wider" textTransform="uppercase">
          Overall Progress
        </Text>
        <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-secondary)">{progress}%</Text>
      </Flex>
      <Box h="6px" borderRadius="full" bg="var(--dash-progress-track)" mb={4} overflow="hidden">
        <Box
          h="100%" w={`${progress}%`} borderRadius="full"
          bgGradient={progressGradient}
          transition="width 0.6s ease"
        />
      </Box>

      <Flex gap={2} flexWrap="wrap">
        {findings.map((f) => (
          <Badge
            key={f.sev}
            colorScheme={sevColors[f.sev]}
            variant="subtle"
            fontSize="10px" fontWeight="bold"
            px={2} py="2px" borderRadius="4px"
          >
            {f.count} {f.sev}
          </Badge>
        ))}
      </Flex>
    </Box>
  );
};

export default EngagementCard;
