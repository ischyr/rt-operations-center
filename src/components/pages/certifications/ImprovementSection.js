import { Stack, Heading, Text, Image } from '@chakra-ui/react';

const ImprovementSection = () => (
  <Stack spacing={4} align="center" textAlign="center">
    <Heading>We're engaged in a race for constant improvement</Heading>
    <Text maxW="820px" fontSize={{ base: 'sm', md: 'md' }} color="#e6e6e6">
      In this time and age, business cybersecurity cannot rely on existing protocols for too long.
      As digital threats are evolving at a fast pace, it's important we ensure the readiness of our
      personnel to identify and respond to new threats. That's why we emphasise learning and constant
      improvement as part of our way of working. This way, we can ensure that our team can help
      organisations set up well-calibrated cybersecurity processes that identify and remediate
      vulnerabilities in IT systems in the most effective manner.
    </Text>
    <Image
      src="/images/splash.jpg"
      alt="Cybersecurity operations"
      w="100%"
      maxW="860px"
      borderRadius="16px"
      mt={4}
    />
  </Stack>
);

export default ImprovementSection;
