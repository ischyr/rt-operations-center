import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, SimpleGrid, IconButton, Button, Tooltip, Spinner,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AddIcon, DeleteIcon, CopyIcon, CheckIcon, WarningIcon, AttachmentIcon,
  InfoIcon, SearchIcon, DownloadIcon,
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const API_BASE    = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT = '#9F7AEA';
const GREEN  = '#68D391';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const BLUE   = '#63B3ED';
const YELLOW = '#ECC94B';
const CYAN   = '#76E4F7';
const PINK   = '#F687B3';

// ── File type map ─────────────────────────────────────────────────────────────
const EXT_META = {
  pdf:  { label: 'PDF',   color: RED    },
  doc:  { label: 'DOC',   color: BLUE   },
  docx: { label: 'DOCX',  color: BLUE   },
  xls:  { label: 'XLS',   color: GREEN  },
  xlsx: { label: 'XLSX',  color: GREEN  },
  ppt:  { label: 'PPT',   color: ORANGE },
  pptx: { label: 'PPTX',  color: ORANGE },
  txt:  { label: 'TXT',   color: ACCENT },
  png:  { label: 'PNG',   color: PINK   },
  jpg:  { label: 'JPG',   color: PINK   },
  jpeg: { label: 'JPEG',  color: PINK   },
  gif:  { label: 'GIF',   color: PINK   },
  mp4:  { label: 'MP4',   color: CYAN   },
  mov:  { label: 'MOV',   color: CYAN   },
  zip:  { label: 'ZIP',   color: YELLOW },
  rar:  { label: 'RAR',   color: YELLOW },
  py:   { label: 'PY',    color: GREEN  },
  ps1:  { label: 'PS1',   color: BLUE   },
  sh:   { label: 'SH',    color: ORANGE },
};
const getExt    = (n) => (n.split('.').pop() || '').toLowerCase();
const getEMeta  = (n) => EXT_META[getExt(n)] || { label: getExt(n).toUpperCase() || 'FILE', color: '#718096' };
const fmtSize   = (b) => {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
  return `${(b / 1073741824).toFixed(2)} GB`;
};
const fmtDate = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};

// ── SHA-256 (Web Crypto) ──────────────────────────────────────────────────────
const sha256 = async (buffer) => {
  try {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch { return null; }
};

// ── JPEG / EXIF parser ────────────────────────────────────────────────────────
const EXIF_TAGS = {
  0x010F: 'cameraMake', 0x0110: 'cameraModel', 0x0131: 'software',
  0x013B: 'artist',     0x0132: 'dateTime',    0x8298: 'copyright',
  0x013C: 'hostComputer',
};
const EXIF_IFD_TAGS = {
  0x9003: 'dateTimeOriginal', 0x9004: 'dateTimeDigitized',
  0x9286: 'userComment',      0xA420: 'imageUniqueId',
  0x9010: 'offsetTimeOriginal',
};
const GPS_TAGS = { 0x01: 'gpsLatRef', 0x02: 'gpsLat', 0x03: 'gpsLonRef', 0x04: 'gpsLon', 0x06: 'gpsAlt', 0x1D: 'gpsDate' };

const readStr = (view, offset, len, le) => {
  let s = '';
  for (let i = 0; i < len; i++) { const c = view.getUint8(offset + i); if (c === 0) break; s += String.fromCharCode(c); }
  return s.trim();
};
const readRational = (view, offset, le) => {
  const num = view.getUint32(offset, le);
  const den = view.getUint32(offset + 4, le);
  return den === 0 ? 0 : num / den;
};
const readIfd = (view, ifdOffset, tiffBase, le, tagMap) => {
  const result = {};
  try {
    const count = view.getUint16(ifdOffset, le);
    for (let i = 0; i < count; i++) {
      const base = ifdOffset + 2 + i * 12;
      const tag  = view.getUint16(base, le);
      const type = view.getUint16(base + 2, le);
      const cnt  = view.getUint32(base + 4, le);
      const valOff = base + 8;
      const key = tagMap[tag];
      if (!key) continue;
      try {
        if (type === 2) { // ASCII
          const off = cnt <= 4 ? valOff : tiffBase + view.getUint32(valOff, le);
          result[key] = readStr(view, off, cnt, le);
        } else if (type === 5 || type === 10) { // RATIONAL / SRATIONAL
          const off = tiffBase + view.getUint32(valOff, le);
          if (key === 'gpsLat' || key === 'gpsLon') {
            const deg = readRational(view, off, le);
            const min = readRational(view, off + 8, le);
            const sec = readRational(view, off + 16, le);
            result[key] = +(deg + min / 60 + sec / 3600).toFixed(7);
          } else {
            result[key] = +readRational(view, off, le).toFixed(4);
          }
        } else if (type === 3) { // SHORT
          result[key] = view.getUint16(valOff, le);
        } else if (type === 4) { // LONG
          result[key] = view.getUint32(valOff, le);
        } else if (type === 7) { // UNDEFINED
          if (key === 'userComment') {
            const off = cnt <= 4 ? valOff : tiffBase + view.getUint32(valOff, le);
            const raw = readStr(view, off + 8, Math.min(cnt - 8, 256), le);
            if (raw.trim()) result[key] = raw;
          }
        }
      } catch { /* skip bad tag */ }
    }
    return result;
  } catch { return result; }
};

const parseJpegExif = (buffer) => {
  const view  = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const result = {};
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return result;

  // Get image dimensions from SOF0/SOF2
  let off = 2;
  while (off < bytes.length - 4) {
    if (bytes[off] !== 0xFF) break;
    const marker = bytes[off + 1];
    const segLen = view.getUint16(off + 2);
    if (marker === 0xC0 || marker === 0xC2) {
      result.imageHeight = view.getUint16(off + 5);
      result.imageWidth  = view.getUint16(off + 7);
    }
    if (marker === 0xE1) {
      // Check for Exif header
      const hdr = String.fromCharCode(...bytes.slice(off + 4, off + 10));
      if (hdr === 'Exif\0\0') {
        const tiffBase = off + 10;
        const bom = String.fromCharCode(bytes[tiffBase], bytes[tiffBase + 1]);
        const le  = bom === 'II';
        const tv  = new DataView(buffer, tiffBase);
        const ifd0Off = tv.getUint32(4, le);
        const ifd0 = readIfd(tv, ifd0Off, 0, le, EXIF_TAGS);
        Object.assign(result, ifd0);

        // ExifIFD sub-IFD
        const ifd0Count = tv.getUint16(ifd0Off, le);
        for (let i = 0; i < ifd0Count; i++) {
          const b = ifd0Off + 2 + i * 12;
          const tag = tv.getUint16(b, le);
          if (tag === 0x8769) {
            const exifOff = tv.getUint32(b + 8, le);
            Object.assign(result, readIfd(tv, exifOff, 0, le, EXIF_IFD_TAGS));
          }
          if (tag === 0x8825) {
            const gpsOff = tv.getUint32(b + 8, le);
            const gps = readIfd(tv, gpsOff, 0, le, GPS_TAGS);
            if (gps.gpsLat !== undefined) {
              const lat = gps.gpsLatRef === 'S' ? -gps.gpsLat : gps.gpsLat;
              const lon = gps.gpsLonRef === 'W' ? -gps.gpsLon : gps.gpsLon;
              result.gpsCoordinates = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
              result.gpsMapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
            }
            if (gps.gpsAlt !== undefined) result.gpsAltitude = `${gps.gpsAlt.toFixed(1)} m`;
          }
        }
      }
    }
    off += 2 + segLen;
  }
  return result;
};

// ── PNG chunk parser ──────────────────────────────────────────────────────────
const parsePngMeta = (buffer) => {
  const result = {};
  const view  = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const sig   = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!sig.every((b, i) => bytes[i] === b)) return result;

  let off = 8;
  while (off < bytes.length - 12) {
    const len  = view.getUint32(off);
    const type = String.fromCharCode(...bytes.slice(off + 4, off + 8));

    if (type === 'IHDR') {
      result.imageWidth  = view.getUint32(off + 8);
      result.imageHeight = view.getUint32(off + 12);
      const depth   = bytes[off + 16];
      const colorT  = bytes[off + 17];
      const colors  = { 0: 'Grayscale', 2: 'RGB', 3: 'Indexed', 4: 'Grayscale+Alpha', 6: 'RGBA' };
      result.colorMode   = `${colors[colorT] || colorT}`;
      result.bitDepth    = `${depth}-bit`;
    }

    if (type === 'tEXt') {
      const chunk = bytes.slice(off + 8, off + 8 + len);
      const nullIdx = chunk.indexOf(0);
      if (nullIdx !== -1) {
        const key = new TextDecoder().decode(chunk.slice(0, nullIdx)).toLowerCase().replace(/\s+/g, '');
        const val = new TextDecoder().decode(chunk.slice(nullIdx + 1));
        if (val.trim()) result[`png_${key}`] = val.trim();
      }
    }

    if (type === 'iTXt') {
      const chunk = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(off + 8, off + 8 + Math.min(len, 1024)));
      const parts = chunk.split('\0');
      if (parts.length >= 2 && parts[parts.length - 1].trim()) {
        const key = parts[0].toLowerCase().replace(/\s+/g, '');
        result[`png_${key}`] = parts[parts.length - 1].trim().slice(0, 500);
      }
    }

    if (type === 'IEND') break;
    off += 12 + len;
  }
  return result;
};

// ── ZIP local file scanner for Office Open XML ────────────────────────────────
const parseZipEntries = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const view  = new DataView(buffer);
  const files = {};
  let off = 0;
  while (off < bytes.length - 30) {
    if (bytes[off]===0x50 && bytes[off+1]===0x4B && bytes[off+2]===0x03 && bytes[off+3]===0x04) {
      const compression = view.getUint16(off + 8, true);
      const compSize    = view.getUint32(off + 18, true);
      const fnLen       = view.getUint16(off + 26, true);
      const exLen       = view.getUint16(off + 28, true);
      const fname       = new TextDecoder().decode(bytes.slice(off + 30, off + 30 + fnLen));
      const dataOff     = off + 30 + fnLen + exLen;
      if (compression === 0 && compSize > 0 && compSize < 65536) {
        try {
          files[fname] = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(dataOff, dataOff + compSize));
        } catch { /* skip */ }
      }
      off = dataOff + compSize;
    } else { off++; }
  }
  return files;
};

const xmlVal = (xml, tag) => {
  const m = xml.match(new RegExp(`<(?:[^:]+:)?${tag}[^>]*>([^<]+)<`));
  return m ? m[1].trim() : null;
};

const parseOfficeXml = (entries) => {
  const result = {};
  const core = entries['docProps/core.xml'] || '';
  const app  = entries['docProps/app.xml']  || '';

  if (core) {
    const fields = { creator: 'creator', lastModifiedBy: 'lastModifiedBy', title: 'title',
                     subject: 'subject', description: 'description', keywords: 'keywords',
                     created: 'created', modified: 'modified', revision: 'revision', category: 'category' };
    for (const [key, tag] of Object.entries(fields)) {
      const v = xmlVal(core, tag);
      if (v) result[key] = key === 'created' || key === 'modified' ? fmtDate(v) : v;
    }
  }
  if (app) {
    const fields = { application: 'Application', company: 'Company', appVersion: 'AppVersion',
                     pages: 'Pages', words: 'Words', characters: 'Characters',
                     slides: 'Slides', manager: 'Manager', template: 'Template' };
    for (const [key, tag] of Object.entries(fields)) {
      const v = xmlVal(app, tag);
      if (v) result[key] = v;
    }
  }
  return result;
};

// ── PDF metadata parser ───────────────────────────────────────────────────────
const parsePdfMeta = (text) => {
  const result = {};
  const fields = {
    title: /\/Title\s*\(([^)]+)\)/,
    author: /\/Author\s*\(([^)]+)\)/,
    subject: /\/Subject\s*\(([^)]+)\)/,
    keywords: /\/Keywords\s*\(([^)]+)\)/,
    creator: /\/Creator\s*\(([^)]+)\)/,
    producer: /\/Producer\s*\(([^)]+)\)/,
    creationDate: /\/CreationDate\s*\(D:(\d{14})/,
    modDate: /\/ModDate\s*\(D:(\d{14})/,
  };
  for (const [key, re] of Object.entries(fields)) {
    const m = text.match(re);
    if (m && m[1].trim()) {
      if (key === 'creationDate' || key === 'modDate') {
        const d = m[1];
        result[key] = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)} ${d.slice(8,10)}:${d.slice(10,12)}:${d.slice(12,14)}`;
      } else {
        result[key] = m[1].trim().replace(/\\n/g, ' ').slice(0, 300);
      }
    }
  }
  // Try XMP author
  const xmpAuthor = text.match(/<dc:creator>[^<]*<rdf:li>([^<]+)<\/rdf:li>/);
  if (xmpAuthor && !result.author) result.author = xmpAuthor[1];
  // PDF version from header
  const ver = text.match(/%PDF-(\d+\.\d+)/);
  if (ver) result.pdfVersion = ver[1];
  // Page count
  const pages = text.match(/\/Type\s*\/Pages[\s\S]{1,200}?\/Count\s+(\d+)/);
  if (pages) result.pages = pages[1];
  return result;
};

// ── Main extractor ────────────────────────────────────────────────────────────
const extractMetadata = async (file) => {
  const buffer = await file.arrayBuffer();
  const ext    = getExt(file.name);
  const base   = {
    _fileName:     file.name,
    _fileSize:     fmtSize(file.size),
    _fileSizeRaw:  file.size,
    _mimeType:     file.type || 'application/octet-stream',
    _lastModified: new Date(file.lastModified).toLocaleString(),
    _sha256:       await sha256(buffer),
  };

  let extra = {};
  try {
    if (ext === 'jpg' || ext === 'jpeg') {
      extra = parseJpegExif(buffer);
    } else if (['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'].includes(ext)) {
      const entries = parseZipEntries(buffer);
      extra = parseOfficeXml(entries);
    } else if (ext === 'pdf') {
      const text = new TextDecoder('latin1').decode(new Uint8Array(buffer).slice(0, 131072));
      extra = parsePdfMeta(text);
    } else if (ext === 'png') {
      extra = parsePngMeta(buffer);
    }
  } catch { /* parsing failed — show base only */ }

  return { ...base, ...extra };
};

// ── Risk scoring ──────────────────────────────────────────────────────────────
const RISK_KEYS = new Set([
  'author', 'creator', 'lastModifiedBy', 'company', 'manager',
  'gpsCoordinates', 'gpsMapsUrl', 'gpsAltitude', 'cameraMake', 'cameraModel',
  'artist', 'copyright', 'userComment', 'hostComputer', 'keywords',
  'producer', 'application', 'appVersion', 'template',
  'png_author', 'png_comment', 'png_copyright', 'png_software', 'png_source',
]);

const RISK_LABELS = {
  author: 'Real name / Username', creator: 'Creator Tool / Name', lastModifiedBy: 'Last Editor Username',
  company: 'Company Name', manager: 'Manager Name',
  gpsCoordinates: 'GPS Coordinates', gpsMapsUrl: 'Google Maps Link', gpsAltitude: 'GPS Altitude',
  cameraMake: 'Camera Manufacturer', cameraModel: 'Camera Model',
  artist: 'Artist / Author Name', copyright: 'Copyright String', userComment: 'Embedded Comment',
  hostComputer: 'Host Computer Name', producer: 'PDF Producer Tool',
  application: 'Office Application', appVersion: 'App Version', template: 'Document Template',
  png_author: 'PNG Author', png_comment: 'PNG Comment', png_software: 'PNG Software',
};

const getRiskFindings = (meta) =>
  Object.entries(meta)
    .filter(([k, v]) => RISK_KEYS.has(k) && v && String(v).trim())
    .map(([k, v]) => ({ key: k, label: RISK_LABELS[k] || k, value: String(v) }));

// ── Section groups ────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    label: 'File System',
    color: BLUE,
    keys:  ['_fileName', '_fileSize', '_mimeType', '_lastModified', '_sha256'],
    labels: { _fileName: 'File Name', _fileSize: 'File Size', _mimeType: 'MIME Type',
              _lastModified: 'Last Modified', _sha256: 'SHA-256 Hash' },
  },
  {
    label: 'Document Properties',
    color: ACCENT,
    keys:  ['title', 'subject', 'description', 'keywords', 'category',
            'creator', 'author', 'lastModifiedBy', 'company', 'manager',
            'created', 'modified', 'revision', 'pages', 'words', 'slides',
            'characters', 'template'],
    labels: { title: 'Title', subject: 'Subject', description: 'Description',
               keywords: 'Keywords', category: 'Category', creator: 'Creator',
               author: 'Author', lastModifiedBy: 'Last Modified By', company: 'Company',
               manager: 'Manager', created: 'Created', modified: 'Modified',
               revision: 'Revision', pages: 'Pages', words: 'Word Count',
               slides: 'Slides', characters: 'Characters', template: 'Template' },
  },
  {
    label: 'Software & Application',
    color: GREEN,
    keys:  ['application', 'appVersion', 'software', 'producer', 'pdfVersion'],
    labels: { application: 'Application', appVersion: 'App Version', software: 'Software',
               producer: 'PDF Producer', pdfVersion: 'PDF Version' },
  },
  {
    label: 'Image & Camera',
    color: PINK,
    keys:  ['imageWidth', 'imageHeight', 'colorMode', 'bitDepth', 'cameraMake', 'cameraModel',
            'dateTimeOriginal', 'dateTimeDigitized', 'dateTime', 'artist', 'copyright',
            'hostComputer', 'userComment', 'imageUniqueId'],
    labels: { imageWidth: 'Width (px)', imageHeight: 'Height (px)', colorMode: 'Color Mode',
               bitDepth: 'Bit Depth', cameraMake: 'Camera Make', cameraModel: 'Camera Model',
               dateTimeOriginal: 'Date Taken', dateTimeDigitized: 'Digitized', dateTime: 'DateTime',
               artist: 'Artist', copyright: 'Copyright', hostComputer: 'Host Computer',
               userComment: 'User Comment', imageUniqueId: 'Unique ID' },
  },
  {
    label: 'GPS / Location',
    color: ORANGE,
    keys:  ['gpsCoordinates', 'gpsAltitude', 'gpsMapsUrl'],
    labels: { gpsCoordinates: 'Coordinates', gpsAltitude: 'Altitude', gpsMapsUrl: 'Maps Link' },
  },
  {
    label: 'PDF Metadata',
    color: RED,
    keys:  ['author', 'title', 'subject', 'keywords', 'creator', 'producer',
            'pdfVersion', 'creationDate', 'modDate', 'pages'],
    labels: { author: 'Author', title: 'Title', subject: 'Subject', keywords: 'Keywords',
               creator: 'Creator', producer: 'Producer', pdfVersion: 'PDF Version',
               creationDate: 'Creation Date', modDate: 'Modified Date', pages: 'Pages' },
  },
  {
    label: 'PNG Embedded Text',
    color: CYAN,
    keys:  [],
    dynamic: (meta) => Object.entries(meta)
      .filter(([k]) => k.startsWith('png_'))
      .map(([k, v]) => ({ key: k, label: k.replace('png_', '').replace(/([A-Z])/g, ' $1').trim(), value: String(v) })),
  },
];

// ── CopyBtn ───────────────────────────────────────────────────────────────────
const CopyBtn = ({ value, size = 'xs' }) => {
  const [ok, setOk] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value).then(() => { setOk(true); setTimeout(() => setOk(false), 1800); }); };
  return (
    <Tooltip label={ok ? 'Copied!' : 'Copy'} fontSize="10px">
      <IconButton icon={ok ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
        size={size} variant="ghost" borderRadius="6px"
        color={ok ? GREEN : 'var(--dash-text-muted)'}
        _hover={{ color: ok ? GREEN : 'white', bg: 'rgba(255,255,255,0.06)' }}
        aria-label="copy" onClick={copy} />
    </Tooltip>
  );
};

// ── MetaRow ───────────────────────────────────────────────────────────────────
const MetaRow = ({ label, value, highlight, isUrl }) => (
  <Flex align="flex-start" gap={3} px={3} py={2.5} borderRadius="8px"
    bg={highlight ? `${ORANGE}08` : 'rgba(255,255,255,0.02)'}
    border={`1px solid ${highlight ? ORANGE + '25' : 'transparent'}`}
    _hover={{ bg: highlight ? `${ORANGE}12` : 'rgba(255,255,255,0.05)' }}
    transition="all 0.12s" role="group">
    <Text fontSize="10px" color="var(--dash-text-muted)" fontWeight="semibold"
      textTransform="uppercase" letterSpacing="wide" minW="140px" flexShrink={0} pt="1px">
      {label}
    </Text>
    <Flex flex={1} align="center" gap={2} minW={0}>
      <Text fontSize="11px" color={highlight ? ORANGE : 'var(--dash-text-primary)'}
        fontFamily="'Fira Code', monospace" wordBreak="break-all" flex={1}>
        {isUrl
          ? <Box as="a" href={value} target="_blank" rel="noopener noreferrer"
              color={BLUE} _hover={{ textDecoration: 'underline' }}>{value}</Box>
          : value}
      </Text>
      <Box opacity={0} _groupHover={{ opacity: 1 }} flexShrink={0}>
        <CopyBtn value={value} />
      </Box>
    </Flex>
  </Flex>
);

// ── MetaSection ───────────────────────────────────────────────────────────────
const MetaSection = ({ section, meta }) => {
  const rows = section.dynamic
    ? section.dynamic(meta)
    : section.keys
        .filter(k => meta[k] !== undefined && meta[k] !== null && String(meta[k]).trim())
        .map(k => ({ key: k, label: section.labels[k] || k, value: String(meta[k]) }));

  if (rows.length === 0) return null;

  return (
    <MotionBox initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      borderRadius="12px" overflow="hidden"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      pos="relative" mb={3}>
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${section.color}80, transparent)` }} />
      <Flex align="center" gap={2} px={4} pt={4} pb={2}>
        <Box w="3px" h="12px" borderRadius="full" bg={section.color} />
        <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
          textTransform="uppercase" letterSpacing="wider">{section.label}</Text>
        <Box px="7px" py="1px" borderRadius="20px"
          bg={`${section.color}15`} border={`1px solid ${section.color}30`}>
          <Text fontSize="9px" fontWeight="bold" color={section.color}>{rows.length}</Text>
        </Box>
      </Flex>
      <Box px={3} pb={3}>
        {rows.map(({ key, label, value }) => (
          <MetaRow key={key} label={label} value={value}
            isUrl={key === 'gpsMapsUrl'}
            highlight={RISK_KEYS.has(key) && key !== '_sha256' && !key.startsWith('_')} />
        ))}
      </Box>
    </MotionBox>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────
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

// ── DropZone ──────────────────────────────────────────────────────────────────
const DropZone = ({ onFiles, analyzing }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <Box
      onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      onDrop={handleDrop}
      onClick={() => !analyzing && inputRef.current?.click()}
      cursor={analyzing ? 'default' : 'pointer'}
      borderRadius="14px"
      border={`2px dashed ${dragging ? ACCENT : 'rgba(255,255,255,0.12)'}`}
      bg={dragging ? `${ACCENT}08` : 'rgba(255,255,255,0.02)'}
      px={6} py={8}
      style={{ transition: 'all 0.15s' }}
      _hover={!analyzing ? { borderColor: `${ACCENT}60`, bg: `${ACCENT}06` } : {}}>
      <Flex direction="column" align="center" justify="center" gap={4}>
        <Flex w="56px" h="56px" borderRadius="14px"
          bg={`${ACCENT}12`} border={`1px solid ${ACCENT}30`}
          align="center" justify="center">
          {analyzing
            ? <Box w="20px" h="20px" borderRadius="full"
                border={`2px solid ${ACCENT}40`} borderTop={`2px solid ${ACCENT}`}
                style={{ animation: 'spin 0.8s linear infinite' }} />
            : <SearchIcon boxSize={5} color={ACCENT} />}
        </Flex>
        <Box textAlign="center">
          <Text fontSize="14px" fontWeight="semibold" color="var(--dash-text-primary)">
            {analyzing ? 'Extracting metadata…' : <>Drop files here or <Text as="span" color={ACCENT}>click to analyze</Text></>}
          </Text>
          <Text fontSize="12px" color="var(--dash-text-muted)" mt={1}>
            JPEG · PNG · PDF · DOCX · XLSX · PPTX · and more
          </Text>
        </Box>
      </Flex>
      <input ref={inputRef} type="file" multiple style={{ display: 'none' }}
        onChange={e => { const f = Array.from(e.target.files || []); if (f.length) onFiles(f); e.target.value = ''; }} />
    </Box>
  );
};

// ── FileListItem ──────────────────────────────────────────────────────────────
const FileListItem = ({ item, selected, onClick, onRemove, onDownload, downloading }) => {
  const em   = getEMeta(item.name);
  const risk = getRiskFindings(item.meta || {});
  return (
    <Flex align="center" gap={3} px={3} py={2.5} borderRadius="9px"
      bg={selected ? `${ACCENT}12` : 'rgba(255,255,255,0.02)'}
      border={`1px solid ${selected ? ACCENT + '40' : 'transparent'}`}
      _hover={{ bg: selected ? `${ACCENT}15` : 'rgba(255,255,255,0.05)', borderColor: selected ? ACCENT + '50' : 'rgba(255,255,255,0.08)' }}
      cursor="pointer" transition="all 0.12s" role="group"
      onClick={onClick}>
      {/* Type badge */}
      <Flex w="32px" h="32px" borderRadius="7px" flexShrink={0}
        bg={`${em.color}18`} border={`1px solid ${em.color}40`}
        align="center" justify="center" fontSize="7px" fontWeight="bold"
        letterSpacing="wide" color={em.color}>
        {em.label.slice(0, 4)}
      </Flex>
      <Box flex={1} minW={0}>
        <Text fontSize="11px" fontWeight="semibold" color="var(--dash-text-primary)"
          noOfLines={1}>{item.name}</Text>
        <Flex align="center" gap={2} mt="1px">
          <Text fontSize="9px" color="var(--dash-text-muted)" fontFamily="mono">
            {fmtSize(item.size)}
          </Text>
          {item.saved && (
            <Flex align="center" gap={1} px={1.5} py="1px" borderRadius="4px"
              bg={`${GREEN}12`} border={`1px solid ${GREEN}25`}>
              <CheckIcon boxSize={2} color={GREEN} />
              <Text fontSize="8px" fontWeight="bold" color={GREEN}>saved</Text>
            </Flex>
          )}
          {risk.length > 0 && (
            <Flex align="center" gap={1} px={1.5} py="1px" borderRadius="4px"
              bg={`${ORANGE}15`} border={`1px solid ${ORANGE}30`}>
              <WarningIcon boxSize={2} color={ORANGE} />
              <Text fontSize="8px" fontWeight="bold" color={ORANGE}>{risk.length}</Text>
            </Flex>
          )}
          {item.analyzing && (
            <Text fontSize="9px" color="var(--dash-text-muted)">analyzing…</Text>
          )}
        </Flex>
      </Box>
      <Flex opacity={0} _groupHover={{ opacity: 1 }} flexShrink={0} gap={1}
        onClick={e => e.stopPropagation()}>
        {item.saved && (
          <IconButton
            icon={downloading === item.id ? <Spinner size="xs" /> : <DownloadIcon boxSize={3} />}
            size="xs" variant="ghost" borderRadius="6px"
            color="var(--dash-text-muted)" _hover={{ color: BLUE, bg: `${BLUE}15` }}
            aria-label="Download" isDisabled={downloading === item.id}
            onClick={() => onDownload(item)} />
        )}
        <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost" borderRadius="6px"
          color="var(--dash-text-muted)" _hover={{ color: RED, bg: `${RED}15` }}
          aria-label="Remove" onClick={onRemove} />
      </Flex>
    </Flex>
  );
};

// ── Main View ─────────────────────────────────────────────────────────────────
const FileMetaView = () => {
  const { slug } = useParams();
  const { getBySlug } = useEngagements();
  const eng = getBySlug(slug);

  // files shape: { id (string = _id from DB, or tmp-N), name, size, meta, analyzing, saved }
  const [files,        setFiles]        = useState([]);
  const [selectedId,   setSelectedId]   = useState(null);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [downloading,  setDownloading]  = useState(null);
  const tmpId = useRef(1);

  // ── Load saved entries on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!eng?._id) return;
    setLoading(true);
    fetch(`${API_BASE}/api/file-meta/${eng._id}/entries`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(entries => {
        const loaded = entries.map(e => ({
          id:       String(e._id),
          dbId:     String(e._id),
          name:     e.name,
          size:     e.size,
          meta:     e.extractedMeta || {},
          analyzing: false,
          saved:    true,
        }));
        setFiles(loaded);
        if (loaded.length > 0) setSelectedId(loaded[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eng?._id]); // eslint-disable-line

  // ── Upload + analyze ─────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (incoming) => {
    setAnalyzing(true);

    // Add placeholder entries immediately
    const placeholders = incoming.map(f => ({
      id: `tmp-${tmpId.current++}`, name: f.name, size: f.size,
      meta: null, analyzing: true, saved: false,
    }));
    setFiles(prev => [...prev, ...placeholders]);
    if (!selectedId && placeholders.length > 0) setSelectedId(placeholders[0].id);

    for (let i = 0; i < incoming.length; i++) {
      const file        = incoming[i];
      const placeholder = placeholders[i];

      // 1. Extract metadata client-side
      const meta = await extractMetadata(file);

      // 2. Read file as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 3. Save to DB
      let dbId = null;
      try {
        const res = await fetch(`${API_BASE}/api/file-meta/${eng._id}/entries`, {
          method:  'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            name:          file.name,
            size:          file.size,
            mimeType:      file.type || 'application/octet-stream',
            extractedMeta: meta,
            data:          base64,
          }),
        });
        if (res.ok) {
          const saved = await res.json();
          dbId = String(saved._id);
        }
      } catch { /* saved=false, still show in UI */ }

      setFiles(prev => prev.map(f =>
        f.id === placeholder.id
          ? { ...f, id: dbId || f.id, dbId, meta, analyzing: false, saved: !!dbId }
          : f
      ));
      if (selectedId === placeholder.id && dbId) setSelectedId(dbId);
    }
    setAnalyzing(false);
  }, [eng, selectedId]);

  // ── Remove ───────────────────────────────────────────────────────────────────
  const removeFile = useCallback(async (id) => {
    const file = files.find(f => f.id === id);
    setFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
    if (file?.dbId) {
      try {
        await fetch(`${API_BASE}/api/file-meta/${eng._id}/entries/${file.dbId}`, {
          method: 'DELETE', headers: authHeaders(),
        });
      } catch { /* ignore */ }
    }
  }, [files, selectedId, eng]);

  // ── Clear all ────────────────────────────────────────────────────────────────
  const clearAll = async () => {
    const toDelete = files.filter(f => f.dbId);
    setFiles([]); setSelectedId(null);
    await Promise.all(toDelete.map(f =>
      fetch(`${API_BASE}/api/file-meta/${eng._id}/entries/${f.dbId}`, {
        method: 'DELETE', headers: authHeaders(),
      }).catch(() => {})
    ));
  };

  // ── Download original file ───────────────────────────────────────────────────
  const handleDownload = useCallback(async (file) => {
    if (!file.dbId) return;
    setDownloading(file.id);
    try {
      const res = await fetch(
        `${API_BASE}/api/file-meta/${eng._id}/entries/${file.dbId}/download`,
        { headers: authHeaders() }
      );
      if (!res.ok) return;
      const { data, mimeType, name } = await res.json();
      const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      const blob  = new Blob([bytes], { type: mimeType });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    finally { setDownloading(null); }
  }, [eng]);

  const selected     = files.find(f => f.id === selectedId);
  const meta         = selected?.meta || {};
  const risk         = getRiskFindings(meta);
  const totalRisk    = files.reduce((s, f) => s + getRiskFindings(f.meta || {}).length, 0);
  const totalFields  = files.reduce((s, f) => s + Object.keys(f.meta || {}).length, 0);

  // Determine which sections to show (skip sections with no data AND skip PDF section for non-PDFs, etc.)
  const ext = selected ? getExt(selected.name) : '';
  const visibleSections = SECTIONS.filter(sec => {
    if (sec.label === 'PDF Metadata' && ext !== 'pdf') return false;
    if (sec.label === 'Image & Camera' && !['jpg','jpeg','png'].includes(ext)) return false;
    if (sec.label === 'GPS / Location' && ext !== 'jpg' && ext !== 'jpeg') return false;
    if (sec.label === 'PNG Embedded Text' && ext !== 'png') return false;
    if (sec.label === 'Document Properties' && ['jpg','jpeg','png','pdf'].includes(ext)) return false;
    return true;
  });

  // Copy all metadata
  const copyAll = () => {
    if (!selected || !meta) return;
    const lines = [`=== ${selected.name} ===`];
    for (const [k, v] of Object.entries(meta)) {
      if (v !== null && v !== undefined) lines.push(`${k}: ${v}`);
    }
    navigator.clipboard.writeText(lines.join('\n'));
  };

  if (loading) return (
    <Flex align="center" justify="center" h="60vh" gap={3}>
      <Spinner size="sm" color={ACCENT} thickness="2px" />
      <Text fontSize="13px" color="var(--dash-text-muted)">Loading saved files…</Text>
    </Flex>
  );

  return (
    <Box px={6} pb={12}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            File Metadata <Text as="span" color="red.400">Analyzer</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng?.name} · extract and analyze embedded metadata from files
          </Text>
        </Box>
        {files.length > 0 && (
          <Button size="sm" fontSize="11px" fontWeight="bold" borderRadius="8px"
            variant="ghost" color="var(--dash-text-muted)"
            _hover={{ color: RED, bg: `${RED}12` }}
            leftIcon={<DeleteIcon boxSize={3} />}
            onClick={clearAll}>
            Clear All
          </Button>
        )}
      </Flex>

      {/* ── Info banner ── */}
      <Box mb={5} px={4} py={3} borderRadius="10px"
        bg={`${ORANGE}08`} border={`1px solid ${ORANGE}25`}>
        <Flex align="center" gap={2} mb={2}>
          <WarningIcon boxSize={3} color={ORANGE} />
          <Text fontSize="10px" fontWeight="bold" color={ORANGE}
            textTransform="uppercase" letterSpacing="wider">OPSEC</Text>
        </Flex>
        <Flex gap={4} flexWrap="wrap">
          {['Extracts author names, usernames & company from Office/PDF', 'GPS coordinates from JPEG photos', 'Software versions & tool fingerprints', 'All processing is 100% local — no files leave your browser'].map(t => (
            <Flex key={t} align="center" gap={1.5}>
              <Box w="4px" h="4px" borderRadius="full" bg={ORANGE} flexShrink={0} />
              <Text fontSize="11px" color="var(--dash-text-secondary)">{t}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* ── Stats (only when files loaded) ── */}
      <AnimatePresence>
        {files.length > 0 && (
          <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={5}>
              <StatCard label="Files Analyzed" value={files.length}     color={ACCENT}  delay={0}    />
              <StatCard label="Total Fields"   value={totalFields}      color={BLUE}    delay={0.04} />
              <StatCard label="Risk Findings"  value={totalRisk}        color={ORANGE}  delay={0.08} />
              <StatCard label="GPS Hits"       value={files.filter(f => f.meta?.gpsCoordinates).length} color={RED} delay={0.12} />
            </SimpleGrid>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* ── Drop zone ── */}
      <Box mb={5}>
        <DropZone onFiles={handleFiles} analyzing={analyzing && files.length === 0} />
      </Box>

      {/* ── Two-column layout ── */}
      <AnimatePresence>
        {files.length > 0 && (
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Flex gap={4} align="flex-start">

              {/* ── Left: file list ── */}
              <Box w="280px" flexShrink={0}>
                <MotionBox initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  borderRadius="14px" overflow="hidden"
                  bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                  pos="relative">
                  <Box pos="absolute" top={0} left={0} right={0} h="2px"
                    style={{ background: `linear-gradient(to right, transparent, ${ACCENT}80, transparent)` }} />
                  <Flex align="center" gap={2} px={4} pt={4} pb={3}>
                    <AttachmentIcon boxSize={3.5} color={ACCENT} />
                    <Text fontSize="11px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wider">Files</Text>
                    <Box px="7px" py="1px" borderRadius="20px"
                      bg={`${ACCENT}15`} border={`1px solid ${ACCENT}30`}>
                      <Text fontSize="9px" fontWeight="bold" color={ACCENT}>{files.length}</Text>
                    </Box>
                  </Flex>
                  <Flex direction="column" gap={1} px={3} pb={3}
                    maxH="600px" overflowY="auto"
                    css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '2px' } }}>
                    {files.map(f => (
                      <FileListItem key={f.id} item={f}
                        selected={f.id === selectedId}
                        onClick={() => setSelectedId(f.id)}
                        onRemove={() => removeFile(f.id)}
                        onDownload={handleDownload}
                        downloading={downloading} />
                    ))}
                  </Flex>
                  {/* Add more button */}
                  <Box px={3} pb={3}>
                    <Box as="label"
                      display="flex" alignItems="center" justifyContent="center" gap={2}
                      px={3} py={2} borderRadius="8px" cursor="pointer"
                      border="1px dashed rgba(255,255,255,0.1)"
                      color="var(--dash-text-muted)" fontSize="11px"
                      _hover={{ borderColor: `${ACCENT}40`, color: ACCENT, bg: `${ACCENT}06` }}
                      transition="all 0.15s">
                      <AddIcon boxSize={2.5} />
                      Add more files
                      <input type="file" multiple style={{ display: 'none' }}
                        onChange={e => { const f = Array.from(e.target.files || []); if (f.length) handleFiles(f); e.target.value = ''; }} />
                    </Box>
                  </Box>
                </MotionBox>
              </Box>

              {/* ── Right: metadata panel ── */}
              <Box flex={1} minW={0}>
                {selected ? (
                  <MotionBox key={selected.id}
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}>

                    {/* File header bar */}
                    <Flex align="center" gap={3} mb={4} px={4} py={3} borderRadius="12px"
                      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                      pos="relative" overflow="hidden">
                      <Box pos="absolute" top={0} left={0} right={0} h="2px"
                        style={{ background: `linear-gradient(to right, transparent, ${getEMeta(selected.name).color}80, transparent)` }} />
                      <Flex w="40px" h="40px" borderRadius="9px" flexShrink={0}
                        bg={`${getEMeta(selected.name).color}18`}
                        border={`1px solid ${getEMeta(selected.name).color}40`}
                        align="center" justify="center" fontSize="8px" fontWeight="bold"
                        letterSpacing="wide" color={getEMeta(selected.name).color}>
                        {getEMeta(selected.name).label.slice(0, 4)}
                      </Flex>
                      <Box flex={1} minW={0}>
                        <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)" noOfLines={1}>
                          {selected.name}
                        </Text>
                        <Text fontSize="10px" color="var(--dash-text-muted)" fontFamily="mono">
                          {fmtSize(selected.size)} · {Object.keys(meta).length} fields extracted
                        </Text>
                      </Box>
                      <Button size="sm" fontSize="11px" fontWeight="bold" borderRadius="7px"
                        leftIcon={<CopyIcon boxSize={3} />}
                        bg={`${ACCENT}12`} border={`1px solid ${ACCENT}30`}
                        color={ACCENT} _hover={{ bg: `${ACCENT}22` }}
                        onClick={copyAll} flexShrink={0}>
                        Copy All
                      </Button>
                    </Flex>

                    {/* Risk findings panel */}
                    {risk.length > 0 && (
                      <MotionBox initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        borderRadius="12px" overflow="hidden"
                        bg="var(--dash-card-bg)" border={`1px solid ${ORANGE}30`}
                        pos="relative" mb={3}>
                        <Box pos="absolute" top={0} left={0} right={0} h="2px"
                          style={{ background: `linear-gradient(to right, transparent, ${ORANGE}90, transparent)` }} />
                        <Flex align="center" gap={2} px={4} pt={4} pb={2}>
                          <Flex w="22px" h="22px" borderRadius="6px"
                            bg={`${ORANGE}15`} border={`1px solid ${ORANGE}40`}
                            align="center" justify="center" flexShrink={0}>
                            <WarningIcon boxSize={3} color={ORANGE} />
                          </Flex>
                          <Text fontSize="10px" fontWeight="bold" color={ORANGE}
                            textTransform="uppercase" letterSpacing="wider">
                            Risk Findings — Sensitive Metadata
                          </Text>
                          <Box px="7px" py="1px" borderRadius="20px"
                            bg={`${ORANGE}15`} border={`1px solid ${ORANGE}30`}>
                            <Text fontSize="9px" fontWeight="bold" color={ORANGE}>{risk.length}</Text>
                          </Box>
                        </Flex>
                        <Box px={3} pb={3}>
                          {risk.map(({ key, label, value }) => (
                            <MetaRow key={key} label={label} value={value}
                              isUrl={key === 'gpsMapsUrl'} highlight />
                          ))}
                        </Box>
                      </MotionBox>
                    )}

                    {/* No metadata found */}
                    {selected.analyzing && (
                      <Flex align="center" justify="center" py={10} gap={3}>
                        <Box w="18px" h="18px" borderRadius="full"
                          border={`2px solid ${ACCENT}40`} borderTop={`2px solid ${ACCENT}`}
                          style={{ animation: 'spin 0.8s linear infinite' }} />
                        <Text fontSize="12px" color="var(--dash-text-muted)">Extracting metadata…</Text>
                      </Flex>
                    )}

                    {/* Metadata sections */}
                    {!selected.analyzing && visibleSections.map(sec => (
                      <MetaSection key={sec.label} section={sec} meta={meta} />
                    ))}

                    {/* Fallback: show all raw fields if nothing matches sections */}
                    {!selected.analyzing && Object.keys(meta).filter(k => !k.startsWith('_')).length === 0 && (
                      <Flex direction="column" align="center" justify="center" py={8} gap={3}
                        borderRadius="12px" bg="var(--dash-card-bg)"
                        border="1px solid var(--dash-card-border)">
                        <Flex w="44px" h="44px" borderRadius="12px"
                          bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
                          align="center" justify="center">
                          <InfoIcon boxSize={5} color="var(--dash-text-muted)" />
                        </Flex>
                        <Box textAlign="center">
                          <Text fontSize="13px" fontWeight="semibold" color="var(--dash-text-primary)">
                            No extractable metadata
                          </Text>
                          <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>
                            This file type has no embedded metadata or it has been stripped.
                          </Text>
                        </Box>
                      </Flex>
                    )}
                  </MotionBox>
                ) : (
                  <Flex align="center" justify="center" h="300px" borderRadius="14px"
                    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
                    <Text fontSize="12px" color="var(--dash-text-muted)">Select a file to view metadata</Text>
                  </Flex>
                )}
              </Box>
            </Flex>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default FileMetaView;
