import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input,
  SimpleGrid, Spinner, Menu, MenuButton, MenuList, MenuItem,
  Modal, ModalOverlay, ModalContent, ModalBody,
} from '@chakra-ui/react';
import {
  SearchIcon, DeleteIcon, CopyIcon, CheckIcon,
  ChevronDownIcon, ChevronUpIcon, RepeatIcon, DownloadIcon,
} from '@chakra-ui/icons';
import * as XLSX from 'xlsx';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

// ── Export helpers ────────────────────────────────────────────────────────────
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const exportJSON = (scan) => {
  const payload = {
    domain:      scan.domain,
    scannedAt:   scan.updatedAt || scan.createdAt,
    totalUnique: scan.totalUnique || [],
    byTool: {
      subfinder: scan.results?.subfinder || [],
    },
  };
  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `subdomains_${scan.domain}_${new Date().toISOString().slice(0,10)}.json`
  );
};

const exportHTML = (scan) => {
  const total = scan.totalUnique || [];
  const sfSubs = new Set(scan.results?.subfinder || []);
  const rows = total.map(s => `
    <tr>
      <td>${s}</td>
      <td style="text-align:center">${sfSubs.has(s) ? '✓' : ''}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Subdomains – ${scan.domain}</title>
<style>
  body { font-family: monospace; background:#0d0d10; color:#e2e8f0; padding:32px; }
  h1 { color:#ff5f6d; margin-bottom:4px; }
  p  { color:#718096; margin:0 0 24px; font-size:13px; }
  table { border-collapse:collapse; width:100%; font-size:13px; }
  th { background:#1a1a2e; color:#a0aec0; text-align:left; padding:8px 12px;
       border-bottom:2px solid #2d3748; text-transform:uppercase; letter-spacing:.06em; font-size:11px; }
  td { padding:7px 12px; border-bottom:1px solid #1a1a2e; }
  tr:hover td { background:rgba(255,255,255,0.03); }
  .badge { display:inline-block; padding:1px 8px; border-radius:4px; font-size:11px;
           background:rgba(79,195,247,0.1); color:#4fc3f7; border:1px solid rgba(79,195,247,0.25); }
</style></head>
<body>
<h1>${scan.domain}</h1>
<p>Scanned ${new Date(scan.updatedAt || scan.createdAt).toLocaleString()} · ${total.length} unique subdomains</p>
<table>
  <thead><tr><th>Subdomain</th><th><span class="badge">Subfinder</span></th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`;
  triggerDownload(
    new Blob([html], { type: 'text/html' }),
    `subdomains_${scan.domain}_${new Date().toISOString().slice(0,10)}.html`
  );
};

const exportExcel = (scan) => {
  const total  = scan.totalUnique || [];
  const sfSubs = new Set(scan.results?.subfinder || []);

  const wsData = [
    ['Subdomain', 'Subfinder'],
    ...total.map(s => [s, sfSubs.has(s) ? 'Yes' : '']),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [{ wch: 50 }, { wch: 12 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Subdomains');

  // Summary sheet
  const summary = [
    ['Domain',    scan.domain],
    ['Scanned',   new Date(scan.updatedAt || scan.createdAt).toLocaleString()],
    ['Total unique', total.length],
    ['Subfinder',  (scan.results?.subfinder || []).length],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

  XLSX.writeFile(wb, `subdomains_${scan.domain}_${new Date().toISOString().slice(0,10)}.xlsx`);
};

const API = 'http://localhost:5000/api';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const inputStyles = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};

// ── Tool metadata ─────────────────────────────────────────────────────────────
const TOOLS = {
  subfinder: { label: 'Subfinder', color: '#4FC3F7', defaultImage: 'projectdiscovery/subfinder:latest' },
};

const TOOL_STATUS_COLORS = {
  pending:  '#A0AEC0',
  running:  '#ECC94B',
  done:     '#68D391',
  failed:   '#FC8181',
  skipped:  '#4A5568',
};

const API_KEY_FIELDS = [
  { key: 'virustotal',     label: 'VirusTotal',      placeholder: 'VT API key' },
  { key: 'shodan',         label: 'Shodan',          placeholder: 'Shodan API key' },
  { key: 'censys_id',      label: 'Censys ID',       placeholder: 'Censys API ID' },
  { key: 'censys_secret',  label: 'Censys Secret',   placeholder: 'Censys API Secret' },
  { key: 'securitytrails', label: 'SecurityTrails',  placeholder: 'ST API key' },
  { key: 'github',         label: 'GitHub Token',    placeholder: 'ghp_…' },
  { key: 'binaryedge',     label: 'BinaryEdge',      placeholder: 'BE API key' },
  { key: 'hunter',         label: 'Hunter.io',       placeholder: 'Hunter API key' },
];

const DEFAULT_TOOLS_CONFIG = {
  subfinder: { enabled: true, image: 'projectdiscovery/subfinder:latest' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1}>{children}</Text>
);

// ── Tool status pill ──────────────────────────────────────────────────────────
const ToolPill = ({ name, status, count }) => {
  const meta  = TOOLS[name];
  const color = TOOL_STATUS_COLORS[status] || '#718096';
  return (
    <Flex align="center" gap={1.5} px={2} py={1} borderRadius="7px"
      bg={`${color}10`} border={`1px solid ${color}30`}>
      <Box w="5px" h="5px" borderRadius="full" bg={color}
        boxShadow={status === 'running' ? `0 0 6px ${color}` : 'none'} />
      <Text fontSize="10px" fontWeight="600" color={meta?.color || color}>{meta?.label}</Text>
      {status === 'running'
        ? <Spinner size="xs" color={color} />
        : count !== undefined && (
          <Text fontSize="10px" color="var(--dash-text-muted)">({count})</Text>
        )}
    </Flex>
  );
};

// ── Subdomain list with search + copy ────────────────────────────────────────
const SubdomainList = ({ subs, title, color, accent }) => {
  const [q,          setQ]          = useState('');
  const [copied,     setCopied]     = useState(false);
  const [copiedRow,  setCopiedRow]  = useState('');
  const [limit,      setLimit]      = useState(100);

  const filtered = subs.filter(s => !q || s.includes(q.toLowerCase()));
  const shown    = filtered.slice(0, limit);

  const copyAll = () => {
    navigator.clipboard.writeText(filtered.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box>
      {title && (
        <Flex align="center" justify="space-between" mb={2}>
          <Flex align="center" gap={2}>
            <Box w="8px" h="8px" borderRadius="full" bg={color || 'var(--dash-text-muted)'} />
            <Text fontSize="12px" fontWeight="600" color="var(--dash-text-primary)">{title}</Text>
            <Box px={2} py="1px" borderRadius="5px" fontSize="11px" fontWeight="700"
              bg={`${color || '#718096'}18`} color={color || '#718096'}
              border={`1px solid ${color || '#718096'}30`}>{subs.length}</Box>
          </Flex>
          <Button size="xs" variant="ghost" leftIcon={copied ? <CheckIcon color="#68D391" /> : <CopyIcon />}
            fontSize="10px" color="var(--dash-text-muted)" borderRadius="6px"
            _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
            onClick={copyAll}>{copied ? 'Copied!' : 'Copy all'}</Button>
        </Flex>
      )}
      {subs.length > 0 && (
        <Box mb={2}>
          <Input value={q} onChange={e => { setQ(e.target.value); setLimit(100); }}
            placeholder={`Filter ${title || 'subdomains'}…`}
            {...inputStyles} h="32px" fontSize="12px" />
        </Box>
      )}
      {subs.length === 0 ? (
        <Box p={3} borderRadius="8px" bg="rgba(255,255,255,0.02)"
          border="1px solid var(--dash-card-border)">
          <Text fontSize="12px" color="var(--dash-text-muted)" textAlign="center">
            No subdomains found
          </Text>
        </Box>
      ) : (
        <>
          <Box bg="rgba(0,0,0,0.25)" borderRadius="10px" border="1px solid var(--dash-card-border)"
            maxH="280px" overflowY="auto"
            css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
            {shown.map(s => {
              const rowCopied = copiedRow === s;
              return (
                <Flex key={s} align="center" justify="space-between" px={3} py={1.5}
                  borderBottom="1px solid rgba(255,255,255,0.03)"
                  _hover={{ bg: 'rgba(255,255,255,0.03)' }}>
                  <Text fontSize="12px" fontFamily="monospace" color="var(--dash-text-secondary)">{s}</Text>
                  <Flex align="center" gap={1.5}>
                    {rowCopied && (
                      <Text fontSize="10px" color="#68D391" fontWeight="600">copied!</Text>
                    )}
                    <IconButton
                      icon={rowCopied ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
                      size="xs" variant="ghost"
                      color={rowCopied ? '#68D391' : 'var(--dash-text-muted)'}
                      _hover={{ color: rowCopied ? '#68D391' : 'white' }}
                      onClick={() => {
                        navigator.clipboard.writeText(s);
                        setCopiedRow(s);
                        setTimeout(() => setCopiedRow(''), 1500);
                      }}
                      aria-label="Copy" />
                  </Flex>
                </Flex>
              );
            })}
          </Box>
          {filtered.length > limit && (
            <Button mt={1} size="xs" variant="ghost" fontSize="10px" w="100%"
              color="var(--dash-text-muted)" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.04)' }}
              onClick={() => setLimit(l => l + 100)}>
              Show {Math.min(100, filtered.length - limit)} more of {filtered.length - limit} remaining
            </Button>
          )}
        </>
      )}
    </Box>
  );
};

// ── Scan detail ───────────────────────────────────────────────────────────────
const ScanDetail = ({ scan, engId, onDelete, onRescan, rescanning, onComplete }) => {
  const [tab,        setTab]        = useState('all');
  const [liveState,  setLiveState]  = useState(null);
  const pollRef                      = useRef(null);

  const isRunning = scan.status === 'running';

  const poll = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/subdomains/${engId}/scans/${scan._id}/status`, { headers: authHeaders() });
      const data = await res.json();
      setLiveState(data);
      if (!data.running) {
        clearInterval(pollRef.current);
        // Refresh engagement context so results appear without a manual reload
        if (onComplete) onComplete();
      }
    } catch {}
  }, [scan._id, engId, onComplete]);

  useEffect(() => {
    if (isRunning) {
      poll();
      pollRef.current = setInterval(poll, 3000);
    } else {
      setLiveState(null);
    }
    return () => clearInterval(pollRef.current);
  }, [isRunning, poll]);

  // Display data: prefer live state for running scans
  const toolStatus  = isRunning && liveState
    ? Object.fromEntries(Object.entries(liveState.tools || {}).map(([k, v]) => [k, v.status]))
    : scan.toolStatus || {};
  const toolCounts  = isRunning && liveState
    ? Object.fromEntries(Object.entries(liveState.tools || {}).map(([k, v]) => [k, v.count]))
    : Object.fromEntries(Object.entries(scan.results || {}).map(([k, v]) => [k, (v || []).length]));
  const results     = scan.results  || { subfinder: [] };
  const totalUnique = scan.totalUnique || [];
  const errors      = scan.errors   || {};

  const tabs = [
    { key: 'all',      label: `All (${isRunning ? '…' : totalUnique.length})` },
    ...Object.entries(TOOLS).map(([k, meta]) => ({
      key: k, label: `${meta.label} (${toolCounts[k] ?? 0})`,
      color: meta.color,
    })),
  ];

  return (
    <Box flex="1" minW={0}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Box>
          <Flex align="center" gap={2} mb={1} flexWrap="wrap">
            <Text fontSize="18px" fontWeight="bold" color="var(--dash-text-primary)"
              fontFamily="monospace">{scan.domain}</Text>
            {isRunning ? (
              <Flex align="center" gap={1.5} px={2} py={0.5} borderRadius="6px"
                bg="rgba(236,201,75,0.1)" border="1px solid rgba(236,201,75,0.3)">
                <Spinner size="xs" color="#ECC94B" />
                <Text fontSize="10px" fontWeight="700" color="#ECC94B">SCANNING</Text>
              </Flex>
            ) : (
              <Flex align="center" gap={1.5} px={2} py={0.5} borderRadius="6px"
                bg={scan.status === 'completed' ? 'rgba(104,211,145,0.08)' : 'rgba(246,173,85,0.08)'}
                border={`1px solid ${scan.status === 'completed' ? 'rgba(104,211,145,0.25)' : 'rgba(246,173,85,0.25)'}`}>
                <Box w="5px" h="5px" borderRadius="full"
                  bg={scan.status === 'completed' ? '#68D391' : '#F6AD55'} />
                <Text fontSize="10px" fontWeight="700"
                  color={scan.status === 'completed' ? '#68D391' : '#F6AD55'}>
                  {scan.status?.toUpperCase()}
                </Text>
              </Flex>
            )}
          </Flex>
          <Text fontSize="11px" color="var(--dash-text-muted)">
            {fmtDate(scan.updatedAt || scan.createdAt)}
            {scan.scannedByCallsign ? ` · by ${scan.scannedByCallsign}` : ''}
          </Text>
        </Box>
        <Flex gap={2} align="center">
          {!isRunning && totalUnique.length > 0 && (
            <Flex align="center" gap={1.5} px={2.5} py={1} borderRadius="7px"
              bg="rgba(104,211,145,0.08)" border="1px solid rgba(104,211,145,0.2)">
              <Text fontSize="12px" fontWeight="700" color="#68D391">{totalUnique.length}</Text>
              <Text fontSize="10px" color="var(--dash-text-muted)">unique</Text>
            </Flex>
          )}
          {!isRunning && (
            <>
              <Button size="xs" leftIcon={<RepeatIcon boxSize={2.5} />} fontSize="10px" borderRadius="7px"
                bg="rgba(255,80,95,0.08)" border="1px solid rgba(255,80,95,0.25)"
                color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.16)' }}
                isLoading={rescanning} loadingText="Starting…"
                onClick={() => onRescan(scan.domain)}>
                Re-scan
              </Button>
              {(scan.totalUnique?.length > 0) && (
                <Menu>
                  <MenuButton as={Button} size="xs" fontSize="10px" borderRadius="7px"
                    leftIcon={<DownloadIcon boxSize={2.5} />}
                    rightIcon={<ChevronDownIcon boxSize={2.5} />}
                    bg="rgba(104,211,145,0.08)" border="1px solid rgba(104,211,145,0.25)"
                    color="#68D391" _hover={{ bg: 'rgba(104,211,145,0.16)' }}
                    _active={{ bg: 'rgba(104,211,145,0.16)' }}>
                    Export
                  </MenuButton>
                  <MenuList bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                    borderRadius="10px" minW="140px" py={1} zIndex={1000}>
                    {[
                      { label: 'JSON',  fn: () => exportJSON(scan)  },
                      { label: 'HTML',  fn: () => exportHTML(scan)  },
                      { label: 'Excel', fn: () => exportExcel(scan) },
                    ].map(({ label, fn }) => (
                      <MenuItem key={label} onClick={fn} fontSize="12px"
                        bg="transparent" color="var(--dash-text-secondary)"
                        _hover={{ bg: 'rgba(255,255,255,0.06)', color: 'white' }}
                        px={3} py={2}>
                        {label}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              )}
            </>
          )}
          <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="unstyled"
            display="flex" alignItems="center" justifyContent="center"
            h="26px" w="26px" minW="26px" borderRadius="7px"
            bg="rgba(252,129,129,0.08)" border="1px solid rgba(252,129,129,0.25)"
            color="rgba(252,129,129,0.7)"
            _hover={{ bg: 'rgba(252,129,129,0.15)', borderColor: 'rgba(252,129,129,0.45)', color: '#FC8181' }}
            onClick={() => onDelete(scan._id)} aria-label="Delete" />
        </Flex>
      </Flex>

      {/* Tool status pills — only when not running (running state shows full log cards) */}
      {!isRunning && (
        <Flex gap={2} mb={4} flexWrap="wrap">
          {(scan.toolsUsed || Object.keys(TOOLS)).map(t => (
            <ToolPill key={t} name={t} status={toolStatus[t] || 'done'} count={toolCounts[t]} />
          ))}
        </Flex>
      )}

      {/* Tool errors */}
      {Object.entries(errors).length > 0 && (
        <Box mb={3} p={3} borderRadius="10px"
          bg="rgba(252,129,129,0.04)" border="1px solid rgba(252,129,129,0.2)">
          {Object.entries(errors).map(([tool, msg]) => (
            <Text key={tool} fontSize="11px" color="#FC8181">
              <Text as="span" fontWeight="600">{TOOLS[tool]?.label}:</Text> {msg}
            </Text>
          ))}
        </Box>
      )}

      {/* Tabs */}
      {!isRunning && (
        <>
          <Flex gap={1} mb={4} p={1} borderRadius="10px" flexWrap="wrap"
            bg="rgba(255,255,255,0.03)" border="1px solid var(--dash-card-border)" w="fit-content">
            {tabs.map(t => (
              <Button key={t.key} size="xs" borderRadius="7px" fontSize="11px" fontWeight="600"
                px={3} h="28px"
                bg={tab === t.key ? 'rgba(255,80,95,0.15)' : 'transparent'}
                border={tab === t.key ? '1px solid rgba(255,80,95,0.35)' : '1px solid transparent'}
                color={tab === t.key ? 'rgba(255,130,130,0.95)' : (t.color || 'var(--dash-text-muted)')}
                _hover={{ color: tab === t.key ? 'rgba(255,130,130,0.95)' : 'var(--dash-text-primary)' }}
                onClick={() => setTab(t.key)}>
                {t.label}
              </Button>
            ))}
          </Flex>

          {tab === 'all'
            ? <SubdomainList subs={totalUnique} title="All unique subdomains" color="#A0AEC0" />
            : <SubdomainList
                subs={results[tab] || []}
                title={`${TOOLS[tab]?.label} results`}
                color={TOOLS[tab]?.color}
              />
          }
        </>
      )}

      {isRunning && (
        <Flex direction="column" gap={3} pt={2}>
          {Object.keys(TOOLS).map(t => {
            // Only show tools that were actually enabled for this scan
            if (!(scan.toolsUsed || []).includes(t)) return null;
            const meta    = TOOLS[t];
            const st      = toolStatus[t] || 'pending';
            const stColor = TOOL_STATUS_COLORS[st] || '#718096';
            const cnt     = toolCounts[t] ?? 0;
            const rawOut  = liveState?.tools?.[t]?.output || '';
            // Show last 60 lines of output
            const logLines = rawOut.split('\n').filter(Boolean).slice(-60).join('\n');

            return (
              <Box key={t} borderRadius="12px" overflow="hidden"
                border={`1px solid ${meta.color}25`} bg="var(--dash-card-bg)">
                {/* Tool header */}
                <Flex align="center" gap={2.5} px={3} py={2}
                  bg={`${meta.color}08`} borderBottom={`1px solid ${meta.color}20`}>
                  <Box w="7px" h="7px" borderRadius="full" bg={stColor}
                    boxShadow={st === 'running' ? `0 0 6px ${stColor}` : 'none'}
                    flexShrink={0} />
                  <Text fontSize="12px" fontWeight="700" color={meta.color}
                    textTransform="uppercase" letterSpacing="wider">{meta.label}</Text>
                  {st === 'running'
                    ? <Spinner size="xs" color={stColor} />
                    : <Text fontSize="10px" color={stColor} textTransform="uppercase"
                        fontWeight="600">{st}</Text>
                  }
                  {cnt > 0 && (
                    <Flex align="center" gap={1} ml="auto" px={2} py={0.5} borderRadius="5px"
                      bg={`${meta.color}15`} border={`1px solid ${meta.color}30`}>
                      <Text fontSize="11px" fontWeight="700" color={meta.color}>{cnt}</Text>
                      <Text fontSize="10px" color="var(--dash-text-muted)">found</Text>
                    </Flex>
                  )}
                </Flex>
                {/* Live log terminal */}
                <Box bg="rgba(0,0,0,0.5)" px={3} py={2.5} h="180px" overflowY="auto"
                  fontFamily="monospace" fontSize="11px"
                  css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}
                  ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
                  {logLines
                    ? <Text color="#A0E0A0" whiteSpace="pre-wrap" wordBreak="break-all" lineHeight="1.7">
                        {logLines}
                      </Text>
                    : <Text color="var(--dash-text-muted)">Waiting for output…</Text>
                  }
                </Box>
              </Box>
            );
          })}
        </Flex>
      )}
    </Box>
  );
};

// ── All subdomains aggregated panel ──────────────────────────────────────────
const AllSubdomainsPanel = ({ scans }) => {
  const [q,         setQ]         = useState('');
  const [copiedRow, setCopiedRow] = useState('');
  const [limit,     setLimit]     = useState(150);

  // Build flat list: { sub, domain, tools[] }
  const allMap = {};
  for (const scan of scans) {
    if (scan.status === 'running') continue;
    for (const sub of (scan.totalUnique || [])) {
      if (!allMap[sub]) allMap[sub] = { sub, domain: scan.domain, tools: [] };
      for (const t of (scan.toolsUsed || [])) {
        if ((scan.results?.[t] || []).includes(sub) && !allMap[sub].tools.includes(t))
          allMap[sub].tools.push(t);
      }
    }
  }
  const all = Object.values(allMap).sort((a, b) => a.sub.localeCompare(b.sub));

  const qLow     = q.toLowerCase();
  const filtered = q ? all.filter(e => e.sub.includes(qLow) || e.domain.includes(qLow)) : all;
  const shown    = filtered.slice(0, limit);

  // Domain color map for accent dots
  const domains  = [...new Set(scans.map(s => s.domain))];
  const palette  = ['#FC8181','#68D391','#63B3ED','#ECC94B','#CE93D8','#4FC3F7','#F6AD55','#4FD1C5'];
  const domColor = {};
  domains.forEach((d, i) => { domColor[d] = palette[i % palette.length]; });

  return (
    <Box flex="1" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="14px" overflow="hidden" pos="relative" minH="300px">
      <Box pos="absolute" top="0" left="0" right="0" h="2px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,80,95,0.4), transparent)' }} />

      <Box p={4}>
        {/* Header */}
        <Flex align="center" justify="space-between" mb={3}>
          <Flex align="center" gap={2}>
            <Text fontSize="13px" fontWeight="700" color="var(--dash-text-primary)">
              All Subdomains
            </Text>
            <Box px={2} py="1px" borderRadius="5px" fontSize="11px" fontWeight="700"
              bg="rgba(104,211,145,0.12)" color="#68D391" border="1px solid rgba(104,211,145,0.25)">
              {all.length}
            </Box>
          </Flex>
          <Text fontSize="10px" color="var(--dash-text-muted)">
            across {domains.length} domain{domains.length !== 1 ? 's' : ''}
          </Text>
        </Flex>

        {/* Search */}
        <Box mb={3}>
          <Input
            value={q} onChange={e => { setQ(e.target.value); setLimit(150); }}
            placeholder="Search subdomains or domains…"
            {...inputStyles} h="36px" fontSize="12px"
          />
        </Box>

        {/* Domain legend */}
        {domains.length > 1 && (
          <Flex gap={2} mb={3} flexWrap="wrap">
            {domains.map(d => (
              <Flex key={d} align="center" gap={1}>
                <Box w="6px" h="6px" borderRadius="full" bg={domColor[d]} />
                <Text fontSize="10px" color="var(--dash-text-muted)" fontFamily="monospace">{d}</Text>
              </Flex>
            ))}
          </Flex>
        )}

        {/* List */}
        {all.length === 0 ? (
          <Flex align="center" justify="center" py={10}>
            <Text fontSize="12px" color="var(--dash-text-muted)">No completed scans yet.</Text>
          </Flex>
        ) : filtered.length === 0 ? (
          <Flex align="center" justify="center" py={8}>
            <Text fontSize="12px" color="var(--dash-text-muted)">No matches for "{q}"</Text>
          </Flex>
        ) : (
          <>
            <Box bg="rgba(0,0,0,0.25)" borderRadius="10px" border="1px solid var(--dash-card-border)"
              maxH="420px" overflowY="auto"
              css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
              {shown.map(({ sub, domain, tools }) => {
                const rowCopied = copiedRow === sub;
                const dc = domColor[domain] || '#718096';
                return (
                  <Flex key={sub} align="center" justify="space-between"
                    px={3} py={1.5} borderBottom="1px solid rgba(255,255,255,0.03)"
                    _hover={{ bg: 'rgba(255,255,255,0.03)' }}>
                    <Flex align="center" gap={2} minW={0} flex="1">
                      <Box w="5px" h="5px" borderRadius="full" bg={dc} flexShrink={0} />
                      <Text fontSize="12px" fontFamily="monospace" color="var(--dash-text-secondary)"
                        noOfLines={1}>{sub}</Text>
                    </Flex>
                    <Flex align="center" gap={1.5} flexShrink={0} ml={2}>
                      {tools.map(t => {
                        const meta = TOOLS[t];
                        return meta ? (
                          <Box key={t} px={1} py="1px" borderRadius="3px" fontSize="8px"
                            fontWeight="700" bg={`${meta.color}10`} color={meta.color}
                            border={`1px solid ${meta.color}20`} letterSpacing="wide">
                            {meta.label.slice(0,3).toUpperCase()}
                          </Box>
                        ) : null;
                      })}
                      {rowCopied && (
                        <Text fontSize="10px" color="#68D391" fontWeight="600">copied!</Text>
                      )}
                      <IconButton
                        icon={rowCopied ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
                        size="xs" variant="ghost"
                        color={rowCopied ? '#68D391' : 'var(--dash-text-muted)'}
                        _hover={{ color: rowCopied ? '#68D391' : 'white' }}
                        onClick={() => {
                          navigator.clipboard.writeText(sub);
                          setCopiedRow(sub);
                          setTimeout(() => setCopiedRow(''), 1500);
                        }}
                        aria-label="Copy" />
                    </Flex>
                  </Flex>
                );
              })}
            </Box>
            {filtered.length > limit && (
              <Button mt={2} size="xs" variant="ghost" fontSize="10px" w="100%"
                color="var(--dash-text-muted)" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.04)' }}
                onClick={() => setLimit(l => l + 150)}>
                Show {Math.min(150, filtered.length - limit)} more · {filtered.length - limit} remaining
              </Button>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

// ── Main View ─────────────────────────────────────────────────────────────────
const SubdomainsView = () => {
  const { slug }                        = useParams();
  const { getBySlug, fetchEngagements } = useEngagements();
  const { user }                        = useAuth();
  const eng                             = getBySlug(slug);

  const [scans,        setScans]        = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [domain,       setDomain]       = useState('');
  const [scanning,     setScanning]     = useState(false);
  const [rescanning,   setRescanning]   = useState(false);
  const [scanError,    setScanError]    = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [configOpen,   setConfigOpen]   = useState(false);
  const [saveConfig,   setSaveConfig]   = useState(true);
  const [sidebarPage,  setSidebarPage]  = useState(0);

  const SIDEBAR_PAGE_SIZE = 5;

  // Tool config
  const [toolsConfig, setToolsConfig] = useState(DEFAULT_TOOLS_CONFIG);
  const [apiKeys,     setApiKeys]     = useState({});

  useEffect(() => { fetchEngagements(); }, []); // eslint-disable-line
  useEffect(() => {
    if (!eng) return;
    setScans(eng.subdomainScans || []);
    if (eng.subdomainConfig?.toolsConfig) setToolsConfig(eng.subdomainConfig.toolsConfig);
    if (eng.subdomainConfig?.apiKeys)     setApiKeys(eng.subdomainConfig.apiKeys);
  }, [eng]); // eslint-disable-line

  const activeScan  = scans.find(s => String(s._id) === String(selected));
  const enabledCount = Object.values(toolsConfig).filter(t => t.enabled).length;

  const handleScan = async (domainOverride) => {
    if (!eng) return;
    const target = (domainOverride || domain).trim();
    if (!target) { setScanError('Enter a domain.'); return; }
    if (!enabledCount) { setScanError('Enable at least one tool in config.'); return; }

    const isRescan = !!domainOverride;
    if (isRescan) setRescanning(true); else setScanning(true);
    setScanError('');

    try {
      const res  = await fetch(`${API}/subdomains/${eng._id}/scan`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ domain: target, toolsConfig, apiKeys, saveConfig }),
      });
      const data = await res.json();
      if (!res.ok) { setScanError(data.message || 'Scan failed'); return; }

      await fetchEngagements();
      setSelected(String(data._id));
      if (!isRescan) setDomain('');
    } catch { setScanError('Network error'); }
    finally { setScanning(false); setRescanning(false); }
  };

  const handleDelete = async (scanId) => {
    if (!eng) return;
    setDeleting(true);
    try {
      setScans(prev => prev.filter(s => String(s._id) !== scanId));
      if (String(selected) === scanId) setSelected(null);
      await fetch(`${API}/subdomains/${eng._id}/scans/${scanId}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      await fetchEngagements();
    } catch {}
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  const setKey  = (k) => (e) => setApiKeys(prev => ({ ...prev, [k]: e.target.value }));
  const toggleTool = (tool) => setToolsConfig(prev => ({
    ...prev,
    [tool]: { ...prev[tool], enabled: !prev[tool]?.enabled },
  }));
  const setToolImage = (tool, image) => setToolsConfig(prev => ({
    ...prev,
    [tool]: { ...prev[tool], image },
  }));

  if (!eng) return null;

  return (
    <Box px={6} pb={10}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={5}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            Sub<Text as="span" color="red.400">domains</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · passive subdomain enumeration via subfinder
          </Text>
        </Box>
      </Flex>

      {/* Config + Scan card */}
      <Box mb={6} p={4} borderRadius="14px" bg="var(--dash-card-bg)"
        border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
        <Box pos="absolute" top="0" left="0" right="0" h="2px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(255,80,95,0.5), transparent)' }} />

        {/* Tool toggles + scan bar */}
        <Flex gap={4} align="flex-end" flexWrap="wrap">
          {/* Tool toggles */}
          <Box flex="1" minW="260px">
            <Label>Tools</Label>
            <Flex gap={2} flexWrap="wrap">
              {Object.entries(TOOLS).map(([key, meta]) => {
                const on = toolsConfig[key]?.enabled;
                return (
                  <Flex key={key} align="center" gap={1.5} px={2.5} py={1.5} borderRadius="8px"
                    cursor="pointer"
                    bg={on ? `${meta.color}12` : 'rgba(255,255,255,0.03)'}
                    border={`1px solid ${on ? meta.color + '35' : 'rgba(255,255,255,0.08)'}`}
                    transition="all 0.15s" _hover={{ borderColor: meta.color + '50' }}
                    onClick={() => toggleTool(key)}>
                    <Box w="7px" h="7px" borderRadius="full"
                      bg={on ? meta.color : 'rgba(255,255,255,0.15)'}
                      boxShadow={on ? `0 0 5px ${meta.color}66` : 'none'} />
                    <Text fontSize="11px" fontWeight="600"
                      color={on ? meta.color : 'var(--dash-text-muted)'}>{meta.label}</Text>
                  </Flex>
                );
              })}
            </Flex>
            <Text fontSize="10px" color="var(--dash-text-muted)" mt={1.5} fontStyle="italic">
              Only Subfinder is supported for now — more tools will be added in the future.
            </Text>
          </Box>

          {/* Domain + scan button */}
          <Box flex="2" minW="280px">
            <Label>Domain to enumerate</Label>
            <Flex gap={2}>
              <Input value={domain}
                onChange={e => { setDomain(e.target.value); setScanError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="example.com" {...inputStyles} flex="1" />
              <Button size="sm" h="40px" px={5} borderRadius="10px" fontWeight="semibold"
                leftIcon={scanning ? <Spinner size="xs" /> : <SearchIcon boxSize={3} />}
                bg="rgba(255,80,95,0.12)" border="1px solid rgba(255,80,95,0.4)"
                color="rgba(255,130,130,0.95)" _hover={{ bg: 'rgba(255,80,95,0.2)' }}
                isDisabled={!domain.trim() || !enabledCount || scanning}
                onClick={() => handleScan()}>
                {scanning ? 'Starting…' : 'Scan'}
              </Button>
            </Flex>
            {scanError && <Text fontSize="11px" color="#FC8181" mt={1.5}>{scanError}</Text>}
          </Box>
        </Flex>

        {/* Collapsible API keys + image config */}
        <Flex align="center" gap={2} mt={3} cursor="pointer"
          onClick={() => setConfigOpen(o => !o)}>
          <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
            letterSpacing="wider" fontWeight="600">API Keys & Settings</Text>
          {configOpen ? <ChevronUpIcon boxSize={3} color="var(--dash-text-muted)" />
                      : <ChevronDownIcon boxSize={3} color="var(--dash-text-muted)" />}
        </Flex>

        {configOpen && (
          <Box mt={3} pt={3} borderTop="1px solid var(--dash-card-border)">
            {/* API Keys */}
            <Text fontSize="11px" fontWeight="600" color="var(--dash-text-secondary)" mb={2}>
              API Keys <Text as="span" fontSize="10px" color="var(--dash-text-muted)" fontWeight="400">
                (optional — all tools use keys they support)
              </Text>
            </Text>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} mb={4}>
              {API_KEY_FIELDS.map(f => (
                <Box key={f.key}>
                  <Label>{f.label}</Label>
                  <Input type="password" value={apiKeys[f.key] || ''}
                    onChange={setKey(f.key)}
                    placeholder={f.placeholder}
                    {...inputStyles} h="34px" fontSize="11px" />
                </Box>
              ))}
            </SimpleGrid>

            {/* Docker images */}
            <Text fontSize="11px" fontWeight="600" color="var(--dash-text-secondary)" mb={2}>
              Docker Images
            </Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2} mb={3}>
              {Object.entries(TOOLS).map(([key, meta]) => (
                <Box key={key}>
                  <Label>{meta.label} image</Label>
                  <Input value={toolsConfig[key]?.image || meta.defaultImage}
                    onChange={e => setToolImage(key, e.target.value)}
                    placeholder={meta.defaultImage}
                    {...inputStyles} h="34px" fontSize="11px" />
                </Box>
              ))}
            </SimpleGrid>

            {/* Save config */}
            <Flex align="center" gap={2} cursor="pointer" onClick={() => setSaveConfig(v => !v)}>
              <Box w="14px" h="14px" borderRadius="4px" flexShrink={0}
                bg={saveConfig ? 'rgba(255,80,95,0.15)' : 'rgba(255,255,255,0.05)'}
                border={`1px solid ${saveConfig ? 'rgba(255,80,95,0.5)' : 'rgba(255,255,255,0.15)'}`}
                display="flex" alignItems="center" justifyContent="center">
                {saveConfig && <CheckIcon boxSize={2} color="rgba(255,130,130,0.9)" />}
              </Box>
              <Text fontSize="10px" color="var(--dash-text-muted)" userSelect="none">
                Save tool config & API keys for this engagement
              </Text>
            </Flex>
          </Box>
        )}
      </Box>

      {/* Body */}
      {scans.length === 0 ? (
        <Flex direction="column" align="center" justify="center" gap={3} py={16}
          borderRadius="14px" bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
          <Text fontSize="28px">🌐</Text>
          <Text fontWeight="bold" color="var(--dash-text-primary)">No scans yet</Text>
          <Text fontSize="sm" color="var(--dash-text-muted)">
            Enter a domain above and hit Scan to start enumerating.
          </Text>
        </Flex>
      ) : (
        <Flex gap={4} align="flex-start">
          {/* Scan list sidebar */}
          <Box w="220px" flexShrink={0}>
            {/* Sidebar header */}
            <Flex align="center" justify="space-between" mb={2}>
              <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
                letterSpacing="wider" fontWeight="600">
                Scanned domains ({scans.length})
              </Text>
              {scans.length > SIDEBAR_PAGE_SIZE && (
                <Text fontSize="10px" color="var(--dash-text-muted)">
                  {sidebarPage * SIDEBAR_PAGE_SIZE + 1}–{Math.min((sidebarPage + 1) * SIDEBAR_PAGE_SIZE, scans.length)}
                </Text>
              )}
            </Flex>

            <Flex direction="column" gap={1.5}>
              {[...scans]
                .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                .slice(sidebarPage * SIDEBAR_PAGE_SIZE, (sidebarPage + 1) * SIDEBAR_PAGE_SIZE)
                .map(scan => {
                  const isActive  = String(scan._id) === String(selected);
                  const isRunning = scan.status === 'running';
                  const total     = scan.totalUnique?.length ?? 0;
                  return (
                    <Box key={String(scan._id)}
                      px={3} py={2.5} borderRadius="10px" cursor="pointer"
                      bg={isActive ? 'rgba(255,80,95,0.1)' : 'var(--dash-card-bg)'}
                      border={`1px solid ${isActive ? 'rgba(255,80,95,0.35)' : 'var(--dash-card-border)'}`}
                      transition="all 0.15s"
                      _hover={{ borderColor: isActive ? 'rgba(255,80,95,0.35)' : 'rgba(255,255,255,0.15)' }}
                      onClick={() => setSelected(prev => prev === String(scan._id) ? null : String(scan._id))}>
                      <Text fontSize="12px" fontWeight="600" fontFamily="monospace"
                        color={isActive ? 'rgba(255,130,130,0.95)' : 'var(--dash-text-primary)'}
                        noOfLines={1}>{scan.domain}</Text>
                      <Flex align="center" gap={2} mt={1}>
                        {isRunning
                          ? <Flex align="center" gap={1}><Spinner size="xs" color="#ECC94B" /><Text fontSize="10px" color="#ECC94B">Running…</Text></Flex>
                          : <>
                              <Text fontSize="11px" fontWeight="700"
                                color={total > 0 ? '#68D391' : 'var(--dash-text-muted)'}>{total}</Text>
                              <Text fontSize="10px" color="var(--dash-text-muted)">unique</Text>
                            </>
                        }
                        <Text fontSize="9px" color="var(--dash-text-muted)" ml="auto">
                          {fmtDate(scan.updatedAt || scan.createdAt).split(' ').slice(0, 2).join(' ')}
                        </Text>
                      </Flex>
                      {/* Per-tool mini badges */}
                      <Flex gap={1} mt={1.5} flexWrap="wrap">
                        {scan.toolsUsed?.map(t => {
                          const cnt = (scan.results?.[t] || []).length;
                          const meta = TOOLS[t];
                          return meta ? (
                            <Box key={t} px={1} py="1px" borderRadius="4px" fontSize="9px"
                              fontWeight="600" bg={`${meta.color}10`} color={meta.color}
                              border={`1px solid ${meta.color}25`}>
                              {meta.label.slice(0,3)} {isRunning ? '…' : cnt}
                            </Box>
                          ) : null;
                        })}
                      </Flex>
                    </Box>
                  );
                })}
            </Flex>

            {/* Pagination controls */}
            {scans.length > SIDEBAR_PAGE_SIZE && (
              <Flex mt={2} gap={1.5}>
                <Button flex="1" size="xs" variant="ghost" fontSize="10px" borderRadius="7px"
                  color="var(--dash-text-muted)" border="1px solid var(--dash-card-border)"
                  _hover={{ color: 'white', bg: 'rgba(255,255,255,0.05)' }}
                  isDisabled={sidebarPage === 0}
                  onClick={() => setSidebarPage(p => p - 1)}>
                  ← Prev
                </Button>
                <Button flex="1" size="xs" variant="ghost" fontSize="10px" borderRadius="7px"
                  color="var(--dash-text-muted)" border="1px solid var(--dash-card-border)"
                  _hover={{ color: 'white', bg: 'rgba(255,255,255,0.05)' }}
                  isDisabled={(sidebarPage + 1) * SIDEBAR_PAGE_SIZE >= scans.length}
                  onClick={() => setSidebarPage(p => p + 1)}>
                  Next →
                </Button>
              </Flex>
            )}
          </Box>

          {/* Detail panel */}
          {activeScan ? (
            <ScanDetail
              scan={activeScan}
              engId={eng._id}
              onDelete={(id) => setDeleteTarget(id)}
              onRescan={(d) => handleScan(d)}
              rescanning={rescanning}
              onComplete={fetchEngagements}
            />
          ) : (
            <AllSubdomainsPanel scans={scans} />
          )}
        </Flex>
      )}

      {/* ── Delete confirm modal ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} isCentered size="xs">
        <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px" overflow="hidden" p={0}>
          <ModalBody p={0}>
            <Box p={5} pos="relative">
              <Box pos="absolute" top="0" left="0" right="0" h="2px"
                style={{ background: 'linear-gradient(to right, transparent, rgba(252,129,129,0.6), transparent)' }} />
              <Flex direction="column" align="center" gap={3} pt={2}>
                <Flex w="40px" h="40px" borderRadius="12px" align="center" justify="center"
                  bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.25)">
                  <DeleteIcon boxSize={4} color="#FC8181" />
                </Flex>
                <Box textAlign="center">
                  <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
                    Delete Scan
                  </Text>
                  <Text fontSize="12px" color="var(--dash-text-muted)">
                    This will permanently remove the scan and all discovered subdomains.
                  </Text>
                </Box>
                <Flex gap={2} w="100%" mt={1}>
                  <Button flex="1" size="sm" variant="ghost" borderRadius="9px"
                    color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.08)"
                    _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                    onClick={() => setDeleteTarget(null)}>
                    Cancel
                  </Button>
                  <Button flex="1" size="sm" borderRadius="9px" fontWeight="semibold"
                    isLoading={deleting}
                    bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.3)"
                    color="#FC8181" _hover={{ bg: 'rgba(252,129,129,0.18)' }}
                    onClick={() => handleDelete(deleteTarget)}>
                    Delete
                  </Button>
                </Flex>
              </Flex>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SubdomainsView;
