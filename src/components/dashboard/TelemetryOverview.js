import { Card, CardBody, Stack, Heading, Text } from '@chakra-ui/react';
import { commonCard } from '../../styles/cardStyles';

const stats = [
  { label: 'Breach attempts', value: 14 },
  { label: 'Active targets', value: 7 },
  { label: 'Phishing vectors', value: 2 },
  { label: 'Alerts', value: 21 },
];

const TelemetryOverview = () => (
  <Card sx={commonCard}>
    <CardBody>
      <Heading size="md" mb={3}>Telemetry Overview</Heading>
      <Stack spacing={2}>
        {stats.map((stat) => (
          <Text key={stat.label}>• {stat.label}: {stat.value}</Text>
        ))}
      </Stack>
    </CardBody>
  </Card>
);

export default TelemetryOverview;
