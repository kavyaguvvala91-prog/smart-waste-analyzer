import { createContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginUser, registerUser, setAuthToken as setApiAuthToken, updateUserProfile } from '../services/api';

const STORAGE_KEY = 'smart-waste-auth';

export const AuthContext = createContext(null);

const readStoredAuth = () => {
  if (typeof window === 'undefined') return { token: null, user: null };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || null,
      user: parsed.user || null,
    };
  } catch {
    return { token: null, user: null };
  }
};

const ecoLevelFromPoints = (points = 0) => {
  const value = Number(points || 0);
  if (value >= 300) return { label: 'Sustainability Champion', icon: '🌍' };
  if (value >= 100) return { label: 'Green Guardian', icon: '♻' };
  return { label: 'Eco Starter', icon: '🌱' };
};

export function AuthProvider({ children }) {
  const initial = readStoredAuth();
  const [token, setToken] = useState(initial.token);
  const [user, setUser] = useState(initial.user);
  const [isHydrating, setIsHydrating] = useState(Boolean(initial.token));
  const [authModal, setAuthModal] = useState({
    open: false,
    mode: 'choice',
    redirectTo: null,
    message: 'Please sign in or create an account to continue.',
  });

  useEffect(() => {
    setApiAuthToken(token);
  }, [token]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (token && user) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Best effort persistence.
    }
  }, [token, user]);

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setIsHydrating(false);
        return;
      }

      try {
        const response = await fetchCurrentUser();
        setUser(response.user);
      } catch {
        setToken(null);
        setUser(null);
        setApiAuthToken(null);
      } finally {
        setIsHydrating(false);
      }
    };

    hydrate();
  }, [token]);

  const syncAuth = (payload) => {
    if (!payload?.token || !payload?.user) return;
    setToken(payload.token);
    setUser(payload.user);
    setApiAuthToken(payload.token);
  };

  const openAuthModal = (mode = 'choice', redirectTo = null) => {
    setAuthModal({
      open: true,
      mode,
      redirectTo,
      message: 'Please sign in or create an account to continue.',
    });
  };

  const closeAuthModal = () => {
    setAuthModal((current) => ({ ...current, open: false, mode: 'choice', redirectTo: null }));
  };

  const login = async (payload) => {
    const response = await loginUser(payload);
    syncAuth(response);
    return response;
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
    syncAuth(response);
    return response;
  };

  const updateProfile = async (payload) => {
    const response = await updateUserProfile(payload);
    if (response?.user) {
      setUser(response.user);
    }
    return response;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setApiAuthToken(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('smart-waste-analyzer-state');
      window.dispatchEvent(new CustomEvent('smart-waste-reset'));
    }
    closeAuthModal();
  };

  const ensureAuth = (options = {}) => {
    if (user) return true;
    openAuthModal(options.mode || 'choice', options.redirectTo || null);
    return false;
  };

  const value = useMemo(() => ({
    token,
    user,
    isHydrating,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    ecoLevel: ecoLevelFromPoints(user?.points || 0),
    authModal,
    openAuthModal,
    closeAuthModal,
    ensureAuth,
    login,
    register,
    logout,
    updateProfile,
    setUser,
  }), [authModal, isHydrating, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
