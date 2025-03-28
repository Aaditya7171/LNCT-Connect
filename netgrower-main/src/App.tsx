
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";

import { Layout } from "./components/layout/Layout";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Forum from "./pages/Forum";
import Network from "./pages/Network";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/forum" element={<Layout><Forum /></Layout>} />
              <Route path="/messages" element={<Layout><Messages /></Layout>} />
              <Route path="/network" element={<Layout><Network /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
