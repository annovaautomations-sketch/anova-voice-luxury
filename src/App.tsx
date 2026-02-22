import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useCustomAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import Overview from "./pages/dashboard/Overview";
import CallAnalytics from "./pages/dashboard/CallAnalytics";
import LeadPipeline from "./pages/dashboard/LeadPipeline";
import Appointments from "./pages/dashboard/Appointments";
import LiveMonitor from "./pages/dashboard/LiveMonitor";
import CallHistory from "./pages/dashboard/CallHistory";
import Settings from "./pages/dashboard/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const DashboardRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<DashboardRoute><Overview /></DashboardRoute>} />
              <Route path="/dashboard/call-analytics" element={<DashboardRoute><CallAnalytics /></DashboardRoute>} />
              <Route path="/dashboard/leads" element={<DashboardRoute><LeadPipeline /></DashboardRoute>} />
              <Route path="/dashboard/appointments" element={<DashboardRoute><Appointments /></DashboardRoute>} />
              <Route path="/dashboard/monitor" element={<DashboardRoute><LiveMonitor /></DashboardRoute>} />
              <Route path="/dashboard/calls" element={<DashboardRoute><CallHistory /></DashboardRoute>} />
              <Route path="/dashboard/settings" element={<DashboardRoute><Settings /></DashboardRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
