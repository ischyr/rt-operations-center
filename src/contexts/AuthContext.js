import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

const API = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user,             setUser]             = useState(null);
  const [authMessage,      setAuthMessage]      = useState('');
  const [isLoading,        setIsLoading]        = useState(true);
  // 2FA transient state — ephemeral, never persisted
  const [pendingTempToken, setPendingTempToken] = useState(null);
  const [pendingQrData,    setPendingQrData]    = useState(null); // { qrCode, tempSecret, email }

  // Restore session from localStorage on mount
  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.clear(); }
    }
    setIsLoading(false);
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  // Returns 'qr' on success (frontend should show QR setup step)
  // Returns false on error
  const register = async (callsign, email, password) => {
    try {
      const res  = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ callsign, email, password }),
      });
      const data = await res.json();
      setAuthMessage(data.message);
      if (res.ok) {
        setPendingQrData({ qrCode: data.qrCode, tempSecret: data.tempSecret, email: data.email });
        return 'qr';
      }
      return false;
    } catch {
      setAuthMessage('Network error — is the server running?');
      return false;
    }
  };

  // ── Confirm 2FA setup ──────────────────────────────────────────────────────
  // Called after user scans QR and enters their first OTP.
  // On success, issues a full session and logs the user in.
  const confirmSetup = async (email, totpCode) => {
    try {
      const res  = await fetch(`${API}/auth/confirm-2fa-setup`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, token: totpCode }),
      });
      const data = await res.json();
      setAuthMessage(data.message);
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user',  JSON.stringify(data.user));
        setUser(data.user);
        setPendingQrData(null);
        return true;
      }
      return false;
    } catch {
      setAuthMessage('Network error — is the server running?');
      return false;
    }
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  // Returns 'qr'    → setup was never completed, pendingQrData is set
  // Returns '2fa'   → 2FA enabled, pendingTempToken is set
  // Returns true    → fully authenticated (legacy no-2FA path)
  // Returns false   → error
  const login = async (email, password) => {
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setAuthMessage(data.message || '');

      if (!res.ok) return false;

      if (data.requiresSetup) {
        setPendingQrData({ qrCode: data.qrCode, tempSecret: data.tempSecret, email: data.email });
        return 'qr';
      }
      if (data.requires2FA) {
        setPendingTempToken(data.tempToken);
        return '2fa';
      }

      // Legacy / no-2FA path
      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch {
      setAuthMessage('Network error — is the server running?');
      return false;
    }
  };

  // ── Verify 2FA (login step 2) ──────────────────────────────────────────────
  const verify2FA = async (totpCode) => {
    try {
      const res  = await fetch(`${API}/auth/verify-2fa`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tempToken: pendingTempToken, token: totpCode }),
      });
      const data = await res.json();
      setAuthMessage(data.message);
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user',  JSON.stringify(data.user));
        setUser(data.user);
        setPendingTempToken(null);
        return true;
      }
      return false;
    } catch {
      setAuthMessage('Network error — is the server running?');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPendingTempToken(null);
    setPendingQrData(null);
    setAuthMessage('');
  };

  const clearMessage = () => setAuthMessage('');

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        authMessage,
        pendingTempToken,
        pendingQrData,
        login,
        register,
        logout,
        confirmSetup,
        verify2FA,
        clearMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
