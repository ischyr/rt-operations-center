import { useState } from 'react';
import {
  Box, Flex, Text, Heading, SimpleGrid, Button, Divider,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure, useToast,
} from '@chakra-ui/react';
import { SettingsIcon, LockIcon, UnlockIcon, StarIcon, RepeatIcon, WarningTwoIcon, CopyIcon } from '@chakra-ui/icons';

const LAB_CONFIGS = [
  {
    id: 'win-ad-full',
    name: 'Windows Active Directory — Full',
    description: 'Complete enterprise AD environment with Primary DC, secondary DC, file server, and three domain-joined workstations. Suitable for full-scope AD attack chains.',
    tags: ['Windows Server 2022', 'Windows 10', 'Active Directory', 'Advanced'],
    machines: 6,
    ram: '24 GB',
    cpu: '12 vCPU',
    icon: LockIcon,
    accentColor: '#a5b4fc',
    configFile: 'win-ad-full-ludus-config.yml',
    deployCommands: [
      {
        section: 'Check Templates',
        note: 'Build any missing templates before deploying (30–90 min each).',
        commands: [
          { cmd: 'ludus templates list',                                        desc: 'List available templates' },
          { cmd: 'ludus templates build -n win2022-server-x64-template',        desc: 'Build Win 2022 Server' },
          { cmd: 'ludus templates build -n win10-21h2-x64-enterprise-template', desc: 'Build Win 10 21H2 Ent' },
          { cmd: 'ludus templates build -n kali-x64-desktop-template',          desc: 'Build Kali Desktop' },
        ],
        footer: 'Only build templates that show as NOT BUILT in the list above. Each template takes 30–90 minutes.',
      },
      {
        section: 'Set Config & Deploy',
        note: 'Set the range config and start the deploy.',
        commands: [
          { cmd: 'ludus range config set -f win-ad-full-ludus-config.yml', desc: 'Set range config' },
          { cmd: 'ludus range deploy',                                      desc: 'Start deployment' },
          { cmd: 'ludus range status',                                      desc: 'Monitor status' },
        ],
      },
    ],
  },
  {
    id: 'win-ad-minimal',
    name: 'Windows Active Directory — Minimal',
    description: 'Lightweight AD lab with a single DC and two workstations. Ideal for initial enumeration, Kerberoasting, and AS-REP roasting exercises.',
    tags: ['Windows Server 2019', 'Windows 10', 'Active Directory', 'Intermediate'],
    machines: 3,
    ram: '12 GB',
    cpu: '6 vCPU',
    icon: LockIcon,
    accentColor: '#93c5fd',
    configFile: 'win-ad-minimal-ludus-config.yml',
    deployCommands: [
      {
        section: 'Check Templates',
        note: 'Build any missing templates before deploying (30–90 min each).',
        commands: [
          { cmd: 'ludus templates list',                                        desc: 'List available templates' },
          { cmd: 'ludus templates build -n win2019-server-x64-template',        desc: 'Build Win 2019 Server' },
          { cmd: 'ludus templates build -n win10-21h2-x64-enterprise-template', desc: 'Build Win 10 21H2 Ent' },
        ],
        footer: 'Only build templates that show as NOT BUILT in the list above.',
      },
      {
        section: 'Set Config & Deploy',
        note: 'Set the range config and start the deploy.',
        commands: [
          { cmd: 'ludus range config set -f win-ad-minimal-ludus-config.yml', desc: 'Set range config' },
          { cmd: 'ludus range deploy',                                         desc: 'Start deployment' },
          { cmd: 'ludus range status',                                         desc: 'Monitor status' },
        ],
      },
    ],
  },
  {
    id: 'kali-attacker',
    name: 'Kali Attacker Node',
    description: 'Pre-configured Kali Linux instance with a curated toolset — BloodHound, Impacket, CrackMapExec, Metasploit, and custom red team scripts.',
    tags: ['Kali Linux', 'Attacker', 'All Levels'],
    machines: 1,
    ram: '4 GB',
    cpu: '2 vCPU',
    icon: StarIcon,
    accentColor: '#fc8181',
    configFile: 'kali-attacker-ludus-config.yml',
    deployCommands: [
      {
        section: 'Check Templates',
        note: 'Ensure the Kali template is built before deploying.',
        commands: [
          { cmd: 'ludus templates list',                               desc: 'List available templates' },
          { cmd: 'ludus templates build -n kali-x64-desktop-template', desc: 'Build Kali Desktop' },
        ],
        footer: 'Only build if the template shows as NOT BUILT.',
      },
      {
        section: 'Set Config & Deploy',
        note: 'Set the range config and start the deploy.',
        commands: [
          { cmd: 'ludus range config set -f kali-attacker-ludus-config.yml', desc: 'Set range config' },
          { cmd: 'ludus range deploy',                                        desc: 'Start deployment' },
          { cmd: 'ludus range status',                                        desc: 'Monitor status' },
        ],
      },
    ],
  },
  {
    id: 'web-vuln-lab',
    name: 'Web Application Testing Lab',
    description: 'Intentionally vulnerable web stack running DVWA, Juice Shop, and a custom PHP application. Covers SQLi, XSS, IDOR, SSRF, and deserialization vulnerabilities.',
    tags: ['Linux', 'Web App', 'OWASP', 'Beginner'],
    machines: 2,
    ram: '8 GB',
    cpu: '4 vCPU',
    icon: UnlockIcon,
    accentColor: '#68d391',
    configFile: 'web-vuln-ludus-config.yml',
    deployCommands: [
      {
        section: 'Check Templates',
        note: 'Build any missing templates before deploying.',
        commands: [
          { cmd: 'ludus templates list',                              desc: 'List available templates' },
          { cmd: 'ludus templates build -n debian-12-x64-template',  desc: 'Build Debian 12' },
          { cmd: 'ludus templates build -n kali-x64-desktop-template', desc: 'Build Kali Desktop' },
        ],
        footer: 'Only build templates that show as NOT BUILT in the list above.',
      },
      {
        section: 'Set Config & Deploy',
        note: 'Set the range config and start the deploy.',
        commands: [
          { cmd: 'ludus range config set -f web-vuln-ludus-config.yml', desc: 'Set range config' },
          { cmd: 'ludus range deploy',                                   desc: 'Start deployment' },
          { cmd: 'ludus range status',                                   desc: 'Monitor status' },
        ],
      },
    ],
  },
  {
    id: 'network-seg',
    name: 'Network Segmentation & Pivoting',
    description: 'Multi-subnet environment with pfSense firewall, internal DMZ, and isolated VLAN segments. Designed for pivoting, port forwarding, and VLAN hopping exercises.',
    tags: ['pfSense', 'Linux', 'Network', 'Advanced'],
    machines: 5,
    ram: '16 GB',
    cpu: '8 vCPU',
    icon: RepeatIcon,
    accentColor: '#f6ad55',
    configFile: 'network-seg-ludus-config.yml',
    deployCommands: [
      {
        section: 'Check Templates',
        note: 'Build any missing templates before deploying (30–90 min each).',
        commands: [
          { cmd: 'ludus templates list',                             desc: 'List available templates' },
          { cmd: 'ludus templates build -n pfsense-x64-template',   desc: 'Build pfSense' },
          { cmd: 'ludus templates build -n debian-12-x64-template', desc: 'Build Debian 12' },
          { cmd: 'ludus templates build -n kali-x64-desktop-template', desc: 'Build Kali Desktop' },
        ],
        footer: 'Only build templates that show as NOT BUILT in the list above.',
      },
      {
        section: 'Set Config & Deploy',
        note: 'Set the range config and start the deploy.',
        commands: [
          { cmd: 'ludus range config set -f network-seg-ludus-config.yml', desc: 'Set range config' },
          { cmd: 'ludus range deploy',                                      desc: 'Start deployment' },
          { cmd: 'ludus range status',                                      desc: 'Monitor status' },
        ],
      },
    ],
  },
  {
    id: 'purple-team',
    name: 'Purple Team Environment',
    description: 'Full attack/defend scenario with Elastic SIEM, Wazuh agent, Splunk forwarder, and a Windows domain. Ideal for detection engineering and adversary simulation.',
    tags: ['Windows', 'Linux', 'SIEM', 'Purple Team', 'Advanced'],
    machines: 7,
    ram: '32 GB',
    cpu: '14 vCPU',
    icon: WarningTwoIcon,
    accentColor: '#b794f4',
    configFile: 'purple-team-ludus-config.yml',
    deployCommands: [
      {
        section: 'Check Templates',
        note: 'Build any missing templates before deploying (30–90 min each).',
        commands: [
          { cmd: 'ludus templates list',                                        desc: 'List available templates' },
          { cmd: 'ludus templates build -n win2022-server-x64-template',        desc: 'Build Win 2022 Server' },
          { cmd: 'ludus templates build -n win10-21h2-x64-enterprise-template', desc: 'Build Win 10 21H2 Ent' },
          { cmd: 'ludus templates build -n kali-x64-desktop-template',          desc: 'Build Kali Desktop' },
          { cmd: 'ludus templates build -n debian-12-x64-template',             desc: 'Build Debian 12' },
        ],
        footer: 'Only build templates that show as NOT BUILT in the list above. Each template takes 30–90 minutes.',
      },
      {
        section: 'Set Config & Deploy',
        note: 'Set the range config and start the deploy.',
        commands: [
          { cmd: 'ludus range config set -f purple-team-ludus-config.yml', desc: 'Set range config' },
          { cmd: 'ludus range deploy',                                      desc: 'Start deployment' },
          { cmd: 'ludus range status',                                      desc: 'Monitor status' },
        ],
      },
    ],
  },
  {
    id: 'malware-sandbox',
    name: 'Malware Analysis Sandbox',
    description: 'Isolated Windows 10 analysis box with Flare-VM toolset, FakeNet-NG, ProcMon, and an inetsim server. Network-isolated to prevent real callback exfiltration.',
    tags: ['Windows 10', 'Malware Analysis', 'Isolated', 'Intermediate'],
    machines: 2,
    ram: '8 GB',
    cpu: '4 vCPU',
    icon: LockIcon,
    accentColor: '#fc8181',
    configFile: 'malware-sandbox-ludus-config.yml',
    deployCommands: [
      {
        section: 'Check Templates',
        note: 'Build any missing templates before deploying.',
        commands: [
          { cmd: 'ludus templates list',                                        desc: 'List available templates' },
          { cmd: 'ludus templates build -n win10-21h2-x64-enterprise-template', desc: 'Build Win 10 21H2 Ent' },
          { cmd: 'ludus templates build -n debian-12-x64-template',             desc: 'Build Debian 12' },
        ],
        footer: 'Only build templates that show as NOT BUILT. Network isolation is configured automatically.',
      },
      {
        section: 'Set Config & Deploy',
        note: 'Set the range config and start the deploy.',
        commands: [
          { cmd: 'ludus range config set -f malware-sandbox-ludus-config.yml', desc: 'Set range config' },
          { cmd: 'ludus range deploy',                                          desc: 'Start deployment' },
          { cmd: 'ludus range status',                                          desc: 'Monitor status' },
        ],
      },
    ],
  },
  {
    id: 'cloud-security',
    name: 'Cloud Security Lab',
    description: 'LocalStack-based AWS simulation with misconfigured S3 buckets, over-privileged IAM roles, and exposed Lambda functions. Covers cloud pentesting methodology.',
    tags: ['Linux', 'Cloud', 'AWS Sim', 'Intermediate'],
    machines: 3,
    ram: '12 GB',
    cpu: '6 vCPU',
    icon: StarIcon,
    accentColor: '#76e4f7',
    configFile: 'cloud-security-ludus-config.yml',
    deployCommands: [
      {
        section: 'Check Templates',
        note: 'Build any missing templates before deploying.',
        commands: [
          { cmd: 'ludus templates list',                             desc: 'List available templates' },
          { cmd: 'ludus templates build -n debian-12-x64-template', desc: 'Build Debian 12' },
          { cmd: 'ludus templates build -n kali-x64-desktop-template', desc: 'Build Kali Desktop' },
        ],
        footer: 'Only build templates that show as NOT BUILT in the list above.',
      },
      {
        section: 'Set Config & Deploy',
        note: 'Set the range config and start the deploy.',
        commands: [
          { cmd: 'ludus range config set -f cloud-security-ludus-config.yml', desc: 'Set range config' },
          { cmd: 'ludus range deploy',                                         desc: 'Start deployment' },
          { cmd: 'ludus range status',                                         desc: 'Monitor status' },
        ],
      },
    ],
  },
];

const DIFFICULTY_COLORS = {
  'Beginner':     { bg: 'rgba(104,211,145,0.12)', border: 'rgba(104,211,145,0.3)',  text: '#68d391' },
  'Intermediate': { bg: 'rgba(246,173,85,0.12)',  border: 'rgba(246,173,85,0.3)',   text: '#f6ad55' },
  'Advanced':     { bg: 'rgba(252,129,129,0.12)', border: 'rgba(252,129,129,0.3)',  text: '#fc8181' },
  'Purple Team':  { bg: 'rgba(183,148,244,0.12)', border: 'rgba(183,148,244,0.3)',  text: '#b794f4' },
  'All Levels':   { bg: 'rgba(118,228,247,0.12)', border: 'rgba(118,228,247,0.3)',  text: '#76e4f7' },
};

const getDifficultyTag = (tags) =>
  tags.find((t) => DIFFICULTY_COLORS[t]) || null;

// ── Command row ────────────────────────────────────────────────────────────────
const CommandRow = ({ cmd, desc }) => {
  const toast = useToast();

  const copy = () => {
    navigator.clipboard.writeText(cmd);
    toast({ description: 'Copied to clipboard', status: 'success', duration: 1500, isClosable: false, position: 'bottom-right' });
  };

  return (
    <Flex
      align="center" gap={3} px={3} py="10px"
      bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
      borderRadius="8px"
    >
      <Text fontSize="13px" color="rgba(255,80,95,0.8)" fontFamily="mono" flexShrink={0}>$</Text>
      <Text fontSize="12px" color="var(--dash-text-primary)" fontFamily="mono" flex="1" wordBreak="break-all">
        {cmd}
      </Text>
      <Text fontSize="10px" color="var(--dash-text-muted)" flexShrink={0} display={{ base: 'none', md: 'block' }}>
        {desc}
      </Text>
      <Box
        as="button" onClick={copy} flexShrink={0} p="4px" borderRadius="5px"
        color="var(--dash-text-muted)" _hover={{ color: 'var(--dash-text-primary)', bg: 'rgba(255,255,255,0.06)' }}
        transition="all 0.15s"
      >
        <CopyIcon boxSize={3} />
      </Box>
    </Flex>
  );
};

// ── Deploy commands modal ──────────────────────────────────────────────────────
const DeployModal = ({ config, isOpen, onClose }) => {
  const toast = useToast();

  const allCommands = config.deployCommands.flatMap((s) => s.commands).map((c) => c.cmd);

  const copyAll = () => {
    navigator.clipboard.writeText(allCommands.join('\n'));
    toast({ description: 'All commands copied', status: 'success', duration: 1500, isClosable: false, position: 'bottom-right' });
  };

  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="rgba(0,0,0,0.75)" backdropFilter="blur(6px)" />
      <ModalContent
        bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="14px" mx={4}
      >
        {/* Header */}
        <ModalHeader pb={3} borderBottom="1px solid var(--dash-divider)">
          <Flex align="center" gap={3}>
            <Flex
              w="32px" h="32px" borderRadius="9px" flexShrink={0}
              bg={`${config.accentColor}18`} border={`1px solid ${config.accentColor}35`}
              align="center" justify="center"
            >
              <Icon boxSize={3} color={config.accentColor} />
            </Flex>
            <Box>
              <Flex align="center" gap={2}>
                <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">
                  Deploy Commands
                </Text>
                <Box
                  px="7px" py="1px" borderRadius="4px" fontSize="10px" fontWeight="semibold"
                  bg={`${config.accentColor}15`} border={`1px solid ${config.accentColor}30`}
                  color={config.accentColor}
                >
                  {config.name}
                </Box>
              </Flex>
              <Text fontSize="10px" color="var(--dash-text-muted)" mt="1px">
                {config.configFile}
              </Text>
            </Box>
          </Flex>
        </ModalHeader>
        <ModalCloseButton color="var(--dash-text-muted)" _hover={{ color: 'var(--dash-text-primary)' }} />

        {/* Body */}
        <ModalBody py={5} px={5}>
          <Flex direction="column" gap={6}>
            {config.deployCommands.map((section, si) => (
              <Box key={si}>
                {/* Section title */}
                <Flex align="baseline" gap={2} mb={1}>
                  <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">
                    <Text as="span" color={config.accentColor}>{si + 1}.</Text> {section.section}
                  </Text>
                </Flex>
                <Text fontSize="11px" color="var(--dash-text-muted)" mb={3}>{section.note}</Text>

                {/* Commands */}
                <Flex direction="column" gap={2}>
                  {section.commands.map((c, ci) => (
                    <CommandRow key={ci} cmd={c.cmd} desc={c.desc} />
                  ))}
                </Flex>

                {/* Footer note */}
                {section.footer && (
                  <Text fontSize="10px" color="var(--dash-text-muted)" mt={2} fontStyle="italic">
                    {section.footer}
                  </Text>
                )}
              </Box>
            ))}
          </Flex>
        </ModalBody>

        {/* Footer */}
        <ModalFooter borderTop="1px solid var(--dash-divider)" pt={3}>
          <Button
            size="sm" borderRadius="8px" fontSize="12px" leftIcon={<CopyIcon />}
            bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.12)"
            color="var(--dash-text-primary)" fontWeight="semibold"
            _hover={{ bg: 'rgba(255,255,255,0.1)' }}
            transition="all 0.18s"
            onClick={copyAll}
          >
            Copy All Commands
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ── Lab card ───────────────────────────────────────────────────────────────────
const LabCard = ({ config }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const Icon = config.icon;
  const diffTag = getDifficultyTag(config.tags);
  const dc = diffTag ? DIFFICULTY_COLORS[diffTag] : null;
  const otherTags = config.tags.filter((t) => !DIFFICULTY_COLORS[t]);

  return (
    <>
      <Box
        bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="14px" p={5} pos="relative" overflow="hidden"
        transition="transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease"
        _hover={{ transform: 'translateY(-4px)', boxShadow: '0 8px 28px rgba(0,0,0,0.4)', borderColor: `${config.accentColor}40` }}
        display="flex" flexDirection="column"
      >
        {/* Top accent line */}
        <Box pos="absolute" top="0" left="0" right="0" h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${config.accentColor}, transparent)` }} />

        {/* Header */}
        <Flex align="flex-start" gap={3} mb={3}>
          <Flex
            w="36px" h="36px" borderRadius="10px" flexShrink={0}
            bg={`${config.accentColor}18`} border={`1px solid ${config.accentColor}35`}
            align="center" justify="center"
          >
            <Icon boxSize={3.5} color={config.accentColor} />
          </Flex>
          <Box flex="1">
            <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" lineHeight="short">
              {config.name}
            </Text>
            {diffTag && dc && (
              <Flex
                mt="3px" display="inline-flex" px="6px" py="1px" borderRadius="4px"
                fontSize="9px" fontWeight="bold" letterSpacing="wider"
                bg={dc.bg} border={`1px solid ${dc.border}`} color={dc.text}
              >
                {diffTag.toUpperCase()}
              </Flex>
            )}
          </Box>
        </Flex>

        {/* Description */}
        <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="tall" mb={4} flex="1">
          {config.description}
        </Text>

        {/* Tags */}
        <Flex gap={1.5} flexWrap="wrap" mb={4}>
          {otherTags.map((tag) => (
            <Box
              key={tag} px="6px" py="1px" borderRadius="4px" fontSize="9px"
              fontWeight="semibold" letterSpacing="wider"
              bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
              color="var(--dash-text-muted)"
            >
              {tag.toUpperCase()}
            </Box>
          ))}
        </Flex>

        <Divider borderColor="var(--dash-divider)" mb={4} />

        {/* Stats row */}
        <Flex justify="space-between" align="center" mb={4}>
          {[
            { label: 'Machines', value: config.machines },
            { label: 'RAM',      value: config.ram      },
            { label: 'CPU',      value: config.cpu      },
          ].map((s) => (
            <Box key={s.label} textAlign="center">
              <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">{s.value}</Text>
              <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider">{s.label}</Text>
            </Box>
          ))}
        </Flex>

        {/* Action */}
        <Button
          size="sm" w="100%" borderRadius="8px" fontSize="12px"
          bg={`${config.accentColor}15`} border={`1px solid ${config.accentColor}35`}
          color={config.accentColor} fontWeight="semibold"
          _hover={{ bg: `${config.accentColor}25`, borderColor: `${config.accentColor}60` }}
          transition="all 0.18s"
          onClick={onOpen}
        >
          Show Commands
        </Button>
      </Box>

      <DeployModal config={config} isOpen={isOpen} onClose={onClose} />
    </>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────────
const LabConfigsView = () => (
  <Box pb={8}>
    {/* Header */}
    <Flex justify="space-between" align="flex-start" mb={6}>
      <Box>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
          Lab <Text as="span" color="red.400">Configs</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          Ludus-based lab templates · select a config to view deploy commands
        </Text>
      </Box>
      <Flex
        align="center" gap={2} px={3} py="6px"
        bg="rgba(255,80,95,0.08)" border="1px solid rgba(255,80,95,0.2)"
        borderRadius="8px"
      >
        <SettingsIcon boxSize={3} color="red.400" />
        <Text fontSize="11px" color="red.300" fontWeight="semibold">{LAB_CONFIGS.length} templates</Text>
      </Flex>
    </Flex>

    {/* Info banner */}
    <Box
      mb={6} px={4} py={3} borderRadius="10px"
      bg="rgba(165,180,252,0.06)" border="1px solid rgba(165,180,252,0.18)"
    >
      <Text fontSize="12px" color="rgba(165,180,252,0.85)" lineHeight="tall">
        All templates are Ludus range configurations. Ensure your Ludus server is online and your API key is set in Settings before deploying.
        Resources listed are minimum requirements — allocate more for smoother performance.
      </Text>
    </Box>

    {/* Grid */}
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
      {LAB_CONFIGS.map((config) => (
        <LabCard key={config.id} config={config} />
      ))}
    </SimpleGrid>
  </Box>
);

export default LabConfigsView;
