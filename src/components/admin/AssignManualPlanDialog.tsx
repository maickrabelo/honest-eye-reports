import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

type AssignablePlan = {
  id: string;
  slug: string;
  name: string;
  visibility: string | null;
  features: any;
  ai_enabled: boolean;
  ouvidoria_enabled: boolean;
  pgr_enabled: boolean;
  max_companies: number | null;
  max_employees: number | null;
  price_monthly_cents: number | null;
  price_annual_cents: number | null;
};

const visibilityLabel = (v: string | null) => {
  switch (v) {
    case "manual_only": return "Manual";
    case "hotmart_only": return "Hotmart";
    case "public": return "Público";
    default: return v ?? "—";
  }
};

export const AssignManualPlanDialog: React.FC<Props> = ({
  open, onOpenChange, sstManager, onAssigned,
}) => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<AssignablePlan[]>([]);
  const [planId, setPlanId] = useState<string>("");
  const [mode, setMode] = useState<"trial" | "definitive">("trial");
  const [trialDays, setTrialDays] = useState<number>(7);
  const [definitiveDays, setDefinitiveDays] = useState<number>(365);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("subscription_plans")
      .select("id, slug, name, visibility, features, ai_enabled, ouvidoria_enabled, pgr_enabled, max_companies, max_employees, price_monthly_cents, price_annual_cents")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Erro ao carregar planos", description: getSafeErrorMessage(error), variant: "destructive" });
        } else {
          const list = (data ?? []) as AssignablePlan[];
          setPlans(list);
          if (list.length > 0 && !planId) setPlanId(list[0].id);
        }
      })
      .then(() => setLoading(false));
  }, [open]);

  const selected = useMemo(() => plans.find((p) => p.id === planId), [plans, planId]);

  const grouped = useMemo(() => {
    const groups: Record<string, AssignablePlan[]> = {};
    for (const p of plans) {
      const k = p.visibility ?? "outros";
      (groups[k] ||= []).push(p);
    }
    return groups;
  }, [plans]);

  const handleSubmit = async () => {
    if (!sstManager || !planId || !selected) return;
    setSubmitting(true);
    try {
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

      const isTrial = mode === "trial";
      const days = isTrial ? Math.max(0, Number(trialDays) || 0) : Math.max(1, Number(definitiveDays) || 0);

      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + days);

      const amount = isTrial
        ? 0
        : (billingCycle === "annual"
            ? (selected.price_annual_cents ?? 0)
            : (selected.price_monthly_cents ?? 0));

      const payload: any = {
        owner_user_id: profile.id,
        owner_email: sstManager.email ?? "",
        plan_id: planId,
        billing_cycle: isTrial ? "annual" : billingCycle,
        status: isTrial ? "trial" : "active",
        provider: "manual",
        amount_cents: amount,
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        next_charge_date: end.toISOString(),
        metadata: {
          assigned_manually: true,
          mode,
          duration_days: days,
          assigned_at: now.toISOString(),
        },
      };
      const { error: insertErr } = await (supabase.from("subscriptions") as any).insert(payload);
      if (insertErr) throw insertErr;

      // Sincroniza limites da gestora SST com o plano atribuído
      const { error: updateMgrErr } = await (supabase.from("sst_managers") as any)
        .update({
          max_companies: selected.max_companies,
          max_employees: selected.max_employees,
        })
        .eq("id", sstManager.id);
      if (updateMgrErr) throw updateMgrErr;

      toast({
        title: "Plano atribuído",
        description: isTrial
          ? `${selected.name} ativado em teste por ${days} dia(s).`
          : `${selected.name} ativado por ${days} dia(s).`,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Atribuir plano
          </DialogTitle>
          <DialogDescription>
            Atribua qualquer plano disponível para {sstManager?.name ?? "—"} como teste grátis ou
            ativação definitiva.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Plano</Label>
            <Select value={planId} onValueChange={setPlanId} disabled={loading || plans.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione um plano"} />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {Object.entries(grouped).map(([vis, list]) => (
                  <div key={vis}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                      {visibilityLabel(vis)}
                    </div>
                    {list.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <div className="font-medium">{selected.name}</div>
              <div className="text-xs text-muted-foreground">
                Visibilidade: {visibilityLabel(selected.visibility)} · Até {selected.max_companies ?? "∞"} empresas · {selected.max_employees ?? "∞"} colaboradores
              </div>
              <div className="text-xs">
                IA: <strong>{selected.ai_enabled ? "Sim" : "Não"}</strong> · Ouvidoria:{" "}
                <strong>{selected.ouvidoria_enabled ? "Sim" : "Não"}</strong> · PGR:{" "}
                <strong>{selected.pgr_enabled ? "Sim" : "Não"}</strong>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Tipo de ativação</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as "trial" | "definitive")}
              className="grid grid-cols-2 gap-2"
            >
              <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="trial" id="mode-trial" />
                <div>
                  <div className="text-sm font-medium">Teste grátis</div>
                  <div className="text-xs text-muted-foreground">Status: trial</div>
                </div>
              </label>
              <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="definitive" id="mode-def" />
                <div>
                  <div className="text-sm font-medium">Plano definitivo</div>
                  <div className="text-xs text-muted-foreground">Status: ativo</div>
                </div>
              </label>
            </RadioGroup>
          </div>

          {mode === "trial" ? (
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
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="defDays">Validade do plano (dias)</Label>
                <Input
                  id="defDays"
                  type="number"
                  min={1}
                  max={3650}
                  value={definitiveDays}
                  onChange={(e) => setDefinitiveDays(parseInt(e.target.value || "0", 10))}
                />
                <p className="text-xs text-muted-foreground">
                  Ex.: 30, 90, 180, 365. A assinatura expira após esse período.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Ciclo de cobrança (referência)</Label>
                <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
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
