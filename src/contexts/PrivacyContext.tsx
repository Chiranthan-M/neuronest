import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSettings } from "./SettingsContext";

interface PrivacyContextType {
  isSetup: boolean;
  isUnlocked: boolean;
  lockType: "pin" | "pattern" | null;
  setupLock: (type: "pin" | "pattern", value: string) => void;
  unlock: (value: string) => boolean;
  lock: () => void;
  resetLock: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

const PRIVACY_LOCK_KEY = "neuronest_privacy_lock";

interface StoredLock {
  type: "pin" | "pattern";
  hash: string;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [storedLock, setStoredLock] = useState<StoredLock | null>(() => {
    try {
      const stored = localStorage.getItem(PRIVACY_LOCK_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isSetup = storedLock !== null;
  const lockType = storedLock?.type ?? null;

  const setupLock = useCallback((type: "pin" | "pattern", value: string) => {
    const lock: StoredLock = { type, hash: simpleHash(value) };
    localStorage.setItem(PRIVACY_LOCK_KEY, JSON.stringify(lock));
    setStoredLock(lock);
    setIsUnlocked(true);
  }, []);

  const unlock = useCallback((value: string): boolean => {
    if (!storedLock) return false;
    if (simpleHash(value) === storedLock.hash) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, [storedLock]);

  const lock = useCallback(() => {
    setIsUnlocked(false);
  }, []);

  const resetLock = useCallback(() => {
    localStorage.removeItem(PRIVACY_LOCK_KEY);
    setStoredLock(null);
    setIsUnlocked(false);
  }, []);

  return (
    <PrivacyContext.Provider value={{ isSetup, isUnlocked, lockType, setupLock, unlock, lock, resetLock }}>
      <PrivacyAutoLock isUnlocked={isUnlocked} lock={lock} />
      {children}
    </PrivacyContext.Provider>
  );
}

/**
 * Watches route changes, tab visibility, and idle time to automatically
 * re-lock the private folder based on the user's `privacyAutoLock` setting.
 */
function PrivacyAutoLock({ isUnlocked, lock }: { isUnlocked: boolean; lock: () => void }) {
  const location = useLocation();
  const { settings } = useSettings();
  const lastPathRef = useRef<string>(location.pathname);
  const idleTimerRef = useRef<number | null>(null);

  // Lock immediately when leaving /private
  useEffect(() => {
    const wasOnPrivate = lastPathRef.current === "/private";
    const isOnPrivate = location.pathname === "/private";
    if (wasOnPrivate && !isOnPrivate && isUnlocked && settings.privacyAutoLock !== "never") {
      lock();
    }
    lastPathRef.current = location.pathname;
  }, [location.pathname, isUnlocked, lock, settings.privacyAutoLock]);

  // Lock when tab becomes hidden (background / minimised)
  useEffect(() => {
    if (!isUnlocked || settings.privacyAutoLock === "never") return;
    const onVis = () => {
      if (document.visibilityState === "hidden") lock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [isUnlocked, lock, settings.privacyAutoLock]);

  // Idle-based auto-lock while on /private
  useEffect(() => {
    if (!isUnlocked) return;
    if (settings.privacyAutoLock === "never" || settings.privacyAutoLock === "immediate") return;
    if (location.pathname !== "/private") return;

    const minutes = parseInt(settings.privacyAutoLock, 10);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    const ms = minutes * 60 * 1000;

    const reset = () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => lock(), ms);
    };
    const events: (keyof DocumentEventMap)[] = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => document.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => document.removeEventListener(e, reset));
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [isUnlocked, settings.privacyAutoLock, location.pathname, lock]);

  return null;
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used within PrivacyProvider");
  return ctx;
}
