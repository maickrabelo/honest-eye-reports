import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { supabase } from "@/integrations/supabase/client";
import AIAnalysisCard from '@/components/AIAnalysisCard';
import TrackReportModal from '@/components/TrackReportModal';
import DownloadReportButton from '@/components/DownloadReportButton';

const COLORS = ['#0F3460', '#1A97B9', '#1E6F5C', '#D32626', '#E97E00', '#777777'];

const Dashboard = () => {
  const { profile } = useRealAuth();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.company_id) {
      loadDashboardData();
    }
  }, [profile?.company_id]);

  const loadDashboardData = async () => {
    if (!profile?.company_id) return;
    
    setIsLoading(true);
    try {
      // Fetch all reports for the company
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports(reportsData || []);

      // Calculate stats
      const total = reportsData?.length || 0;
      const pending = reportsData?.filter(r => r.status === 'pending').length || 0;
      const inProgress = reportsData?.filter(r => r.status === 'in_progress').length || 0;
      const resolved = reportsData?.filter(r => r.status === 'resolved').length || 0;

      setStats({ total, pending, inProgress, resolved });

      // Calculate monthly data (last 12 months)
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthCounts: { [key: string]: number } = {};
      
      reportsData?.forEach(report => {
        const date = new Date(report.created_at);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });

      const currentDate = new Date();
      const monthly = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - i), 1);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        return {
          name: monthNames[date.getMonth()],
          denuncias: monthCounts[monthKey] || 0
        };
      });

      setMonthlyData(monthly);

      // Calculate department data
      const deptCounts: { [key: string]: number } = {};
      reportsData?.forEach(report => {
        const dept = report.department || 'Outros';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });

      const deptData = Object.entries(deptCounts).map(([name, value]) => ({ name, value }));
      setDepartmentData(deptData);

      // Calculate status data
      const statusCounts = {
        'Pendentes': pending,
        'Em análise': inProgress,
        'Resolvidas': resolved,
      };

      const statusArr = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
      setStatusData(statusArr);

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReportDetails = async (report: any) => {
    // Fetch report updates
    const { data: updates } = await supabase
      .from('report_updates')
      .select('*')
      .eq('report_id', report.id)
      .order('created_at', { ascending: true });

    setSelectedReport({
      ...report,
      updates: updates || []
    });
    setSelectedStatus(report.status);
    setIsDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !selectedReport) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Updating report:', {
        report_id: selectedReport.id,
        old_status: selectedReport.status,
        new_status: selectedStatus,
        user_id: user.id,
        company_id: profile?.company_id
      });

      // Insert new update
      const { error: updateError } = await supabase
        .from('report_updates')
        .insert({
          report_id: selectedReport.id,
          user_id: user.id,
          old_status: selectedReport.status,
          new_status: selectedStatus,
          notes: responseText
        });

      if (updateError) {
        console.error('Error inserting update:', updateError);
        throw updateError;
      }

      // Update report status if changed
      if (selectedStatus !== selectedReport.status) {
        console.log('Updating report status to:', selectedStatus);
        const { error: statusError } = await supabase
          .from('reports')
          .update({ status: selectedStatus })
          .eq('id', selectedReport.id);

        if (statusError) {
          console.error('Error updating status:', statusError);
          throw statusError;
        }
      }

      toast({
        title: "Atualização salva",
        description: "A denúncia foi atualizada com sucesso.",
      });

      setResponseText("");
      setIsDialogOpen(false);
      loadDashboardData(); // Reload data
    } catch (error: any) {
      console.error('Error in handleSubmitResponse:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar a denúncia."
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendente',
      'in_progress': 'Em análise',
      'resolved': 'Resolvida',
      'archived': 'Arquivada'
    };

    const displayStatus = statusMap[status] || status;

    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">{displayStatus}</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">{displayStatus}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{displayStatus}</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">{displayStatus}</Badge>;
      default:
        return <Badge variant="outline">{displayStatus}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyMap: { [key: string]: string } = {
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa'
    };

    const displayUrgency = urgencyMap[urgency] || urgency;

    switch (urgency) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 border-red-300">{displayUrgency}</Badge>;
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">{displayUrgency}</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-300">{displayUrgency}</Badge>;
      default:
        return <Badge variant="outline">{displayUrgency}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-audit-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-audit-primary">Dashboard</h1>
            <div className="flex gap-4">
              <DownloadReportButton />
              <TrackReportModal />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { title: "Total de Denúncias", value: stats.total.toString(), color: "bg-audit-primary" },
              { title: "Denúncias Pendentes", value: stats.pending.toString(), color: "bg-audit-secondary" },
              { title: "Em Análise", value: stats.inProgress.toString(), color: "bg-audit-accent" },
              { title: "Resolvidas", value: stats.resolved.toString(), color: "bg-green-600" },
            ].map((stat, idx) => (
              <Card key={idx} className="card-hover">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </div>
                  <div className={`h-1 w-full mt-4 ${stat.color} rounded-full`}></div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="mb-8">
                <TabsList className="grid grid-cols-3 mb-4 w-full max-w-md">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="departments">Departamentos</TabsTrigger>
                  <TabsTrigger value="status">Status</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Denúncias por Mês</CardTitle>
                      <CardDescription>Distribuição de denúncias ao longo do último ano</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={monthlyData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="denuncias" stroke="#0F3460" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="departments">
                  <Card>
                    <CardHeader>
                      <CardTitle>Denúncias por Departamento</CardTitle>
                      <CardDescription>Distribuição do total de denúncias por área</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={departmentData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Denúncias">
                              {departmentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="status">
                  <Card>
                    <CardHeader>
                      <CardTitle>Status das Denúncias</CardTitle>
                      <CardDescription>Distribuição do status atual das denúncias</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            <div>
              <AIAnalysisCard />
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Denúncias Recentes</CardTitle>
              <CardDescription>
                Últimas denúncias registradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">ID</th>
                      <th className="px-4 py-3 text-left font-medium">Título</th>
                      <th className="px-4 py-3 text-left font-medium">Categoria</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Data</th>
                      <th className="px-4 py-3 text-left font-medium">Urgência</th>
                      <th className="px-4 py-3 text-left font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Nenhuma denúncia registrada ainda
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr key={report.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-4 text-audit-primary font-medium">{report.tracking_code}</td>
                          <td className="px-4 py-4">{report.title}</td>
                          <td className="px-4 py-4">
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100">
                              {report.category}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(report.status)}
                          </td>
                          <td className="px-4 py-4 text-gray-500">
                            {new Date(report.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-4">
                            {getUrgencyBadge(report.urgency)}
                          </td>
                          <td className="px-4 py-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleOpenReportDetails(report)}
                            >
                              Detalhes
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedReport && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>{selectedReport.title}</span>
                {getStatusBadge(selectedReport.status)}
              </DialogTitle>
              <DialogDescription className="flex justify-between text-sm">
                <span>{selectedReport.tracking_code} • Departamento: {selectedReport.department || 'N/A'}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date(selectedReport.created_at).toLocaleDateString('pt-BR')}
                </span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 my-4">
              <div>
                <h3 className="font-medium mb-2">Resumo da Denúncia (IA)</h3>
                <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-200">
                  {selectedReport.ai_summary || selectedReport.description}
                </p>
              </div>

              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const transcriptDialog = document.getElementById('transcript-dialog') as HTMLDialogElement;
                    if (transcriptDialog) transcriptDialog.showModal();
                  }}
                  className="w-full"
                >
                  Ver Transcrição Completa
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Informações Adicionais</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-600">Categoria:</span>
                    <p className="font-medium mt-1">{selectedReport.category}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-600">Urgência:</span>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      {getUrgencyBadge(selectedReport.urgency)}
                    </p>
                  </div>
                  {selectedReport.reporter_name && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-600">Denunciante:</span>
                      <p className="font-medium mt-1">{selectedReport.reporter_name}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Histórico de Atualizações</h3>
                <div className="space-y-3">
                  {selectedReport.updates?.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma atualização ainda</p>
                  ) : (
                    selectedReport.updates?.map((update: any, idx: number) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0 w-5 h-5 bg-audit-primary rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-gray-700">{update.notes}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {update.old_status !== update.new_status && `Status alterado: ${update.old_status} → ${update.new_status}`}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(update.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Alterar Status</h3>
                <Select 
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em análise</SelectItem>
                    <SelectItem value="resolved">Resolvida</SelectItem>
                    <SelectItem value="archived">Arquivada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Adicionar Atualização</h3>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Adicione uma atualização ou comentário..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitResponse}
                disabled={!responseText.trim() && selectedStatus === selectedReport.status}
              >
                <Check className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Transcript Dialog */}
      <dialog 
        id="transcript-dialog"
        className="p-0 rounded-lg shadow-xl backdrop:bg-black/50 max-w-3xl w-full"
      >
        <div className="bg-white rounded-lg">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Transcrição Completa da Conversa</h3>
            <p className="text-sm text-gray-500 mt-1">Registro completo da interação com a ouvidoria</p>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
              {selectedReport?.description}
            </pre>
          </div>
          <div className="p-6 border-t flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                const transcriptDialog = document.getElementById('transcript-dialog') as HTMLDialogElement;
                if (transcriptDialog) transcriptDialog.close();
              }}
            >
              Fechar
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default Dashboard;
