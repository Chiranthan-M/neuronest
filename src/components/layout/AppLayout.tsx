import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full app-bg">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto scrollbar-thin pb-20 md:pb-0">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 page-enter">{children}</div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
