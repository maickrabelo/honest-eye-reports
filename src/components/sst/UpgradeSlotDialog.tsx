import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpgradeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  currentLimit: number;
  onPurchased: () => void;
}

const UpgradeSlotDialog: React.FC<UpgradeSlotDialogProps> = ({
  open,
  onOpenChange,
  currentCount,
  currentLimit,
  onPurchased,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-extra-company-slot');
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Slot liberado!',
        description: data?.pending_billing
          ? 'Slot adicional ativado. A cobrança será incluída na sua próxima fatura.'
          : `Slot adicional contratado. Cobrança de R$ 19,90 incluída na próxima fatura.`,
      });
      onPurchased();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Erro ao contratar slot',
        description: err.message ?? 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Limite de empresas atingido
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <span className="block">
              Você já cadastrou <strong>{currentCount} de {currentLimit}</strong> empresas
              do seu plano.
            </span>
            <span className="block">
              Deseja contratar <strong>mais 1 slot de empresa</strong>?
            </span>
            <span className="block bg-primary/5 border border-primary/20 rounded-md p-3 text-foreground">
              Será cobrado o valor de <strong>R$ 19,90 mensal</strong> na sua próxima fatura.
              O slot fica ativo imediatamente.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Contratar slot adicional'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UpgradeSlotDialog;
