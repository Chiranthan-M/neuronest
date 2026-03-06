import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotes } from "@/contexts/NotesContext";
import { Search, Moon, Sun, Bell, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Note } from "@/types/note";

export function TopBar() {
  const { user, isGuest, signOut } = useAuth();
  const { t } = useLanguage();
  const { notes } = useNotes();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== "undefined" ? document.documentElement.classList.contains("dark") : false
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user || isGuest) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setAvatarUrl(data.avatar_url);
        }
      });
  }, [user, isGuest]);

  const toggleDark = () => {
    document.documentElement.classList.add("transitioning");
    setDarkMode((d) => {
      if (!d) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return !d;
    });
    setTimeout(() => document.documentElement.classList.remove("transitioning"), 400);
  };

  const searchResults: Note[] = searchQuery.trim()
    ? notes
        .filter(
          (n) =>
            !n.isTrashed &&
            (n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
              n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))
        )
        .slice(0, 5)
    : [];

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : isGuest ? "G" : "U";

  return (
    <header className="sticky top-0 z-20 h-14 flex items-center gap-3 px-4 lg:px-8 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      {/* Search */}
      <div className="flex-1 flex items-center gap-3">
        <div className="relative max-w-md w-full">
          <motion.div
            className="relative"
            animate={{ width: searchOpen ? "100%" : "100%" }}
          >
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
              searchOpen ? "text-primary" : "text-muted-foreground"
            )} />
            <Input
              placeholder={t("searchNotes") + "..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              className="pl-9 h-9 bg-secondary/40 border-0 rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:bg-card transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchOpen && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-2 left-0 right-0 bg-card border border-border/50 rounded-xl shadow-elevated overflow-hidden z-50"
              >
                {searchResults.length > 0 ? (
                  searchResults.map((note) => (
                    <button
                      key={note.id}
                      onMouseDown={() => navigate("/notes")}
                      className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/20 last:border-0"
                    >
                      <p className="text-sm font-medium truncate">{note.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{note.content.slice(0, 60)}</p>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No results found
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme Toggle */}
        <motion.button
          whileTap={{ scale: 0.9, rotate: 180 }}
          transition={{ duration: 0.3 }}
          onClick={toggleDark}
          className="p-2 rounded-xl hover:bg-secondary/60 transition-colors"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={darkMode ? "dark" : "light"}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {darkMode ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Avatar className="w-8 h-8 border-2 border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass rounded-xl min-w-[180px]">
            <div className="px-3 py-2 border-b border-border/30">
              <p className="text-sm font-medium truncate">{displayName || (isGuest ? t("guest") : user?.email)}</p>
              {!isGuest && <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>}
            </div>
            {!isGuest && (
              <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-lg mt-1">
                {t("profileSettings")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-border/30" />
            <DropdownMenuItem onClick={signOut} className="text-destructive rounded-lg">
              {isGuest ? (t("exitGuest") || "Exit Guest") : t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
