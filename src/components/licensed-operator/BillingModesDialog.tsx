import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { BILLING_MODE_DETAILS, OPERATOR_MODE_LABELS, type OperatorBillingMode } from "@/lib/licensedOperatorPricing";

const ORDER: OperatorBillingMode[] = ["direct", "operator"];

const BillingModesDialog = ({ triggerClassName }: { triggerClassName?: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className={`gap-2 px-0 text-primary ${triggerClassName ?? ""}`}>
          <Info className="h-4 w-4" />
          Saiba mais sobre tipos de faturamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-none bg-[hsl(200_45%_10%)] text-white p-0">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-extrabold tracking-tight text-white">
              Tipos de faturamento
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Escolha como o valor da assinatura será cobrado em cada empresa que você cadastra.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            {ORDER.map((mode, i) => {
              const d = BILLING_MODE_DETAILS[mode];
              return (
                <div key={mode}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-[hsl(200_45%_10%)]">
                      {i + 1}
                    </span>
                    <span className="text-lg font-bold uppercase tracking-wide text-emerald-400">
                      {OPERATOR_MODE_LABELS[mode]}
                    </span>
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase text-[hsl(200_45%_10%)]">
                      {d.tagline}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2 pl-10 text-sm text-white/85">
                    {d.bullets.map((b) => (
                      <li key={b} className="list-disc">{b}</li>
                    ))}
                  </ul>
                  <div className="mt-4 ml-10 rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
                    <p className="mb-1 font-bold uppercase text-emerald-400">Exemplo</p>
                    {d.example.map((e) => (
                      <p key={e} className="text-white/85">{e}</p>
                    ))}
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-white/50">
              O percentual de comissão (faturamento direto) ou de desconto (faturamento para o licenciado)
              segue o seu nível de parceiro atual.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillingModesDialog;
