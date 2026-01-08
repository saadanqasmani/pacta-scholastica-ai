import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UniversityProvider } from "@/contexts/UniversityContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Partners from "./pages/Partners";
import Mobility from "./pages/Mobility";
import MOUManagement from "./pages/MOUManagement";
import PartnershipManagement from "./pages/PartnershipManagement";
import MarketIntelligence from "./pages/MarketIntelligence";
import Auth from "./pages/Auth";
import RegisterUniversity from "./pages/RegisterUniversity";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <UniversityProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/register-university" element={<RegisterUniversity />} />
                <Route path="/" element={<ProtectedRoute><MainLayout><Index /></MainLayout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
                <Route path="/partners" element={<ProtectedRoute><MainLayout><Partners /></MainLayout></ProtectedRoute>} />
                <Route path="/mobility" element={<ProtectedRoute><MainLayout><Mobility /></MainLayout></ProtectedRoute>} />
                <Route path="/mou" element={<ProtectedRoute><MainLayout><MOUManagement /></MainLayout></ProtectedRoute>} />
                <Route path="/partnerships" element={<ProtectedRoute><MainLayout><PartnershipManagement /></MainLayout></ProtectedRoute>} />
                <Route path="/intelligence" element={<ProtectedRoute><MainLayout><MarketIntelligence /></MainLayout></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </UniversityProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
