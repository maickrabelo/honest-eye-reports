import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [newUpdate, setNewUpdate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReportId(e.target.value);
  };

  const handleSearch = async () => {
    if (!reportId.trim()) {
      setError("Por favor, insira um código de rastreamento");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('tracking_code', reportId.toUpperCase())
        .single();

      if (reportError || !reportData) {
        setReport(null);
        setError("Denúncia não encontrada. Verifique o código e tente novamente.");
        toast({
          variant: "destructive",
          title: "Não encontrada",
          description: "Denúncia não encontrada com o código fornecido.",
        });
        setIsLoading(false);
        return;
      }

      const { data: updatesData } = await supabase
        .from('report_updates')
        .select('*')
        .eq('report_id', reportData.id)
        .order('created_at', { ascending: true });

      const formattedReport = {
        id: reportData.tracking_code,
        title: reportData.title,
        summary: reportData.description,
        status: reportData.status,
        date: new Date(reportData.created_at).toLocaleDateString('pt-BR'),
        updates: updatesData?.map(update => ({
          date: new Date(update.created_at).toLocaleDateString('pt-BR'),
          note: update.notes || `Status alterado para: ${update.new_status}`,
          author: "Sistema"
        })) || []
      };

      setReport(formattedReport);
      setSelectedStatus(reportData.status);
      setError("");
    } catch (err) {
      console.error('Erro ao buscar denúncia:', err);
      setError("Erro ao buscar denúncia. Tente novamente.");
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar denúncia. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!newUpdate.trim() || !report) return;
    
    setIsLoading(true);
    
    try {
      const { data: reportData } = await supabase
        .from('reports')
        .select('id')
        .eq('tracking_code', report.id)
        .single();

      if (!reportData) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível encontrar a denúncia.",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('report_updates')
        .insert({
          report_id: reportData.id,
          old_status: report.status,
          new_status: selectedStatus,
          notes: newUpdate
        });

      if (updateError) throw updateError;

      if (selectedStatus !== report.status) {
        await supabase
          .from('reports')
          .update({ status: selectedStatus })
          .eq('id', reportData.id);
      }

      const updatedReport = {
        ...report,
        status: selectedStatus,
        updates: [
          ...report.updates,
          {
            date: new Date().toLocaleDateString('pt-BR'),
            note: newUpdate,
            author: "Sistema"
          }
        ]
      };
      
      setReport(updatedReport);
      setNewUpdate("");
      
      toast({
        title: "Atualização salva",
        description: "A denúncia foi atualizada com sucesso.",
      });
    } catch (err) {
      console.error('Erro ao atualizar denúncia:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar a denúncia.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Resolvida</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">Em análise</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
      case 'archived':
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
      setNewUpdate("");
      setSelectedStatus("");
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
                Código de Rastreamento
              </Label>
              <Input
                id="report-id"
                placeholder="Ex: QKTX265"
                value={reportId}
                onChange={handleIdChange}
                className="uppercase"
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
                <h4 className="text-sm font-medium mb-1">Status</h4>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "pending", label: "Pendente" },
                    { value: "in_progress", label: "Em análise" },
                    { value: "resolved", label: "Resolvida" },
                    { value: "archived", label: "Arquivada" }
                  ].map((status) => (
                    <Button
                      key={status.value}
                      variant={selectedStatus === status.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStatus(status.value)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Adicionar Comentário</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Adicionar novo comentário..."
                    value={newUpdate}
                    onChange={(e) => setNewUpdate(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUpdateSubmit}
                    disabled={!newUpdate.trim()}
                    className="w-full"
                  >
                    Adicionar atualização
                  </Button>
                </div>
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
