import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RealAuthProvider } from "./contexts/RealAuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ReportForm from "./pages/ReportForm";
import ReportChat from "./pages/ReportChat";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import CompanyProfile from "./pages/CompanyProfile";
import SSTDashboard from "./pages/SSTDashboard";
import MasterDashboard from "./pages/MasterDashboard";
import CompanyReport from "./pages/CompanyReport";
import PendingApproval from "./pages/PendingApproval";
import UserManagement from "./pages/UserManagement";
import ClimateSurvey from "./pages/ClimateSurvey";
import ClimateSurveyDashboard from "./pages/ClimateSurveyDashboard";
import ClimateSurveyManagement from "./pages/ClimateSurveyManagement";
import CommercialPresentation from "./pages/CommercialPresentation";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCanceled from "./pages/CheckoutCanceled";
import PartnerRegistration from "./pages/PartnerRegistration";
import AffiliateRegistration from "./pages/AffiliateRegistration";
import PartnerDashboard from "./pages/PartnerDashboard";
import AffiliateDashboard from "./pages/AffiliateDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RealAuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/report" element={<ReportChat />} />
            <Route path="/report-form" element={<ReportForm />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<CompanyProfile />} />
            <Route path="/sst-dashboard" element={<SSTDashboard />} />
            <Route path="/master-dashboard" element={<MasterDashboard />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/company-dashboard/:id" element={<Dashboard />} />
            <Route path="/report/:companySlug" element={<CompanyReport />} />
            <Route path="/pesquisa/:companySlug" element={<ClimateSurvey />} />
            <Route path="/pesquisa/:companySlug/:surveyId" element={<ClimateSurvey />} />
            <Route path="/climate-dashboard" element={<ClimateSurveyDashboard />} />
            <Route path="/climate-survey/new" element={<ClimateSurveyManagement />} />
            <Route path="/climate-survey/:id" element={<ClimateSurveyManagement />} />
            <Route path="/apresentacao" element={<CommercialPresentation />} />
            <Route path="/contratar" element={<Checkout />} />
            <Route path="/checkout/sucesso" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancelado" element={<CheckoutCanceled />} />
            <Route path="/parceiro/cadastro" element={<PartnerRegistration />} />
            <Route path="/parceiro/dashboard" element={<PartnerDashboard />} />
            <Route path="/afiliado/cadastro" element={<AffiliateRegistration />} />
            <Route path="/afiliado/dashboard" element={<AffiliateDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RealAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
