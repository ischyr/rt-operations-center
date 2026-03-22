import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeUser, setActiveUser] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [users, setUsers] = useState([]);

  const login = (email, password) => {
    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
      setIsLoggedIn(true);
      setActiveUser(user.name);
      setAuthMessage('Access granted. Welcome, ' + user.name + '.');
      return true;
    }
    setAuthMessage('Invalid credentials. Verify and retry.');
    return false;
  };

  const register = (name, email, password) => {
    if (!name || !email || !password) {
      setAuthMessage('All fields required.');
      return false;
    }
    if (users.some((u) => u.email === email)) {
      setAuthMessage('Email already registered.');
      return false;
    }
    setUsers((prev) => [...prev, { id: Date.now(), name, email, password }]);
    setAuthMessage('Operator enrolled. Login now.');
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setActiveUser('');
    setAuthMessage('Logged out securely.');
  };

  const clearMessage = () => {
    setAuthMessage('');
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        activeUser,
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