import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { Loader2, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sstManager: { id: string; name: string; email: string | null } | null;
  onAssigned?: () => void;
}

type ManualPlan = {
  id: string;
  slug: string;
  name: string;
  features: any;
  ai_enabled: boolean;
  ouvidoria_enabled: boolean;
  pgr_enabled: boolean;
  max_companies: number | null;
  max_employees: number | null;
};

export const AssignManualPlanDialog: React.FC<Props> = ({
  open, onOpenChange, sstManager, onAssigned,
}) => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<ManualPlan[]>([]);
  const [planId, setPlanId] = useState<string>("");
  const [trialDays, setTrialDays] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("subscription_plans")
      .select("id, slug, name, features, ai_enabled, ouvidoria_enabled, pgr_enabled, max_companies, max_employees")
      .eq("visibility", "manual_only")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Erro ao carregar planos", description: getSafeErrorMessage(error), variant: "destructive" });
        } else {
          setPlans((data ?? []) as ManualPlan[]);
          if (data && data.length > 0 && !planId) setPlanId(data[0].id);
        }
      })
      .then(() => setLoading(false));
  }, [open]);

  const selected = plans.find((p) => p.id === planId);

  const handleSubmit = async () => {
    if (!sstManager || !planId) return;
    setSubmitting(true);
    try {
      // Find an owner user for this SST manager (profile.sst_manager_id link)
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("sst_manager_id", sstManager.id)
        .limit(1)
        .maybeSingle();
      if (profileErr) throw profileErr;
      if (!profile?.id) {
        throw new Error("Esta gestora SST ainda não possui um usuário titular cadastrado.");
      }

      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + Math.max(0, Number(trialDays) || 0));

      const isTrial = Number(trialDays) > 0;
      const { error: insertErr } = await supabase.from("subscriptions").insert({
        owner_user_id: profile.id,
        owner_email: sstManager.email,
        plan_id: planId,
        billing_cycle: "annual",
        status: isTrial ? "trial" : "active",
        provider: "manual",
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        next_charge_date: end.toISOString(),
        metadata: {
          assigned_manually: true,
          trial_days: Number(trialDays) || 0,
          assigned_at: now.toISOString(),
        },
      });
      if (insertErr) throw insertErr;

      toast({
        title: "Plano atribuído",
        description: isTrial
          ? `${selected?.name} ativado em teste por ${trialDays} dia(s).`
          : `${selected?.name} ativado imediatamente.`,
      });
      onAssigned?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Erro ao atribuir plano", description: getSafeErrorMessage(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Atribuir plano manual
          </DialogTitle>
          <DialogDescription>
            Atribua um plano comercializado manualmente para {sstManager?.name ?? "—"} e defina o
            período de teste gratuito.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Plano</Label>
            <Select value={planId} onValueChange={setPlanId} disabled={loading || plans.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione um plano"} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <div className="font-medium">{selected.name}</div>
              <div className="text-xs text-muted-foreground">
                Até {selected.max_companies ?? "∞"} empresas · {selected.max_employees ?? "∞"} colaboradores
              </div>
              <div className="text-xs">
                IA: <strong>{selected.ai_enabled ? "Sim" : "Não"}</strong> · Ouvidoria tradicional:{" "}
                <strong>{selected.ouvidoria_enabled ? "Sim" : "Não"}</strong> · PGR:{" "}
                <strong>{selected.pgr_enabled ? "Sim" : "Não"}</strong>
              </div>
              {Array.isArray(selected.features) && (
                <ul className="list-disc list-inside text-xs text-muted-foreground pt-1">
                  {selected.features.map((f: string, i: number) => <li key={i}>{f}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="trialDays">Dias de teste grátis</Label>
            <Input
              id="trialDays"
              type="number"
              min={0}
              max={365}
              value={trialDays}
              onChange={(e) => setTrialDays(parseInt(e.target.value || "0", 10))}
            />
            <p className="text-xs text-muted-foreground">
              Use 0 para ativar imediatamente sem período de teste.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !planId}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atribuir plano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignManualPlanDialog;
