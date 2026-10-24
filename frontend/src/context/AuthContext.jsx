import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../api.js';

const STORAGE_KEY = 'dealership-session';
const AuthContext = createContext(null);

const loadSession = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
};

/** Holds the logged-in user and token, persisted in localStorage. */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  const value = useMemo(() => {
    const saveSession = (next) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
    };

    return {
      user: session.user,
      token: session.token,
      login: async (email, password) => {
        saveSession(await api.login(email, password));
      },
      register: async (email, password) => {
        await api.register(email, password);
        saveSession(await api.login(email, password));
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setSession({ token: null, user: null });
      },
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
