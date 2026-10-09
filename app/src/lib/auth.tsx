import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/auth-js";
import { db } from "./supabase";

export type Profile = { id: string; email: string; full_name: string; role: "student" | "teacher" | "admin"; is_admin: boolean };
type AuthState = { session: Session | null; profile: Profile | null; loading: boolean; refreshProfile: () => Promise<void> };

const AuthContext = createContext<AuthState>({ session: null, profile: null, loading: true, refreshProfile: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(s: Session | null) {
    if (!s) return setProfile(null);
    const { data } = await db().from("profiles").select("id, full_name, role, is_admin").eq("id", s.user.id).single();
    setProfile(data ? ({ ...data, email: s.user.email ?? "" } as Profile) : null);
  }

  useEffect(() => {
    db().auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });
    const { data: sub } = db().auth.onAuthStateChange((event, s) => {
      if (event === "TOKEN_REFRESHED") return setSession(s);
      setSession(s);
      // Defer: calling Supabase inside the callback can deadlock the auth lock.
      setTimeout(() => loadProfile(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile: () => loadProfile(session) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
