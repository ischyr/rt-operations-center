import { Box, Stack } from '@chakra-ui/react';
import OperatorsIntro from './operators/OperatorsIntro';
import OperatorShapes from './operators/OperatorShapes';
import OperatorCard from './operators/OperatorCard';

// ── Add / edit your team members here ────────────────────────────────────────
const operators = [
  {
    callsign: 'Marcus Halloway',
    realName: 'Lead Red Team Operator',
    image: '',
    aliases: ['Ghost', 'Specter'],
    firstActive: '2019',
    latestActivity: 'Present',
    languages: ['English', 'Spanish'],
    geography: ['Europe', 'Middle East'],
    focus: ['Adversary Emulation', 'C2 Development'],
    motivation: ['Espionage Sim', 'Research'],
    skillset: ['Linux', 'Windows', 'Python', 'C++', 'PowerShell'],
    toolset: ['Cobalt Strike', 'Havoc', 'BloodHound', 'Burp Suite'],
    writeup:
      'Phantom is a senior red team operator with a deep background in adversary emulation and offensive tooling development. Specialising in long-term persistence and stealthy lateral movement, they have led engagements across financial, government, and critical infrastructure sectors.',
    tradecraft:
      'Primarily relies on living-off-the-land techniques combined with custom implants to evade modern EDR solutions. Expert in Active Directory abuse, credential harvesting, and C2 infrastructure obfuscation.',
  },
  {
    callsign: 'Dimitri Volkov',
    realName: 'Web & Cloud Specialist',
    image: '',
    aliases: ['Viper', 'NS'],
    firstActive: '2020',
    latestActivity: 'Present',
    languages: ['English', 'French'],
    geography: ['Europe', 'North America'],
    focus: ['Web Application', 'Cloud Security'],
    motivation: ['Intelligence Gathering', 'Exploitation'],
    skillset: ['Python', 'JavaScript', 'AWS', 'Docker', 'Burp Suite'],
    toolset: ['Nuclei', 'ffuf', 'SQLMap', 'Prowler', 'ScoutSuite'],
    writeup:
      "Nightshade focuses on web application and cloud penetration testing, with extensive experience hunting logic flaws and misconfigurations across AWS, Azure, and GCP environments. A core contributor to the team's internal tooling library.",
    tradecraft:
      'Leverages automated recon pipelines combined with deep manual testing to identify high-impact vulnerabilities. Skilled at chaining low-severity findings into critical attack paths against cloud-native architectures.',
  },
  {
    callsign: 'Sofia Marquez',
    realName: 'OSINT & Recon Lead',
    image: '',
    aliases: ['Wolf', 'Alpha'],
    firstActive: '2021',
    latestActivity: 'Present',
    languages: ['English', 'German'],
    geography: ['Europe', 'Global'],
    focus: ['OSINT', 'Social Engineering'],
    motivation: ['Tactical Disruption', 'Awareness'],
    skillset: ['Maltego', 'Shodan', 'Recon-ng', 'Python', 'OPSEC'],
    toolset: ['SpiderFoot', 'theHarvester', 'Evilginx', 'GoPhish'],
    writeup:
      'Wolfpack leads all reconnaissance and OSINT operations for the team, building comprehensive target profiles from open sources before any active engagement begins. Known for highly convincing social engineering campaigns that bypass technical controls through the human layer.',
    tradecraft:
      'Combines passive intelligence gathering with precision phishing campaigns tailored to target personas. Specialises in pretexting, vishing, and credential harvesting infrastructure to simulate real-world initial access scenarios.',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const Operators = () => (
  <Box position="relative" w="100%" py={{ base: 8, md: 12 }}>
    <Box
      pos="absolute"
      inset="0"
      bgImage="radial-gradient(circle at 15% 25%, rgba(255, 0, 0, 0.2), transparent 40%), radial-gradient(circle at 85% 20%, rgba(90, 20, 20, 0.25), transparent 50%)"
      opacity={0.4}
      zIndex={-2}
    />
    <OperatorShapes />
    <Stack spacing={10} align="center" zIndex={1}>
      <OperatorsIntro />
      <Stack spacing={10} w="100%">
        {operators.map((op) => (
          <OperatorCard key={op.callsign} {...op} />
        ))}
      </Stack>
    </Stack>
  </Box>
);

export default Operators;
