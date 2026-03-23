import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';

const PlaceholderView = ({ title, description }) => (
  <Flex h="60vh" align="center" justify="center">
    <Box textAlign="center">
      <Flex
        w="56px" h="56px" borderRadius="14px"
        bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.2)"
        align="center" justify="center" mx="auto" mb={4}
      >
        <TimeIcon boxSize={5} color="red.400" />
      </Flex>
      <Heading fontSize="xl" fontWeight="bold" color="white" mb={2}>{title}</Heading>
      <Text fontSize="sm" color="gray.500" maxW="300px">
        {description || 'This module is under construction. Check back soon.'}
      </Text>
    </Box>
  </Flex>
);

export default PlaceholderView;
