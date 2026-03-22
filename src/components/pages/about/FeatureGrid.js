import { Box, Heading, Text, SimpleGrid, Button, Flex } from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';

const features = [
  {
    number: '01',
    title: 'Comprehensive Red Team Operations',
    text: 'We execute advanced adversary emulation across networks, cloud, and applications to expose real-world risks with clarity.',
  },
  {
    number: '02',
    title: '10+ Years Combined Experience',
    text: 'Our operators are certified professionals (OSCP, CRTO, CEH, ECIH) with diverse backgrounds in offensive and defensive domains.',
  },
  {
    number: '03',
    title: 'Adaptive Methodology',
    text: 'We continuously tune attack frameworks and tooling with lessons learned from the field, ensuring up-to-date tradecraft.',
  },
  {
    number: '04',
    title: 'Risk-Driven Reporting',
    text: 'Actionable executive summaries and technical tracking allow decision-makers to prioritize remediation effectively.',
  },
];

const FeatureGrid = () => (
  <Box width="100%" textAlign="center" overflow="visible">
    <Heading mb={2}>Why choose Red Team Ops Center?</Heading>
    <Text color="gray.500" fontSize="sm" mb={8}>Four pillars that set us apart.</Text>

    <SimpleGrid
      columns={{ base: 1, md: 2, lg: 4 }}
      spacing={5}
      width="100%"
      px={{ base: 2, md: 2 }}
      overflow="visible"
    >
      {features.map((feature) => (
        <Box
          key={feature.title}
          pos="relative"
          p={6}
          minH="230px"
          borderRadius="20px"
          bg="rgba(14,14,18,0.95)"
          border="1px solid rgba(255,80,95,0.2)"
          textAlign="left"
          overflow="hidden"
          transition="transform 0.26s ease, box-shadow 0.26s ease, border-color 0.26s ease"
          _hover={{
            transform: 'translateY(-8px)',
            boxShadow: '0 24px 40px rgba(255,55,55,0.3)',
            borderColor: 'rgba(255,80,95,0.55)',
          }}
        >
          {/* Top accent line */}
          <Box
            pos="absolute"
            top="0" left="0" right="0"
            h="2px"
            bgGradient="linear(to-r, transparent, red.500, transparent)"
            opacity={0.6}
          />

          {/* Number */}
          <Text
            pos="absolute"
            top={3} right={4}
            fontSize="11px"
            fontWeight="bold"
            letterSpacing="widest"
            color="rgba(255,80,95,0.35)"
          >
            {feature.number}
          </Text>

          {/* Subtle corner glow */}
          <Box
            pos="absolute"
            top="-30px" left="-30px"
            w="100px" h="100px"
            borderRadius="full"
            bg="rgba(255,55,55,0.06)"
            filter="blur(20px)"
            pointerEvents="none"
          />

          <Flex direction="column" h="100%" gap={3} pt={2}>
            <Heading size="sm" color="red.200" lineHeight="short">
              {feature.title}
            </Heading>
            <Text fontSize="sm" color="gray.400" lineHeight="tall">
              {feature.text}
            </Text>
          </Flex>
        </Box>
      ))}
    </SimpleGrid>

    {/* Get Started button */}
    <Box mt={12} display="flex" justifyContent="center">
      <Button
        size="lg"
        px={10}
        h="14"
        fontSize="md"
        fontWeight="semibold"
        letterSpacing="wide"
        bgGradient="linear(to-r, red.600, red.500)"
        color="white"
        border="1px solid rgba(255,80,95,0.4)"
        borderRadius="12px"
        boxShadow="0 0 24px rgba(255,55,55,0.25)"
        rightIcon={<ArrowForwardIcon />}
        transition="all 0.25s ease"
        _hover={{
          bgGradient: 'linear(to-r, red.500, red.400)',
          boxShadow: '0 0 40px rgba(255,55,55,0.5)',
          transform: 'translateY(-2px)',
        }}
        _active={{ transform: 'translateY(0px)' }}
      >
        Get Started
      </Button>
    </Box>
  </Box>
);

export default FeatureGrid;
