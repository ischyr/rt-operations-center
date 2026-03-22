import { ChakraProvider } from '@chakra-ui/react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';
import PageLayout from './components/common/PageLayout';
import LandingLayout from './components/pages/LandingLayout';
import Dashboard from './components/dashboard/Dashboard';
import About from './components/pages/About';
import Operators from './components/pages/Operators';
import Certifications from './components/pages/Certifications';

function AppRoutes() {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Dashboard />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<LandingLayout />} />
      <Route path="/register" element={<LandingLayout />} />
      <Route path="/about" element={<PageLayout><About /></PageLayout>} />
      <Route path="/operators" element={<PageLayout><Operators /></PageLayout>} />
      <Route path="/certifications" element={<PageLayout><Certifications /></PageLayout>} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
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
