import { Box, Text, Heading } from '@chakra-ui/react';

const gradients = {
  red:    'linear(to-r, red.700, red.400)',
  teal:   'linear(to-r, teal.700, teal.400)',
  orange: 'linear(to-r, orange.600, yellow.400)',
  green:  'linear(to-r, green.700, green.400)',
};

const StatCard = ({ label, value, sub, accent = 'red' }) => (
  <Box
    pos="relative"
    bg="rgba(255,255,255,0.03)"
    border="1px solid rgba(255,255,255,0.07)"
    borderRadius="12px"
    p={5}
    overflow="hidden"
  >
    {/* Top accent line */}
    <Box
      pos="absolute" top="0" left="0" right="0" h="2px"
      bgGradient={gradients[accent]}
    />

    <Heading fontSize="4xl" fontWeight="black" color="white" lineHeight="1" mb={1}>
      {value}
    </Heading>
    <Text fontSize="10px" fontWeight="bold" letterSpacing="widest" color="gray.500" textTransform="uppercase" mb={3}>
      {label}
    </Text>
    <Text fontSize="12px" color="gray.400">{sub}</Text>
  </Box>
);

export default StatCard;
