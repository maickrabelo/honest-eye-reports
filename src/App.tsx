import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ReportForm from "./pages/ReportForm";
import ReportChat from "./pages/ReportChat";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import CompanyProfile from "./pages/CompanyProfile";
import SSTDashboard from "./pages/SSTDashboard";
import MasterDashboard from "./pages/MasterDashboard";
import CompanyReport from "./pages/CompanyReport";
import MasterConfig from "./pages/MasterConfig";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/report" element={<ReportChat />} />
            <Route path="/report-form" element={<ReportForm />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<CompanyProfile />} />
            <Route path="/sst-dashboard" element={<SSTDashboard />} />
            <Route path="/master-dashboard" element={<MasterDashboard />} />
            <Route path="/company-dashboard/:id" element={<Dashboard />} />
            <Route path="/report/:companySlug" element={<CompanyReport />} />
            <Route path="/master-config" element={<MasterConfig />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
