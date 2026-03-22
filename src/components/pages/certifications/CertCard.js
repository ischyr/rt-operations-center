import { Box, Image, Text, Heading } from '@chakra-ui/react';

const CertCard = ({ image, title, fullName }) => (
  <Box
    display="flex"
    flexDir="column"
    alignItems="center"
    textAlign="center"
    p={4}
    transition="transform 0.24s ease"
    _hover={{ transform: 'translateY(-6px)' }}
  >
    {image ? (
      <Image
        src={image}
        alt={title}
        boxSize={{ base: '130px', md: '160px' }}
        objectFit="contain"
        mb={4}
        draggable={false}
      />
    ) : (
      <Box
        w={{ base: '130px', md: '160px' }}
        h={{ base: '130px', md: '160px' }}
        mb={4}
        borderRadius="16px"
        bg="rgba(255,80,95,0.15)"
        border="1px solid rgba(255,80,95,0.35)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Heading fontSize="2xl" color="red.300">{title}</Heading>
      </Box>
    )}
    <Text fontWeight="bold" color="white" fontSize="sm" maxW="140px" lineHeight="short">
      {fullName}
    </Text>
  </Box>
);

export default CertCard;
