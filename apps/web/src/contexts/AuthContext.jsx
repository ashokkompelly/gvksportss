import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
const Auth = createContext();
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  useEffect(() => {
    api('/auth/me')
      .then((r) => setUser(r.user))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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
