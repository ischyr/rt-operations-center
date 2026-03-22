import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  AppBar,
  Toolbar,
  Container,
  Grid,
  Chip,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import './App.css';

function App() {
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeUser, setActiveUser] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [users, setUsers] = useState([]);

  const isDark = theme === 'dark';

  const pageStyles = useMemo(
    () => ({
      minHeight: '100vh',
      background: isDark ? 'radial-gradient(circle at 20% 20%, #2f1127, #05070f 45%, #02040a)' : '#f4f6f8',
      color: isDark ? '#e5e7eb' : '#111827',
    }),
    [isDark],
  );

  const handleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const handleChange = (e, type) => {
    const { name, value } = e.target;
    if (type === 'login') setLoginData((prev) => ({ ...prev, [name]: value }));
    if (type === 'register') setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find((u) => u.email === loginData.email && u.password === loginData.password);
    if (user) {
      setIsLoggedIn(true);
      setActiveUser(user.name);
      setAuthMessage('Access granted, agent ' + user.name + '.');
      return;
    }
    setAuthMessage('Invalid credentials. Please verify and try again.');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!registerData.name || !registerData.email || !registerData.password) {
      setAuthMessage('All fields are required.');
      return;
    }
    if (users.find((u) => u.email === registerData.email)) {
      setAuthMessage('A profile with this email already exists.');
      return;
    }

    const newUser = {
      id: Date.now(),
      name: registerData.name,
      email: registerData.email,
      password: registerData.password,
    };
    setUsers((prev) => [...prev, newUser]);
    setRegisterData({ name: '', email: '', password: '' });
    setView('login');
    setAuthMessage('Profile created. Please log in.');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveUser('');
    setLoginData({ email: '', password: '' });
    setAuthMessage('You have logged out.');
  };

  return (
    <Box sx={pageStyles}>
      <AppBar position="static" color={isDark ? 'primary' : 'default'} sx={{ background: isDark ? '#151a30' : '#ffffff' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon sx={{ color: '#f43f5e' }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              Operations Center
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={isDark} onChange={handleTheme} color="secondary" />}
            label={isDark ? 'Dark' : 'Light'}
            sx={{ color: isDark ? '#fb7185' : '#ef4444' }}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 6 }}>
        {isLoggedIn ? (
          <Card sx={{ borderRadius: 3, boxShadow: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)' }}>
            <CardContent sx={{ backgroundColor: isDark ? 'rgba(15,23,42,.8)' : '#ffffff' }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Secure Agent Dashboard
              </Typography>
              <Typography color="text.secondary" mb={2}>
                Logged in as <strong>{activeUser}</strong>
              </Typography>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ backgroundColor: isDark ? 'rgba(22,28,45,.65)' : '#f8fafc' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="secondary" gutterBottom>
                        Mission Status
                      </Typography>
                      <Typography variant="h6">Active</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ backgroundColor: isDark ? 'rgba(22,28,45,.65)' : '#f8fafc' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="secondary" gutterBottom>
                        Threat Intel
                      </Typography>
                      <Typography variant="h6">Low Priority</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Button variant="contained" color="error" fullWidth onClick={handleLogout}>
                Logout
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ borderRadius: 3, boxShadow: 12, backgroundColor: isDark ? 'rgba(15,23,42,.8)' : '#fff', border: '1px solid rgba(255,255,255,.14)' }}>
            <CardContent>
              <Box mb={2}>
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                  {view === 'login' ? 'Agent Login' : 'Operator Enrollment'}
                </Typography>
                <Typography color="text.secondary" fontSize={13}>
                  {view === 'login'
                    ? 'Authenticate to enter the red team operations system.'
                    : 'Create a red team operator profile.'}
                </Typography>
              </Box>

              {authMessage && (
                <Alert severity={authMessage.startsWith('Profile') || authMessage.startsWith('Access') ? 'success' : 'warning'} sx={{ mb: 2 }}>
                  {authMessage}
                </Alert>
              )}

              <Box component="form" onSubmit={view === 'login' ? handleLogin : handleRegister}>
                {view === 'register' && (
                  <TextField
                    label="Call-sign"
                    name="name"
                    value={registerData.name}
                    onChange={(e) => handleChange(e, 'register')}
                    fullWidth
                    margin="normal"
                    required
                  />
                )}

                <TextField
                  label="Email"
                  type="email"
                  name="email"
                  value={view === 'login' ? loginData.email : registerData.email}
                  onChange={(e) => handleChange(e, view)}
                  fullWidth
                  margin="normal"
                  required
                />

                <TextField
                  label="Password"
                  type="password"
                  name="password"
                  value={view === 'login' ? loginData.password : registerData.password}
                  onChange={(e) => handleChange(e, view)}
                  fullWidth
                  margin="normal"
                  required
                />

                <Button type="submit" variant="contained" color="error" fullWidth sx={{ mt: 2, mb: 1 }}>
                  {view === 'login' ? 'Sign In' : 'Register'}
                </Button>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(148, 163, 184, 0.3)' }}>
                <Chip label="Or" />
              </Divider>

              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={() => {
                  setView(view === 'login' ? 'register' : 'login');
                  setAuthMessage('');
                }}
              >
                {view === 'login' ? 'Create New Operator' : 'Back to Login'}
              </Button>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}

export default App;



