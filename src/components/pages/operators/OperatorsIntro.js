import { Stack, Heading, Text } from '@chakra-ui/react';

const OperatorsIntro = () => (
  <Stack spacing={4} align="center" textAlign="center">
    <Heading>Teamers</Heading>
    <Text maxW="820px" fontSize={{ base: 'sm', md: 'md' }} color="#e6e6e6">
      Each one of them is strong in their tradecraft, always learning, always improving. Our operators
      dedicate countless hours to mastering offensive techniques, keeping their skills sharp and their
      knowledge current. Behind every successful engagement is a driven individual who lives and breathes
      the mission.
    </Text>
  </Stack>
);

export default OperatorsIntro;
