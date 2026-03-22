import { Box, Stack, Text, Heading, Flex } from '@chakra-ui/react';
import SparkleQuote from '../common/SparkleQuote';

const tags = [
  { label: 'STRUCTURE', color: 'rgba(255,55,55,0.85)',  glow: 'rgba(255,55,55,0.35)',  border: 'rgba(255,55,55,0.4)'  },
  { label: 'PLANNING',  color: 'rgba(210,50,120,0.85)', glow: 'rgba(210,50,120,0.3)',  border: 'rgba(210,50,120,0.4)' },
  { label: 'TACTICS',   color: 'rgba(120,60,200,0.85)', glow: 'rgba(120,60,200,0.3)',  border: 'rgba(120,60,200,0.4)' },
  { label: 'COMMAND',   color: 'rgba(220,100,20,0.85)', glow: 'rgba(220,100,20,0.3)',  border: 'rgba(220,100,20,0.4)' },
];

const LandingHero = () => (
  <Box
    flex="1"
    pos="relative"
    bg="#0f0f0f"
    p={{ base: 8, md: 12 }}
    minH={{ base: '55vh', md: '100vh' }}
    color="white"
  >
    <Stack spacing={5} pt={{ base: 8, md: 16 }}>
      <Text
        fontWeight="black"
        letterSpacing="wider"
        fontSize={{ base: 'sm', md: 'md' }}
        color="red.300"
      >
        RED TEAM OPS CENTER
      </Text>
      <Heading fontSize={{ base: '4xl', md: '6xl' }} lineHeight="short">
        Operations Center
      </Heading>
      <Text fontSize={{ base: 'sm', md: 'lg' }} color="white" maxW="lg">
        A platform that helps red team operators build structure, planning, and execution workflows for
        continuous campaign preparedness and mission excellence.
      </Text>
      <Flex direction="row" wrap="wrap" gap={3}>
        {tags.map((tag) => (
          <Box
            key={tag.label}
            pos="relative"
            px={4}
            py="6px"
            borderRadius="8px"
            bg={tag.color}
            border={`1px solid ${tag.border}`}
            boxShadow={`0 0 14px ${tag.glow}, inset 0 1px 0 rgba(255,255,255,0.12)`}
            fontSize="11px"
            fontWeight="bold"
            letterSpacing="widest"
            color="white"
            overflow="hidden"
            transition="transform 0.2s ease, box-shadow 0.2s ease"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: `0 0 24px ${tag.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}
          >
            {/* Shine sweep */}
            <Box
              pos="absolute" top="0" left="-40%" w="30%" h="100%"
              bgGradient="linear(to-r, transparent, rgba(255,255,255,0.12), transparent)"
              transform="skewX(-20deg)"
              pointerEvents="none"
            />
            {tag.label}
          </Box>
        ))}
      </Flex>
      <SparkleQuote>
        <Text
          mt={{ base: 12, md: 20 }}
          fontSize="sm"
          color="gray.400"
          fontStyle="italic"
          textAlign="center"
          transition="color 0.2s"
          _hover={{ color: 'gray.200' }}
        >
          "Aim for the moon. Even if you miss you will land among the stars..." @ Iulian Schifirnet
        </Text>
      </SparkleQuote>
    </Stack>
  </Box>
);

export default LandingHero;
