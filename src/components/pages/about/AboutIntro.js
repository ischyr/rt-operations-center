import { Stack, Heading, Text } from '@chakra-ui/react';

const AboutIntro = () => (
  <Stack spacing={4} align="center" textAlign="center">
    <Heading>About us</Heading>
    <Text maxW="820px" fontSize={{ base: 'sm', md: 'md' }} color="#e6e6e6">
      We are a team of dedicated red team operators and cybersecurity professionals, continuously training
      and refining our skills to stay ahead of evolving threats. We actively develop and test new tradecraft,
      techniques, and methodologies to simulate real-world adversaries with precision. Through our extensive
      portfolio of services—including Penetration Testing, Incident Response, Cloud Security Assessments,
      OSINT Investigations, Security Hardening, Training, and Security Awareness—we help organizations
      strengthen their defenses and elevate their overall security posture.
    </Text>
    <Text maxW="900px" fontSize={{ base: 'sm', md: 'md' }} color="gray.300" px={{ base: 2, md: 0 }}>
      Our deep expertise is built on a culture of constant improvement and collaborative war-game preparation.
      We deliver practical outcomes and a resilient security posture for every client.
    </Text>
  </Stack>
);

export default AboutIntro;
