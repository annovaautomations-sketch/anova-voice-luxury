import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import Overview from "./pages/dashboard/Overview";
import Calls from "./pages/dashboard/Calls";
import Assistants from "./pages/dashboard/Assistants";
import Numbers from "./pages/dashboard/Numbers";
import Appointments from "./pages/dashboard/Appointments";
import Analytics from "./pages/dashboard/Analytics";
import Settings from "./pages/dashboard/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<DashboardLayout><Overview /></DashboardLayout>} />
            <Route path="/dashboard/calls" element={<DashboardLayout><Calls /></DashboardLayout>} />
            <Route path="/dashboard/assistants" element={<DashboardLayout><Assistants /></DashboardLayout>} />
            <Route path="/dashboard/numbers" element={<DashboardLayout><Numbers /></DashboardLayout>} />
            <Route path="/dashboard/appointments" element={<DashboardLayout><Appointments /></DashboardLayout>} />
            <Route path="/dashboard/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
            <Route path="/dashboard/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
