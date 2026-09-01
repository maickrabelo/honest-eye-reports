import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import {
  formatBRL,
  getPartnerTierProgress,
  PARTNER_TIERS,
} from "@/lib/licensedOperatorPricing";
import PartnerTiersDialog from "./PartnerTiersDialog";

interface Props {
  monthlyVolumeCents: number;
}

const PartnerTierProgressCard = ({ monthlyVolumeCents }: Props) => {
  const { current, next, missingCents, progressPercent } = getPartnerTierProgress(monthlyVolumeCents);

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            {current.label} · {current.commissionRate}% de comissão/desconto
          </CardTitle>
          <CardDescription>
            Carteira atual: <strong>{formatBRL(monthlyVolumeCents)}</strong> de MRR
          </CardDescription>
        </div>
        <PartnerTiersDialog currentTier={current.slug} />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium">
          {next ? (
            <>
              Faltam <span className="text-primary font-bold">{formatBRL(missingCents)}</span> de valor
              mensal para atingir o {next.label} — {next.commissionRate}% de desconto/comissão
            </>
          ) : (
            <span className="text-green-600 font-semibold">
              Você está no nível máximo: {current.commissionRate}% de desconto/comissão.
            </span>
          )}
        </p>

        <Progress value={progressPercent} className="h-3" />

        <div className="grid gap-3 sm:grid-cols-3">
          {PARTNER_TIERS.map((tier) => {
            const isCurrent = tier.slug === current.slug;
            const reached = monthlyVolumeCents >= tier.minCents;
            return (
              <div
                key={tier.slug}
                className={`rounded-lg border p-3 text-sm transition-colors ${
                  isCurrent ? "border-primary bg-primary/5" : reached ? "border-green-600/40" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{tier.label.replace("Parceiro ", "")}</span>
                  <Badge variant={isCurrent ? "default" : "outline"}>{tier.commissionRate}%</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tier.criterion}</p>
                {isCurrent && <p className="mt-1 text-xs font-medium text-primary">Nível atual</p>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerTierProgressCard;
