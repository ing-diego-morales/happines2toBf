import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { apiFetch } from "../services/api";
import { io } from "socket.io-client";

interface User {
  id: number;
  first_name: string;
  email: string;
  role: string;
  avatar?: string;
  lastConnection?: string;
  saldo: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>; 
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);

interface Props {
  children: ReactNode;
}

const socket = io(
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8081",
  {
    autoConnect: true,
    reconnection: true,
  },
);

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const handleSaldoActualizado = async ({ userId }: { userId: number }) => {
      if (!user || user.id !== userId) return;

      try {
        const data = await apiFetch("/api/auth/profile");
        const nuevoSaldo = parseFloat(data.saldo) || 0;

        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, saldo: nuevoSaldo };
          localStorage.setItem("user", JSON.stringify(updated));
          return updated;
        });
      } catch {

      }
    };

    socket.on("saldoActualizado", handleSaldoActualizado);

    return () => {
      socket.off("saldoActualizado", handleSaldoActualizado);
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await apiFetch("/api/auth/profile");
      setUser((prev) => {
        if (!prev) return prev;
        const updated: User = { ...prev, saldo: parseFloat(data.saldo) || 0 };
        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Error al refrescar usuario", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
