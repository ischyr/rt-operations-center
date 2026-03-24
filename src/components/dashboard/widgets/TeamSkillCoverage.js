import { Box, Flex, Text } from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const TeamSkillCoverage = () => {
  const { dashboardStats } = useEngagements();
  const navigate = useNavigate();
  const { teamSkills } = dashboardStats;

  return (
    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="12px" p={5}
      transition="transform 0.22s ease, box-shadow 0.22s ease"
      _hover={{ transform: 'translateY(-4px)', boxShadow: '0 8px 28px rgba(0,0,0,0.4)' }}
    >
      <Flex align="center" gap={2} mb={5}>
        <StarIcon boxSize={3} color="red.400" />
        <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)" textTransform="uppercase">
          Team Skill Coverage
        </Text>
      </Flex>

      {teamSkills.length === 0 ? (
        <Flex direction="column" align="center" py={4} gap={1}>
          <Text fontSize="sm" color="var(--dash-text-muted)" textAlign="center">
            No skills tracked yet.
          </Text>
          <Text
            fontSize="11px" color="red.400" cursor="pointer" mt={1}
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate('/dashboard/engagements')}
          >
            Add via an engagement → Team → People & Skills
          </Text>
        </Flex>
      ) : (
        <Flex direction="column" gap={3}>
          {teamSkills.slice(0, 5).map((s) => (
            <Box key={s.label}>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="12px" color="var(--dash-text-secondary)">{s.label}</Text>
                <Text
                  fontSize="11px" fontWeight="bold"
                  color={s.pct >= 80 ? 'green.400' : s.pct >= 60 ? 'yellow.400' : 'orange.400'}
                >
                  {s.pct}%
                </Text>
              </Flex>
              <Box h="4px" bg="var(--dash-progress-track)" borderRadius="full" overflow="hidden">
                <Box
                  h="100%" w={`${s.pct}%`}
                  bgGradient={
                    s.pct >= 80
                      ? 'linear(to-r, green.700, green.400)'
                      : s.pct >= 60
                      ? 'linear(to-r, yellow.700, yellow.400)'
                      : 'linear(to-r, orange.700, orange.400)'
                  }
                  borderRadius="full" transition="width 0.6s ease"
                />
              </Box>
            </Box>
          ))}
        </Flex>
      )}
      {teamSkills.length > 5 && (
        <Text
          fontSize="11px" color="var(--dash-text-muted)" textAlign="center" mt={2}
          cursor="pointer" _hover={{ color: 'red.400' }} transition="color 0.15s"
          onClick={() => navigate('/dashboard/engagements')}
        >
          +{teamSkills.length - 5} more skills — view in People & Skills
        </Text>
      )}
    </Box>
  );
};

export default TeamSkillCoverage;
