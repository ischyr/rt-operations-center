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

## Project Structure

```
red-team-operations-center/
├── server/                             # Node.js + Express backend
│   ├── index.js                        # Entry point — CORS, JSON, route mounts
│   ├── .env                            # Environment variables (never commit)
│   ├── config/
│   │   └── db.js                       # Mongoose connection to MongoDB
│   ├── models/
│   │   └── User.js                     # User schema — callsign, email, password (hashed), role
│   ├── controllers/
│   │   └── authController.js           # register(), login() business logic
│   ├── routes/
│   │   └── auth.js                     # POST /api/auth/register, POST /api/auth/login
│   ├── middleware/
│   │   ├── validate.js                 # express-validator input rules per route
│   │   └── authMiddleware.js           # protect() — JWT verification for protected routes
│   └── utils/
│       └── token.js                    # signToken(), verifyToken() helpers
│
└── src/                                # React frontend
    ├── App.js                          # ChakraProvider + AnimatePresence + Routes
    ├── theme.js                        # Chakra UI dark theme (Inter font, #111111 bg)
    ├── index.js                        # React DOM entry point
    ├── styles/
    │   └── cardStyles.js               # Shared commonCard style object
    ├── contexts/
    │   └── AuthContext.js              # Auth state — fetch-based login/register, JWT, session restore
    └── components/
        ├── common/
        │   ├── Navigation.js           # Frosted-glass nav bar, route-aware active state
        │   ├── PageLayout.js           # Shared wrapper for static pages (nav + max-width container)
        │   └── SparkleQuote.js         # Hover sparkle animation component
        ├── auth/
        │   └── AuthForm.js             # Sign in / Register form with AnimatePresence transition
        ├── dashboard/
        │   ├── Dashboard.js            # Dashboard orchestrator
        │   ├── DashboardHeader.js      # Operator info + logout card
        │   └── TelemetryOverview.js    # Live telemetry stats card
        └── pages/
            ├── LandingLayout.js        # Landing page orchestrator (hero + auth panel)
            ├── LandingHero.js          # Left-side hero — title, tags, sparkle quote
            ├── LandingShapes.js        # 31 scattered decorative shapes across the landing page
            ├── About.js                # About page orchestrator
            ├── Operators.js            # Operators page orchestrator + team data array
            ├── Certifications.js       # Certifications page orchestrator + cert data array
            ├── about/
            │   ├── AboutIntro.js       # Heading + intro paragraphs
            │   ├── StrategicFramework.js # Strategic success framework highlight box
            │   ├── FeatureGrid.js      # Numbered feature cards (01-04) + Get Started CTA
            │   └── AboutShapes.js      # Full-height decorative side shapes (30 per side)
            ├── operators/
            │   ├── OperatorsIntro.js   # "Teamers" heading + description
            │   ├── OperatorCard.js     # GROUP-IB-style APT profile card
            │   └── OperatorShapes.js   # Full-height decorative side shapes (30 per side)
            └── certifications/
                ├── CertificationsIntro.js  # Heading + description
                ├── CertCard.js             # Badge card (image or styled placeholder)
                ├── CertShapes.js           # Full-height decorative side shapes (30 per side)
                └── ImprovementSection.js   # "Race for constant improvement" section + image
```

---

## Routes

### Frontend

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

Page transitions use `AnimatePresence mode="wait"` — each route fades and slides in. Sign In and Register share the same transition key (`"auth"`) so only the card animates internally when switching between them.

### Backend API

| Method | Endpoint              | Body                             | Description              |
|--------|-----------------------|----------------------------------|--------------------------|
| POST   | `/api/auth/register`  | `callsign, email, password`      | Create a new operator    |
| POST   | `/api/auth/login`     | `email, password`                | Login, returns JWT       |
| GET    | `/api/health`         | —                                | Server health check      |

All responses return `{ message }`. Login also returns `{ token, user }`.

---

## Auth Flow

```
Register
  → validate input (express-validator)
  → check email not already taken
  → hash password (bcrypt, 12 rounds)
  → save User to MongoDB
  → return success message

Login
  → validate input
  → find user by email (with password field)
  → compare password (bcrypt)
  → sign JWT (7 day expiry)
  → return { token, user }

Frontend
  → stores JWT + user in localStorage
  → restores session on page refresh (useEffect on mount)
  → sends Authorization: Bearer <token> header on protected requests
  → logout clears localStorage and resets state
```

---

## Database

- **MongoDB** — `red-team-ops-center` database, `users` collection
- **Mongoose** schema with pre-save hook for password hashing
- Password field is excluded from all queries by default (`select: false`)

### User Schema

| Field      | Type   | Required | Notes                        |
|------------|--------|----------|------------------------------|
| callsign   | String | Yes      | Operator display name        |
| email      | String | Yes      | Unique, lowercase, trimmed   |
| password   | String | Yes      | bcrypt hashed, never returned|
| role       | String | No       | `operator` (default), `admin`|
| createdAt  | Date   | Auto     | Mongoose timestamp           |
| updatedAt  | Date   | Auto     | Mongoose timestamp           |

---

## Environment Variables

Create `server/.env` (already gitignored):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/red-team-ops-center
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRES_IN=7d
```

---

## Tech Stack

### Frontend
| Package         | Version  | Purpose                              |
|-----------------|----------|--------------------------------------|
| React           | 18       | Component-based UI                   |
| Chakra UI       | ^2.8     | Dark-theme component library         |
| Framer Motion   | ^11.3    | Page + card transitions, sparkles    |
| React Router    | v6       | Client-side routing                  |
| @chakra-ui/icons| ^2.0     | Input icons, arrow icons             |

### Backend
| Package           | Version  | Purpose                            |
|-------------------|----------|------------------------------------|
| Express           | ^4.19    | HTTP server + routing              |
| Mongoose          | ^8.5     | MongoDB ODM + schema validation    |
| bcryptjs          | ^2.4     | Password hashing (12 rounds)       |
| jsonwebtoken      | ^9.0     | JWT sign + verify                  |
| express-validator | ^7.1     | Input validation middleware        |
| cors              | ^2.8     | Cross-origin requests from React   |
| dotenv            | ^16.4    | Environment variable loading       |
| nodemon           | ^3.1     | Auto-restart on file change (dev)  |

---

## Pages & Features

### Landing (Sign In / Register)
- Split layout: hero panel (left) + auth panel (right)
- Hero includes animated glowing tags: **STRUCTURE · PLANNING · TACTICS · COMMAND**
- Quote sparkles with gold/white 4-pointed stars on hover
- 31 decorative red geometric shapes scattered across the full page height
- Auth card transitions smoothly between Sign In and Register with slide + fade
- Frosted-glass navigation bar with active indicator dots and red glow on auth buttons

### About
- Intro section with team description
- Strategic Success Framework highlight box
- "Why choose Red Team Ops Center?" — 4 numbered feature cards with hover lift + red glow
- Get Started CTA button with red gradient, glow, and arrow icon
- Full-height decorative side shapes (30 per side)

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

Badge naming convention: lowercase cert title — `oscp.png`, `crto.png`, `cadpenx.png`.

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

## Adding New API Routes

1. Create a controller in `server/controllers/`
2. Create a route file in `server/routes/`
3. Mount it in [server/index.js](server/index.js):
   ```js
   app.use('/api/your-route', require('./routes/yourRoute'));
   ```
4. Use `protect` middleware for authenticated endpoints:
   ```js
   const { protect } = require('../middleware/authMiddleware');
   router.get('/me', protect, getMe);
   ```

## Adding New Dashboard Sections

1. Create a component in `src/components/dashboard/`
2. Import and render it in [src/components/dashboard/Dashboard.js](src/components/dashboard/Dashboard.js)

## Shared Styles

`commonCard` is defined once in [src/styles/cardStyles.js](src/styles/cardStyles.js):

```js
import { commonCard } from '../../styles/cardStyles';
```

## Decorative Side Shapes

Every page uses the same pattern — container stretches `top="0" bottom="0"`, shapes are positioned at `top: X%`:

- Copy any existing `*Shapes.js` and adjust the `leftShapes` array
- Right side mirrors automatically via `ml: 110 - s.ml`
- Only visible on `xl` screens
- All shapes use `rgba(252,129,129, ...)` — `red.200` at varying opacities
