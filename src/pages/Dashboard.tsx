
import React from 'react';
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

// Dados de exemplo para os gráficos
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

// Lista de denúncias recentes (exemplo)
const recentReports = [
  {
    id: "REP-2025-042",
    title: "Assédio moral no setor de atendimento",
    category: "RH",
    status: "Em análise",
    date: "23/04/2025",
    urgency: "Alta",
  },
  {
    id: "REP-2025-041",
    title: "Descarte inadequado de resíduos",
    category: "Produção",
    status: "Aberta",
    date: "22/04/2025",
    urgency: "Média",
  },
  {
    id: "REP-2025-040",
    title: "Divergências em relatório financeiro",
    category: "Financeiro",
    status: "Em análise",
    date: "20/04/2025",
    urgency: "Alta",
  },
  {
    id: "REP-2025-039",
    title: "Uso inadequado de recursos da empresa",
    category: "TI",
    status: "Resolvida",
    date: "18/04/2025",
    urgency: "Baixa",
  },
];

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container">
          <h1 className="text-3xl font-bold text-audit-primary mb-8">Dashboard</h1>
          
          {/* Cards de estatísticas */}
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
          
          {/* Gráficos */}
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
          
          {/* Denúncias Recentes */}
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
    </div>
  );
};

export default Dashboard;
