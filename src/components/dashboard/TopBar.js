import { Flex, Box, Text, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { SearchIcon, BellIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';

const TopBar = () => {
  const { user } = useAuth();

  return (
    <Flex
      h="56px"
      px={6}
      align="center"
      justify="space-between"
      borderBottom="1px solid rgba(255,255,255,0.06)"
      bg="rgba(0,0,0,0.25)"
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
          {/* Notification dot */}
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
          _hover={{ bg: 'rgba(255,255,255,0.07)' }}
          transition="all 0.18s"
        >
          {/* Avatar circle */}
          <Flex
            w="22px" h="22px" borderRadius="full"
            bg="red.700" align="center" justify="center"
            border="1px solid rgba(255,80,95,0.4)"
            flexShrink={0}
          >
            <Text fontSize="9px" fontWeight="black" color="white">
              {user?.callsign?.charAt(0)?.toUpperCase() || 'O'}
            </Text>
          </Flex>
          <Text fontSize="12px" fontWeight="semibold" color="gray.300">
            @{user?.callsign || 'operator'}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default TopBar;
