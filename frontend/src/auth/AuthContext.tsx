import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";

export type Role = "TEACHER" | "STUDENT";
export type User = { id: string; name: string; email: string; role: Role };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; role: Role }) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from a stored token on first load.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const persist = (data: { token: string; user: User }) => {
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const r = await api.post("/auth/login", { email, password });
    persist(r.data);
    return r.data.user as User;
  };

  const register = async (data: { name: string; email: string; password: string; role: Role }) => {
    const r = await api.post("/auth/register", data);
    persist(r.data);
    return r.data.user as User;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
