import { useState } from 'react';
import {
  Box, Flex, Text, Button, Input, Select,
  SimpleGrid, IconButton, Heading,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CheckIcon, EditIcon, CloseIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

const COLORS     = ['#ECC94B', '#4FD1C5', '#FC8181', '#9F7AEA', '#F6AD55', '#68D391', '#76E4F7', '#F687B3'];
const CATEGORIES = ['Infrastructure', 'Network', 'Tools', 'Other'];

const inputSx = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4,
  h: '40px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

const selectSx = {
  bg: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px',
  h: '40px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  cursor: 'pointer',
  focusBorderColor: 'rgba(255,80,95,0.7)',
  _hover: { borderColor: 'rgba(255,80,95,0.4)' },
  sx: { option: { bg: '#1a1a1f', color: 'white' } },
};

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1}>
    {children}
  </Text>
);

const ColorPicker = ({ value, onChange }) => (
  <Flex gap={2} flexWrap="wrap">
    {COLORS.map((c) => (
      <Box
        key={c} w="24px" h="24px" borderRadius="6px" cursor="pointer"
        bg={c}
        border={value === c ? '2px solid white' : '2px solid transparent'}
        boxShadow={value === c ? `0 0 8px ${c}` : 'none'}
        onClick={() => onChange(c)}
        transition="all 0.15s"
      />
    ))}
  </Flex>
);

const EMPTY = { name: '', category: 'Infrastructure', used: '', total: '', color: COLORS[0] };

const ResourcesView = () => {
  const { slug } = useParams();
  const { getBySlug, updateEngagement } = useEngagements();
  const eng = getBySlug(slug);

  const [showAdd,   setShowAdd]   = useState(false);
  const [newR,      setNewR]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm,  setEditForm]  = useState({});
  const [error,     setError]     = useState('');

  if (!eng) return null;
  const resources = eng.resources || [];

  const setN = (k, v) => setNewR(p => ({ ...p, [k]: v }));
  const setE = (k, v) => setEditForm(p => ({ ...p, [k]: v }));

  const addResource = async () => {
    if (!newR.name.trim()) return setError('Resource name is required.');
    if (!newR.total || Number(newR.total) <= 0) return setError('Total must be greater than 0.');
    setError('');
    setSaving(true);
    await updateEngagement(eng.id, {
      resources: [...resources, {
        name:     newR.name.trim(),
        category: newR.category,
        used:     Number(newR.used) || 0,
        total:    Number(newR.total),
        color:    newR.color,
      }],
    });
    setNewR(EMPTY);
    setShowAdd(false);
    setSaving(false);
  };

  const deleteResource = (id) =>
    updateEngagement(eng.id, { resources: resources.filter(r => (r._id || r.id) !== id) });

  const startEdit = (r) => {
    setEditingId(r._id || r.id);
    setEditForm({ name: r.name, category: r.category, used: r.used, total: r.total, color: r.color });
  };

  const saveEdit = async (id) => {
    if (!editForm.name.trim() || Number(editForm.total) <= 0) return;
    await updateEngagement(eng.id, {
      resources: resources.map(r =>
        (r._id || r.id) === id
          ? { ...r, ...editForm, used: Number(editForm.used) || 0, total: Number(editForm.total) }
          : r
      ),
    });
    setEditingId(null);
  };

  return (
    <Box pb={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            Resources <Text as="span" color="red.400">Utilization</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · track hardware, network, tools usage
          </Text>
        </Box>
        <Button
          leftIcon={<AddIcon boxSize={3} />}
          bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
          color="rgba(255,130,130,0.9)" fontSize="sm" borderRadius="10px" h="40px" px={4}
          _hover={{ bg: 'rgba(255,80,95,0.18)' }}
          onClick={() => { setShowAdd(v => !v); setError(''); }}
        >
          Add Resource
        </Button>
      </Flex>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <MotionBox
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            overflow="hidden" mb={5}
          >
            <Box bg="var(--dash-card-bg)" border="1px solid rgba(255,80,95,0.2)" borderRadius="14px" p={5}>
              <Text fontSize="11px" fontWeight="bold" color="red.400" mb={4}
                textTransform="uppercase" letterSpacing="wider">
                New Resource
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <Box>
                  <Label>Resource Name *</Label>
                  <Input value={newR.name} onChange={e => setN('name', e.target.value)}
                    placeholder="e.g. VPS Servers, Domains, C2 Servers" {...inputSx} />
                </Box>
                <Box>
                  <Label>Category</Label>
                  <Select value={newR.category} onChange={e => setN('category', e.target.value)} {...selectSx}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Box>
                <Box>
                  <Label>Currently In Use</Label>
                  <Input type="number" min={0} value={newR.used}
                    onChange={e => setN('used', e.target.value)}
                    placeholder="0" {...inputSx} />
                </Box>
                <Box>
                  <Label>Total Available *</Label>
                  <Input type="number" min={1} value={newR.total}
                    onChange={e => setN('total', e.target.value)}
                    placeholder="10" {...inputSx} />
                </Box>
              </SimpleGrid>

              <Box mb={4}>
                <Label>Color</Label>
                <ColorPicker value={newR.color} onChange={c => setN('color', c)} />
              </Box>

              {error && (
                <Text fontSize="12px" color="red.400" mb={3}>{error}</Text>
              )}

              <Flex gap={2}>
                <Button size="sm" variant="ghost" color="var(--dash-text-muted)"
                  _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                  onClick={() => { setShowAdd(false); setError(''); }}>
                  Cancel
                </Button>
                <Button size="sm" leftIcon={<AddIcon boxSize={3} />}
                  bgGradient="linear(to-r, red.700, red.500)" color="white"
                  _hover={{ bgGradient: 'linear(to-r, red.600, red.400)' }}
                  isLoading={saving} loadingText="Adding..."
                  onClick={addResource}>
                  Add Resource
                </Button>
              </Flex>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Resource list */}
      {resources.length === 0 ? (
        <Flex direction="column" align="center" py={16} gap={3}
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="14px">
          <Text fontSize="2xl">📦</Text>
          <Text fontWeight="semibold" color="var(--dash-text-primary)">No resources tracked</Text>
          <Text fontSize="sm" color="var(--dash-text-muted)">Add resources to track utilization across this engagement.</Text>
        </Flex>
      ) : (
        <AnimatePresence initial={false}>
          {resources.map(r => {
            const id  = r._id || r.id;
            const pct = r.total > 0 ? Math.min(100, Math.round((r.used / r.total) * 100)) : 0;
            const isEditing = editingId === id;

            return (
              <MotionBox
                key={id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                mb={3}
              >
                <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  borderRadius="12px" p={4}>
                  {isEditing ? (
                    <>
                      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3} mb={3}>
                        <Box>
                          <Label>Name</Label>
                          <Input value={editForm.name}
                            onChange={e => setE('name', e.target.value)}
                            {...inputSx} h="36px" />
                        </Box>
                        <Box>
                          <Label>Category</Label>
                          <Select value={editForm.category}
                            onChange={e => setE('category', e.target.value)}
                            {...selectSx} h="36px">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </Select>
                        </Box>
                        <Box>
                          <Label>Used</Label>
                          <Input type="number" min={0} value={editForm.used}
                            onChange={e => setE('used', e.target.value)}
                            {...inputSx} h="36px" />
                        </Box>
                        <Box>
                          <Label>Total</Label>
                          <Input type="number" min={1} value={editForm.total}
                            onChange={e => setE('total', e.target.value)}
                            {...inputSx} h="36px" />
                        </Box>
                      </SimpleGrid>
                      <Box mb={3}>
                        <Label>Color</Label>
                        <ColorPicker value={editForm.color} onChange={c => setE('color', c)} />
                      </Box>
                      <Flex gap={2}>
                        <Button size="xs" variant="ghost" color="var(--dash-text-muted)"
                          leftIcon={<CloseIcon boxSize={2} />}
                          _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                          onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button size="xs" leftIcon={<CheckIcon boxSize={2.5} />}
                          bgGradient="linear(to-r, red.700, red.500)" color="white"
                          _hover={{ bgGradient: 'linear(to-r, red.600, red.400)' }}
                          onClick={() => saveEdit(id)}>
                          Save
                        </Button>
                      </Flex>
                    </>
                  ) : (
                    <>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Flex align="center" gap={2}>
                          <Box w="10px" h="10px" borderRadius="3px" bg={r.color}
                            boxShadow={`0 0 6px ${r.color}80`} flexShrink={0} />
                          <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
                            {r.name}
                          </Text>
                          <Text fontSize="10px" color="var(--dash-text-muted)" px="6px" py="1px"
                            borderRadius="4px" bg="rgba(255,255,255,0.05)"
                            border="1px solid rgba(255,255,255,0.08)">
                            {r.category}
                          </Text>
                        </Flex>
                        <Flex align="center" gap={1}>
                          <Text fontSize="12px" fontWeight="bold" color={r.color} mr={1}>{pct}%</Text>
                          <Text fontSize="11px" color="var(--dash-text-muted)" mr={2}>
                            {r.used}/{r.total}
                          </Text>
                          <IconButton
                            icon={<EditIcon boxSize={3} />} size="xs" variant="ghost"
                            color="var(--dash-text-muted)"
                            _hover={{ color: 'white', bg: 'rgba(255,255,255,0.08)' }}
                            onClick={() => startEdit(r)}
                            aria-label="Edit resource"
                          />
                          <IconButton
                            icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
                            color="var(--dash-text-muted)"
                            _hover={{ color: 'red.400', bg: 'rgba(255,55,55,0.08)' }}
                            onClick={() => deleteResource(id)}
                            aria-label="Delete resource"
                          />
                        </Flex>
                      </Flex>
                      <Box h="5px" bg="var(--dash-progress-track)" borderRadius="full" overflow="hidden">
                        <Box h="100%" w={`${pct}%`} bg={r.color} borderRadius="full"
                          transition="width 0.5s ease" />
                      </Box>
                    </>
                  )}
                </Box>
              </MotionBox>
            );
          })}
        </AnimatePresence>
      )}
    </Box>
  );
};

export default ResourcesView;
