import { useState, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Input, Button, IconButton,
  SimpleGrid, Tooltip, Tag, TagLabel, Spinner,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, CopyIcon, CheckIcon, DownloadIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Colors ───────────────────────────────────────────────────────────────────
const ACCENT  = '#9F7AEA';
const GREEN   = '#68D391';
const BLUE    = '#63B3ED';
const ORANGE  = '#F6AD55';
const CYAN    = '#76E4F7';
const RED     = '#FC8181';
const YELLOW  = '#ECC94B';
const PINK    = '#F687B3';

// ── Input styles ─────────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '42px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  fontFamily: "'Fira Code', monospace",
  _placeholder: { color: 'var(--dash-text-muted)' },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

// ── SVG icons ─────────────────────────────────────────────────────────────────
const TargetIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </Box>
);
const KeyboardIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
  </Box>
);

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

// ── Availability badge ────────────────────────────────────────────────────────
const AvailBadge = ({ status }) => {
  if (status === undefined) return null;
  if (status === null) return (
    <Flex align="center" gap={1} px={2} py="2px" borderRadius="5px"
      bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)" flexShrink={0}>
      <Spinner size="xs" color="var(--dash-text-muted)" speed="0.8s" />
      <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)">Checking</Text>
    </Flex>
  );
  if (status === true) return (
    <Tooltip label="Domain appears available" fontSize="10px">
      <Flex align="center" gap={1} px={2} py="2px" borderRadius="5px"
        bg={`${GREEN}15`} border={`1px solid ${GREEN}35`} flexShrink={0}>
        <UnlockIcon boxSize={2} color={GREEN} />
        <Text fontSize="9px" fontWeight="bold" color={GREEN}>Available</Text>
      </Flex>
    </Tooltip>
  );
  return (
    <Tooltip label="Domain is registered" fontSize="10px">
      <Flex align="center" gap={1} px={2} py="2px" borderRadius="5px"
        bg={`${RED}15`} border={`1px solid ${RED}35`} flexShrink={0}>
        <LockIcon boxSize={2} color={RED} />
        <Text fontSize="9px" fontWeight="bold" color={RED}>Taken</Text>
      </Flex>
    </Tooltip>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Typosquat generation algorithms
// ─────────────────────────────────────────────────────────────────────────────
const QWERTY = {
  q:'wa',  w:'qsae', e:'wsdr', r:'edft', t:'rfgy', y:'tghu', u:'yhji', i:'ujko', o:'iklp', p:'ol',
  a:'qwsz', s:'awedxz', d:'serfcx', f:'drtgvc', g:'ftyhbv', h:'gyujnb', j:'huikmn', k:'jiolm', l:'kop',
  z:'as', x:'zsdc', c:'xdfv', v:'cfgb', b:'vghn', n:'bhjm', m:'njk',
  '1':'2q','2':'13qw','3':'24we','4':'35er','5':'46rt','6':'57ty','7':'68yu','8':'79ui','9':'80io','0':'9op',
};
const HOMOGLYPHS = {
  a:['а','4'], e:['е','3'], i:['і','1','l'], l:['1','i'], o:['о','0','ο'], s:['ѕ','5'],
  b:['6'], g:['9'], c:['с'], n:['η'], p:['р'], u:['υ'], v:['ν'], w:['ω'], x:['х'], y:['у'],
};
const TLDS = ['com','net','org','io','co','info','biz','app','dev','site','online','store','tech','cloud','ai','us','uk','de'];
const AFFIXES = ['secure','login','account','verify','support','update','service','portal','my','official','help','auth','access','signin'];

const uniq = (arr) => [...new Set(arr)];
const parseDomain = (input) => {
  const clean = input.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*/,'');
  const parts = clean.split('.');
  const tld   = parts.length > 1 ? parts.slice(-1)[0] : 'com';
  const sld   = parts.slice(0, -1).join('.');
  return { full: clean, sld, tld };
};

const genDeletions      = ({ sld, tld }) => uniq(Array.from(sld).map((_, i) => `${sld.slice(0,i)}${sld.slice(i+1)}.${tld}`).filter(d => d !== `.${tld}`));
const genTranspositions = ({ sld, tld }) => { const o = []; for (let i = 0; i < sld.length-1; i++) { const t = sld.split(''); [t[i],t[i+1]] = [t[i+1],t[i]]; o.push(`${t.join('')}.${tld}`); } return uniq(o); };
const genKeyboard       = ({ sld, tld }) => { const o = []; for (let i = 0; i < sld.length; i++) { for (const n of QWERTY[sld[i]] || '') o.push(`${sld.slice(0,i)}${n}${sld.slice(i+1)}.${tld}`); } return uniq(o); };
const genDuplications   = ({ sld, tld }) => uniq(Array.from(sld).map((c, i) => `${sld.slice(0,i)}${c}${sld.slice(i)}.${tld}`));
const genHomoglyphs     = ({ sld, tld }) => { const o = []; for (let i = 0; i < sld.length; i++) { for (const g of HOMOGLYPHS[sld[i]] || []) o.push(`${sld.slice(0,i)}${g}${sld.slice(i+1)}.${tld}`); } return uniq(o); };
const genTLDs           = ({ sld, tld }) => TLDS.filter(t => t !== tld).map(t => `${sld}.${t}`);
const genHyphens        = ({ sld, tld }) => { const o = []; for (let i = 1; i < sld.length; i++) o.push(`${sld.slice(0,i)}-${sld.slice(i)}.${tld}`); if (sld.includes('-')) o.push(`${sld.replace(/-/g,'')}.${tld}`); return uniq(o); };
const genAffixes        = ({ sld, tld }) => uniq(AFFIXES.flatMap(a => [`${sld}-${a}.${tld}`,`${a}-${sld}.${tld}`,`${sld}${a}.${tld}`,`${a}${sld}.${tld}`]));

const CATEGORIES = [
  { id: 'deletions',      label: 'Char Deletion',    longLabel: 'Character Deletion',    color: RED,    fn: genDeletions,      desc: 'Missing characters'    },
  { id: 'transpositions', label: 'Transpositions',   longLabel: 'Transpositions',        color: ORANGE, fn: genTranspositions, desc: 'Swapped adjacent chars' },
  { id: 'keyboard',       label: 'Keyboard',         longLabel: 'Keyboard Adjacency',    color: YELLOW, fn: genKeyboard,       desc: 'Nearby key typos'      },
  { id: 'duplications',   label: 'Duplication',      longLabel: 'Char Duplication',      color: GREEN,  fn: genDuplications,   desc: 'Double characters'     },
  { id: 'homoglyphs',     label: 'Homoglyphs',       longLabel: 'Homoglyphs',            color: CYAN,   fn: genHomoglyphs,     desc: 'Unicode lookalikes'    },
  { id: 'tlds',           label: 'TLD Swap',         longLabel: 'TLD Variations',        color: BLUE,   fn: genTLDs,           desc: 'Different TLDs'        },
  { id: 'hyphens',        label: 'Hyphens',          longLabel: 'Hyphen Variants',       color: ACCENT, fn: genHyphens,        desc: 'Hyphen insert/remove'  },
  { id: 'affixes',        label: 'Word Affixes',     longLabel: 'Word Affixes',          color: PINK,   fn: genAffixes,        desc: 'Prefix/suffix words'   },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────────────────────
const TyposquatView = () => {
  const { slug } = useParams();
  const { getBySlug } = useEngagements();
  const eng = getBySlug(slug);

  const [domainInput,    setDomainInput]    = useState('');
  const [results,        setResults]        = useState(null);
  const [parsed,         setParsed]         = useState(null);
  const [enabled,        setEnabled]        = useState(new Set(CATEGORIES.map(c => c.id)));
  const [filter,         setFilter]         = useState('');
  const [activeTab,      setActiveTab]      = useState('all');
  const [availability,   setAvailability]   = useState({});   // { domain: true|false|null }
  const [checking,       setChecking]       = useState(false);

  const toggle = (id) => setEnabled(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const generate = useCallback(() => {
    const p = parseDomain(domainInput);
    if (!p.sld) return;
    setParsed(p);
    const cats = {};
    CATEGORIES.forEach(cat => { cats[cat.id] = enabled.has(cat.id) ? cat.fn(p).filter(d => d !== p.full) : []; });
    setResults(cats); setActiveTab('all'); setFilter('');
    setAvailability({}); // reset availability when regenerating
  }, [domainInput, enabled]);

  const checkAvailability = useCallback(async (domainsToCheck) => {
    if (checking) return;
    setChecking(true);

    // Mark all as pending immediately
    const pending = {};
    domainsToCheck.forEach(d => { pending[d] = null; });
    setAvailability(prev => ({ ...prev, ...pending }));

    // Check each domain via Cloudflare DoH directly from the browser — fully parallel
    const checkOne = async (domain) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
          { headers: { Accept: 'application/dns-json' }, signal: controller.signal }
        );
        clearTimeout(timer);
        const data = await res.json();
        // Status 3 = NXDOMAIN = available; Status 0 with Answer = taken
        const available = data.Status === 3 || (data.Status === 0 && (!data.Answer || data.Answer.length === 0));
        return { domain, available };
      } catch {
        return { domain, available: null };
      }
    };

    // Run all in parallel, update state as each resolves
    const promises = domainsToCheck.map(d =>
      checkOne(d).then(result => {
        setAvailability(prev => ({ ...prev, [result.domain]: result.available }));
        return result;
      })
    );
    await Promise.all(promises);
    setChecking(false);
  }, [checking]);

  const allDomains = results ? uniq(Object.values(results).flat()) : [];
  const filteredAll = filter ? allDomains.filter(d => d.includes(filter.toLowerCase())) : allDomains;

  const exportTxt = () => {
    const blob = new Blob([allDomains.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `typosquats_${parsed?.sld || 'domain'}_${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box px={6} pb={12}>

      {/* ── Header ── */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Typosquat <Text as="span" color="red.400">Generator</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng?.name} · generate lookalike and homoglyph domains for phishing preparation
          </Text>
        </Box>
      </Flex>

      {/* ── Config card ── */}
      <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="14px" p={5} mb={6} pos="relative" overflow="hidden">
        <Box pos="absolute" top={0} left={0} right={0} h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />

        {/* Domain input row */}
        <Flex gap={3} mb={5} align="flex-end">
          <Box flex="1">
            <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider" mb={1.5}>Target Domain</Text>
            <Input {...inputSx} placeholder="target-domain.com"
              value={domainInput} onChange={e => setDomainInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generate()} />
          </Box>
          <Button size="md" h="42px" px={6} borderRadius="10px" fontWeight="bold" fontSize="13px"
            leftIcon={<SearchIcon boxSize={3} />}
            bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
            color={ACCENT} _hover={{ bg: `${ACCENT}25`, transform: 'translateY(-1px)' }}
            _active={{ transform: 'translateY(0)' }} transition="all 0.2s"
            isDisabled={!domainInput.trim()} onClick={generate}>
            Generate
          </Button>
        </Flex>

        {/* Category toggles */}
        <Box>
          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wider" mb={2}>Techniques</Text>
          <Flex gap={2} flexWrap="wrap">
            {CATEGORIES.map(c => (
              <Tag key={c.id} size="sm" borderRadius="full" cursor="pointer"
                bg={enabled.has(c.id) ? `${c.color}18` : 'rgba(255,255,255,0.04)'}
                border={`1px solid ${enabled.has(c.id) ? c.color + '45' : 'rgba(255,255,255,0.1)'}`}
                color={enabled.has(c.id) ? c.color : 'var(--dash-text-muted)'}
                transition="all 0.15s" _hover={{ opacity: 1, borderColor: c.color + '60' }}
                opacity={enabled.has(c.id) ? 1 : 0.5}
                onClick={() => toggle(c.id)} px={3} py={1}>
                <TagLabel fontSize="11px" fontWeight="semibold">{c.label}</TagLabel>
              </Tag>
            ))}
          </Flex>
        </Box>
      </MotionBox>

      {/* ── Results ── */}
      <AnimatePresence>
        {!results ? (
          <MotionBox key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="14px" p={8} display="flex" flexDirection="column"
            alignItems="center" justifyContent="center" gap={4}>
            <Flex w="52px" h="52px" borderRadius="14px"
              bg={`${ACCENT}10`} border={`1px solid ${ACCENT}25`}
              align="center" justify="center">
              <TargetIcon boxSize="22px" color={ACCENT} />
            </Flex>
            <Box textAlign="center">
              <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)">Enter a domain to generate variants</Text>
              <Text fontSize="12px" color="var(--dash-text-muted)" mt={1} maxW="420px">
                Generates keyboard typos, character swaps, homoglyphs, TLD variations, hyphen variants, and word affixes.
              </Text>
            </Box>
          </MotionBox>
        ) : (
          <MotionBox key="results"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* Stats row */}
            <SimpleGrid columns={{ base: 2, md: 4, lg: 5 }} gap={3} mb={6}>
              <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="12px" p={4} pos="relative" overflow="hidden">
                <Box pos="absolute" top={0} left={0} right={0} h="2px"
                  style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />
                <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider" mb={1}>Total Variants</Text>
                <Text fontSize="2xl" fontWeight="black" color={ACCENT}>{allDomains.length}</Text>
              </MotionBox>
              {CATEGORIES.map((c, ci) => {
                const count = results[c.id]?.length || 0;
                return (
                  <MotionBox key={c.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.03 * (ci + 1) }}
                    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                    borderRadius="12px" p={4} pos="relative" overflow="hidden"
                    cursor="pointer"
                    _hover={{ borderColor: count > 0 ? `${c.color}40` : undefined }}
                    onClick={() => count > 0 && setActiveTab(c.id)}
                    opacity={count === 0 ? 0.5 : 1}
                    style={{ transition: 'all 0.15s' }}>
                    <Box pos="absolute" top={0} left={0} right={0} h="2px"
                      style={{ background: `linear-gradient(to right, transparent, ${c.color}80, transparent)` }} />
                    <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wider" mb={1}>{c.label}</Text>
                    <Text fontSize="2xl" fontWeight="black" color={c.color}>{count}</Text>
                    <Text fontSize="9px" color="var(--dash-text-muted)" mt={0.5}>{c.desc}</Text>
                  </MotionBox>
                );
              })}
            </SimpleGrid>

            {/* Tab bar + export */}
            <Flex align="center" justify="space-between" mb={4} gap={3} flexWrap="wrap">
              <Flex gap={1} overflowX="auto"
                css={{ '&::-webkit-scrollbar': { height: '2px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)' } }}>
                <Box as="button"
                  px={4} py={2} borderRadius="8px" fontSize="12px" fontWeight="semibold" whiteSpace="nowrap"
                  bg={activeTab === 'all' ? `${ACCENT}15` : 'transparent'}
                  border={`1px solid ${activeTab === 'all' ? ACCENT + '50' : 'transparent'}`}
                  color={activeTab === 'all' ? ACCENT : 'var(--dash-text-muted)'}
                  _hover={{ color: 'var(--dash-text-secondary)', bg: 'rgba(255,255,255,0.05)' }}
                  transition="all 0.15s" onClick={() => setActiveTab('all')}>
                  All ({allDomains.length})
                </Box>
                {CATEGORIES.map(c => {
                  const count = results[c.id]?.length || 0;
                  const isActive = activeTab === c.id;
                  return (
                    <Box key={c.id} as="button"
                      px={4} py={2} borderRadius="8px" fontSize="12px" fontWeight="semibold" whiteSpace="nowrap"
                      bg={isActive ? `${c.color}15` : 'transparent'}
                      border={`1px solid ${isActive ? c.color + '50' : 'transparent'}`}
                      color={isActive ? c.color : 'var(--dash-text-muted)'}
                      _hover={{ color: c.color, bg: `${c.color}0A` }}
                      transition="all 0.15s" opacity={count === 0 ? 0.4 : 1}
                      onClick={() => count > 0 && setActiveTab(c.id)}>
                      {c.label} ({count})
                    </Box>
                  );
                })}
              </Flex>

              <Flex gap={2} flexShrink={0}>
                <Tooltip label="Copy all" fontSize="10px">
                  <IconButton icon={<CopyIcon boxSize={3} />} size="sm" variant="ghost"
                    color="var(--dash-text-muted)" borderRadius="7px"
                    _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                    aria-label="copy all"
                    onClick={() => navigator.clipboard.writeText(allDomains.join('\n'))} />
                </Tooltip>
                <Button
                  leftIcon={checking ? <Spinner size="xs" /> : <UnlockIcon boxSize={3} />}
                  size="sm" fontSize="11px" fontWeight="bold" borderRadius="7px"
                  bg={`${CYAN}15`} border={`1px solid ${CYAN}40`}
                  color={CYAN} _hover={{ bg: `${CYAN}25` }}
                  isLoading={false}
                  isDisabled={checking}
                  onClick={() => {
                    const visible = activeTab === 'all' ? filteredAll : (results[activeTab] || []);
                    checkAvailability(visible);
                  }}>
                  {checking ? 'Checking…' : 'Check Availability'}
                </Button>
                <Button leftIcon={<DownloadIcon boxSize={3} />} size="sm" fontSize="11px"
                  fontWeight="bold" borderRadius="7px"
                  bg={`${GREEN}15`} border={`1px solid ${GREEN}40`}
                  color={GREEN} _hover={{ bg: `${GREEN}25` }}
                  onClick={exportTxt}>
                  Export .txt
                </Button>
              </Flex>
            </Flex>

            {/* All tab: filter + grid */}
            {activeTab === 'all' && (
              <Box mb={4}>
                <Flex align="center" gap={2}
                  bg="rgba(255,255,255,0.04)" borderRadius="8px"
                  border="1px solid rgba(255,255,255,0.1)" px={3} h="36px" maxW="280px" mb={3}>
                  <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
                  <Input variant="unstyled" placeholder="Filter variants…" fontSize="xs"
                    color="var(--dash-text-primary)" _placeholder={{ color: 'var(--dash-text-muted)' }}
                    value={filter} onChange={e => setFilter(e.target.value)} />
                </Flex>
              </Box>
            )}

            {/* Domain grid */}
            <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="14px" p={5} pos="relative" overflow="hidden">
              <Box pos="absolute" top={0} left={0} right={0} h="2px"
                style={{ background: `linear-gradient(to right, transparent, ${activeTab === 'all' ? ACCENT : (CATEGORIES.find(c => c.id === activeTab)?.color || ACCENT)}80, transparent)` }} />

              {activeTab === 'all' ? (
                filteredAll.length === 0 ? (
                  <Text fontSize="12px" color="var(--dash-text-muted)">No results match.</Text>
                ) : (
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={1}>
                    {filteredAll.map((d, i) => {
                      const cats = CATEGORIES.filter(c => results[c.id]?.includes(d));
                      const avail = availability[d];
                      return (
                        <Flex key={i} align="center" justify="space-between"
                          px={3} py={2} borderRadius="7px"
                          bg={avail === true ? `${GREEN}08` : avail === false ? `${RED}08` : 'rgba(255,255,255,0.02)'}
                          border={`1px solid ${avail === true ? GREEN + '20' : avail === false ? RED + '15' : 'transparent'}`}
                          _hover={{ bg: avail === true ? `${GREEN}12` : avail === false ? `${RED}12` : 'rgba(255,255,255,0.05)', borderColor: avail === true ? GREEN + '30' : avail === false ? RED + '25' : 'rgba(255,255,255,0.08)' }}
                          role="group" gap={2} transition="all 0.12s">
                          <Box minW={0} flex={1}>
                            <Text fontSize="11px" fontFamily="mono" color="var(--dash-text-primary)" noOfLines={1}>{d}</Text>
                            <Flex gap={1} mt="2px">
                              {cats.slice(0,3).map(c => (
                                <Box key={c.id} w="4px" h="4px" borderRadius="full" bg={c.color} flexShrink={0} />
                              ))}
                            </Flex>
                          </Box>
                          <Flex align="center" gap={1} flexShrink={0}>
                            {d in availability && <AvailBadge status={avail} />}
                            <Box opacity={0} _groupHover={{ opacity: 1 }}>
                              <CopyBtn value={d} />
                            </Box>
                          </Flex>
                        </Flex>
                      );
                    })}
                  </SimpleGrid>
                )
              ) : (() => {
                const cat  = CATEGORIES.find(c => c.id === activeTab);
                const list = results[activeTab] || [];
                return (
                  <Box>
                    <Flex align="center" gap={2} mb={4}>
                      <Box w="3px" h="14px" borderRadius="full" bg={cat?.color || ACCENT} />
                      <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                        textTransform="uppercase" letterSpacing="wider">{cat?.longLabel}</Text>
                      <Box px="8px" py="1px" borderRadius="5px"
                        bg={`${cat?.color || ACCENT}12`} border={`1px solid ${cat?.color || ACCENT}30`}>
                        <Text fontSize="9px" fontWeight="bold" color={cat?.color || ACCENT}>{list.length}</Text>
                      </Box>
                      <Text fontSize="11px" color="var(--dash-text-muted)">{cat?.desc}</Text>
                    </Flex>
                    {list.length === 0 ? (
                      <Text fontSize="12px" color="var(--dash-text-muted)">No variants in this category.</Text>
                    ) : (
                      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={1}>
                        {list.map((d, i) => {
                          const avail = availability[d];
                          return (
                            <Flex key={i} align="center" justify="space-between"
                              px={3} py={2} borderRadius="7px"
                              bg={avail === true ? `${GREEN}08` : avail === false ? `${RED}08` : 'rgba(255,255,255,0.02)'}
                              border={`1px solid ${avail === true ? GREEN + '20' : avail === false ? RED + '15' : 'transparent'}`}
                              _hover={{ bg: avail === true ? `${GREEN}12` : avail === false ? `${RED}12` : 'rgba(255,255,255,0.05)', borderColor: avail === true ? GREEN + '30' : avail === false ? RED + '25' : 'rgba(255,255,255,0.08)' }}
                              role="group" gap={2} transition="all 0.12s">
                              <Text fontSize="11px" fontFamily="mono" color="var(--dash-text-primary)" noOfLines={1} flex={1}>{d}</Text>
                              <Flex align="center" gap={1} flexShrink={0}>
                                {d in availability && <AvailBadge status={avail} />}
                                <Box opacity={0} _groupHover={{ opacity: 1 }}>
                                  <CopyBtn value={d} />
                                </Box>
                              </Flex>
                            </Flex>
                          );
                        })}
                      </SimpleGrid>
                    )}
                  </Box>
                );
              })()}
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default TyposquatView;
