# Red Team Operations Center

A platform that helps red team operators build structure, planning, and execution workflows for continuous campaign preparedness and mission excellence.

---

## Project Structure

```
src/
├── App.js                              # App entry — ChakraProvider + AnimatePresence + Routes
├── theme.js                            # Chakra UI dark theme (Inter font, #111111 bg)
├── index.js                            # React DOM entry point
├── styles/
│   └── cardStyles.js                   # Shared commonCard style object
├── contexts/
│   └── AuthContext.js                  # Auth state — login, register, logout, clearMessage
└── components/
    ├── common/
    │   ├── Navigation.js               # Frosted-glass nav bar, route-aware active state
    │   ├── PageLayout.js               # Shared wrapper for static pages (nav + max-width container)
    │   └── SparkleQuote.js             # Hover sparkle animation component
    ├── auth/
    │   └── AuthForm.js                 # Sign in / Register form with AnimatePresence transition
    ├── dashboard/
    │   ├── Dashboard.js                # Dashboard orchestrator
    │   ├── DashboardHeader.js          # Operator info + logout card
    │   └── TelemetryOverview.js        # Live telemetry stats card
    └── pages/
        ├── LandingLayout.js            # Landing page orchestrator (hero + auth panel)
        ├── LandingHero.js              # Left-side hero — title, description, tags, sparkle quote
        ├── LandingShapes.js            # 31 scattered decorative shapes across the landing page
        ├── About.js                    # About page orchestrator
        ├── Operators.js                # Operators page orchestrator + team data
        ├── Certifications.js           # Certifications page orchestrator + cert data
        ├── about/
        │   ├── AboutIntro.js           # Heading + intro paragraphs
        │   ├── StrategicFramework.js   # Strategic success framework highlight box
        │   ├── FeatureGrid.js          # Numbered feature cards + Get Started CTA button
        │   └── AboutShapes.js          # Full-height decorative side shapes (30 per side)
        ├── operators/
        │   ├── OperatorsIntro.js       # "Teamers" heading + description
        │   ├── OperatorCard.js         # GROUP-IB-style APT profile card
        │   ├── OperatorShapes.js       # Full-height decorative side shapes (30 per side)
        └── certifications/
            ├── CertificationsIntro.js  # Heading + description
            ├── CertCard.js             # Badge card (image or styled placeholder)
            ├── CertShapes.js           # Full-height decorative side shapes (30 per side)
            ├── ImprovementSection.js   # "Race for constant improvement" section + image
```

---

## Routes

| Path              | Component                        | Auth required |
|-------------------|----------------------------------|---------------|
| `/`               | Redirects to `/signin`           | No            |
| `/signin`         | `LandingLayout` + `AuthForm`     | No            |
| `/register`       | `LandingLayout` + `AuthForm`     | No            |
| `/about`          | `About`                          | No            |
| `/operators`      | `Operators`                      | No            |
| `/certifications` | `Certifications`                 | No            |
| `*`               | Redirects to `/signin`           | No            |
| (logged in)       | `Dashboard`                      | Yes           |

Page transitions use `AnimatePresence mode="wait"` — each route fades and slides in. Sign In and Register share the same transition key (`"auth"`) so only the internal card animates when switching between them.

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| React | 18 | Component-based UI |
| Chakra UI | ^2.8 | Dark-theme component library |
| Framer Motion | ^11.3 | Page + card transitions, sparkle animations |
| React Router | v6 | Client-side routing |
| @chakra-ui/icons | ^2.0 | Input icons, arrow icons |

---

## Getting Started

```bash
npm install
npm start
```

---

## Pages & Features

### Landing (Sign In / Register)
- Split layout: hero panel (left) + auth panel (right)
- Hero includes animated glowing tags: **STRUCTURE · PLANNING · TACTICS · COMMAND**
- Quote at the bottom sparkles with gold/white 4-pointed stars on hover
- 31 decorative red geometric shapes (hexagons, diamonds, triangles, dots) scattered across the full page height
- Auth card transitions smoothly between Sign In and Register with a slide + fade animation
- Frosted-glass navigation bar with active indicator dots and red glow on auth buttons

### About
- Intro section with team description
- Strategic Success Framework highlight box
- "Why choose Red Team Ops Center?" — 4 numbered feature cards with:
  - Red gradient top accent line
  - Corner number label (01–04)
  - Hover: lifts 8px + red glow + border brightens
- Get Started CTA button with red gradient, glow, and arrow icon
- Full-height decorative side shapes (30 per side, percentage-distributed)

### Operators
- "Teamers" intro heading + description
- GROUP-IB-style APT profile cards per operator, each containing:
  - Avatar (image or initial fallback on red background)
  - Callsign, real name, aliases, first active, latest activity
  - Tag row: Languages · Geography · Focus Area · Motivation
  - Bottom split: Skillset + Toolset (left) | Operator Write-up + Primary Tradecraft (right)
- Full-height decorative side shapes distributed across all cards

### Certifications
- Intro heading + description
- Badge grid — 3 columns, 16 certifications, image or styled placeholder fallback
- "Race for constant improvement" section with text + splash image
- Full-height decorative side shapes

### Dashboard (logged in)
- Operator header card — active callsign + logout
- Telemetry overview card — breach attempts, active targets, phishing vectors, alerts

---

## Static Assets

```
public/
├── badges/         # Certification badge images (e.g. oscp.png, crto.png)
└── images/         # General images (e.g. splash.jpg)
```

Badge naming convention: lowercase cert title, e.g. `oscp.png`, `crto.png`, `cadpenx.png`.

---

## Certifications

Edit the `certifications` array in [src/components/pages/Certifications.js](src/components/pages/Certifications.js):

```js
{ title: 'OSCP', fullName: 'Offensive Security Certified Professional (OSCP)', image: '/badges/oscp.png' }
```

Current certs: OSCE³, OSWE, OSEP, OSED, OSCP, CRTO, PNPT, CRTA, CPTS, CNPen, C-ADPenX, eCPPT, PJPT, PMPA, PWPA, W200

---

## Operators

Edit the `operators` array in [src/components/pages/Operators.js](src/components/pages/Operators.js):

```js
{
  callsign: 'Phantom',
  realName: 'Lead Red Team Operator',
  image: '',                          // path to image in public/
  aliases: ['Ghost', 'Specter'],
  firstActive: '2019',
  latestActivity: 'Present',
  languages: ['English', 'Romanian'],
  geography: ['Europe', 'Middle East'],
  focus: ['Adversary Emulation', 'C2 Development'],
  motivation: ['Espionage Sim', 'Research'],
  skillset: ['Linux', 'Windows', 'Python', 'C++', 'PowerShell'],
  toolset: ['Cobalt Strike', 'Havoc', 'BloodHound', 'Burp Suite'],
  writeup: '...',
  tradecraft: '...',
}
```

---

## Adding New Pages

1. Create your page component in `src/components/pages/`
2. Add a `<Route>` in [src/App.js](src/App.js):
   ```jsx
   <Route path="/your-page" element={<PageLayout><YourPage /></PageLayout>} />
   ```
3. Add a nav item in [src/components/common/Navigation.js](src/components/common/Navigation.js):
   ```js
   { key: 'your-page', label: 'YOUR PAGE', path: '/your-page' }
   ```

## Adding New Dashboard Sections

1. Create a component in `src/components/dashboard/`
2. Import and render it in [src/components/dashboard/Dashboard.js](src/components/dashboard/Dashboard.js)

## Shared Styles

`commonCard` is defined once in [src/styles/cardStyles.js](src/styles/cardStyles.js) and imported wherever a card is needed:

```js
import { commonCard } from '../../styles/cardStyles';
```

## Decorative Side Shapes

Every page that uses side shapes (`AboutShapes`, `CertShapes`, `OperatorShapes`, `LandingShapes`) follows the same pattern:
- Container: `pos="absolute" top="0" bottom="0"` — stretches the full page height automatically
- Shapes: individually positioned at `top: X%` inside the container — distributes evenly regardless of content length
- Only visible on `xl` screens (`display={{ base: 'none', xl: 'block' }}`)
- All shapes use `rgba(252,129,129, ...)` — the `red.200` tone at varying opacities

To add a new page with side shapes, copy any existing `*Shapes.js` file and adjust the `leftShapes` array. The right side mirrors automatically via `ml: 110 - s.ml`.
