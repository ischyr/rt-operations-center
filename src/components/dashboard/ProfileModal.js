import { useState, useRef } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalBody,
  Box, Flex, Text, Stack, Input, InputGroup, InputLeftElement,
  Button, Divider, Alert, AlertIcon, HStack,
  PinInput, PinInputField,
} from '@chakra-ui/react';
import { AtSignIcon, LockIcon, CheckIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const MotionBox = motion(Box);

const inputStyles = {
  variant:      'unstyled',
  bg:           'rgba(255,255,255,0.05)',
  border:       '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px:           4,
  h:            '44px',
  fontSize:     'sm',
  color:        'white',
  _placeholder: { color: 'gray.600' },
  _hover:       { border: '1px solid rgba(255,80,95,0.4)', bg: 'rgba(255,255,255,0.07)' },
  _focus:       { border: '1px solid rgba(255,80,95,0.7)', bg: 'rgba(255,255,255,0.07)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

const pinFieldStyles = {
  w:            '40px',
  h:            '48px',
  fontSize:     'lg',
  fontWeight:   'bold',
  bg:           'rgba(255,255,255,0.05)',
  border:       '1px solid rgba(255,255,255,0.12)',
  borderRadius: '9px',
  color:        'white',
  _focus:       { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

const SectionLabel = ({ children }) => (
  <Text fontSize="9px" letterSpacing="0.12em" color="gray.600"
    textTransform="uppercase" fontWeight="semibold" mb={3}>
    {children}
  </Text>
);

// Resize an image file to 150×150 JPEG (≈5-15 KB as base64)
const resizeImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = 150;
        canvas.height = 150;
        const ctx     = canvas.getContext('2d');
        const minDim  = Math.min(img.width, img.height);
        const sx      = (img.width  - minDim) / 2;
        const sy      = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 150, 150);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile, changePassword } = useAuth();
  const fileRef = useRef();

  const [callsign,         setCallsign]         = useState(user?.callsign || '');
  const [avatarPreview,    setAvatarPreview]     = useState(user?.avatar   || null);
  const [avatarData,       setAvatarData]        = useState(null);

  const [currentPassword,  setCurrentPassword]   = useState('');
  const [newPassword,      setNewPassword]        = useState('');
  const [confirmPassword,  setConfirmPassword]    = useState('');

  const [pendingAction,    setPendingAction]      = useState(null); // 'profile' | 'password'
  const [totpCode,         setTotpCode]           = useState('');
  const [isLoading,        setIsLoading]          = useState(false);
  const [msg,              setMsg]                = useState(null); // { text, status }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setAvatarPreview(resized);
    setAvatarData(resized);
  };

  const handleSaveProfile = () => {
    setMsg(null);
    setTotpCode('');
    setPendingAction('profile');
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setMsg({ text: 'New passwords do not match.', status: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ text: 'New password must be at least 6 characters.', status: 'error' });
      return;
    }
    setMsg(null);
    setTotpCode('');
    setPendingAction('password');
  };

  const handleTotpComplete = async (code) => {
    setIsLoading(true);
    setMsg(null);

    let result;
    if (pendingAction === 'profile') {
      result = await updateProfile(
        callsign !== user?.callsign ? callsign : undefined,
        avatarData,
        code,
      );
    } else {
      result = await changePassword(currentPassword, newPassword, code);
    }

    setIsLoading(false);
    setMsg({ text: result.message, status: result.ok ? 'success' : 'error' });

    if (result.ok) {
      setPendingAction(null);
      setTotpCode('');
      if (pendingAction === 'password') {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      setAvatarData(null);
    } else {
      setTotpCode('');
    }
  };

  const handleClose = () => {
    setPendingAction(null);
    setTotpCode('');
    setMsg(null);
    setCallsign(user?.callsign || '');
    setAvatarPreview(user?.avatar || null);
    setAvatarData(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered scrollBehavior="inside">
      <ModalOverlay bg="rgba(0,0,0,0.75)" backdropFilter="blur(8px)" />
      <ModalContent
        bg="rgba(10,10,12,0.97)"
        border="1px solid rgba(255,255,255,0.08)"
        borderRadius="20px"
        overflow="hidden"
        boxShadow="0 32px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,80,95,0.06)"
        mx={4}
        pos="relative"
      >
        {/* Top red accent line */}
        <Box pos="absolute" top="0" left="0" right="0" h="2px"
          bgGradient="linear(to-r, transparent, red.600, transparent)" zIndex={1} />

        <ModalBody p={0}>
          <Stack spacing={0} divider={<Divider borderColor="rgba(255,255,255,0.06)" />}>

            {/* ── Header ── */}
            <Flex align="center" justify="space-between" px={6} pt={7} pb={5}>
              <Flex align="center" gap={3}>
                <Box w="3px" h="22px" bgGradient="linear(to-b, red.500, red.800)" borderRadius="full" />
                <Text fontWeight="bold" fontSize="lg" color="white" letterSpacing="tight">
                  Operator Profile
                </Text>
              </Flex>
              <Button
                size="sm" variant="ghost" color="gray.600"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                borderRadius="8px" h="28px" w="28px" minW="28px" p={0}
                onClick={handleClose}
                fontSize="16px"
              >
                ✕
              </Button>
            </Flex>

            {/* ── Avatar ── */}
            <Flex direction="column" align="center" py={6}>
              <Box
                pos="relative" cursor="pointer" role="group"
                onClick={() => fileRef.current?.click()}
              >
                <Box
                  w="84px" h="84px" borderRadius="full"
                  border="2px solid rgba(255,80,95,0.25)"
                  overflow="hidden"
                  transition="all 0.22s"
                  _groupHover={{ borderColor: 'rgba(255,80,95,0.65)', boxShadow: '0 0 24px rgba(255,50,50,0.22)' }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      referrerPolicy="no-referrer"
                      style={{ width: '84px', height: '84px', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <Flex w="84px" h="84px" bg="rgba(185,28,28,0.35)" align="center" justify="center">
                      <Text fontSize="2xl" fontWeight="black" color="white">
                        {user?.callsign?.charAt(0)?.toUpperCase() || 'O'}
                      </Text>
                    </Flex>
                  )}
                </Box>
                {/* Hover overlay */}
                <Flex
                  pos="absolute" inset="0" borderRadius="full"
                  bg="rgba(0,0,0,0.58)" align="center" justify="center"
                  opacity={0} transition="opacity 0.2s"
                  _groupHover={{ opacity: 1 }}
                >
                  <Text fontSize="8px" color="white" fontWeight="bold" letterSpacing="0.1em">
                    CHANGE
                  </Text>
                </Flex>
              </Box>
              <Text fontSize="10px" color="gray.600" mt={2} letterSpacing="wide">
                Click to upload photo
              </Text>
              <input
                type="file" accept="image/*" ref={fileRef}
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </Flex>

            {/* ── Profile section ── */}
            <Box px={6} py={5}>
              <SectionLabel>Profile</SectionLabel>
              <Stack spacing={3}>
                <InputGroup>
                  <InputLeftElement h="44px" pl={2}>
                    <AtSignIcon color="gray.600" boxSize={3.5} />
                  </InputLeftElement>
                  <Input
                    placeholder="Call-sign"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    pl={9}
                    {...inputStyles}
                  />
                </InputGroup>
                <Button
                  h="38px" borderRadius="9px"
                  bgGradient="linear(to-r, red.800, red.600)"
                  color="white" fontWeight="semibold" fontSize="xs" letterSpacing="wide"
                  rightIcon={<CheckIcon boxSize={2.5} />}
                  isDisabled={!callsign.trim() && !avatarData}
                  onClick={handleSaveProfile}
                  _hover={{ bgGradient: 'linear(to-r, red.700, red.500)', boxShadow: '0 0 20px rgba(255,55,55,0.28)' }}
                  _active={{ transform: 'translateY(1px)' }}
                  transition="all 0.2s"
                >
                  Save Profile
                </Button>
              </Stack>
            </Box>

            {/* ── Security section ── */}
            <Box px={6} py={5}>
              <SectionLabel>Security</SectionLabel>
              <Stack spacing={3}>
                <InputGroup>
                  <InputLeftElement h="44px" pl={2}>
                    <LockIcon color="gray.600" boxSize={3.5} />
                  </InputLeftElement>
                  <Input
                    placeholder="Current password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    pl={9}
                    {...inputStyles}
                  />
                </InputGroup>
                <InputGroup>
                  <InputLeftElement h="44px" pl={2}>
                    <LockIcon color="gray.600" boxSize={3.5} />
                  </InputLeftElement>
                  <Input
                    placeholder="New password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    pl={9}
                    {...inputStyles}
                  />
                </InputGroup>
                <InputGroup>
                  <InputLeftElement h="44px" pl={2}>
                    <LockIcon color="gray.600" boxSize={3.5} />
                  </InputLeftElement>
                  <Input
                    placeholder="Confirm new password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    pl={9}
                    {...inputStyles}
                  />
                </InputGroup>
                <Button
                  h="38px" borderRadius="9px"
                  bgGradient="linear(to-r, red.800, red.600)"
                  color="white" fontWeight="semibold" fontSize="xs" letterSpacing="wide"
                  rightIcon={<CheckIcon boxSize={2.5} />}
                  isDisabled={!currentPassword || !newPassword || !confirmPassword}
                  onClick={handleChangePassword}
                  _hover={{ bgGradient: 'linear(to-r, red.700, red.500)', boxShadow: '0 0 20px rgba(255,55,55,0.28)' }}
                  _active={{ transform: 'translateY(1px)' }}
                  transition="all 0.2s"
                >
                  Change Password
                </Button>
              </Stack>
            </Box>

            {/* ── 2FA confirmation panel ── */}
            <AnimatePresence>
              {pendingAction && (
                <MotionBox
                  key="totp-confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                  overflow="hidden"
                >
                  <Box
                    px={6} py={5}
                    bg="rgba(220,38,38,0.04)"
                    borderTop="1px solid rgba(255,80,95,0.1)"
                  >
                    <Flex align="center" gap={2} mb={1}>
                      <Box w="2px" h="14px" bgGradient="linear(to-b, red.500, red.800)" borderRadius="full" />
                      <Text fontSize="11px" fontWeight="semibold" color="gray.400" letterSpacing="wide">
                        Confirm with Authenticator
                      </Text>
                    </Flex>
                    <Text fontSize="10px" color="gray.600" mb={4} pl="14px">
                      Enter the 6-digit code from Google Authenticator to confirm this change.
                    </Text>

                    <Flex justify="center" mb={4}>
                      <HStack spacing={2}>
                        <PinInput
                          otp size="md"
                          value={totpCode}
                          onChange={setTotpCode}
                          isDisabled={isLoading}
                          onComplete={handleTotpComplete}
                        >
                          {[...Array(6)].map((_, i) => (
                            <PinInputField key={i} sx={pinFieldStyles} />
                          ))}
                        </PinInput>
                      </HStack>
                    </Flex>

                    <Flex gap={2}>
                      <Button
                        flex={1} h="36px" borderRadius="9px"
                        variant="ghost" color="gray.500" fontSize="xs"
                        _hover={{ bg: 'rgba(255,255,255,0.06)', color: 'white' }}
                        onClick={() => { setPendingAction(null); setTotpCode(''); setMsg(null); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        flex={2} h="36px" borderRadius="9px"
                        bgGradient="linear(to-r, red.800, red.600)"
                        color="white" fontWeight="semibold" fontSize="xs"
                        isDisabled={totpCode.length < 6 || isLoading}
                        isLoading={isLoading}
                        onClick={() => handleTotpComplete(totpCode)}
                        _hover={{ bgGradient: 'linear(to-r, red.700, red.500)' }}
                      >
                        Confirm
                      </Button>
                    </Flex>
                  </Box>
                </MotionBox>
              )}
            </AnimatePresence>

            {/* ── Status message ── */}
            <AnimatePresence>
              {msg && (
                <MotionBox
                  key="msg"
                  px={6} pb={5}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Alert
                    status={msg.status === 'success' ? 'success' : 'warning'}
                    borderRadius="10px" fontSize="sm"
                    bg={msg.status === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(251,191,36,0.1)'}
                    border={msg.status === 'success' ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(251,191,36,0.2)'}
                  >
                    <AlertIcon />
                    {msg.text}
                  </Alert>
                </MotionBox>
              )}
            </AnimatePresence>

          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ProfileModal;
