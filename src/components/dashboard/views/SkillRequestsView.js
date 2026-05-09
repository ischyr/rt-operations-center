import { useState } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select, Textarea,
  SimpleGrid, Modal, ModalOverlay, ModalContent, ModalBody, Icon, useDisclosure,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { FaBrain } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Cloud', 'Active Directory', 'Network', 'Web Application',
  'Malware Development', 'OSINT', 'Social Engineering',
  'Physical Security', 'Cryptography', 'Linux', 'Windows', 'Mobile', 'Other',
];

const PRIORITY_META = {
  Critical: { color: '#fc8181', bg: 'rgba(252,129,129,0.12)', border: 'rgba(252,129,129,0.3)'  },
  High:     { color: '#f6ad55', bg: 'rgba(246,173,85,0.12)',  border: 'rgba(246,173,85,0.3)'   },
  Medium:   { color: '#fcd34d', bg: 'rgba(252,211,77,0.12)',  border: 'rgba(252,211,77,0.3)'   },
  Low:      { color: '#93c5fd', bg: 'rgba(147,197,253,0.12)', border: 'rgba(147,197,253,0.3)'  },
};

const STATUS_META = {
  Open:     { color: '#fc8181', bg: 'rgba(252,129,129,0.1)',  border: 'rgba(252,129,129,0.25)', label: 'Open'     },
  Learning: { color: '#fcd34d', bg: 'rgba(252,211,77,0.1)',   border: 'rgba(252,211,77,0.25)',  label: 'Learning' },
  Resolved: { color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)',  border: 'rgba(110,231,183,0.25)', label: 'Resolved' },
};

const STATUS_CYCLE = { Open: 'Learning', Learning: 'Resolved', Resolved: 'Open' };

const inputStyles = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

const selectStyles = {
  bg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px', h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  cursor: 'pointer', focusBorderColor: 'rgba(255,80,95,0.7)',
  _hover: { borderColor: 'rgba(255,80,95,0.4)' },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1}>{children}</Text>
);

const BLANK = { skill: '', category: 'Cloud', priority: 'Medium', description: '', assignedTo: [] };

// ── Stat pill ──────────────────────────────────────────────────────────────────
const StatPill = ({ label, count, color, border, bg, onClick, active }) => (
  <Flex align="center" gap={2} px={4} py={2.5} borderRadius="10px" cursor="pointer"
    bg={active ? bg : 'var(--dash-card-bg)'}
    border={`1px solid ${active ? border : 'var(--dash-card-border)'}`}
    transition="all 0.15s" onClick={onClick}
    _hover={{ bg, borderColor: border }}>
    <Box w="7px" h="7px" borderRadius="full" bg={color}
      boxShadow={active ? `0 0 8px ${color}` : 'none'} />
    <Text fontSize="12px" fontWeight="semibold" color={active ? color : 'var(--dash-text-secondary)'}>
      {label}
    </Text>
    <Box px={1.5} py="1px" borderRadius="full" bg={bg} border={`1px solid ${border}`}>
      <Text fontSize="10px" fontWeight="bold" color={color}>{count}</Text>
    </Box>
  </Flex>
);

// ── User avatar chip (small, used on cards) ────────────────────────────────────
const MiniAvatar = ({ callsign, title }) => (
  <Flex w="22px" h="22px" borderRadius="6px" align="center" justify="center" flexShrink={0}
    bg="rgba(79,209,197,0.12)" border="1px solid rgba(79,209,197,0.25)"
    fontSize="8px" fontWeight="bold" color="#4fd1c5" fontFamily="mono"
    title={title || callsign}>
    {callsign.slice(0, 2).toUpperCase()}
  </Flex>
);

// ── Skill Request card ─────────────────────────────────────────────────────────
const SkillCard = ({ req, onDelete, onEdit, onCycleStatus, getUserById }) => {
  const pm  = PRIORITY_META[req.priority] || PRIORITY_META.Medium;
  const sm  = STATUS_META[req.status]     || STATUS_META.Open;
  const rid = req.id || String(req._id);

  const assignees = (req.assignedTo || [])
    .map(id => getUserById(id))
    .filter(Boolean);

  return (
    <Box pos="relative" bg="var(--dash-card-bg)"
      border="1px solid var(--dash-card-border)" borderRadius="14px"
      overflow="hidden" transition="border-color 0.18s"
      _hover={{ borderColor: pm.border }}>

      {/* Priority accent bar */}
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${pm.color}99, transparent)` }} />

      <Box p={4}>
        {/* Top row: title + priority */}
        <Flex justify="space-between" align="flex-start" mb={2.5}>
          <Box flex="1" minW={0} pr={2}>
            <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={2}>
              {req.skill}
            </Text>
            <Box display="inline-block" mt={1} px={2} py="2px" borderRadius="5px"
              fontSize="9px" fontWeight="semibold" letterSpacing="wider" textTransform="uppercase"
              bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)"
              color="var(--dash-text-muted)">
              {req.category || 'Other'}
            </Box>
          </Box>
          <Box flexShrink={0} px={2} py="3px" borderRadius="6px"
            fontSize="9px" fontWeight="bold" letterSpacing="wider" textTransform="uppercase"
            bg={pm.bg} border={`1px solid ${pm.border}`} color={pm.color}>
            {req.priority}
          </Box>
        </Flex>

        {/* Description */}
        {req.description && (
          <Text fontSize="12px" color="var(--dash-text-muted)" mb={3} noOfLines={3} lineHeight="1.6">
            {req.description}
          </Text>
        )}

        {/* Assignees row */}
        {assignees.length > 0 && (
          <Box mb={3} px={3} py={2} borderRadius="9px"
            bg="rgba(79,209,197,0.05)" border="1px solid rgba(79,209,197,0.15)">
            <Text fontSize="9px" color="rgba(79,209,197,0.6)" textTransform="uppercase"
              letterSpacing="wider" fontWeight="semibold" mb={1.5}>
              Needs to learn
            </Text>
            <Flex gap={1.5} flexWrap="wrap">
              {assignees.map(u => (
                <Flex key={u.id} align="center" gap={1} px={1.5} py="2px" borderRadius="5px"
                  bg="rgba(79,209,197,0.08)" border="1px solid rgba(79,209,197,0.2)">
                  <MiniAvatar callsign={u.callsign} />
                  <Text fontSize="10px" color="#4fd1c5" fontWeight="semibold">{u.callsign}</Text>
                </Flex>
              ))}
            </Flex>
          </Box>
        )}

        {/* Footer: requested by + status + delete */}
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={1.5}>
            {req.requestedByCallsign ? (
              <>
                <Flex w="18px" h="18px" borderRadius="5px" align="center" justify="center"
                  bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.2)"
                  fontSize="7px" fontWeight="bold" color="rgba(255,130,130,0.9)" fontFamily="mono">
                  {req.requestedByCallsign.slice(0, 2).toUpperCase()}
                </Flex>
                <Text fontSize="10px" color="var(--dash-text-muted)">{req.requestedByCallsign}</Text>
              </>
            ) : (
              <Text fontSize="10px" color="rgba(255,255,255,0.15)" fontStyle="italic">Unknown</Text>
            )}
          </Flex>

          <Flex align="center" gap={1.5}>
            <Box as="button" px={2} py="3px" borderRadius="20px" fontSize="9px"
              fontWeight="semibold" letterSpacing="wide" cursor="pointer"
              bg={sm.bg} border={`1px solid ${sm.border}`} color={sm.color}
              transition="all 0.15s" title={`Click to mark as ${STATUS_CYCLE[req.status]}`}
              _hover={{ filter: 'brightness(1.2)' }}
              onClick={() => onCycleStatus(rid, STATUS_CYCLE[req.status])}>
              {sm.label} →
            </Box>
            <IconButton icon={<EditIcon boxSize={3} />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="6px"
              _hover={{ color: 'blue.300', bg: 'rgba(99,179,237,0.1)' }}
              onClick={() => onEdit(rid)} aria-label="Edit" />
            <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="6px"
              _hover={{ color: 'red.400', bg: 'rgba(255,80,95,0.1)' }}
              onClick={() => onDelete(rid)} aria-label="Delete" />
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

// ── User toggle chip (used in modal) ──────────────────────────────────────────
const UserChip = ({ user, selected, onToggle, isMe }) => (
  <Flex as="button" align="center" gap={1.5} px={2.5} py={1.5} borderRadius="8px"
    cursor="pointer" transition="all 0.15s"
    bg={selected ? 'rgba(79,209,197,0.12)' : 'rgba(255,255,255,0.03)'}
    border={`1px solid ${selected ? 'rgba(79,209,197,0.35)' : 'rgba(255,255,255,0.08)'}`}
    _hover={{ borderColor: 'rgba(79,209,197,0.35)', bg: 'rgba(79,209,197,0.08)' }}
    onClick={() => onToggle(String(user.id))}>
    <Flex w="22px" h="22px" borderRadius="6px" align="center" justify="center" flexShrink={0}
      bg={selected ? 'rgba(79,209,197,0.2)' : 'rgba(255,255,255,0.06)'}
      border={`1px solid ${selected ? 'rgba(79,209,197,0.4)' : 'rgba(255,255,255,0.1)'}`}
      fontSize="8px" fontWeight="bold"
      color={selected ? '#4fd1c5' : 'var(--dash-text-muted)'} fontFamily="mono">
      {user.callsign.slice(0, 2).toUpperCase()}
    </Flex>
    <Text fontSize="11px" fontWeight={selected ? 'semibold' : 'normal'}
      color={selected ? '#4fd1c5' : 'var(--dash-text-secondary)'}>
      {user.callsign}{isMe ? ' (me)' : ''}
    </Text>
    {selected && (
      <Box w="6px" h="6px" borderRadius="full" bg="#4fd1c5" flexShrink={0} />
    )}
  </Flex>
);

// ── Main view ──────────────────────────────────────────────────────────────────
const SkillRequestsView = () => {
  const { slug } = useParams();
  const { getBySlug, updateEngagement, allUsers, getUserById } = useEngagements();
  const { user: currentUser } = useAuth();
  const eng = getBySlug(slug);

  const [filterStatus, setFilterStatus] = useState('all');
  const [search,       setSearch]       = useState('');
  const { isOpen: modal, onOpen: openModal, onClose: closeModalRaw } = useDisclosure();
  const [form,         setForm]         = useState(BLANK);
  const [editingId,    setEditingId]    = useState(null);

  const closeModal = () => {
    closeModalRaw();
    setEditingId(null);
  };

  const openNewModal = () => {
    setForm(BLANK);
    setEditingId(null);
    openModal();
  };

  if (!eng) return null;

  const requests  = eng.skillRequests || [];
  const myId      = String(currentUser?.id || currentUser?._id || '');

  // Sort allUsers: "me" first, then alphabetically
  const sortedUsers = [...allUsers].sort((a, b) => {
    if (String(a.id) === myId) return -1;
    if (String(b.id) === myId) return 1;
    return a.callsign.localeCompare(b.callsign);
  });

  // Stats
  const openCount     = requests.filter(r => r.status === 'Open').length;
  const learningCount = requests.filter(r => r.status === 'Learning').length;
  const resolvedCount = requests.filter(r => r.status === 'Resolved').length;

  // Filtered + searched
  const visible = requests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return r.skill.toLowerCase().includes(q) ||
             (r.description || '').toLowerCase().includes(q) ||
             (r.category || '').toLowerCase().includes(q);
    }
    return true;
  });

  const PRIORITY_W = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const STATUS_W   = { Open: 0, Learning: 1, Resolved: 2 };
  const sorted = [...visible].sort((a, b) => {
    const sd = (STATUS_W[a.status] || 0) - (STATUS_W[b.status] || 0);
    if (sd !== 0) return sd;
    return (PRIORITY_W[a.priority] || 2) - (PRIORITY_W[b.priority] || 2);
  });

  const toggleAssignee = (uid) => {
    setForm(p => ({
      ...p,
      assignedTo: p.assignedTo.includes(uid)
        ? p.assignedTo.filter(id => id !== uid)
        : [...p.assignedTo, uid],
    }));
  };

  const openEdit = (rid) => {
    const req = requests.find(r => (r.id || String(r._id)) === rid);
    if (!req) return;
    setEditingId(rid);
    setForm({
      skill:       req.skill || '',
      category:    req.category || 'Cloud',
      priority:    req.priority || 'Medium',
      description: req.description || '',
      assignedTo:  (req.assignedTo || []).map(String),
    });
    openModal();
  };

  const saveRequest = async () => {
    if (!form.skill.trim()) return;

    const updates = editingId
      ? {
          skillRequests: requests.map(r =>
            (r.id || String(r._id)) === editingId
              ? { ...r, skill: form.skill.trim(), category: form.category, priority: form.priority, description: form.description.trim(), assignedTo: form.assignedTo }
              : r
          ),
        }
      : {
          skillRequests: [
            ...requests,
            {
              id:                  Date.now().toString(),
              skill:               form.skill.trim(),
              category:            form.category,
              priority:            form.priority,
              description:         form.description.trim(),
              status:              'Open',
              assignedTo:          form.assignedTo,
              requestedBy:         myId,
              requestedByCallsign: currentUser?.callsign || '',
            },
          ],
        };

    await updateEngagement(eng.id, updates);

    setForm(BLANK);
    setEditingId(null);
    closeModalRaw();
  };

  const deleteRequest = (rid) => {
    updateEngagement(eng.id, {
      skillRequests: requests.filter(r => (r.id || String(r._id)) !== rid),
    });
  };

  const cycleStatus = (rid, newStatus) => {
    updateEngagement(eng.id, {
      skillRequests: requests.map(r =>
        (r.id || String(r._id)) === rid ? { ...r, status: newStatus } : r
      ),
    });
  };

  return (
    <Box px={6} pb={10}>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            Skill <Text as="span" color="red.400">Requests</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · log skill gaps and assign who needs to learn them
          </Text>
        </Box>

        <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" borderRadius="8px"
          bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
          color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.18)' }}
          onClick={openNewModal}>
          Add Skill Gap
        </Button>
      </Flex>

      {/* Stats + filter bar */}
      <Flex gap={2} mb={6} flexWrap="wrap" align="center">
        <StatPill label="All"      count={requests.length} color="#9ca3af"
          bg="rgba(156,163,175,0.08)" border="rgba(156,163,175,0.2)"
          active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
        <StatPill label="Open"     count={openCount}     {...STATUS_META.Open}
          active={filterStatus === 'Open'}     onClick={() => setFilterStatus('Open')} />
        <StatPill label="Learning" count={learningCount} {...STATUS_META.Learning}
          active={filterStatus === 'Learning'} onClick={() => setFilterStatus('Learning')} />
        <StatPill label="Resolved" count={resolvedCount} {...STATUS_META.Resolved}
          active={filterStatus === 'Resolved'} onClick={() => setFilterStatus('Resolved')} />
        <Box flex="1" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search skills…" {...inputStyles} w="200px" h="34px" fontSize="12px" />
      </Flex>

      {/* Empty state */}
      {requests.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={16} gap={3}
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px">
          <Flex
            align="center" justify="center"
            w="48px" h="48px" borderRadius="12px"
            bg="rgba(255,80,95,0.10)" border="1px solid rgba(255,80,95,0.25)"
          >
            <Icon as={FaBrain} boxSize={5} color="red.300" />
          </Flex>
          <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)">
            No skill gaps logged yet
          </Text>
          <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center" maxW="340px">
            When you hit a skill gap during the engagement — like needing cloud expertise —
            log it here, assign who should learn it, and track progress over time.
          </Text>
          <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" mt={2}
            borderRadius="8px" bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
            color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.18)' }}
            onClick={openNewModal}>
            Log First Skill Gap
          </Button>
        </Flex>
      ) : sorted.length === 0 ? (
        <Flex align="center" justify="center" py={12}
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px">
          <Text fontSize="13px" color="var(--dash-text-muted)">
            No results{search ? ` for "${search}"` : ''}
          </Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {sorted.map(req => (
            <SkillCard
              key={req.id || String(req._id)}
              req={req}
              onDelete={deleteRequest}
              onEdit={openEdit}
              onCycleStatus={cycleStatus}
              getUserById={getUserById}
            />
          ))}
        </SimpleGrid>
      )}

      {/* ── Add Skill Gap Modal ── */}
      <Modal isOpen={modal} onClose={closeModal} isCentered size="md">
        <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px" overflow="hidden" p={0}
          maxH="90vh" overflowY="auto"
          css={{
            '&::-webkit-scrollbar': { width: '3px' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' },
          }}>
          <ModalBody p={0}>
            <Box p={6} pos="relative">
              {/* Accent bar */}
              <Box pos="absolute" top="0" left="0" right="0" h="2px"
                style={{ background: `linear-gradient(to right, transparent, ${PRIORITY_META[form.priority]?.color || '#fc8181'}88, transparent)` }} />

              {/* Header */}
              <Flex justify="space-between" align="flex-start" mb={5}>
                <Box>
                  <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">
                    {editingId ? 'Edit Skill Gap' : 'Log Skill Gap'}
                  </Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mt="2px">
                    {editingId ? 'Update skill gap details' : 'Record a missing skill and who needs to learn it'}
                  </Text>
                </Box>
                <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" borderRadius="8px"
                  _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                  onClick={closeModal} aria-label="Close" />
              </Flex>

              {/* Skill name */}
              <Box mb={3}>
                <Label>Skill / Technology</Label>
                <Input value={form.skill}
                  onChange={e => setForm(p => ({ ...p, skill: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && saveRequest()}
                  placeholder="e.g. AWS Cloud, Kubernetes, Kerberoasting…"
                  {...inputStyles} autoFocus />
              </Box>

              {/* Category + Priority */}
              <SimpleGrid columns={2} spacing={3} mb={3}>
                <Box>
                  <Label>Category</Label>
                  <Select value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    {...selectStyles}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Box>
                <Box>
                  <Label>Priority</Label>
                  <Select value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    {...selectStyles}>
                    {Object.keys(PRIORITY_META).map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </Box>
              </SimpleGrid>

              {/* Description */}
              <Box mb={4}>
                <Label>Context (optional)</Label>
                <Textarea value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="When was this gap hit and why does it matter…"
                  variant="unstyled"
                  bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                  borderRadius="10px" px={4} py={3} fontSize="sm" rows={2}
                  color="var(--dash-text-primary)"
                  _placeholder={{ color: 'var(--dash-text-muted)' }}
                  _hover={{ border: '1px solid rgba(255,80,95,0.4)' }}
                  _focus={{ border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)', outline: 'none' }}
                  resize="none"
                />
              </Box>

              {/* Assign to */}
              <Box mb={5}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Label>Who needs to learn this?</Label>
                  {form.assignedTo.length > 0 && (
                    <Text fontSize="10px" color="rgba(79,209,197,0.8)" fontWeight="semibold">
                      {form.assignedTo.length} selected
                    </Text>
                  )}
                </Flex>

                {/* Quick "Me" button */}
                {myId && (
                  <Box
                    as="button" mb={2} px={3} py={1.5} borderRadius="8px" fontSize="11px"
                    fontWeight="semibold" cursor="pointer" transition="all 0.15s"
                    bg={form.assignedTo.includes(myId) ? 'rgba(255,80,95,0.12)' : 'rgba(255,80,95,0.05)'}
                    border={`1px solid ${form.assignedTo.includes(myId) ? 'rgba(255,80,95,0.4)' : 'rgba(255,80,95,0.2)'}`}
                    color={form.assignedTo.includes(myId) ? 'rgba(255,130,130,0.95)' : 'rgba(255,130,130,0.6)'}
                    _hover={{ bg: 'rgba(255,80,95,0.15)', borderColor: 'rgba(255,80,95,0.4)' }}
                    onClick={() => toggleAssignee(myId)}>
                    {form.assignedTo.includes(myId) ? '✓ Me (assigned)' : '+ Assign myself'}
                  </Box>
                )}

                <Flex gap={1.5} flexWrap="wrap">
                  {sortedUsers
                    .filter(u => String(u.id) !== myId)
                    .map(u => (
                      <UserChip
                        key={u.id}
                        user={u}
                        selected={form.assignedTo.includes(String(u.id))}
                        onToggle={toggleAssignee}
                        isMe={false}
                      />
                    ))}
                </Flex>

                {sortedUsers.length === 0 && (
                  <Text fontSize="11px" color="var(--dash-text-muted)" fontStyle="italic">
                    No users found
                  </Text>
                )}
              </Box>

              <Flex gap={3}>
                <Button flex="1" size="sm" variant="ghost" borderRadius="10px"
                  color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.08)"
                  _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                  onClick={closeModal}>
                  Cancel
                </Button>
                <Button flex="1" size="sm" borderRadius="10px" fontWeight="semibold"
                  bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
                  color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.18)' }}
                  onClick={saveRequest}>
                  {editingId ? 'Save Changes' : 'Save Skill Gap'}
                </Button>
              </Flex>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

    </Box>
  );
};

export default SkillRequestsView;
