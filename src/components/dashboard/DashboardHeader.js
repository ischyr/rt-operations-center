import { Card, CardBody, Stack, Heading, Text, Badge, Button } from '@chakra-ui/react';
import { commonCard } from '../../styles/cardStyles';
import { useAuth } from '../../contexts/AuthContext';

const DashboardHeader = () => {
  const { activeUser, logout } = useAuth();

  return (
    <Card sx={commonCard} mb={4}>
      <CardBody>
        <Stack spacing={5}>
          <Heading size="lg">⚔ Operations Center</Heading>
          <Text>
            Active operator: <Badge colorScheme="red">{activeUser}</Badge>
          </Text>
          <Text color="gray.300">
            Mission telemetry and breach indicators are live. Maintain secure posture.
          </Text>
          <Button colorScheme="white" onClick={logout}>Logout</Button>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default DashboardHeader;
