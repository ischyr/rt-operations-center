import { useState } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Textarea,
  Select, SimpleGrid, Modal, ModalOverlay, ModalContent, ModalBody, Grid,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CloseIcon, RepeatIcon, EditIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

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
    country: 'United States', flag: '🇺🇸',
    cities: ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia',
             'San Antonio','San Diego','Dallas','Austin','Jacksonville','Fort Worth'],
    states: ['NY','CA','IL','TX','AZ','PA','FL','OH','GA','NC','MI','WA'],
    zip:   () => String(Math.floor(10000 + Math.random() * 89999)),
    phone: () => `+1 (${ri(200,999)}) ${ri(100,999)}-${ri(1000,9999)}`,
    streets: ['Oak','Maple','Cedar','Pine','Elm','Washington','Lincoln','Park','Lake','River'],
    streetTypes: ['Ave','St','Blvd','Dr','Ln','Rd','Way','Ct'],
  },
  British: {
    country: 'United Kingdom', flag: '🇬🇧',
    cities: ['London','Manchester','Birmingham','Leeds','Glasgow','Liverpool',
             'Edinburgh','Bristol','Sheffield','Nottingham','Cardiff','Belfast'],
    states: ['England','Scotland','Wales','N. Ireland'],
    zip:   () => `${rc('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}${rc('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}${ri(1,9)} ${ri(1,9)}${rc('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}${rc('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}`,
    phone: () => `+44 ${ri(1000,9999)} ${ri(100000,999999)}`,
    streets: ['High','Church','Victoria','Park','Station','London','King','Queen','Mill'],
    streetTypes: ['Street','Road','Lane','Avenue','Way','Close','Drive','Place'],
  },
  German: {
    country: 'Germany', flag: '🇩🇪',
    cities: ['Berlin','Hamburg','Munich','Cologne','Frankfurt','Stuttgart',
             'Düsseldorf','Leipzig','Dortmund','Essen','Bremen','Dresden'],
    states: ['Bavaria','North Rhine-Westphalia','Baden-Württemberg','Lower Saxony'],
    zip:   () => String(ri(10000,99999)),
    phone: () => `+49 ${ri(100,999)} ${ri(1000000,9999999)}`,
    streets: ['Haupt','Bahnhof','Schul','Kirch','Garten','Wiesen','Wald','Berg'],
    streetTypes: ['straße','weg','gasse','platz','allee'],
  },
  French: {
    country: 'France', flag: '🇫🇷',
    cities: ['Paris','Marseille','Lyon','Toulouse','Nice','Nantes',
             'Montpellier','Strasbourg','Bordeaux','Lille','Rennes','Grenoble'],
    states: ['Île-de-France','Provence','Normandy','Brittany','Alsace'],
    zip:   () => String(ri(10000,95999)),
    phone: () => `+33 ${ri(1,9)} ${ri(10,99)} ${ri(10,99)} ${ri(10,99)} ${ri(10,99)}`,
    streets: ['Rue de la','Avenue de','Boulevard de','Chemin du','Allée des'],
    streetTypes: ['Paix','Liberté','République','Victoire','Fleurs','Roses'],
  },
  Italian: {
    country: 'Italy', flag: '🇮🇹',
    cities: ['Rome','Milan','Naples','Turin','Palermo','Genoa',
             'Bologna','Florence','Bari','Catania','Venice','Verona'],
    states: ['Lazio','Lombardy','Campania','Veneto','Sicily','Tuscany'],
    zip:   () => String(ri(10000,99999)),
    phone: () => `+39 ${ri(30,39)}${ri(1000000,9999999)}`,
    streets: ['Via','Viale','Corso','Piazza','Vicolo'],
    streetTypes: ['Roma','Garibaldi','Mazzini','Verdi','Dante','Italia'],
  },
  Canadian: {
    country: 'Canada', flag: '🇨🇦',
    cities: ['Toronto','Montreal','Vancouver','Calgary','Edmonton',
             'Ottawa','Winnipeg','Quebec City','Hamilton','Kitchener'],
    states: ['Ontario','Quebec','British Columbia','Alberta','Manitoba'],
    zip:   () => `${rc('ABCEGHJKLMNPRSTVXY')}${ri(1,9)}${rc('ABCEGHJKLMNPRSTVWXYZ')} ${ri(1,9)}${rc('ABCEGHJKLMNPRSTVWXYZ')}${ri(1,9)}`,
    phone: () => `+1 (${ri(200,999)}) ${ri(100,999)}-${ri(1000,9999)}`,
    streets: ['Maple','Pine','Cedar','Oak','Birch','Queen','King','Main','Centre'],
    streetTypes: ['Ave','St','Blvd','Dr','Cres','Rd'],
  },
  Romanian: {
    country: 'Romania', flag: '🇷🇴',
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

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Shared styles ──────────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};
const selSx = {
  bg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px', h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  cursor: 'pointer', focusBorderColor: 'rgba(255,80,95,0.7)',
  _hover: { borderColor: 'rgba(255,80,95,0.4)' },
  sx: { '& option': { background: '#1a1a1f !important' } },
};
const FL = ({ children }) => (
  <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1}>{children}</Text>
);
const FV = ({ children }) => (
  <Text fontSize="13px" color="var(--dash-text-primary)" fontWeight="semibold">{children || '—'}</Text>
);

// ── Avatar circle ──────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['rgba(99,102,241,0.15)','rgba(99,102,241,0.35)','#a5b4fc'],
  ['rgba(245,158,11,0.15)','rgba(245,158,11,0.35)','#fcd34d'],
  ['rgba(16,185,129,0.15)','rgba(16,185,129,0.35)','#6ee7b7'],
  ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.35)', '#fca5a5'],
  ['rgba(79,209,197,0.15)','rgba(79,209,197,0.35)','#4fd1c5'],
  ['rgba(168,85,247,0.15)','rgba(168,85,247,0.35)','#d8b4fe'],
];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const AvatarCircle = ({ name, size = '52px', fontSize = '16px' }) => {
  const [bg, border, color] = avatarColor(name);
  const initials = (name || '??').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <Flex w={size} h={size} borderRadius="full" align="center" justify="center"
      flexShrink={0} bg={bg} border={`2px solid ${border}`}
      fontSize={fontSize} fontWeight="bold" color={color} fontFamily="mono">
      {initials}
    </Flex>
  );
};

// ── Section header ─────────────────────────────────────────────────────────────
const SectionHead = ({ children, color = 'rgba(255,80,95,0.7)' }) => (
  <Flex align="center" gap={2} mb={3}>
    <Box w="3px" h="14px" borderRadius="full" bg={color} />
    <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-primary)"
      textTransform="uppercase" letterSpacing="wider">{children}</Text>
  </Flex>
);

// ── Field row ──────────────────────────────────────────────────────────────────
const FieldRow = ({ label, value, mono }) => (
  <Box>
    <FL>{label}</FL>
    <Text fontSize="12px" color={mono ? 'rgba(255,130,130,0.9)' : 'var(--dash-text-primary)'}
      fontFamily={mono ? 'mono' : 'inherit'} wordBreak="break-all">
      {value || '—'}
    </Text>
  </Box>
);

// ── Persona detail panel ───────────────────────────────────────────────────────
const PersonaDetail = ({ persona }) => {
  const nd = NATIONALITY_DATA[persona.nationality];
  return (
    <Box>
      {/* Identity header */}
      <Flex align="center" gap={4} mb={5} p={4} borderRadius="12px"
        bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)">
        <AvatarCircle name={persona.fullName} size="60px" fontSize="18px" />
        <Box flex="1" minW={0}>
          <Text fontSize="18px" fontWeight="bold" color="var(--dash-text-primary)">{persona.fullName}</Text>
          <Text fontSize="12px" color="var(--dash-text-muted)" fontFamily="mono">@{persona.username}</Text>
          <Flex gap={2} mt={1} flexWrap="wrap">
            <Box px={2} py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
              bg="rgba(255,255,255,0.06)" color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.1)">
              {persona.gender}
            </Box>
            <Box px={2} py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
              bg="rgba(255,255,255,0.06)" color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.1)">
              {nd?.flag} {persona.nationality}
            </Box>
            <Box px={2} py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
              bg="rgba(255,255,255,0.06)" color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.1)">
              Age {persona.age}
            </Box>
          </Flex>
        </Box>
      </Flex>

      <SimpleGrid columns={2} spacing={4}>
        {/* Identity */}
        <Box p={3} borderRadius="10px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)">
          <SectionHead>Identity</SectionHead>
          <Flex direction="column" gap={3}>
            <FieldRow label="Full Name"  value={persona.fullName} />
            <FieldRow label="Birthday"   value={persona.birthday} />
            <FieldRow label="Blood Type" value={persona.bloodType} />
          </Flex>
        </Box>

        {/* Contact */}
        <Box p={3} borderRadius="10px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)">
          <SectionHead color="rgba(79,209,197,0.7)">Contact</SectionHead>
          <Flex direction="column" gap={3}>
            <FieldRow label="Phone"   value={persona.phone} />
            <FieldRow label="Address" value={persona.address} />
            <FieldRow label="City"    value={`${persona.city}${persona.state ? ', ' + persona.state : ''} ${persona.zipCode}`} />
          </Flex>
        </Box>

        {/* Online */}
        <Box p={3} borderRadius="10px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)">
          <SectionHead color="rgba(99,102,241,0.7)">Online</SectionHead>
          <Flex direction="column" gap={3}>
            <FieldRow label="Email"    value={persona.email} mono />
            <FieldRow label="Username" value={persona.username} mono />
            <FieldRow label="Password" value={persona.password} mono />
            <FieldRow label="Website"  value={persona.website} mono />
          </Flex>
        </Box>

        {/* Physical */}
        <Box p={3} borderRadius="10px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)">
          <SectionHead color="rgba(245,158,11,0.7)">Physical</SectionHead>
          <Flex direction="column" gap={3}>
            <FieldRow label="Height"     value={persona.height} />
            <FieldRow label="Weight"     value={persona.weight} />
            <FieldRow label="Eye Color"  value={persona.eyeColor} />
            <FieldRow label="Hair Color" value={persona.hairColor} />
          </Flex>
        </Box>

        {/* Employment */}
        <Box p={3} borderRadius="10px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)"
          gridColumn="span 2">
          <SectionHead color="rgba(16,185,129,0.7)">Employment</SectionHead>
          <SimpleGrid columns={2} spacing={3}>
            <FieldRow label="Occupation" value={persona.occupation} />
            <FieldRow label="Company"    value={persona.company} />
          </SimpleGrid>
        </Box>

        {/* Notes */}
        {persona.notes && (
          <Box p={3} borderRadius="10px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)"
            gridColumn="span 2">
            <SectionHead color="rgba(156,163,175,0.7)">Notes</SectionHead>
            <Text fontSize="12px" color="var(--dash-text-muted)" lineHeight="1.6">{persona.notes}</Text>
          </Box>
        )}
      </SimpleGrid>

      {persona.createdByCallsign && (
        <Flex align="center" gap={1.5} mt={4} px={3} py={2} borderRadius="8px"
          bg="rgba(255,80,95,0.05)" border="1px solid rgba(255,80,95,0.15)">
          <Text fontSize="9px" color="var(--dash-text-muted)">Created by</Text>
          <Text fontSize="11px" color="rgba(255,130,130,0.8)" fontWeight="semibold">
            {persona.createdByCallsign}
          </Text>
        </Flex>
      )}
    </Box>
  );
};

// ── Edit form ──────────────────────────────────────────────────────────────────
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

const EditForm = ({ data, onChange }) => (
  <Box>
    {FORM_FIELDS.map(({ key, label, col }) => (
      <Box key={key} mb={3} gridColumn={col ? `span ${col}` : undefined}
        style={{ gridColumn: col ? `span ${col}` : undefined }}>
        <FL>{label}</FL>
        <Input {...inputSx} value={data[key] || ''}
          onChange={e => onChange(key, e.target.value)} />
      </Box>
    ))}
    <Box mb={3}>
      <FL>Notes</FL>
      <Textarea {...inputSx} h="auto" value={data.notes || ''}
        onChange={e => onChange('notes', e.target.value)}
        rows={3} resize="none" py={3} />
    </Box>
  </Box>
);

// ── Persona card (grid) ────────────────────────────────────────────────────────
const PersonaCard = ({ persona, onView, onEdit, onDelete }) => {
  const nd = NATIONALITY_DATA[persona.nationality];
  return (
    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="14px" overflow="hidden" transition="border-color 0.18s, transform 0.15s"
      _hover={{ borderColor: 'rgba(255,255,255,0.15)', transform: 'translateY(-1px)' }}
      cursor="pointer" onClick={() => onView(persona)}>

      {/* Color bar */}
      <Box h="2px" style={{
        background: `linear-gradient(to right, transparent, ${avatarColor(persona.fullName)[2]}66, transparent)`,
      }} />

      <Box p={4}>
        <Flex align="flex-start" gap={3} mb={3}>
          <AvatarCircle name={persona.fullName} size="44px" fontSize="14px" />
          <Box flex="1" minW={0}>
            <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={1}>
              {persona.fullName}
            </Text>
            <Text fontSize="11px" color="var(--dash-text-muted)" fontFamily="mono" noOfLines={1}>
              @{persona.username}
            </Text>
          </Box>
          {/* stop click-through for action buttons */}
          <Flex gap={1} onClick={e => e.stopPropagation()}>
            <IconButton icon={<EditIcon boxSize={3} />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="6px"
              _hover={{ color: 'white', bg: 'rgba(255,255,255,0.08)' }}
              onClick={() => onEdit(persona)} aria-label="Edit" />
            <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" borderRadius="6px"
              _hover={{ color: 'red.400', bg: 'rgba(255,80,95,0.1)' }}
              onClick={() => onDelete(persona.id || String(persona._id))} aria-label="Delete" />
          </Flex>
        </Flex>

        <Flex direction="column" gap={1.5}>
          <Flex align="center" gap={1.5}>
            <Text fontSize="9px" w="16px">📧</Text>
            <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1}>{persona.email}</Text>
          </Flex>
          <Flex align="center" gap={1.5}>
            <Text fontSize="9px" w="16px">💼</Text>
            <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1}>
              {persona.occupation}{persona.company ? ` · ${persona.company}` : ''}
            </Text>
          </Flex>
          <Flex align="center" gap={1.5}>
            <Text fontSize="9px" w="16px">{nd?.flag || '🌍'}</Text>
            <Text fontSize="11px" color="var(--dash-text-muted)">{persona.country}</Text>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────────────────────────────────────
const PersonasView = () => {
  const { slug }    = useParams();
  const { getBySlug, updateEngagement } = useEngagements();
  const { user: currentUser }           = useAuth();
  const eng = getBySlug(slug);

  const [genGender,      setGenGender]      = useState('');
  const [genNationality, setGenNationality] = useState('');
  const [preview,        setPreview]        = useState(null);   // generated persona, not yet saved
  const [viewModal,      setViewModal]      = useState(null);   // viewing saved persona
  const [editModal,      setEditModal]      = useState(null);   // editing persona (new or existing)
  const [isNewEdit,      setIsNewEdit]      = useState(false);  // is editModal a new persona?

  if (!eng) return null;

  const personas = eng.personas || [];

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
    <Box pb={12}>

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            Personas <Text as="span" color="red.400">Generator</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · generate or manually create sock puppet identities
          </Text>
        </Box>
        <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" borderRadius="8px"
          variant="ghost" color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.1)"
          _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
          onClick={openManualCreate}>
          Create Manually
        </Button>
      </Flex>

      {/* ── Generator panel ── */}
      <Box mb={6} p={5} bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px">
        <Flex align="center" gap={2} mb={4}>
          <Box w="3px" h="16px" borderRadius="full" bg="rgba(255,80,95,0.7)" />
          <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)"
            textTransform="uppercase" letterSpacing="wider">Identity Generator</Text>
        </Flex>

        <Flex gap={3} mb={preview ? 5 : 0} flexWrap="wrap" align="flex-end">
          <Box>
            <FL>Gender</FL>
            <Select value={genGender} onChange={e => setGenGender(e.target.value)} {...selSx} w="140px">
              <option value="">Random</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </Box>
          <Box>
            <FL>Nationality</FL>
            <Select value={genNationality} onChange={e => setGenNationality(e.target.value)} {...selSx} w="160px">
              <option value="">Random</option>
              {NATIONALITIES.map(n => <option key={n} value={n}>{NATIONALITY_DATA[n].flag} {n}</option>)}
            </Select>
          </Box>
          <Button size="sm" leftIcon={<RepeatIcon boxSize={3} />} fontSize="12px" borderRadius="8px"
            bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
            color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.18)' }}
            onClick={generate}>
            {preview ? 'Regenerate' : 'Generate Identity'}
          </Button>
          {preview && (
            <>
              <Button size="sm" fontSize="12px" borderRadius="8px"
                bg="rgba(110,231,183,0.1)" border="1px solid rgba(110,231,183,0.3)"
                color="#6ee7b7" _hover={{ bg: 'rgba(110,231,183,0.18)' }}
                onClick={savePreview}>
                Save Persona ✓
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
        {preview && (
          <Box mt={4} pt={4} borderTop="1px solid rgba(255,255,255,0.07)">
            <PersonaDetail persona={preview} />
          </Box>
        )}
      </Box>

      {/* ── Personas grid ── */}
      {personas.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={14} gap={3}
          bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="16px">
          <Text fontSize="36px">🎭</Text>
          <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)">No personas created yet</Text>
          <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center" maxW="360px">
            Use the generator above or create one manually. Saved personas are visible to all assigned operators.
          </Text>
        </Flex>
      ) : (
        <>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="12px" color="var(--dash-text-muted)">
              {personas.length} persona{personas.length !== 1 ? 's' : ''} saved
            </Text>
          </Flex>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {personas.map(p => (
              <PersonaCard
                key={p.id || String(p._id)}
                persona={p}
                onView={setViewModal}
                onEdit={openEdit}
                onDelete={deletePersona}
              />
            ))}
          </SimpleGrid>
        </>
      )}

      {/* ── View modal ── */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} isCentered size="2xl">
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(4px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="18px" overflow="hidden" p={0}
          maxH="88vh" overflowY="auto"
          css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)' } }}>
          <ModalBody p={0}>
            {viewModal && (
              <Box p={6} pos="relative">
                <Box pos="absolute" top="0" left="0" right="0" h="2px"
                  style={{ background: `linear-gradient(to right, transparent, ${avatarColor(viewModal.fullName)[2]}66, transparent)` }} />

                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">Persona Details</Text>
                  <Flex gap={2}>
                    <Button size="xs" leftIcon={<EditIcon boxSize={2.5} />} borderRadius="7px"
                      bg="rgba(255,255,255,0.06)" border="1px solid rgba(255,255,255,0.1)"
                      color="var(--dash-text-secondary)" fontSize="11px"
                      _hover={{ color: 'white', bg: 'rgba(255,255,255,0.1)' }}
                      onClick={() => openEdit(viewModal)}>
                      Edit
                    </Button>
                    <Button size="xs" leftIcon={<DeleteIcon boxSize={2.5} />} borderRadius="7px"
                      bg="rgba(255,80,95,0.08)" border="1px solid rgba(255,80,95,0.2)"
                      color="rgba(255,130,130,0.8)" fontSize="11px"
                      _hover={{ bg: 'rgba(255,80,95,0.15)' }}
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
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(4px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="18px" overflow="hidden" p={0}
          maxH="88vh" overflowY="auto"
          css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)' } }}>
          <ModalBody p={0}>
            {editModal && (
              <Box p={6} pos="relative">
                <Box pos="absolute" top="0" left="0" right="0" h="2px"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(255,80,95,0.5), transparent)' }} />

                <Flex justify="space-between" align="center" mb={5}>
                  <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">
                    {isNewEdit ? 'Create Persona' : 'Edit Persona'}
                  </Text>
                  <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                    color="var(--dash-text-muted)" borderRadius="8px"
                    _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                    onClick={() => setEditModal(null)} aria-label="Close" />
                </Flex>

                <SimpleGrid columns={2} spacing={3} mb={3}>
                  {FORM_FIELDS.map(({ key, label, col }) => (
                    <Box key={key} style={{ gridColumn: col === 2 ? 'span 2' : undefined }}>
                      <FL>{label}</FL>
                      <Input {...inputSx} value={editModal[key] || ''}
                        onChange={e => setEditModal(p => ({ ...p, [key]: e.target.value }))} />
                    </Box>
                  ))}
                  <Box style={{ gridColumn: 'span 2' }}>
                    <FL>Notes</FL>
                    <Textarea {...inputSx} h="auto" value={editModal.notes || ''}
                      onChange={e => setEditModal(p => ({ ...p, notes: e.target.value }))}
                      rows={3} resize="none" py={3} />
                  </Box>
                </SimpleGrid>

                <Flex gap={3} pt={2}>
                  <Button flex="1" size="sm" variant="ghost" borderRadius="10px"
                    color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.08)"
                    _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                    onClick={() => setEditModal(null)}>Cancel</Button>
                  <Button flex="1" size="sm" borderRadius="10px" fontWeight="semibold"
                    bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
                    color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.18)' }}
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
