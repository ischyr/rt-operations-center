import { Box, Heading, Text } from '@chakra-ui/react';

const StrategicFramework = () => (
  <Box
    width="100%"
    mt={8}
    mb={8}
    p={{ base: 4, md: 6 }}
    borderRadius="24px"
    boxShadow="0 16px 36px rgba(0,0,0,0.4)"
    bg="#131313"
    border="1px solid rgba(255,80,95,0.35)"
    textAlign="center"
  >
    <Heading size="lg" mb={3} color="red.300">Strategic Success Framework</Heading>
    <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.100" maxW="900px" mx="auto">
      We specialize in keeping your company's digital assets and reputation intact through adversary-grade
      simulations, continuous threat detection, and security-aware training.
    </Text>
    <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.300" mt={2} maxW="900px" mx="auto">
      Our tailored operational playbooks ensure you can rapidly recover from incidents while minimizing
      residue and reducing attack surface.
    </Text>
  </Box>
);

export default StrategicFramework;
