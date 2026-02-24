import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotesProvider } from "@/contexts/NotesContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Notes from "./pages/Notes";
import ArchivePage from "./pages/Archive";
import TrashPage from "./pages/Trash";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NotesProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/trash" element={<TrashPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </NotesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
