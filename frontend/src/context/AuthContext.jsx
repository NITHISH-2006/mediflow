import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { unwrapEnvelope } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUser = async () => {
    const token = localStorage.getItem('mediflow_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const payload = unwrapEnvelope(response);
      setUser(payload?.data || payload);
    } catch {
      localStorage.removeItem('mediflow_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const envelope = unwrapEnvelope(response);
    const token = envelope?.data?.token || envelope?.token;
    const currentUser = envelope?.data?.user || envelope?.user;
    localStorage.setItem('mediflow_token', token);
    setUser(currentUser);
    return { token, user: currentUser };
  };

  const register = async (name, email, password, role) => {
    const response = await api.post('/auth/register', { name, email, password, role });
    const envelope = unwrapEnvelope(response);
    const token = envelope?.data?.token || envelope?.token;
    const currentUser = envelope?.data?.user || envelope?.user;
    if (token) {
      localStorage.setItem('mediflow_token', token);
      setUser(currentUser);
    }
    return { token, user: currentUser };
  };

  const logout = () => {
    localStorage.removeItem('mediflow_token');
    setUser(null);
    navigate('/login');
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
