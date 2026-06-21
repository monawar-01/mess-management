import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem("mess_token");
    const cached = localStorage.getItem("mess_user");
    if (token && cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {}
      // Re-validate token silently
      api.me()
        .then(u => {
          setUser(u);
          localStorage.setItem("mess_user", JSON.stringify(u));
        })
        .catch(() => {
          localStorage.removeItem("mess_token");
          localStorage.removeItem("mess_user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem("mess_token", data.token);
    localStorage.setItem("mess_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mess_token");
    localStorage.removeItem("mess_user");
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem("mess_user", JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
