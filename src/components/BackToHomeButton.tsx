import { useLocation, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealAuth } from "@/contexts/RealAuthContext";

export function getHomePathForRole(role: string | null | undefined): string | null {
  switch (role) {
    case "admin":
      return "/master-dashboard";
    case "sst":
      return "/sst-dashboard";
    case "company":
      return "/dashboard";
    case "partner":
      return "/parceiro/dashboard";
    case "affiliate":
      return "/afiliado/dashboard";
    case "sales":
      return "/sales-dashboard";
    case "sector_viewer":
      return "/setor/dashboard";
    default:
      return null;
  }
}

// Routes where the floating button should NOT show
const HIDE_EXACT = new Set<string>([
  "/",
  "/auth",
  "/change-password",
  "/reset-password",
  "/pending-approval",
  "/select-company",
  "/teste-gratis",
  "/teste-gratis-sst",
  "/teste-gratis-empresa",
  "/apresentacao",
  "/contratar",
  "/checkout/sucesso",
  "/checkout/cancelado",
  "/parceiro/cadastro",
  "/afiliado/cadastro",
  "/denuncia-enviada",
  "/relatoriodemo",
  // Home dashboards themselves
  "/dashboard",
  "/sst-dashboard",
  "/master-dashboard",
  "/sales-dashboard",
  "/afiliado/dashboard",
  "/parceiro/dashboard",
  "/setor/dashboard",
  "/ouvidoria-beta/acompanhar",
]);

const HIDE_PREFIXES = [
  "/sst/", // SST landing
  "/i/", // affiliate landing
  "/convite/",
  "/convite-setor/",
  "/pesquisa/",
  "/pulse/",
  "/report/", // /report/:companySlug public
];

// Patterns for public assessment/respondent forms (path segments)
const HIDE_REGEX: RegExp[] = [
  /^\/hseit\/[^/]+\/[^/]+$/, // /hseit/:slug/:assessmentId
  /^\/copsoq\/[^/]+\/[^/]+$/,
  /^\/burnout\/[^/]+\/[^/]+$/,
  /^\/ouvidoria-beta\/[0-9a-fA-F-]{20,}$/, // company form (uuid)
  /^\/report$/,
  /^\/report-form$/,
];

function shouldHide(pathname: string): boolean {
  if (HIDE_EXACT.has(pathname)) return true;
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (HIDE_REGEX.some((r) => r.test(pathname))) return true;
  return false;
}

export default function BackToHomeButton() {
  const { user, role } = useRealAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || !role) return null;
  if (shouldHide(location.pathname)) return null;

  const home = getHomePathForRole(role);
  if (!home) return null;
  if (location.pathname === home) return null;

  return (
    <div className="fixed top-3 left-3 z-50">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => navigate(home)}
        className="gap-2 shadow-md backdrop-blur-sm bg-background/80 hover:bg-background border border-border"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Início do dashboard</span>
      </Button>
    </div>
  );
}
