import { useState } from 'react';
import {
  Box, Stack, Heading, Text, Input,
  InputGroup, InputLeftElement, Button,
  Alert, AlertIcon, Divider, Flex, Image,
  PinInput, PinInputField, HStack,
} from '@chakra-ui/react';
import { EmailIcon, LockIcon, AtSignIcon, ArrowForwardIcon, CheckIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEngagements } from '../../contexts/EngagementContext';

const MotionBox = motion(Box);

const variants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -14, transition: { duration: 0.2,  ease: 'easeIn'  } },
};

const inputStyles = {
  variant:      'unstyled',
  bg:           'rgba(255,255,255,0.05)',
  border:       '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px:           4,
  h:            '48px',
  fontSize:     'sm',
  color:        'white',
  _placeholder: { color: 'gray.600' },
  _hover:       { border: '1px solid rgba(255,80,95,0.4)', bg: 'rgba(255,255,255,0.07)' },
  _focus:       { border: '1px solid rgba(255,80,95,0.7)', bg: 'rgba(255,255,255,0.07)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

const pinFieldStyles = {
  w:            '46px',
  h:            '56px',
  fontSize:     'xl',
  fontWeight:   'bold',
  textAlign:    'center',
  bg:           'rgba(255,255,255,0.05)',
  border:       '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  color:        'white',
  _focus:       { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

// ── QR Setup Step ─────────────────────────────────────────────────────────────
const QRSetupStep = ({ qrData, onConfirm, onCancel, authMessage }) => {
  const [code, setCode] = useState('');

  return (
    <MotionBox key="qr-setup" variants={variants} initial="initial" animate="animate" exit="exit">
      <Stack spacing={1} mb={6}>
        <Flex align="center" gap={3}>
          <Box w="3px" h="28px" bgGradient="linear(to-b, red.500, red.800)" borderRadius="full" />
          <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold">Secure Your Account</Heading>
        </Flex>
        <Text color="gray.500" fontSize="sm" pl="15px">
          Scan the QR code with Google Authenticator
        </Text>
      </Stack>

      {/* QR Code */}
      <Flex justify="center" mb={5}>
        <Box
          p={3} bg="white" borderRadius="12px"
          boxShadow="0 0 30px rgba(255,55,55,0.15)"
        >
          <Image src={qrData.qrCode} alt="2FA QR Code" w="180px" h="180px" />
        </Box>
      </Flex>

      {/* Manual entry */}
      <Box
        mb={5} p={3} borderRadius="8px"
        bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
      >
        <Text fontSize="10px" color="gray.600" letterSpacing="wider" textTransform="uppercase" mb={1}>
          Or enter manually
        </Text>
        <Text fontSize="11px" color="gray.400" fontFamily="mono" letterSpacing="wider" wordBreak="break-all">
          {qrData.tempSecret}
        </Text>
      </Box>

      {/* OTP input */}
      <Stack spacing={3}>
        <Text fontSize="12px" color="gray.500" textAlign="center">
          Enter the 6-digit code from your authenticator
        </Text>
        <Flex justify="center">
          <HStack>
            <PinInput
              otp
              size="lg"
              value={code}
              onChange={setCode}
              onComplete={(val) => onConfirm(qrData.email, val)}
            >
              {[...Array(6)].map((_, i) => (
                <PinInputField key={i} sx={pinFieldStyles} />
              ))}
            </PinInput>
          </HStack>
        </Flex>

        <Button
          size="lg" h="48px" borderRadius="10px"
          bgGradient="linear(to-r, red.700, red.500)"
          color="white" fontWeight="semibold" fontSize="sm"
          letterSpacing="wide"
          rightIcon={<CheckIcon />}
          boxShadow="0 0 20px rgba(255,55,55,0.2)"
          transition="all 0.22s ease"
          isDisabled={code.length < 6}
          onClick={() => onConfirm(qrData.email, code)}
          _hover={{ bgGradient: 'linear(to-r, red.600, red.400)', boxShadow: '0 0 32px rgba(255,55,55,0.45)', transform: 'translateY(-1px)' }}
          _active={{ transform: 'translateY(0)' }}
        >
          Verify & Activate
        </Button>
        <Button
          size="sm" variant="ghost" color="gray.500" fontSize="sm"
          _hover={{ color: 'gray.300', bg: 'rgba(255,255,255,0.05)' }}
          onClick={onCancel}
        >
          Cancel registration
        </Button>
      </Stack>

      {authMessage && (
        <Alert status="warning" mt={4} borderRadius="10px" fontSize="sm">
          <AlertIcon />{authMessage}
        </Alert>
      )}
    </MotionBox>
  );
};

// ── 2FA Verify Step ───────────────────────────────────────────────────────────
const TwoFactorStep = ({ onVerify, authMessage }) => {
  const [code, setCode] = useState('');

  return (
    <MotionBox key="2fa-verify" variants={variants} initial="initial" animate="animate" exit="exit">
      <Stack spacing={1} mb={7}>
        <Flex align="center" gap={3}>
          <Box w="3px" h="28px" bgGradient="linear(to-b, red.500, red.800)" borderRadius="full" />
          <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold">Two-Factor Auth</Heading>
        </Flex>
        <Text color="gray.500" fontSize="sm" pl="15px">
          Enter the 6-digit code from your authenticator app
        </Text>
      </Stack>

      <Stack spacing={4}>
        <Flex justify="center">
          <HStack>
            <PinInput
              otp
              size="lg"
              value={code}
              onChange={setCode}
              onComplete={(val) => onVerify(val)}
            >
              {[...Array(6)].map((_, i) => (
                <PinInputField key={i} sx={pinFieldStyles} />
              ))}
            </PinInput>
          </HStack>
        </Flex>

        <Button
          size="lg" h="48px" borderRadius="10px"
          bgGradient="linear(to-r, red.700, red.500)"
          color="white" fontWeight="semibold" fontSize="sm"
          letterSpacing="wide"
          rightIcon={<ArrowForwardIcon />}
          boxShadow="0 0 20px rgba(255,55,55,0.2)"
          isDisabled={code.length < 6}
          transition="all 0.22s ease"
          onClick={() => onVerify(code)}
          _hover={{ bgGradient: 'linear(to-r, red.600, red.400)', boxShadow: '0 0 32px rgba(255,55,55,0.45)', transform: 'translateY(-1px)' }}
          _active={{ transform: 'translateY(0)' }}
        >
          Verify
        </Button>
      </Stack>

      {authMessage && (
        <Alert
          status={authMessage.toLowerCase().includes('granted') ? 'success' : 'warning'}
          mt={4} borderRadius="10px" fontSize="sm"
        >
          <AlertIcon />{authMessage}
        </Alert>
      )}
    </MotionBox>
  );
};

// ── Main AuthForm ─────────────────────────────────────────────────────────────
const AuthForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    authMessage, login, register,
    pendingQrData, pendingTempToken,
    confirmSetup, verify2FA, cancelSetup,
  } = useAuth();
  const { fetchEngagements } = useEngagements();

  const isRegister = location.pathname === '/register';
  const showQr     = !!pendingQrData;
  const show2FA    = !!pendingTempToken && !pendingQrData;

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      const result = await register(formData.name, formData.email, formData.password);
      if (result === 'qr') setFormData({ name: '', email: '', password: '' });
    } else {
      const result = await login(formData.email, formData.password);
      if (result === true || result === '2fa' || result === 'qr') {
        setFormData({ name: '', email: '', password: '' });
      }
      // Direct login (no 2FA) — fetch data then transition
      if (result === true) {
        await fetchEngagements();
        setIsTransitioning(true);
      }
    }
  };

  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleConfirmSetup = async (email, code) => {
    const ok = await confirmSetup(email, code);
    if (ok) {
      await fetchEngagements();
      setIsTransitioning(true);
    }
  };

  const handleVerify2FA = async (code) => {
    const ok = await verify2FA(code);
    if (ok) {
      await fetchEngagements();
      setIsTransitioning(true);
    }
  };

  // Determine which step key to animate on
  const stepKey = showQr ? 'qr' : show2FA ? '2fa' : isRegister ? 'register' : 'signin';

  return (
    <>
    <Box>
      <Box
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
        <Box pos="absolute" top="0" left="0" right="0" h="2px"
          bgGradient="linear(to-r, transparent, red.600, transparent)" />

        {/* Background glow */}
        <Box pos="absolute" top="-60px" right="-60px" w="220px" h="220px"
          borderRadius="full" bg="rgba(255,40,40,0.05)"
          filter="blur(50px)" pointerEvents="none" />

        <AnimatePresence mode="wait">
          {/* ── QR Setup ── */}
          {showQr && (
            <QRSetupStep
              key="qr"
              qrData={pendingQrData}
              onConfirm={handleConfirmSetup}
              onCancel={cancelSetup}
              authMessage={authMessage}
            />
          )}

          {/* ── 2FA Verify ── */}
          {show2FA && (
            <TwoFactorStep
              key="2fa"
              onVerify={handleVerify2FA}
              authMessage={authMessage}
            />
          )}

          {/* ── Credentials form ── */}
          {!showQr && !show2FA && (
            <MotionBox
              key={stepKey}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
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
                    <Input placeholder="Call-sign" name="name"
                      value={formData.name} onChange={handleChange} pl={9} {...inputStyles} />
                  </InputGroup>
                )}
                <InputGroup>
                  <InputLeftElement h="48px" pl={2}>
                    <EmailIcon color="gray.600" boxSize={3.5} />
                  </InputLeftElement>
                  <Input placeholder="operator@red-domain.local" name="email" type="email"
                    value={formData.email} onChange={handleChange} pl={9} {...inputStyles} />
                </InputGroup>
                <InputGroup>
                  <InputLeftElement h="48px" pl={2}>
                    <LockIcon color="gray.600" boxSize={3.5} />
                  </InputLeftElement>
                  <Input placeholder="Secure password" name="password" type="password"
                    value={formData.password} onChange={handleChange} pl={9} {...inputStyles} />
                </InputGroup>

                <Button
                  type="submit" size="lg" h="48px" mt={1} borderRadius="10px"
                  bgGradient="linear(to-r, red.700, red.500)"
                  color="white" fontWeight="semibold" fontSize="sm" letterSpacing="wide"
                  rightIcon={<ArrowForwardIcon />}
                  boxShadow="0 0 20px rgba(255,55,55,0.2)"
                  transition="all 0.22s ease"
                  _hover={{ bgGradient: 'linear(to-r, red.600, red.400)', boxShadow: '0 0 32px rgba(255,55,55,0.45)', transform: 'translateY(-1px)' }}
                  _active={{ transform: 'translateY(0)' }}
                >
                  {isRegister ? 'Create Account' : 'Continue'}
                </Button>
              </Stack>

              {/* Divider + OAuth */}
              <Stack spacing={3} mt={5}>
                <Flex align="center" gap={3}>
                  <Divider borderColor="rgba(255,255,255,0.08)" />
                  <Text fontSize="11px" color="gray.600" whiteSpace="nowrap" flexShrink={0}>OR CONTINUE WITH</Text>
                  <Divider borderColor="rgba(255,255,255,0.08)" />
                </Flex>
                <Flex gap={3}>
                  {/* Google */}
                  <Button
                    flex={1} h="42px" fontSize="sm" borderRadius="10px"
                    bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.09)"
                    color="gray.300" fontWeight="normal" transition="all 0.2s"
                    _hover={{ bg: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' }}
                    leftIcon={
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    }
                    onClick={() => { window.location.href = 'http://localhost:5000/api/oauth/google'; }}
                  >
                    Google
                  </Button>
                  {/* GitHub */}
                  <Button
                    flex={1} h="42px" fontSize="sm" borderRadius="10px"
                    bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.09)"
                    color="gray.300" fontWeight="normal" transition="all 0.2s"
                    _hover={{ bg: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' }}
                    leftIcon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                    }
                    onClick={() => { window.location.href = 'http://localhost:5000/api/oauth/github'; }}
                  >
                    GitHub
                  </Button>
                </Flex>
                <Text textAlign="center" fontSize="sm" color="gray.600" mt={1}>
                  {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                  <Button
                    variant="link" fontSize="sm" color="red.400" fontWeight="semibold"
                    _hover={{ color: 'red.300' }}
                    onClick={() => navigate(isRegister ? '/signin' : '/register')}
                  >
                    {isRegister ? 'Sign in' : 'Sign up'}
                  </Button>
                </Text>
              </Stack>

              {authMessage && (
                <Alert
                  status={authMessage.includes('granted') || authMessage.includes('enrolled') ? 'success' : 'warning'}
                  mt={5} borderRadius="10px" fontSize="sm"
                >
                  <AlertIcon />{authMessage}
                </Alert>
              )}
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>
    </Box>

    {/* ── Dashboard entry transition overlay ── */}
    <AnimatePresence>
      {isTransitioning && (
        <MotionBox
          key="dashboard-transition"
          pos="fixed" top="0" left="0" right="0" bottom="0"
          zIndex={9999}
          bg="rgba(5,5,7,0.97)"
          display="flex" alignItems="center" justifyContent="center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeIn' }}
          onAnimationComplete={() => navigate('/dashboard')}
        >
          {/* Red radial pulse */}
          <MotionBox
            pos="absolute"
            w="320px" h="320px"
            borderRadius="full"
            bg="radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 70%)"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 2.5, opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
          {/* Small glowing dot at center */}
          <MotionBox
            w="10px" h="10px" borderRadius="full"
            bg="red.500"
            boxShadow="0 0 24px 8px rgba(239,68,68,0.6)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.7] }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </MotionBox>
      )}
    </AnimatePresence>
    </>
  );
};

export default AuthForm;
