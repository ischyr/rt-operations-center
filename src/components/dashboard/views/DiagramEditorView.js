import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Flex, Text, Spinner, Input } from '@chakra-ui/react';
import { EditIcon, CheckIcon, WarningTwoIcon } from '@chakra-ui/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';

const EMBED_URL =
  'https://embed.diagrams.net/?embed=1&proto=json&spin=1&ui=dark' +
  '&noSaveBtn=0&saveAndExit=0&modified=unsavedChanges&dark=1';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const DiagramEditorView = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const diagramId = searchParams.get('id');

  const iframeRef  = useRef(null);
  const pendingXml = useRef(null);   // xml waiting for iframe init
  const saveQueue  = useRef(null);   // { xml, requestThumb } waiting for export

  const [ready,      setReady]      = useState(false);
  const [name,       setName]       = useState('Untitled Diagram');
  const [editName,   setEditName]   = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [currentId,  setCurrentId]  = useState(diagramId || null);

  // ── Send message to iframe ─────────────────────────────────────────────────
  const sendMsg = useCallback((payload) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(payload), '*');
  }, []);

  // ── Persist to DB ──────────────────────────────────────────────────────────
  const saveToDB = useCallback(async (xml, thumbnail) => {
    setSaveStatus('saving');
    try {
      const body = JSON.stringify({ name, xml, thumbnail });
      let res;
      if (currentId) {
        res = await fetch(`/api/diagrams/${currentId}`, { method: 'PUT', headers: authHeaders(), body });
      } else {
        res = await fetch('/api/diagrams', { method: 'POST', headers: authHeaders(), body });
        if (res.ok) {
          const data = await res.json();
          setCurrentId(data._id);
          // Update URL without re-mounting
          navigate(`/dashboard/diagrams/editor?id=${data._id}`, { replace: true });
        }
      }
      setSaveStatus(res.ok ? 'saved' : 'error');
    } catch {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus('idle'), 3000);
  }, [currentId, name, navigate]);

  // ── Handle messages from draw.io iframe ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      switch (msg.event) {
        case 'init':
          setReady(true);
          // Load XML into editor once ready
          if (pendingXml.current !== null) {
            sendMsg({ action: 'load', xml: pendingXml.current });
            pendingXml.current = null;
          } else {
            sendMsg({ action: 'load', xml: '' });
          }
          break;

        case 'save': {
          const xml = msg.xml;
          // Request PNG thumbnail export then save
          saveQueue.current = { xml };
          sendMsg({ action: 'export', format: 'png', scale: 1, border: 10 });
          break;
        }

        case 'export': {
          const queued = saveQueue.current;
          if (queued) {
            saveQueue.current = null;
            saveToDB(queued.xml, msg.data ?? null);
          }
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendMsg, saveToDB]);

  // ── Load existing diagram on mount ────────────────────────────────────────
  useEffect(() => {
    if (!diagramId) return;
    (async () => {
      try {
        const res = await fetch(`/api/diagrams/${diagramId}`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        setName(data.name || 'Untitled Diagram');
        setCurrentId(data._id);
        if (ready) {
          sendMsg({ action: 'load', xml: data.xml });
        } else {
          pendingXml.current = data.xml;
        }
      } catch { /* ignore */ }
    })();
  }, [diagramId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Status badge ──────────────────────────────────────────────────────────
  const StatusBadge = () => {
    if (saveStatus === 'saving') return (
      <Flex align="center" gap={1.5}>
        <Spinner size="xs" color="var(--dash-text-muted)" />
        <Text fontSize="11px" color="var(--dash-text-muted)">Saving…</Text>
      </Flex>
    );
    if (saveStatus === 'saved') return (
      <Flex align="center" gap={1.5}>
        <CheckIcon boxSize={2.5} color="green.400" />
        <Text fontSize="11px" color="green.400">Saved</Text>
      </Flex>
    );
    if (saveStatus === 'error') return (
      <Flex align="center" gap={1.5}>
        <WarningTwoIcon boxSize={2.5} color="red.400" />
        <Text fontSize="11px" color="red.400">Save failed</Text>
      </Flex>
    );
    return null;
  };

  return (
    <Box h="calc(100vh - 120px)" display="flex" flexDirection="column" gap={0}>
      {/* Top bar */}
      <Flex
        align="center" justify="space-between" px={4} py={2} flexShrink={0}
        bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="10px" mb={3}
      >
        <Flex align="center" gap={2}>
          {editName ? (
            <Input
              value={name} autoFocus
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditName(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditName(false); }}
              fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)"
              border="1px solid rgba(255,255,255,0.15)" borderRadius="6px"
              h="28px" px={2} bg="rgba(255,255,255,0.05)" w="220px"
              _focus={{ borderColor: 'red.500', boxShadow: 'none' }}
            />
          ) : (
            <Flex align="center" gap={2} cursor="pointer" onClick={() => setEditName(true)}
              _hover={{ opacity: 0.8 }} transition="opacity 0.15s">
              <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">{name}</Text>
              <EditIcon boxSize={3} color="var(--dash-text-muted)" />
            </Flex>
          )}
        </Flex>

        <Flex align="center" gap={4}>
          <StatusBadge />
          <Flex
            align="center" gap={1.5} cursor="pointer"
            onClick={() => navigate('/dashboard/diagrams/library')}
            color="var(--dash-text-muted)" _hover={{ color: 'var(--dash-text-primary)' }}
            transition="color 0.15s"
          >
            <Text fontSize="11px">← My Diagrams</Text>
          </Flex>
        </Flex>
      </Flex>

      {/* iframe wrapper */}
      <Box flex="1" borderRadius="10px" overflow="hidden"
        border="1px solid var(--dash-card-border)" pos="relative">
        {!ready && (
          <Flex pos="absolute" inset="0" align="center" justify="center"
            bg="var(--dash-card-bg)" zIndex={1} gap={3}>
            <Spinner size="md" color="red.400" />
            <Text fontSize="13px" color="var(--dash-text-muted)">Loading editor…</Text>
          </Flex>
        )}
        <Box
          as="iframe"
          ref={iframeRef}
          src={EMBED_URL}
          w="100%" h="100%"
          border="none"
          title="Diagram Editor"
          style={{ display: 'block' }}
        />
      </Box>
    </Box>
  );
};

export default DiagramEditorView;
