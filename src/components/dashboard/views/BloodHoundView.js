import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input,
  SimpleGrid, Modal, ModalOverlay, ModalContent, ModalBody,
  Spinner, Tooltip, Badge, Progress, useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AddIcon, DeleteIcon, SearchIcon, CopyIcon, CheckIcon, RepeatIcon, CloseIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox  = motion(Box);
const MotionFlex = motion(Flex);

// ── Theme ──────────────────────────────────────────────────────────────────────
const ACCENT  = '#F97316';
const A_S     = 'rgba(249,115,22,0.12)';
const A_B     = 'rgba(249,115,22,0.35)';
const RED     = '#FC8181';
const GREEN   = '#68D391';
const BLUE    = '#63B3ED';
const YELLOW  = '#ECC94B';
const PURPLE  = '#9F7AEA';
const MUTED   = 'var(--dash-text-muted)';
const BORDER  = 'rgba(255,255,255,0.07)';
const CARD    = 'rgba(255,255,255,0.04)';

// ── Severity ──────────────────────────────────────────────────────────────────
const SEV = {
  critical: { color: '#FC4A4A', bg: 'rgba(252,74,74,0.12)', border: 'rgba(252,74,74,0.3)'  },
  high:     { color: '#F97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
  medium:   { color: '#ECC94B', bg: 'rgba(236,201,75,0.12)', border: 'rgba(236,201,75,0.3)'  },
  low:      { color: '#68D391', bg: 'rgba(104,211,145,0.12)', border: 'rgba(104,211,145,0.3)' },
};

// ── API ────────────────────────────────────────────────────────────────────────
const api = (path, opts = {}) => {
  const tok = localStorage.getItem('token');
  return fetch(`/api/bloodhound${path}`, {
    headers: { Authorization: `Bearer ${tok}`, ...(opts.headers || {}) },
    ...opts,
  }).then(r => r.json());
};

const apiJSON = (path, opts = {}) => api(path, {
  ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
});

// ── Input styles ──────────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: `1px solid ${BORDER}`, borderRadius: '10px',
  px: 4, h: '38px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: MUTED },
  _hover:  { border: `1px solid ${ACCENT}50` },
  _focus:  { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

// ── Small helpers ─────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color={MUTED} textTransform="uppercase" letterSpacing="wider" fontWeight="bold" mb={1}>{children}</Text>
);

const TabBtn = ({ label, active, badge, onClick }) => (
  <Button size="sm" variant="ghost" borderRadius="8px"
    color={active ? ACCENT : MUTED}
    bg={active ? A_S : 'transparent'}
    border={active ? `1px solid ${A_B}` : '1px solid transparent'}
    fontWeight={active ? 'semibold' : 'normal'} fontSize="12px" px={3} h="30px"
    _hover={{ bg: A_S, color: ACCENT }} onClick={onClick}>
    {label}
    {badge > 0 && (
      <Box ml={1.5} bg={active ? ACCENT : 'rgba(255,255,255,0.1)'} borderRadius="full"
        px="5px" fontSize="9px" fontWeight="bold"
        color={active ? 'black' : MUTED} lineHeight="16px" h="16px"
        display="inline-flex" alignItems="center">{badge > 999 ? '999+' : badge}</Box>
    )}
  </Button>
);

const StatCard = ({ label, value, color, icon, sub }) => (
  <MotionBox initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
    p={4} bg={CARD} border={`1px solid ${BORDER}`} borderRadius="12px"
    _hover={{ border:`1px solid ${color}30`, bg:`${color}06` }} transition="all 0.2s">
    <Flex align="center" justify="space-between" mb={2}>
      <Text fontSize="10px" color={MUTED} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">{label}</Text>
      <Box color={color} opacity={0.8}>{icon}</Box>
    </Flex>
    <Text fontSize="26px" fontWeight="black" color={color} lineHeight="1">{value ?? '—'}</Text>
    {sub && <Text fontSize="10px" color={MUTED} mt={1}>{sub}</Text>}
  </MotionBox>
);

// ── Copy button ───────────────────────────────────────────────────────────────
const CopyBtn = ({ text, label = 'Copy command' }) => {
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  };
  return (
    <Tooltip label={label} hasArrow fontSize="10px">
      <IconButton icon={done ? <CheckIcon /> : <CopyIcon />} size="xs" variant="ghost"
        color={done ? GREEN : MUTED}
        _hover={{ color: done ? GREEN : ACCENT, bg: A_S }}
        onClick={copy} aria-label="copy" />
    </Tooltip>
  );
};

// ── Severity badge ─────────────────────────────────────────────────────────────
const SevBadge = ({ sev }) => {
  const s = SEV[sev] || SEV.medium;
  return (
    <Box px={2} py="2px" borderRadius="full" bg={s.bg} border={`1px solid ${s.border}`}
      fontSize="9px" fontWeight="bold" color={s.color} textTransform="uppercase" letterSpacing="wider">
      {sev}
    </Box>
  );
};

// ── Type badge ────────────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const colors = { user:'#63B3ED', computer:'#68D391', group:'#9F7AEA', domain:'#F97316' };
  const c = colors[type] || MUTED;
  return (
    <Box px={2} py="2px" borderRadius="full" bg={`${c}15`} border={`1px solid ${c}35`}
      fontSize="9px" fontWeight="semibold" color={c} textTransform="capitalize">{type}</Box>
  );
};

// ── Row: kerberoast / asrep ───────────────────────────────────────────────────
const FindingRow = ({ item, domain, engId, onUpdate, cmdFn }) => {
  const [editing, setEditing] = useState(false);
  const [crack,   setCrack]   = useState(item.crackedPassword || '');
  const [saving,  setSaving]  = useState(false);
  const toast = useToast();

  const saveCrack = async () => {
    setSaving(true);
    try {
      const updated = await apiJSON(`/${engId}/findings/${item._id}`, {
        method: 'PATCH', body: JSON.stringify({ crackedPassword: crack }),
      });
      onUpdate(updated);
      setEditing(false);
      toast({ title: crack ? 'Password saved' : 'Password cleared', status: 'success', duration: 2000 });
    } catch { toast({ title: 'Save failed', status: 'error', duration: 2000 }); }
    finally { setSaving(false); }
  };

  const status = item.crackedPassword ? 'cracked'
    : item.category === 'kerberoastable' ? 'roastable' : 'vulnerable';
  const statusColor = { cracked: GREEN, roastable: ACCENT, vulnerable: YELLOW }[status];

  return (
    <MotionBox initial={{ opacity:0 }} animate={{ opacity:1 }}
      px={4} py="10px" borderBottom={`1px solid ${BORDER}`}
      _hover={{ bg:'rgba(255,255,255,0.02)' }} transition="background 0.12s">
      <Flex align="center" gap={3} wrap="wrap">
        {/* Status dot */}
        <Box w="7px" h="7px" borderRadius="full" bg={statusColor}
          boxShadow={`0 0 6px ${statusColor}80`} flexShrink={0} />

        {/* Name */}
        <Box flex="2" minW="160px">
          <Text fontSize="13px" fontWeight="semibold" color="white" noOfLines={1}>
            {item.name}
          </Text>
          <Flex gap={1.5} mt="2px" flexWrap="wrap">
            {item.adminCount && (
              <Box px={1.5} py="1px" bg="rgba(252,74,74,0.12)" border="1px solid rgba(252,74,74,0.3)"
                borderRadius="4px" fontSize="9px" color={RED} fontWeight="bold">ADMINCOUNT</Box>
            )}
            {item.pwdNeverExpires && (
              <Box px={1.5} py="1px" bg="rgba(236,201,75,0.1)" border="1px solid rgba(236,201,75,0.25)"
                borderRadius="4px" fontSize="9px" color={YELLOW}>PWD_NOEXPIRY</Box>
            )}
            {!item.enabled && (
              <Box px={1.5} py="1px" bg="rgba(156,163,175,0.1)" border="1px solid rgba(156,163,175,0.2)"
                borderRadius="4px" fontSize="9px" color={MUTED}>DISABLED</Box>
            )}
          </Flex>
        </Box>

        {/* Domain */}
        <Text fontSize="11px" color={MUTED} flex="1" minW="100px" noOfLines={1}>{item.domain}</Text>

        {/* SPNs for kerberoastable */}
        {item.spns?.length > 0 && (
          <Text fontSize="10px" color={MUTED} flex="1.5" minW="120px" noOfLines={1}>
            {item.spns[0]}{item.spns.length > 1 ? ` +${item.spns.length-1}` : ''}
          </Text>
        )}

        {/* Cracked password */}
        <Box flex="1.5" minW="130px">
          {editing ? (
            <Flex gap={1}>
              <Input value={crack} onChange={e => setCrack(e.target.value)}
                placeholder="Cracked password" {...inputSx} h="30px" px={2} fontSize="12px"
                onKeyDown={e => { if (e.key==='Enter') saveCrack(); if (e.key==='Escape') setEditing(false); }}/>
              <IconButton icon={<CheckIcon/>} size="xs" isLoading={saving}
                bg={GREEN} color="black" _hover={{ bg:'#4ade80' }}
                onClick={saveCrack} aria-label="save" />
              <IconButton icon={<CloseIcon boxSize={2}/>} size="xs" variant="ghost"
                color={MUTED} onClick={() => setEditing(false)} aria-label="cancel" />
            </Flex>
          ) : item.crackedPassword ? (
            <Flex align="center" gap={1.5} cursor="pointer" onClick={() => setEditing(true)}
              px={2} py={1} bg="rgba(104,211,145,0.08)" border="1px solid rgba(104,211,145,0.2)"
              borderRadius="8px" _hover={{ border:'1px solid rgba(104,211,145,0.4)' }} transition="all 0.15s">
              <CheckIcon boxSize={2.5} color={GREEN} />
              <Text fontSize="11px" color={GREEN} fontFamily="mono" noOfLines={1}>{item.crackedPassword}</Text>
              <CopyBtn text={item.crackedPassword} label="Copy password" />
            </Flex>
          ) : (
            <Button size="xs" variant="ghost" color={MUTED} border={`1px solid ${BORDER}`}
              borderRadius="8px" fontSize="10px" h="26px"
              _hover={{ color: ACCENT, border:`1px solid ${A_B}` }} onClick={() => setEditing(true)}>
              + Add crack
            </Button>
          )}
        </Box>

        {/* Copy command */}
        <CopyBtn text={cmdFn(item, domain)} label="Copy attack command" />
      </Flex>
    </MotionBox>
  );
};

// ── Simple table row ──────────────────────────────────────────────────────────
const SimpleRow = ({ item, cols, actions }) => (
  <MotionBox initial={{ opacity:0 }} animate={{ opacity:1 }}
    px={4} py="10px" borderBottom={`1px solid ${BORDER}`}
    _hover={{ bg:'rgba(255,255,255,0.02)' }} transition="background 0.12s">
    <Flex align="center" gap={3} wrap="wrap">
      {cols.map(col => (
        <Box key={col.key} flex={col.flex || 1} minW={col.minW || '100px'}>
          {col.render ? col.render(item) : (
            <Text fontSize="13px" color={col.color || 'white'} noOfLines={1}>{item[col.key] || '—'}</Text>
          )}
        </Box>
      ))}
      {actions && <Flex gap={1} flexShrink={0}>{actions(item)}</Flex>}
    </Flex>
  </MotionBox>
);

// ── Table header ──────────────────────────────────────────────────────────────
const TableHead = ({ cols, extra }) => (
  <Flex px={4} py={2} borderBottom={`1px solid ${BORDER}`} bg="rgba(255,255,255,0.02)">
    {cols.map(col => (
      <Text key={col.label} flex={col.flex||1} minW={col.minW||'100px'}
        fontSize="10px" color={MUTED} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
        {col.label}
      </Text>
    ))}
    {extra && <Box flexShrink={0} w="60px" />}
  </Flex>
);

// ── Attack path card ──────────────────────────────────────────────────────────
const PathCard = ({ path }) => {
  const [open, setOpen] = useState(false);
  const s = SEV[path.severity] || SEV.medium;
  return (
    <MotionBox initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
      border={`1px solid ${s.border}`} borderRadius="12px" overflow="hidden"
      _hover={{ border:`1px solid ${s.color}50` }} transition="border 0.15s">
      <Flex align="center" gap={3} px={4} py={3} cursor="pointer" onClick={() => setOpen(o => !o)}
        bg={open ? s.bg : 'transparent'} transition="background 0.15s">
        {/* Severity dot */}
        <Box w="8px" h="8px" borderRadius="full" bg={s.color} boxShadow={`0 0 8px ${s.color}80`} flexShrink={0} />
        <Box flex="1" minW={0}>
          <Text fontSize="13px" fontWeight="bold" color="white">{path.title}</Text>
          <Text fontSize="11px" color={MUTED} noOfLines={open ? undefined : 1}>{path.description}</Text>
        </Box>
        <Flex align="center" gap={2} flexShrink={0}>
          <SevBadge sev={path.severity} />
          {path.mitreId && (
            <Box px={2} py="2px" borderRadius="full" bg="rgba(99,179,237,0.1)" border="1px solid rgba(99,179,237,0.3)"
              fontSize="9px" color={BLUE}>{path.technique}</Box>
          )}
          <Box as="svg" viewBox="0 0 24 24" w="14px" h="14px" fill="none" stroke={MUTED}
            strokeWidth="2" transform={open ? 'rotate(180deg)' : undefined} transition="transform 0.2s">
            <polyline points="6 9 12 15 18 9"/>
          </Box>
        </Flex>
      </Flex>

      <AnimatePresence>
        {open && (
          <MotionBox initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}
            overflow="hidden">
            <Box px={4} py={3} bg={s.bg} borderTop={`1px solid ${s.border}`}>
              <Flex direction="column" gap={1.5}>
                {path.steps.map((step, i) => (
                  <Flex key={i} gap={2.5} align="flex-start">
                    <Box w="18px" h="18px" borderRadius="full" bg={`${s.color}20`}
                      border={`1px solid ${s.color}40`} display="flex" alignItems="center"
                      justifyContent="center" flexShrink={0} mt="1px">
                      <Text fontSize="9px" fontWeight="bold" color={s.color}>{i+1}</Text>
                    </Box>
                    <Flex align="center" gap={2} flex="1">
                      <Text fontSize="12px" color="rgba(255,255,255,0.85)" fontFamily={step.startsWith('Rubeus')||step.startsWith('Get')||step.startsWith('secret')||step.startsWith('hashcat')||step.startsWith('net ')||step.startsWith('Add-') ? 'mono' : undefined}>
                        {step}
                      </Text>
                      {(step.startsWith('Rubeus')||step.startsWith('Get')||step.startsWith('secret')||step.startsWith('hashcat')||step.startsWith('net ')||step.startsWith('Add-')) && (
                        <CopyBtn text={step} label="Copy" />
                      )}
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </MotionBox>
  );
};

// ── Pagination ────────────────────────────────────────────────────────────────
const Pager = ({ page, pages, onPage }) => {
  if (pages <= 1) return null;
  return (
    <Flex align="center" justify="center" gap={2} py={3}>
      <Button size="xs" variant="ghost" color={MUTED} isDisabled={page<=1}
        _hover={{ color:'white' }} onClick={() => onPage(page-1)}>← Prev</Button>
      <Text fontSize="11px" color={MUTED}>Page {page} / {pages}</Text>
      <Button size="xs" variant="ghost" color={MUTED} isDisabled={page>=pages}
        _hover={{ color:'white' }} onClick={() => onPage(page+1)}>Next →</Button>
    </Flex>
  );
};

// ── Drop zone ─────────────────────────────────────────────────────────────────
const DropZone = ({ onFiles, uploading, progress }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handle = files => { if (files.length) onFiles(files); };
  const onDrop  = e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); };
  const onDragOver  = e => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <Box>
      <Box
        border={`2px dashed ${dragging ? ACCENT : BORDER}`}
        borderRadius="16px" p={10} textAlign="center" cursor="pointer"
        bg={dragging ? A_S : CARD}
        transition="all 0.2s"
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        _hover={{ border:`2px dashed ${ACCENT}60`, bg: A_S }}
      >
        <input ref={inputRef} type="file" accept=".zip,.json" multiple hidden
          onChange={e => handle(e.target.files)} />

        {uploading ? (
          <Flex direction="column" align="center" gap={4}>
            <Spinner size="xl" color={ACCENT} thickness="3px" speed="0.7s" />
            <Text fontSize="14px" color="white" fontWeight="semibold">Processing BloodHound data…</Text>
            <Text fontSize="12px" color={MUTED}>Parsing objects, computing attack paths</Text>
            {progress > 0 && (
              <Box w="full" maxW="300px">
                <Progress value={progress} colorScheme="orange" size="sm" borderRadius="full" bg="rgba(255,255,255,0.1)" />
              </Box>
            )}
          </Flex>
        ) : (
          <Flex direction="column" align="center" gap={3}>
            {/* BloodHound-style icon */}
            <Box w="56px" h="56px" borderRadius="full" bg={A_S} border={`1px solid ${A_B}`}
              display="flex" alignItems="center" justifyContent="center">
              <Box as="svg" viewBox="0 0 24 24" w="26px" h="26px" fill="none"
                stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </Box>
            </Box>
            <Box>
              <Text fontSize="15px" fontWeight="bold" color="white">Drop BloodHound export here</Text>
              <Text fontSize="12px" color={MUTED} mt={1}>
                ZIP archive or individual JSON files — up to 512 MB supported
              </Text>
            </Box>
            <Flex gap={2} flexWrap="wrap" justify="center">
              {['*_users.json','*_computers.json','*_groups.json','*_domains.json','BloodHound.zip'].map(t => (
                <Box key={t} px={2} py="3px" borderRadius="6px" bg="rgba(255,255,255,0.05)"
                  border={`1px solid ${BORDER}`} fontSize="10px" color={MUTED} fontFamily="mono">{t}</Box>
              ))}
            </Flex>
            <Button size="sm" bg={ACCENT} color="black" fontWeight="bold" borderRadius="10px"
              _hover={{ bg:'#EA6C0A', transform:'translateY(-1px)' }} transition="all 0.2s">
              Browse Files
            </Button>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

// ── Command generators ────────────────────────────────────────────────────────
const kerbCmd = (item, dom) => {
  const user = item.name?.split('@')[0] || 'USER';
  const dc   = dom || 'DOMAIN.COM';
  return `GetUserSPNs.py ${dc}/<USER>:<PASS> -request-user ${user} -dc-ip <DC_IP> -outputfile ${user}.kirbi`;
};
const asrepCmd = (item, dom) => {
  const user = item.name?.split('@')[0] || 'USER';
  return `GetNPUsers.py ${dom || 'DOMAIN.COM'}/ -usersfile users.txt -format hashcat -outputfile asrep.txt -dc-ip <DC_IP>`;
};
const dcsyncCmd = (item, dom) =>
  `secretsdump.py ${dom || 'DOMAIN.COM'}/<USER>:<PASS>@<DC_IP> -just-dc`;
const unconstrainedCmd = (item) =>
  `Rubeus.exe monitor /interval:5 /filteruser:Administrator /nowrap`;

// ── Main view ─────────────────────────────────────────────────────────────────
const BloodHoundView = () => {
  const { slug }       = useParams();
  const { getBySlug }  = useEngagements();
  const eng            = getBySlug(slug);
  const engId          = eng?._id;
  const toast          = useToast();
  const pollRef        = useRef(null);

  const [session,   setSession]   = useState(null);
  const [tab,       setTab]       = useState('overview');
  const [findings,  setFindings]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [showImport,setShowImport]= useState(false);
  const [clearing,  setClearing]  = useState(false);

  // category map per tab
  const tabCategory = {
    kerberoastable: 'kerberoastable',
    asrep:          'asrep',
    highvalue:      null, // multi-category
    delegation:     null,
    acl:            'acl_path',
    trusts:         'trust',
  };

  // ── Fetch session ─────────────────────────────────────────────────────────
  const fetchSession = useCallback(async () => {
    if (!engId) return;
    try {
      const d = await api(`/${engId}/session`);
      setSession(d);
      return d.status;
    } catch { return 'idle'; }
  }, [engId]);

  // ── Fetch findings ─────────────────────────────────────────────────────────
  const fetchFindings = useCallback(async (cat, pg = 1, q = '') => {
    if (!engId) return;
    try {
      const params = new URLSearchParams({ page: pg, limit: 50 });
      if (cat) params.set('category', cat);
      if (q)   params.set('search', q);
      const d = await api(`/${engId}/findings?${params}`);
      setFindings(d.items || []);
      setTotal(d.total || 0);
      setPages(d.pages || 1);
    } catch {}
  }, [engId]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // ── Poll while processing ─────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(pollRef.current);
    if (session?.status === 'processing') {
      let fake = 0;
      pollRef.current = setInterval(async () => {
        fake = Math.min(fake + 8, 88);
        setProgress(fake);
        const status = await fetchSession();
        if (status === 'ready' || status === 'error') {
          setProgress(100);
          setUploading(false);
          clearInterval(pollRef.current);
          if (status === 'ready') {
            toast({ title: 'Import complete', description: 'BloodHound data ready', status: 'success', duration: 3000 });
            setShowImport(false);
            fetchFindings(null, 1, '');
          } else {
            toast({ title: 'Import failed', description: session?.error, status: 'error', duration: 5000 });
          }
        }
      }, 2000);
    }
    return () => clearInterval(pollRef.current);
  }, [session?.status, fetchSession, fetchFindings, toast]);

  // ── Load findings when tab / page / search changes ────────────────────────
  useEffect(() => {
    if (session?.status !== 'ready') return;
    const cats = {
      kerberoastable: 'kerberoastable',
      asrep:          'asrep',
      highvalue:      'da_member',
      delegation:     'unconstrained',
      acl:            'acl_path',
      trusts:         'trust',
    };
    fetchFindings(cats[tab] || null, page, search);
  }, [tab, page, search, session?.status, fetchFindings]);

  // ── Handle file upload ────────────────────────────────────────────────────
  const handleFiles = async (fileList) => {
    setUploading(true);
    setProgress(5);
    try {
      const form = new FormData();
      Array.from(fileList).forEach(f => form.append('files', f));
      const res = await fetch(`/api/bloodhound/${engId}/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: form,
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      // Polling will handle the rest
      setSession(prev => ({ ...prev, status: 'processing' }));
    } catch (e) {
      toast({ title: 'Upload failed', description: e.message, status: 'error', duration: 4000 });
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await api(`/${engId}/session`, { method: 'DELETE' });
      setSession(null); setFindings([]); setTotal(0);
      toast({ title: 'Data cleared', status: 'info', duration: 2000 });
    } catch {}
    finally { setClearing(false); }
  };

  const handleUpdateFinding = (updated) => {
    setFindings(prev => prev.map(f => f._id === updated._id ? updated : f));
  };

  // ── High Value sub-tabs ───────────────────────────────────────────────────
  const [hvTab, setHvTab] = useState('da');
  useEffect(() => {
    if (tab !== 'highvalue' || session?.status !== 'ready') return;
    const catMap = { da:'da_member', ea:'ea_member', dcsync:'dcsync', highval:'high_value' };
    fetchFindings(catMap[hvTab] || 'da_member', 1, search);
  }, [hvTab, tab, session?.status, search, fetchFindings]);

  // ── Delegation sub-tabs ───────────────────────────────────────────────────
  const [delTab, setDelTab] = useState('unconstrained');
  useEffect(() => {
    if (tab !== 'delegation' || session?.status !== 'ready') return;
    fetchFindings(delTab === 'unconstrained' ? 'unconstrained' : 'constrained', 1, search);
  }, [delTab, tab, session?.status, search, fetchFindings]);

  const st = session?.stats || {};
  const isReady = session?.status === 'ready';
  const isProcessing = session?.status === 'processing';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Flex direction="column" h="100%" overflow="hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <Flex align="center" justify="space-between" px={6} py="14px"
        borderBottom={`1px solid ${BORDER}`} flexShrink={0} gap={3}>
        <Box>
          <Flex align="center" gap={2}>
            <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
              Blood<Text as="span" color="red.400">Hound</Text>
            </Heading>
            {isReady && session.domain && (
              <Badge fontSize="10px" bg={A_S} color={ACCENT} border={`1px solid ${A_B}`}
                borderRadius="full" px={2} py="1px">{session.domain}</Badge>
            )}
            {isProcessing && (
              <Flex align="center" gap={1.5}>
                <Spinner size="xs" color={ACCENT} />
                <Text fontSize="11px" color={ACCENT}>Processing…</Text>
              </Flex>
            )}
          </Flex>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={0.5}>
            {eng?.name} · Attack path analysis & findings
          </Text>
        </Box>

        <Flex align="center" gap={2}>
          {isReady && session.importedAt && (
            <Text fontSize="10px" color={MUTED} display={{ base:'none', md:'block' }}>
              Imported {new Date(session.importedAt).toLocaleDateString()}
            </Text>
          )}
          {isReady && (
            <Tooltip label="Re-import data" hasArrow fontSize="10px">
              <Button size="sm" bg={A_S} color={ACCENT} border={`1px solid ${A_B}`}
                fontSize="11px" fontWeight="semibold" borderRadius="8px"
                leftIcon={<AddIcon boxSize={2.5} />}
                _hover={{ bg: ACCENT, color:'black' }} transition="all 0.2s"
                onClick={() => setShowImport(true)}>
                Re-import
              </Button>
            </Tooltip>
          )}
          {!isReady && !isProcessing && (
            <Button size="sm" bg={ACCENT} color="black" fontWeight="bold" borderRadius="8px"
              leftIcon={<AddIcon boxSize={2.5} />}
              _hover={{ bg:'#EA6C0A', transform:'translateY(-1px)' }} transition="all 0.2s"
              onClick={() => setShowImport(true)}>
              Import Data
            </Button>
          )}
          {isReady && (
            <Tooltip label="Clear all data" hasArrow fontSize="10px">
              <IconButton icon={<DeleteIcon />} size="sm" variant="ghost"
                color={MUTED} isLoading={clearing}
                _hover={{ color: RED, bg:'rgba(252,129,129,0.08)' }}
                onClick={handleClear} aria-label="clear" />
            </Tooltip>
          )}
        </Flex>
      </Flex>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <Box flex="1" overflow="hidden">
        {/* Empty / loading state */}
        {!isReady && !isProcessing && (
          <Flex direction="column" align="center" justify="center" h="100%" gap={6}>
            <MotionBox initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              w="72px" h="72px" borderRadius="full" bg={A_S} border={`1px solid ${A_B}`}
              display="flex" alignItems="center" justifyContent="center">
              <Box as="svg" viewBox="0 0 24 24" w="34px" h="34px" fill="none"
                stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </Box>
            </MotionBox>
            <Box textAlign="center">
              <Heading fontSize="20px" color="white" mb={2}>Import BloodHound Data</Heading>
              <Text fontSize="13px" color={MUTED} maxW="400px" lineHeight="1.7">
                Upload a BloodHound ZIP export or individual collector JSON files to automatically
                extract attack paths, kerberoastable accounts, delegation misconfigs and more.
              </Text>
            </Box>
            <Flex direction="column" gap={2} w="full" maxW="380px">
              {[
                { label:'Kerberoastable / AS-REP', icon:'🔑', desc:'SPN & preauthentication vulnerabilities' },
                { label:'Domain Admin paths',      icon:'👑', desc:'DA/EA membership + ACL write paths' },
                { label:'Delegation abuse',        icon:'🎫', desc:'Unconstrained & constrained delegation' },
                { label:'DCSync rights',           icon:'💾', desc:'Replication privilege holders' },
              ].map(i => (
                <Flex key={i.label} align="center" gap={3} px={4} py="10px"
                  bg={CARD} border={`1px solid ${BORDER}`} borderRadius="10px">
                  <Box as="svg" viewBox="0 0 24 24" w="13px" h="13px" fill="none"
                    stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" flexShrink={0}>
                    <polyline points="20 6 9 17 4 12"/>
                  </Box>
                  <Box>
                    <Text fontSize="12px" fontWeight="semibold" color="white">{i.label}</Text>
                    <Text fontSize="10px" color={MUTED}>{i.desc}</Text>
                  </Box>
                </Flex>
              ))}
            </Flex>
            <Button bg={ACCENT} color="black" fontWeight="bold" borderRadius="12px"
              px={8} h="44px" leftIcon={<AddIcon />}
              _hover={{ bg:'#EA6C0A', transform:'translateY(-1px)', boxShadow:`0 8px 28px rgba(249,115,22,0.3)` }}
              transition="all 0.2s" onClick={() => setShowImport(true)}>
              Import BloodHound Data
            </Button>
          </Flex>
        )}

        {/* Processing spinner */}
        {isProcessing && (
          <Flex direction="column" align="center" justify="center" h="100%" gap={5}>
            <Spinner size="xl" color={ACCENT} thickness="3px" speed="0.8s" />
            <Box textAlign="center">
              <Text fontSize="15px" fontWeight="semibold" color="white" mb={1}>Processing BloodHound data…</Text>
              <Text fontSize="12px" color={MUTED}>Extracting objects, computing attack paths</Text>
            </Box>
            <Box w="260px">
              <Progress value={progress} colorScheme="orange" size="sm"
                borderRadius="full" bg="rgba(255,255,255,0.08)"
                sx={{ '& > div': { transition: 'width 0.4s ease' } }} />
              <Text fontSize="10px" color={MUTED} textAlign="center" mt={1}>{progress}%</Text>
            </Box>
          </Flex>
        )}

        {/* Main content */}
        {isReady && (
          <Flex direction="column" h="100%" overflow="hidden">

            {/* Stats strip */}
            <Box px={6} py={4} flexShrink={0} borderBottom={`1px solid ${BORDER}`}>
              <SimpleGrid columns={{ base:3, md:5, lg:8 }} gap={3}>
                <StatCard label="Users" value={st.users?.toLocaleString()} color={BLUE}
                  icon={<Box as="svg" viewBox="0 0 24 24" w="14px" h="14px" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Box>} />
                <StatCard label="Computers" value={st.computers?.toLocaleString()} color={GREEN}
                  icon={<Box as="svg" viewBox="0 0 24 24" w="14px" h="14px" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></Box>} />
                <StatCard label="Kerberoast" value={st.kerberoastable} color={ACCENT}
                  icon={<Box as="svg" viewBox="0 0 24 24" w="14px" h="14px" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></Box>} />
                <StatCard label="AS-REP" value={st.asrepRoastable} color={YELLOW}
                  icon={<Box as="svg" viewBox="0 0 24 24" w="14px" h="14px" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Box>} />
                <StatCard label="Domain Admins" value={st.domainAdmins} color={RED}
                  icon={<Box as="svg" viewBox="0 0 24 24" w="14px" h="14px" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Box>} />
                <StatCard label="DCSync" value={st.dcsyncRights} color={RED}
                  icon={<Box as="svg" viewBox="0 0 24 24" w="14px" h="14px" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Box>} />
                <StatCard label="Delegation" value={(st.unconstrainedDelegation||0)+(st.constrainedDelegation||0)} color={PURPLE}
                  icon={<Box as="svg" viewBox="0 0 24 24" w="14px" h="14px" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Box>} />
                <StatCard label="ACL Paths" value={st.aclPaths} color={ACCENT}
                  icon={<Box as="svg" viewBox="0 0 24 24" w="14px" h="14px" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Box>} />
              </SimpleGrid>
            </Box>

            {/* Tab bar */}
            <Flex gap={1} px={6} py={3} borderBottom={`1px solid ${BORDER}`} flexShrink={0} flexWrap="wrap">
              {[
                { id:'overview',        label:'Attack Paths',   badge: session?.attackPaths?.length },
                { id:'kerberoastable',  label:'Kerberoastable', badge: st.kerberoastable },
                { id:'asrep',           label:'AS-REP',         badge: st.asrepRoastable },
                { id:'highvalue',       label:'High Value',     badge: (st.domainAdmins||0)+(st.enterpriseAdmins||0)+(st.dcsyncRights||0) },
                { id:'delegation',      label:'Delegation',     badge: (st.unconstrainedDelegation||0)+(st.constrainedDelegation||0) },
                { id:'acl',             label:'ACL Paths',      badge: st.aclPaths },
                { id:'trusts',          label:'Trusts',         badge: st.domainTrusts },
              ].map(t => (
                <TabBtn key={t.id} label={t.label} badge={t.badge} active={tab===t.id} onClick={() => { setTab(t.id); setPage(1); setSearch(''); }} />
              ))}
            </Flex>

            {/* Search bar (for data tabs) */}
            {tab !== 'overview' && (
              <Flex px={6} py={2.5} gap={3} align="center" borderBottom={`1px solid ${BORDER}`} flexShrink={0}>
                <Box flex="1" position="relative" maxW="400px">
                  <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                    <SearchIcon boxSize={3} color={MUTED} />
                  </Box>
                  <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by name, domain…" {...inputSx} pl={8} h="34px" fontSize="12px" />
                </Box>
                <Text fontSize="11px" color={MUTED}>{total.toLocaleString()} results</Text>
              </Flex>
            )}

            {/* Content area */}
            <Box flex="1" overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { width:'3px' },
                '&::-webkit-scrollbar-thumb': { background:'rgba(255,255,255,0.08)', borderRadius:'3px' },
              }}>

              {/* ── Overview: Attack Paths ─────────────────────────────────── */}
              {tab === 'overview' && (
                <Box px={6} py={5}>
                  {session.attackPaths?.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" py={16} gap={3} opacity={0.5}>
                      <CheckIcon boxSize={8} color={GREEN} />
                      <Text fontSize="14px" color={MUTED}>No significant attack paths detected</Text>
                    </Flex>
                  ) : (
                    <Flex direction="column" gap={3}>
                      <Flex align="center" justify="space-between" mb={2}>
                        <Text fontSize="12px" color={MUTED}>
                          {session.attackPaths?.length} attack path{session.attackPaths?.length !== 1 ? 's' : ''} detected — click to expand
                        </Text>
                        <Flex gap={2}>
                          {['critical','high','medium'].map(s => (
                            <Flex key={s} align="center" gap={1}>
                              <Box w="6px" h="6px" borderRadius="full" bg={SEV[s].color} />
                              <Text fontSize="10px" color={MUTED} textTransform="capitalize">{s}</Text>
                            </Flex>
                          ))}
                        </Flex>
                      </Flex>
                      {session.attackPaths.map(p => <PathCard key={p.id} path={p} />)}
                    </Flex>
                  )}
                </Box>
              )}

              {/* ── Kerberoastable ────────────────────────────────────────── */}
              {tab === 'kerberoastable' && (
                <Box>
                  <TableHead
                    cols={[
                      { label:'', minW:'20px', flex:'0 0 20px' },
                      { label:'Account', flex:'2', minW:'160px' },
                      { label:'Domain', flex:'1', minW:'100px' },
                      { label:'Primary SPN', flex:'1.5', minW:'120px' },
                      { label:'Cracked Password', flex:'1.5', minW:'130px' },
                    ]} extra />
                  {findings.length === 0 && (
                    <Flex justify="center" py={12} opacity={0.4}>
                      <Text fontSize="13px" color={MUTED}>No kerberoastable accounts found</Text>
                    </Flex>
                  )}
                  {findings.map(item => (
                    <FindingRow key={item._id} item={item} domain={session.domain} engId={engId}
                      onUpdate={handleUpdateFinding} cmdFn={kerbCmd} />
                  ))}
                  <Pager page={page} pages={pages} onPage={setPage} />
                  {findings.length > 0 && (
                    <Box px={4} py={3} borderTop={`1px solid ${BORDER}`} bg={CARD}>
                      <Flex align="center" justify="space-between">
                        <Text fontSize="11px" color={MUTED}>Bulk attack command</Text>
                        <CopyBtn
                          text={`GetUserSPNs.py ${session.domain}/<USER>:<PASS> -dc-ip <DC_IP> -request -outputfile kerberoast.txt`}
                          label="Copy bulk command" />
                      </Flex>
                      <Text fontSize="11px" color={MUTED} fontFamily="mono" mt={1} noOfLines={1}>
                        {`GetUserSPNs.py ${session.domain}/<USER>:<PASS> -dc-ip <DC_IP> -request -outputfile kerberoast.txt`}
                      </Text>
                    </Box>
                  )}
                </Box>
              )}

              {/* ── AS-REP ───────────────────────────────────────────────── */}
              {tab === 'asrep' && (
                <Box>
                  <TableHead
                    cols={[
                      { label:'', minW:'20px', flex:'0 0 20px' },
                      { label:'Account', flex:'2', minW:'160px' },
                      { label:'Domain', flex:'1', minW:'100px' },
                      { label:'', flex:'1', minW:'100px' },
                      { label:'Cracked Password', flex:'1.5', minW:'130px' },
                    ]} extra />
                  {findings.length === 0 && (
                    <Flex justify="center" py={12} opacity={0.4}>
                      <Text fontSize="13px" color={MUTED}>No AS-REP roastable accounts found</Text>
                    </Flex>
                  )}
                  {findings.map(item => (
                    <FindingRow key={item._id} item={item} domain={session.domain} engId={engId}
                      onUpdate={handleUpdateFinding} cmdFn={asrepCmd} />
                  ))}
                  <Pager page={page} pages={pages} onPage={setPage} />
                  {findings.length > 0 && (
                    <Box px={4} py={3} borderTop={`1px solid ${BORDER}`} bg={CARD}>
                      <Flex align="center" justify="space-between">
                        <Text fontSize="11px" color={MUTED} fontFamily="mono">
                          GetNPUsers.py {session.domain}/ -usersfile users.txt -format hashcat -outputfile asrep.txt -dc-ip &lt;DC_IP&gt;
                        </Text>
                        <CopyBtn text={`GetNPUsers.py ${session.domain}/ -usersfile users.txt -format hashcat -outputfile asrep.txt -dc-ip <DC_IP>`} label="Copy" />
                      </Flex>
                    </Box>
                  )}
                </Box>
              )}

              {/* ── High Value ────────────────────────────────────────────── */}
              {tab === 'highvalue' && (
                <Box>
                  {/* Sub-tabs */}
                  <Flex gap={1} px={4} py={2.5} borderBottom={`1px solid ${BORDER}`} flexShrink={0}>
                    {[
                      { id:'da',     label:'Domain Admins',    badge: st.domainAdmins },
                      { id:'ea',     label:'Enterprise Admins',badge: st.enterpriseAdmins },
                      { id:'dcsync', label:'DCSync Rights',    badge: st.dcsyncRights },
                    ].map(t => (
                      <TabBtn key={t.id} label={t.label} badge={t.badge} active={hvTab===t.id} onClick={() => setHvTab(t.id)} />
                    ))}
                  </Flex>

                  <TableHead cols={[
                    { label:'Name', flex:'2', minW:'160px' },
                    { label:'Type', flex:'0.8', minW:'80px' },
                    { label:'Domain', flex:'1', minW:'100px' },
                    ...(hvTab==='dcsync' ? [{ label:'Right', flex:'1', minW:'100px' }, { label:'On Target', flex:'1', minW:'100px' }] : []),
                  ]} extra />

                  {findings.length === 0 && (
                    <Flex justify="center" py={12} opacity={0.4}>
                      <Text fontSize="13px" color={MUTED}>No results</Text>
                    </Flex>
                  )}
                  {findings.map(item => (
                    <SimpleRow key={item._id} item={item}
                      cols={[
                        { key:'name', flex:'2', minW:'160px',
                          render: i => (
                            <Flex align="center" gap={2}>
                              <Text fontSize="13px" fontWeight="semibold" color="white" noOfLines={1}>{i.name}</Text>
                              {i.adminCount && <Box px={1.5} py="1px" bg="rgba(252,74,74,0.12)" border="1px solid rgba(252,74,74,0.3)" borderRadius="4px" fontSize="9px" color={RED} fontWeight="bold">AC</Box>}
                            </Flex>
                          )
                        },
                        { key:'objectType', flex:'0.8', minW:'80px', render: i => <TypeBadge type={i.objectType} /> },
                        { key:'domain', flex:'1', minW:'100px', color: MUTED },
                        ...(hvTab==='dcsync' ? [
                          { key:'aclRight', flex:'1', minW:'100px', render: i => <Text fontSize="11px" color={RED} fontFamily="mono">{i.aclRight}</Text> },
                          { key:'targetName', flex:'1', minW:'100px', color: MUTED },
                        ] : []),
                      ]}
                      actions={item => (
                        <>
                          {hvTab === 'dcsync' && <CopyBtn text={dcsyncCmd(item, session.domain)} label="Copy DCSync command" />}
                          <CopyBtn text={item.name} label="Copy name" />
                        </>
                      )}
                    />
                  ))}
                  <Pager page={page} pages={pages} onPage={setPage} />
                </Box>
              )}

              {/* ── Delegation ────────────────────────────────────────────── */}
              {tab === 'delegation' && (
                <Box>
                  <Flex gap={1} px={4} py={2.5} borderBottom={`1px solid ${BORDER}`}>
                    {[
                      { id:'unconstrained', label:'Unconstrained', badge: st.unconstrainedDelegation },
                      { id:'constrained',   label:'Constrained',   badge: st.constrainedDelegation },
                    ].map(t => (
                      <TabBtn key={t.id} label={t.label} badge={t.badge} active={delTab===t.id} onClick={() => setDelTab(t.id)} />
                    ))}
                  </Flex>

                  {delTab === 'unconstrained' && (
                    <Box px={4} py={3} mb={2} bg="rgba(252,74,74,0.06)" border={`1px solid rgba(252,74,74,0.15)`}
                      borderRadius="10px" mx={4} mt={3}>
                      <Flex align="center" gap={2} mb={1}>
                        <Box w="6px" h="6px" borderRadius="full" bg={RED} />
                        <Text fontSize="11px" fontWeight="bold" color={RED}>Coercion + TGT Theft Opportunity</Text>
                      </Flex>
                      <Text fontSize="11px" color={MUTED}>
                        Compromise any listed host, then coerce DC auth (PetitPotam / PrinterBug) to capture a DC TGT and perform DCSync.
                      </Text>
                      <Flex mt={2} gap={2}>
                        <CopyBtn text="PetitPotam.py <UNCONSTRAINED_HOST> <DC_IP>" label="Copy coerce command" />
                        <Text fontSize="10px" color={MUTED} fontFamily="mono">PetitPotam.py &lt;UNCONS_HOST&gt; &lt;DC_IP&gt;</Text>
                      </Flex>
                    </Box>
                  )}

                  <TableHead cols={[
                    { label:'Host', flex:'2', minW:'160px' },
                    { label:'OS', flex:'1.5', minW:'120px' },
                    { label:'Domain', flex:'1', minW:'100px' },
                    ...(delTab==='constrained' ? [{ label:'Delegates To', flex:'2', minW:'160px' }] : []),
                  ]} extra />

                  {findings.length === 0 && (
                    <Flex justify="center" py={12} opacity={0.4}>
                      <Text fontSize="13px" color={MUTED}>No {delTab} delegation found</Text>
                    </Flex>
                  )}
                  {findings.map(item => (
                    <SimpleRow key={item._id} item={item}
                      cols={[
                        { key:'name', flex:'2', minW:'160px',
                          render: i => (
                            <Flex align="center" gap={2}>
                              <Box w="6px" h="6px" borderRadius="full" bg={delTab==='unconstrained'?RED:YELLOW}
                                boxShadow={`0 0 5px ${delTab==='unconstrained'?RED:YELLOW}80`} flexShrink={0} />
                              <Text fontSize="13px" fontWeight="semibold" color="white" noOfLines={1}>{i.name}</Text>
                            </Flex>
                          )
                        },
                        { key:'os', flex:'1.5', minW:'120px', color: MUTED,
                          render: i => <Text fontSize="11px" color={MUTED} noOfLines={1}>{i.os || '—'}</Text>
                        },
                        { key:'domain', flex:'1', minW:'100px', color: MUTED },
                        ...(delTab==='constrained' ? [{
                          key:'delegationTarget', flex:'2', minW:'160px',
                          render: i => <Text fontSize="11px" color={PURPLE} fontFamily="mono" noOfLines={1}>{(i.delegationTarget||[]).join(', ') || '—'}</Text>
                        }] : []),
                      ]}
                      actions={item => (
                        <>
                          {delTab==='unconstrained' && <CopyBtn text={unconstrainedCmd(item)} label="Copy monitor command" />}
                          <CopyBtn text={item.name} label="Copy hostname" />
                        </>
                      )}
                    />
                  ))}
                  <Pager page={page} pages={pages} onPage={setPage} />
                </Box>
              )}

              {/* ── ACL Paths ─────────────────────────────────────────────── */}
              {tab === 'acl' && (
                <Box>
                  <TableHead cols={[
                    { label:'Source Principal', flex:'2', minW:'160px' },
                    { label:'Right', flex:'1', minW:'100px' },
                    { label:'Target', flex:'1.5', minW:'120px' },
                    { label:'Target Type', flex:'0.8', minW:'80px' },
                    { label:'Type', flex:'0.8', minW:'80px' },
                  ]} extra />
                  {findings.length === 0 && (
                    <Flex justify="center" py={12} opacity={0.4}>
                      <Text fontSize="13px" color={MUTED}>No dangerous ACL paths found</Text>
                    </Flex>
                  )}
                  {findings.map(item => (
                    <SimpleRow key={item._id} item={item}
                      cols={[
                        { key:'name', flex:'2', minW:'160px',
                          render: i => <Text fontSize="13px" fontWeight="semibold" color="white" noOfLines={1}>{i.name||i.sid}</Text>
                        },
                        { key:'aclRight', flex:'1', minW:'100px',
                          render: i => (
                            <Box px={2} py="2px" borderRadius="6px" bg={A_S} border={`1px solid ${A_B}`}
                              fontSize="10px" color={ACCENT} fontFamily="mono" display="inline-block">
                              {i.aclRight}
                            </Box>
                          )
                        },
                        { key:'targetName', flex:'1.5', minW:'120px',
                          render: i => <Text fontSize="12px" color={RED} fontWeight="semibold" noOfLines={1}>{i.targetName}</Text>
                        },
                        { key:'targetType', flex:'0.8', minW:'80px', render: i => <TypeBadge type={i.targetType} /> },
                        { key:'objectType', flex:'0.8', minW:'80px', render: i => <TypeBadge type={i.objectType} /> },
                      ]}
                      actions={item => <CopyBtn text={`Add-DomainGroupMember -Identity "${item.targetName}" -Members "${item.name?.split('@')[0]}"`} label="Copy exploit command" />}
                    />
                  ))}
                  <Pager page={page} pages={pages} onPage={setPage} />
                </Box>
              )}

              {/* ── Trusts ────────────────────────────────────────────────── */}
              {tab === 'trusts' && (
                <Box>
                  <TableHead cols={[
                    { label:'Source Domain', flex:'1.5', minW:'140px' },
                    { label:'Target Domain', flex:'1.5', minW:'140px' },
                    { label:'Type', flex:'1', minW:'100px' },
                    { label:'Direction', flex:'1', minW:'100px' },
                  ]} />
                  {findings.length === 0 && (
                    <Flex justify="center" py={12} opacity={0.4}>
                      <Text fontSize="13px" color={MUTED}>No domain trusts found</Text>
                    </Flex>
                  )}
                  {findings.map(item => (
                    <SimpleRow key={item._id} item={item}
                      cols={[
                        { key:'name', flex:'1.5', minW:'140px',
                          render: i => <Text fontSize="12px" color="white" fontFamily="mono" noOfLines={1}>{i.name}</Text>
                        },
                        { key:'trustTarget', flex:'1.5', minW:'140px',
                          render: i => <Text fontSize="12px" color={BLUE} fontFamily="mono" noOfLines={1}>{i.trustTarget}</Text>
                        },
                        { key:'trustType', flex:'1', minW:'100px',
                          render: i => <Text fontSize="11px" color={MUTED}>{i.trustType||'—'}</Text>
                        },
                        { key:'trustDir', flex:'1', minW:'100px',
                          render: i => (
                            <Box px={2} py="2px" borderRadius="full"
                              bg={i.trustDir==='Transitive'?'rgba(249,115,22,0.1)':'rgba(104,211,145,0.1)'}
                              border={`1px solid ${i.trustDir==='Transitive'?ACCENT:GREEN}35`}
                              fontSize="10px" color={i.trustDir==='Transitive'?ACCENT:GREEN}
                              fontWeight="semibold" display="inline-block">
                              {i.trustDir||'—'}
                            </Box>
                          )
                        },
                      ]}
                    />
                  ))}
                </Box>
              )}

            </Box>
          </Flex>
        )}
      </Box>

      {/* ── Import modal ─────────────────────────────────────────────────────── */}
      <Modal isOpen={showImport} onClose={() => !uploading && setShowImport(false)} isCentered size="lg">
        <ModalOverlay bg="rgba(0,0,0,0.75)" backdropFilter="blur(8px)" />
        <ModalContent bg="var(--dash-card-bg)" border={`1px solid ${BORDER}`} borderRadius="16px">
          <ModalBody p={6}>
            <Flex justify="space-between" align="center" mb={5}>
              <Box>
                <Heading fontSize="16px" fontWeight="bold" color="white">Import BloodHound Data</Heading>
                <Text fontSize="12px" color={MUTED} mt={0.5}>ZIP or individual JSON files — up to 512 MB</Text>
              </Box>
              {!uploading && (
                <IconButton icon={<CloseIcon boxSize={2.5}/>} size="sm" variant="ghost"
                  color={MUTED} _hover={{ color:'white' }}
                  onClick={() => setShowImport(false)} aria-label="close" />
              )}
            </Flex>
            <DropZone onFiles={handleFiles} uploading={uploading || isProcessing} progress={progress} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default BloodHoundView;
