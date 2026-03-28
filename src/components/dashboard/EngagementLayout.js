import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useEngagements } from '../../contexts/EngagementContext';
import EngagementDetailView from './views/EngagementDetailView';
import ResourcesView from './views/ResourcesView';
import PeopleSkillsView from './views/PeopleSkillsView';
import FindingsView from './views/FindingsView';
import FindingDetailView from './views/FindingDetailView';
import ActivityView from './views/ActivityView';
import CalendarView from './views/CalendarView';
import SkillRequestsView from './views/SkillRequestsView';
import TTXPlannerView from './views/TTXPlannerView';
import PersonasView from './views/PersonasView';
import C2View from './views/C2View';
import LootTrackerView from './views/LootTrackerView';
import EvidenceVaultView from './views/EvidenceVaultView';
import CleanupTrackerView from './views/CleanupTrackerView';
import SubdomainsView from './views/SubdomainsView';
import TeamVaultView from './views/TeamVaultView';
import QRCodeView from './views/QRCodeView';
import PhishingView from './views/PhishingView';
import ClientPortalView from './views/ClientPortalView';
import TTPsView from './views/TTPsView';
import TTPDetailView from './views/TTPDetailView';
import PlaceholderView from './views/PlaceholderView';

const NotFound = ({ slug }) => {
  const navigate = useNavigate();
  return (
    <Flex direction="column" align="center" justify="center" h="60vh" gap={4}>
      <Text fontSize="4xl">🔍</Text>
      <Text fontWeight="bold" color="var(--dash-text-primary)">Engagement not found</Text>
      <Text fontSize="sm" color="var(--dash-text-muted)">The operation "{slug}" does not exist.</Text>
      <Button size="sm" leftIcon={<ChevronLeftIcon />}
        variant="ghost" color="var(--dash-text-secondary)"
        _hover={{ color: 'white' }} onClick={() => navigate('/dashboard/engagements')}>
        Back to Engagements
      </Button>
    </Flex>
  );
};

const EngagementLayout = () => {
  const { slug } = useParams();
  const { getBySlug, loading } = useEngagements();
  const eng = getBySlug(slug);

  if (loading) return (
    <Flex align="center" justify="center" h="60vh">
      <Text fontSize="sm" color="var(--dash-text-muted)">Loading...</Text>
    </Flex>
  );
  if (!eng) return <NotFound slug={slug} />;

  return (
    <Routes>
      <Route index element={<EngagementDetailView />} />

      {/* Operations */}
      <Route path="operations/activity"       element={<ActivityView />} />
      <Route path="operations/calendar"       element={<CalendarView />} />
      <Route path="operations/skill-requests" element={<SkillRequestsView />} />
      <Route path="operations/ttx"            element={<TTXPlannerView />} />
      <Route path="operations/team-vault"     element={<TeamVaultView />} />

      {/* Team */}
      <Route path="team/people"    element={<PeopleSkillsView />} />
      <Route path="team/resources" element={<ResourcesView />} />

      {/* Intelligence */}
      <Route path="intelligence/loot-tracker"    element={<LootTrackerView />} />
      <Route path="intelligence/evidence-vault"  element={<EvidenceVaultView />} />
      <Route path="intelligence/cleanup-tracker" element={<CleanupTrackerView />} />
      <Route path="intelligence/c2"              element={<C2View />} />
      <Route path="intelligence/phishing"        element={<PhishingView />} />
      <Route path="intelligence/qr-codes"       element={<QRCodeView />} />

      {/* Sock Puppets */}
      <Route path="sockpuppets/personas"     element={<PersonasView />} />
      <Route path="sockpuppets/social-media" element={<PlaceholderView title="Social Media" />} />

      {/* TTPs */}
      <Route path="ttps/initial-access"            element={<TTPsView category="initial-access" />} />
      <Route path="ttps/initial-access/:ttpId"     element={<TTPDetailView category="initial-access" />} />
      <Route path="ttps/windows"                   element={<TTPsView category="windows" />} />
      <Route path="ttps/windows/:ttpId"            element={<TTPDetailView category="windows" />} />
      <Route path="ttps/linux"                     element={<TTPsView category="linux" />} />
      <Route path="ttps/linux/:ttpId"              element={<TTPDetailView category="linux" />} />
      <Route path="ttps/active-directory"          element={<TTPsView category="active-directory" />} />
      <Route path="ttps/active-directory/:ttpId"   element={<TTPDetailView category="active-directory" />} />
      <Route path="ttps/network"                   element={<TTPsView category="network" />} />
      <Route path="ttps/network/:ttpId"            element={<TTPDetailView category="network" />} />

      {/* Pillaging */}
      <Route path="pillaging/subdomains"  element={<SubdomainsView />} />
      <Route path="pillaging/services"    element={<PlaceholderView title="Services" />} />
      <Route path="pillaging/leaks"       element={<PlaceholderView title="Leaks" />} />
      <Route path="pillaging/credentials" element={<PlaceholderView title="Credentials" />} />
      <Route path="pillaging/emails"      element={<PlaceholderView title="Emails" />} />
      <Route path="pillaging/documents"   element={<PlaceholderView title="Documents" />} />

      {/* Reporting */}
      <Route path="reporting/reports"                  element={<PlaceholderView title="Reports" />} />
      <Route path="reporting/findings"                 element={<FindingsView />} />
      <Route path="reporting/findings/:findingId"      element={<FindingDetailView />} />
      <Route path="reporting/client-portal"            element={<ClientPortalView />} />
    </Routes>
  );
};

export default EngagementLayout;
