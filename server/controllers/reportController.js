const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, ShadingType, WidthType, convertInchesToTwip,
  ImageRun,
} = require('docx');
const Engagement = require('../models/Engagement');

// ── Palette ───────────────────────────────────────────────────────────────────
const BG     = '0F1117';
const BG2    = '1A1A24';
const BG3    = '13131A';
const ACCENT = 'FC8181';
const GREEN  = '68D391';
const BLUE   = '63B3ED';
const PURPLE = '9F7AEA';
const ORANGE = 'F6AD55';
const YELLOW = 'ECC94B';
const CYAN   = '76E4F7';
const WHITE  = 'FFFFFF';
const GRAY   = 'A0AEC0';
const MUTED  = '718096';
const BORDER = '2D2D3A';

const SEV_CLR    = { Critical: ACCENT, High: ORANGE, Medium: YELLOW, Low: GREEN, Info: BLUE };
const STATUS_CLR = { succeeded: GREEN, failed: ACCENT, progress: ORANGE, blocked: PURPLE, pending: MUTED, Pending: MUTED, Cleaned: GREEN };
const C2_CLR     = { running: GREEN, destroyed: MUTED, failed: ACCENT, deploying: ORANGE, pending: MUTED, destroying: ACCENT };
const TTX_CLR    = { Done: GREEN, 'In Progress': ORANGE, Blocked: ACCENT, Pending: MUTED };

// ── Low-level primitives ──────────────────────────────────────────────────────
const shade = (fill) => ({ type: ShadingType.CLEAR, color: 'auto', fill });

const run = (text, { color = WHITE, size = 22, bold = false, italic = false } = {}) =>
  new TextRun({ text: String(text ?? ''), color, size, bold, italics: italic, font: { name: 'Calibri' } });

const para = (children, { fill = BG, before = 60, after = 60, align = AlignmentType.LEFT, indentLeft = 0 } = {}) =>
  new Paragraph({
    children: Array.isArray(children) ? children : [children],
    shading:  shade(fill),
    spacing:  { before, after },
    alignment: align,
    indent: indentLeft ? { left: convertInchesToTwip(indentLeft) } : undefined,
  });

const blank = (fill = BG, n = 1) =>
  Array.from({ length: n }, () => para(run('', { size: 2 }), { fill, before: 0, after: 0 }));

const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const noBorders  = { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone, insideHorizontal: borderNone, insideVertical: borderNone };
const thinBorder = (c = BORDER) => ({ style: BorderStyle.SINGLE, size: 4, color: c });
const allBorders = (c = BORDER) => ({ top: thinBorder(c), bottom: thinBorder(c), left: thinBorder(c), right: thinBorder(c), insideHorizontal: thinBorder(c), insideVertical: thinBorder(c) });

const cell = (children, { fill = BG2, borders = noBorders, width, span } = {}) =>
  new TableCell({
    children: Array.isArray(children) ? children : [children],
    shading: shade(fill),
    borders,
    width: width != null ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: span,
    margins: { top: 100, bottom: 100, left: 160, right: 160 },
  });

const tbl = (rows, opts = {}) =>
  new Table({ rows, width: { size: opts.width || 100, type: WidthType.PERCENTAGE }, borders: opts.borders || noBorders });

const pageBreak = () =>
  new Paragraph({ children: [new TextRun({ text: '', break: 1 })], shading: shade(BG) });

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return String(d); }
};
const fmtDateTime = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return String(d); }
};

// ── Section title bar ─────────────────────────────────────────────────────────
const sectionTitle = (title, accentFill = '2D1515') => [
  ...blank(BG, 1),
  para([run('  ' + title, { color: WHITE, size: 28, bold: true })], { fill: accentFill, before: 140, after: 140 }),
  para(run('', { size: 2 }), { fill: ACCENT, before: 0, after: 0 }),
  ...blank(BG, 1),
];

// ── Key-value row ─────────────────────────────────────────────────────────────
const kvRow = (label, value, valColor = WHITE) =>
  new TableRow({ children: [
    cell([para(run(label, { color: GRAY, size: 20, bold: true }), { fill: BG2, before: 80, after: 80 })], { fill: BG2, width: 28, borders: allBorders() }),
    cell([para(run(String(value ?? '—'), { color: valColor, size: 20 }), { fill: BG3, before: 80, after: 80 })], { fill: BG3, width: 72, borders: allBorders() }),
  ]});

// ── Data table ────────────────────────────────────────────────────────────────
const dataTable = (headers, rows) => {
  if (!rows.length) return para(run('No data.', { color: MUTED }), { fill: BG2 });
  const hRow = new TableRow({ children: headers.map(h =>
    cell([para(run(h.label, { color: WHITE, size: 18, bold: true }), { fill: '261515', before: 100, after: 100 })],
      { fill: '261515', borders: allBorders(), width: h.width })
  )});
  const dRows = rows.map((r, ri) => new TableRow({ children: r.map((v, ci) => {
    const isObj = v && typeof v === 'object';
    const txt   = isObj ? v.text : String(v ?? '—');
    const clr   = isObj ? v.color : GRAY;
    const bg    = ri % 2 === 0 ? BG2 : BG3;
    return cell([para(run(txt, { color: clr, size: 19 }), { fill: bg, before: 80, after: 80 })],
      { fill: bg, borders: allBorders(), width: headers[ci]?.width });
  })}));
  return tbl([hRow, ...dRows], { borders: allBorders() });
};

const sub = (title, color = GRAY) => para(run(title, { color, size: 20, bold: true }), { fill: BG3, before: 140, after: 60 });
const noData = (msg = 'No data recorded.') => para(run(msg, { color: MUTED, size: 20 }), { fill: BG2, before: 80, after: 80 });

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Cover page ────────────────────────────────────────────────────────────────
function coverPage(eng) {
  return [
    para(run('', { size: 2 }), { fill: ACCENT, before: 0, after: 0 }),
    ...blank(BG, 4),
    para(run('RED TEAM OPERATIONS CENTER', { color: ACCENT, size: 20, bold: true }), { fill: BG, align: AlignmentType.CENTER }),
    ...blank(BG, 1),
    para(run(eng.name || 'Untitled Engagement', { color: WHITE, size: 60, bold: true }), { fill: BG, align: AlignmentType.CENTER, before: 0, after: 0 }),
    para(run(eng.company || '', { color: GRAY, size: 30 }), { fill: BG, align: AlignmentType.CENTER, before: 80 }),
    ...blank(BG, 2),
    tbl([new TableRow({ children: [cell([para(run('', { size: 2 }), { fill: ACCENT, before: 0, after: 0 })], { fill: ACCENT, width: 100 })] })]),
    ...blank(BG, 2),
    tbl([new TableRow({ children: [
      cell([para(run('TYPE',       { color: MUTED, size: 16, bold: true }), { fill: BG2, before: 100, after: 20 }), para(run(eng.type || '—', { color: WHITE, size: 22, bold: true }), { fill: BG2, before: 0, after: 100 })], { fill: BG2, borders: allBorders(), width: 25 }),
      cell([para(run('STATUS',     { color: MUTED, size: 16, bold: true }), { fill: BG2, before: 100, after: 20 }), para(run(eng.status || '—', { color: ACCENT, size: 22, bold: true }), { fill: BG2, before: 0, after: 100 })], { fill: BG2, borders: allBorders(), width: 25 }),
      cell([para(run('START DATE', { color: MUTED, size: 16, bold: true }), { fill: BG2, before: 100, after: 20 }), para(run(fmtDate(eng.startDate), { color: WHITE, size: 22 }), { fill: BG2, before: 0, after: 100 })], { fill: BG2, borders: allBorders(), width: 25 }),
      cell([para(run('END DATE',   { color: MUTED, size: 16, bold: true }), { fill: BG2, before: 100, after: 20 }), para(run(fmtDate(eng.endDate), { color: WHITE, size: 22 }), { fill: BG2, before: 0, after: 100 })], { fill: BG2, borders: allBorders(), width: 25 }),
    ]})]),
    ...blank(BG, 3),
    para(run('CONFIDENTIAL', { color: WHITE, size: 26, bold: true }), { fill: '3D0A0A', align: AlignmentType.CENTER, before: 120, after: 120 }),
    ...blank(BG, 4),
    para(run(`Generated: ${new Date().toLocaleString()}`, { color: MUTED, size: 18 }), { fill: BG, align: AlignmentType.CENTER }),
    para(run('Red Team Operations Center  ·  For Authorized Use Only', { color: MUTED, size: 16 }), { fill: BG, align: AlignmentType.CENTER }),
    para(run('', { size: 2 }), { fill: ACCENT, before: 200, after: 0 }),
    pageBreak(),
  ];
}

// ── Executive summary ─────────────────────────────────────────────────────────
function execSummary(text) {
  if (!text?.trim()) return [];
  return [
    ...sectionTitle('EXECUTIVE SUMMARY'),
    para(run(text.trim(), { color: GRAY, size: 22 }), { fill: BG2, before: 140, after: 140, indentLeft: 0.25 }),
    ...blank(BG, 1), pageBreak(),
  ];
}

// ── Engagement overview ───────────────────────────────────────────────────────
function overview(eng) {
  return [
    ...sectionTitle('ENGAGEMENT OVERVIEW'),
    tbl([
      kvRow('Engagement Name', eng.name),
      kvRow('Company', eng.company),
      kvRow('Type', eng.type || '—'),
      kvRow('Status', eng.status || '—', ACCENT),
      kvRow('Start Date', fmtDate(eng.startDate)),
      kvRow('End Date', fmtDate(eng.endDate)),
      kvRow('Progress', `${eng.progress || 0}%`),
      kvRow('Notes', eng.notes || '—'),
    ]),
    ...blank(BG, 1), pageBreak(),
  ];
}

// ── Image dimension helpers ───────────────────────────────────────────────────
function getPngDimensions(buf) {
  // PNG header: bytes 1-4 = "PNG", width at bytes 16-19, height at 20-23
  if (buf.length < 24 || buf[0] !== 0x89 || buf[1] !== 0x50) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function getJpegDimensions(buf) {
  // Scan JPEG for SOF0/SOF1/SOF2 markers (FF C0, FF C1, FF C2)
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xFF) break;
    const marker = buf[i + 1];
    const len    = buf.readUInt16BE(i + 2);
    if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7)) {
      return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    }
    i += 2 + len;
  }
  return null;
}

// ── Content block renderer (text / code / image) ─────────────────────────────
const CODE_BG = '0A0D12';

function renderContentBlocks(blocks) {
  const out = [];
  if (!blocks?.length) return out;

  for (const block of blocks) {
    if (!block.content) continue;

    if (block.type === 'text') {
      out.push(para(run(block.content, { color: GRAY, size: 20 }), { fill: BG2, before: 40, after: 40 }));

    } else if (block.type === 'code') {
      // Language label
      if (block.language) {
        out.push(para(run(' ' + block.language.toUpperCase(), { color: MUTED, size: 16, bold: true }), { fill: CODE_BG, before: 80, after: 0 }));
      } else {
        out.push(para(run('', { size: 4 }), { fill: CODE_BG, before: 60, after: 0 }));
      }
      // Code lines
      const lines = block.content.split('\n');
      lines.forEach(line => {
        out.push(new Paragraph({
          children: [new TextRun({
            text: line || ' ',
            color: GREEN,
            size: 17,
            font: { name: 'Courier New' },
          })],
          shading:  shade(CODE_BG),
          spacing:  { before: 0, after: 0 },
          indent:   { left: convertInchesToTwip(0.15) },
        }));
      });
      out.push(para(run('', { size: 4 }), { fill: CODE_BG, before: 0, after: 80 }));

    } else if (block.type === 'image') {
      try {
        // Strip data URI prefix and detect type
        let raw       = block.content;
        let imgType   = 'png';

        if (raw.startsWith('data:')) {
          const m = raw.match(/^data:image\/(\w+);base64,(.+)$/s);
          if (m) { imgType = m[1].toLowerCase(); raw = m[2]; }
        }
        // Normalise type for docx
        if (imgType === 'jpg') imgType = 'jpg';
        else if (!['png', 'gif', 'bmp', 'svg'].includes(imgType)) imgType = 'png';

        const buf = Buffer.from(raw, 'base64');
        if (!buf.length) continue;

        // Determine dimensions
        let dims = imgType === 'png' ? getPngDimensions(buf) : getJpegDimensions(buf);
        let { w = 500, h = 350 } = dims || {};

        // Scale to max 480px wide to fit page margins
        const MAX_W = 480;
        if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
        if (w < 1) w = 480;
        if (h < 1) h = 320;

        out.push(new Paragraph({
          children: [new ImageRun({ data: buf, transformation: { width: w, height: h }, type: imgType })],
          shading:  shade(BG2),
          spacing:  { before: 100, after: block.caption ? 0 : 100 },
          alignment: AlignmentType.CENTER,
        }));

        if (block.caption) {
          out.push(para(run(block.caption, { color: MUTED, size: 18, italic: true }), { fill: BG2, before: 20, after: 100, align: AlignmentType.CENTER }));
        }
      } catch {
        out.push(para(run('[Image could not be embedded]', { color: MUTED, size: 18, italic: true }), { fill: BG2 }));
      }
    }
  }
  return out;
}

// ── Render a named section: plain text + content blocks ───────────────────────
function renderSection(out, label, color, plainText, blocks) {
  const hasPlain  = plainText?.trim();
  const hasBlocks = blocks?.length > 0;
  if (!hasPlain && !hasBlocks) return;

  out.push(sub(label, color));
  if (hasPlain)  out.push(para(run(plainText, { color: GRAY, size: 20 }), { fill: BG2, before: 20, after: hasBlocks ? 0 : 60 }));
  if (hasBlocks) out.push(...renderContentBlocks(blocks));
}

// ── Findings ──────────────────────────────────────────────────────────────────
function findings(list) {
  const out = [...sectionTitle('FINDINGS', '1A0D20')];
  if (!list?.length) return [...out, noData('No findings recorded.'), ...blank(BG, 1), pageBreak()];

  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
  list.forEach(f => { if (counts[f.severity] != null) counts[f.severity]++; });
  out.push(tbl([new TableRow({ children: Object.entries(counts).map(([sev, n]) =>
    cell([para(run(sev, { color: SEV_CLR[sev], size: 18, bold: true }), { fill: BG2, before: 80, after: 20 }), para(run(String(n), { color: WHITE, size: 28, bold: true }), { fill: BG2, before: 0, after: 80 })],
      { fill: BG2, borders: allBorders(), width: 20 })
  )})]));
  out.push(...blank(BG, 1));
  out.push(dataTable(
    [{ label: 'Title', width: 40 }, { label: 'Severity', width: 15 }, { label: 'Description', width: 45 }],
    list.map(f => [f.title || '—', { text: f.severity || '—', color: SEV_CLR[f.severity] || WHITE }, f.description?.slice(0, 200) || '—'])
  ));
  out.push(...blank(BG, 1));

  list.forEach((f, i) => {
    // Finding header
    out.push(para([
      run(`${i + 1}. ${f.title || 'Untitled'}`, { color: WHITE, size: 26, bold: true }),
      run(`   ${f.severity || ''}`, { color: SEV_CLR[f.severity] || WHITE, size: 20, bold: true }),
    ], { fill: BG2, before: 160, after: 80 }));

    // Description (plain text only — no blocks schema for description)
    if (f.description?.trim()) {
      out.push(sub('Description'));
      out.push(para(run(f.description, { color: GRAY, size: 20 }), { fill: BG2, before: 20, after: 60 }));
    }

    // Observation + blocks
    renderSection(out, 'Observation', GRAY, f.observation, f.observationBlocks);

    // Proof of Concept + blocks
    renderSection(out, 'Proof of Concept', ORANGE, f.proofOfConcept, f.proofOfConceptBlocks);

    // Remediation + blocks
    renderSection(out, 'Remediation', GREEN, f.remediation, f.remediationBlocks);

    out.push(...blank(BG, 1));
  });
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ── TTPs ──────────────────────────────────────────────────────────────────────
function ttps(list) {
  const out = [...sectionTitle('TTPs USED', '150D1A')];
  if (!list?.length) return [...out, noData('No TTPs recorded.'), ...blank(BG, 1), pageBreak()];
  const cats = [...new Set(list.map(t => t.category))];
  cats.forEach(cat => {
    const items = list.filter(t => t.category === cat);
    out.push(sub(cat.replace(/-/g, ' ').toUpperCase(), PURPLE));
    out.push(dataTable(
      [{ label: 'Title', width: 35 }, { label: 'Tags', width: 25 }, { label: 'Description', width: 40 }],
      items.map(t => [t.title || '—', (t.tags || []).join(', ') || '—', t.description?.slice(0, 150) || '—'])
    ));
    out.push(...blank(BG, 1));
  });
  return [...out, pageBreak()];
}

// ── Assumed Breach ────────────────────────────────────────────────────────────
function assumedBreach(list) {
  const out = [...sectionTitle('ASSUMED BREACH', '1A1205')];
  if (!list?.length) return [...out, noData('No scenarios recorded.'), ...blank(BG, 1), pageBreak()];
  list.forEach((s, i) => {
    out.push(para([run(`Scenario ${i + 1}: `, { color: ORANGE, size: 26, bold: true }), run(s.name || 'Unnamed', { color: WHITE, size: 26, bold: true })], { fill: BG2, before: 160, after: 80 }));
    out.push(tbl([
      kvRow('Starting Point', s.startingPoint?.replace(/-/g, ' ') || '—'),
      kvRow('Objective', s.objective || '—'),
      kvRow('Status', s.status?.toUpperCase() || '—', s.status === 'completed' ? GREEN : ORANGE),
      ...(s.notes ? [kvRow('Notes', s.notes)] : []),
    ]));
    out.push(...blank(BG, 1));
    if (s.steps?.length) {
      out.push(sub('Attack Steps', ORANGE));
      out.push(dataTable(
        [{ label: '#', width: 5 }, { label: 'Title', width: 22 }, { label: 'Technique', width: 18 }, { label: 'Tactic', width: 15 }, { label: 'Status', width: 15 }, { label: 'Notes', width: 25 }],
        s.steps.map((st, si) => [String(si + 1), st.title || '—', st.technique || '—', st.tactic || '—', { text: st.status?.toUpperCase() || '—', color: STATUS_CLR[st.status] || WHITE }, st.notes?.slice(0, 80) || '—'])
      ));
      out.push(...blank(BG, 1));
    }
  });
  return [...out, pageBreak()];
}

// ── Loot ──────────────────────────────────────────────────────────────────────
function loot(list) {
  const out = [...sectionTitle('LOOT & CREDENTIALS', '0D1A12')];
  if (!list?.length) return [...out, noData('No loot recorded.'), ...blank(BG, 1), pageBreak()];
  out.push(dataTable(
    [{ label: 'Title', width: 28 }, { label: 'Category', width: 18 }, { label: 'Content', width: 38 }, { label: 'Captured By', width: 16 }],
    list.map(l => [l.title || '—', { text: l.category || '—', color: GREEN }, l.content?.slice(0, 200) || '—', l.capturedByCallsign || '—'])
  ));
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ── Evidence ──────────────────────────────────────────────────────────────────
function evidence(list) {
  const out = [...sectionTitle('EVIDENCE VAULT', '0D1220')];
  if (!list?.length) return [...out, noData('No evidence recorded.'), ...blank(BG, 1), pageBreak()];
  out.push(dataTable(
    [{ label: 'Title', width: 28 }, { label: 'Type', width: 13 }, { label: 'Tags', width: 18 }, { label: 'Timestamp', width: 19 }, { label: 'Content', width: 22 }],
    list.map(e => [e.title || '—', { text: e.type || '—', color: BLUE }, (e.tags || []).join(', ') || '—', fmtDateTime(e.timestamp || e.createdAt), e.content?.slice(0, 100) || '—'])
  ));
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
function cleanup(list) {
  const out = [...sectionTitle('CLEANUP STATUS', '1A1705')];
  if (!list?.length) return [...out, noData('No cleanup items recorded.'), ...blank(BG, 1), pageBreak()];
  const pending = list.filter(c => c.status === 'Pending').length;
  const cleaned = list.filter(c => c.status === 'Cleaned').length;
  out.push(para([run(`${cleaned} Cleaned  `, { color: GREEN, size: 22, bold: true }), run(`${pending} Pending`, { color: pending > 0 ? ACCENT : MUTED, size: 22, bold: true })], { fill: BG2, before: 100, after: 100 }));
  out.push(...blank(BG, 1));
  out.push(dataTable(
    [{ label: 'Title', width: 28 }, { label: 'Artifact Type', width: 18 }, { label: 'Path', width: 24 }, { label: 'Status', width: 12 }, { label: 'Notes', width: 18 }],
    list.map(c => [c.title || '—', { text: c.artifactType || '—', color: YELLOW }, c.path || '—', { text: c.status || '—', color: STATUS_CLR[c.status] || WHITE }, c.notes?.slice(0, 80) || '—'])
  ));
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ── C2 Infrastructure ─────────────────────────────────────────────────────────
function c2(list) {
  const out = [...sectionTitle('C2 INFRASTRUCTURE')];
  if (!list?.length) return [...out, noData('No C2 deployments recorded.'), ...blank(BG, 1), pageBreak()];
  out.push(dataTable(
    [{ label: 'Name', width: 25 }, { label: 'Template', width: 22 }, { label: 'Status', width: 15 }, { label: 'IP Address', width: 20 }, { label: 'Deployed By', width: 18 }],
    list.map(d => [d.name || '—', d.template || '—', { text: (d.status || '').toUpperCase(), color: C2_CLR[d.status] || WHITE }, d.ipAddress || '—', d.createdByCallsign || '—'])
  ));
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ── Phishing ──────────────────────────────────────────────────────────────────
function phishing(cfg, emailTpls, webTpls) {
  const out = [...sectionTitle('PHISHING INFRASTRUCTURE', '1A0D20')];
  const hasCfg = cfg?.smtpHost || cfg?.domain || cfg?.landingDomain;
  const hasEmail = emailTpls?.length > 0;
  const hasWeb   = webTpls?.length > 0;

  if (!hasCfg && !hasEmail && !hasWeb) return [...out, noData('No phishing data recorded.'), ...blank(BG, 1), pageBreak()];

  if (hasCfg) {
    out.push(sub('Infrastructure Config', PURPLE));
    out.push(tbl([
      kvRow('SMTP Host', cfg.smtpHost ? `${cfg.smtpHost}:${cfg.smtpPort || 587}` : '—'),
      kvRow('Sender', cfg.senderName ? `${cfg.senderName} <${cfg.senderEmail || ''}>` : '—'),
      kvRow('Phishing Domain', cfg.domain || '—'),
      kvRow('Landing Domain', cfg.landingDomain || '—'),
      kvRow('GoPhish URL', cfg.gophishUrl || '—'),
      cfg.notes ? kvRow('Notes', cfg.notes) : null,
    ].filter(Boolean)));
    out.push(...blank(BG, 1));
  }
  if (hasEmail) {
    out.push(sub('Email Templates', ORANGE));
    out.push(dataTable(
      [{ label: 'Title', width: 30 }, { label: 'Subject', width: 35 }, { label: 'Category', width: 20 }, { label: 'Sender', width: 15 }],
      emailTpls.map(t => [t.title || '—', t.subject || '—', t.category || '—', t.senderName || '—'])
    ));
    out.push(...blank(BG, 1));
  }
  if (hasWeb) {
    out.push(sub('Web Templates', BLUE));
    out.push(dataTable(
      [{ label: 'Title', width: 40 }, { label: 'Category', width: 30 }, { label: 'Description', width: 30 }],
      webTpls.map(t => [t.title || '—', t.category || '—', t.description?.slice(0, 100) || '—'])
    ));
    out.push(...blank(BG, 1));
  }
  return [...out, pageBreak()];
}

// ── Personas / Sock Puppets ───────────────────────────────────────────────────
function personas(list) {
  const out = [...sectionTitle('SOCK PUPPET PERSONAS', '0D1520')];
  if (!list?.length) return [...out, noData('No personas recorded.'), ...blank(BG, 1), pageBreak()];
  out.push(dataTable(
    [{ label: 'Full Name', width: 22 }, { label: 'Email', width: 28 }, { label: 'Username', width: 18 }, { label: 'Occupation', width: 18 }, { label: 'Country', width: 14 }],
    list.map(p => [p.fullName || '—', p.email || '—', p.username || '—', p.occupation || '—', p.country || '—'])
  ));
  out.push(...blank(BG, 1));
  list.forEach((p, i) => {
    out.push(para([run(`${i + 1}. `, { color: BLUE, size: 22, bold: true }), run(p.fullName || 'Unnamed Persona', { color: WHITE, size: 22, bold: true })], { fill: BG2, before: 120, after: 60 }));
    const fields = [
      ['Email',      p.email],      ['Username',  p.username],
      ['Password',   p.password],   ['Phone',     p.phone],
      ['Birthday',   p.birthday],   ['Address',   [p.address, p.city, p.country].filter(Boolean).join(', ')],
      ['Occupation', p.occupation], ['Company',   p.company],
      ['Notes',      p.notes],
    ].filter(([, v]) => v);
    if (fields.length) out.push(tbl(fields.map(([k, v]) => kvRow(k, v))));
    out.push(...blank(BG, 1));
  });
  return [...out, pageBreak()];
}

// ── Team Vault ────────────────────────────────────────────────────────────────
function vault(list) {
  const out = [...sectionTitle('TEAM VAULT', '0D1A12')];
  if (!list?.length) return [...out, noData('No vault entries recorded.'), ...blank(BG, 1), pageBreak()];
  out.push(dataTable(
    [{ label: 'Title', width: 30 }, { label: 'Category', width: 18 }, { label: 'Username', width: 22 }, { label: 'URL', width: 30 }],
    list.map(v => [v.title || '—', { text: v.category || '—', color: GREEN }, v.username || '—', v.url?.slice(0, 60) || '—'])
  ));
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ── QR Codes ──────────────────────────────────────────────────────────────────
function qrCodes(list) {
  const out = [...sectionTitle('QR CODES', '1A1705')];
  if (!list?.length) return [...out, noData('No QR codes recorded.'), ...blank(BG, 1), pageBreak()];
  out.push(dataTable(
    [{ label: 'Title', width: 28 }, { label: 'Template', width: 16 }, { label: 'Target URL', width: 32 }, { label: 'Scans', width: 10 }, { label: 'Active', width: 14 }],
    list.map(q => [q.title || '—', { text: q.template || '—', color: YELLOW }, q.targetUrl?.slice(0, 80) || '—', { text: String(q.scans?.length || 0), color: q.scans?.length > 0 ? GREEN : MUTED }, { text: q.active ? 'Yes' : 'No', color: q.active ? GREEN : MUTED }])
  ));
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ── Subdomains ────────────────────────────────────────────────────────────────
function subdomains(list) {
  const out = [...sectionTitle('SUBDOMAIN SCANS', '0D1220')];
  if (!list?.length) return [...out, noData('No subdomain scans recorded.'), ...blank(BG, 1), pageBreak()];
  list.forEach((scan, i) => {
    out.push(sub(`Scan ${i + 1}: ${scan.domain || '—'}`, CYAN));
    out.push(tbl([
      kvRow('Domain', scan.domain || '—'),
      kvRow('Status', scan.status?.toUpperCase() || '—', scan.status === 'completed' ? GREEN : ORANGE),
      kvRow('Tools Used', (scan.toolsUsed || []).join(', ') || '—'),
      kvRow('Total Unique', String((scan.totalUnique || []).length)),
      kvRow('Scanned By', scan.scannedByCallsign || '—'),
    ]));
    if (scan.totalUnique?.length) {
      out.push(...blank(BG, 1));
      const chunks = [];
      for (let j = 0; j < scan.totalUnique.length; j += 4) chunks.push(scan.totalUnique.slice(j, j + 4));
      out.push(tbl(chunks.map(row => new TableRow({ children: row.map(sd =>
        cell([para(run(sd, { color: CYAN, size: 18 }), { fill: BG2, before: 60, after: 60 })], { fill: BG2, borders: allBorders(), width: 25 })
      )}))));
    }
    out.push(...blank(BG, 1));
  });
  return [...out, pageBreak()];
}

// ── TTX Planner ───────────────────────────────────────────────────────────────
function ttxPlanner(objective, notes, phases) {
  const out = [...sectionTitle('TTX PLANNER', '150D1A')];
  if (!objective && !phases?.length) return [...out, noData('No TTX data recorded.'), ...blank(BG, 1), pageBreak()];
  if (objective) out.push(tbl([kvRow('Objective', objective), ...(notes ? [kvRow('Notes', notes)] : [])]));
  if (phases?.length) {
    out.push(...blank(BG, 1));
    out.push(dataTable(
      [{ label: '#', width: 5 }, { label: 'Title', width: 30 }, { label: 'Status', width: 15 }, { label: 'Tactics', width: 25 }, { label: 'Description', width: 25 }],
      phases.sort((a, b) => (a.order || 0) - (b.order || 0)).map((ph, i) => [
        String(i + 1), ph.title || '—',
        { text: ph.status || '—', color: TTX_CLR[ph.status] || WHITE },
        ph.tactics?.slice(0, 80) || '—', ph.description?.slice(0, 100) || '—'
      ])
    ));
  }
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ── Skill Requests ────────────────────────────────────────────────────────────
function skillRequests(list) {
  const out = [...sectionTitle('SKILL REQUESTS', '1A1205')];
  if (!list?.length) return [...out, noData('No skill requests recorded.'), ...blank(BG, 1), pageBreak()];
  out.push(dataTable(
    [{ label: 'Skill', width: 28 }, { label: 'Category', width: 18 }, { label: 'Priority', width: 14 }, { label: 'Status', width: 14 }, { label: 'Description', width: 26 }],
    list.map(s => [
      s.skill || '—', { text: s.category || '—', color: BLUE },
      { text: s.priority || '—', color: SEV_CLR[s.priority] || WHITE },
      { text: s.status || '—', color: s.status === 'Resolved' ? GREEN : s.status === 'Learning' ? ORANGE : MUTED },
      s.description?.slice(0, 100) || '—'
    ])
  ));
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ── Documents ─────────────────────────────────────────────────────────────────
function documents(list) {
  const out = [...sectionTitle('DOCUMENTS', '0D1520')];
  if (!list?.length) return [...out, noData('No documents recorded.'), ...blank(BG, 1), pageBreak()];
  const sections = [
    { key: 'official',  label: 'Official Documents',  color: BLUE   },
    { key: 'created',   label: 'Created Documents',   color: GREEN  },
    { key: 'pillaged',  label: 'Pillaged Documents',  color: ACCENT },
  ];
  sections.forEach(sec => {
    const docs = list.filter(d => d.section === sec.key);
    if (!docs.length) return;
    out.push(sub(sec.label, sec.color));
    out.push(dataTable(
      [{ label: 'Name', width: 45 }, { label: 'Type', width: 15 }, { label: 'Size', width: 15 }, { label: 'Uploaded By', width: 15 }, { label: 'Date', width: 10 }],
      docs.map(d => {
        const kb = d.size ? (d.size > 1048576 ? `${(d.size/1048576).toFixed(1)} MB` : `${Math.round(d.size/1024)} KB`) : '—';
        return [d.name || '—', { text: (d.name?.split('.').pop() || '').toUpperCase() || '—', color: sec.color }, kb, d.uploadedByCallsign || '—', fmtDate(d.createdAt)];
      })
    ));
    out.push(...blank(BG, 1));
  });
  return [...out, pageBreak()];
}

// ── File Metadata ─────────────────────────────────────────────────────────────
function fileMeta(list) {
  const out = [...sectionTitle('FILE METADATA', '1A0D20')];
  if (!list?.length) return [...out, noData('No file metadata entries recorded.'), ...blank(BG, 1), pageBreak()];
  out.push(dataTable(
    [{ label: 'File Name', width: 38 }, { label: 'MIME Type', width: 22 }, { label: 'Size', width: 15 }, { label: 'Uploaded By', width: 15 }, { label: 'Date', width: 10 }],
    list.map(f => {
      const kb = f.size ? (f.size > 1048576 ? `${(f.size/1048576).toFixed(1)} MB` : `${Math.round(f.size/1024)} KB`) : '—';
      return [f.name || '—', f.mimeType || '—', kb, f.uploadedBy || '—', fmtDate(f.createdAt)];
    })
  ));
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ── Leakx Scans ───────────────────────────────────────────────────────────────
function leakxScans(list) {
  const out = [...sectionTitle('CREDENTIAL LEAKS', '1A0D20')];
  if (!list?.length) return [...out, noData('No leak scan data recorded.'), ...blank(BG, 1), pageBreak()];
  out.push(dataTable(
    [{ label: 'Domain', width: 40 }, { label: 'Results', width: 25 }, { label: 'Scanned By', width: 20 }, { label: 'Date', width: 15 }],
    list.map(s => {
      const total = Array.isArray(s.data?.emails) ? s.data.emails.length : (typeof s.data === 'object' ? Object.keys(s.data).length : 0);
      return [s.domain || '—', { text: `${total} items`, color: total > 0 ? ACCENT : MUTED }, s.scannedByCallsign || '—', fmtDate(s.createdAt)];
    })
  ));
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ── Activity Log ──────────────────────────────────────────────────────────────
function activityLog(list) {
  const out = [...sectionTitle('ACTIVITY LOG', '0D1520')];
  if (!list?.length) return [...out, noData('No activity recorded.'), ...blank(BG, 1), pageBreak()];
  out.push(dataTable(
    [{ label: 'Date', width: 22 }, { label: 'Type', width: 14 }, { label: 'Action', width: 24 }, { label: 'Description', width: 40 }],
    [...list].reverse().map(a => [fmtDateTime(a.createdAt), { text: a.type || '—', color: BLUE }, a.action || '—', a.description?.slice(0, 200) || '—'])
  ));
  return [...out, ...blank(BG, 1), pageBreak()];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
exports.generate = async (req, res) => {
  try {
    const { engId } = req.params;
    const { sections = {}, execSummaryText = '' } = req.body;

    // Use same $or pattern as all other controllers so operators can also generate
    const eng = await Engagement.findOne({
      _id: engId,
      $or: [{ user: req.user._id }, { operators: String(req.user._id) }],
    });
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const children = [...coverPage(eng)];

    if (sections.execSummary)   children.push(...execSummary(execSummaryText));
    if (sections.overview)      children.push(...overview(eng));
    if (sections.findings)      children.push(...findings(eng.findings));
    if (sections.ttps)          children.push(...ttps(eng.ttps));
    if (sections.assumedBreach) children.push(...assumedBreach(eng.assumedBreachScenarios));
    if (sections.loot)          children.push(...loot(eng.loot));
    if (sections.evidence)      children.push(...evidence(eng.evidence));
    if (sections.cleanup)       children.push(...cleanup(eng.cleanup));
    if (sections.c2)            children.push(...c2(eng.c2Deployments));
    if (sections.phishing)      children.push(...phishing(eng.phishingConfig, eng.phishingEmailTemplates, eng.phishingWebTemplates));
    if (sections.personas)      children.push(...personas(eng.personas));
    if (sections.vault)         children.push(...vault(eng.vault));
    if (sections.qrCodes)       children.push(...qrCodes(eng.qrCodes));
    if (sections.subdomains)    children.push(...subdomains(eng.subdomainScans));
    if (sections.ttxPlanner)    children.push(...ttxPlanner(eng.ttxObjective, eng.ttxNotes, eng.ttxPhases));
    if (sections.skillRequests) children.push(...skillRequests(eng.skillRequests));
    if (sections.documents)     children.push(...documents(eng.documents));
    if (sections.fileMeta)      children.push(...fileMeta(eng.fileMetaEntries));
    if (sections.leakxScans)    children.push(...leakxScans(eng.leakxScans));
    if (sections.activityLog)   children.push(...activityLog(eng.activityLog));

    const doc = new Document({
      background: { color: BG },
      sections: [{
        properties: { page: { margin: { top: convertInchesToTwip(0.8), bottom: convertInchesToTwip(0.8), left: convertInchesToTwip(0.8), right: convertInchesToTwip(0.8) } } },
        children,
      }],
    });

    const buffer   = await Packer.toBuffer(doc);
    const safeName = (eng.name || 'report').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="report_${safeName}.docx"`);
    res.send(buffer);
  } catch (err) {
    console.error('[reportController]', err);
    res.status(500).json({ message: 'Report generation failed', error: err.message });
  }
};
