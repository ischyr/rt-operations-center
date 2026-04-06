import { useState, useRef, useCallback, useMemo, useEffect, memo } from 'react';
import { Box, Flex, Text, Button, Input, Textarea, Select, Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ExternalLinkIcon, AttachmentIcon, CloseIcon, InfoIcon } from '@chakra-ui/icons';
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
const YELLOW = '#F6E05E';
const GRAY   = '#A0AEC0';

const NODE_TYPES = {
  user:        { label: 'User',              color: ACCENT  },
  da:          { label: 'Domain Admin',      color: RED     },
  group:       { label: 'Group',             color: PURPLE  },
  computer:    { label: 'Machine Account',   color: GRAY    },
  dc:          { label: 'Domain Controller', color: ORANGE  },
  server:      { label: 'Server',            color: GREEN   },
  workstation: { label: 'Workstation',       color: CYAN    },
  domain:      { label: 'Domain Boundary',   color: YELLOW  },
  firewall:    { label: 'Firewall',          color: '#FC8181' },
  router:      { label: 'Router / Switch',   color: '#A3BFFA' },
  database:    { label: 'Database',          color: '#68D391' },
  cloud:       { label: 'Cloud Service',     color: '#90CDF4' },
  printer:     { label: 'Printer',           color: '#B794F4' },
  mobile:      { label: 'Mobile Device',     color: '#FBD38D' },
  gpo:         { label: 'GPO',               color: '#F687B3' },
  ou:          { label: 'Org Unit (OU)',      color: '#81E6D9' },
};

const EDGE_TYPES = {
  admin:    { label: 'Admin',            color: RED    },
  rdp:      { label: 'RDP',             color: CYAN   },
  trust:    { label: 'Trust',           color: PURPLE },
  mssql:    { label: 'MSSQL',           color: GREEN  },
  smb:      { label: 'SMB',             color: ORANGE },
  winrm:    { label: 'WinRM',           color: YELLOW },
  custom:   { label: 'Custom',          color: ACCENT },
};

const NSIZES = {
  user:15, da:15, group:17, computer:15, dc:19, server:17, workstation:16, domain:80,
  firewall:16, router:16, database:15, cloud:20, printer:14, mobile:13, gpo:13, ou:16,
};
const MODE_COLOR = { select: ACCENT, connect: GREEN, delete: RED };

// ── Canvas helpers ────────────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

function drawPerson(ctx, x, y, sz, color, isDa) {
  // Head
  ctx.beginPath(); ctx.arc(x, y - sz*0.32, sz*0.27, 0, Math.PI*2);
  ctx.fillStyle = color; ctx.fill();
  // Body semi-ellipse
  ctx.beginPath(); ctx.ellipse(x, y+sz*0.24, sz*0.4, sz*0.44, 0, Math.PI, 0, true);
  ctx.fillStyle = color; ctx.fill();
  // DA gold badge
  if (isDa) {
    ctx.beginPath(); ctx.arc(x+sz*0.28, y-sz*0.55, sz*0.18, 0, Math.PI*2);
    ctx.fillStyle = ORANGE; ctx.fill();
    ctx.beginPath(); ctx.arc(x+sz*0.28, y-sz*0.55, sz*0.09, 0, Math.PI*2);
    ctx.fillStyle = '#12121f'; ctx.fill();
  }
}

function drawGroup(ctx, x, y, sz, color) {
  [{ ox:-sz*0.4, s:0.65 }, { ox:0, s:0.8 }, { ox:sz*0.4, s:0.65 }].forEach(({ ox, s }) => {
    const nx=x+ox, ps=sz*s;
    ctx.beginPath(); ctx.arc(nx, y-ps*0.32, ps*0.26, 0, Math.PI*2);
    ctx.fillStyle = color+'BB'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(nx, y+ps*0.22, ps*0.35, ps*0.42, 0, Math.PI, 0, true);
    ctx.fillStyle = color+'BB'; ctx.fill();
  });
}

function drawServer(ctx, x, y, sz, color, badge) {
  const w=sz*1.55, h=sz*1.08, rx=x-w/2, ry=y-h/2;
  rrect(ctx, rx, ry, w, h, 4);
  ctx.fillStyle = color+'1E'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(rx+4,ry+(h/4)*i); ctx.lineTo(rx+w-4,ry+(h/4)*i);
    ctx.strokeStyle=color+'40'; ctx.lineWidth=0.5; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(rx+w-6, ry+h/2, 2.5, 0, Math.PI*2);
  ctx.fillStyle=GREEN; ctx.fill();
  if (badge) { // DC shield
    const bx=rx+w+2, by=ry-2, ss=sz*0.16;
    ctx.beginPath(); ctx.arc(bx,by,sz*0.22,0,Math.PI*2);
    ctx.fillStyle='#0d0d1a'; ctx.fill();
    ctx.strokeStyle=ORANGE; ctx.lineWidth=1; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx,by-ss); ctx.lineTo(bx+ss*.8,by-ss*.3); ctx.lineTo(bx+ss*.8,by+ss*.2);
    ctx.quadraticCurveTo(bx,by+ss*1.1,bx-ss*.8,by+ss*.2); ctx.lineTo(bx-ss*.8,by-ss*.3);
    ctx.closePath(); ctx.fillStyle=ORANGE; ctx.fill();
  }
}

function drawWorkstation(ctx, x, y, sz, color) {
  const mw=sz*1.55, mh=sz*0.92, mx=x-mw/2, my=y-sz*0.68;
  rrect(ctx,mx,my,mw,mh,3); ctx.fillStyle=color+'1E'; ctx.fill();
  ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.stroke();
  rrect(ctx,mx+3,my+3,mw-6,mh-7,2); ctx.fillStyle=color+'12'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x-sz*.13,my+mh); ctx.lineTo(x-sz*.22,y+sz*.38);
  ctx.lineTo(x+sz*.22,y+sz*.38); ctx.lineTo(x+sz*.13,my+mh);
  ctx.fillStyle=color+'50'; ctx.fill();
  rrect(ctx,x-sz*.42,y+sz*.38,sz*.84,sz*.13,2); ctx.fillStyle=color; ctx.fill();
}

function drawComputer(ctx, x, y, sz, color) {
  // PC tower
  const tw=sz*0.9, th=sz*1.1, tx=x-tw/2, ty=y-th/2;
  rrect(ctx,tx,ty,tw,th,3); ctx.fillStyle=color+'1E'; ctx.fill();
  ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.stroke();
  // Drive slot
  rrect(ctx,tx+4,ty+th*0.3,tw-8,th*0.08,1); ctx.fillStyle=color+'50'; ctx.fill();
  // Power LED
  ctx.beginPath(); ctx.arc(tx+tw/2,ty+th*0.15,2.5,0,Math.PI*2);
  ctx.fillStyle=GREEN; ctx.fill();
  // $ label
  ctx.font=`bold ${sz*0.4}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle=color; ctx.fillText('$',x,y+sz*0.1);
}

function drawDomain(ctx, x, y, sz, color) {
  const hw=sz*0.95, ht=sz*0.92;
  ctx.beginPath();
  ctx.moveTo(x,y-ht); ctx.lineTo(x-hw,y+ht*.6); ctx.lineTo(x+hw,y+ht*.6); ctx.closePath();
  ctx.fillStyle=color+'08'; ctx.fill();
  ctx.strokeStyle=color; ctx.lineWidth=1.8;
  ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]);
}

function drawFirewall(ctx, x, y, sz, color) {
  // Shield outline
  const hw = sz * 0.75, ht = sz * 0.9;
  ctx.beginPath();
  ctx.moveTo(x, y - ht);
  ctx.lineTo(x + hw, y - ht * 0.35);
  ctx.lineTo(x + hw, y + ht * 0.1);
  ctx.quadraticCurveTo(x, y + ht, x - hw, y + ht * 0.1);
  ctx.lineTo(x - hw, y - ht * 0.35);
  ctx.closePath();
  ctx.fillStyle = color + '1C'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke();
  // Flame stripes
  for (let i = -1; i <= 1; i++) {
    const fx = x + i * sz * 0.28;
    ctx.beginPath();
    ctx.moveTo(fx, y + sz * 0.05);
    ctx.quadraticCurveTo(fx + sz * 0.1, y - sz * 0.2, fx, y - sz * 0.42);
    ctx.quadraticCurveTo(fx - sz * 0.1, y - sz * 0.2, fx, y + sz * 0.05);
    ctx.fillStyle = i === 0 ? color : color + '80'; ctx.fill();
  }
}

function drawRouter(ctx, x, y, sz, color) {
  // Circular body
  ctx.beginPath(); ctx.arc(x, y, sz * 0.65, 0, Math.PI * 2);
  ctx.fillStyle = color + '18'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  // Cross spokes
  [0, Math.PI/2, Math.PI, Math.PI*1.5].forEach(angle => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * sz * 0.62, y + Math.sin(angle) * sz * 0.62);
    ctx.strokeStyle = color + '70'; ctx.lineWidth = 1; ctx.stroke();
  });
  // Antennas
  [[-sz*0.35, -sz*0.65], [sz*0.35, -sz*0.65]].forEach(([ax, ay]) => {
    ctx.beginPath(); ctx.moveTo(x + ax, y); ctx.lineTo(x + ax, y + ay);
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(x + ax, y + ay, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  });
}

function drawDatabase(ctx, x, y, sz, color) {
  const rw = sz * 0.85, rh = sz * 0.28, ry = y - sz * 0.55;
  // Top ellipse
  ctx.beginPath(); ctx.ellipse(x, ry, rw, rh, 0, 0, Math.PI * 2);
  ctx.fillStyle = color + '30'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  // Body
  ctx.beginPath();
  ctx.moveTo(x - rw, ry); ctx.lineTo(x - rw, y + sz * 0.38);
  ctx.ellipse(x, y + sz * 0.38, rw, rh, 0, Math.PI, 0);
  ctx.lineTo(x + rw, ry);
  ctx.fillStyle = color + '1A'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  // Middle stripe line
  ctx.beginPath(); ctx.ellipse(x, y - sz * 0.05, rw, rh, 0, 0, Math.PI * 2);
  ctx.strokeStyle = color + '50'; ctx.lineWidth = 0.8; ctx.stroke();
}

function drawCloud(ctx, x, y, sz, color) {
  const puffs = [
    { ox: 0, oy: -sz * 0.22, r: sz * 0.46 },
    { ox: -sz * 0.5, oy: sz * 0.08, r: sz * 0.34 },
    { ox: sz * 0.5, oy: sz * 0.08, r: sz * 0.34 },
    { ox: -sz * 0.2, oy: sz * 0.2, r: sz * 0.32 },
    { ox: sz * 0.2, oy: sz * 0.2, r: sz * 0.32 },
  ];
  puffs.forEach(({ ox, oy, r }) => {
    ctx.beginPath(); ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    ctx.fillStyle = color + '28'; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke();
  });
  // Base line
  ctx.fillStyle = color + '28';
  ctx.fillRect(x - sz * 0.72, y + sz * 0.2, sz * 1.44, sz * 0.26);
}

function drawPrinter(ctx, x, y, sz, color) {
  // Paper tray at bottom
  const pw = sz * 1.4, ph = sz * 0.36;
  rrect(ctx, x - pw/2, y + sz * 0.3, pw, ph, 2);
  ctx.fillStyle = color + '20'; ctx.fill();
  ctx.strokeStyle = color + '60'; ctx.lineWidth = 1; ctx.stroke();
  // Paper sheet
  rrect(ctx, x - sz * 0.45, y - sz * 0.65, sz * 0.9, sz * 0.7, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
  ctx.strokeStyle = color + '80'; ctx.lineWidth = 0.8; ctx.stroke();
  // Body
  rrect(ctx, x - pw/2, y - sz * 0.22, pw, sz * 0.62, 3);
  ctx.fillStyle = color + '1E'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  // Status LED
  ctx.beginPath(); ctx.arc(x + pw/2 - 6, y + sz * 0.08, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = GREEN; ctx.fill();
}

function drawMobile(ctx, x, y, sz, color) {
  const mw = sz * 0.72, mh = sz * 1.2;
  rrect(ctx, x - mw/2, y - mh/2, mw, mh, 5);
  ctx.fillStyle = color + '1E'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  // Screen
  rrect(ctx, x - mw/2 + 3, y - mh/2 + sz * 0.18, mw - 6, mh - sz * 0.38, 3);
  ctx.fillStyle = color + '12'; ctx.fill();
  // Home button
  ctx.beginPath(); ctx.arc(x, y + mh/2 - sz * 0.12, sz * 0.09, 0, Math.PI * 2);
  ctx.strokeStyle = color + '80'; ctx.lineWidth = 1; ctx.stroke();
}

function drawGPO(ctx, x, y, sz, color) {
  // Document shape
  const dw = sz * 1.1, dh = sz * 1.2;
  rrect(ctx, x - dw/2, y - dh/2, dw, dh, 3);
  ctx.fillStyle = color + '18'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  // Folded corner
  ctx.beginPath();
  ctx.moveTo(x + dw/2 - sz*0.28, y - dh/2);
  ctx.lineTo(x + dw/2, y - dh/2 + sz*0.28);
  ctx.lineTo(x + dw/2 - sz*0.28, y - dh/2 + sz*0.28);
  ctx.closePath();
  ctx.fillStyle = color + '40'; ctx.fill();
  // Text lines
  [-0.2, 0, 0.2].forEach(off => {
    const ly = y + sz * off;
    ctx.beginPath(); ctx.moveTo(x - dw/2 + 5, ly); ctx.lineTo(x + dw/2 - 8, ly);
    ctx.strokeStyle = color + '60'; ctx.lineWidth = 1; ctx.stroke();
  });
}

function drawOU(ctx, x, y, sz, color) {
  // Folder tab
  const fw = sz * 1.55, fh = sz * 1.05;
  rrect(ctx, x - fw*0.35, y - fh/2 - sz*0.22, fw*0.55, sz*0.28, 3);
  ctx.fillStyle = color + '30'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke();
  // Main folder body
  rrect(ctx, x - fw/2, y - fh/2, fw, fh, 4);
  ctx.fillStyle = color + '1A'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  // Person inside
  ctx.beginPath(); ctx.arc(x, y - sz*0.06, sz*0.18, 0, Math.PI*2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y+sz*0.32, sz*0.24, sz*0.26, 0, Math.PI, 0, true);
  ctx.fillStyle = color; ctx.fill();
}

function labelYOffset(type, sz) {
  if (type==='domain')                                               return sz*0.75;
  if (['server','dc','workstation','computer'].includes(type))       return sz*0.66;
  if (['cloud','router'].includes(type))                             return sz*0.72;
  if (['database','printer','mobile','gpo','ou'].includes(type))     return sz*0.70;
  if (type==='firewall')                                             return sz*0.68;
  return sz*0.64;
}

// ── Module-level UI primitives (stable references, never remount) ─────────────
const SL = memo(function SL({ children }) {
  return (
    <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
      letterSpacing="wider" fontWeight="bold" mb={1.5}>{children}</Text>
  );
});

const CardWrap = memo(({ color, title, children, ...rest }) => (
  <Box pos="relative" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="14px" overflow="hidden" px={4} pt={4} pb={4} {...rest}>
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background:`linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    {title && (
      <Text fontSize="11px" fontWeight="bold" color={color}
        textTransform="uppercase" letterSpacing="widest" mb={3}>{title}</Text>
    )}
    {children}
  </Box>
));

function iSx(accent) {
  const a = accent || ACCENT;
  return {
    bg: 'rgba(0,0,0,0.28)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--dash-text-primary)',
    _placeholder: { color:'var(--dash-text-muted)', fontSize:'11px' },
    _hover: { border:`1px solid ${a}40` },
    _focus: { border:`1px solid ${a}70`, boxShadow:`0 0 0 1px ${a}30` },
  };
}

// ── Left Panel (module-level so it never remounts) ────────────────────────────
const LeftPanel = memo(function LeftPanel({
  form, onFormChange, onAddNode,
  mode, onModeChange,
  connectSrc, onClearConnectSrc,
  edgeType, onEdgeTypeChange,
  edgeLabel, onEdgeLabelChange,
  selectedNode, editForm, onEditFormChange, onUpdateNode, onDeleteNode,
  onExportPng, onExportJson, onImportClick, onImportChange, importRef,
  onClearCanvas,
}) {
  const mc = MODE_COLOR[mode];
  return (
    <Flex direction="column" gap={3}>

      {/* Add Node */}
      <CardWrap color={ACCENT} title="Add Node">
        <Flex direction="column" gap={2.5}>
          <Box>
            <SL>Type</SL>
            <Select size="sm" value={form.type}
              onChange={e => onFormChange('type', e.target.value)}
              {...iSx(NODE_TYPES[form.type]?.color)}>
              {Object.entries(NODE_TYPES).map(([k,v]) => (
                <option key={k} value={k} style={{ background:'#1a1a2e' }}>{v.label}</option>
              ))}
            </Select>
          </Box>
          <Box>
            <SL>Name *</SL>
            <Input size="sm" value={form.label}
              onChange={e => onFormChange('label', e.target.value)}
              onKeyDown={e => e.key==='Enter' && onAddNode()}
              placeholder="DOMAIN\user or DC01.corp.local"
              {...iSx()} />
          </Box>
          <Box>
            <SL>Subtitle</SL>
            <Input size="sm" value={form.sublabel}
              onChange={e => onFormChange('sublabel', e.target.value)}
              placeholder="domain admin"
              {...iSx()} />
          </Box>
          <Box>
            <SL>Notes / Details</SL>
            <Textarea size="sm" value={form.notes}
              onChange={e => onFormChange('notes', e.target.value)}
              placeholder={"192.168.1.10\nWindows Server 2019\nno defender"}
              {...iSx()} rows={3} resize="vertical" fontSize="11px" />
          </Box>
          <Box>
            <Flex align="center" justify="space-between" mb={1.5}>
              <SL>Node Size</SL>
              <Text fontSize="10px" color={ACCENT} fontWeight="bold">{form.sizeMultiplier?.toFixed(1)}x</Text>
            </Flex>
            <Slider min={0.5} max={3} step={0.1} value={form.sizeMultiplier ?? 1}
              onChange={v => onFormChange('sizeMultiplier', v)}>
              <SliderTrack bg="rgba(255,255,255,0.1)" h="3px" borderRadius="2px">
                <SliderFilledTrack bg={ACCENT} />
              </SliderTrack>
              <SliderThumb boxSize={3} bg={ACCENT} />
            </Slider>
          </Box>
          <Button size="sm" leftIcon={<AddIcon />}
            bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
            _hover={{ bg:`${ACCENT}35` }} borderRadius="8px" fontSize="12px"
            onClick={onAddNode}>
            Add Node
          </Button>
        </Flex>
      </CardWrap>

      {/* Mode */}
      <CardWrap color={mc}>
        <Flex align="center" justify="space-between" mb={3}>
          <Text fontSize="11px" fontWeight="bold" color={mc}
            textTransform="uppercase" letterSpacing="widest">Mode</Text>
        </Flex>
        <Flex gap={1.5} mb={mode!=='select' ? 3 : 0}>
          {[['select','Select'],['connect','Connect'],['delete','Delete']].map(([m,lbl]) => (
            <Box key={m} flex="1" py="6px" borderRadius="7px" cursor="pointer" textAlign="center"
              bg={mode===m ? `${MODE_COLOR[m]}22` : 'rgba(255,255,255,0.04)'}
              border={`1px solid ${mode===m ? MODE_COLOR[m] : 'rgba(255,255,255,0.08)'}`}
              transition="all 0.15s"
              onClick={() => onModeChange(m)}>
              <Text fontSize="10px" fontWeight="bold"
                color={mode===m ? MODE_COLOR[m] : 'var(--dash-text-muted)'}>{lbl}</Text>
            </Box>
          ))}
        </Flex>

        {mode==='connect' && (
          <Flex direction="column" gap={2.5}>
            {connectSrc ? (
              <Flex align="center" gap={2} px={2} py="6px" borderRadius="7px"
                bg={`${ORANGE}12`} border={`1px solid ${ORANGE}40`}>
                <Box w="5px" h="5px" borderRadius="full" bg={ORANGE} flexShrink={0} />
                <Text fontSize="10px" color={ORANGE} flex="1" noOfLines={1}>→ {connectSrc.label}</Text>
                <Box cursor="pointer" onClick={onClearConnectSrc}><CloseIcon boxSize={2} color={ORANGE} /></Box>
              </Flex>
            ) : (
              <Text fontSize="10px" color="var(--dash-text-muted)">Click a source node, then click target</Text>
            )}
            <Box>
              <SL>Edge Type</SL>
              <Select size="sm" value={edgeType} onChange={e => onEdgeTypeChange(e.target.value)}
                {...iSx(EDGE_TYPES[edgeType]?.color)}>
                {Object.entries(EDGE_TYPES).map(([k,v]) => (
                  <option key={k} value={k} style={{ background:'#1a1a2e' }}>{v.label}</option>
                ))}
              </Select>
            </Box>
            <Box>
              <SL>Edge Label (appears on arrow)</SL>
              <Input size="sm" value={edgeLabel} onChange={e => onEdgeLabelChange(e.target.value)}
                placeholder="admin / GenericAll / CanPSRemote"
                {...iSx(EDGE_TYPES[edgeType]?.color)} />
            </Box>
          </Flex>
        )}
        {mode==='delete' && (
          <Text fontSize="10px" color={RED}>Click any node or edge to delete it</Text>
        )}
      </CardWrap>

      {/* Edit selected node */}
      {selectedNode && (
        <CardWrap color={NODE_TYPES[selectedNode.type]?.color||ACCENT}>
          <Flex align="center" justify="space-between" mb={3}>
            <Text fontSize="11px" fontWeight="bold"
              color={NODE_TYPES[selectedNode.type]?.color||ACCENT}
              textTransform="uppercase" letterSpacing="widest">Edit Node</Text>
            <Box cursor="pointer" color="var(--dash-text-muted)" _hover={{ color:'white' }}
              onClick={() => onDeleteNode(null, true)}>
              <CloseIcon boxSize={2.5} />
            </Box>
          </Flex>
          <Flex direction="column" gap={2.5}>
            <Box>
              <SL>Type</SL>
              <Select size="sm" value={editForm.type}
                onChange={e => onEditFormChange('type', e.target.value)}
                {...iSx(NODE_TYPES[editForm.type]?.color)}>
                {Object.entries(NODE_TYPES).map(([k,v]) => (
                  <option key={k} value={k} style={{ background:'#1a1a2e' }}>{v.label}</option>
                ))}
              </Select>
            </Box>
            <Box>
              <SL>Name</SL>
              <Input size="sm" value={editForm.label}
                onChange={e => onEditFormChange('label', e.target.value)}
                {...iSx()} />
            </Box>
            <Box>
              <SL>Subtitle</SL>
              <Input size="sm" value={editForm.sublabel}
                onChange={e => onEditFormChange('sublabel', e.target.value)}
                {...iSx()} />
            </Box>
            <Box>
              <SL>Notes / Details</SL>
              <Textarea size="sm" value={editForm.notes}
                onChange={e => onEditFormChange('notes', e.target.value)}
                {...iSx()} rows={3} resize="vertical" fontSize="11px" />
            </Box>
            <Box>
              <Flex align="center" justify="space-between" mb={1.5}>
                <SL>Node Size</SL>
                <Text fontSize="10px" color={NODE_TYPES[editForm.type]?.color||ACCENT} fontWeight="bold">
                  {(editForm.sizeMultiplier ?? 1).toFixed(1)}x
                </Text>
              </Flex>
              <Slider min={0.5} max={3} step={0.1} value={editForm.sizeMultiplier ?? 1}
                onChange={v => onEditFormChange('sizeMultiplier', v)}>
                <SliderTrack bg="rgba(255,255,255,0.1)" h="3px" borderRadius="2px">
                  <SliderFilledTrack bg={NODE_TYPES[editForm.type]?.color||ACCENT} />
                </SliderTrack>
                <SliderThumb boxSize={3} bg={NODE_TYPES[editForm.type]?.color||ACCENT} />
              </Slider>
            </Box>
            <Flex gap={2}>
              <Button flex="1" size="sm"
                bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
                _hover={{ bg:`${ACCENT}35` }} borderRadius="8px" fontSize="11px"
                onClick={onUpdateNode}>Save Changes</Button>
              <Button size="sm" px={3}
                bg={`${RED}15`} color={RED} border={`1px solid ${RED}40`}
                _hover={{ bg:`${RED}28` }} borderRadius="8px"
                onClick={() => onDeleteNode(selectedNode.id)}>
                <DeleteIcon boxSize={3} />
              </Button>
            </Flex>
          </Flex>
        </CardWrap>
      )}

      {/* Export / Import */}
      <CardWrap color={PURPLE} title="Export / Import">
        <Flex direction="column" gap={2}>
          <Button size="sm" leftIcon={<ExternalLinkIcon />}
            bg={`${GREEN}18`} color={GREEN} border={`1px solid ${GREEN}45`}
            _hover={{ bg:`${GREEN}30` }} borderRadius="8px" fontSize="11px"
            onClick={onExportPng}>Export PNG</Button>
          <Button size="sm" leftIcon={<ExternalLinkIcon />}
            bg={`${ACCENT}18`} color={ACCENT} border={`1px solid ${ACCENT}45`}
            _hover={{ bg:`${ACCENT}30` }} borderRadius="8px" fontSize="11px"
            onClick={onExportJson}>Export JSON</Button>
          <input ref={importRef} type="file" accept=".json"
            style={{ display:'none' }} onChange={onImportChange} />
          <Button size="sm" leftIcon={<AttachmentIcon />}
            bg="rgba(255,255,255,0.05)" color="var(--dash-text-secondary)"
            border="1px solid rgba(255,255,255,0.1)"
            _hover={{ bg:'rgba(255,255,255,0.1)', color:'white' }}
            borderRadius="8px" fontSize="11px"
            onClick={onImportClick}>Import JSON</Button>
          <Button size="sm"
            bg={`${RED}10`} color={RED} border={`1px solid ${RED}30`}
            _hover={{ bg:`${RED}22` }} borderRadius="8px" fontSize="11px"
            onClick={onClearCanvas}>Clear Canvas</Button>
        </Flex>
      </CardWrap>

      {/* Legend */}
      <CardWrap color={CYAN} title="Legend">
        <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
          letterSpacing="wider" fontWeight="bold" mb={2}>Nodes</Text>
        <Flex direction="column" gap={1.5} mb={3}>
          {Object.entries(NODE_TYPES).map(([k,v]) => (
            <Flex key={k} align="center" gap={2}>
              <Box w="8px" h="8px" borderRadius="2px" bg={v.color} flexShrink={0} />
              <Text fontSize="10px" color="var(--dash-text-secondary)">{v.label}</Text>
            </Flex>
          ))}
        </Flex>
        <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
          letterSpacing="wider" fontWeight="bold" mb={2}>Edges</Text>
        <Flex direction="column" gap={1.5}>
          {Object.entries(EDGE_TYPES).map(([k,v]) => (
            <Flex key={k} align="center" gap={2}>
              <Box w="14px" h="2px" bg={v.color} flexShrink={0} borderRadius="1px" />
              <Text fontSize="10px" color="var(--dash-text-secondary)">{v.label}</Text>
            </Flex>
          ))}
        </Flex>
      </CardWrap>
    </Flex>
  );
});

// ── Main View ─────────────────────────────────────────────────────────────────
const ADGrapherView = () => {
  const containerRef   = useRef(null);
  const fsContainerRef = useRef(null);
  const fgRef          = useRef(null);
  const fsFgRef        = useRef(null);
  const importRef      = useRef(null);

  const [nodes,          setNodes]          = useState([]);
  const [edges,          setEdges]          = useState([]);
  const [selectedId,     setSelectedId]     = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [mode,           setMode]           = useState('select');
  const [connectSrc,     setConnectSrc]     = useState(null);
  const [edgeType,       setEdgeType]       = useState('admin');
  const [edgeLabel,      setEdgeLabel]      = useState('');
  const [dims,           setDims]           = useState({ w:0, h:0 });
  const [fsDims,         setFsDims]         = useState({ w:0, h:0 });
  const [fullscreen,     setFullscreen]     = useState(false);
  const [panelOpen,      setPanelOpen]      = useState(true);

  // Add-node form (NOT inside LeftPanel to avoid re-render issues)
  const [form, setForm] = useState({ type:'user', label:'', sublabel:'', notes:'', sizeMultiplier:1 });

  // Edit-node form
  const [editForm, setEditForm] = useState({ type:'user', label:'', sublabel:'', notes:'', sizeMultiplier:1 });

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedId) ?? null, [nodes, selectedId]);

  // Sync edit form when selection changes
  useEffect(() => {
    if (selectedNode) {
      setEditForm({
        type:           selectedNode.type           || 'user',
        label:          selectedNode.label          || '',
        sublabel:       selectedNode.sublabel       || '',
        notes:          selectedNode.notes          || '',
        sizeMultiplier: selectedNode.sizeMultiplier ?? 1,
      });
    }
  }, [selectedNode?.id]); // eslint-disable-line

  // Measure containers
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setDims({ w:Math.floor(width), h:Math.floor(height) });
    });
    ro.observe(el); return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = fsContainerRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setFsDims({ w:Math.floor(width), h:Math.floor(height) });
    });
    ro.observe(el); return () => ro.disconnect();
  }, [fullscreen, panelOpen]);

  useEffect(() => {
    const h = (e) => { if (e.key==='Escape') setFullscreen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── Form handlers (stable, no stale closures) ──
  const onFormChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const onEditFormChange = useCallback((field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── Node mutations ──
  const onAddNode = useCallback(() => {
    // Read form at call time (form in dep array) — do NOT call setNodes inside setForm updater
    // to avoid React Strict Mode double-invocation causing duplicate nodes.
    if (!form.label.trim()) return;
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setNodes(prev => [...prev, {
      id,
      type:           form.type,
      label:          form.label,
      sublabel:       form.sublabel,
      notes:          form.notes,
      sizeMultiplier: form.sizeMultiplier ?? 1,
      x: (Math.random()-0.5)*500,
      y: (Math.random()-0.5)*350,
    }]);
    setForm(prev => ({ ...prev, label:'', sublabel:'', notes:'' }));
  }, [form]);

  const onUpdateNode = useCallback(() => {
    setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, ...editForm } : n));
  }, [selectedId, editForm]);

  const onDeleteNode = useCallback((id, deselect = false) => {
    if (deselect) { setSelectedId(null); return; }
    setEdges(prev => prev.filter(e =>
      e.source !== id && e.target !== id &&
      e.source?.id !== id && e.target?.id !== id
    ));
    setNodes(prev => prev.filter(n => n.id !== id));
    setSelectedId(null);
  }, []);

  const onModeChange = useCallback((m) => {
    setMode(m); setConnectSrc(null);
  }, []);

  const onClearConnectSrc = useCallback(() => setConnectSrc(null), []);

  const onClearCanvas = useCallback(() => {
    setNodes([]); setEdges([]); setSelectedId(null); setSelectedEdgeId(null);
  }, []);

  // ── Graph data ──
  const graphData = useMemo(() => ({
    nodes: nodes.map(n => ({ ...n, fx: n.x, fy: n.y })),
    links: edges,
  }), [nodes, edges]);

  // ── Canvas node rendering ──
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const { x, y, type='user', label='', sublabel='', notes='', sizeMultiplier=1 } = node;
    const nt    = NODE_TYPES[type] || NODE_TYPES.user;
    const rawSz = NSIZES[type] || 15;
    const sz    = rawSz * (sizeMultiplier || 1);
    const color = nt.color;
    const isSel = node.id === selectedId;
    const isSrc = node.id === connectSrc?.id;

    // Glow
    if (isSel || isSrc) {
      ctx.beginPath();
      ctx.arc(x, y, sz + (type==='domain' ? 10 : 7), 0, Math.PI*2);
      ctx.fillStyle = isSrc ? ORANGE+'38' : color+'2A';
      ctx.fill();
    }

    if      (type==='domain')      drawDomain(ctx,x,y,sz,color);
    else if (type==='user')        drawPerson(ctx,x,y,sz,color,false);
    else if (type==='da')          drawPerson(ctx,x,y,sz,color,true);
    else if (type==='group')       drawGroup(ctx,x,y,sz,color);
    else if (type==='dc')          drawServer(ctx,x,y,sz,color,true);
    else if (type==='server')      drawServer(ctx,x,y,sz,color,false);
    else if (type==='workstation') drawWorkstation(ctx,x,y,sz,color);
    else if (type==='computer')    drawComputer(ctx,x,y,sz,color);
    else if (type==='firewall')    drawFirewall(ctx,x,y,sz,color);
    else if (type==='router')      drawRouter(ctx,x,y,sz,color);
    else if (type==='database')    drawDatabase(ctx,x,y,sz,color);
    else if (type==='cloud')       drawCloud(ctx,x,y,sz,color);
    else if (type==='printer')     drawPrinter(ctx,x,y,sz,color);
    else if (type==='mobile')      drawMobile(ctx,x,y,sz,color);
    else if (type==='gpo')         drawGPO(ctx,x,y,sz,color);
    else if (type==='ou')          drawOU(ctx,x,y,sz,color);

    // Text labels
    const baseFontSize = Math.max(11/globalScale, 2.5);
    const yo = labelYOffset(type, sz);
    ctx.textAlign='center'; ctx.shadowColor='rgba(0,0,0,0.98)'; ctx.shadowBlur=4;

    // Name (bold)
    ctx.font = `bold ${baseFontSize}px Arial,sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fillText(label, x, y+yo);

    let lineY = y + yo + baseFontSize + 1;

    // Subtitle (colored)
    if (sublabel) {
      ctx.font = `${baseFontSize*0.88}px Arial,sans-serif`;
      ctx.fillStyle = color;
      ctx.fillText(sublabel, x, lineY);
      lineY += baseFontSize*0.88 + 1;
    }

    // Notes (multiline, muted)
    if (notes) {
      const fs2 = baseFontSize * 0.82;
      ctx.font = `${fs2}px Arial,sans-serif`;
      ctx.fillStyle = 'rgba(200,200,220,0.75)';
      notes.split('\n').slice(0,4).forEach(line => {
        ctx.fillText(line.trim(), x, lineY);
        lineY += fs2 + 1;
      });
    }
    ctx.shadowBlur = 0;
  }, [selectedId, connectSrc]);

  const nodePointerAreaPaint = useCallback((node, color, ctx) => {
    const rawSz = NSIZES[node.type] || 15;
    const sz = rawSz * (node.sizeMultiplier || 1) + 6;
    ctx.beginPath(); ctx.arc(node.x, node.y, sz, 0, Math.PI*2);
    ctx.fillStyle = color; ctx.fill();
  }, []);

  // ── Link canvas (labels on arrows) ──
  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    const s=link.source, t=link.target;
    if (!s?.x || !t?.x || !link.label) return;
    const mx=(s.x+t.x)/2, my=(s.y+t.y)/2;
    const fs = Math.max(9/globalScale, 2.2);
    ctx.font = `${fs}px Arial,sans-serif`;
    const tw = ctx.measureText(link.label).width;
    rrect(ctx, mx-tw/2-3, my-fs/2-2, tw+6, fs+4, 2);
    ctx.fillStyle='rgba(6,6,18,0.88)'; ctx.fill();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle = EDGE_TYPES[link.type]?.color || ACCENT;
    ctx.fillText(link.label, mx, my);
  }, []);

  // ── Event handlers ──
  const onNodeClick = useCallback((node) => {
    if (mode==='connect') {
      if (!connectSrc) {
        setConnectSrc(node); setSelectedEdgeId(null);
      } else if (connectSrc.id===node.id) {
        setConnectSrc(null);
      } else {
        const lbl = edgeLabel.trim() || EDGE_TYPES[edgeType]?.label || '';
        setEdges(p => [...p, {
          id: `e-${Date.now()}`,
          source: connectSrc.id,
          target: node.id,
          type:   edgeType,
          label:  lbl,
        }]);
        setConnectSrc(null);
      }
    } else if (mode==='delete') {
      onDeleteNode(node.id);
    } else {
      setSelectedId(prev => prev===node.id ? null : node.id);
      setSelectedEdgeId(null);
    }
  }, [mode, connectSrc, edgeType, edgeLabel, onDeleteNode]);

  const onLinkClick = useCallback((link) => {
    if (mode==='delete') {
      setEdges(p => p.filter(e => e.id!==link.id));
    } else {
      setSelectedEdgeId(prev => prev===link.id ? null : link.id);
      setSelectedId(null);
    }
  }, [mode]);

  const onNodeDragEnd = useCallback((node) => {
    setNodes(p => p.map(n => n.id===node.id ? { ...n, x:node.x, y:node.y } : n));
  }, []);

  const onBackgroundClick = useCallback(() => {
    setSelectedId(null); setSelectedEdgeId(null); setConnectSrc(null);
  }, []);

  // ── Export / Import ──
  const onExportPng = useCallback(() => {
    const canvas = (fullscreen ? fsContainerRef : containerRef).current?.querySelector('canvas');
    if (!canvas) return;
    const a=document.createElement('a'); a.download='ad-graph.png'; a.href=canvas.toDataURL('image/png'); a.click();
  }, [fullscreen]);

  const onExportJson = useCallback(() => {
    const blob=new Blob([JSON.stringify({nodes,edges},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.download='ad-graph.json'; a.href=url; a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const onImportChange = useCallback((e) => {
    const f=e.target.files?.[0]; if (!f) return;
    const r=new FileReader();
    r.onload=ev => {
      try {
        const d=JSON.parse(ev.target.result);
        if (Array.isArray(d.nodes)) setNodes(d.nodes);
        if (Array.isArray(d.edges)) setEdges(d.edges);
      } catch {}
    };
    r.readAsText(f); e.target.value='';
  }, []);

  const onImportClick = useCallback(() => importRef.current?.click(), []);

  // Shared FG props
  // Auto zoom-to-fit whenever nodes are added/removed
  useEffect(() => {
    if (nodes.length === 0) return;
    const timer = setTimeout(() => {
      const ref = fullscreen ? fsFgRef : fgRef;
      ref.current?.zoomToFit(400, 60);
    }, 120);
    return () => clearTimeout(timer);
  }, [nodes.length, fullscreen]); // eslint-disable-line

  const fgProps = {
    graphData,
    backgroundColor: 'transparent',
    // d3AlphaDecay=1 stops the simulation after 1 tick (pins stay in place)
    // Do NOT set cooldownTicks:0 — that blocks all canvas painting
    d3AlphaDecay: 1,
    d3VelocityDecay: 1,
    nodeCanvasObject,
    nodePointerAreaPaint,
    linkCanvasObject,
    linkCanvasObjectMode: () => 'after',
    linkColor:  link => EDGE_TYPES[link.type]?.color || ACCENT,
    linkWidth:  link => link.id===selectedEdgeId ? 3 : 1.5,
    linkDirectionalArrowLength: 6,
    linkDirectionalArrowRelPos: 0.9,
    linkDirectionalArrowColor: link => EDGE_TYPES[link.type]?.color || ACCENT,
    onNodeClick,
    onLinkClick,
    onNodeDragEnd,
    onBackgroundClick,
    enableNodeDrag: mode !== 'connect',
    nodeLabel: () => '',
  };

  const panelProps = {
    form, onFormChange, onAddNode,
    mode, onModeChange,
    connectSrc, onClearConnectSrc,
    edgeType, onEdgeTypeChange: setEdgeType,
    edgeLabel, onEdgeLabelChange: setEdgeLabel,
    selectedNode, editForm, onEditFormChange, onUpdateNode, onDeleteNode,
    onExportPng, onExportJson, onImportClick, onImportChange, importRef,
    onClearCanvas,
  };

  const emptyCanvas = nodes.length === 0;
  const mc = MODE_COLOR[mode];

  return (
    <>
      {/* ── Normal mode ────────────────────────────────────────────────────── */}
      <MotionBox initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.3 }} px={6} pb={4} pt={5}>

        <Flex align="center" justify="space-between" mb={4}>
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
              AD <Text as="span" color="red.400">Grapher</Text>
            </Text>
            <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
              Map AD topology, network relationships and attack paths · export PNG / JSON
            </Text>
          </Box>
          <Button size="sm"
            bg={`${ACCENT}20`} color={ACCENT} border={`1px solid ${ACCENT}50`}
            _hover={{ bg:`${ACCENT}35` }} borderRadius="8px" fontSize="12px"
            onClick={() => setFullscreen(true)}>
            Fullscreen
          </Button>
        </Flex>

        <Box mb={4} px={4} py={3} borderRadius="10px"
          bg="rgba(99,179,237,0.07)" border="1px solid rgba(99,179,237,0.25)">
          <Flex align="center" gap={2} mb={1.5}>
            <InfoIcon boxSize={3} color={ACCENT} />
            <Text fontSize="10px" fontWeight="bold" color={ACCENT}
              textTransform="uppercase" letterSpacing="wider">AD Grapher</Text>
          </Flex>
          <Flex gap={4} flexWrap="wrap">
            {['Add nodes (users, DAs, groups, DCs, servers, domain boundaries) · drag freely to position',
              'Connect mode: click source → click target to draw colored directed edges',
              'Type the edge label (e.g. admin, GenericAll, CanPSRemote) before clicking the target',
            ].map(t => (
              <Flex key={t} align="center" gap={1.5}>
                <Box w="4px" h="4px" borderRadius="full" bg={ACCENT} flexShrink={0} />
                <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
              </Flex>
            ))}
          </Flex>
        </Box>

        <Flex gap={4} align="flex-start" h="calc(100vh - 265px)" minH="520px">
          <Box w="265px" minW="265px" h="100%" overflowY="auto"
            sx={{ '&::-webkit-scrollbar':{ width:'3px' },'&::-webkit-scrollbar-thumb':{ background:'rgba(255,255,255,0.1)',borderRadius:'2px' } }}>
            <LeftPanel {...panelProps} />
          </Box>

          <Box borderRadius="14px" overflow="hidden" flex="1" h="100%"
            bg="rgba(5,5,16,0.97)" border="1px solid var(--dash-card-border)" pos="relative">
            <Box pos="absolute" top={0} left={0} right={0} h="2px" zIndex={1}
              style={{ background:`linear-gradient(to right, transparent, ${RED}60, transparent)` }} />
            <Box ref={containerRef} w="100%" h="100%" pos="relative">
              {emptyCanvas && (
                <Flex pos="absolute" inset={0} direction="column" align="center" justify="center"
                  gap={3} zIndex={1} pointerEvents="none">
                  <Flex w="48px" h="48px" borderRadius="12px" align="center" justify="center"
                    bg={`${ACCENT}12`} border={`1px solid ${ACCENT}30`}>
                    <InfoIcon boxSize={4} color={ACCENT} />
                  </Flex>
                  <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">Canvas is empty</Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" maxW="280px">
                    Fill in the form on the left and click Add Node · drag to reposition · Connect mode to draw edges
                  </Text>
                </Flex>
              )}
              {/* Only render when NOT in fullscreen to avoid dual-instance conflict */}
              {!fullscreen && dims.w > 0 && (
                <ForceGraph2D ref={fgRef} width={dims.w} height={dims.h} {...fgProps} />
              )}
            </Box>
          </Box>
        </Flex>
      </MotionBox>

      {/* ── Fullscreen overlay ──────────────────────────────────────────────── */}
      {fullscreen && (
        <Box pos="fixed" inset={0} zIndex={9999} bg="#060610"
          display="flex" flexDirection="column">

          {/* Top bar */}
          <Flex align="center" gap={3} px={4} h="44px" flexShrink={0}
            bg="rgba(10,10,24,0.97)" borderBottom="1px solid rgba(255,255,255,0.08)">
            <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">
              AD <Text as="span" color="red.400">Grapher</Text>
            </Text>
            <Box w="1px" h="16px" bg="rgba(255,255,255,0.1)" />
            <Flex gap={1}>
              {[['select','Select'],['connect','Connect'],['delete','Delete']].map(([m,lbl]) => (
                <Box key={m} px={3} py="4px" borderRadius="6px" cursor="pointer"
                  bg={mode===m ? `${MODE_COLOR[m]}22` : 'rgba(255,255,255,0.04)'}
                  border={`1px solid ${mode===m ? MODE_COLOR[m] : 'rgba(255,255,255,0.08)'}`}
                  transition="all 0.15s" onClick={() => onModeChange(m)}>
                  <Text fontSize="11px" fontWeight="bold"
                    color={mode===m ? MODE_COLOR[m] : 'var(--dash-text-muted)'}>{lbl}</Text>
                </Box>
              ))}
            </Flex>
            {mode==='connect' && (
              <Flex align="center" gap={2}>
                <Select size="xs" value={edgeType} onChange={e => setEdgeType(e.target.value)}
                  w="110px" bg="rgba(0,0,0,0.3)" border="1px solid rgba(255,255,255,0.12)"
                  color="var(--dash-text-primary)" borderRadius="6px" fontSize="11px">
                  {Object.entries(EDGE_TYPES).map(([k,v]) => (
                    <option key={k} value={k} style={{ background:'#1a1a2e' }}>{v.label}</option>
                  ))}
                </Select>
                <Input size="xs" value={edgeLabel} onChange={e => setEdgeLabel(e.target.value)}
                  placeholder="e.g. GenericAll / CanRDP" w="160px"
                  bg="rgba(0,0,0,0.3)" border="1px solid rgba(255,255,255,0.12)"
                  color="var(--dash-text-primary)" borderRadius="6px" fontSize="11px"
                  _placeholder={{ color:'var(--dash-text-muted)',fontSize:'10px' }} />
                {connectSrc && (
                  <Flex align="center" gap={1.5} px={2} py="3px" borderRadius="6px"
                    bg={`${ORANGE}12`} border={`1px solid ${ORANGE}40`}>
                    <Box w="4px" h="4px" borderRadius="full" bg={ORANGE} />
                    <Text fontSize="10px" color={ORANGE}>→ {connectSrc.label}</Text>
                    <Box cursor="pointer" ml={1} onClick={onClearConnectSrc}>
                      <CloseIcon boxSize={2} color={ORANGE} />
                    </Box>
                  </Flex>
                )}
              </Flex>
            )}
            <Box ml="auto" display="flex" gap={2} alignItems="center">
              <Text fontSize="10px" color="var(--dash-text-muted)">{nodes.length} nodes · {edges.length} edges</Text>
              <Box w="1px" h="16px" bg="rgba(255,255,255,0.1)" />
              <Button size="xs" leftIcon={<ExternalLinkIcon boxSize={2.5} />}
                bg={`${GREEN}18`} color={GREEN} border={`1px solid ${GREEN}40`}
                _hover={{ bg:`${GREEN}30` }} borderRadius="6px" fontSize="11px"
                onClick={onExportPng}>PNG</Button>
              <Button size="xs" leftIcon={<ExternalLinkIcon boxSize={2.5} />}
                bg={`${ACCENT}18`} color={ACCENT} border={`1px solid ${ACCENT}40`}
                _hover={{ bg:`${ACCENT}30` }} borderRadius="6px" fontSize="11px"
                onClick={onExportJson}>JSON</Button>
              <Box w="1px" h="16px" bg="rgba(255,255,255,0.1)" />
              <Button size="xs"
                bg="rgba(255,255,255,0.06)" color="var(--dash-text-secondary)"
                border="1px solid rgba(255,255,255,0.1)"
                _hover={{ color:'white', bg:'rgba(255,255,255,0.12)' }}
                borderRadius="6px" fontSize="11px"
                onClick={() => setPanelOpen(p => !p)}>
                {panelOpen ? '◀ Panel' : '▶ Panel'}
              </Button>
              <Button size="xs" leftIcon={<CloseIcon boxSize={2} />}
                bg={`${RED}15`} color={RED} border={`1px solid ${RED}40`}
                _hover={{ bg:`${RED}28` }} borderRadius="6px" fontSize="11px"
                onClick={() => setFullscreen(false)}>Exit</Button>
            </Box>
          </Flex>

          {/* Body */}
          <Flex flex="1" minH={0}>
            {panelOpen && (
              <Box w="265px" minW="265px" h="100%" overflowY="auto" p={3}
                bg="rgba(8,8,20,0.98)" borderRight="1px solid rgba(255,255,255,0.07)"
                sx={{ '&::-webkit-scrollbar':{ width:'3px' },'&::-webkit-scrollbar-thumb':{ background:'rgba(255,255,255,0.1)',borderRadius:'2px' } }}>
                <LeftPanel {...panelProps} />
              </Box>
            )}
            <Box ref={fsContainerRef} flex="1" h="100%" pos="relative" overflow="hidden">
              {emptyCanvas && (
                <Flex pos="absolute" inset={0} direction="column" align="center" justify="center"
                  gap={3} zIndex={1} pointerEvents="none">
                  <Flex w="48px" h="48px" borderRadius="12px" align="center" justify="center"
                    bg={`${ACCENT}12`} border={`1px solid ${ACCENT}30`}>
                    <InfoIcon boxSize={4} color={ACCENT} />
                  </Flex>
                  <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">Canvas is empty</Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" textAlign="center" maxW="280px">
                    Use the panel on the left to add nodes · drag to position · Connect mode to draw edges
                  </Text>
                </Flex>
              )}
              {/* Only render in fullscreen mode */}
              {fullscreen && fsDims.w > 0 && (
                <ForceGraph2D ref={fsFgRef} width={fsDims.w} height={fsDims.h} {...fgProps} />
              )}
            </Box>
          </Flex>
        </Box>
      )}
    </>
  );
};

export default ADGrapherView;
