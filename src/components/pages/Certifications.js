import { Box, Stack, SimpleGrid } from '@chakra-ui/react';
import CertificationsIntro from './certifications/CertificationsIntro';
import ImprovementSection from './certifications/ImprovementSection';
import CertCard from './certifications/CertCard';
import CertShapes from './certifications/CertShapes';

// Add your certifications here.
// Provide an `image` URL for the badge graphic, and a `fullName` for the label below.
const certifications = [
  {
    title: 'OSCE³',
    fullName: 'Offensive Security Certified Expert',
    image: '/badges/osce.png',
  },
  {
    title: 'OSWE',
    fullName: 'Offensive Security Web Expert (OSWE)',
    image: '/badges/oswe.png',
  },
  {
    title: 'OSEP',
    fullName: 'Offensive Security Expert Penetration Tester (OSEP)',
    image: '/badges/osep.png',
  },
  {
    title: 'OSED',
    fullName: 'Offensive Security Exploit Developer (OSED)',
    image: '/badges/osed.png',
  },
  {
    title: 'OSCP',
    fullName: 'Offensive Security Certified Professional (OSCP)',
    image: '/badges/oscp.png',
  },
  {
    title: 'CRTO',
    fullName: 'Certified Red Team Operator (CRTO)',
    image: '/badges/crto.png',
  },
  {
    title: 'PNPT',
    fullName: 'Practical Network Penetration Tester (PNPT)',
    image: '/badges/pnpt.png',
  },
  {
    title: 'CRTA',
    fullName: 'Certified Red Team Analyst (CRTA)',
    image: '/badges/crta.png',
  },
  {
    title: 'CPTS',
    fullName: 'HTB Certified Penetration Testing Specialist (CPTS)',
    image: '/badges/cpts.png',
  },
  {
    title: 'CNPen',
    fullName: 'Certified Network Penetration Tester (CNPen)',
    image: '/badges/cnpen.png',
  },
  {
    title: 'C-ADPenX',
    fullName: 'Certified Advanced Active Directory Penetration Expert (C-ADPenX)',
    image: '/badges/cadpenx.png',
  },
  {
    title: 'eCPPT',
    fullName: 'eLearnSecurity Certified Professional Penetration Tester (eCPPT)',
    image: '/badges/ecppt.png',
  },
  {
    title: 'PJPT',
    fullName: 'Practical Junior Penetration Tester (PJPT)',
    image: '/badges/pjpt.png',
  },
  {
    title: 'PMPA',
    fullName: 'Practical Malware Analysis & Triage (PMPA)',
    image: '/badges/pmpa.png',
  },
  {
    title: 'PWPA',
    fullName: 'Practical Web Penetration Testing Associate (PWPA)',
    image: '/badges/pwpa.png',
  },
  {
    title: 'W200',
    fullName: 'ASYNC Certified Associate Penetration Tester (W200)',
    image: '/badges/w200.png',
  },
];

const Certifications = () => (
  <Box position="relative" w="100%" py={{ base: 8, md: 12 }}>
    <Box
      pos="absolute"
      inset="0"
      bgImage="radial-gradient(circle at 15% 25%, rgba(255, 0, 0, 0.2), transparent 40%), radial-gradient(circle at 85% 20%, rgba(90, 20, 20, 0.25), transparent 50%)"
      opacity={0.4}
      zIndex={-2}
    />
    <CertShapes />
    <Stack spacing={12} align="center" zIndex={1}>
      <CertificationsIntro />
      <SimpleGrid
        columns={{ base: 1, sm: 2, md: 3 }}
        spacing={{ base: 6, md: 10 }}
        justifyItems="center"
        w="100%"
        maxW="860px"
      >
        {certifications.map((cert) => (
          <CertCard key={cert.title} {...cert} />
        ))}
      </SimpleGrid>
      <ImprovementSection />
    </Stack>
  </Box>
);

export default Certifications;
