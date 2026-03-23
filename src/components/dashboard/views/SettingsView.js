import { Box, Flex, Text, Stack, Switch, Divider, Grid } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useSettings } from '../../../contexts/SettingsContext';

const MotionBox = motion(Box);

// ── Section wrapper ────────────────────────────────────────────────────────
const Section = ({ title, description, children }) => (
  <MotionBox
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: 'easeOut' }}
    bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)"
    borderRadius="16px"
    overflow="hidden"
  >
    <Box px={6} py={4} borderBottom="1px solid var(--dash-divider)">
      <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">{title}</Text>
      {description && (
        <Text fontSize="11px" color="var(--dash-text-muted)" mt={0.5}>{description}</Text>
      )}
    </Box>
    <Box px={6} py={5}>{children}</Box>
  </MotionBox>
);

// ── Option chip (text options) ─────────────────────────────────────────────
const OptionChip = ({ label, subLabel, active, onClick }) => (
  <Box
    as="button"
    onClick={onClick}
    px={4} py={3}
    borderRadius="10px"
    border={active ? '1px solid rgba(255,80,95,0.55)' : '1px solid var(--dash-card-border)'}
    bg={active ? 'rgba(255,80,95,0.1)' : 'var(--dash-card-bg)'}
    cursor="pointer"
    transition="all 0.18s"
    textAlign="left"
    _hover={{ borderColor: 'rgba(255,80,95,0.35)', bg: 'rgba(255,80,95,0.06)' }}
  >
    <Text fontSize="12px" fontWeight="semibold" color={active ? 'white' : 'var(--dash-text-secondary)'}>
      {label}
    </Text>
    {subLabel && (
      <Text fontSize="10px" color="var(--dash-text-muted)" mt={0.5}>{subLabel}</Text>
    )}
    {active && (
      <Box w="16px" h="2px" bgGradient="linear(to-r, red.500, red.400)" borderRadius="full" mt={1.5} />
    )}
  </Box>
);

// ── Theme preview card ─────────────────────────────────────────────────────
const ThemeCard = ({ mode, active, onClick }) => {
  const isDark = mode === 'dark';
  return (
    <Box
      as="button"
      onClick={onClick}
      borderRadius="12px"
      border={active ? '2px solid rgba(255,80,95,0.6)' : '2px solid var(--dash-card-border)'}
      overflow="hidden"
      cursor="pointer"
      transition="all 0.2s"
      boxShadow={active ? '0 0 20px rgba(255,50,50,0.18)' : 'none'}
      _hover={{ borderColor: 'rgba(255,80,95,0.4)' }}
      flex={1}
    >
      {/* Mini UI preview */}
      <Box bg={isDark ? '#181820' : '#f0f0f6'} p={3}>
        {/* Fake topbar */}
        <Flex gap={1} mb={2}>
          <Box flex={1} h="6px" borderRadius="3px" bg={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} />
          <Box w="20px" h="6px" borderRadius="3px" bg="rgba(220,38,38,0.5)" />
        </Flex>
        {/* Fake sidebar + content */}
        <Flex gap={2} h="40px">
          <Box w="28px" h="full" borderRadius="4px" bg={isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)'} />
          <Stack flex={1} spacing={1}>
            <Box h="8px" borderRadius="3px" bg={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
            <Box h="8px" w="70%" borderRadius="3px" bg={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} />
          </Stack>
        </Flex>
      </Box>
      {/* Label */}
      <Box
        bg={isDark ? '#111118' : '#e8e8f0'}
        py={2} px={3}
        borderTop={`1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`}
      >
        <Flex align="center" justify="space-between">
          <Text fontSize="11px" fontWeight="semibold" color={isDark ? '#ccccd8' : '#383848'}>
            {isDark ? 'Dark' : 'Light'}
          </Text>
          {active && (
            <Box w="6px" h="6px" borderRadius="full" bg="red.500" boxShadow="0 0 6px rgba(255,55,55,0.7)" />
          )}
        </Flex>
      </Box>
    </Box>
  );
};

// ── Toggle row ─────────────────────────────────────────────────────────────
const ToggleRow = ({ label, description, checked, onChange, isLast }) => (
  <>
    <Flex align="center" justify="space-between" py={3}>
      <Box>
        <Text fontSize="13px" color="var(--dash-text-primary)" fontWeight="medium">{label}</Text>
        <Text fontSize="11px" color="var(--dash-text-muted)" mt={0.5}>{description}</Text>
      </Box>
      <Switch
        isChecked={checked}
        onChange={(e) => onChange(e.target.checked)}
        colorScheme="red"
        size="md"
      />
    </Flex>
    {!isLast && <Divider borderColor="var(--dash-divider)" />}
  </>
);

// ── Font preview ───────────────────────────────────────────────────────────
const FontPreview = ({ fontFamily, fontSize }) => {
  const fontMap = {
    inter:     "'Inter', sans-serif",
    jetbrains: "'JetBrains Mono', monospace",
    system:    '-apple-system, sans-serif',
  };
  const sizeMap = { sm: '12px', md: '14px', lg: '16px' };

  return (
    <Box
      mt={4} p={4} borderRadius="10px"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      style={{ fontFamily: fontMap[fontFamily], fontSize: sizeMap[fontSize] }}
    >
      <Text color="var(--dash-text-muted)" fontSize="9px" letterSpacing="wider" textTransform="uppercase" mb={2}>
        Preview
      </Text>
      <Text color="var(--dash-text-primary)" fontWeight="semibold" mb={0.5}>
        Red Team Operations Center
      </Text>
      <Text color="var(--dash-text-secondary)">
        Operator dashboard — tactical view active.
      </Text>
      <Text color="var(--dash-text-muted)" fontSize="0.85em" mt={1}>
        0xdeadbeef / ABCDEF12 / nmap -sV -p 443
      </Text>
    </Box>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const SettingsView = () => {
  const { settings, update, reset } = useSettings();

  return (
    <Box maxW="680px" mx="auto">
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        mb={6}
      >
        <Flex align="center" gap={3} mb={1}>
          <Box w="3px" h="24px" bgGradient="linear(to-b, red.500, red.800)" borderRadius="full" />
          <Text fontSize="xl" fontWeight="bold" color="var(--dash-text-primary)">Settings</Text>
        </Flex>
        <Text fontSize="12px" color="var(--dash-text-muted)" pl="15px">
          Customize the look and feel of Red Ops Center.
        </Text>
      </MotionBox>

      <Stack spacing={4}>

        {/* ── Appearance ── */}
        <Section title="Appearance" description="Choose your preferred color scheme">
          <Flex gap={3}>
            <ThemeCard
              mode="dark"
              active={settings.colorMode === 'dark'}
              onClick={() => update('colorMode', 'dark')}
            />
            <ThemeCard
              mode="light"
              active={settings.colorMode === 'light'}
              onClick={() => update('colorMode', 'light')}
            />
          </Flex>
        </Section>

        {/* ── Typography ── */}
        <Section title="Typography" description="Adjust font and text size across the interface">
          <Stack spacing={5}>
            <Box>
              <Text fontSize="11px" color="var(--dash-text-muted)" mb={3} textTransform="uppercase" letterSpacing="wider">
                Font Family
              </Text>
              <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                <OptionChip
                  label="Inter"
                  subLabel="Default"
                  active={settings.fontFamily === 'inter'}
                  onClick={() => update('fontFamily', 'inter')}
                />
                <OptionChip
                  label="JetBrains Mono"
                  subLabel="Monospace"
                  active={settings.fontFamily === 'jetbrains'}
                  onClick={() => update('fontFamily', 'jetbrains')}
                />
                <OptionChip
                  label="System"
                  subLabel="OS default"
                  active={settings.fontFamily === 'system'}
                  onClick={() => update('fontFamily', 'system')}
                />
              </Grid>
            </Box>

            <Box>
              <Text fontSize="11px" color="var(--dash-text-muted)" mb={3} textTransform="uppercase" letterSpacing="wider">
                Font Size
              </Text>
              <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                <OptionChip
                  label="Small"
                  subLabel="12px"
                  active={settings.fontSize === 'sm'}
                  onClick={() => update('fontSize', 'sm')}
                />
                <OptionChip
                  label="Medium"
                  subLabel="14px — default"
                  active={settings.fontSize === 'md'}
                  onClick={() => update('fontSize', 'md')}
                />
                <OptionChip
                  label="Large"
                  subLabel="16px"
                  active={settings.fontSize === 'lg'}
                  onClick={() => update('fontSize', 'lg')}
                />
              </Grid>
            </Box>

            <FontPreview fontFamily={settings.fontFamily} fontSize={settings.fontSize} />
          </Stack>
        </Section>

        {/* ── Interface ── */}
        <Section title="Interface" description="Control layout density and motion">
          <Stack spacing={0}>
            <ToggleRow
              label="Compact Mode"
              description="Reduce sidebar padding and spacing for a denser layout"
              checked={settings.compactMode}
              onChange={(v) => update('compactMode', v)}
            />
            <ToggleRow
              label="Reduced Motion"
              description="Disable animations and transitions across the interface"
              checked={settings.reducedMotion}
              onChange={(v) => update('reducedMotion', v)}
              isLast
            />
          </Stack>
        </Section>

        {/* ── Reset ── */}
        <Flex justify="flex-end">
          <Box
            as="button"
            onClick={reset}
            px={4} py={2} borderRadius="8px"
            border="1px solid var(--dash-card-border)"
            color="var(--dash-text-muted)"
            fontSize="12px"
            cursor="pointer"
            transition="all 0.18s"
            bg="transparent"
            _hover={{ borderColor: 'rgba(255,80,95,0.35)', color: 'red.400' }}
          >
            Reset to defaults
          </Box>
        </Flex>

      </Stack>
    </Box>
  );
};

export default SettingsView;
