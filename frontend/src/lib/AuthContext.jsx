import React, { createContext, useContext, useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = anon, object = admin
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("qm_token");
    if (!token) { setUser(false); return; }
    api.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => { localStorage.removeItem("qm_token"); setUser(false); });
  }, []);

  async function login(email, password) {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("qm_token", data.token);
      setUser(data.user);
      return true;
    } catch (e) {
      setError(formatApiErrorDetail(e.response?.data?.detail) || e.message);
      return false;
    }
  }

  async function logout() {
    try { await api.post("/auth/logout"); } catch (_) {}
    localStorage.removeItem("qm_token");
    setUser(false);
  }

  return (
    <AuthCtx.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
