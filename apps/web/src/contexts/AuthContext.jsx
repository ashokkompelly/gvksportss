import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
const Auth = createContext();
export function AuthProvider({ children }) {
  const [user, updateUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  function setUser(value) {
    updateUser(value);
    setError('');
  }
  useEffect(() => {
    let live = true;
    let retry;
    async function refreshSession() {
      try {
        const result = await api('/auth/me');
        if (live) setUser(result.user);
      } catch (e) {
        if (live) {
          setError(e.message);
          retry = setTimeout(refreshSession, 30000);
        }
      } finally {
        if (live) setLoading(false);
      }
    }
    void refreshSession();
    return () => {
      live = false;
      clearTimeout(retry);
    };
  }, []);
  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  }
  return (
    <Auth.Provider value={{ user, setUser, loading, error, logout }}>{children}</Auth.Provider>
  );
}
export const useAuth = () => useContext(Auth);
