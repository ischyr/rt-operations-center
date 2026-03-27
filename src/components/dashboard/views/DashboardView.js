import { Box, Flex, Text, Heading, Grid, SimpleGrid } from '@chakra-ui/react';
import StatCard from '../widgets/StatCard';
import ActiveEngagements from '../widgets/ActiveEngagements';
import FindingsBreakdown from '../widgets/FindingsBreakdown';
import ResourceUtilization from '../widgets/ResourceUtilization';
import RecentActivity from '../widgets/RecentActivity';
import TeamSkillCoverage from '../widgets/TeamSkillCoverage';
import { useEngagements } from '../../../contexts/EngagementContext';

const now = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const DashboardView = () => {
  const { dashboardStats } = useEngagements();
  const {
    activeCount,
    soonestClosing,
    daysToClose,
    totalFindings,
    findingsBySeverity,
    deployedOperators,
    standbyOperators,
  } = dashboardStats;

  const closingSub = soonestClosing
    ? daysToClose < 0
      ? `${soonestClosing.name.split(' ').slice(-1)[0]} overdue by ${Math.abs(daysToClose)}d`
      : daysToClose === 0
      ? `${soonestClosing.name.split(' ').slice(-1)[0]} due today`
      : `1 closing in ${daysToClose} day${daysToClose !== 1 ? 's' : ''}`
    : activeCount > 0 ? 'No deadlines set' : 'No active operations';

  const critical = findingsBySeverity['Critical'] || 0;
  const high     = findingsBySeverity['High']     || 0;
  const findingsSub = totalFindings === 0
    ? 'No findings logged'
    : `${critical} Critical · ${high} High`;

  const stats = [
    {
      label:  'Active Engagements',
      value:  String(activeCount),
      sub:    closingSub,
      accent: 'red',
    },
    {
      label:  'Team Members',
      value:  String(deployedOperators.length + standbyOperators.length),
      sub:    deployedOperators.length + standbyOperators.length === 0
        ? 'No operators registered'
        : `${deployedOperators.length} deployed · ${standbyOperators.length} on standby`,
      accent: 'teal',
    },
    {
      label:  'Total Findings',
      value:  String(totalFindings),
      sub:    findingsSub,
      accent: 'orange',
    },
  ];

  return (
    <Box pb={8}>
      {/* Page header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            Operations{' '}
            <Text as="span" color="red.400">Overview</Text>
          </Heading>
          <Flex align="center" gap={3} mt={1}>
            <Text fontSize="12px" color="var(--dash-text-secondary)">{now}</Text>
            <Text fontSize="12px" color="var(--dash-text-muted)">·</Text>
            <Text fontSize="12px" color="var(--dash-text-secondary)">
              {activeCount} active engagement{activeCount !== 1 ? 's' : ''}
            </Text>
            <Text fontSize="12px" color="var(--dash-text-muted)">·</Text>
            <Text fontSize="12px" color="green.400">All systems nominal</Text>
          </Flex>
        </Box>

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
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={5}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </SimpleGrid>

      {/* Main grid */}
      <Grid templateColumns={{ base: '1fr', xl: '1fr 320px' }} gap={4} mb={4} alignItems="stretch">
        <ActiveEngagements />
        <Flex direction="column" gap={4} h="100%">
          <FindingsBreakdown />
          <ResourceUtilization flex={1} minH={0} />
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
};

export default DashboardView;
