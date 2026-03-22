import { Card, Heading, Text } from '@chakra-ui/react';
import { commonCard } from '../../../styles/cardStyles';

const OperatorCard = ({ name }) => (
  <Card sx={commonCard} p={4}>
    <Heading size="md">{name}</Heading>
    <Text>Active missions, status: live, command stack ready.</Text>
  </Card>
);

export default OperatorCard;
