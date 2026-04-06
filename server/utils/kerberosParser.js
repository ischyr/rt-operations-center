/**
 * Kerberos ticket parser — supports:
 *  - MIT ccache v3 (0x0503) / v4 (0x0504) binary files
 *  - KRB-CRED (kirbi) base64 DER-encoded blobs (mimikatz export format)
 */

const ETYPE_MAP = {
  1:  { name: 'DES-CBC-CRC',             risk: 'CRITICAL', color: 'red'    },
  3:  { name: 'DES-CBC-MD5',             risk: 'CRITICAL', color: 'red'    },
  17: { name: 'AES128-CTS-HMAC-SHA1-96', risk: 'LOW',      color: 'green'  },
  18: { name: 'AES256-CTS-HMAC-SHA1-96', risk: 'LOW',      color: 'green'  },
  23: { name: 'RC4-HMAC',                risk: 'HIGH',     color: 'orange' },
  24: { name: 'RC4-HMAC-EXP',            risk: 'CRITICAL', color: 'red'    },
};

const FLAG_BITS = {
  0x40000000: 'FORWARDABLE',
  0x20000000: 'FORWARDED',
  0x10000000: 'PROXIABLE',
  0x08000000: 'PROXY',
  0x04000000: 'MAY-POSTDATE',
  0x02000000: 'POSTDATED',
  0x01000000: 'INVALID',
  0x00800000: 'RENEWABLE',
  0x00400000: 'INITIAL',
  0x00200000: 'PRE-AUTHENT',
  0x00100000: 'HW-AUTHENT',
  0x00080000: 'TRANSITED-POLICY-CHECKED',
  0x00040000: 'OK-AS-DELEGATE',
};

// ── Buffer reader ─────────────────────────────────────────────────────────────
class Reader {
  constructor(buf) { this.buf = buf; this.pos = 0; }
  u8()  { return this.buf.readUInt8(this.pos++); }
  u16() { const v = this.buf.readUInt16BE(this.pos); this.pos += 2; return v; }
  u32() { const v = this.buf.readUInt32BE(this.pos); this.pos += 4; return v; }
  read(n) { const v = this.buf.slice(this.pos, this.pos + n); this.pos += n; return v; }
  str(n) { return this.read(n).toString('utf8'); }
  get rem() { return this.buf.length - this.pos; }
}

// ── ccache parser ─────────────────────────────────────────────────────────────
function parsePrincipal(r) {
  const nameType  = r.u32();
  const count     = r.u32();
  const realmLen  = r.u32();
  const realm     = r.str(realmLen);
  const components = [];
  for (let i = 0; i < count; i++) {
    const l = r.u32();
    components.push(r.str(l));
  }
  return { nameType, realm, components };
}

function parseCCache(buf) {
  const r = new Reader(buf);
  const version = r.u16();
  if (version !== 0x0504 && version !== 0x0503) {
    throw new Error(`Unsupported ccache version: 0x${version.toString(16)}`);
  }
  const headerLen = r.u16();
  r.read(headerLen);

  const creds = [];
  while (r.rem > 32) {
    try {
      const startPos = r.pos;
      const client = parsePrincipal(r);
      const server = parsePrincipal(r);

      // Keyblock: uint16 keytype, [uint16 etype if v3], data (uint32 len + bytes)
      const keytype = r.u16();
      if (version === 0x0503) r.u16(); // extra etype field
      const keyLen = r.u32();
      r.read(keyLen);

      const authtime  = r.u32();
      const starttime = r.u32();
      const endtime   = r.u32();
      const renewTill = r.u32();
      r.u8(); // is_skey
      const ticketFlags = r.u32();

      // Addresses
      const numAddr = r.u32();
      for (let i = 0; i < numAddr; i++) {
        r.u16();
        r.read(r.u32());
      }
      // Authdata
      const numAuth = r.u32();
      for (let i = 0; i < numAuth; i++) {
        r.u16();
        r.read(r.u32());
      }
      // Ticket data
      const ticketData = r.read(r.u32());
      r.read(r.u32()); // second ticket

      creds.push({ client, server, keytype, authtime, starttime, endtime, renewTill, ticketFlags, ticketData });
    } catch { break; }
  }

  if (creds.length === 0) throw new Error('No credentials found in ccache');

  const cred = creds[0];
  return formatResult('ccache', cred.client, cred.server, cred.keytype,
    cred.ticketFlags, cred.authtime, cred.starttime, cred.endtime, cred.renewTill,
    cred.ticketData.toString('base64'), creds.length);
}

// ── DER/ASN.1 parser (for kirbi) ──────────────────────────────────────────────
function derLen(buf, off) {
  const first = buf[off];
  if (first < 0x80) return { len: first, hLen: 1 };
  const nb = first & 0x7f;
  let len = 0;
  for (let i = 0; i < nb; i++) len = (len << 8) | buf[off + 1 + i];
  return { len, hLen: 1 + nb };
}

function derNode(buf, off) {
  const tag = buf[off];
  const { len, hLen } = derLen(buf, off + 1);
  const vs = off + 1 + hLen;
  return { tag, len, vs, end: vs + len, total: 1 + hLen + len };
}

function derFind(buf, start, end, tag) {
  let pos = start;
  while (pos < end) {
    const n = derNode(buf, pos);
    if (n.tag === tag) return n;
    pos += n.total;
  }
  return null;
}

function derChildren(buf, start, end) {
  const out = []; let pos = start;
  while (pos < end) { const n = derNode(buf, pos); out.push(n); pos += n.total; }
  return out;
}

function derInt(buf, n) {
  let v = 0;
  for (let i = n.vs; i < n.end; i++) v = (v << 8) | buf[i];
  return v;
}

function derStr(buf, n) { return buf.slice(n.vs, n.end).toString('utf8'); }

function parseKirbi(buf) {
  // KRB-CRED = APPLICATION 22 = 0x76
  if (buf[0] !== 0x76) throw new Error('Not KRB-CRED: expected tag 0x76');
  const root = derNode(buf, 0);
  const seq  = derFind(buf, root.vs, root.end, 0x30);
  if (!seq) throw new Error('No SEQUENCE in KRB-CRED');

  // [2] tickets context
  const ticketsCtx = derFind(buf, seq.vs, seq.end, 0xa2);
  if (!ticketsCtx) throw new Error('No tickets [2]');
  const ticketsSeq = derFind(buf, ticketsCtx.vs, ticketsCtx.end, 0x30);
  if (!ticketsSeq) throw new Error('No ticket SEQUENCE OF');

  // APPLICATION 1 = Ticket = 0x61
  const ticketApp = derFind(buf, ticketsSeq.vs, ticketsSeq.end, 0x61);
  if (!ticketApp) throw new Error('No Ticket [APPLICATION 1]');
  const ticketSeq = derFind(buf, ticketApp.vs, ticketApp.end, 0x30);
  if (!ticketSeq) throw new Error('No Ticket SEQUENCE');

  // [1] realm
  let realm = 'UNKNOWN';
  const realmCtx = derFind(buf, ticketSeq.vs, ticketSeq.end, 0xa1);
  if (realmCtx) {
    const rs = derFind(buf, realmCtx.vs, realmCtx.end, 0x1b) ||
               derFind(buf, realmCtx.vs, realmCtx.end, 0x0c);
    if (rs) realm = derStr(buf, rs);
  }

  // [2] sname → SPN components
  const spnComponents = [];
  const snameCtx = derFind(buf, ticketSeq.vs, ticketSeq.end, 0xa2);
  if (snameCtx) {
    const snameSeq = derFind(buf, snameCtx.vs, snameCtx.end, 0x30);
    if (snameSeq) {
      const nameStrCtx = derFind(buf, snameSeq.vs, snameSeq.end, 0xa1);
      if (nameStrCtx) {
        const strSeq = derFind(buf, nameStrCtx.vs, nameStrCtx.end, 0x30);
        if (strSeq) {
          derChildren(buf, strSeq.vs, strSeq.end).forEach(c => {
            if (c.tag === 0x1b || c.tag === 0x0c) spnComponents.push(derStr(buf, c));
          });
        }
      }
    }
  }

  // [3] enc-part → etype
  let etype = 0;
  const encPartCtx = derFind(buf, ticketSeq.vs, ticketSeq.end, 0xa3);
  if (encPartCtx) {
    const encSeq = derFind(buf, encPartCtx.vs, encPartCtx.end, 0x30);
    if (encSeq) {
      const etypeCtx = derFind(buf, encSeq.vs, encSeq.end, 0xa0);
      if (etypeCtx) {
        const etypeInt = derFind(buf, etypeCtx.vs, etypeCtx.end, 0x02);
        if (etypeInt) etype = derInt(buf, etypeInt);
      }
    }
  }

  const server = { realm, components: spnComponents };
  const client = { realm, components: [] };
  return formatResult('kirbi', client, server, etype, 0x40e10000, 0, 0, 0, 0, buf.toString('base64'), 1);
}

// ── Format result ─────────────────────────────────────────────────────────────
function formatResult(format, client, server, etype, ticketFlags, authtime, starttime, endtime, renewTill, rawB64, credCount) {
  const etypeInfo = ETYPE_MAP[etype] || { name: `Unknown (${etype})`, risk: 'UNKNOWN', color: 'gray' };
  const flagList  = Object.entries(FLAG_BITS)
    .filter(([bit]) => ticketFlags & Number(bit))
    .map(([, name]) => name);

  const spn = server.components.join('/') + (server.realm ? `@${server.realm}` : '');
  const clientPrincipal = client.components.join('/') + (client.realm ? `@${client.realm}` : '');

  // Determine if TGT or TGS
  const isTGT = server.components.some(c => c.toLowerCase() === 'krbtgt');
  const ticketType = isTGT ? 'TGT' : 'TGS';

  // Build abuse list
  const abuses = [];
  if (isTGT)          abuses.push({ id: 'tgt',         label: 'Golden/Silver Ticket Source', severity: 'CRITICAL' });
  if (etype === 23)   abuses.push({ id: 'rc4crack',    label: 'RC4 — Crackable Offline',     severity: 'HIGH'     });
  if (etype <= 3)     abuses.push({ id: 'descrack',    label: 'DES — Trivially Crackable',   severity: 'CRITICAL' });
  if (flagList.includes('FORWARDABLE')) abuses.push({ id: 'fwd', label: 'Forwardable — Lateral Movement', severity: 'HIGH' });
  if (flagList.includes('RENEWABLE'))  abuses.push({ id: 'ren', label: 'Renewable — Extended Persistence', severity: 'MEDIUM' });
  abuses.push({ id: 'ptt', label: 'Pass-the-Ticket (PTT)', severity: 'HIGH' });

  const fmtTime = t => t ? new Date(t * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : 'N/A (encrypted)';
  const isExpired = endtime && endtime < Math.floor(Date.now() / 1000);

  return {
    format, ticketType, credCount,
    client: clientPrincipal,
    server: spn,
    realm: server.realm || client.realm || 'UNKNOWN',
    etype, etypeName: etypeInfo.name, etypeRisk: etypeInfo.risk,
    flagList, ticketFlags: `0x${(ticketFlags >>> 0).toString(16).toUpperCase().padStart(8, '0')}`,
    times: {
      authtime:  fmtTime(authtime),
      starttime: fmtTime(starttime),
      endtime:   fmtTime(endtime),
      renewTill: fmtTime(renewTill),
    },
    isExpired,
    abuses,
    rawB64,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
function parseTicket(buf) {
  // Detect format by magic bytes
  if (buf.length >= 2) {
    const version = (buf[0] << 8) | buf[1];
    if (version === 0x0504 || version === 0x0503) return parseCCache(buf);
  }
  if (buf[0] === 0x76) return parseKirbi(buf);
  throw new Error('Unknown format — expected ccache (0x0504) or kirbi (0x76)');
}

module.exports = { parseTicket, ETYPE_MAP };
