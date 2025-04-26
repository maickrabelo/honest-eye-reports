
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Building, UserCheck, Edit, Trash } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

// Mock data for companies and SST managers
const mockCompanies = [
  { id: "1", name: "Tech Solutions Ltda", email: "contato@techsol.com", reports: 12, createdAt: "12/04/2025" },
  { id: "2", name: "Indústrias ABC", email: "admin@abc.ind.br", reports: 8, createdAt: "10/03/2025" },
  { id: "3", name: "Comércio XYZ", email: "xyz@comercio.com", reports: 5, createdAt: "05/02/2025" },
  { id: "4", name: "Serviços Especializados", email: "contato@se.com.br", reports: 15, createdAt: "20/01/2025" },
];

const mockSSTManagers = [
  { id: "1", name: "SST Consultoria", email: "contato@sstconsult.com", companies: 8, createdAt: "15/03/2025" },
  { id: "2", name: "Segurança Trabalho Ltda", email: "atendimento@segtrabalho.com.br", companies: 12, createdAt: "10/01/2025" },
  { id: "3", name: "Proteção Ocupacional", email: "contato@protecao.com", companies: 5, createdAt: "08/04/2025" },
];

const MasterDashboard = () => {
  const [activeTab, setActiveTab] = useState("companies");
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [sstSearchTerm, setSSTSearchTerm] = useState('');
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddSSTOpen, setIsAddSSTOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const filteredCompanies = mockCompanies.filter(company => 
    company.name.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(companySearchTerm.toLowerCase())
  );
  
  const filteredSSTManagers = mockSSTManagers.filter(manager => 
    manager.name.toLowerCase().includes(sstSearchTerm.toLowerCase()) ||
    manager.email.toLowerCase().includes(sstSearchTerm.toLowerCase())
  );

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Empresa adicionada",
      description: "A empresa foi adicionada com sucesso."
    });
    setIsAddCompanyOpen(false);
  };

  const handleAddSST = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Gestora SST adicionada",
      description: "A empresa gestora SST foi adicionada com sucesso."
    });
    setIsAddSSTOpen(false);
  };

  const handleViewCompany = (id: string) => {
    navigate(`/company-dashboard/${id}`);
  };

  const handleViewSST = (id: string) => {
    navigate(`/sst-dashboard/${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-audit-primary">Painel Administrativo</h1>
          </div>
          
          <Tabs defaultValue="companies" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="companies">Empresas</TabsTrigger>
                <TabsTrigger value="sst">Gestoras SST</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-4">
                {activeTab === "companies" ? (
                  <>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar empresa..."
                        value={companySearchTerm}
                        onChange={(e) => setCompanySearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Dialog open={isAddCompanyOpen} onOpenChange={setIsAddCompanyOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Empresa
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Nova Empresa</DialogTitle>
                          <DialogDescription>
                            Preencha os dados para cadastrar uma nova empresa no sistema.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddCompany}>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="companyName">Nome da Empresa</Label>
                              <Input id="companyName" placeholder="Nome da empresa" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="companyEmail">Email</Label>
                              <Input id="companyEmail" type="email" placeholder="contato@empresa.com" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="companyPassword">Senha inicial</Label>
                              <Input id="companyPassword" type="password" placeholder="********" required />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Adicionar Empresa</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar gestora SST..."
                        value={sstSearchTerm}
                        onChange={(e) => setSSTSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Dialog open={isAddSSTOpen} onOpenChange={setIsAddSSTOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Gestora SST
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Nova Gestora SST</DialogTitle>
                          <DialogDescription>
                            Preencha os dados para cadastrar uma nova empresa gestora de SST.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddSST}>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="sstName">Nome da Gestora SST</Label>
                              <Input id="sstName" placeholder="Nome da empresa" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="sstEmail">Email</Label>
                              <Input id="sstEmail" type="email" placeholder="contato@gestora.com" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="sstPassword">Senha inicial</Label>
                              <Input id="sstPassword" type="password" placeholder="********" required />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Adicionar Gestora SST</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
            
            <TabsContent value="companies">
              <Card>
                <CardHeader>
                  <CardTitle>Empresas Cadastradas</CardTitle>
                  <CardDescription>
                    Lista de todas as empresas no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left font-medium">Empresa</th>
                          <th className="px-4 py-3 text-left font-medium">Email</th>
                          <th className="px-4 py-3 text-left font-medium">Data de cadastro</th>
                          <th className="px-4 py-3 text-left font-medium">Denúncias</th>
                          <th className="px-4 py-3 text-left font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCompanies.map((company) => (
                          <tr key={company.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-md bg-audit-primary/10 flex items-center justify-center mr-3">
                                  <Building className="h-4 w-4 text-audit-primary" />
                                </div>
                                {company.name}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-gray-500">{company.email}</td>
                            <td className="px-4 py-4 text-gray-500">{company.createdAt}</td>
                            <td className="px-4 py-4">{company.reports}</td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewCompany(company.id)}
                                >
                                  Ver
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {filteredCompanies.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Nenhuma empresa encontrada</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="sst">
              <Card>
                <CardHeader>
                  <CardTitle>Gestoras SST Cadastradas</CardTitle>
                  <CardDescription>
                    Lista de todas as empresas gestoras de SST no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left font-medium">Gestora</th>
                          <th className="px-4 py-3 text-left font-medium">Email</th>
                          <th className="px-4 py-3 text-left font-medium">Data de cadastro</th>
                          <th className="px-4 py-3 text-left font-medium">Empresas geridas</th>
                          <th className="px-4 py-3 text-left font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSSTManagers.map((manager) => (
                          <tr key={manager.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-md bg-audit-accent/10 flex items-center justify-center mr-3">
                                  <UserCheck className="h-4 w-4 text-audit-accent" />
                                </div>
                                {manager.name}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-gray-500">{manager.email}</td>
                            <td className="px-4 py-4 text-gray-500">{manager.createdAt}</td>
                            <td className="px-4 py-4">{manager.companies}</td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewSST(manager.id)}
                                >
                                  Ver
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {filteredSSTManagers.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Nenhuma gestora SST encontrada</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MasterDashboard;
