import { Box, Stack } from '@chakra-ui/react';
import AboutIntro from './about/AboutIntro';
import StrategicFramework from './about/StrategicFramework';
import FeatureGrid from './about/FeatureGrid';
import AboutShapes from './about/AboutShapes';

const About = () => (
  <Box position="relative" w="100%" py={{ base: 8, md: 12 }}>
    <Box
      pos="absolute"
      inset="0"
      bgImage="radial-gradient(circle at 15% 25%, rgba(255, 0, 0, 0.2), transparent 40%), radial-gradient(circle at 85% 20%, rgba(90, 20, 20, 0.25), transparent 50%)"
      opacity={0.4}
      zIndex={-2}
    />
    <AboutShapes />
    <Stack spacing={8} align="center" zIndex={1}>
      <AboutIntro />
      <StrategicFramework />
      <FeatureGrid />
    </Stack>
  </Box>
);

export default About;
