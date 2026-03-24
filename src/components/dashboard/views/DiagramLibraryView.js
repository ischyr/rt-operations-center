import { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, SimpleGrid, Spinner,
  useToast,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon, AttachmentIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// ── Diagram card ──────────────────────────────────────────────────────────────
const DiagramCard = ({ diagram, onDelete }) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      const res = await fetch(`/api/diagrams/${diagram._id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (res.ok) {
        onDelete(diagram._id);
      } else {
        toast({ description: 'Failed to delete diagram', status: 'error', duration: 2000, position: 'bottom-right' });
      }
    } catch {
      toast({ description: 'Network error', status: 'error', duration: 2000, position: 'bottom-right' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="12px" overflow="hidden" cursor="pointer"
      transition2="transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease"
      _hover={{ transform: 'translateY(-4px)', boxShadow: '0 8px 28px rgba(0,0,0,0.4)', borderColor: 'rgba(255,80,95,0.3)' }}
      onClick={() => navigate(`/dashboard/diagrams/editor?id=${diagram._id}`)}
      pos="relative"
      role="group"
    >
      {/* Thumbnail */}
      <Box h="160px" bg="rgba(255,255,255,0.02)" borderBottom="1px solid var(--dash-card-border)"
        pos="relative" overflow="hidden">
        {diagram.thumbnail ? (
          <Box
            as="img" src={diagram.thumbnail} alt={diagram.name}
            w="100%" h="100%" style={{ objectFit: 'contain' }}
          />
        ) : (
          <Flex h="100%" align="center" justify="center" direction="column" gap={2}>
            <AttachmentIcon boxSize={6} color="var(--dash-text-muted)" opacity={0.4} />
            <Text fontSize="10px" color="var(--dash-text-muted)" opacity={0.5}>No preview</Text>
          </Flex>
        )}
        {/* Hover overlay */}
        <Flex
          pos="absolute" inset="0" align="center" justify="center" gap={2}
          bg="rgba(0,0,0,0.6)" opacity={0} transition="opacity 0.2s"
          _groupHover={{ opacity: 1 }}
        >
          <Flex
            align="center" gap={1.5} px={3} py={1.5} borderRadius="8px"
            bg="rgba(255,80,95,0.15)" border="1px solid rgba(255,80,95,0.35)"
            color="red.400" fontSize="12px" fontWeight="semibold"
          >
            <EditIcon boxSize={3} />
            Open Editor
          </Flex>
        </Flex>
      </Box>

      {/* Info */}
      <Box px={4} py={3}>
        <Flex align="center" justify="space-between" mb={1}>
          <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)"
            noOfLines={1} flex="1">
            {diagram.name}
          </Text>
          <Box
            as="button" onClick={handleDelete}
            p="5px" borderRadius="6px" color="var(--dash-text-muted)"
            _hover={{ color: 'red.400', bg: 'rgba(255,80,95,0.1)' }}
            transition="all 0.15s" flexShrink={0} ml={2}
            onClick={handleDelete}
          >
            {deleting ? <Spinner size="xs" /> : <DeleteIcon boxSize={3} />}
          </Box>
        </Flex>
        <Text fontSize="10px" color="var(--dash-text-muted)">
          {fmtDate(diagram.updatedAt)} · {fmtTime(diagram.updatedAt)}
        </Text>
      </Box>
    </MotionBox>
  );
};

// ── New diagram card ──────────────────────────────────────────────────────────
const NewDiagramCard = () => {
  const navigate = useNavigate();
  return (
    <MotionBox
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      bg="transparent"
      border="1px dashed rgba(255,80,95,0.25)"
      borderRadius="12px" overflow="hidden" cursor="pointer"
      _hover={{ borderColor: 'rgba(255,80,95,0.55)', bg: 'rgba(255,80,95,0.04)' }}
      transition2="all 0.22s ease"
      onClick={() => navigate('/dashboard/diagrams/editor')}
      h="100%"
      minH="220px"
    >
      <Flex h="100%" minH="220px" align="center" justify="center" direction="column" gap={3}>
        <Flex
          w="40px" h="40px" borderRadius="10px"
          bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.2)"
          align="center" justify="center"
        >
          <AddIcon boxSize={4} color="red.400" />
        </Flex>
        <Text fontSize="13px" fontWeight="semibold" color="red.400">New Diagram</Text>
        <Text fontSize="11px" color="var(--dash-text-muted)">Start from scratch</Text>
      </Flex>
    </MotionBox>
  );
};

// ── Main view ─────────────────────────────────────────────────────────────────
const DiagramLibraryView = () => {
  const [diagrams, setDiagrams] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/diagrams', { headers: authHeaders() });
      if (res.ok) setDiagrams(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id) =>
    setDiagrams((prev) => prev.filter((d) => d._id !== id));

  return (
    <Box pb={8}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            My <Text as="span" color="red.400">Diagrams</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Saved diagrams · click any card to open in the editor
          </Text>
        </Box>
        <Flex
          align="center" gap={2} px={3} py="6px"
          bg="rgba(255,80,95,0.08)" border="1px solid rgba(255,80,95,0.2)"
          borderRadius="8px"
        >
          <AttachmentIcon boxSize={3} color="red.400" />
          <Text fontSize="11px" color="red.300" fontWeight="semibold">
            {diagrams.length} diagram{diagrams.length !== 1 ? 's' : ''}
          </Text>
        </Flex>
      </Flex>

      {loading ? (
        <Flex align="center" justify="center" h="300px" gap={3}>
          <Spinner size="md" color="red.400" />
          <Text fontSize="13px" color="var(--dash-text-muted)">Loading diagrams…</Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={5}>
          {/* New diagram always first */}
          <NewDiagramCard />

          {/* Saved diagrams */}
          <AnimatePresence mode="popLayout">
            {diagrams.map((d) => (
              <DiagramCard key={d._id} diagram={d} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </SimpleGrid>
      )}

      {!loading && diagrams.length === 0 && (
        <Flex
          direction="column" align="center" justify="center" gap={2} mt={8}
          color="var(--dash-text-muted)"
        >
          <Text fontSize="13px">No diagrams yet — create your first one!</Text>
        </Flex>
      )}
    </Box>
  );
};

export default DiagramLibraryView;
