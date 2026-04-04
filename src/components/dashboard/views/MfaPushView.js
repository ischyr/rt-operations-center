import { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, Input, Select, Textarea,
  SimpleGrid, Modal, ModalOverlay, ModalContent, ModalBody,
  IconButton, useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, RepeatIcon, CheckIcon, CloseIcon,
  WarningTwoIcon, CopyIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const ORANGE = '#F6AD55';
const RED    = '#FC8181';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const PURPLE = '#9F7AEA';
const YELLOW = '#ECC94B';

// ── API ───────────────────────────────────────────────────────────────────────
const api = (path, opts = {}) => {
  const tok = localStorage.getItem('token');
  return fetch(`/api/mfa-push${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}`, ...(opts.headers || {}) },
    ...opts,
  }).then(r => r.json());
};

// ── Input style ───────────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ORANGE}50` },
  _focus: { border: `1px solid ${ORANGE}80`, boxShadow: `0 0 0 1px ${ORANGE}40` },
};

const selSx = {
  bg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px', h: '40px', fontSize: 'sm',
  color: 'var(--dash-text-primary)', cursor: 'pointer',
  _hover: { borderColor: `${ORANGE}50` },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

// ── Label ─────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

// ── Tab button ────────────────────────────────────────────────────────────────
const TabBtn = ({ label, active, color = ORANGE, onClick, badge }) => (
  <Button size="sm" variant="ghost" borderRadius="8px"
    color={active ? color : 'var(--dash-text-muted)'}
    bg={active ? `${color}18` : 'transparent'}
    border={active ? `1px solid ${color}40` : '1px solid transparent'}
    fontWeight={active ? 'semibold' : 'normal'}
    fontSize="12px" px={4}
    _hover={{ bg: `${color}12`, color }}
    onClick={onClick}>
    {label}
    {badge > 0 && (
      <Box ml={2} bg={RED} borderRadius="full" px="5px" fontSize="10px"
        fontWeight="bold" color="white" lineHeight="18px" h="18px"
        display="inline-flex" alignItems="center">{badge}</Box>
    )}
  </Button>
);

// ── Provider catalog ──────────────────────────────────────────────────────────
const PROVIDERS = {
  microsoft: {
    label: 'Microsoft Authenticator',
    color: '#0078D4',
    lockoutAt: 10,
    icon: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1" fill="#0078D4" stroke="none"/>
        <rect x="13" y="3" width="8" height="8" rx="1" fill="#0078D4" stroke="none" opacity=".7"/>
        <rect x="3" y="13" width="8" height="8" rx="1" fill="#0078D4" stroke="none" opacity=".7"/>
        <rect x="13" y="13" width="8" height="8" rx="1" fill="#0078D4" stroke="none" opacity=".4"/>
      </>
    ),
  },
  okta: {
    label: 'Okta Verify',
    color: '#007DC1',
    lockoutAt: 10,
    icon: (
      <circle cx="12" cy="12" r="9" stroke="#007DC1" strokeWidth="2" fill="none"/>
    ),
  },
  duo: {
    label: 'Duo Security',
    color: '#6BBE4E',
    lockoutAt: 10,
    icon: (
      <>
        <path d="M5 8h6a4 4 0 0 1 0 8H5V8z" stroke="#6BBE4E" strokeWidth="1.8" fill="none"/>
        <line x1="5" y1="8" x2="5" y2="16" stroke="#6BBE4E" strokeWidth="1.8"/>
      </>
    ),
  },
  adfs: {
    label: 'ADFS / NPS',
    color: PURPLE,
    lockoutAt: 5,
    icon: (
      <>
        <rect x="2" y="2" width="20" height="8" rx="2"/>
        <rect x="2" y="14" width="20" height="8" rx="2"/>
        <line x1="6" y1="6" x2="6.01" y2="6"/>
        <line x1="6" y1="18" x2="6.01" y2="18"/>
      </>
    ),
  },
  custom: {
    label: 'Custom Provider',
    color: ORANGE,
    lockoutAt: 10,
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  },
};

// ── Status catalog ────────────────────────────────────────────────────────────
const STATUS = {
  idle:           { color: 'rgba(255,255,255,0.3)', label: 'IDLE',        pulse: false },
  pushing:        { color: ORANGE,                  label: 'PUSHING',     pulse: true  },
  approved:       { color: GREEN,                   label: 'APPROVED',    pulse: false },
  denied:         { color: RED,                     label: 'DENIED',      pulse: false },
  locked:         { color: RED,                     label: 'LOCKED OUT',  pulse: false },
  'no-response':  { color: BLUE,                    label: 'NO RESPONSE', pulse: false },
};

// ── Action icon colors ────────────────────────────────────────────────────────
const ACTION_META = {
  pushed:        { color: ORANGE, icon: '🔔', label: 'Push sent' },
  approved:      { color: GREEN,  icon: '✓',  label: 'Approved' },
  denied:        { color: RED,    icon: '✗',  label: 'Denied' },
  locked:        { color: RED,    icon: '🔒', label: 'Locked out' },
  'no-response': { color: BLUE,   icon: '~',  label: 'No response' },
  reset:         { color: PURPLE, icon: '↺',  label: 'Reset' },
  cleared:       { color: 'var(--dash-text-muted)', icon: '○', label: 'Cleared' },
};

// ── Provider icon box ─────────────────────────────────────────────────────────
const ProviderIconBox = ({ provider, size = '36px' }) => {
  const p = PROVIDERS[provider] || PROVIDERS.custom;
  return (
    <Flex w={size} h={size} borderRadius="9px" bg={`${p.color}18`} border={`1px solid ${p.color}30`}
      align="center" justify="center" flexShrink={0}>
      <Box as="svg" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" w="16px" h="16px">
        {p.icon}
      </Box>
    </Flex>
  );
};

// ── Pulsing status dot ────────────────────────────────────────────────────────
const StatusDot = ({ status }) => {
  const s = STATUS[status] || STATUS.idle;
  return (
    <Box pos="relative" w="8px" h="8px" flexShrink={0}>
      <Box w="8px" h="8px" borderRadius="full" bg={s.color} />
      {s.pulse && (
        <Box pos="absolute" top="0" left="0" w="8px" h="8px" borderRadius="full"
          bg={s.color} opacity={0.5}
          sx={{ animation: 'mfaPulse 1.4s ease-in-out infinite' }} />
      )}
    </Box>
  );
};

// ── Push progress bar ─────────────────────────────────────────────────────────
const PushBar = ({ count, max }) => {
  const pct = Math.min(100, (count / Math.max(max, 1)) * 100);
  const color = pct >= 80 ? RED : pct >= 50 ? ORANGE : BLUE;
  return (
    <Box w="100%" h="3px" bg="rgba(255,255,255,0.07)" borderRadius="full" overflow="hidden">
      <Box h="100%" borderRadius="full" bg={color}
        w={`${pct}%`} transition="width 0.4s ease" />
    </Box>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, sub }) => (
  <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="14px" p={4} pos="relative" overflow="hidden">
    <Box pos="absolute" top="0" left="0" right="0" h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}70, transparent)` }} />
    <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
      letterSpacing="wider" fontWeight="bold" mb={2}>{label}</Text>
    <Text fontSize="28px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
    {sub && <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{sub}</Text>}
  </Box>
);

// ── Playbook scripts ──────────────────────────────────────────────────────────
const PLAYBOOK = [
  {
    title: 'Initial Fatigue Lure',
    scenario: 'First contact — frame the push as routine IT activity',
    color: ORANGE,
    script: `Subject: Action Required — Microsoft Authenticator Verification

Hi [NAME],

Our IT Security team is rolling out an updated Conditional Access policy across the organization. As part of this migration, all accounts must re-verify their MFA registration.

You will receive an authentication push notification to your Microsoft Authenticator app shortly. Please approve it to complete your account verification.

If you have any questions, contact the IT Help Desk at helpdesk@[COMPANY].com.

Thank you,
IT Security Operations`,
  },
  {
    title: 'No Response — Follow-Up Call Script',
    scenario: 'Target has not approved after 2–3 pushes. Call posing as IT helpdesk.',
    color: BLUE,
    script: `[CALL TARGET]

"Hi, is this [NAME]? Great, this is [CALLSIGN] calling from the IT Help Desk.

I'm just following up — we sent you a Microsoft Authenticator approval request a few minutes ago as part of our MFA re-enrollment process, but it looks like it hasn't been completed yet.

Are you near your phone? You should see a notification from Microsoft Authenticator — it will say 'Approve sign-in?' with a two-digit number. Can you go ahead and approve that for me?

[PAUSE — wait for them to approve]

Perfect, thank you. You're all set. Have a great day!"`,
  },
  {
    title: 'Target Denied — Urgency Escalation',
    scenario: 'Target denied the push or is asking questions. Apply urgency.',
    color: RED,
    script: `"I understand, and I appreciate you being cautious — that's exactly the right instinct.

However, this is a mandatory compliance requirement from our security team. Accounts that haven't completed the re-enrollment by end of business today will be temporarily locked out pending manual verification, which can take 24–48 hours.

I can confirm your employee ID as [ID] and your department as [DEPT] if that helps verify my identity.

We just need you to approve that one notification — it only takes a second and ensures your account stays active."`,
  },
  {
    title: 'Victim Calls Back (Inbound)',
    scenario: 'Target calls the helpdesk number asking about the push.',
    color: GREEN,
    script: `"Thank you for calling IT Support, this is [NAME], how can I help you?

Oh yes, you received a push notification from Microsoft Authenticator? That's expected — we're currently rolling out a security update to all user accounts that requires a quick re-verification.

If you approve that notification, the process will complete automatically. You don't need to do anything else.

Yes, it's completely safe to approve. I can also confirm this is going to your current registered device ending in [LAST 4 DIGITS IF KNOWN].

Would you like to approve it now while I have you on the line?"`,
  },
  {
    title: 'MFA Number Matching Bypass',
    scenario: 'Tenant has number matching enabled. Social engineer the number from the target.',
    color: PURPLE,
    script: `"Hi [NAME], this is IT Security.

We're seeing an issue with your authenticator registration and need to verify your device is properly synced.

When you receive the push notification, you'll see a two-digit number displayed on the screen where you're signing in. Can you tell me what number is showing on your screen right now?

[TARGET SAYS THE NUMBER — e.g., "47"]

"Perfect, 47 — thank you. Now go ahead and tap '47' on your Authenticator app and then press Approve. That'll confirm your device registration is working correctly."`,
  },
  {
    title: 'Teams / Slack Message Lure',
    scenario: 'Send via internal chat if you have foothold. High trust vector.',
    color: YELLOW,
    script: `Hey [NAME] — quick heads up from IT Security 👋

We're pushing out an MFA re-enrollment today for your account. You should get an Authenticator notification in the next minute or two. Please go ahead and approve it when you see it — it's part of our quarterly compliance sweep.

Shouldn't take more than a second. Let me know if you run into any issues and I'll sort it out for you.

Thanks!
[CALLSIGN] | IT Security`,
  },
];

// ── Add Target Modal ──────────────────────────────────────────────────────────
function AddTargetModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({ email: '', name: '', department: '', provider: 'microsoft', maxPushes: '10' });
  const [bulk, setBulk] = useState('');
  const [mode, setMode] = useState('single'); // 'single' | 'bulk'
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    if (mode === 'single') {
      if (!form.email.trim()) return toast({ title: 'Email required', status: 'error', duration: 2000 });
      setLoading(true);
      await onAdd([form]);
      setLoading(false);
    } else {
      const emails = bulk.split('\n').map(l => l.trim()).filter(Boolean);
      if (!emails.length) return toast({ title: 'No emails entered', status: 'error', duration: 2000 });
      setLoading(true);
      await onAdd(emails.map(e => ({ email: e, name: '', department: '', provider: form.provider, maxPushes: form.maxPushes })));
      setLoading(false);
    }
    setForm({ email: '', name: '', department: '', provider: 'microsoft', maxPushes: '10' });
    setBulk('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen onClose={onClose} isCentered size="md">
      <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(6px)" />
      <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden" p={0}>
        <ModalBody p={0}>
          <Box p={6} pos="relative">
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ORANGE}80, transparent)` }} />

            {/* Header */}
            <Flex justify="space-between" align="flex-start" mb={5}>
              <Flex align="center" gap={3}>
                <Flex w="38px" h="38px" borderRadius="10px" align="center" justify="center"
                  bg={`${ORANGE}15`} border={`1px solid ${ORANGE}35`} flexShrink={0}>
                  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" w="17px" h="17px">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </Box>
                </Flex>
                <Box>
                  <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">Add Push Target(s)</Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mt="2px">Single or bulk import</Text>
                </Box>
              </Flex>
              <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" borderRadius="8px"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                onClick={onClose} aria-label="Close" />
            </Flex>

            {/* Mode toggle */}
            <Flex gap={2} mb={4}>
              {['single', 'bulk'].map(m => (
                <Button key={m} size="xs" borderRadius="7px" px={4}
                  bg={mode === m ? `${ORANGE}20` : 'transparent'}
                  color={mode === m ? ORANGE : 'var(--dash-text-muted)'}
                  border={`1px solid ${mode === m ? `${ORANGE}40` : 'transparent'}`}
                  _hover={{ bg: `${ORANGE}12`, color: ORANGE }}
                  onClick={() => setMode(m)}>
                  {m === 'single' ? 'Single Target' : 'Bulk Import'}
                </Button>
              ))}
            </Flex>

            <Flex direction="column" gap={3}>
              {mode === 'single' ? (
                <>
                  <Box>
                    <Label>Email Address</Label>
                    <Input {...inputSx} value={form.email} placeholder="john.smith@company.com"
                      onChange={e => set('email', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                  </Box>
                  <Flex gap={3}>
                    <Box flex={1}>
                      <Label>Full Name</Label>
                      <Input {...inputSx} value={form.name} placeholder="John Smith"
                        onChange={e => set('name', e.target.value)} />
                    </Box>
                    <Box flex={1}>
                      <Label>Department</Label>
                      <Input {...inputSx} value={form.department} placeholder="Finance"
                        onChange={e => set('department', e.target.value)} />
                    </Box>
                  </Flex>
                </>
              ) : (
                <Box>
                  <Label>Email List (one per line)</Label>
                  <Textarea
                    bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                    borderRadius="10px" px={4} py={3} fontSize="sm" minH="120px"
                    color="var(--dash-text-primary)" placeholder={"alice@corp.com\nbob@corp.com\ncarol@corp.com"}
                    _placeholder={{ color: 'var(--dash-text-muted)' }}
                    _focus={{ border: `1px solid ${ORANGE}80`, boxShadow: `0 0 0 1px ${ORANGE}40` }}
                    value={bulk} onChange={e => setBulk(e.target.value)} />
                </Box>
              )}

              <Flex gap={3}>
                <Box flex={1}>
                  <Label>MFA Provider</Label>
                  <Select {...selSx} value={form.provider} onChange={e => set('provider', e.target.value)}>
                    {Object.entries(PROVIDERS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </Select>
                </Box>
                <Box w="120px">
                  <Label>Lockout After</Label>
                  <Input {...inputSx} type="number" value={form.maxPushes} min={1} max={50}
                    onChange={e => set('maxPushes', e.target.value)} />
                </Box>
              </Flex>

              <Flex justify="flex-end" gap={3} mt={2}>
                <Button size="sm" variant="ghost" h="36px" px={5} borderRadius="10px"
                  color="var(--dash-text-muted)"
                  _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                  onClick={onClose}>Cancel</Button>
                <Button size="sm" h="36px" px={6} borderRadius="10px" fontWeight="semibold"
                  bg={`${ORANGE}20`} color={ORANGE} border={`1px solid ${ORANGE}50`}
                  _hover={{ bg: `${ORANGE}30` }} isLoading={loading}
                  onClick={handleAdd}>
                  {mode === 'bulk' ? 'Import Targets' : 'Add Target'}
                </Button>
              </Flex>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// ── Target card ───────────────────────────────────────────────────────────────
function TargetCard({ target, onPush, onRespond, onReset, onDelete }) {
  const s   = STATUS[target.status] || STATUS.idle;
  const p   = PROVIDERS[target.provider] || PROVIDERS.custom;
  const pct = Math.min(100, (target.pushCount / Math.max(target.maxPushes, 1)) * 100);
  const barColor = pct >= 80 ? RED : pct >= 50 ? ORANGE : BLUE;
  const canPush  = target.status !== 'approved' && target.status !== 'locked';

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="14px" overflow="hidden"
      _hover={{ border: `1px solid ${s.color}30` }}
      transition2="border-color 0.2s">
      {/* Colored top bar */}
      <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${s.color}60, transparent)` }} />

      <Box p={4}>
        <Flex align="flex-start" gap={3}>
          <ProviderIconBox provider={target.provider} />

          <Box flex={1} minW={0}>
            <Flex align="center" gap={2} mb="2px">
              <StatusDot status={target.status} />
              <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)"
                noOfLines={1}>{target.name || target.email}</Text>
            </Flex>
            {target.name && (
              <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1} mb="2px">
                {target.email}
              </Text>
            )}
            <Flex align="center" gap={2}>
              <Text fontSize="10px" color={p.color} bg={`${p.color}15`}
                px="6px" py="1px" borderRadius="5px" border={`1px solid ${p.color}30`}
                fontWeight="semibold">{p.label}</Text>
              {target.department && (
                <Text fontSize="10px" color="var(--dash-text-muted)">{target.department}</Text>
              )}
            </Flex>
          </Box>

          {/* Status badge */}
          <Flex align="center" gap={1.5}>
            <Box px="8px" py="3px" borderRadius="6px"
              bg={`${s.color}15`} border={`1px solid ${s.color}35`}>
              <Text fontSize="9px" fontWeight="bold" color={s.color} letterSpacing="wider">
                {s.label}
              </Text>
            </Box>
          </Flex>
        </Flex>

        {/* Push progress */}
        <Box mt={3} mb={2}>
          <Flex justify="space-between" align="center" mb={1}>
            <Text fontSize="10px" color="var(--dash-text-muted)">Push attempts</Text>
            <Text fontSize="11px" fontWeight="semibold" color={barColor}>
              {target.pushCount} / {target.maxPushes}
            </Text>
          </Flex>
          <Box w="100%" h="4px" bg="rgba(255,255,255,0.07)" borderRadius="full" overflow="hidden">
            <Box h="100%" borderRadius="full" bg={barColor}
              w={`${pct}%`} transition="width 0.4s ease" />
          </Box>
        </Box>

        {target.approvedAt && (
          <Text fontSize="10px" color={GREEN} mt={1}>
            Approved at {new Date(target.approvedAt).toLocaleTimeString()}
          </Text>
        )}

        {/* Actions */}
        <Flex mt={3} gap={2} wrap="wrap">
          {canPush && (
            <Button size="xs" h="28px" px={3} borderRadius="7px"
              bg={`${ORANGE}20`} color={ORANGE} border={`1px solid ${ORANGE}40`}
              _hover={{ bg: `${ORANGE}30` }} fontWeight="semibold" fontSize="11px"
              leftIcon={
                <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" w="11px" h="11px">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </Box>
              }
              onClick={() => onPush(target._id)}>
              Push
            </Button>
          )}

          {(target.status === 'pushing' || target.status === 'no-response' || target.status === 'denied') && (
            <Button size="xs" h="28px" px={3} borderRadius="7px"
              bg={`${GREEN}15`} color={GREEN} border={`1px solid ${GREEN}35`}
              _hover={{ bg: `${GREEN}25` }} fontWeight="semibold" fontSize="11px"
              onClick={() => onRespond(target._id, 'approved')}>
              ✓ Approved
            </Button>
          )}

          {(target.status === 'pushing' || target.status === 'no-response') && (
            <Button size="xs" h="28px" px={3} borderRadius="7px"
              bg={`${RED}15`} color={RED} border={`1px solid ${RED}35`}
              _hover={{ bg: `${RED}25` }} fontWeight="semibold" fontSize="11px"
              onClick={() => onRespond(target._id, 'denied')}>
              ✗ Denied
            </Button>
          )}

          {target.status === 'pushing' && (
            <Button size="xs" h="28px" px={3} borderRadius="7px"
              bg={`${BLUE}15`} color={BLUE} border={`1px solid ${BLUE}35`}
              _hover={{ bg: `${BLUE}25` }} fontWeight="semibold" fontSize="11px"
              onClick={() => onRespond(target._id, 'no-response')}>
              ~ No Response
            </Button>
          )}

          {(target.status === 'approved' || target.status === 'denied' || target.status === 'locked' || target.status === 'no-response') && (
            <Button size="xs" h="28px" px={3} borderRadius="7px"
              bg={`${PURPLE}15`} color={PURPLE} border={`1px solid ${PURPLE}35`}
              _hover={{ bg: `${PURPLE}25` }} fontWeight="semibold" fontSize="11px"
              onClick={() => onReset(target._id)}>
              ↺ Reset
            </Button>
          )}

          <Box flex={1} />

          <IconButton size="xs" icon={<DeleteIcon boxSize={3} />} variant="ghost"
            color="var(--dash-text-muted)" borderRadius="7px" h="28px" w="28px"
            _hover={{ color: RED, bg: `${RED}15` }}
            onClick={() => onDelete(target._id)} aria-label="Delete" />
        </Flex>

        {target.notes && (
          <Box mt={2} p={2} bg="rgba(255,255,255,0.03)" borderRadius="8px"
            border="1px solid rgba(255,255,255,0.06)">
            <Text fontSize="11px" color="var(--dash-text-muted)">{target.notes}</Text>
          </Box>
        )}
      </Box>
    </MotionBox>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function MfaPushView() {
  const { slug } = useParams();
  const { getBySlug } = useEngagements();
  const eng = getBySlug(slug);
  const engId = eng?._id || eng?.id || '';

  const [tab, setTab]           = useState('campaign');
  const [targets, setTargets]   = useState([]);
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [addOpen, setAddOpen]   = useState(false);
  const [search, setSearch]     = useState('');
  const [copied, setCopied]     = useState(null);
  const toast = useToast();

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!engId) return;
    setLoading(true);
    const [t, e] = await Promise.all([
      api(`/targets?engagementId=${engId}`),
      api(`/events?engagementId=${engId}`),
    ]);
    setTargets(Array.isArray(t) ? t : []);
    setEvents(Array.isArray(e) ? e : []);
    setLoading(false);
  }, [engId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const addTargets = async (list) => {
    for (const t of list) {
      await api('/targets', { method: 'POST', body: JSON.stringify({ engagementId: engId, ...t }) });
    }
    await fetchAll();
    toast({ title: `${list.length} target(s) added`, status: 'success', duration: 2000, isClosable: true });
  };

  const pushTarget = async (id) => {
    const res = await api(`/targets/${id}/push`, { method: 'POST' });
    if (res.error) return toast({ title: res.error, status: 'warning', duration: 3000 });
    setTargets(prev => prev.map(t => t._id === id ? res : t));
    if (res.status === 'locked') {
      toast({ title: `⚠️ ${res.email} has been locked out`, status: 'error', duration: 4000 });
    } else {
      toast({ title: `Push #${res.pushCount} sent to ${res.email}`, status: 'info', duration: 2000 });
    }
    await api(`/events?engagementId=${engId}`).then(e => setEvents(Array.isArray(e) ? e : []));
  };

  const respondTarget = async (id, response) => {
    const res = await api(`/targets/${id}/respond`, { method: 'POST', body: JSON.stringify({ response }) });
    if (res.error) return toast({ title: res.error, status: 'error', duration: 3000 });
    setTargets(prev => prev.map(t => t._id === id ? res : t));
    if (response === 'approved') {
      toast({ title: `✓ Push approved by ${res.email}!`, status: 'success', duration: 4000 });
    }
    await api(`/events?engagementId=${engId}`).then(e => setEvents(Array.isArray(e) ? e : []));
  };

  const resetTarget = async (id) => {
    const res = await api(`/targets/${id}/reset`, { method: 'POST' });
    if (res.error) return toast({ title: res.error, status: 'error', duration: 3000 });
    setTargets(prev => prev.map(t => t._id === id ? res : t));
  };

  const deleteTarget = async (id) => {
    await api(`/targets/${id}`, { method: 'DELETE' });
    setTargets(prev => prev.filter(t => t._id !== id));
    toast({ title: 'Target removed', status: 'info', duration: 2000 });
  };

  const clearAllTargets = async () => {
    await api(`/targets?engagementId=${engId}`, { method: 'DELETE' });
    setTargets([]);
    setEvents([]);
    toast({ title: 'All targets cleared', status: 'info', duration: 2000 });
  };

  const clearEvents = async () => {
    await api(`/events?engagementId=${engId}`, { method: 'DELETE' });
    setEvents([]);
  };

  const copyScript = (idx, text) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const totalPushes  = targets.reduce((a, t) => a + t.pushCount, 0);
  const approvals    = targets.filter(t => t.status === 'approved').length;
  const locked       = targets.filter(t => t.status === 'locked').length;
  const activePushing = targets.filter(t => t.status === 'pushing');

  const filteredTargets = targets.filter(t =>
    !search ||
    t.email.includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={6} maxW="1300px" mx="auto">
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes mfaPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* Header */}
      <Flex align="flex-start" justify="space-between" mb={6}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            MFA <Text as="span" color="red.400">Push Fatigue</Text> Tracker
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Track push campaigns · throttle attempts · log approvals · social engineer the holdouts
          </Text>
        </Box>

        <Button size="sm" leftIcon={<AddIcon />} h="36px" px={5} borderRadius="10px"
          bg={`${ORANGE}20`} color={ORANGE} border={`1px solid ${ORANGE}40`}
          _hover={{ bg: `${ORANGE}30` }} fontWeight="semibold" fontSize="12px"
          onClick={() => setAddOpen(true)}>
          Add Target
        </Button>
      </Flex>

      {/* Stat cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
        <StatCard label="Total Targets"  value={targets.length}  color={BLUE}   sub="accounts in scope" />
        <StatCard label="Pushes Sent"    value={totalPushes}     color={ORANGE} sub="total attempts" />
        <StatCard label="Approvals"      value={approvals}       color={GREEN}  sub={approvals ? `${Math.round((approvals/targets.length)*100)}% success rate` : 'none yet'} />
        <StatCard label="Locked Out"     value={locked}          color={RED}    sub="accounts at risk" />
      </SimpleGrid>

      {/* Tabs */}
      <Flex gap={2} mb={5} flexWrap="wrap">
        <TabBtn label="Campaign"   active={tab === 'campaign'}  onClick={() => setTab('campaign')}  badge={activePushing.length} />
        <TabBtn label="Targets"    active={tab === 'targets'}   onClick={() => setTab('targets')}   badge={targets.filter(t => t.status === 'approved').length} />
        <TabBtn label="Activity"   active={tab === 'activity'}  onClick={() => setTab('activity')}  badge={events.filter(e => e.action === 'approved').length} />
        <TabBtn label="Playbook"   active={tab === 'playbook'}  onClick={() => setTab('playbook')} />
      </Flex>

      <AnimatePresence mode="wait">

        {/* ── Campaign tab ─────────────────────────────────────────────────────── */}
        {tab === 'campaign' && (
          <MotionBox key="campaign"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <Flex gap={5} align="flex-start" direction={{ base: 'column', lg: 'row' }}>

              {/* Active push targets */}
              <Box flex={1}>
                <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  borderRadius="14px" overflow="hidden">
                  <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${ORANGE}70, transparent)` }} />
                  <Box p={4}>
                    <Flex justify="space-between" align="center" mb={4}>
                      <Flex align="center" gap={2}>
                        <Box pos="relative" w="8px" h="8px">
                          <Box w="8px" h="8px" borderRadius="full" bg={ORANGE} />
                          {activePushing.length > 0 && (
                            <Box pos="absolute" top="0" left="0" w="8px" h="8px" borderRadius="full"
                              bg={ORANGE} opacity={0.4}
                              sx={{ animation: 'mfaPulse 1.4s ease-in-out infinite' }} />
                          )}
                        </Box>
                        <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
                          Active Campaign
                        </Text>
                        <Text fontSize="11px" color="var(--dash-text-muted)">
                          — {activePushing.length} target(s) in progress
                        </Text>
                      </Flex>
                      <Button size="xs" h="26px" px={3} borderRadius="7px"
                        bg={`${ORANGE}15`} color={ORANGE} border={`1px solid ${ORANGE}35`}
                        _hover={{ bg: `${ORANGE}25` }} fontSize="11px"
                        onClick={() => setTab('targets')}>
                        Manage All
                      </Button>
                    </Flex>

                    {activePushing.length === 0 ? (
                      <Flex direction="column" align="center" justify="center" py={10} gap={3}>
                        <Flex w="48px" h="48px" borderRadius="12px" align="center" justify="center"
                          bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)">
                          <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)"
                            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" w="22px" h="22px">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          </Box>
                        </Flex>
                        <Text fontSize="13px" color="var(--dash-text-muted)">No active push campaign</Text>
                        <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" maxW="260px">
                          Add targets and start sending push notifications to begin tracking
                        </Text>
                        <Button size="sm" mt={1} leftIcon={<AddIcon />} h="34px" px={5} borderRadius="9px"
                          bg={`${ORANGE}20`} color={ORANGE} border={`1px solid ${ORANGE}40`}
                          _hover={{ bg: `${ORANGE}30` }} fontSize="12px"
                          onClick={() => setAddOpen(true)}>
                          Add First Target
                        </Button>
                      </Flex>
                    ) : (
                      <Flex direction="column" gap={3}>
                        {activePushing.map(t => {
                          const p = PROVIDERS[t.provider] || PROVIDERS.custom;
                          const pct = Math.min(100, (t.pushCount / Math.max(t.maxPushes, 1)) * 100);
                          return (
                            <Flex key={t._id} align="center" gap={3} p={3}
                              bg="rgba(255,255,255,0.03)" borderRadius="10px"
                              border="1px solid rgba(255,255,255,0.06)">
                              <ProviderIconBox provider={t.provider} size="32px" />
                              <Box flex={1} minW={0}>
                                <Text fontSize="12px" fontWeight="semibold"
                                  color="var(--dash-text-primary)" noOfLines={1}>
                                  {t.name || t.email}
                                </Text>
                                {t.name && <Text fontSize="10px" color="var(--dash-text-muted)" noOfLines={1}>{t.email}</Text>}
                                <PushBar count={t.pushCount} max={t.maxPushes} />
                              </Box>
                              <Text fontSize="11px" color={pct >= 80 ? RED : ORANGE} fontWeight="semibold" flexShrink={0}>
                                {t.pushCount}/{t.maxPushes}
                              </Text>
                              <Button size="xs" h="28px" px={3} borderRadius="7px"
                                bg={`${ORANGE}20`} color={ORANGE} border={`1px solid ${ORANGE}40`}
                                _hover={{ bg: `${ORANGE}30` }} fontWeight="semibold" fontSize="11px"
                                onClick={() => pushTarget(t._id)}>
                                Push +1
                              </Button>
                              <Button size="xs" h="28px" px={3} borderRadius="7px"
                                bg={`${GREEN}15`} color={GREEN} border={`1px solid ${GREEN}35`}
                                _hover={{ bg: `${GREEN}25` }} fontWeight="semibold" fontSize="11px"
                                onClick={() => respondTarget(t._id, 'approved')}>
                                ✓
                              </Button>
                            </Flex>
                          );
                        })}
                      </Flex>
                    )}
                  </Box>
                </Box>

                {/* Results summary */}
                {targets.length > 0 && (
                  <Box mt={4} bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                    borderRadius="14px" overflow="hidden">
                    <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${BLUE}60, transparent)` }} />
                    <Box p={4}>
                      <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)" mb={3}>
                        Campaign Results
                      </Text>
                      <Flex direction="column" gap={2}>
                        {Object.entries(STATUS).map(([key, s]) => {
                          const count = targets.filter(t => t.status === key).length;
                          if (!count) return null;
                          return (
                            <Flex key={key} align="center" gap={3}>
                              <Box w="8px" h="8px" borderRadius="full" bg={s.color} flexShrink={0} />
                              <Text fontSize="12px" color="var(--dash-text-secondary)" flex={1}>{s.label}</Text>
                              <Text fontSize="12px" fontWeight="semibold" color={s.color}>{count}</Text>
                              <Box w="80px" h="4px" bg="rgba(255,255,255,0.07)" borderRadius="full" overflow="hidden">
                                <Box h="100%" borderRadius="full" bg={s.color}
                                  w={`${Math.round((count / targets.length) * 100)}%`} />
                              </Box>
                            </Flex>
                          );
                        })}
                      </Flex>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Throttle guide */}
              <Box w={{ base: '100%', lg: '280px' }} flexShrink={0}>
                <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  borderRadius="14px" overflow="hidden">
                  <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${RED}70, transparent)` }} />
                  <Box p={4}>
                    <Flex align="center" gap={2} mb={4}>
                      <Flex w="28px" h="28px" borderRadius="8px" align="center" justify="center"
                        bg={`${RED}15`} border={`1px solid ${RED}30`} flexShrink={0}>
                        <WarningTwoIcon boxSize="13px" color={RED} />
                      </Flex>
                      <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)">
                        Throttle Guide
                      </Text>
                    </Flex>

                    <Flex direction="column" gap={3}>
                      {Object.entries(PROVIDERS).map(([key, prov]) => (
                        <Box key={key} p={3} bg="rgba(255,255,255,0.03)" borderRadius="9px"
                          border={`1px solid ${prov.color}20`}>
                          <Flex align="center" gap={2} mb={1}>
                            <ProviderIconBox provider={key} size="22px" />
                            <Text fontSize="11px" fontWeight="semibold" color="var(--dash-text-primary)">
                              {prov.label}
                            </Text>
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Text fontSize="10px" color="var(--dash-text-muted)">Lockout threshold</Text>
                            <Text fontSize="11px" fontWeight="bold" color={prov.lockoutAt <= 5 ? RED : ORANGE}>
                              ~{prov.lockoutAt} pushes
                            </Text>
                          </Flex>
                        </Box>
                      ))}
                    </Flex>

                    <Box mt={4} p={3} bg={`${YELLOW}08`} borderRadius="9px"
                      border={`1px solid ${YELLOW}25`}>
                      <Text fontSize="10px" color={YELLOW} fontWeight="semibold" mb={1}>
                        ⚡ Operator Note
                      </Text>
                      <Text fontSize="10px" color="var(--dash-text-muted)" lineHeight="1.6">
                        Space pushes 30–60s apart. Accounts that deny consistently are better targets
                        for a social engineering follow-up call. See Playbook tab.
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Flex>
          </MotionBox>
        )}

        {/* ── Targets tab ──────────────────────────────────────────────────────── */}
        {tab === 'targets' && (
          <MotionBox key="targets"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {/* Controls */}
            <Flex gap={3} mb={5} align="center" wrap="wrap">
              <Input {...inputSx} maxW="260px" value={search}
                placeholder="Search targets..."
                onChange={e => setSearch(e.target.value)} />
              <Box flex={1} />
              <Button size="sm" leftIcon={<AddIcon />} h="36px" px={4} borderRadius="9px"
                bg={`${ORANGE}20`} color={ORANGE} border={`1px solid ${ORANGE}40`}
                _hover={{ bg: `${ORANGE}30` }} fontSize="12px"
                onClick={() => setAddOpen(true)}>
                Add Target
              </Button>
              {targets.length > 0 && (
                <Button size="sm" h="36px" px={4} borderRadius="9px" variant="ghost"
                  color={RED} _hover={{ bg: `${RED}12` }} fontSize="12px"
                  onClick={clearAllTargets}>
                  Clear All
                </Button>
              )}
            </Flex>

            {loading ? (
              <Flex align="center" justify="center" h="200px">
                <Box w="20px" h="20px" border={`2px solid ${ORANGE}`} borderTop="2px solid transparent"
                  borderRadius="full" sx={{ animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </Flex>
            ) : filteredTargets.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={16} gap={3}>
                <Text fontSize="13px" color="var(--dash-text-muted)">
                  {search ? 'No targets match your search' : 'No targets added yet'}
                </Text>
                {!search && (
                  <Button size="sm" leftIcon={<AddIcon />} h="34px" px={5} borderRadius="9px"
                    bg={`${ORANGE}20`} color={ORANGE} border={`1px solid ${ORANGE}40`}
                    _hover={{ bg: `${ORANGE}30` }} fontSize="12px"
                    onClick={() => setAddOpen(true)}>
                    Add First Target
                  </Button>
                )}
              </Flex>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
                <AnimatePresence>
                  {filteredTargets.map(t => (
                    <TargetCard key={t._id} target={t}
                      onPush={pushTarget} onRespond={respondTarget}
                      onReset={resetTarget} onDelete={deleteTarget} />
                  ))}
                </AnimatePresence>
              </SimpleGrid>
            )}
          </MotionBox>
        )}

        {/* ── Activity tab ─────────────────────────────────────────────────────── */}
        {tab === 'activity' && (
          <MotionBox key="activity"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="14px" overflow="hidden">
              <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${BLUE}70, transparent)` }} />
              <Box p={4}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
                    Activity Log
                    <Text as="span" fontSize="11px" color="var(--dash-text-muted)" fontWeight="normal" ml={2}>
                      {events.length} event(s)
                    </Text>
                  </Text>
                  <Flex gap={2}>
                    <Button size="xs" h="26px" px={3} borderRadius="7px" variant="ghost"
                      leftIcon={<RepeatIcon boxSize={2.5} />}
                      color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                      fontSize="11px" onClick={fetchAll}>Refresh</Button>
                    {events.length > 0 && (
                      <Button size="xs" h="26px" px={3} borderRadius="7px" variant="ghost"
                        color={RED} _hover={{ bg: `${RED}12` }} fontSize="11px"
                        onClick={clearEvents}>Clear</Button>
                    )}
                  </Flex>
                </Flex>

                {events.length === 0 ? (
                  <Flex align="center" justify="center" py={12}>
                    <Text fontSize="13px" color="var(--dash-text-muted)">No activity yet</Text>
                  </Flex>
                ) : (
                  <Flex direction="column" gap={0}>
                    {events.map((ev, i) => {
                      const meta = ACTION_META[ev.action] || ACTION_META.pushed;
                      return (
                        <Flex key={ev._id || i} align="flex-start" gap={3} py={2.5}
                          borderBottom={i < events.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}>
                          {/* Icon */}
                          <Flex w="26px" h="26px" borderRadius="7px" flexShrink={0}
                            bg={`${meta.color}15`} border={`1px solid ${meta.color}30`}
                            align="center" justify="center" mt="1px">
                            <Text fontSize="11px" color={meta.color}>{meta.icon}</Text>
                          </Flex>

                          {/* Content */}
                          <Box flex={1} minW={0}>
                            <Flex align="center" gap={2} flexWrap="wrap">
                              <Text fontSize="12px" fontWeight="semibold" color={meta.color}>
                                {meta.label}
                              </Text>
                              <Text fontSize="12px" color="var(--dash-text-secondary)" noOfLines={1}>
                                {ev.name || ev.email}
                              </Text>
                              {ev.name && (
                                <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1}>
                                  ({ev.email})
                                </Text>
                              )}
                            </Flex>
                            <Text fontSize="11px" color="var(--dash-text-muted)" mt="1px">
                              {ev.detail}
                            </Text>
                          </Box>

                          {/* Time */}
                          <Text fontSize="10px" color="var(--dash-text-muted)" flexShrink={0} mt="3px">
                            {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                )}
              </Box>
            </Box>
          </MotionBox>
        )}

        {/* ── Playbook tab ──────────────────────────────────────────────────────── */}
        {tab === 'playbook' && (
          <MotionBox key="playbook"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            <Flex direction="column" gap={2} mb={4}>
              <Text fontSize="13px" color="var(--dash-text-secondary)">
                Social engineering scripts to use when targets won't approve — phone calls, messages, and escalation templates.
              </Text>
            </Flex>

            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
              {PLAYBOOK.map((play, i) => (
                <MotionBox key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  borderRadius="14px" overflow="hidden">
                  <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${play.color}70, transparent)` }} />
                  <Box p={4}>
                    <Flex justify="space-between" align="flex-start" mb={2}>
                      <Box>
                        <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
                          {play.title}
                        </Text>
                        <Text fontSize="11px" color={play.color} mt="2px">{play.scenario}</Text>
                      </Box>
                      <IconButton
                        icon={copied === i ? <CheckIcon boxSize={3} /> : <CopyIcon boxSize={3} />}
                        size="xs" variant="ghost" borderRadius="7px" h="26px" w="26px"
                        color={copied === i ? GREEN : 'var(--dash-text-muted)'}
                        _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                        onClick={() => copyScript(i, play.script)}
                        aria-label="Copy" />
                    </Flex>
                    <Box p={3} bg="rgba(0,0,0,0.25)" borderRadius="9px"
                      border="1px solid rgba(255,255,255,0.06)" maxH="200px" overflowY="auto"
                      sx={{ '&::-webkit-scrollbar': { w: '4px' }, '&::-webkit-scrollbar-thumb': { bg: 'rgba(255,255,255,0.1)', borderRadius: '4px' } }}>
                      <Text fontSize="11px" color="var(--dash-text-secondary)" whiteSpace="pre-wrap"
                        lineHeight="1.7" fontFamily="mono">
                        {play.script}
                      </Text>
                    </Box>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </MotionBox>
        )}

      </AnimatePresence>

      {/* Add target modal */}
      <AddTargetModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdd={addTargets} />
    </Box>
  );
}
