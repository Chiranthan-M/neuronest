import { useLocation, Link } from "react-router-dom";
import { LayoutDashboard, FileText, BookOpen, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, path: "/", label: "Home" },
  { icon: FileText, path: "/notes", label: "Notes" },
  { icon: Plus, path: "/notes?new=true", label: "New", isAction: true },
  { icon: BookOpen, path: "/notebooks", label: "Books" },
  { icon: Settings, path: "/settings", label: "Settings" },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
    >
      <div
        className="border-t border-border/20 px-1 sm:px-2"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 6px)',
          background: 'hsl(var(--glass-bg-strong))',
          backdropFilter: 'blur(var(--glass-blur-heavy)) saturate(1.8)',
          WebkitBackdropFilter: 'blur(var(--glass-blur-heavy)) saturate(1.8)',
          boxShadow: '0 -4px 24px -4px hsl(var(--glass-shadow)), inset 0 1px 0 hsl(var(--glass-highlight))',
        }}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path.split("?")[0]);

            if (item.isAction) {
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileTap={{ scale: 0.85, rotate: 90 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="relative w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glass -mt-4"
                  >
                    <item.icon className="w-5 h-5 text-primary-foreground" />
                    {/* Pulse ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl gradient-primary"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 min-w-[3.5rem] px-2 py-2 rounded-xl transition-colors active:bg-secondary/40",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <item.icon className="w-5 h-5" />
                </motion.div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-0.5 w-5 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
