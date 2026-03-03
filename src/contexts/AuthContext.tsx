import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  connectionError: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      console.warn(`[Auth] Retry ${i + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY));
    }
  }
  throw new Error("Unreachable");
}

function getReadableError(err: any): string {
  const msg = err?.message || String(err);
  if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("net::")) {
    return "Network error: Unable to reach the server. This may be caused by a browser extension, VPN, firewall, or unstable connection. Try disabling ad-blockers or privacy extensions and refresh.";
  }
  if (msg.includes("Invalid login")) return "Invalid email or password.";
  if (msg.includes("Email not confirmed")) return "Please confirm your email address first. Check your inbox.";
  if (msg.includes("rate limit") || msg.includes("429")) return "Too many attempts. Please wait a moment and try again.";
  return msg;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(() => {
    try {
      return localStorage.getItem("neuronest_guest") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setConnectionError(null);
      if (session?.user) {
        setIsGuest(false);
        try { localStorage.removeItem("neuronest_guest"); } catch {}
      }
      setLoading(false);
    });

    withRetry(() => supabase.auth.getSession())
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setConnectionError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[Auth] Failed to get session after retries:", err);
        setConnectionError(getReadableError(err));
        // Still allow app to load — guest mode will work
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const migrateGuestNotes = useCallback(async (userId: string) => {
    try {
      const raw = localStorage.getItem("neuronest_guest_notes");
      if (!raw) return;
      const guestNotes = JSON.parse(raw) as any[];
      if (guestNotes.length === 0) return;

      console.log(`[Auth] Migrating ${guestNotes.length} guest notes to user ${userId}`);
      const inserts = guestNotes.map(n => ({
        user_id: userId,
        title: n.title || "",
        content: n.content || "",
        tags: n.tags || [],
        category: n.category || "General",
        is_pinned: n.isPinned || false,
        is_archived: n.isArchived || false,
        is_private: n.isPrivate || false,
        is_trashed: n.isTrashed || false,
      }));

      const { error } = await supabase.from("notes").insert(inserts);
      if (error) {
        console.error("[Auth] Guest note migration error:", error);
      } else {
        localStorage.removeItem("neuronest_guest_notes");
        console.log("[Auth] Guest notes migrated successfully");
      }
    } catch (err) {
      console.error("[Auth] Guest note migration failed:", err);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const { data, error } = await withRetry(() =>
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        })
      );
      if (error) return { error: getReadableError(error) };
      // If auto-confirmed and user exists, migrate guest notes
      if (data?.user) {
        await migrateGuestNotes(data.user.id);
      }
      return { error: null };
    } catch (err: any) {
      console.error("[Auth] Sign up failed:", err);
      return { error: getReadableError(err) };
    }
  }, [migrateGuestNotes]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await withRetry(() =>
        supabase.auth.signInWithPassword({ email, password })
      );
      if (error) return { error: getReadableError(error) };
      setConnectionError(null);
      return { error: null };
    } catch (err: any) {
      console.error("[Auth] Sign in failed:", err);
      return { error: getReadableError(err) };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsGuest(false);
      localStorage.removeItem("neuronest_guest");
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error("[Auth] Sign out failed:", err);
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    setConnectionError(null);
    try { localStorage.setItem("neuronest_guest", "true"); } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isGuest, connectionError, signUp, signIn, signOut, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
