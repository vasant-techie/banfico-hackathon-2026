import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { httpClient, setTokens, setOnRefreshFail } from '../lib/httpClient.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'fintech.tokens';

function loadStoredTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [tokens, setTokensState] = useState(() => loadStoredTokens());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTokens(tokens);
    if (tokens) localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(STORAGE_KEY);
  }, [tokens]);

  const logout = useCallback(() => {
    setTokensState(null);
  }, []);

  useEffect(() => {
    setOnRefreshFail(logout);
  }, [logout]);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await httpClient.post('/auth/login', { username, password });
      setTokensState(data);
      return data;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed. Check your credentials.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    isAuthenticated: Boolean(tokens?.access_token),
    login,
    logout,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
