import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AppSettings {
  // General
  theme: "light" | "dark" | "system";
  autoSave: boolean;
  defaultNotebook: string;

  // Editor
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  pageStyle: "blank" | "ruled" | "grid";
  autoFormatting: boolean;
  spellCheck: boolean;

  // AI
  aiSuggestions: boolean;
  aiAutoCorrect: boolean;
  aiWritingHelp: boolean;

  // Voice
  voiceTyping: boolean;
  voiceLanguage: string;

  // Translation
  defaultTranslateLang: string;
  autoTranslate: boolean;
  liveTranslation: boolean;

  // Sync
  autoBackup: boolean;

  // Notifications
  reminderAlerts: boolean;
  updateNotifications: boolean;

  // Privacy
  dataProtection: boolean;
  aiPrivacyMode: boolean;
}

const defaultSettings: AppSettings = {
  theme: "system",
  autoSave: true,
  defaultNotebook: "General",

  fontFamily: "Inter",
  fontSize: 14,
  lineSpacing: 1.6,
  pageStyle: "blank",
  autoFormatting: true,
  spellCheck: true,

  aiSuggestions: true,
  aiAutoCorrect: true,
  aiWritingHelp: true,

  voiceTyping: true,
  voiceLanguage: "en-US",

  defaultTranslateLang: "en",
  autoTranslate: false,
  liveTranslation: false,

  autoBackup: true,

  reminderAlerts: true,
  updateNotifications: true,

  dataProtection: true,
  aiPrivacyMode: false,
};

const STORAGE_KEY = "neuronest_settings";

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultSettings };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...defaultSettings });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
