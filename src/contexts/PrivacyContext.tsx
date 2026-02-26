import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

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
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used within PrivacyProvider");
  return ctx;
}
