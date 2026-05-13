import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hq_token');
    if (token) {
      api.auth.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('hq_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.auth.login({ email, password });
    localStorage.setItem('hq_token', token);
    setUser(user);
  };

  const register = async (username, email, password) => {
    const { token, user } = await api.auth.register({ username, email, password });
    localStorage.setItem('hq_token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('hq_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await api.auth.me();
    setUser(u);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
