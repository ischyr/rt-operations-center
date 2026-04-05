import { useState, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Input, IconButton, Button,
  Textarea, useToast, Badge,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, CopyIcon, CheckIcon, InfoIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Theme ──────────────────────────────────────────────────────────────────────
const ACCENT  = '#F97316';
const A_S     = 'rgba(249,115,22,0.10)';
const A_B     = 'rgba(249,115,22,0.30)';
const MUTED   = 'var(--dash-text-muted)';
const BORDER  = 'rgba(255,255,255,0.07)';
const CARD    = 'rgba(255,255,255,0.03)';

// ── Category colours ──────────────────────────────────────────────────────────
const CAT_COLOR = {
  'Privilege Escalation': { color: '#FC8181', bg: 'rgba(252,129,129,0.10)', border: 'rgba(252,129,129,0.25)' },
  'Lateral Movement':     { color: '#F6AD55', bg: 'rgba(246,173,85,0.10)',  border: 'rgba(246,173,85,0.25)'  },
  'Credential Access':    { color: '#ECC94B', bg: 'rgba(236,201,75,0.10)',  border: 'rgba(236,201,75,0.25)'  },
  'Discovery':            { color: '#68D391', bg: 'rgba(104,211,145,0.10)', border: 'rgba(104,211,145,0.25)' },
  'Persistence':          { color: '#9F7AEA', bg: 'rgba(159,122,234,0.10)', border: 'rgba(159,122,234,0.25)' },
  'Reconnaissance':       { color: '#76E4F7', bg: 'rgba(118,228,247,0.10)', border: 'rgba(118,228,247,0.25)' },
  'Trusts & Federation':  { color: '#F97316', bg: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.25)'  },
};

// ── Query library ─────────────────────────────────────────────────────────────
const QUERIES = [
  // ── Privilege Escalation ───────────────────────────────────────────────────
  {
    id: 'pe1', category: 'Privilege Escalation', title: 'Find all Domain Admin members',
    description: 'Returns all principals (users, computers, groups) that are members of the Domain Admins group.',
    query: `MATCH p=(n)-[:MemberOf*1..]->(g:Group)
WHERE g.objectid ENDS WITH "-512"
RETURN p`,
    tags: ['DA', 'high-value', 'members'],
  },
  {
    id: 'pe2', category: 'Privilege Escalation', title: 'Find all Enterprise Admin members',
    description: 'Returns all principals that are members of the Enterprise Admins group.',
    query: `MATCH p=(n)-[:MemberOf*1..]->(g:Group)
WHERE g.objectid ENDS WITH "-519"
RETURN p`,
    tags: ['EA', 'high-value'],
  },
  {
    id: 'pe3', category: 'Privilege Escalation', title: 'Shortest path to Domain Admins',
    description: 'Finds the shortest attack path from any owned principal to Domain Admins.',
    query: `MATCH p=shortestPath((n {owned:true})-[*1..]->(g:Group))
WHERE g.objectid ENDS WITH "-512"
RETURN p`,
    tags: ['shortest-path', 'owned', 'DA'],
  },
  {
    id: 'pe4', category: 'Privilege Escalation', title: 'Users with DCSync rights',
    description: 'Finds all principals with DS-Replication-Get-Changes-All on the domain object — can dump all hashes.',
    query: `MATCH p=(n)-[:DCSync|AllExtendedRights|GenericAll]->(d:Domain)
RETURN p`,
    tags: ['dcsync', 'replication', 'critical'],
  },
  {
    id: 'pe5', category: 'Privilege Escalation', title: 'Principals with GenericAll on high-value groups',
    description: 'Returns any principal with GenericAll over Domain Admins or Enterprise Admins — can add themselves.',
    query: `MATCH p=(n)-[:GenericAll]->(g:Group)
WHERE g.objectid ENDS WITH "-512"
   OR g.objectid ENDS WITH "-519"
RETURN p`,
    tags: ['GenericAll', 'ACL', 'DA', 'EA'],
  },
  {
    id: 'pe6', category: 'Privilege Escalation', title: 'Find AdminSDHolder-protected accounts',
    description: 'Lists all users with adminCount=1, indicating they are or were members of a privileged group.',
    query: `MATCH (u:User {admincount: true})
RETURN u.name, u.enabled, u.objectid
ORDER BY u.name`,
    tags: ['admincount', 'adminSDHolder', 'high-value'],
  },

  // ── Lateral Movement ───────────────────────────────────────────────────────
  {
    id: 'lm1', category: 'Lateral Movement', title: 'Find all computers with local admin rights for a user',
    description: 'Shows every computer where a specific user has local administrator rights. Replace USERNAME.',
    query: `MATCH p=(u:User {name:"USERNAME@DOMAIN.COM"})-[:AdminTo|MemberOf*1..]->(c:Computer)
RETURN p`,
    tags: ['admin', 'local-admin', 'lateral'],
  },
  {
    id: 'lm2', category: 'Lateral Movement', title: 'Computers where DA members have sessions',
    description: 'Identifies computers where Domain Admin members are currently logged in — prime targets.',
    query: `MATCH (c:Computer)-[:HasSession]->(u:User)-[:MemberOf*1..]->(g:Group)
WHERE g.objectid ENDS WITH "-512"
RETURN DISTINCT c.name, u.name`,
    tags: ['sessions', 'DA', 'lateral'],
  },
  {
    id: 'lm3', category: 'Lateral Movement', title: 'Find computers reachable via unconstrained delegation',
    description: 'Lists all computer accounts with unconstrained delegation enabled — any user auth can be captured.',
    query: `MATCH (c:Computer {unconstraineddelegation: true})
WHERE NOT c.objectid ENDS WITH "-502"
RETURN c.name, c.operatingsystem, c.enabled
ORDER BY c.name`,
    tags: ['delegation', 'unconstrained', 'TGT'],
  },
  {
    id: 'lm4', category: 'Lateral Movement', title: 'Constrained delegation targets',
    description: 'Shows which computers can delegate to specific services — exploitable with s4u2self/s4u2proxy.',
    query: `MATCH (c:Computer)-[:AllowedToDelegate]->(t)
RETURN c.name AS source, t.name AS target, labels(t) AS targetType
ORDER BY c.name`,
    tags: ['delegation', 'constrained', 's4u'],
  },
  {
    id: 'lm5', category: 'Lateral Movement', title: 'Find local admin paths from owned users',
    description: 'Shows all computers that owned users can reach as local admin via group membership.',
    query: `MATCH p=(u:User {owned:true})-[:MemberOf|AdminTo*1..]->(c:Computer)
RETURN p`,
    tags: ['owned', 'local-admin', 'lateral'],
  },

  // ── Credential Access ──────────────────────────────────────────────────────
  {
    id: 'ca1', category: 'Credential Access', title: 'All kerberoastable users',
    description: 'Returns all enabled users with SPNs set — can be Kerberoasted without special privileges.',
    query: `MATCH (u:User {hasspn: true, enabled: true})
RETURN u.name, u.serviceprincipalnames, u.admincount, u.pwdlastset
ORDER BY u.admincount DESC, u.name`,
    tags: ['kerberoast', 'SPN', 'TGS'],
  },
  {
    id: 'ca2', category: 'Credential Access', title: 'High-value kerberoastable accounts',
    description: 'Kerberoastable users with adminCount=1 — cracking these gives immediate privileged access.',
    query: `MATCH (u:User {hasspn: true, enabled: true, admincount: true})
RETURN u.name, u.serviceprincipalnames, u.objectid
ORDER BY u.name`,
    tags: ['kerberoast', 'admincount', 'critical'],
  },
  {
    id: 'ca3', category: 'Credential Access', title: 'All AS-REP roastable users',
    description: 'Returns users with "Do not require Kerberos preauthentication" — can be roasted anonymously.',
    query: `MATCH (u:User {dontreqpreauth: true, enabled: true})
RETURN u.name, u.admincount, u.objectid
ORDER BY u.admincount DESC`,
    tags: ['AS-REP', 'preauth', 'roast'],
  },
  {
    id: 'ca4', category: 'Credential Access', title: 'Users with passwords that never expire',
    description: 'Finds enabled accounts where the password never expires — often old service accounts with weak passwords.',
    query: `MATCH (u:User {enabled: true, pwdneverexpires: true})
WHERE NOT u.objectid ENDS WITH "-502"
  AND NOT u.objectid ENDS WITH "-500"
RETURN u.name, u.admincount, u.lastlogon
ORDER BY u.admincount DESC`,
    tags: ['password-policy', 'weak-creds', 'service-accounts'],
  },

  // ── Discovery ──────────────────────────────────────────────────────────────
  {
    id: 'di1', category: 'Discovery', title: 'All enabled users',
    description: 'Returns all enabled user accounts in the domain.',
    query: `MATCH (u:User {enabled: true})
RETURN u.name, u.domain, u.admincount, u.lastlogon
ORDER BY u.name`,
    tags: ['users', 'enabled', 'enumeration'],
  },
  {
    id: 'di2', category: 'Discovery', title: 'All computers by OS',
    description: 'Lists all computer objects grouped by operating system — useful for identifying EOL targets.',
    query: `MATCH (c:Computer)
RETURN c.operatingsystem, count(c) AS count, collect(c.name)[..5] AS examples
ORDER BY count DESC`,
    tags: ['computers', 'OS', 'EOL'],
  },
  {
    id: 'di3', category: 'Discovery', title: 'All groups and member counts',
    description: 'Returns all groups with their member counts, sorted by size.',
    query: `MATCH (g:Group)<-[:MemberOf]-(n)
RETURN g.name, count(n) AS members
ORDER BY members DESC`,
    tags: ['groups', 'members', 'enumeration'],
  },
  {
    id: 'di4', category: 'Discovery', title: 'Find computers running Windows Server 2008 or older',
    description: 'Identifies legacy Windows Server systems that are likely unpatched and vulnerable.',
    query: `MATCH (c:Computer)
WHERE c.operatingsystem CONTAINS "2008"
   OR c.operatingsystem CONTAINS "2003"
   OR c.operatingsystem CONTAINS "2000"
RETURN c.name, c.operatingsystem, c.enabled
ORDER BY c.operatingsystem`,
    tags: ['legacy', 'EOL', 'unpatched'],
  },
  {
    id: 'di5', category: 'Discovery', title: 'Find all OUs and their GPO links',
    description: 'Maps all Organisational Units and which GPOs are linked to them.',
    query: `MATCH p=(g:GPO)-[:GpLink]->(o:OU)
RETURN g.name AS gpo, o.name AS ou, o.distinguishedname
ORDER BY o.distinguishedname`,
    tags: ['OUs', 'GPO', 'structure'],
  },
  {
    id: 'di6', category: 'Discovery', title: 'Users who have not logged in for 90+ days',
    description: 'Finds stale user accounts — often not monitored but still have valid credentials.',
    query: `MATCH (u:User {enabled: true})
WHERE u.lastlogon < (timestamp() / 1000) - 7776000
  AND u.lastlogon > 0
RETURN u.name, datetime({epochSeconds: toInteger(u.lastlogon)}) AS lastLogon
ORDER BY u.lastlogon ASC`,
    tags: ['stale', 'inactive', 'cleanup'],
  },

  // ── Persistence ────────────────────────────────────────────────────────────
  {
    id: 'ps1', category: 'Persistence', title: 'Find WriteDACL/WriteOwner paths to domain',
    description: 'Principals with WriteDACL or WriteOwner on the domain object can grant themselves DCSync.',
    query: `MATCH p=(n)-[:WriteDACL|WriteOwner]->(d:Domain)
RETURN p`,
    tags: ['WriteDACL', 'WriteOwner', 'domain', 'persistence'],
  },
  {
    id: 'ps2', category: 'Persistence', title: 'GPO write access paths',
    description: 'Finds principals that can modify GPOs — can deploy payloads or create scheduled tasks domain-wide.',
    query: `MATCH p=(n)-[:GenericWrite|GenericAll|WriteOwner|WriteDACL]->(g:GPO)
RETURN p`,
    tags: ['GPO', 'GenericWrite', 'persistence'],
  },
  {
    id: 'ps3', category: 'Persistence', title: 'Accounts with AddMember rights on privileged groups',
    description: 'Principals that can add members to DA/EA groups — can silently backdoor group membership.',
    query: `MATCH p=(n)-[:AddMember|GenericAll|GenericWrite]->(g:Group)
WHERE g.objectid ENDS WITH "-512"
   OR g.objectid ENDS WITH "-519"
RETURN p`,
    tags: ['AddMember', 'DA', 'backdoor'],
  },

  // ── Reconnaissance ────────────────────────────────────────────────────────
  {
    id: 're1', category: 'Reconnaissance', title: 'Map all ACL edges from a specific user',
    description: 'Shows all outbound ACL rights a specific user has across the entire domain. Replace USERNAME.',
    query: `MATCH p=(u:User {name:"USERNAME@DOMAIN.COM"})-[:GenericAll|GenericWrite|WriteOwner|WriteDACL|AddMember|ForceChangePassword|AllExtendedRights]->(t)
RETURN p`,
    tags: ['ACL', 'outbound', 'user-rights'],
  },
  {
    id: 're2', category: 'Reconnaissance', title: 'Find all inbound ACL rights on a computer',
    description: 'Shows which principals have any dangerous ACL right over a specific computer. Replace HOSTNAME.',
    query: `MATCH p=(n)-[:GenericAll|GenericWrite|WriteOwner|WriteDACL|Owns]->(c:Computer {name:"HOSTNAME.DOMAIN.COM"})
RETURN p`,
    tags: ['ACL', 'inbound', 'computer'],
  },
  {
    id: 're3', category: 'Reconnaissance', title: 'All nodes BloodHound has flagged as high value',
    description: 'Returns all objects marked as high value targets in the BloodHound dataset.',
    query: `MATCH (n {highvalue: true})
RETURN n.name, labels(n) AS type, n.domain
ORDER BY labels(n), n.name`,
    tags: ['high-value', 'tier-zero', 'targets'],
  },
  {
    id: 're4', category: 'Reconnaissance', title: 'Count of all object types',
    description: 'Quick summary of how many users, computers, groups, domains, GPOs, and OUs are in the dataset.',
    query: `MATCH (n)
RETURN labels(n) AS type, count(n) AS count
ORDER BY count DESC`,
    tags: ['summary', 'statistics', 'overview'],
  },

  // ── Trusts & Federation ───────────────────────────────────────────────────
  {
    id: 'tf1', category: 'Trusts & Federation', title: 'Map all domain trusts',
    description: 'Returns all trust relationships between domains — shows transitive and non-transitive paths.',
    query: `MATCH p=(d:Domain)-[:TrustedBy|Trusts*1..]->(t:Domain)
RETURN p`,
    tags: ['trusts', 'cross-domain', 'forest'],
  },
  {
    id: 'tf2', category: 'Trusts & Federation', title: 'Foreign principals with local group membership',
    description: 'Finds users from trusted domains that are members of groups in this domain.',
    query: `MATCH (u:User)-[:MemberOf]->(g:Group)
WHERE u.domain <> g.domain
RETURN u.name AS foreignUser, u.domain AS fromDomain, g.name AS localGroup
ORDER BY g.name`,
    tags: ['foreign-principals', 'cross-domain', 'trust-abuse'],
  },
  {
    id: 'tf3', category: 'Trusts & Federation', title: 'Cross-domain admin paths',
    description: 'Finds attack paths from one domain to Domain Admins in a trusted domain.',
    query: `MATCH p=shortestPath((u:User)-[*1..]->(g:Group))
WHERE u.domain <> g.domain
  AND g.objectid ENDS WITH "-512"
RETURN p`,
    tags: ['cross-domain', 'DA', 'trusts', 'shortest-path'],
  },
];

const ALL_CATEGORIES = ['All', ...Object.keys(CAT_COLOR)];

// ── Copy button ───────────────────────────────────────────────────────────────
const CopyBtn = ({ text }) => {
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  };
  return (
    <IconButton
      icon={done ? <CheckIcon boxSize={3} /> : <CopyIcon boxSize={3} />}
      size="sm" variant="ghost" aria-label="Copy query"
      color={done ? '#68D391' : MUTED}
      _hover={{ color: done ? '#68D391' : ACCENT, bg: A_S }}
      onClick={copy}
    />
  );
};

// ── Category badge ─────────────────────────────────────────────────────────────
const CatBadge = ({ cat }) => {
  const s = CAT_COLOR[cat] || { color: MUTED, bg: 'rgba(255,255,255,0.05)', border: BORDER };
  return (
    <Box px={2} py="2px" borderRadius="full" fontSize="9px" fontWeight="bold"
      bg={s.bg} border={`1px solid ${s.border}`} color={s.color}
      textTransform="uppercase" letterSpacing="wider" flexShrink={0}>
      {cat}
    </Box>
  );
};

// ── Query card ─────────────────────────────────────────────────────────────────
const QueryCard = ({ q, isSelected, onSelect }) => {
  const s = CAT_COLOR[q.category] || { color: ACCENT, bg: A_S, border: A_B };
  return (
    <MotionBox
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      px={4} py={3} borderRadius="10px" cursor="pointer"
      bg={isSelected ? `${s.color}10` : CARD}
      border={`1px solid ${isSelected ? s.border : BORDER}`}
      _hover={{ border: `1px solid ${s.border}`, bg: `${s.color}08` }}
      style={{ transition: 'all 0.15s' }}
      onClick={onSelect}>
      <Flex align="flex-start" justify="space-between" gap={2}>
        <Box flex="1" minW={0}>
          <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)" noOfLines={1}>
            {q.title}
          </Text>
          <Text fontSize="11px" color={MUTED} noOfLines={2} mt={0.5} lineHeight="1.5">
            {q.description}
          </Text>
        </Box>
        {isSelected && (
          <Box w="6px" h="6px" borderRadius="full" bg={s.color} mt="4px" flexShrink={0} />
        )}
      </Flex>
      <Flex gap={1.5} mt={2} flexWrap="wrap">
        <CatBadge cat={q.category} />
        {q.tags.slice(0, 3).map(t => (
          <Box key={t} px={1.5} py="1px" borderRadius="4px" fontSize="9px"
            bg="rgba(255,255,255,0.05)" border={`1px solid ${BORDER}`}
            color="rgba(255,255,255,0.35)">
            {t}
          </Box>
        ))}
      </Flex>
    </MotionBox>
  );
};

// ── Main view ──────────────────────────────────────────────────────────────────
const CypherLibraryView = () => {
  const { slug }      = useParams();
  const { getBySlug } = useEngagements();
  const eng           = getBySlug(slug);
  const toast         = useToast();

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(QUERIES[0]);
  const [editMode, setEditMode] = useState(false);
  const [editVal,  setEditVal]  = useState('');

  // Filter queries
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return QUERIES.filter(item => {
      const matchCat = category === 'All' || item.category === category;
      const matchQ   = !q || item.title.toLowerCase().includes(q)
        || item.description.toLowerCase().includes(q)
        || item.tags.some(t => t.includes(q))
        || item.query.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [search, category]);

  const handleSelect = (q) => {
    setSelected(q);
    setEditMode(false);
    setEditVal(q.query);
  };

  const handleCopyToClipboard = () => {
    const text = editMode ? editVal : selected.query;
    navigator.clipboard.writeText(text);
    toast({ title: 'Query copied to clipboard', status: 'success', duration: 1800, isClosable: true });
  };

  const displayQuery = editMode ? editVal : selected?.query || '';
  const catStyle = selected ? (CAT_COLOR[selected.category] || { color: ACCENT, bg: A_S, border: A_B }) : { color: ACCENT, bg: A_S, border: A_B };

  return (
    <Box px={6} pb={12} pt={5}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Cypher <Text as="span" color="red.400">Library</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng?.name} · {QUERIES.length} pre-built BloodHound queries ·{' '}
            <Text as="span" color={ACCENT} fontWeight="semibold">Neo4j Cypher</Text>
          </Text>
        </Box>
      </Flex>

      {/* ── Info banner ──────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px"
        bg="rgba(249,115,22,0.06)" border={`1px solid ${A_B}`}>
        <Flex align="center" gap={2} mb={2}>
          <InfoIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">
            How to use
          </Text>
        </Flex>
        <Flex gap={6} flexWrap="wrap">
          {[
            'Copy a query and paste it into BloodHound\'s Raw Query tab',
            'Edit queries inline to adapt them to your target domain',
            'Replace USERNAME / HOSTNAME / DOMAIN.COM placeholders before running',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Category filter pills ─────────────────────────────────────────────── */}
      <Flex gap={2} mb={4} flexWrap="wrap">
        {ALL_CATEGORIES.map(cat => {
          const active = category === cat;
          const s = cat === 'All'
            ? { color: ACCENT, bg: A_S, border: A_B }
            : (CAT_COLOR[cat] || { color: MUTED, bg: CARD, border: BORDER });
          return (
            <Box key={cat}
              px={3} py="4px" borderRadius="full" fontSize="11px" fontWeight="semibold"
              cursor="pointer" userSelect="none" transition="all 0.15s"
              bg={active ? s.bg : 'rgba(255,255,255,0.03)'}
              border={`1px solid ${active ? s.border : BORDER}`}
              color={active ? s.color : MUTED}
              _hover={{ bg: s.bg, borderColor: s.border, color: s.color }}
              onClick={() => setCategory(cat)}>
              {cat}
              {cat !== 'All' && (
                <Text as="span" ml={1.5} fontSize="9px" opacity={0.7}>
                  {QUERIES.filter(q => q.category === cat).length}
                </Text>
              )}
            </Box>
          );
        })}
      </Flex>

      {/* ── Main two-column layout ────────────────────────────────────────────── */}
      <Flex gap={5} align="flex-start" direction={{ base: 'column', xl: 'row' }}>

        {/* ── Left: query list ─────────────────────────────────────────────── */}
        <Box w={{ base: '100%', xl: '360px' }} flexShrink={0}>

          {/* Search */}
          <Box position="relative" mb={3}>
            <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" zIndex={1} pointerEvents="none">
              <SearchIcon boxSize={3} color={MUTED} />
            </Box>
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search queries…"
              pl="34px" h="36px" fontSize="12px"
              bg={CARD} borderColor={BORDER} borderRadius="8px"
              color="var(--dash-text-primary)"
              _placeholder={{ color: MUTED }}
              _hover={{ borderColor: `${ACCENT}50` }}
              _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}40` }}
            />
          </Box>

          {/* Count */}
          <Text fontSize="10px" color={MUTED} mb={2}>
            {filtered.length} of {QUERIES.length} queries
          </Text>

          {/* List */}
          <Flex direction="column" gap={2}
            maxH="calc(100vh - 340px)" overflowY="auto"
            css={{
              '&::-webkit-scrollbar': { width: '3px' },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(249,115,22,0.25)', borderRadius: '3px' },
            }}>
            <AnimatePresence>
              {filtered.length === 0 ? (
                <Flex align="center" justify="center" py={8} opacity={0.4}>
                  <Text fontSize="12px" color={MUTED}>No queries match your search</Text>
                </Flex>
              ) : (
                filtered.map(q => (
                  <QueryCard key={q.id} q={q}
                    isSelected={selected?.id === q.id}
                    onSelect={() => handleSelect(q)} />
                ))
              )}
            </AnimatePresence>
          </Flex>
        </Box>

        {/* ── Right: query detail ───────────────────────────────────────────── */}
        <Box flex="1" minW={0}>
          {!selected ? (
            <Flex align="center" justify="center" h="300px" opacity={0.4}>
              <Text fontSize="13px" color={MUTED}>Select a query to view details</Text>
            </Flex>
          ) : (
            <MotionBox key={selected.id}
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}>

              {/* Detail card header */}
              <Box px={5} py={4} borderRadius="12px 12px 0 0"
                bg={CARD} border={`1px solid ${BORDER}`}
                borderBottom={`1px solid ${catStyle.border}`}>
                <Flex align="flex-start" justify="space-between" gap={3}>
                  <Box flex="1" minW={0}>
                    <Flex align="center" gap={2} mb={1.5} flexWrap="wrap">
                      <CatBadge cat={selected.category} />
                      {selected.tags.map(t => (
                        <Box key={t} px={1.5} py="1px" borderRadius="4px" fontSize="9px"
                          bg="rgba(255,255,255,0.05)" border={`1px solid ${BORDER}`}
                          color="rgba(255,255,255,0.35)">
                          {t}
                        </Box>
                      ))}
                    </Flex>
                    <Text fontSize="15px" fontWeight="bold" color="var(--dash-text-primary)">
                      {selected.title}
                    </Text>
                    <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1} lineHeight="1.6">
                      {selected.description}
                    </Text>
                  </Box>
                </Flex>
              </Box>

              {/* Query code area */}
              <Box borderRadius="0 0 12px 12px" overflow="hidden"
                border={`1px solid ${BORDER}`} borderTop="none">

                {/* Toolbar */}
                <Flex align="center" justify="space-between" px={4} py={2}
                  bg="rgba(0,0,0,0.3)" borderBottom={`1px solid ${BORDER}`}>
                  <Flex align="center" gap={2}>
                    {/* Traffic lights */}
                    <Box w="10px" h="10px" borderRadius="full" bg="rgba(252,95,95,0.6)" />
                    <Box w="10px" h="10px" borderRadius="full" bg="rgba(250,173,20,0.6)" />
                    <Box w="10px" h="10px" borderRadius="full" bg="rgba(45,195,75,0.6)" />
                    <Text fontSize="10px" color={MUTED} ml={2} fontFamily="mono">cypher</Text>
                  </Flex>
                  <Flex align="center" gap={1}>
                    <Button size="xs" variant="ghost" fontSize="10px" borderRadius="6px"
                      color={editMode ? ACCENT : MUTED}
                      border={`1px solid ${editMode ? A_B : 'rgba(255,255,255,0.08)'}`}
                      bg={editMode ? A_S : 'transparent'}
                      _hover={{ color: ACCENT, bg: A_S, borderColor: A_B }}
                      onClick={() => { setEditMode(p => !p); setEditVal(selected.query); }}>
                      {editMode ? 'Lock' : 'Edit'}
                    </Button>
                    <Button size="xs" variant="ghost" fontSize="10px" borderRadius="6px"
                      color={ACCENT} border={`1px solid ${A_B}`} bg={A_S}
                      _hover={{ bg: ACCENT, color: 'black' }} transition="all 0.15s"
                      leftIcon={<CopyIcon boxSize={2.5} />}
                      onClick={handleCopyToClipboard}>
                      Copy Query
                    </Button>
                  </Flex>
                </Flex>

                {/* Code */}
                {editMode ? (
                  <Textarea
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    fontFamily="'Fira Code', 'Cascadia Code', 'Consolas', monospace"
                    fontSize="13px" lineHeight="1.7"
                    bg="#0d1117" color="#e6edf3"
                    border="none" borderRadius="0"
                    resize="none"
                    minH="220px"
                    p={5}
                    spellCheck={false}
                    _focus={{ boxShadow: 'none', border: 'none' }}
                    sx={{
                      '&::-webkit-scrollbar': { width: '4px' },
                      '&::-webkit-scrollbar-thumb': { background: 'rgba(249,115,22,0.3)', borderRadius: '4px' },
                    }}
                  />
                ) : (
                  <Box
                    as="pre"
                    fontFamily="'Fira Code', 'Cascadia Code', 'Consolas', monospace"
                    fontSize="13px" lineHeight="1.7"
                    bg="#0d1117" color="#e6edf3"
                    p={5} m={0}
                    minH="220px"
                    overflowX="auto"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                    sx={{
                      '&::-webkit-scrollbar': { height: '4px' },
                      '&::-webkit-scrollbar-thumb': { background: 'rgba(249,115,22,0.3)', borderRadius: '4px' },
                      // Cypher keyword highlighting via CSS
                      '& .kw': { color: '#ff7b72' },
                    }}>
                    <CypherHighlight query={displayQuery} />
                  </Box>
                )}
              </Box>

              {/* Pro tip */}
              {selected.query.includes('USERNAME') || selected.query.includes('HOSTNAME') || selected.query.includes('DOMAIN.COM') ? (
                <Box mt={3} px={4} py={2.5} borderRadius="8px"
                  bg="rgba(236,201,75,0.07)" border="1px solid rgba(236,201,75,0.2)">
                  <Flex align="center" gap={2}>
                    <Box w="4px" h="4px" borderRadius="full" bg="#ECC94B" flexShrink={0} />
                    <Text fontSize="11px" color="rgba(236,201,75,0.85)">
                      This query contains placeholders. Replace{' '}
                      {[
                        selected.query.includes('USERNAME') && <Text as="span" fontFamily="mono" fontWeight="bold">USERNAME@DOMAIN.COM</Text>,
                        selected.query.includes('HOSTNAME') && <Text as="span" fontFamily="mono" fontWeight="bold">HOSTNAME.DOMAIN.COM</Text>,
                        selected.query.includes('DOMAIN.COM') && !selected.query.includes('USERNAME') && !selected.query.includes('HOSTNAME') && <Text as="span" fontFamily="mono" fontWeight="bold">DOMAIN.COM</Text>,
                      ].filter(Boolean).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ' and ', el], [])}
                      {' '}before running. Use Edit mode to adapt.
                    </Text>
                  </Flex>
                </Box>
              ) : null}
            </MotionBox>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

// ── Cypher syntax highlighter (pure JSX, no lib needed) ───────────────────────
const KEYWORDS = ['MATCH','WHERE','RETURN','WITH','AS','AND','OR','NOT','IN','ENDS','STARTS','CONTAINS',
  'OPTIONAL','CREATE','SET','DELETE','DETACH','MERGE','UNWIND','FOREACH','CALL','YIELD',
  'DISTINCT','ORDER','BY','ASC','DESC','LIMIT','SKIP','CASE','WHEN','THEN','ELSE','END',
  'true','false','null','count','collect','toInteger','timestamp','datetime','labels','shortestPath'];

const KEYWORD_RE = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'g');

const CypherHighlight = ({ query }) => {
  if (!query) return null;
  const lines = query.split('\n');
  return (
    <>
      {lines.map((line, li) => {
        const parts = [];
        let last = 0;
        let m;
        KEYWORD_RE.lastIndex = 0;
        while ((m = KEYWORD_RE.exec(line)) !== null) {
          if (m.index > last) parts.push(<span key={`t${li}-${last}`}>{line.slice(last, m.index)}</span>);
          parts.push(<span key={`k${li}-${m.index}`} style={{ color: '#ff7b72', fontWeight: 600 }}>{m[0]}</span>);
          last = m.index + m[0].length;
        }
        if (last < line.length) parts.push(<span key={`t${li}-end`}>{line.slice(last)}</span>);
        return <div key={li}>{parts.length ? parts : '\u00A0'}</div>;
      })}
    </>
  );
};

export default CypherLibraryView;
