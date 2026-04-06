import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Flex, Text, Input, Button, Select,
  IconButton, useToast,
} from '@chakra-ui/react';
import {
  AddIcon, DeleteIcon, DownloadIcon, InfoIcon, LinkIcon, CloseIcon,
} from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT = '#63B3ED';
const GREEN  = '#68D391';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const PURPLE = '#9F7AEA';
const CYAN   = '#76E4F7';

// ── Node types ────────────────────────────────────────────────────────────────
const NODE_TYPES = {
  executive: { label: 'Executive',  color: '#FC8181', bg: 'rgba(252,129,129,0.18)' },
  vp:        { label: 'VP',         color: '#F6AD55', bg: 'rgba(246,173,85,0.18)'  },
  director:  { label: 'Director',   color: '#9F7AEA', bg: 'rgba(159,122,234,0.18)' },
  manager:   { label: 'Manager',    color: '#63B3ED', bg: 'rgba(99,179,237,0.18)'  },
  employee:  { label: 'Employee',   color: '#68D391', bg: 'rgba(104,211,145,0.18)' },
  external:  { label: 'External',   color: '#A0AEC0', bg: 'rgba(160,174,192,0.10)' },
  dept:      { label: 'Department', color: '#76E4F7', bg: 'rgba(118,228,247,0.15)' },
};

const NODE_W = 152;
const NODE_H = 62;

// ── Canvas helpers ────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

let _uid = 100;
const uid = () => String(++_uid);

// ── Default sample org ────────────────────────────────────────────────────────
const DEFAULT_NODES = [
  { id: '1', type: 'executive', name: 'John Smith',   title: 'CEO',              dept: 'Executive',  x: 400, y: 80  },
  { id: '2', type: 'vp',        name: 'Sarah Connor', title: 'CTO',              dept: 'Technology', x: 160, y: 230 },
  { id: '3', type: 'vp',        name: 'Mike Johnson', title: 'CFO',              dept: 'Finance',    x: 640, y: 230 },
  { id: '4', type: 'director',  name: 'Emily Davis',  title: 'Dir. Engineering', dept: 'Technology', x: 50,  y: 390 },
  { id: '5', type: 'director',  name: 'Tom Wilson',   title: 'Dir. Security',    dept: 'Technology', x: 290, y: 390 },
  { id: '6', type: 'manager',   name: 'Lisa Park',    title: 'IT Manager',       dept: 'IT',         x: 510, y: 390 },
  { id: '7', type: 'manager',   name: 'James Brown',  title: 'Finance Mgr',      dept: 'Finance',    x: 760, y: 390 },
];

const DEFAULT_EDGES = [
  { id: 'e1', from: '1', to: '2' },
  { id: 'e2', from: '1', to: '3' },
  { id: 'e3', from: '2', to: '4' },
  { id: 'e4', from: '2', to: '5' },
  { id: 'e5', from: '3', to: '6' },
  { id: 'e6', from: '3', to: '7' },
];

// ── Shared UI components ──────────────────────────────────────────────────────
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
);

const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '38px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: `1px solid ${ACCENT}50` },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

const selSx = (accent = ACCENT) => ({
  bg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)',
  color: 'var(--dash-text-primary)', borderRadius: '10px', h: '38px', fontSize: 'sm',
  focusBorderColor: `${accent}80`, _hover: { borderColor: `${accent}50` },
  sx: { '& option': { background: '#1a1a1f !important' } },
});

const Card = ({ children, accentColor = ACCENT, ...rest }) => (
  <Box pos="relative" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="14px" overflow="hidden" {...rest}>
    <Box pos="absolute" top="0" left="0" right="0" h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)` }} />
    {children}
  </Box>
);

const StatCard = ({ label, value, color, delay = 0 }) => (
  <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay }}
    px={4} py={3} borderRadius="12px" bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Text fontSize="22px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
    <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{label}</Text>
  </MotionBox>
);

// ── Main View ─────────────────────────────────────────────────────────────────
const OrgChartView = () => {
  const toast        = useToast();
  const graphRef     = useRef(null);
  const containerRef = useRef(null);
  const [graphW, setGraphW] = useState(800);

  const [nodes,       setNodes]       = useState(DEFAULT_NODES);
  const [edges,       setEdges]       = useState(DEFAULT_EDGES);
  const [selected,    setSelected]    = useState(null);
  const [connecting,  setConnecting]  = useState(false);
  const [connectFrom, setConnectFrom] = useState(null);
  const [company,     setCompany]     = useState('Target Corp');
  const [form,        setForm]        = useState({ name: '', title: '', type: 'employee', dept: '' });
  const [editForm,    setEditForm]    = useState(null);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setGraphW(e.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Fit on mount
  useEffect(() => {
    const t = setTimeout(() => graphRef.current?.zoomToFit(400, 70), 350);
    return () => clearTimeout(t);
  }, []);

  // Sync edit form with selected node
  const selectedNode = nodes.find(n => n.id === selected);
  useEffect(() => {
    setEditForm(selectedNode ? { ...selectedNode } : null);
  }, [selected]); // eslint-disable-line

  // Graph data — fx/fy pins nodes to manual positions
  const graphData = {
    nodes: nodes.map(n => ({ ...n, fx: n.x, fy: n.y })),
    links: edges.map(e => ({ source: e.from, target: e.to, id: e.id })),
  };

  // ── Custom node renderer ──────────────────────────────────────────────────
  const paintNode = useCallback((node, ctx, gs) => {
    const nt  = NODE_TYPES[node.type] || NODE_TYPES.employee;
    const sel = node.id === selected;
    const x   = node.x - NODE_W / 2;
    const y   = node.y - NODE_H / 2;
    const r   = 8;

    if (sel) { ctx.shadowColor = nt.color; ctx.shadowBlur = 14 / gs; }

    // Background
    ctx.fillStyle = nt.bg;
    roundRect(ctx, x, y, NODE_W, NODE_H, r);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = sel ? nt.color : `${nt.color}60`;
    ctx.lineWidth   = (sel ? 2 : 1) / gs;
    ctx.stroke();

    // Top accent stripe
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x, y, NODE_W, NODE_H, r);
    ctx.clip();
    ctx.fillStyle = nt.color;
    ctx.fillRect(x, y, NODE_W, 3 / gs);
    ctx.restore();

    // Name
    const fName = Math.max(8, 11 / gs);
    ctx.font         = `bold ${fName}px 'Segoe UI', sans-serif`;
    ctx.fillStyle    = '#ffffff';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const name = node.name.length > 19 ? node.name.slice(0, 18) + '…' : node.name;
    ctx.fillText(name, node.x, node.y - 9 / gs);

    // Title
    const fTitle = Math.max(6, 9 / gs);
    ctx.font      = `${fTitle}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = nt.color;
    const title = (node.title || '').length > 24 ? (node.title || '').slice(0, 23) + '…' : (node.title || '');
    ctx.fillText(title, node.x, node.y + 8 / gs);
  }, [selected]);

  // Clickable pointer area
  const paintPointer = useCallback((node, color, ctx) => {
    ctx.fillStyle = color;
    ctx.fillRect(node.x - NODE_W / 2, node.y - NODE_H / 2, NODE_W, NODE_H);
  }, []);

  // ── Node click ────────────────────────────────────────────────────────────
  const handleNodeClick = useCallback((node) => {
    if (connecting) {
      if (!connectFrom) {
        setConnectFrom(node.id);
        toast({ title: `Source: ${node.name} — click target`, status: 'info', duration: 2000 });
      } else {
        if (connectFrom !== node.id) {
          const exists = edges.some(e => e.from === connectFrom && e.to === node.id);
          if (!exists) {
            setEdges(p => [...p, { id: uid(), from: connectFrom, to: node.id }]);
            toast({ title: 'Edge created', status: 'success', duration: 1400 });
          } else {
            toast({ title: 'Edge already exists', status: 'warning', duration: 1400 });
          }
        }
        setConnectFrom(null);
        setConnecting(false);
      }
    } else {
      setSelected(p => p === node.id ? null : node.id);
    }
  }, [connecting, connectFrom, edges, toast]);

  // ── Drag end — update position ─────────────────────────────────────────────
  const handleDragEnd = useCallback((node) => {
    setNodes(p => p.map(n => n.id === node.id ? { ...n, x: node.x, y: node.y } : n));
  }, []);

  // ── Add node ──────────────────────────────────────────────────────────────
  const addNode = () => {
    if (!form.name.trim()) { toast({ title: 'Name required', status: 'error', duration: 1400 }); return; }
    setNodes(p => [...p, { id: uid(), ...form, x: 200 + Math.random() * 400, y: 200 + Math.random() * 200 }]);
    setForm({ name: '', title: '', type: 'employee', dept: '' });
    toast({ title: 'Node added', status: 'success', duration: 1200 });
  };

  // ── Save edit ─────────────────────────────────────────────────────────────
  const saveEdit = () => {
    if (!editForm?.name?.trim()) return;
    setNodes(p => p.map(n => n.id === editForm.id ? { ...n, ...editForm } : n));
    toast({ title: 'Node updated', status: 'success', duration: 1200 });
  };

  // ── Delete node ───────────────────────────────────────────────────────────
  const deleteNode = (id) => {
    setNodes(p => p.filter(n => n.id !== id));
    setEdges(p => p.filter(e => e.from !== id && e.to !== id));
    setSelected(null);
    toast({ title: 'Node deleted', status: 'info', duration: 1200 });
  };

  // ── Export PNG (grab canvas from ForceGraph) ──────────────────────────────
  const exportPNG = () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) { toast({ title: 'Canvas not ready', status: 'error', duration: 1500 }); return; }
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `org-chart-${company.replace(/\s+/g, '-')}-${Date.now()}.png`;
    a.click();
    toast({ title: 'PNG exported', status: 'success', duration: 1400 });
  };

  // ── Export JSON ───────────────────────────────────────────────────────────
  const exportJSON = () => {
    const data = { company, nodes, edges, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `org-chart-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'JSON exported', status: 'success', duration: 1400 });
  };

  const fitView = () => graphRef.current?.zoomToFit(400, 70);

  return (
    <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} px={6} pb={12} pt={5}>

      {/* ── Header ── */}
      <Flex align="flex-start" justify="space-between" mb={5}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Org Chart <Text as="span" color="red.400">Mapper</Text>
          </Text>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            Map organization hierarchy from OSINT · visualize attack surface · export for targeting
          </Text>
        </Box>
        <Flex gap={2}>
          <Button size="sm" leftIcon={<DownloadIcon />} onClick={exportPNG}
            bg="transparent" border={`1px solid ${GREEN}60`} color={GREEN}
            _hover={{ bg: `${GREEN}15`, borderColor: GREEN }} borderRadius="10px" fontSize="12px">
            Export PNG
          </Button>
          <Button size="sm" leftIcon={<DownloadIcon />} onClick={exportJSON}
            bg="transparent" border={`1px solid ${ACCENT}60`} color={ACCENT}
            _hover={{ bg: `${ACCENT}15`, borderColor: ACCENT }} borderRadius="10px" fontSize="12px">
            Export JSON
          </Button>
        </Flex>
      </Flex>

      {/* ── Info banner ── */}
      <Box mb={5} px={4} py={3} borderRadius="10px"
        bg="rgba(99,179,237,0.07)" border="1px solid rgba(99,179,237,0.25)">
        <Flex align="center" gap={2} mb={2}>
          <InfoIcon boxSize={3} color={ACCENT} />
          <Text fontSize="10px" fontWeight="bold" color={ACCENT}
            textTransform="uppercase" letterSpacing="wider">Org Chart Mapper</Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {[
            'Add nodes per role: Executive → VP → Director → Manager → Employee',
            'Click Connect then two nodes to draw a reporting edge between them',
            'Drag nodes freely · zoom with scroll · click to select and edit',
          ].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Stat row ── */}
      <Flex gap={3} mb={5} flexWrap="wrap">
        <StatCard label="Nodes"     value={nodes.length}                              color={ACCENT}  delay={0}    />
        <StatCard label="Edges"     value={edges.length}                              color={GREEN}   delay={0.04} />
        <StatCard label="Selected"  value={selectedNode?.name?.split(' ')[0] || '—'}  color={ORANGE}  delay={0.08} />
        <StatCard label="Mode"      value={connecting ? 'Connect' : 'Select'}         color={connecting ? RED : PURPLE} delay={0.12} />
      </Flex>

      {/* ── Main body ── */}
      <Flex gap={5} align="flex-start">

        {/* ── Left panel ── */}
        <Flex direction="column" gap={4} w="265px" flexShrink={0}>

          {/* Company */}
          <Card accentColor={ACCENT} px={5} pt={5} pb={5}>
            <Label>Company / Target</Label>
            <Input {...inputSx} mt={2} value={company}
              onChange={e => setCompany(e.target.value)} placeholder="Target Corp" />
          </Card>

          {/* Add node */}
          <Card accentColor={GREEN} px={5} pt={5} pb={5}>
            <Label>Add Node</Label>
            <Flex direction="column" gap={3} mt={3}>
              <Box>
                <Label>Name</Label>
                <Input {...inputSx} value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Smith"
                  onKeyDown={e => e.key === 'Enter' && addNode()} />
              </Box>
              <Box>
                <Label>Title / Role</Label>
                <Input {...inputSx} value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="CEO"
                  onKeyDown={e => e.key === 'Enter' && addNode()} />
              </Box>
              <Box>
                <Label>Type</Label>
                <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  {...selSx(GREEN)}>
                  {Object.entries(NODE_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </Select>
              </Box>
              <Button size="sm" leftIcon={<AddIcon />}
                bg={`${GREEN}20`} color={GREEN} border={`1px solid ${GREEN}50`}
                _hover={{ bg: `${GREEN}35` }} borderRadius="8px" fontSize="12px"
                onClick={addNode}>
                Add Node
              </Button>
            </Flex>
          </Card>

          {/* Edit selected node */}
          {editForm && (
            <MotionBox initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}>
              <Card accentColor={ORANGE} px={5} pt={5} pb={5}>
                <Flex align="center" justify="space-between" mb={3}>
                  <Label>Edit Node</Label>
                  <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                    color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                    onClick={() => setSelected(null)} aria-label="close edit" />
                </Flex>
                <Flex direction="column" gap={3}>
                  <Box>
                    <Label>Name</Label>
                    <Input {...inputSx}
                      _focus={{ border: `1px solid ${ORANGE}80`, boxShadow: `0 0 0 1px ${ORANGE}40` }}
                      _hover={{ border: `1px solid ${ORANGE}50` }}
                      value={editForm.name}
                      onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                  </Box>
                  <Box>
                    <Label>Title / Role</Label>
                    <Input {...inputSx}
                      _focus={{ border: `1px solid ${ORANGE}80`, boxShadow: `0 0 0 1px ${ORANGE}40` }}
                      _hover={{ border: `1px solid ${ORANGE}50` }}
                      value={editForm.title || ''}
                      onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                  </Box>
                  <Box>
                    <Label>Department</Label>
                    <Input {...inputSx}
                      _focus={{ border: `1px solid ${ORANGE}80`, boxShadow: `0 0 0 1px ${ORANGE}40` }}
                      _hover={{ border: `1px solid ${ORANGE}50` }}
                      value={editForm.dept || ''}
                      onChange={e => setEditForm(p => ({ ...p, dept: e.target.value }))} />
                  </Box>
                  <Box>
                    <Label>Type</Label>
                    <Select value={editForm.type}
                      onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}
                      {...selSx(ORANGE)}>
                      {Object.entries(NODE_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </Select>
                  </Box>
                  <Flex gap={2}>
                    <Button flex="1" size="sm"
                      bg={`${ORANGE}20`} color={ORANGE} border={`1px solid ${ORANGE}50`}
                      _hover={{ bg: `${ORANGE}35` }} borderRadius="8px" fontSize="12px"
                      onClick={saveEdit}>
                      Save
                    </Button>
                    <Button size="sm" leftIcon={<DeleteIcon boxSize={3} />}
                      bg={`${RED}15`} color={RED} border={`1px solid ${RED}40`}
                      _hover={{ bg: `${RED}25` }} borderRadius="8px" fontSize="12px"
                      onClick={() => deleteNode(editForm.id)}>
                      Delete
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            </MotionBox>
          )}

          {/* Tools */}
          <Card accentColor={PURPLE} px={5} pt={5} pb={5}>
            <Label>Tools</Label>
            <Flex direction="column" gap={2} mt={3}>
              <Button size="sm" leftIcon={<LinkIcon />}
                bg={connecting ? `${RED}18` : `${PURPLE}15`}
                color={connecting ? RED : PURPLE}
                border={`1px solid ${connecting ? RED : PURPLE}50`}
                _hover={{ bg: connecting ? `${RED}28` : `${PURPLE}28` }}
                borderRadius="8px" fontSize="12px"
                onClick={() => { setConnecting(p => !p); setConnectFrom(null); }}>
                {connecting
                  ? (connectFrom ? '→ Click target node…' : '→ Click source node…')
                  : 'Connect Nodes'}
              </Button>
              <Button size="sm"
                bg="rgba(255,255,255,0.05)" color="var(--dash-text-secondary)"
                border="1px solid rgba(255,255,255,0.1)"
                _hover={{ bg: 'rgba(255,255,255,0.1)', color: 'white' }}
                borderRadius="8px" fontSize="12px" onClick={fitView}>
                Fit to View
              </Button>
              <Button size="sm"
                bg="rgba(255,255,255,0.04)" color={RED} border={`1px solid ${RED}30`}
                _hover={{ bg: `${RED}10`, borderColor: `${RED}55` }}
                borderRadius="8px" fontSize="12px"
                onClick={() => { setNodes(DEFAULT_NODES); setEdges(DEFAULT_EDGES); setSelected(null); }}>
                Reset to Default
              </Button>
            </Flex>
          </Card>

          {/* Legend */}
          <Card accentColor={CYAN} px={5} pt={5} pb={5}>
            <Label>Legend</Label>
            <Flex direction="column" gap={2} mt={3}>
              {Object.entries(NODE_TYPES).map(([k, v]) => (
                <Flex key={k} align="center" gap={2}>
                  <Box w="10px" h="10px" borderRadius="2px" bg={v.bg}
                    border={`1.5px solid ${v.color}`} flexShrink={0} />
                  <Text fontSize="11px" color="var(--dash-text-secondary)">{v.label}</Text>
                  <Box flex="1" />
                  <Box w="7px" h="7px" borderRadius="full" bg={v.color} flexShrink={0} />
                </Flex>
              ))}
            </Flex>
          </Card>
        </Flex>

        {/* ── Graph canvas ── */}
        <Box flex="1" minW={0}>
          <Card accentColor={ACCENT} overflow="hidden" pos="relative">
            <Box ref={containerRef} bg="#0c0e14" minH="660px" pos="relative">
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                width={graphW}
                height={660}
                backgroundColor="#0c0e14"
                nodeCanvasObject={paintNode}
                nodePointerAreaPaint={paintPointer}
                nodeRelSize={0}
                onNodeClick={handleNodeClick}
                onNodeDragEnd={handleDragEnd}
                enableNodeDrag={!connecting}
                linkColor={() => 'rgba(99,179,237,0.3)'}
                linkWidth={1.5}
                linkDirectionalArrowLength={8}
                linkDirectionalArrowRelPos={1}
                linkDirectionalArrowColor={() => 'rgba(99,179,237,0.55)'}
                cooldownTicks={0}
                d3AlphaDecay={1}
                d3VelocityDecay={1}
                enableZoomInteraction
                enablePanInteraction
                minZoom={0.15}
                maxZoom={4}
              />

              {/* Connect mode hint */}
              {connecting && (
                <MotionBox
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  pos="absolute" top={3} left="50%" transform="translateX(-50%)"
                  bg="rgba(252,129,129,0.12)" border="1px solid rgba(252,129,129,0.45)"
                  borderRadius="8px" px={4} py="7px" pointerEvents="none">
                  <Text fontSize="12px" color={RED} fontWeight="bold">
                    {connectFrom ? '→ Now click the target node' : '→ Click the source node first'}
                  </Text>
                </MotionBox>
              )}

              {/* Empty state */}
              {nodes.length === 0 && (
                <Flex pos="absolute" inset={0} align="center" justify="center"
                  direction="column" gap={2} pointerEvents="none">
                  <Text fontSize="28px">🕸</Text>
                  <Text fontSize="13px" color="var(--dash-text-muted)">No nodes yet — add one from the panel</Text>
                </Flex>
              )}
            </Box>
          </Card>
        </Box>
      </Flex>
    </MotionBox>
  );
};

export default OrgChartView;
