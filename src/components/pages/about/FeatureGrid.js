import { Box, Heading, Text, SimpleGrid, Button } from '@chakra-ui/react';

const features = [
  {
    title: 'Comprehensive Red Team Operations',
    text: 'We execute advanced adversary emulation across networks, cloud, and applications to expose real-world risks with clarity.',
  },
  {
    title: '10+ Years Combined Experience',
    text: 'Our operators are certified professionals (OSCP, CRTO, CEH, ECIH) with diverse backgrounds in offensive and defensive domains.',
  },
  {
    title: 'Adaptive Methodology',
    text: 'We continuously tune attack frameworks and tooling with lessons learned from the field, ensuring up-to-date tradecraft.',
  },
  {
    title: 'Risk-Driven Reporting',
    text: 'Actionable executive summaries and technical tracking allow decision-makers to prioritize remediation effectively.',
  },
];

const FeatureGrid = () => (
  <Box width="100%" textAlign="center">
    <Heading mb={6}>Why choose Red Team Ops Center?</Heading>
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} width="100%" px={{ base: 2, md: 0 }}>
      {features.map((feature) => (
        <Box
          key={feature.title}
          p={4}
          minH="210px"
          borderRadius="20px"
          bg="rgba(18,20,25,0.9)"
          border="1px solid rgba(255,80,95,0.35)"
          transition="transform 0.24s ease, box-shadow 0.24s ease"
          _hover={{ transform: 'translateY(-6px)', boxShadow: '0 18px 28px rgba(255, 55, 55, 0.45)' }}
        >
          <Heading size="md" color="red.200" mb={2}>{feature.title}</Heading>
          <Text fontSize="sm" color="gray.300">{feature.text}</Text>
        </Box>
      ))}
    </SimpleGrid>
    <Button
      colorScheme="red"
      size="lg"
      mt={8}
      w={{ base: '100%', md: '320px' }}
      h="16"
      fontSize="lg"
      border="1px solid rgba(255,80,95,0.45)"
      _hover={{ bg: 'red.600', transform: 'scale(1.03)' }}
    >
      Get Started
    </Button>
  </Box>
);

export default FeatureGrid;
