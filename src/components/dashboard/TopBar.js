import { useState } from 'react';
import { Flex, Box, Text, Input, InputGroup, InputLeftElement, Image } from '@chakra-ui/react';
import { SearchIcon, BellIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';
import ProfileModal from './ProfileModal';

const TopBar = () => {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
            _placeholder={{ color: 'gray.700' }}
            _hover={{ border: '1px solid rgba(255,255,255,0.14)' }}
            _focus={{ border: '1px solid rgba(255,80,95,0.5)', boxShadow: 'none', bg: 'rgba(255,255,255,0.05)' }}
          />
        </InputGroup>

        {/* Right side */}
        <Flex align="center" gap={3}>
          {/* Notifications */}
          <Flex
            pos="relative"
            w="34px" h="34px" align="center" justify="center"
            borderRadius="8px" bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.08)"
            cursor="pointer"
            _hover={{ bg: 'rgba(255,255,255,0.08)' }}
            transition="all 0.18s"
          >
            <BellIcon boxSize={3.5} color="gray.400" />
            <Box
              pos="absolute" top="7px" right="7px"
              w="5px" h="5px" borderRadius="full"
              bg="red.500" border="1px solid #111"
            />
          </Flex>

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
            {/* Avatar */}
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

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};

export default TopBar;
