import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select,
  Textarea, SimpleGrid, Spinner, Tooltip, Progress,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, EditIcon, CopyIcon, CheckIcon, CloseIcon,
  SearchIcon, StarIcon, ViewIcon, ExternalLinkIcon, InfoIcon,
  SettingsIcon, DownloadIcon, RepeatIcon, LockIcon,
  ChevronDownIcon, ChevronUpIcon, TimeIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';
import QRCode from 'qrcode';

const MotionBox = motion(Box);

// ── Constants ────────────────────────────────────────────────────────────────

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const ACCENT = '#9F7AEA';
const RED    = '#FC8181';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const ORANGE = '#F6AD55';
const YELLOW = '#ECC94B';
const CYAN   = '#76E4F7';
const PINK   = '#F687B3';

const TEMPLATES = [
  { key: 'url',      label: 'URL',         icon: ExternalLinkIcon, color: BLUE },
  { key: 'wifi',     label: 'Wi-Fi',       icon: SettingsIcon,     color: CYAN },
  { key: 'vcard',    label: 'vCard',       icon: ViewIcon,         color: GREEN },
  { key: 'email',    label: 'Email',       icon: EditIcon,         color: ORANGE },
  { key: 'sms',      label: 'SMS',         icon: InfoIcon,         color: PINK },
  { key: 'text',     label: 'Plain Text',  icon: CopyIcon,        color: ACCENT },
  { key: 'phishing', label: 'Phishing',    icon: LockIcon,         color: RED },
];

const OS_COLORS = {
  'iOS':     { color: '#A0AEC0', bg: 'rgba(160,174,192,0.12)' },
  'Android': { color: GREEN,     bg: 'rgba(104,211,145,0.12)' },
  'Windows': { color: BLUE,      bg: 'rgba(99,179,237,0.12)' },
  'macOS':   { color: ACCENT,    bg: 'rgba(159,122,234,0.12)' },
  'Linux':   { color: ORANGE,    bg: 'rgba(246,173,85,0.12)' },
  'Unknown': { color: '#718096', bg: 'rgba(113,128,150,0.12)' },
};

const BROWSER_COLORS = {
  'Chrome':  BLUE,
  'Safari':  CYAN,
  'Firefox': ORANGE,
  'Edge':    GREEN,
  'Opera':   RED,
  'Unknown': '#718096',
};

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const fmtRelative = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ── Input styles ─────────────────────────────────────────────────────────────

const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT}50` },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

const selSx = {
  bg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px', h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  cursor: 'pointer', focusBorderColor: `${ACCENT}80`,
  _hover: { borderColor: `${ACCENT}50` },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

// ── QR code content builder ─────────────────────────────────────────────────

const buildQRContent = (template, payload, trackUrl) => {
  if (trackUrl) return trackUrl;
  switch (template) {
    case 'url':
      return payload.url || '';
    case 'wifi':
      return `WIFI:T:${payload.encryption || 'WPA'};S:${payload.ssid || ''};P:${payload.password || ''};H:${payload.hidden ? 'true' : 'false'};;`;
    case 'vcard':
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${payload.name || ''}\nTEL:${payload.phone || ''}\nEMAIL:${payload.email || ''}\nORG:${payload.org || ''}\nURL:${payload.url || ''}\nEND:VCARD`;
    case 'email':
      return `mailto:${payload.email || ''}?subject=${encodeURIComponent(payload.subject || '')}&body=${encodeURIComponent(payload.body || '')}`;
    case 'sms':
      return `smsto:${payload.phone || ''}:${payload.message || ''}`;
    case 'text':
      return payload.text || '';
    case 'phishing':
      return trackUrl || payload.url || '';
    default:
      return payload.url || payload.text || '';
  }
};

// ── Donut chart (SVG) ───────────────────────────────────────────────────────

const DonutChart = ({ data, size = 120, thickness = 18, centerLabel }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <Flex w={`${size}px`} h={`${size}px`} align="center" justify="center" borderRadius="full"
      border="2px solid rgba(255,255,255,0.06)">
      <Text fontSize="11px" color="var(--dash-text-muted)">No data</Text>
    </Flex>
  );
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <Box pos="relative" w={`${size}px`} h={`${size}px`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = circ * pct;
          const gap = circ - dash;
          const rot = offset;
          offset += pct * 360;
          return (
            <circle key={i}
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={d.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={0}
              transform={`rotate(${rot - 90} ${size / 2} ${size / 2})`}
              style={{ transition: 'all 0.5s ease-out' }}
            />
          );
        })}
      </svg>
      {centerLabel !== undefined && (
        <Flex pos="absolute" inset={0} align="center" justify="center">
          <Text fontSize="20px" fontWeight="bold" color="var(--dash-text-primary)">{centerLabel}</Text>
        </Flex>
      )}
    </Box>
  );
};

// ── Mini bar chart (last 14 days) ───────────────────────────────────────────

const ActivityChart = ({ scans }) => {
  const days = useMemo(() => {
    const map = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }
    (scans || []).forEach((s) => {
      const key = new Date(s.createdAt).toISOString().slice(0, 10);
      if (map[key] !== undefined) map[key]++;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [scans]);

  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <Flex align="flex-end" gap="3px" h="80px">
      {days.map((d) => {
        const h = Math.max((d.count / max) * 100, 4);
        return (
          <Tooltip key={d.date} label={`${d.date}: ${d.count} scan${d.count !== 1 ? 's' : ''}`} fontSize="10px">
            <Box flex={1} borderRadius="3px 3px 0 0"
              bg={d.count > 0 ? ACCENT : 'rgba(255,255,255,0.06)'}
              opacity={d.count > 0 ? 1 : 0.4}
              style={{ height: `${h}%`, transition: 'height 0.3s ease-out', minWidth: '6px' }}
              _hover={{ opacity: 1, bg: d.count > 0 ? BLUE : 'rgba(255,255,255,0.12)' }}
            />
          </Tooltip>
        );
      })}
    </Flex>
  );
};

// ── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color, sub, icon: Icon }) => {
  const c = color || ACCENT;
  return (
    <MotionBox flex={1} px={4} py={3} borderRadius="12px"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      pos="relative" overflow="hidden"
      whileHover={{ y: -2, boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px ${c}30` }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${c}99, transparent)` }} />
      <Flex align="center" gap={3}>
        {Icon && (
          <Flex w="36px" h="36px" borderRadius="9px" flexShrink={0}
            bg={`${c}15`} border={`1px solid ${c}35`}
            align="center" justify="center">
            <Icon boxSize={4} color={c} />
          </Flex>
        )}
        <Box>
          <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider" mb={0.5}>{label}</Text>
          <Text fontSize="2xl" fontWeight="bold" color={c} lineHeight={1}>{value}</Text>
          {sub && <Text fontSize="9px" color="var(--dash-text-muted)" mt={0.5}>{sub}</Text>}
        </Box>
      </Flex>
    </MotionBox>
  );
};

// ── Template form fields ────────────────────────────────────────────────────

const TemplateFields = ({ template, payload, onChange }) => {
  const set = (k, v) => onChange({ ...payload, [k]: v });

  switch (template) {
    case 'url':
    case 'phishing':
      return (
        <Box>
          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider" mb={1.5}>Target URL</Text>
          <Input {...inputSx} placeholder="https://target.example.com"
            value={payload.url || ''} onChange={(e) => set('url', e.target.value)} />
          {template === 'phishing' && (
            <Text fontSize="10px" color={RED} mt={1.5}>
              Scans will be tracked via redirect. The QR code points to the tracking URL.
            </Text>
          )}
        </Box>
      );
    case 'wifi':
      return (
        <Flex direction="column" gap={3}>
          <SimpleGrid columns={2} gap={3}>
            <Box>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}>SSID (Network Name)</Text>
              <Input {...inputSx} placeholder="MyNetwork"
                value={payload.ssid || ''} onChange={(e) => set('ssid', e.target.value)} />
            </Box>
            <Box>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}>Password</Text>
              <Input {...inputSx} placeholder="password123" type="password"
                value={payload.password || ''} onChange={(e) => set('password', e.target.value)} />
            </Box>
          </SimpleGrid>
          <SimpleGrid columns={2} gap={3}>
            <Box>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}>Encryption</Text>
              <Select {...selSx} value={payload.encryption || 'WPA'}
                onChange={(e) => set('encryption', e.target.value)}>
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </Select>
            </Box>
            <Flex align="flex-end" pb={1}>
              <Button size="sm" variant="ghost" color="var(--dash-text-muted)" fontSize="11px"
                onClick={() => set('hidden', !payload.hidden)}>
                {payload.hidden ? <CheckIcon boxSize={3} color={GREEN} mr={1.5} /> : <CloseIcon boxSize={2} mr={1.5} />}
                Hidden Network
              </Button>
            </Flex>
          </SimpleGrid>
        </Flex>
      );
    case 'vcard':
      return (
        <Flex direction="column" gap={3}>
          <SimpleGrid columns={2} gap={3}>
            <Box>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}>Full Name</Text>
              <Input {...inputSx} placeholder="John Doe"
                value={payload.name || ''} onChange={(e) => set('name', e.target.value)} />
            </Box>
            <Box>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}>Organization</Text>
              <Input {...inputSx} placeholder="Acme Corp"
                value={payload.org || ''} onChange={(e) => set('org', e.target.value)} />
            </Box>
          </SimpleGrid>
          <SimpleGrid columns={2} gap={3}>
            <Box>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}>Phone</Text>
              <Input {...inputSx} placeholder="+1234567890"
                value={payload.phone || ''} onChange={(e) => set('phone', e.target.value)} />
            </Box>
            <Box>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}>Email</Text>
              <Input {...inputSx} placeholder="john@example.com"
                value={payload.email || ''} onChange={(e) => set('email', e.target.value)} />
            </Box>
          </SimpleGrid>
          <Box>
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider" mb={1.5}>Website</Text>
            <Input {...inputSx} placeholder="https://example.com"
              value={payload.url || ''} onChange={(e) => set('url', e.target.value)} />
          </Box>
        </Flex>
      );
    case 'email':
      return (
        <Flex direction="column" gap={3}>
          <SimpleGrid columns={2} gap={3}>
            <Box>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}>Email Address</Text>
              <Input {...inputSx} placeholder="target@example.com"
                value={payload.email || ''} onChange={(e) => set('email', e.target.value)} />
            </Box>
            <Box>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}>Subject</Text>
              <Input {...inputSx} placeholder="Subject line"
                value={payload.subject || ''} onChange={(e) => set('subject', e.target.value)} />
            </Box>
          </SimpleGrid>
          <Box>
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider" mb={1.5}>Body</Text>
            <Textarea value={payload.body || ''} onChange={(e) => set('body', e.target.value)}
              placeholder="Email body…" rows={3} resize="vertical"
              bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
              borderRadius="10px" fontSize="sm" color="var(--dash-text-primary)"
              _placeholder={{ color: 'var(--dash-text-muted)' }}
              _hover={{ borderColor: `${ACCENT}50` }}
              _focus={{ borderColor: `${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` }} />
          </Box>
        </Flex>
      );
    case 'sms':
      return (
        <Flex direction="column" gap={3}>
          <Box>
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider" mb={1.5}>Phone Number</Text>
            <Input {...inputSx} placeholder="+1234567890"
              value={payload.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          </Box>
          <Box>
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider" mb={1.5}>Message</Text>
            <Textarea value={payload.message || ''} onChange={(e) => set('message', e.target.value)}
              placeholder="SMS message…" rows={2} resize="vertical"
              bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
              borderRadius="10px" fontSize="sm" color="var(--dash-text-primary)"
              _placeholder={{ color: 'var(--dash-text-muted)' }}
              _hover={{ borderColor: `${ACCENT}50` }}
              _focus={{ borderColor: `${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` }} />
          </Box>
        </Flex>
      );
    case 'text':
      return (
        <Box>
          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider" mb={1.5}>Text Content</Text>
          <Textarea value={payload.text || ''} onChange={(e) => set('text', e.target.value)}
            placeholder="Any text content…" rows={4} resize="vertical"
            bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
            borderRadius="10px" fontSize="sm" color="var(--dash-text-primary)"
            _placeholder={{ color: 'var(--dash-text-muted)' }}
            _hover={{ borderColor: `${ACCENT}50` }}
            _focus={{ borderColor: `${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` }} />
        </Box>
      );
    default: return null;
  }
};

// ── Sidebar QR item ─────────────────────────────────────────────────────────

const QRSidebarItem = ({ qr, isSelected, onClick }) => {
  const t = TEMPLATES.find((t) => t.key === qr.template) || TEMPLATES[0];
  const Icon = t.icon;
  const totalScans = qr.scans?.length || 0;

  return (
    <MotionBox
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      px={3} py={2.5} borderRadius="10px" cursor="pointer"
      bg={isSelected ? `${ACCENT}12` : 'rgba(255,255,255,0.02)'}
      border={isSelected ? `1px solid ${ACCENT}40` : '1px solid rgba(255,255,255,0.05)'}
      _hover={{ bg: isSelected ? `${ACCENT}18` : 'rgba(255,255,255,0.05)', borderColor: `${ACCENT}30` }}
      style={{ transition: 'all 0.12s' }}
      onClick={onClick}>
      <Flex align="center" gap={2.5}>
        <Flex w="32px" h="32px" borderRadius="8px" flexShrink={0}
          bg={`${t.color}15`} border={`1px solid ${t.color}30`}
          align="center" justify="center">
          <Icon boxSize={3.5} color={t.color} />
        </Flex>
        <Box flex={1} minW={0}>
          <Flex align="center" gap={1.5}>
            <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
              noOfLines={1} lineHeight="short">{qr.title}</Text>
            {!qr.active && (
              <Box px={1} py="0px" borderRadius="3px" bg="rgba(252,129,129,0.15)" border={`1px solid ${RED}30`}>
                <Text fontSize="7px" fontWeight="bold" color={RED}>OFF</Text>
              </Box>
            )}
          </Flex>
          <Flex align="center" gap={2} mt={0.5}>
            <Text fontSize="9px" color={t.color} fontWeight="semibold">{t.label}</Text>
            <Text fontSize="9px" color="var(--dash-text-muted)">{totalScans} scan{totalScans !== 1 ? 's' : ''}</Text>
          </Flex>
        </Box>
        {qr.qrDataUrl && (
          <Box as="img" src={qr.qrDataUrl} w="28px" h="28px" borderRadius="4px" flexShrink={0}
            border="1px solid rgba(255,255,255,0.1)" />
        )}
      </Flex>
    </MotionBox>
  );
};

// ── Analytics dashboard for a single QR ─────────────────────────────────────

const QRAnalytics = ({ qr }) => {
  const scans = qr.scans || [];
  const total = scans.length;

  const osCounts = useMemo(() => {
    const m = {};
    scans.forEach((s) => { m[s.os || 'Unknown'] = (m[s.os || 'Unknown'] || 0) + 1; });
    return Object.entries(m).sort(([, a], [, b]) => b - a);
  }, [scans]);

  const browserCounts = useMemo(() => {
    const m = {};
    scans.forEach((s) => { m[s.browser || 'Unknown'] = (m[s.browser || 'Unknown'] || 0) + 1; });
    return Object.entries(m).sort(([, a], [, b]) => b - a);
  }, [scans]);

  const uniqueIPs = useMemo(() => {
    const s = new Set(scans.map((sc) => sc.ip).filter(Boolean));
    return s.size;
  }, [scans]);

  const todayScans = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return scans.filter((s) => s.createdAt?.slice(0, 10) === today).length;
  }, [scans]);

  const osDonut = osCounts.map(([os, count]) => ({
    label: os, value: count,
    color: (OS_COLORS[os] || OS_COLORS['Unknown']).color,
  }));

  const browserDonut = browserCounts.map(([b, count]) => ({
    label: b, value: count,
    color: BROWSER_COLORS[b] || BROWSER_COLORS['Unknown'],
  }));

  return (
    <Flex direction="column" gap={5}>

      {/* Scan stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
        <StatCard label="Total Scans" value={total} color={ACCENT} icon={ViewIcon} />
        <StatCard label="Today" value={todayScans} color={BLUE} icon={TimeIcon} />
        <StatCard label="Unique Scanners" value={uniqueIPs} color={GREEN} icon={SearchIcon} />
        <StatCard label="Status" value={qr.active ? 'Active' : 'Off'} color={qr.active ? GREEN : RED} icon={CheckIcon} />
      </SimpleGrid>

      {/* Scan activity chart */}
      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="14px" overflow="hidden" pos="relative">
        <Box pos="absolute" top={0} left={0} right={0} h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />
        <Flex align="center" gap={2} px={5} py={3}
          borderBottom="1px solid var(--dash-card-border)">
          <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider" flex={1}>Scan Activity</Text>
          <Text fontSize="10px" color="var(--dash-text-muted)">Last 14 days</Text>
        </Flex>
        <Box px={5} py={4}>
          <ActivityChart scans={scans} />
          <Flex justify="space-between" mt={1.5}>
            <Text fontSize="9px" color="var(--dash-text-muted)">14 days ago</Text>
            <Text fontSize="9px" color="var(--dash-text-muted)">Today</Text>
          </Flex>
        </Box>
      </Box>

      {/* Donut charts row */}
      {total > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>

          {/* OS breakdown */}
          <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="14px" overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${BLUE}80, transparent)` }} />
            <Flex align="center" gap={2} px={5} py={3}
              borderBottom="1px solid var(--dash-card-border)">
              <Box w="3px" h="12px" borderRadius="full" bg={BLUE} />
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider">Scan by OS</Text>
            </Flex>
            <Flex px={5} py={4} align="center" gap={6}>
              <DonutChart data={osDonut} centerLabel={total} size={110} thickness={16} />
              <Flex direction="column" gap={2} flex={1}>
                {osCounts.map(([os, count]) => {
                  const s = OS_COLORS[os] || OS_COLORS['Unknown'];
                  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                  return (
                    <Flex key={os} align="center" justify="space-between" gap={2}>
                      <Flex align="center" gap={2}>
                        <Box w="8px" h="8px" borderRadius="full" bg={s.color} flexShrink={0} />
                        <Text fontSize="11px" color="var(--dash-text-primary)" fontWeight="semibold">{os}</Text>
                      </Flex>
                      <Text fontSize="11px" color="var(--dash-text-muted)" fontWeight="bold">{pct}%</Text>
                    </Flex>
                  );
                })}
              </Flex>
            </Flex>
          </Box>

          {/* Browser breakdown */}
          <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="14px" overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${CYAN}80, transparent)` }} />
            <Flex align="center" gap={2} px={5} py={3}
              borderBottom="1px solid var(--dash-card-border)">
              <Box w="3px" h="12px" borderRadius="full" bg={CYAN} />
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider">Scan by Browser</Text>
            </Flex>
            <Flex px={5} py={4} align="center" gap={6}>
              <DonutChart data={browserDonut} centerLabel={total} size={110} thickness={16} />
              <Flex direction="column" gap={2} flex={1}>
                {browserCounts.map(([b, count]) => {
                  const c = BROWSER_COLORS[b] || BROWSER_COLORS['Unknown'];
                  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                  return (
                    <Flex key={b} align="center" justify="space-between" gap={2}>
                      <Flex align="center" gap={2}>
                        <Box w="8px" h="8px" borderRadius="full" bg={c} flexShrink={0} />
                        <Text fontSize="11px" color="var(--dash-text-primary)" fontWeight="semibold">{b}</Text>
                      </Flex>
                      <Text fontSize="11px" color="var(--dash-text-muted)" fontWeight="bold">{pct}%</Text>
                    </Flex>
                  );
                })}
              </Flex>
            </Flex>
          </Box>
        </SimpleGrid>
      )}

      {/* Recent scans table */}
      {scans.length > 0 && (
        <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="14px" overflow="hidden" pos="relative">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${GREEN}80, transparent)` }} />
          <Flex align="center" gap={2} px={5} py={3}
            borderBottom="1px solid var(--dash-card-border)">
            <Box w="3px" h="12px" borderRadius="full" bg={GREEN} />
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider" flex={1}>Recent Scans</Text>
            <Text fontSize="10px" color="var(--dash-text-muted)">{scans.length} total</Text>
          </Flex>
          <Box px={3} py={2} maxH="240px" overflowY="auto"
            css={{
              '&::-webkit-scrollbar': { width: '3px' },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '3px' },
            }}>
            {[...scans].reverse().slice(0, 50).map((s, i) => {
              const osStyle = OS_COLORS[s.os] || OS_COLORS['Unknown'];
              return (
                <Flex key={s._id || i} align="center" gap={3} px={3} py={2}
                  borderBottom="1px solid rgba(255,255,255,0.04)">
                  <Flex align="center" gap={1} px={1.5} py="2px" borderRadius="4px"
                    bg={osStyle.bg} border={`1px solid ${osStyle.color}25`} flexShrink={0}>
                    <Box w="5px" h="5px" borderRadius="full" bg={osStyle.color} />
                    <Text fontSize="9px" fontWeight="bold" color={osStyle.color}>{s.os}</Text>
                  </Flex>
                  <Text fontSize="10px" color="var(--dash-text-secondary)" flex={1} noOfLines={1}>
                    {s.browser}{s.ip ? ` · ${s.ip}` : ''}
                  </Text>
                  <Text fontSize="9px" color="var(--dash-text-muted)" flexShrink={0}>
                    {fmtRelative(s.createdAt)}
                  </Text>
                </Flex>
              );
            })}
          </Box>
        </Box>
      )}
    </Flex>
  );
};

// ── Main view ────────────────────────────────────────────────────────────────

const QRCodeView = () => {
  const { slug } = useParams();
  const { getBySlug, fetchEngagements } = useEngagements();
  const { user } = useAuth();
  const eng = getBySlug(slug);

  const [selected,  setSelected]  = useState(null);
  const [mode,      setMode]      = useState('view');
  const [form,      setForm]      = useState({
    title: '', template: 'url', payload: {}, fgColor: '#9F7AEA', bgColor: '#FFFFFF', tags: '',
  });
  const [preview,   setPreview]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [tab,       setTab]       = useState('analytics'); // analytics | details

  const qrCodes = eng?.qrCodes || [];

  // Auto-refresh scan data every 10s when viewing a QR code
  useEffect(() => {
    if (!selected || mode !== 'view') return;
    const interval = setInterval(() => { fetchEngagements(); }, 10_000);
    return () => clearInterval(interval);
  }, [selected, mode, fetchEngagements]);

  // Generate QR preview
  useEffect(() => {
    const content = buildQRContent(form.template, form.payload, null);
    if (!content) { setPreview(null); return; }
    QRCode.toDataURL(content, {
      width: 280, margin: 2,
      color: { dark: form.fgColor || '#000000', light: form.bgColor || '#FFFFFF' },
      errorCorrectionLevel: 'H',
    }).then(setPreview).catch(() => setPreview(null));
  }, [form.template, form.payload, form.fgColor, form.bgColor]);

  const filtered = useMemo(() => {
    if (!search.trim()) return qrCodes;
    const q = search.toLowerCase();
    return qrCodes.filter((qr) =>
      qr.title.toLowerCase().includes(q) ||
      (qr.targetUrl || '').toLowerCase().includes(q) ||
      qr.template.toLowerCase().includes(q)
    );
  }, [qrCodes, search]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
  [filtered]);

  // Global stats
  const globalStats = useMemo(() => {
    const totalScans = qrCodes.reduce((s, qr) => s + (qr.scans?.length || 0), 0);
    const uniqueIPs = new Set(qrCodes.flatMap((qr) => (qr.scans || []).map((s) => s.ip).filter(Boolean))).size;
    return { total: qrCodes.length, totalScans, uniqueIPs };
  }, [qrCodes]);

  // CRUD
  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const trackUrl = `${API}/qr/scan/PLACEHOLDER`;
      const content = buildQRContent(form.template, form.payload,
        (form.template === 'url' || form.template === 'phishing') ? trackUrl : null
      );

      // First create to get shortCode, then regenerate QR with real tracking URL
      const body = {
        title: form.title.trim(),
        template: form.template,
        targetUrl: form.payload.url || '',
        payload: form.payload,
        qrDataUrl: preview || '',
        fgColor: form.fgColor,
        bgColor: form.bgColor,
        tags: typeof form.tags === 'string'
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : form.tags,
      };

      const res = await fetch(`${API}/qr/${eng._id}/qr`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      const created = await res.json();

      // Now regenerate QR with the real tracking URL for url/phishing templates
      if ((form.template === 'url' || form.template === 'phishing') && created.shortCode) {
        const realTrackUrl = `${API}/qr/scan/${created.shortCode}`;
        const qrDataUrl = await QRCode.toDataURL(realTrackUrl, {
          width: 280, margin: 2,
          color: { dark: form.fgColor || '#000000', light: form.bgColor || '#FFFFFF' },
          errorCorrectionLevel: 'H',
        });
        await fetch(`${API}/qr/${eng._id}/qr/${created._id}`, {
          method: 'PUT', headers: authHeaders(),
          body: JSON.stringify({ qrDataUrl }),
        });
      } else if (preview) {
        await fetch(`${API}/qr/${eng._id}/qr/${created._id}`, {
          method: 'PUT', headers: authHeaders(),
          body: JSON.stringify({ qrDataUrl: preview }),
        });
      }

      await fetchEngagements();
      setForm({ title: '', template: 'url', payload: {}, fgColor: '#9F7AEA', bgColor: '#FFFFFF', tags: '' });
      setMode('view');
      setSelected(created._id);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API}/qr/${eng._id}/qr/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      await fetchEngagements();
      if (selected === id) { setSelected(null); setMode('view'); }
      setDeleteConfirm(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await fetch(`${API}/qr/${eng._id}/qr/${id}/toggle`, {
        method: 'PATCH', headers: authHeaders(),
      });
      await fetchEngagements();
    } catch (e) {
      console.error(e);
    }
  };

  const selectQR = (qr) => {
    if (selected === qr._id) { setSelected(null); }
    else { setSelected(qr._id); setTab('analytics'); }
    setMode('view');
  };

  const startAdd = () => {
    setSelected(null);
    setForm({ title: '', template: 'url', payload: {}, fgColor: '#9F7AEA', bgColor: '#FFFFFF', tags: '' });
    setMode('add');
  };

  const selectedQR = qrCodes.find((q) => q._id === selected);

  const handleDownload = (qr) => {
    if (!qr.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qr.qrDataUrl;
    a.download = `${qr.title.replace(/[^a-z0-9]/gi, '_')}_qr.png`;
    a.click();
  };

  if (!eng) return (
    <Flex align="center" justify="center" h="60vh"><Spinner size="lg" color={ACCENT} /></Flex>
  );

  return (
    <Box px={6} pb={12}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            QR Code <Text as="span" color="red.400">Generator</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · create tracked QR codes with templates &amp; scan analytics
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon boxSize={3} />}
          bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
          borderRadius="8px" fontWeight="bold" fontSize="12px"
          _hover={{ bg: `${ACCENT}35` }} onClick={startAdd}>
          New QR Code
        </Button>
      </Flex>

      {/* Global stats */}
      <SimpleGrid columns={{ base: 2, md: 3 }} gap={3} mb={5}>
        <StatCard label="QR Codes" value={globalStats.total} color={ACCENT} icon={CopyIcon} />
        <StatCard label="Total Scans" value={globalStats.totalScans} color={BLUE} icon={ViewIcon} />
        <StatCard label="Unique Scanners" value={globalStats.uniqueIPs} color={GREEN} icon={SearchIcon} />
      </SimpleGrid>

      <Flex gap={6} align="flex-start" direction={{ base: 'column', xl: 'row' }}>

        {/* Left sidebar: QR list */}
        <Box w={{ base: '100%', xl: '320px' }} flexShrink={0}>
          <Box pos="relative" mb={3}>
            <Box pos="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
              <SearchIcon boxSize={3.5} color="var(--dash-text-muted)" />
            </Box>
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search QR codes…" {...inputSx} pl={9} h="36px" fontSize="12px" />
          </Box>

          <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="14px" overflow="hidden">
            <Flex align="center" gap={2} px={4} py={3}
              borderBottom="1px solid var(--dash-card-border)">
              <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" flex={1}>QR Codes</Text>
              <Text fontSize="10px" color="var(--dash-text-muted)">
                {sorted.length} / {qrCodes.length}
              </Text>
            </Flex>
            <Box px={2} py={2} maxH="calc(100vh - 420px)" overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { width: '3px' },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '3px' },
              }}>
              {sorted.length === 0 ? (
                <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" py={6}>
                  {qrCodes.length === 0 ? 'No QR codes yet' : 'No matches'}
                </Text>
              ) : (
                <Flex direction="column" gap={1.5}>
                  {sorted.map((qr) => (
                    <QRSidebarItem key={qr._id} qr={qr}
                      isSelected={selected === qr._id}
                      onClick={() => selectQR(qr)} />
                  ))}
                </Flex>
              )}
            </Box>
          </Box>
        </Box>

        {/* Right: detail / form */}
        <Box flex={1} minW={0}>
          <AnimatePresence mode="wait">

            {/* ── Create form ── */}
            {mode === 'add' && (
              <MotionBox key="form"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="14px" overflow="hidden">

                <Flex align="center" gap={2} px={5} py={4}
                  borderBottom="1px solid var(--dash-card-border)">
                  <Box w="3px" h="16px" borderRadius="full" bg={ACCENT} />
                  <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)" flex={1}>
                    New QR Code
                  </Text>
                  <Button size="xs" variant="ghost" color="var(--dash-text-muted)"
                    onClick={() => setMode('view')}>Cancel</Button>
                </Flex>

                <Box px={5} py={4}>
                  <Flex direction={{ base: 'column', lg: 'row' }} gap={6}>

                    {/* Form fields */}
                    <Box flex={1}>
                      <Flex direction="column" gap={4}>
                        <Box>
                          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                            textTransform="uppercase" letterSpacing="wider" mb={1.5}>Title *</Text>
                          <Input {...inputSx} placeholder="e.g. Lobby Wi-Fi Poster"
                            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </Box>

                        {/* Template picker */}
                        <Box>
                          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                            textTransform="uppercase" letterSpacing="wider" mb={2}>Template</Text>
                          <Flex gap={2} flexWrap="wrap">
                            {TEMPLATES.map((t) => {
                              const active = form.template === t.key;
                              return (
                                <Button key={t.key} size="sm" borderRadius="8px" px={3}
                                  fontWeight="bold" fontSize="11px"
                                  bg={active ? `${t.color}25` : 'transparent'}
                                  color={active ? t.color : 'var(--dash-text-muted)'}
                                  border={active ? `1px solid ${t.color}50` : '1px solid rgba(255,255,255,0.08)'}
                                  _hover={{ bg: active ? `${t.color}35` : 'rgba(255,255,255,0.05)' }}
                                  onClick={() => setForm({ ...form, template: t.key, payload: {} })}>
                                  <t.icon boxSize={3} mr={1.5} />{t.label}
                                </Button>
                              );
                            })}
                          </Flex>
                        </Box>

                        {/* Template-specific fields */}
                        <TemplateFields template={form.template} payload={form.payload}
                          onChange={(p) => setForm({ ...form, payload: p })} />

                        {/* Colors */}
                        <SimpleGrid columns={2} gap={3}>
                          <Box>
                            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                              textTransform="uppercase" letterSpacing="wider" mb={1.5}>QR Color</Text>
                            <Flex align="center" gap={2}>
                              <Input type="color" value={form.fgColor} w="40px" h="34px" p={0}
                                border="1px solid rgba(255,255,255,0.1)" borderRadius="6px" cursor="pointer"
                                onChange={(e) => setForm({ ...form, fgColor: e.target.value })} />
                              <Text fontSize="11px" color="var(--dash-text-muted)" fontFamily="mono">{form.fgColor}</Text>
                            </Flex>
                          </Box>
                          <Box>
                            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                              textTransform="uppercase" letterSpacing="wider" mb={1.5}>Background</Text>
                            <Flex align="center" gap={2}>
                              <Input type="color" value={form.bgColor} w="40px" h="34px" p={0}
                                border="1px solid rgba(255,255,255,0.1)" borderRadius="6px" cursor="pointer"
                                onChange={(e) => setForm({ ...form, bgColor: e.target.value })} />
                              <Text fontSize="11px" color="var(--dash-text-muted)" fontFamily="mono">{form.bgColor}</Text>
                            </Flex>
                          </Box>
                        </SimpleGrid>

                        {/* Tags */}
                        <Box>
                          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                            textTransform="uppercase" letterSpacing="wider" mb={1.5}>Tags (comma-separated)</Text>
                          <Input {...inputSx} placeholder="lobby, social-eng, phishing"
                            value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                        </Box>

                        <Button
                          size="md" borderRadius="10px" mt={2}
                          bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                          _hover={{ bg: `${ACCENT}35` }} fontWeight="bold" fontSize="13px"
                          isLoading={saving} loadingText="Creating…"
                          onClick={handleCreate}>
                          Create QR Code
                        </Button>
                      </Flex>
                    </Box>

                    {/* Live preview */}
                    <Box w={{ base: '100%', lg: '200px' }} flexShrink={0}>
                      <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                        textTransform="uppercase" letterSpacing="wider" mb={2} textAlign="center">Preview</Text>
                      <Flex direction="column" align="center" gap={3}
                        px={4} py={5} borderRadius="12px"
                        bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)">
                        {preview ? (
                          <Box as="img" src={preview} w="160px" h="160px" borderRadius="8px" />
                        ) : (
                          <Flex w="160px" h="160px" align="center" justify="center"
                            borderRadius="8px" border="2px dashed rgba(255,255,255,0.1)">
                            <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" px={2}>
                              Fill in the template fields to preview
                            </Text>
                          </Flex>
                        )}
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
              </MotionBox>
            )}

            {/* ── View selected QR ── */}
            {mode === 'view' && selectedQR && (
              <MotionBox key={`view-${selected}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                {/* QR header card */}
                <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  borderRadius="14px" overflow="hidden" pos="relative" mb={5}>
                  {(() => {
                    const t = TEMPLATES.find((t) => t.key === selectedQR.template) || TEMPLATES[0];
                    return (
                      <>
                        <Box pos="absolute" top={0} left={0} right={0} h="2px"
                          style={{ background: `linear-gradient(to right, transparent, ${t.color}80, transparent)` }} />
                        <Flex px={5} py={4} gap={5} align="center" flexWrap="wrap">
                          {/* QR image */}
                          {selectedQR.qrDataUrl && (
                            <Box flexShrink={0}>
                              <Box as="img" src={selectedQR.qrDataUrl} w="100px" h="100px"
                                borderRadius="10px" border="1px solid rgba(255,255,255,0.1)" />
                            </Box>
                          )}
                          {/* Info */}
                          <Box flex={1} minW={0}>
                            <Flex align="center" gap={2} mb={1.5} flexWrap="wrap">
                              <Text fontSize="18px" fontWeight="bold" color="var(--dash-text-primary)">
                                {selectedQR.title}
                              </Text>
                              <Flex align="center" gap={1} px={2} py="2px" borderRadius="5px"
                                bg={`${t.color}15`} border={`1px solid ${t.color}35`}>
                                <t.icon boxSize={2.5} color={t.color} />
                                <Text fontSize="9px" fontWeight="bold" color={t.color}>{t.label}</Text>
                              </Flex>
                              <Flex align="center" gap={1} px={2} py="2px" borderRadius="5px"
                                bg={selectedQR.active ? 'rgba(104,211,145,0.1)' : 'rgba(252,129,129,0.1)'}
                                border={`1px solid ${selectedQR.active ? GREEN : RED}30`}>
                                <Box w="5px" h="5px" borderRadius="full" bg={selectedQR.active ? GREEN : RED} />
                                <Text fontSize="9px" fontWeight="bold" color={selectedQR.active ? GREEN : RED}>
                                  {selectedQR.active ? 'Active' : 'Disabled'}
                                </Text>
                              </Flex>
                            </Flex>
                            {selectedQR.targetUrl && (
                              <Text fontSize="11px" color="var(--dash-text-muted)" fontFamily="mono" noOfLines={1} mb={1}>
                                {selectedQR.targetUrl}
                              </Text>
                            )}
                            <Flex align="center" gap={3} mt={1} flexWrap="wrap">
                              <Text fontSize="10px" color="var(--dash-text-muted)">
                                Created {fmtDate(selectedQR.createdAt)}
                              </Text>
                              {selectedQR.createdByCallsign && (
                                <Text fontSize="10px" color="var(--dash-text-muted)">
                                  by {selectedQR.createdByCallsign}
                                </Text>
                              )}
                              <Text fontSize="10px" color="var(--dash-text-muted)">
                                Short: <Text as="span" fontFamily="mono" color={ACCENT}>{selectedQR.shortCode}</Text>
                              </Text>
                            </Flex>
                            {selectedQR.tags?.length > 0 && (
                              <Flex gap={1.5} mt={2} flexWrap="wrap">
                                {selectedQR.tags.map((t) => (
                                  <Box key={t} px={2} py="1px" borderRadius="4px" fontSize="9px" fontWeight="semibold"
                                    color="var(--dash-text-secondary)" bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)">
                                    {t}
                                  </Box>
                                ))}
                              </Flex>
                            )}
                          </Box>
                          {/* Actions */}
                          <Flex direction="column" gap={1.5} flexShrink={0}>
                            <Tooltip label="Download QR" fontSize="10px">
                              <IconButton icon={<DownloadIcon boxSize={3.5} />}
                                size="sm" variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
                                border="1px solid rgba(255,255,255,0.08)"
                                _hover={{ color: ACCENT, borderColor: `${ACCENT}40` }}
                                onClick={() => handleDownload(selectedQR)} aria-label="Download" />
                            </Tooltip>
                            <Tooltip label={selectedQR.active ? 'Disable' : 'Enable'} fontSize="10px">
                              <IconButton icon={selectedQR.active ? <CheckIcon boxSize={3} /> : <CloseIcon boxSize={2.5} />}
                                size="sm" variant="ghost" borderRadius="8px"
                                color={selectedQR.active ? GREEN : RED}
                                border={`1px solid ${selectedQR.active ? GREEN : RED}30`}
                                _hover={{ bg: `${selectedQR.active ? GREEN : RED}15` }}
                                onClick={() => handleToggleActive(selectedQR._id)} aria-label="Toggle" />
                            </Tooltip>
                            {deleteConfirm === selectedQR._id ? (
                              <Flex gap={1}>
                                <IconButton icon={<CheckIcon boxSize={3} />}
                                  size="sm" variant="ghost" color={RED} borderRadius="8px"
                                  border={`1px solid ${RED}40`} _hover={{ bg: `${RED}15` }}
                                  onClick={() => handleDelete(selectedQR._id)} aria-label="Confirm" />
                                <IconButton icon={<CloseIcon boxSize={2.5} />}
                                  size="sm" variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
                                  border="1px solid rgba(255,255,255,0.08)"
                                  onClick={() => setDeleteConfirm(null)} aria-label="Cancel" />
                              </Flex>
                            ) : (
                              <Tooltip label="Delete" fontSize="10px">
                                <IconButton icon={<DeleteIcon boxSize={3} />}
                                  size="sm" variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
                                  border="1px solid rgba(255,255,255,0.08)"
                                  _hover={{ color: RED, borderColor: `${RED}40` }}
                                  onClick={() => setDeleteConfirm(selectedQR._id)} aria-label="Delete" />
                              </Tooltip>
                            )}
                          </Flex>
                        </Flex>
                      </>
                    );
                  })()}
                </Box>

                {/* Analytics */}
                <QRAnalytics qr={selectedQR} />
              </MotionBox>
            )}

            {/* ── Dashboard when nothing selected ── */}
            {mode === 'view' && !selectedQR && (
              <MotionBox key="dashboard"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                {qrCodes.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" gap={3} py={20}
                    color="var(--dash-text-muted)">
                    <Flex w="56px" h="56px" borderRadius="14px"
                      bg={`${ACCENT}12`} border={`2px solid ${ACCENT}40`}
                      align="center" justify="center">
                      <CopyIcon boxSize={5} color={ACCENT} />
                    </Flex>
                    <Box textAlign="center">
                      <Text fontSize="sm" fontWeight="semibold" color="var(--dash-text-secondary)">
                        QR Code Generator
                      </Text>
                      <Text fontSize="xs" mt={1} maxW="340px">
                        Create QR codes with tracking — monitor who scans, when, from what device and browser
                      </Text>
                    </Box>
                    <Button size="sm" leftIcon={<AddIcon boxSize={3} />} mt={2}
                      bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                      borderRadius="8px" fontWeight="bold" fontSize="12px"
                      _hover={{ bg: `${ACCENT}35` }} onClick={startAdd}>
                      Create First QR Code
                    </Button>
                  </Flex>
                ) : (
                  <Flex direction="column" gap={5}>

                    {/* All scans activity */}
                    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                      borderRadius="14px" overflow="hidden" pos="relative">
                      <Box pos="absolute" top={0} left={0} right={0} h="2px"
                        style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />
                      <Flex align="center" gap={2} px={5} py={3}
                        borderBottom="1px solid var(--dash-card-border)">
                        <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
                        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                          textTransform="uppercase" letterSpacing="wider" flex={1}>Overall Scan Activity</Text>
                        <Text fontSize="10px" color="var(--dash-text-muted)">Last 14 days</Text>
                      </Flex>
                      <Box px={5} py={4}>
                        <ActivityChart scans={qrCodes.flatMap((q) => q.scans || [])} />
                        <Flex justify="space-between" mt={1.5}>
                          <Text fontSize="9px" color="var(--dash-text-muted)">14 days ago</Text>
                          <Text fontSize="9px" color="var(--dash-text-muted)">Today</Text>
                        </Flex>
                      </Box>
                    </Box>

                    {/* QR code overview cards */}
                    <Box>
                      <Flex align="center" gap={2} mb={3}>
                        <Box w="3px" h="14px" borderRadius="full" bg={BLUE} />
                        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                          textTransform="uppercase" letterSpacing="wider">
                          All QR Codes · by scans
                        </Text>
                      </Flex>
                      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                        {[...qrCodes].sort((a, b) => (b.scans?.length || 0) - (a.scans?.length || 0)).map((qr) => {
                          const t = TEMPLATES.find((t) => t.key === qr.template) || TEMPLATES[0];
                          const scanCount = qr.scans?.length || 0;
                          return (
                            <MotionBox key={qr._id}
                              bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                              borderRadius="12px" overflow="hidden" pos="relative" cursor="pointer"
                              _hover={{ boxShadow: `0 6px 24px rgba(0,0,0,0.4), 0 0 0 1px ${ACCENT}25` }}
                              style={{ transition: 'box-shadow 0.2s' }}
                              onClick={() => selectQR(qr)}>
                              <Box pos="absolute" top={0} left={0} right={0} h="2px"
                                style={{ background: `linear-gradient(to right, transparent, ${t.color}70, transparent)` }} />
                              <Flex px={4} py={3} align="center" gap={3}>
                                {qr.qrDataUrl && (
                                  <Box as="img" src={qr.qrDataUrl} w="44px" h="44px"
                                    borderRadius="6px" border="1px solid rgba(255,255,255,0.1)" flexShrink={0} />
                                )}
                                <Box flex={1} minW={0}>
                                  <Flex align="center" gap={1.5} mb={0.5}>
                                    <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={1}>
                                      {qr.title}
                                    </Text>
                                    {!qr.active && (
                                      <Box px={1} py="0px" borderRadius="3px" bg="rgba(252,129,129,0.15)" border={`1px solid ${RED}30`}>
                                        <Text fontSize="7px" fontWeight="bold" color={RED}>OFF</Text>
                                      </Box>
                                    )}
                                  </Flex>
                                  <Flex align="center" gap={2}>
                                    <Flex align="center" gap={1} px={1.5} py="1px" borderRadius="4px"
                                      bg={`${t.color}12`} border={`1px solid ${t.color}25`}>
                                      <t.icon boxSize={2.5} color={t.color} />
                                      <Text fontSize="9px" fontWeight="bold" color={t.color}>{t.label}</Text>
                                    </Flex>
                                    <Text fontSize="9px" color="var(--dash-text-muted)">{fmtRelative(qr.updatedAt)}</Text>
                                  </Flex>
                                </Box>
                                <Flex direction="column" align="center" flexShrink={0}
                                  px={3} py={1.5} borderRadius="8px"
                                  bg={scanCount > 0 ? `${ACCENT}12` : 'rgba(255,255,255,0.03)'}
                                  border={`1px solid ${scanCount > 0 ? `${ACCENT}30` : 'rgba(255,255,255,0.06)'}`}>
                                  <Text fontSize="18px" fontWeight="bold" color={scanCount > 0 ? ACCENT : 'var(--dash-text-muted)'} lineHeight={1}>
                                    {scanCount}
                                  </Text>
                                  <Text fontSize="8px" color="var(--dash-text-muted)" fontWeight="bold" textTransform="uppercase">
                                    scans
                                  </Text>
                                </Flex>
                              </Flex>
                            </MotionBox>
                          );
                        })}
                      </SimpleGrid>
                    </Box>
                  </Flex>
                )}
              </MotionBox>
            )}

          </AnimatePresence>
        </Box>
      </Flex>
    </Box>
  );
};

export default QRCodeView;
