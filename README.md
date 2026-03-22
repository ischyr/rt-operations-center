# Red Team Operations Center

A platform that helps red team operators build structure, planning, and execution workflows for continuous campaign preparedness and mission excellence.

---

## Project Structure

```
src/
├── App.js                          # App entry — ChakraProvider + React Router Routes
├── theme.js                        # Chakra UI dark theme config
├── index.js                        # React DOM entry point
├── styles/
│   └── cardStyles.js               # Shared card style object (commonCard)
├── contexts/
│   └── AuthContext.js              # Auth state — login, register, logout
└── components/
    ├── common/
    │   ├── Navigation.js           # Top nav bar with route-aware active state
    │   └── PageLayout.js           # Shared wrapper for static pages
    ├── auth/
    │   └── AuthForm.js             # Login / Register form (route-driven)
    ├── dashboard/
    │   ├── Dashboard.js            # Dashboard orchestrator
    │   ├── DashboardHeader.js      # Operator info + logout card
    │   └── TelemetryOverview.js    # Live telemetry stats card
    └── pages/
        ├── LandingLayout.js        # Landing page orchestrator
        ├── LandingHero.js          # Left-side hero section
        ├── About.js                # About page orchestrator
        ├── Operators.js            # Operators page orchestrator
        ├── Certifications.js       # Certifications page orchestrator
        ├── about/
        │   ├── AboutIntro.js       # Intro text section
        │   ├── StrategicFramework.js # Strategic success framework box
        │   └── FeatureGrid.js      # Feature cards grid + CTA
        ├── operators/
        │   └── OperatorCard.js     # Individual operator team card
        └── certifications/
            └── CertCard.js         # Individual certification card with progress bar
```

---

## Routes

| Path              | Component                  | Auth required |
|-------------------|----------------------------|---------------|
| `/`               | Redirects to `/signin`     | No            |
| `/signin`         | `LandingLayout` + AuthForm | No            |
| `/register`       | `LandingLayout` + AuthForm | No            |
| `/about`          | `About`                    | No            |
| `/operators`      | `Operators`                | No            |
| `/certifications` | `Certifications`           | No            |
| `*`               | Redirects to `/signin`     | No            |
| (logged in)       | `Dashboard`                | Yes           |

---

## Tech Stack

- **React** — component-based UI
- **Chakra UI** — dark theme component library
- **React Router v6** — client-side routing
- **Context API** — auth state management

---

## Getting Started

```bash
npm install
npm start
```

---

## Adding New Pages

1. Create your page component in `src/components/pages/`
2. Add a `<Route>` in `src/App.js`:
   ```jsx
   <Route path="/your-page" element={<PageLayout><YourPage /></PageLayout>} />
   ```
3. Add a nav item in `src/components/common/Navigation.js`:
   ```js
   { key: 'your-page', label: 'YOUR PAGE', path: '/your-page' }
   ```

## Adding New Dashboard Sections

1. Create a new component in `src/components/dashboard/`
2. Import and render it inside `src/components/dashboard/Dashboard.js`

## Shared Styles

The `commonCard` style object is exported from `src/styles/cardStyles.js` and used across all card components. Import it wherever needed:

```js
import { commonCard } from '../../styles/cardStyles';
```
