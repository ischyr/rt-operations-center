import { useState } from 'react';
import {
  Box, Flex, Text, Button, Input, Select,
  SimpleGrid, Stack, IconButton, Heading,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CheckIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

const COLORS = ['#ECC94B', '#4FD1C5', '#FC8181', '#9F7AEA', '#F6AD55', '#68D391', '#76E4F7', '#F687B3'];
const CATEGORIES = ['Infrastructure', 'Network', 'Tools', 'Other'];

const inputStyles = {
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

const selectStyles = {
  ...inputStyles,
  cursor: 'pointer',
  sx: { option: { bg: '#1a1a1f', color: 'white' }, '& option': { background: '#1a1a1f !important' } },
};

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" fontWeight="semibold" mb={1}>
    {children}
  </Text>
);

const ResourcesView = () => {
  const { slug } = useParams();
  const { getBySlug, updateEngagement } = useEngagements();
  const eng = getBySlug(slug);

  const [showAdd, setShowAdd] = useState(false);
  const [newR, setNewR] = useState({ name: '', category: 'Infrastructure', used: '', total: '', color: COLORS[0] });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  if (!eng) return null;

  const resources = eng.resources || [];

  const save = () => {
    if (!newR.name.trim() || !newR.total) return;
    const entry = {
      _id:      Date.now().toString(),
      name:     newR.name.trim(),
      category: newR.category,
      used:     Number(newR.used) || 0,
      total:    Number(newR.total),
      color:    newR.color,
    };
    updateEngagement(eng.id, { resources: [...resources, entry] });
    setNewR({ name: '', category: 'Infrastructure', used: '', total: '', color: COLORS[0] });
    setShowAdd(false);
  };

  const remove = (id) =>
    updateEngagement(eng.id, { resources: resources.filter((r) => (r._id || r.id) !== id) });

  const startEdit = (r) => {
    setEditingId(r._id || r.id);
    setEditForm({ name: r.name, category: r.category, used: r.used, total: r.total, color: r.color });
  };

  const saveEdit = (id) => {
    updateEngagement(eng.id, {
      resources: resources.map((r) =>
        (r._id || r.id) === id
          ? { ...r, ...editForm, used: Number(editForm.used), total: Number(editForm.total) }
          : r
      ),
    });
    setEditingId(null);
  };

  return (
    <Box pb={8}>
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
          onClick={() => setShowAdd(!showAdd)}
        >
          Add Resource
        </Button>
      </Flex>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <MotionBox
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} overflow="hidden" mb={5}
          >
            <Box bg="var(--dash-card-bg)" border="1px solid rgba(255,80,95,0.2)" borderRadius="14px" p={5}>
              <Text fontSize="11px" fontWeight="bold" color="red.400" mb={4} textTransform="uppercase" letterSpacing="wider">
                New Resource
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <Box>
                  <Label>Resource Name</Label>
                  <Input value={newR.name} onChange={(e) => setNewR((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. VPS Servers, Domains, C2 Servers" {...inputStyles} />
                </Box>
                <Box>
                  <Label>Category</Label>
                  <Select value={newR.category} onChange={(e) => setNewR((p) => ({ ...p, category: e.target.value }))} {...selectStyles}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Box>
                <Box>
                  <Label>Currently In Use</Label>
                  <Input type="number" min={0} value={newR.used}
                    onChange={(e) => setNewR((p) => ({ ...p, used: e.target.value }))}
                    placeholder="0" {...inputStyles} />
                </Box>
                <Box>
                  <Label>Total Available</Label>
                  <Input type="number" min={1} value={newR.total}
                    onChange={(e) => setNewR((p) => ({ ...p, total: e.target.value }))}
                    placeholder="10" {...inputStyles} />
                </Box>
              </SimpleGrid>
              <Box mb={4}>
                <Label>Color</Label>
                <Flex gap={2} flexWrap="wrap">
                  {COLORS.map((c) => (
                    <Box
                      key={c} w="24px" h="24px" borderRadius="6px" cursor="pointer"
                      bg={c} border={newR.color === c ? '2px solid white' : '2px solid transparent'}
                      boxShadow={newR.color === c ? `0 0 8px ${c}` : 'none'}
                      onClick={() => setNewR((p) => ({ ...p, color: c }))}
                      transition="all 0.15s"
                    />
                  ))}
                </Flex>
              </Box>
              <Flex gap={2}>
                <Button size="sm" variant="ghost" color="var(--dash-text-muted)"
                  _hover={{ bg: 'rgba(255,255,255,0.05)' }} onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button size="sm" leftIcon={<AddIcon boxSize={3} />}
                  bgGradient="linear(to-r, red.700, red.500)" color="white"
                  _hover={{ bgGradient: 'linear(to-r, red.600, red.400)' }}
                  onClick={save}>Add Resource</Button>
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
        <Stack spacing={3}>
          {resources.map((r) => {
            const id  = r._id || r.id;
            const pct = r.total > 0 ? Math.min(100, Math.round((r.used / r.total) * 100)) : 0;
            const isEditing = editingId === id;

            return (
              <Box key={id} bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="12px" p={4}>
                {isEditing ? (
                  <>
                    <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3} mb={3}>
                      <Box>
                        <Label>Name</Label>
                        <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} {...inputStyles} h="36px" />
                      </Box>
                      <Box>
                        <Label>Category</Label>
                        <Select value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} {...selectStyles} h="36px">
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                      </Box>
                      <Box>
                        <Label>Used</Label>
                        <Input type="number" value={editForm.used} onChange={(e) => setEditForm((p) => ({ ...p, used: e.target.value }))} {...inputStyles} h="36px" />
                      </Box>
                      <Box>
                        <Label>Total</Label>
                        <Input type="number" value={editForm.total} onChange={(e) => setEditForm((p) => ({ ...p, total: e.target.value }))} {...inputStyles} h="36px" />
                      </Box>
                    </SimpleGrid>
                    <Flex gap={2}>
                      <Button size="xs" variant="ghost" color="var(--dash-text-muted)"
                        _hover={{ bg: 'rgba(255,255,255,0.05)' }} onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button size="xs" leftIcon={<CheckIcon boxSize={2.5} />}
                        bgGradient="linear(to-r, red.700, red.500)" color="white"
                        _hover={{ bgGradient: 'linear(to-r, red.600, red.400)' }}
                        onClick={() => saveEdit(id)}>Save</Button>
                    </Flex>
                  </>
                ) : (
                  <>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Flex align="center" gap={2}>
                        <Box w="10px" h="10px" borderRadius="3px" bg={r.color} boxShadow={`0 0 6px ${r.color}80`} flexShrink={0} />
                        <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">{r.name}</Text>
                        <Text fontSize="10px" color="var(--dash-text-muted)" px="6px" py="1px"
                          borderRadius="4px" bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.08)">
                          {r.category}
                        </Text>
                      </Flex>
                      <Flex align="center" gap={2}>
                        <Text fontSize="12px" fontWeight="bold" color={r.color}>{pct}%</Text>
                        <Text fontSize="11px" color="var(--dash-text-muted)">{r.used}/{r.total}</Text>
                        <IconButton size="xs" icon={<CheckIcon />} variant="ghost"
                          color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                          onClick={() => startEdit(r)} aria-label="Edit" />
                        <IconButton size="xs" icon={<DeleteIcon />} variant="ghost"
                          color="var(--dash-text-muted)" _hover={{ color: 'red.400' }}
                          onClick={() => remove(id)} aria-label="Delete" />
                      </Flex>
                    </Flex>
                    <Box h="5px" bg="var(--dash-progress-track)" borderRadius="full" overflow="hidden">
                      <Box h="100%" w={`${pct}%`} bg={r.color} borderRadius="full" transition="width 0.5s ease" />
                    </Box>
                  </>
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default ResourcesView;
