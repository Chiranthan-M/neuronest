import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Archive,
  Trash2,
  Lock,
  Plus,
  Moon,
  Sun,
  BookOpen,
  ChevronLeft,
  Globe,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Language, languageNames } from "@/i18n/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const { t, language, setLanguage } = useLanguage();
  const { signOut, user } = useAuth();

  const navItems = [
    { title: t("dashboard"), url: "/", icon: LayoutDashboard },
    { title: t("allNotes"), url: "/notes", icon: FileText },
    { title: t("privateFolder"), url: "/private", icon: Lock },
    { title: t("archive"), url: "/archive", icon: Archive },
    { title: t("trash"), url: "/trash", icon: Trash2 },
  ];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col border-r border-border/50 glass transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-sm tracking-tight">NeuroNest</h1>
            <p className="text-[10px] text-muted-foreground">{t("smartKnowledgeHub")}</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-md hover:bg-secondary transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 text-muted-foreground transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* New Note Button */}
      <div className="px-3 pt-4 pb-2">
        <Link to="/notes?new=true">
          <Button
            className={cn(
              "w-full gradient-primary text-primary-foreground shadow-glass transition-all hover:opacity-90",
              collapsed ? "px-0" : ""
            )}
            size={collapsed ? "icon" : "default"}
          >
            <Plus className="w-4 h-4" />
            {!collapsed && <span className="ml-2">{t("newNote")}</span>}
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
              collapsed && "justify-center px-0"
            )}
            activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="animate-fade-in">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-1">
        {/* User info */}
        {!collapsed && user && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {user.email}
          </div>
        )}

        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200",
                "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
                collapsed && "justify-center px-0"
              )}
            >
              <Globe className="w-4 h-4" />
              {!collapsed && <span>{languageNames[language]}</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="glass">
            {(Object.keys(languageNames) as Language[]).map((lang) => (
              <DropdownMenuItem
                key={lang}
                onClick={() => setLanguage(lang)}
                className={language === lang ? "text-primary font-semibold" : ""}
              >
                {languageNames[lang]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
            collapsed && "justify-center px-0"
          )}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && <span>{darkMode ? t("lightMode") : t("darkMode")}</span>}
        </button>

        <Link to="/profile">
          <button
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200",
              "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
              collapsed && "justify-center px-0"
            )}
          >
            <User className="w-4 h-4" />
            {!collapsed && <span>{t("profileSettings")}</span>}
          </button>
        </Link>

        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200",
            "text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>{t("signOut")}</span>}
        </button>
      </div>
    </aside>
  );
}
