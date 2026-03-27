const express = require('express');
const router  = express.Router();
const { load } = require('cheerio');           // top-level — no lazy require
const { protect } = require('../middleware/authMiddleware');

const BASE = 'https://ransomfeed.it';

// Node's built-in fetch only decompresses gzip/deflate.
// Omitting Accept-Encoding lets it negotiate a format it can actually handle.
const HEADERS = {
  'User-Agent':    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0',
  'Accept':        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Cache-Control': 'no-cache',
};

// GET /api/ransom/search?q=Romania
router.get('/search', protect, async (req, res) => {
  const { q = '' } = req.query;
  if (!q.trim()) return res.json({ results: [], query: q });

  try {
    const url      = `${BASE}/?page=search&q=${encodeURIComponent(q.trim())}`;
    const upstream = await fetch(url, { headers: HEADERS, redirect: 'follow' });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream returned ${upstream.status}` });
    }

    const html = await upstream.text();

    // Sanity-check: if the response doesn't look like HTML, bail early
    if (!html.includes('<')) {
      return res.json({ results: [], total: 0, query: q, raw: html.slice(0, 200) });
    }

    const $       = load(html);
    const results = [];

    // ── Strategy 1: <table> rows ─────────────────────────────────────────────
    const tables = $('table');
    if (tables.length > 0) {
      let bestTable = null;
      let bestCount = 0;
      tables.each((_, tbl) => {
        const rows = $(tbl).find('tbody tr').length;
        if (rows > bestCount) { bestCount = rows; bestTable = tbl; }
      });

      if (bestTable && bestCount > 0) {
        const headers = [];
        $(bestTable).find('thead th').each((_, th) => {
          headers.push($(th).text().trim().toLowerCase());
        });

        $(bestTable).find('tbody tr').each((_, row) => {
          const cells = $(row).find('td');
          const obj   = {};
          // Build obj from headers, also capture raw href per cell
          headers.forEach((h, i) => {
            obj[h]           = $(cells[i]).text().trim();
            obj[`${h}__href`]= $(cells[i]).find('a[href]').attr('href') || '';
          });

          // Post link — first <a> in the row that points to ransomfeed.it
          const postHref = $(row).find('a[href]').attr('href') || '';
          const postLink = postHref.startsWith('http') ? postHref
                         : postHref ? `${BASE}${postHref}` : '';

          // ── Field resolution — handles both English & Italian column names ──
          // Italian: #, Data, Vittima, Gruppo, Paese, Info
          // English: #/id, Date, Victim/Company, Group/Actor, Country, Website/Info
          const cell = (i) => $(cells[i]).text().trim();

          const victim  = obj['vittima']  || obj['victim']   || obj['company']
                        || obj['name']    || obj['target']   || cell(2) || '';

          const group   = obj['gruppo']   || obj['group']    || obj['threat actor']
                        || obj['actor']   || obj['ransomware group'] || obj['ransomware']
                        || cell(3) || '';

          const date    = obj['data']     || obj['date']     || obj['published']
                        || obj['post date'] || obj['discovered'] || cell(1) || '';

          const country = obj['paese']    || obj['country']  || q;
          const sector  = obj['settore']  || obj['sector']   || obj['industry']
                        || obj['category'] || '';

          // Website: "Info" column (index 5) often holds the victim domain
          let website = obj['info'] || obj['website'] || obj['domain']
                      || obj['url'] || obj['site'] || cell(5) || '';
          if (!website) {
            // Scan every cell for an external href or domain-like text
            cells.each((_, c) => {
              const href = $(c).find('a[href]').attr('href') || '';
              if (href && !href.includes('ransomfeed') && href.startsWith('http')) {
                website = website || href;
              }
              const txt = $(c).text().trim();
              if (!website && /^[\w.-]+\.[a-z]{2,}$/i.test(txt) && !txt.includes(' ')) {
                website = website || txt;
              }
            });
          }

          if (victim || group) {
            results.push({
              victim:  victim.trim(),
              group:   group.trim(),
              date:    date.trim(),
              country: country.trim(),
              sector:  sector.trim(),
              website: website.trim(),
              link:    postLink,
            });
          }
        });
      }
    }

    // ── Strategy 2: article / card / div pattern ─────────────────────────────
    if (results.length === 0) {
      $('article, .post, .card, .result, .victim-card, [class*="victim"], [class*="post"]').each((_, el) => {
        const link    = $(el).find('a[href]').first().attr('href') || '';
        const heading = $(el).find('h1,h2,h3,h4,.title,.name,.victim').first().text().trim();
        const body    = $(el).text().replace(/\s+/g, ' ').trim();
        if (heading && heading.length > 2) {
          results.push({
            victim:  heading,
            group:   '',
            date:    '',
            country: q,
            sector:  '',
            link:    link.startsWith('http') ? link : link ? `${BASE}${link}` : '',
          });
        } else if (body && body.length > 4) {
          results.push({
            victim:  body.slice(0, 100),
            group:   '',
            date:    '',
            country: q,
            sector:  '',
            link:    link.startsWith('http') ? link : link ? `${BASE}${link}` : '',
          });
        }
      });
    }

    // ── Debug: log a snippet when nothing parsed ─────────────────────────────
    if (results.length === 0) {
      console.log('[ransomRoute] parsed 0 results — HTML snippet:', html.slice(0, 600));
    }

    res.json({ results, total: results.length, query: q });
  } catch (e) {
    console.error('[ransomRoute] search error:', e.message);
    res.status(502).json({ error: e.message });
  }
});

module.exports = router;
