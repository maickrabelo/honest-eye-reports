import React from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

const ReportThankYou = () => {
  const location = useLocation();
  const { toast } = useToast();
  const state = (location.state || {}) as { companyName?: string; trackingCode?: string };
  const companyName = state.companyName || 'a empresa';
  const trackingCode = state.trackingCode || '';

  const handleCopy = () => {
    if (!trackingCode) return;
    navigator.clipboard.writeText(trackingCode);
    toast({ title: 'Código copiado', description: 'O código foi copiado para a área de transferência.' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-audit-primary mb-3">
          Denúncia enviada com sucesso!
        </h1>
        <p className="text-gray-600 mb-6">
          Sua denúncia foi enviada para <strong>{companyName}</strong> e será analisada com sigilo.
          Acompanhe sua reclamação por meio do token fornecido abaixo.
        </p>

        {trackingCode && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Código de acompanhamento</p>
            <p className="text-2xl font-bold text-audit-primary break-all">{trackingCode}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar código
            </Button>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-6">
          Guarde este código em local seguro. Você precisará dele para consultar o status da sua denúncia.
        </p>

      </div>
    </div>
  );
};

export default ReportThankYou;
