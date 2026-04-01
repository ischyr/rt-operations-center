import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, Input, InputGroup, InputLeftElement,
  InputRightElement, IconButton, Spinner, SimpleGrid, Button, Badge,
} from '@chakra-ui/react';
import {
  SearchIcon, CloseIcon, DeleteIcon, DownloadIcon, AttachmentIcon,
  AddIcon, InfoIcon,
} from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

const MotionBox = motion(Box);

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE   = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ACCENT     = '#FC8181';

const SECTIONS = [
  {
    key:         'official',
    label:       'Official Documents',
    desc:        'Contracts, scope documents, rules of engagement, NDAs',
    color:       '#63B3ED',
    icon:        '📋',
  },
  {
    key:         'created',
    label:       'Created Documents',
    desc:        'Reports, notes, scripts, tools you produced during this engagement',
    color:       '#68D391',
    icon:        '✍️',
  },
  {
    key:         'pillaged',
    label:       'Pillaged Documents',
    desc:        'Files exfiltrated or discovered from target systems',
    color:       '#FC8181',
    icon:        '🔓',
  },
];

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// ── File-type helpers ─────────────────────────────────────────────────────────
const EXT_META = {
  pdf:  { label: 'PDF',   color: '#FC8181' },
  doc:  { label: 'DOC',   color: '#63B3ED' },
  docx: { label: 'DOCX',  color: '#63B3ED' },
  xls:  { label: 'XLS',   color: '#68D391' },
  xlsx: { label: 'XLSX',  color: '#68D391' },
  ppt:  { label: 'PPT',   color: '#F6AD55' },
  pptx: { label: 'PPTX',  color: '#F6AD55' },
  txt:  { label: 'TXT',   color: '#9F7AEA' },
  csv:  { label: 'CSV',   color: '#4FD1C5' },
  json: { label: 'JSON',  color: '#ECC94B' },
  xml:  { label: 'XML',   color: '#ECC94B' },
  zip:  { label: 'ZIP',   color: '#F6AD55' },
  rar:  { label: 'RAR',   color: '#F6AD55' },
  '7z': { label: '7Z',    color: '#F6AD55' },
  png:  { label: 'PNG',   color: '#9F7AEA' },
  jpg:  { label: 'JPG',   color: '#9F7AEA' },
  jpeg: { label: 'JPEG',  color: '#9F7AEA' },
  gif:  { label: 'GIF',   color: '#9F7AEA' },
  svg:  { label: 'SVG',   color: '#9F7AEA' },
  sh:   { label: 'SH',    color: '#F6AD55' },
  ps1:  { label: 'PS1',   color: '#63B3ED' },
  py:   { label: 'PY',    color: '#68D391' },
  js:   { label: 'JS',    color: '#ECC94B' },
};

const getExt  = (name) => (name.split('.').pop() || '').toLowerCase();
const getMeta = (name) => EXT_META[getExt(name)] || { label: getExt(name).toUpperCase() || 'FILE', color: '#718096' };

const fmtSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
};

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Document card ─────────────────────────────────────────────────────────────
const DocCard = ({ doc, sectionColor, onDownload, onDelete, downloading }) => {
  const meta = getMeta(doc.name);
  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      borderRadius="10px" p={3}
      bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.08)"
      _hover={{ bg: 'rgba(255,255,255,0.06)', borderColor: `${sectionColor}35` }}
      style={{ transition: 'background 0.15s, border-color 0.15s' }}
      pos="relative" overflow="hidden">

      {/* Gradient top */}
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${sectionColor}50, transparent)` }} />

      <Flex gap={3} align="flex-start">
        {/* Type badge */}
        <Flex
          w="36px" h="36px" borderRadius="8px" flexShrink={0}
          align="center" justify="center" fontSize="8px" fontWeight="bold"
          letterSpacing="wide" textTransform="uppercase"
          bg={`${meta.color}18`} border={`1px solid ${meta.color}40`} color={meta.color}>
          {meta.label.slice(0, 4)}
        </Flex>

        <Box flex={1} minW={0}>
          <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)"
            noOfLines={2} lineHeight={1.3} mb={0.5} wordBreak="break-word">
            {doc.name}
          </Text>
          {doc.description && (
            <Text fontSize="10px" color="var(--dash-text-muted)" noOfLines={1} mb={1}>
              {doc.description}
            </Text>
          )}
          <Flex align="center" gap={2} flexWrap="wrap">
            <Text fontSize="9px" color="var(--dash-text-muted)" fontFamily="monospace">
              {fmtSize(doc.size)}
            </Text>
            {doc.uploadedByCallsign && (
              <Text fontSize="9px" color="var(--dash-text-muted)">
                · {doc.uploadedByCallsign}
              </Text>
            )}
            <Text fontSize="9px" color="var(--dash-text-muted)">
              · {fmtDate(doc.createdAt)}
            </Text>
          </Flex>
          {doc.tags?.length > 0 && (
            <Flex gap={1} mt={1.5} flexWrap="wrap">
              {doc.tags.slice(0, 4).map(t => (
                <Badge key={t} fontSize="8px" px={1.5} py="1px" borderRadius="3px"
                  bg={`${sectionColor}15`} color={sectionColor} border={`1px solid ${sectionColor}30`}
                  textTransform="lowercase">
                  {t}
                </Badge>
              ))}
            </Flex>
          )}
        </Box>
      </Flex>

      {/* Action buttons */}
      <Flex justify="flex-end" gap={1} mt={2}>
        <IconButton
          icon={downloading === doc._id ? <Spinner size="xs" /> : <DownloadIcon boxSize={3} />}
          size="xs" variant="ghost" borderRadius="6px"
          color="var(--dash-text-muted)" _hover={{ color: sectionColor, bg: `${sectionColor}15` }}
          aria-label="Download" isDisabled={downloading === doc._id}
          onClick={() => onDownload(doc)} />
        <IconButton
          icon={<DeleteIcon boxSize={3} />}
          size="xs" variant="ghost" borderRadius="6px"
          color="var(--dash-text-muted)" _hover={{ color: '#FC8181', bg: 'rgba(252,129,129,0.1)' }}
          aria-label="Delete"
          onClick={() => onDelete(doc._id)} />
      </Flex>
    </MotionBox>
  );
};

// ── Drop zone ─────────────────────────────────────────────────────────────────
const DropZone = ({ section, uploading, onFiles }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <Box
      onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
      onDragOver={(e)  => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      cursor="pointer"
      borderRadius="10px"
      border={`2px dashed ${dragging ? section.color : 'rgba(255,255,255,0.1)'}`}
      bg={dragging ? `${section.color}08` : 'rgba(255,255,255,0.02)'}
      px={4} py={3}
      style={{ transition: 'all 0.15s' }}
      _hover={{ borderColor: `${section.color}60`, bg: `${section.color}06` }}>
      <Flex align="center" justify="center" gap={3}>
        {uploading ? (
          <Flex align="center" gap={2}>
            <Spinner size="sm" color={section.color} thickness="2px" />
            <Text fontSize="12px" color="var(--dash-text-muted)">Uploading…</Text>
          </Flex>
        ) : (
          <>
            <Flex w="28px" h="28px" borderRadius="7px" flexShrink={0}
              bg={`${section.color}15`} border={`1px solid ${section.color}35`}
              align="center" justify="center">
              <AddIcon boxSize={3} color={section.color} />
            </Flex>
            <Box>
              <Text fontSize="12px" color="var(--dash-text-secondary)" fontWeight="medium">
                Drop files here or <Text as="span" color={section.color} fontWeight="semibold">click to upload</Text>
              </Text>
              <Text fontSize="10px" color="var(--dash-text-muted)">
                PDF, DOCX, XLSX, TXT, ZIP and more — max 40 MB per file
              </Text>
            </Box>
          </>
        )}
      </Flex>
      <input ref={inputRef} type="file" multiple style={{ display: 'none' }}
        onChange={e => { const files = Array.from(e.target.files || []); if (files.length) onFiles(files); e.target.value = ''; }} />
    </Box>
  );
};

// ── Section panel ─────────────────────────────────────────────────────────────
const SectionPanel = ({ section, docs, onUpload, onDownload, onDelete, downloading, uploading, search }) => {
  const visible = search
    ? docs.filter(d =>
        d.name.toLowerCase().includes(search) ||
        d.description?.toLowerCase().includes(search) ||
        d.tags?.some(t => t.toLowerCase().includes(search)))
    : docs;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      borderRadius="16px" overflow="hidden"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      pos="relative">

      {/* Gradient top */}
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${section.color}90, transparent)` }} />

      {/* Header */}
      <Flex align="center" gap={3} px={5} pt={5} pb={3}>
        <Flex w="36px" h="36px" borderRadius="10px" flexShrink={0}
          bg={`${section.color}18`} border={`1px solid ${section.color}40`}
          align="center" justify="center" fontSize="18px">
          {section.icon}
        </Flex>
        <Box flex={1} minW={0}>
          <Flex align="center" gap={2}>
            <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">
              {section.label}
            </Text>
            {docs.length > 0 && (
              <Box px="7px" py="1px" borderRadius="20px"
                bg={`${section.color}18`} border={`1px solid ${section.color}30`}>
                <Text fontSize="9px" fontWeight="bold" color={section.color}>{docs.length}</Text>
              </Box>
            )}
          </Flex>
          <Text fontSize="10px" color="var(--dash-text-muted)" mt="1px">{section.desc}</Text>
        </Box>
        <Text fontSize="11px" color="var(--dash-text-muted)" flexShrink={0}>
          {docs.reduce((s, d) => s + (d.size || 0), 0) > 0
            ? fmtSize(docs.reduce((s, d) => s + (d.size || 0), 0))
            : ''}
        </Text>
      </Flex>

      {/* Drop zone */}
      <Box px={5} pb={3}>
        <DropZone section={section} uploading={uploading === section.key} onFiles={onUpload} />
      </Box>

      {/* Documents grid */}
      <AnimatePresence>
        {visible.length > 0 && (
          <Box px={5} pb={5}>
            {search && visible.length !== docs.length && (
              <Text fontSize="10px" color="var(--dash-text-muted)" mb={2}>
                {visible.length} of {docs.length} matching
              </Text>
            )}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
              {visible.map(doc => (
                <DocCard
                  key={doc._id}
                  doc={doc}
                  sectionColor={section.color}
                  onDownload={onDownload}
                  onDelete={onDelete}
                  downloading={downloading}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </AnimatePresence>

      {visible.length === 0 && docs.length > 0 && search && (
        <Flex align="center" justify="center" py={4} px={5}>
          <Text fontSize="12px" color="var(--dash-text-muted)">
            No documents matching "{search}"
          </Text>
        </Flex>
      )}
    </MotionBox>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, delay = 0 }) => (
  <MotionBox
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay }}
    px={4} py={3} borderRadius="12px" bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Text fontSize="20px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
    <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{label}</Text>
  </MotionBox>
);

// ── Main view ─────────────────────────────────────────────────────────────────
const DocumentsView = () => {
  const { slug }                       = useParams();
  const { getBySlug, fetchEngagements } = useEngagements();
  const { user }                       = useAuth();
  const eng                            = getBySlug(slug);

  const [search,      setSearch]      = useState('');
  const [uploading,   setUploading]   = useState(null); // section key
  const [downloading, setDownloading] = useState(null); // doc._id
  const [error,       setError]       = useState(null);

  // Keep a local copy of documents so the list updates instantly without waiting
  // for fetchEngagements to complete
  const [localDocs, setLocalDocs] = useState([]);

  useEffect(() => {
    if (eng?.documents) setLocalDocs(eng.documents);
  }, [eng?.documents]);

  const docsForSection = (key) => localDocs.filter(d => d.section === key);
  const searchLow      = search.trim().toLowerCase();

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (files, sectionKey) => {
    setError(null);
    setUploading(sectionKey);

    for (const file of files) {
      if (file.size > 40 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 40 MB limit and was skipped.`);
        continue;
      }

      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload  = (e) => {
            // strip the data:…;base64, prefix
            const result = e.target.result;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch(`${API_BASE}/api/documents/${eng._id}/documents`, {
          method:  'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            name:     file.name,
            section:  sectionKey,
            mimeType: file.type || 'application/octet-stream',
            size:     file.size,
            data:     base64,
            uploadedByCallsign: user?.callsign || '',
          }),
        });

        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.message || 'Upload failed');
        }

        const newDoc = await res.json();
        setLocalDocs(prev => [...prev, newDoc]);
      } catch (e) {
        setError(e.message || 'Upload failed');
      }
    }

    setUploading(null);
    // Refresh context in background so other views stay in sync
    fetchEngagements();
  }, [eng, user, fetchEngagements]);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async (doc) => {
    setDownloading(doc._id);
    try {
      const res = await fetch(
        `${API_BASE}/api/documents/${eng._id}/documents/${doc._id}/download`,
        { headers: authHeaders() },
      );
      if (!res.ok) throw new Error('Download failed');
      const { data, mimeType, name } = await res.json();

      const bytes  = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      const blob   = new Blob([bytes], { type: mimeType });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement('a');
      a.href       = url;
      a.download   = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || 'Download failed');
    } finally {
      setDownloading(null);
    }
  }, [eng]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (docId) => {
    try {
      setLocalDocs(prev => prev.filter(d => d._id !== docId));
      await fetch(`${API_BASE}/api/documents/${eng._id}/documents/${docId}`, {
        method:  'DELETE',
        headers: authHeaders(),
      });
      fetchEngagements();
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  }, [eng, fetchEngagements]);

  if (!eng) return null;

  const totalDocs = localDocs.length;
  const totalSize = localDocs.reduce((s, d) => s + (d.size || 0), 0);

  return (
    <Box px={6} pb={12}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Document <Text as="span" color="red.400">Vault</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · store and retrieve engagement documents
          </Text>
        </Box>
      </Flex>

      {/* ── Info banner ────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px"
        bg="rgba(99,179,237,0.07)" border="1px solid rgba(99,179,237,0.25)">
        <Flex align="center" gap={2} mb={2}>
          <InfoIcon boxSize={3} color="#63B3ED" />
          <Text fontSize="10px" fontWeight="bold" color="#63B3ED"
            textTransform="uppercase" letterSpacing="wider">
            Document Vault
          </Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {['Drag & drop or click to upload any file type', 'Files stored securely per engagement', 'Search across all sections simultaneously'].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg="#63B3ED" flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <SimpleGrid columns={{ base: 2, md: 5 }} gap={3} mb={5}>
        <StatCard label="Total documents" value={totalDocs}                          color={ACCENT}    delay={0}    />
        <StatCard label="Total size"      value={fmtSize(totalSize)}                 color="#9F7AEA"   delay={0.04} />
        <StatCard label="Official"        value={docsForSection('official').length}  color="#63B3ED"   delay={0.08} />
        <StatCard label="Created"         value={docsForSection('created').length}   color="#68D391"   delay={0.12} />
        <StatCard label="Pillaged"        value={docsForSection('pillaged').length}  color="#FC8181"   delay={0.16} />
      </SimpleGrid>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <Box mb={5}>
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none" pl={1}>
            <SearchIcon boxSize={4} color="var(--dash-text-muted)" />
          </InputLeftElement>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents by name, description or tag…"
            bg="var(--dash-card-bg)" borderColor="var(--dash-card-border)"
            borderRadius="10px" color="var(--dash-text-primary)"
            fontSize="sm"
            _placeholder={{ color: 'var(--dash-text-muted)' }}
            _hover={{ borderColor: `${ACCENT}60` }}
            _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}55` }}
            pr={search ? '44px' : '14px'}
          />
          {search && (
            <InputRightElement>
              <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                aria-label="Clear" onClick={() => setSearch('')} />
            </InputRightElement>
          )}
        </InputGroup>
      </Box>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <MotionBox initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} mb={4} px={4} py={3} borderRadius="10px"
            bg="rgba(252,129,129,0.07)" border="1px solid rgba(252,129,129,0.3)">
            <Flex align="center" justify="space-between" gap={2}>
              <Text fontSize="12px" color="#FC8181">{error}</Text>
              <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                color="#FC8181" onClick={() => setError(null)} aria-label="Dismiss" />
            </Flex>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* ── Sections ───────────────────────────────────────────────────────── */}
      <Flex direction="column" gap={5}>
        {SECTIONS.map(section => (
          <SectionPanel
            key={section.key}
            section={section}
            docs={docsForSection(section.key)}
            onUpload={(files) => handleFiles(files, section.key)}
            onDownload={handleDownload}
            onDelete={handleDelete}
            downloading={downloading}
            uploading={uploading}
            search={searchLow}
          />
        ))}
      </Flex>

    </Box>
  );
};

export default DocumentsView;
