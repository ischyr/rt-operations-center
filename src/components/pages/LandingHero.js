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
    <Stack spacing={6} pt={{ base: 8, md: 16 }}>

      {/* Eyebrow */}
      <Flex align="center" gap={3}>
        <Box w="28px" h="1.5px" bgGradient="linear(to-r, red.500, red.300)" borderRadius="full" />
        <Text
          fontWeight="black"
          letterSpacing="0.2em"
          fontSize="11px"
          color="red.400"
          textTransform="uppercase"
        >
          Red Team Ops Center
        </Text>
        <Box w="28px" h="1.5px" bgGradient="linear(to-l, red.500, red.300)" borderRadius="full" />
      </Flex>

      {/* Main heading */}
      <Box pos="relative">
        <Heading
          fontSize={{ base: '5xl', md: '7xl' }}
          fontWeight="black"
          lineHeight="0.95"
          letterSpacing="-0.02em"
          bgGradient="linear(to-br, #ffffff 0%, #c0c0c0 50%, #8a8a8a 100%)"
          bgClip="text"
          sx={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Operations
        </Heading>
        <Heading
          fontSize={{ base: '5xl', md: '7xl' }}
          fontWeight="black"
          lineHeight="0.95"
          letterSpacing="-0.02em"
          bgGradient="linear(to-br, red.300 0%, red.500 50%, red.700 100%)"
          bgClip="text"
          sx={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Center
        </Heading>
        {/* Subtle glow behind heading */}
        <Box
          pos="absolute"
          top="30%" left="-10%"
          w="60%" h="40%"
          bg="rgba(255,40,40,0.07)"
          filter="blur(40px)"
          pointerEvents="none"
          zIndex={-1}
        />
      </Box>

      {/* Description */}
      <Box pos="relative" maxW="420px">
        <Box
          pos="absolute" left="-16px" top="0" bottom="0"
          w="2px"
          bgGradient="linear(to-b, red.600, transparent)"
          borderRadius="full"
        />
        <Text
          fontSize={{ base: 'sm', md: 'md' }}
          color="gray.400"
          lineHeight="tall"
          pl={2}
        >
          A platform that helps red team operators build structure, planning, and execution workflows for
          continuous campaign preparedness and mission excellence.
        </Text>
      </Box>
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
