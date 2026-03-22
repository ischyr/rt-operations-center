import { Button, Stack } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearMessage } = useAuth();

  const selectedPanel = (() => {
    if (location.pathname.startsWith('/about')) return 'about';
    if (location.pathname.startsWith('/operators')) return 'operators';
    if (location.pathname.startsWith('/certifications')) return 'certifications';
    if (location.pathname.startsWith('/register')) return 'register';
    return 'signin';
  })();

  const navItems = [
    { key: 'about', label: 'ABOUT', path: '/about' },
    { key: 'operators', label: 'OPERATORS', path: '/operators' },
    { key: 'certifications', label: 'CERTIFICATIONS', path: '/certifications' },
    { key: 'signin', label: 'SIGN IN', path: '/signin' },
    { key: 'register', label: 'REGISTER', path: '/register' },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    clearMessage();
  };

  return (
    <Stack direction="row" spacing={2} justify="center" flexWrap="wrap">
      {navItems.map((item) => (
        <Button
          key={item.key}
          size="sm"
          variant={selectedPanel === item.key ? 'solid' : 'ghost'}
          colorScheme={selectedPanel === item.key ? 'red' : 'gray'}
          _hover={{ bg: 'red.500', color: 'white' }}
          onClick={() => handleNavClick(item.path)}
        >
          {item.label}
        </Button>
      ))}
    </Stack>
  );
};

export default Navigation;