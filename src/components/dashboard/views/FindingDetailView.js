import { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Button, Input, Select, Textarea,
  Stack, IconButton,
} from '@chakra-ui/react';
import { ChevronLeftIcon, EditIcon, CheckIcon, DeleteIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

const SEVERITY_COLORS = {
  Critical: { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   text: '#fca5a5', dot: '#ef4444' },
  High:     { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  text: '#fcd34d', dot: '#f59e0b' },
  Medium:   { bg: 'rgba(234,179,8,0.15)',   border: 'rgba(234,179,8,0.4)',   text: '#fef08a', dot: '#eab308' },
  Low:      { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)',  text: '#93c5fd', dot: '#3b82f6' },
  Info:     { bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.35)',text: '#9ca3af', dot: '#6b7280' },
};
const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1}>
    {children}
  </Text>
);

const ContentSection = ({ title, content, field, mono, minH = '140px', editing, form, onChange }) => {
  const isEmpty = !content && !editing;
  return (
    <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)" borderRadius="14px" p={5}>
      <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
        letterSpacing="wider" fontWeight="semibold" mb={3}>
        {title}
      </Text>
      {editing ? (
        <Textarea
          value={form[field]}
          onChange={e => onChange(field, e.target.value)}
          minH={minH}
          fontFamily={mono ? 'mono' : 'inherit'}
          fontSize={mono ? 'xs' : 'sm'}
          variant="unstyled"
          bg="rgba(255,255,255,0.03)"
          border="1px solid rgba(255,255,255,0.1)"
          borderRadius="8px"
          color="var(--dash-text-primary)"
          _placeholder={{ color: 'var(--dash-text-muted)' }}
          _focus={{ border: '1px solid rgba(255,80,95,0.5)', boxShadow: 'none' }}
          resize="vertical"
          px={3} py={3}
          placeholder={`Enter ${title.toLowerCase()}...`}
        />
      ) : isEmpty ? (
        <Text fontSize="sm" color="var(--dash-text-muted)" fontStyle="italic">
          Not provided — click Edit to add.
        </Text>
      ) : (
        <Box
          bg={mono ? 'rgba(0,0,0,0.35)' : 'transparent'}
          borderRadius={mono ? '8px' : 0}
          p={mono ? 4 : 0}
          border={mono ? '1px solid rgba(255,255,255,0.06)' : 'none'}
          overflowX="auto"
        >
          <Text
            fontSize={mono ? 'xs' : 'sm'}
            fontFamily={mono ? 'mono' : 'inherit'}
            color={mono ? '#a5f3fc' : 'var(--dash-text-secondary)'}
            whiteSpace="pre-wrap"
            lineHeight="tall"
          >
            {content}
          </Text>
        </Box>
      )}
    </Box>
  );
};

const FindingDetailView = () => {
  const { slug, findingId } = useParams();
  const navigate = useNavigate();
  const { getBySlug, updateEngagement } = useEngagements();
  const eng     = getBySlug(slug);
  const finding = (eng?.findings || []).find(f => (f._id || f.id) === findingId);

  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (finding && !form) {
      setForm({
        title:          finding.title,
        severity:       finding.severity,
        description:    finding.description    || '',
        observation:    finding.observation    || '',
        proofOfConcept: finding.proofOfConcept || '',
        remediation:    finding.remediation    || '',
      });
    }
  }, [finding, form]);

  if (!eng || !finding || !form) {
    return (
      <Flex direction="column" align="center" justify="center" h="60vh" gap={4}>
        <Text fontSize="4xl">🔍</Text>
        <Text fontWeight="bold" color="var(--dash-text-primary)">Finding not found</Text>
        <Button size="sm" leftIcon={<ChevronLeftIcon />} variant="ghost"
          color="var(--dash-text-secondary)" _hover={{ color: 'white' }}
          onClick={() => navigate(`/dashboard/${slug}/reporting/findings`)}>
          Back to Findings
        </Button>
      </Flex>
    );
  }

  const c   = SEVERITY_COLORS[finding.severity] || SEVERITY_COLORS.Info;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const updatedFindings = (eng.findings || []).map(f =>
      (f._id || f.id) === findingId ? { ...f, ...form } : f
    );
    await updateEngagement(eng.id, { findings: updatedFindings });
    setEditing(false);
    setForm(null); // will re-sync from updated eng via useEffect
    setSaving(false);
  };

  const deleteFinding = async () => {
    if (!window.confirm(`Delete "${finding.title}"? This cannot be undone.`)) return;
    await updateEngagement(eng.id, {
      findings: (eng.findings || []).filter(f => (f._id || f.id) !== findingId),
    });
    navigate(`/dashboard/${slug}/reporting/findings`);
  };

  return (
    <MotionBox
      px={6} pb={8}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Top nav */}
      <Flex justify="space-between" align="center" mb={6}>
        <Button
          size="sm" leftIcon={<ChevronLeftIcon />} variant="ghost"
          color="var(--dash-text-muted)" fontSize="12px" borderRadius="8px"
          _hover={{ color: 'white', bg: 'rgba(255,255,255,0.05)' }}
          onClick={() => navigate(`/dashboard/${slug}/reporting/findings`)}
        >
          All Findings
        </Button>
        <Flex gap={2}>
          {editing ? (
            <>
              <Button size="sm" variant="ghost" color="var(--dash-text-muted)"
                _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                onClick={() => { setEditing(false); setForm(null); }}>
                Cancel
              </Button>
              <Button size="sm" leftIcon={<CheckIcon boxSize={3} />}
                bgGradient="linear(to-r, red.700, red.500)" color="white"
                _hover={{ bgGradient: 'linear(to-r, red.600, red.400)' }}
                isLoading={saving} loadingText="Saving..."
                onClick={save}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" leftIcon={<EditIcon boxSize={3} />}
                bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                color="var(--dash-text-secondary)" fontSize="12px" borderRadius="8px"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.09)' }}
                onClick={() => setEditing(true)}>
                Edit
              </Button>
              <IconButton
                icon={<DeleteIcon />} size="sm" variant="ghost"
                color="var(--dash-text-muted)" borderRadius="8px"
                _hover={{ color: 'red.400', bg: 'rgba(255,55,55,0.08)' }}
                onClick={deleteFinding} aria-label="Delete finding"
              />
            </>
          )}
        </Flex>
      </Flex>

      {/* Title / Severity card */}
      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="14px" p={5} mb={5}>
        {editing ? (
          <Flex gap={4} align="flex-end" flexWrap="wrap">
            <Box flex="1" minW="200px">
              <Label>Title</Label>
              <Input
                value={form.title} onChange={e => set('title', e.target.value)}
                variant="unstyled"
                bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
                borderRadius="10px" px={4} h="40px" fontSize="sm"
                color="var(--dash-text-primary)"
                _placeholder={{ color: 'var(--dash-text-muted)' }}
                _focus={{ border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' }}
                placeholder="Finding title"
              />
            </Box>
            <Box w="160px">
              <Label>Severity</Label>
              <Select
                value={form.severity} onChange={e => set('severity', e.target.value)}
                bg="rgba(255,255,255,0.04)" borderColor="rgba(255,255,255,0.1)"
                borderRadius="10px" h="40px" fontSize="sm"
                color="var(--dash-text-primary)"
                focusBorderColor="rgba(255,80,95,0.7)"
                _hover={{ borderColor: 'rgba(255,80,95,0.4)' }}
                sx={{ option: { bg: '#1a1a1f', color: 'white' } }}
              >
                {SEVERITY_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Box>
            <Box flex="1" minW="200px">
              <Label>Description</Label>
              <Input
                value={form.description} onChange={e => set('description', e.target.value)}
                variant="unstyled"
                bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
                borderRadius="10px" px={4} h="40px" fontSize="sm"
                color="var(--dash-text-primary)"
                _placeholder={{ color: 'var(--dash-text-muted)' }}
                _focus={{ border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' }}
                placeholder="Short description"
              />
            </Box>
          </Flex>
        ) : (
          <>
            <Flex align="center" gap={3} mb={3} flexWrap="wrap">
              <Flex px="8px" py="2px" borderRadius="5px" fontSize="10px" fontWeight="bold"
                letterSpacing="wider" align="center" gap="5px"
                bg={c.bg} border={`1px solid ${c.border}`} color={c.text}>
                <Box w="5px" h="5px" borderRadius="full" bg={c.dot} />
                {finding.severity.toUpperCase()}
              </Flex>
              {finding.createdAt && (
                <Text fontSize="11px" color="var(--dash-text-muted)">
                  Logged {new Date(finding.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              )}
            </Flex>
            <Text fontSize="xl" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
              {finding.title}
            </Text>
            {finding.description && (
              <Text fontSize="sm" color="var(--dash-text-secondary)" mt={1}>
                {finding.description}
              </Text>
            )}
          </>
        )}
      </Box>

      {/* Detail sections */}
      <Stack spacing={4}>
        <ContentSection
          title="Observation"
          content={finding.observation}
          field="observation"
          minH="150px"
          editing={editing}
          form={form}
          onChange={set}
        />
        <ContentSection
          title="Proof of Concept"
          content={finding.proofOfConcept}
          field="proofOfConcept"
          mono
          minH="220px"
          editing={editing}
          form={form}
          onChange={set}
        />
        <ContentSection
          title="Remediation"
          content={finding.remediation}
          field="remediation"
          minH="150px"
          editing={editing}
          form={form}
          onChange={set}
        />
      </Stack>
    </MotionBox>
  );
};

export default FindingDetailView;
