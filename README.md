# Red Team Operations Center

A platform that helps red team operators build structure, planning, and execution workflows for continuous campaign preparedness and mission excellence.

---

## Running the App

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
npm start
```

> Make sure MongoDB is running locally on port `27017` before starting the server.

---

## Platform Screenshots

### Landing Page
![Landing Page](docs/screenshots/01-landing.png)

### Operations Dashboard
![Dashboard](docs/screenshots/02-dashboard.png)

### Engagements Center
![Engagements](docs/screenshots/03-engagements.png)

### Cheatsheet — Payload & Evasion Map
![Cheatsheet](docs/screenshots/04-cheatsheet.png)

### Lab Configs
![Lab Configs](docs/screenshots/05-lab-configs.png)

### CVE Feed
![CVE Feed](docs/screenshots/06-cve-feed.png)

### Email Leaks
![Email Leaks](docs/screenshots/07-email-leaks.png)

### Malware Scanner
![Malware Scanner](docs/screenshots/08-malware-scanner.png)

---

## Dashboard

### Layout

The dashboard uses a persistent full-screen layout with a fixed left sidebar and a scrollable content area:

```
┌─────────────┬──────────────────────────────────────────┐
│             │  TopBar (@callsign · search · bell)       │
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

### Sidebar Navigation

**Global sections (always visible):**

| Section | Items |
|---|---|
| *(top)* | Dashboard, Engagements |
| **CHEATSHEET** | Red Team Ops Map, AD Attack Map, Payload & Evasion Map |
| **RED LAB** | Lab Configs, Lab Connectivity |
| **RESOURCES & MATERIALS** | Tools, CVE Feed, Ransom Feed, Email Leaks, LOLBIN / LOLBAS, Domain Cat Checker |
| **MALWARE ANALYSIS** | Scanner, Reports |
| **DIAGRAM DRAWING** | Editor, My Diagrams |

**Per-engagement sections (shown when inside an engagement):**

| Section | Items |
|---|---|
| **OPERATIONS** | Activity Log, Calendar, Skill Requests, TTX Planner, Team Vault, Assumed Breach |
| **TEAM** | People & Skills, Resources |
| **INTELLIGENCE** | Loot Tracker, Evidence Vault, Cleanup Tracker, Reverse Shells |
| **INFRASTRUCTURE** | C2 Infrastructure, Phishing Infrastructure, Device Code Phishing, Pass-the-Cookie, Evil OAuth Generator |
| **BUILDERS** | Username Generator, Typosquat Generator, QR Code Generator, Wordlist Generator |
| **SOCK PUPPETS** | Personas, Social Media |
| **TTPs** | Initial Access, Windows, Linux, Active Directory, Network |
| **PILLAGING** | Domain Recon, Subdomains, Services, Leaks, Credentials, Emails Harvester, Documents, File Metadata |
| **REPORTING** | Reports, Findings, Client Portal |

- Active item is highlighted with a red left border + red tinted background
- Section labels are uppercase in muted gray
- Brand mark "Red Ops Center" with pulsing red dot at top
- Settings + Sign Out always pinned at the bottom

### TopBar

- **Search** — operations search input (left)
- **Bell** — notification icon with red dot indicator (right)
- **@callsign chip** — shows the logged-in operator's callsign with avatar initial (right)

### Dashboard Overview (`/dashboard`)

**Stat Cards (top row):**

| Card | Value | Accent |
|---|---|---|
| Active Engagements | Live count | Red gradient |
| Team Members | Live count | Teal gradient |
| Total Findings | Live count | Orange/yellow gradient |
| Active Beacons | Live count | Green gradient |

**Active Engagements panel** — shows up to 3 cards at a time (fixed 504px height), paginated:
- Operation name + client + scope
- Started / Ends dates · Operators · Current phase
- Overall progress bar (color varies by status)
- Status badge: `IN PROGRESS` · `REPORTING` · `PLANNING` · `COMPLETED`
- Severity badges: `CRITICAL` · `HIGH` · `MED` · `LOW`

**Findings Breakdown panel** — horizontal bars per severity (Critical / High / Medium / Low) + total count

**Resource Utilization panel** — top 5 by usage ratio, progress bars with footer total count

**Recent Activity feed** — timestamped events with colored dot indicators per type

**Team Skill Coverage** — skill bars with color thresholds (green ≥80% · yellow ≥65% · orange <65%)

---

## Key Features

### Device Code Phishing

The Device Code Phishing module (`/intelligence/device-code-phishing`) automates the OAuth 2.0 Device Authorization Grant flow to harvest Microsoft 365 tokens without requiring a redirect URI — ideal for phishing target users over chat, email, or social engineering.

**How it works:**

1. **Generate a device code** — the server calls `https://login.microsoftonline.com/common/oauth2/v2.0/devicecode` and receives a short `user_code` (e.g. `ABC-12345`) and a `device_code`. The user_code is valid for ~15 minutes.

2. **Deliver the lure** — the operator sends the victim a convincing message instructing them to visit `https://microsoft.com/devicelogin` and enter the user_code. This is a legitimate Microsoft page, so it passes browser security checks.

3. **Poll for completion** — the server continuously polls the token endpoint using the `device_code`. Once the victim authenticates and approves the requested scopes, Microsoft returns an access token + refresh token.

4. **Token vault** — captured tokens are stored in localStorage under `dc_tokens` and displayed in the Token Vault tab with the victim's UPN (extracted from the id_token JWT), scopes, and capture time.

5. **Graph enumeration** — the operator can run pre-built Microsoft Graph API queries directly from the tool (user info, mailbox, OneDrive, Teams, SharePoint, conditional access policies, devices, etc.) using the captured token. Results are shown in a dedicated Graph Result view.

**Scopes supported:** The tool ships with pre-built scope sets for Microsoft Graph (`Mail.Read`, `Files.Read`, `User.Read.All`, `Directory.Read.All`, etc.) and Azure management APIs. Custom scopes can be entered manually.

**Backend routes:** `/api/device-code/*` — all protected by JWT.

---

### Evil OAuth App Generator

The Evil OAuth App Generator (`/intelligence/evil-oauth`) is a consent phishing toolkit for Azure AD. It builds convincing Azure App Registration personas, generates consent phishing URLs, and auto-exchanges authorization codes for access tokens — all without ever exposing credentials.

**How it works:**

1. **Build the app** — select one of 12 pre-built Microsoft app presets (Teams Meeting Add-in, SharePoint Site Sync, OneDrive Backup Agent, Entra ID Governance, Power Automate Bridge, etc.) or customize the App Name, Client ID, Tenant ID, and Redirect URI. Each preset comes with recommended high-value scopes.

2. **Generate the consent URL** — the server builds an OAuth 2.0 Authorization Code Flow URL pointing to `https://login.microsoftonline.com/<tenant>/oauth2/v2.0/authorize` with your chosen scopes and a `state` parameter for tracking.

3. **Deliver the lure** — use the Phishing Lures tab to generate ready-made email/Teams message templates referencing your app persona. The victim clicks the URL, is taken to a real Microsoft consent page under your app's name, and approves the requested delegated permissions.

4. **Callback capture** — when the victim approves, Microsoft redirects to your configured callback URI (`/api/evil-oauth/callback`). The server captures the `code` + `state`, returns a convincing Microsoft "Staying signed in?" HTML splash page to avoid suspicion, and stores the capture in memory.

5. **Auto-exchange** — the Capture Tracker tab shows all pending captures. One click triggers a server-side token exchange (`POST /api/evil-oauth/exchange`) using the `authorization_code` grant against the Microsoft token endpoint — never exposing the client secret to the browser.

6. **Token vault integration** — successfully exchanged tokens are pushed directly into the Device Code Phishing Token Vault (`dc_tokens` in localStorage) so Graph enumeration queries can be run against them immediately.

**Important:** You must register an Azure App Registration with `http://localhost:5000/api/evil-oauth/callback` as an allowed redirect URI and set `response_type=code` in the app manifest. The Client Secret is stored server-side only.

**Tabs:**
- **App Builder** — select preset or build custom app + scope picker
- **Phishing Lures** — copy-ready email and Teams message templates
- **Capture Tracker** — live list of pending codes, exchange status, victim UPN
- **Reference** — OAuth 2.0 flow diagram + scope reference table

**Backend routes:** `/api/evil-oauth/*` — callback is public (no auth), all other routes protected.

---

### Pass-the-Cookie Dashboard

The Pass-the-Cookie Dashboard (`/intelligence/pass-cookie`) is a session hijacking toolkit for storing, managing, and replaying captured browser cookies against known SaaS targets.

**How it works:**

1. **Add cookies** — paste raw cookie strings (from XSS output, infostealer logs, MITM captures, or manual browser extraction) into the Add to Vault modal. The parser auto-detects the number of cookies and associates the entry with a target app (Microsoft 365, Google Workspace, GitHub, AWS Console, Okta, or custom).

2. **Vault management** — all entries are stored in localStorage under `ptc_entries`. Each entry shows target app, session label, cookie count, and capture time. Entries can be deleted individually or cleared in bulk.

3. **Replay session** — a "Use Cookies" button opens a new browser tab to the target app's URL. The workflow guides the operator through injecting the cookies via DevTools to hijack the session — bypassing MFA since the cookie already contains an authenticated session.

---

### Reports View

The Reports module (`/reporting/reports`) provides structured engagement report management per operation:

- Create reports with type (Pentest, Red Team, Purple Team, Assumed Breach, Social Engineering), status (Draft, In Review, Finalized, Delivered), and classification (TLP:WHITE, TLP:GREEN, TLP:AMBER, TLP:RED)
- Rich text sections: Executive Summary, Methodology, Attack Narrative, Recommendations
- Track creation date, last updated, and assigned author
- All reports are stored in MongoDB and scoped to the engagement

---

### LOLBIN / LOLBAS Reference

The LOLBIN / LOLBAS reference (`/resources/lolbins`) is a searchable, filterable encyclopedia of Living-Off-the-Land Binaries and Scripts for Windows and Linux.

- Search by binary name, description, or ATT&CK technique ID
- Filter by OS (Windows / Linux / macOS) and category (Execute, Download, Bypass, Lateral Movement, etc.)
- Each entry shows the binary, usage examples, detection notes, and MITRE ATT&CK mapping
- Copy-to-clipboard on all command examples

---

### Domain Category Checker

The Domain Category Checker (`/resources/domain-cat`) lets operators verify whether a newly registered domain has been categorized by web filtering vendors before using it in phishing infrastructure.

- Submit a domain and check its category across multiple reputation sources
- Uncategorized or "Unknown" domains are ideal for phishing C2 since they bypass category-based URL filtering
- Shows content category, risk score, and first/last seen dates

---

### Assumed Breach Simulation

The Assumed Breach view (`/operations/assumed-breach`) tracks the starting conditions and scope for assumed breach engagements:

- Document the assumed access level (workstation user, DA, cloud admin, etc.)
- Track what credentials, certificates, or tokens are in scope from day 1
- Log the narrative starting point for the red team engagement

---

### File Metadata Extractor

The File Metadata view (`/pillaging/file-meta`) extracts and analyzes metadata from uploaded documents:

- Upload Office documents (DOCX, XLSX, PPTX), PDFs, and images
- Extracts author, organization, creation/modification timestamps, GPS coordinates (images), software version, and revision history
- Flags high-value metadata fields useful for OSINT and target profiling

---

### Emails Harvester

The Emails Harvester (`/pillaging/emails`) collects and organizes email addresses found during reconnaissance:

- Add email addresses with associated name, department, and source
- Import bulk email lists from paste format
- Export collected emails for use in phishing campaigns or password spraying

---

### Documents

The Documents view (`/pillaging/documents`) tracks documents discovered or exfiltrated during an engagement:

- Store document metadata: filename, type, source path, classification, and notes
- Tag documents with sensitivity level and relevance to the engagement
- Link documents to findings for evidence trail

---

### Domain Recon

The Domain Recon view (`/pillaging/domain-recon`) aggregates passive reconnaissance data for target domains:

- DNS record enumeration (A, MX, TXT, NS, CNAME)
- WHOIS data including registrar, registration date, and expiry
- Mail security posture: SPF, DKIM, DMARC presence + policy analysis
- Results stored per engagement for reporting

---

### TTPs Tracker

The TTPs module provides per-engagement technique tracking across five MITRE ATT&CK categories: Initial Access, Windows, Linux, Active Directory, and Network.

- Each TTP entry records: technique ID (e.g. T1566.001), title, description, status (Planned / In Progress / Success / Failed / Detected), and notes
- Detailed TTP view shows full narrative, timeline, and evidence links
- Delete with themed confirmation modal (no native browser dialogs)

---

## Dashboard Routes

All routes under `/dashboard/*` are protected — unauthenticated users are redirected to `/signin`.

**Global routes:**

| Path | View | Status |
|---|---|---|
| `/dashboard` | Operations Overview | Built |
| `/dashboard/engagements` | Engagements List | Built |
| `/dashboard/settings` | Settings | Built |
| `/dashboard/cheatsheet/red-team-map` | Red Team Ops Map | Built |
| `/dashboard/cheatsheet/ad-map` | AD Attack Map | Built |
| `/dashboard/cheatsheet/payload-map` | Payload & Evasion Map | Built |
| `/dashboard/lab/configs` | Lab Configs | Built |
| `/dashboard/lab/connectivity` | Lab Connectivity (Twingate) | Built |
| `/dashboard/resources/tools` | Tools | Built |
| `/dashboard/resources/cve-feed` | CVE Feed | Built |
| `/dashboard/resources/ransom-feed` | Ransomware Feed | Built |
| `/dashboard/resources/email-leaks` | Email Leaks (HIBP) | Built |
| `/dashboard/resources/lolbins` | LOLBIN / LOLBAS Reference | Built |
| `/dashboard/resources/domain-cat` | Domain Category Checker | Built |
| `/dashboard/malware/scanner` | Malware Scanner | Built |
| `/dashboard/malware/reports` | Analysis Reports | Placeholder |
| `/dashboard/diagrams/editor` | Diagram Editor (draw.io embed) | Built |
| `/dashboard/diagrams/library` | My Diagrams | Built |

**Per-engagement routes (under `/:slug/*`):**

| Path | View | Status |
|---|---|---|
| `/:slug` | Engagement Detail | Built |
| `/:slug/operations/activity` | Activity Log | Built |
| `/:slug/operations/calendar` | Calendar | Built |
| `/:slug/operations/skill-requests` | Skill Requests | Built |
| `/:slug/operations/ttx` | TTX Planner | Built |
| `/:slug/operations/team-vault` | Team Vault | Built |
| `/:slug/operations/assumed-breach` | Assumed Breach | Built |
| `/:slug/team/people` | People & Skills | Built |
| `/:slug/team/resources` | Resources | Built |
| `/:slug/intelligence/loot-tracker` | Loot Tracker | Built |
| `/:slug/intelligence/evidence-vault` | Evidence Vault | Built |
| `/:slug/intelligence/cleanup-tracker` | Cleanup Tracker | Built |
| `/:slug/intelligence/reverse-shells` | Reverse Shells | Built |
| `/:slug/intelligence/c2` | C2 Infrastructure | Built |
| `/:slug/intelligence/phishing` | Phishing Infrastructure | Built |
| `/:slug/intelligence/device-code-phishing` | Device Code Phishing | Built |
| `/:slug/intelligence/device-code-phishing/:category/:querySlug` | Graph Result | Built |
| `/:slug/intelligence/pass-cookie` | Pass-the-Cookie | Built |
| `/:slug/intelligence/evil-oauth` | Evil OAuth Generator | Built |
| `/:slug/builders/username-gen` | Username Generator | Built |
| `/:slug/builders/typosquat` | Typosquat Generator | Built |
| `/:slug/builders/qr-codes` | QR Code Generator | Built |
| `/:slug/builders/wordlist-gen` | Wordlist Generator | Built |
| `/:slug/sockpuppets/personas` | Personas | Built |
| `/:slug/sockpuppets/social-media` | Social Media | Placeholder |
| `/:slug/ttps/initial-access` | Initial Access TTPs | Built |
| `/:slug/ttps/initial-access/:ttpId` | TTP Detail | Built |
| `/:slug/ttps/windows` | Windows TTPs | Built |
| `/:slug/ttps/windows/:ttpId` | TTP Detail | Built |
| `/:slug/ttps/linux` | Linux TTPs | Built |
| `/:slug/ttps/linux/:ttpId` | TTP Detail | Built |
| `/:slug/ttps/active-directory` | Active Directory TTPs | Built |
| `/:slug/ttps/active-directory/:ttpId` | TTP Detail | Built |
| `/:slug/ttps/network` | Network TTPs | Built |
| `/:slug/ttps/network/:ttpId` | TTP Detail | Built |
| `/:slug/pillaging/domain-recon` | Domain Recon | Built |
| `/:slug/pillaging/subdomains` | Subdomains | Built |
| `/:slug/pillaging/services` | Services | Placeholder |
| `/:slug/pillaging/leaks` | Leaks | Placeholder |
| `/:slug/pillaging/credentials` | Credentials | Placeholder |
| `/:slug/pillaging/emails` | Emails Harvester | Built |
| `/:slug/pillaging/documents` | Documents | Built |
| `/:slug/pillaging/file-meta` | File Metadata | Built |
| `/:slug/reporting/reports` | Reports | Built |
| `/:slug/reporting/findings` | Findings | Built |
| `/:slug/reporting/findings/:findingId` | Finding Detail | Built |
| `/:slug/reporting/client-portal` | Client Portal | Built |

---

## Dashboard File Structure

```
src/components/dashboard/
├── DashboardLayout.js              # Full-screen layout — sidebar + topbar + nested routes
├── EngagementLayout.js             # Per-engagement route wrapper
├── Sidebar.js                      # Left nav — global + per-engagement sections
├── TopBar.js                       # Search + notifications + @callsign chip
├── DeleteConfirmModal.js           # Shared themed delete confirmation modal
├── views/
│   ├── DashboardView.js            # Operations Overview — stat cards + all widgets
│   ├── PlaceholderView.js          # Reusable "under construction" view
│   ├── EngagementsView.js          # Engagements list + create
│   ├── EngagementDetailView.js     # Single engagement overview
│   ├── SettingsView.js             # User settings (profile, password, compact mode)
│   ├── RedTeamMapView.js           # Cheatsheet — Red Team Ops Map
│   ├── ADAttackMapView.js          # Cheatsheet — AD Attack Map
│   ├── PayloadMapView.js           # Cheatsheet — Payload & Evasion Map
│   ├── LabConfigsView.js           # Red Lab — Ludus template cards + deploy modal
│   ├── LabConnectivityView.js      # Red Lab — Twingate VPN walkthrough
│   ├── CVEFeedView.js              # Resources — live CVE feed + CVE ID search
│   ├── RansomFeedView.js           # Resources — ransomware group feed
│   ├── EmailLeaksView.js           # Resources — HIBP breach lookup
│   ├── LolbinView.js               # Resources — LOLBIN/LOLBAS reference
│   ├── DomainCatView.js            # Resources — domain category checker
│   ├── ToolsView.js                # Resources — red team tools reference
│   ├── MalwareScannerView.js       # Malware — VirusTotal scanner
│   ├── DiagramEditorView.js        # Diagrams — draw.io embed with save to DB
│   ├── DiagramLibraryView.js       # Diagrams — grid of saved diagrams
│   ├── ActivityView.js             # Operations — activity log
│   ├── CalendarView.js             # Operations — engagement calendar
│   ├── SkillRequestsView.js        # Operations — skill requests tracker
│   ├── TTXPlannerView.js           # Operations — tabletop exercise planner
│   ├── TeamVaultView.js            # Operations — shared team credential vault
│   ├── AssumedBreachView.js        # Operations — assumed breach starting conditions
│   ├── PeopleSkillsView.js         # Team — operator list + skill assignment
│   ├── ResourcesView.js            # Team — resource tracking
│   ├── LootTrackerView.js          # Intelligence — loot tracker
│   ├── EvidenceVaultView.js        # Intelligence — evidence vault
│   ├── CleanupTrackerView.js       # Intelligence — cleanup tracker
│   ├── ReverseShellView.js         # Intelligence — reverse shell generator
│   ├── C2View.js                   # Infrastructure — C2 infrastructure manager
│   ├── PhishingView.js             # Infrastructure — phishing infrastructure
│   ├── DeviceCodePhishingView.js   # Infrastructure — device code phishing + token vault
│   ├── graphEnumCatalog.js         # Infrastructure — Graph API query catalog
│   ├── GraphResultView.js          # Infrastructure — Graph enumeration results
│   ├── PassCookieView.js           # Infrastructure — pass-the-cookie vault
│   ├── EvilOAuthView.js            # Infrastructure — Evil OAuth consent phishing
│   ├── UsernameGeneratorView.js    # Builders — username permutation generator
│   ├── TyposquatView.js            # Builders — typosquat domain generator
│   ├── QRCodeView.js               # Builders — QR code generator
│   ├── WordlistView.js             # Builders — custom wordlist builder
│   ├── PersonasView.js             # Sock Puppets — persona manager
│   ├── TTPsView.js                 # TTPs — technique list per category
│   ├── TTPDetailView.js            # TTPs — single technique detail + edit
│   ├── DomainReconView.js          # Pillaging — DNS/WHOIS/mail security recon
│   ├── SubdomainsView.js           # Pillaging — subdomain enumeration
│   ├── EmailsView.js               # Pillaging — emails harvester
│   ├── DocumentsView.js            # Pillaging — exfiltrated document tracker
│   ├── FileMetaView.js             # Pillaging — file metadata extractor
│   ├── LeakIXView.js               # Pillaging — LeakIX service search
│   ├── ReportsView.js              # Reporting — engagement report manager
│   ├── FindingsView.js             # Reporting — findings list
│   ├── FindingDetailView.js        # Reporting — single finding detail + edit
│   └── ClientPortalView.js         # Reporting — client portal
└── widgets/
    ├── StatCard.js                 # Colored-accent stat card
    ├── EngagementCard.js           # Individual operation card with progress + findings
    ├── ActiveEngagements.js        # Fixed-height paginated panel of EngagementCards
    ├── FindingsBreakdown.js        # Severity bar chart + total count
    ├── ResourceUtilization.js      # Top-5 resource bars by usage ratio
    ├── RecentActivity.js           # Timestamped activity feed with colored dots
    └── TeamSkillCoverage.js        # Skill coverage bars with color thresholds
```

---

## Project Structure

```
red-team-operations-center/
├── docs/                               # Documentation assets (screenshots etc.)
├── server/                             # Node.js + Express backend
│   ├── index.js                        # Entry point — CORS, session, passport, route mounts
│   ├── .env                            # Environment variables (never commit)
│   ├── config/
│   │   ├── db.js                       # Mongoose connection to MongoDB
│   │   └── passport.js                 # Passport Google + GitHub OAuth strategies
│   ├── models/
│   │   ├── User.js                     # User schema
│   │   ├── Engagement.js               # Engagement schema — full op data
│   │   └── Diagram.js                  # Diagram schema — name, XML, thumbnail, owner
│   ├── controllers/
│   │   ├── authController.js           # register(), login(), 2FA business logic
│   │   ├── engagementController.js     # Engagement CRUD
│   │   ├── userController.js           # Profile + password update
│   │   ├── c2Controller.js             # C2 droplet CRUD
│   │   ├── phishingController.js       # Phishing campaign CRUD
│   │   ├── deviceCodeController.js     # Device code flow — generate, poll, exchange
│   │   ├── passCookieController.js     # Pass-the-cookie vault CRUD
│   │   ├── evilOAuthController.js      # Evil OAuth — URL gen, callback capture, exchange
│   │   ├── lootController.js           # Loot tracker CRUD
│   │   ├── evidenceController.js       # Evidence vault CRUD
│   │   ├── cleanupController.js        # Cleanup tracker CRUD
│   │   ├── vaultController.js          # Team vault CRUD
│   │   ├── documentsController.js      # Document tracker CRUD
│   │   ├── assumedBreachController.js  # Assumed breach entries CRUD
│   │   ├── fileMetaController.js       # File metadata extraction
│   │   ├── reportController.js         # Engagement reports CRUD
│   │   ├── leakxController.js          # LeakIX proxy
│   │   ├── subdomainsController.js     # Subdomain enumeration proxy
│   │   └── qrController.js             # QR code generation
│   ├── routes/
│   │   ├── auth.js                     # /api/auth/*
│   │   ├── oauth.js                    # /api/oauth/*
│   │   ├── engagements.js              # /api/engagements/*
│   │   ├── users.js                    # /api/users/*
│   │   ├── cve.js                      # /api/cve/*
│   │   ├── diagrams.js                 # /api/diagrams/*
│   │   ├── c2.js                       # /api/c2/*
│   │   ├── phishing.js                 # /api/phishing/*
│   │   ├── deviceCode.js               # /api/device-code/*
│   │   ├── passCookie.js               # /api/pass-cookie/*
│   │   ├── evilOAuth.js                # /api/evil-oauth/*
│   │   ├── loot.js                     # /api/loot/*
│   │   ├── evidence.js                 # /api/evidence/*
│   │   ├── cleanup.js                  # /api/cleanup/*
│   │   ├── vault.js                    # /api/vault/*
│   │   ├── documents.js                # /api/documents/*
│   │   ├── assumedBreach.js            # /api/assumed-breach/*
│   │   ├── fileMeta.js                 # /api/file-meta/*
│   │   ├── reports.js                  # /api/reports/*
│   │   ├── recon.js                    # /api/recon/*
│   │   ├── domainCat.js                # /api/domain-cat/*
│   │   ├── subdomains.js               # /api/subdomains/*
│   │   ├── leakx.js                    # /api/leakx/*
│   │   ├── emailleaks.js               # /api/email-leaks/*
│   │   ├── malware.js                  # /api/malware/*
│   │   ├── ransom.js                   # /api/ransom/*
│   │   ├── portal.js                   # /api/portal/*
│   │   ├── emails.js                   # /api/emails/*
│   │   ├── qr.js                       # /api/qr/*
│   │   └── tools.js                    # /api/tools/*
│   ├── middleware/
│   │   ├── validate.js                 # express-validator input rules per route
│   │   └── authMiddleware.js           # protect() — JWT verification
│   └── utils/
│       └── token.js                    # signToken(), verifyToken(), temp token helpers
│
└── src/                                # React frontend
    ├── App.js                          # ChakraProvider + AnimatePresence + Routes
    ├── theme.js                        # Chakra UI dark theme (Inter font, #111111 bg)
    ├── index.js                        # React DOM entry point
    ├── styles/
    │   └── cardStyles.js               # Shared commonCard style object
    ├── contexts/
    │   ├── AuthContext.js              # Auth state — login, register, 2FA, OAuth, JWT
    │   ├── SettingsContext.js          # User settings (compact mode etc.)
    │   └── EngagementContext.js        # Engagement state + dashboard stats
    └── components/
        ├── common/
        │   ├── Navigation.js           # Frosted-glass nav bar, route-aware active state
        │   ├── PageLayout.js           # Shared wrapper for static pages
        │   └── SparkleQuote.js         # Hover sparkle animation component
        ├── auth/
        │   ├── AuthForm.js             # Sign in / Register form + Google/GitHub OAuth buttons
        │   └── OAuthCallback.js        # Handles OAuth redirect — stores token, enters dashboard
        ├── dashboard/
        │   ├── DashboardLayout.js
        │   ├── EngagementLayout.js
        │   ├── Sidebar.js
        │   ├── TopBar.js
        │   ├── DeleteConfirmModal.js   # Shared delete confirmation modal (used by Engagement/Finding/TTP)
        │   ├── views/                  # (see Dashboard File Structure above)
        │   └── widgets/
        └── pages/
            ├── LandingLayout.js
            ├── LandingHero.js
            ├── LandingShapes.js
            ├── About.js
            ├── Operators.js
            ├── Certifications.js
            ├── about/
            ├── operators/
            └── certifications/
```

---

## Routes

### Frontend (Public)

| Path | Component | Auth required |
|---|---|---|
| `/` | Redirects based on auth state | — |
| `/signin` | `LandingLayout` + `AuthForm` | No |
| `/register` | `LandingLayout` + `AuthForm` | No |
| `/oauth/callback` | `OAuthCallback` | No |
| `/about` | `About` | No |
| `/operators` | `Operators` | No |
| `/certifications` | `Certifications` | No |
| `/dashboard/*` | `DashboardLayout` | **Yes** |

- Logged-in users visiting `/signin` or `/register` are redirected to `/dashboard`
- Unauthenticated users visiting any `/dashboard/*` route are redirected to `/signin`
- OAuth callback (`/oauth/callback`) reads `?token=&user=` params, stores in localStorage, enters dashboard

### Backend API

**Auth**

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `callsign, email, password` | Create operator, returns QR for 2FA setup |
| POST | `/api/auth/confirm-2fa-setup` | `email, token` | Confirm first OTP, activates 2FA, returns JWT |
| POST | `/api/auth/login` | `email, password` | Login — returns `tempToken` if 2FA enabled |
| POST | `/api/auth/verify-2fa` | `tempToken, token` | Verify TOTP, returns full JWT |

**OAuth (no 2FA required)**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/oauth/google` | Redirect to Google OAuth |
| GET | `/api/oauth/google/callback` | Google callback — returns JWT via frontend redirect |
| GET | `/api/oauth/github` | Redirect to GitHub OAuth |
| GET | `/api/oauth/github/callback` | GitHub callback — returns JWT via frontend redirect |

**Users**

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | Yes | Get current user profile |
| PUT | `/api/users/me` | Yes | Update callsign / avatar |
| PUT | `/api/users/me/password` | Yes | Change password |

**Engagements**

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/engagements` | Yes | List all engagements |
| POST | `/api/engagements` | Yes | Create engagement |
| PUT | `/api/engagements/:id` | Yes | Update engagement |
| DELETE | `/api/engagements/:id` | Yes | Delete engagement |

**Device Code Phishing**

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/device-code/generate` | Yes | Generate device code + user code from Microsoft |
| POST | `/api/device-code/poll` | Yes | Poll token endpoint for completion |
| POST | `/api/device-code/graph` | Yes | Run a Graph API query with a captured token |

**Evil OAuth**

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/evil-oauth/generate-url` | Yes | Build consent phishing URL |
| GET | `/api/evil-oauth/callback` | **No** | Public — receives auth code from Microsoft redirect |
| POST | `/api/evil-oauth/exchange` | Yes | Server-side code → token exchange |
| GET | `/api/evil-oauth/captures` | Yes | List all captured codes |
| DELETE | `/api/evil-oauth/captures/:id` | Yes | Delete a single capture |
| DELETE | `/api/evil-oauth/captures` | Yes | Clear all captures |

**Pass-the-Cookie**

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/pass-cookie` | Yes | List all cookie vault entries |
| POST | `/api/pass-cookie` | Yes | Add a new cookie entry |
| DELETE | `/api/pass-cookie/:id` | Yes | Delete a single entry |
| DELETE | `/api/pass-cookie` | Yes | Clear all entries |

**Reports**

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/reports` | Yes | List reports (filtered by engagement) |
| POST | `/api/reports` | Yes | Create a new report |
| PUT | `/api/reports/:id` | Yes | Update report content/status |
| DELETE | `/api/reports/:id` | Yes | Delete a report |

**CVE Proxy**

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/cve/feed` | No | Latest CVEs from Shodan CVE DB |
| GET | `/api/cve/:id` | No | Single CVE detail (e.g. `CVE-2024-12345`) |

**Diagrams**

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/diagrams` | Yes | List all diagrams for current user |
| GET | `/api/diagrams/:id` | Yes | Get single diagram (full XML) |
| POST | `/api/diagrams` | Yes | Create diagram |
| PUT | `/api/diagrams/:id` | Yes | Update diagram (name, XML, thumbnail) |
| DELETE | `/api/diagrams/:id` | Yes | Delete diagram |

**Health**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |

---

## Auth Flow

```
Local Register
  → validate input (express-validator)
  → check email not already taken
  → hash password (bcrypt, 12 rounds)
  → generate TOTP secret, return QR code
  → user scans QR + enters first 6-digit code
  → twoFactorSecret confirmed, JWT issued

Local Login
  → validate input
  → find user by email (with password field)
  → compare password (bcrypt)
  → if 2FA enabled → return tempToken (10 min)
  → user enters TOTP code
  → verify TOTP, issue full JWT (7 day)

OAuth Login (Google / GitHub) — no 2FA required
  → user clicks provider button → redirect to /api/oauth/<provider>
  → Passport redirects to provider OAuth page
  → provider redirects to /api/oauth/<provider>/callback
  → find or create user by oauthId (or link by email)
  → sign JWT, redirect to /oauth/callback?token=<jwt>&user=<json>
  → frontend stores token + user in localStorage → enter dashboard

Frontend session
  → stores JWT + user object in localStorage
  → restores session on page refresh (useEffect on mount)
  → sends Authorization: Bearer <token> header on protected requests
  → logout clears localStorage and resets auth state
```

---

## Database

- **MongoDB** — `red-team-ops-center` database
- **Mongoose** schemas with timestamps

### User Schema

| Field | Type | Required | Notes |
|---|---|---|---|
| callsign | String | Yes | Operator display name, unique |
| email | String | Yes | Unique, lowercase, trimmed |
| password | String | No | bcrypt hashed — null for OAuth users |
| role | String | No | `operator` (default), `admin` |
| oauthProvider | String | No | `google`, `github`, or null |
| oauthId | String | No | Provider user ID (hidden from queries) |
| twoFactorSecret | String | No | Live TOTP secret (hidden from queries) |
| twoFactorTempSecret | String | No | Temp secret during 2FA setup |
| twoFactorEnabled | Boolean | No | True after first OTP confirmed |
| avatar | String | No | Base64 data URL (150×150) |
| createdAt / updatedAt | Date | Auto | Mongoose timestamps |

### Engagement Schema

Stores full operation data — team, resources, findings, activity, operator skills.

| Key fields | Notes |
|---|---|
| name, slug | Operation name + URL-safe slug |
| status | `PREPARING`, `IN PROGRESS`, `REPORTING`, `COMPLETED`, `PAUSED` |
| operators | Array of operator objects |
| resources | Array of resource tracking objects |
| findings | Array of findings |
| activity | Array of activity log entries |
| operatorSkills | Mixed — `{ operatorId: [skill, ...] }` map |

### Diagram Schema

| Field | Type | Notes |
|---|---|---|
| name | String | Diagram title (editable in editor) |
| xml | String | draw.io XML content |
| thumbnail | String | Base64 PNG — captured on save |
| owner | ObjectId | Ref to User |
| createdAt / updatedAt | Date | Mongoose timestamps |

---

## Environment Variables

Create `server/.env` (already gitignored):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/red-team-ops-center
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRES_IN=7d

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Session secret (OAuth dance only — not used for API auth)
SESSION_SECRET=change_this_to_a_random_string

# Google OAuth — https://console.cloud.google.com/
# Authorized redirect URI: http://localhost:5000/api/oauth/google/callback
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth — https://github.com/settings/developers
# Callback URL: http://localhost:5000/api/oauth/github/callback
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Evil OAuth App Generator
# Register an app at https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
# Set redirect URI to: http://localhost:5000/api/evil-oauth/callback
EVIL_OAUTH_CLIENT_SECRET=your_azure_app_client_secret_here
```

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 18 | Component-based UI |
| Chakra UI | ^2.8 | Dark-theme component library |
| Framer Motion | ^11.3 | Page + card transitions, animations |
| React Router | v6 | Client-side routing |
| @chakra-ui/icons | ^2.0 | UI icons throughout |

### Backend
| Package | Version | Purpose |
|---|---|---|
| Express | ^4.19 | HTTP server + routing |
| Mongoose | ^8.5 | MongoDB ODM + schema validation |
| bcryptjs | ^2.4 | Password hashing (12 rounds) |
| jsonwebtoken | ^9.0 | JWT sign + verify |
| express-validator | ^7.1 | Input validation middleware |
| cors | ^2.8 | Cross-origin requests from React |
| dotenv | ^16.4 | Environment variable loading |
| nodemon | ^3.1 | Auto-restart on file change |
| passport | ^0.7 | OAuth authentication middleware |
| passport-google-oauth20 | ^2.0 | Google OAuth 2.0 strategy |
| passport-github2 | ^0.1 | GitHub OAuth 2.0 strategy |
| express-session | ^1.18 | Session store for OAuth dance |
| speakeasy | ^2.0 | TOTP 2FA code generation + verification |
| qrcode | ^1.5 | QR code generation for 2FA setup |

---

## Static Assets

```
public/
├── badges/     # Cert badge images — oscp.png, crto.png, cadpenx.png ...
└── images/     # General images — splash.jpg ...

docs/
├── dashboard-preview.png        # Legacy dashboard screenshot
└── screenshots/                 # Platform screenshots for README
    ├── 01-landing.png           # Public landing / sign-in page
    ├── 02-dashboard.png         # Operations dashboard + sidebar
    ├── 03-engagements.png       # Engagements center
    ├── 04-cheatsheet.png        # Payload & Evasion Engineering Map
    ├── 05-lab-configs.png       # Lab configurations (Ludus templates)
    ├── 06-cve-feed.png          # CVE Feed (Shodan)
    ├── 07-email-leaks.png       # Email Leaks (HIBP)
    └── 08-malware-scanner.png   # Malware Scanner (VirusTotal)
```

---

## Developer Guides

### Adding a New Global Dashboard Page

1. Create the view in `src/components/dashboard/views/`
2. Add a `<Route>` in [DashboardLayout.js](src/components/dashboard/DashboardLayout.js)
3. Add a nav item to the appropriate `*Nav` array in [Sidebar.js](src/components/dashboard/Sidebar.js)
4. Add the route prefix to `GLOBAL_KEYS` in `Sidebar.js` so Settings/Sign Out stay pinned

### Adding a New Per-Engagement Page

1. Create the view in `src/components/dashboard/views/`
2. Add a `<Route>` in [EngagementLayout.js](src/components/dashboard/EngagementLayout.js)
3. Add a nav item to the appropriate section in `engagementNav` in [Sidebar.js](src/components/dashboard/Sidebar.js)

### Adding a New Widget to the Overview

1. Create the widget in `src/components/dashboard/widgets/`
2. Import and place it in [DashboardView.js](src/components/dashboard/views/DashboardView.js)

### Adding a New API Route

1. Create a controller in `server/controllers/`
2. Create a route file in `server/routes/`
3. Mount it in [server/index.js](server/index.js)
4. Use `protect` middleware for authenticated endpoints:
   ```js
   const { protect } = require('../middleware/authMiddleware');
   router.get('/me', protect, getMe);
   ```

### Shared Card Style

```js
import { commonCard } from '../../styles/cardStyles';
```

### Delete Confirmation Modal

All destructive delete actions use the shared `DeleteConfirmModal` component instead of the native browser `window.confirm`:

```jsx
import DeleteConfirmModal from '../DeleteConfirmModal';

// state
const [confirmDelete, setConfirmDelete] = useState(false);

// trigger
<Button onClick={() => setConfirmDelete(true)}>Delete</Button>

// modal
<DeleteConfirmModal
  isOpen={confirmDelete}
  onClose={() => setConfirmDelete(false)}
  onConfirm={handleDelete}
  title="Delete Engagement"
  itemName={engagement.name}
/>
```

---

## TODO

### Lab Configs — Auto-Deploy

The Lab Configs page (`/dashboard/lab/configs`) is currently **static** — the 8 Ludus lab templates and their deploy commands are hardcoded in the frontend. The "Show Commands" modal displays the manual CLI steps needed to deploy each lab via Ludus.

**Planned:** Full Ludus API integration so operators can trigger deploys directly from the UI — selecting a template, clicking deploy, and monitoring range status in real time without touching the CLI.

---

### Resources & Materials — Tools Page

Curated red team tooling reference at `/dashboard/resources/tools`.

- Static or DB-backed list of tools per category (recon, exploitation, post-exploitation, C2, reporting)
- Copy-to-clipboard install commands, links to repos, brief descriptions

### Malware Analysis — Reports Page

History of VirusTotal scan results at `/dashboard/malware/reports`.

- DB-backed scan history, filterable by file type / verdict
- Links back to individual scan reports with full AV engine breakdown

### Decorative Side Shapes (Public Pages)

- Container: `pos="absolute" top="0" bottom="0"` — full page height automatically
- Shapes: positioned at `top: X%` inside container
- Right side mirrors left via `ml: 110 - s.ml`
- Only visible on `xl` screens
- Color: `rgba(252,129,129, ...)` — `red.200` at varying opacities
