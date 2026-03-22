import { useEffect, useMemo, useState } from 'react';
import {
  ChakraProvider,
  extendTheme,
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  Text,
  Input,
  Button,
  Stack,
  Badge,
  Alert,
  AlertIcon,
  Divider,
  SimpleGrid,
  Progress,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  styles: {
    global: {
      'html, body': {
        background: '#0f0f0f',
        color: '#f5f5f5',
        minHeight: '100vh',
        fontFamily: `'Inter', sans-serif`,
      },
    },
  },
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeUser, setActiveUser] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [users, setUsers] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  const selectedPanel = useMemo(() => {
    if (location.pathname.startsWith('/about')) return 'about';
    if (location.pathname.startsWith('/operators')) return 'operators';
    if (location.pathname.startsWith('/certifications')) return 'certifications';
    if (location.pathname.startsWith('/register')) return 'register';
    return 'signin';
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/signin', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleChange = (e, type) => {
    const { name, value } = e.target;
    if (type === 'login') setLoginData((prev) => ({ ...prev, [name]: value }));
    else setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find((u) => u.email === loginData.email && u.password === loginData.password);
    if (user) {
      setIsLoggedIn(true);
      setActiveUser(user.name);
      setAuthMessage('Access granted. Welcome, ' + user.name + '.');
      return;
    }
    setAuthMessage('Invalid credentials. Verify and retry.');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!registerData.name || !registerData.email || !registerData.password) {
      setAuthMessage('All fields required.');
      return;
    }
    if (users.some((u) => u.email === registerData.email)) {
      setAuthMessage('Email already registered.');
      return;
    }
    setUsers((prev) => [...prev, { id: Date.now(), ...registerData }]);
    setRegisterData({ name: '', email: '', password: '' });
    navigate('/signin');
    setAuthMessage('Operator enrolled. Login now.');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveUser('');
    setLoginData({ email: '', password: '' });
    setAuthMessage('Logged out securely.');
  };

  const commonCard = {
    bg: 'rgba(15, 15, 15, 0.9)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
    borderRadius: '24px',
    p: 6,
  };

  const navItems = [
    { key: 'about', label: 'ABOUT', path: '/about' },
    { key: 'operators', label: 'OPERATORS', path: '/operators' },
    { key: 'certifications', label: 'CERTIFICATIONS', path: '/certifications' },
    { key: 'signin', label: 'SIGN IN', path: '/signin' },
    { key: 'register', label: 'REGISTER', path: '/register' },
  ];

  const renderNav = () => (
    <Stack direction="row" spacing={2} justify="center" flexWrap="wrap">
      {navItems.map((item) => (
        <Button
          key={item.key}
          size="sm"
          variant={selectedPanel === item.key ? 'solid' : 'ghost'}
          colorScheme={selectedPanel === item.key ? 'red' : 'gray'}
          _hover={{ bg: 'red.500', color: 'white' }}
          onClick={() => {
            navigate(item.path);
            setAuthMessage('');
          }}
        >
          {item.label}
        </Button>
      ))}
    </Stack>
  );

  const renderPageSection = () => {
    if (selectedPanel === 'about') {
      return (
        <Stack spacing={6}>
          <Heading>About Red Team Operations Center</Heading>
          <Text fontSize="lg" color="white">
            Red Team Operations Center offers an all-in-one command suite for offensive security teams. Track campaigns,
            operator readiness, and mission objectives with collaborative playbooks and live attack telemetry.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Card sx={commonCard} p={4}>
              <Heading size="md">Command Planning</Heading>
              <Text>A unified mission planner with target profiling, phase gates, and escalation controls.</Text>
            </Card>
            <Card sx={commonCard} p={4}>
              <Heading size="md">Data-Driven Ops</Heading>
              <Text>Continuous feed from vulnerability findings, persistence channels, and command traces.</Text>
            </Card>
          </SimpleGrid>
        </Stack>
      );
    }

    if (selectedPanel === 'operators') {
      return (
        <Stack spacing={6}>
          <Heading>Operators</Heading>
          <Text fontSize="lg" color="white">
            Manage squads, assign roles, and benchmark skill paths for SOC/Red Team integration.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {['Wolfpack', 'Nightshade', 'Phantom'].map((team) => (
              <Card key={team} sx={commonCard} p={4}>
                <Heading size="md">{team}</Heading>
                <Text>Active missions, status: live, command stack ready.</Text>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      );
    }

    if (selectedPanel === 'certifications') {
      return (
        <Stack spacing={6}>
          <Heading>Certifications</Heading>
          <Text fontSize="lg" color="white">
            Accreditation matrix and milestone tracking for OSCP, CRTO, GCIA, and internal red team criteria.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {[
              { title: 'OSCP', status: 'Active', progress: 72 },
              { title: 'CRTO', status: 'Pending', progress: 56 },
              { title: 'CIS-SP', status: 'Compliant', progress: 89 },
              { title: 'Internal Blue', status: 'Planning', progress: 41 },
            ].map((cert) => (
              <Card key={cert.title} sx={commonCard} p={4}>
                <Heading size="md">{cert.title}</Heading>
                <Text>{cert.status}</Text>
                <Progress value={cert.progress} mt={3} colorScheme="pink" />
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      );
    }

    return null;
  };

  const renderAuthCard = () => {
    const isRegister = selectedPanel === 'register';
    return (
      <Stack spacing={6} mt={{ base: 8, md: 16 }}>
        <Card sx={{ ...commonCard, minH: '460px', pt: 8, pb: 8 }}>
          <CardBody>
            <Stack spacing={3} align="center">
              <Heading fontSize="3xl">{isRegister ? 'Create operator profile' : 'Welcome back'}</Heading>
              <Text color="gray.300">{isRegister ? 'Register and join the operation.' : 'Sign in to your account.'}</Text>
            </Stack>
            <Stack as="form" spacing={3} mt={6} onSubmit={isRegister ? handleRegister : handleLogin}>
              {isRegister && (
                <Input
                  placeholder="Call-sign"
                  name="name"
                  value={registerData.name}
                  onChange={(e) => handleChange(e, 'register')}
                  variant="filled"
                  bg="rgba(255,255,255,0.08)"
                  _hover={{ bg: 'rgba(255,255,255,0.14)' }}
                />
              )}
              <Input
                placeholder="operator@red-domain.local"
                name="email"
                type="email"
                value={isRegister ? registerData.email : loginData.email}
                onChange={(e) => handleChange(e, isRegister ? 'register' : 'login')}
                variant="filled"
                bg="rgba(255,255,255,0.08)"
                _hover={{ bg: 'rgba(255,255,255,0.14)' }}
              />
              <Input
                placeholder="Secure password"
                name="password"
                type="password"
                value={isRegister ? registerData.password : loginData.password}
                onChange={(e) => handleChange(e, isRegister ? 'register' : 'login')}
                variant="filled"
                bg="rgba(255,255,255,0.08)"
                _hover={{ bg: 'rgba(255,255,255,0.14)' }}
              />
              <Button colorScheme="red" type="submit" size="lg">
                {isRegister ? 'Create Account' : 'Continue'}
              </Button>
            </Stack>
            <Stack spacing={2} mt={3}>
              <Divider />
              <Button variant="outline" colorScheme="gray" size="md">
                Continue with Google
              </Button>
              <Button variant="outline" colorScheme="gray" size="md">
                Continue with X
              </Button>
              <Text textAlign="center" mt={2} color="gray.300">
                {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                <Button variant="link" colorScheme="teal" onClick={() => navigate(isRegister ? '/signin' : '/register')}>
                  {isRegister ? 'Sign in' : 'Sign up'}
                </Button>
              </Text>
            </Stack>
            {authMessage && (
              <Alert status={authMessage.includes('Access') || authMessage.includes('enrolled') ? 'success' : 'warning'} mt={4}>
                <AlertIcon />
                {authMessage}
              </Alert>
            )}
          </CardBody>
        </Card>
      </Stack>
    );
  };

  if (isLoggedIn) {
    return (
      <ChakraProvider theme={theme}>
        <Container maxW="container.md" py={10}>
          <Card sx={commonCard} mb={4}>
            <CardBody>
              <Stack spacing={5}>
                <Heading size="lg">⚔ Operations Center</Heading>
                <Text>
                  Active operator: <Badge colorScheme="red">{activeUser}</Badge>
                </Text>
                <Text color="gray.300">Mission telemetry and breach indicators are live. Maintain secure posture.</Text>
                <Button colorScheme="white" onClick={handleLogout}>Logout</Button>
              </Stack>
            </CardBody>
          </Card>
          <Card sx={commonCard}>
            <CardBody>
              <Heading size="md" mb={3}>Telemetry Overview</Heading>
              <Stack spacing={2}>
                <Text>• Breach attempts: 14</Text>
                <Text>• Active targets: 7</Text>
                <Text>• Phishing vectors: 2</Text>
                <Text>• Alerts: 21</Text>
              </Stack>
            </CardBody>
          </Card>
        </Container>
      </ChakraProvider>
    );
  }

  const staticPanels = ['about', 'operators', 'certifications'];

  if (staticPanels.includes(selectedPanel)) {
    return (
      <ChakraProvider theme={theme}>
        <Box minH="100vh" bg="#0f0f0f" p={{ base: 6, md: 12 }}>
          {renderNav()}
          <Box sx={commonCard} maxW="900px" mx="auto" mt={6} p={8}>
            {renderPageSection()}
          </Box>
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <Box pos="relative" minH="100vh" overflow="hidden">
        <Box
          display="flex"
          flexDir={{ base: 'column', md: 'row' }}
          minH="100vh"
          zIndex={1}
          pos="relative"
        >
          <Box
            flex="1"
            pos="relative"
            bg="#0f0f0f"
            p={{ base: 8, md: 12 }}
            minH={{ base: '55vh', md: '100vh' }}
            color="white"
          >
            <Stack spacing={5} pt={{ base: 8, md: 16 }}>
              <Text fontWeight="black" letterSpacing="wider" fontSize={{ base: 'sm', md: 'md' }} color="red.300">
                RED TEAM OPS CENTER
              </Text>
              <Heading fontSize={{ base: '4xl', md: '6xl' }} lineHeight="short">
                Operations Center
              </Heading>
              <Text fontSize={{ base: 'sm', md: 'lg' }} color="white" maxW="lg">
                A platform that helps red team operators build structure, planning, and execution workflows for
                continuous campaign preparedness and mission excellence.
              </Text>
              <Stack direction="row" spacing={3} wrap="wrap">
                <Badge colorScheme="red" variant="solid">STRUCTURE</Badge>
                <Badge colorScheme="pink" variant="solid">PLANNING</Badge>
                <Badge colorScheme="purple" variant="solid">TACTICS</Badge>
                <Badge colorScheme="orange" variant="solid">COMMAND</Badge>
              </Stack>
              <Text mt={{ base: 12, md: 20 }} fontSize={{ base: 'md', md: 'lg' }} color="gray.400" fontStyle="italic" textAlign="center">
                "Aim for the moon. Even if you miss you will land among the stars..." <br />
                @ Iulian Schifirnet
              </Text>
            </Stack>
          </Box>

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
              {renderNav()}
              {renderAuthCard()}
            </Box>
          </Box>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;



