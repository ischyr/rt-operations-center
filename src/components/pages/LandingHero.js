import { Box, Stack, Text, Heading, Flex } from '@chakra-ui/react';
import SparkleQuote from '../common/SparkleQuote';

const tags = [
  { label: 'STRUCTURE', color: 'rgba(255,55,55,0.85)',  glow: 'rgba(255,55,55,0.35)',  border: 'rgba(255,55,55,0.4)'  },
  { label: 'PLANNING',  color: 'rgba(210,50,120,0.85)', glow: 'rgba(210,50,120,0.3)',  border: 'rgba(210,50,120,0.4)' },
  { label: 'TACTICS',   color: 'rgba(120,60,200,0.85)', glow: 'rgba(120,60,200,0.3)',  border: 'rgba(120,60,200,0.4)' },
  { label: 'COMMAND',   color: 'rgba(220,100,20,0.85)', glow: 'rgba(220,100,20,0.3)',  border: 'rgba(220,100,20,0.4)' },
];

const metrics = [
  { value: '2',   label: 'Active Ops', color: '#FC8181' },
  { value: '3',   label: 'Operators',  color: '#4FD1C5' },
  { value: '45+', label: 'Findings',   color: '#F6AD55' },
  { value: '16',  label: 'Certs',      color: '#9F7AEA' },
];

const features = [
  { title: 'Engagement Lifecycle',     desc: 'Full campaign management from scoping to final report.',     dot: '#FC8181' },
  { title: 'TTPs & Pillaging Library', desc: 'Structured playbooks across Initial Access through Impact.', dot: '#F6AD55' },
  { title: 'Team Coordination',        desc: 'Real-time operator status, skills, and resource tracking.',  dot: '#4FD1C5' },
  { title: '2FA-Secured Access',       desc: 'TOTP enforced on every operator — no session without auth.', dot: '#9F7AEA' },
];

const statusRows = [
  { label: 'Auth Gateway',      status: 'SECURED',    color: '#68D391' },
  { label: 'Evidence Vault',    status: 'ENCRYPTED',  color: '#68D391' },
  { label: 'Operator Registry', status: 'ONLINE',     color: '#68D391' },
  { label: 'TTP Database',      status: '847 entries', color: '#4FD1C5' },
  { label: 'Reporting Engine',  status: 'READY',      color: '#68D391' },
];

const PlatformStatus = () => (
  <Box
    bg="rgba(255,255,255,0.025)"
    border="1px solid rgba(255,255,255,0.07)"
    borderRadius="12px"
    overflow="hidden"
  >
    <Flex
      px={4} py="7px"
      borderBottom="1px solid rgba(255,255,255,0.06)"
      align="center" justify="space-between"
      bg="rgba(0,0,0,0.2)"
    >
      <Text fontSize="9px" fontWeight="bold" letterSpacing="widest" color="gray.600" textTransform="uppercase">
        Platform Status
      </Text>
      <Flex align="center" gap={1.5}>
        <Box w="5px" h="5px" borderRadius="full" bg="green.400"
          boxShadow="0 0 6px rgba(104,211,145,0.7)"
          sx={{ animation: 'hpulse 2s ease-in-out infinite' }} />
        <Text fontSize="8px" fontWeight="bold" color="green.400" letterSpacing="wider">ALL CLEAR</Text>
      </Flex>
    </Flex>
    {statusRows.map((r, i) => (
      <Flex
        key={r.label}
        px={4} py="6px"
        align="center" justify="space-between"
        borderBottom={i < statusRows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
      >
        <Flex align="center" gap={2}>
          <Box w="5px" h="5px" borderRadius="full" bg={r.color} flexShrink={0} />
          <Text fontSize="11px" color="gray.500">{r.label}</Text>
        </Flex>
        <Text fontSize="10px" fontWeight="bold" color={r.color} letterSpacing="wider">{r.status}</Text>
      </Flex>
    ))}
  </Box>
);

const LandingHero = () => (
  <Box
    w={{ base: '100%', md: '52%', xl: '54%' }}
    flexShrink={0}
    pos="relative"
    bg="#0f0f0f"
    h="100vh"
    overflow="hidden"
    color="white"
    display="flex"
    alignItems="center"
    px={{ base: 8, md: 10, lg: 14, xl: 16 }}
    py={{ base: 8, md: 10 }}
  >
    {/* Background glow */}
    <Box
      pos="absolute" top="25%" left="-5%" w="50%" h="35%"
      bg="rgba(255,40,40,0.05)" filter="blur(60px)"
      pointerEvents="none" zIndex={0}
    />

    <Stack spacing={4} pos="relative" zIndex={1} w="100%">

      {/* Eyebrow */}
      <Flex align="center" gap={3}>
        <Box w="24px" h="1.5px" bgGradient="linear(to-r, red.500, red.300)" borderRadius="full" />
        <Text fontWeight="black" letterSpacing="0.2em" fontSize="10px" color="red.400" textTransform="uppercase">
          Red Team Ops Center
        </Text>
        <Box w="24px" h="1.5px" bgGradient="linear(to-l, red.500, red.300)" borderRadius="full" />
      </Flex>

      {/* Main heading */}
      <Box lineHeight="1">
        <Heading
          fontSize={{ base: '5xl', md: '6xl', lg: '7xl' }}
          fontWeight="black" lineHeight="0.92" letterSpacing="-0.02em"
          bgGradient="linear(to-br, #ffffff 0%, #c0c0c0 50%, #8a8a8a 100%)"
          bgClip="text"
          sx={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Operations
        </Heading>
        <Heading
          fontSize={{ base: '5xl', md: '6xl', lg: '7xl' }}
          fontWeight="black" lineHeight="0.92" letterSpacing="-0.02em"
          bgGradient="linear(to-br, red.300 0%, red.500 50%, red.700 100%)"
          bgClip="text"
          sx={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Center
        </Heading>
      </Box>

      {/* Description */}
      <Box pos="relative" maxW="460px">
        <Box pos="absolute" left="-14px" top="0" bottom="0" w="2px"
          bgGradient="linear(to-b, red.600, transparent)" borderRadius="full" />
        <Text fontSize="sm" color="gray.500" lineHeight="tall" pl={2}>
          A platform that helps red team operators build structure, planning, and execution
          workflows for continuous campaign preparedness and mission excellence.
        </Text>
      </Box>

      {/* Tags */}
      <Flex direction="row" wrap="wrap" gap={2}>
        {tags.map((tag) => (
          <Box
            key={tag.label}
            pos="relative" px={3} py="5px" borderRadius="8px"
            bg={tag.color} border={`1px solid ${tag.border}`}
            boxShadow={`0 0 12px ${tag.glow}, inset 0 1px 0 rgba(255,255,255,0.12)`}
            fontSize="10px" fontWeight="bold" letterSpacing="widest" color="white"
            overflow="hidden" transition="transform 0.2s ease, box-shadow 0.2s ease"
            _hover={{ transform: 'translateY(-2px)', boxShadow: `0 0 22px ${tag.glow}` }}
          >
            <Box pos="absolute" top="0" left="-40%" w="30%" h="100%"
              bgGradient="linear(to-r, transparent, rgba(255,255,255,0.12), transparent)"
              transform="skewX(-20deg)" pointerEvents="none" />
            {tag.label}
          </Box>
        ))}
      </Flex>

      {/* Metrics strip */}
      <Flex gap={2} flexWrap="wrap">
        {metrics.map((m) => (
          <Flex
            key={m.label} align="center" gap={2}
            px={3} py="6px" borderRadius="8px"
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
          >
            <Box w="5px" h="5px" borderRadius="full" bg={m.color} boxShadow={`0 0 5px ${m.color}`} />
            <Text fontSize="13px" fontWeight="black" color="white">{m.value}</Text>
            <Text fontSize="9px" color="gray.600" textTransform="uppercase" letterSpacing="wider">{m.label}</Text>
          </Flex>
        ))}
      </Flex>

      {/* Features — only on large screens */}
      <Box display={{ base: 'none', lg: 'block' }}>
        <Stack spacing={2}>
          {features.map((f) => (
            <Flex key={f.title} align="flex-start" gap={3}>
              <Box w="5px" h="5px" borderRadius="full" bg={f.dot} mt="5px" flexShrink={0}
                boxShadow={`0 0 7px ${f.dot}`} />
              <Text fontSize="11px" color="gray.500" lineHeight="short">
                <Box as="span" color="gray.300" fontWeight="semibold">{f.title}</Box>
                {' '}— {f.desc}
              </Text>
            </Flex>
          ))}
        </Stack>
      </Box>

      {/* Platform status — only xl AND tall viewports */}
      <Box
        display={{ base: 'none', xl: 'block' }}
        sx={{ '@media (max-height: 820px)': { display: 'none' } }}
      >
        <PlatformStatus />
      </Box>

      {/* Quote */}
      <Box pt={1}>
        <SparkleQuote>
          <Text
            fontSize="xs" color="gray.700" fontStyle="italic"
            transition="color 0.2s" _hover={{ color: 'gray.400' }}
          >
            "Aim for the moon. Even if you miss you will land among the stars..." @ Iulian Schifirnet
          </Text>
        </SparkleQuote>
      </Box>

    </Stack>

    <style>{`
      @keyframes hpulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }
    `}</style>
  </Box>
);

export default LandingHero;
