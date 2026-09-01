import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, Info } from "lucide-react";
import { PARTNER_TIERS, type PartnerTierSlug } from "@/lib/licensedOperatorPricing";

const accent: Record<PartnerTierSlug, string> = {
  bronze: "text-amber-500",
  prata: "text-slate-300",
  ouro: "text-yellow-400",
};

interface Props {
  currentTier?: PartnerTierSlug;
  triggerVariant?: "outline" | "secondary" | "ghost";
  triggerClassName?: string;
}

const PartnerTiersDialog = ({ currentTier, triggerVariant = "secondary", triggerClassName }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm" className={`gap-2 ${triggerClassName ?? ""}`}>
          <Info className="h-4 w-4" />
          Saiba mais sobre níveis de parceiro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-none bg-[hsl(200_45%_10%)] text-white p-0">
        <div className="p-8">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-extrabold tracking-tight text-white">
              Níveis de parceiro
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Seu nível é definido pelo MRR (receita mensal recorrente) da sua carteira de ouvidorias.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="hidden sm:flex items-center justify-center">
              <div className="rounded-full border-[6px] border-emerald-400 p-6">
                <CircleDollarSign className="h-20 w-20 text-emerald-400" strokeWidth={2.2} />
              </div>
            </div>

            <div className="space-y-8">
              {PARTNER_TIERS.map((tier) => (
                <div key={tier.slug}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold uppercase tracking-widest ${accent[tier.slug]}`}>
                      {tier.label}
                    </span>
                    {currentTier === tier.slug && (
                      <Badge className="bg-emerald-500 text-[hsl(200_45%_10%)] hover:bg-emerald-500">
                        Seu nível atual
                      </Badge>
                    )}
                    <div className="h-px flex-1 bg-white/20" />
                  </div>
                  <p className="mt-2 text-xl font-bold text-white">
                    COMISSÃO/DESCONTO - {tier.commissionRate}%
                  </p>
                  <p className="mt-3 text-sm text-emerald-400">Critério</p>
                  <p className="text-sm text-white/85">{tier.criterion}</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-400">{tier.projection}</p>
                </div>
              ))}

              <p className="text-xs text-white/50">
                O percentual vale como comissão (faturamento direto) ou como desconto na sua fatura
                (faturamento para o licenciado). Consulte condições comerciais.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerTiersDialog;
