import { Box, Flex, Text, Heading, Grid, SimpleGrid } from '@chakra-ui/react';
import StatCard from '../widgets/StatCard';
import ActiveEngagements from '../widgets/ActiveEngagements';
import FindingsBreakdown from '../widgets/FindingsBreakdown';
import ResourceUtilization from '../widgets/ResourceUtilization';
import RecentActivity from '../widgets/RecentActivity';
import TeamSkillCoverage from '../widgets/TeamSkillCoverage';

const stats = [
  { label: 'Active Engagements', value: '2',  sub: '1 closing in 3 days',        accent: 'red'    },
  { label: 'Team Members',       value: '3',  sub: '3 deployed · 0 on standby',  accent: 'teal'   },
  { label: 'Total Findings',     value: '45', sub: '7 Critical · 13 High',        accent: 'orange' },
  { label: 'Active Beacons',     value: '4',  sub: 'All C2 healthy',              accent: 'green'  },
];

const now = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const DashboardView = () => (
  <Box pb={8}>
    {/* Page header */}
    <Flex justify="space-between" align="center" mb={6}>
      <Box>
        <Heading fontSize="2xl" fontWeight="bold" color="white">
          Operations{' '}
          <Text as="span" color="red.400">Overview</Text>
        </Heading>
        <Flex align="center" gap={3} mt={1}>
          <Text fontSize="12px" color="gray.500">{now}</Text>
          <Text fontSize="12px" color="gray.700">·</Text>
          <Text fontSize="12px" color="gray.500">2 active engagements</Text>
          <Text fontSize="12px" color="gray.700">·</Text>
          <Text fontSize="12px" color="green.400">All systems nominal</Text>
        </Flex>
      </Box>

      {/* LIVE badge */}
      <Flex
        align="center" gap={2} px={3} py="6px"
        bg="rgba(72,187,120,0.1)" border="1px solid rgba(72,187,120,0.25)"
        borderRadius="8px"
      >
        <Box
          w="7px" h="7px" borderRadius="full" bg="green.400"
          sx={{ animation: 'pulse 1.5s ease-in-out infinite' }}
        />
        <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="green.400">LIVE</Text>
      </Flex>
    </Flex>

    {/* Stat cards */}
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={5}>
      {stats.map((s) => <StatCard key={s.label} {...s} />)}
    </SimpleGrid>

    {/* Main grid — engagements left, findings + resources right */}
    <Grid templateColumns={{ base: '1fr', xl: '1fr 320px' }} gap={4} mb={4}>
      <ActiveEngagements />
      <Flex direction="column" gap={4}>
        <FindingsBreakdown />
        <ResourceUtilization />
      </Flex>
    </Grid>

    {/* Bottom row */}
    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
      <RecentActivity />
      <TeamSkillCoverage />
    </Grid>

    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.4; }
      }
    `}</style>
  </Box>
);

export default DashboardView;
