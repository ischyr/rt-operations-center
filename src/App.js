import { ChakraProvider } from '@chakra-ui/react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';
import PageLayout from './components/common/PageLayout';
import LandingLayout from './components/pages/LandingLayout';
import Dashboard from './components/dashboard/Dashboard';
import About from './components/pages/About';
import Operators from './components/pages/Operators';
import Certifications from './components/pages/Certifications';

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2,  ease: 'easeIn'  } },
};

function AppRoutes() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  // signin and register share the same transition key so they
  // don't trigger a full-page swap (the card already animates internally)
  const transitionKey = ['/signin', '/register'].includes(location.pathname)
    ? 'auth'
    : location.pathname;

  if (isLoggedIn) {
    return <Dashboard />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ minHeight: '100vh' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<LandingLayout />} />
          <Route path="/register" element={<LandingLayout />} />
          <Route path="/about" element={<PageLayout><About /></PageLayout>} />
          <Route path="/operators" element={<PageLayout><Operators /></PageLayout>} />
          <Route path="/certifications" element={<PageLayout><Certifications /></PageLayout>} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
