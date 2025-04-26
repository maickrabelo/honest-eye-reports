
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const mockReports = [
  {
    id: "REP-2025-042",
    title: "Denúncia sobre comportamento inadequado",
    summary: "Denúncia sobre situação de desconforto no ambiente de trabalho. O denunciante relatou problemas de conduta inadequada por parte de superiores, incluindo possíveis casos de assédio moral. Incidente ocorreu principalmente no setor comercial durante reuniões de equipe. Necessita investigação imediata.",
    status: "Em análise",
    date: "23/04/2025",
    updates: [
      { date: "23/04/2025", note: "Denúncia recebida e registrada no sistema.", author: "Sistema" },
      { date: "24/04/2025", note: "Análise inicial concluída. Encaminhado para RH para investigação.", author: "Admin" }
    ]
  },
  {
    id: "REP-2025-041",
    title: "Descarte inadequado de resíduos",
    summary: "Denúncia sobre materiais tóxicos sendo descartados incorretamente, sem seguir os protocolos ambientais da empresa. Situação observada no setor de produção, área B.",
    status: "Aberta",
    date: "22/04/2025",
    updates: [
      { date: "22/04/2025", note: "Denúncia recebida e registrada no sistema.", author: "Sistema" }
    ]
  },
];

type TrackReportModalProps = {
  className?: string;
};

const TrackReportModal = ({ className }: TrackReportModalProps) => {
  const [reportId, setReportId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const formatReportId = (input: string) => {
    // Remove all non-digit characters
    const cleanInput = input.replace(/\D/g, '');
    
    // Start with "REP-"
    let formattedId = "REP-";
    
    // Add current year if not present
    if (cleanInput.length > 0) {
      formattedId += new Date().getFullYear();
    }
    
    // Add hyphen after year
    if (cleanInput.length > 4) {
      formattedId += `-${cleanInput.slice(4).padStart(3, '0')}`;
    }
    
    return formattedId;
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // If input starts with "REP-", only allow digits after
    if (input.startsWith("REP-")) {
      const digitsOnly = input.replace(/\D/g, '');
      setReportId(formatReportId(digitsOnly));
    } else {
      setReportId(formatReportId(input));
    }
  };

  const handleSearch = () => {
    if (!reportId.trim()) {
      setError("Por favor, insira um ID de denúncia");
      return;
    }

    setIsLoading(true);
    setError("");
    
    setTimeout(() => {
      const foundReport = mockReports.find(r => r.id === reportId);
      
      if (foundReport) {
        setReport(foundReport);
        setError("");
      } else {
        setReport(null);
        setError("Denúncia não encontrada. Verifique o ID e tente novamente.");
        toast({
          variant: "destructive",
          title: "Não encontrada",
          description: "Denúncia não encontrada com o ID fornecido.",
        });
      }
      
      setIsLoading(false);
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolvida':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Resolvida</Badge>;
      case 'Em análise':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">Em análise</Badge>;
      case 'Aberta':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">Aberta</Badge>;
      case 'Arquivada':
        return <Badge variant="default" className="bg-gray-100 text-gray-800 border-gray-300">Arquivada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setReportId("");
      setReport(null);
      setError("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={className}
        >
          <Search className="h-4 w-4 mr-2" />
          Acompanhar Denúncia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Acompanhar Denúncia</DialogTitle>
          <DialogDescription>
            Digite o ID da denúncia para visualizar seu status e atualizações.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="report-id" className="mb-2 block">
                ID da Denúncia
              </Label>
              <Input
                id="report-id"
                placeholder="Digite apenas os números"
                value={reportId}
                onChange={handleIdChange}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          
          {report && (
            <div className="border rounded-lg p-4 mt-2 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{report.title}</h3>
                  <p className="text-sm text-muted-foreground">ID: {report.id}</p>
                </div>
                {getStatusBadge(report.status)}
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-1">Resumo da Denúncia</h4>
                <p className="text-sm">{report.summary}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Data de Registro</h4>
                <p className="text-sm">{report.date}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Histórico de Atualizações</h4>
                <div className="space-y-2">
                  {report.updates.map((update: any, idx: number) => (
                    <div key={idx} className="bg-muted/50 p-2 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{update.author}</span>
                        <span className="text-muted-foreground">{update.date}</span>
                      </div>
                      <p>{update.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrackReportModal;
