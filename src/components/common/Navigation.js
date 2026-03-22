import { Box, Flex, Text } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { key: 'about',          label: 'ABOUT',          path: '/about'          },
  { key: 'operators',      label: 'OPERATORS',      path: '/operators'      },
  { key: 'certifications', label: 'CERTIFICATIONS', path: '/certifications' },
  { key: 'signin',         label: 'SIGN IN',        path: '/signin'         },
  { key: 'register',       label: 'REGISTER',       path: '/register'       },
];

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearMessage } = useAuth();

  const active = (() => {
    if (location.pathname.startsWith('/about'))          return 'about';
    if (location.pathname.startsWith('/operators'))      return 'operators';
    if (location.pathname.startsWith('/certifications')) return 'certifications';
    if (location.pathname.startsWith('/register'))       return 'register';
    return 'signin';
  })();

  const handleClick = (path) => {
    navigate(path);
    clearMessage();
  };

  return (
    <Flex
      direction="row"
      wrap="wrap"
      justify="center"
      gap={1}
      p="6px"
      bg="rgba(255,255,255,0.07)"
      border="1px solid rgba(255,255,255,0.14)"
      borderRadius="14px"
      backdropFilter="blur(8px)"
    >
      {navItems.map((item) => {
        const isActive = active === item.key;
        const isAuthBtn = item.key === 'signin' || item.key === 'register';

        return (
          <Box
            key={item.key}
            as="button"
            pos="relative"
            px={{ base: 3, md: 4 }}
            py="7px"
            borderRadius="9px"
            fontSize="11px"
            fontWeight="bold"
            letterSpacing="widest"
            cursor="pointer"
            overflow="hidden"
            transition="all 0.22s ease"
            onClick={() => handleClick(item.path)}
            color={isActive ? 'white' : 'gray.500'}
            bg={
              isActive
                ? isAuthBtn
                  ? 'rgba(255,55,55,0.9)'
                  : 'rgba(255,255,255,0.08)'
                : 'transparent'
            }
            boxShadow={
              isActive && isAuthBtn
                ? '0 0 18px rgba(255,55,55,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                : isActive
                ? '0 0 0 1px rgba(255,255,255,0.1)'
                : 'none'
            }
            _hover={{
              color: 'white',
              bg: isAuthBtn
                ? 'rgba(255,55,55,0.75)'
                : 'rgba(255,255,255,0.07)',
              boxShadow: isAuthBtn
                ? '0 0 20px rgba(255,55,55,0.35)'
                : 'none',
            }}
          >
            {/* Active indicator dot */}
            {isActive && !isAuthBtn && (
              <Box
                pos="absolute"
                bottom="4px"
                left="50%"
                transform="translateX(-50%)"
                w="3px"
                h="3px"
                borderRadius="full"
                bg="red.400"
              />
            )}

            {/* Active red top line for auth buttons */}
            {isActive && isAuthBtn && (
              <Box
                pos="absolute"
                top="0" left="0" right="0"
                h="1.5px"
                bgGradient="linear(to-r, transparent, white, transparent)"
                opacity={0.4}
              />
            )}

            <Text as="span">{item.label}</Text>
          </Box>
        );
      })}
    </Flex>
  );
};

export default Navigation;
