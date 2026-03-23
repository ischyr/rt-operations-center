import { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalBody,
  Box, Flex, Text, Stack, Grid, Input, Select,
  Button, Divider, Alert, AlertIcon,
} from '@chakra-ui/react';
import { AddIcon, RepeatIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements, generateOperationName } from '../../../contexts/EngagementContext';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion(Box);

const TYPES = [
  'External',
  'Internal',
  'External + Internal',
  'Full Scope',
  'Phishing',
  'Web Application',
];

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
  _hover:       { border: '1px solid rgba(255,80,95,0.4)' },
  _focus:       { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

const selectStyles = {
  ...inputStyles,
  h: '44px',
  cursor: 'pointer',
};

const Label = ({ children }) => (
  <Text fontSize="10px" color="gray.600" textTransform="uppercase" letterSpacing="wider" fontWeight="semibold" mb={1}>
    {children}
  </Text>
);

const SectionHeader = ({ children }) => (
  <Flex align="center" gap={2} mb={4}>
    <Box w="2px" h="14px" bgGradient="linear(to-b, red.500, red.800)" borderRadius="full" />
    <Text fontSize="11px" fontWeight="semibold" color="gray.400" letterSpacing="wide">{children}</Text>
  </Flex>
);

const NewEngagementModal = ({ isOpen, onClose }) => {
  const { addEngagement, allUsers } = useEngagements();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:      generateOperationName(),
    company:   '',
    type:      'External + Internal',
    startDate: '',
    endDate:   '',
    operators: [],
    stage:     '',
  });
  const [error, setError] = useState('');

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const toggleOperator = (name) => {
    setForm((p) => ({
      ...p,
      operators: p.operators.includes(name)
        ? p.operators.filter((o) => o !== name)
        : [...p.operators, name],
    }));
  };

  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim())    return setError('Operation name is required.');
    if (!form.company.trim()) return setError('Company name is required.');
    if (!form.type)           return setError('Engagement type is required.');
    if (!form.startDate)      return setError('Start date is required.');
    if (!form.endDate)        return setError('End date is required.');
    if (form.endDate < form.startDate) return setError('End date must be after start date.');

    setError('');
    setIsCreating(true);
    try {
      const eng = await addEngagement({ ...form, stage: form.stage || 'Preparing' });
      onClose();
      navigate(`/dashboard/${eng.slug}`);
    } catch (err) {
      setError(err.message || 'Failed to create engagement.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setError('');
    setForm({ name: generateOperationName(), company: '', type: 'External + Internal', startDate: '', endDate: '', operators: [], stage: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="rgba(0,0,0,0.8)" backdropFilter="blur(8px)" />
      <ModalContent
        bg="rgba(10,10,12,0.97)"
        border="1px solid rgba(255,255,255,0.08)"
        borderRadius="20px"
        overflow="hidden"
        boxShadow="0 32px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,80,95,0.06)"
        mx={4}
        pos="relative"
      >
        <Box pos="absolute" top="0" left="0" right="0" h="2px"
          bgGradient="linear(to-r, transparent, red.600, transparent)" zIndex={1} />

        <ModalBody p={0}>
          {/* Header */}
          <Flex align="center" justify="space-between" px={7} pt={7} pb={5}>
            <Flex align="center" gap={3}>
              <Box w="3px" h="22px" bgGradient="linear(to-b, red.500, red.800)" borderRadius="full" />
              <Text fontWeight="bold" fontSize="lg" color="white">New Engagement</Text>
            </Flex>
            <Button size="sm" variant="ghost" color="gray.600"
              _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
              borderRadius="8px" h="28px" w="28px" minW="28px" p={0} fontSize="16px"
              onClick={handleClose}>✕</Button>
          </Flex>

          <Divider borderColor="rgba(255,255,255,0.06)" />

          <Stack spacing={6} px={7} py={6}>

            {/* ── Identity ── */}
            <Box>
              <SectionHeader>Identity</SectionHeader>
              <Stack spacing={4}>
                <Box>
                  <Label>Operation Name</Label>
                  <Flex gap={2}>
                    <Input
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="Operation Phantom Vortex"
                      flex={1}
                      {...inputStyles}
                    />
                    <Button
                      h="44px" px={3} borderRadius="10px"
                      bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                      color="gray.400" fontSize="xs"
                      onClick={() => set('name', generateOperationName())}
                      _hover={{ bg: 'rgba(255,80,95,0.1)', borderColor: 'rgba(255,80,95,0.4)', color: 'white' }}
                      transition="all 0.18s"
                      title="Generate random name"
                    >
                      <RepeatIcon boxSize={3.5} />
                    </Button>
                  </Flex>
                </Box>
                <Box>
                  <Label>Target Company</Label>
                  <Input
                    value={form.company}
                    onChange={(e) => set('company', e.target.value)}
                    placeholder="Nexus Financial Group"
                    {...inputStyles}
                  />
                </Box>
              </Stack>
            </Box>

            <Divider borderColor="rgba(255,255,255,0.06)" />

            {/* ── Scope ── */}
            <Box>
              <SectionHeader>Scope & Timeline</SectionHeader>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <Box gridColumn="1 / -1">
                  <Label>Engagement Type</Label>
                  <Select
                    value={form.type}
                    onChange={(e) => set('type', e.target.value)}
                    {...selectStyles}
                    sx={{
                      option: { bg: '#1a1a1f', color: 'white' },
                      '& option': { background: '#1a1a1f !important' },
                    }}
                  >
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </Box>
                <Box>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                    {...inputStyles}
                    sx={{ colorScheme: 'dark', '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.5)' } }}
                  />
                </Box>
                <Box>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set('endDate', e.target.value)}
                    {...inputStyles}
                    sx={{ colorScheme: 'dark', '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.5)' } }}
                  />
                </Box>
              </Grid>
            </Box>

            <Divider borderColor="rgba(255,255,255,0.06)" />

            {/* ── Team & Stage ── */}
            <Box>
              <SectionHeader>Team & Phase</SectionHeader>
              <Stack spacing={4}>
                <Box>
                  <Label>Assign Operators <Text as="span" color="gray.700">(optional)</Text></Label>
                  <Flex gap={2} flexWrap="wrap">
                    {allUsers.length === 0 && (
                      <Text fontSize="12px" color="gray.600">No users found in database.</Text>
                    )}
                    {allUsers.map((user) => {
                      const uid    = String(user.id);
                      const active = form.operators.includes(uid);
                      return (
                        <Box
                          key={uid}
                          as="button"
                          onClick={() => toggleOperator(uid)}
                          px={3} py="6px" borderRadius="8px" fontSize="12px"
                          border={active ? '1px solid rgba(255,80,95,0.55)' : '1px solid rgba(255,255,255,0.1)'}
                          bg={active ? 'rgba(255,80,95,0.1)' : 'rgba(255,255,255,0.04)'}
                          color={active ? 'white' : 'gray.500'}
                          cursor="pointer" transition="all 0.18s"
                          _hover={{ borderColor: 'rgba(255,80,95,0.4)', color: 'white' }}
                        >
                          {active && <Box as="span" mr={1} color="red.400">✓</Box>}
                          {user.callsign}
                        </Box>
                      );
                    })}
                  </Flex>
                </Box>
                <Box>
                  <Label>Current Stage <Text as="span" color="gray.700">(optional — defaults to "Preparing")</Text></Label>
                  <Input
                    value={form.stage}
                    onChange={(e) => set('stage', e.target.value)}
                    placeholder="e.g. Lateral Movement, Initial Access, Reporting..."
                    {...inputStyles}
                  />
                </Box>
              </Stack>
            </Box>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <MotionBox
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
                >
                  <Alert status="warning" borderRadius="10px" fontSize="sm"
                    bg="rgba(251,191,36,0.1)" border="1px solid rgba(251,191,36,0.2)">
                    <AlertIcon />{error}
                  </Alert>
                </MotionBox>
              )}
            </AnimatePresence>

            {/* Actions */}
            <Flex gap={3} pb={1}>
              <Button
                flex={1} h="44px" borderRadius="10px"
                variant="ghost" color="gray.600" fontSize="sm"
                _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                flex={2} h="44px" borderRadius="10px"
                bgGradient="linear(to-r, red.700, red.500)"
                color="white" fontWeight="semibold" fontSize="sm" letterSpacing="wide"
                rightIcon={<AddIcon boxSize={3} />}
                onClick={handleCreate}
                isLoading={isCreating}
                loadingText="Creating..."
                _hover={{ bgGradient: 'linear(to-r, red.600, red.400)', boxShadow: '0 0 24px rgba(255,55,55,0.35)', transform: 'translateY(-1px)' }}
                _active={{ transform: 'translateY(0)' }}
                transition="all 0.2s"
              >
                Create Engagement
              </Button>
            </Flex>

          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NewEngagementModal;
