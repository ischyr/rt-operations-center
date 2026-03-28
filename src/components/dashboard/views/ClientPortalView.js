import { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, Input, Select,
  SimpleGrid, IconButton, Spinner, Tooltip,
  Modal, ModalOverlay, ModalContent, ModalBody,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CheckIcon, CloseIcon, CopyIcon, SearchIcon, EditIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

// ── Colors ──────────────────────────────────────────────────────────────────
const ACCENT = '#9F7AEA';
const RED    = '#FC8181';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const ORANGE = '#F6AD55';
const CYAN   = '#76E4F7';

// ── SVG Icons ───────────────────────────────────────────────────────────────
const UsersIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Box>
);

const BuildingIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" />
    <line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" />
    <line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </Box>
);

const KeyIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </Box>
);

const MailIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </Box>
);

const ShieldCheckIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </Box>
);

const GlobeIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Box>
);

// ── Styles ───────────────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT}50` },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

const SectionLabel = ({ children }) => (
  <Flex align="center" gap={2} mb={2}>
    <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
      textTransform="uppercase" letterSpacing="wider">{children}</Text>
  </Flex>
);

// ── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, iconColor, label, value, sub }) => (
  <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="12px" p={4} pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${iconColor}60, transparent)` }} />
    <Flex justify="space-between" align="flex-start">
      <Box>
        <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
          textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
        <Text fontSize="2xl" fontWeight="black" color={iconColor}>{value}</Text>
        {sub && <Text fontSize="10px" color="var(--dash-text-muted)" mt={0.5}>{sub}</Text>}
      </Box>
      <Flex w="32px" h="32px" borderRadius="8px" bg={`${iconColor}12`}
        border={`1px solid ${iconColor}30`} align="center" justify="center" flexShrink={0}>
        <Icon boxSize="15px" color={iconColor} />
      </Flex>
    </Flex>
  </MotionBox>
);

// ── Copy helper ─────────────────────────────────────────────────────────────
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Tooltip label={copied ? 'Copied!' : 'Copy'} fontSize="10px">
      <IconButton icon={copied ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={3} />}
        size="xs" variant="ghost" color={copied ? GREEN : 'var(--dash-text-muted)'}
        borderRadius="5px" _hover={{ color: ACCENT }} onClick={copy} aria-label="Copy" />
    </Tooltip>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
const ClientPortalView = () => {
  const { slug } = useParams();
  const { getBySlug } = useEngagements();
  const eng = getBySlug(slug);

  const [tenants, setTenants]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editTenant, setEditTenant]   = useState(null);
  const [editForm, setEditForm]       = useState({ company: '', contactName: '', contactEmail: '', password: '' });
  const [editSaving, setEditSaving]   = useState(false);
  const [form, setForm]           = useState({ company: '', contactName: '', contactEmail: '', password: '' });
  const [generatedPw, setGeneratedPw] = useState('');

  const portalUrl = `${window.location.origin}/portal`;

  const fetchTenants = useCallback(async () => {
    if (!eng) return;
    try {
      const res = await fetch(`${API}/portal/tenants/${eng.id}`, { headers: authHeaders() });
      if (res.ok) setTenants(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [eng]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  if (!eng) return (
    <Flex align="center" justify="center" h="60vh"><Spinner size="lg" color={ACCENT} /></Flex>
  );

  const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pw = '';
    for (let i = 0; i < 16; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setGeneratedPw(pw);
    setForm(p => ({ ...p, password: pw }));
  };

  const handleAdd = async () => {
    if (!form.company.trim() || !form.contactEmail.trim() || !form.password.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/portal/tenants`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, engagementId: eng.id }),
      });
      if (res.ok) {
        setForm({ company: '', contactName: '', contactEmail: '', password: '' });
        setGeneratedPw('');
        setShowForm(false);
        fetchTenants();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const toggleEnabled = async (tenant) => {
    await fetch(`${API}/portal/tenants/${tenant._id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ enabled: !tenant.enabled }),
    });
    fetchTenants();
  };

  const startEdit = (t) => {
    setEditTenant(t);
    setEditForm({ company: t.company, contactName: t.contactName || '', contactEmail: t.contactEmail, password: '' });
    setGeneratedPw('');
  };

  const handleEdit = async () => {
    if (!editForm.contactEmail.trim()) return;
    setEditSaving(true);
    const body = { ...editForm };
    if (!body.password) delete body.password; // only send password if changed
    try {
      await fetch(`${API}/portal/tenants/${editTenant._id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      setEditTenant(null);
      setGeneratedPw('');
      fetchTenants();
    } catch { /* ignore */ }
    setEditSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    await fetch(`${API}/portal/tenants/${deleteModal._id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    setDeleteModal(null);
    fetchTenants();
  };

  const activeTenants  = tenants.filter(t => t.enabled);
  const disabledTenants = tenants.filter(t => !t.enabled);

  return (
    <Box px={6} pb={12}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Client <Text as="span" color="red.400">Portal</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · manage client access to read-only engagement data
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" fontWeight="bold"
          borderRadius="8px" bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
          color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
          onClick={() => { setShowForm(v => !v); if (!showForm) generatePassword(); }}>
          New Tenant
        </Button>
      </Flex>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={6}>
        <StatCard icon={BuildingIcon} iconColor={ACCENT} label="Total Tenants" value={tenants.length} />
        <StatCard icon={ShieldCheckIcon} iconColor={GREEN} label="Active" value={activeTenants.length} />
        <StatCard icon={CloseIcon} iconColor={RED} label="Disabled" value={disabledTenants.length} />
        <StatCard icon={GlobeIcon} iconColor={CYAN} label="Portal URL"
          value={<Text fontSize="11px" fontWeight="bold" color={CYAN} wordBreak="break-all">/portal</Text>}
          sub="Share with clients" />
      </SimpleGrid>

      {/* Portal URL card */}
      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="14px" p={4} mb={6} pos="relative">
        <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
          style={{ background: `linear-gradient(to right, transparent, ${CYAN}60, transparent)` }} />
        <Flex align="center" gap={3}>
          <Flex w="32px" h="32px" borderRadius="8px" bg={`${CYAN}12`}
            border={`1px solid ${CYAN}30`} align="center" justify="center" flexShrink={0}>
            <GlobeIcon boxSize="15px" color={CYAN} />
          </Flex>
          <Box flex={1}>
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider" mb={0.5}>Client Portal URL</Text>
            <Text fontSize="13px" color="var(--dash-text-primary)" fontFamily="mono">{portalUrl}</Text>
          </Box>
          <CopyButton text={portalUrl} />
        </Flex>
      </Box>

      {/* Add tenant form */}
      <AnimatePresence>
        {showForm && (
          <MotionBox
            initial={{ opacity: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: 'top' }}
            mb={6}>
            <Box bg="var(--dash-card-bg)" border={`1px solid ${ACCENT}30`}
              borderRadius="14px" p={6} pos="relative">
              <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
                style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />

              <Flex align="center" gap={2} mb={5}>
                <Flex w="28px" h="28px" borderRadius="7px" bg={`${ACCENT}12`}
                  border={`1px solid ${ACCENT}30`} align="center" justify="center">
                  <AddIcon boxSize={3} color={ACCENT} />
                </Flex>
                <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
                  textTransform="uppercase" letterSpacing="wider">New Tenant</Text>
              </Flex>

              <Flex direction="column" gap={4} mb={4}>
                <Box>
                  <SectionLabel>Company Name *</SectionLabel>
                  <Input {...inputSx} placeholder="e.g. Google"
                    value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Box>
                    <SectionLabel>Contact Name</SectionLabel>
                    <Input {...inputSx} placeholder="John Doe"
                      value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} />
                  </Box>
                  <Box>
                    <SectionLabel>Contact Email *</SectionLabel>
                    <Input {...inputSx} placeholder="john@google.com"
                      value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} />
                  </Box>
                </SimpleGrid>

                <Box>
                  <SectionLabel>Password *</SectionLabel>
                  <Flex gap={2}>
                    <Input {...inputSx} flex={1}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Strong password" />
                    <Button size="sm" h="40px" px={4} borderRadius="10px" fontSize="11px"
                      bg={`${ORANGE}12`} border={`1px solid ${ORANGE}30`}
                      color={ORANGE} fontWeight="bold"
                      _hover={{ bg: `${ORANGE}22` }}
                      onClick={generatePassword}>
                      Generate
                    </Button>
                  </Flex>
                  {generatedPw && (
                    <Flex align="center" gap={2} mt={2} px={3} py={2}
                      bg="rgba(0,0,0,0.3)" borderRadius="8px" border="1px solid rgba(255,255,255,0.06)">
                      <Text fontSize="12px" fontFamily="mono" color={CYAN} flex={1}>{generatedPw}</Text>
                      <CopyButton text={generatedPw} />
                    </Flex>
                  )}
                </Box>
              </Flex>

              <Flex gap={3}>
                <Button size="sm" borderRadius="8px" fontSize="12px" fontWeight="bold"
                  bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
                  color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                  leftIcon={<CheckIcon boxSize={2.5} />}
                  isLoading={saving} loadingText="Creating…"
                  onClick={handleAdd}>
                  Create Tenant
                </Button>
                <Button size="sm" variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
                  _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                  onClick={() => { setShowForm(false); setGeneratedPw(''); }}>
                  Cancel
                </Button>
              </Flex>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Tenant list */}
      {loading ? (
        <Flex justify="center" py={12}><Spinner size="lg" color={ACCENT} /></Flex>
      ) : tenants.length === 0 ? (
        <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}>
          <Flex direction="column" align="center" justify="center" py={16} gap={3}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="16px"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}60, transparent)` }} />
            <Flex w="56px" h="56px" borderRadius="14px" bg={`${ACCENT}12`}
              border={`2px solid ${ACCENT}40`} align="center" justify="center">
              <BuildingIcon boxSize="24px" color={ACCENT} />
            </Flex>
            <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">No tenants yet</Text>
            <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center" maxW="340px">
              Create a tenant to give your client read-only access to this engagement's data.
            </Text>
          </Flex>
        </MotionBox>
      ) : (
        <>
          <Flex align="center" gap={2} mb={3}>
            <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
            <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
              letterSpacing="wider" fontWeight="bold">All Tenants</Text>
            <Box px={2} py="1px" borderRadius="full" bg={`${ACCENT}10`} border={`1px solid ${ACCENT}30`}>
              <Text fontSize="9px" fontWeight="bold" color={ACCENT}>{tenants.length}</Text>
            </Box>
          </Flex>

          <AnimatePresence initial={false}>
            {tenants.map((t, i) => (
              <motion.div key={t._id} layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                style={{ marginBottom: '10px' }}>
                <Flex bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  borderRadius="12px" px={5} py={4} align="center" gap={4}
                  pos="relative" overflow="hidden"
                  _hover={{ borderColor: `${ACCENT}30` }}
                  style={{ transition: 'border-color 0.15s' }}>

                  <Box pos="absolute" top={0} left={0} bottom={0} w="3px"
                    bg={t.enabled ? GREEN : RED}
                    borderRadius="0 3px 3px 0" opacity={0.6} />

                  {/* Company avatar */}
                  <Flex w="38px" h="38px" borderRadius="10px" flexShrink={0}
                    bg={t.enabled ? `${ACCENT}12` : 'rgba(255,255,255,0.04)'}
                    border={`1px solid ${t.enabled ? `${ACCENT}30` : 'rgba(255,255,255,0.08)'}`}
                    align="center" justify="center"
                    fontSize="14px" fontWeight="bold"
                    color={t.enabled ? ACCENT : 'var(--dash-text-muted)'}>
                    {t.company.slice(0, 2).toUpperCase()}
                  </Flex>

                  <Box flex={1} minW={0}>
                    <Flex align="center" gap={2}>
                      <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={1}>
                        {t.company}
                      </Text>
                      <Box px="6px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
                        bg={t.enabled ? `${GREEN}10` : `${RED}10`}
                        border={`1px solid ${t.enabled ? `${GREEN}25` : `${RED}25`}`}
                        color={t.enabled ? GREEN : RED}
                        letterSpacing="wider">
                        {t.enabled ? 'ACTIVE' : 'DISABLED'}
                      </Box>
                    </Flex>
                    <Flex align="center" gap={3} mt="2px">
                      <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1}>
                        {t.contactName ? `${t.contactName} · ` : ''}{t.contactEmail}
                      </Text>
                    </Flex>
                  </Box>

                  <Flex align="center" gap={2} flexShrink={0}>
                    {t.lastLogin && (
                      <Tooltip label={`Last login: ${new Date(t.lastLogin).toLocaleString()}`} fontSize="10px">
                        <Text fontSize="10px" color="var(--dash-text-muted)">
                          Last: {new Date(t.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </Text>
                      </Tooltip>
                    )}

                    <Tooltip label="Edit tenant" fontSize="10px">
                      <IconButton icon={<EditIcon boxSize={3} />} size="xs" variant="ghost"
                        color="var(--dash-text-muted)" borderRadius="6px"
                        _hover={{ color: BLUE, bg: `${BLUE}08` }}
                        onClick={() => startEdit(t)} aria-label="Edit" />
                    </Tooltip>

                    <Tooltip label={t.enabled ? 'Disable access' : 'Enable access'} fontSize="10px">
                      <Button size="xs" variant="ghost" borderRadius="6px" fontSize="10px"
                        color={t.enabled ? ORANGE : GREEN}
                        _hover={{ bg: t.enabled ? `${ORANGE}10` : `${GREEN}10` }}
                        onClick={() => toggleEnabled(t)}>
                        {t.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </Tooltip>

                    <Tooltip label="Delete tenant" fontSize="10px">
                      <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
                        color="var(--dash-text-muted)" borderRadius="6px"
                        _hover={{ color: RED, bg: `${RED}08` }}
                        onClick={() => setDeleteModal(t)} aria-label="Delete" />
                    </Tooltip>
                  </Flex>
                </Flex>
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}

      {/* Edit tenant modal */}
      <Modal isOpen={!!editTenant} onClose={() => setEditTenant(null)} isCentered size="md">
        <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px" p={0} overflow="hidden">
          <ModalBody p={0}>
            {editTenant && (
              <Box p={6}>
                <Box h="2px" pos="absolute" top="0" left="0" right="0"
                  style={{ background: `linear-gradient(to right, transparent, ${BLUE}B0, transparent)` }} />

                <Flex align="center" gap={2} mb={5}>
                  <Flex w="28px" h="28px" borderRadius="7px" bg={`${BLUE}12`}
                    border={`1px solid ${BLUE}30`} align="center" justify="center">
                    <EditIcon boxSize={3} color={BLUE} />
                  </Flex>
                  <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
                    textTransform="uppercase" letterSpacing="wider">Edit Tenant</Text>
                </Flex>

                <Flex direction="column" gap={4} mb={5}>
                  <Box>
                    <SectionLabel>Company Name</SectionLabel>
                    <Input {...inputSx} value={editForm.company}
                      onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))} />
                  </Box>

                  <SimpleGrid columns={2} gap={4}>
                    <Box>
                      <SectionLabel>Contact Name</SectionLabel>
                      <Input {...inputSx} value={editForm.contactName}
                        onChange={e => setEditForm(p => ({ ...p, contactName: e.target.value }))} />
                    </Box>
                    <Box>
                      <SectionLabel>Contact Email</SectionLabel>
                      <Input {...inputSx} value={editForm.contactEmail}
                        onChange={e => setEditForm(p => ({ ...p, contactEmail: e.target.value }))} />
                    </Box>
                  </SimpleGrid>

                  <Box>
                    <SectionLabel>New Password (leave blank to keep current)</SectionLabel>
                    <Flex gap={2}>
                      <Input {...inputSx} flex={1} type="text"
                        value={editForm.password}
                        onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="Leave blank to keep unchanged" />
                      <Button size="sm" h="40px" px={4} borderRadius="10px" fontSize="11px"
                        bg={`${ORANGE}12`} border={`1px solid ${ORANGE}30`}
                        color={ORANGE} fontWeight="bold"
                        _hover={{ bg: `${ORANGE}22` }}
                        onClick={() => {
                          const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
                          let pw = '';
                          for (let i = 0; i < 16; i++) pw += chars[Math.floor(Math.random() * chars.length)];
                          setEditForm(p => ({ ...p, password: pw }));
                          setGeneratedPw(pw);
                        }}>
                        Generate
                      </Button>
                    </Flex>
                    {generatedPw && editForm.password === generatedPw && (
                      <Flex align="center" gap={2} mt={2} px={3} py={2}
                        bg="rgba(0,0,0,0.3)" borderRadius="8px" border="1px solid rgba(255,255,255,0.06)">
                        <Text fontSize="12px" fontFamily="mono" color={CYAN} flex={1}>{generatedPw}</Text>
                        <CopyButton text={generatedPw} />
                      </Flex>
                    )}
                  </Box>
                </Flex>

                <Flex gap={3}>
                  <Button flex="1" size="sm" borderRadius="10px"
                    bg={`${BLUE}15`} border={`1px solid ${BLUE}40`}
                    color={BLUE} fontWeight="bold" fontSize="12px"
                    _hover={{ bg: `${BLUE}25` }}
                    leftIcon={<CheckIcon boxSize={2.5} />}
                    isLoading={editSaving} loadingText="Saving…"
                    onClick={handleEdit}>
                    Save Changes
                  </Button>
                  <Button flex="1" size="sm" variant="ghost"
                    color="var(--dash-text-muted)" borderRadius="10px"
                    border="1px solid rgba(255,255,255,0.08)"
                    _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                    onClick={() => { setEditTenant(null); setGeneratedPw(''); }}>
                    Cancel
                  </Button>
                </Flex>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete confirm modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} isCentered size="sm">
        <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px" p={0} overflow="hidden">
          <ModalBody p={0}>
            {deleteModal && (
              <Box p={6}>
                <Box h="2px" pos="absolute" top="0" left="0" right="0"
                  style={{ background: `linear-gradient(to right, transparent, ${RED}B0, transparent)` }} />
                <Flex direction="column" align="center" mb={5}>
                  <Flex w="56px" h="56px" borderRadius="14px" align="center" justify="center"
                    fontSize="18px" fontWeight="bold" mb={3}
                    bg={`${RED}12`} border={`1px solid ${RED}35`} color={RED}>
                    {deleteModal.company.slice(0, 2).toUpperCase()}
                  </Flex>
                  <Text fontSize="16px" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
                    Delete {deleteModal.company}?
                  </Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" maxW="260px">
                    This will permanently remove this tenant's access. They will no longer be able to log in.
                  </Text>
                </Flex>
                <Flex gap={3}>
                  <Button flex="1" size="sm" variant="ghost"
                    color="var(--dash-text-muted)" borderRadius="10px"
                    border="1px solid rgba(255,255,255,0.08)"
                    _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                    onClick={() => setDeleteModal(null)}>
                    Cancel
                  </Button>
                  <Button flex="1" size="sm" borderRadius="10px"
                    bg={`${RED}15`} border={`1px solid ${RED}40`}
                    color={RED} fontWeight="semibold"
                    _hover={{ bg: `${RED}25` }}
                    onClick={handleDelete}>
                    Delete
                  </Button>
                </Flex>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ClientPortalView;
