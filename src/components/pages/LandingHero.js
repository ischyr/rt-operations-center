import { Box, Stack, Text, Heading, Badge } from '@chakra-ui/react';

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
      <Stack direction="row" spacing={3} wrap="wrap">
        <Badge colorScheme="red" variant="solid">STRUCTURE</Badge>
        <Badge colorScheme="pink" variant="solid">PLANNING</Badge>
        <Badge colorScheme="purple" variant="solid">TACTICS</Badge>
        <Badge colorScheme="orange" variant="solid">COMMAND</Badge>
      </Stack>
      <Text
        mt={{ base: 12, md: 20 }}
        fontSize="sm"
        color="gray.400"
        fontStyle="italic"
        textAlign="center"
      >
        "Aim for the moon. Even if you miss you will land among the stars..." @ Iulian Schifirnet
      </Text>
    </Stack>
  </Box>
);

export default LandingHero;
