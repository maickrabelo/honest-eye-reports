import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RealAuthProvider } from "./contexts/RealAuthContext";
import { WhiteLabelProvider } from "./contexts/WhiteLabelContext";
import { useRealAuth } from "./contexts/RealAuthContext";
import { useAccessLogger } from "./hooks/useAccessLogger";
import React, { Suspense } from "react";

// Eagerly load critical/frequently accessed pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load all other pages
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const ReportForm = React.lazy(() => import("./pages/ReportForm"));
const ReportChat = React.lazy(() => import("./pages/ReportChat"));
const Reports = React.lazy(() => import("./pages/Reports"));
const CompanyProfile = React.lazy(() => import("./pages/CompanyProfile"));
const SSTDashboard = React.lazy(() => import("./pages/SSTDashboard"));
const MasterDashboard = React.lazy(() => import("./pages/MasterDashboard"));
const CompanyReport = React.lazy(() => import("./pages/CompanyReport"));
const PendingApproval = React.lazy(() => import("./pages/PendingApproval"));
const UserManagement = React.lazy(() => import("./pages/UserManagement"));
const ClimateSurvey = React.lazy(() => import("./pages/ClimateSurvey"));
const ClimateSurveyDashboard = React.lazy(() => import("./pages/ClimateSurveyDashboard"));
const ClimateSurveyManagement = React.lazy(() => import("./pages/ClimateSurveyManagement"));
const CommercialPresentation = React.lazy(() => import("./pages/CommercialPresentation"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = React.lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCanceled = React.lazy(() => import("./pages/CheckoutCanceled"));
const PartnerRegistration = React.lazy(() => import("./pages/PartnerRegistration"));
const AffiliateRegistration = React.lazy(() => import("./pages/AffiliateRegistration"));
const PartnerDashboard = React.lazy(() => import("./pages/PartnerDashboard"));
const AffiliateDashboard = React.lazy(() => import("./pages/AffiliateDashboard"));
const HSEITDashboard = React.lazy(() => import("./pages/HSEITDashboard"));
const HSEITManagement = React.lazy(() => import("./pages/HSEITManagement"));
const HSEITForm = React.lazy(() => import("./pages/HSEITForm"));
const HSEITResults = React.lazy(() => import("./pages/HSEITResults"));
const BurnoutDashboard = React.lazy(() => import("./pages/BurnoutDashboard"));
const BurnoutManagement = React.lazy(() => import("./pages/BurnoutManagement"));
const BurnoutForm = React.lazy(() => import("./pages/BurnoutForm"));
const BurnoutResults = React.lazy(() => import("./pages/BurnoutResults"));
const ChangePassword = React.lazy(() => import("./pages/ChangePassword"));
const SSTLandingPage = React.lazy(() => import("./pages/SSTLandingPage"));
const SSTPortal = React.lazy(() => import("./pages/SSTPortal"));
const TrialSignup = React.lazy(() => import("./pages/TrialSignup"));
const SSTTrialSignup = React.lazy(() => import("./pages/SSTTrialSignup"));
const RelatorioDemo = React.lazy(() => import("./pages/RelatorioDemo"));
const SalesDashboard = React.lazy(() => import("./pages/SalesDashboard"));
const PsychosocialDashboard = React.lazy(() => import("./pages/PsychosocialDashboard"));
const COPSOQManagement = React.lazy(() => import("./pages/COPSOQManagement"));
const COPSOQForm = React.lazy(() => import("./pages/COPSOQForm"));
const COPSOQResults = React.lazy(() => import("./pages/COPSOQResults"));
const CompanySelector = React.lazy(() => import("./components/CompanySelector"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

// Inner component so it has access to auth context and router (for useLocation)
const AppContent = () => {
  const { user, profile, role } = useRealAuth();
  useAccessLogger(user?.id, user?.email, role);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RealAuthProvider>
          <WhiteLabelProvider>
            <AppContent />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/sst/:sstSlug" element={<SSTLandingPage />} />
                <Route path="/teste-gratis" element={<TrialSignup />} />
                <Route path="/teste-gratis-sst" element={<SSTTrialSignup />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/pending-approval" element={<PendingApproval />} />
                <Route path="/select-company" element={<CompanySelector />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/report" element={<ReportChat />} />
                <Route path="/report-form" element={<ReportForm />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<CompanyProfile />} />
                <Route path="/sst-dashboard" element={<SSTDashboard />} />
                <Route path="/sst-portal" element={<SSTPortal />} />
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
                <Route path="/hseit-dashboard" element={<HSEITDashboard />} />
                <Route path="/hseit/new" element={<HSEITManagement />} />
                <Route path="/hseit/:id" element={<HSEITManagement />} />
                <Route path="/hseit/:companySlug/:assessmentId" element={<HSEITForm />} />
                <Route path="/hseit/results/:id" element={<HSEITResults />} />
                <Route path="/burnout-dashboard" element={<BurnoutDashboard />} />
                <Route path="/burnout/new" element={<BurnoutManagement />} />
                <Route path="/burnout/:id" element={<BurnoutManagement />} />
                <Route path="/burnout/:companySlug/:assessmentId" element={<BurnoutForm />} />
                <Route path="/burnout/results/:id" element={<BurnoutResults />} />
                <Route path="/relatoriodemo" element={<RelatorioDemo />} />
                <Route path="/sales-dashboard" element={<SalesDashboard />} />
                <Route path="/psychosocial-dashboard" element={<PsychosocialDashboard />} />
                <Route path="/copsoq/new" element={<COPSOQManagement />} />
                <Route path="/copsoq/:id" element={<COPSOQManagement />} />
                <Route path="/copsoq/:companySlug/:assessmentId" element={<COPSOQForm />} />
                <Route path="/copsoq/results/:id" element={<COPSOQResults />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </WhiteLabelProvider>
        </RealAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;