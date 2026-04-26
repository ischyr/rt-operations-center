import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box, Flex, Text, Input, Spinner, Kbd,
  Modal, ModalOverlay, ModalContent,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchIcon, ViewIcon, RepeatIcon, TimeIcon, ArrowForwardIcon,
  EditIcon, StarIcon, LockIcon, ExternalLinkIcon, WarningTwoIcon,
  CopyIcon, ChatIcon, EmailIcon, AttachmentIcon, SettingsIcon,
  ChevronRightIcon, AddIcon,
} from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEngagements } from '../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Theme ──────────────────────────────────────────────────────────────────────
const ACCENT = '#76E4F7';                  // soft cyan = "find / search"
const A_S    = 'rgba(118,228,247,0.08)';
const A_B    = 'rgba(118,228,247,0.32)';
const MUTED  = 'var(--dash-text-muted)';
const CARD_BD= 'var(--dash-card-border)';

// ── Per-kind icon + color ─────────────────────────────────────────────────────
const KIND_VISUAL = {
  nav:        { icon: ChevronRightIcon, color: ACCENT  },
  engagement: { icon: WarningTwoIcon,   color: '#FC8181' },
  task:       { icon: EditIcon,         color: '#818CF8' },
  session:    { icon: TimeIcon,         color: '#4FD1C5' },
  relay:      { icon: ArrowForwardIcon, color: '#B794F4' },
  leak:       { icon: LockIcon,         color: '#ECC94B' },
  finding:    { icon: WarningTwoIcon,   color: '#F6AD55' },
};

const NAV_ICON = {
  overview: ViewIcon, log: RepeatIcon, time: TimeIcon, arrow: ArrowForwardIcon,
  edit: EditIcon, star: StarIcon, lock: LockIcon, search: SearchIcon,
  globe: ExternalLinkIcon, finding: WarningTwoIcon, report: CopyIcon,
  chat: ChatIcon, warning: WarningTwoIcon, email: EmailIcon,
  attach: AttachmentIcon, settings: SettingsIcon, add: AddIcon,
};

// Slugs that are global (not engagements)
const RESERVED_SLUGS = new Set([
  '', 'engagements', 'settings', 'cheatsheet', 'lab',
  'resources', 'malware', 'diagrams', 'cloning',
]);

const tok = () => localStorage.getItem('token') || '';

// ── Component ─────────────────────────────────────────────────────────────────
const CommandPalette = () => {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [serverResults, setServerResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const listRef  = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { engagements, getBySlug } = useEngagements();

  // ── Detect current engagement from URL ──────────────────────────────────────
  const slugMatch = location.pathname.match(/^\/dashboard\/([^/]+)/);
  const slug = slugMatch?.[1] || '';
  const isInEngagement = !!slug && !RESERVED_SLUGS.has(slug);
  const eng = isInEngagement ? getBySlug(slug) : null;

  // ── ⌘K / Ctrl+K listener ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const k = (e.key || '').toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus / reset on open/close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery(''); setSelectedIdx(0); setServerResults([]);
    }
  }, [isOpen]);

  // Reset selection when query/results change
  useEffect(() => { setSelectedIdx(0); }, [query, serverResults.length]);

  // ── Backend search (debounced) ──────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 2 || !eng?._id) { setServerResults([]); return; }

    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&engagementId=${eng._id}`,
          { headers: { Authorization: `Bearer ${tok()}` } }
        );
        if (r.ok) {
          const data = await r.json();
          setServerResults(data.results || []);
        }
      } catch (_) {} finally { setLoading(false); }
    }, 180);
    return () => clearTimeout(t);
  }, [query, eng?._id]);

  // ── Static nav commands ─────────────────────────────────────────────────────
  const navCommands = useMemo(() => {
    const cmds = [];
    if (isInEngagement && eng) {
      cmds.push(
        { icon: 'overview', label: 'Engagement Overview',     route: `/dashboard/${slug}` },
        { icon: 'log',      label: 'Activity Log',             route: `/dashboard/${slug}/operations/activity` },
        { icon: 'star',     label: 'Skill Requests',           route: `/dashboard/${slug}/operations/skill-requests` },
        { icon: 'edit',     label: 'TTX Planner',              route: `/dashboard/${slug}/operations/ttx` },
        { icon: 'lock',     label: 'Team Vault',               route: `/dashboard/${slug}/operations/team-vault` },
        { icon: 'time',     label: 'Operator Sessions',        route: `/dashboard/${slug}/operations/sessions` },
        { icon: 'arrow',    label: 'Attack Relay Board',       route: `/dashboard/${slug}/operations/attack-relay` },
        { icon: 'star',     label: 'Engagement Bingo',         route: `/dashboard/${slug}/operations/bingo` },
        { icon: 'edit',     label: 'Tasks Planner',            route: `/dashboard/${slug}/operations/tasks` },
        { icon: 'lock',     label: 'Leaks & Credentials',      route: `/dashboard/${slug}/pillaging/credentials` },
        { icon: 'globe',    label: 'Domain Recon',             route: `/dashboard/${slug}/pillaging/domain-recon` },
        { icon: 'search',   label: 'Subdomains',               route: `/dashboard/${slug}/pillaging/subdomains` },
        { icon: 'search',   label: 'Network Scanning',         route: `/dashboard/${slug}/pillaging/services` },
        { icon: 'search',   label: 'Webserver Enumeration',    route: `/dashboard/${slug}/pillaging/webserver-enum` },
        { icon: 'globe',    label: 'Domain Flyover',           route: `/dashboard/${slug}/pillaging/domain-flyover` },
        { icon: 'lock',     label: 'Kerberos Tickets',         route: `/dashboard/${slug}/pillaging/kerberos` },
        { icon: 'attach',   label: 'Documents',                route: `/dashboard/${slug}/pillaging/documents` },
        { icon: 'search',   label: 'File Metadata',            route: `/dashboard/${slug}/pillaging/file-meta` },
        { icon: 'search',   label: 'BloodHound Analyzer',      route: `/dashboard/${slug}/bloodhound/analyzer` },
        { icon: 'attach',   label: 'Cypher Library',           route: `/dashboard/${slug}/bloodhound/cypher-library` },
        { icon: 'arrow',    label: 'C2 Infrastructure',        route: `/dashboard/${slug}/intelligence/c2` },
        { icon: 'email',    label: 'Phishing Infrastructure',  route: `/dashboard/${slug}/intelligence/phishing` },
        { icon: 'globe',    label: 'Device Code Phishing',     route: `/dashboard/${slug}/intelligence/device-code-phishing` },
        { icon: 'attach',   label: 'Pass-the-Cookie',          route: `/dashboard/${slug}/intelligence/pass-cookie` },
        { icon: 'lock',     label: 'Evil OAuth',               route: `/dashboard/${slug}/intelligence/evil-oauth` },
        { icon: 'warning',  label: 'MFA Push Fatigue',         route: `/dashboard/${slug}/intelligence/mfa-push` },
        { icon: 'finding',  label: 'CVE Research Board',       route: `/dashboard/${slug}/intelligence/cve-research` },
        { icon: 'arrow',    label: 'Reverse Shells',           route: `/dashboard/${slug}/intelligence/reverse-shells` },
        { icon: 'lock',     label: 'Loot Tracker',             route: `/dashboard/${slug}/intelligence/loot-tracker` },
        { icon: 'lock',     label: 'Evidence Vault',           route: `/dashboard/${slug}/intelligence/evidence-vault` },
        { icon: 'log',      label: 'Cleanup Tracker',          route: `/dashboard/${slug}/intelligence/cleanup-tracker` },
        { icon: 'email',    label: 'Emails Harvester',         route: `/dashboard/${slug}/osint/emails` },
        { icon: 'attach',   label: 'Org Chart Mapper',         route: `/dashboard/${slug}/osint/org-chart` },
        { icon: 'chat',     label: 'White Team Comms',         route: `/dashboard/${slug}/comms/white-team` },
        { icon: 'arrow',    label: 'Webhook Alerter',          route: `/dashboard/${slug}/comms/webhook-alerter` },
        { icon: 'finding',  label: 'Findings',                 route: `/dashboard/${slug}/reporting/findings` },
        { icon: 'report',   label: 'Reports',                  route: `/dashboard/${slug}/reporting/reports` },
        { icon: 'globe',    label: 'Client Portal',            route: `/dashboard/${slug}/reporting/client-portal` },
      );
    }
    cmds.push(
      { icon: 'overview', label: 'Dashboard',           route: '/dashboard' },
      { icon: 'warning',  label: 'Engagements',         route: '/dashboard/engagements' },
      { icon: 'star',     label: 'Tools',               route: '/dashboard/resources/tools' },
      { icon: 'warning',  label: 'CVE Feed',            route: '/dashboard/resources/cve-feed' },
      { icon: 'lock',     label: 'Ransom Feed',         route: '/dashboard/resources/ransom-feed' },
      { icon: 'email',    label: 'Email Leaks',         route: '/dashboard/resources/email-leaks' },
      { icon: 'search',   label: 'LOLBIN / LOLBAS',     route: '/dashboard/resources/lolbins' },
      { icon: 'search',   label: 'Google Dorking',      route: '/dashboard/resources/google-dorking' },
      { icon: 'star',     label: 'Red Team Ops Map',    route: '/dashboard/cheatsheet/red-team-map' },
      { icon: 'lock',     label: 'AD Attack Map',       route: '/dashboard/cheatsheet/ad-map' },
      { icon: 'attach',   label: 'Payload & Evasion Map', route: '/dashboard/cheatsheet/payload-map' },
      { icon: 'settings', label: 'Lab Configs',         route: '/dashboard/lab/configs' },
      { icon: 'arrow',    label: 'Lab Connectivity',    route: '/dashboard/lab/connectivity' },
      { icon: 'attach',   label: 'Voice Cloner',        route: '/dashboard/cloning/voice-cloner' },
      { icon: 'search',   label: 'Malware Scanner',     route: '/dashboard/malware/scanner' },
      { icon: 'edit',     label: 'Diagram Editor',      route: '/dashboard/diagrams/editor' },
      { icon: 'attach',   label: 'My Diagrams',         route: '/dashboard/diagrams/library' },
      { icon: 'settings', label: 'Settings',            route: '/dashboard/settings' },
    );
    return cmds.map(c => ({ kind: 'nav', ...c }));
  }, [isInEngagement, eng, slug]);

  // Engagement-switch commands
  const engagementCommands = useMemo(() => engagements.map(e => ({
    kind: 'engagement', id: e.id,
    label: e.name, sublabel: e.company,
    route: `/dashboard/${e.slug}`,
  })), [engagements]);

  // ── Filter + assemble sections ──────────────────────────────────────────────
  const q = query.trim().toLowerCase();
  const filteredNav = navCommands.filter(c => !q || c.label.toLowerCase().includes(q));
  const filteredEng = engagementCommands.filter(c =>
    !q || c.label.toLowerCase().includes(q) ||
    (c.sublabel || '').toLowerCase().includes(q));

  const sections = [];
  if (filteredNav.length) {
    sections.push({
      key: 'nav',
      title: q ? 'Pages' : 'Navigate',
      items: filteredNav.slice(0, q ? 12 : 8),
    });
  }
  if (filteredEng.length) {
    sections.push({
      key: 'engagement',
      title: 'Engagements',
      items: filteredEng.slice(0, 8),
    });
  }
  if (q && q.length >= 2 && eng?._id) {
    const KIND_META = {
      task:    { title: 'Tasks',         routePath: 'operations/tasks' },
      session: { title: 'Operator Sessions', routePath: 'operations/sessions' },
      relay:   { title: 'Attack Relay',  routePath: 'operations/attack-relay' },
      leak:    { title: 'Leaks & Creds', routePath: 'pillaging/credentials' },
      finding: { title: 'Findings',      routePath: 'reporting/findings' },
    };
    const groups = {};
    serverResults.forEach(r => {
      (groups[r.kind] = groups[r.kind] || []).push(r);
    });
    Object.entries(groups).forEach(([kind, items]) => {
      const meta = KIND_META[kind]; if (!meta) return;
      sections.push({
        key: kind, title: meta.title,
        items: items.map(it => ({
          kind, label: it.title, sublabel: it.subtitle,
          route: `/dashboard/${slug}/${meta.routePath}`,
        })),
      });
    });
  }

  const flat = sections.flatMap(s => s.items);

  // Keyboard navigation
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, Math.max(0, flat.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flat[selectedIdx];
      if (item?.route) { navigate(item.route); setOpen(false); }
    }
  };

  // Auto-scroll selected into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIdx}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIdx, isOpen]);

  // ── Render ──────────────────────────────────────────────────────────────────
  // Compute global indices as we render
  let runningIdx = 0;

  const handleClickItem = (item) => {
    if (item.route) { navigate(item.route); setOpen(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setOpen(false)} size="lg"
      motionPreset="slideInBottom" autoFocus={false}
      blockScrollOnMount={false}>
      <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0,0,0,0.55)" />
      <ModalContent
        bg="rgba(20,24,31,0.96)"
        border={`1px solid ${CARD_BD}`}
        borderRadius="14px"
        mx={4} mt={['8vh', '12vh', '14vh']}
        overflow="hidden"
        boxShadow="0 25px 60px rgba(0,0,0,0.55)"
      >
        {/* Top accent bar */}
        <Box pos="absolute" top={0} left={0} right={0} h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />

        {/* Search input */}
        <Flex align="center" gap={3} px={5} py={3.5}
          borderBottom={`1px solid ${CARD_BD}`}>
          <SearchIcon boxSize={4} color={ACCENT} />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isInEngagement
              ? `Search ${eng?.name || 'engagement'} · pages · entities…`
              : 'Search pages, engagements…'}
            variant="unstyled"
            fontSize="15px"
            color="var(--dash-text-primary)"
            _placeholder={{ color: MUTED }}
            flex={1}
          />
          {loading && <Spinner size="sm" color={ACCENT} thickness="2px" />}
          <Flex align="center" gap={1} pl={2}>
            <Kbd fontSize="9px" bg="rgba(255,255,255,0.06)"
              borderColor="rgba(255,255,255,0.12)" color={MUTED}>⌘</Kbd>
            <Kbd fontSize="9px" bg="rgba(255,255,255,0.06)"
              borderColor="rgba(255,255,255,0.12)" color={MUTED}>K</Kbd>
          </Flex>
        </Flex>

        {/* Results */}
        <Box ref={listRef} maxH="60vh" overflowY="auto" py={2}
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.12)', borderRadius: '4px' },
          }}>
          {flat.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={12} gap={2} opacity={0.55}>
              <SearchIcon boxSize={5} color={MUTED} />
              <Text fontSize="13px" color="var(--dash-text-secondary)" fontWeight="semibold">
                {q ? 'No results' : 'Type to search'}
              </Text>
              <Text fontSize="11px" color={MUTED}>
                {q
                  ? 'Try a host, target, page name, or engagement'
                  : 'Pages · engagements · tasks · sessions · relay cards · leaks'}
              </Text>
            </Flex>
          ) : (
            <AnimatePresence>
              {sections.map(section => (
                <Box key={section.key} mb={1.5}>
                  <Text px={5} pt={2} pb={1}
                    fontSize="9px" fontWeight="black" color={MUTED}
                    textTransform="uppercase" letterSpacing="widest">
                    {section.title}
                  </Text>
                  {section.items.map(item => {
                    const idx = runningIdx++;
                    const sel = idx === selectedIdx;
                    const visual = KIND_VISUAL[item.kind] || KIND_VISUAL.nav;
                    const Icon = item.kind === 'nav' && item.icon
                      ? (NAV_ICON[item.icon] || ChevronRightIcon)
                      : visual.icon;
                    const tint = visual.color;
                    return (
                      <MotionBox
                        key={`${section.key}-${idx}`}
                        data-idx={idx}
                        layout
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.14 }}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        onClick={() => handleClickItem(item)}
                        cursor="pointer"
                        mx={2}
                        my="2px"
                        px={3} py="9px"
                        borderRadius="9px"
                        bg={sel ? A_S : 'transparent'}
                        borderLeft={sel ? `2px solid ${ACCENT}` : '2px solid transparent'}
                        transition="all 0.12s">
                        <Flex align="center" gap={3}>
                          {/* Icon */}
                          <Flex w="28px" h="28px" borderRadius="7px" flexShrink={0}
                            bg={`${tint}12`} border={`1px solid ${tint}28`}
                            align="center" justify="center">
                            <Icon boxSize={3.5} color={tint} />
                          </Flex>

                          {/* Label + sublabel */}
                          <Box flex={1} minW={0}>
                            <Text fontSize="13px" fontWeight={sel ? 'semibold' : 'medium'}
                              color={sel ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)'}
                              noOfLines={1}>
                              {item.label}
                            </Text>
                            {item.sublabel && (
                              <Text fontSize="10px" color={MUTED} noOfLines={1} mt="1px">
                                {item.sublabel}
                              </Text>
                            )}
                          </Box>

                          {/* Right caret on selected */}
                          {sel && (
                            <Flex align="center" gap={1} flexShrink={0} pl={2}>
                              <Text fontSize="9px" color={ACCENT} fontWeight="bold"
                                textTransform="uppercase" letterSpacing="wider">
                                {item.kind === 'engagement' ? 'switch' :
                                 item.kind === 'nav'        ? 'open'   : 'view'}
                              </Text>
                              <ChevronRightIcon boxSize={3} color={ACCENT} />
                            </Flex>
                          )}
                        </Flex>
                      </MotionBox>
                    );
                  })}
                </Box>
              ))}
            </AnimatePresence>
          )}
        </Box>

        {/* Footer hint bar */}
        <Flex align="center" justify="space-between" px={5} py={2.5}
          borderTop={`1px solid ${CARD_BD}`} bg="rgba(255,255,255,0.012)">
          <Flex align="center" gap={3} fontSize="10px" color={MUTED}>
            <Flex align="center" gap={1}>
              <Kbd fontSize="9px" bg="rgba(255,255,255,0.06)"
                borderColor="rgba(255,255,255,0.12)" color={MUTED}>↑</Kbd>
              <Kbd fontSize="9px" bg="rgba(255,255,255,0.06)"
                borderColor="rgba(255,255,255,0.12)" color={MUTED}>↓</Kbd>
              <Text>navigate</Text>
            </Flex>
            <Flex align="center" gap={1}>
              <Kbd fontSize="9px" bg="rgba(255,255,255,0.06)"
                borderColor="rgba(255,255,255,0.12)" color={MUTED}>↵</Kbd>
              <Text>open</Text>
            </Flex>
            <Flex align="center" gap={1}>
              <Kbd fontSize="9px" bg="rgba(255,255,255,0.06)"
                borderColor="rgba(255,255,255,0.12)" color={MUTED}>esc</Kbd>
              <Text>close</Text>
            </Flex>
          </Flex>
          {isInEngagement && eng && (
            <Flex align="center" gap={1.5}>
              <Box w="6px" h="6px" borderRadius="full" bg="red.500"
                boxShadow="0 0 6px rgba(255,55,55,0.7)" />
              <Text fontSize="10px" color={MUTED} noOfLines={1}>
                {eng.name}
              </Text>
            </Flex>
          )}
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default CommandPalette;
