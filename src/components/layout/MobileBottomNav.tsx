import { useLocation, Link } from "react-router-dom";
import { LayoutDashboard, FileText, BookOpen, Lock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, path: "/", label: "Home" },
  { icon: FileText, path: "/notes", label: "Notes" },
  { icon: Plus, path: "/notes?new=true", label: "New", isAction: true },
  { icon: BookOpen, path: "/notebooks", label: "Books" },
  { icon: Lock, path: "/private", label: "Private" },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div
          className="border-t border-border/20 px-2"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 4px)',
            background: 'hsl(var(--glass-bg-strong))',
            backdropFilter: 'blur(var(--glass-blur-heavy)) saturate(1.8)',
            WebkitBackdropFilter: 'blur(var(--glass-blur-heavy)) saturate(1.8)',
            boxShadow: '0 -4px 24px -4px hsl(var(--glass-shadow)), inset 0 1px 0 hsl(var(--glass-highlight))',
          }}
        >
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path.split("?")[0]);

            if (item.isAction) {
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center shadow-glass -mt-3"
                  >
                    <item.icon className="w-5 h-5 text-primary-foreground" />
                  </motion.div>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute bottom-1 w-4 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
