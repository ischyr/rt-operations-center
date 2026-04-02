import { useState, useCallback } from 'react';
import {
  Box, Flex, Text, Button, Input, Textarea, SimpleGrid,
  HStack, IconButton, Switch, Wrap, WrapItem, Badge,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  useToast,
} from '@chakra-ui/react';
import { DownloadIcon, CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT  = '#FC8181';
const GREEN   = '#68D391';
const BLUE    = '#63B3ED';
const ORANGE  = '#F6AD55';
const PURPLE  = '#9F7AEA';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const KeyIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M21 2l-9.6 9.6" />
    <path d="M15.5 7.5l3 3L22 7l-3-3" />
  </Box>
);

const TargetIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </Box>
);

const TagIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </Box>
);

const CalendarIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Box>
);

const SlidersIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </Box>
);

const TerminalIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </Box>
);

const ZapIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Box>
);

const ListIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </Box>
);

// ── Wordlist engine ───────────────────────────────────────────────────────────
function buildWordlist({ company, domain, keywords, yearStart, yearEnd, includeSeasons, includeLeet, includeCommon, includeKeywordMix }) {
  const words = new Set();
  const cap   = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const rawBases = [];
  const c = company.trim();
  if (c) rawBases.push(c, c.toLowerCase(), c.toUpperCase(), cap(c));

  const domainBase = domain.trim()
    .replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0].trim();
  if (domainBase && domainBase.toLowerCase() !== c.toLowerCase()) {
    rawBases.push(domainBase, cap(domainBase), domainBase.toUpperCase());
  }

  const kws = keywords.split(/[,\n]/).map((k) => k.trim()).filter(Boolean);
  kws.forEach((k) => rawBases.push(k, k.toLowerCase(), cap(k)));

  const bases = [...new Set(rawBases)].filter(Boolean);

  const years      = [];
  for (let y = yearStart; y <= yearEnd; y++) years.push(String(y));
  const shortYears = years.map((y) => y.slice(2));

  const specials   = ['!', '@', '#', '$', '!@#'];
  const nums       = ['1', '12', '123', '1234', '12345'];
  const numSpec    = ['!123', '@123', '#123', '123!', '123@', '1!', '1@'];
  const allSuffix  = [...specials, ...nums, ...numSpec];
  const seasons    = ['Spring', 'Summer', 'Fall', 'Winter'];
  const commonApp  = ['Pass', 'pass', 'Password', 'password', 'Admin', 'admin', 'Login', 'login', 'Secure', 'secure', 'It', 'it'];
  const leet       = (s) => s.replace(/a/gi,'4').replace(/e/gi,'3').replace(/i/gi,'1').replace(/o/gi,'0').replace(/s/gi,'5');

  const add = (w) => { if (w && w.length >= 6) words.add(w); };

  bases.forEach((base) => {
    allSuffix.forEach((s) => add(base + s));
    years.forEach((y) => {
      add(base + y);
      specials.forEach((s) => add(base + y + s));
      add(base + '@' + y);
      add(base + '#' + y);
      add(base + '_' + y);
    });
    shortYears.forEach((sy) => {
      add(base + sy);
      specials.forEach((s) => add(base + sy + s));
    });
    if (includeSeasons) {
      seasons.forEach((season) => {
        add(base + season);
        years.forEach((y) => {
          add(base + season + y);
          specials.forEach((s) => add(base + season + y + s));
        });
      });
    }
    commonApp.forEach((w) => {
      add(base + w);
      add(base + w + '1');
      specials.forEach((s) => add(base + w + s));
      years.forEach((y) => add(base + w + y));
    });
    if (includeLeet) {
      const l = leet(base);
      if (l !== base) {
        add(l);
        years.forEach((y) => { add(l + y); specials.forEach((s) => add(l + y + s)); });
        allSuffix.forEach((s) => add(l + s));
      }
    }
  });

  if (includeKeywordMix && kws.length > 1) {
    kws.forEach((k1) => kws.forEach((k2) => {
      if (k1 === k2) return;
      const combo = cap(k1) + cap(k2);
      add(combo);
      years.forEach((y) => { add(combo + y); specials.forEach((s) => add(combo + y + s)); });
      add(combo + '123!');
      add(combo + '!');
    }));
  }

  if (includeCommon) {
    ['Welcome1!','Welcome1','Welcome@1','Welcome123!','Password1!','Password1','P@ssword1',
     'P@ssw0rd1','Password123','Password123!','Passw0rd!','Admin123!','Admin@123','Admin1234',
     'Admin@1','Change@123','Change123!','Changeme1!','Test1234!','Test@123','Hello@123',
     'Login@123','Qwerty@123','Qwerty1!',
    ].forEach((p) => words.add(p));
    if (c) { add('Welcome' + cap(c) + '!'); add(cap(c) + 'Welcome1!'); add(cap(c) + '@Welcome1'); }
  }

  return [...words].filter((w) => w.length >= 6).sort();
}

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon: Icon, delay = 0 }) => (
  <MotionBox
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay }}
    px={4} py={3} borderRadius="12px" bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Flex align="center" gap={2} mb={1}>
      {Icon && (
        <Flex w="22px" h="22px" borderRadius="6px" bg={`${color}18`} border={`1px solid ${color}30`}
          align="center" justify="center" flexShrink={0}>
          <Icon w="12px" h="12px" color={color} />
        </Flex>
      )}
      <Text fontSize="9px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)"
        textTransform="uppercase">{label}</Text>
    </Flex>
    <Text fontSize="22px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
  </MotionBox>
);

// ── Config section header ─────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, label, color }) => (
  <Flex align="center" gap={2.5} mb={3}>
    <Flex w="28px" h="28px" borderRadius="8px" bg={`${color}18`} border={`1px solid ${color}35`}
      align="center" justify="center" flexShrink={0}>
      <Icon w="13px" h="13px" color={color} />
    </Flex>
    <Text fontSize="11px" fontWeight="bold" letterSpacing="widest" color="var(--dash-text-muted)"
      textTransform="uppercase">{label}</Text>
  </Flex>
);

// ── Toggle row ────────────────────────────────────────────────────────────────
const ToggleRow = ({ label, desc, value, onChange, color = ACCENT }) => (
  <Flex align="center" justify="space-between" py={2.5}
    borderBottom="1px solid rgba(255,255,255,0.04)" _last={{ borderBottom: 'none' }}>
    <Box>
      <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)">{label}</Text>
      <Text fontSize="10px" color="var(--dash-text-muted)" mt="1px">{desc}</Text>
    </Box>
    <Switch isChecked={value} onChange={(e) => onChange(e.target.checked)}
      colorScheme="red" size="sm" flexShrink={0} ml={4} />
  </Flex>
);

// ── Input style ───────────────────────────────────────────────────────────────
const inputSx = {
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { borderColor: `${ACCENT}50` },
  _focus: { borderColor: `${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

// ── Main view ─────────────────────────────────────────────────────────────────
const WordlistView = () => {
  const toast = useToast();

  const [company,     setCompany]     = useState('');
  const [domain,      setDomain]      = useState('');
  const [keywords,    setKeywords]    = useState('');
  const [yearStart,   setYearStart]   = useState(2020);
  const [yearEnd,     setYearEnd]     = useState(2026);
  const [inclSeasons, setInclSeasons] = useState(true);
  const [inclLeet,    setInclLeet]    = useState(false);
  const [inclCommon,  setInclCommon]  = useState(true);
  const [inclMix,     setInclMix]     = useState(false);
  const [minLen,      setMinLen]      = useState(6);
  const [maxLen,      setMaxLen]      = useState(0);
  const [wordlist,    setWordlist]    = useState([]);
  const [generated,   setGenerated]   = useState(false);

  const generate = useCallback(() => {
    if (!company.trim() && !domain.trim() && !keywords.trim()) {
      toast({ title: 'Enter at least a company name, domain, or keyword', status: 'warning', duration: 2500 });
      return;
    }
    let words = buildWordlist({
      company, domain, keywords, yearStart, yearEnd,
      includeSeasons: inclSeasons, includeLeet: inclLeet,
      includeCommon: inclCommon, includeKeywordMix: inclMix,
    });
    if (minLen > 6) words = words.filter((w) => w.length >= minLen);
    if (maxLen > 0) words = words.filter((w) => w.length <= maxLen);
    setWordlist(words);
    setGenerated(true);
    toast({ title: `Generated ${words.length.toLocaleString()} passwords`, status: 'success', duration: 2000 });
  }, [company, domain, keywords, yearStart, yearEnd, inclSeasons, inclLeet, inclCommon, inclMix, minLen, maxLen, toast]);

  const download = useCallback(() => {
    if (!wordlist.length) return;
    const blob = new Blob([wordlist.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `wordlist-${(company || domain || 'custom').replace(/\s+/g, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [wordlist, company, domain]);

  const copyAll = useCallback(() => {
    if (!wordlist.length) return;
    navigator.clipboard.writeText(wordlist.join('\n')).then(() =>
      toast({ title: 'Copied to clipboard', status: 'success', duration: 1500 })
    );
  }, [wordlist, toast]);

  const reset = () => {
    setCompany(''); setDomain(''); setKeywords('');
    setYearStart(2020); setYearEnd(2026);
    setInclSeasons(true); setInclLeet(false); setInclCommon(true); setInclMix(false);
    setMinLen(6); setMaxLen(0);
    setWordlist([]); setGenerated(false);
  };

  const preview   = wordlist.slice(0, 300);
  const yearRange = `${yearStart}–${yearEnd}`;

  return (
    <Box px={6} pb={12}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Wordlist <Text as="span" color="red.400">Generator</Text>
          </Text>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Build targeted corporate password lists from naming patterns
          </Text>
        </Box>
        {generated && (
          <HStack spacing={2}>
            <Button size="sm" leftIcon={<CopyIcon />} variant="ghost"
              color="var(--dash-text-secondary)" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
              borderRadius="9px" onClick={copyAll}>
              Copy All
            </Button>
            <Button size="sm" leftIcon={<DownloadIcon />} borderRadius="9px"
              bg={`${ACCENT}18`} border={`1px solid ${ACCENT}40`} color={ACCENT}
              _hover={{ bg: `${ACCENT}28`, borderColor: `${ACCENT}70` }} onClick={download}>
              Download .txt
            </Button>
            <IconButton size="sm" icon={<DeleteIcon boxSize={3} />} variant="ghost" borderRadius="9px"
              color="var(--dash-text-muted)" _hover={{ color: ACCENT, bg: `${ACCENT}12` }}
              aria-label="Reset" onClick={reset} />
          </HStack>
        )}
      </Flex>

      {/* ── Info banner ────────────────────────────────────────────────────── */}
      <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        mb={5} px={4} py={3} borderRadius="10px"
        bg={`${ORANGE}0d`} border={`1px solid ${ORANGE}30`}>
        <Flex align="center" gap={2} mb={2}>
          <ZapIcon w="12px" h="12px" color={ORANGE} />
          <Text fontSize="10px" fontWeight="bold" color={ORANGE} textTransform="uppercase" letterSpacing="wider">
            How it works
          </Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {[
            'Applies year, suffix, and seasonal pattern mutations',
            'Optional leet speak and keyword cross-mixing',
            'Deduplicates and sorts the final list',
          ].map((t) => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ORANGE} flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </MotionBox>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={5}>
        <StatCard label="Total Words"  value={wordlist.length.toLocaleString()} color={ACCENT}  icon={ListIcon}     delay={0}    />
        <StatCard label="Year Range"   value={yearRange}                        color={BLUE}    icon={CalendarIcon} delay={0.04} />
        <StatCard label="Min Length"   value={`${minLen} chars`}                color={GREEN}   icon={SlidersIcon}  delay={0.08} />
        <StatCard label="Max Length"   value={maxLen === 0 ? 'Unlimited' : `${maxLen} chars`} color={PURPLE} icon={SlidersIcon} delay={0.12} />
      </SimpleGrid>

      {/* ── Main columns ───────────────────────────────────────────────────── */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5}>

        {/* ── Left: Config ── */}
        <Flex direction="column" gap={4}>

          {/* Target information */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            borderRadius="16px" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${BLUE}90, transparent)` }} />
            <Box px={5} pt={5} pb={5}>
              <SectionHeader icon={TargetIcon} label="Target Information" color={BLUE} />
              <Flex direction="column" gap={3}>
                <Box>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mb={1.5}>Company / Organization</Text>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Corp" size="sm" {...inputSx} h="38px" />
                </Box>
                <Box>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mb={1.5}>Domain <Text as="span" fontSize="10px">(optional)</Text></Text>
                  <Input value={domain} onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. acmecorp.com" size="sm" {...inputSx} h="38px" />
                </Box>
                <Box>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mb={1.5}>
                    Extra Keywords <Text as="span" fontSize="10px">— comma or newline separated</Text>
                  </Text>
                  <Textarea value={keywords} onChange={(e) => setKeywords(e.target.value)}
                    placeholder="IT, Helpdesk, Admin, VPN, Portal..."
                    size="sm" rows={3} resize="none"
                    {...inputSx} pt={2} pb={2} lineHeight="1.6" />
                </Box>
              </Flex>
            </Box>
          </MotionBox>

          {/* Year range + length filter */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            borderRadius="16px" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${GREEN}90, transparent)` }} />
            <Box px={5} pt={5} pb={5}>
              <SectionHeader icon={CalendarIcon} label="Year Range" color={GREEN} />
              <SimpleGrid columns={2} gap={3} mb={5}>
                {[
                  { label: 'From', value: yearStart, min: 2000, max: yearEnd, onChange: (v) => setYearStart(v || 2020) },
                  { label: 'To',   value: yearEnd,   min: yearStart, max: 2030, onChange: (v) => setYearEnd(v || 2026) },
                ].map(({ label, value, min, max, onChange }) => (
                  <Box key={label}>
                    <Text fontSize="11px" color="var(--dash-text-muted)" mb={1.5}>{label}</Text>
                    <NumberInput value={value} min={min} max={max} onChange={(_, v) => onChange(v)} size="sm">
                      <NumberInputField
                        bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                        borderRadius="10px" color="var(--dash-text-primary)" h="38px"
                        _hover={{ borderColor: `${GREEN}50` }}
                        _focus={{ borderColor: `${GREEN}80`, boxShadow: `0 0 0 1px ${GREEN}40` }} />
                      <NumberInputStepper>
                        <NumberIncrementStepper color="var(--dash-text-muted)" border="none" />
                        <NumberDecrementStepper color="var(--dash-text-muted)" border="none" />
                      </NumberInputStepper>
                    </NumberInput>
                  </Box>
                ))}
              </SimpleGrid>

              <Box borderTop="1px solid rgba(255,255,255,0.06)" pt={4}>
                <SectionHeader icon={SlidersIcon} label="Password Length Filter" color={PURPLE} />
                <SimpleGrid columns={2} gap={3}>
                  {[
                    { label: 'Min length', value: minLen, min: 6, max: 32, onChange: (v) => setMinLen(v || 6) },
                    { label: 'Max length', note: '0 = unlimited', value: maxLen, min: 0, max: 128, onChange: (v) => setMaxLen(v ?? 0) },
                  ].map(({ label, note, value, min, max, onChange }) => (
                    <Box key={label}>
                      <Text fontSize="11px" color="var(--dash-text-muted)" mb={1.5}>
                        {label}{note && <Text as="span" fontSize="10px"> — {note}</Text>}
                      </Text>
                      <NumberInput value={value} min={min} max={max} onChange={(_, v) => onChange(v)} size="sm">
                        <NumberInputField
                          bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                          borderRadius="10px" color="var(--dash-text-primary)" h="38px"
                          _hover={{ borderColor: `${PURPLE}50` }}
                          _focus={{ borderColor: `${PURPLE}80`, boxShadow: `0 0 0 1px ${PURPLE}40` }} />
                        <NumberInputStepper>
                          <NumberIncrementStepper color="var(--dash-text-muted)" border="none" />
                          <NumberDecrementStepper color="var(--dash-text-muted)" border="none" />
                        </NumberInputStepper>
                      </NumberInput>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </Box>
          </MotionBox>

          {/* Pattern options */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            borderRadius="16px" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ORANGE}90, transparent)` }} />
            <Box px={5} pt={5} pb={3}>
              <SectionHeader icon={TagIcon} label="Pattern Options" color={ORANGE} />
              <ToggleRow label="Season Patterns"
                desc="CompanySpring2024!, CompanyWinter2025@"
                value={inclSeasons} onChange={setInclSeasons} />
              <ToggleRow label="Common Corporate Passwords"
                desc="Welcome1!, Password123!, Admin@123, P@ssw0rd1"
                value={inclCommon} onChange={setInclCommon} />
              <ToggleRow label="Keyword Cross-Mix"
                desc="Combine keywords — AdminIT2024!, HelpDeskLogin@"
                value={inclMix} onChange={setInclMix} />
              <ToggleRow label="Leet Speak Variants"
                desc="4cme, Acm3C0rp, Adm1n — increases list size"
                value={inclLeet} onChange={setInclLeet} />
            </Box>
            <Box px={5} pb={5} pt={3}>
              <Button w="full" size="md" borderRadius="10px" fontWeight="bold"
                bg={`${ACCENT}18`} border={`1px solid ${ACCENT}40`} color={ACCENT}
                _hover={{ bg: `${ACCENT}28`, borderColor: `${ACCENT}70`, transform: 'translateY(-1px)' }}
                _active={{ transform: 'translateY(0)' }}
                transition="all 0.15s"
                leftIcon={<ZapIcon w="15px" h="15px" />}
                onClick={generate}>
                Generate Wordlist
              </Button>
            </Box>
          </MotionBox>
        </Flex>

        {/* ── Right: Output ── */}
        <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          borderRadius="16px" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          pos="relative" overflow="hidden" display="flex" flexDirection="column">
          <Box pos="absolute" top={0} left={0} right={0} h="2px"
            style={{ background: `linear-gradient(to right, transparent, ${ACCENT}90, transparent)` }} />

          {/* Output header */}
          <Flex align="center" justify="space-between" px={5} pt={5} pb={3}>
            <Flex align="center" gap={2.5}>
              <Flex w="28px" h="28px" borderRadius="8px" bg={`${ACCENT}18`} border={`1px solid ${ACCENT}35`}
                align="center" justify="center" flexShrink={0}>
                <TerminalIcon w="13px" h="13px" color={ACCENT} />
              </Flex>
              <Box>
                <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">
                  Output
                </Text>
                <Text fontSize="10px" color="var(--dash-text-muted)">
                  {generated
                    ? `${wordlist.length.toLocaleString()} passwords · ${wordlist.length > 300 ? 'showing first 300' : 'all shown'}`
                    : 'Configure options and generate'}
                </Text>
              </Box>
            </Flex>
            {generated && (
              <HStack spacing={1}>
                <IconButton size="xs" icon={<CopyIcon boxSize={3} />} variant="ghost" borderRadius="7px"
                  color="var(--dash-text-muted)" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                  aria-label="Copy all" onClick={copyAll} />
                <IconButton size="xs" icon={<DownloadIcon boxSize={3} />} variant="ghost" borderRadius="7px"
                  color="var(--dash-text-muted)" _hover={{ color: ACCENT, bg: `${ACCENT}12` }}
                  aria-label="Download" onClick={download} />
              </HStack>
            )}
          </Flex>

          {/* Pattern badges (shown after generate) */}
          <AnimatePresence>
            {generated && (
              <MotionBox initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                px={5} pb={3}>
                <Wrap spacing={1.5}>
                  {[
                    { label: 'Base + year', always: true },
                    { label: 'Base + suffix', always: true },
                    { label: 'Short year', always: true },
                    { label: 'Common appends', always: true },
                    { label: 'Seasons', cond: inclSeasons },
                    { label: 'Corp passwords', cond: inclCommon },
                    { label: 'Keyword mix', cond: inclMix },
                    { label: 'Leet speak', cond: inclLeet },
                  ].filter((p) => p.always || p.cond).map((p) => (
                    <WrapItem key={p.label}>
                      <Badge fontSize="9px" px={2} py="2px" borderRadius="4px"
                        bg={`${ACCENT}15`} color={ACCENT} border={`1px solid ${ACCENT}30`}
                        textTransform="lowercase" letterSpacing="normal">
                        {p.label}
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              </MotionBox>
            )}
          </AnimatePresence>

          <Box px={5} pb={3} borderTop="1px solid rgba(255,255,255,0.05)" />

          {/* Word list */}
          <Box flex={1} px={5} pb={5}>
            {!generated ? (
              <Flex direction="column" align="center" justify="center" h="400px" gap={4}>
                <Flex w="56px" h="56px" borderRadius="16px" bg="rgba(255,255,255,0.04)"
                  border="1px solid rgba(255,255,255,0.08)" align="center" justify="center">
                  <KeyIcon w="24px" h="24px" color="var(--dash-text-muted)" />
                </Flex>
                <Box textAlign="center">
                  <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-secondary)" mb={1}>
                    No wordlist generated yet
                  </Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" maxW="240px" mx="auto" lineHeight={1.6}>
                    Fill in at least one target field and click Generate to build the list
                  </Text>
                </Box>
              </Flex>
            ) : (
              <Box
                borderRadius="10px"
                bg="rgba(0,0,0,0.25)"
                border="1px solid rgba(255,255,255,0.06)"
                p={3}
                overflowY="auto"
                maxH="580px"
                css={{
                  '&::-webkit-scrollbar': { width: '3px' },
                  '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '3px' },
                }}
              >
                {preview.map((w, i) => (
                  <Flex key={i} align="center" justify="space-between" px={2} py="3px"
                    borderRadius="5px" role="group"
                    _hover={{ bg: 'rgba(255,255,255,0.04)' }}
                    transition="background 0.1s">
                    <Flex align="center" gap={2.5}>
                      <Text fontSize="9px" fontFamily="mono" color="rgba(255,255,255,0.18)"
                        w="28px" textAlign="right" flexShrink={0} userSelect="none">
                        {i + 1}
                      </Text>
                      <Text fontSize="12px" fontFamily="mono" color="var(--dash-text-secondary)"
                        letterSpacing="0.3px">
                        {w}
                      </Text>
                    </Flex>
                    <IconButton
                      size="xs" icon={<CopyIcon boxSize={2.5} />} variant="ghost"
                      borderRadius="5px" aria-label="Copy"
                      color="transparent" _groupHover={{ color: 'var(--dash-text-muted)' }}
                      _hover={{ color: 'white', bg: 'rgba(255,255,255,0.08)' }}
                      onClick={() => navigator.clipboard.writeText(w)} />
                  </Flex>
                ))}
                {wordlist.length > 300 && (
                  <Flex align="center" justify="center" mt={3} gap={2}>
                    <Box flex={1} h="1px" bg="rgba(255,255,255,0.06)" />
                    <Text fontSize="10px" color="var(--dash-text-muted)" flexShrink={0}>
                      {(wordlist.length - 300).toLocaleString()} more — download to see all
                    </Text>
                    <Box flex={1} h="1px" bg="rgba(255,255,255,0.06)" />
                  </Flex>
                )}
              </Box>
            )}
          </Box>
        </MotionBox>

      </SimpleGrid>
    </Box>
  );
};

export default WordlistView;
