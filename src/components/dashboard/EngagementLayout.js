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
import ReverseShellView from './views/ReverseShellView';
import DomainReconView from './views/DomainReconView';
import AssumedBreachView from './views/AssumedBreachView';
import OperatorSessionsView from './views/OperatorSessionsView';
import AttackRelayView from './views/AttackRelayView';
import LeaksCredentialsView from './views/LeaksCredentialsView';
import BingoView from './views/BingoView';
import UsernameGeneratorView from './views/UsernameGeneratorView';
import TyposquatView from './views/TyposquatView';
import EmailsView from './views/EmailsView';
import DocumentsView from './views/DocumentsView';
import FileMetaView from './views/FileMetaView';
import WordlistView from './views/WordlistView';
import DeviceCodePhishingView from './views/DeviceCodePhishingView';
import GraphResultView from './views/GraphResultView';
import PassCookieView from './views/PassCookieView';
import EvilOAuthView from './views/EvilOAuthView';
import MfaPushView from './views/MfaPushView';
import ReportsView from './views/ReportsView';
import PlaceholderView from './views/PlaceholderView';
import WhiteTeamView from './views/WhiteTeamView';
import WebhookAlerterView from './views/WebhookAlerterView';
import SocialMediaView from './views/SocialMediaView';
import NetworkScannerView from './views/NetworkScannerView';
import WebserverEnumView  from './views/WebserverEnumView';
import DomainFlyoverView  from './views/DomainFlyoverView';
import BloodHoundView from './views/BloodHoundView';
import CypherLibraryView from './views/CypherLibraryView';
import RedirectorChainView from './views/RedirectorChainView';
import CardGenerationView from './views/CardGenerationView';
import FakeTeamsView from './views/FakeTeamsView';
import OrgChartView from './views/OrgChartView';
import KerberosView from './views/KerberosView';
import CVEResearchView from './views/CVEResearchView';
import ADGrapherView from './views/ADGrapherView';

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
      <Route path="operations/sessions"       element={<OperatorSessionsView />} />
      <Route path="operations/attack-relay"   element={<AttackRelayView />} />
      <Route path="operations/bingo"          element={<BingoView />} />
      <Route path="operations/assumed-breach" element={<AssumedBreachView />} />

      {/* Team */}
      <Route path="team/people"    element={<PeopleSkillsView />} />
      <Route path="team/resources" element={<ResourcesView />} />

      {/* Intelligence */}
      <Route path="intelligence/loot-tracker"    element={<LootTrackerView />} />
      <Route path="intelligence/evidence-vault"  element={<EvidenceVaultView />} />
      <Route path="intelligence/cleanup-tracker" element={<CleanupTrackerView />} />
      <Route path="intelligence/cve-research"   element={<CVEResearchView />} />
      <Route path="intelligence/c2"              element={<C2View />} />
      <Route path="intelligence/phishing"        element={<PhishingView />} />
      <Route path="intelligence/reverse-shells"        element={<ReverseShellView />} />
      <Route path="intelligence/device-code-phishing"                          element={<DeviceCodePhishingView />} />
      <Route path="intelligence/device-code-phishing/:category/:querySlug"    element={<GraphResultView />} />
      <Route path="intelligence/pass-cookie"                                   element={<PassCookieView />} />
      <Route path="intelligence/evil-oauth"                                    element={<EvilOAuthView />} />
      <Route path="intelligence/mfa-push"                                     element={<MfaPushView />} />
      <Route path="intelligence/ad-grapher"                                    element={<ADGrapherView />} />

      {/* Builders */}
      <Route path="builders/username-gen"      element={<UsernameGeneratorView />} />
      <Route path="builders/typosquat"         element={<TyposquatView />} />
      <Route path="builders/qr-codes"          element={<QRCodeView />} />
      <Route path="builders/wordlist-gen"      element={<WordlistView />} />
      <Route path="builders/redirector-chain"  element={<RedirectorChainView />} />
      <Route path="builders/card-generation"  element={<CardGenerationView />} />
      <Route path="builders/fake-teams"       element={<FakeTeamsView />} />

      {/* Sock Puppets */}
      <Route path="sockpuppets/personas"     element={<PersonasView />} />
      <Route path="sockpuppets/social-media" element={<SocialMediaView />} />

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
      <Route path="pillaging/domain-recon" element={<DomainReconView />} />
      <Route path="pillaging/subdomains"   element={<SubdomainsView />} />
      <Route path="pillaging/services"        element={<NetworkScannerView />} />
      <Route path="pillaging/webserver-enum"  element={<WebserverEnumView />} />
      <Route path="pillaging/domain-flyover"  element={<DomainFlyoverView />} />
      <Route path="pillaging/credentials" element={<LeaksCredentialsView />} />
      <Route path="pillaging/kerberos"    element={<KerberosView />} />
      <Route path="pillaging/emails"      element={<EmailsView />} />
      <Route path="pillaging/documents"   element={<DocumentsView />} />
      <Route path="pillaging/file-meta"   element={<FileMetaView />} />
      {/* BLOODHOUND */}
      <Route path="bloodhound/analyzer"       element={<BloodHoundView />} />
      <Route path="bloodhound/cypher-library" element={<CypherLibraryView />} />

      {/* OSINT */}
      <Route path="osint/emails"    element={<EmailsView />} />
      <Route path="osint/org-chart" element={<OrgChartView />} />

      {/* COMMS */}
      <Route path="comms/white-team"      element={<WhiteTeamView />} />
      <Route path="comms/webhook-alerter" element={<WebhookAlerterView />} />

      {/* Reporting */}
      <Route path="reporting/reports"                  element={<ReportsView />} />
      <Route path="reporting/findings"                 element={<FindingsView />} />
      <Route path="reporting/findings/:findingId"      element={<FindingDetailView />} />
      <Route path="reporting/client-portal"            element={<ClientPortalView />} />
    </Routes>
  );
};

export default EngagementLayout;
