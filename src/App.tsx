import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotesProvider } from "@/contexts/NotesContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PrivacyProvider } from "@/contexts/PrivacyContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Notes from "./pages/Notes";
import ArchivePage from "./pages/Archive";
import TrashPage from "./pages/Trash";
import PrivatePage from "./pages/Private";
import ProfilePage from "./pages/Profile";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotesProvider>
            <PrivacyProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="*" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/notes" element={<Notes />} />
                          <Route path="/archive" element={<ArchivePage />} />
                          <Route path="/trash" element={<TrashPage />} />
                          <Route path="/private" element={<PrivatePage />} />
                          <Route path="/profile" element={<ProfilePage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                </Routes>
              </BrowserRouter>
            </PrivacyProvider>
          </NotesProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
