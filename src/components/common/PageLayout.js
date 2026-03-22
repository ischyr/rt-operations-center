import { Box } from '@chakra-ui/react';
import Navigation from './Navigation';

const PageLayout = ({ children }) => (
  <Box minH="100vh" bg="#111111" p={{ base: 6, md: 12 }}>
    <Navigation />
    <Box maxW="1080px" mx="auto" mt={6} px={{ base: 3, md: 0 }}>
      {children}
    </Box>
  </Box>
);

export default PageLayout;
