import { Box } from '@chakra-ui/react';
import Navigation from '../common/Navigation';
import AuthForm from '../auth/AuthForm';
import LandingHero from './LandingHero';
import LandingShapes from './LandingShapes';

const LandingLayout = () => (
  <Box pos="relative" minH="100vh" overflow="hidden">
    <LandingShapes />
    <Box
      display="flex"
      flexDir={{ base: 'column', md: 'row' }}
      minH="100vh"
      zIndex={1}
      pos="relative"
    >
      <LandingHero />

      <Box
        flex="1"
        d="flex"
        alignItems="center"
        justifyContent="center"
        p={{ base: 5, md: 10 }}
        pos="relative"
        zIndex={2}
      >
        <Box
          pos="absolute"
          left="0"
          top="0"
          h="100%"
          w={{ base: '100%', md: '40%' }}
          bg="rgba(0,0,0,0.15)"
          transform={{ base: 'none', md: 'skewX(-10deg)' }}
          transformOrigin="left"
          zIndex={1}
          pointerEvents="none"
        />
        <Box w={{ base: '100%', md: '580px' }} zIndex={3}>
          <Navigation />
          <AuthForm />
        </Box>
      </Box>
    </Box>
  </Box>
);

export default LandingLayout;
