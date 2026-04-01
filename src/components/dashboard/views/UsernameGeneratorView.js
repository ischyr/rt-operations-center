import { useState, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Textarea, Input, Button, IconButton,
  SimpleGrid, Checkbox, Tooltip,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  DownloadIcon, CopyIcon, CheckIcon, AttachmentIcon, AddIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Colors ───────────────────────────────────────────────────────────────────
const ACCENT  = '#9F7AEA';
const GREEN   = '#68D391';
const BLUE    = '#63B3ED';
const ORANGE  = '#F6AD55';

// ── Input styles ─────────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

// ── SVG icons ─────────────────────────────────────────────────────────────────
const UsersIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Username generation logic (namemash.py format)
// ─────────────────────────────────────────────────────────────────────────────
const clean = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

const FORMAT_DEFS = [
  { id: 'firstlast',   label: 'firstlast',   fn: (f, l) => `${f}${l}` },
  { id: 'first_last',  label: 'first_last',  fn: (f, l) => `${f}_${l}` },
  { id: 'first.last',  label: 'first.last',  fn: (f, l) => `${f}.${l}` },
  { id: 'first-last',  label: 'first-last',  fn: (f, l) => `${f}-${l}` },
  { id: 'flast',       label: 'flast',       fn: (f, l) => `${f[0]}${l}` },
  { id: 'f.last',      label: 'f.last',      fn: (f, l) => `${f[0]}.${l}` },
  { id: 'f_last',      label: 'f_last',      fn: (f, l) => `${f[0]}_${l}` },
  { id: 'lastfirst',   label: 'lastfirst',   fn: (f, l) => `${l}${f}` },
  { id: 'last_first',  label: 'last_first',  fn: (f, l) => `${l}_${f}` },
  { id: 'last.first',  label: 'last.first',  fn: (f, l) => `${l}.${f}` },
  { id: 'lfirst',      label: 'lfirst',      fn: (f, l) => `${l[0]}${f}` },
  { id: 'l.first',     label: 'l.first',     fn: (f, l) => `${l[0]}.${f}` },
  { id: 'lastf',       label: 'lastf',       fn: (f, l) => `${l}${f[0]}` },
  { id: 'last.f',      label: 'last.f',      fn: (f, l) => `${l}.${f[0]}` },
  { id: 'firstname',   label: 'firstname',   fn: (f)    => `${f}` },
  { id: 'lastname',    label: 'lastname',    fn: (f, l) => `${l}` },
];

const generateUsernames = (line, enabledFormats, domain) => {
  const parts = line.trim().split(/\s+/);
  const suffix = domain ? `@${domain}` : '';
  if (parts.length < 2) {
    const first = clean(parts[0] || '');
    return first ? [`${first}${suffix}`] : [];
  }
  const first = clean(parts[0]);
  const last  = clean(parts.slice(1).join(''));
  if (!first || !last) return [];
  return FORMAT_DEFS
    .filter(f => enabledFormats.has(f.id))
    .map(f => `${f.fn(first, last)}${suffix}`)
    .filter(Boolean);
};

// ── Copy button ───────────────────────────────────────────────────────────────
const CopyBtn = ({ value, size = 'xs' }) => {
  const [ok, setOk] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value).then(() => { setOk(true); setTimeout(() => setOk(false), 1800); }); };
  return (
    <Tooltip label={ok ? 'Copied!' : 'Copy'} fontSize="10px">
      <IconButton icon={ok ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
        size={size} variant="ghost"
        color={ok ? GREEN : 'var(--dash-text-muted)'}
        borderRadius="6px"
        _hover={{ color: ok ? GREEN : 'white', bg: 'rgba(255,255,255,0.06)' }}
        aria-label="copy" onClick={copy} />
    </Tooltip>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────────────────────
const UsernameGeneratorView = () => {
  const { slug } = useParams();
  const { getBySlug } = useEngagements();
  const eng = getBySlug(slug);

  const [namesInput,  setNamesInput]  = useState('');
  const [domain,      setDomain]      = useState('');
  const [enabledFmts, setEnabledFmts] = useState(new Set(FORMAT_DEFS.map(f => f.id)));
  const [results,     setResults]     = useState([]);
  const [generated,   setGenerated]   = useState(false);
  const fileRef = useRef(null);

  const toggleFmt  = (id) => setEnabledFmts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll  = () => setEnabledFmts(new Set(FORMAT_DEFS.map(f => f.id)));
  const selectNone = () => setEnabledFmts(new Set());

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNamesInput(ev.target.result || '');
    reader.readAsText(file);
    e.target.value = '';
  };

  const generate = useCallback(() => {
    const lines = namesInput.split('\n').map(l => l.trim()).filter(Boolean);
    const dom   = domain.trim().replace(/^@/,'');
    const all   = [];
    lines.forEach(line => generateUsernames(line, enabledFmts, dom || null).forEach(u => { if (!all.includes(u)) all.push(u); }));
    setResults(all); setGenerated(true);
  }, [namesInput, enabledFmts, domain]);

  const exportTxt = () => {
    const blob = new Blob([results.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `usernames_${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  const inputLineCount = namesInput.split('\n').filter(Boolean).length;
  const dom = domain.trim().replace(/^@/,'');

  return (
    <Box px={6} pb={12}>

      {/* ── Header ── */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Username <Text as="span" color="red.400">Generator</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng?.name} · generate username permutations from first/last name pairs — namemash.py format
          </Text>
        </Box>
      </Flex>

      {/* ── Stats row ── */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={6}>
        {[
          { label: 'Input Names',   value: inputLineCount,       color: ACCENT,  icon: UsersIcon },
          { label: 'Formats Active',value: enabledFmts.size,     color: BLUE     },
          { label: 'Total Generated',value: results.length,      color: GREEN    },
          { label: 'Domain Suffix', value: dom ? `@${dom}` : '—', color: ORANGE, text: true },
        ].map(({ label, value, color, icon: Icon, text }) => (
          <MotionBox key={label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="12px" p={4} pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
            <Flex justify="space-between" align="flex-start">
              <Box>
                <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
                <Text fontSize={text ? 'sm' : '2xl'} fontWeight="black" color={color} noOfLines={1}>{value}</Text>
              </Box>
              {Icon && (
                <Flex w="32px" h="32px" borderRadius="8px" bg={`${color}10`}
                  border={`1px solid ${color}25`} align="center" justify="center">
                  <Icon boxSize="14px" color={color} />
                </Flex>
              )}
            </Flex>
          </MotionBox>
        ))}
      </SimpleGrid>

      <Flex gap={5} align="flex-start" flexWrap={{ base: 'wrap', xl: 'nowrap' }}>

        {/* ── Left: Config ── */}
        <Box flex="1" minW="320px">

          {/* Names input card */}
          <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="14px" p={5} mb={4} pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />

            <Flex align="center" justify="space-between" mb={3}>
              <Flex align="center" gap={2}>
                <Box w="3px" h="14px" borderRadius="full" bg={ACCENT} />
                <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider">Names</Text>
                <Box px="8px" py="1px" borderRadius="5px" bg={`${ACCENT}12`} border={`1px solid ${ACCENT}30`}>
                  <Text fontSize="9px" fontWeight="bold" color={ACCENT}>{inputLineCount} name{inputLineCount !== 1 ? 's' : ''}</Text>
                </Box>
              </Flex>
              <Tooltip label="Upload .txt file (Firstname Lastname per line)" fontSize="10px">
                <IconButton icon={<AttachmentIcon boxSize={3} />} size="xs" variant="ghost"
                  color="var(--dash-text-muted)" borderRadius="6px"
                  _hover={{ color: ACCENT, bg: `${ACCENT}12` }}
                  aria-label="upload" onClick={() => fileRef.current?.click()} />
              </Tooltip>
              <input ref={fileRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={handleFile} />
            </Flex>

            <Textarea
              placeholder={"John Smith\nJane Doe\nRobert Johnson"}
              value={namesInput}
              onChange={e => setNamesInput(e.target.value)}
              rows={7}
              variant="unstyled"
              bg="rgba(0,0,0,0.25)" border="1px solid rgba(255,255,255,0.08)"
              borderRadius="10px" px={4} py={3}
              color="var(--dash-text-primary)" fontSize="13px" fontFamily="mono" resize="vertical"
              _placeholder={{ color: 'var(--dash-text-muted)' }}
              _focus={{ border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` }}
              mb={4}
            />

            <Box mb={2}>
              <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}>
                Domain <Text as="span" fontWeight="normal" textTransform="none" letterSpacing="normal" color="var(--dash-text-muted)" opacity={0.7}>— optional email suffix</Text>
              </Text>
              <Input {...inputSx} placeholder="company.com" value={domain} onChange={e => setDomain(e.target.value)} />
            </Box>
          </MotionBox>

          {/* Formats card */}
          <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.08 }}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="14px" p={5} mb={4} pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${BLUE}80, transparent)` }} />

            <Flex align="center" justify="space-between" mb={3}>
              <Flex align="center" gap={2}>
                <Box w="3px" h="14px" borderRadius="full" bg={BLUE} />
                <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider">Formats</Text>
              </Flex>
              <Flex gap={2}>
                <Button size="xs" variant="ghost" fontSize="10px" color="var(--dash-text-muted)"
                  _hover={{ color: ACCENT }} onClick={selectAll}>All</Button>
                <Button size="xs" variant="ghost" fontSize="10px" color="var(--dash-text-muted)"
                  _hover={{ color: 'var(--dash-text-secondary)' }} onClick={selectNone}>None</Button>
              </Flex>
            </Flex>

            <SimpleGrid columns={2} spacing={0.5}>
              {FORMAT_DEFS.map(f => (
                <Flex key={f.id} align="center" gap={2} px={2} py="5px" borderRadius="7px"
                  cursor="pointer" _hover={{ bg: 'rgba(255,255,255,0.04)' }} onClick={() => toggleFmt(f.id)}>
                  <Checkbox isChecked={enabledFmts.has(f.id)} onChange={() => toggleFmt(f.id)}
                    colorScheme="purple" size="sm" onClick={e => e.stopPropagation()} />
                  <Text fontSize="11px" fontFamily="mono"
                    color={enabledFmts.has(f.id) ? 'var(--dash-text-secondary)' : 'var(--dash-text-muted)'}>
                    {f.label}
                  </Text>
                </Flex>
              ))}
            </SimpleGrid>
          </MotionBox>

          {/* Generate button */}
          <Button w="100%" size="md" h="44px" borderRadius="10px" fontWeight="bold" fontSize="13px"
            leftIcon={<AddIcon boxSize={3} />}
            bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
            color={ACCENT} _hover={{ bg: `${ACCENT}25`, transform: 'translateY(-1px)' }}
            _active={{ transform: 'translateY(0)' }}
            transition="all 0.2s"
            isDisabled={!namesInput.trim()}
            onClick={generate}>
            Generate Usernames
          </Button>
        </Box>

        {/* ── Right: Results ── */}
        <MotionBox flex="1.4" minW="320px"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="14px" pos="relative" overflow="hidden">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${GREEN}80, transparent)` }} />

          <Box p={5}>
            <Flex align="center" justify="space-between" mb={4}>
              <Flex align="center" gap={2}>
                <Box w="3px" h="14px" borderRadius="full" bg={GREEN} />
                <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider">Results</Text>
                {results.length > 0 && (
                  <Box px="8px" py="1px" borderRadius="5px" bg={`${GREEN}12`} border={`1px solid ${GREEN}30`}>
                    <Text fontSize="9px" fontWeight="bold" color={GREEN}>{results.length}</Text>
                  </Box>
                )}
              </Flex>
              {results.length > 0 && (
                <Flex gap={2}>
                  <Tooltip label="Copy all" fontSize="10px">
                    <IconButton icon={<CopyIcon boxSize={3} />} size="sm" variant="ghost"
                      color="var(--dash-text-muted)" borderRadius="7px"
                      _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                      aria-label="copy all"
                      onClick={() => navigator.clipboard.writeText(results.join('\n'))} />
                  </Tooltip>
                  <Button leftIcon={<DownloadIcon boxSize={3} />} size="sm" fontSize="11px"
                    fontWeight="bold" borderRadius="7px"
                    bg={`${GREEN}15`} border={`1px solid ${GREEN}40`}
                    color={GREEN} _hover={{ bg: `${GREEN}25` }}
                    onClick={exportTxt}>
                    Export .txt
                  </Button>
                </Flex>
              )}
            </Flex>

            {!generated ? (
              <Flex direction="column" align="center" justify="center" h="320px" gap={4}>
                <Flex w="52px" h="52px" borderRadius="14px"
                  bg={`${ACCENT}10`} border={`1px solid ${ACCENT}25`}
                  align="center" justify="center">
                  <UsersIcon boxSize="22px" color={ACCENT} />
                </Flex>
                <Box textAlign="center">
                  <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)">Enter names and click Generate</Text>
                  <Text fontSize="12px" color="var(--dash-text-muted)" mt={1}>One "Firstname Lastname" per line</Text>
                </Box>
              </Flex>
            ) : results.length === 0 ? (
              <Flex align="center" justify="center" h="200px">
                <Text fontSize="12px" color="var(--dash-text-muted)">No results — check your input and selected formats</Text>
              </Flex>
            ) : (
              <Box>
                {namesInput.split('\n').map(l => l.trim()).filter(Boolean).map((line, li) => {
                  const usernames = generateUsernames(line, enabledFmts, dom || null);
                  return (
                    <MotionBox key={li}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: li * 0.04 }} mb={4}>
                      <Flex align="center" gap={2} mb={2}>
                        <Box w="3px" h="10px" borderRadius="full" bg={ACCENT} />
                        <Text fontSize="11px" fontWeight="semibold" color="var(--dash-text-secondary)">{line}</Text>
                        <Box px="6px" py="1px" borderRadius="4px" bg={`${ACCENT}12`} border={`1px solid ${ACCENT}25`}>
                          <Text fontSize="9px" fontWeight="bold" color={ACCENT}>{usernames.length}</Text>
                        </Box>
                      </Flex>
                      <Box bg="rgba(0,0,0,0.25)" borderRadius="10px"
                        border="1px solid rgba(255,255,255,0.06)" p={3}
                        display="grid"
                        gridTemplateColumns="repeat(auto-fill, minmax(150px, 1fr))"
                        gap={0.5}>
                        {usernames.map((u, ui) => (
                          <Flex key={ui} align="center" justify="space-between"
                            px={2} py="3px" borderRadius="6px"
                            _hover={{ bg: 'rgba(255,255,255,0.05)' }} role="group">
                            <Text fontSize="11px" fontFamily="mono" color="var(--dash-text-primary)" noOfLines={1}>{u}</Text>
                            <Box opacity={0} _groupHover={{ opacity: 1 }}>
                              <CopyBtn value={u} />
                            </Box>
                          </Flex>
                        ))}
                      </Box>
                    </MotionBox>
                  );
                })}
              </Box>
            )}
          </Box>
        </MotionBox>
      </Flex>
    </Box>
  );
};

export default UsernameGeneratorView;
