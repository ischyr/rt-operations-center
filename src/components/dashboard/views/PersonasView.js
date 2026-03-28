import { useState, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Textarea,
  Select, SimpleGrid, Modal, ModalOverlay, ModalContent, ModalBody, Tooltip, Spinner,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, CloseIcon, RepeatIcon, EditIcon, CopyIcon,
  CheckIcon, SearchIcon, EmailIcon, ExternalLinkIcon, ViewIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

const MotionBox = motion(Box);

// ── Colors ───────────────────────────────────────────────────────────────────
const ACCENT = '#9F7AEA';
const RED    = '#FC8181';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const ORANGE = '#F6AD55';
const CYAN   = '#76E4F7';
const PINK   = '#F687B3';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const UserIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Box>
);

const BriefcaseIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </Box>
);

const MapPinIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Box>
);

const PhoneIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </Box>
);

const HeartIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Box>
);

const ShuffleIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </Box>
);

const GlobeIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Box>
);

const KeyIcon = (props) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
// Generator data
// ─────────────────────────────────────────────────────────────────────────────
const MALE = ['James','John','Robert','Michael','William','David','Richard','Joseph',
  'Thomas','Charles','Christopher','Daniel','Matthew','Anthony','Mark','Donald',
  'Steven','Paul','Andrew','Joshua','Kenneth','Kevin','Brian','George','Timothy',
  'Ryan','Jacob','Nathan','Ethan','Alexander','Patrick','Jack','Aaron','Adam',
  'Dylan','Tyler','Brandon','Zachary','Austin','Logan'];

const FEMALE = ['Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth','Susan',
  'Jessica','Sarah','Karen','Lisa','Nancy','Betty','Margaret','Sandra','Ashley',
  'Emily','Donna','Michelle','Amanda','Melissa','Rebecca','Laura','Cynthia',
  'Amy','Angela','Anna','Brenda','Nicole','Samantha','Katherine','Rachel',
  'Megan','Hannah','Emma','Isabella','Sophia','Olivia','Ava','Charlotte'];

const LAST = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis',
  'Rodriguez','Martinez','Hernandez','Wilson','Anderson','Thomas','Taylor','Moore',
  'Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark',
  'Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres',
  'Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell',
  'Mitchell','Carter','Roberts','Gomez','Phillips','Evans','Turner'];

const OCCUPATIONS = ['Software Engineer','Security Analyst','Network Administrator',
  'Penetration Tester','Graphic Designer','Marketing Manager','Financial Analyst',
  'Project Manager','Sales Representative','Human Resources Manager','Data Scientist',
  'Systems Administrator','Web Developer','Business Analyst','Operations Manager',
  'Accountant','Consultant','Product Manager','UX Designer','DevOps Engineer',
  'Journalist','Teacher','Lawyer','Doctor','Nurse','Architect','Pharmacist',
  'Electrician','Mechanical Engineer','Civil Engineer'];

const COMPANIES = ['Apex Solutions','Horizon Tech','NextWave Systems','BluePeak Corp',
  'Vertex Analytics','CloudBridge Inc','DataForge LLC','IronCore Networks',
  'Pinnacle Group','Stellar Dynamics','Quantum Edge','NovaBit Technologies',
  'CorePath Systems','Axiom Digital','Redline Security','TrueNorth Consulting',
  'Cascade Software','Meridian Labs','Vantage Point Inc','Stormgate Corp'];

const EMAIL_DOMAINS = ['gmail.com','yahoo.com','hotmail.com','outlook.com',
  'protonmail.com','icloud.com','mail.com'];

const WEBSITES = ['wordpress.com','wix.com','squarespace.com','medium.com',
  'substack.com','blogspot.com','tumblr.com'];

const EYE_COLORS  = ['Brown','Blue','Green','Hazel','Gray','Amber'];
const HAIR_COLORS = ['Brown','Black','Blonde','Auburn','Red','Gray','Dark Brown'];
const BLOOD_TYPES = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];

const NATIONALITY_DATA = {
  American: {
    country: 'United States', flag: 'US',
    cities: ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia',
             'San Antonio','San Diego','Dallas','Austin','Jacksonville','Fort Worth'],
    states: ['NY','CA','IL','TX','AZ','PA','FL','OH','GA','NC','MI','WA'],
    zip:   () => String(Math.floor(10000 + Math.random() * 89999)),
    phone: () => `+1 (${ri(200,999)}) ${ri(100,999)}-${ri(1000,9999)}`,
    streets: ['Oak','Maple','Cedar','Pine','Elm','Washington','Lincoln','Park','Lake','River'],
    streetTypes: ['Ave','St','Blvd','Dr','Ln','Rd','Way','Ct'],
  },
  British: {
    country: 'United Kingdom', flag: 'GB',
    cities: ['London','Manchester','Birmingham','Leeds','Glasgow','Liverpool',
             'Edinburgh','Bristol','Sheffield','Nottingham','Cardiff','Belfast'],
    states: ['England','Scotland','Wales','N. Ireland'],
    zip:   () => `${rc('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}${rc('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}${ri(1,9)} ${ri(1,9)}${rc('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}${rc('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}`,
    phone: () => `+44 ${ri(1000,9999)} ${ri(100000,999999)}`,
    streets: ['High','Church','Victoria','Park','Station','London','King','Queen','Mill'],
    streetTypes: ['Street','Road','Lane','Avenue','Way','Close','Drive','Place'],
  },
  German: {
    country: 'Germany', flag: 'DE',
    cities: ['Berlin','Hamburg','Munich','Cologne','Frankfurt','Stuttgart',
             'Düsseldorf','Leipzig','Dortmund','Essen','Bremen','Dresden'],
    states: ['Bavaria','North Rhine-Westphalia','Baden-Württemberg','Lower Saxony'],
    zip:   () => String(ri(10000,99999)),
    phone: () => `+49 ${ri(100,999)} ${ri(1000000,9999999)}`,
    streets: ['Haupt','Bahnhof','Schul','Kirch','Garten','Wiesen','Wald','Berg'],
    streetTypes: ['straße','weg','gasse','platz','allee'],
  },
  French: {
    country: 'France', flag: 'FR',
    cities: ['Paris','Marseille','Lyon','Toulouse','Nice','Nantes',
             'Montpellier','Strasbourg','Bordeaux','Lille','Rennes','Grenoble'],
    states: ['Île-de-France','Provence','Normandy','Brittany','Alsace'],
    zip:   () => String(ri(10000,95999)),
    phone: () => `+33 ${ri(1,9)} ${ri(10,99)} ${ri(10,99)} ${ri(10,99)} ${ri(10,99)}`,
    streets: ['Rue de la','Avenue de','Boulevard de','Chemin du','Allée des'],
    streetTypes: ['Paix','Liberté','République','Victoire','Fleurs','Roses'],
  },
  Italian: {
    country: 'Italy', flag: 'IT',
    cities: ['Rome','Milan','Naples','Turin','Palermo','Genoa',
             'Bologna','Florence','Bari','Catania','Venice','Verona'],
    states: ['Lazio','Lombardy','Campania','Veneto','Sicily','Tuscany'],
    zip:   () => String(ri(10000,99999)),
    phone: () => `+39 ${ri(30,39)}${ri(1000000,9999999)}`,
    streets: ['Via','Viale','Corso','Piazza','Vicolo'],
    streetTypes: ['Roma','Garibaldi','Mazzini','Verdi','Dante','Italia'],
  },
  Canadian: {
    country: 'Canada', flag: 'CA',
    cities: ['Toronto','Montreal','Vancouver','Calgary','Edmonton',
             'Ottawa','Winnipeg','Quebec City','Hamilton','Kitchener'],
    states: ['Ontario','Quebec','British Columbia','Alberta','Manitoba'],
    zip:   () => `${rc('ABCEGHJKLMNPRSTVXY')}${ri(1,9)}${rc('ABCEGHJKLMNPRSTVWXYZ')} ${ri(1,9)}${rc('ABCEGHJKLMNPRSTVWXYZ')}${ri(1,9)}`,
    phone: () => `+1 (${ri(200,999)}) ${ri(100,999)}-${ri(1000,9999)}`,
    streets: ['Maple','Pine','Cedar','Oak','Birch','Queen','King','Main','Centre'],
    streetTypes: ['Ave','St','Blvd','Dr','Cres','Rd'],
  },
  Romanian: {
    country: 'Romania', flag: 'RO',
    cities: ['București','Cluj-Napoca','Timișoara','Iași','Constanța',
             'Craiova','Brașov','Galați','Ploiești','Oradea','Sibiu','Bacău'],
    states: ['Muntenia','Transilvania','Moldova','Dobrogea','Oltenia','Banat','Crișana'],
    zip:   () => String(ri(10000, 999999)).padStart(6, '0'),
    phone: () => `+40 7${ri(10,99)} ${ri(100,999)} ${ri(100,999)}`,
    streets: ['Calea','Strada','Bulevardul','Aleea','Intrarea'],
    streetTypes: ['Victoriei','Unirii','Libertății','Independenței','Florilor','Trandafirilor','Mihai Eminescu','Avram Iancu'],
    male:   ['Alexandru','Andrei','Bogdan','Călin','Cristian','Dan','Emil','Florin',
             'Gabriel','Gheorghe','Ioan','Ionuț','Liviu','Lucian','Marian','Mihai',
             'Mircea','Nicolae','Octavian','Paul','Radu','Silviu','Stefan','Tudor','Vlad'],
    female: ['Adelina','Alexandra','Alina','Ana','Andreea','Bianca','Camelia','Carmen',
             'Cătălina','Cristina','Diana','Elena','Gabriela','Ioana','Larisa','Laura',
             'Luminița','Maria','Mihaela','Monica','Nicoleta','Oana','Raluca','Simona','Teodora'],
    last:   ['Pop','Popa','Ionescu','Constantin','Gheorghe','Stoica','Stan','Matei',
             'Popescu','Dumitrescu','Dima','Marin','Preda','Radu','Oprea','Niculescu',
             'Manea','Barbu','Diaconu','Badea','Florea','Tudor','Nica','Lazar','Iordache'],
  },
};

const NATIONALITIES = Object.keys(NATIONALITY_DATA);

// ── Helpers ──────────────────────────────────────────────────────────────────
const ri = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rc = (s) => s[Math.floor(Math.random() * s.length)];
const rp = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateUsername = (first, last) => {
  const f = first.toLowerCase(), l = last.toLowerCase();
  const patterns = [
    `${f}${l}`, `${f}.${l}`, `${f}${l}${ri(1,99)}`,
    `${f.slice(0,1)}${l}`, `${l}${f.slice(0,1)}${ri(10,99)}`,
    `${f}_${l}`, `${f}${ri(100,999)}`,
  ];
  return rp(patterns).replace(/[^a-z0-9._]/g, '');
};

const generatePassword = () => {
  const words  = ['Shadow','Ghost','Phantom','Cipher','Delta','Alpha','Nexus','Vortex'];
  const syms   = ['!','@','#','$','*'];
  return `${rp(words)}${ri(10,99)}${rp(syms)}`;
};

const generatePersona = (gender, nationality) => {
  const g  = gender      || (Math.random() > 0.5 ? 'Male' : 'Female');
  const n  = nationality || rp(NATIONALITIES);
  const nd = NATIONALITY_DATA[n];

  const firstName = g === 'Male' ? rp(nd.male || MALE) : rp(nd.female || FEMALE);
  const lastName  = rp(nd.last || LAST);
  const username  = generateUsername(firstName, lastName);
  const domain    = rp(EMAIL_DOMAINS);
  const email     = `${username}@${domain}`;

  const ageVal   = ri(22, 55);
  const now      = new Date();
  const birthY   = now.getFullYear() - ageVal;
  const birthM   = String(ri(1, 12)).padStart(2, '0');
  const birthD   = String(ri(1, 28)).padStart(2, '0');
  const birthday = `${birthD}/${birthM}/${birthY}`;

  const city    = rp(nd.cities);
  const state   = rp(nd.states);
  const street  = rp(nd.streets);
  const sType   = rp(nd.streetTypes);
  const address = `${ri(1, 999)} ${street} ${sType}`;

  return {
    id:          Date.now().toString() + Math.random().toString(36).slice(2),
    fullName:    `${firstName} ${lastName}`,
    gender:      g,
    birthday,
    age:         ageVal,
    nationality: n,
    email,
    username,
    password:    generatePassword(),
    phone:       nd.phone(),
    address,
    city,
    state,
    zipCode:     nd.zip(),
    country:     nd.country,
    height:      `${ri(155, 195)} cm`,
    weight:      `${ri(50, 100)} kg`,
    eyeColor:    rp(EYE_COLORS),
    hairColor:   rp(HAIR_COLORS),
    bloodType:   rp(BLOOD_TYPES),
    occupation:  rp(OCCUPATIONS),
    company:     rp(COMPANIES),
    website:     `${username}.${rp(WEBSITES)}`,
    notes:       '',
    createdBy:         '',
    createdByCallsign: '',
  };
};

// ── Input styles ─────────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT}50` },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

const selSx = {
  bg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px', h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  cursor: 'pointer', focusBorderColor: `${ACCENT}80`,
  _hover: { borderColor: `${ACCENT}50` },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

// ── Shared atoms ─────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

// ── Avatar circle ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  [ACCENT, `${ACCENT}35`, `${ACCENT}15`],
  [BLUE,   `${BLUE}35`,   `${BLUE}15`],
  [GREEN,  `${GREEN}35`,  `${GREEN}15`],
  [ORANGE, `${ORANGE}35`, `${ORANGE}15`],
  [CYAN,   `${CYAN}35`,   `${CYAN}15`],
  [PINK,   `${PINK}35`,   `${PINK}15`],
];
const avatarMeta = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const AvatarCircle = ({ name, size = '52px', fontSize = '16px' }) => {
  const [color, border, bg] = avatarMeta(name);
  const initials = (name || '??').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <Flex w={size} h={size} borderRadius="full" align="center" justify="center"
      flexShrink={0} bg={bg} border={`2px solid ${border}`}
      fontSize={fontSize} fontWeight="bold" color={color} fontFamily="mono">
      {initials}
    </Flex>
  );
};

// ── Section header ───────────────────────────────────────────────────────────
const SectionHead = ({ children, color = ACCENT, icon: Icon }) => (
  <Flex align="center" gap={2} mb={3}>
    {Icon ? (
      <Flex w="24px" h="24px" borderRadius="6px" bg={`${color}12`}
        border={`1px solid ${color}30`} align="center" justify="center" flexShrink={0}>
        <Icon boxSize="11px" color={color} />
      </Flex>
    ) : (
      <Box w="3px" h="12px" borderRadius="full" bg={color} />
    )}
    <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-primary)"
      textTransform="uppercase" letterSpacing="wider">{children}</Text>
  </Flex>
);

// ── Field row ────────────────────────────────────────────────────────────────
const FieldRow = ({ label, value, mono, color }) => (
  <Box>
    <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
      letterSpacing="wider" fontWeight="bold" mb={0.5}>{label}</Text>
    <Text fontSize="12px" color={mono ? (color || ACCENT) : 'var(--dash-text-primary)'}
      fontFamily={mono ? "'Fira Code', 'Cascadia Code', monospace" : 'inherit'}
      wordBreak="break-all" fontWeight={mono ? '600' : 'normal'}>
      {value || '—'}
    </Text>
  </Box>
);

// ── Persona detail panel ─────────────────────────────────────────────────────
const PersonaDetail = ({ persona }) => {
  const nd = NATIONALITY_DATA[persona.nationality];
  const [color] = avatarMeta(persona.fullName);

  return (
    <Box>
      {/* Identity header */}
      <Flex align="center" gap={4} mb={5} p={4} borderRadius="12px"
        bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)">
        <AvatarCircle name={persona.fullName} size="60px" fontSize="18px" />
        <Box flex="1" minW={0}>
          <Text fontSize="18px" fontWeight="bold" color="var(--dash-text-primary)">{persona.fullName}</Text>
          <Text fontSize="12px" color={ACCENT} fontFamily="mono" fontWeight="600">@{persona.username}</Text>
          <Flex gap={2} mt={1.5} flexWrap="wrap">
            {[
              persona.gender,
              `${nd?.flag || ''} ${persona.nationality}`,
              `Age ${persona.age}`,
            ].map((tag, i) => (
              <Box key={i} px={2} py="2px" borderRadius="5px" fontSize="9px" fontWeight="bold"
                bg={`${color}10`} color={color} border={`1px solid ${color}25`}
                letterSpacing="wider" textTransform="uppercase">{tag}</Box>
            ))}
          </Flex>
        </Box>
      </Flex>

      <SimpleGrid columns={2} spacing={4}>
        {/* Identity */}
        <Box p={3.5} borderRadius="12px" bg="rgba(255,255,255,0.02)"
          border="1px solid rgba(255,255,255,0.05)" pos="relative" overflow="hidden">
          <Box pos="absolute" top={0} left={0} right={0} h="1.5px"
            style={{ background: `linear-gradient(to right, transparent, ${ACCENT}60, transparent)` }} />
          <SectionHead color={ACCENT} icon={UserIcon}>Identity</SectionHead>
          <Flex direction="column" gap={3}>
            <FieldRow label="Full Name"  value={persona.fullName} />
            <FieldRow label="Birthday"   value={persona.birthday} />
            <FieldRow label="Blood Type" value={persona.bloodType} />
          </Flex>
        </Box>

        {/* Contact */}
        <Box p={3.5} borderRadius="12px" bg="rgba(255,255,255,0.02)"
          border="1px solid rgba(255,255,255,0.05)" pos="relative" overflow="hidden">
          <Box pos="absolute" top={0} left={0} right={0} h="1.5px"
            style={{ background: `linear-gradient(to right, transparent, ${CYAN}60, transparent)` }} />
          <SectionHead color={CYAN} icon={PhoneIcon}>Contact</SectionHead>
          <Flex direction="column" gap={3}>
            <FieldRow label="Phone"   value={persona.phone} />
            <FieldRow label="Address" value={persona.address} />
            <FieldRow label="City"    value={`${persona.city}${persona.state ? ', ' + persona.state : ''} ${persona.zipCode}`} />
          </Flex>
        </Box>

        {/* Online */}
        <Box p={3.5} borderRadius="12px" bg="rgba(255,255,255,0.02)"
          border="1px solid rgba(255,255,255,0.05)" pos="relative" overflow="hidden">
          <Box pos="absolute" top={0} left={0} right={0} h="1.5px"
            style={{ background: `linear-gradient(to right, transparent, ${BLUE}60, transparent)` }} />
          <SectionHead color={BLUE} icon={KeyIcon}>Online</SectionHead>
          <Flex direction="column" gap={3}>
            <FieldRow label="Email"    value={persona.email} mono color={BLUE} />
            <FieldRow label="Username" value={persona.username} mono color={BLUE} />
            <FieldRow label="Password" value={persona.password} mono color={BLUE} />
            <FieldRow label="Website"  value={persona.website} mono color={BLUE} />
          </Flex>
        </Box>

        {/* Physical */}
        <Box p={3.5} borderRadius="12px" bg="rgba(255,255,255,0.02)"
          border="1px solid rgba(255,255,255,0.05)" pos="relative" overflow="hidden">
          <Box pos="absolute" top={0} left={0} right={0} h="1.5px"
            style={{ background: `linear-gradient(to right, transparent, ${ORANGE}60, transparent)` }} />
          <SectionHead color={ORANGE} icon={HeartIcon}>Physical</SectionHead>
          <Flex direction="column" gap={3}>
            <FieldRow label="Height"     value={persona.height} />
            <FieldRow label="Weight"     value={persona.weight} />
            <FieldRow label="Eye Color"  value={persona.eyeColor} />
            <FieldRow label="Hair Color" value={persona.hairColor} />
          </Flex>
        </Box>

        {/* Employment */}
        <Box p={3.5} borderRadius="12px" bg="rgba(255,255,255,0.02)"
          border="1px solid rgba(255,255,255,0.05)" gridColumn="span 2"
          pos="relative" overflow="hidden">
          <Box pos="absolute" top={0} left={0} right={0} h="1.5px"
            style={{ background: `linear-gradient(to right, transparent, ${GREEN}60, transparent)` }} />
          <SectionHead color={GREEN} icon={BriefcaseIcon}>Employment</SectionHead>
          <SimpleGrid columns={2} spacing={3}>
            <FieldRow label="Occupation" value={persona.occupation} />
            <FieldRow label="Company"    value={persona.company} />
          </SimpleGrid>
        </Box>

        {/* Notes */}
        {persona.notes && (
          <Box p={3.5} borderRadius="12px" bg="rgba(255,255,255,0.02)"
            border="1px solid rgba(255,255,255,0.05)" gridColumn="span 2"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="1.5px"
              style={{ background: `linear-gradient(to right, transparent, ${PINK}60, transparent)` }} />
            <SectionHead color={PINK}>Notes</SectionHead>
            <Text fontSize="12px" color="var(--dash-text-secondary)" lineHeight="1.7">{persona.notes}</Text>
          </Box>
        )}
      </SimpleGrid>

      {persona.createdByCallsign && (
        <Flex align="center" gap={1.5} mt={4} px={3} py={2} borderRadius="8px"
          bg={`${ACCENT}08`} border={`1px solid ${ACCENT}18`}>
          <Text fontSize="9px" color="var(--dash-text-muted)">Created by</Text>
          <Text fontSize="11px" color={ACCENT} fontWeight="bold">{persona.createdByCallsign}</Text>
        </Flex>
      )}
    </Box>
  );
};

// ── Form fields ──────────────────────────────────────────────────────────────
const FORM_FIELDS = [
  { key: 'fullName',   label: 'Full Name',   col: 2 },
  { key: 'gender',     label: 'Gender' },
  { key: 'birthday',   label: 'Birthday (DD/MM/YYYY)' },
  { key: 'nationality',label: 'Nationality' },
  { key: 'age',        label: 'Age' },
  { key: 'email',      label: 'Email',     col: 2 },
  { key: 'username',   label: 'Username' },
  { key: 'password',   label: 'Password' },
  { key: 'phone',      label: 'Phone' },
  { key: 'website',    label: 'Website' },
  { key: 'address',    label: 'Address',   col: 2 },
  { key: 'city',       label: 'City' },
  { key: 'state',      label: 'State / Region' },
  { key: 'zipCode',    label: 'ZIP / Postal Code' },
  { key: 'country',    label: 'Country' },
  { key: 'height',     label: 'Height' },
  { key: 'weight',     label: 'Weight' },
  { key: 'eyeColor',   label: 'Eye Color' },
  { key: 'hairColor',  label: 'Hair Color' },
  { key: 'bloodType',  label: 'Blood Type' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'company',    label: 'Company' },
];

// ── Persona card ─────────────────────────────────────────────────────────────
const PersonaCard = ({ persona, onView, onEdit, onDelete, index }) => {
  const nd = NATIONALITY_DATA[persona.nationality];
  const [color] = avatarMeta(persona.fullName);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="14px" overflow="hidden"
      _hover={{ borderColor: `${color}40`, transform: 'translateY(-1px)' }}
      style={{ transition: 'border-color 0.18s, transform 0.15s' }}
      cursor="pointer" onClick={() => onView(persona)}>

      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }} />

      <Box p={4} pos="relative">
        <Flex align="flex-start" gap={3} mb={3}>
          <AvatarCircle name={persona.fullName} size="44px" fontSize="14px" />
          <Box flex="1" minW={0}>
            <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={1}>
              {persona.fullName}
            </Text>
            <Text fontSize="11px" color={ACCENT} fontFamily="mono" fontWeight="600" noOfLines={1}>
              @{persona.username}
            </Text>
          </Box>
          <Flex gap={1} onClick={e => e.stopPropagation()}>
            <Tooltip label="Edit" fontSize="10px">
              <IconButton icon={<EditIcon boxSize={3} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" borderRadius="6px"
                _hover={{ color: ACCENT, bg: `${ACCENT}12` }}
                onClick={() => onEdit(persona)} aria-label="Edit" />
            </Tooltip>
            <Tooltip label="Delete" fontSize="10px">
              <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" borderRadius="6px"
                _hover={{ color: RED, bg: `${RED}08` }}
                onClick={() => onDelete(persona.id || String(persona._id))} aria-label="Delete" />
            </Tooltip>
          </Flex>
        </Flex>

        <Flex direction="column" gap={2}>
          <Flex align="center" gap={2}>
            <EmailIcon boxSize={3} color="var(--dash-text-muted)" />
            <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1}>{persona.email}</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <BriefcaseIcon boxSize="12px" color="var(--dash-text-muted)" />
            <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1}>
              {persona.occupation}{persona.company ? ` · ${persona.company}` : ''}
            </Text>
          </Flex>
          <Flex align="center" gap={2}>
            <MapPinIcon boxSize="12px" color="var(--dash-text-muted)" />
            <Text fontSize="11px" color="var(--dash-text-muted)">{persona.city}, {persona.country}</Text>
          </Flex>
        </Flex>
      </Box>
    </MotionBox>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// Main view
// ═════════════════════════════════════════════════════════════════════════════
const PersonasView = () => {
  const { slug }    = useParams();
  const { getBySlug, updateEngagement } = useEngagements();
  const { user: currentUser }           = useAuth();
  const eng = getBySlug(slug);

  const [genGender,      setGenGender]      = useState('');
  const [genNationality, setGenNationality] = useState('');
  const [preview,        setPreview]        = useState(null);
  const [viewModal,      setViewModal]      = useState(null);
  const [editModal,      setEditModal]      = useState(null);
  const [isNewEdit,      setIsNewEdit]      = useState(false);
  const [search,         setSearch]         = useState('');

  if (!eng) return (
    <Flex align="center" justify="center" h="60vh"><Spinner size="lg" color={ACCENT} /></Flex>
  );

  const personas = eng.personas || [];

  const filtered = search.trim()
    ? personas.filter(p => {
        const q = search.toLowerCase();
        return p.fullName?.toLowerCase().includes(q)
          || p.username?.toLowerCase().includes(q)
          || p.email?.toLowerCase().includes(q)
          || p.nationality?.toLowerCase().includes(q);
      })
    : personas;

  // Stats
  const genderCounts = { Male: 0, Female: 0 };
  const natCounts = {};
  personas.forEach(p => {
    if (p.gender) genderCounts[p.gender] = (genderCounts[p.gender] || 0) + 1;
    if (p.nationality) natCounts[p.nationality] = (natCounts[p.nationality] || 0) + 1;
  });
  const topNat = Object.entries(natCounts).sort((a, b) => b[1] - a[1])[0];

  // ── Generator ──────────────────────────────────────────────────────────────
  const generate = () => setPreview(generatePersona(genGender || undefined, genNationality || undefined));

  const savePreview = () => {
    if (!preview) return;
    const saved = {
      ...preview,
      id:                Date.now().toString(),
      createdBy:         currentUser?.id || currentUser?._id || '',
      createdByCallsign: currentUser?.callsign || '',
    };
    updateEngagement(eng.id, { personas: [...personas, saved] });
    setPreview(null);
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const openManualCreate = () => {
    setEditModal({
      id: Date.now().toString(),
      fullName: '', gender: '', birthday: '', age: '', nationality: '',
      email: '', username: '', password: '', phone: '', address: '',
      city: '', state: '', zipCode: '', country: '', height: '', weight: '',
      eyeColor: '', hairColor: '', bloodType: '', occupation: '', company: '',
      website: '', notes: '',
      createdBy: currentUser?.id || currentUser?._id || '',
      createdByCallsign: currentUser?.callsign || '',
    });
    setIsNewEdit(true);
  };

  const openEdit = (persona) => {
    setViewModal(null);
    setEditModal({ ...persona });
    setIsNewEdit(false);
  };

  const saveEdit = () => {
    if (!editModal?.fullName?.trim()) return;
    if (isNewEdit) {
      updateEngagement(eng.id, { personas: [...personas, editModal] });
    } else {
      updateEngagement(eng.id, {
        personas: personas.map(p =>
          (p.id || String(p._id)) === (editModal.id || String(editModal._id)) ? editModal : p
        ),
      });
    }
    setEditModal(null);
  };

  const deletePersona = (pid) => {
    updateEngagement(eng.id, {
      personas: personas.filter(p => (p.id || String(p._id)) !== pid),
    });
    setViewModal(null);
  };

  return (
    <Box px={6} pb={12}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Personas <Text as="span" color="red.400">Generator</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · generate or manually create sock puppet identities
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" fontWeight="bold"
          borderRadius="8px" bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
          color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
          onClick={openManualCreate}>
          Create Manually
        </Button>
      </Flex>

      {/* Stats row */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={6}>
        {[
          { label: 'Total Personas', value: personas.length, color: ACCENT, Icon: UserIcon },
          { label: 'Male / Female', value: `${genderCounts.Male} / ${genderCounts.Female}`, color: BLUE, Icon: ShuffleIcon },
          { label: 'Top Nationality', value: topNat ? topNat[0] : '—', color: GREEN, Icon: GlobeIcon },
          { label: 'Nationalities', value: Object.keys(natCounts).length, color: ORANGE, Icon: MapPinIcon },
        ].map(({ label, value, color: c, Icon }) => (
          <MotionBox key={label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="12px" p={4} pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${c}80, transparent)` }} />
            <Flex justify="space-between" align="flex-start">
              <Box>
                <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                  textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
                <Text fontSize={typeof value === 'number' ? '2xl' : 'lg'} fontWeight="black" color={c}>
                  {value}
                </Text>
              </Box>
              <Flex w="32px" h="32px" borderRadius="8px" bg={`${c}10`}
                border={`1px solid ${c}25`} align="center" justify="center">
                <Icon boxSize="14px" color={c} />
              </Flex>
            </Flex>
          </MotionBox>
        ))}
      </SimpleGrid>

      {/* ── Generator panel ── */}
      <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        mb={6} bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden" pos="relative">
        <Box pos="absolute" top={0} left={0} right={0} h="2px"
          style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />

        <Box p={5}>
          <SectionHead color={ACCENT} icon={ShuffleIcon}>Identity Generator</SectionHead>

          <Flex gap={3} mb={preview ? 5 : 0} flexWrap="wrap" align="flex-end">
            <Box>
              <Label>Gender</Label>
              <Select value={genGender} onChange={e => setGenGender(e.target.value)} {...selSx} w="140px">
                <option value="">Random</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </Box>
            <Box>
              <Label>Nationality</Label>
              <Select value={genNationality} onChange={e => setGenNationality(e.target.value)} {...selSx} w="160px">
                <option value="">Random</option>
                {NATIONALITIES.map(n => <option key={n} value={n}>{NATIONALITY_DATA[n].flag} {n}</option>)}
              </Select>
            </Box>
            <Button size="sm" leftIcon={<RepeatIcon boxSize={3} />} fontSize="12px" fontWeight="bold"
              borderRadius="8px" bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
              color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
              onClick={generate}>
              {preview ? 'Regenerate' : 'Generate Identity'}
            </Button>
            {preview && (
              <>
                <Button size="sm" leftIcon={<CheckIcon boxSize={2.5} />} fontSize="12px" fontWeight="bold"
                  borderRadius="8px" bg={`${GREEN}12`} border={`1px solid ${GREEN}35`}
                  color={GREEN} _hover={{ bg: `${GREEN}20` }}
                  onClick={savePreview}>
                  Save Persona
                </Button>
                <Button size="sm" fontSize="12px" borderRadius="8px" variant="ghost"
                  color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.08)"
                  _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                  onClick={() => setPreview(null)}>
                  Discard
                </Button>
              </>
            )}
          </Flex>

          {/* Preview */}
          <AnimatePresence>
            {preview && (
              <MotionBox
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                overflow="hidden">
                <Box mt={4} pt={4} borderTop="1px solid rgba(255,255,255,0.06)">
                  <PersonaDetail persona={preview} />
                </Box>
              </MotionBox>
            )}
          </AnimatePresence>
        </Box>
      </MotionBox>

      {/* ── Personas grid ── */}
      {personas.length === 0 ? (
        <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}>
          <Flex direction="column" align="center" justify="center" py={16} gap={3}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="16px"
            pos="relative" overflow="hidden">
            <Box pos="absolute" top={0} left={0} right={0} h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT}60, transparent)` }} />
            <Flex w="56px" h="56px" borderRadius="14px" bg={`${ACCENT}12`}
              border={`2px solid ${ACCENT}40`} align="center" justify="center">
              <UserIcon boxSize="24px" color={ACCENT} />
            </Flex>
            <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">
              No personas created yet
            </Text>
            <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center" maxW="360px">
              Use the generator above or create one manually. Saved personas are visible to all assigned operators.
            </Text>
          </Flex>
        </MotionBox>
      ) : (
        <>
          <Flex justify="space-between" align="center" mb={3} gap={3}>
            <Flex align="center" gap={2}>
              <Box w="3px" h="12px" borderRadius="full" bg={ACCENT} />
              <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                letterSpacing="wider" fontWeight="bold">
                Saved Personas
              </Text>
              <Box px={2} py="1px" borderRadius="full" bg={`${ACCENT}10`} border={`1px solid ${ACCENT}30`}>
                <Text fontSize="9px" fontWeight="bold" color={ACCENT}>{personas.length}</Text>
              </Box>
            </Flex>
            <Box pos="relative" w="220px">
              <Box pos="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                <SearchIcon boxSize={3} color="var(--dash-text-muted)" />
              </Box>
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search personas…" {...inputSx} pl={8} h="32px" fontSize="11px" />
            </Box>
          </Flex>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {filtered.map((p, i) => (
              <PersonaCard
                key={p.id || String(p._id)}
                persona={p} index={i}
                onView={setViewModal}
                onEdit={openEdit}
                onDelete={deletePersona}
              />
            ))}
          </SimpleGrid>
          {search.trim() && filtered.length === 0 && (
            <Flex justify="center" py={8}>
              <Text fontSize="12px" color="var(--dash-text-muted)">No personas match "{search}"</Text>
            </Flex>
          )}
        </>
      )}

      {/* ── View modal ── */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} isCentered size="2xl">
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(6px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px" overflow="hidden" p={0}
          maxH="88vh" overflowY="auto"
          css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
          <ModalBody p={0}>
            {viewModal && (
              <Box p={6} pos="relative">
                <Box pos="absolute" top="0" left="0" right="0" h="2px"
                  style={{ background: `linear-gradient(to right, transparent, ${avatarMeta(viewModal.fullName)[0]}66, transparent)` }} />

                <Flex justify="space-between" align="center" mb={4}>
                  <Flex align="center" gap={2}>
                    <Flex w="28px" h="28px" borderRadius="7px" bg={`${ACCENT}12`}
                      border={`1px solid ${ACCENT}30`} align="center" justify="center">
                      <UserIcon boxSize="13px" color={ACCENT} />
                    </Flex>
                    <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">Persona Details</Text>
                  </Flex>
                  <Flex gap={2}>
                    <Button size="xs" leftIcon={<EditIcon boxSize={2.5} />} borderRadius="7px"
                      bg={`${ACCENT}10`} border={`1px solid ${ACCENT}30`}
                      color={ACCENT} fontSize="11px" fontWeight="bold"
                      _hover={{ bg: `${ACCENT}20` }}
                      onClick={() => openEdit(viewModal)}>
                      Edit
                    </Button>
                    <Button size="xs" leftIcon={<DeleteIcon boxSize={2.5} />} borderRadius="7px"
                      bg={`${RED}08`} border={`1px solid ${RED}25`}
                      color={RED} fontSize="11px" fontWeight="bold"
                      _hover={{ bg: `${RED}15` }}
                      onClick={() => deletePersona(viewModal.id || String(viewModal._id))}>
                      Delete
                    </Button>
                    <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                      color="var(--dash-text-muted)" borderRadius="7px"
                      _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                      onClick={() => setViewModal(null)} aria-label="Close" />
                  </Flex>
                </Flex>

                <PersonaDetail persona={viewModal} />
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── Edit / Create modal ── */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} isCentered size="xl">
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(6px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px" overflow="hidden" p={0}
          maxH="88vh" overflowY="auto"
          css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
          <ModalBody p={0}>
            {editModal && (
              <Box p={6} pos="relative">
                <Box pos="absolute" top="0" left="0" right="0" h="2px"
                  style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />

                <Flex justify="space-between" align="center" mb={5}>
                  <Flex align="center" gap={2}>
                    <Flex w="28px" h="28px" borderRadius="7px" bg={`${ACCENT}12`}
                      border={`1px solid ${ACCENT}30`} align="center" justify="center">
                      {isNewEdit
                        ? <AddIcon boxSize={3} color={ACCENT} />
                        : <EditIcon boxSize={3} color={ACCENT} />}
                    </Flex>
                    <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">
                      {isNewEdit ? 'Create Persona' : 'Edit Persona'}
                    </Text>
                  </Flex>
                  <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                    color="var(--dash-text-muted)" borderRadius="8px"
                    _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                    onClick={() => setEditModal(null)} aria-label="Close" />
                </Flex>

                <SimpleGrid columns={2} spacing={3} mb={3}>
                  {FORM_FIELDS.map(({ key, label, col }) => (
                    <Box key={key} style={{ gridColumn: col === 2 ? 'span 2' : undefined }}>
                      <Label>{label}</Label>
                      <Input {...inputSx} value={editModal[key] || ''}
                        onChange={e => setEditModal(p => ({ ...p, [key]: e.target.value }))} />
                    </Box>
                  ))}
                  <Box style={{ gridColumn: 'span 2' }}>
                    <Label>Notes</Label>
                    <Textarea bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                      borderRadius="10px" fontSize="sm" color="var(--dash-text-primary)"
                      _placeholder={{ color: 'var(--dash-text-muted)' }}
                      _hover={{ borderColor: `${ACCENT}50` }}
                      _focus={{ borderColor: `${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` }}
                      value={editModal.notes || ''}
                      onChange={e => setEditModal(p => ({ ...p, notes: e.target.value }))}
                      rows={3} resize="none" py={3} />
                  </Box>
                </SimpleGrid>

                <Flex gap={3} pt={2}>
                  <Button flex="1" size="sm" variant="ghost" borderRadius="10px"
                    color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.08)"
                    _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                    onClick={() => setEditModal(null)}>Cancel</Button>
                  <Button flex="1" size="sm" borderRadius="10px" fontWeight="bold"
                    bg={`${ACCENT}15`} border={`1px solid ${ACCENT}40`}
                    color={ACCENT} _hover={{ bg: `${ACCENT}25` }}
                    onClick={saveEdit}>
                    {isNewEdit ? 'Create Persona' : 'Save Changes'}
                  </Button>
                </Flex>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

    </Box>
  );
};

export default PersonasView;
