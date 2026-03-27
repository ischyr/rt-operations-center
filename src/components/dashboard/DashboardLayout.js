import { Flex, Box } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import DashboardView from './views/DashboardView';
import SettingsView from './views/SettingsView';
import EngagementsView from './views/EngagementsView';
import EngagementLayout from './EngagementLayout';
import RedTeamMapView from './views/RedTeamMapView';
import ADAttackMapView from './views/ADAttackMapView';
import PayloadMapView from './views/PayloadMapView';
import LabConfigsView from './views/LabConfigsView';
import LabConnectivityView from './views/LabConnectivityView';
import PlaceholderView from './views/PlaceholderView';
import CVEFeedView from './views/CVEFeedView';
import RansomFeedView from './views/RansomFeedView';
import EmailLeaksView from './views/EmailLeaksView';
import DiagramEditorView from './views/DiagramEditorView';
import DiagramLibraryView from './views/DiagramLibraryView';
import ToolsView from './views/ToolsView';
import MalwareScannerView from './views/MalwareScannerView';

const MotionFlex = motion(Flex);

const DashboardLayout = () => (
  <MotionFlex
    h="100vh" overflow="hidden" bg="var(--dash-bg)"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.45, ease: 'easeOut' }}
  >
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
          <Route index              element={<DashboardView />} />
          <Route path="engagements" element={<EngagementsView />} />
          <Route path="settings"    element={<SettingsView />} />
          {/* Cheatsheet routes */}
          <Route path="cheatsheet/red-team-map" element={<RedTeamMapView />} />
          <Route path="cheatsheet/ad-map"       element={<ADAttackMapView />} />
          <Route path="cheatsheet/payload-map"  element={<PayloadMapView />} />
          {/* Red Lab routes */}
          <Route path="lab/configs"      element={<LabConfigsView />} />
          <Route path="lab/connectivity" element={<LabConnectivityView />} />
          {/* Resources & Materials routes */}
          <Route path="resources/tools"        element={<ToolsView />} />
          <Route path="resources/cve-feed"    element={<CVEFeedView />} />
          <Route path="resources/ransom-feed"   element={<RansomFeedView />} />
          <Route path="resources/email-leaks"  element={<EmailLeaksView />} />
          {/* Malware Analysis routes */}
          <Route path="malware/scanner" element={<MalwareScannerView />} />
          <Route path="malware/reports" element={<PlaceholderView title="Analysis Reports" />} />
          {/* Diagram Drawing routes */}
          <Route path="diagrams/editor"  element={<DiagramEditorView />} />
          <Route path="diagrams/library" element={<DiagramLibraryView />} />
          {/* All per-engagement routes live under /:slug/* */}
          <Route path=":slug/*"     element={<EngagementLayout />} />
        </Routes>
      </Box>
    </Flex>
  </MotionFlex>
);

export default DashboardLayout;
