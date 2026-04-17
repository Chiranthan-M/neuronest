import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotesProvider, useNotes } from "@/contexts/NotesContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PrivacyProvider } from "@/contexts/PrivacyContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { OnlineStatusBanner } from "@/components/layout/OnlineStatusBanner";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import Index from "./pages/Index";
import Notes from "./pages/Notes";
import NotebooksPage from "./pages/Notebooks";
import ArchivePage from "./pages/Archive";
import TrashPage from "./pages/Trash";
import PrivatePage from "./pages/Private";
import ProfilePage from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isGuest } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center app-bg">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!user && !isGuest) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function SyncBanner() {
  const { syncing } = useNotes();
  return <OnlineStatusBanner syncing={syncing} />;
}

function AppRoutes() {
  return (
    <>
      <SyncBanner />
      <CommandPalette />
      <KeyboardShortcuts />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout><Index /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/notes" element={
          <ProtectedRoute>
            <AppLayout><Notes /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/notebooks" element={
          <ProtectedRoute>
            <AppLayout><NotebooksPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/archive" element={
          <ProtectedRoute>
            <AppLayout><ArchivePage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/trash" element={
          <ProtectedRoute>
            <AppLayout><TrashPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/private" element={
          <ProtectedRoute>
            <AppLayout><PrivatePage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <AppLayout><ProfilePage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout><SettingsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotesProvider>
            <SettingsProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <PrivacyProvider>
                  <AppRoutes />
                </PrivacyProvider>
              </BrowserRouter>
            </SettingsProvider>
          </NotesProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
