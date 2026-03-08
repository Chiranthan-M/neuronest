import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Archive,
  Trash2,
  Lock,
  Plus,
  BookOpen,
  ChevronLeft,
  Globe,
  LogOut,
  User,
  UserRound,
  Star,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth < 1024;
    return false;
  });
  const { t, language, setLanguage } = useLanguage();
  const { signOut, user, isGuest } = useAuth();

  const navItems = [
    { title: t("dashboard"), url: "/", icon: LayoutDashboard },
    { title: t("allNotes"), url: "/notes", icon: FileText },
    { title: t("notebooks"), url: "/notebooks", icon: BookOpen },
    { title: t("privateFolder"), url: "/private", icon: Lock },
    { title: t("archive"), url: "/archive", icon: Archive },
    { title: t("trash"), url: "/trash", icon: Trash2 },
  ];

  const SidebarButton = ({ icon: Icon, label, onClick, className, destructive }: {
    icon: any; label: string; onClick?: () => void; className?: string; destructive?: boolean;
  }) => {
    const btn = (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200",
          destructive
            ? "text-destructive hover:bg-destructive/8"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
          collapsed && "justify-center px-0",
          className
        )}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        {!collapsed && <span>{label}</span>}
      </button>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return btn;
  };

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex-col border-r border-border/20 transition-all duration-300 ease-out z-30 scrollbar-thin overflow-y-auto hidden md:flex",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
      style={{
        background: 'hsl(var(--glass-bg-strong))',
        backdropFilter: 'blur(var(--glass-blur-heavy)) saturate(1.8)',
        WebkitBackdropFilter: 'blur(var(--glass-blur-heavy)) saturate(1.8)',
        borderRight: '1px solid hsl(var(--glass-border))',
        boxShadow: '4px 0 24px -4px hsl(var(--glass-shadow)), inset -1px 0 0 hsl(var(--glass-highlight))',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border/30 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glass">
          <BookOpen className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in min-w-0">
            <h1 className="font-bold text-sm tracking-tight truncate">NeuroNest</h1>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-secondary/60 transition-colors flex-shrink-0"
        >
          <ChevronLeft className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* New Note */}
      <div className="px-3 pt-4 pb-1 flex-shrink-0">
        <Link to="/notes?new=true">
          <Button
            className={cn(
              "w-full gradient-primary text-primary-foreground shadow-glass transition-all hover:opacity-90 hover:shadow-glass-lg rounded-xl ripple-btn h-9 text-sm",
              collapsed ? "px-0" : ""
            )}
            size={collapsed ? "icon" : "default"}
          >
            <Plus className="w-4 h-4" />
            {!collapsed && <span className="ml-1.5 font-medium">{t("newNote")}</span>}
          </Button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const link = (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                collapsed && "justify-center px-0"
              )}
              activeClassName="nav-active-glow text-primary hover:text-primary"
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span className="animate-fade-in">{item.title}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.url} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{item.title}</TooltipContent>
              </Tooltip>
            );
          }
          return link;
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-0.5 flex-shrink-0 border-t border-border/30 pt-3">
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate flex items-center gap-2.5 mb-1">
            {isGuest ? (
              <>
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <UserRound className="w-3 h-3" />
                </div>
                {t("guest") || "Guest"}
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-primary" />
                </div>
                <span className="truncate font-medium">{user?.email}</span>
              </>
            )}
          </div>
        )}

        {isGuest && !collapsed && (
          <Link to="/auth">
            <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium w-full transition-all duration-200 text-primary hover:bg-primary/8">
              <User className="w-[18px] h-[18px]" />
              <span>{t("signUpForMore") || "Sign up for more"}</span>
            </button>
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div>
              <SidebarButton icon={Globe} label={languageNames[language]} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="glass rounded-xl">
            {(Object.keys(languageNames) as Language[]).map((lang) => (
              <DropdownMenuItem
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn("rounded-lg", language === lang && "text-primary font-semibold")}
              >
                {languageNames[lang]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <SidebarButton
          icon={LogOut}
          label={isGuest ? (t("exitGuest") || "Exit Guest") : t("signOut")}
          onClick={signOut}
          destructive
        />
      </div>
    </aside>
  );
}
