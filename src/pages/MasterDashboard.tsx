import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Building, UserCheck, Edit, Trash, ArrowLeft, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  created_at: string;
};

type SSTManager = {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  created_at: string;
};

type Assignment = {
  id: string;
  company_id: string;
  sst_manager_id: string;
  assigned_at: string;
};

const MasterDashboard = () => {
  const [activeTab, setActiveTab] = useState("companies");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sstManagers, setSSTManagers] = useState<SSTManager[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [sstSearchTerm, setSSTSearchTerm] = useState('');
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddSSTOpen, setIsAddSSTOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedSST, setSelectedSST] = useState<SSTManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratePasswordOpen, setIsGeneratePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ entity: '', type: '', email: '', name: '', id: '' });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [companiesRes, sstRes, assignmentsRes] = await Promise.all([
        supabase.from('companies').select('*').order('created_at', { ascending: false }),
        supabase.from('sst_managers').select('*').order('created_at', { ascending: false }),
        supabase.from('company_sst_assignments').select('*')
      ]);

      if (companiesRes.error) throw companiesRes.error;
      if (sstRes.error) throw sstRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      setCompanies(companiesRes.data || []);
      setSSTManagers(sstRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do sistema.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
    (company.email && company.email.toLowerCase().includes(companySearchTerm.toLowerCase()))
  );
  
  const filteredSSTManagers = sstManagers.filter(manager => 
    manager.name.toLowerCase().includes(sstSearchTerm.toLowerCase()) ||
    (manager.email && manager.email.toLowerCase().includes(sstSearchTerm.toLowerCase()))
  );

  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase.from('companies').insert({
        name: formData.get('companyName') as string,
        email: formData.get('companyEmail') as string,
        cnpj: formData.get('companyCNPJ') as string,
        phone: formData.get('companyPhone') as string,
        address: formData.get('companyAddress') as string,
      });

      if (error) throw error;

      toast({
        title: "Empresa adicionada",
        description: "A empresa foi adicionada com sucesso."
      });
      setIsAddCompanyOpen(false);
      loadData();
    } catch (error) {
      console.error('Error adding company:', error);
      toast({
        title: "Erro ao adicionar empresa",
        description: "Não foi possível adicionar a empresa.",
        variant: "destructive"
      });
    }
  };

  const handleAddSST = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase.from('sst_managers').insert({
        name: formData.get('sstName') as string,
        email: formData.get('sstEmail') as string,
        cnpj: formData.get('sstCNPJ') as string,
        phone: formData.get('sstPhone') as string,
        address: formData.get('sstAddress') as string,
      });

      if (error) throw error;

      toast({
        title: "Gestora SST adicionada",
        description: "A empresa gestora SST foi adicionada com sucesso."
      });
      setIsAddSSTOpen(false);
      loadData();
    } catch (error) {
      console.error('Error adding SST manager:', error);
      toast({
        title: "Erro ao adicionar gestora SST",
        description: "Não foi possível adicionar a gestora SST.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;
    
    try {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
      
      toast({
        title: "Empresa excluída",
        description: "A empresa foi excluída com sucesso."
      });
      loadData();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Erro ao excluir empresa",
        description: "Não foi possível excluir a empresa.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSST = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta gestora SST?')) return;
    
    try {
      const { error } = await supabase.from('sst_managers').delete().eq('id', id);
      if (error) throw error;
      
      toast({
        title: "Gestora SST excluída",
        description: "A gestora SST foi excluída com sucesso."
      });
      loadData();
    } catch (error) {
      console.error('Error deleting SST manager:', error);
      toast({
        title: "Erro ao excluir gestora SST",
        description: "Não foi possível excluir a gestora SST.",
        variant: "destructive"
      });
    }
  };

  const handleAssignSST = async (companyId: string, sstManagerId: string) => {
    try {
      const { error } = await supabase.from('company_sst_assignments').upsert({
        company_id: companyId,
        sst_manager_id: sstManagerId
      });

      if (error) throw error;

      toast({
        title: "Atribuição realizada",
        description: "A gestora SST foi atribuída à empresa com sucesso."
      });
      loadData();
    } catch (error) {
      console.error('Error assigning SST:', error);
      toast({
        title: "Erro ao atribuir gestora SST",
        description: "Não foi possível atribuir a gestora SST.",
        variant: "destructive"
      });
    }
  };

  const getAssignedSST = (companyId: string) => {
    const assignment = assignments.find(a => a.company_id === companyId);
    if (!assignment) return null;
    return sstManagers.find(sst => sst.id === assignment.sst_manager_id);
  };

  const getAssignedCompanies = (sstId: string) => {
    const assignedCompanyIds = assignments
      .filter(a => a.sst_manager_id === sstId)
      .map(a => a.company_id);
    return companies.filter(c => assignedCompanyIds.includes(c.id));
  };

  const handleOpenGeneratePassword = (entity: Company | SSTManager, type: 'company' | 'sst') => {
    setPasswordData({
      entity: entity.name,
      type,
      email: entity.email || '',
      name: entity.name,
      id: entity.id
    });
    setGeneratedPassword('');
    setIsGeneratePasswordOpen(true);
  };

  const handleGeneratePassword = async (password: string) => {
    if (!password || password.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-with-password', {
        body: {
          email: passwordData.email,
          password: password,
          full_name: passwordData.name,
          role: passwordData.type,
          company_id: passwordData.type === 'company' ? passwordData.id : null,
          sst_manager_id: passwordData.type === 'sst' ? passwordData.id : null,
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setGeneratedPassword(password);
      toast({
        title: "Usuário criado",
        description: `Usuário criado com sucesso. Login: ${passwordData.email}`,
      });
    } catch (error: any) {
      console.error('Error generating password:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 py-8 flex items-center justify-center">
          <p>Carregando...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Company Detail View
  if (selectedCompany) {
    const assignedSST = getAssignedSST(selectedCompany.id);
    
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="audit-container">
            <Button variant="ghost" onClick={() => setSelectedCompany(null)} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle>{selectedCompany.name}</CardTitle>
                <CardDescription>Detalhes da empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-base">{selectedCompany.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">CNPJ</Label>
                    <p className="text-base">{selectedCompany.cnpj || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                    <p className="text-base">{selectedCompany.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                    <p className="text-base">{selectedCompany.address || '-'}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <Label className="text-sm font-medium mb-3 block">Acesso ao Sistema</Label>
                  <Button 
                    variant="outline" 
                    className="w-full mb-4"
                    onClick={() => handleOpenGeneratePassword(selectedCompany, 'company')}
                  >
                    Gerar Senha de Acesso
                  </Button>
                </div>

                <div className="border-t pt-4 mt-4">
                  <Label className="text-sm font-medium mb-2 block">Gestora SST</Label>
                  {assignedSST ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{assignedSST.name}</p>
                        <p className="text-sm text-gray-500">{assignedSST.email}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={async () => {
                          const assignment = assignments.find(a => a.company_id === selectedCompany.id);
                          if (assignment) {
                            await supabase.from('company_sst_assignments').delete().eq('id', assignment.id);
                            loadData();
                            toast({ title: "Atribuição removida" });
                          }
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <Select onValueChange={(value) => handleAssignSST(selectedCompany.id, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma gestora SST" />
                      </SelectTrigger>
                      <SelectContent>
                        {sstManagers.map(sst => (
                          <SelectItem key={sst.id} value={sst.id}>{sst.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // SST Detail View
  if (selectedSST) {
    const assignedCompanies = getAssignedCompanies(selectedSST.id);
    
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="audit-container">
            <Button variant="ghost" onClick={() => setSelectedSST(null)} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle>{selectedSST.name}</CardTitle>
                <CardDescription>Detalhes da gestora SST</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-base">{selectedSST.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">CNPJ</Label>
                    <p className="text-base">{selectedSST.cnpj || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                    <p className="text-base">{selectedSST.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                    <p className="text-base">{selectedSST.address || '-'}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <Label className="text-sm font-medium mb-3 block">Acesso ao Sistema</Label>
                  <Button 
                    variant="outline" 
                    className="w-full mb-4"
                    onClick={() => handleOpenGeneratePassword(selectedSST, 'sst')}
                  >
                    Gerar Senha de Acesso
                  </Button>
                </div>

                <div className="border-t pt-4 mt-4">
                  <Label className="text-sm font-medium mb-2 block">Atribuir Empresa</Label>
                  <Select onValueChange={(value) => handleAssignSST(value, selectedSST.id)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.filter(c => !getAssignedSST(c.id)).map(company => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4 mt-4">
                  <Label className="text-sm font-medium mb-3 block">Empresas Atribuídas ({assignedCompanies.length})</Label>
                  <div className="space-y-2">
                    {assignedCompanies.map(company => (
                      <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-gray-500">{company.email}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={async () => {
                            const assignment = assignments.find(a => a.company_id === company.id);
                            if (assignment) {
                              await supabase.from('company_sst_assignments').delete().eq('id', assignment.id);
                              loadData();
                              toast({ title: "Empresa removida" });
                            }
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                    {assignedCompanies.length === 0 && (
                      <p className="text-gray-500 text-sm">Nenhuma empresa atribuída</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                              <Input id="companyName" name="companyName" placeholder="Nome da empresa" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="companyEmail">Email</Label>
                              <Input id="companyEmail" name="companyEmail" type="email" placeholder="contato@empresa.com" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="companyCNPJ">CNPJ</Label>
                              <Input id="companyCNPJ" name="companyCNPJ" placeholder="00.000.000/0000-00" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="companyPhone">Telefone</Label>
                              <Input id="companyPhone" name="companyPhone" placeholder="(00) 0000-0000" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="companyAddress">Endereço</Label>
                              <Input id="companyAddress" name="companyAddress" placeholder="Endereço completo" />
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
                              <Input id="sstName" name="sstName" placeholder="Nome da empresa" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="sstEmail">Email</Label>
                              <Input id="sstEmail" name="sstEmail" type="email" placeholder="contato@gestora.com" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="sstCNPJ">CNPJ</Label>
                              <Input id="sstCNPJ" name="sstCNPJ" placeholder="00.000.000/0000-00" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="sstPhone">Telefone</Label>
                              <Input id="sstPhone" name="sstPhone" placeholder="(00) 0000-0000" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="sstAddress">Endereço</Label>
                              <Input id="sstAddress" name="sstAddress" placeholder="Endereço completo" />
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
                          <th className="px-4 py-3 text-left font-medium">CNPJ</th>
                          <th className="px-4 py-3 text-left font-medium">Gestora SST</th>
                          <th className="px-4 py-3 text-left font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCompanies.map((company) => {
                          const assignedSST = getAssignedSST(company.id);
                          return (
                            <tr key={company.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-md bg-audit-primary/10 flex items-center justify-center mr-3">
                                    <Building className="h-4 w-4 text-audit-primary" />
                                  </div>
                                  {company.name}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-gray-500">{company.email || '-'}</td>
                              <td className="px-4 py-4 text-gray-500">{company.cnpj || '-'}</td>
                              <td className="px-4 py-4 text-gray-500">
                                {assignedSST ? assignedSST.name : '-'}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleOpenGeneratePassword(company, 'company')}
                                    title="Gerar senha de acesso"
                                  >
                                    <Key className="h-4 w-4 mr-1" />
                                    Senha
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedCompany(company)}
                                  >
                                    Ver
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                    onClick={() => handleDeleteCompany(company.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
                          <th className="px-4 py-3 text-left font-medium">CNPJ</th>
                          <th className="px-4 py-3 text-left font-medium">Empresas geridas</th>
                          <th className="px-4 py-3 text-left font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSSTManagers.map((manager) => {
                          const assignedCompanies = getAssignedCompanies(manager.id);
                          return (
                            <tr key={manager.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-md bg-audit-accent/10 flex items-center justify-center mr-3">
                                    <UserCheck className="h-4 w-4 text-audit-accent" />
                                  </div>
                                  {manager.name}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-gray-500">{manager.email || '-'}</td>
                              <td className="px-4 py-4 text-gray-500">{manager.cnpj || '-'}</td>
                              <td className="px-4 py-4">{assignedCompanies.length}</td>
                              <td className="px-4 py-4">
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleOpenGeneratePassword(manager, 'sst')}
                                    title="Gerar senha de acesso"
                                  >
                                    <Key className="h-4 w-4 mr-1" />
                                    Senha
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedSST(manager)}
                                  >
                                    Ver
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                    onClick={() => handleDeleteSST(manager.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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

      {/* Dialog para gerar senha */}
      <Dialog open={isGeneratePasswordOpen} onOpenChange={setIsGeneratePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Senha de Acesso</DialogTitle>
            <DialogDescription>
              Crie uma senha para o usuário acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Entidade</Label>
              <p className="text-sm font-medium">{passwordData.entity}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Email (Login)</Label>
              <p className="text-sm font-medium">{passwordData.email}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo</Label>
              <p className="text-sm font-medium capitalize">{passwordData.type === 'company' ? 'Empresa' : 'Gestora SST'}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="text" 
                placeholder="Digite a senha (mínimo 6 caracteres)"
                defaultValue={generatedPassword}
              />
            </div>

            {generatedPassword && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  <strong>✓ Usuário criado com sucesso!</strong><br/>
                  Login: {passwordData.email}<br/>
                  Senha: {generatedPassword}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsGeneratePasswordOpen(false)}
            >
              Fechar
            </Button>
            <Button 
              onClick={() => {
                const input = document.getElementById('password') as HTMLInputElement;
                handleGeneratePassword(input.value);
              }}
              disabled={isGenerating}
            >
              {isGenerating ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterDashboard;