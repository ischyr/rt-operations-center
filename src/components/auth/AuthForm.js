import { useState } from 'react';
import {
  Box,
  Stack,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Alert,
  AlertIcon,
  Divider,
  Flex,
} from '@chakra-ui/react';
import { EmailIcon, LockIcon, AtSignIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const MotionBox = motion(Box);

const cardVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -14, transition: { duration: 0.2,  ease: 'easeIn'  } },
};

const inputStyles = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4,
  h: '48px',
  fontSize: 'sm',
  color: 'white',
  _placeholder: { color: 'gray.600' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)', bg: 'rgba(255,255,255,0.07)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', bg: 'rgba(255,255,255,0.07)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

const AuthForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authMessage, login, register } = useAuth();

  const isRegister = location.pathname === '/register';

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      const ok = await register(formData.name, formData.email, formData.password);
      if (ok) {
        setFormData({ name: '', email: '', password: '' });
        navigate('/signin');
      }
    } else {
      const ok = await login(formData.email, formData.password);
      if (ok) setFormData({ name: '', email: '', password: '' });
    }
  };

  return (
    <Box mt={{ base: 8, md: 14 }}>
      <AnimatePresence mode="wait">
        <MotionBox
          key={isRegister ? 'register' : 'signin'}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          pos="relative"
          bg="rgba(10,10,12,0.92)"
          border="1px solid rgba(255,255,255,0.08)"
          borderRadius="24px"
          overflow="hidden"
          boxShadow="0 32px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,80,95,0.06)"
          backdropFilter="blur(12px)"
          p={{ base: 6, md: 8 }}
        >
          {/* Top gradient accent */}
          <Box
            pos="absolute" top="0" left="0" right="0" h="2px"
            bgGradient="linear(to-r, transparent, red.600, transparent)"
          />

          {/* Background glow */}
          <Box
            pos="absolute" top="-60px" right="-60px"
            w="220px" h="220px" borderRadius="full"
            bg="rgba(255,40,40,0.05)" filter="blur(50px)"
            pointerEvents="none"
          />

          {/* Header */}
          <Stack spacing={1} mb={7}>
            <Flex align="center" gap={3}>
              <Box w="3px" h="28px" bgGradient="linear(to-b, red.500, red.800)" borderRadius="full" />
              <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold">
                {isRegister ? 'Create operator profile' : 'Welcome back'}
              </Heading>
            </Flex>
            <Text color="gray.500" fontSize="sm" pl="15px">
              {isRegister ? 'Register and join the operation.' : 'Sign in to your operator account.'}
            </Text>
          </Stack>

          {/* Form */}
          <Stack as="form" spacing={3} onSubmit={handleSubmit}>
            {isRegister && (
              <InputGroup>
                <InputLeftElement h="48px" pl={2}>
                  <AtSignIcon color="gray.600" boxSize={3.5} />
                </InputLeftElement>
                <Input
                  placeholder="Call-sign"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  pl={9}
                  {...inputStyles}
                />
              </InputGroup>
            )}
            <InputGroup>
              <InputLeftElement h="48px" pl={2}>
                <EmailIcon color="gray.600" boxSize={3.5} />
              </InputLeftElement>
              <Input
                placeholder="operator@red-domain.local"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                pl={9}
                {...inputStyles}
              />
            </InputGroup>
            <InputGroup>
              <InputLeftElement h="48px" pl={2}>
                <LockIcon color="gray.600" boxSize={3.5} />
              </InputLeftElement>
              <Input
                placeholder="Secure password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                pl={9}
                {...inputStyles}
              />
            </InputGroup>

            <Button
              type="submit"
              size="lg"
              h="48px"
              mt={1}
              borderRadius="10px"
              bgGradient="linear(to-r, red.700, red.500)"
              color="white"
              fontWeight="semibold"
              fontSize="sm"
              letterSpacing="wide"
              rightIcon={<ArrowForwardIcon />}
              boxShadow="0 0 20px rgba(255,55,55,0.2)"
              transition="all 0.22s ease"
              _hover={{
                bgGradient: 'linear(to-r, red.600, red.400)',
                boxShadow: '0 0 32px rgba(255,55,55,0.45)',
                transform: 'translateY(-1px)',
              }}
              _active={{ transform: 'translateY(0)' }}
            >
              {isRegister ? 'Create Account' : 'Continue'}
            </Button>
          </Stack>

          {/* Divider + OAuth */}
          <Stack spacing={3} mt={5}>
            <Flex align="center" gap={3}>
              <Divider borderColor="rgba(255,255,255,0.08)" />
              <Text fontSize="11px" color="gray.600" whiteSpace="nowrap" flexShrink={0}>
                OR CONTINUE WITH
              </Text>
              <Divider borderColor="rgba(255,255,255,0.08)" />
            </Flex>

            <Flex gap={3}>
              <Button
                flex={1}
                h="42px"
                fontSize="sm"
                borderRadius="10px"
                bg="rgba(255,255,255,0.04)"
                border="1px solid rgba(255,255,255,0.09)"
                color="gray.300"
                fontWeight="normal"
                transition="all 0.2s"
                _hover={{ bg: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' }}
              >
                Google
              </Button>
              <Button
                flex={1}
                h="42px"
                fontSize="sm"
                borderRadius="10px"
                bg="rgba(255,255,255,0.04)"
                border="1px solid rgba(255,255,255,0.09)"
                color="gray.300"
                fontWeight="normal"
                transition="all 0.2s"
                _hover={{ bg: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' }}
              >
                X / Twitter
              </Button>
            </Flex>

            <Text textAlign="center" fontSize="sm" color="gray.600" mt={1}>
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <Button
                variant="link"
                fontSize="sm"
                color="red.400"
                fontWeight="semibold"
                _hover={{ color: 'red.300' }}
                onClick={() => navigate(isRegister ? '/signin' : '/register')}
              >
                {isRegister ? 'Sign in' : 'Sign up'}
              </Button>
            </Text>
          </Stack>

          {authMessage && (
            <Alert
              status={authMessage.includes('Access') || authMessage.includes('enrolled') ? 'success' : 'warning'}
              mt={5}
              borderRadius="10px"
              fontSize="sm"
            >
              <AlertIcon />
              {authMessage}
            </Alert>
          )}
        </MotionBox>
      </AnimatePresence>
    </Box>
  );
};

export default AuthForm;
