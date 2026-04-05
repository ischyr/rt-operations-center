import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, Input, IconButton,
  Spinner, Tooltip, Badge, Modal, ModalOverlay, ModalContent,
  ModalBody, useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RepeatIcon, DeleteIcon, SearchIcon, StarIcon, CheckIcon, CloseIcon, CopyIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox  = motion(Box);
const MotionFlex = motion(Flex);

// ── Theme ──────────────────────────────────────────────────────────────────────
const GREEN   = '#25D366';
const GLOW    = 'rgba(37,211,102,0.18)';
const GREEN_S = 'rgba(37,211,102,0.12)';
const MUTED   = 'var(--dash-text-muted)';
const BORDER  = 'rgba(255,255,255,0.07)';
const CARD    = 'rgba(255,255,255,0.04)';

// ── WhatsApp SVG path ──────────────────────────────────────────────────────────
const WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';
const WaIcon = ({ size = '20px', color = GREEN }) => (
  <Box as="svg" viewBox="0 0 24 24" w={size} h={size} fill={color} flexShrink={0}><path d={WA_PATH}/></Box>
);

// ── API helper ─────────────────────────────────────────────────────────────────
const api = (path, opts = {}) => {
  const tok = localStorage.getItem('token');
  return fetch(`/api/white-team${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}`, ...(opts.headers || {}) },
    ...opts,
  }).then(r => r.json());
};

// ── Avatar helpers ─────────────────────────────────────────────────────────────
const PALETTE = ['#E57373','#F06292','#BA68C8','#9575CD','#7986CB','#64B5F6','#4FC3F7','#4DD0E1','#4DB6AC','#81C784','#AED581','#FFD54F','#FFB74D','#FF8A65','#A1887F','#90A4AE'];
const nameColor = (name = '') => { let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return PALETTE[Math.abs(h) % PALETTE.length]; };
const initials = (name = '') => { const p = name.trim().split(/\s+/); return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length-1][0]).toUpperCase(); };

// ── Timestamps ─────────────────────────────────────────────────────────────────
const fmtTime = ts => { if (!ts) return ''; const d = new Date(ts*1000); const diff = Math.floor((Date.now()-d)/86400000); if (diff===0) return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); if (diff===1) return 'Yesterday '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); return d.toLocaleDateString([],{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); };
const fmtDate = ts => { if (!ts) return ''; const d = new Date(ts*1000); const diff = Math.floor((Date.now()-d)/86400000); if (diff===0) return 'Today'; if (diff===1) return 'Yesterday'; return d.toLocaleDateString([],{weekday:'long',day:'2-digit',month:'long',year:'numeric'}); };

// ── Status pill ────────────────────────────────────────────────────────────────
const STATUS_META = {
  disconnected:  { label: 'Disconnected', color: '#9CA3AF' },
  connecting:    { label: 'Connecting…',  color: '#F6AD55' },
  qr_ready:      { label: 'Scan QR Code', color: '#63B3ED' },
  authenticated: { label: 'Connected',    color: GREEN     },
};
const StatusPill = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.disconnected;
  const pulse = status === 'connecting' || status === 'qr_ready';
  return (
    <Flex align="center" gap={2} px={3} py="4px" borderRadius="full" bg={`${m.color}14`} border={`1px solid ${m.color}35`} flexShrink={0}>
      <Box w="6px" h="6px" borderRadius="full" bg={m.color} boxShadow={`0 0 6px ${m.color}80`}
        sx={pulse ? { animation: 'wt-pulse 1.4s ease-in-out infinite' } : {}} />
      <Text fontSize="11px" fontWeight="semibold" color={m.color} letterSpacing="wide">{m.label}</Text>
    </Flex>
  );
};

// ── Avatar ─────────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = '32px' }) => (
  <Box w={size} h={size} borderRadius="full" flexShrink={0} bg={nameColor(name)}
    display="flex" alignItems="center" justifyContent="center" fontSize="11px" fontWeight="bold" color="white">
    {initials(name)}
  </Box>
);

// ── Message bubble ─────────────────────────────────────────────────────────────
const Bubble = ({ msg, onStar, onCopy }) => {
  const [hov, setHov] = useState(false);
  const isSystem = ['e2e_notification','notification_template','call_log'].includes(msg.type);
  if (isSystem) return (
    <Flex justify="center" my={1}>
      <Text fontSize="10px" color={MUTED} px={3} py={1} bg="rgba(255,255,255,0.04)" borderRadius="full">{msg.body||'[System]'}</Text>
    </Flex>
  );
  return (
    <MotionBox initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.15 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} position="relative">
      <Flex gap={2.5} align="flex-start" px={4} py="4px" borderRadius="8px"
        _hover={{ bg:'rgba(255,255,255,0.025)' }} transition="background 0.12s">
        <Box pt="2px"><Avatar name={msg.fromName||msg.from} /></Box>
        <Box flex="1" minW={0}>
          <Flex align="baseline" gap={2} mb="1px">
            <Text fontSize="13px" fontWeight="semibold" color={nameColor(msg.fromName||msg.from)}>
              {msg.fromName||msg.from||'Unknown'}
            </Text>
            <Text fontSize="10px" color={MUTED}>{fmtTime(msg.timestamp)}</Text>
            {msg.isStarred && <StarIcon boxSize={2.5} color="#ECC94B" />}
          </Flex>
          <Text fontSize="13px" color="rgba(255,255,255,0.85)" lineHeight="1.55" whiteSpace="pre-wrap" wordBreak="break-word">
            {msg.hasMedia && !msg.body ? <Text as="span" color={MUTED} fontStyle="italic">[{msg.type||'media'}]</Text> : msg.body}
          </Text>
        </Box>
        <AnimatePresence>
          {hov && (
            <MotionFlex initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.9 }} transition={{ duration:0.08 }}
              position="absolute" right="12px" top="2px"
              bg="var(--dash-card-bg)" border={`1px solid ${BORDER}`} borderRadius="8px" p={1} gap={0.5} align="center"
              boxShadow="0 4px 16px rgba(0,0,0,0.5)">
              <Tooltip label={msg.isStarred?'Unstar':'Star'} hasArrow fontSize="10px">
                <IconButton icon={<StarIcon/>} size="xs" variant="ghost"
                  color={msg.isStarred?'#ECC94B':MUTED} _hover={{color:'#ECC94B',bg:'rgba(236,201,75,0.1)'}}
                  onClick={() => onStar(msg.id)} aria-label="star"/>
              </Tooltip>
              <Tooltip label="Copy" hasArrow fontSize="10px">
                <IconButton icon={<CopyIcon/>} size="xs" variant="ghost"
                  color={MUTED} _hover={{color:'white',bg:'rgba(255,255,255,0.08)'}}
                  onClick={() => onCopy(msg.body)} aria-label="copy"/>
              </Tooltip>
            </MotionFlex>
          )}
        </AnimatePresence>
      </Flex>
    </MotionBox>
  );
};

// ── Date divider ───────────────────────────────────────────────────────────────
const DateDivider = ({ label }) => (
  <Flex align="center" gap={3} px={4} py={2} my={1}>
    <Box flex="1" h="1px" bg={BORDER}/>
    <Text fontSize="10px" color={MUTED} fontWeight="semibold" px={2} py={1}
      bg="rgba(255,255,255,0.04)" borderRadius="full" flexShrink={0}>{label}</Text>
    <Box flex="1" h="1px" bg={BORDER}/>
  </Flex>
);

// ── Disconnected panel ─────────────────────────────────────────────────────────
const DisconnectedPanel = ({ onConnect, loading }) => (
  <Flex direction="column" align="center" justify="center" h="100%" gap={6}>
    <MotionBox initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.3 }}
      position="relative" mb={2}>
      <Box w="80px" h="80px" borderRadius="full" bg={GREEN_S} border={`2px solid ${GREEN}60`}
        display="flex" alignItems="center" justifyContent="center"
        boxShadow={`0 0 24px ${GLOW}, 0 0 0 4px ${GREEN}18`}>
        <WaIcon size="40px"/>
      </Box>
      {/* Ring 1 */}
      <Box position="absolute" inset="-14px" borderRadius="full"
        border={`2px solid ${GREEN}55`}
        boxShadow={`0 0 12px ${GREEN}30`}
        sx={{ animation: 'wt-ping 2s cubic-bezier(0,0,0.2,1) infinite' }}/>
      {/* Ring 2 */}
      <Box position="absolute" inset="-28px" borderRadius="full"
        border={`2px solid ${GREEN}30`}
        boxShadow={`0 0 8px ${GREEN}20`}
        sx={{ animation: 'wt-ping 2s cubic-bezier(0,0,0.2,1) 0.55s infinite' }}/>
      {/* Ring 3 */}
      <Box position="absolute" inset="-44px" borderRadius="full"
        border={`1px solid ${GREEN}18`}
        sx={{ animation: 'wt-ping 2s cubic-bezier(0,0,0.2,1) 1.1s infinite' }}/>
    </MotionBox>

    <MotionBox initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:0.1 }}
      textAlign="center">
      <Heading fontSize="22px" fontWeight="bold" color="white" mb={2}>White Team Comms</Heading>
      <Text fontSize="13px" color={MUTED} maxW="360px" lineHeight="1.7">
        Connect a WhatsApp account to monitor your White Team's group chat in real-time.
        All messages are captured and stored per engagement.
      </Text>
    </MotionBox>

    {/* Feature chips */}
    <MotionBox initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:0.18 }}
      w="full" maxW="360px">
      <Flex direction="column" gap={2}>
        {[
          { path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', label: 'Secure QR-based connection' },
          { path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', label: 'Real-time group message capture' },
          { path: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', label: 'Live group refresh — no reconnect needed' },
          { path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69l1.519-4.674z', label: 'Star and search important messages' },
        ].map(({ path, label }) => (
          <Flex key={label} align="center" gap={3} px={4} py="10px"
            bg={CARD} border={`1px solid ${BORDER}`} borderRadius="10px">
            <Box as="svg" viewBox="0 0 24 24" w="13px" h="13px" fill="none"
              stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" flexShrink={0}>
              <path d={path}/>
            </Box>
            <Text fontSize="12px" color={MUTED}>{label}</Text>
          </Flex>
        ))}
      </Flex>
    </MotionBox>

    <MotionBox initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:0.26 }}
      w="full" maxW="360px">
      <Button isLoading={loading} loadingText="Starting…" w="full" h="44px"
        bg={GREEN} color="black" fontWeight="bold" borderRadius="12px"
        leftIcon={<WaIcon size="17px" color="black"/>}
        _hover={{ bg:'#20BD5A', transform:'translateY(-1px)', boxShadow:`0 8px 28px ${GLOW}` }}
        _active={{ transform:'translateY(0)' }} transition="all 0.2s"
        onClick={onConnect}>
        Connect WhatsApp
      </Button>
    </MotionBox>
  </Flex>
);

// ── Connecting panel ───────────────────────────────────────────────────────────
const ConnectingPanel = () => (
  <Flex direction="column" align="center" justify="center" h="100%" gap={4}>
    <Spinner size="xl" color={GREEN} thickness="3px" speed="0.8s"/>
    <Text fontSize="14px" color="white" fontWeight="semibold">Starting WhatsApp session…</Text>
    <Text fontSize="12px" color={MUTED}>Launching browser — this takes about 20–30 seconds</Text>
  </Flex>
);

// ── QR panel ──────────────────────────────────────────────────────────────────
const QRPanel = ({ qrCode, onCancel }) => (
  <Flex direction="column" align="center" justify="center" h="100%" gap={5}>
    <MotionBox initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }} textAlign="center">
      <Heading fontSize="18px" color="white" mb={1.5}>Scan with WhatsApp</Heading>
      <Text fontSize="12px" color={MUTED} maxW="300px">
        Go to <Text as="span" color="white" fontWeight="semibold">Linked Devices</Text> on your phone and scan this code.
      </Text>
    </MotionBox>

    {/* QR frame */}
    <MotionBox initial={{ opacity:0, scale:0.93 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.3, delay:0.1 }}
      position="relative">
      <Box p="14px" bg="white" borderRadius="18px"
        boxShadow={`0 0 40px ${GLOW}, 0 0 0 1px ${GREEN}30`}>
        {qrCode
          ? <Box as="img" src={qrCode} alt="QR" w="200px" h="200px" display="block" borderRadius="8px"/>
          : <Flex w="200px" h="200px" align="center" justify="center"><Spinner size="lg" color={GREEN} thickness="3px"/></Flex>
        }
      </Box>
      {/* Corner accents */}
      {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
        <Box key={`${v}${h}`} position="absolute" w="16px" h="16px"
          top={v==='top' ? '-5px' : undefined} bottom={v==='bottom' ? '-5px' : undefined}
          left={h==='left' ? '-5px' : undefined} right={h==='right' ? '-5px' : undefined}
          borderTop={v==='top' ? `2px solid ${GREEN}` : undefined}
          borderBottom={v==='bottom' ? `2px solid ${GREEN}` : undefined}
          borderLeft={h==='left' ? `2px solid ${GREEN}` : undefined}
          borderRight={h==='right' ? `2px solid ${GREEN}` : undefined}
          borderTopLeftRadius={v==='top'&&h==='left'?'4px':undefined}
          borderTopRightRadius={v==='top'&&h==='right'?'4px':undefined}
          borderBottomLeftRadius={v==='bottom'&&h==='left'?'4px':undefined}
          borderBottomRightRadius={v==='bottom'&&h==='right'?'4px':undefined}/>
      ))}
    </MotionBox>

    {/* Steps row */}
    <Flex gap={5} align="center">
      {[['1','Open WhatsApp'],['2','Linked Devices'],['3','Link a Device']].map(([n,t]) => (
        <Flex key={n} align="center" gap={1.5}>
          <Box w="20px" h="20px" borderRadius="full" bg={GREEN_S} border={`1px solid ${GREEN}40`}
            display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
            <Text fontSize="9px" fontWeight="bold" color={GREEN}>{n}</Text>
          </Box>
          <Text fontSize="10px" color={MUTED}>{t}</Text>
        </Flex>
      ))}
    </Flex>

    <Button size="sm" variant="ghost" color={MUTED} leftIcon={<CloseIcon boxSize={2.5}/>}
      _hover={{ color:'white', bg:'rgba(255,255,255,0.06)' }} onClick={onCancel}>
      Cancel
    </Button>
  </Flex>
);

// ── Group selector panel ───────────────────────────────────────────────────────
const GroupSelector = ({ groups, onSelect, loading, onRefresh, refreshing }) => {
  const [search, setSearch] = useState('');
  const [selId, setSelId]   = useState('');

  const filtered = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  const selGroup = groups.find(g => g.id === selId);

  return (
    // Full-height flex column — no outer scrolling
    <Flex direction="column" h="100%" overflow="hidden">
      {/* Header */}
      <Flex direction="column" align="center" pt={6} pb={4} px={6} gap={1.5} flexShrink={0}>
        <Box w="48px" h="48px" borderRadius="full" bg={GREEN_S} border={`1px solid ${GREEN}30`}
          display="flex" alignItems="center" justifyContent="center" mb={1}>
          <WaIcon size="24px"/>
        </Box>
        <Heading fontSize="16px" fontWeight="bold" color="white">Select White Team Group</Heading>
        <Text fontSize="12px" color={MUTED} textAlign="center" maxW="320px">
          Choose the group where the White Team communicates. Messages will be pulled in real-time.
        </Text>
      </Flex>

      {/* Search + refresh row */}
      <Flex px={6} pb={3} gap={2} align="center" flexShrink={0}>
        <Box flex="1" position="relative">
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
            <SearchIcon boxSize={3} color={MUTED}/>
          </Box>
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search groups…"
            variant="unstyled" bg="rgba(255,255,255,0.05)" border={`1px solid ${BORDER}`}
            borderRadius="10px" px={4} pl={8} h="38px" fontSize="13px" color="white"
            _placeholder={{ color: MUTED }}
            _focus={{ border:`1px solid ${GREEN}60`, boxShadow:`0 0 0 1px ${GREEN}25` }}/>
        </Box>
        <Tooltip label="Refresh group list" hasArrow fontSize="10px">
          <IconButton icon={<RepeatIcon/>} size="sm" variant="ghost"
            color={MUTED} isLoading={refreshing}
            _hover={{ color: GREEN, bg: GREEN_S }}
            onClick={onRefresh} aria-label="refresh groups"
            border={`1px solid ${BORDER}`} borderRadius="10px" h="38px" w="38px"/>
        </Tooltip>
      </Flex>

      {/* Scrollable group list — takes all remaining height */}
      <Box flex="1" overflowY="auto" px={6} minH={0}
        css={{
          '&::-webkit-scrollbar': { width:'3px' },
          '&::-webkit-scrollbar-thumb': { background:'rgba(255,255,255,0.1)', borderRadius:'3px' },
        }}>
        {filtered.length === 0
          ? (
            <Flex direction="column" align="center" justify="center" h="120px" gap={2} opacity={0.5}>
              <SearchIcon boxSize={5} color={MUTED}/>
              <Text fontSize="12px" color={MUTED}>{groups.length === 0 ? 'No groups found — try refreshing' : 'No groups match your search'}</Text>
            </Flex>
          )
          : filtered.map(g => (
            <Flex key={g.id} align="center" gap={3} px={3} py="9px" mb={1}
              borderRadius="10px" cursor="pointer"
              bg={selId === g.id ? GREEN_S : 'transparent'}
              border={selId === g.id ? `1px solid ${GREEN}40` : '1px solid transparent'}
              _hover={{ bg: selId === g.id ? GREEN_S : 'rgba(255,255,255,0.04)' }}
              transition="all 0.15s"
              onClick={() => setSelId(g.id)}>
              <Box w="36px" h="36px" borderRadius="full" flexShrink={0}
                bg={nameColor(g.name)} display="flex" alignItems="center" justifyContent="center"
                fontSize="13px" fontWeight="bold" color="white">
                {initials(g.name)}
              </Box>
              <Box flex="1" minW={0}>
                <Text fontSize="13px" fontWeight="semibold" color="white" noOfLines={1}>{g.name}</Text>
                <Text fontSize="11px" color={MUTED}>{g.participantCount} participants</Text>
              </Box>
              {selId === g.id && <CheckIcon boxSize={3.5} color={GREEN}/>}
            </Flex>
          ))
        }
      </Box>

      {/* Fixed bottom button */}
      <Box px={6} pt={3} pb={5} flexShrink={0} borderTop={`1px solid ${BORDER}`}>
        <Button w="full" h="42px" isDisabled={!selId || loading} isLoading={loading}
          bg={GREEN} color="black" fontWeight="bold" borderRadius="10px"
          _hover={{ bg:'#20BD5A', transform:'translateY(-1px)', boxShadow:`0 6px 20px ${GLOW}` }}
          _active={{ transform:'translateY(0)' }} _disabled={{ opacity:0.4, cursor:'not-allowed' }}
          transition="all 0.2s"
          onClick={() => selGroup && onSelect(selGroup.id, selGroup.name)}>
          Monitor This Group
        </Button>
      </Box>
    </Flex>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const WhiteTeamView = () => {
  const { slug }       = useParams();
  const { getBySlug }  = useEngagements();
  const eng            = getBySlug(slug);
  const engId          = eng?._id;
  const toast          = useToast();
  const bottomRef      = useRef(null);
  const groupPollRef   = useRef(null);
  const msgPollRef     = useRef(null);
  const statusPollRef  = useRef(null);

  const [status,      setStatus]      = useState('disconnected');
  const [qrCode,      setQrCode]      = useState('');
  const [groups,      setGroups]      = useState([]);
  const [messages,    setMessages]    = useState([]);
  const [selGroupId,  setSelGroupId]  = useState('');
  const [selGroupName,setGroupName]   = useState('');
  const [lastSync,    setLastSync]    = useState(null);
  const [msgCount,    setMsgCount]    = useState(0);
  const [search,      setSearch]      = useState('');
  const [tab,         setTab]         = useState('all');
  const [syncing,     setSyncing]     = useState(false);
  const [connecting,  setConnecting]  = useState(false);
  const [selecting,   setSelecting]   = useState(false);
  const [showGroups,  setShowGroups]  = useState(false);
  const [refreshingG, setRefreshingG] = useState(false);

  // ── Fetch helpers ─────────────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    if (!engId) return;
    try {
      const d = await api(`/${engId}/status`);
      setStatus(d.status || 'disconnected');
      setQrCode(d.qrCode || '');
      setGroups(d.groups || []);
      setSelGroupId(d.selectedGroupId || '');
      setGroupName(d.selectedGroupName || '');
      setLastSync(d.lastSyncAt);
      setMsgCount(d.messageCount || 0);
    } catch {}
  }, [engId]);

  const fetchMessages = useCallback(async () => {
    if (!engId) return;
    try {
      const d = await api(`/${engId}/messages`);
      setMessages(d.messages || []);
      setLastSync(d.lastSyncAt);
      setMsgCount(d.messageCount || 0);
    } catch {}
  }, [engId]);

  const fetchGroups = useCallback(async (silent = true) => {
    if (!engId) return;
    if (!silent) setRefreshingG(true);
    try {
      const d = await api(`/${engId}/groups`);
      setGroups(d.groups || []);
    } catch {}
    if (!silent) setRefreshingG(false);
  }, [engId]);

  // ── Initial load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStatus();
    fetchMessages();
  }, [fetchStatus, fetchMessages]);

  // ── Status polling (for QR → authenticated transition) ────────────────────────
  useEffect(() => {
    clearInterval(statusPollRef.current);
    if (status === 'connecting' || status === 'qr_ready') {
      statusPollRef.current = setInterval(fetchStatus, 2500);
    } else if (status === 'authenticated') {
      // Slow poll to detect disconnects
      statusPollRef.current = setInterval(fetchStatus, 15000);
    }
    return () => clearInterval(statusPollRef.current);
  }, [status, fetchStatus]);

  // ── Live group polling when authenticated & no group selected ─────────────────
  useEffect(() => {
    clearInterval(groupPollRef.current);
    if (status === 'authenticated' && !selGroupId) {
      fetchGroups(true);
      groupPollRef.current = setInterval(() => fetchGroups(true), 10000);
    }
    return () => clearInterval(groupPollRef.current);
  }, [status, selGroupId, fetchGroups]);

  // ── Message polling when group is selected ────────────────────────────────────
  useEffect(() => {
    clearInterval(msgPollRef.current);
    if (status === 'authenticated' && selGroupId) {
      msgPollRef.current = setInterval(fetchMessages, 12000);
    }
    return () => clearInterval(msgPollRef.current);
  }, [status, selGroupId, fetchMessages]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    setConnecting(true);
    try {
      await api(`/${engId}/connect`, { method: 'POST' });
      setStatus('connecting');
    } catch (e) {
      toast({ title: 'Connection failed', description: e.message, status: 'error', duration: 4000 });
    } finally { setConnecting(false); }
  };

  const handleDisconnect = async () => {
    try {
      await api(`/${engId}/disconnect`, { method: 'DELETE' });
      setStatus('disconnected'); setQrCode(''); setGroups([]);
      setMessages([]); setSelGroupId(''); setGroupName('');
      toast({ title: 'Disconnected', status: 'info', duration: 2000 });
    } catch (e) {
      toast({ title: 'Error', description: e.message, status: 'error', duration: 3000 });
    }
  };

  const handleSelectGroup = async (gId, gName) => {
    setSelecting(true);
    try {
      const d = await api(`/${engId}/select-group`, { method: 'POST', body: JSON.stringify({ groupId: gId, groupName: gName }) });
      setSelGroupId(gId); setGroupName(gName); setShowGroups(false);
      await fetchMessages();
      toast({ title: `Monitoring: ${gName}`, description: `${d.messageCount} messages loaded`, status: 'success', duration: 3000 });
    } catch (e) {
      toast({ title: 'Error', description: e.message, status: 'error', duration: 3000 });
    } finally { setSelecting(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const d = await api(`/${engId}/sync`, { method: 'POST', body: JSON.stringify({ limit: 200 }) });
      await fetchMessages();
      toast({ title: `Synced ${d.count} messages`, status: 'success', duration: 2000 });
    } catch (e) {
      toast({ title: 'Sync failed', description: e.message, status: 'error', duration: 3000 });
    } finally { setSyncing(false); }
  };

  const handleStar = async (msgId) => {
    try {
      await api(`/${engId}/messages/${msgId}/star`, { method: 'PATCH' });
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isStarred: !m.isStarred } : m));
    } catch {}
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text || '');
    toast({ title: 'Copied', status: 'success', duration: 1500 });
  };

  const handleClearMessages = async () => {
    try {
      await api(`/${engId}/messages`, { method: 'DELETE' });
      setMessages([]); setMsgCount(0);
      toast({ title: 'Messages cleared', status: 'info', duration: 2000 });
    } catch {}
  };

  const handleRefreshGroups = () => fetchGroups(false);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const displayed = messages
    .filter(m => tab === 'starred' ? m.isStarred : true)
    .filter(m => !search || m.body?.toLowerCase().includes(search.toLowerCase()) || m.fromName?.toLowerCase().includes(search.toLowerCase()));

  const grouped = [];
  let lastDate = '';
  for (const msg of displayed) {
    const d = fmtDate(msg.timestamp);
    if (d !== lastDate) { grouped.push({ type:'date', label:d }); lastDate = d; }
    grouped.push({ type:'msg', msg });
  }

  const starredCount = messages.filter(m => m.isStarred).length;
  const isAuthenticated = status === 'authenticated';
  const hasGroup = isAuthenticated && !!selGroupId;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    // Outer shell: full height, no overflow — fits exactly in the dashboard content area
    <Flex direction="column" h="100%" overflow="hidden">

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <Flex align="center" justify="space-between" px={5} py={3}
        borderBottom={`1px solid ${BORDER}`} flexShrink={0} gap={3}>

        {/* Left */}
        <Box minW={0}>
          <Flex align="center" gap={2}>
            <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
              White <Text as="span" color="red.400">Team</Text>
            </Heading>
            {hasGroup && (
              <Badge fontSize="10px" bg={GREEN_S} color={GREEN}
                border={`1px solid ${GREEN}40`} borderRadius="full" px={2} py="1px" noOfLines={1}>
                {selGroupName}
              </Badge>
            )}
          </Flex>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={0.5}>
            {eng?.name} · WhatsApp group monitor
          </Text>
        </Box>

        {/* Right */}
        <Flex align="center" gap={2} flexShrink={0}>
          <StatusPill status={status}/>

          {hasGroup && lastSync && (
            <Text fontSize="10px" color={MUTED} display={{ base:'none', lg:'block' }}>
              {new Date(lastSync).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
            </Text>
          )}

          {hasGroup && (
            <Tooltip label="Sync messages" hasArrow fontSize="10px">
              <IconButton icon={<RepeatIcon/>} size="sm" variant="ghost"
                color={MUTED} isLoading={syncing}
                _hover={{ color: GREEN, bg: GREEN_S }}
                onClick={handleSync} aria-label="sync"/>
            </Tooltip>
          )}

          {isAuthenticated && selGroupId && (
            <Button size="sm" variant="ghost" color={MUTED} fontSize="11px"
              _hover={{ color:'white', bg:'rgba(255,255,255,0.06)' }}
              onClick={() => setShowGroups(true)}>
              Switch Group
            </Button>
          )}

          {isAuthenticated && !selGroupId && (
            <Button size="sm" bg={GREEN_S} color={GREEN} border={`1px solid ${GREEN}40`}
              fontSize="11px" fontWeight="semibold" borderRadius="8px"
              _hover={{ bg: GREEN, color:'black' }} transition="all 0.2s"
              onClick={() => setShowGroups(true)}>
              Select Group
            </Button>
          )}

          {isAuthenticated && (
            <Tooltip label="Disconnect" hasArrow fontSize="10px">
              <IconButton icon={<CloseIcon boxSize={2.5}/>} size="sm" variant="ghost"
                color={MUTED} _hover={{ color:'red.400', bg:'rgba(255,55,55,0.08)' }}
                onClick={handleDisconnect} aria-label="disconnect"/>
            </Tooltip>
          )}
        </Flex>
      </Flex>

      {/* ── Content area ───────────────────────────────────────────────────── */}
      <Box flex="1" overflow="hidden" position="relative">

        {/* Disconnected */}
        {status === 'disconnected' && (
          <DisconnectedPanel onConnect={handleConnect} loading={connecting}/>
        )}

        {/* Connecting */}
        {status === 'connecting' && <ConnectingPanel/>}

        {/* QR */}
        {status === 'qr_ready' && (
          <QRPanel qrCode={qrCode} onCancel={handleDisconnect}/>
        )}

        {/* Authenticated — no group — show inline selector */}
        {isAuthenticated && !selGroupId && !showGroups && (
          <GroupSelector
            groups={groups} onSelect={handleSelectGroup} loading={selecting}
            onRefresh={handleRefreshGroups} refreshing={refreshingG}/>
        )}

        {/* Chat feed */}
        {hasGroup && (
          <Flex direction="column" h="100%" overflow="hidden">

            {/* Sub-toolbar: tabs + search + count */}
            <Flex align="center" gap={2} px={4} py={2.5}
              borderBottom={`1px solid ${BORDER}`} flexShrink={0}>

              {/* Tabs */}
              <Flex gap={1} flexShrink={0}>
                {[{ id:'all', label:'All', badge:msgCount }, { id:'starred', label:'Starred', badge:starredCount }].map(t => (
                  <Button key={t.id} size="sm" variant="ghost" borderRadius="8px"
                    color={tab===t.id ? GREEN : MUTED}
                    bg={tab===t.id ? GREEN_S : 'transparent'}
                    border={tab===t.id ? `1px solid ${GREEN}35` : '1px solid transparent'}
                    fontWeight={tab===t.id ? 'semibold' : 'normal'} fontSize="11px" px={3} h="30px"
                    _hover={{ bg:GREEN_S, color:GREEN }}
                    onClick={() => setTab(t.id)}>
                    {t.label}
                    {t.badge > 0 && (
                      <Box ml={1.5} bg={tab===t.id ? GREEN : 'rgba(255,255,255,0.1)'}
                        borderRadius="full" px="5px" fontSize="9px" fontWeight="bold"
                        color={tab===t.id ? 'black' : MUTED} lineHeight="15px" h="15px"
                        display="inline-flex" alignItems="center">{t.badge}</Box>
                    )}
                  </Button>
                ))}
              </Flex>

              {/* Search */}
              <Box flex="1" position="relative">
                <Box position="absolute" left={2.5} top="50%" transform="translateY(-50%)" zIndex={1}>
                  <SearchIcon boxSize={2.5} color={MUTED}/>
                </Box>
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search…" variant="unstyled"
                  bg="rgba(255,255,255,0.04)" border={`1px solid ${BORDER}`}
                  borderRadius="8px" px={4} pl={7} h="30px" fontSize="12px" color="white"
                  _placeholder={{ color:MUTED }}
                  _focus={{ border:`1px solid ${GREEN}50`, boxShadow:`0 0 0 1px ${GREEN}20` }}/>
              </Box>

              {/* Count + clear */}
              <Flex align="center" gap={1.5} flexShrink={0}>
                <Text fontSize="10px" color={MUTED}>{displayed.length} msgs</Text>
                <Tooltip label="Clear messages" hasArrow fontSize="10px">
                  <IconButton icon={<DeleteIcon boxSize={2.5}/>} size="xs" variant="ghost"
                    color={MUTED} _hover={{ color:'red.400', bg:'rgba(255,55,55,0.08)' }}
                    onClick={handleClearMessages} aria-label="clear"/>
                </Tooltip>
              </Flex>
            </Flex>

            {/* Messages */}
            <Box flex="1" overflowY="auto" py={2}
              css={{
                '&::-webkit-scrollbar': { width:'3px' },
                '&::-webkit-scrollbar-thumb': { background:'rgba(255,255,255,0.08)', borderRadius:'3px' },
              }}>
              {grouped.length === 0 ? (
                <Flex direction="column" align="center" justify="center" h="80%" gap={3} opacity={0.45}>
                  <Box as="svg" viewBox="0 0 24 24" w="36px" h="36px" fill="none"
                    stroke="currentColor" strokeWidth="1.5" color={MUTED}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </Box>
                  <Text fontSize="12px" color={MUTED}>
                    {search ? 'No messages match your search' : tab==='starred' ? 'No starred messages' : 'No messages yet — tap sync'}
                  </Text>
                </Flex>
              ) : (
                grouped.map((item, i) =>
                  item.type === 'date'
                    ? <DateDivider key={`d${i}`} label={item.label}/>
                    : <Bubble key={item.msg.id||i} msg={item.msg} onStar={handleStar} onCopy={handleCopy}/>
                )
              )}
              <div ref={bottomRef}/>
            </Box>
          </Flex>
        )}
      </Box>

      {/* ── Switch group modal ──────────────────────────────────────────────── */}
      <Modal isOpen={showGroups} onClose={() => setShowGroups(false)} isCentered size="md">
        <ModalOverlay bg="rgba(0,0,0,0.75)" backdropFilter="blur(8px)"/>
        <ModalContent bg="var(--dash-card-bg)" border={`1px solid ${BORDER}`}
          borderRadius="16px" overflow="hidden" maxH="85vh">
          <ModalBody p={0} display="flex" flexDirection="column" h="560px">
            <Flex align="center" justify="space-between" px={5} pt={4} pb={2} flexShrink={0}>
              <Text fontSize="14px" fontWeight="bold" color="white">Switch Group</Text>
              <IconButton icon={<CloseIcon boxSize={2.5}/>} size="sm" variant="ghost"
                color={MUTED} _hover={{ color:'white' }}
                onClick={() => setShowGroups(false)} aria-label="close"/>
            </Flex>
            <Box flex="1" overflow="hidden">
              <GroupSelector groups={groups} onSelect={handleSelectGroup} loading={selecting}
                onRefresh={handleRefreshGroups} refreshing={refreshingG}/>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Keyframes */}
      <style>{`
        @keyframes wt-ping  { 0% { transform:scale(1); opacity:1 } 70%,100% { transform:scale(1.5); opacity:0 } }
        @keyframes wt-pulse { 0%,100%  { opacity:1 } 50% { opacity:0.35 } }
      `}</style>

    </Flex>
  );
};

export default WhiteTeamView;
