import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select, Textarea,
  Spinner, Tooltip, useToast,
  Modal, ModalOverlay, ModalContent, ModalBody, ModalHeader, ModalFooter, ModalCloseButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, CopyIcon, CheckIcon, RepeatIcon, DownloadIcon,
  SearchIcon, ViewIcon, ViewOffIcon, AttachmentIcon, LinkIcon, InfoIcon,
  WarningTwoIcon, LockIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Theme — gold accent for "leaked / stolen goods" ───────────────────────────
const ACCENT  = '#ECC94B';
const A_S     = 'rgba(236,201,75,0.07)';
const A_B     = 'rgba(236,201,75,0.28)';
const GREEN   = '#68D391';
const RED     = '#FC8181';
const ORANGE  = '#F6AD55';
const BLUE    = '#63B3ED';
const VIOLET  = '#B794F4';
const TEAL    = '#4FD1C5';
const MUTED   = 'var(--dash-text-muted)';
const CARD_BG = 'var(--dash-card-bg)';
const CARD_BD = 'var(--dash-card-border)';

const tok = () => localStorage.getItem('token') || '';

const SEVERITY_META = {
  low:      { color: MUTED,  label: 'Low'      },
  medium:   { color: BLUE,   label: 'Medium'   },
  high:     { color: ORANGE, label: 'High'     },
  critical: { color: RED,    label: 'Critical' },
};

const TYPE_META = {
  credentials: { color: ACCENT, label: 'Credentials', icon: LockIcon       },
  file:        { color: VIOLET, label: 'File',         icon: AttachmentIcon },
  pastebin:    { color: BLUE,   label: 'Pastebin',     icon: CopyIcon       },
  link:        { color: TEAL,   label: 'Link',         icon: LinkIcon       },
  note:        { color: MUTED,  label: 'Note',         icon: InfoIcon       },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtBytes = (n) => {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const fmtRelative = (d) => {
  if (!d) return '';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const hashHue = (str = '') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
};

// ── CopyBtn ────────────────────────────────────────────────────────────────────
const CopyBtn = ({ text, size = 'xs', label = 'Copy' }) => {
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

// ── Credentials table (used inside detail modal) ──────────────────────────────
const CredentialRow = ({ cred, index, revealAll }) => {
  const [show, setShow] = useState(false);
  const revealed = show || revealAll;
  const id = cred.email || cred.username || '';
  const target = cred.url || cred.domain || '';
  return (
    <Flex align="center" gap={3} px={4} py="9px"
      borderBottom={`1px solid ${CARD_BD}`}
      _hover={{ bg: 'rgba(255,255,255,0.025)' }}>
      <Text flex="0 0 36px" fontSize="10px" color={MUTED} fontFamily="mono" textAlign="right">
        {index + 1}
      </Text>

      {/* URL / Domain */}
      <Flex flex="2" minW={0} align="center" gap={1}>
        <Text fontSize="11px" color={target ? BLUE : MUTED} fontFamily="mono" noOfLines={1}>
          {target || '—'}
        </Text>
        {target && <CopyBtn text={target} />}
      </Flex>

      {/* Username / Email */}
      <Flex flex="2" minW={0} align="center" gap={1}>
        <Text fontSize="11px" color={id ? 'var(--dash-text-primary)' : MUTED}
          fontFamily="mono" noOfLines={1}>
          {id || '—'}
        </Text>
        {id && <CopyBtn text={id} />}
      </Flex>

      {/* Password */}
      <Flex flex="2" minW={0} align="center" gap={1}>
        <Text fontSize="11px" color={revealed ? ACCENT : MUTED}
          fontFamily="mono" noOfLines={1} letterSpacing={revealed ? 'normal' : '1px'}>
          {cred.password
            ? (revealed ? cred.password : '•'.repeat(Math.min(cred.password.length, 16)))
            : '—'}
        </Text>
        {cred.password && (
          <>
            <IconButton size="xs" variant="ghost"
              icon={revealed ? <ViewOffIcon /> : <ViewIcon />}
              color={MUTED} _hover={{ color: ACCENT }}
              onClick={() => setShow(s => !s)} aria-label="toggle" />
            <CopyBtn text={cred.password} />
          </>
        )}
      </Flex>
    </Flex>
  );
};

// ── Detail modal ──────────────────────────────────────────────────────────────
const DetailModal = ({ isOpen, onClose, entry, engId, onDelete, onReload }) => {
  const [revealAll, setRevealAll] = useState(false);
  const [credLimit, setCredLimit] = useState(200);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  useEffect(() => { if (isOpen) { setRevealAll(false); setCredLimit(200); } }, [isOpen, entry?._id]);

  if (!entry) return null;
  const meta  = TYPE_META[entry.type] || TYPE_META.credentials;
  const sev   = SEVERITY_META[entry.severity] || SEVERITY_META.medium;
  const creds = entry.credentials || [];

  const downloadFile = async () => {
    setDownloading(true);
    try {
      const r = await fetch(`/api/leaks/${engId}/entries/${entry._id}/download`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (!r.ok) throw new Error('Download failed');
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u; a.download = entry.file?.filename || 'download';
      a.click();
      URL.revokeObjectURL(u);
    } catch (e) {
      toast({ title: 'Download failed', status: 'error', duration: 2000, isClosable: true });
    } finally { setDownloading(false); }
  };

  const exportUlp = () => {
    const lines = creds
      .filter(c => (c.email || c.username) && c.password)
      .map(c => {
        const id = c.email || c.username;
        const url = c.url || c.domain;
        return url ? `${url}:${id}:${c.password}` : `${id}:${c.password}`;
      });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u; a.download = `${entry.targetDomain || 'creds'}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(u);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(8px)" bg="rgba(0,0,0,0.55)" />
      <ModalContent bg={CARD_BG} border={`1px solid ${CARD_BD}`} borderRadius="14px" maxH="85vh">
        <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
          style={{ background: `linear-gradient(to right, transparent, ${meta.color}90, transparent)` }} />

        <ModalHeader pb={2} pr={10}>
          <Flex align="center" gap={2} mb={1}>
            <meta.icon boxSize={3.5} color={meta.color} />
            <Text fontSize="9px" fontWeight="black" color={meta.color}
              textTransform="uppercase" letterSpacing="wider">
              {meta.label}
            </Text>
            <Box w="4px" h="4px" borderRadius="full" bg={MUTED} />
            <Text fontSize="9px" fontWeight="bold" color={sev.color}
              textTransform="uppercase" letterSpacing="wider">
              {sev.label}
            </Text>
          </Flex>
          <Text fontSize="16px" color="var(--dash-text-primary)">{entry.title}</Text>
        </ModalHeader>
        <ModalCloseButton color={MUTED} />

        <ModalBody>
          {/* Metadata grid */}
          <Flex gap={3} mb={4} flexWrap="wrap">
            {entry.targetDomain && (
              <Flex align="center" gap={1.5} px={3} py="6px" borderRadius="8px"
                bg={`${ACCENT}10`} border={`1px solid ${A_B}`}>
                <Text fontSize="9px" fontWeight="black" color={ACCENT}
                  textTransform="uppercase" letterSpacing="wider">TARGET</Text>
                <Text fontSize="11px" fontFamily="mono" color="var(--dash-text-primary)">
                  {entry.targetDomain}
                </Text>
              </Flex>
            )}
            {entry.source && (
              <Flex align="center" gap={1.5} px={3} py="6px" borderRadius="8px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}>
                <Text fontSize="9px" fontWeight="black" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">SOURCE</Text>
                <Text fontSize="11px" color="var(--dash-text-primary)">{entry.source}</Text>
              </Flex>
            )}
            {entry.createdByOperatorName && (
              <Flex align="center" gap={1.5} px={3} py="6px" borderRadius="8px"
                bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}>
                <Box w="6px" h="6px" borderRadius="full"
                  bg={`hsl(${hashHue(entry.createdByOperatorName)}, 65%, 60%)`} />
                <Text fontSize="11px" color="var(--dash-text-secondary)">
                  {entry.createdByOperatorName}
                </Text>
              </Flex>
            )}
            <Flex align="center" gap={1.5} px={3} py="6px" borderRadius="8px"
              bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}>
              <Text fontSize="10px" color={MUTED}>{fmtRelative(entry.createdAt)}</Text>
            </Flex>
          </Flex>

          {entry.tags?.length > 0 && (
            <Flex gap={1.5} flexWrap="wrap" mb={4}>
              {entry.tags.map(t => (
                <Box key={t} px="7px" py="2px" borderRadius="5px" fontSize="10px"
                  bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}
                  color="var(--dash-text-secondary)">
                  #{t}
                </Box>
              ))}
            </Flex>
          )}

          {/* Type-specific body */}
          {entry.type === 'link' && entry.url && (
            <Box p={4} borderRadius="10px" bg="rgba(255,255,255,0.03)"
              border={`1px solid ${CARD_BD}`} mb={4}>
              <Text fontSize="9px" fontWeight="bold" color={MUTED}
                textTransform="uppercase" letterSpacing="wider" mb={2}>URL</Text>
              <Flex align="center" gap={2}>
                <Text fontSize="12px" fontFamily="mono" color={TEAL}
                  flex={1} noOfLines={3} wordBreak="break-all">{entry.url}</Text>
                <CopyBtn text={entry.url} />
                <Tooltip label="Open" hasArrow fontSize="10px">
                  <IconButton size="xs" variant="ghost" icon={<LinkIcon />} color={MUTED}
                    _hover={{ color: TEAL }}
                    onClick={() => window.open(entry.url, '_blank', 'noopener')}
                    aria-label="open" />
                </Tooltip>
              </Flex>
            </Box>
          )}

          {entry.type === 'file' && entry.file && (
            <Flex align="center" gap={4} p={4} borderRadius="10px" mb={4}
              bg={`${VIOLET}08`} border={`1px solid ${VIOLET}28`}>
              <Box w="40px" h="40px" borderRadius="10px"
                bg={`${VIOLET}18`} border={`1px solid ${VIOLET}35`}
                display="flex" alignItems="center" justifyContent="center">
                <AttachmentIcon boxSize={4} color={VIOLET} />
              </Box>
              <Box flex={1} minW={0}>
                <Text fontSize="13px" fontWeight="semibold"
                  color="var(--dash-text-primary)" noOfLines={1}>
                  {entry.file.filename}
                </Text>
                <Text fontSize="11px" color={MUTED} mt={0.5}>
                  {fmtBytes(entry.file.size)} · {entry.file.mimetype || 'application/octet-stream'}
                </Text>
              </Box>
              <Button size="sm" borderRadius="8px" fontWeight="semibold" fontSize="11px"
                bg={`${VIOLET}18`} border={`1px solid ${VIOLET}40`}
                color={VIOLET} _hover={{ bg: `${VIOLET}28` }}
                leftIcon={downloading ? <Spinner size="xs" /> : <DownloadIcon boxSize={3} />}
                onClick={downloadFile} isDisabled={downloading}>
                Download
              </Button>
            </Flex>
          )}

          {entry.notes && (
            <Box mb={4}>
              <Text fontSize="9px" fontWeight="bold" color={MUTED}
                textTransform="uppercase" letterSpacing="wider" mb={2}>NOTES</Text>
              <Text fontSize="12px" color="var(--dash-text-secondary)"
                whiteSpace="pre-wrap" lineHeight="1.55">{entry.notes}</Text>
            </Box>
          )}

          {/* Credentials table */}
          {creds.length > 0 && (
            <Box borderRadius="10px" bg={CARD_BG}
              border={`1px solid ${CARD_BD}`} overflow="hidden" mb={4}>
              <Flex align="center" justify="space-between" px={4} py={3}
                borderBottom={`1px solid ${CARD_BD}`}>
                <Flex align="center" gap={2}>
                  <LockIcon boxSize={3} color={ACCENT} />
                  <Text fontSize="10px" fontWeight="bold" color={MUTED}
                    textTransform="uppercase" letterSpacing="wider">
                    Parsed Credentials
                  </Text>
                  <Box px="7px" py="1px" borderRadius="full" bg={A_S} border={`1px solid ${A_B}`}>
                    <Text fontSize="10px" fontWeight="bold" color={ACCENT}>
                      {creds.length.toLocaleString()}
                    </Text>
                  </Box>
                </Flex>
                <Flex gap={1.5}>
                  <Button size="xs" h="24px" px={3} borderRadius="6px"
                    fontSize="10px" fontWeight="bold"
                    bg={revealAll ? `${ACCENT}18` : 'transparent'}
                    color={revealAll ? ACCENT : MUTED}
                    border={`1px solid ${revealAll ? A_B : CARD_BD}`}
                    _hover={{ color: ACCENT }}
                    leftIcon={revealAll ? <ViewOffIcon boxSize={2.5} /> : <ViewIcon boxSize={2.5} />}
                    onClick={() => setRevealAll(v => !v)}>
                    {revealAll ? 'Hide all' : 'Reveal all'}
                  </Button>
                  <Button size="xs" h="24px" px={3} borderRadius="6px"
                    fontSize="10px" fontWeight="bold"
                    bg={`${ACCENT}12`} border={`1px solid ${A_B}`} color={ACCENT}
                    _hover={{ bg: `${ACCENT}22` }}
                    leftIcon={<DownloadIcon boxSize={2.5} />}
                    onClick={exportUlp}>
                    Export ULP
                  </Button>
                </Flex>
              </Flex>

              {/* Table header */}
              <Flex align="center" gap={3} px={4} py="7px"
                bg="rgba(255,255,255,0.015)"
                borderBottom={`1px solid ${CARD_BD}`}>
                <Text flex="0 0 36px" />
                <Text flex="2" fontSize="9px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">URL / Domain</Text>
                <Text flex="2" fontSize="9px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">User / Email</Text>
                <Text flex="2" fontSize="9px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">Password</Text>
              </Flex>

              <Box maxH="360px" overflowY="auto"
                css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: A_B } }}>
                {creds.slice(0, credLimit).map((c, i) => (
                  <CredentialRow key={i} cred={c} index={i} revealAll={revealAll} />
                ))}
              </Box>

              {creds.length > credLimit && (
                <Flex align="center" justify="center" py={3}
                  borderTop={`1px solid ${CARD_BD}`} gap={3}>
                  <Text fontSize="10px" color={MUTED}>
                    Showing {credLimit.toLocaleString()} of {creds.length.toLocaleString()}
                  </Text>
                  <Button size="xs" variant="ghost" color={ACCENT}
                    onClick={() => setCredLimit(l => l + 500)}>
                    Load more
                  </Button>
                </Flex>
              )}
            </Box>
          )}

          {/* Raw content */}
          {entry.rawContent && (
            <Box borderRadius="10px" bg="rgba(6,8,12,0.8)"
              border={`1px solid ${CARD_BD}`} overflow="hidden">
              <Flex align="center" justify="space-between" px={4} py="9px"
                borderBottom={`1px solid ${CARD_BD}`}>
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">Raw Content</Text>
                <CopyBtn text={entry.rawContent} />
              </Flex>
              <Box p={4} maxH="260px" overflowY="auto"
                css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)' } }}>
                <Text fontSize="11px" color="#a8d8c8" fontFamily="'Courier New', monospace"
                  whiteSpace="pre-wrap" lineHeight="1.55">
                  {entry.rawContent.slice(0, 10000)}
                  {entry.rawContent.length > 10000 && `\n\n… ${(entry.rawContent.length - 10000).toLocaleString()} more chars (copy to view all)`}
                </Text>
              </Box>
            </Box>
          )}
        </ModalBody>

        <ModalFooter gap={2}>
          <Button size="sm" variant="ghost" color={MUTED}
            _hover={{ color: RED, bg: 'rgba(252,129,129,0.1)' }}
            leftIcon={<DeleteIcon />} onClick={() => onDelete(entry._id)}>
            Delete
          </Button>
          <Box flex={1} />
          <Button size="sm" variant="ghost" color={MUTED}
            _hover={{ color: 'white' }} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ── Confirm-delete modal ──────────────────────────────────────────────────────
const ConfirmDeleteModal = ({ entry, onClose, onConfirm }) => {
  const isOpen = !!entry;
  const meta = entry ? (TYPE_META[entry.type] || TYPE_META.credentials) : null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(8px)" bg="rgba(0,0,0,0.6)" />
      <ModalContent bg={CARD_BG} border={`1px solid ${CARD_BD}`} borderRadius="14px">
        <Box pos="absolute" top={0} left={0} right={0} h="2px" borderRadius="14px 14px 0 0"
          style={{ background: `linear-gradient(to right, transparent, ${RED}90, transparent)` }} />

        <ModalBody py={6}>
          <Flex direction="column" align="center" gap={4}>
            {/* Warning icon circle */}
            <Box w="52px" h="52px" borderRadius="full"
              bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.28)"
              display="flex" alignItems="center" justifyContent="center">
              <WarningTwoIcon boxSize={5} color={RED} />
            </Box>

            <Box textAlign="center">
              <Text fontSize="16px" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
                Delete this entry?
              </Text>
              <Text fontSize="12px" color="var(--dash-text-secondary)">
                This cannot be undone
                {entry?.credCount > 0 && ` · ${entry.credCount.toLocaleString()} credentials will be lost`}
                {entry?.file && ` · file will be removed from disk`}
              </Text>
            </Box>

            {/* Entry preview */}
            {entry && (
              <Box w="full" p={3} borderRadius="10px"
                bg="rgba(255,255,255,0.025)" border={`1px solid ${CARD_BD}`}>
                <Flex align="center" gap={2} mb={1}>
                  {meta && <meta.icon boxSize={3} color={meta.color} />}
                  <Text fontSize="9px" fontWeight="black" color={meta?.color}
                    textTransform="uppercase" letterSpacing="wider">
                    {meta?.label}
                  </Text>
                </Flex>
                <Text fontSize="12px" fontWeight="semibold"
                  color="var(--dash-text-primary)" noOfLines={1}>
                  {entry.title}
                </Text>
                {(entry.targetDomain || entry.source) && (
                  <Flex align="center" gap={2} mt={1}>
                    {entry.targetDomain && (
                      <Text fontSize="10px" fontFamily="mono" color={ACCENT}
                        noOfLines={1}>{entry.targetDomain}</Text>
                    )}
                    {entry.targetDomain && entry.source && (
                      <Box w="3px" h="3px" borderRadius="full" bg={MUTED} />
                    )}
                    {entry.source && (
                      <Text fontSize="10px" color={MUTED} noOfLines={1}>
                        {entry.source}
                      </Text>
                    )}
                  </Flex>
                )}
              </Box>
            )}
          </Flex>
        </ModalBody>

        <ModalFooter gap={2} pt={0}>
          <Button flex={1} size="sm" h="38px" borderRadius="9px" fontWeight="semibold" fontSize="12px"
            bg="rgba(255,255,255,0.04)" border={`1px solid ${CARD_BD}`}
            color="var(--dash-text-secondary)"
            _hover={{ bg: 'rgba(255,255,255,0.08)', color: 'var(--dash-text-primary)' }}
            onClick={onClose}>
            Cancel
          </Button>
          <Button flex={1} size="sm" h="38px" borderRadius="9px" fontWeight="semibold" fontSize="12px"
            bg="rgba(252,129,129,0.14)" border={`1px solid ${RED}50`}
            color={RED} _hover={{ bg: 'rgba(252,129,129,0.24)' }}
            leftIcon={<DeleteIcon boxSize={2.5} />}
            onClick={onConfirm}>
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ── Main View ──────────────────────────────────────────────────────────────────
const LeaksCredentialsView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const eng           = getBySlug(slug);
  const engId         = eng?._id;
  const toast         = useToast();

  const [entries,   setEntries]   = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(false);

  const [filter,    setFilter]    = useState('all');  // all | credentials | file | pastebin | link | note | critical
  const [query,     setQuery]     = useState('');
  const [targetFilter, setTargetFilter] = useState(null);

  // Add-entry form state
  const [formType,     setFormType]     = useState('credentials');
  const [title,        setTitle]        = useState('');
  const [source,       setSource]       = useState('');
  const [targetDomain, setTargetDomain] = useState('');
  const [severity,     setSeverity]     = useState('medium');
  const [tagsText,     setTagsText]     = useState('');
  const [notes,        setNotes]        = useState('');
  const [rawContent,   setRawContent]   = useState('');
  const [linkUrl,      setLinkUrl]      = useState('');
  const [file,         setFile]         = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  // Detail modal
  const [selectedId, setSelectedId] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Delete-confirmation modal
  const [pendingDelete, setPendingDelete] = useState(null); // entry object

  const fileRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    if (!engId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/leaks/${engId}/entries`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (r.ok) setEntries(await r.json());
    } catch (_) {} finally { setLoading(false); }
  }, [engId]);

  const fetchStats = useCallback(async () => {
    if (!engId) return;
    try {
      const r = await fetch(`/api/leaks/${engId}/stats`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (r.ok) setStats(await r.json());
    } catch (_) {}
  }, [engId]);

  useEffect(() => { fetchEntries(); fetchStats(); }, [fetchEntries, fetchStats]);

  // Load detail on modal open
  useEffect(() => {
    if (!selectedId) { setSelectedEntry(null); return; }
    (async () => {
      try {
        const r = await fetch(`/api/leaks/${engId}/entries/${selectedId}`, {
          headers: { Authorization: `Bearer ${tok()}` },
        });
        if (r.ok) setSelectedEntry(await r.json());
      } catch (_) {}
    })();
  }, [selectedId, engId]);

  // ── Filters ──────────────────────────────────────────────────────────────────
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(e => {
      if (filter === 'critical' && e.severity !== 'critical' && e.severity !== 'high') return false;
      if (filter !== 'all' && filter !== 'critical' && e.type !== filter) return false;
      if (targetFilter && e.targetDomain !== targetFilter) return false;
      if (q) {
        const hay = `${e.title || ''} ${e.source || ''} ${e.targetDomain || ''} ${(e.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, filter, query, targetFilter]);

  // ── Create entry ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setTitle(''); setSource(''); setTargetDomain('');
    setSeverity('medium'); setTagsText(''); setNotes('');
    setRawContent(''); setLinkUrl(''); setFile(null);
  };

  const submitEntry = async () => {
    if (formType === 'credentials' && !rawContent.trim() && !file) {
      toast({ title: 'Paste credentials or attach a file', status: 'warning',
        duration: 2500, isClosable: true });
      return;
    }
    if (formType === 'file' && !file) {
      toast({ title: 'Select a file to upload', status: 'warning',
        duration: 2500, isClosable: true });
      return;
    }
    if (formType === 'link' && !linkUrl.trim()) {
      toast({ title: 'Enter a URL', status: 'warning', duration: 2500, isClosable: true });
      return;
    }
    if ((formType === 'pastebin' || formType === 'note') && !rawContent.trim()) {
      toast({ title: 'Add some content', status: 'warning', duration: 2500, isClosable: true });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('type',         formType);
      fd.append('title',        title);
      fd.append('source',       source);
      fd.append('targetDomain', targetDomain);
      fd.append('severity',     severity);
      fd.append('tags',         tagsText);
      fd.append('notes',        notes);
      if (rawContent) fd.append('rawContent', rawContent);
      if (linkUrl)    fd.append('url', linkUrl);
      if (file)       fd.append('file', file);

      const r = await fetch(`/api/leaks/${engId}/entries`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}` },
        body: fd,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      const created = await r.json();
      const lightCreated = { ...created };
      delete lightCreated.credentials;
      delete lightCreated.rawContent;
      setEntries(p => [lightCreated, ...p]);
      fetchStats();
      resetForm();
      toast({
        title: 'Entry added',
        description: created.credCount
          ? `${created.credCount.toLocaleString()} credentials parsed`
          : `${TYPE_META[formType]?.label || 'Entry'} saved`,
        status: 'success', duration: 2500, isClosable: true,
      });
    } catch (e) {
      toast({ title: 'Error', description: e.message, status: 'error',
        duration: 4000, isClosable: true });
    } finally { setSubmitting(false); }
  };

  const deleteEntry = async (id) => {
    try {
      await fetch(`/api/leaks/${engId}/entries/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      setEntries(p => p.filter(e => e._id !== id));
      fetchStats();
      if (selectedId === id) setSelectedId(null);
      toast({ title: 'Deleted', status: 'success', duration: 1500, isClosable: true });
    } catch (_) {
      toast({ title: 'Delete failed', status: 'error', duration: 2000, isClosable: true });
    }
  };

  const downloadAllUlp = async () => {
    try {
      const r = await fetch(`/api/leaks/${engId}/export-ulp`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u; a.download = `all-credentials-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(u);
    } catch (_) {}
  };

  // ── File drag-drop ───────────────────────────────────────────────────────────
  const handleFileSelect = (f) => {
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name);
  };
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFileSelect(f);
  };

  // ── Counts ───────────────────────────────────────────────────────────────────
  const filterCounts = useMemo(() => {
    const bt = stats?.byType || {};
    return {
      all:         entries.length,
      credentials: bt.credentials || 0,
      file:        bt.file        || 0,
      pastebin:    bt.pastebin    || 0,
      link:        bt.link        || 0,
      note:        bt.note        || 0,
      critical: entries.filter(e => e.severity === 'critical' || e.severity === 'high').length,
    };
  }, [entries, stats]);

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box mb={5}>
        <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
          Leaks &amp; <Text as="span" color="red.400">Credentials</Text>
        </Heading>
        <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
          {eng?.name} · ULP dumps, stealer logs, pastebins, files and links — parsed and searchable
        </Text>
      </Box>

      {/* ── Info banner ─────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px" bg={A_S} border={`1px solid ${A_B}`}>
        <Flex align="center" gap={2} mb={1.5}>
          <WarningTwoIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            Sensitive Data Vault — Engagement-Scoped
          </Text>
        </Flex>
        <Flex gap={5} flexWrap="wrap">
          {[
            'Paste ULP / combo lists (url:user:pass · user:pass · email:pass) — auto-parsed into searchable credentials',
            'Upload stealer logs, dumps, CSVs and raw files up to 512 MB',
            'Save pastebins, external links and free-form intel notes',
            'Everything is engagement-scoped and never leaves your instance',
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
        {/* ── Left column ─────────────────────────────────────────────────── */}
        <Flex direction="column" flex="1" gap={4} pr={6} minW={0}>

          {/* ── Add Entry card ────────────────────────────────────────────── */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />

            <Flex align="center" justify="space-between" px={5} py={3}
              borderBottom={`1px solid ${CARD_BD}`}>
              <Flex align="center" gap={2}>
                <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">New Entry</Text>
              </Flex>

              {/* Type pills */}
              <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="7px"
                border={`1px solid ${CARD_BD}`} p="3px">
                {['credentials', 'file', 'pastebin', 'link', 'note'].map(t => {
                  const tm = TYPE_META[t];
                  const act = formType === t;
                  return (
                    <Button key={t} size="xs" h="22px" px={3} borderRadius="5px"
                      fontSize="10px" fontWeight="bold"
                      bg={act ? `${tm.color}18` : 'transparent'}
                      color={act ? tm.color : MUTED}
                      border={act ? `1px solid ${tm.color}40` : '1px solid transparent'}
                      _hover={{ color: tm.color }}
                      onClick={() => { setFormType(t); setFile(null); setRawContent(''); setLinkUrl(''); }}>
                      {tm.label}
                    </Button>
                  );
                })}
              </Flex>
            </Flex>

            <Box px={5} py={4}>
              {/* Common meta row: title + target + source */}
              <Flex gap={3} mb={3} flexWrap="wrap">
                <Box flex={2} minW="200px">
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">Title</Text>
                  <Input h="36px" fontSize="sm" borderRadius="8px"
                    bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                    color="var(--dash-text-primary)"
                    _placeholder={{ color: MUTED, fontSize: '12px' }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder="Optional — auto-generated if blank"
                    value={title} onChange={e => setTitle(e.target.value)} />
                </Box>
                <Box flex={1} minW="160px">
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">Target Domain</Text>
                  <Input h="36px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                    bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                    color="var(--dash-text-primary)"
                    _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '12px' }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder="example.com"
                    value={targetDomain} onChange={e => setTargetDomain(e.target.value)} />
                </Box>
                <Box flex={1} minW="160px">
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">Source</Text>
                  <Input h="36px" fontSize="sm" borderRadius="8px"
                    bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                    color="var(--dash-text-primary)"
                    _placeholder={{ color: MUTED, fontSize: '12px' }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder="BreachForums · stealer log · …"
                    value={source} onChange={e => setSource(e.target.value)} />
                </Box>
              </Flex>

              {/* Severity + tags row */}
              <Flex gap={3} mb={3} flexWrap="wrap">
                <Box flex={1} minW="240px">
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1.5}
                    textTransform="uppercase" letterSpacing="wider">Severity</Text>
                  <Flex gap={1} bg="rgba(255,255,255,0.03)" borderRadius="8px"
                    border={`1px solid ${CARD_BD}`} p="3px" h="36px">
                    {['low', 'medium', 'high', 'critical'].map(s => {
                      const meta = SEVERITY_META[s];
                      const act  = severity === s;
                      return (
                        <Button key={s} flex={1} size="xs" h="auto" borderRadius="6px"
                          fontSize="10px" fontWeight="bold"
                          bg={act ? `${meta.color}18` : 'transparent'}
                          color={act ? meta.color : MUTED}
                          border={act ? `1px solid ${meta.color}40` : '1px solid transparent'}
                          _hover={{ color: meta.color }}
                          onClick={() => setSeverity(s)}>
                          {meta.label}
                        </Button>
                      );
                    })}
                  </Flex>
                </Box>
                <Box flex={2} minW="200px">
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">Tags (comma-separated)</Text>
                  <Input h="36px" fontSize="sm" borderRadius="8px"
                    bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                    color="var(--dash-text-primary)"
                    _placeholder={{ color: MUTED, fontSize: '12px' }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder="stealer, redline, 2024, c-level"
                    value={tagsText} onChange={e => setTagsText(e.target.value)} />
                </Box>
              </Flex>

              {/* Type-specific fields */}
              {formType === 'credentials' && (
                <Box mb={3}>
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">
                    Paste Credentials <Text as="span" color={MUTED} textTransform="none" fontWeight="normal">
                      · url:user:pass · email:pass · user:pass — one per line
                    </Text>
                  </Text>
                  <Textarea fontSize="11px" fontFamily="mono" borderRadius="8px" minH="120px"
                    bg="rgba(6,8,12,0.6)" border={`1px solid ${CARD_BD}`}
                    color="#a8d8c8"
                    _placeholder={{ color: MUTED, fontFamily: 'sans-serif' }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder={'https://example.com:alice@corp.local:hunter2\nbob@corp.local:qwerty123\ncarol:P@ssw0rd!'}
                    value={rawContent} onChange={e => setRawContent(e.target.value)}
                    resize="vertical" />
                  {rawContent && (
                    <Text fontSize="10px" color={MUTED} mt={1}>
                      {rawContent.split('\n').filter(l => l.trim()).length.toLocaleString()} line(s) · will be auto-parsed on save
                    </Text>
                  )}
                </Box>
              )}

              {(formType === 'file' || (formType === 'credentials')) && (
                <Box mb={3}>
                  <input ref={fileRef} type="file" style={{ display: 'none' }}
                    onChange={e => handleFileSelect(e.target.files?.[0])} />
                  {file ? (
                    <Flex align="center" gap={3} px={4} py={3} borderRadius="9px"
                      bg={`${VIOLET}08`} border={`1px solid ${VIOLET}30`}>
                      <Box w="32px" h="32px" borderRadius="8px"
                        bg={`${VIOLET}18`} border={`1px solid ${VIOLET}30`}
                        display="flex" alignItems="center" justifyContent="center">
                        <AttachmentIcon boxSize={3.5} color={VIOLET} />
                      </Box>
                      <Box flex={1} minW={0}>
                        <Text fontSize="12px" fontWeight="semibold"
                          color="var(--dash-text-primary)" noOfLines={1}>{file.name}</Text>
                        <Text fontSize="10px" color={MUTED} mt={0.5}>
                          {fmtBytes(file.size)} · {file.type || 'application/octet-stream'}
                        </Text>
                      </Box>
                      <IconButton size="sm" variant="ghost" icon={<DeleteIcon />}
                        color={MUTED} _hover={{ color: RED }}
                        onClick={() => setFile(null)} aria-label="remove" />
                    </Flex>
                  ) : (
                    <Box
                      borderRadius="9px" border={`2px dashed ${dragOver ? A_B : CARD_BD}`}
                      bg={dragOver ? A_S : 'rgba(255,255,255,0.02)'}
                      transition="all 0.2s" cursor="pointer" py={formType === 'file' ? 8 : 5}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}>
                      <Flex direction="column" align="center" gap={2}>
                        <Box as="svg" viewBox="0 0 24 24" w="20px" h="20px" fill="none"
                          stroke={dragOver ? ACCENT : MUTED} strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </Box>
                        <Text fontSize="11px" fontWeight="semibold"
                          color={dragOver ? ACCENT : 'var(--dash-text-primary)'}>
                          {dragOver ? 'Drop to upload'
                            : formType === 'file' ? 'Drop a file or click to browse'
                            : 'Optionally attach the raw file too'}
                        </Text>
                        <Text fontSize="10px" color={MUTED}>Up to 512 MB</Text>
                      </Flex>
                    </Box>
                  )}
                </Box>
              )}

              {formType === 'link' && (
                <Box mb={3}>
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">URL</Text>
                  <Input h="38px" fontSize="sm" fontFamily="mono" borderRadius="8px"
                    bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                    color="var(--dash-text-primary)"
                    _placeholder={{ color: MUTED, fontFamily: 'sans-serif', fontSize: '12px' }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder="https://breachforums.st/Thread-…"
                    value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
                </Box>
              )}

              {formType === 'pastebin' && (
                <Box mb={3}>
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">Pastebin Content</Text>
                  <Textarea fontSize="11px" fontFamily="mono" borderRadius="8px" minH="160px"
                    bg="rgba(6,8,12,0.6)" border={`1px solid ${CARD_BD}`}
                    color="#a8d8c8"
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder="Paste the full content from pastebin.com / ghostbin / rentry here…"
                    value={rawContent} onChange={e => setRawContent(e.target.value)}
                    resize="vertical" />
                </Box>
              )}

              {formType === 'note' && (
                <Box mb={3}>
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">Note Content</Text>
                  <Textarea fontSize="12px" borderRadius="8px" minH="100px"
                    bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                    color="var(--dash-text-primary)"
                    _placeholder={{ color: MUTED }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder="Free-form intel, findings, context for the team…"
                    value={rawContent} onChange={e => setRawContent(e.target.value)}
                    resize="vertical" />
                </Box>
              )}

              {/* Notes (secondary) */}
              {formType !== 'note' && (
                <Box mb={3}>
                  <Text fontSize="9px" fontWeight="bold" color={MUTED} mb={1}
                    textTransform="uppercase" letterSpacing="wider">Notes (optional)</Text>
                  <Input h="36px" fontSize="sm" borderRadius="8px"
                    bg="rgba(255,255,255,0.03)" border={`1px solid ${CARD_BD}`}
                    color="var(--dash-text-primary)"
                    _placeholder={{ color: MUTED, fontSize: '12px' }}
                    _focus={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}`, outline: 'none' }}
                    placeholder="Context, tested status, priority notes…"
                    value={notes} onChange={e => setNotes(e.target.value)} />
                </Box>
              )}

              {/* Submit */}
              <Flex justify="flex-end" gap={2}>
                <Button size="sm" variant="ghost" color={MUTED}
                  _hover={{ color: 'white' }} onClick={resetForm}>
                  Clear
                </Button>
                <Button size="sm" h="36px" px={5} borderRadius="8px" fontWeight="semibold" fontSize="12px"
                  bg={`${ACCENT}15`} border={`1px solid ${A_B}`}
                  color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                  leftIcon={submitting ? <Spinner size="xs" /> : <AddIcon boxSize={2.5} />}
                  onClick={submitEntry} isDisabled={submitting}>
                  Save Entry
                </Button>
              </Flex>
            </Box>
          </Box>

          {/* ── Stats strip ─────────────────────────────────────────────── */}
          <Flex gap={3}>
            {[
              { label: 'Entries',     value: stats?.totalEntries   ?? entries.length, color: ACCENT },
              { label: 'Credentials', value: stats?.totalCreds     ?? 0,               color: GREEN  },
              { label: 'Targets',     value: stats?.topTargets?.length ?? 0,           color: BLUE   },
              { label: 'Critical',    value: (stats?.bySeverity?.critical ?? 0) +
                                             (stats?.bySeverity?.high     ?? 0),
                                     color: (stats?.bySeverity?.critical ?? 0) > 0 ? RED : MUTED   },
            ].map(({ label, value, color }, i) => (
              <MotionBox key={label} flex="1"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                px={4} py={3} borderRadius="12px" bg={CARD_BG}
                border={`1px solid ${CARD_BD}`} pos="relative" overflow="hidden">
                <Box pos="absolute" top={0} left={0} right={0} h="2px"
                  style={{ background: `linear-gradient(to right, transparent, ${color}70, transparent)` }} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
                <Text fontSize="22px" fontWeight="black" color={color} lineHeight={1}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </Text>
              </MotionBox>
            ))}
          </Flex>

          {/* ── Search + filter bar ─────────────────────────────────────── */}
          <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
            <Flex flex={1} minW="280px" align="center" gap={2} h="34px" px={3}
              borderRadius="8px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
              _focusWithin={{ borderColor: A_B, boxShadow: `0 0 0 1px ${A_B}` }}>
              <SearchIcon boxSize={3} color={MUTED} />
              <Input variant="unstyled" fontSize="12px"
                placeholder="Search title, source, domain, tags…"
                _placeholder={{ color: MUTED }}
                color="var(--dash-text-primary)"
                value={query} onChange={e => setQuery(e.target.value)} />
              {query && (
                <IconButton size="xs" variant="ghost" icon={<DeleteIcon />}
                  color={MUTED} _hover={{ color: RED }}
                  onClick={() => setQuery('')} aria-label="clear" />
              )}
            </Flex>
            <Flex gap={1.5} flexWrap="wrap">
              {[
                { k: 'all',         label: 'All',      color: ACCENT },
                { k: 'credentials', label: 'Creds',    color: ACCENT },
                { k: 'file',        label: 'Files',    color: VIOLET },
                { k: 'pastebin',    label: 'Pastes',   color: BLUE   },
                { k: 'link',        label: 'Links',    color: TEAL   },
                { k: 'note',        label: 'Notes',    color: MUTED  },
                { k: 'critical',    label: 'Critical', color: RED    },
              ].map(({ k, label, color }) => {
                const act = filter === k;
                const cnt = filterCounts[k] || 0;
                if (k !== 'all' && k !== 'credentials' && cnt === 0 && !act) return null;
                return (
                  <Button key={k} size="xs" h="26px" px={3} borderRadius="7px"
                    fontSize="10px" fontWeight="bold"
                    bg={act ? `${color}18` : 'transparent'}
                    color={act ? color : MUTED}
                    border={act ? `1px solid ${color}40` : `1px solid ${CARD_BD}`}
                    _hover={{ color, bg: `${color}10` }}
                    onClick={() => setFilter(k)}>
                    {label}
                    <Box as="span" ml={1.5} opacity={0.7}>{cnt}</Box>
                  </Button>
                );
              })}
            </Flex>
            <Tooltip label="Refresh" hasArrow fontSize="10px">
              <IconButton size="xs" h="26px" w="26px" borderRadius="7px" variant="ghost"
                icon={<RepeatIcon />} color={MUTED} _hover={{ color: ACCENT }}
                onClick={() => { fetchEntries(); fetchStats(); }} aria-label="refresh" />
            </Tooltip>
          </Flex>

          {targetFilter && (
            <Flex align="center" gap={2} px={3} py={2} borderRadius="8px"
              bg={A_S} border={`1px solid ${A_B}`}>
              <Text fontSize="10px" color={MUTED}>Filtered by target:</Text>
              <Text fontSize="11px" fontFamily="mono" color={ACCENT}>{targetFilter}</Text>
              <Button size="xs" variant="ghost" color={MUTED} ml="auto"
                onClick={() => setTargetFilter(null)} _hover={{ color: 'white' }}>
                Clear
              </Button>
            </Flex>
          )}

          {/* ── Entry list ──────────────────────────────────────────────── */}
          <Box borderRadius="14px" bg={CARD_BG} border={`1px solid ${CARD_BD}`}
            overflow="hidden" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}70, transparent)` }} />

            <Flex align="center" justify="space-between" px={5} py={3}
              borderBottom={`1px solid ${CARD_BD}`}>
              <Flex align="center" gap={2}>
                <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
                <Text fontSize="10px" fontWeight="bold" color={MUTED}
                  textTransform="uppercase" letterSpacing="wider">Entries</Text>
                <Box px="7px" py="1px" borderRadius="full" bg={A_S} border={`1px solid ${A_B}`}>
                  <Text fontSize="10px" fontWeight="bold" color={ACCENT}>
                    {visible.length}{visible.length !== entries.length ? ` / ${entries.length}` : ''}
                  </Text>
                </Box>
              </Flex>
              {loading && <Spinner size="xs" color={ACCENT} />}
            </Flex>

            {visible.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={14} gap={3} opacity={0.45}>
                <Box as="svg" viewBox="0 0 24 24" w="44px" h="44px" fill="none"
                  stroke={MUTED} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2"/>
                  <path d="M7 9h10"/><path d="M7 13h10"/><path d="M7 17h6"/>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
                    {entries.length === 0
                      ? 'No leaks or credentials yet'
                      : 'Nothing matches the current filters'}
                  </Text>
                  <Text fontSize="11px" color={MUTED} mt={1}>
                    {entries.length === 0 && 'Paste a combo list or drop a stealer log to get started'}
                  </Text>
                </Box>
              </Flex>
            ) : (
              <Box>
                <AnimatePresence>
                  {visible.map((entry, i) => {
                    const tm  = TYPE_META[entry.type] || TYPE_META.credentials;
                    const sev = SEVERITY_META[entry.severity] || SEVERITY_META.medium;
                    const Icon = tm.icon;
                    return (
                      <MotionBox key={entry._id}
                        layout
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16, delay: Math.min(i * 0.015, 0.3) }}>
                        <Flex align="center" gap={3} px={5} py="12px"
                          borderBottom={`1px solid ${CARD_BD}`}
                          cursor="pointer"
                          _hover={{ bg: 'rgba(255,255,255,0.03)' }}
                          onClick={() => setSelectedId(entry._id)}>

                          {/* Type icon */}
                          <Box w="32px" h="32px" borderRadius="8px" flexShrink={0}
                            bg={`${tm.color}10`} border={`1px solid ${tm.color}28`}
                            display="flex" alignItems="center" justifyContent="center">
                            <Icon boxSize={3.5} color={tm.color} />
                          </Box>

                          {/* Title + tags */}
                          <Box flex="1" minW={0}>
                            <Flex align="center" gap={2} mb={0.5}>
                              <Text fontSize="12px" fontWeight="semibold"
                                color="var(--dash-text-primary)" noOfLines={1}>
                                {entry.title}
                              </Text>
                              {entry.credCount > 0 && (
                                <Box px="6px" py="1px" borderRadius="4px"
                                  bg={`${GREEN}10`} border={`1px solid ${GREEN}25`}>
                                  <Text fontSize="9px" fontWeight="bold" color={GREEN}>
                                    {entry.credCount.toLocaleString()} creds
                                  </Text>
                                </Box>
                              )}
                              {entry.file && (
                                <Box px="6px" py="1px" borderRadius="4px"
                                  bg={`${VIOLET}10`} border={`1px solid ${VIOLET}25`}>
                                  <Text fontSize="9px" fontWeight="bold" color={VIOLET}>
                                    {fmtBytes(entry.file.size)}
                                  </Text>
                                </Box>
                              )}
                            </Flex>
                            <Flex align="center" gap={2}>
                              {entry.targetDomain && (
                                <Text fontSize="10px" fontFamily="mono" color={ACCENT}
                                  noOfLines={1}>{entry.targetDomain}</Text>
                              )}
                              {entry.source && (
                                <>
                                  {entry.targetDomain && <Box w="3px" h="3px" borderRadius="full" bg={MUTED} />}
                                  <Text fontSize="10px" color={MUTED} noOfLines={1}>
                                    {entry.source}
                                  </Text>
                                </>
                              )}
                              {entry.createdByOperatorName && (
                                <>
                                  <Box w="3px" h="3px" borderRadius="full" bg={MUTED} />
                                  <Flex align="center" gap={1}>
                                    <Box w="5px" h="5px" borderRadius="full"
                                      bg={`hsl(${hashHue(entry.createdByOperatorName)}, 65%, 60%)`} />
                                    <Text fontSize="10px" color={MUTED}>
                                      {entry.createdByOperatorName}
                                    </Text>
                                  </Flex>
                                </>
                              )}
                            </Flex>
                          </Box>

                          {/* Severity */}
                          <Box flex="0 0 72px" textAlign="center">
                            <Box px="7px" py="2px" borderRadius="5px" display="inline-block"
                              bg={`${sev.color}12`} border={`1px solid ${sev.color}30`}>
                              <Text fontSize="9px" fontWeight="bold" color={sev.color}
                                textTransform="uppercase">{sev.label}</Text>
                            </Box>
                          </Box>

                          {/* Time */}
                          <Text flex="0 0 70px" fontSize="10px" color={MUTED} textAlign="right">
                            {fmtRelative(entry.createdAt)}
                          </Text>

                          {/* Delete */}
                          <IconButton size="xs" variant="ghost"
                            icon={<DeleteIcon />} color={MUTED}
                            _hover={{ color: RED, bg: 'rgba(252,129,129,0.1)' }}
                            onClick={(e) => { e.stopPropagation(); setPendingDelete(entry); }}
                            aria-label="delete" />
                        </Flex>
                      </MotionBox>
                    );
                  })}
                </AnimatePresence>
              </Box>
            )}
          </Box>
        </Flex>

        {/* ── Right column ────────────────────────────────────────────────── */}
        <Box w="260px" flexShrink={0} borderLeft={`1px solid ${CARD_BD}`} pl={5}>

          <Flex align="center" justify="space-between" mb={4}>
            <Flex align="center" gap={2}>
              <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
              <Text fontSize="10px" color={MUTED} textTransform="uppercase"
                letterSpacing="widest" fontWeight="bold">Top Targets</Text>
            </Flex>
            {stats?.totalCreds > 0 && (
              <Tooltip label="Export all credentials as ULP" hasArrow fontSize="10px">
                <IconButton size="xs" variant="ghost" icon={<DownloadIcon />}
                  color={MUTED} _hover={{ color: ACCENT }}
                  onClick={downloadAllUlp} aria-label="export" />
              </Tooltip>
            )}
          </Flex>

          {!stats?.topTargets?.length ? (
            <Flex align="center" justify="center" py={10}>
              <Text fontSize="11px" color={MUTED} opacity={0.4}>No targets yet</Text>
            </Flex>
          ) : (
            <Flex direction="column" gap={1}>
              {stats.topTargets.map(t => {
                const act = targetFilter === t.domain;
                return (
                  <Box key={t.domain} px={3} py="9px" borderRadius="9px" cursor="pointer"
                    bg={act ? `${ACCENT}0D` : 'transparent'}
                    border={act ? `1px solid ${A_B}` : '1px solid transparent'}
                    _hover={{ bg: act ? `${ACCENT}14` : 'rgba(255,255,255,0.04)' }}
                    onClick={() => setTargetFilter(act ? null : t.domain)}>
                    <Text fontSize="11px" fontFamily="mono" fontWeight="semibold"
                      color="var(--dash-text-primary)" noOfLines={1}>
                      {t.domain}
                    </Text>
                    <Flex align="center" gap={2} mt={0.5}>
                      <Box px="5px" py="1px" borderRadius="3px" bg={`${GREEN}10`}
                        border={`1px solid ${GREEN}25`}>
                        <Text fontSize="9px" fontWeight="bold" color={GREEN}>
                          {t.creds.toLocaleString()} creds
                        </Text>
                      </Box>
                      <Text fontSize="9px" color={MUTED}>
                        {t.entries} entr{t.entries === 1 ? 'y' : 'ies'}
                      </Text>
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          )}

          {stats?.topSources?.length > 0 && (
            <Box mt={5} pt={4} borderTop={`1px solid ${CARD_BD}`}>
              <Text fontSize="9px" color={MUTED} textTransform="uppercase"
                letterSpacing="wider" fontWeight="bold" mb={2}>Top Sources</Text>
              <Flex direction="column" gap={1}>
                {stats.topSources.slice(0, 6).map(s => (
                  <Flex key={s.name} align="center" justify="space-between" px={2} py="5px">
                    <Text fontSize="11px" color="var(--dash-text-secondary)" noOfLines={1}>
                      {s.name}
                    </Text>
                    <Text fontSize="10px" color={ACCENT} fontWeight="bold">
                      {s.count}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          )}
        </Box>
      </Flex>

      {/* ── Detail modal ───────────────────────────────────────────────────── */}
      <DetailModal
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        entry={selectedEntry}
        engId={engId}
        onDelete={() => selectedEntry && setPendingDelete(selectedEntry)}
        onReload={() => { fetchEntries(); fetchStats(); }}
      />

      {/* ── Confirm delete modal ───────────────────────────────────────────── */}
      <ConfirmDeleteModal
        entry={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const id = pendingDelete._id;
          setPendingDelete(null);
          deleteEntry(id);
        }}
      />
    </Box>
  );
};

export default LeaksCredentialsView;
