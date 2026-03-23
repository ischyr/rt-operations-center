import { useState, useRef, useEffect } from 'react';
import { Flex, Box, Text, Input, InputGroup, InputLeftElement, Image, Portal } from '@chakra-ui/react';
import { SearchIcon, BellIcon, RepeatIcon } from '@chakra-ui/icons';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEngagements } from '../../contexts/EngagementContext';
import ProfileModal from './ProfileModal';

const TYPE_COLORS = {
  engagement: '#FC8181',
  finding:    '#F6AD55',
  milestone:  '#4FD1C5',
  resource:   '#ECC94B',
  team:       '#9F7AEA',
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const NotifPanel = ({ logs, pos, onClose, panelRef }) => {
  const navigate = useNavigate();

  const handleNav = (slug) => {
    navigate(`/dashboard/${slug}`);
    onClose();
  };

  return (
    <Box
      ref={panelRef}
      pos="fixed"
      top={`${pos.top}px`}
      right={`${pos.right}px`}
      w="340px"
      maxH="420px"
      overflowY="auto"
      bg="#0d0d10"
      border="1px solid rgba(255,255,255,0.12)"
      borderRadius="14px"
      boxShadow="0 24px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,80,95,0.08)"
      zIndex={9999}
      sx={{
        '&::-webkit-scrollbar': { w: '4px' },
        '&::-webkit-scrollbar-thumb': { bg: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
      }}
    >
      {/* Top accent */}
      <Box h="2px" bgGradient="linear(to-r, transparent, red.600, transparent)" borderRadius="14px 14px 0 0" />

      {/* Header */}
      <Flex align="center" gap={2} px={4} pt={4} pb={3} borderBottom="1px solid rgba(255,255,255,0.07)">
        <RepeatIcon boxSize={3} color="red.400" />
        <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)" textTransform="uppercase">
          Recent Activity
        </Text>
        {logs.length > 0 && (
          <Box ml="auto" px="7px" py="1px" borderRadius="20px" bg="rgba(255,80,95,0.12)" border="1px solid rgba(255,80,95,0.25)">
            <Text fontSize="10px" fontWeight="bold" color="red.400">{logs.length}</Text>
          </Box>
        )}
      </Flex>

      {/* Body */}
      <Box px={4} py={3}>
        {logs.length === 0 ? (
          <Flex direction="column" align="center" py={8} gap={2}>
            <Text fontSize="xl">🔔</Text>
            <Text fontSize="sm" color="var(--dash-text-muted)">No activity yet.</Text>
            <Text fontSize="11px" color="var(--dash-text-muted)">Start an engagement to see logs here.</Text>
          </Flex>
        ) : (
          <Flex direction="column" gap={0}>
            {logs.map((a, i) => (
              <Flex
                key={i} align="flex-start" gap={3} py={3}
                borderBottom={i < logs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
              >
                <Box
                  w="6px" h="6px" borderRadius="full" mt="5px" flexShrink={0}
                  bg={TYPE_COLORS[a.type] || TYPE_COLORS.engagement}
                  boxShadow={`0 0 6px ${TYPE_COLORS[a.type] || TYPE_COLORS.engagement}`}
                />
                <Box flex="1">
                  <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="short">
                    {a.engagementName && (
                      <Text
                        as="span" color="var(--dash-text-primary)" fontWeight="semibold"
                        cursor="pointer" _hover={{ color: 'red.400' }}
                        onClick={() => handleNav(a.engagementSlug)}
                      >
                        {a.engagementName.replace('Operation ', '')}
                      </Text>
                    )}
                    {a.engagementName ? ' · ' : ''}{a.description}
                  </Text>
                  <Text fontSize="10px" color="var(--dash-text-muted)" mt="2px">
                    {timeAgo(a.createdAt)}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  );
};

const TopBar = () => {
  const { user } = useAuth();
  const { dashboardStats } = useEngagements();
  const { activityLogs } = dashboardStats;
  const navigate   = useNavigate();
  const location   = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isEngagementsPage = location.pathname === '/dashboard/engagements';
  const [searchVal, setSearchVal] = useState(() => searchParams.get('q') || '');

  // Keep input in sync when navigating away and back
  useEffect(() => {
    if (isEngagementsPage) {
      setSearchVal(searchParams.get('q') || '');
    } else {
      setSearchVal('');
    }
  }, [location.pathname]); // eslint-disable-line

  const handleSearch = (val) => {
    setSearchVal(val);
    if (isEngagementsPage) {
      setSearchParams(val ? { q: val } : {}, { replace: true });
    } else if (val) {
      navigate(`/dashboard/engagements?q=${encodeURIComponent(val)}`);
    }
  };

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen,   setIsNotifOpen]   = useState(false);
  const [panelPos,      setPanelPos]      = useState({ top: 0, right: 0 });

  const bellRef  = useRef(null);
  const panelRef = useRef(null);

  // Compute fixed position from bell button rect
  const openNotif = () => {
    if (!isNotifOpen && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setPanelPos({
        top:   rect.bottom + 10,
        right: window.innerWidth - rect.right,
      });
    }
    setIsNotifOpen((o) => !o);
  };

  // Close on outside click (both bell and panel must be excluded)
  useEffect(() => {
    if (!isNotifOpen) return;
    const handler = (e) => {
      if (bellRef.current?.contains(e.target))  return;
      if (panelRef.current?.contains(e.target)) return;
      setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isNotifOpen]);

  const unread = activityLogs.length > 0;

  return (
    <>
      <Flex
        h="56px"
        px={6}
        align="center"
        justify="space-between"
        borderBottom="1px solid var(--dash-card-border)"
        bg="var(--dash-topbar-bg)"
        backdropFilter="blur(12px)"
        flexShrink={0}
      >
        {/* Search */}
        <InputGroup w="240px">
          <InputLeftElement h="34px" pointerEvents="none">
            <SearchIcon boxSize={3} color="gray.600" />
          </InputLeftElement>
          <Input
            h="34px"
            fontSize="12px"
            placeholder="Search operations..."
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="8px"
            color="gray.300"
            value={searchVal}
            onChange={(e) => handleSearch(e.target.value)}
            _placeholder={{ color: 'gray.700' }}
            _hover={{ border: '1px solid rgba(255,255,255,0.14)' }}
            _focus={{ border: '1px solid rgba(255,80,95,0.5)', boxShadow: 'none', bg: 'rgba(255,255,255,0.05)' }}
          />
        </InputGroup>

        {/* Right side */}
        <Flex align="center" gap={3}>
          {/* Notifications bell */}
          <Box pos="relative" ref={bellRef}>
            <Flex
              w="34px" h="34px" align="center" justify="center"
              borderRadius="8px"
              bg={isNotifOpen ? 'rgba(255,80,95,0.1)' : 'rgba(255,255,255,0.04)'}
              border={isNotifOpen ? '1px solid rgba(255,80,95,0.35)' : '1px solid rgba(255,255,255,0.08)'}
              cursor="pointer"
              onClick={openNotif}
              _hover={{ bg: 'rgba(255,80,95,0.08)', borderColor: 'rgba(255,80,95,0.25)' }}
              transition="all 0.18s"
            >
              <BellIcon boxSize={3.5} color={isNotifOpen ? 'red.400' : 'gray.400'} />
              {unread && !isNotifOpen && (
                <Box
                  pos="absolute" top="7px" right="7px"
                  w="5px" h="5px" borderRadius="full"
                  bg="red.500" border="1px solid #111"
                />
              )}
            </Flex>
          </Box>

          {/* User chip */}
          <Flex
            align="center" gap={2}
            px={3} py="6px"
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="8px"
            cursor="pointer"
            onClick={() => setIsProfileOpen(true)}
            _hover={{ bg: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,80,95,0.3)' }}
            transition="all 0.18s"
          >
            <Box
              w="22px" h="22px" borderRadius="full"
              overflow="hidden"
              border="1px solid rgba(255,80,95,0.4)"
              flexShrink={0}
            >
              {user?.avatar ? (
                <Image src={user.avatar} w="22px" h="22px" objectFit="cover" />
              ) : (
                <Flex w="22px" h="22px" bg="red.700" align="center" justify="center">
                  <Text fontSize="9px" fontWeight="black" color="white">
                    {user?.callsign?.charAt(0)?.toUpperCase() || 'O'}
                  </Text>
                </Flex>
              )}
            </Box>
            <Text fontSize="12px" fontWeight="semibold" color="gray.300">
              @{user?.callsign || 'operator'}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      {/* Portal renders the panel at body level — escapes TopBar stacking context */}
      {isNotifOpen && (
        <Portal>
          <NotifPanel
            logs={activityLogs}
            pos={panelPos}
            onClose={() => setIsNotifOpen(false)}
            panelRef={panelRef}
          />
        </Portal>
      )}

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};

export default TopBar;
