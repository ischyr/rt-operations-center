import { useState, useRef } from 'react';
import {
  Box, Flex, Text, Input, Textarea, Button,
  IconButton, useToast, Switch,
} from '@chakra-ui/react';
import { InfoIcon, DownloadIcon, AttachmentIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT = '#63B3ED';
const GREEN  = '#68D391';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const PURPLE = '#9F7AEA';

// ── Shared styles ─────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '38px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT}50` },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

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
    <Text fontSize="22px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
    <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{label}</Text>
  </MotionBox>
);

// ── Teams SVG logo ────────────────────────────────────────────────────────────
const TeamsLogo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 2228.833 2073.333" xmlns="http://www.w3.org/2000/svg">
    <path d="M1554.637,777.5h575.713c54.391,0,98.483,44.092,98.483,98.483v524.398c0,199.901-162.051,361.952-361.952,361.952h-1.711c-199.901,0.028-361.975-162-361.975-361.884V828.971C1503.195,800.544,1526.211,777.5,1554.637,777.5z" fill="#5059C9"/>
    <circle cx="1943.75" cy="440.583" r="233.25" fill="#5059C9"/>
    <circle cx="1218.083" cy="336.917" r="336.917" fill="#7B83EB"/>
    <path d="M1667.323,777.5H717.01c-53.743,1.33-96.257,45.518-95.01,99.263v598.922c-7.907,322.8,247.765,590.854,570.558,598.922c322.792-8.068,578.464-276.122,570.558-598.922V876.763C1763.58,822.951,1721.066,778.83,1667.323,777.5z" fill="#7B83EB"/>
    <path d="M1244,777.5v838.145c-0.258,38.435-23.553,72.964-59.09,87.598c-11.316,4.787-23.478,7.254-35.765,7.257H667.613c-6.738-17.105-12.958-34.21-18.142-51.85c-18.144-59.477-27.354-121.262-27.35-183.4V876.645c-1.246-53.659,41.198-97.783,94.857-99.145H1244z" fill="url(#b)" opacity=".5"/>
    <path d="M1192,777.5v889.996c-0.002,12.287-2.47,24.449-7.257,35.765c-14.634,35.537-49.163,58.833-87.598,59.09H691.975c-8.812-17.105-17.105-34.21-24.362-51.85c-7.257-17.64-12.958-34.21-18.142-51.85c-18.144-59.477-27.354-121.262-27.35-183.4V876.645c-1.246-53.659,41.198-97.783,94.857-99.145H1192z" fill="url(#c)" opacity=".5"/>
    <path d="M1140,777.5v940.802c-0.332,48.037-39.094,86.8-87.13,87.13H649.843c-18.144-59.477-27.354-121.262-27.35-183.4V876.645c-1.246-53.659,41.198-97.783,94.857-99.145H1140z" fill="url(#d)" opacity=".5"/>
    <path d="M1244,777.5v737.763c-0.395,67.725-55.363,122.512-123.088,122.616H622.493V876.645c-1.246-53.659,41.198-97.783,94.857-99.145H1244z" fill="url(#e)" opacity=".5"/>
    <path d="M95.01,336.917h1122.98c52.473,0,95.01,42.538,95.01,95.01v1122.98c0,52.473-42.538,95.01-95.01,95.01H95.01c-52.473,0-95.01-42.538-95.01-95.01V431.927C0,379.455,42.538,336.917,95.01,336.917z" fill="#5059C9"/>
    <path d="M820.211,828.193H630.241v517.297H509.211V828.193H320.123V727.844h500.088V828.193z" fill="#fff"/>
    <defs>
      <linearGradient id="b" x1="900.07" y1="777.5" x2="900.07" y2="1702.898" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fff" stopOpacity=".5"/><stop offset="1" stopColor="#fff" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="c" x1="848.07" y1="777.5" x2="848.07" y2="1702.352" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fff" stopOpacity=".5"/><stop offset="1" stopColor="#fff" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="d" x1="796.07" y1="777.5" x2="796.07" y2="1701.448" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fff" stopOpacity=".5"/><stop offset="1" stopColor="#fff" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="e" x1="933.17" y1="777.5" x2="933.17" y2="1637.89" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fff" stopOpacity=".5"/><stop offset="1" stopColor="#fff" stopOpacity="0"/>
      </linearGradient>
    </defs>
  </svg>
);

// ── Mention badge ─────────────────────────────────────────────────────────────
const MentionBadge = () => (
  <Box
    pos="absolute" bottom="-2px" right="-2px"
    w="18px" h="18px" borderRadius="full"
    bg="white" display="flex" alignItems="center" justifyContent="center"
    border="2px solid #464775"
    boxShadow="0 1px 4px rgba(0,0,0,0.3)"
  >
    <Text fontSize="9px" fontWeight="black" color="#cc3300" lineHeight={1}>@</Text>
  </Box>
);

// ── Teams Popup Preview ───────────────────────────────────────────────────────
const TeamsPopup = ({ senderName, subtitle, message, avatarSrc, showMention, darkMode }) => {
  const bg      = darkMode ? '#292929' : '#ffffff';
  const textPri = darkMode ? '#ffffff' : '#242424';
  const textSec = darkMode ? '#d6d6d6' : '#424242';
  const border  = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
  const btnHov  = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const headerBg = '#464775';

  const displayMsg = message.length > 52 ? message.slice(0, 52) + '…' : message;

  return (
    <Box
      w="364px"
      borderRadius="8px"
      overflow="hidden"
      boxShadow="0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)"
      border={`1px solid ${border}`}
      bg={bg}
      fontFamily="'Segoe UI', system-ui, -apple-system, sans-serif"
      userSelect="none"
    >
      {/* Title bar */}
      <Flex align="center" justify="space-between" bg={headerBg} px={3} py="7px">
        <Flex align="center" gap="7px">
          <TeamsLogo size={16} />
          <Text fontSize="12px" fontWeight="600" color="white" letterSpacing="0">
            Microsoft Teams
          </Text>
        </Flex>
        <Flex align="center" gap={1}>
          {/* ellipsis */}
          <Box
            w="24px" h="24px" borderRadius="4px" display="flex" alignItems="center"
            justifyContent="center" cursor="pointer" _hover={{ bg: 'rgba(255,255,255,0.15)' }}
            transition="background 0.1s"
          >
            <Text color="white" fontSize="14px" lineHeight={1} letterSpacing="2px" mt="-4px">···</Text>
          </Box>
          {/* close */}
          <Box
            w="24px" h="24px" borderRadius="4px" display="flex" alignItems="center"
            justifyContent="center" cursor="pointer" _hover={{ bg: 'rgba(255,255,255,0.15)' }}
            transition="background 0.1s"
          >
            <Text color="white" fontSize="14px" lineHeight={1}>✕</Text>
          </Box>
        </Flex>
      </Flex>

      {/* Body */}
      <Flex align="center" gap={3} px={3} py="12px" bg={bg}>
        {/* Avatar */}
        <Box pos="relative" flexShrink={0}>
          <Box
            w="44px" h="44px" borderRadius="full" overflow="hidden"
            bg="#6264a7" display="flex" alignItems="center" justifyContent="center"
            border="2px solid rgba(255,255,255,0.1)"
          >
            {avatarSrc ? (
              <Box as="img" src={avatarSrc} w="100%" h="100%" objectFit="cover" />
            ) : (
              <Text fontSize="18px" fontWeight="bold" color="white">
                {senderName ? senderName.charAt(0).toUpperCase() : '?'}
              </Text>
            )}
          </Box>
          {showMention && <MentionBadge />}
        </Box>

        {/* Text */}
        <Box flex="1" minW={0}>
          <Text fontSize="13px" fontWeight="700" color={textPri} lineHeight={1.3} noOfLines={1}>
            {senderName || 'Sender Name'}
          </Text>
          <Text fontSize="12px" color={textSec} lineHeight={1.4} mt="1px" noOfLines={1}>
            {subtitle || `Chat with ${senderName || 'Sender Name'}`}
          </Text>
          <Text fontSize="12px" color={textSec} lineHeight={1.4} mt="1px" noOfLines={1}>
            {displayMsg || 'Your message will appear here…'}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

// ── Export as standalone HTML ─────────────────────────────────────────────────
function buildHtml({ senderName, subtitle, message, avatarSrc, showMention, darkMode }) {
  const bg       = darkMode ? '#292929' : '#ffffff';
  const textPri  = darkMode ? '#ffffff' : '#242424';
  const textSec  = darkMode ? '#d6d6d6' : '#424242';
  const headerBg = '#464775';
  const displayMsg = message.length > 52 ? message.slice(0, 52) + '…' : message;
  const initials = senderName ? senderName.charAt(0).toUpperCase() : '?';
  const avatarHtml = avatarSrc
    ? `<img src="${avatarSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<span style="font-size:18px;font-weight:700;color:white;">${initials}</span>`;
  const mentionHtml = showMention
    ? `<div style="position:absolute;bottom:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;border:2px solid #464775;font-size:9px;font-weight:900;color:#cc3300;">@</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Microsoft Teams Notification</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #1a1a2e;
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  }
  .popup {
    width: 364px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3);
    border: 1px solid rgba(0,0,0,0.12);
    background: ${bg};
  }
  .titlebar {
    display: flex; align-items: center; justify-content: space-between;
    background: ${headerBg}; padding: 7px 12px;
  }
  .titlebar-left { display: flex; align-items: center; gap: 7px; }
  .titlebar-title { font-size: 12px; font-weight: 600; color: white; }
  .titlebar-btns { display: flex; gap: 4px; }
  .titlebar-btn {
    width: 24px; height: 24px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: white; font-size: 13px;
  }
  .titlebar-btn:hover { background: rgba(255,255,255,0.15); }
  .ellipsis { letter-spacing: 2px; margin-top: -4px; }
  .body { display: flex; align-items: center; gap: 12px; padding: 12px; background: ${bg}; }
  .avatar-wrap { position: relative; flex-shrink: 0; }
  .avatar {
    width: 44px; height: 44px; border-radius: 50%; overflow: hidden;
    background: #6264a7; display: flex; align-items: center; justify-content: center;
    border: 2px solid rgba(255,255,255,0.1);
  }
  .mention-badge {
    position: absolute; bottom: -2px; right: -2px;
    width: 18px; height: 18px; border-radius: 50%;
    background: white; border: 2px solid #464775;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 900; color: #cc3300;
  }
  .text { flex: 1; min-width: 0; }
  .name { font-size: 13px; font-weight: 700; color: ${textPri}; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub  { font-size: 12px; color: ${textSec}; line-height: 1.4; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .msg  { font-size: 12px; color: ${textSec}; line-height: 1.4; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
</head>
<body>
  <div class="popup">
    <div class="titlebar">
      <div class="titlebar-left">
        <svg width="16" height="16" viewBox="0 0 2228.833 2073.333" xmlns="http://www.w3.org/2000/svg">
          <path d="M1554.637,777.5h575.713c54.391,0,98.483,44.092,98.483,98.483v524.398c0,199.901-162.051,361.952-361.952,361.952h-1.711c-199.901,0.028-361.975-162-361.975-361.884V828.971C1503.195,800.544,1526.211,777.5,1554.637,777.5z" fill="#5059C9"/>
          <circle cx="1943.75" cy="440.583" r="233.25" fill="#5059C9"/>
          <circle cx="1218.083" cy="336.917" r="336.917" fill="#7B83EB"/>
          <path d="M1667.323,777.5H717.01c-53.743,1.33-96.257,45.518-95.01,99.263v598.922c-7.907,322.8,247.765,590.854,570.558,598.922c322.792-8.068,578.464-276.122,570.558-598.922V876.763C1763.58,822.951,1721.066,778.83,1667.323,777.5z" fill="#7B83EB"/>
          <path d="M95.01,336.917h1122.98c52.473,0,95.01,42.538,95.01,95.01v1122.98c0,52.473-42.538,95.01-95.01,95.01H95.01c-52.473,0-95.01-42.538-95.01-95.01V431.927C0,379.455,42.538,336.917,95.01,336.917z" fill="#5059C9"/>
          <path d="M820.211,828.193H630.241v517.297H509.211V828.193H320.123V727.844h500.088V828.193z" fill="#fff"/>
        </svg>
        <span class="titlebar-title">Microsoft Teams</span>
      </div>
      <div class="titlebar-btns">
        <div class="titlebar-btn"><span class="ellipsis">···</span></div>
        <div class="titlebar-btn">✕</div>
      </div>
    </div>
    <div class="body">
      <div class="avatar-wrap">
        <div class="avatar">${avatarHtml}</div>
        ${mentionHtml}
      </div>
      <div class="text">
        <div class="name">${senderName || 'Sender Name'}</div>
        <div class="sub">${subtitle || `Chat with ${senderName || 'Sender Name'}`}</div>
        <div class="msg">${displayMsg || 'Your message will appear here…'}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Main View ─────────────────────────────────────────────────────────────────
const FakeTeamsView = () => {
  const toast    = useToast();
  const fileRef  = useRef(null);

  const [senderName,  setSenderName]  = useState('Karin Blair');
  const [customSub,   setCustomSub]   = useState('');
  const [message,     setMessage]     = useState("Hey @User! I'd love to pull you into…");
  const [avatarSrc,   setAvatarSrc]   = useState('');
  const [showMention, setShowMention] = useState(true);
  const [darkMode,    setDarkMode]    = useState(false);
  const [autoSub,     setAutoSub]     = useState(true);

  const subtitle = autoSub ? `Chat with ${senderName || 'Sender Name'}` : customSub;
  const charLeft = 52 - message.length;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', status: 'error', duration: 2000 });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const exportHtml = () => {
    const html = buildHtml({ senderName, subtitle, message, avatarSrc, showMention, darkMode });
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `teams-popup-${Date.now()}.html`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'HTML exported', status: 'success', duration: 1500 });
  };

  return (
    <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} px={6} pb={12} pt={5}>

      {/* ── Header ── */}
      <Flex align="flex-start" justify="space-between" mb={5}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Fake Teams <Text as="span" color="red.400">Message</Text>
          </Text>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Generate a pixel-perfect Microsoft Teams notification · customize name, avatar &amp; message
          </Text>
        </Box>
        <Button size="sm" leftIcon={<DownloadIcon />} onClick={exportHtml}
          bg="transparent" border={`1px solid ${ACCENT}60`} color={ACCENT}
          _hover={{ bg: `${ACCENT}15`, borderColor: ACCENT }}
          borderRadius="10px" fontSize="12px">
          Export HTML
        </Button>
      </Flex>

      {/* ── Info banner ── */}
      <Box mb={5} px={4} py={3} borderRadius="10px"
        bg="rgba(99,179,237,0.07)" border="1px solid rgba(99,179,237,0.25)">
        <Flex align="center" gap={2} mb={2}>
          <InfoIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            Teams Notification Cloner
          </Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {[
            'Pixel-perfect Microsoft Teams toast popup replica',
            'Upload a real profile picture or use initials fallback',
            'Export as standalone HTML for phishing awareness campaigns',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Stats ── */}
      <Flex gap={3} mb={6} flexWrap="wrap">
        <StatCard label="Sender"    value={senderName.split(' ')[0] || '—'} color={ACCENT}  delay={0}    />
        <StatCard label="Chars Left" value={Math.max(0, charLeft)}          color={charLeft < 0 ? RED : GREEN} delay={0.04} />
        <StatCard label="Mention"   value={showMention ? 'On' : 'Off'}      color={showMention ? ORANGE : 'var(--dash-text-muted)'} delay={0.08} />
        <StatCard label="Theme"     value={darkMode ? 'Dark' : 'Light'}     color={PURPLE}  delay={0.12} />
      </Flex>

      {/* ── Body ── */}
      <Flex gap={5} flexWrap="wrap" align="flex-start">

        {/* ── Left: controls ── */}
        <Flex direction="column" gap={5} flex="1" minW="300px">

          {/* Sender details */}
          <Card accentColor={ACCENT} px={5} pt={5} pb={5}>
            <Label>Sender Details</Label>
            <Flex direction="column" gap={4} mt={3}>
              <Box>
                <Label>Display Name</Label>
                <Input {...inputSx} value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="Karin Blair" />
              </Box>

              <Box>
                <Flex align="center" justify="space-between" mb={1.5}>
                  <Label>Subtitle</Label>
                  <Flex align="center" gap={2}>
                    <Text fontSize="10px" color="var(--dash-text-muted)">Auto</Text>
                    <Switch size="sm" isChecked={autoSub}
                      onChange={e => setAutoSub(e.target.checked)}
                      colorScheme="blue" />
                  </Flex>
                </Flex>
                <Input {...inputSx} value={autoSub ? subtitle : customSub}
                  isDisabled={autoSub}
                  onChange={e => setCustomSub(e.target.value)}
                  placeholder={`Chat with ${senderName || 'Sender Name'}`}
                  opacity={autoSub ? 0.5 : 1}
                />
              </Box>
            </Flex>
          </Card>

          {/* Message */}
          <Card accentColor={PURPLE} px={5} pt={5} pb={5}>
            <Label>Message</Label>
            <Box pos="relative" mt={3}>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                bg="rgba(255,255,255,0.05)"
                border="1px solid rgba(255,255,255,0.1)"
                borderRadius="10px"
                px={4} py={3}
                fontSize="sm"
                color="var(--dash-text-primary)"
                resize="none"
                rows={3}
                _placeholder={{ color: 'var(--dash-text-muted)' }}
                _hover={{ border: `1px solid ${PURPLE}50` }}
                _focus={{ border: `1px solid ${PURPLE}80`, boxShadow: `0 0 0 1px ${PURPLE}40` }}
                placeholder="Hey @User! I'd love to pull you into…"
              />
              <Text pos="absolute" bottom={2} right={3} fontSize="10px"
                color={charLeft < 0 ? RED : 'var(--dash-text-muted)'}>
                {message.length}/52 preview chars
              </Text>
            </Box>
          </Card>

          {/* Avatar */}
          <Card accentColor={GREEN} px={5} pt={5} pb={5}>
            <Label>Profile Picture</Label>
            <Flex gap={3} mt={3} align="center">
              {/* Preview circle */}
              <Box w="48px" h="48px" borderRadius="full" overflow="hidden"
                bg="#6264a7" border="2px solid rgba(255,255,255,0.1)" flexShrink={0}
                display="flex" alignItems="center" justifyContent="center">
                {avatarSrc
                  ? <Box as="img" src={avatarSrc} w="100%" h="100%" objectFit="cover" />
                  : <Text fontSize="18px" fontWeight="bold" color="white">
                      {senderName.charAt(0).toUpperCase() || '?'}
                    </Text>
                }
              </Box>
              <Flex direction="column" gap={2} flex="1">
                <input type="file" accept="image/*" ref={fileRef}
                  style={{ display: 'none' }} onChange={handleFile} />
                <Button size="sm" leftIcon={<AttachmentIcon />}
                  bg="rgba(255,255,255,0.06)" color="var(--dash-text-secondary)"
                  border="1px solid rgba(255,255,255,0.1)"
                  _hover={{ bg: 'rgba(255,255,255,0.1)', color: 'white' }}
                  borderRadius="8px" fontSize="12px"
                  onClick={() => fileRef.current?.click()}>
                  Upload Image
                </Button>
                {avatarSrc && (
                  <Button size="sm" variant="ghost"
                    color={RED} _hover={{ bg: `${RED}15` }}
                    borderRadius="8px" fontSize="12px"
                    onClick={() => setAvatarSrc('')}>
                    Remove
                  </Button>
                )}
              </Flex>
            </Flex>
          </Card>

          {/* Options */}
          <Card accentColor={ORANGE} px={5} pt={5} pb={5}>
            <Label>Options</Label>
            <Flex direction="column" gap={3} mt={3}>
              <Flex align="center" justify="space-between">
                <Box>
                  <Text fontSize="13px" color="var(--dash-text-primary)">Show @ mention badge</Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)">Orange @ icon on avatar</Text>
                </Box>
                <Switch isChecked={showMention}
                  onChange={e => setShowMention(e.target.checked)}
                  colorScheme="orange" />
              </Flex>
              <Flex align="center" justify="space-between">
                <Box>
                  <Text fontSize="13px" color="var(--dash-text-primary)">Dark mode body</Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)">Switches notification body theme</Text>
                </Box>
                <Switch isChecked={darkMode}
                  onChange={e => setDarkMode(e.target.checked)}
                  colorScheme="purple" />
              </Flex>
            </Flex>
          </Card>
        </Flex>

        {/* ── Right: preview ── */}
        <Flex direction="column" gap={5} flex="1" minW="300px">
          <Card accentColor={ORANGE} px={5} pt={5} pb={6}>
            <Label>Live Preview</Label>
            {/* Simulated desktop wallpaper */}
            <Flex
              justify="flex-end" align="flex-end"
              bg="linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
              borderRadius="10px" p={4} mt={3}
              minH="180px" pos="relative"
            >
              {/* Fake taskbar */}
              <Box pos="absolute" bottom={0} left={0} right={0} h="32px"
                bg="rgba(0,0,0,0.6)" borderRadius="0 0 10px 10px" />
              {/* Popup bottom-right */}
              <Box mb="36px">
                <TeamsPopup
                  senderName={senderName}
                  subtitle={subtitle}
                  message={message}
                  avatarSrc={avatarSrc}
                  showMention={showMention}
                  darkMode={darkMode}
                />
              </Box>
            </Flex>
            <Text textAlign="center" mt={4} fontSize="10px" color="var(--dash-text-muted)">
              Live preview — updates in real time as you edit
            </Text>
          </Card>

          {/* Export note */}
          <Card accentColor={RED} px={5} pt={4} pb={4}>
            <Flex align="center" gap={2} mb={2}>
              <Box w="6px" h="6px" borderRadius="full" bg={RED} boxShadow={`0 0 6px ${RED}`} />
              <Text fontSize="10px" fontWeight="bold" letterSpacing="widest" color={RED} textTransform="uppercase">
                Usage Notice
              </Text>
            </Flex>
            <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="1.7">
              Use exclusively for <Text as="span" color="white" fontWeight="bold">authorized</Text> security
              awareness training, phishing simulation campaigns, and social engineering assessments
              with written client permission.
            </Text>
          </Card>
        </Flex>
      </Flex>
    </MotionBox>
  );
};

export default FakeTeamsView;
