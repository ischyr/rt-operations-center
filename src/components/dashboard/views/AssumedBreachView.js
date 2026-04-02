import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Flex, Text, Heading, Input, Textarea, IconButton,
  Button, SimpleGrid, Modal, ModalOverlay, ModalContent, ModalBody,
  Badge,
} from '@chakra-ui/react';
import {
  AddIcon, DeleteIcon, CloseIcon, CheckIcon, WarningIcon,
  ChevronRightIcon, RepeatIcon, InfoIcon, EditIcon,
  AtSignIcon, UnlockIcon, LockIcon, LinkIcon, SettingsIcon,
  ViewIcon, ExternalLinkIcon,
} from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE   = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ACCENT     = '#9F7AEA';
const GREEN      = '#68D391';
const RED        = '#FC8181';
const ORANGE     = '#F6AD55';
const YELLOW     = '#ECC94B';
const BLUE       = '#63B3ED';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// ── Starting points ───────────────────────────────────────────────────────────
const STARTING_POINTS = [
  { key: 'workstation-user', label: 'Workstation User',   desc: 'Low-priv domain user, no local admin',            color: BLUE,   Icon: AtSignIcon       },
  { key: 'local-admin',      label: 'Local Admin',        desc: 'Local admin on one or more workstations',         color: ORANGE, Icon: UnlockIcon       },
  { key: 'server-admin',     label: 'Server Admin',       desc: 'Admin on a member server, not DC',                color: RED,    Icon: SettingsIcon     },
  { key: 'service-account',  label: 'Service Account',    desc: 'Domain service account with specific privileges', color: GREEN,  Icon: RepeatIcon       },
  { key: 'domain-user-vpn',  label: 'VPN + Domain User',  desc: 'Valid VPN creds and domain user access',          color: ACCENT, Icon: LinkIcon         },
  { key: 'cloud-readonly',   label: 'Cloud Read-Only',    desc: 'AWS / Azure / GCP read-only IAM access',          color: '#4FD1C5', Icon: ViewIcon       },
  { key: 'contractor',       label: 'Contractor Access',  desc: 'Third-party vendor with limited access',          color: YELLOW, Icon: ExternalLinkIcon },
  { key: 'physical',         label: 'Physical Access',    desc: 'On-site, no credentials',                         color: '#FC8181', Icon: WarningIcon   },
];

const SP_MAP = Object.fromEntries(STARTING_POINTS.map(s => [s.key, s]));

// ── Objectives ────────────────────────────────────────────────────────────────
const OBJECTIVES = [
  'Domain Admin', 'Enterprise Admin', 'Domain Controller Access',
  'Data Exfiltration', 'Ransomware Simulation',
  'Cloud Tenant Admin', 'Crown Jewels Access',
  'Specific System Access', 'Custom',
];

// ── Suggested attack paths per starting point ─────────────────────────────────
const SUGGESTED_PATHS = {
  'workstation-user': [
    { title: 'Local Privilege Escalation',              technique: 'T1548',     tactic: 'Privilege Escalation' },
    { title: 'Credential Dumping (LSASS)',              technique: 'T1003.001', tactic: 'Credential Access'    },
    { title: 'Internal Recon (BloodHound / SharpHound)', technique: 'T1087.002', tactic: 'Discovery'          },
    { title: 'Lateral Movement (Pass-the-Hash)',        technique: 'T1550.002', tactic: 'Lateral Movement'    },
    { title: 'Domain Admin Escalation',                 technique: 'T1078.002', tactic: 'Privilege Escalation' },
    { title: 'DCSync / Hash Dumping',                   technique: 'T1003.006', tactic: 'Credential Access'   },
  ],
  'local-admin': [
    { title: 'Credential Dumping (LSASS / SAM)',        technique: 'T1003',     tactic: 'Credential Access'   },
    { title: 'SMB / WMI Lateral Movement',              technique: 'T1021.002', tactic: 'Lateral Movement'   },
    { title: 'Kerberoasting / AS-REP Roasting',         technique: 'T1558.003', tactic: 'Credential Access'  },
    { title: 'BloodHound Enumeration',                  technique: 'T1087.002', tactic: 'Discovery'          },
    { title: 'Domain Admin Escalation',                 technique: 'T1078.002', tactic: 'Privilege Escalation' },
  ],
  'server-admin': [
    { title: 'Credential Dumping (LSASS / NTDS)',       technique: 'T1003',     tactic: 'Credential Access'   },
    { title: 'DCSync Attack',                           technique: 'T1003.006', tactic: 'Credential Access'   },
    { title: 'Domain Enumeration',                      technique: 'T1087.002', tactic: 'Discovery'          },
    { title: 'Domain Admin Escalation',                 technique: 'T1078.002', tactic: 'Privilege Escalation' },
  ],
  'service-account': [
    { title: 'SPN Enumeration & Kerberoasting',         technique: 'T1558.003', tactic: 'Credential Access'   },
    { title: 'ACL / DACL Abuse',                        technique: 'T1222',     tactic: 'Defense Evasion'     },
    { title: 'Shadow Credentials / RBCD',               technique: 'T1556',     tactic: 'Credential Access'   },
    { title: 'Lateral Movement via Service Context',    technique: 'T1021',     tactic: 'Lateral Movement'   },
    { title: 'Domain Admin Escalation',                 technique: 'T1078.002', tactic: 'Privilege Escalation' },
  ],
  'domain-user-vpn': [
    { title: 'Internal Network Scanning',               technique: 'T1046',     tactic: 'Discovery'          },
    { title: 'NTLM Relay / Responder Poisoning',        technique: 'T1557.001', tactic: 'Credential Access'  },
    { title: 'Vulnerability Exploitation (Internal)',   technique: 'T1210',     tactic: 'Lateral Movement'   },
    { title: 'BloodHound Enumeration',                  technique: 'T1087.002', tactic: 'Discovery'          },
    { title: 'Domain Admin Escalation',                 technique: 'T1078.002', tactic: 'Privilege Escalation' },
  ],
  'cloud-readonly': [
    { title: 'IAM & Policy Enumeration',                technique: 'T1069.003', tactic: 'Discovery'          },
    { title: 'S3 / Storage Account Recon',              technique: 'T1530',     tactic: 'Collection'         },
    { title: 'Secrets & Credential Discovery',          technique: 'T1552',     tactic: 'Credential Access'  },
    { title: 'Privilege Escalation via Policy Attach',  technique: 'T1098.003', tactic: 'Privilege Escalation' },
    { title: 'Cloud Tenant Admin Access',               technique: 'T1078.004', tactic: 'Defense Evasion'    },
  ],
  'contractor': [
    { title: 'Vendor Access Abuse',                     technique: 'T1195',     tactic: 'Initial Access'     },
    { title: 'Internal Recon from Trusted Position',    technique: 'T1046',     tactic: 'Discovery'          },
    { title: 'Credential Harvesting (Shared Systems)',  technique: 'T1003',     tactic: 'Credential Access'  },
    { title: 'Lateral Movement via Trusted Relationship', technique: 'T1199',  tactic: 'Lateral Movement'   },
  ],
  'physical': [
    { title: 'Rogue Device Implant (LAN Turtle / RPi)', technique: 'T1200',    tactic: 'Initial Access'     },
    { title: 'Network Scanning & Discovery',            technique: 'T1046',    tactic: 'Discovery'          },
    { title: 'Credential Access via Keylogger / Sniff', technique: 'T1056',    tactic: 'Credential Access'  },
    { title: 'Lateral Movement',                        technique: 'T1021',    tactic: 'Lateral Movement'   },
    { title: 'Domain Admin Escalation',                 technique: 'T1078.002', tactic: 'Privilege Escalation' },
  ],
};

// ── Step status config ────────────────────────────────────────────────────────
const STEP_STATUS = {
  pending:   { label: 'Pending',     color: '#718096'  },
  progress:  { label: 'In Progress', color: YELLOW     },
  succeeded: { label: 'Succeeded',   color: GREEN      },
  failed:    { label: 'Failed',      color: RED        },
  blocked:   { label: 'Blocked',     color: ORANGE     },
};
const STATUS_CYCLE = {
  pending: 'progress', progress: 'succeeded', succeeded: 'failed',
  failed: 'blocked', blocked: 'pending',
};

const SCENARIO_STATUS = {
  active:    { label: 'Active',    color: BLUE   },
  completed: { label: 'Completed', color: GREEN  },
  blocked:   { label: 'Blocked',   color: ORANGE },
};

// ── Label ─────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1.5}>{children}</Text>
);

const inputStyles = {
  bg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)',
  borderRadius: '8px', color: 'var(--dash-text-primary)', fontSize: 'sm',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { borderColor: `${ACCENT}50` },
  _focus: { borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

// ── Step card ─────────────────────────────────────────────────────────────────
const StepCard = ({ step, index, total, onChange, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(step.title);
  const [localTech,  setLocalTech]  = useState(step.technique);
  const [localNotes, setLocalNotes] = useState(step.notes);
  const st = STEP_STATUS[step.status] || STEP_STATUS.pending;

  useEffect(() => {
    setLocalTitle(step.title);
    setLocalTech(step.technique);
    setLocalNotes(step.notes);
  }, [step.title, step.technique, step.notes]);

  const save = () => {
    onChange({ ...step, title: localTitle, technique: localTech, notes: localNotes });
    setEditing(false);
  };

  const cycleStatus = () => onChange({ ...step, status: STATUS_CYCLE[step.status] || 'pending' });

  return (
    <Flex gap={3}>
      {/* Timeline gutter */}
      <Flex direction="column" align="center" flexShrink={0} w="24px">
        <Box w="10px" h="10px" borderRadius="full" border={`2px solid ${st.color}`}
          bg={step.status === 'succeeded' ? st.color : 'var(--dash-card-bg)'}
          flexShrink={0} mt="14px" />
        {index < total - 1 && (
          <Box flex={1} w="2px" bg="rgba(255,255,255,0.07)" mt={1} />
        )}
      </Flex>

      {/* Card */}
      <MotionBox
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, delay: index * 0.04 }}
        flex={1} mb={index < total - 1 ? 2 : 0}
        borderRadius="10px" bg="var(--dash-card-bg)"
        border={`1px solid ${step.status === 'succeeded' ? `${GREEN}30` : step.status === 'failed' ? `${RED}30` : 'rgba(255,255,255,0.07)'}`}
        overflow="hidden" pos="relative">

        {/* Status strip */}
        <Box pos="absolute" left={0} top={0} bottom={0} w="3px" bg={st.color} borderRadius="10px 0 0 10px" />

        <Box px={4} py={3} pl={5}>
          {!editing ? (
            <Flex align="flex-start" justify="space-between" gap={2}>
              <Box flex={1} minW={0}>
                <Flex align="center" gap={2} flexWrap="wrap" mb={0.5}>
                  <Text fontSize="13px" fontWeight="semibold"
                    color={step.title ? 'var(--dash-text-primary)' : 'var(--dash-text-muted)'}>
                    {step.title || 'Untitled step'}
                  </Text>
                  {step.technique && (
                    <Badge fontSize="9px" px={1.5} py="1px" borderRadius="4px"
                      bg={`${ACCENT}18`} color={ACCENT} border={`1px solid ${ACCENT}35`}
                      fontFamily="monospace" textTransform="none">
                      {step.technique}
                    </Badge>
                  )}
                  {step.tactic && (
                    <Badge fontSize="9px" px={1.5} py="1px" borderRadius="4px"
                      bg="rgba(255,255,255,0.06)" color="var(--dash-text-muted)"
                      textTransform="none">
                      {step.tactic}
                    </Badge>
                  )}
                </Flex>
                {step.notes && (
                  <Text fontSize="11px" color="var(--dash-text-muted)" mt={0.5} noOfLines={2}>
                    {step.notes}
                  </Text>
                )}
              </Box>
              <Flex gap={1} flexShrink={0}>
                <Box
                  as="button" px={2} py="3px" borderRadius="6px" fontSize="9px"
                  fontWeight="bold" textTransform="uppercase" letterSpacing="wide"
                  color={st.color} bg={`${st.color}15`} border={`1px solid ${st.color}35`}
                  cursor="pointer" onClick={cycleStatus}
                  style={{ transition: 'all 0.12s' }}>
                  {st.label}
                </Box>
                <IconButton icon={<EditIcon boxSize={2.5} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" _hover={{ color: ACCENT }}
                  aria-label="Edit" onClick={() => setEditing(true)} />
                <IconButton icon={<DeleteIcon boxSize={2.5} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" _hover={{ color: RED }}
                  aria-label="Delete" onClick={onDelete} />
              </Flex>
            </Flex>
          ) : (
            <Box>
              <Flex gap={2} mb={2}>
                <Input value={localTitle} onChange={e => setLocalTitle(e.target.value)}
                  placeholder="Step title…" size="sm" flex={1} {...inputStyles} />
                <Input value={localTech} onChange={e => setLocalTech(e.target.value)}
                  placeholder="T1003.001" size="sm" w="110px" fontFamily="monospace"
                  fontSize="12px" {...inputStyles} />
              </Flex>
              <Textarea value={localNotes} onChange={e => setLocalNotes(e.target.value)}
                placeholder="Notes, commands, observations…" size="sm" rows={2}
                resize="none" mb={2} {...inputStyles} />
              <Flex gap={2}>
                <Button size="xs" borderRadius="6px" px={3}
                  bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                  _hover={{ bg: `${ACCENT}35` }} onClick={save}>
                  Save
                </Button>
                <Button size="xs" variant="ghost" borderRadius="6px"
                  color="var(--dash-text-muted)" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </Flex>
            </Box>
          )}
        </Box>
      </MotionBox>
    </Flex>
  );
};

// ── Scenario sidebar item ─────────────────────────────────────────────────────
const ScenarioItem = ({ scenario, isActive, onSelect, onDelete }) => {
  const sp  = SP_MAP[scenario.startingPoint];
  const sst = SCENARIO_STATUS[scenario.status] || SCENARIO_STATUS.active;
  const done = (scenario.steps || []).filter(s => s.status === 'succeeded').length;

  return (
    <MotionBox
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      px={3} py={2.5} borderRadius="8px" cursor="pointer"
      bg={isActive ? `${ACCENT}12` : 'rgba(255,255,255,0.03)'}
      border={isActive ? `1px solid ${ACCENT}40` : '1px solid rgba(255,255,255,0.07)'}
      _hover={{ bg: isActive ? `${ACCENT}16` : 'rgba(255,255,255,0.06)', borderColor: `${ACCENT}40` }}
      style={{ transition: 'all 0.12s' }}
      onClick={() => onSelect(scenario._id)}>
      <Flex align="center" justify="space-between" gap={2}>
        <Box flex={1} minW={0}>
          <Text fontSize="11px" fontWeight="semibold" color="var(--dash-text-primary)"
            noOfLines={1}>{scenario.name}</Text>
          <Flex align="center" gap={1.5} mt={0.5}>
            {sp && <sp.Icon boxSize={2.5} color={sp.color} />}
            <Text fontSize="9px" color="var(--dash-text-muted)" noOfLines={1}>
              {sp?.label || scenario.startingPoint}
            </Text>
          </Flex>
          <Flex align="center" gap={2} mt={1}>
            <Box px={1.5} py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
              color={sst.color} bg={`${sst.color}18`} border={`1px solid ${sst.color}30`}>
              {sst.label}
            </Box>
            <Text fontSize="9px" color="var(--dash-text-muted)">
              {done}/{(scenario.steps || []).length} steps done
            </Text>
          </Flex>
        </Box>
        <IconButton icon={<DeleteIcon boxSize={2.5} />} size="xs" variant="ghost"
          color="var(--dash-text-muted)" _hover={{ color: RED }}
          aria-label="Delete" onClick={e => { e.stopPropagation(); onDelete(scenario._id); }} />
      </Flex>
    </MotionBox>
  );
};

// ── Main view ─────────────────────────────────────────────────────────────────
const AssumedBreachView = () => {
  const { slug }                        = useParams();
  const { getBySlug, fetchEngagements } = useEngagements();
  const eng                             = getBySlug(slug);

  const [scenarios,   setScenarios]   = useState([]);
  const [selectedId,  setSelectedId]  = useState(null);
  const [creating,    setCreating]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [newForm,     setNewForm]     = useState({ name: '', startingPoint: 'workstation-user', objective: 'Domain Admin' });

  const saveTimer = useRef(null);

  useEffect(() => {
    if (eng?.assumedBreachScenarios) setScenarios(eng.assumedBreachScenarios);
  }, [eng?.assumedBreachScenarios]);

  const selected = scenarios.find(s => s._id === selectedId) || null;
  const sp       = selected ? (SP_MAP[selected.startingPoint] || SP_MAP['workstation-user']) : null;

  // ── Server calls ─────────────────────────────────────────────────────────
  const saveScenario = useCallback(async (scenarioId, updates) => {
    try {
      const res = await fetch(`${API_BASE}/api/assumed-breach/${eng._id}/scenarios/${scenarioId}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(updates),
      });
      if (res.ok) {
        // Replace local state with server response so temp _ids become real ObjectIds
        const updated = await res.json();
        setScenarios(prev => prev.map(s => s._id === scenarioId ? updated : s));
      }
    } catch (e) { console.error(e); }
  }, [eng]);

  const debouncedSave = useCallback((scenarioId, updates) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveScenario(scenarioId, updates), 600);
  }, [saveScenario]);

  const updateSelected = useCallback((patch) => {
    setScenarios(prev => prev.map(s =>
      s._id === selectedId ? { ...s, ...patch } : s
    ));
    debouncedSave(selectedId, patch);
  }, [selectedId, debouncedSave]);

  const createScenario = async () => {
    if (!newForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/assumed-breach/${eng._id}/scenarios`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(newForm),
      });
      if (res.ok) {
        const s = await res.json();
        setScenarios(prev => [...prev, s]);
        setSelectedId(s._id);
        setCreating(false);
        setNewForm({ name: '', startingPoint: 'workstation-user', objective: 'Domain Admin' });
        fetchEngagements();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const deleteScenario = async (id) => {
    setScenarios(prev => prev.filter(s => s._id !== id));
    if (selectedId === id) setSelectedId(null);
    await fetch(`${API_BASE}/api/assumed-breach/${eng._id}/scenarios/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    fetchEngagements();
  };

  // ── Step helpers ──────────────────────────────────────────────────────────
  const addStep = () => {
    const steps = [...(selected?.steps || []), {
      title: '', technique: '', tactic: '',
      status: 'pending', notes: '', order: (selected?.steps || []).length,
    }];
    updateSelected({ steps });
  };

  const addSuggestedPath = () => {
    const suggestions = SUGGESTED_PATHS[selected?.startingPoint] || [];
    const existing = selected?.steps || [];
    const newSteps = suggestions.map((s, i) => ({
      ...s,
      status: 'pending', notes: '', order: existing.length + i,
    }));
    updateSelected({ steps: [...existing, ...newSteps] });
  };

  const updateStep = (idx, updated) => {
    const steps = (selected?.steps || []).map((s, i) => i === idx ? updated : s);
    updateSelected({ steps });
  };

  const deleteStep = (idx) => {
    const steps = (selected?.steps || []).filter((_, i) => i !== idx);
    updateSelected({ steps });
  };

  const stats = selected ? {
    total:     selected.steps?.length || 0,
    succeeded: (selected.steps || []).filter(s => s.status === 'succeeded').length,
    failed:    (selected.steps || []).filter(s => s.status === 'failed').length,
    blocked:   (selected.steps || []).filter(s => s.status === 'blocked').length,
    pending:   (selected.steps || []).filter(s => s.status === 'pending').length,
  } : null;

  if (!eng) return null;

  return (
    <Box px={6} pb={12}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Assumed Breach <Text as="span" color="red.400">Planner</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · model attacker impact from a defined starting position
          </Text>
        </Box>
      </Flex>

      {/* ── Info banner ────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px"
        bg={`${ACCENT}0D`} border={`1px solid ${ACCENT}30`}>
        <Flex align="center" gap={2} mb={2}>
          <InfoIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">Assumed Breach</Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {[
            'Define the attacker\'s starting access level',
            'Build the attack path step-by-step with MITRE IDs',
            'Track what succeeded, failed, or was blocked',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <Flex gap={6} align="flex-start" direction={{ base: 'column', xl: 'row' }}>

        {/* ── Left: scenario builder ────────────────────────────────────────── */}
        <Box flex={1} minW={0}>

          {/* No scenario selected */}
          {!selected && (
            <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              textAlign="center" py={14} borderRadius="16px"
              bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
              <Flex w="52px" h="52px" borderRadius="14px" mx="auto" mb={4}
                bg={`${ACCENT}15`} border={`1px solid ${ACCENT}30`}
                align="center" justify="center">
                <ChevronRightIcon boxSize={6} color={ACCENT} />
              </Flex>
              <Text fontSize="15px" fontWeight="semibold" color="var(--dash-text-secondary)" mb={1}>
                No scenario selected
              </Text>
              <Text fontSize="12px" color="var(--dash-text-muted)" mb={5}>
                Create a scenario and define the assumed breach starting point
              </Text>
              <Button size="sm" leftIcon={<AddIcon boxSize={3} />}
                bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                _hover={{ bg: `${ACCENT}35` }} borderRadius="8px" fontWeight="bold"
                onClick={() => setCreating(true)}>
                New Scenario
              </Button>
            </MotionBox>
          )}

          {/* Scenario builder */}
          <AnimatePresence mode="wait">
            {selected && (
              <MotionBox key={selected._id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                {/* Scenario header */}
                <Box mb={4} px={5} py={4} borderRadius="14px"
                  bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  pos="relative" overflow="hidden">
                  <Box pos="absolute" top={0} left={0} right={0} h="2px"
                    style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />
                  <Flex align="center" gap={3} justify="space-between" flexWrap="wrap">
                    <Flex align="center" gap={3} flex={1} minW={0}>
                      {sp && (
                        <Flex w="40px" h="40px" borderRadius="10px" flexShrink={0}
                          bg={`${sp.color}18`} border={`1px solid ${sp.color}40`}
                          align="center" justify="center">
                          <sp.Icon boxSize={4} color={sp.color} />
                        </Flex>
                      )}
                      <Box flex={1} minW={0}>
                        <Input
                          value={selected.name}
                          onChange={e => updateSelected({ name: e.target.value })}
                          variant="unstyled" fontWeight="bold" fontSize="15px"
                          color="var(--dash-text-primary)"
                          _placeholder={{ color: 'var(--dash-text-muted)' }}
                          placeholder="Scenario name…"
                        />
                        <Flex align="center" gap={2} mt={0.5}>
                          <Text fontSize="11px" color="var(--dash-text-muted)">
                            {sp?.label} → {selected.objective}
                          </Text>
                        </Flex>
                      </Box>
                    </Flex>
                    {/* Overall status toggle */}
                    <Flex gap={2} flexShrink={0}>
                      {Object.entries(SCENARIO_STATUS).map(([k, v]) => (
                        <Box key={k} as="button" px={2.5} py="4px" borderRadius="7px"
                          fontSize="10px" fontWeight="bold" cursor="pointer"
                          bg={selected.status === k ? `${v.color}20` : 'rgba(255,255,255,0.04)'}
                          color={selected.status === k ? v.color : 'var(--dash-text-muted)'}
                          border={`1px solid ${selected.status === k ? `${v.color}50` : 'rgba(255,255,255,0.08)'}`}
                          onClick={() => updateSelected({ status: k })}
                          style={{ transition: 'all 0.12s' }}>
                          {v.label}
                        </Box>
                      ))}
                    </Flex>
                  </Flex>
                </Box>

                {/* Stats row */}
                {stats && stats.total > 0 && (
                  <SimpleGrid columns={5} gap={2} mb={4}>
                    {[
                      { label: 'Total',     value: stats.total,     color: 'var(--dash-text-muted)' },
                      { label: 'Succeeded', value: stats.succeeded, color: GREEN  },
                      { label: 'In Progress', value: (selected.steps||[]).filter(s=>s.status==='progress').length, color: YELLOW },
                      { label: 'Failed',    value: stats.failed,    color: RED    },
                      { label: 'Blocked',   value: stats.blocked,   color: ORANGE },
                    ].map(({ label, value, color }) => (
                      <Box key={label} px={3} py={2.5} borderRadius="10px"
                        bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                        pos="relative" overflow="hidden">
                        <Text fontSize="18px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
                        <Text fontSize="10px" color="var(--dash-text-muted)" mt={0.5}>{label}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}

                {/* Starting point + objective flow */}
                <Flex align="center" gap={2} mb={4} px={4} py={3} borderRadius="10px"
                  bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)">
                  {sp && (
                    <Flex align="center" gap={2} px={3} py={1.5} borderRadius="8px"
                      bg={`${sp.color}12`} border={`1px solid ${sp.color}30`} flexShrink={0}>
                      <sp.Icon boxSize={3} color={sp.color} />
                      <Text fontSize="11px" fontWeight="semibold" color={sp.color}>{sp.label}</Text>
                    </Flex>
                  )}
                  <Box flex={1} h="1px" bg="rgba(255,255,255,0.08)" pos="relative">
                    <Box pos="absolute" right={0} top="-3px" w="7px" h="7px"
                      borderTop="1px solid rgba(255,255,255,0.15)"
                      borderRight="1px solid rgba(255,255,255,0.15)"
                      transform="rotate(45deg)" />
                  </Box>
                  <Flex align="center" gap={2} px={3} py={1.5} borderRadius="8px"
                    bg={`${ACCENT}12`} border={`1px solid ${ACCENT}30`} flexShrink={0}>
                    <CheckIcon boxSize={3} color={ACCENT} />
                    <Text fontSize="11px" fontWeight="semibold" color={ACCENT}>{selected.objective}</Text>
                  </Flex>
                </Flex>

                {/* Attack path */}
                <Box mb={4} px={5} py={4} borderRadius="14px"
                  bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
                  <Flex align="center" justify="space-between" mb={4}>
                    <Flex align="center" gap={2}>
                      <Box w="3px" h="14px" borderRadius="full" bg={ACCENT} />
                      <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                        textTransform="uppercase" letterSpacing="wider">Attack Path</Text>
                      {stats?.total > 0 && (
                        <Box px="7px" py="1px" borderRadius="20px"
                          bg={`${ACCENT}12`} border={`1px solid ${ACCENT}25`}>
                          <Text fontSize="9px" fontWeight="bold" color={ACCENT}>{stats.total}</Text>
                        </Box>
                      )}
                    </Flex>
                    <Flex gap={2}>
                      {(SUGGESTED_PATHS[selected.startingPoint] || []).length > 0 && (
                        <Button size="xs" variant="ghost" borderRadius="6px" fontSize="10px"
                          color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.1)"
                          _hover={{ color: ACCENT, borderColor: `${ACCENT}40` }}
                          leftIcon={<RepeatIcon boxSize={2.5} />}
                          onClick={addSuggestedPath}>
                          Load Suggested Path
                        </Button>
                      )}
                      <Button size="xs" leftIcon={<AddIcon boxSize={2.5} />}
                        bg={`${ACCENT}18`} color={ACCENT} border={`1px solid ${ACCENT}40`}
                        _hover={{ bg: `${ACCENT}30` }} borderRadius="6px" fontSize="10px"
                        fontWeight="bold" onClick={addStep}>
                        Add Step
                      </Button>
                    </Flex>
                  </Flex>

                  {(selected.steps || []).length === 0 ? (
                    <Flex direction="column" align="center" justify="center" py={8} gap={2}>
                      <Flex w="36px" h="36px" borderRadius="10px"
                        bg={`${ACCENT}12`} border={`1px solid ${ACCENT}25`}
                        align="center" justify="center">
                        <ChevronRightIcon boxSize={4} color={ACCENT} />
                      </Flex>
                      <Text fontSize="12px" color="var(--dash-text-muted)">
                        No steps yet — add a step or load a suggested attack path
                      </Text>
                    </Flex>
                  ) : (
                    <Box>
                      {(selected.steps || []).map((step, idx) => (
                        <StepCard
                          key={step._id || `step-${idx}`}
                          step={step}
                          index={idx}
                          total={(selected.steps || []).length}
                          onChange={(updated) => updateStep(idx, updated)}
                          onDelete={() => deleteStep(idx)}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Notes */}
                <Box px={5} py={4} borderRadius="14px"
                  bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
                  <Flex align="center" gap={2} mb={3}>
                    <Box w="3px" h="14px" borderRadius="full" bg="rgba(255,255,255,0.2)" />
                    <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wider">Scenario Notes</Text>
                  </Flex>
                  <Textarea
                    value={selected.notes || ''}
                    onChange={e => updateSelected({ notes: e.target.value })}
                    placeholder="Key observations, report narrative, lessons learned…"
                    rows={4} resize="none" variant="unstyled"
                    px={4} py={3} borderRadius="10px" fontSize="13px"
                    color="var(--dash-text-primary)"
                    bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
                    _placeholder={{ color: 'var(--dash-text-muted)' }}
                    _focus={{ borderColor: `${ACCENT}50`, boxShadow: `0 0 0 1px ${ACCENT}25` }}
                  />
                </Box>

              </MotionBox>
            )}
          </AnimatePresence>
        </Box>

        {/* ── Right sidebar ─────────────────────────────────────────────────── */}
        <Box w={{ base: '100%', xl: '280px' }} flexShrink={0}>
          <Button w="100%" size="sm" leftIcon={<AddIcon boxSize={3} />}
            bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
            _hover={{ bg: `${ACCENT}35` }} borderRadius="8px" fontWeight="bold"
            mb={4} onClick={() => setCreating(true)}>
            New Scenario
          </Button>

          <Flex align="center" gap={2} mb={3}>
            <Box w="3px" h="14px" borderRadius="full" bg={ACCENT} />
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider">Scenarios</Text>
            {scenarios.length > 0 && (
              <Box ml="auto" px="7px" py="1px" borderRadius="20px"
                bg={`${ACCENT}12`} border={`1px solid ${ACCENT}25`}>
                <Text fontSize="10px" fontWeight="bold" color={ACCENT}>{scenarios.length}</Text>
              </Box>
            )}
          </Flex>

          {scenarios.length === 0 ? (
            <Box px={4} py={6} borderRadius="10px" textAlign="center"
              bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
              <Text fontSize="12px" color="var(--dash-text-muted)">No scenarios yet</Text>
            </Box>
          ) : (
            <Flex direction="column" gap={1.5}>
              {scenarios.map(s => (
                <ScenarioItem
                  key={s._id}
                  scenario={s}
                  isActive={selectedId === s._id}
                  onSelect={setSelectedId}
                  onDelete={deleteScenario}
                />
              ))}
            </Flex>
          )}
        </Box>
      </Flex>

      {/* ── New scenario modal ────────────────────────────────────────────────── */}
      <Modal isOpen={creating} onClose={() => setCreating(false)} size="xl" isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(4px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px" mx={4}>
          <ModalBody p={6}>
            <Flex align="center" justify="space-between" mb={5}>
              <Text fontSize="15px" fontWeight="bold" color="var(--dash-text-primary)">
                New Assumed Breach Scenario
              </Text>
              <IconButton icon={<CloseIcon boxSize={2.5} />} size="sm" variant="ghost"
                color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                aria-label="Close" onClick={() => setCreating(false)} />
            </Flex>

            {/* Name */}
            <Box mb={5}>
              <Label>Scenario Name</Label>
              <Input value={newForm.name}
                onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') createScenario(); }}
                placeholder="e.g. Workstation User → Domain Admin" size="sm"
                {...inputStyles} />
            </Box>

            {/* Starting point */}
            <Box mb={5}>
              <Label>Starting Point</Label>
              <SimpleGrid columns={2} gap={2}>
                {STARTING_POINTS.map(sp => {
                  const active = newForm.startingPoint === sp.key;
                  return (
                    <Box key={sp.key} as="button" textAlign="left" px={3} py={2.5}
                      borderRadius="10px" cursor="pointer"
                      bg={active ? `${sp.color}15` : 'rgba(255,255,255,0.03)'}
                      border={`1px solid ${active ? sp.color + '50' : 'rgba(255,255,255,0.08)'}`}
                      _hover={{ borderColor: `${sp.color}50`, bg: `${sp.color}10` }}
                      style={{ transition: 'all 0.12s' }}
                      onClick={() => setNewForm(p => ({ ...p, startingPoint: sp.key }))}>
                      <Flex align="center" gap={2}>
                        <Flex w="28px" h="28px" borderRadius="7px" flexShrink={0}
                          bg={`${sp.color}18`} border={`1px solid ${sp.color}35`}
                          align="center" justify="center">
                          <sp.Icon boxSize={3} color={sp.color} />
                        </Flex>
                        <Box>
                          <Text fontSize="11px" fontWeight="semibold"
                            color={active ? sp.color : 'var(--dash-text-primary)'}>
                            {sp.label}
                          </Text>
                          <Text fontSize="9px" color="var(--dash-text-muted)" noOfLines={1}>
                            {sp.desc}
                          </Text>
                        </Box>
                      </Flex>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>

            {/* Objective */}
            <Box mb={6}>
              <Label>Objective</Label>
              <Flex gap={2} flexWrap="wrap">
                {OBJECTIVES.map(obj => {
                  const active = newForm.objective === obj;
                  return (
                    <Box key={obj} as="button" px={2.5} py={1} borderRadius="7px"
                      fontSize="11px" fontWeight="semibold" cursor="pointer"
                      bg={active ? `${ACCENT}20` : 'rgba(255,255,255,0.04)'}
                      color={active ? ACCENT : 'var(--dash-text-muted)'}
                      border={`1px solid ${active ? `${ACCENT}50` : 'rgba(255,255,255,0.08)'}`}
                      _hover={{ borderColor: `${ACCENT}40`, color: ACCENT }}
                      style={{ transition: 'all 0.12s' }}
                      onClick={() => setNewForm(p => ({ ...p, objective: obj }))}>
                      {obj}
                    </Box>
                  );
                })}
              </Flex>
            </Box>

            <Flex gap={2}>
              <Button flex={1} size="sm" borderRadius="8px"
                bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                _hover={{ bg: `${ACCENT}35` }} fontWeight="bold"
                isLoading={saving} loadingText="Creating…"
                isDisabled={!newForm.name.trim()}
                onClick={createScenario}>
                Create Scenario
              </Button>
              <Button size="sm" variant="ghost" borderRadius="8px"
                color="var(--dash-text-muted)" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AssumedBreachView;
