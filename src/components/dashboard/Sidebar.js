import { Box, Flex, Text } from '@chakra-ui/react';
import {
  ViewIcon, CalendarIcon, StarIcon, EditIcon, AddIcon,
  AtSignIcon, AttachmentIcon, UnlockIcon, LockIcon,
  RepeatIcon, LinkIcon, EmailIcon, CopyIcon,
  WarningTwoIcon, ExternalLinkIcon, SettingsIcon,
  SearchIcon, InfoIcon, ChevronRightIcon,
} from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

const nav = [
  {
    section: 'OPERATIONS',
    items: [
      { key: '',                label: 'Dashboard',          icon: ViewIcon         },
      { key: 'engagements',     label: 'Engagements',        icon: WarningTwoIcon   },
      { key: 'calendar',        label: 'Calendar',           icon: CalendarIcon     },
      { key: 'skill-requests',  label: 'Skill Requests',     icon: StarIcon         },
      { key: 'ttx',             label: 'TTX Planner',        icon: EditIcon         },
      { key: 'campaign',        label: 'Campaign Builder',   icon: AddIcon          },
    ],
  },
  {
    section: 'TEAM',
    items: [
      { key: 'people',    label: 'People & Skills', icon: AtSignIcon     },
      { key: 'resources', label: 'Resources',       icon: AttachmentIcon },
    ],
  },
  {
    section: 'INTELLIGENCE',
    items: [
      { key: 'loot',     label: 'Loot Tracker',           icon: UnlockIcon },
      { key: 'evidence', label: 'Evidence Vault',          icon: LockIcon   },
      { key: 'cleanup',  label: 'Cleanup Tracker',         icon: RepeatIcon },
      { key: 'c2',       label: 'C2 Infrastructure',       icon: LinkIcon   },
      { key: 'phishing', label: 'Phishing Infrastructure', icon: EmailIcon  },
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
      { key: 'pillaging/subdomains',  label: 'Subdomains',  icon: SearchIcon     },
      { key: 'pillaging/services',    label: 'Services',    icon: InfoIcon       },
      { key: 'pillaging/leaks',       label: 'Leaks',       icon: UnlockIcon     },
      { key: 'pillaging/credentials', label: 'Credentials', icon: LockIcon       },
      { key: 'pillaging/emails',      label: 'Emails',      icon: EmailIcon      },
      { key: 'pillaging/documents',   label: 'Documents',   icon: AttachmentIcon },
    ],
  },
  {
    section: 'REPORTING',
    items: [
      { key: 'reports',       label: 'Reports',       icon: CopyIcon         },
      { key: 'findings',      label: 'Findings',      icon: WarningTwoIcon   },
      { key: 'client-portal', label: 'Client Portal', icon: ExternalLinkIcon },
    ],
  },
];

const Sidebar = () => {
  const navigate          = useNavigate();
  const location          = useLocation();
  const { logout }        = useAuth();
  const { settings }      = useSettings();
  const compact           = settings.compactMode;

  const activeKey = location.pathname.replace('/dashboard', '').replace(/^\//, '');

  const itemPy  = compact ? '5px' : '8px';
  const groupGap = compact ? 3 : 5;

  return (
    <Flex
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
      <Flex align="center" gap={2} px={5} mb={compact ? 4 : 7}>
        <Box w="8px" h="8px" borderRadius="full" bg="red.500" boxShadow="0 0 8px rgba(255,55,55,0.8)" />
        <Text fontSize="11px" fontWeight="black" letterSpacing="widest" color="var(--dash-text-primary)" textTransform="uppercase">
          Red Ops Center
        </Text>
      </Flex>

      {/* Nav sections */}
      <Flex direction="column" flex="1" gap={groupGap} px={3}>
        {nav.map((group) => (
          <Box key={group.section}>
            <Text
              fontSize="9px" fontWeight="bold" letterSpacing="widest"
              color="var(--dash-section-label)" textTransform="uppercase"
              px={2} mb={1}
            >
              {group.section}
            </Text>
            {group.items.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <Flex
                  key={item.key}
                  align="center"
                  gap={3}
                  px={3}
                  py={itemPy}
                  borderRadius="8px"
                  cursor="pointer"
                  pos="relative"
                  bg={isActive ? 'rgba(255,80,95,0.12)' : 'transparent'}
                  color={isActive ? 'white' : 'var(--dash-text-secondary)'}
                  transition="all 0.18s ease"
                  onClick={() => navigate(`/dashboard${item.key ? `/${item.key}` : ''}`)}
                  _hover={{ bg: 'var(--dash-nav-hover)', color: 'var(--dash-text-primary)' }}
                >
                  {isActive && (
                    <Box pos="absolute" left="0" top="20%" bottom="20%" w="2px" bg="red.500" borderRadius="full" />
                  )}
                  <item.icon boxSize={3.5} />
                  <Text fontSize="12px" fontWeight={isActive ? 'semibold' : 'normal'}>{item.label}</Text>
                </Flex>
              );
            })}
          </Box>
        ))}
      </Flex>

      {/* Bottom — settings + logout */}
      <Box px={3} pt={4} borderTop="1px solid var(--dash-divider)" mt={4}>
        <Flex
          align="center" gap={3} px={3} py={itemPy} borderRadius="8px"
          cursor="pointer"
          bg={activeKey === 'settings' ? 'rgba(255,80,95,0.12)' : 'transparent'}
          color={activeKey === 'settings' ? 'white' : 'var(--dash-text-secondary)'}
          pos="relative"
          _hover={{ bg: 'var(--dash-nav-hover)', color: 'var(--dash-text-primary)' }}
          transition="all 0.18s"
          onClick={() => navigate('/dashboard/settings')}
        >
          {activeKey === 'settings' && (
            <Box pos="absolute" left="0" top="20%" bottom="20%" w="2px" bg="red.500" borderRadius="full" />
          )}
          <SettingsIcon boxSize={3.5} />
          <Text fontSize="12px" fontWeight={activeKey === 'settings' ? 'semibold' : 'normal'}>Settings</Text>
        </Flex>
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
