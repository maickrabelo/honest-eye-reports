import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Clock, XCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { formatBRL, OPERATOR_PLAN_LABELS } from "@/lib/licensedOperatorPricing";

export type ManagementStatus = "none" | "pending" | "active" | "rejected" | "revoked";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    company_id: string;
    plan_slug: string;
    employee_count: number;
    monthly_amount_cents: number;
    billing_mode: string;
    companies?: { name: string; slug: string | null } | null;
  } | null;
  status: ManagementStatus;
  onRequested: () => void;
  onOpenDashboard: () => void;
}

const RequestManagementDialog = ({ open, onOpenChange, company, status, onRequested, onOpenDashboard }: Props) => {
  const [loading, setLoading] = useState(false);

  const request = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("licensed-operator-request-management", {
        body: { companyId: company.company_id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Solicitação enviada! A empresa recebeu um e-mail para autorizar o acesso.");
      onRequested();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{company.companies?.name}</DialogTitle>
          <DialogDescription>
            {OPERATOR_PLAN_LABELS[company.plan_slug as "ouvidoria"] ?? company.plan_slug} ·{" "}
            {company.employee_count} colaboradores · {formatBRL(company.monthly_amount_cents)}/mês
          </DialogDescription>
        </DialogHeader>

        {status === "active" ? (
          <div className="space-y-4">
            <Badge className="bg-green-600 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Gerenciamento autorizado
            </Badge>
            <p className="text-sm text-muted-foreground">
              Você tem acesso ao canal de ouvidoria desta empresa.
            </p>
            <Button className="w-full gap-2" onClick={onOpenDashboard}>
              <ExternalLink className="h-4 w-4" />
              Abrir dashboard da ouvidoria
            </Button>
          </div>
        ) : status === "pending" ? (
          <div className="space-y-3">
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Aguardando autorização da empresa
            </Badge>
            <p className="text-sm text-muted-foreground">
              A empresa recebeu um e-mail e verá a solicitação no dashboard dela. Assim que o administrador
              principal conceder o acesso, o canal aparecerá aqui.
            </p>
            <Button variant="outline" className="w-full" disabled={loading} onClick={request}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reenviar solicitação
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {status === "rejected" && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Solicitação recusada anteriormente
              </Badge>
            )}
            {status === "revoked" && (
              <Badge variant="outline" className="gap-1">
                <XCircle className="h-3 w-3" />
                Acesso revogado pela empresa
              </Badge>
            )}
            <p className="text-sm text-muted-foreground">
              Solicite o gerenciamento do canal de ouvidoria. A empresa será notificada por e-mail e precisa
              conceder o acesso no dashboard dela. Nada é liberado antes da autorização.
            </p>
            <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" disabled={loading} onClick={request}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Solicitar gerenciamento do canal
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestManagementDialog;
