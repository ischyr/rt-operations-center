import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

const API = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [authMessage, setAuthMessage] = useState('');
  const [isLoading, setIsLoading]     = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.clear(); }
    }
    setIsLoading(false);
  }, []);

  const register = async (callsign, email, password) => {
    try {
      const res  = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ callsign, email, password }),
      });
      const data = await res.json();
      setAuthMessage(data.message);
      return res.ok;
    } catch {
      setAuthMessage('Network error — is the server running?');
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setAuthMessage(data.message);
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user',  JSON.stringify(data.user));
        setUser(data.user);
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
        login,
        register,
        logout,
        clearMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
