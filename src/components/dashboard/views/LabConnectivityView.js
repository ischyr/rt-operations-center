import { Box, Flex, Text, Heading, SimpleGrid, Divider } from '@chakra-ui/react';
import { CheckIcon, ExternalLinkIcon, EmailIcon, UnlockIcon, LinkIcon } from '@chakra-ui/icons';

// ── Platform download cards ────────────────────────────────────────────────────
const PLATFORMS = [
  {
    name: 'Windows',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
      </svg>
    ),
  },
  {
    name: 'macOS',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
      </svg>
    ),
  },
  {
    name: 'Linux',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.893.patch.048.773l.012.072c.015.074.138.726.364 1.228.135.3.365.455.63.455h.876c.148 0 .28-.05.38-.155.207-.22.238-.566.22-.85l-.016-.218c-.042-.606-.122-1.756-.032-2.16.12-.568.27-1.066.449-1.525.239-.61.567-1.173.888-1.803.67-1.275 1.27-2.681 1.272-4.32-.003-1.617-.608-3.26-1.41-4.77-.804-1.509-1.74-2.919-1.906-4.226-.116-.888-.003-1.727.41-2.394.412-.666 1.09-1.158 2.083-1.412.996-.254 2.278-.165 3.832.28 1.554.444 3.084 1.274 4.294 2.367 1.21 1.093 2.085 2.449 2.266 3.978.181 1.53-.228 3.19-.993 4.66-.765 1.47-1.784 2.753-2.56 4.037-.777 1.284-1.31 2.57-1.31 3.857 0 .35.026.7.083 1.047.058.348.145.694.27 1.038.248.69.637 1.38.637 1.38l.012.021.012.012c.172.3.451.497.785.497h.877c.266 0 .493-.107.645-.305.15-.2.194-.455.162-.703-.083-.62-.1-1.33-.059-1.904.063-.878.22-1.583.499-2.275.278-.692.655-1.37 1.076-2.14.844-1.539 1.77-3.37 1.77-5.667 0-1.667-.426-3.367-1.15-4.87-.723-1.503-1.748-2.809-2.888-3.826-2.28-2.034-4.87-3.063-6.979-3.063zM12 5.386l.002.001c.11.01.23.024.348.048.614.13.903.463.903.98 0 .538-.335.94-.99 1.172-.655.233-1.43.213-1.953-.133-.522-.346-.658-.934-.42-1.44.238-.505.82-.66 1.338-.628l.772 0zm-.637 7.516c.38.046.743.216 1.007.52.265.304.378.712.288 1.075-.09.363-.36.663-.73.803-.37.14-.793.105-1.1-.098-.307-.202-.47-.55-.435-.895.036-.344.226-.66.502-.866.278-.207.616-.289.948-.258l.52-.281zm.637 3.098l.002.002c.26.028.517.16.71.39.192.23.272.538.22.835-.053.296-.22.558-.466.712-.246.153-.55.186-.824.09-.273-.097-.487-.318-.572-.582-.086-.264-.036-.552.13-.77.167-.217.41-.346.666-.389.076-.013.152-.018.134-.288z"/>
      </svg>
    ),
  },
  {
    name: 'iOS',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    name: 'Android',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.523 15.341c-.457 0-.829.373-.829.83 0 .458.372.83.83.83.457 0 .829-.372.829-.83 0-.457-.372-.83-.83-.83zm-11.046 0c-.458 0-.83.373-.83.83 0 .458.372.83.83.83.457 0 .828-.372.828-.83 0-.457-.371-.83-.828-.83zM17.69 9.535l1.73-3.003a.36.36 0 00-.132-.492.361.361 0 00-.492.132l-1.752 3.036C15.678 8.566 13.937 8.2 12 8.2c-1.937 0-3.678.366-5.044 1.008L5.204 6.172a.36.36 0 00-.492-.132.36.36 0 00-.132.492l1.73 3.003C3.982 10.78 2.71 12.537 2.71 14.5v.362h18.58V14.5c0-1.963-1.272-3.72-3.6-4.965z"/>
      </svg>
    ),
  },
  {
    name: 'Chrome',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 10.545a1.455 1.455 0 1 0 0 2.91 1.455 1.455 0 0 0 0-2.91z"/>
      </svg>
    ),
  },
];

// ── Step component ─────────────────────────────────────────────────────────────
const Step = ({ number, title, children }) => (
  <Box mb={8}>
    <Flex align="center" gap={3} mb={4}>
      <Flex
        w="32px" h="32px" borderRadius="full" flexShrink={0}
        bg="rgba(255,80,95,0.15)" border="1px solid rgba(255,80,95,0.35)"
        align="center" justify="center"
      >
        <Text fontSize="12px" fontWeight="black" color="red.400">{number}</Text>
      </Flex>
      <Text fontSize="15px" fontWeight="bold" color="var(--dash-text-primary)">{title}</Text>
    </Flex>
    <Box pl="44px">{children}</Box>
  </Box>
);

// ── Info box ───────────────────────────────────────────────────────────────────
const InfoBox = ({ color = '#a5b4fc', children }) => (
  <Box
    px={4} py={3} borderRadius="10px" mb={4}
    bg={`${color}0f`} border={`1px solid ${color}30`}
  >
    <Text fontSize="12px" color={`${color}cc`} lineHeight="tall">{children}</Text>
  </Box>
);

// ── Invite email mock ──────────────────────────────────────────────────────────
const InviteEmailMock = () => (
  <Box
    border="1px solid rgba(255,255,255,0.1)" borderRadius="12px"
    overflow="hidden" maxW="480px" mb={4}
  >
    <Box bg="rgba(255,255,255,0.04)" px={4} py={3} borderBottom="1px solid rgba(255,255,255,0.08)">
      <Flex align="center" gap={2}>
        <EmailIcon boxSize={3} color="var(--dash-text-muted)" />
        <Text fontSize="11px" color="var(--dash-text-muted)">From: noreply@twingate.com</Text>
      </Flex>
      <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-secondary)" mt={1}>
        Subject: You've been invited to join a Twingate network
      </Text>
    </Box>
    <Box px={5} py={4} bg="rgba(255,255,255,0.02)">
      <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)" mb={2}>
        <Text as="span" color="red.400">Iulian</Text> invited you to the homelab network
      </Text>
      <Text fontSize="12px" color="var(--dash-text-secondary)" mb={4} lineHeight="tall">
        Accept Iulian's invite to get started with Twingate and connect to the lab environment.
      </Text>
      <Divider borderColor="rgba(255,255,255,0.08)" mb={4} />
      <Text fontSize="10px" color="var(--dash-text-muted)" mb={1} textTransform="uppercase" letterSpacing="wider">
        Network Name
      </Text>
      <Box
        px={3} py="6px" borderRadius="8px" mb={4}
        bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
        display="inline-block"
      >
        <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">0xd1shomelab</Text>
      </Box>
      <Box>
        <Box
          px={4} py={2} borderRadius="8px" display="inline-block"
          bg="rgba(255,80,95,0.15)" border="1px solid rgba(255,80,95,0.3)"
        >
          <Text fontSize="12px" fontWeight="bold" color="red.300">Accept Invitation →</Text>
        </Box>
      </Box>
    </Box>
  </Box>
);

// ── Status confirmed card ──────────────────────────────────────────────────────
const StatusCard = () => (
  <Box
    maxW="540px" border="1px solid rgba(255,255,255,0.08)" borderRadius="12px"
    overflow="hidden" mb={4}
  >
    <Box px={4} py={3} bg="rgba(255,255,255,0.04)" borderBottom="1px solid rgba(255,255,255,0.08)">
      <Flex gap={6}>
        {['Users', 'Groups', 'Services'].map((t, i) => (
          <Text key={t} fontSize="12px" fontWeight={i === 0 ? 'bold' : 'normal'}
            color={i === 0 ? 'var(--dash-text-primary)' : 'var(--dash-text-muted)'}
            borderBottom={i === 0 ? '2px solid' : 'none'}
            borderColor="red.400" pb={1} cursor="pointer">
            {t}
          </Text>
        ))}
      </Flex>
    </Box>
    <Box px={4} py={3}>
      {/* Header row */}
      <Flex gap={3} mb={2} px={1}>
        {['User', 'Email', 'Status'].map((h) => (
          <Text key={h} fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
            letterSpacing="wider" flex={h === 'Email' ? '2' : '1'}>
            {h}
          </Text>
        ))}
      </Flex>
      <Divider borderColor="rgba(255,255,255,0.08)" mb={2} />
      {/* Row */}
      <Flex align="center" gap={3} py={2} px={1}>
        <Flex align="center" gap={2} flex="1">
          <Box w="22px" h="22px" borderRadius="full" bg="rgba(255,80,95,0.2)"
            border="1px solid rgba(255,80,95,0.35)"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="9px" fontWeight="bold" color="red.300">
            KY
          </Box>
          <Text fontSize="12px" color="var(--dash-text-primary)" fontWeight="semibold">Kelyan Yesil</Text>
        </Flex>
        <Text fontSize="11px" color="var(--dash-text-secondary)" flex="2">kelyany28@gmail.com</Text>
        <Flex align="center" gap={1} flex="1">
          <Box w="5px" h="5px" borderRadius="full" bg="green.400"
            boxShadow="0 0 5px rgba(72,187,120,0.8)" />
          <Text fontSize="11px" color="green.400" fontWeight="semibold">Enabled</Text>
        </Flex>
      </Flex>
    </Box>
  </Box>
);

// ── Main view ──────────────────────────────────────────────────────────────────
const LabConnectivityView = () => (
  <Box pb={8}>
    {/* Header */}
    <Flex justify="space-between" align="flex-start" mb={6}>
      <Box>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
          Lab <Text as="span" color="red.400">Connectivity</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          Step-by-step guide to connect to the homelab via Twingate VPN
        </Text>
      </Box>
      <Flex align="center" gap={2} px={3} py="6px"
        bg="rgba(104,211,145,0.08)" border="1px solid rgba(104,211,145,0.2)" borderRadius="8px">
        <Box w="6px" h="6px" borderRadius="full" bg="green.400"
          boxShadow="0 0 6px rgba(72,187,120,0.7)" />
        <Text fontSize="11px" color="green.300" fontWeight="semibold">Network Online</Text>
      </Flex>
    </Flex>

    <Box
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="14px" p={6}
    >

      {/* ── Step 1 ── */}
      <Step number="1" title="Download & Install Twingate VPN">
        <InfoBox>
          Twingate is a zero-trust network access client used to securely tunnel into the homelab.
          Download the appropriate client for your operating system from the official Twingate website.
        </InfoBox>

        <Text fontSize="11px" color="var(--dash-text-muted)" textTransform="uppercase"
          letterSpacing="wider" mb={3} fontWeight="semibold">
          Download for your platform
        </Text>

        <SimpleGrid columns={{ base: 3, md: 6 }} spacing={3} mb={4}>
          {PLATFORMS.map((p) => (
            <Flex
              key={p.name} direction="column" align="center" gap={2}
              px={3} py={4} borderRadius="12px"
              bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
              cursor="pointer" transition="all 0.18s"
              _hover={{ bg: 'rgba(255,80,95,0.08)', borderColor: 'rgba(255,80,95,0.25)', transform: 'translateY(-2px)' }}
              onClick={() => window.open('https://www.twingate.com/download', '_blank')}
            >
              <Box color="var(--dash-text-secondary)">{p.icon}</Box>
              <Text fontSize="11px" color="var(--dash-text-secondary)" fontWeight="semibold">{p.name}</Text>
            </Flex>
          ))}
        </SimpleGrid>

        <Flex
          align="center" gap={2} px={3} py={2} borderRadius="8px" display="inline-flex"
          bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
          cursor="pointer"
          onClick={() => window.open('https://www.twingate.com/download', '_blank')}
          _hover={{ bg: 'rgba(255,255,255,0.07)' }}
          transition="all 0.18s"
        >
          <ExternalLinkIcon boxSize={3} color="var(--dash-text-muted)" />
          <Text fontSize="11px" color="var(--dash-text-secondary)">twingate.com/download</Text>
        </Flex>
      </Step>

      <Divider borderColor="var(--dash-divider)" mb={8} />

      {/* ── Step 2 ── */}
      <Step number="2" title="Create a Twingate Account">
        <InfoBox>
          Once the client is installed, launch Twingate and sign up for a free account at{' '}
          <Text as="span" color="rgba(165,180,252,0.9)" fontWeight="semibold">app.twingate.com</Text>.
          You can register with Google, Microsoft, or a standard email address.
          A personal account is sufficient — no paid plan is required.
        </InfoBox>
      </Step>

      <Divider borderColor="var(--dash-divider)" mb={8} />

      {/* ── Step 3 ── */}
      <Step number="3" title="Request & Accept a Network Invitation">
        <InfoBox color="#f6ad55">
          Contact <Text as="span" fontWeight="bold">Iulian</Text> to receive an invitation to the Twingate network.
          An invite link will be sent to your registered email address. The invitation will appear as follows:
        </InfoBox>

        <InviteEmailMock />

        <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="tall">
          Open the invite link in your browser, review the network name, and click{' '}
          <Text as="span" fontWeight="semibold" color="red.300">Accept Invitation</Text>.
          This will associate your Twingate account with the homelab network and grant you access.
        </Text>
      </Step>

      <Divider borderColor="var(--dash-divider)" mb={8} />

      {/* ── Step 4 ── */}
      <Step number="4" title="Verify Your Access Status">
        <InfoBox color="#68d391">
          After accepting the invitation, Iulian will confirm your account on the administrator panel.
          Your status should appear as <Text as="span" fontWeight="bold">Enabled</Text> — at this point
          you are authorised to connect to the network.
        </InfoBox>

        <StatusCard />

        <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="tall">
          If your status does not update within a few minutes of accepting the invite, contact Iulian directly for manual approval.
        </Text>
      </Step>

      <Divider borderColor="var(--dash-divider)" mb={8} />

      {/* ── Step 5 ── */}
      <Step number="5" title="Connect via the Twingate Client">
        <InfoBox>
          Open the Twingate desktop or mobile application. Your network (<Text as="span"
          fontWeight="semibold" color="rgba(165,180,252,0.9)">0xd1shomelab</Text>) will appear
          in the networks list. Toggle the connection switch to <Text as="span" color="green.300"
          fontWeight="bold">ON</Text> to establish the tunnel.
        </InfoBox>

        <Flex direction="column" gap={3} maxW="440px">
          {[
            { icon: UnlockIcon, color: '#a5b4fc', text: 'Launch Twingate from your system tray or applications folder.' },
            { icon: LinkIcon,   color: '#68d391', text: 'Select the "0xd1shomelab" network from the networks list.' },
            { icon: CheckIcon,  color: '#fc8181', text: 'Toggle the connection switch — the dot indicator will turn green when connected.' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Flex key={i} align="flex-start" gap={3}
                px={4} py={3} borderRadius="10px"
                bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.07)"
              >
                <Flex
                  w="28px" h="28px" borderRadius="8px" flexShrink={0}
                  bg={`${item.color}18`} border={`1px solid ${item.color}30`}
                  align="center" justify="center"
                >
                  <Icon boxSize={3} color={item.color} />
                </Flex>
                <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="tall" pt="3px">
                  {item.text}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Step>

      {/* Done banner */}
      <Box
        mt={2} px={5} py={4} borderRadius="12px"
        bg="rgba(104,211,145,0.07)" border="1px solid rgba(104,211,145,0.22)"
      >
        <Flex align="center" gap={3}>
          <Box w="8px" h="8px" borderRadius="full" bg="green.400"
            boxShadow="0 0 8px rgba(72,187,120,0.8)" flexShrink={0} />
          <Box>
            <Text fontSize="13px" fontWeight="bold" color="green.300" mb={0.5}>
              You're connected to the lab network
            </Text>
            <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="tall">
              You now have access to all internal lab resources, virtual machines, and services exposed
              on the homelab network. Refer to the Lab Configs page for available environments.
            </Text>
          </Box>
        </Flex>
      </Box>

    </Box>
  </Box>
);

export default LabConnectivityView;
