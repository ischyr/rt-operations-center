import { useState, useRef } from 'react';
import {
  Box, Flex, Text, Heading, Button, Textarea, Select,
  Checkbox, SimpleGrid, Spinner, useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Client } from '@gradio/client';

const MotionBox = motion(Box);

// ── Theme ─────────────────────────────────────────────────────────────────────
const ACCENT = '#A78BFA';
const A_S    = 'rgba(167,139,250,0.10)';
const A_B    = 'rgba(167,139,250,0.30)';
const MUTED  = 'var(--dash-text-muted)';
const BORDER = 'rgba(255,255,255,0.07)';
const CARD   = 'rgba(255,255,255,0.03)';

// ── Helpers ───────────────────────────────────────────────────────────────────
const audioUrl = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v;
  return v.url || v.path || null;
};

const LANGUAGES = [
  'Auto','English','Chinese','Japanese','Korean',
  'French','German','Spanish','Italian','Portuguese','Russian','Arabic',
];

const VOICE_EXAMPLES = [
  'Speak in a calm, authoritative tone — like a news anchor',
  'Excited and high-energy, like a sports commentator',
  'Whispering and tense, as if sharing a secret',
  'Cold and intimidating — corporate villain energy',
  'Warm and reassuring — helpdesk support tone',
];

// ── Sub-components ────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color={MUTED} textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={2}>{children}</Text>
);

const inputSx = {
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover:  { borderColor: `${ACCENT}50` },
  _focus:  { borderColor: `${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40`, outline: 'none' },
};

const selSx = {
  bg: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px',
  fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _hover:  { borderColor: `${ACCENT}50` },
  sx: { '& option': { background: '#1a1a1f !important' } },
};

const TabBtn = ({ active, label, onClick }) => (
  <Box px={4} py="8px" borderRadius="8px" cursor="pointer" fontSize="12px"
    fontWeight={active ? 'semibold' : 'normal'}
    bg={active ? A_S : 'transparent'}
    color={active ? ACCENT : MUTED}
    border={active ? `1px solid ${A_B}` : '1px solid transparent'}
    onClick={onClick} transition="all 0.18s"
    _hover={{ color: active ? ACCENT : 'var(--dash-text-secondary)' }}>
    {label}
  </Box>
);

// ── Audio Player ──────────────────────────────────────────────────────────────
const AudioPlayer = ({ url, label }) => {
  if (!url) return null;
  return (
    <MotionBox initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}
      borderRadius="14px" bg={CARD} border={`1px solid ${BORDER}`} p={5} mt={5}>
      <Flex align="center" gap={2} mb={4}>
        <Box w="3px" h="13px" borderRadius="full" bg={ACCENT} />
        <Text fontSize="10px" color={MUTED} textTransform="uppercase" letterSpacing="wider" fontWeight="bold">
          {label}
        </Text>
      </Flex>
      <Box borderRadius="10px" overflow="hidden"
        sx={{ 'audio': { width:'100%', display:'block' }, 'audio::-webkit-media-controls-panel': { background: '#1e1e2e' } }}>
        <audio controls src={url} style={{ width:'100%' }} />
      </Box>
      <Flex justify="flex-end" mt={3}>
        <Button as="a" href={url} download="voice_output.wav" size="xs"
          bg={A_S} color={ACCENT} border={`1px solid ${A_B}`} borderRadius="7px"
          fontSize="11px" fontWeight="semibold"
          _hover={{ bg: ACCENT, color:'black' }} transition="all 0.2s">
          ↓ Download
        </Button>
      </Flex>
    </MotionBox>
  );
};

// ── Drop Zone ─────────────────────────────────────────────────────────────────
const MusicIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </Box>
);

const DropZone = ({ file, onChange }) => {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('audio/')) onChange(f);
  };

  return (
    <Box borderRadius="14px" border={`2px dashed ${drag ? ACCENT : BORDER}`}
      bg={drag ? A_S : CARD} p={7} textAlign="center" cursor="pointer"
      transition="all 0.2s"
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
      _hover={{ borderColor:`${ACCENT}60`, bg: A_S }}>
      <input ref={ref} type="file" accept="audio/*" style={{ display:'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) onChange(f); }} />
      <Flex direction="column" align="center" gap={3}>
        <Box w="44px" h="44px" borderRadius="full" bg={A_S} border={`1px solid ${A_B}`}
          display="flex" alignItems="center" justifyContent="center">
          <MusicIcon w="20px" h="20px" color={ACCENT} />
        </Box>
        {file ? (
          <>
            <Text fontSize="13px" fontWeight="semibold" color="white">{file.name}</Text>
            <Text fontSize="11px" color={MUTED}>{(file.size/1024).toFixed(1)} KB · click to replace</Text>
          </>
        ) : (
          <>
            <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
              Drop reference audio here
            </Text>
            <Text fontSize="11px" color={MUTED}>.wav · .mp3 · .ogg · .flac · .m4a</Text>
          </>
        )}
      </Flex>
    </Box>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const InfoCard = ({ icon, title, body }) => (
  <Box borderRadius="12px" bg={CARD} border={`1px solid ${BORDER}`} p={4}>
    <Flex align="center" gap={2} mb={2}>
      <Box color={ACCENT}>{icon}</Box>
      <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-primary)">{title}</Text>
    </Flex>
    <Text fontSize="11px" color={MUTED} lineHeight="1.6">{body}</Text>
  </Box>
);

// ── Main View ─────────────────────────────────────────────────────────────────
const VoiceClonerView = () => {
  const toast = useToast();
  const [tab, setTab] = useState('design');

  // Voice Design
  const [dText,    setDText]    = useState('');
  const [dLang,    setDLang]    = useState('Auto');
  const [dDesc,    setDDesc]    = useState('');
  const [dLoading, setDLoading] = useState(false);
  const [dAudio,   setDAudio]   = useState(null);
  const [dStatus,  setDStatus]  = useState('');

  // Voice Clone
  const [refFile,    setRefFile]   = useState(null);
  const [refPreview, setRefPreview] = useState(null);
  const [refText,   setRefText]   = useState('');
  const [cTarget,   setCTarget]   = useState('');
  const [cLang,     setCLang]     = useState('Auto');
  const [xvector,   setXvector]   = useState(false);
  const [modelSize, setModelSize] = useState('1.7B');
  const [cLoading,  setCLoading]  = useState(false);
  const [cAudio,    setCAudio]    = useState(null);
  const [cStatus,   setCStatus]   = useState('');

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleDesign = async () => {
    if (!dText.trim()) {
      toast({ title:'Enter text to synthesize', status:'warning', duration:2000, isClosable:true }); return;
    }
    setDLoading(true); setDAudio(null);
    setDStatus('Connecting to Qwen3-TTS…');
    try {
      const client = await Client.connect('Qwen/Qwen3-TTS');
      setDStatus('Generating voice…');
      const result = await client.predict('/generate_voice_design', {
        text: dText,
        language: dLang,
        voice_description: dDesc || 'Speak in a clear, professional tone.',
      });
      const url = audioUrl(result.data[0]);
      setDAudio(url);
      setDStatus(result.data[1] || 'Done');
      toast({ title:'Voice generated', status:'success', duration:2500, isClosable:true });
    } catch(err) {
      setDStatus('Error: ' + err.message);
      toast({ title:'Generation failed', description:err.message, status:'error', duration:5000, isClosable:true });
    } finally { setDLoading(false); }
  };

  const handleClone = async () => {
    if (!refFile) {
      toast({ title:'Upload a reference audio file', status:'warning', duration:2000, isClosable:true }); return;
    }
    if (!cTarget.trim()) {
      toast({ title:'Enter target text', status:'warning', duration:2000, isClosable:true }); return;
    }
    setCLoading(true); setCAudio(null);
    setCStatus('Connecting to Qwen3-TTS…');
    try {
      const client = await Client.connect('Qwen/Qwen3-TTS');
      setCStatus('Cloning voice…');
      const result = await client.predict('/generate_voice_clone', {
        ref_audio:       refFile,
        ref_text:        refText,
        target_text:     cTarget,
        language:        cLang,
        use_xvector_only: xvector,
        model_size:      modelSize,
      });
      const url = audioUrl(result.data[0]);
      setCAudio(url);
      setCStatus(result.data[1] || 'Done');
      toast({ title:'Voice cloned', status:'success', duration:2500, isClosable:true });
    } catch(err) {
      setCStatus('Error: ' + err.message);
      toast({ title:'Cloning failed', description:err.message, status:'error', duration:5000, isClosable:true });
    } finally { setCLoading(false); }
  };

  const loading   = tab === 'design' ? dLoading : cLoading;
  const statusMsg = tab === 'design' ? dStatus  : cStatus;

  return (
    <Box>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Voice <Text as="span" color="red.400">Cloner</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            AI voice synthesis &amp; cloning · design voices from description or clone from a reference sample
          </Text>
        </Box>
      </Flex>

      {/* ── Info cards ──────────────────────────────────────────────────── */}
      <SimpleGrid columns={{ base:1, md:3 }} spacing={4} mb={6}>
        <InfoCard
          title="Voice Design"
          body="Describe a voice style and generate speech from any text — no sample needed."
          icon={
            <Box as="svg" viewBox="0 0 24 24" w="13px" h="13px" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </Box>
          }
        />
        <InfoCard
          title="Voice Clone"
          body="Upload a voice sample and clone it to speak any target text with the same voice."
          icon={
            <Box as="svg" viewBox="0 0 24 24" w="13px" h="13px" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </Box>
          }
        />
        <InfoCard
          title="Qwen3-TTS"
          body="Powered by Alibaba's Qwen3-TTS model — multilingual, 0.6B or 1.7B parameter options."
          icon={
            <Box as="svg" viewBox="0 0 24 24" w="13px" h="13px" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </Box>
          }
        />
      </SimpleGrid>

      {/* ── Banner ──────────────────────────────────────────────────────── */}
      <Box mb={5} px={4} py={3} borderRadius="10px" bg={A_S} border={`1px solid ${A_B}`}>
        <Flex align="center" gap={2}>
          <Box as="svg" viewBox="0 0 24 24" w="13px" h="13px" fill="none" stroke={ACCENT}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" flexShrink={0}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </Box>
          <Text fontSize="11px" color={ACCENT}>
            Requests go directly to Hugging Face — processing takes 10–60 s depending on text length and model size.
          </Text>
        </Flex>
      </Box>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <Flex gap={2} mb={6}>
        <TabBtn active={tab==='design'} label="Voice Design" onClick={() => setTab('design')} />
        <TabBtn active={tab==='clone'}  label="Voice Clone"  onClick={() => setTab('clone')}  />
      </Flex>

      {/* ═══════════════════════════════════════════════════════════════════
          Tab: Voice Design
          ══════════════════════════════════════════════════════════════════ */}
      {tab === 'design' && (
        <MotionBox key="design" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }}>
          <SimpleGrid columns={{ base:1, lg:2 }} spacing={5}>

            {/* Left */}
            <Flex direction="column" gap={5}>
              <Box>
                <Label>Text to Synthesize</Label>
                <Textarea {...inputSx} value={dText} onChange={e => setDText(e.target.value)}
                  placeholder="Enter the text you want to speak…" rows={7} resize="vertical" p={3} />
              </Box>
              <Box>
                <Label>Language</Label>
                <Select value={dLang} onChange={e => setDLang(e.target.value)}
                  {...selSx} focusBorderColor={`${ACCENT}80`}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </Select>
              </Box>
            </Flex>

            {/* Right */}
            <Flex direction="column" gap={5}>
              <Box>
                <Label>Voice Description</Label>
                <Textarea {...inputSx} value={dDesc} onChange={e => setDDesc(e.target.value)}
                  placeholder={'e.g. "Speak in a calm, authoritative tone with a slight British accent"'}
                  rows={5} resize="vertical" p={3} />
              </Box>
              <Box borderRadius="12px" bg={CARD} border={`1px solid ${BORDER}`} p={4}>
                <Text fontSize="10px" color={MUTED} fontWeight="bold" textTransform="uppercase"
                  letterSpacing="wider" mb={2}>Quick presets</Text>
                {VOICE_EXAMPLES.map(ex => (
                  <Box key={ex} px={2} py="5px" borderRadius="7px" cursor="pointer"
                    _hover={{ bg: A_S }} transition="all 0.15s"
                    onClick={() => setDDesc(ex)}>
                    <Text fontSize="11px" color={MUTED} _hover={{ color: ACCENT }}
                      transition="color 0.15s">{ex}</Text>
                  </Box>
                ))}
              </Box>
            </Flex>
          </SimpleGrid>

          {/* Action row */}
          <Flex justify="flex-end" align="center" gap={3} mt={6}>
            {dLoading && <Text fontSize="12px" color={ACCENT}>{dStatus}</Text>}
            <Button size="md" fontWeight="bold" fontSize="13px" borderRadius="10px"
              bg={ACCENT} color="black" px={8} h="44px"
              leftIcon={dLoading ? <Spinner size="xs" color="black" /> : undefined}
              _hover={{ bg:'#8B5CF6', transform:'translateY(-1px)', boxShadow:`0 8px 28px rgba(167,139,250,0.35)` }}
              transition="all 0.2s" isDisabled={dLoading} onClick={handleDesign}>
              {dLoading ? 'Generating…' : 'Generate Voice'}
            </Button>
          </Flex>

          <AudioPlayer url={dAudio} label="Generated Audio" />
        </MotionBox>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Tab: Voice Clone
          ══════════════════════════════════════════════════════════════════ */}
      {tab === 'clone' && (
        <MotionBox key="clone" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }}>
          <SimpleGrid columns={{ base:1, lg:2 }} spacing={5}>

            {/* Left */}
            <Flex direction="column" gap={5}>
              <Box>
                <Label>Reference Audio</Label>
                <DropZone file={refFile} onChange={f => { setRefFile(f); setRefPreview(f ? URL.createObjectURL(f) : null); }} />
                {refPreview && (
                  <Box mt={2} borderRadius="10px" bg={CARD} border={`1px solid ${BORDER}`} px={3} py={2}>
                    <audio controls src={refPreview} style={{ width:'100%' }} />
                  </Box>
                )}
              </Box>
              <Box>
                <Label>Reference Text <Text as="span" fontSize="10px" color={MUTED} textTransform="none"
                  letterSpacing="normal" fontWeight="normal">(transcript of the audio)</Text></Label>
                <Textarea {...inputSx} value={refText} onChange={e => setRefText(e.target.value)}
                  placeholder="Type exactly what is said in the reference audio…"
                  rows={4} resize="vertical" p={3} />
              </Box>
            </Flex>

            {/* Right */}
            <Flex direction="column" gap={5}>
              <Box>
                <Label>Target Text</Label>
                <Textarea {...inputSx} value={cTarget} onChange={e => setCTarget(e.target.value)}
                  placeholder="Text to synthesize using the cloned voice…"
                  rows={5} resize="vertical" p={3} />
              </Box>

              <SimpleGrid columns={2} spacing={3}>
                <Box>
                  <Label>Language</Label>
                  <Select value={cLang} onChange={e => setCLang(e.target.value)}
                    {...selSx} focusBorderColor={`${ACCENT}80`}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </Select>
                </Box>
                <Box>
                  <Label>Model Size</Label>
                  <Select value={modelSize} onChange={e => setModelSize(e.target.value)}
                    {...selSx} focusBorderColor={`${ACCENT}80`}>
                    <option value="0.6B">0.6B — Faster</option>
                    <option value="1.7B">1.7B — Best quality</option>
                  </Select>
                </Box>
              </SimpleGrid>

              <Box borderRadius="12px" bg={CARD} border={`1px solid ${BORDER}`} p={4}>
                <Flex align="flex-start" gap={3} cursor="pointer" onClick={() => setXvector(v => !v)}>
                  <Checkbox isChecked={xvector} onChange={e => setXvector(e.target.checked)}
                    colorScheme="purple" mt="1px" pointerEvents="none" />
                  <Box>
                    <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)">
                      Use x-vector only
                    </Text>
                    <Text fontSize="11px" color={MUTED} mt={0.5} lineHeight="1.5">
                      No reference text needed — faster processing but lower quality voice similarity
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Flex>
          </SimpleGrid>

          {/* Action row */}
          <Flex justify="flex-end" align="center" gap={3} mt={6}>
            {cLoading && <Text fontSize="12px" color={ACCENT}>{cStatus}</Text>}
            <Button size="md" fontWeight="bold" fontSize="13px" borderRadius="10px"
              bg={ACCENT} color="black" px={8} h="44px"
              leftIcon={cLoading ? <Spinner size="xs" color="black" /> : undefined}
              _hover={{ bg:'#8B5CF6', transform:'translateY(-1px)', boxShadow:`0 8px 28px rgba(167,139,250,0.35)` }}
              transition="all 0.2s" isDisabled={cLoading} onClick={handleClone}>
              {cLoading ? 'Cloning…' : 'Clone Voice'}
            </Button>
          </Flex>

          <AudioPlayer url={cAudio} label="Cloned Voice Output" />
        </MotionBox>
      )}
    </Box>
  );
};

export default VoiceClonerView;
