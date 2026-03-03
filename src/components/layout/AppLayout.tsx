import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full app-bg">
      <AppSidebar />
      <main className="flex-1 overflow-auto scrollbar-thin">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 page-enter">{children}</div>
      </main>
    </div>
  );
}
