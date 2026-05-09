# Red Team Operations Center

A platform that helps red team operators build structure, planning, and execution workflows for continuous campaign preparedness and mission excellence.

---

## Quick Start

**Prerequisites:**
- Node.js 18+
- MongoDB running locally on port `27017`
- Docker Desktop (only for the pillaging / scanning features)

**Install:**
```bash
# Frontend deps
npm install

# Backend deps
cd server && npm install && cd ..
```

**Run (two terminals):**

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
npm start
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:5000`.

---

## Environment Variables

The project uses two `.env` files — one at the repo root for the React dev server, and one in `server/` for the backend. Both are gitignored. Create them from the templates below.

### `.env` (root, next to `package.json`)

Only one variable is needed — it disables the strict host check that webpack-dev-server in `react-scripts 5.0.1` enforces by default. Without it, `npm start` fails with `options.allowedHosts[0] should be a non-empty string`.

```env
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

### `server/.env`

All backend config is loaded from `server/.env`. Copy the template below and fill in the values you need — most variables have sensible defaults, and OAuth / external API keys are optional (the corresponding features just turn off if absent).

```env
# ── Core ────────────────────────────────────────────────────────────────────
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rt-ops-center
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRES_IN=7d

# ── URLs ────────────────────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# ── Session (only used for the OAuth redirect dance) ────────────────────────
SESSION_SECRET=change_this_to_a_random_string

# ── Google OAuth (optional) — https://console.cloud.google.com/ ─────────────
# Leave commented to disable Google sign-in
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# ── GitHub OAuth (optional) — https://github.com/settings/developers ────────
# Leave commented to disable GitHub sign-in
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=

# ── External API keys (optional, per-feature) ───────────────────────────────
# Intel X — used by the Emails Harvester
# https://intelx.io/account?tab=developer
# INTELX_API_KEY=

# Have I Been Pwned — used by Email Leaks
# https://haveibeenpwned.com/API/Key
# HIBP_API_KEY=

# VirusTotal — used by Malware Scanner
# https://www.virustotal.com/gui/my-apikey
# VT_API_KEY=

# Chrome / Chromium executable path — used by White Team comms screenshotting
# Leave unset to use the bundled puppeteer Chromium
# CHROME_PATH=
```

### Variable reference

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `5000` | Backend HTTP port |
| `MONGODB_URI` | **Yes** | — | Mongo connection string |
| `JWT_SECRET` | **Yes** | — | Signs auth + portal JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | JWT lifetime |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS origin + OAuth redirect base |
| `BACKEND_URL` | No | `http://localhost:5000` | Used to build OAuth callback URLs |
| `SESSION_SECRET` | No | `redteam-session-secret` | Express-session secret (OAuth only) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | — | Enables Google OAuth sign-in |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | No | — | Enables GitHub OAuth sign-in |
| `INTELX_API_KEY` | No | — | Powers the Emails Harvester searches |
| `HIBP_API_KEY` | No | — | Powers the Email Leaks lookup |
| `VT_API_KEY` | No | — | Powers the Malware Scanner |
| `CHROME_PATH` | No | bundled Chromium | Override for puppeteer's Chrome binary |

---

## Tech Stack

- **Frontend:** React 18, Chakra UI v2, framer-motion, react-router-dom, react-icons
- **Backend:** Node.js + Express, Mongoose, Passport (Google + GitHub strategies), JWT auth, express-session, bcryptjs
- **DB:** MongoDB
- **External tooling:** Docker (subfinder, httpx, gowitness, rustscan), VirusTotal, HIBP, Intel X

---

## Public Site

The marketing surface is intentionally minimal. The top navigation has four entries:

| Item | Path | Purpose |
|---|---|---|
| OPERATORS | `/operators` | Team roster |
| PRICING | `/pricing` | Pricing tiers |
| SIGN IN | `/signin` | Operator login |
| REGISTER | `/register` | New operator registration |

Visiting `/` redirects authenticated operators to `/dashboard` and unauthenticated visitors to `/signin`.

---

## Platform Screenshots

### Landing Page
![Landing Page](docs/screenshots/01-landing.png)

### Operations Dashboard
![Dashboard](docs/screenshots/02-dashboard.png)

### Cheatsheet — Payload & Evasion Map
![Cheatsheet](docs/screenshots/04-cheatsheet.png)

### Lab Configs
![Lab Configs](docs/screenshots/05-lab-configs.png)

### CVE Feed
![CVE Feed](docs/screenshots/06-cve-feed.png)

### Email Leaks
![Email Leaks](docs/screenshots/07-email-leaks.png)

---

## Dashboard

### Layout

The dashboard uses a persistent full-screen layout with a fixed left sidebar and a scrollable content area:

```
┌─────────────┬──────────────────────────────────────────┐
│             │  TopBar (search · bell · @callsign)       │
│   Sidebar   ├──────────────────────────────────────────┤
│             │                                          │
│  CHEATSHEET │           Active View                    │
│  RED LAB    │    (DashboardView / EngagementView)      │
│  RESOURCES  │                                          │
│  MALWARE    │                                          │
│  DIAGRAMS   │                                          │
│  ─────────  │                                          │
│  [per-eng]  │                                          │
│             │                                          │
│  Settings   │                                          │
│  Sign Out   │                                          │
└─────────────┴──────────────────────────────────────────┘
```

A global Command Palette is also mounted (Ctrl/Cmd + K) for fast nav across every section.

### Sidebar Navigation

**Global sections (always visible):**

| Section | Items |
|---|---|
| *(top)* | Dashboard, Engagements |
| **CHEATSHEET** | Red Team Ops Map, AD Attack Map, Payload & Evasion Map |
| **RED LAB** | Lab Configs |
| **RESOURCES & MATERIALS** | Tools, CVE Feed, Ransom Feed, Email Leaks, LOLBIN / LOLBAS, Google Dorking |
| **MALWARE ANALYSIS** | Scanner |
| **DIAGRAM DRAWING** | Editor, My Diagrams |

**Per-engagement sections (shown when inside an engagement):**

| Section | Items |
|---|---|
| **OPERATIONS** | Activity Log, Calendar, Skill Requests, TTX Planner, Team Vault, Operator Sessions, Attack Relay Board, Engagement Bingo, Tasks Planner, Assumed Breach |
| **TEAM** | People & Skills, Resources |
| **INTELLIGENCE** | Loot Tracker, Evidence Vault, Cleanup Tracker, Reverse Shells, CVE Research Board, Service Catalog |
| **INFRASTRUCTURE** | C2 Infrastructure, Phishing Infrastructure, Device Code Phishing, Pass-the-Cookie, Evil OAuth Generator, MFA Push Fatigue, AD Grapher |
| **BUILDERS** | Username Generator, Typosquat Generator, QR Code Generator, Wordlist Generator, Redirector Chain, Card Generation, Fake Teams Message |
| **SOCK PUPPETS** | Personas, Social Media |
| **TTPs** | Initial Access, Windows, Linux, Active Directory, Network |
| **PILLAGING** | Domain Recon, Subdomains, Network Scanning, Webserver Enum, Domain Flyover, JWT Studio, Leaks & Credentials, Kerberos Tickets, Documents, File Metadata |
| **BLOODHOUND** | Analyzer, Cypher Library |
| **OSINT** | Emails Harvester, Org Chart Mapper |
| **COMMS** | White Team, Webhook Alerter |
| **REPORTING** | Reports, Findings, Client Portal |

### TopBar

- **Search** — operations search (left)
- **Bell** — notifications popover with the last activity entries (red dot indicator when there are unread events)
- **@callsign chip** — operator callsign + avatar initial; clicking opens the profile modal

### Dashboard Overview (`/dashboard`)

**Stat cards:** Active Engagements · Team Members · Total Findings · Active Beacons.

**Active Engagements panel** — paginated cards (3 at a time) showing operation name, scope, dates, operators, current phase, status badge, severity badges, and an overall progress bar.

**Findings Breakdown** — bar chart by severity (Critical / High / Medium / Low) with total count.

**Resource Utilization** — top-5 resources by usage ratio.

**Recent Activity feed** — timestamped events with colored type indicators.

**Team Skill Coverage** — skill bars with green ≥ 80%, yellow ≥ 65%, orange < 65% thresholds.

---

## Feature Catalog

### Operations

- **Activity Log** — chronological timeline of every engagement event (findings, milestones, manual entries) with type filtering and a free-text search.
- **Calendar** — operation calendar showing engagement dates, deadlines, and scheduled events.
- **Skill Requests** — log skill gaps the team hits during an engagement, assign who needs to learn them, track Open → Learning → Resolved status.
- **TTX Planner** — break the engagement into phases (Recon, Initial Access, Lateral Movement, …), assign operators, drag to reorder, track per-phase progress.
- **Team Vault** — shared engagement-scoped credential vault for team members.
- **Operator Sessions** — track who is currently on-shift, hand-off notes, and active operator presence.
- **Attack Relay Board** — kanban-style board for active attack chains, current step, and next moves.
- **Engagement Bingo** — gamified objective board with bingo-style tile completion for the team.
- **Tasks Planner** — engagement to-do list with assignees, priorities, and due dates.
- **Assumed Breach** — record the assumed access level and starting credentials/tokens for assumed-breach engagements.

### Team

- **People & Skills** — operator roster with skill assignments and proficiency levels.
- **Resources** — track tools, accounts, hardware, and other resources allocated to the engagement.

### Intelligence

- **Loot Tracker** — captured creds, tokens, files, and trophies with source / context fields.
- **Evidence Vault** — long-term evidence storage tagged by finding.
- **Cleanup Tracker** — outstanding cleanup actions (artifacts to remove, accounts to disable) with status.
- **Reverse Shells** — generator for shell payloads across protocols, encodings, and target shells.
- **CVE Research Board** — engagement-relevant CVEs with auto-populated CVSS data, exploitation status, and finding linkage.
- **Service Catalog** — catalog of internal services discovered during the engagement, with risk and exposure metadata.

### Infrastructure

- **C2 Infrastructure** — manage C2 droplets, DNS, redirectors, and listener config per engagement.
- **Phishing Infrastructure** — phishing campaigns, sender domains, lures, and click-through tracking.
- **Device Code Phishing** — automate the OAuth 2.0 Device Authorization Grant flow against Microsoft 365: generate a `user_code` from `https://login.microsoftonline.com/common/oauth2/v2.0/devicecode`, deliver the lure, poll for completion, store tokens in the local Token Vault, and run pre-built Microsoft Graph queries against captured tokens.
- **Pass-the-Cookie** — paste raw cookie strings (XSS output, infostealer logs, MITM captures), categorize by target app (Microsoft 365, Google Workspace, GitHub, AWS, Okta, custom), and replay sessions in a new tab to bypass MFA.
- **Evil OAuth Generator** — consent phishing for Azure AD: pick from 12 Microsoft app presets (Teams Meeting Add-in, SharePoint Site Sync, OneDrive Backup Agent, …) or build a custom one, generate an OAuth 2.0 authorization-code URL, capture callbacks server-side, auto-exchange `code` for tokens, and push them into the Token Vault. Tabs: App Builder · Phishing Lures · Capture Tracker · Reference.
- **MFA Push Fatigue** — track MFA push-bombing campaigns, configure timing/frequency/target, log victim responses.
- **AD Grapher** — visual Active Directory relationship mapping with attack-path highlighting, BloodHound-compatible.

### Builders

- **Username Generator** — permutations from first/last name and patterns.
- **Typosquat Generator** — typosquat candidates for phishing or campaign infrastructure.
- **QR Code Generator** — generate QR codes for arbitrary payloads or URLs.
- **Wordlist Generator** — custom wordlist builder for password-spray / brute-force.
- **Redirector Chain** — design multi-hop redirect chains (HTTP 301/302, meta-refresh, JS) and export config.
- **Card Generation** — fake employee badges / visitor passes / ID cards for physical engagements.
- **Fake Teams Message** — render convincing Teams message screenshots (light/dark, custom sender, avatar, timestamp) as PNG.

### Sock Puppets

- **Personas** — manage operator personas (background, accounts, contact info) used across social-engineering ops.
- **Social Media** — track social-media presence per persona.

### TTPs

Per-engagement MITRE ATT&CK technique tracking across five categories: Initial Access · Windows · Linux · Active Directory · Network. Each entry stores ATT&CK ID, title, status (Planned / In Progress / Success / Failed / Detected), narrative, timeline, and evidence links.

### Pillaging

- **Domain Recon** — DNS records (A/MX/TXT/NS/CNAME), WHOIS, mail-security posture (SPF / DKIM / DMARC).
- **Subdomain Enumeration** — passive + active discovery via `projectdiscovery/subfinder` (Docker). Live streaming, deduped, JSON export.
- **Network Scanning** — fast port/service scan via `rustscan/rustscan` (Docker). Configurable ports, live terminal output, history per engagement.
- **Webserver Enumeration** — HTTP/HTTPS probing via `projectdiscovery/httpx` (Docker). Status codes, page titles, technology fingerprints, drag-and-drop bulk import, status-range filters, `.txt` export.
- **Domain Flyover** — visual screenshot capture via `leonjza/gowitness` (Docker). Lightbox grid, redirect chains, status-range filters, `https://` auto-prefix.
- **JWT Studio** — decode, inspect, edit, sign, and forge JWTs. Tamper claims, switch algorithms, run alg=none + key-confusion checks.
- **Leaks & Credentials** — combined unified view for breach data and harvested credentials, with per-engagement isolation.
- **Kerberos Tickets** — log captured TGTs, service tickets, AS-REPs (Silver / Golden / Diamond), tracking SPN, encryption type, and cracking status.
- **Documents** — track documents discovered or exfiltrated with classification, source path, sensitivity, and finding links.
- **File Metadata** — extract metadata from Office docs / PDFs / images (author, organization, GPS, software version, revision history) for OSINT and target profiling.

### BloodHound

- **Analyzer** — upload BloodHound ZIP/JSON exports and run pre-built or custom Cypher queries against the dataset.
- **Cypher Library** — searchable, categorized Cypher query library (Shortest Paths, Kerberos, ACL Abuse, Group Membership, GPO, …).

### OSINT

- **Emails Harvester** — Intel X-backed email enumeration for a target domain plus manual entries.
- **Org Chart Mapper** — build visual organizational charts from OSINT-gathered employee data.

### Comms

- **White Team** — log white-team contacts, de-confliction requests, approvals, and stop/start authorizations.
- **Webhook Alerter** — fire real-time alerts to Slack / Teams / Discord / custom webhooks on engagement events.

### Reporting

- **Reports** — engagement reports with Type (Pentest, Red Team, Purple Team, Assumed Breach, Social Engineering), Status (Draft / In Review / Finalized / Delivered), and Classification (TLP:WHITE / GREEN / AMBER / RED). Sections: Executive Summary, Methodology, Attack Narrative, Recommendations.
- **Findings** — engagement findings with severity, status, evidence links, and detail view for editing.
- **Client Portal** — read-only view that clients can access via tenant-scoped JWT to track progress.

### Cheatsheet

- **Red Team Ops Map** — high-level red-team operations reference map.
- **AD Attack Map** — Active Directory attack-path reference.
- **Payload & Evasion Map** — payload generation and EDR-evasion reference.

### Red Lab

- **Lab Configs** — Ludus template cards with one-click deploy modal for spinning up engagement-scoped lab environments.

### Resources & Materials

- **Tools** — curated red team tools reference.
- **CVE Feed** — live CVE feed with by-ID search and severity filtering.
- **Ransom Feed** — ransomware group activity feed.
- **Email Leaks** — HIBP-backed breach lookup for emails / domains.
- **LOLBIN / LOLBAS** — searchable encyclopedia of Living-Off-the-Land Binaries and Scripts. Filter by OS / category, MITRE ATT&CK mapping, copy-to-clipboard examples.
- **Google Dorking** — categorized Google dork library (files, login pages, cameras, configs, …) with one-click copy.

### Malware Analysis

- **Scanner** — VirusTotal-backed scanner for files / URLs / hashes / IPs.

### Diagram Drawing

- **Editor** — embedded draw.io editor with save-to-DB.
- **My Diagrams** — grid of saved diagrams owned by the operator.

---

## Dashboard Routes

All routes under `/dashboard/*` are protected — unauthenticated users are redirected to `/signin`.

### Global routes

| Path | View |
|---|---|
| `/dashboard` | Operations Overview |
| `/dashboard/engagements` | Engagements list |
| `/dashboard/settings` | Settings |
| `/dashboard/cheatsheet/red-team-map` | Red Team Ops Map |
| `/dashboard/cheatsheet/ad-map` | AD Attack Map |
| `/dashboard/cheatsheet/payload-map` | Payload & Evasion Map |
| `/dashboard/lab/configs` | Lab Configs |
| `/dashboard/resources/tools` | Tools |
| `/dashboard/resources/cve-feed` | CVE Feed |
| `/dashboard/resources/ransom-feed` | Ransom Feed |
| `/dashboard/resources/email-leaks` | Email Leaks (HIBP) |
| `/dashboard/resources/lolbins` | LOLBIN / LOLBAS |
| `/dashboard/resources/google-dorking` | Google Dorking |
| `/dashboard/malware/scanner` | Malware Scanner |
| `/dashboard/diagrams/editor` | Diagram Editor |
| `/dashboard/diagrams/library` | My Diagrams |

### Per-engagement routes (under `/dashboard/:slug/*`)

| Path | View |
|---|---|
| `/:slug` | Engagement Detail |
| `/:slug/operations/activity` | Activity Log |
| `/:slug/operations/calendar` | Calendar |
| `/:slug/operations/skill-requests` | Skill Requests |
| `/:slug/operations/ttx` | TTX Planner |
| `/:slug/operations/team-vault` | Team Vault |
| `/:slug/operations/sessions` | Operator Sessions |
| `/:slug/operations/attack-relay` | Attack Relay Board |
| `/:slug/operations/bingo` | Engagement Bingo |
| `/:slug/operations/tasks` | Tasks Planner |
| `/:slug/operations/assumed-breach` | Assumed Breach |
| `/:slug/team/people` | People & Skills |
| `/:slug/team/resources` | Resources |
| `/:slug/intelligence/loot-tracker` | Loot Tracker |
| `/:slug/intelligence/evidence-vault` | Evidence Vault |
| `/:slug/intelligence/cleanup-tracker` | Cleanup Tracker |
| `/:slug/intelligence/reverse-shells` | Reverse Shells |
| `/:slug/intelligence/cve-research` | CVE Research Board |
| `/:slug/intelligence/service-catalog` | Service Catalog |
| `/:slug/intelligence/c2` | C2 Infrastructure |
| `/:slug/intelligence/phishing` | Phishing Infrastructure |
| `/:slug/intelligence/device-code-phishing` | Device Code Phishing |
| `/:slug/intelligence/device-code-phishing/:category/:querySlug` | Graph Result |
| `/:slug/intelligence/pass-cookie` | Pass-the-Cookie |
| `/:slug/intelligence/evil-oauth` | Evil OAuth Generator |
| `/:slug/intelligence/mfa-push` | MFA Push Fatigue |
| `/:slug/intelligence/ad-grapher` | AD Grapher |
| `/:slug/builders/username-gen` | Username Generator |
| `/:slug/builders/typosquat` | Typosquat Generator |
| `/:slug/builders/qr-codes` | QR Code Generator |
| `/:slug/builders/wordlist-gen` | Wordlist Generator |
| `/:slug/builders/redirector-chain` | Redirector Chain |
| `/:slug/builders/card-generation` | Card Generation |
| `/:slug/builders/fake-teams` | Fake Teams Message |
| `/:slug/sockpuppets/personas` | Personas |
| `/:slug/sockpuppets/social-media` | Social Media |
| `/:slug/ttps/:category` | TTPs list (initial-access / windows / linux / active-directory / network) |
| `/:slug/ttps/:category/:ttpId` | TTP Detail |
| `/:slug/pillaging/domain-recon` | Domain Recon |
| `/:slug/pillaging/subdomains` | Subdomain Enumeration |
| `/:slug/pillaging/services` | Network Scanning |
| `/:slug/pillaging/webserver-enum` | Webserver Enumeration |
| `/:slug/pillaging/domain-flyover` | Domain Flyover |
| `/:slug/pillaging/jwt-studio` | JWT Studio |
| `/:slug/pillaging/credentials` | Leaks & Credentials |
| `/:slug/pillaging/kerberos` | Kerberos Tickets |
| `/:slug/pillaging/documents` | Documents |
| `/:slug/pillaging/file-meta` | File Metadata |
| `/:slug/bloodhound/analyzer` | BloodHound Analyzer |
| `/:slug/bloodhound/cypher-library` | Cypher Library |
| `/:slug/osint/emails` | Emails Harvester |
| `/:slug/osint/org-chart` | Org Chart Mapper |
| `/:slug/comms/white-team` | White Team |
| `/:slug/comms/webhook-alerter` | Webhook Alerter |
| `/:slug/reporting/reports` | Reports |
| `/:slug/reporting/findings` | Findings |
| `/:slug/reporting/findings/:findingId` | Finding Detail |
| `/:slug/reporting/client-portal` | Client Portal |

---

## Docker Requirements

Several pillaging features run as Docker containers. Make sure Docker Desktop is running before using them.

| Feature | Image | Pull |
|---|---|---|
| Subdomain Enumeration | `projectdiscovery/subfinder` | `docker pull projectdiscovery/subfinder` |
| Webserver Enumeration | `projectdiscovery/httpx` | `docker pull projectdiscovery/httpx` |
| Domain Flyover | `leonjza/gowitness` | `docker pull leonjza/gowitness` |
| Network Scanning | `rustscan/rustscan` | `docker pull rustscan/rustscan` |

> On Windows, ensure `C:\Users\<you>\AppData\Local\Temp` is shared with Docker Desktop (Settings → Resources → File Sharing).

---

## Project Structure

```
red-team-operations-center/
├── docs/                               # Screenshots & documentation assets
├── server/                             # Node.js + Express backend
│   ├── index.js                        # CORS, session, passport, route mounts
│   ├── .env                            # Environment variables (gitignored)
│   ├── config/
│   │   ├── db.js                       # Mongoose connection
│   │   └── passport.js                 # Google + GitHub OAuth strategies (conditional)
│   ├── models/                         # Mongoose schemas (User, Engagement, Diagram, …)
│   ├── controllers/                    # Per-feature business logic
│   ├── routes/                         # Express route mounts (/api/*)
│   ├── middleware/
│   │   ├── validate.js                 # express-validator rules
│   │   └── authMiddleware.js           # JWT verification (protect)
│   └── utils/
│       └── token.js                    # JWT signing / verification helpers
│
└── src/                                # React frontend
    ├── App.js                          # ChakraProvider + AnimatePresence + Routes
    ├── theme.js                        # Chakra UI dark theme
    ├── index.js                        # React DOM entry
    ├── styles/
    │   └── cardStyles.js
    ├── contexts/
    │   ├── AuthContext.js              # Auth — login, register, 2FA, OAuth, JWT
    │   ├── SettingsContext.js          # User preferences
    │   └── EngagementContext.js        # Engagement state + dashboard stats
    └── components/
        ├── common/
        │   ├── Navigation.js           # Public top nav (Operators, Pricing, Sign In, Register)
        │   ├── PageLayout.js           # Public-page wrapper
        │   └── SparkleQuote.js
        ├── auth/
        │   ├── AuthForm.js             # Sign in / Register form + OAuth buttons
        │   └── OAuthCallback.js
        ├── pages/                      # Public marketing pages
        │   ├── LandingLayout.js
        │   ├── LandingHero.js
        │   ├── Operators.js
        │   ├── Pricing.js
        │   └── …
        ├── portal/
        │   └── ClientPortal.js         # Tenant-scoped client portal
        └── dashboard/                  # See Dashboard Views below
```

### Dashboard views

```
src/components/dashboard/
├── DashboardLayout.js                  # Sidebar + topbar + nested routes
├── EngagementLayout.js                 # Per-engagement route wrapper
├── Sidebar.js                          # Left nav — global + per-engagement sections
├── TopBar.js                           # Search + notifications + @callsign chip
├── CommandPalette.js                   # Global Ctrl/Cmd + K nav
├── DeleteConfirmModal.js               # Themed delete confirmation
├── ProfileModal.js                     # Operator profile modal
└── views/
    ├── DashboardView.js                # Operations Overview
    ├── PlaceholderView.js              # Reusable empty/placeholder view
    ├── EngagementsView.js              # Engagements list + create
    ├── EngagementDetailView.js         # Single engagement overview
    ├── SettingsView.js                 # User settings
    │
    ├── RedTeamMapView.js               # Cheatsheet — Red Team Ops Map
    ├── ADAttackMapView.js              # Cheatsheet — AD Attack Map
    ├── PayloadMapView.js               # Cheatsheet — Payload & Evasion Map
    │
    ├── LabConfigsView.js               # Red Lab — Ludus templates
    │
    ├── CVEFeedView.js                  # Resources — CVE feed
    ├── RansomFeedView.js               # Resources — ransom group feed
    ├── EmailLeaksView.js               # Resources — HIBP lookup
    ├── LolbinView.js                   # Resources — LOLBIN/LOLBAS reference
    ├── GoogleDorkingView.js            # Resources — Google dork library
    ├── ToolsView.js                    # Resources — tools reference
    │
    ├── MalwareScannerView.js           # Malware — VirusTotal scanner
    │
    ├── DiagramEditorView.js            # Diagrams — draw.io embed
    ├── DiagramLibraryView.js           # Diagrams — saved diagrams grid
    │
    ├── ActivityView.js                 # Operations — activity log
    ├── CalendarView.js                 # Operations — engagement calendar
    ├── SkillRequestsView.js            # Operations — skill requests
    ├── TTXPlannerView.js               # Operations — TTX planner
    ├── TeamVaultView.js                # Operations — team vault
    ├── OperatorSessionsView.js         # Operations — operator sessions
    ├── AttackRelayView.js              # Operations — attack relay board
    ├── BingoView.js                    # Operations — engagement bingo
    ├── TasksPlannerView.js             # Operations — tasks planner
    ├── AssumedBreachView.js            # Operations — assumed breach
    │
    ├── PeopleSkillsView.js             # Team — people & skills
    ├── ResourcesView.js                # Team — resources
    │
    ├── LootTrackerView.js              # Intelligence — loot tracker
    ├── EvidenceVaultView.js            # Intelligence — evidence vault
    ├── CleanupTrackerView.js           # Intelligence — cleanup tracker
    ├── ReverseShellView.js             # Intelligence — reverse shells
    ├── CVEResearchView.js              # Intelligence — CVE research board
    ├── ServiceCatalogView.js           # Intelligence — service catalog
    │
    ├── C2View.js                       # Infrastructure — C2
    ├── PhishingView.js                 # Infrastructure — phishing
    ├── DeviceCodePhishingView.js       # Infrastructure — device code phishing
    ├── graphEnumCatalog.js             # Infrastructure — Graph API catalog
    ├── GraphResultView.js              # Infrastructure — Graph results
    ├── PassCookieView.js               # Infrastructure — pass-the-cookie
    ├── EvilOAuthView.js                # Infrastructure — Evil OAuth
    ├── MfaPushView.js                  # Infrastructure — MFA push
    ├── ADGrapherView.js                # Infrastructure — AD grapher
    │
    ├── UsernameGeneratorView.js        # Builders — username generator
    ├── TyposquatView.js                # Builders — typosquat generator
    ├── QRCodeView.js                   # Builders — QR codes
    ├── WordlistView.js                 # Builders — wordlist
    ├── RedirectorChainView.js          # Builders — redirector chain
    ├── CardGenerationView.js           # Builders — fake badges/IDs
    ├── FakeTeamsView.js                # Builders — fake Teams message
    │
    ├── PersonasView.js                 # Sock Puppets — personas
    ├── SocialMediaView.js              # Sock Puppets — social media
    │
    ├── TTPsView.js                     # TTPs — list per category
    ├── TTPDetailView.js                # TTPs — single technique detail
    │
    ├── DomainReconView.js              # Pillaging — domain recon
    ├── SubdomainsView.js               # Pillaging — subdomains
    ├── NetworkScannerView.js           # Pillaging — port scanner
    ├── WebserverEnumView.js            # Pillaging — HTTP probing
    ├── DomainFlyoverView.js            # Pillaging — screenshots
    ├── JWTStudioView.js                # Pillaging — JWT studio
    ├── LeaksCredentialsView.js         # Pillaging — leaks & credentials
    ├── KerberosView.js                 # Pillaging — Kerberos tickets
    ├── DocumentsView.js                # Pillaging — documents
    ├── FileMetaView.js                 # Pillaging — file metadata
    │
    ├── BloodHoundView.js               # BloodHound — analyzer
    ├── CypherLibraryView.js            # BloodHound — Cypher library
    │
    ├── EmailsView.js                   # OSINT — emails harvester
    ├── OrgChartView.js                 # OSINT — org chart mapper
    │
    ├── WhiteTeamView.js                # Comms — white team
    ├── WebhookAlerterView.js           # Comms — webhook alerter
    │
    ├── ReportsView.js                  # Reporting — reports
    ├── FindingsView.js                 # Reporting — findings list
    ├── FindingDetailView.js            # Reporting — finding detail
    ├── ClientPortalView.js             # Reporting — client portal
    └── LeakIXView.js                   # Reporting / Resources — LeakIX proxy view
```

### Dashboard widgets

```
src/components/dashboard/widgets/
├── StatCard.js                         # Colored-accent stat card
├── EngagementCard.js                   # Operation card with progress + findings
├── ActiveEngagements.js                # Paginated panel of EngagementCards
├── FindingsBreakdown.js                # Severity bar chart + total
├── ResourceUtilization.js              # Top-5 resource usage bars
├── RecentActivity.js                   # Activity feed with type indicators
└── TeamSkillCoverage.js                # Skill coverage bars
```

---

## Auth Flow

- **Email + password** with optional TOTP-based 2FA (`speakeasy` + `qrcode` for QR provisioning).
- **Google OAuth** via Passport (only registered if `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are set).
- **GitHub OAuth** via Passport (only registered if `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` are set).
- **JWT** issued on successful login, stored client-side, sent as `Authorization: Bearer <token>`.
- **Client portal** uses a separate tenant-scoped JWT for read-only client access.

If the OAuth env vars are commented out (the default), the server starts cleanly with both providers disabled — only the email/password and 2FA flows are active.

---

## Notes

- The platform is intended for authorized red team engagements, security research, and CTFs. Use only against systems and identities you own or have explicit written permission to test.
- All persistent data is stored in MongoDB; per-feature local state (token vaults, pass-the-cookie entries, OAuth config drafts) is kept in browser `localStorage` so it survives reloads but is wiped on browser cache clear.
- Several modules talk to live external services (Microsoft Graph, HIBP, VirusTotal, Intel X). Respect each provider's rate limits and ToS.
