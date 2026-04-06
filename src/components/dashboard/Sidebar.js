import { useRef, useEffect } from 'react';
import { Box, Flex, Text, Divider } from '@chakra-ui/react';
import {
  ViewIcon, CalendarIcon, StarIcon, EditIcon, AddIcon,
  AtSignIcon, AttachmentIcon, UnlockIcon, LockIcon,
  RepeatIcon, LinkIcon, EmailIcon, CopyIcon,
  WarningTwoIcon, ExternalLinkIcon, SettingsIcon,
  SearchIcon, InfoIcon, ChevronRightIcon, ChatIcon,
} from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useEngagements } from '../../contexts/EngagementContext';

// ── Global nav (always visible) ───────────────────────────────────────────────
const globalNav = [
  { key: '',            label: 'Dashboard',   icon: ViewIcon       },
  { key: 'engagements', label: 'Engagements', icon: WarningTwoIcon },
];

// ── Cheatsheet nav (always visible, global) ───────────────────────────────────
const cheatsheetNav = [
  { key: 'cheatsheet/red-team-map', label: 'Red Team Ops Map',     icon: StarIcon       },
  { key: 'cheatsheet/ad-map',       label: 'AD Attack Map',         icon: UnlockIcon     },
  { key: 'cheatsheet/payload-map',  label: 'Payload & Evasion Map', icon: AttachmentIcon },
];

// ── Red Lab nav (always visible, global) ──────────────────────────────────────
const redLabNav = [
  { key: 'lab/configs',      label: 'Lab Configs',      icon: SettingsIcon    },
  { key: 'lab/connectivity', label: 'Lab Connectivity', icon: LinkIcon        },
];

// ── Resources & Materials nav (always visible, global) ────────────────────────
const resourcesNav = [
  { key: 'resources/tools',        label: 'Tools',        icon: StarIcon       },
  { key: 'resources/cve-feed',     label: 'CVE Feed',     icon: WarningTwoIcon },
  { key: 'resources/ransom-feed',  label: 'Ransom Feed',  icon: LockIcon       },
  { key: 'resources/email-leaks',  label: 'Email Leaks',  icon: EmailIcon      },
  { key: 'resources/lolbins',      label: 'LOLBIN / LOLBAS', icon: SearchIcon  },
  { key: 'resources/domain-cat',    label: 'Domain Cat Checker', icon: SearchIcon },
  { key: 'resources/google-dorking', label: 'Google Dorking',    icon: SearchIcon },
];

// ── Cloning nav (always visible, global) ──────────────────────────────────────
const cloningNav = [
  { key: 'cloning/voice-cloner', label: 'Voice Cloner', icon: AttachmentIcon },
];

// ── Malware Analysis nav (always visible, global) ─────────────────────────────
const malwareNav = [
  { key: 'malware/scanner', label: 'Scanner',  icon: SearchIcon   },
  { key: 'malware/reports', label: 'Reports',  icon: CopyIcon     },
];

// ── Diagram Drawing nav (always visible, global) ──────────────────────────────
const diagramsNav = [
  { key: 'diagrams/editor',  label: 'Editor',       icon: EditIcon       },
  { key: 'diagrams/library', label: 'My Diagrams',  icon: AttachmentIcon },
];

// ── Per-engagement nav (shown when inside an engagement) ─────────────────────
const engagementNav = [
  {
    section: 'OPERATIONS',
    items: [
      { key: 'operations/activity',       label: 'Activity Log',       icon: RepeatIcon       },
      { key: 'operations/calendar',       label: 'Calendar',           icon: CalendarIcon     },
      { key: 'operations/skill-requests', label: 'Skill Requests',     icon: StarIcon         },
      { key: 'operations/ttx',            label: 'TTX Planner',        icon: EditIcon         },
      { key: 'operations/team-vault',     label: 'Team Vault',         icon: LockIcon         },
      { key: 'operations/assumed-breach', label: 'Assumed Breach',     icon: ChevronRightIcon },
    ],
  },
  {
    section: 'TEAM',
    items: [
      { key: 'team/people',    label: 'People & Skills', icon: AtSignIcon     },
      { key: 'team/resources', label: 'Resources',       icon: AttachmentIcon },
    ],
  },
  {
    section: 'INTELLIGENCE',
    items: [
      { key: 'intelligence/loot-tracker',    label: 'Loot Tracker',           icon: UnlockIcon },
      { key: 'intelligence/evidence-vault',  label: 'Evidence Vault',          icon: LockIcon   },
      { key: 'intelligence/cleanup-tracker', label: 'Cleanup Tracker',         icon: RepeatIcon },
      { key: 'intelligence/reverse-shells',  label: 'Reverse Shells',          icon: ChevronRightIcon },
    ],
  },
  {
    section: 'INFRASTRUCTURE',
    items: [
      { key: 'intelligence/c2',              label: 'C2 Infrastructure',       icon: LinkIcon        },
      { key: 'intelligence/phishing',        label: 'Phishing Infrastructure', icon: EmailIcon       },
      { key: 'intelligence/device-code-phishing', label: 'Device Code Phishing', icon: ExternalLinkIcon },
      { key: 'intelligence/pass-cookie',          label: 'Pass-the-Cookie',      icon: CopyIcon         },
      { key: 'intelligence/evil-oauth',           label: 'Evil OAuth Generator', icon: UnlockIcon       },
      { key: 'intelligence/mfa-push',            label: 'MFA Push Fatigue',     icon: WarningTwoIcon   },
      { key: 'intelligence/clickfix',            label: 'ClickFix Builder',     icon: ExternalLinkIcon },
    ],
  },
  {
    section: 'BUILDERS',
    items: [
      { key: 'builders/username-gen',       label: 'Username Generator',    icon: AtSignIcon },
      { key: 'builders/typosquat',          label: 'Typosquat Generator',   icon: SearchIcon },
      { key: 'builders/qr-codes',           label: 'QR Code Generator',     icon: CopyIcon   },
      { key: 'builders/wordlist-gen',       label: 'Wordlist Generator',    icon: EditIcon   },
      { key: 'builders/redirector-chain',   label: 'Redirector Chain',      icon: LinkIcon   },
      { key: 'builders/card-generation',    label: 'Card Generation',       icon: CopyIcon   },
      { key: 'builders/fake-teams',         label: 'Fake Teams Message',    icon: ChatIcon   },
    ],
  },
  {
    section: 'SOCK PUPPETS',
    items: [
      { key: 'sockpuppets/personas',     label: 'Personas',    icon: AtSignIcon       },
      { key: 'sockpuppets/social-media', label: 'Social Media', icon: ExternalLinkIcon },
    ],
  },
  {
    section: 'TTPs',
    items: [
      { key: 'ttps/initial-access',   label: 'Initial Access',   icon: ChevronRightIcon },
      { key: 'ttps/windows',          label: 'Windows',          icon: ChevronRightIcon },
      { key: 'ttps/linux',            label: 'Linux',            icon: ChevronRightIcon },
      { key: 'ttps/active-directory', label: 'Active Directory', icon: ChevronRightIcon },
      { key: 'ttps/network',          label: 'Network',          icon: ChevronRightIcon },
    ],
  },
  {
    section: 'PILLAGING',
    items: [
      { key: 'pillaging/domain-recon',    label: 'Domain Recon',      icon: InfoIcon       },
      { key: 'pillaging/subdomains',      label: 'Subdomains',        icon: SearchIcon     },
      { key: 'pillaging/services',        label: 'Network Scanning',  icon: SearchIcon     },
      { key: 'pillaging/webserver-enum',  label: 'Webserver Enum',    icon: SearchIcon     },
      { key: 'pillaging/leaks',           label: 'Leaks',             icon: UnlockIcon     },
      { key: 'pillaging/credentials',     label: 'Credentials',       icon: LockIcon       },
      { key: 'pillaging/kerberos',        label: 'Kerberos Tickets',  icon: UnlockIcon     },
      { key: 'pillaging/documents',       label: 'Documents',         icon: AttachmentIcon },
      { key: 'pillaging/file-meta',       label: 'File Metadata',     icon: SearchIcon     },
    ],
  },
  {
    section: 'BLOODHOUND',
    items: [
      { key: 'bloodhound/analyzer',       label: 'Analyzer',          icon: SearchIcon     },
      { key: 'bloodhound/cypher-library', label: 'Cypher Library',    icon: CopyIcon       },
    ],
  },
  {
    section: 'OSINT',
    items: [
      { key: 'osint/emails',    label: 'Emails Harvester', icon: EmailIcon      },
      { key: 'osint/org-chart', label: 'Org Chart Mapper', icon: LinkIcon       },
    ],
  },
  {
    section: 'COMMS',
    items: [
      { key: 'comms/white-team',        label: 'White Team',      icon: ChatIcon  },
      { key: 'comms/webhook-alerter',   label: 'Webhook Alerter', icon: LinkIcon  },
    ],
  },
  {
    section: 'REPORTING',
    items: [
      { key: 'reporting/reports',       label: 'Reports',       icon: CopyIcon         },
      { key: 'reporting/findings',      label: 'Findings',      icon: WarningTwoIcon   },
      { key: 'reporting/client-portal', label: 'Client Portal', icon: ExternalLinkIcon },
    ],
  },
];

const STATUS_COLORS = {
  'PREPARING':   '#a5b4fc',
  'IN PROGRESS': '#fcd34d',
  'REPORTING':   '#93c5fd',
  'COMPLETED':   '#6ee7b7',
  'PAUSED':      '#9ca3af',
};

const NavItem = ({ icon: Icon, label, isActive, onClick, itemPy }) => (
  <Flex
    align="center" gap={3} px={3} py={itemPy} borderRadius="8px"
    cursor="pointer" pos="relative"
    bg={isActive ? 'rgba(255,80,95,0.12)' : 'transparent'}
    color={isActive ? 'white' : 'var(--dash-text-secondary)'}
    transition="all 0.18s ease"
    onClick={onClick}
    _hover={{ bg: 'var(--dash-nav-hover)', color: 'var(--dash-text-primary)' }}
  >
    {isActive && (
      <Box pos="absolute" left="0" top="20%" bottom="20%" w="2px" bg="red.500" borderRadius="full" />
    )}
    <Icon boxSize={3.5} />
    <Text fontSize="12px" fontWeight={isActive ? 'semibold' : 'normal'}>{label}</Text>
  </Flex>
);

const Sidebar = () => {
  const navigate     = useNavigate();
  const location     = useLocation();
  const { logout }   = useAuth();
  const { settings } = useSettings();
  const { getBySlug } = useEngagements();
  const compact      = settings.compactMode;

  const itemPy   = compact ? '5px' : '8px';
  const groupGap = compact ? 3 : 4;

  // Parse active location
  const afterDash = location.pathname.replace('/dashboard', '').replace(/^\//, '');
  const segments  = afterDash ? afterDash.split('/') : [];
  const firstSeg  = segments[0] || '';

  const GLOBAL_KEYS = ['', 'engagements', 'settings', 'cheatsheet', 'lab', 'resources', 'malware', 'diagrams'];
  const isInEngagement = firstSeg && !GLOBAL_KEYS.includes(firstSeg);
  const engagementSlug = isInEngagement ? firstSeg : null;
  const activeSubPath  = isInEngagement ? segments.slice(1).join('/') : '';

  const activeEngagement = engagementSlug ? getBySlug(engagementSlug) : null;

  const sidebarRef  = useRef(null);
  const activeOpRef = useRef(null);

  // Smooth-scroll sidebar to the Active Operation section when entering an engagement
  useEffect(() => {
    if (!isInEngagement || !activeOpRef.current || !sidebarRef.current) return;
    const offset = activeOpRef.current.offsetTop - sidebarRef.current.offsetTop - 16;
    sidebarRef.current.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
  }, [engagementSlug, isInEngagement]);

  const goTo = (path) => navigate(path);

  return (
    <Flex
      ref={sidebarRef}
      direction="column"
      w={compact ? '190px' : '220px'}
      flexShrink={0}
      bg="var(--dash-sidebar-bg)"
      borderRight="1px solid var(--dash-card-border)"
      backdropFilter="blur(20px)"
      h="100vh"
      pos="sticky"
      top="0"
      overflowY="auto"
      py={compact ? 3 : 5}
      transition="width 0.2s ease"
      css={{
        '&::-webkit-scrollbar': { width: '3px' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' },
      }}
    >
      {/* Brand */}
      <Flex align="center" gap={2} px={5} mb={compact ? 3 : 5}>
        <Box w="8px" h="8px" borderRadius="full" bg="red.500" boxShadow="0 0 8px rgba(255,55,55,0.8)" />
        <Text fontSize="11px" fontWeight="black" letterSpacing="widest" color="var(--dash-text-primary)" textTransform="uppercase">
          Red Ops Center
        </Text>
      </Flex>

      {/* Global nav — Dashboard + Engagements */}
      <Box px={3} mb={groupGap}>
        {globalNav.map((item) => {
          const isActive = !isInEngagement && firstSeg === item.key;
          return (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              itemPy={itemPy}
              onClick={() => goTo(`/dashboard${item.key ? `/${item.key}` : ''}`)}
            />
          );
        })}
      </Box>

      {/* Cheatsheet section — always visible */}
      <Box px={3} mb={groupGap}>
        <Divider borderColor="var(--dash-divider)" mb={groupGap} />
        <Text
          fontSize="9px" fontWeight="bold" letterSpacing="widest"
          color="var(--dash-section-label)" textTransform="uppercase"
          px={2} mb={1}
        >
          Cheatsheet
        </Text>
        {cheatsheetNav.map((item) => {
          const isActive = afterDash === item.key;
          return (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              itemPy={itemPy}
              onClick={() => goTo(`/dashboard/${item.key}`)}
            />
          );
        })}
      </Box>

      {/* Red Lab section — always visible */}
      <Box px={3} mb={groupGap}>
        <Divider borderColor="var(--dash-divider)" mb={groupGap} />
        <Text
          fontSize="9px" fontWeight="bold" letterSpacing="widest"
          color="var(--dash-section-label)" textTransform="uppercase"
          px={2} mb={1}
        >
          Red Lab
        </Text>
        {redLabNav.map((item) => {
          const isActive = afterDash === item.key;
          return (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              itemPy={itemPy}
              onClick={() => goTo(`/dashboard/${item.key}`)}
            />
          );
        })}
      </Box>

      {/* Resources & Materials section — always visible */}
      <Box px={3} mb={groupGap}>
        <Divider borderColor="var(--dash-divider)" mb={groupGap} />
        <Text
          fontSize="9px" fontWeight="bold" letterSpacing="widest"
          color="var(--dash-section-label)" textTransform="uppercase"
          px={2} mb={1}
        >
          Resources &amp; Materials
        </Text>
        {resourcesNav.map((item) => {
          const isActive = afterDash === item.key;
          return (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              itemPy={itemPy}
              onClick={() => goTo(`/dashboard/${item.key}`)}
            />
          );
        })}
      </Box>

      {/* Cloning section — always visible */}
      <Box px={3} mb={groupGap}>
        <Divider borderColor="var(--dash-divider)" mb={groupGap} />
        <Text
          fontSize="9px" fontWeight="bold" letterSpacing="widest"
          color="var(--dash-section-label)" textTransform="uppercase"
          px={2} mb={1}
        >
          Cloning
        </Text>
        {cloningNav.map((item) => {
          const isActive = afterDash === item.key;
          return (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              itemPy={itemPy}
              onClick={() => goTo(`/dashboard/${item.key}`)}
            />
          );
        })}
      </Box>

      {/* Malware Analysis section — always visible */}
      <Box px={3} mb={groupGap}>
        <Divider borderColor="var(--dash-divider)" mb={groupGap} />
        <Text
          fontSize="9px" fontWeight="bold" letterSpacing="widest"
          color="var(--dash-section-label)" textTransform="uppercase"
          px={2} mb={1}
        >
          Malware Analysis
        </Text>
        {malwareNav.map((item) => {
          const isActive = afterDash === item.key;
          return (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              itemPy={itemPy}
              onClick={() => goTo(`/dashboard/${item.key}`)}
            />
          );
        })}
      </Box>

      {/* Diagram Drawing section — always visible */}
      <Box px={3} mb={groupGap}>
        <Divider borderColor="var(--dash-divider)" mb={groupGap} />
        <Text
          fontSize="9px" fontWeight="bold" letterSpacing="widest"
          color="var(--dash-section-label)" textTransform="uppercase"
          px={2} mb={1}
        >
          Diagram Drawing
        </Text>
        {diagramsNav.map((item) => {
          const isActive = afterDash === item.key;
          return (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              itemPy={itemPy}
              onClick={() => goTo(`/dashboard/${item.key}`)}
            />
          );
        })}
      </Box>

      {/* Engagement context — shown when inside an engagement */}
      {isInEngagement && activeEngagement && (
        <>
          <Divider borderColor="var(--dash-divider)" mx={3} w="auto" mb={groupGap} />

          {/* Active engagement chip */}
          <Box ref={activeOpRef} px={3} mb={groupGap}>
            <Text
              fontSize="9px" fontWeight="bold" letterSpacing="widest"
              color="var(--dash-section-label)" textTransform="uppercase"
              px={2} mb={1}
            >
              Active Operation
            </Text>
            <Box
              px={3} py="8px" borderRadius="10px"
              bg="rgba(255,80,95,0.08)" border="1px solid rgba(255,80,95,0.2)"
              cursor="pointer"
              onClick={() => goTo(`/dashboard/${engagementSlug}`)}
              _hover={{ bg: 'rgba(255,80,95,0.13)', borderColor: 'rgba(255,80,95,0.35)' }}
              transition="all 0.18s"
            >
              <Flex align="center" justify="space-between">
                <Text fontSize="12px" fontWeight="semibold" color="white" noOfLines={1}>
                  {activeEngagement.name}
                </Text>
                <Box
                  w="6px" h="6px" borderRadius="full" flexShrink={0}
                  bg={STATUS_COLORS[activeEngagement.status] || '#9ca3af'}
                  boxShadow={`0 0 6px ${STATUS_COLORS[activeEngagement.status] || '#9ca3af'}`}
                />
              </Flex>
              <Text fontSize="10px" color="var(--dash-text-muted)" mt="2px">{activeEngagement.company}</Text>
            </Box>

            {/* Switch engagement link */}
            <Text
              fontSize="10px" color="var(--dash-text-muted)" px={2} mt={2} cursor="pointer"
              _hover={{ color: 'var(--dash-text-secondary)' }} transition="color 0.15s"
              onClick={() => goTo('/dashboard/engagements')}
            >
              ↩ Switch engagement
            </Text>
          </Box>

          <Divider borderColor="var(--dash-divider)" mx={3} w="auto" mb={groupGap} />

          {/* Per-engagement nav sections */}
          <Flex direction="column" flex="1" gap={groupGap} px={3}>
            {engagementNav.map((group) => (
              <Box key={group.section}>
                <Text
                  fontSize="9px" fontWeight="bold" letterSpacing="widest"
                  color="var(--dash-section-label)" textTransform="uppercase"
                  px={2} mb={1}
                >
                  {group.section}
                </Text>
                {group.items.map((item) => {
                  const isActive = activeSubPath === item.key || activeSubPath.startsWith(item.key + '/');
                  return (
                    <NavItem
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      isActive={isActive}
                      itemPy={itemPy}
                      onClick={() => goTo(`/dashboard/${engagementSlug}/${item.key}`)}
                    />
                  );
                })}
              </Box>
            ))}
          </Flex>
        </>
      )}

      {/* Spacer when not in engagement */}
      {!isInEngagement && <Box flex="1" />}

      {/* Bottom — settings + logout */}
      <Box px={3} pt={4} borderTop="1px solid var(--dash-divider)" mt={4}>
        <NavItem
          icon={SettingsIcon}
          label="Settings"
          isActive={firstSeg === 'settings'}
          itemPy={itemPy}
          onClick={() => goTo('/dashboard/settings')}
        />
        <Flex
          align="center" gap={3} px={3} py={itemPy} borderRadius="8px"
          cursor="pointer" color="var(--dash-text-muted)"
          _hover={{ bg: 'rgba(255,55,55,0.08)', color: 'red.400' }}
          transition="all 0.18s"
          onClick={logout}
        >
          <Box w="14px" h="14px" display="flex" alignItems="center" justifyContent="center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </Box>
          <Text fontSize="12px">Sign Out</Text>
        </Flex>
      </Box>
    </Flex>
  );
};

export default Sidebar;
