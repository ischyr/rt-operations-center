import { useState } from 'react';
import { Box, Flex, Text, Heading, Stack } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PricingShapes from './pricing/PricingShapes';

const MotionBox = motion(Box);

// ── Data ───────────────────────────────────────────────────────────────────────
const PLANS = {
  individual: [
    {
      id:          'ghost',
      name:        'Ghost',
      tagline:     'For solo operators who need a private, structured space to plan and run personal engagements.',
      price:       '$0',
      period:      'Free forever',
      cta:         'Get started for free',
      ctaVariant:  'outline',
      accent:      '#6ee7b7',
      accentDim:   'rgba(110,231,183,0.1)',
      accentBorder:'rgba(110,231,183,0.25)',
      badge:       null,
      features: [
        '1 operator',
        'Up to 3 active engagements',
        'Full cheatsheet access',
        'Lab Configs & Connectivity',
        'CVE Feed',
        'Diagram Drawing (5 diagrams)',
        'Community support',
      ],
    },
    {
      id:          'operator',
      name:        'Operator',
      tagline:     'For professional red teamers who run multiple engagements and need the full toolkit at their fingertips.',
      price:       '$19',
      period:      'per month',
      cta:         'Get started',
      ctaVariant:  'solid',
      accent:      '#a5b4fc',
      accentDim:   'rgba(165,180,252,0.1)',
      accentBorder:'rgba(165,180,252,0.3)',
      badge:       'MOST POPULAR',
      features: [
        '1 operator',
        'Unlimited engagements',
        'Full cheatsheet & maps access',
        'Lab Configs with deploy commands',
        'CVE Feed + CVE ID search',
        'Diagram Drawing (unlimited)',
        'Malware Analysis (VirusTotal)',
        'Priority support',
      ],
    },
  ],
  team: [
    {
      id:          'cell',
      name:        'Cell',
      tagline:     'For small red teams coordinating operations, sharing intelligence, and managing engagements together.',
      price:       '$49',
      period:      'per operator / month',
      cta:         'Get started',
      ctaVariant:  'outline',
      accent:      '#f6ad55',
      accentDim:   'rgba(246,173,85,0.1)',
      accentBorder:'rgba(246,173,85,0.25)',
      badge:       null,
      features: [
        'Up to 6 operators',
        'Unlimited engagements',
        'Shared engagement workspace',
        'People & Skills tracking',
        'Team resource management',
        'Sock Puppet management',
        'Full cheatsheet & lab access',
        'CVE Feed + Malware Analysis',
        'Diagram Drawing (shared library)',
        'Email support',
      ],
    },
    {
      id:          'unit',
      name:        'Unit',
      tagline:     'For growing red teams that need advanced collaboration, deeper reporting, and client-facing deliverables.',
      price:       '$99',
      period:      'per operator / month',
      cta:         'Get started',
      ctaVariant:  'solid',
      accent:      '#fc8181',
      accentDim:   'rgba(252,129,129,0.1)',
      accentBorder:'rgba(252,129,129,0.3)',
      badge:       'MOST POPULAR',
      features: [
        'Up to 20 operators',
        'Everything in Cell, plus:',
        'Client Portal access',
        'Advanced reporting & findings',
        'TTX Planner & Campaign Builder',
        'C2 & Phishing infrastructure tracking',
        'Activity logs & audit trails',
        'Priority support + onboarding',
      ],
    },
    {
      id:          'command',
      name:        'Command',
      tagline:     'For large organizations and MSSPs running continuous red team programs with custom requirements.',
      price:       'Custom',
      period:      null,
      cta:         'Contact us',
      ctaVariant:  'outline',
      accent:      '#b794f4',
      accentDim:   'rgba(183,148,244,0.1)',
      accentBorder:'rgba(183,148,244,0.25)',
      badge:       null,
      features: [
        'Unlimited operators',
        'Everything in Unit, plus:',
        'Custom integrations',
        'Dedicated instance / self-host',
        'SLA + dedicated support',
        'SSO / SAML',
        'Custom data retention policies',
        'Quarterly strategy sessions',
      ],
    },
  ],
};

// ── Plan card ──────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, index }) => {
  const navigate   = useNavigate();
  const isPopular  = !!plan.badge;
  const isCustom   = plan.price === 'Custom';

  return (
    <MotionBox
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.08 }}
      flex="1"
      minW={{ base: '100%', md: '260px' }}
      maxW={{ md: '360px' }}
      display="flex"
      flexDirection="column"
      pos="relative"
      bg={isPopular ? plan.accentDim : 'rgba(255,255,255,0.02)'}
      border={`1px solid ${isPopular ? plan.accentBorder : 'rgba(255,255,255,0.08)'}`}
      borderRadius="16px"
      overflow="hidden"
      transition="transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease"
      _hover={{
        transform:   'translateY(-6px)',
        boxShadow:   `0 12px 40px rgba(0,0,0,0.5)`,
        borderColor: plan.accentBorder,
      }}
    >
      {/* Top accent line */}
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${plan.accent}, transparent)` }} />

      {/* Popular badge */}
      {plan.badge && (
        <Flex
          pos="absolute" top="14px" right="14px"
          px="8px" py="2px" borderRadius="5px" fontSize="8px"
          fontWeight="black" letterSpacing="widest"
          bg={plan.accentDim} border={`1px solid ${plan.accentBorder}`}
          color={plan.accent}
        >
          {plan.badge}
        </Flex>
      )}

      <Box p={6} flex="1" display="flex" flexDirection="column">
        {/* Plan name + icon */}
        <Flex align="center" gap={3} mb={3}>
          <Flex
            w="38px" h="38px" borderRadius="10px" flexShrink={0}
            bg={plan.accentDim} border={`1px solid ${plan.accentBorder}`}
            align="center" justify="center"
          >
            <Box w="14px" h="14px" borderRadius="3px" bg={plan.accent} opacity={0.9} />
          </Flex>
          <Text fontSize="20px" fontWeight="black" color="white" letterSpacing="tight">
            {plan.name}
          </Text>
        </Flex>

        {/* Tagline */}
        <Text fontSize="12px" color="rgba(255,255,255,0.45)" lineHeight="tall" mb={5} minH="52px">
          {plan.tagline}
        </Text>

        <Box borderTop="1px solid rgba(255,255,255,0.07)" pt={5} mb={5}>
          {/* Price */}
          <Flex align="baseline" gap={2} mb={1}>
            <Text
              fontSize={isCustom ? '36px' : '42px'}
              fontWeight="black"
              color="white"
              lineHeight="1"
              letterSpacing="tight"
            >
              {plan.price}
            </Text>
          </Flex>
          {plan.period && (
            <Text fontSize="11px" color="rgba(255,255,255,0.35)" letterSpacing="wide">
              {plan.period}
            </Text>
          )}
        </Box>

        {/* CTA */}
        <Box
          as="button"
          w="100%" py="11px" borderRadius="10px" fontSize="13px"
          fontWeight="semibold" letterSpacing="wide" mb={6}
          transition="all 0.2s ease"
          bg={plan.ctaVariant === 'solid' ? plan.accent : 'transparent'}
          border={`1.5px solid ${plan.accent}`}
          color={plan.ctaVariant === 'solid' ? '#0a0a0c' : plan.accent}
          _hover={{
            bg:        plan.ctaVariant === 'solid' ? 'white' : plan.accentDim,
            transform: 'translateY(-1px)',
            boxShadow: `0 6px 20px ${plan.accentDim}`,
          }}
          onClick={() => navigate('/register')}
        >
          {plan.cta}
        </Box>

        {/* Divider + features */}
        <Box borderTop="1px solid rgba(255,255,255,0.07)" pt={5}>
          <Text fontSize="10px" fontWeight="bold" letterSpacing="widest"
            color="rgba(255,255,255,0.25)" textTransform="uppercase" mb={3}>
            {plan.features[0].startsWith('Everything') ? '' : 'Plan includes'}
          </Text>
          <Stack spacing={2.5}>
            {plan.features.map((f, i) => (
              <Flex key={i} align="flex-start" gap={2.5}>
                {f.startsWith('Everything') ? (
                  <Text fontSize="12px" color={plan.accent} fontWeight="semibold" lineHeight="tall">
                    {f}
                  </Text>
                ) : (
                  <>
                    <CheckIcon boxSize={2.5} color={plan.accent} mt="3px" flexShrink={0} />
                    <Text fontSize="12px" color="rgba(255,255,255,0.55)" lineHeight="tall">{f}</Text>
                  </>
                )}
              </Flex>
            ))}
          </Stack>
        </Box>
      </Box>
    </MotionBox>
  );
};

// ── Toggle ─────────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <Flex
    align="center" gap={1} p="5px"
    bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
    borderRadius="10px"
  >
    {['individual', 'team'].map((v) => (
      <Box
        key={v}
        as="button"
        px={4} py="6px" borderRadius="7px"
        fontSize="12px" fontWeight="semibold" letterSpacing="wide"
        transition="all 0.2s ease"
        bg={value === v ? 'rgba(255,80,95,0.15)' : 'transparent'}
        border={value === v ? '1px solid rgba(255,80,95,0.35)' : '1px solid transparent'}
        color={value === v ? 'red.400' : 'rgba(255,255,255,0.35)'}
        _hover={{ color: value === v ? 'red.400' : 'rgba(255,255,255,0.6)' }}
        onClick={() => onChange(v)}
      >
        {v === 'individual' ? 'Individual' : 'Team'}
      </Box>
    ))}
  </Flex>
);

// ── Page ───────────────────────────────────────────────────────────────────────
const Pricing = () => {
  const [tab, setTab] = useState('individual');
  const plans = PLANS[tab];

  return (
    <Box pos="relative" w="100%" minH="100vh" py={{ base: 10, md: 16 }} px={{ base: 4, md: 8 }}>
      {/* Background glows */}
      <Box
        pos="absolute" inset="0" zIndex={-1}
        bgImage="radial-gradient(circle at 20% 10%, rgba(255,50,50,0.12), transparent 45%),
                 radial-gradient(circle at 80% 60%, rgba(165,180,252,0.06), transparent 40%)"
      />

      {/* Side shapes */}
      <PricingShapes />

      <Box maxW="1200px" mx="auto">
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          textAlign="center" mb={12}
        >
          <Heading
            fontSize={{ base: '32px', md: '48px', lg: '56px' }}
            fontWeight="black" lineHeight="1.1" mb={3} letterSpacing="tight"
          >
            Plans that work for{' '}
            <Text as="span"
              bgGradient="linear(to-r, red.500, red.300)"
              bgClip="text"
            >
              every operation
            </Text>
          </Heading>
          <Text fontSize={{ base: '14px', md: '16px' }} color="rgba(255,255,255,0.4)"
            maxW="480px" mx="auto" lineHeight="tall" mb={8}>
            From solo ghost ops to full command-level red team programs — pick the plan that fits your mission.
          </Text>
          <Flex justify="center">
            <Toggle value={tab} onChange={setTab} />
          </Flex>
        </MotionBox>

        {/* Cards */}
        <Flex
          gap={5} wrap="wrap" justify="center" align="stretch"
        >
          {plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} />
          ))}
        </Flex>

        {/* Footer note */}
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          textAlign="center" mt={14}
        >
          <Flex
            align="center" justify="center" gap={3} mb={4}
            wrap="wrap"
          >
            {['SOC 2 Ready', 'Self-host option', 'Cancel anytime', '14-day free trial on paid plans'].map((item) => (
              <Flex key={item} align="center" gap={1.5}>
                <CheckIcon boxSize={2.5} color="red.400" />
                <Text fontSize="12px" color="rgba(255,255,255,0.35)">{item}</Text>
              </Flex>
            ))}
          </Flex>
          <Text fontSize="12px" color="rgba(255,255,255,0.2)">
            All plans include Google & GitHub OAuth login · 2FA enforcement · End-to-end encrypted storage
          </Text>
        </MotionBox>
      </Box>
    </Box>
  );
};

export default Pricing;
