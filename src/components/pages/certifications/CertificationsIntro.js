import { Stack, Heading, Text } from '@chakra-ui/react';

const CertificationsIntro = () => (
  <Stack spacing={4} align="center" textAlign="center">
    <Heading>Certifications</Heading>
    <Text maxW="820px" fontSize={{ base: 'sm', md: 'md' }} color="#e6e6e6">
      Our goal is always to be one step ahead of the attackers. That's why all our experts put in the
      extra hours necessary to conduct research, learn and stay up to date with the latest community
      and industry perks. Explore our accreditations below:
    </Text>
  </Stack>
);

export default CertificationsIntro;
