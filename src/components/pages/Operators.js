import { Stack, Heading, Text, SimpleGrid } from '@chakra-ui/react';
import OperatorCard from './operators/OperatorCard';

const teams = ['Wolfpack', 'Nightshade', 'Phantom'];

const Operators = () => (
  <Stack spacing={6}>
    <Heading>Operators</Heading>
    <Text fontSize="lg" color="white">
      Manage squads, assign roles, and benchmark skill paths for SOC/Red Team integration.
    </Text>
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
      {teams.map((team) => (
        <OperatorCard key={team} name={team} />
      ))}
    </SimpleGrid>
  </Stack>
);

export default Operators;
