import { Container } from '@chakra-ui/react';
import DashboardHeader from './DashboardHeader';
import TelemetryOverview from './TelemetryOverview';

const Dashboard = () => (
  <Container maxW="container.md" py={10}>
    <DashboardHeader />
    <TelemetryOverview />
  </Container>
);

export default Dashboard;
