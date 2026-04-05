#!/usr/bin/env python3
"""
scrape_ghdb.py — Scrape the Google Hacking Database from exploit-db.com
Saves all entries to scripts/ghdb.json which the Node backend imports.

Usage:
    python scripts/scrape_ghdb.py

Requirements:
    pip install requests
"""

import requests
import json
import time
import sys
import os
from pathlib import Path
from urllib.parse import unquote

# ── Config ────────────────────────────────────────────────────────────────────
PAGE_URL   = 'https://www.exploit-db.com/google-hacking-database'
BATCH_SIZE = 200
DELAY_S    = 0.5      # seconds between requests — be polite
OUTPUT     = Path(__file__).parent / 'ghdb.json'

BROWSER_HEADERS = {
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection':      'keep-alive',
}

XHR_HEADERS = {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept':           'application/json, text/javascript, */*; q=0.01',
    'Referer':          PAGE_URL,
}


# ── Session setup ─────────────────────────────────────────────────────────────
def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(BROWSER_HEADERS)

    print('[*] Warming session (fetching main page for cookies)...')
    r = s.get(PAGE_URL, timeout=30)
    r.raise_for_status()

    # requests.Session auto-stores cookies; extract XSRF for the header
    xsrf_encoded = s.cookies.get('XSRF-TOKEN', '')
    if xsrf_encoded:
        xsrf_decoded = unquote(xsrf_encoded)
        s.headers['X-XSRF-TOKEN'] = xsrf_decoded
        print(f'[*] XSRF token obtained ({len(xsrf_decoded)} chars)')
    else:
        print('[!] Warning: no XSRF-TOKEN cookie found')

    return s


# ── Fetch one DataTables page ─────────────────────────────────────────────────
def fetch_page(session: requests.Session, start: int, length: int) -> dict:
    params = {
        'draw':               str(start // length + 1),
        'columns[0][data]':   'id',
        'columns[1][data]':   'date_published',
        'columns[2][data]':   'ghdb_dork',
        'columns[3][data]':   'category.cat_title',
        'columns[4][data]':   'author.name',
        'order[0][column]':   '1',
        'order[0][dir]':      'desc',
        'start':              str(start),
        'length':             str(length),
        'search[value]':      '',
        'search[regex]':      'false',
    }

    r = session.get(PAGE_URL, params=params, headers=XHR_HEADERS, timeout=30)

    if r.status_code != 200:
        raise RuntimeError(f'HTTP {r.status_code}: {r.text[:300]}')

    ct = r.headers.get('content-type', '')
    if 'json' not in ct:
        raise RuntimeError(
            f'Non-JSON response ({ct}). '
            f'exploit-db may be blocking automated requests.\n'
            f'Body snippet: {r.text[:300]}'
        )

    return r.json()


import re as _re

# ── Strip HTML tags from a string ─────────────────────────────────────────────
def strip_html(text: str) -> str:
    # Extract inner text from <a href="...">DORK TEXT</a>
    m = _re.search(r'>([^<]+)</', text)
    if m:
        return m.group(1).strip()
    # Fallback: strip all tags
    return _re.sub(r'<[^>]+>', '', text).strip()


# ── Parse one row ─────────────────────────────────────────────────────────────
# Actual field names from exploit-db API:
#   id, date, url_title (HTML anchor containing dork text), cat_id, author_id, author, category
def parse_row(row: dict) -> dict:
    cat  = row.get('category', {})
    auth = row.get('author', {})

    # Dork is embedded in an <a> tag inside url_title
    raw_title = row.get('url_title') or ''
    dork = strip_html(raw_title) if raw_title else ''

    return {
        'ghdbId':    str(row.get('id', '')),
        'dork':      dork,
        'category':  (cat.get('cat_title') if isinstance(cat, dict) else str(cat)) or 'Uncategorized',
        'author':    (auth.get('name') if isinstance(auth, dict) else str(auth)) or 'Unknown',
        'dateAdded': (row.get('date') or row.get('date_published') or '')[:10],
    }


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print('=' * 60)
    print('  Google Hacking Database Scraper')
    print('  Source: exploit-db.com/google-hacking-database')
    print('=' * 60)

    session = make_session()

    # ── Step 1: Get total count ───────────────────────────────────────────────
    print('\n[*] Fetching first page to determine total record count...')
    try:
        first = fetch_page(session, 0, 1)
    except RuntimeError as e:
        print(f'\n[!] Failed to fetch first page:\n    {e}')
        sys.exit(1)

    total = first.get('recordsTotal', 0)
    if not total:
        print('[!] recordsTotal is 0 — unexpected response:')
        print(json.dumps(first, indent=2)[:500])
        sys.exit(1)

    print(f'[+] Total entries reported by exploit-db: {total}')


    # ── Step 2: Paginate through all records ──────────────────────────────────
    all_entries = []
    start       = 0
    errors      = 0
    MAX_ERRORS  = 5

    while start < total:
        end_marker = min(start + BATCH_SIZE, total)
        percent    = (start / total * 100) if total else 0
        print(f'[*] Fetching entries {start+1}–{end_marker} / {total}  ({percent:.1f}%)', end='\r', flush=True)

        try:
            page = fetch_page(session, start, BATCH_SIZE)
        except RuntimeError as e:
            errors += 1
            print(f'\n[!] Batch error at start={start}: {e}')
            if errors >= MAX_ERRORS:
                print(f'[!] Too many errors ({MAX_ERRORS}), aborting.')
                break
            time.sleep(2)
            continue

        rows = page.get('data', [])
        if not rows:
            print(f'\n[!] Empty data at start={start}, stopping.')
            break

        for row in rows:
            entry = parse_row(row)
            if entry['dork']:
                all_entries.append(entry)

        start  += BATCH_SIZE
        errors  = 0
        time.sleep(DELAY_S)

    print()  # newline after \r progress

    if not all_entries:
        print('\n[!] No entries collected.')
        sys.exit(1)

    # ── Step 3: Save to JSON ──────────────────────────────────────────────────
    print(f'\n[+] Collected {len(all_entries)} dorks')
    print(f'[*] Saving to {OUTPUT}...')

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(all_entries, f, indent=2, ensure_ascii=False)

    size_kb = OUTPUT.stat().st_size / 1024
    print(f'[+] Done — {OUTPUT.name}  ({size_kb:.1f} KB)')
    print()
    print('Next step: click "Import from File" in the app, or run:')
    print('  POST http://localhost:5000/api/ghdb/import')
    print()


if __name__ == '__main__':
    main()
