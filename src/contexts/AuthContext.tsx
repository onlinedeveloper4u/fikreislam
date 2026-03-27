'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getUserSession, signUp as serverSignUp, signIn as serverSignIn, signOut as serverSignOut } from "@/actions/auth";

type AppRole = 'admin' | 'user';

interface User {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  session: any | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ session: any | null, error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const payload = await getUserSession();
      if (payload) {
        setUser({ id: payload.userId as string, email: payload.email as string });
        setRole(payload.role as AppRole);
        setSession(payload);
      } else {
        setUser(null);
        setRole(null);
        setSession(null);
      }
      setLoading(false);
    }
    loadSession();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const res = await serverSignUp(email, password, fullName);
    if (!res.error) {
      const payload = await getUserSession();
      if (payload) {
        setUser({ id: payload.userId as string, email: payload.email as string });
        setRole(payload.role as AppRole);
        setSession(payload);
      }
    }
    return res;
  };

  const signIn = async (email: string, password: string) => {
    const res = await serverSignIn(email, password);
    if (!res.error) {
      const payload = await getUserSession();
      if (payload) {
        setUser({ id: payload.userId as string, email: payload.email as string });
        setRole(payload.role as AppRole);
        setSession(payload);
      }
    }
    return res;
  };

  const signOut = async () => {
    await serverSignOut();
    setUser(null);
    setRole(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
