import { Box, Flex, Text } from '@chakra-ui/react';

const ACCENT_COLORS = {
  red:    { line: 'rgba(255,80,95,0.85)',  bar: 'rgba(255,80,95,0.85)'  },
  teal:   { line: 'rgba(79,209,197,0.85)', bar: 'rgba(79,209,197,0.85)' },
  orange: { line: 'rgba(246,173,85,0.85)', bar: 'rgba(246,173,85,0.85)' },
  green:  { line: 'rgba(72,187,120,0.85)', bar: 'rgba(72,187,120,0.85)' },
};

const StatCard = ({ label, value, sub, accent = 'red' }) => {
  const { line, bar } = ACCENT_COLORS[accent] || ACCENT_COLORS.red;
  return (
    <Box
      pos="relative"
      bg="var(--dash-card-bg)"
      border="1px solid var(--dash-card-border)"
      borderRadius="14px"
      p={5}
      overflow="hidden"
      transition="transform 0.22s ease, box-shadow 0.22s ease"
      _hover={{ transform: 'translateY(-4px)', boxShadow: `0 8px 28px rgba(0,0,0,0.4), 0 0 0 1px ${line}30` }}
    >
      {/* Gradient accent line */}
      <Box
        pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${line}, transparent)` }}
      />

      {/* Value */}
      <Text fontSize="4xl" fontWeight="black" color="var(--dash-text-primary)" lineHeight="1" mb={1}>
        {value}
      </Text>

      {/* Label with accent bar */}
      <Flex align="center" gap={2} mb={3}>
        <Box w="3px" h="10px" borderRadius="full" bg={bar} flexShrink={0} />
        <Text fontSize="9px" fontWeight="bold" letterSpacing="widest"
          color="var(--dash-text-muted)" textTransform="uppercase">
          {label}
        </Text>
      </Flex>

      <Text fontSize="12px" color="var(--dash-text-secondary)">{sub}</Text>
    </Box>
  );
};

export default StatCard;
