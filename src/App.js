import { ChakraProvider } from '@chakra-ui/react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { EngagementProvider } from './contexts/EngagementContext';
import theme from './theme';
import PageLayout from './components/common/PageLayout';
import LandingLayout from './components/pages/LandingLayout';
import DashboardLayout from './components/dashboard/DashboardLayout';
import OAuthCallback from './components/auth/OAuthCallback';
import About from './components/pages/About';
import Operators from './components/pages/Operators';
import Certifications from './components/pages/Certifications';
import Pricing from './components/pages/Pricing';

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2,  ease: 'easeIn'  } },
};

function AppRoutes() {
  const location = useLocation();
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return null;

  // Dashboard — protected, own full-screen layout, no page transition wrapper
  if (location.pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) return <Navigate to="/signin" replace />;
    return (
      <Routes location={location}>
        <Route path="/dashboard/*" element={<DashboardLayout />} />
      </Routes>
    );
  }

  // Public routes with AnimatePresence page transitions
  const transitionKey = ['/signin', '/register'].includes(location.pathname)
    ? 'auth'
    : location.pathname;

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
          <Route path="/"               element={<Navigate to={isLoggedIn ? '/dashboard' : '/signin'} replace />} />
          <Route path="/signin"         element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LandingLayout />} />
          <Route path="/register"       element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LandingLayout />} />
          <Route path="/oauth/callback"  element={<OAuthCallback />} />
          <Route path="/about"          element={<PageLayout><About /></PageLayout>} />
          <Route path="/operators"      element={<PageLayout><Operators /></PageLayout>} />
          <Route path="/certifications" element={<PageLayout><Certifications /></PageLayout>} />
          <Route path="/pricing"        element={<PageLayout><Pricing /></PageLayout>} />
          <Route path="*"               element={<Navigate to={isLoggedIn ? '/dashboard' : '/signin'} replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <SettingsProvider>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <EngagementProvider>
            <AppRoutes />
          </EngagementProvider>
        </AuthProvider>
      </ChakraProvider>
    </SettingsProvider>
  );
}

export default App;
