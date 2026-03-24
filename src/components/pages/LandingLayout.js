import { Box, Flex } from '@chakra-ui/react';
import Navigation from '../common/Navigation';
import AuthForm from '../auth/AuthForm';
import LandingHero from './LandingHero';
import LandingShapes from './LandingShapes';

const LandingLayout = () => (
  <Box pos="relative" h="100vh" overflow="hidden" bg="#0f0f0f">
    <LandingShapes />

    <Flex h="100vh" pos="relative" zIndex={1} flexDir={{ base: 'column', md: 'row' }}>

      {/* Left — hero */}
      <LandingHero />

      {/* Right — nav pinned top, auth form centered */}
      <Flex
        flex="1"
        direction="column"
        h="100vh"
        overflowX="hidden"
        overflowY="auto"
        pos="relative"
        borderLeft={{ base: 'none', md: '1px solid rgba(255,255,255,0.04)' }}
        bg="rgba(0,0,0,0.12)"
        css={{
          '&::-webkit-scrollbar': { width: '3px' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '3px' },
        }}
      >
        {/* Skew bg accent */}
        <Box
          pos="absolute" left="0" top="0" h="100%"
          w={{ base: '100%', md: '35%' }}
          bg="rgba(0,0,0,0.15)"
          transform={{ base: 'none', md: 'skewX(-8deg)' }}
          transformOrigin="left"
          pointerEvents="none"
        />
        {/* Red top glow */}
        <Box
          pos="absolute" top="-60px" left="50%"
          transform="translateX(-50%)"
          w="360px" h="180px"
          bg="rgba(220,38,38,0.06)"
          filter="blur(60px)"
          pointerEvents="none"
        />

        {/* Navigation at top */}
        <Box
          pt={{ base: 6, md: 8 }}
          px={{ base: 5, md: 8, lg: 12 }}
          zIndex={2}
          flexShrink={0}
        >
          <Navigation />
        </Box>

        {/* Auth form centered in remaining space */}
        <Flex
          flex="1"
          align="center"
          justify="center"
          px={{ base: 5, md: 8, lg: 12 }}
          py={{ base: 6, md: 8 }}
          zIndex={2}
          minH="min-content"
        >
          <Box w="100%" maxW={{ base: '100%', md: '480px', lg: '500px' }}>
            <AuthForm />
          </Box>
        </Flex>
      </Flex>
    </Flex>
  </Box>
);

export default LandingLayout;
