import { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Input, IconButton, Spinner, Button,
  useToast, Switch,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, CloseIcon, SettingsIcon, InfoIcon, RepeatIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Theme ──────────────────────────────────────────────────────────────────────
const TG    = '#2AABEE';
const TG_S  = 'rgba(42,171,238,0.08)';
const TG_B  = 'rgba(42,171,238,0.22)';
const GREEN = '#68D391';
const RED   = '#FC8181';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const tgApi = (engId, path, opts = {}) =>
  fetch(`/api/telegram/${engId}${path}`, { headers: authHeaders(), ...opts }).then(r => r.json());

const fmtRelative = (iso) => {
  if (!iso) return '';
  const diff  = Date.now() - new Date(iso);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ── Telegram SVG icon ──────────────────────────────────────────────────────────
const TelegramIcon = ({ size = '20px', color = TG }) => (
  <Box as="svg" viewBox="0 0 24 24" w={size} h={size} fill={color} flexShrink={0}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.607c-.15.658-.543.818-1.1.508l-3.037-2.237-1.466 1.41c-.162.162-.297.297-.608.297l.216-3.073 5.577-5.037c.243-.216-.054-.336-.373-.12L6.54 14.748l-2.98-.93c-.648-.203-.66-.648.135-.96l11.638-4.488c.54-.197 1.013.12.83.878z"/>
  </Box>
);

// ── Bot Token section (Email-Harvester "Update Key" style) ─────────────────────
const BotTokenSection = ({ engId, maskedToken, onSaved }) => {
  const [open,    setOpen]    = useState(false);
  const [val,     setVal]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [ok,      setOk]      = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (!val.trim()) return;
    setSaving(true); setErr(''); setOk(false);
    try {
      const data = await tgApi(engId, '/config', {
        method: 'POST', body: JSON.stringify({ botToken: val.trim() }),
      });
      if (data.error) throw new Error(data.error);
      setOk(true); setVal(''); setOpen(false);
      toast({ title: 'Bot token saved', status: 'success', duration: 2000, isClosable: true });
      onSaved?.(data);
    } catch (e) { setErr(e.message); }
    setSaving(false);
  };

  return (
    <Box px={4} py={3} borderRadius="10px"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" overflow="hidden">
      <Flex align="center" justify="space-between" gap={3}>
        <Flex align="center" gap={2}>
          <SettingsIcon boxSize={3} color={TG} />
          <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider">
            Bot Token
          </Text>
        </Flex>
        <Flex align="center" gap={2}>
          {maskedToken && !open && (
            <Flex align="center" gap={1.5}>
              <CheckIcon boxSize={2.5} color={GREEN} />
              <Text fontSize="11px" color={GREEN} fontFamily="mono">{maskedToken}</Text>
            </Flex>
          )}
          <Button size="xs" variant="ghost" fontSize="10px" borderRadius="6px"
            color={TG} border={`1px solid ${TG_B}`}
            _hover={{ bg: TG_S }}
            onClick={() => { setOpen(p => !p); setErr(''); setOk(false); }}>
            {open ? 'Cancel' : maskedToken ? 'Update Token' : 'Set Token'}
          </Button>
        </Flex>
      </Flex>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
            <Box pt={3} borderTop="1px solid var(--dash-card-border)" mt={3}>
              <Text fontSize="11px" color="var(--dash-text-muted)" mb={2}>
                Paste your Telegram bot token from{' '}
                <Text as="span" color={TG}>@BotFather</Text>
              </Text>
              <Flex gap={2}>
                <Input value={val} onChange={e => setVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="123456789:ABCDEFghijklmnop…"
                  type="password" size="sm" borderRadius="8px"
                  fontFamily="mono" fontSize="12px"
                  bg="rgba(0,0,0,0.25)" borderColor="var(--dash-card-border)"
                  _placeholder={{ color: 'var(--dash-text-muted)', fontFamily: 'sans-serif' }}
                  _focus={{ borderColor: TG, boxShadow: `0 0 0 1px ${TG}44` }}
                />
                <Button size="sm" px={5} borderRadius="8px" fontWeight="bold" fontSize="12px"
                  bg={`${TG}20`} color={TG} border={`1px solid ${TG}50`}
                  _hover={{ bg: `${TG}35` }} isLoading={saving} onClick={handleSave} flexShrink={0}>
                  Save
                </Button>
              </Flex>
              {err && <Text fontSize="11px" color={RED} mt={1.5}>{err}</Text>}
              {ok  && <Text fontSize="11px" color={GREEN} mt={1.5}>Token saved successfully.</Text>}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

// ── Chat ID section ────────────────────────────────────────────────────────────
const ChatIdSection = ({ engId, chatId, onSaved }) => {
  const [open,       setOpen]       = useState(false);
  const [val,        setVal]        = useState('');
  const [saving,     setSaving]     = useState(false);
  const [detecting,  setDetecting]  = useState(false);
  const [err,        setErr]        = useState('');
  const toast = useToast();

  const handleSave = async () => {
    if (!val.trim()) return;
    setSaving(true); setErr('');
    try {
      const data = await tgApi(engId, '/config', {
        method: 'POST', body: JSON.stringify({ chatId: val.trim() }),
      });
      if (data.error) throw new Error(data.error);
      setVal(''); setOpen(false);
      toast({ title: 'Chat ID saved', status: 'success', duration: 2000, isClosable: true });
      onSaved?.(data);
    } catch (e) { setErr(e.message); }
    setSaving(false);
  };

  const handleDetect = async () => {
    setDetecting(true); setErr('');
    try {
      const data = await tgApi(engId, '/detect-chat', { method: 'POST', body: '{}' });
      if (data.error) throw new Error(data.error);
      toast({ title: `Chat ID detected: ${data.chatId}`, status: 'success', duration: 3000, isClosable: true });
      onSaved?.({ chatId: data.chatId });
    } catch (e) { setErr(e.message); }
    setDetecting(false);
  };

  return (
    <Box px={4} py={3} borderRadius="10px"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" overflow="hidden">
      <Flex align="center" justify="space-between" gap={3}>
        <Flex align="center" gap={2}>
          <SettingsIcon boxSize={3} color={TG} />
          <Box>
            <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider">
              Chat ID
            </Text>
            {chatId && (
              <Text fontSize="10px" color="var(--dash-text-muted)" fontFamily="mono" mt={0.5}>
                {chatId}
              </Text>
            )}
          </Box>
        </Flex>
        <Flex align="center" gap={1.5}>
          <Button size="xs" variant="ghost" fontSize="10px" borderRadius="6px"
            color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.1)"
            _hover={{ color: TG, borderColor: TG_B }}
            isLoading={detecting} onClick={handleDetect}>
            Auto-detect
          </Button>
          <Button size="xs" variant="ghost" fontSize="10px" borderRadius="6px"
            color={TG} border={`1px solid ${TG_B}`} _hover={{ bg: TG_S }}
            onClick={() => { setOpen(p => !p); setErr(''); }}>
            {open ? 'Cancel' : chatId ? 'Update' : 'Set ID'}
          </Button>
        </Flex>
      </Flex>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
            <Box pt={3} borderTop="1px solid var(--dash-card-border)" mt={3}>
              <Flex gap={2}>
                <Input value={val} onChange={e => setVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="e.g. 123456789"
                  size="sm" borderRadius="8px" fontFamily="mono" fontSize="12px"
                  bg="rgba(0,0,0,0.25)" borderColor="var(--dash-card-border)"
                  _placeholder={{ color: 'var(--dash-text-muted)', fontFamily: 'sans-serif' }}
                  _focus={{ borderColor: TG, boxShadow: `0 0 0 1px ${TG}44` }}
                />
                <Button size="sm" px={5} borderRadius="8px" fontWeight="bold" fontSize="12px"
                  bg={`${TG}20`} color={TG} border={`1px solid ${TG}50`}
                  _hover={{ bg: `${TG}35` }} isLoading={saving} onClick={handleSave} flexShrink={0}>
                  Save
                </Button>
              </Flex>
              {err && <Text fontSize="11px" color={RED} mt={1.5}>{err}</Text>}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

// ── Alert log entry ────────────────────────────────────────────────────────────
const SEVERITY_COLOR = {
  Critical: '#FC8181', High: '#F6AD55', Medium: '#F6E05E',
  Low: '#76E4F7', Info: '#9F7AEA',
};
const SEVERITY_BG = {
  Critical: 'rgba(252,129,129,0.1)', High: 'rgba(246,173,85,0.1)',
  Medium: 'rgba(246,224,94,0.1)', Low: 'rgba(118,228,247,0.1)',
  Info: 'rgba(159,122,234,0.1)',
};

const AlertEntry = ({ entry }) => {
  const sev = entry.severity || 'Info';
  return (
    <Flex align="flex-start" gap={3} px={4} py={3}
      borderBottom="1px solid rgba(255,255,255,0.04)"
      _hover={{ bg: 'rgba(255,255,255,0.02)' }} transition="all 0.12s">
      <Box mt="3px" px={2} py="1px" borderRadius="5px" fontSize="9px" fontWeight="bold"
        bg={SEVERITY_BG[sev]} color={SEVERITY_COLOR[sev]} flexShrink={0}
        border={`1px solid ${SEVERITY_COLOR[sev]}30`}>
        {sev.toUpperCase()}
      </Box>
      <Box flex="1" minW={0}>
        <Text fontSize="12px" color="var(--dash-text-primary)" noOfLines={1}>
          {entry.title || 'Untitled finding'}
        </Text>
        <Text fontSize="10px" color="var(--dash-text-muted)" mt={0.5}>
          {entry.engagementName || '—'} · {fmtRelative(entry.sentAt)}
        </Text>
      </Box>
      <Box w="6px" h="6px" borderRadius="full" bg={TG} mt="5px" flexShrink={0} opacity={0.8} />
    </Flex>
  );
};

// ── Main view ──────────────────────────────────────────────────────────────────
const WebhookAlerterView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const [cfg,       setCfg]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [testing,   setTesting]   = useState(false);
  const [toggling,  setToggling]  = useState(false);
  const [alertLog,  setAlertLog]  = useState([]);

  const loadAlerts = useCallback(async () => {
    if (!engId) return;
    try {
      const data = await tgApi(engId, '/alerts');
      if (Array.isArray(data)) setAlertLog(data);
    } catch (_) {}
  }, [engId]);

  const load = useCallback(async () => {
    if (!engId) return;
    setLoading(true);
    try {
      const [cfgData] = await Promise.all([
        tgApi(engId, '/config'),
        loadAlerts(),
      ]);
      setCfg(cfgData);
    } catch (_) {}
    setLoading(false);
  }, [engId, loadAlerts]);

  useEffect(() => { load(); }, [load]);

  const handleCfgUpdate = (partial) => {
    setCfg(prev => ({ ...prev, ...partial }));
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const data = await tgApi(engId, '/config', {
        method: 'POST', body: JSON.stringify({ enabled: !cfg?.enabled }),
      });
      if (data.error) throw new Error(data.error);
      setCfg(data);
    } catch (e) {
      toast({ title: 'Error', description: e.message, status: 'error', duration: 3000, isClosable: true });
    }
    setToggling(false);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const data = await tgApi(engId, '/test', { method: 'POST', body: '{}' });
      if (data.error) throw new Error(data.error);
      toast({ title: 'Test sent!', description: 'Check your Telegram.', status: 'success', duration: 3000, isClosable: true });
      await loadAlerts(); // refresh from server
    } catch (e) {
      toast({ title: 'Failed', description: e.message, status: 'error', duration: 4000, isClosable: true });
    }
    setTesting(false);
  };

  const isConfigured = cfg?.configured;
  const isEnabled    = cfg?.enabled;
  const isActive     = isConfigured && isEnabled;

  return (
    <Flex direction="column" h="100%" overflow="hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" px={6} pt={5} pb={4}
        borderBottom="1px solid var(--dash-card-border)" flexShrink={0} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Webhook <Text as="span" color="red.400">Alerter</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng?.name} · Telegram finding notifications ·{' '}
            <Text as="span" color={isActive ? TG : 'var(--dash-text-muted)'} fontWeight="semibold">
              {isActive ? 'Active' : isConfigured ? 'Paused' : 'Not set up'}
            </Text>
          </Text>
        </Box>

        {isConfigured && (
          <Flex align="center" gap={2} mt={1}>
            <Switch isChecked={isEnabled} onChange={handleToggle} isDisabled={toggling}
              sx={{ '& .chakra-switch__track': { bg: isEnabled ? TG : 'rgba(255,255,255,0.1)' } }} />
            <Text fontSize="11px" color="var(--dash-text-muted)">
              {isEnabled ? 'Enabled' : 'Paused'}
            </Text>
          </Flex>
        )}
      </Flex>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <Flex flex="1" align="center" justify="center">
          <Spinner color={TG} size="lg" />
        </Flex>
      ) : (
        <Flex flex="1" overflow="hidden">
          {/* Left column — config */}
          <Box flex="1" overflowY="auto" px={6} py={5} minW={0}
            css={{
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '4px' },
            }}>

            {/* Info banner */}
            <MotionBox mb={5} px={4} py={3} borderRadius="10px"
              bg="rgba(42,171,238,0.06)" border={`1px solid ${TG_B}`}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Flex align="center" gap={2} mb={2}>
                <InfoIcon boxSize={3} color={TG} />
                <Text fontSize="10px" fontWeight="bold" color={TG}
                  textTransform="uppercase" letterSpacing="wider">
                  How it works
                </Text>
              </Flex>
              <Flex gap={4} flexWrap="wrap">
                {[
                  'Sends a Telegram message when a new finding is added',
                  'Includes severity, title, and engagement name',
                  'Non-blocking — never delays finding saves',
                ].map(t => (
                  <Flex key={t} align="center" gap={1.5}>
                    <Box w="4px" h="4px" borderRadius="full" bg={TG} flexShrink={0} />
                    <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
                  </Flex>
                ))}
              </Flex>
            </MotionBox>

            {/* Config cards */}
            <Flex direction="column" gap={3}>
              <BotTokenSection engId={engId} maskedToken={cfg?.maskedToken} onSaved={handleCfgUpdate} />
              <ChatIdSection   engId={engId} chatId={cfg?.chatId}           onSaved={handleCfgUpdate} />

              {/* Setup steps — only when not configured */}
              {!isConfigured && (
                <MotionBox px={4} py={3} borderRadius="10px" bg={TG_S} border={`1px solid ${TG_B}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                  <Text fontSize="10px" fontWeight="bold" color={TG}
                    textTransform="uppercase" letterSpacing="wider" mb={2}>
                    Setup Steps
                  </Text>
                  {[
                    '1. Create a bot via @BotFather — copy the token',
                    '2. Set the bot token above',
                    '3. Open Telegram and send /start to your bot',
                    '4. Click "Auto-detect" to fetch your Chat ID automatically',
                    '5. Send a test notification to verify everything works',
                  ].map(s => (
                    <Flex key={s} align="center" gap={2} mb={1}>
                      <Box w="4px" h="4px" borderRadius="full" bg={TG} flexShrink={0} />
                      <Text fontSize="11px" color="var(--dash-text-muted)">{s}</Text>
                    </Flex>
                  ))}
                </MotionBox>
              )}

              {/* Test button — when configured */}
              {isConfigured && (
                <MotionBox px={4} py={3} borderRadius="10px"
                  bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <Flex align="center" justify="space-between">
                    <Box>
                      <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)">
                        Test Notification
                      </Text>
                      <Text fontSize="10px" color="var(--dash-text-muted)" mt={0.5}>
                        Send a sample message to verify the integration
                      </Text>
                    </Box>
                    <Button size="sm" px={5} borderRadius="8px" fontWeight="semibold" fontSize="12px"
                      bg={`${TG}18`} color={TG} border={`1px solid ${TG_B}`}
                      _hover={{ bg: `${TG}30` }} isLoading={testing} onClick={handleTest}>
                      Send Test
                    </Button>
                  </Flex>
                </MotionBox>
              )}

              {/* Active status card */}
              {isActive && (
                <MotionBox px={4} py={3} borderRadius="10px"
                  bg={`${TG}08`} border={`1px solid ${TG}30`}
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                  <Flex align="center" gap={3}>
                    <Flex w="32px" h="32px" borderRadius="8px" align="center" justify="center"
                      bg={`${TG}18`} border={`1px solid ${TG_B}`} flexShrink={0}>
                      <CheckIcon boxSize={3} color={TG} />
                    </Flex>
                    <Box>
                      <Text fontSize="12px" fontWeight="semibold" color={TG}>
                        Alerts are live
                      </Text>
                      <Text fontSize="10px" color="var(--dash-text-muted)" mt={0.5}>
                        You'll receive Telegram messages for every new finding
                      </Text>
                    </Box>
                  </Flex>
                </MotionBox>
              )}
            </Flex>
          </Box>

          {/* Right panel — alert log */}
          <Box w="300px" flexShrink={0} borderLeft="1px solid var(--dash-card-border)"
            display="flex" flexDirection="column" overflow="hidden">
            <Flex align="center" justify="space-between" px={4} py={3}
              borderBottom="1px solid var(--dash-card-border)" flexShrink={0}>
              <Flex align="center" gap={2}>
                <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider">
                  Alert Log
                </Text>
                {alertLog.length > 0 && (
                  <Box px={1.5} py="1px" borderRadius="full" fontSize="9px" fontWeight="bold"
                    bg={`${TG}18`} color={TG} border={`1px solid ${TG_B}`}>
                    {alertLog.length}
                  </Box>
                )}
              </Flex>
              <Flex gap={1}>
                <IconButton icon={<RepeatIcon boxSize={2.5} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" _hover={{ color: TG, bg: TG_S }}
                  aria-label="Refresh log" onClick={loadAlerts} />
                {alertLog.length > 0 && (
                  <IconButton icon={<CloseIcon boxSize={2} />} size="xs" variant="ghost"
                    color="var(--dash-text-muted)" _hover={{ color: RED, bg: 'rgba(255,80,80,0.08)' }}
                    aria-label="Clear log"
                    onClick={async () => {
                      await tgApi(engId, '/alerts', { method: 'DELETE' });
                      setAlertLog([]);
                    }} />
                )}
              </Flex>
            </Flex>

            <Box flex="1" overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { width: '3px' },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '3px' },
              }}>
              {alertLog.length === 0 ? (
                <Flex direction="column" align="center" justify="center" h="100%" gap={3} opacity={0.4} px={4}>
                  <TelegramIcon size="32px" color="var(--dash-text-muted)" />
                  <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center">
                    Sent alerts will appear here
                  </Text>
                </Flex>
              ) : (
                <AnimatePresence>
                  {alertLog.map((entry, i) => (
                    <MotionBox key={i}
                      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.03 }}>
                      <AlertEntry entry={entry} />
                    </MotionBox>
                  ))}
                </AnimatePresence>
              )}
            </Box>
          </Box>
        </Flex>
      )}
    </Flex>
  );
};

export default WebhookAlerterView;
