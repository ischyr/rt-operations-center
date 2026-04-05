import { useState, useCallback } from 'react';
import {
  Box, Flex, Text, Input, Button,
  IconButton, useToast,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import {
  RepeatIcon, CopyIcon, DownloadIcon, CheckIcon,
} from '@chakra-ui/icons';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT = '#63B3ED';
const GREEN  = '#68D391';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const PURPLE = '#9F7AEA';

// ── Label ─────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

// ── Input styles ──────────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '38px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT}50` },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

// ── Card wrapper ──────────────────────────────────────────────────────────────
const Card = ({ children, accentColor = ACCENT, ...rest }) => (
  <Box pos="relative" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="14px" overflow="hidden" {...rest}>
    <Box pos="absolute" top="0" left="0" right="0" h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)` }} />
    {children}
  </Box>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, delay = 0 }) => (
  <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay }}
    px={4} py={3} borderRadius="12px" bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Text fontSize="22px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
    <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{label}</Text>
  </MotionBox>
);

// ── Card brands ───────────────────────────────────────────────────────────────
const BRANDS = [
  { id: 'visa',       label: 'Visa',       prefix: '4',    len: 16, cardColor: '#1a1f71', accent: '#f7b600' },
  { id: 'mastercard', label: 'Mastercard', prefix: '5',    len: 16, cardColor: '#c0392b', accent: '#f79e1b' },
  { id: 'amex',       label: 'Amex',       prefix: '37',   len: 15, cardColor: '#006fcf', accent: '#ffffff' },
  { id: 'discover',   label: 'Discover',   prefix: '6011', len: 16, cardColor: '#e05c00', accent: '#ffffff' },
];

// ── Luhn algorithm ────────────────────────────────────────────────────────────
function randDigits(n) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
}

function luhnComplete(partial) {
  const digits = (partial + '0').split('').map(Number);
  let sum = 0;
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    let d = digits[len - 1 - i];
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  const check = (10 - (sum % 10)) % 10;
  return partial + check;
}

function generateNumber(brand) {
  const fill = randDigits(brand.len - brand.prefix.length - 1);
  return luhnComplete(brand.prefix + fill);
}

function formatNumber(num, len) {
  if (len === 15) return `${num.slice(0, 4)} ${num.slice(4, 10)} ${num.slice(10)}`;
  return num.match(/.{1,4}/g)?.join(' ') || num;
}

function randomExpiry() {
  const m = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const y = String(new Date().getFullYear() + 1 + Math.floor(Math.random() * 4)).slice(-2);
  return `${m}/${y}`;
}

function randomCVV(brand) {
  return randDigits(brand.id === 'amex' ? 4 : 3);
}

// ── Credit card visual — front ────────────────────────────────────────────────
const CardFront = ({ brand, number, name, expiry, bankName }) => (
  <Box
    w="360px" h="210px" borderRadius="16px" pos="relative" overflow="hidden"
    bg={`linear-gradient(135deg, ${brand.cardColor}ee 0%, ${brand.cardColor}88 60%, #0d0d12 100%)`}
    border="1px solid rgba(255,255,255,0.1)"
    boxShadow="0 20px 50px rgba(0,0,0,0.7)"
    flexShrink={0}
  >
    {/* Sheen */}
    <Box pos="absolute" top={0} left={0} right={0} h="50%"
      bg="linear-gradient(180deg,rgba(255,255,255,0.1) 0%,transparent 100%)"
      borderRadius="16px 16px 0 0" pointerEvents="none" />
    {/* Decorative circles */}
    <Box pos="absolute" top="-30px" right="-30px" w="140px" h="140px"
      borderRadius="full" bg="rgba(255,255,255,0.04)" pointerEvents="none" />
    <Box pos="absolute" bottom="-50px" right="-10px" w="180px" h="180px"
      borderRadius="full" bg="rgba(255,255,255,0.03)" pointerEvents="none" />

    {/* Bank + brand */}
    <Flex align="center" justify="space-between" px={5} pt={4}>
      <Text fontSize="11px" fontWeight="bold" color="rgba(255,255,255,0.85)" letterSpacing="wider">
        {bankName || 'BANK NAME'}
      </Text>
      {brand.id === 'visa' && (
        <Text fontSize="20px" fontWeight="black" fontStyle="italic" color={brand.accent} fontFamily="serif">VISA</Text>
      )}
      {brand.id === 'mastercard' && (
        <Flex align="center">
          <Box w="22px" h="22px" borderRadius="full" bg="#eb001b" opacity={0.9} />
          <Box w="22px" h="22px" borderRadius="full" bg="#f79e1b" opacity={0.9} ml="-10px" />
        </Flex>
      )}
      {brand.id === 'amex' && (
        <Text fontSize="9px" fontWeight="black" letterSpacing="widest" color={brand.accent}>AMERICAN EXPRESS</Text>
      )}
      {brand.id === 'discover' && (
        <Text fontSize="11px" fontWeight="black" color={brand.accent} letterSpacing="wider">DISCOVER</Text>
      )}
    </Flex>

    {/* Chip */}
    <Flex align="center" gap={3} px={5} mt={3}>
      <Box w="38px" h="28px" borderRadius="4px" pos="relative" overflow="hidden"
        bg="linear-gradient(135deg,#d4af37 0%,#f5e17c 40%,#c9a227 60%,#e8cc6e 100%)"
        border="1px solid rgba(0,0,0,0.2)">
        <Box pos="absolute" top="50%" left={0} right={0} h="1px" bg="rgba(0,0,0,0.15)" transform="translateY(-50%)" />
        <Box pos="absolute" left="50%" top={0} bottom={0} w="1px" bg="rgba(0,0,0,0.15)" transform="translateX(-50%)" />
        <Box pos="absolute" top="25%" left="25%" right="25%" bottom="25%"
          borderRadius="2px" border="1px solid rgba(0,0,0,0.15)" />
      </Box>
      {/* Contactless */}
      <Box opacity={0.55}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5c0-3.59 2.91-6.5 6.5-6.5S18 8.91 18 12.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          <path d="M7.5 12.5c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          <circle cx="11.5" cy="12.5" r="1.5" fill="white"/>
        </svg>
      </Box>
    </Flex>

    {/* Number */}
    <Text px={5} mt={2} fontSize="16px" fontFamily="'Courier New',monospace"
      fontWeight="bold" color="white" letterSpacing="0.15em">
      {formatNumber(number, brand.len)}
    </Text>

    {/* Name + expiry */}
    <Flex align="flex-end" justify="space-between" px={5} mt={3}>
      <Box>
        <Text fontSize="7px" color="rgba(255,255,255,0.45)" letterSpacing="widest" mb="2px">CARD HOLDER</Text>
        <Text fontSize="11px" fontWeight="bold" color="white" letterSpacing="wider" textTransform="uppercase">
          {name || 'CARDHOLDER NAME'}
        </Text>
      </Box>
      <Box textAlign="right">
        <Text fontSize="7px" color="rgba(255,255,255,0.45)" letterSpacing="widest" mb="2px">EXPIRES</Text>
        <Text fontSize="11px" fontWeight="bold" color="white" fontFamily="mono">{expiry}</Text>
      </Box>
    </Flex>
  </Box>
);

// ── Credit card visual — back ─────────────────────────────────────────────────
const CardBack = ({ brand, cvv }) => (
  <Box
    w="360px" h="210px" borderRadius="16px" pos="relative" overflow="hidden"
    bg={`linear-gradient(135deg, #111 0%, ${brand.cardColor}66 100%)`}
    border="1px solid rgba(255,255,255,0.1)"
    boxShadow="0 20px 50px rgba(0,0,0,0.7)"
    flexShrink={0}
  >
    {/* Magnetic strip */}
    <Box mt={6} w="100%" h="40px" bg="#111" />

    {/* Signature + CVV */}
    <Flex align="center" px={5} mt={4} gap={3}>
      <Box flex="1" h="32px" borderRadius="4px"
        bg="repeating-linear-gradient(90deg,rgba(255,255,255,0.05) 0px,rgba(255,255,255,0.05) 6px,rgba(255,255,255,0.02) 6px,rgba(255,255,255,0.02) 12px)"
        border="1px solid rgba(255,255,255,0.07)" pos="relative">
        <Text pos="absolute" bottom="3px" left="6px" fontSize="8px" fontStyle="italic" color="rgba(255,255,255,0.25)">
          Authorized Signature
        </Text>
      </Box>
      <Box w="48px" h="32px" borderRadius="4px" bg="rgba(255,255,255,0.93)"
        border="1px solid rgba(0,0,0,0.15)" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="13px" fontFamily="mono" fontWeight="bold" color="#111" letterSpacing="widest">{cvv}</Text>
      </Box>
    </Flex>
    <Text px={5} mt="3px" fontSize="8px" color="rgba(255,255,255,0.25)" textAlign="right" pr="22px">CVV</Text>

    {/* Brand mark */}
    <Flex align="center" justify="flex-end" px={5} mt={4} opacity={0.35}>
      {brand.id === 'visa' && <Text fontSize="16px" fontWeight="black" fontStyle="italic" color={brand.accent} fontFamily="serif">VISA</Text>}
      {brand.id === 'mastercard' && <Flex align="center"><Box w="20px" h="20px" borderRadius="full" bg="#eb001b" /><Box w="20px" h="20px" borderRadius="full" bg="#f79e1b" ml="-9px" /></Flex>}
      {brand.id === 'amex' && <Text fontSize="8px" fontWeight="black" letterSpacing="widest" color={brand.accent}>AMERICAN EXPRESS</Text>}
      {brand.id === 'discover' && <Text fontSize="10px" fontWeight="black" color={brand.accent} letterSpacing="wider">DISCOVER</Text>}
    </Flex>
  </Box>
);

// ── Copy row ──────────────────────────────────────────────────────────────────
const CopyRow = ({ label, value, toast }) => {
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast({ title: `${label} copied`, status: 'success', duration: 1500, isClosable: true });
  };
  return (
    <Flex align="center" justify="space-between"
      bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
      borderRadius="8px" px={3} py={2} gap={2}>
      <Box>
        <Text fontSize="9px" color="var(--dash-text-muted)" letterSpacing="widest" textTransform="uppercase">{label}</Text>
        <Text fontSize="12px" fontFamily="mono" color="white" letterSpacing="wider" mt="1px">{value || '—'}</Text>
      </Box>
      <IconButton icon={<CopyIcon />} size="xs" variant="ghost"
        color="var(--dash-text-muted)" _hover={{ color: 'white' }}
        onClick={copy} aria-label={`Copy ${label}`} />
    </Flex>
  );
};

// ── Main View ─────────────────────────────────────────────────────────────────
const CardGenerationView = () => {
  const toast = useToast();

  const [brandId,  setBrandId]  = useState('visa');
  const [name,     setName]     = useState('JOHN DOE');
  const [bankName, setBankName] = useState('FIRST NATIONAL BANK');
  const [number,   setNumber]   = useState(() => generateNumber(BRANDS[0]));
  const [expiry,   setExpiry]   = useState(() => randomExpiry());
  const [cvv,      setCvv]      = useState(() => randomCVV(BRANDS[0]));
  const [showBack, setShowBack] = useState(false);

  const brand = BRANDS.find(b => b.id === brandId) || BRANDS[0];

  const regenerate = useCallback(() => {
    setNumber(generateNumber(brand));
    setExpiry(randomExpiry());
    setCvv(randomCVV(brand));
    toast({ title: 'New card generated', status: 'info', duration: 1200, isClosable: true });
  }, [brand, toast]);

  const switchBrand = (b) => {
    setBrandId(b.id);
    setNumber(generateNumber(b));
    setExpiry(randomExpiry());
    setCvv(randomCVV(b));
  };

  const exportJSON = () => {
    const data = { brand: brand.label, bank: bankName, cardholder: name, number, expiry, cvv, generated: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `card-${brand.id}-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} px={6} pb={12} pt={5}>

      {/* ── Header ── */}
      <Flex align="flex-start" justify="space-between" mb={5}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Card <Text as="span" color="red.400">Generation</Text>
          </Text>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Generate Luhn-valid payment card data · customize name &amp; bank · export for red team ops
          </Text>
        </Box>
        <Button size="sm" leftIcon={<DownloadIcon />} onClick={exportJSON}
          bg="transparent" border={`1px solid ${ACCENT}60`} color={ACCENT}
          _hover={{ bg: `${ACCENT}15`, borderColor: ACCENT }}
          borderRadius="10px" fontSize="12px">
          Export JSON
        </Button>
      </Flex>

      {/* ── Info banner ── */}
      <Box mb={5} px={4} py={3} borderRadius="10px"
        bg={`rgba(99,179,237,0.07)`} border="1px solid rgba(99,179,237,0.25)">
        <Flex align="center" gap={2} mb={2}>
          <InfoIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            Card Generation
          </Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {[
            'Visa · Mastercard · Amex · Discover — all pass Luhn checksum validation',
            'Customize cardholder name and bank name — generate new numbers instantly',
            'For authorized red team simulations and security awareness training only',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Stat row ── */}
      <Flex gap={3} mb={6} flexWrap="wrap">
        <StatCard label="Brand"      value={brand.label}                         color={ACCENT}  delay={0}    />
        <StatCard label="Digits"     value={brand.len}                           color={GREEN}   delay={0.04} />
        <StatCard label="CVV Length" value={brand.id === 'amex' ? '4' : '3'}    color={ORANGE}  delay={0.08} />
        <StatCard label="Luhn Valid" value="✓ Yes"                               color={GREEN}   delay={0.12} />
      </Flex>

      {/* ── Main body ── */}
      <Flex gap={5} flexWrap="wrap" align="flex-start">

        {/* ── Left column: controls ── */}
        <Flex direction="column" gap={5} flex="1" minW="300px">

          {/* Brand selector */}
          <Card accentColor={ACCENT} px={5} pt={5} pb={5}>
            <Label>Card Brand</Label>
            <Flex gap={2} flexWrap="wrap" mt={2}>
              {BRANDS.map(b => (
                <Box key={b.id}
                  px={4} py={2} borderRadius="8px" cursor="pointer"
                  border="1px solid"
                  borderColor={brandId === b.id ? ACCENT : 'rgba(255,255,255,0.1)'}
                  bg={brandId === b.id ? `${ACCENT}15` : 'rgba(255,255,255,0.03)'}
                  color={brandId === b.id ? ACCENT : 'var(--dash-text-secondary)'}
                  fontSize="12px" fontWeight="bold"
                  transition="all 0.15s"
                  _hover={{ borderColor: `${ACCENT}60`, color: ACCENT }}
                  onClick={() => switchBrand(b)}>
                  {b.label}
                </Box>
              ))}
            </Flex>
          </Card>

          {/* Editable fields */}
          <Card accentColor={PURPLE} px={5} pt={5} pb={5}>
            <Label>Card Details</Label>
            <Flex direction="column" gap={4} mt={3}>
              <Box>
                <Label>Cardholder Name</Label>
                <Input {...inputSx}
                  value={name}
                  onChange={e => setName(e.target.value.toUpperCase())}
                  placeholder="JOHN DOE"
                />
              </Box>
              <Box>
                <Label>Bank Name</Label>
                <Input {...inputSx}
                  value={bankName}
                  onChange={e => setBankName(e.target.value.toUpperCase())}
                  placeholder="FIRST NATIONAL BANK"
                />
              </Box>
            </Flex>
          </Card>

          {/* Generated values */}
          <Card accentColor={GREEN} px={5} pt={5} pb={5}>
            <Flex align="center" justify="space-between" mb={3}>
              <Label>Generated Values</Label>
              <Button size="xs" leftIcon={<RepeatIcon />} variant="ghost"
                color="var(--dash-text-muted)" _hover={{ color: GREEN }}
                onClick={regenerate} fontSize="11px">
                Regenerate
              </Button>
            </Flex>
            <Flex direction="column" gap={2}>
              <CopyRow label="Card Number" value={formatNumber(number, brand.len)} toast={toast} />
              <Flex gap={2}>
                <Box flex="1"><CopyRow label="Expiry" value={expiry} toast={toast} /></Box>
                <Box flex="1"><CopyRow label="CVV / CVC" value={cvv} toast={toast} /></Box>
              </Flex>
              <CopyRow label="Cardholder" value={name} toast={toast} />
              <CopyRow label="Bank" value={bankName} toast={toast} />
            </Flex>
          </Card>
        </Flex>

        {/* ── Right column: card preview ── */}
        <Flex direction="column" gap={5} flex="1" minW="300px">
          <Card accentColor={ORANGE} px={5} pt={5} pb={6}>
            <Flex align="center" justify="space-between" mb={5}>
              <Label>Card Preview</Label>
              {/* Front / Back toggle */}
              <Flex bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                borderRadius="8px" overflow="hidden">
                {['Front', 'Back'].map(side => {
                  const active = (side === 'Back') === showBack;
                  return (
                    <Box key={side}
                      px={3} py={1.5} cursor="pointer" fontSize="11px" fontWeight="bold"
                      bg={active ? 'rgba(255,255,255,0.1)' : 'transparent'}
                      color={active ? 'white' : 'var(--dash-text-muted)'}
                      transition="all 0.15s"
                      onClick={() => setShowBack(side === 'Back')}>
                      {side}
                    </Box>
                  );
                })}
              </Flex>
            </Flex>

            <Flex justify="center">
              <MotionBox key={`${brandId}-${showBack ? 'back' : 'front'}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                w="100%" display="flex" justifyContent="center">
                {showBack
                  ? <CardBack brand={brand} cvv={cvv} />
                  : <CardFront brand={brand} number={number} name={name} expiry={expiry} bankName={bankName} />
                }
              </MotionBox>
            </Flex>

            <Text textAlign="center" mt={4} fontSize="10px" color="var(--dash-text-muted)">
              Toggle Front / Back to inspect both sides of the card
            </Text>
          </Card>

          {/* OPSEC note */}
          <Card accentColor={RED} px={5} pt={4} pb={4}>
            <Flex align="center" gap={2} mb={2}>
              <Box w="6px" h="6px" borderRadius="full" bg={RED} boxShadow={`0 0 6px ${RED}`} />
              <Text fontSize="10px" fontWeight="bold" letterSpacing="widest" color={RED} textTransform="uppercase">
                Usage Notice
              </Text>
            </Flex>
            <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="1.7">
              Generated numbers pass Luhn validation but are <Text as="span" color="white" fontWeight="bold">not real payment credentials</Text>.
              Use exclusively for authorized red team awareness campaigns, social engineering simulations,
              and security awareness training.
            </Text>
          </Card>
        </Flex>
      </Flex>
    </MotionBox>
  );
};

export default CardGenerationView;
