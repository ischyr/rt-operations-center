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
| **RESOURCES & MATERIALS** | Tools, CVE Feed, Ransom Feed, Email Leaks, LOLBIN / LOLBAS, Domain Cat Checker, Google Dorking |
| **CLONING** | Voice Cloner |
| **MALWARE ANALYSIS** | Scanner, Reports |
| **DIAGRAM DRAWING** | Editor, My Diagrams |

**Per-engagement sections (shown when inside an engagement):**

| Section | Items |
|---|---|
| **OPERATIONS** | Activity Log, Calendar, Skill Requests, TTX Planner, Team Vault, Assumed Breach |
| **TEAM** | People & Skills, Resources |
| **INTELLIGENCE** | Loot Tracker, Evidence Vault, Cleanup Tracker, Reverse Shells, CVE Research Board |
| **INFRASTRUCTURE** | C2 Infrastructure, Phishing Infrastructure, Device Code Phishing, Pass-the-Cookie, Evil OAuth Generator, MFA Push Fatigue, ClickFix Builder, AD Grapher |
| **BUILDERS** | Username Generator, Typosquat Generator, QR Code Generator, Wordlist Generator, Redirector Chain, Card Generation, Fake Teams Message |
| **SOCK PUPPETS** | Personas, Social Media |
| **TTPs** | Initial Access, Windows, Linux, Active Directory, Network |
| **PILLAGING** | Domain Recon, Subdomains, Network Scanning, Webserver Enum, Domain Flyover, Leaks, Credentials, Kerberos Tickets, Documents, File Metadata |
| **BLOODHOUND** | Analyzer, Cypher Library |
| **OSINT** | Emails Harvester, Org Chart Mapper |
| **COMMS** | White Team, Webhook Alerter |
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

### Webserver Enumeration

The Webserver Enumeration page (`/pillaging/webserver-enum`) probes HTTP/HTTPS targets using `projectdiscovery/httpx` running in Docker.

- Single domain or bulk import via `.txt` / `.json` file (subdomain export format supported)
- Drag-and-drop file import zone
- Live Docker terminal output during scanning
- Results: status code (color-coded), URL with copy + open buttons, page title, technology badges
- Filter results by status code range (2xx / 3xx / 4xx / 5xx)
- Export filtered URLs to `.txt`
- Scan history sidebar with per-scan delete
- Scans persist while navigating — resumes on page return

**Docker image:** `projectdiscovery/httpx`
**Command:** `httpx -list /targets.txt -status-code -title -tech-detect`

---

### Domain Flyover

The Domain Flyover page (`/pillaging/domain-flyover`) captures visual screenshots of web targets using `leonjza/gowitness` running in Docker.

- Single domain or bulk import via `.txt` / `.json` file (subdomain export format supported)
- Drag-and-drop file import zone
- Bare domains are automatically prefixed with `https://`
- Results displayed as a screenshot grid — each card shows the rendered page thumbnail, HTTP status badge, URL, page title, and redirect chain if applicable
- Click any card to expand the full screenshot in a lightbox modal
- Filter by status code range (2xx / 3xx / 4xx / 5xx)
- Live Docker terminal output while scanning
- Flyover history sidebar with per-scan delete
- Scans persist while navigating

**Docker image:** `leonjza/gowitness`
**Command:** `gowitness scan file -f /targets.txt --screenshot-path /screenshots --threads 3`

---

### Network Scanning

The Network Scanning page (`/pillaging/services`) performs fast port scanning using `rustscan` running in Docker.

- Single IP or bulk import
- Configurable ports and scan options
- Results show open ports, detected services, and banners
- Live Docker terminal output
- Scan history per engagement

**Docker image:** `rustscan/rustscan`

---

### Subdomain Enumeration

The Subdomains page (`/pillaging/subdomains`) runs passive and active subdomain discovery using `projectdiscovery/subfinder` in Docker.

- Single root domain input
- Results stream live as subdomains are discovered
- Export discovered subdomains to `.json` (compatible with Webserver Enum and Domain Flyover import)
- Scan history per engagement
- Deduplication of results

**Docker image:** `projectdiscovery/subfinder`

---

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

### MFA Push Fatigue

The MFA Push Fatigue module (`/intelligence/mfa-push`) assists with MFA push notification fatigue attacks (also known as MFA bombing).

- Generate and track push notification campaigns
- Configure timing, frequency, and target parameters
- Log victim responses and authentication attempts

---

### ClickFix Builder

The ClickFix Builder (`/intelligence/clickfix`) generates social engineering lures that instruct victims to paste a malicious command into their terminal/run dialog by disguising it as a CAPTCHA or browser verification step.

- Pre-built ClickFix templates for common lure scenarios
- Customizable payload and lure text
- Copy-ready HTML/Markdown output

---

### AD Grapher

The AD Grapher (`/intelligence/ad-grapher`) provides visual Active Directory relationship mapping from BloodHound-compatible data.

- Import AD data and visualize object relationships
- Highlight attack paths and high-value targets

---

### Pass-the-Cookie Dashboard

The Pass-the-Cookie Dashboard (`/intelligence/pass-cookie`) is a session hijacking toolkit for storing, managing, and replaying captured browser cookies against known SaaS targets.

**How it works:**

1. **Add cookies** — paste raw cookie strings (from XSS output, infostealer logs, MITM captures, or manual browser extraction) into the Add to Vault modal. The parser auto-detects the number of cookies and associates the entry with a target app (Microsoft 365, Google Workspace, GitHub, AWS Console, Okta, or custom).

2. **Vault management** — all entries are stored in localStorage under `ptc_entries`. Each entry shows target app, session label, cookie count, and capture time. Entries can be deleted individually or cleared in bulk.

3. **Replay session** — a "Use Cookies" button opens a new browser tab to the target app's URL. The workflow guides the operator through injecting the cookies via DevTools to hijack the session — bypassing MFA since the cookie already contains an authenticated session.

---

### BloodHound Analyzer

The BloodHound Analyzer (`/bloodhound/analyzer`) provides in-platform analysis of BloodHound data exports.

- Upload BloodHound ZIP/JSON exports
- Run pre-built and custom Cypher queries against the dataset
- Visualize attack paths and identify shortest paths to Domain Admin

### Cypher Library

The Cypher Library (`/bloodhound/cypher-library`) is a searchable collection of BloodHound Cypher queries organized by attack category.

- Browse and search queries by technique or target object type
- One-click copy for use in BloodHound or the Analyzer
- Categories: Shortest Paths, Kerberos, ACL Abuse, Group Membership, GPO, etc.

---

### CVE Research Board

The CVE Research Board (`/intelligence/cve-research`) tracks CVEs relevant to the current engagement.

- Add CVEs by ID with auto-populated CVSS score, description, and affected products
- Set exploitation status (Not Tested / Attempted / Exploited / Patched)
- Link CVEs to findings for report integration
- Filter by severity and status

---

### Kerberos Tickets

The Kerberos Tickets view (`/pillaging/kerberos`) tracks Kerberos tickets and related artifacts captured during an engagement.

- Log captured TGTs, service tickets, and AS-REP hashes
- Record ticket type (TGT, TGS, AS-REP, Silver, Golden, Diamond)
- Track associated user, SPN, encryption type, and cracking status
- Export ticket list for reporting

---

### Redirector Chain Builder

The Redirector Chain Builder (`/builders/redirector-chain`) designs multi-hop redirect infrastructure for phishing and C2 obfuscation.

- Visually build redirect chains with configurable hop types
- Supports HTTP 301/302, meta-refresh, and JavaScript redirects
- Export chain configuration for deployment

---

### Card Generation

The Card Generation view (`/builders/card-generation`) generates fake identity cards and badges for physical red team engagements.

- Customizable templates for employee badges, visitor passes, and ID cards
- Input name, title, department, photo, and organization details
- Export as printable image

---

### Fake Teams Message

The Fake Teams Message builder (`/builders/fake-teams`) generates convincing Microsoft Teams message screenshots for social engineering lures.

- Compose a message with custom sender name, avatar, and timestamp
- Choose Teams light or dark theme
- Export as PNG for use in phishing emails or physical props

---

### Org Chart Mapper

The Org Chart Mapper (`/osint/org-chart`) builds visual organizational charts from OSINT-gathered employee data.

- Add people with name, title, department, and reporting relationships
- Auto-layout organizational hierarchy
- Export chart for engagement documentation

---

### Google Dorking

The Google Dorking reference (`/resources/google-dorking`) provides a searchable library of Google dork queries for information gathering.

- Categorized by target type (files, login pages, cameras, configs, etc.)
- One-click copy for each dork
- Useful for pre-engagement OSINT and attack surface discovery

---

### Voice Cloner

The Voice Cloner (`/cloning/voice-cloner`) assists with voice cloning operations for vishing engagements.

- Interface for managing voice cloning workflows
- Integration with voice synthesis tooling

---

### Webhook Alerter

The Webhook Alerter (`/comms/webhook-alerter`) sends real-time notifications to Slack, Teams, or Discord webhooks when engagement events occur.

- Configure multiple webhook endpoints (Slack, Teams, Discord, custom)
- Test webhook connectivity
- Trigger manual alerts or tie to engagement events

---

### White Team Communications

The White Team view (`/comms/white-team`) manages communications with the white team (authorizing officials) during the engagement.

- Log white team contacts with timestamps
- Track de-confliction requests and approvals
- Record stop/start authorizations

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

The Emails Harvester (`/osint/emails`) collects and organizes email addresses found during reconnaissance:

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
| `/dashboard/resources/google-dorking` | Google Dorking | Built |
| `/dashboard/cloning/voice-cloner` | Voice Cloner | Built |
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
| `/:slug/intelligence/cve-research` | CVE Research Board | Built |
| `/:slug/intelligence/c2` | C2 Infrastructure | Built |
| `/:slug/intelligence/phishing` | Phishing Infrastructure | Built |
| `/:slug/intelligence/device-code-phishing` | Device Code Phishing | Built |
| `/:slug/intelligence/device-code-phishing/:category/:querySlug` | Graph Result | Built |
| `/:slug/intelligence/pass-cookie` | Pass-the-Cookie | Built |
| `/:slug/intelligence/evil-oauth` | Evil OAuth Generator | Built |
| `/:slug/intelligence/mfa-push` | MFA Push Fatigue | Built |
| `/:slug/intelligence/clickfix` | ClickFix Builder | Built |
| `/:slug/intelligence/ad-grapher` | AD Grapher | Built |
| `/:slug/builders/username-gen` | Username Generator | Built |
| `/:slug/builders/typosquat` | Typosquat Generator | Built |
| `/:slug/builders/qr-codes` | QR Code Generator | Built |
| `/:slug/builders/wordlist-gen` | Wordlist Generator | Built |
| `/:slug/builders/redirector-chain` | Redirector Chain | Built |
| `/:slug/builders/card-generation` | Card Generation | Built |
| `/:slug/builders/fake-teams` | Fake Teams Message | Built |
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
| `/:slug/pillaging/subdomains` | Subdomain Enumeration | Built |
| `/:slug/pillaging/services` | Network Scanning | Built |
| `/:slug/pillaging/webserver-enum` | Webserver Enumeration | Built |
| `/:slug/pillaging/domain-flyover` | Domain Flyover | Built |
| `/:slug/pillaging/leaks` | Leaks | Placeholder |
| `/:slug/pillaging/credentials` | Credentials | Placeholder |
| `/:slug/pillaging/kerberos` | Kerberos Tickets | Built |
| `/:slug/pillaging/emails` | Emails Harvester | Built |
| `/:slug/pillaging/documents` | Documents | Built |
| `/:slug/pillaging/file-meta` | File Metadata | Built |
| `/:slug/bloodhound/analyzer` | BloodHound Analyzer | Built |
| `/:slug/bloodhound/cypher-library` | Cypher Library | Built |
| `/:slug/osint/emails` | Emails Harvester | Built |
| `/:slug/osint/org-chart` | Org Chart Mapper | Built |
| `/:slug/comms/white-team` | White Team | Built |
| `/:slug/comms/webhook-alerter` | Webhook Alerter | Built |
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
│   ├── GoogleDorkingView.js        # Resources — Google dork library
│   ├── ToolsView.js                # Resources — red team tools reference
│   ├── VoiceClonerView.js          # Cloning — voice cloning workflow
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
│   ├── CVEResearchView.js          # Intelligence — CVE research board
│   ├── C2View.js                   # Infrastructure — C2 infrastructure manager
│   ├── PhishingView.js             # Infrastructure — phishing infrastructure
│   ├── DeviceCodePhishingView.js   # Infrastructure — device code phishing + token vault
│   ├── graphEnumCatalog.js         # Infrastructure — Graph API query catalog
│   ├── GraphResultView.js          # Infrastructure — Graph enumeration results
│   ├── PassCookieView.js           # Infrastructure — pass-the-cookie vault
│   ├── EvilOAuthView.js            # Infrastructure — Evil OAuth consent phishing
│   ├── MfaPushView.js              # Infrastructure — MFA push fatigue
│   ├── ClickFixView.js             # Infrastructure — ClickFix lure builder
│   ├── ADGrapherView.js            # Infrastructure — AD relationship grapher
│   ├── UsernameGeneratorView.js    # Builders — username permutation generator
│   ├── TyposquatView.js            # Builders — typosquat domain generator
│   ├── QRCodeView.js               # Builders — QR code generator
│   ├── WordlistView.js             # Builders — custom wordlist builder
│   ├── RedirectorChainView.js      # Builders — redirector chain designer
│   ├── CardGenerationView.js       # Builders — fake badge / ID card generator
│   ├── FakeTeamsView.js            # Builders — fake Teams message screenshot
│   ├── PersonasView.js             # Sock Puppets — persona manager
│   ├── SocialMediaView.js          # Sock Puppets — social media presence tracker
│   ├── TTPsView.js                 # TTPs — technique list per category
│   ├── TTPDetailView.js            # TTPs — single technique detail + edit
│   ├── DomainReconView.js          # Pillaging — DNS/WHOIS/mail security recon
│   ├── SubdomainsView.js           # Pillaging — subdomain enumeration (subfinder)
│   ├── NetworkScannerView.js       # Pillaging — port/service scanner (rustscan)
│   ├── WebserverEnumView.js        # Pillaging — HTTP/S probing (httpx)
│   ├── DomainFlyoverView.js        # Pillaging — visual screenshot capture (gowitness)
│   ├── KerberosView.js             # Pillaging — Kerberos ticket tracker
│   ├── EmailsView.js               # Pillaging / OSINT — emails harvester
│   ├── DocumentsView.js            # Pillaging — exfiltrated document tracker
│   ├── FileMetaView.js             # Pillaging — file metadata extractor
│   ├── BloodHoundView.js           # BloodHound — data analyzer
│   ├── CypherLibraryView.js        # BloodHound — Cypher query library
│   ├── OrgChartView.js             # OSINT — org chart mapper
│   ├── WhiteTeamView.js            # Comms — white team communications log
│   ├── WebhookAlerterView.js       # Comms — webhook notification sender
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
│   │   ├── networkScannerController.js # Port/service scanning via rustscan Docker
│   │   ├── webserverEnumController.js  # HTTP/S probing via httpx Docker
│   │   ├── domainFlyoverController.js  # Screenshot capture via gowitness Docker
│   │   ├── subdomainsController.js     # Subdomain enumeration via subfinder Docker
│   │   ├── kerberosController.js       # Kerberos ticket tracker CRUD
│   │   ├── bloodhoundController.js     # BloodHound data analysis
│   │   ├── leakxController.js          # LeakIX proxy
│   │   ├── cveController.js            # CVE feed + research board
│   │   ├── ghdbController.js           # Google Dorking / GHDB
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
│   │   ├── networkScanner.js           # /api/network-scanner/*
│   │   ├── webserverEnum.js            # /api/webserver-enum/*
│   │   ├── domainFlyover.js            # /api/domain-flyover/*
│   │   ├── subdomains.js               # /api/subdomains/*
│   │   ├── bloodhound.js               # /api/bloodhound/*
│   │   ├── kerberos.js                 # /api/kerberos/*
│   │   ├── leakx.js                    # /api/leakx/*
│   │   ├── emailleaks.js               # /api/email-leaks/*
│   │   ├── malware.js                  # /api/malware/*
│   │   ├── ransom.js                   # /api/ransom/*
│   │   ├── portal.js                   # /api/portal/*
│   │   ├── emails.js                   # /api/emails/*
│   │   ├── ghdb.js                     # /api/ghdb/*
│   │   ├── telegram.js                 # /api/telegram/*
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
        │   └── AuthForm.js             # Sign in / Register form + Google/GitHub OAuth buttons
        └── dashboard/                  # See Dashboard File Structure above
```

---

## Docker Requirements

Several pillaging and scanning tools run as Docker containers. Make sure Docker Desktop is running before using these features.

| Feature | Image | Pull Command |
|---|---|---|
| Subdomain Enumeration | `projectdiscovery/subfinder` | `docker pull projectdiscovery/subfinder` |
| Webserver Enumeration | `projectdiscovery/httpx` | `docker pull projectdiscovery/httpx` |
| Domain Flyover | `leonjza/gowitness` | `docker pull leonjza/gowitness` |
| Network Scanning | `rustscan/rustscan` | `docker pull rustscan/rustscan` |

> On Windows with Docker Desktop, ensure the `C:\Users\<you>\AppData\Local\Temp` path is shared with Docker (Settings → Resources → File Sharing).
