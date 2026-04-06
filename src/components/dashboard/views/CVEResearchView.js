import { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Text, Button, Input, Textarea, Select, SimpleGrid, Spinner, useToast,
} from '@chakra-ui/react';
import {
  AddIcon, DeleteIcon, EditIcon, ExternalLinkIcon, InfoIcon,
  WarningTwoIcon, CloseIcon,
} from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT = '#63B3ED';
const GREEN  = '#68D391';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const YELLOW = '#F6E05E';
const PURPLE = '#9F7AEA';

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

// ── CVSS helpers ──────────────────────────────────────────────────────────────
function cvssColor(score) {
  if (score === null || score === undefined || score === '') return 'var(--dash-text-muted)';
  const n = parseFloat(score);
  if (n >= 9.0) return RED;
  if (n >= 7.0) return ORANGE;
  if (n >= 4.0) return YELLOW;
  if (n > 0)    return GREEN;
  return 'var(--dash-text-muted)';
}

function cvssLabel(score) {
  if (score === null || score === undefined || score === '') return 'N/A';
  const n = parseFloat(score);
  if (n >= 9.0) return 'CRITICAL';
  if (n >= 7.0) return 'HIGH';
  if (n >= 4.0) return 'MEDIUM';
  if (n > 0)    return 'LOW';
  return 'NONE';
}

const POC_COLOR = { yes: RED,   no: GREEN,  unknown: 'var(--dash-text-muted)' };
const POC_LABEL = { yes: 'PoC', no: 'No PoC', unknown: 'PoC Unknown' };

const STATUS_COLOR = {
  researching:      ACCENT,
  exploitable:      RED,
  'not-exploitable': GREEN,
  patched:          'var(--dash-text-muted)',
  'n/a':            'var(--dash-text-muted)',
};
const STATUS_LABEL = {
  researching:      'Researching',
  exploitable:      'Exploitable',
  'not-exploitable': 'Not Exploitable',
  patched:          'Patched',
  'n/a':            'N/A',
};

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
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden" flex="1" minW="110px">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Text fontSize="22px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
    <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{label}</Text>
  </MotionBox>
);

const Chip = ({ color, children }) => (
  <Box px={2} py="2px" borderRadius="5px" bg={`${color}18`} border={`1px solid ${color}40`}
    display="inline-flex" alignItems="center" flexShrink={0}>
    <Text fontSize="9px" fontWeight="bold" color={color} letterSpacing="widest"
      textTransform="uppercase">{children}</Text>
  </Box>
);

const inputSx = (accent = ACCENT) => ({
  bg: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 3,
  fontSize: '12px',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)', fontSize: '11px' },
  _hover: { border: `1px solid ${accent}40` },
  _focus: { border: `1px solid ${accent}70`, boxShadow: `0 0 0 1px ${accent}30` },
});

const BLANK = {
  cveId: '', title: '', description: '', cvssScore: '', cvssVector: '',
  affectedProduct: '', affectedVersion: '',
  pocAvailable: 'unknown', pocLinks: '', references: '',
  status: 'researching', notes: '', tags: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const toLines = v => (Array.isArray(v) ? v.join('\n') : v || '');
const toArr   = v => (typeof v === 'string' ? v.split('\n').map(s => s.trim()).filter(Boolean) : v || []);
const toCSV   = v => (Array.isArray(v) ? v.join(', ') : v || '');
const fromCSV = v => (typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v || []);

// ── Main View ─────────────────────────────────────────────────────────────────
const CVEResearchView = () => {
  const { slug } = useParams();
  const toast    = useToast();

  const [cves,         setCves]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [editing,      setEditing]      = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [looking,      setLooking]      = useState(false);
  const [filterQ,      setFilterQ]      = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPoc,    setFilterPoc]    = useState('all');

  const loadCves = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/cve/board?engagement=${slug}`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) setCves(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, [slug]);

  useEffect(() => { loadCves(); }, [loadCves]);

  // ── NVD lookup ──
  const lookupNvd = async () => {
    const id = editing?.cveId?.trim().toUpperCase();
    if (!id?.match(/^CVE-\d{4}-\d+$/)) {
      toast({ title: 'Enter a valid CVE ID first (e.g. CVE-2024-1234)', status: 'warning', duration: 2000 });
      return;
    }
    setLooking(true);
    try {
      const res  = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${id}`);
      const data = await res.json();
      const item = data?.vulnerabilities?.[0]?.cve;
      if (!item) throw new Error('Not found in NVD');
      const desc    = item.descriptions?.find(d => d.lang === 'en')?.value || '';
      const metrics = item.metrics?.cvssMetricV31?.[0]
                   || item.metrics?.cvssMetricV30?.[0]
                   || item.metrics?.cvssMetricV2?.[0];
      const score  = metrics?.cvssData?.baseScore  ?? '';
      const vector = metrics?.cvssData?.vectorString ?? '';
      setEditing(p => ({ ...p, cveId: id, description: desc, cvssScore: score, cvssVector: vector }));
      toast({ title: 'NVD data loaded', status: 'success', duration: 1500 });
    } catch (e) {
      toast({ title: `NVD lookup failed: ${e.message}`, status: 'error', duration: 3000 });
    }
    setLooking(false);
  };

  // ── Save ──
  const save = async () => {
    if (!editing?.cveId?.trim()) {
      toast({ title: 'CVE ID is required', status: 'warning', duration: 2000 });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...editing,
        engagementSlug: slug,
        cvssScore:  editing.cvssScore !== '' && editing.cvssScore !== null ? parseFloat(editing.cvssScore) : null,
        pocLinks:   toArr(editing.pocLinks),
        references: toArr(editing.references),
        tags:       fromCSV(editing.tags),
      };
      const isEdit = !!editing._id;
      const url    = isEdit ? `/api/cve/board/${editing._id}` : '/api/cve/board';
      const res    = await fetch(url, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      toast({ title: isEdit ? 'CVE updated' : 'CVE added', status: 'success', duration: 1500 });
      setEditing(null);
      await loadCves();
    } catch (e) {
      toast({ title: `Save failed: ${e.message}`, status: 'error', duration: 4000 });
    }
    setSaving(false);
  };

  // ── Delete ──
  const remove = async (id, e) => {
    e?.stopPropagation();
    try {
      await fetch(`/api/cve/board/${id}`, { method: 'DELETE', headers: authHeader() });
      setCves(p => p.filter(c => c._id !== id));
      if (selected?._id === id) setSelected(null);
      toast({ title: 'Removed', status: 'info', duration: 1200 });
    } catch {}
  };

  const startEdit = (cve, e) => {
    e?.stopPropagation();
    setEditing({
      ...cve,
      pocLinks:   toLines(cve.pocLinks),
      references: toLines(cve.references),
      tags:       toCSV(cve.tags),
    });
  };

  // ── Stats ──
  const critical    = cves.filter(c => parseFloat(c.cvssScore) >= 9).length;
  const high        = cves.filter(c => parseFloat(c.cvssScore) >= 7 && parseFloat(c.cvssScore) < 9).length;
  const withPoc     = cves.filter(c => c.pocAvailable === 'yes').length;
  const exploitable = cves.filter(c => c.status === 'exploitable').length;

  // ── Filter ──
  const filtered = cves.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterPoc    !== 'all' && c.pocAvailable !== filterPoc) return false;
    if (filterQ) {
      const q = filterQ.toLowerCase();
      return (c.cveId           || '').toLowerCase().includes(q)
          || (c.title           || '').toLowerCase().includes(q)
          || (c.affectedProduct || '').toLowerCase().includes(q)
          || (c.description     || '').toLowerCase().includes(q)
          || (c.tags            || []).some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const accentColor = editing?._id ? ORANGE : RED;

  return (
    <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} px={6} pb={12} pt={5}>

      {/* ── Header ── */}
      <Flex align="flex-start" justify="space-between" mb={5}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            CVE <Text as="span" color="red.400">Research Board</Text>
          </Text>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Track engagement CVEs · log PoC availability · monitor exploitation status
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon />}
          bg={`${RED}20`} color={RED} border={`1px solid ${RED}50`}
          _hover={{ bg: `${RED}35` }} borderRadius="8px" fontSize="12px"
          onClick={() => { setEditing({ ...BLANK }); setSelected(null); }}>
          Add CVE
        </Button>
      </Flex>

      {/* ── Info banner ── */}
      <Box mb={5} px={4} py={3} borderRadius="10px"
        bg="rgba(99,179,237,0.07)" border="1px solid rgba(99,179,237,0.25)">
        <Flex align="center" gap={2} mb={2}>
          <InfoIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">CVE Research Board</Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {[
            'Build a per-engagement vulnerability inventory with PoC links and exploitation notes',
            'Auto-populate CVSS score and description directly from the NVD database',
            'Track exploitation status across team members and generate report evidence',
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
        <StatCard label="Total CVEs"    value={cves.length}  color={ACCENT}  delay={0}    />
        <StatCard label="Critical"      value={critical}     color={RED}     delay={0.04} />
        <StatCard label="High"          value={high}         color={ORANGE}  delay={0.08} />
        <StatCard label="PoC Available" value={withPoc}      color={ORANGE}  delay={0.12} />
        <StatCard label="Exploitable"   value={exploitable}  color={RED}     delay={0.16} />
      </Flex>

      <Flex gap={5} align="flex-start" flexWrap="wrap">

        {/* ── Left: list ── */}
        <Flex direction="column" gap={4} flex="2" minW="380px">

          {/* Filters */}
          <Card accentColor={ACCENT} px={4} py={3}>
            <Flex gap={3} flexWrap="wrap" align="center">
              <Box flex="1" minW="160px">
                <Box as="input" value={filterQ} onChange={e => setFilterQ(e.target.value)}
                  placeholder="Search CVE ID, product, description, tags…"
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                    padding: '7px 12px', fontSize: '12px',
                    color: 'var(--dash-text-primary)', outline: 'none',
                  }} />
              </Box>
              <Select size="sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                bg="rgba(0,0,0,0.25)" border="1px solid rgba(255,255,255,0.1)"
                color="var(--dash-text-primary)" borderRadius="8px" fontSize="12px" w="160px">
                <option value="all"            style={{ background: '#1a1a2e' }}>All Status</option>
                <option value="researching"    style={{ background: '#1a1a2e' }}>Researching</option>
                <option value="exploitable"    style={{ background: '#1a1a2e' }}>Exploitable</option>
                <option value="not-exploitable" style={{ background: '#1a1a2e' }}>Not Exploitable</option>
                <option value="patched"        style={{ background: '#1a1a2e' }}>Patched</option>
                <option value="n/a"            style={{ background: '#1a1a2e' }}>N/A</option>
              </Select>
              <Select size="sm" value={filterPoc} onChange={e => setFilterPoc(e.target.value)}
                bg="rgba(0,0,0,0.25)" border="1px solid rgba(255,255,255,0.1)"
                color="var(--dash-text-primary)" borderRadius="8px" fontSize="12px" w="140px">
                <option value="all"     style={{ background: '#1a1a2e' }}>All PoC</option>
                <option value="yes"     style={{ background: '#1a1a2e' }}>PoC Available</option>
                <option value="no"      style={{ background: '#1a1a2e' }}>No PoC</option>
                <option value="unknown" style={{ background: '#1a1a2e' }}>Unknown</option>
              </Select>
            </Flex>
          </Card>

          {/* CVE list */}
          {loading ? (
            <Flex justify="center" py={10}><Spinner color={ACCENT} /></Flex>
          ) : filtered.length === 0 ? (
            <Card accentColor="rgba(255,255,255,0.06)" px={5} pt={10} pb={10}>
              <Flex direction="column" align="center" gap={3}>
                <Flex w="44px" h="44px" borderRadius="12px" align="center" justify="center"
                  bg={`${ACCENT}12`} border={`1px solid ${ACCENT}30`}>
                  <InfoIcon boxSize={4} color={ACCENT} />
                </Flex>
                <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">
                  {filterQ || filterStatus !== 'all' || filterPoc !== 'all'
                    ? 'No CVEs match your filters'
                    : 'No CVEs tracked yet'}
                </Text>
                <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" maxW="260px">
                  {filterQ || filterStatus !== 'all' || filterPoc !== 'all'
                    ? 'Try adjusting the search or filter criteria'
                    : 'Click "Add CVE" to start building your vulnerability inventory'}
                </Text>
              </Flex>
            </Card>
          ) : (
            <Flex direction="column" gap={3}>
              <AnimatePresence>
                {filtered.map((cve, idx) => {
                  const cc       = cvssColor(cve.cvssScore);
                  const sc       = STATUS_COLOR[cve.status] || 'var(--dash-text-muted)';
                  const pc       = POC_COLOR[cve.pocAvailable];
                  const isOpen   = selected?._id === cve._id;
                  return (
                    <MotionBox key={cve._id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}>
                      <Box px={4} py={4} borderRadius="12px" cursor="pointer"
                        pos="relative" overflow="hidden"
                        bg={isOpen ? 'rgba(99,179,237,0.05)' : 'var(--dash-card-bg)'}
                        border={`1px solid ${isOpen ? `${ACCENT}45` : 'var(--dash-card-border)'}`}
                        _hover={{ borderColor: `${ACCENT}35`, bg: 'rgba(99,179,237,0.03)' }}
                        transition="all 0.15s"
                        onClick={() => setSelected(isOpen ? null : cve)}>
                        <Box pos="absolute" top={0} left={0} right={0} h="2px"
                          style={{ background: `linear-gradient(to right, transparent, ${cc}55, transparent)` }} />

                        <Flex align="flex-start" justify="space-between" gap={3}>
                          <Flex direction="column" gap={2} flex="1" minW={0}>
                            {/* CVE ID + badges */}
                            <Flex align="center" gap={2} flexWrap="wrap">
                              <Text fontSize="13px" fontWeight="bold" fontFamily="mono" color={cc}>
                                {cve.cveId}
                              </Text>
                              {cve.cvssScore !== null && cve.cvssScore !== undefined && cve.cvssScore !== '' && (
                                <Chip color={cc}>{cve.cvssScore} {cvssLabel(cve.cvssScore)}</Chip>
                              )}
                              <Chip color={pc}>{POC_LABEL[cve.pocAvailable]}</Chip>
                              <Chip color={sc}>{STATUS_LABEL[cve.status]}</Chip>
                            </Flex>

                            {cve.title && (
                              <Text fontSize="12px" fontWeight="semibold"
                                color="var(--dash-text-primary)" noOfLines={1}>{cve.title}</Text>
                            )}

                            {cve.affectedProduct && (
                              <Text fontSize="11px" color="var(--dash-text-muted)">
                                {cve.affectedProduct}{cve.affectedVersion ? ` ${cve.affectedVersion}` : ''}
                              </Text>
                            )}

                            {/* Expanded */}
                            <AnimatePresence>
                              {isOpen && (
                                <MotionBox initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }} overflow="hidden">
                                  <Flex direction="column" gap={3} mt={2}>
                                    {cve.description && (
                                      <Box>
                                        <Label>Description</Label>
                                        <Text fontSize="11px" color="var(--dash-text-secondary)"
                                          lineHeight={1.6}>{cve.description}</Text>
                                      </Box>
                                    )}
                                    {cve.cvssVector && (
                                      <Box>
                                        <Label>CVSS Vector</Label>
                                        <Text fontSize="10px" fontFamily="mono"
                                          color="var(--dash-text-muted)">{cve.cvssVector}</Text>
                                      </Box>
                                    )}
                                    {cve.pocLinks?.length > 0 && (
                                      <Box>
                                        <Label>PoC Links</Label>
                                        {cve.pocLinks.map((url, i) => (
                                          <Flex key={i} align="center" gap={1.5} mb={1}>
                                            <ExternalLinkIcon boxSize={3} color={RED} flexShrink={0} />
                                            <Text fontSize="11px" color={RED} fontFamily="mono"
                                              noOfLines={1} cursor="pointer"
                                              onClick={e => { e.stopPropagation(); window.open(url, '_blank'); }}>
                                              {url}
                                            </Text>
                                          </Flex>
                                        ))}
                                      </Box>
                                    )}
                                    {cve.references?.length > 0 && (
                                      <Box>
                                        <Label>References</Label>
                                        {cve.references.map((url, i) => (
                                          <Flex key={i} align="center" gap={1.5} mb={1}>
                                            <ExternalLinkIcon boxSize={3} color="var(--dash-text-muted)" flexShrink={0} />
                                            <Text fontSize="11px" color="var(--dash-text-muted)" fontFamily="mono"
                                              noOfLines={1} cursor="pointer"
                                              onClick={e => { e.stopPropagation(); window.open(url, '_blank'); }}>
                                              {url}
                                            </Text>
                                          </Flex>
                                        ))}
                                      </Box>
                                    )}
                                    {cve.notes && (
                                      <Box>
                                        <Label>Operator Notes</Label>
                                        <Text fontSize="11px" color="var(--dash-text-secondary)"
                                          lineHeight={1.6} whiteSpace="pre-wrap">{cve.notes}</Text>
                                      </Box>
                                    )}
                                    {cve.tags?.length > 0 && (
                                      <Flex gap={1} flexWrap="wrap">
                                        {cve.tags.map(t => (
                                          <Box key={t} px={2} py="2px" borderRadius="4px"
                                            bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.12)">
                                            <Text fontSize="9px" color="var(--dash-text-muted)">{t}</Text>
                                          </Box>
                                        ))}
                                      </Flex>
                                    )}
                                    <Text fontSize="10px" color="var(--dash-text-muted)">
                                      Added by {cve.addedBy}
                                    </Text>
                                  </Flex>
                                </MotionBox>
                              )}
                            </AnimatePresence>
                          </Flex>

                          {/* Actions */}
                          <Flex direction="column" gap={1} flexShrink={0}>
                            <Box p={1.5} borderRadius="6px" cursor="pointer"
                              color="var(--dash-text-muted)"
                              _hover={{ color: ACCENT, bg: `${ACCENT}12` }}
                              transition="all 0.15s"
                              onClick={e => startEdit(cve, e)}>
                              <EditIcon boxSize={3} />
                            </Box>
                            <Box p={1.5} borderRadius="6px" cursor="pointer"
                              color="var(--dash-text-muted)"
                              _hover={{ color: RED, bg: `${RED}12` }}
                              transition="all 0.15s"
                              onClick={e => remove(cve._id, e)}>
                              <DeleteIcon boxSize={3} />
                            </Box>
                          </Flex>
                        </Flex>
                      </Box>
                    </MotionBox>
                  );
                })}
              </AnimatePresence>
            </Flex>
          )}
        </Flex>

        {/* ── Right: form panel ── */}
        <Flex direction="column" flex="1" minW="320px">
          <AnimatePresence mode="wait">
            {editing ? (
              <MotionBox key="form" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22 }}>
                <Card accentColor={accentColor} px={5} pt={5} pb={5}>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Flex align="center" gap={2}>
                      <Box w="6px" h="6px" borderRadius="full" bg={accentColor}
                        boxShadow={`0 0 6px ${accentColor}`} />
                      <Text fontSize="11px" fontWeight="bold" color={accentColor}
                        textTransform="uppercase" letterSpacing="widest">
                        {editing._id ? 'Edit CVE' : 'Add CVE'}
                      </Text>
                    </Flex>
                    <Box cursor="pointer" p={1} borderRadius="5px"
                      color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                      transition="color 0.15s" onClick={() => setEditing(null)}>
                      <CloseIcon boxSize={2.5} />
                    </Box>
                  </Flex>

                  <Flex direction="column" gap={3}>

                    {/* CVE ID + NVD lookup */}
                    <Box>
                      <Label>CVE ID *</Label>
                      <Flex gap={2}>
                        <Input value={editing.cveId}
                          onChange={e => setEditing(p => ({ ...p, cveId: e.target.value }))}
                          placeholder="CVE-2024-1234"
                          {...inputSx(RED)} flex="1" h="36px"
                          onKeyDown={e => e.key === 'Enter' && lookupNvd()} />
                        <Button size="sm" h="36px" px={3}
                          bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                          _hover={{ bg: `${ACCENT}35` }} borderRadius="8px" fontSize="11px"
                          isLoading={looking} loadingText="…"
                          onClick={lookupNvd}>
                          NVD
                        </Button>
                      </Flex>
                    </Box>

                    <Box>
                      <Label>Title</Label>
                      <Input value={editing.title}
                        onChange={e => setEditing(p => ({ ...p, title: e.target.value }))}
                        placeholder="Brief vulnerability title"
                        {...inputSx()} h="36px" />
                    </Box>

                    <SimpleGrid columns={2} gap={3}>
                      <Box>
                        <Label>CVSS Score</Label>
                        <Input value={editing.cvssScore}
                          onChange={e => setEditing(p => ({ ...p, cvssScore: e.target.value }))}
                          placeholder="9.8" type="number" min="0" max="10" step="0.1"
                          {...inputSx(cvssColor(editing.cvssScore))} h="36px" />
                      </Box>
                      <Box>
                        <Label>Status</Label>
                        <Select value={editing.status}
                          onChange={e => setEditing(p => ({ ...p, status: e.target.value }))}
                          {...inputSx(STATUS_COLOR[editing.status])} h="36px" size="sm">
                          <option value="researching"     style={{ background: '#1a1a2e' }}>Researching</option>
                          <option value="exploitable"     style={{ background: '#1a1a2e' }}>Exploitable</option>
                          <option value="not-exploitable" style={{ background: '#1a1a2e' }}>Not Exploitable</option>
                          <option value="patched"         style={{ background: '#1a1a2e' }}>Patched</option>
                          <option value="n/a"             style={{ background: '#1a1a2e' }}>N/A</option>
                        </Select>
                      </Box>
                    </SimpleGrid>

                    <SimpleGrid columns={2} gap={3}>
                      <Box>
                        <Label>Affected Product</Label>
                        <Input value={editing.affectedProduct}
                          onChange={e => setEditing(p => ({ ...p, affectedProduct: e.target.value }))}
                          placeholder="Apache Struts"
                          {...inputSx()} h="36px" />
                      </Box>
                      <Box>
                        <Label>Affected Version</Label>
                        <Input value={editing.affectedVersion}
                          onChange={e => setEditing(p => ({ ...p, affectedVersion: e.target.value }))}
                          placeholder="2.5.x"
                          {...inputSx()} h="36px" />
                      </Box>
                    </SimpleGrid>

                    <Box>
                      <Label>PoC Availability</Label>
                      <Select value={editing.pocAvailable}
                        onChange={e => setEditing(p => ({ ...p, pocAvailable: e.target.value }))}
                        {...inputSx(POC_COLOR[editing.pocAvailable])} h="36px" size="sm">
                        <option value="unknown" style={{ background: '#1a1a2e' }}>Unknown</option>
                        <option value="yes"     style={{ background: '#1a1a2e' }}>PoC Available</option>
                        <option value="no"      style={{ background: '#1a1a2e' }}>No Public PoC</option>
                      </Select>
                    </Box>

                    <Box>
                      <Label>PoC Links (one per line)</Label>
                      <Textarea value={editing.pocLinks}
                        onChange={e => setEditing(p => ({ ...p, pocLinks: e.target.value }))}
                        placeholder={'https://github.com/exploit/poc\nhttps://exploit-db.com/exploits/...'}
                        {...inputSx(RED)} rows={3} resize="vertical" fontSize="11px" fontFamily="mono" />
                    </Box>

                    <Box>
                      <Label>References (one per line)</Label>
                      <Textarea value={editing.references}
                        onChange={e => setEditing(p => ({ ...p, references: e.target.value }))}
                        placeholder={'https://nvd.nist.gov/vuln/detail/CVE-...\nhttps://vendor/advisory'}
                        {...inputSx()} rows={2} resize="vertical" fontSize="11px" fontFamily="mono" />
                    </Box>

                    <Box>
                      <Label>Description</Label>
                      <Textarea value={editing.description}
                        onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
                        placeholder="Auto-filled from NVD or enter manually…"
                        {...inputSx()} rows={3} resize="vertical" fontSize="11px" />
                    </Box>

                    <Box>
                      <Label>CVSS Vector</Label>
                      <Input value={editing.cvssVector}
                        onChange={e => setEditing(p => ({ ...p, cvssVector: e.target.value }))}
                        placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
                        {...inputSx()} h="36px" fontFamily="mono" fontSize="11px" />
                    </Box>

                    <Box>
                      <Label>Operator Notes</Label>
                      <Textarea value={editing.notes}
                        onChange={e => setEditing(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Exploitation conditions, environment details, mitigations observed…"
                        {...inputSx(PURPLE)} rows={3} resize="vertical" fontSize="11px" />
                    </Box>

                    <Box>
                      <Label>Tags (comma-separated)</Label>
                      <Input value={editing.tags}
                        onChange={e => setEditing(p => ({ ...p, tags: e.target.value }))}
                        placeholder="rce, unauthenticated, web, active-directory"
                        {...inputSx()} h="36px" />
                    </Box>

                    <Button w="100%" size="sm"
                      bg={`${accentColor}20`} color={accentColor}
                      border={`1px solid ${accentColor}50`}
                      _hover={{ bg: `${accentColor}35` }}
                      borderRadius="8px" fontSize="12px"
                      isLoading={saving} loadingText="Saving…"
                      onClick={save}>
                      {editing._id ? 'Update CVE' : 'Add CVE to Board'}
                    </Button>
                  </Flex>
                </Card>
              </MotionBox>
            ) : (
              <MotionBox key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <Card accentColor="rgba(255,255,255,0.06)" px={5} pt={10} pb={10}>
                  <Flex direction="column" align="center" gap={3}>
                    <Flex w="44px" h="44px" borderRadius="12px" align="center" justify="center"
                      bg={`${RED}12`} border={`1px solid ${RED}30`}>
                      <WarningTwoIcon boxSize={4} color={RED} />
                    </Flex>
                    <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)">
                      Add or select a CVE
                    </Text>
                    <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" maxW="220px">
                      Click "Add CVE" to track a new vulnerability, or select an existing entry to expand its details
                    </Text>
                    <Button size="sm" leftIcon={<AddIcon />} mt={1}
                      bg={`${RED}20`} color={RED} border={`1px solid ${RED}50`}
                      _hover={{ bg: `${RED}35` }} borderRadius="8px" fontSize="12px"
                      onClick={() => setEditing({ ...BLANK })}>
                      Add CVE
                    </Button>
                  </Flex>
                </Card>
              </MotionBox>
            )}
          </AnimatePresence>
        </Flex>

      </Flex>
    </MotionBox>
  );
};

export default CVEResearchView;
