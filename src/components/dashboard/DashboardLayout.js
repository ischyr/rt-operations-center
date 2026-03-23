import { Flex, Box } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import DashboardView from './views/DashboardView';
import PlaceholderView from './views/PlaceholderView';

const DashboardLayout = () => (
  <Flex h="100vh" overflow="hidden" bg="#111111">
    <Sidebar />
    <Flex direction="column" flex="1" overflow="hidden">
      <TopBar />
      <Box flex="1" overflowY="auto" p={6}
        css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '4px' },
        }}
      >
        <Routes>
          <Route index                   element={<DashboardView />} />
          <Route path="engagements"      element={<PlaceholderView title="Engagements" />} />
          <Route path="calendar"         element={<PlaceholderView title="Calendar" />} />
          <Route path="skill-requests"   element={<PlaceholderView title="Skill Requests" />} />
          <Route path="ttx"              element={<PlaceholderView title="TTX Planner" />} />
          <Route path="campaign"         element={<PlaceholderView title="Campaign Builder" />} />
          <Route path="people"           element={<PlaceholderView title="People & Skills" />} />
          <Route path="resources"        element={<PlaceholderView title="Resources" />} />
          <Route path="loot"             element={<PlaceholderView title="Loot Tracker" />} />
          <Route path="evidence"         element={<PlaceholderView title="Evidence Vault" />} />
          <Route path="cleanup"          element={<PlaceholderView title="Cleanup Tracker" />} />
          <Route path="c2"               element={<PlaceholderView title="C2 Infrastructure" />} />
          <Route path="phishing"         element={<PlaceholderView title="Phishing Infrastructure" />} />
          <Route path="ttps/initial-access"   element={<PlaceholderView title="Initial Access" />} />
          <Route path="ttps/windows"          element={<PlaceholderView title="Windows" />} />
          <Route path="ttps/linux"            element={<PlaceholderView title="Linux" />} />
          <Route path="ttps/active-directory" element={<PlaceholderView title="Active Directory" />} />
          <Route path="ttps/network"          element={<PlaceholderView title="Network" />} />
          <Route path="pillaging/subdomains"  element={<PlaceholderView title="Subdomains" />} />
          <Route path="pillaging/services"    element={<PlaceholderView title="Services" />} />
          <Route path="pillaging/leaks"       element={<PlaceholderView title="Leaks" />} />
          <Route path="pillaging/credentials" element={<PlaceholderView title="Credentials" />} />
          <Route path="pillaging/emails"      element={<PlaceholderView title="Emails" />} />
          <Route path="pillaging/documents"   element={<PlaceholderView title="Documents" />} />
          <Route path="reports"               element={<PlaceholderView title="Reports" />} />
          <Route path="findings"              element={<PlaceholderView title="Findings" />} />
          <Route path="client-portal"         element={<PlaceholderView title="Client Portal" />} />
        </Routes>
      </Box>
    </Flex>
  </Flex>
);

export default DashboardLayout;
