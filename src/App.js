import { useState } from 'react';
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
} from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      'html, body': {
        background: 'linear-gradient(145deg, #02040a 0%, #090f1e 40%, #051429 100%)',
        color: '#e2e8f0',
        minHeight: '100vh',
      },
    },
  },
});

function App() {
  const [selectedPanel, setSelectedPanel] = useState('signin');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeUser, setActiveUser] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [users, setUsers] = useState([]);

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
    setView('login');
    setAuthMessage('Operator enrolled. Login now.');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveUser('');
    setLoginData({ email: '', password: '' });
    setAuthMessage('Logged out securely.');
  };

  const commonCard = {
    bg: 'rgba(1, 12, 23, 0.76)',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.65)',
    borderRadius: '24px',
    p: 6,
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
                <Button colorScheme="red" onClick={handleLogout}>Logout</Button>
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

  const panelContent = () => {
    if (selectedPanel === 'about') {
      return (
        <Stack spacing={3}>
          <Heading size="md">About Us</Heading>
          <Text>
            Red Team Operations Center is your offensive command center for targeted pentest campaigns,
            stealth recon, and exploit execution. Monitor objectives, manage squads, and drill continuously.
          </Text>
        </Stack>
      );
    }
    if (selectedPanel === 'operators') {
      return (
        <Stack spacing={3}>
          <Heading size="md">Operators</Heading>
          <Text>Active teams:
            <Box as="span" color="red.300" ml={2}>Wolfpack, Nightshade, Phantom</Box>
          </Text>
          <Text>Skill zones include AD, cloud, ICS, IoT and source-level scalar analysis.</Text>
        </Stack>
      );
    }
    if (selectedPanel === 'certifications') {
      return (
        <Stack spacing={3}>
          <Heading size="md">Certifications</Heading>
          <Text>Current compliance level: CIS-3, ISO27001, NIST800-53. Red team status: elevated.</Text>
          <Text>Operators may enroll for OSCP, CRTO, GWAPT training via built-in academy paths.</Text>
        </Stack>
      );
    }

    // signin/register forms
    const isRegister = selectedPanel === 'register';
    return (
      <Stack as="form" spacing={3} onSubmit={isRegister ? handleRegister : handleLogin}>
        {isRegister && (
          <Input
            placeholder="Call-sign"
            name="name"
            value={registerData.name}
            onChange={(e) => handleChange(e, 'register')}
            variant="filled"
            bg="rgba(255,255,255,0.08)"
            _hover={{ bg: 'rgba(255,255,255,0.16)' }}
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
          _hover={{ bg: 'rgba(255,255,255,0.16)' }}
        />

        <Input
          placeholder="Secure password"
          name="password"
          type="password"
          value={isRegister ? registerData.password : loginData.password}
          onChange={(e) => handleChange(e, isRegister ? 'register' : 'login')}
          variant="filled"
          bg="rgba(255,255,255,0.08)"
          _hover={{ bg: 'rgba(255,255,255,0.16)' }}
        />

        <Button colorScheme="red" type="submit" size="lg">
          {isRegister ? 'Register' : 'Sign In'}
        </Button>
      </Stack>
    );
  };

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
            bg="linear-gradient(135deg, #1b1322 5%, #260d1e 45%, #100a14 100%)"
            p={{ base: 8, md: 12 }}
            minH={{ base: '55vh', md: '100vh' }}
            color="white"
          >
            <Box pos="absolute" top="-30px" right="20px" w="260px" h="260px" bg="red.500" opacity="0.13" borderRadius="full" />
            <Box pos="absolute" bottom="40px" left="30px" w="200px" h="200px" bg="purple.500" opacity="0.12" borderRadius="full" />
            <Stack spacing={5} pt={{ base: 8, md: 16 }}>
              <Text fontWeight="black" letterSpacing="wider" fontSize={{ base: 'sm', md: 'md' }} color="red.300">
                RED TEAM OPS CENTER
              </Text>
              <Heading fontSize={{ base: '4xl', md: '6xl' }} lineHeight="short">
                Breach simulation hub
              </Heading>
              <Text fontSize={{ base: 'sm', md: 'lg' }} color="gray.200" maxW="lg">
                Full stack offense operations, recon orchestration, and vector intelligence in one hardened console.
                Bridge your payload crafting to environment persistence with next-gen command controls.
              </Text>
              <Stack direction="row" spacing={3} wrap="wrap">
                <Badge colorScheme="red" variant="solid">CAMPAIGN</Badge>
                <Badge colorScheme="pink" variant="solid">RECON</Badge>
                <Badge colorScheme="purple" variant="solid">INTRUSION</Badge>
                <Badge colorScheme="orange" variant="solid">FORGE</Badge>
              </Stack>
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
            />
            <Card
              sx={commonCard}
              w={{ base: '100%', md: '520px' }}
              zIndex={3}
              mt={{ base: 0, md: 16 }}
            >
              <CardBody>
                <Stack spacing={4}>
                  <Stack justify="space-between" direction="row" align="center">
                    <Heading size="lg">Connect</Heading>
                    <Stack direction="row" spacing={2}>
                      {['about', 'operators', 'certifications', 'signin', 'register'].map((item) => (
                        <Button
                          key={item}
                          size="xs"
                          variant={selectedPanel === item ? 'solid' : 'ghost'}
                          colorScheme={selectedPanel === item ? 'red' : 'gray'}
                          onClick={() => {
                            setSelectedPanel(item);
                            setAuthMessage('');
                          }}
                        >
                          {item === 'signin' ? 'SIGN IN' : item === 'register' ? 'REGISTER' : item.toUpperCase()}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>

                  <Text color="gray.300">{selectedPanel === 'about' ? 'Learn more about our red team accelerator.' : selectedPanel === 'operators' ? 'Manage operators and team status.' : selectedPanel === 'certifications' ? 'Track compliance and cert progress.' : selectedPanel === 'signin' ? 'Enter your credentials to start a session.' : 'Create a new operator profile to join the dev ops.'}</Text>

                  {panelContent()}
                </Stack>
              </CardBody>
            </Card>
          </Box>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;



