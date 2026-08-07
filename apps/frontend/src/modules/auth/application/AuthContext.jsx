import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from "../infrastructure/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => { const result = await loginRequest(credentials); setUser(result.user); return result.user; };
  const register = async (data) => { const result = await registerRequest(data); setUser(result.user); return result.user; };
  const logout = async () => { await logoutRequest(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
