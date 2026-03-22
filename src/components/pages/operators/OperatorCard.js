import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Badge,
  Wrap,
  WrapItem,
  Image,
  Divider,
} from '@chakra-ui/react';

const TagGroup = ({ label, items }) => (
  <Box>
    <Text fontSize="10px" fontWeight="bold" letterSpacing="wider" color="gray.500" mb={1} textTransform="uppercase">
      {label}
    </Text>
    <Wrap spacing={1}>
      {items.map((item) => (
        <WrapItem key={item}>
          <Badge
            fontSize="11px"
            fontWeight="normal"
            px={2}
            py="2px"
            borderRadius="4px"
            bg="rgba(255,255,255,0.06)"
            border="1px solid rgba(255,255,255,0.12)"
            color="gray.200"
          >
            {item}
          </Badge>
        </WrapItem>
      ))}
    </Wrap>
  </Box>
);

const ToolTag = ({ label }) => (
  <Badge
    fontSize="11px"
    fontWeight="normal"
    px={2}
    py="2px"
    borderRadius="4px"
    bg="rgba(255,80,95,0.08)"
    border="1px solid rgba(255,80,95,0.25)"
    color="red.200"
  >
    {label}
  </Badge>
);

const OperatorCard = ({
  callsign,
  realName,
  image,
  aliases,
  firstActive,
  latestActivity,
  languages,
  geography,
  focus,
  motivation,
  skillset,
  toolset,
  writeup,
  tradecraft,
}) => (
  <Box
    bg="rgba(15,15,15,0.95)"
    border="1px solid rgba(255,255,255,0.13)"
    borderRadius="16px"
    overflow="hidden"
    boxShadow="0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,80,95,0.07)"
    w="100%"
  >
    {/* ── TOP SECTION ── */}
    <Flex bg="rgba(10,10,10,0.9)" p={{ base: 4, md: 6 }} gap={5} align="flex-start" flexWrap="wrap">

      {/* Avatar */}
      <Box
        w={{ base: '100px', md: '130px' }}
        h={{ base: '130px', md: '160px' }}
        bg="red.700"
        borderRadius="10px"
        overflow="hidden"
        flexShrink={0}
        border="1px solid rgba(255,80,95,0.3)"
      >
        {image ? (
          <Image src={image} alt={callsign} w="100%" h="100%" objectFit="cover" />
        ) : (
          <Flex w="100%" h="100%" align="center" justify="center">
            <Text fontSize="3xl" fontWeight="black" color="whiteAlpha.600">
              {callsign?.charAt(0)}
            </Text>
          </Flex>
        )}
      </Box>

      {/* Name + meta */}
      <Box flex="1" minW="0">
        <Heading fontSize={{ base: '3xl', md: '5xl' }} fontWeight="black" lineHeight="1" mb={1}>
          {callsign}
        </Heading>
        {realName && (
          <Text fontSize="sm" color="gray.400" mb={3}>{realName}</Text>
        )}

        <Grid templateColumns={{ base: '1fr 1fr', md: '1fr 1fr' }} gap={4} mt={3}>
          {aliases?.length > 0 && (
            <Box>
              <Text fontSize="10px" fontWeight="bold" letterSpacing="wider" color="gray.500" textTransform="uppercase" mb={1}>Aliases</Text>
              <Text fontSize="sm" color="gray.300">{aliases.join(', ')}</Text>
            </Box>
          )}
          {firstActive && (
            <Box>
              <Text fontSize="10px" fontWeight="bold" letterSpacing="wider" color="gray.500" textTransform="uppercase" mb={1}>First active</Text>
              <Text fontSize="sm" color="gray.300">{firstActive}</Text>
            </Box>
          )}
          {latestActivity && (
            <Box>
              <Text fontSize="10px" fontWeight="bold" letterSpacing="wider" color="gray.500" textTransform="uppercase" mb={1}>Latest activity</Text>
              <Text fontSize="sm" color="gray.300">{latestActivity}</Text>
            </Box>
          )}
        </Grid>
      </Box>
    </Flex>

    {/* ── TAG ROW ── */}
    <Box px={{ base: 4, md: 6 }} py={4} bg="rgba(12,12,12,0.8)" borderTop="1px solid rgba(255,255,255,0.05)">
      <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={4}>
        {languages?.length  > 0 && <TagGroup label="Languages"   items={languages}  />}
        {geography?.length  > 0 && <TagGroup label="Geography"   items={geography}  />}
        {focus?.length      > 0 && <TagGroup label="Focus Area"  items={focus}      />}
        {motivation?.length > 0 && <TagGroup label="Motivation"  items={motivation} />}
      </Grid>
    </Box>

    {/* ── BOTTOM SECTION ── */}
    <Flex
      px={{ base: 4, md: 6 }}
      py={5}
      gap={6}
      borderTop="1px solid rgba(255,255,255,0.05)"
      flexDir={{ base: 'column', md: 'row' }}
    >
      {/* Left — Skillset + Toolset */}
      <Box w={{ base: '100%', md: '220px' }} flexShrink={0}>
        {skillset?.length > 0 && (
          <Box mb={4}>
            <Text fontSize="10px" fontWeight="bold" letterSpacing="wider" color="gray.500" textTransform="uppercase" mb={2}>
              Skillset
            </Text>
            <Wrap spacing={1}>
              {skillset.map((s) => <WrapItem key={s}><ToolTag label={s} /></WrapItem>)}
            </Wrap>
          </Box>
        )}
        {toolset?.length > 0 && (
          <Box>
            <Text fontSize="10px" fontWeight="bold" letterSpacing="wider" color="gray.500" textTransform="uppercase" mb={2}>
              Toolset
            </Text>
            <Wrap spacing={1}>
              {toolset.map((t) => <WrapItem key={t}><ToolTag label={t} /></WrapItem>)}
            </Wrap>
          </Box>
        )}
      </Box>

      <Divider orientation="vertical" display={{ base: 'none', md: 'block' }} borderColor="rgba(255,255,255,0.07)" />

      {/* Right — Write-up + Tradecraft */}
      <Box flex="1">
        {writeup && (
          <Box mb={4}>
            <Text fontSize="11px" fontWeight="bold" letterSpacing="wider" color="red.400" textTransform="uppercase" mb={2}>
              Operator Write-up
            </Text>
            <Text fontSize="sm" color="gray.300" lineHeight="tall">{writeup}</Text>
          </Box>
        )}
        {tradecraft && (
          <Box>
            <Text fontSize="11px" fontWeight="bold" letterSpacing="wider" color="red.400" textTransform="uppercase" mb={2}>
              Primary Tradecraft
            </Text>
            <Text fontSize="sm" color="gray.300" lineHeight="tall">{tradecraft}</Text>
          </Box>
        )}
      </Box>
    </Flex>
  </Box>
);

export default OperatorCard;
