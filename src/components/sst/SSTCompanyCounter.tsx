import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Building2, Sparkles } from "lucide-react";

interface SSTCompanyCounterProps {
  currentCount: number;
  maxCompanies: number;
  extraSlots?: number;
}

const SSTCompanyCounter: React.FC<SSTCompanyCounterProps> = ({ currentCount, maxCompanies, extraSlots = 0 }) => {
  const effectiveMax = maxCompanies + extraSlots;
  const percentage = effectiveMax > 0 ? (currentCount / effectiveMax) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = currentCount >= effectiveMax;

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isAtLimit ? 'bg-destructive/10' : isNearLimit ? 'bg-yellow-500/10' : 'bg-primary/10'}`}>
            <Building2 className={`h-5 w-5 ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-600' : 'text-primary'}`} />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {currentCount} / {effectiveMax} empresas
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              Empresas cadastradas no seu plano
              {extraSlots > 0 && (
                <span className="inline-flex items-center gap-1 text-primary font-medium">
                  <Sparkles className="h-3 w-3" />
                  +{extraSlots} slot{extraSlots > 1 ? 's' : ''} extra{extraSlots > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        {isAtLimit && (
          <span className="text-xs bg-destructive/10 text-destructive px-3 py-1 rounded-full font-medium">
            Limite atingido
          </span>
        )}
        {isNearLimit && !isAtLimit && (
          <span className="text-xs bg-yellow-500/10 text-yellow-700 px-3 py-1 rounded-full font-medium">
            Próximo do limite
          </span>
        )}
      </div>
      <Progress
        value={percentage}
        className={`h-2.5 rounded-full ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-yellow-500' : '[&>div]:bg-primary'}`}
      />
    </div>
  );
};

export default SSTCompanyCounter;
