import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, BarChart3, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  exportAssessmentToExcel,
  exportAssessmentToPowerBICSV,
  type AssessmentType,
} from '@/lib/assessmentExport';

interface AssessmentExportButtonProps {
  assessmentType: AssessmentType;
  assessmentId: string;
  assessmentTitle: string;
  companyName?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
}

export const AssessmentExportButton: React.FC<AssessmentExportButtonProps> = ({
  assessmentType,
  assessmentId,
  assessmentTitle,
  companyName,
  size = 'default',
  variant = 'outline',
}) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handle = async (kind: 'excel' | 'csv') => {
    if (!assessmentId) {
      toast({ title: 'Avaliação não selecionada', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const config = { assessmentType, assessmentId, assessmentTitle, companyName };
      if (kind === 'excel') {
        await exportAssessmentToExcel(config);
        toast({
          title: 'Excel exportado',
          description: 'Dados anonimizados conforme LGPD.',
        });
      } else {
        await exportAssessmentToPowerBICSV(config);
        toast({
          title: 'CSV para Power BI exportado',
          description: 'Importe via Get Data → Text/CSV (separador ;).',
        });
      }
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: 'Erro ao exportar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar Dados
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Formato de exportação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handle('excel')}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-700" />
          <div className="flex flex-col">
            <span>Excel (.xlsx)</span>
            <span className="text-xs text-muted-foreground">Multi-aba: resumo, matriz, long</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle('csv')}>
          <BarChart3 className="mr-2 h-4 w-4 text-amber-600" />
          <div className="flex flex-col">
            <span>CSV para Power BI</span>
            <span className="text-xs text-muted-foreground">Long format, UTF-8, separador ;</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
