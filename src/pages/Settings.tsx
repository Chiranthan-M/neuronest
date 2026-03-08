import { useState } from "react";
import { useSettings, AppSettings } from "@/contexts/SettingsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Settings as SettingsIcon,
  Palette,
  Type,
  Sparkles,
  Mic,
  Languages,
  Cloud,
  Bell,
  Shield,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

const categories = [
  { id: "general", label: "General", icon: Palette },
  { id: "editor", label: "Editor", icon: Type },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
  { id: "voice", label: "Voice / Mic", icon: Mic },
  { id: "translation", label: "Translation", icon: Languages },
  { id: "sync", label: "Sync & Backup", icon: Cloud },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
] as const;

type CategoryId = typeof categories[number]["id"];

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-border/20 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<CategoryId>("general");

  const renderContent = () => {
    switch (activeCategory) {
      case "general":
        return (
          <>
            <SettingRow label="App Theme" description="Choose between light, dark, or system theme">
              <Select value={settings.theme} onValueChange={(v) => updateSetting("theme", v as AppSettings["theme"])}>
                <SelectTrigger className="w-32 h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="glass rounded-xl">
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Auto-Save" description="Automatically save notes while editing">
              <Switch checked={settings.autoSave} onCheckedChange={(v) => updateSetting("autoSave", v)} />
            </SettingRow>
            <SettingRow label="Default Notebook" description="New notes will be created in this notebook">
              <Select value={settings.defaultNotebook} onValueChange={(v) => updateSetting("defaultNotebook", v)}>
                <SelectTrigger className="w-32 h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="glass rounded-xl">
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Projects">Projects</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </>
        );
      case "editor":
        return (
          <>
            <SettingRow label="Font Family" description="Choose the editor font">
              <Select value={settings.fontFamily} onValueChange={(v) => updateSetting("fontFamily", v)}>
                <SelectTrigger className="w-32 h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="glass rounded-xl">
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Menlo">Menlo</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Font Size" description={`${settings.fontSize}px`}>
              <div className="w-32">
                <Slider value={[settings.fontSize]} min={12} max={24} step={1} onValueChange={([v]) => updateSetting("fontSize", v)} />
              </div>
            </SettingRow>
            <SettingRow label="Line Spacing" description={`${settings.lineSpacing}x`}>
              <div className="w-32">
                <Slider value={[settings.lineSpacing]} min={1} max={2.5} step={0.1} onValueChange={([v]) => updateSetting("lineSpacing", v)} />
              </div>
            </SettingRow>
            <SettingRow label="Page Style" description="Editor background style">
              <Select value={settings.pageStyle} onValueChange={(v) => updateSetting("pageStyle", v as AppSettings["pageStyle"])}>
                <SelectTrigger className="w-32 h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="glass rounded-xl">
                  <SelectItem value="blank">Blank</SelectItem>
                  <SelectItem value="ruled">Ruled</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Auto Formatting" description="Automatically format text while typing">
              <Switch checked={settings.autoFormatting} onCheckedChange={(v) => updateSetting("autoFormatting", v)} />
            </SettingRow>
            <SettingRow label="Spell Check" description="Highlight spelling errors">
              <Switch checked={settings.spellCheck} onCheckedChange={(v) => updateSetting("spellCheck", v)} />
            </SettingRow>
          </>
        );
      case "ai":
        return (
          <>
            <SettingRow label="AI Suggestions" description="Show AI-powered suggestions while writing">
              <Switch checked={settings.aiSuggestions} onCheckedChange={(v) => updateSetting("aiSuggestions", v)} />
            </SettingRow>
            <SettingRow label="Auto-Correct" description="Automatically correct grammar and spelling">
              <Switch checked={settings.aiAutoCorrect} onCheckedChange={(v) => updateSetting("aiAutoCorrect", v)} />
            </SettingRow>
            <SettingRow label="AI Writing Help" description="Enable AI writing assistant toolbar">
              <Switch checked={settings.aiWritingHelp} onCheckedChange={(v) => updateSetting("aiWritingHelp", v)} />
            </SettingRow>
          </>
        );
      case "voice":
        return (
          <>
            <SettingRow label="Voice Typing" description="Enable microphone dictation in the editor">
              <Switch checked={settings.voiceTyping} onCheckedChange={(v) => updateSetting("voiceTyping", v)} />
            </SettingRow>
            <SettingRow label="Voice Language" description="Language for speech recognition">
              <Select value={settings.voiceLanguage} onValueChange={(v) => updateSetting("voiceLanguage", v)}>
                <SelectTrigger className="w-32 h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="glass rounded-xl">
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                  <SelectItem value="hi-IN">Hindi</SelectItem>
                  <SelectItem value="kn-IN">Kannada</SelectItem>
                  <SelectItem value="te-IN">Telugu</SelectItem>
                  <SelectItem value="ta-IN">Tamil</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </>
        );
      case "translation":
        return (
          <>
            <SettingRow label="Default Language" description="Default target language for translations">
              <Select value={settings.defaultTranslateLang} onValueChange={(v) => updateSetting("defaultTranslateLang", v)}>
                <SelectTrigger className="w-32 h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="glass rounded-xl">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="kn">Kannada</SelectItem>
                  <SelectItem value="te">Telugu</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Auto Translate" description="Automatically translate notes when opened">
              <Switch checked={settings.autoTranslate} onCheckedChange={(v) => updateSetting("autoTranslate", v)} />
            </SettingRow>
            <SettingRow label="Live Translation" description="Real-time translation as you type">
              <Switch checked={settings.liveTranslation} onCheckedChange={(v) => updateSetting("liveTranslation", v)} />
            </SettingRow>
          </>
        );
      case "sync":
        return (
          <>
            <SettingRow label="Auto Backup" description="Automatically back up notes to the cloud">
              <Switch checked={settings.autoBackup} onCheckedChange={(v) => updateSetting("autoBackup", v)} />
            </SettingRow>
          </>
        );
      case "notifications":
        return (
          <>
            <SettingRow label="Reminder Alerts" description="Receive alerts for note reminders">
              <Switch checked={settings.reminderAlerts} onCheckedChange={(v) => updateSetting("reminderAlerts", v)} />
            </SettingRow>
            <SettingRow label="Update Notifications" description="Get notified about app updates">
              <Switch checked={settings.updateNotifications} onCheckedChange={(v) => updateSetting("updateNotifications", v)} />
            </SettingRow>
          </>
        );
      case "privacy":
        return (
          <>
            <SettingRow label="Data Protection" description="Enhanced data protection for your notes">
              <Switch checked={settings.dataProtection} onCheckedChange={(v) => updateSetting("dataProtection", v)} />
            </SettingRow>
            <SettingRow label="AI Privacy Mode" description="Process AI requests with enhanced privacy">
              <Switch checked={settings.aiPrivacyMode} onCheckedChange={(v) => updateSetting("aiPrivacyMode", v)} />
            </SettingRow>
          </>
        );
    }
  };

  const activeCat = categories.find(c => c.id === activeCategory)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="section-header-icon">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Customize your NeuroNest experience</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetSettings}
          className="rounded-xl border-border/50 text-xs gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </Button>
      </div>

      {/* Split layout */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Category sidebar */}
        <div className="md:w-56 flex-shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-thin">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <cat.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{cat.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto hidden md:block" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6 shadow-premium"
            >
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/30">
                <activeCat.icon className="w-4.5 h-4.5 text-primary" />
                <h2 className="font-semibold text-base">{activeCat.label}</h2>
              </div>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
