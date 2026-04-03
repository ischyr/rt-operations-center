require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const session  = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/db');

const app = express();

connectDB();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));

// Session needed only for the OAuth redirect dance (not used for API auth)
app.use(session({
  secret:            process.env.SESSION_SECRET || 'redteam-session-secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false, maxAge: 5 * 60 * 1000 }, // 5 min — just long enough for OAuth
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/engagements', require('./routes/engagements'));
app.use('/api/cve',        require('./routes/cve'));
app.use('/api/diagrams',   require('./routes/diagrams'));
app.use('/api/oauth',      require('./routes/oauth'));
app.use('/api/tools',      require('./routes/tools'));
app.use('/api/c2',         require('./routes/c2'));
app.use('/api/leakx',      require('./routes/leakx'));
app.use('/api/subdomains', require('./routes/subdomains'));
app.use('/api/loot',      require('./routes/loot'));
app.use('/api/evidence',  require('./routes/evidence'));
app.use('/api/ransom',      require('./routes/ransom'));
app.use('/api/emailleaks', require('./routes/emailleaks'));
app.use('/api/malware',   require('./routes/malware'));
app.use('/api/cleanup',   require('./routes/cleanup'));
app.use('/api/vault',    require('./routes/vault'));
app.use('/api/qr',      require('./routes/qr'));
app.use('/api/phishing', require('./routes/phishing'));
app.use('/api/portal',  require('./routes/portal'));
app.use('/api/recon',   require('./routes/recon'));
app.use('/api/emails',     require('./routes/emails'));
app.use('/api/documents',      require('./routes/documents'));
app.use('/api/assumed-breach', require('./routes/assumedBreach'));
app.use('/api/file-meta',     require('./routes/fileMeta'));
app.use('/api/domain-cat',    require('./routes/domainCat'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/device-code',   require('./routes/deviceCode'));
app.use('/api/pass-cookie',   require('./routes/passCookie'));
app.use('/api/evil-oauth',    require('./routes/evilOAuth'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
