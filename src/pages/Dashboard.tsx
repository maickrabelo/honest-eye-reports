import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import BackButton from '@/components/BackButton';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AIAnalysisCard from '@/components/AIAnalysisCard';
import TrackReportModal from '@/components/TrackReportModal';
import DownloadReportButton from '@/components/DownloadReportButton';

const monthlyData = [
  { name: 'Jan', denuncias: 4 },
  { name: 'Fev', denuncias: 3 },
  { name: 'Mar', denuncias: 5 },
  { name: 'Abr', denuncias: 7 },
  { name: 'Mai', denuncias: 2 },
  { name: 'Jun', denuncias: 6 },
  { name: 'Jul', denuncias: 8 },
  { name: 'Ago', denuncias: 9 },
  { name: 'Set', denuncias: 4 },
  { name: 'Out', denuncias: 3 },
  { name: 'Nov', denuncias: 1 },
  { name: 'Dez', denuncias: 5 },
];

const departmentData = [
  { name: 'RH', value: 32 },
  { name: 'Comercial', value: 21 },
  { name: 'Produção', value: 18 },
  { name: 'TI', value: 14 },
  { name: 'Financeiro', value: 9 },
  { name: 'Outros', value: 6 },
];

const statusData = [
  { name: 'Abertas', value: 24 },
  { name: 'Em análise', value: 18 },
  { name: 'Resolvidas', value: 35 },
  { name: 'Arquivadas', value: 12 },
];

const COLORS = ['#0F3460', '#1A97B9', '#1E6F5C', '#D32626', '#E97E00', '#777777'];

const recentReports = [
  {
    id: "REP-2025-042",
    title: "Assédio moral no setor de atendimento",
    category: "RH",
    status: "Em análise",
    date: "23/04/2025",
    urgency: "Alta",
    description: "Funcionário relata comportamento inadequado de supervisor, incluindo gritos e humilhação pública durante reuniões de equipe. Incidentes ocorreram múltiplas vezes nas últimas semanas.",
    department: "Atendimento ao Cliente",
    updates: [
      { date: "23/04/2025", note: "Denúncia recebida e registrada no sistema.", author: "Sistema" },
      { date: "24/04/2025", note: "Análise inicial concluída. Encaminhado para RH para investigação.", author: "Admin" }
    ]
  },
  {
    id: "REP-2025-041",
    title: "Descarte inadequado de resíduos",
    category: "Produção",
    status: "Aberta",
    date: "22/04/2025",
    urgency: "Média",
    description: "Denúncia sobre materiais tóxicos sendo descartados incorretamente, sem seguir os protocolos ambientais da empresa. Situação observada no setor de produção, área B.",
    department: "Produção",
    updates: [
      { date: "22/04/2025", note: "Denúncia recebida e registrada no sistema.", author: "Sistema" }
    ]
  },
  {
    id: "REP-2025-040",
    title: "Divergências em relatório financeiro",
    category: "Financeiro",
    status: "Em análise",
    date: "20/04/2025",
    urgency: "Alta",
    description: "Identificadas divergências significativas entre os valores reportados internamente e os apresentados aos investidores no último trimestre. Possível manipulação de dados financeiros.",
    department: "Financeiro",
    updates: [
      { date: "20/04/2025", note: "Denúncia recebida e registrada no sistema.", author: "Sistema" },
      { date: "21/04/2025", note: "Análise preliminar indica possíveis inconsistências nos relatórios. Investigação aprofundada necessária.", author: "Admin" }
    ]
  },
  {
    id: "REP-2025-039",
    title: "Uso inadequado de recursos da empresa",
    category: "TI",
    status: "Resolvida",
    date: "18/04/2025",
    urgency: "Baixa",
    description: "Uso de equipamentos da empresa (laptops e servidores) para mineração de criptomoedas durante o horário de trabalho, causando lentidão na rede e alto consumo de energia.",
    department: "TI",
    updates: [
      { date: "18/04/2025", note: "Denúncia recebida e registrada no sistema.", author: "Sistema" },
      { date: "19/04/2025", note: "Verificação técnica iniciada nos equipamentos mencionados.", author: "Suporte TI" },
      { date: "20/04/2025", note: "Confirmado o uso indevido. Medidas disciplinares aplicadas e software de monitoramento atualizado.", author: "Gerente TI" },
      { date: "21/04/2025", note: "Caso encerrado. Novas políticas de uso implementadas.", author: "Admin" }
    ]
  },
];

const Dashboard = () => {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const showBackButton = user?.role === 'master' || user?.role === 'sst';

  const handleOpenReportDetails = (report: any) => {
    setSelectedReport(report);
    setSelectedStatus(report.status);
    setIsDialogOpen(true);
  };

  const handleSubmitResponse = () => {
    if (!responseText.trim()) return;

    const updatedReport = {
      ...selectedReport,
      updates: [
        ...selectedReport.updates,
        {
          date: new Date().toLocaleDateString('pt-BR'),
          note: responseText,
          author: "Admin"
        }
      ]
    };

    if (selectedStatus !== selectedReport.status) {
      updatedReport.status = selectedStatus;
    }

    setSelectedReport(updatedReport);
    setResponseText("");
    
    toast({
      title: "Atualização salva",
      description: "A denúncia foi atualizada com sucesso.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolvida':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Resolvida</Badge>;
      case 'Em análise':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Em análise</Badge>;
      case 'Aberta':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Aberta</Badge>;
      case 'Arquivada':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Arquivada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-green-50 py-8">
        <div className="audit-container">
          {showBackButton && <BackButton />}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-green-800">Dashboard</h1>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/profile')}
                className="bg-white hover:bg-green-50"
              >
                Editar Perfil
              </Button>
              <DownloadReportButton />
              <TrackReportModal fixedPrefix="REP" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { title: "Total de Denúncias", value: "89", change: "+12%", color: "bg-audit-primary" },
              { title: "Denúncias Abertas", value: "24", change: "-3%", color: "bg-audit-secondary" },
              { title: "Em Análise", value: "18", change: "+5%", color: "bg-audit-accent" },
              { title: "Resolvidas", value: "47", change: "+15%", color: "bg-green-600" },
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
                    <div className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} desde o mês anterior
                    </div>
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
                    {recentReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-4 text-audit-primary font-medium">{report.id}</td>
                        <td className="px-4 py-4">{report.title}</td>
                        <td className="px-4 py-4">
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100">
                            {report.category}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            report.status === "Resolvida" ? "bg-green-100 text-green-800" : 
                            report.status === "Em análise" ? "bg-blue-100 text-blue-800" :
                            report.status === "Aberta" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-500">{report.date}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            report.urgency === "Alta" ? "bg-red-100 text-red-800" : 
                            report.urgency === "Média" ? "bg-orange-100 text-orange-800" : 
                            "bg-green-100 text-green-800"
                          }`}>
                            {report.urgency}
                          </span>
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
                    ))}
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
                <span>{selectedReport.id} • Departamento: {selectedReport.department}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {selectedReport.date}
                </span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 my-4">
              <div>
                <h3 className="font-medium mb-2">Descrição da Denúncia</h3>
                <p className="text-gray-700">{selectedReport.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-gray-100">
                  Categoria: {selectedReport.category}
                </Badge>
                <Badge variant="outline" className={`${
                  selectedReport.urgency === "Alta" ? "bg-red-100 text-red-800 border-red-200" : 
                  selectedReport.urgency === "Média" ? "bg-orange-100 text-orange-800 border-orange-200" : 
                  "bg-green-100 text-green-800 border-green-200"
                }`}>
                  Urgência: {selectedReport.urgency}
                </Badge>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Histórico de Atualizações</h3>
                <div className="space-y-3">
                  {selectedReport.updates.map((update: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-md border">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{update.author}</span>
                        <span className="text-gray-500">{update.date}</span>
                      </div>
                      <p className="text-gray-700">{update.note}</p>
                    </div>
                  ))}
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
                    <SelectItem value="Aberta">Aberta</SelectItem>
                    <SelectItem value="Em análise">Em análise</SelectItem>
                    <SelectItem value="Resolvida">Resolvida</SelectItem>
                    <SelectItem value="Arquivada">Arquivada</SelectItem>
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
    </div>
  );
};

export default Dashboard;
