import { useState, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, Textarea, Switch,
  SimpleGrid, IconButton, Spinner, useToast,
} from '@chakra-ui/react';
import { DownloadIcon, InfoIcon, CheckIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

const API   = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ACCENT = '#FC8181';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const PURPLE = '#9F7AEA';
const ORANGE = '#F6AD55';
const YELLOW = '#ECC94B';
const CYAN   = '#76E4F7';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const FileTextIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </Box>
);
const ShieldIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </Box>
);
const TargetIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </Box>
);
const LayersIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </Box>
);
const UnlockIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </Box>
);
const CameraIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </Box>
);
const TrashIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </Box>
);
const ActivityIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </Box>
);
const ServerIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
  </Box>
);
const ZapIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </Box>
);
const EditIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </Box>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon: Icon, delay = 0 }) => (
  <MotionBox
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay }}
    px={4} py={3} borderRadius="12px" bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Flex align="center" gap={2} mb={1}>
      <Flex w="22px" h="22px" borderRadius="6px" bg={`${color}18`} border={`1px solid ${color}30`}
        align="center" justify="center" flexShrink={0}>
        <Icon w="11px" h="11px" color={color} />
      </Flex>
      <Text fontSize="9px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)" textTransform="uppercase">{label}</Text>
    </Flex>
    <Text fontSize="22px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
  </MotionBox>
);

// ── Section toggle card ───────────────────────────────────────────────────────
const SectionCard = ({ cfg, enabled, onChange, count }) => (
  <Flex
    align="center" justify="space-between" gap={3}
    bg="var(--dash-card-bg)" border={`1px solid ${enabled ? cfg.color + '35' : 'var(--dash-card-border)'}`}
    borderRadius="10px" px={4} py={3} pos="relative" overflow="hidden"
    style={{ transition: 'border-color 0.15s' }}>
    {enabled && (
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${cfg.color}70, transparent)` }} />
    )}
    <Flex align="center" gap={3} flex={1} minW={0}>
      <Flex w="32px" h="32px" borderRadius="9px" flexShrink={0}
        bg={enabled ? `${cfg.color}18` : 'rgba(255,255,255,0.04)'}
        border={`1px solid ${enabled ? cfg.color + '35' : 'rgba(255,255,255,0.08)'}`}
        align="center" justify="center" style={{ transition: 'all 0.15s' }}>
        <cfg.Icon w="14px" h="14px" color={enabled ? cfg.color : 'var(--dash-text-muted)'} />
      </Flex>
      <Box minW={0}>
        <Flex align="center" gap={2}>
          <Text fontSize="12px" fontWeight="semibold" color={enabled ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)'}
            style={{ transition: 'color 0.15s' }}>{cfg.label}</Text>
          {count != null && count > 0 && (
            <Box px="6px" py="1px" borderRadius="20px" bg={`${cfg.color}18`} border={`1px solid ${cfg.color}30`}>
              <Text fontSize="9px" fontWeight="bold" color={cfg.color}>{count}</Text>
            </Box>
          )}
        </Flex>
        <Text fontSize="10px" color="var(--dash-text-muted)" noOfLines={1}>{cfg.desc}</Text>
      </Box>
    </Flex>
    <Switch isChecked={enabled} onChange={(e) => onChange(e.target.checked)}
      colorScheme="red" size="sm" flexShrink={0} />
  </Flex>
);

// ── Outline entry ─────────────────────────────────────────────────────────────
const OutlineEntry = ({ cfg, num, count }) => (
  <MotionBox
    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.18 }}
    display="flex" alignItems="center" gap={3} py={2.5}
    borderBottom="1px solid rgba(255,255,255,0.04)" _last={{ borderBottom: 'none' }}>
    <Text fontSize="10px" fontFamily="mono" color="rgba(255,255,255,0.2)" w="18px" textAlign="right" flexShrink={0}>{num}</Text>
    <Flex w="24px" h="24px" borderRadius="7px" bg={`${cfg.color}18`} border={`1px solid ${cfg.color}30`}
      align="center" justify="center" flexShrink={0}>
      <cfg.Icon w="11px" h="11px" color={cfg.color} />
    </Flex>
    <Text fontSize="12px" color="var(--dash-text-secondary)" flex={1}>{cfg.label}</Text>
    {count != null && count > 0 && (
      <Text fontSize="10px" fontFamily="mono" color="var(--dash-text-muted)">{count} item{count !== 1 ? 's' : ''}</Text>
    )}
  </MotionBox>
);

// ── Extra SVG icons ───────────────────────────────────────────────────────────
const UserIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </Box>
);
const LockIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </Box>
);
const QrIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    <line x1="14" y1="14" x2="14" y2="14.01"/><line x1="17" y1="14" x2="17" y2="14.01"/><line x1="20" y1="14" x2="20" y2="14.01"/>
    <line x1="14" y1="17" x2="14" y2="17.01"/><line x1="17" y1="17" x2="20" y2="17"/><line x1="20" y1="20" x2="14" y2="20"/>
  </Box>
);
const GlobeIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </Box>
);
const ClipboardIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </Box>
);
const FolderIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </Box>
);
const SearchIcon2 = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </Box>
);
const MailIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </Box>
);

// ── Section configs ───────────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'execSummary',   label: 'Executive Summary',      desc: 'Custom written executive summary',               color: ACCENT,  Icon: EditIcon      },
  { key: 'overview',      label: 'Engagement Overview',    desc: 'Scope, dates, type, status, notes',              color: BLUE,    Icon: TargetIcon    },
  { key: 'findings',      label: 'Findings',               desc: 'All findings with severity and remediation',     color: ACCENT,  Icon: ShieldIcon    },
  { key: 'ttps',          label: 'TTPs Used',              desc: 'Tactics, techniques & procedures logged',        color: PURPLE,  Icon: LayersIcon    },
  { key: 'assumedBreach', label: 'Assumed Breach',         desc: 'All scenarios with step-by-step breakdown',     color: ORANGE,  Icon: ZapIcon       },
  { key: 'loot',          label: 'Loot & Credentials',     desc: 'Captured credentials, hashes, configs',         color: GREEN,   Icon: UnlockIcon    },
  { key: 'evidence',      label: 'Evidence Vault',         desc: 'Evidence items with content and tags',          color: BLUE,    Icon: CameraIcon    },
  { key: 'cleanup',       label: 'Cleanup Status',         desc: 'Artifact removal tracking and status',          color: YELLOW,  Icon: TrashIcon     },
  { key: 'c2',            label: 'C2 Infrastructure',      desc: 'Deployed C2 servers and configurations',        color: CYAN,    Icon: ServerIcon    },
  { key: 'phishing',      label: 'Phishing Infrastructure',desc: 'Config, email templates, web templates',        color: ORANGE,  Icon: MailIcon      },
  { key: 'personas',      label: 'Sock Puppet Personas',   desc: 'All persona profiles and identities',           color: BLUE,    Icon: UserIcon      },
  { key: 'vault',         label: 'Team Vault',             desc: 'Stored credentials and secrets (no passwords)', color: GREEN,   Icon: LockIcon      },
  { key: 'qrCodes',       label: 'QR Codes',               desc: 'Generated QR codes with scan analytics',        color: YELLOW,  Icon: QrIcon        },
  { key: 'subdomains',    label: 'Subdomain Scans',        desc: 'Discovered subdomains from recon scans',        color: CYAN,    Icon: GlobeIcon     },
  { key: 'ttxPlanner',    label: 'TTX Planner',            desc: 'Tabletop exercise phases and status',           color: PURPLE,  Icon: ClipboardIcon },
  { key: 'skillRequests', label: 'Skill Requests',         desc: 'Team skill gaps and learning requests',         color: BLUE,    Icon: ActivityIcon  },
  { key: 'documents',     label: 'Documents',              desc: 'Official, created, and pillaged documents',     color: BLUE,    Icon: FolderIcon    },
  { key: 'fileMeta',      label: 'File Metadata',          desc: 'Analyzed files with extracted metadata',        color: PURPLE,  Icon: SearchIcon2   },
  { key: 'leakxScans',    label: 'Credential Leaks',       desc: 'LeakX / IntelX email leak scan results',        color: ACCENT,  Icon: SearchIcon2   },
  { key: 'activityLog',   label: 'Activity Log',           desc: 'Chronological engagement event timeline',       color: BLUE,    Icon: ActivityIcon  },
];

const DEFAULT_ENABLED = {
  execSummary: true, overview: true, findings: true, ttps: true, assumedBreach: true,
  loot: true, evidence: true, cleanup: true, c2: false, phishing: false,
  personas: false, vault: false, qrCodes: false, subdomains: true,
  ttxPlanner: false, skillRequests: false, documents: false, fileMeta: false,
  leakxScans: false, activityLog: false,
};

// ── Main view ─────────────────────────────────────────────────────────────────
const ReportsView = () => {
  const { slug }                        = useParams();
  const { getBySlug }                   = useEngagements();
  const toast                           = useToast();
  const eng                             = getBySlug(slug);

  const [enabled,     setEnabled]     = useState(DEFAULT_ENABLED);
  const [execSummary, setExecSummary] = useState('');
  const [generating,  setGenerating]  = useState(false);
  const [done,        setDone]        = useState(false);

  const counts = {
    findings:      eng?.findings?.length || 0,
    ttps:          eng?.ttps?.length || 0,
    assumedBreach: eng?.assumedBreachScenarios?.length || 0,
    loot:          eng?.loot?.length || 0,
    evidence:      eng?.evidence?.length || 0,
    cleanup:       eng?.cleanup?.length || 0,
    c2:            eng?.c2Deployments?.length || 0,
    phishing:      (eng?.phishingEmailTemplates?.length || 0) + (eng?.phishingWebTemplates?.length || 0),
    personas:      eng?.personas?.length || 0,
    vault:         eng?.vault?.length || 0,
    qrCodes:       eng?.qrCodes?.length || 0,
    subdomains:    eng?.subdomainScans?.length || 0,
    ttxPlanner:    eng?.ttxPhases?.length || 0,
    skillRequests: eng?.skillRequests?.length || 0,
    documents:     eng?.documents?.length || 0,
    fileMeta:      eng?.fileMetaEntries?.length || 0,
    leakxScans:    eng?.leakxScans?.length || 0,
    activityLog:   eng?.activityLog?.length || 0,
  };

  const toggle = (key, val) => { setEnabled(p => ({ ...p, [key]: val })); setDone(false); };

  const activeCount = Object.values(enabled).filter(Boolean).length;
  const outlined    = SECTIONS.filter(s => enabled[s.key]);

  const generate = useCallback(async () => {
    if (!eng) return;
    setGenerating(true);
    setDone(false);
    try {
      const res = await fetch(`${API}/api/reports/${eng._id}/generate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ sections: enabled, execSummaryText: execSummary }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Generation failed');
      }
      const blob    = await res.blob();
      const url     = URL.createObjectURL(blob);
      const a       = document.createElement('a');
      a.href        = url;
      a.download    = `report_${(eng.name || 'engagement').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      toast({ title: 'Report downloaded', status: 'success', duration: 2500 });
    } catch (e) {
      toast({ title: 'Generation failed', description: e.message, status: 'error', duration: 4000 });
    } finally {
      setGenerating(false);
    }
  }, [eng, enabled, execSummary, toast]);

  if (!eng) return null;

  return (
    <Box px={6} pb={12}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Engagement <Text as="span" color="red.400">Report</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · generate a complete DOCX report from all engagement data
          </Text>
        </Box>
        <Button
          size="sm" borderRadius="9px" fontWeight="bold"
          leftIcon={generating ? <Spinner size="xs" /> : done ? <CheckIcon boxSize={3} /> : <DownloadIcon boxSize={3} />}
          bg={done ? `${GREEN}18` : `${ACCENT}18`}
          border={`1px solid ${done ? GREEN + '40' : ACCENT + '40'}`}
          color={done ? GREEN : ACCENT}
          _hover={{ bg: done ? `${GREEN}28` : `${ACCENT}28`, transform: 'translateY(-1px)' }}
          _active={{ transform: 'translateY(0)' }}
          transition="all 0.15s"
          isLoading={generating}
          loadingText="Generating..."
          onClick={generate}>
          {done ? 'Downloaded' : 'Generate Report'}
        </Button>
      </Flex>

      {/* ── Info banner ────────────────────────────────────────────────────── */}
      <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        mb={5} px={4} py={3} borderRadius="10px"
        bg={`${BLUE}0d`} border={`1px solid ${BLUE}30`}>
        <Flex align="center" gap={2} mb={2}>
          <InfoIcon boxSize={3} color={BLUE} />
          <Text fontSize="10px" fontWeight="bold" color={BLUE} textTransform="uppercase" letterSpacing="wider">
            Dark Theme DOCX Report
          </Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {['Cover page auto-generated with engagement details', 'Toggle each section on or off below', 'Dark theme with red accents — open in Microsoft Word'].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={BLUE} flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </MotionBox>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={5}>
        <StatCard label="Sections Selected" value={activeCount}       color={ACCENT}  icon={FileTextIcon} delay={0}    />
        <StatCard label="Findings"          value={counts.findings}   color={ACCENT}  icon={ShieldIcon}   delay={0.04} />
        <StatCard label="TTPs Logged"       value={counts.ttps}       color={PURPLE}  icon={LayersIcon}   delay={0.08} />
        <StatCard label="Loot Items"        value={counts.loot}       color={GREEN}   icon={UnlockIcon}   delay={0.12} />
      </SimpleGrid>

      {/* ── Two columns ────────────────────────────────────────────────────── */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5}>

        {/* ── Left: config ── */}
        <Flex direction="column" gap={4}>

          {/* Executive summary */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05 }}
            borderRadius="16px" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}90, transparent)` }} />
            <Flex align="center" justify="space-between" px={5} pt={5} pb={3}>
              <Flex align="center" gap={2.5}>
                <Flex w="28px" h="28px" borderRadius="8px" bg={`${ACCENT}18`} border={`1px solid ${ACCENT}35`}
                  align="center" justify="center" flexShrink={0}>
                  <EditIcon w="13px" h="13px" color={ACCENT} />
                </Flex>
                <Box>
                  <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">Executive Summary</Text>
                  <Text fontSize="10px" color="var(--dash-text-muted)">Written narrative for the report header</Text>
                </Box>
              </Flex>
              <Switch isChecked={enabled.execSummary} onChange={(e) => toggle('execSummary', e.target.checked)}
                colorScheme="red" size="sm" />
            </Flex>
            <Box px={5} pb={5}>
              <Textarea
                value={execSummary}
                onChange={(e) => { setExecSummary(e.target.value); setDone(false); }}
                placeholder="Write an executive summary that will appear at the top of the report. Describe the engagement scope, key findings, business impact, and overall risk posture..."
                rows={6} resize="none"
                isDisabled={!enabled.execSummary}
                bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
                borderRadius="10px" fontSize="13px" color="var(--dash-text-primary)"
                _placeholder={{ color: 'var(--dash-text-muted)' }}
                _hover={{ borderColor: `${ACCENT}50` }}
                _focus={{ borderColor: `${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` }}
                _disabled={{ opacity: 0.35, cursor: 'not-allowed' }}
                transition="all 0.15s"
              />
              <Text fontSize="10px" color="var(--dash-text-muted)" mt={1.5} textAlign="right">
                {execSummary.length} chars
              </Text>
            </Box>
          </MotionBox>

          {/* Sections */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.1 }}
            borderRadius="16px" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${BLUE}90, transparent)` }} />
            <Flex align="center" justify="space-between" px={5} pt={5} pb={4}>
              <Flex align="center" gap={2.5}>
                <Flex w="28px" h="28px" borderRadius="8px" bg={`${BLUE}18`} border={`1px solid ${BLUE}35`}
                  align="center" justify="center" flexShrink={0}>
                  <LayersIcon w="13px" h="13px" color={BLUE} />
                </Flex>
                <Box>
                  <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">Report Sections</Text>
                  <Text fontSize="10px" color="var(--dash-text-muted)">Toggle which sections to include — cover page always included</Text>
                </Box>
              </Flex>
              <Box px="8px" py="2px" borderRadius="20px" bg={`${BLUE}18`} border={`1px solid ${BLUE}30`}>
                <Text fontSize="9px" fontWeight="bold" color={BLUE}>{activeCount} on</Text>
              </Box>
            </Flex>
            <Flex direction="column" gap={2} px={5} pb={5}>
              {SECTIONS.map(cfg => (
                <SectionCard
                  key={cfg.key}
                  cfg={cfg}
                  enabled={enabled[cfg.key]}
                  onChange={(v) => toggle(cfg.key, v)}
                  count={counts[cfg.key]}
                />
              ))}
            </Flex>
          </MotionBox>
        </Flex>

        {/* ── Right: outline + generate ── */}
        <Flex direction="column" gap={4}>

          {/* Cover page always-included card */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.08 }}
            borderRadius="16px" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}90, transparent)` }} />
            <Box px={5} pt={5} pb={4}>
              <Flex align="center" gap={2.5} mb={3}>
                <Flex w="28px" h="28px" borderRadius="8px" bg={`${ACCENT}18`} border={`1px solid ${ACCENT}35`}
                  align="center" justify="center">
                  <FileTextIcon w="13px" h="13px" color={ACCENT} />
                </Flex>
                <Box>
                  <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">Cover Page</Text>
                  <Text fontSize="10px" color="var(--dash-text-muted)">Always included — auto-generated from engagement data</Text>
                </Box>
              </Flex>
              <SimpleGrid columns={2} gap={2}>
                {[
                  { label: 'Engagement Name', value: eng.name },
                  { label: 'Company',         value: eng.company },
                  { label: 'Type',            value: eng.type || '—' },
                  { label: 'Status',          value: eng.status || '—' },
                  { label: 'Start Date',      value: eng.startDate || '—' },
                  { label: 'End Date',        value: eng.endDate || '—' },
                ].map(({ label, value }) => (
                  <Box key={label} bg="rgba(255,255,255,0.03)" borderRadius="8px" px={3} py={2}
                    border="1px solid rgba(255,255,255,0.06)">
                    <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wide" mb={0.5}>{label}</Text>
                    <Text fontSize="11px" fontWeight="semibold" color="var(--dash-text-primary)" noOfLines={1}>{value}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </MotionBox>

          {/* Document outline */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.12 }}
            borderRadius="16px" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            pos="relative" overflow="hidden" flex={1}>
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${GREEN}90, transparent)` }} />
            <Flex align="center" justify="space-between" px={5} pt={5} pb={3}>
              <Box>
                <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">Document Outline</Text>
                <Text fontSize="10px" color="var(--dash-text-muted)">Sections that will appear in the report</Text>
              </Box>
              <Box px="8px" py="2px" borderRadius="20px" bg={`${GREEN}18`} border={`1px solid ${GREEN}30`}>
                <Text fontSize="9px" fontWeight="bold" color={GREEN}>{outlined.length + 1} pages</Text>
              </Box>
            </Flex>
            <Box px={5} pb={5}>
              {/* Cover always first */}
              <Flex align="center" gap={3} py={2.5} borderBottom="1px solid rgba(255,255,255,0.04)">
                <Text fontSize="10px" fontFamily="mono" color="rgba(255,255,255,0.2)" w="18px" textAlign="right" flexShrink={0}>1</Text>
                <Flex w="24px" h="24px" borderRadius="7px" bg={`${ACCENT}18`} border={`1px solid ${ACCENT}30`}
                  align="center" justify="center" flexShrink={0}>
                  <FileTextIcon w="11px" h="11px" color={ACCENT} />
                </Flex>
                <Text fontSize="12px" color="var(--dash-text-secondary)" flex={1}>Cover Page</Text>
                <Text fontSize="10px" color="var(--dash-text-muted)">auto</Text>
              </Flex>

              <AnimatePresence>
                {outlined.map((cfg, i) => (
                  <OutlineEntry key={cfg.key} cfg={cfg} num={i + 2} count={counts[cfg.key]} />
                ))}
              </AnimatePresence>

              {outlined.length === 0 && (
                <Flex align="center" justify="center" py={8}>
                  <Text fontSize="12px" color="var(--dash-text-muted)">Enable sections on the left to add them to the report</Text>
                </Flex>
              )}
            </Box>
          </MotionBox>

          {/* Generate button card */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.16 }}
            borderRadius="16px" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            pos="relative" overflow="hidden">
            <Box px={5} py={5}>
              <Flex align="center" gap={3} mb={4}>
                <Box flex={1}>
                  <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>Ready to generate</Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)">
                    {activeCount + 1} section{activeCount !== 0 ? 's' : ''} · dark theme DOCX · Microsoft Word compatible
                  </Text>
                </Box>
              </Flex>
              <Button
                w="full" size="md" borderRadius="10px" fontWeight="bold"
                leftIcon={generating ? <Spinner size="xs" /> : done ? <CheckIcon boxSize={3.5} /> : <DownloadIcon boxSize={3.5} />}
                bg={done ? `${GREEN}18` : `${ACCENT}18`}
                border={`1px solid ${done ? GREEN + '40' : ACCENT + '40'}`}
                color={done ? GREEN : ACCENT}
                _hover={{ bg: done ? `${GREEN}28` : `${ACCENT}28`, transform: 'translateY(-1px)' }}
                _active={{ transform: 'translateY(0)' }}
                transition="all 0.15s"
                isLoading={generating}
                loadingText="Building report..."
                onClick={generate}>
                {done ? 'Report Downloaded' : 'Generate & Download DOCX'}
              </Button>
              <Text fontSize="10px" color="var(--dash-text-muted)" textAlign="center" mt={2}>
                Dark theme · Cover page + {activeCount} section{activeCount !== 1 ? 's' : ''} · For authorized use only
              </Text>
            </Box>
          </MotionBox>
        </Flex>
      </SimpleGrid>
    </Box>
  );
};

export default ReportsView;
