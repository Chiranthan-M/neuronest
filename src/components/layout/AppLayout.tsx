import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { AnimatedBackground } from "@/components/animations/AnimatedBackground";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-[100dvh] h-screen w-full app-bg overflow-hidden">
      <AnimatedBackground />
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin pb-20 md:pb-0 overscroll-y-contain app-layout-main -webkit-overflow-scrolling-touch">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-10 xl:px-12 py-4 sm:py-5 md:py-6 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
