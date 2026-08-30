import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/errorUtils";

interface RequestRow {
  id: string;
  status: string;
  licensed_operators?: { nome_fantasia: string | null; razao_social: string | null; logo_url: string | null } | null;
}

interface Props {
  companyId: string;
  canDecide: boolean;
}

const ManagementRequestBanner = ({ companyId, canDecide }: Props) => {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("licensed_operator_management_requests")
      .select("id, status, licensed_operators(nome_fantasia, razao_social, logo_url)")
      .eq("company_id", companyId)
      .in("status", ["pending", "active"]);
    setRequests((data as any) ?? []);
  }, [companyId]);

  useEffect(() => {
    if (companyId) load();
  }, [companyId, load]);

  const decide = async (requestId: string, action: "grant" | "reject" | "revoke") => {
    setActing(requestId);
    try {
      const { data, error } = await supabase.functions.invoke("company-decide-management-request", {
        body: { requestId, action },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(
        action === "grant"
          ? "Acesso concedido ao parceiro."
          : action === "reject"
            ? "Solicitação recusada."
            : "Acesso revogado.",
      );
      load();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setActing(null);
    }
  };

  if (!canDecide || requests.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {requests.map((r) => {
        const name = r.licensed_operators?.nome_fantasia || r.licensed_operators?.razao_social || "Parceiro licenciado";
        const pending = r.status === "pending";
        return (
          <Card key={r.id} className={pending ? "border-primary/40 bg-primary/5" : "border-green-600/30 bg-green-50"}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className={`h-5 w-5 mt-0.5 ${pending ? "text-primary" : "text-green-600"}`} />
                <div>
                  <p className="font-semibold">
                    {pending
                      ? `${name} solicitou permissão para gerenciar seu Canal de Ouvidoria`
                      : `${name} está autorizado a gerenciar seu Canal de Ouvidoria`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pending
                      ? "Ao conceder, o parceiro poderá visualizar e responder denúncias, criar tarefas e notas internas."
                      : "Você pode revogar esse acesso a qualquer momento."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pending ? (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700 gap-2"
                      disabled={acting === r.id}
                      onClick={() => decide(r.id, "grant")}
                    >
                      {acting === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      Conceder acesso
                    </Button>
                    <Button variant="outline" disabled={acting === r.id} onClick={() => decide(r.id, "reject")}>
                      <X className="h-4 w-4 mr-1" />
                      Recusar
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" disabled={acting === r.id} onClick={() => decide(r.id, "revoke")}>
                    {acting === r.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Revogar acesso
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ManagementRequestBanner;
