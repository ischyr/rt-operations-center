import { Box, Flex, Text } from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';

const typeColors = {
  finding:   '#FC8181',
  beacon:    '#4FD1C5',
  milestone: '#F6AD55',
  report:    '#9F7AEA',
  phishing:  '#F6E05E',
};

const activities = [
  { time: '14:32',     text: 'Nightfall · New finding logged: SQLi on /api/v2/users', type: 'finding'   },
  { time: '13:15',     text: 'Specter · C2 beacon checked in from 10.0.2.4',           type: 'beacon'    },
  { time: '11:44',     text: 'Nightfall · Lateral movement to DC-01 successful',        type: 'milestone' },
  { time: '09:20',     text: 'Specter · Final report draft uploaded',                   type: 'report'    },
  { time: 'Yesterday', text: 'Nightfall · Phishing campaign: 38/50 opened',             type: 'phishing'  },
];

const RecentActivity = () => (
  <Box
    bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)"
    borderRadius="12px"
    p={5}
  >
    <Flex align="center" gap={2} mb={5}>
      <RepeatIcon boxSize={3} color="red.400" />
      <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)" textTransform="uppercase">
        Recent Activity
      </Text>
    </Flex>

    <Flex direction="column" gap={3}>
      {activities.map((a, i) => (
        <Flex key={i} align="flex-start" gap={3}>
          <Box
            w="6px" h="6px" borderRadius="full" mt="5px" flexShrink={0}
            bg={typeColors[a.type]}
            boxShadow={`0 0 6px ${typeColors[a.type]}`}
          />
          <Box flex="1">
            <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="short">{a.text}</Text>
            <Text fontSize="10px" color="var(--dash-text-muted)" mt="2px">{a.time}</Text>
          </Box>
        </Flex>
      ))}
    </Flex>
  </Box>
);

export default RecentActivity;
