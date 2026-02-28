import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, User, UserPlus } from "lucide-react";
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useNavigate } from 'react-router-dom';
import { getSafeErrorMessage } from '@/lib/errorUtils';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'company' | 'sst' | 'pending';
  created_at: string;
  company_id: string | null;
  sst_manager_id: string | null;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [sstManagers, setSstManagers] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'sales' as string,
    company_id: '',
    sst_manager_id: '',
  });
  const { toast } = useToast();
  const { role } = useRealAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
    fetchCompanies();
    fetchSSTManagers();
  }, [role]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) throw new Error('Não autenticado');

      const { data, error } = await supabase.functions.invoke('list-users', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar usuários", description: getSafeErrorMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
  };

  const fetchSSTManagers = async () => {
    const { data } = await supabase.from('sst_managers').select('*');
    setSstManagers(data || []);
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name || !newUser.role) {
      toast({ title: "Campos obrigatórios", description: "Preencha email, senha, nome e papel.", variant: "destructive" });
      return;
    }
    if (newUser.role === 'company' && !newUser.company_id) {
      toast({ title: "Empresa obrigatória", description: "Selecione uma empresa para este papel.", variant: "destructive" });
      return;
    }
    if (newUser.role === 'sst' && !newUser.sst_manager_id) {
      toast({ title: "Gestora SST obrigatória", description: "Selecione uma gestora SST para este papel.", variant: "destructive" });
      return;
    }

    try {
      setCreating(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) throw new Error('Não autenticado');

      const body: any = {
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
        role: newUser.role,
      };
      if (newUser.role === 'company') body.company_id = newUser.company_id;
      if (newUser.role === 'sst') body.sst_manager_id = newUser.sst_manager_id;

      const { data, error } = await supabase.functions.invoke('create-user-with-password', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({ title: "Usuário criado", description: `${newUser.full_name} foi criado com sucesso.` });
      setCreateDialogOpen(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'sales', company_id: '', sst_manager_id: '' });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Erro ao criar usuário", description: getSafeErrorMessage(error), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) throw new Error('Não autenticado');

      const { data, error } = await supabase.functions.invoke('update-user-role', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body: { userId, newRole },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({ title: "Papel atualizado", description: "O papel do usuário foi alterado com sucesso." });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar papel", description: getSafeErrorMessage(error), variant: "destructive" });
    }
  };

  const updateUserCompany = async (userId: string, companyId: string | null) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) throw new Error('Não autenticado');

      const { data, error } = await supabase.functions.invoke('update-user-profile', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body: { userId, companyId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({ title: "Empresa atualizada", description: "A empresa do usuário foi alterada com sucesso." });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar empresa", description: getSafeErrorMessage(error), variant: "destructive" });
    }
  };

  const updateUserSST = async (userId: string, sstId: string | null) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) throw new Error('Não autenticado');

      const { data, error } = await supabase.functions.invoke('update-user-profile', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body: { userId, sstManagerId: sstId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({ title: "Gestora SST atualizada", description: "A gestora SST do usuário foi alterada com sucesso." });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar gestora SST", description: getSafeErrorMessage(error), variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: <Badge className="bg-red-500">Admin</Badge>,
      company: <Badge className="bg-blue-500">Empresa</Badge>,
      sst: <Badge className="bg-green-500">SST</Badge>,
      sales: <Badge className="bg-orange-500">Comercial</Badge>,
      pending: <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>,
    };
    return badges[role as keyof typeof badges] || <Badge>Desconhecido</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-muted/30 py-8">
        <div className="audit-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Shield className="h-8 w-8" />
                Gestão de Usuários
              </h1>
              <p className="text-muted-foreground">Gerencie papéis e permissões dos usuários</p>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Criar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Nome completo *</Label>
                    <Input
                      value={newUser.full_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Nome do usuário"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha *</Label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Senha inicial"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Papel *</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value, company_id: '', sst_manager_id: '' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="company">Empresa</SelectItem>
                        <SelectItem value="sst">SST</SelectItem>
                        <SelectItem value="sales">Comercial</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newUser.role === 'company' && (
                    <div className="space-y-2">
                      <Label>Empresa *</Label>
                      <Select
                        value={newUser.company_id || undefined}
                        onValueChange={(value) => setNewUser(prev => ({ ...prev, company_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {newUser.role === 'sst' && (
                    <div className="space-y-2">
                      <Label>Gestora SST *</Label>
                      <Select
                        value={newUser.sst_manager_id || undefined}
                        onValueChange={(value) => setNewUser(prev => ({ ...prev, sst_manager_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar gestora" />
                        </SelectTrigger>
                        <SelectContent>
                          {sstManagers.map((sst) => (
                            <SelectItem key={sst.id} value={sst.id}>
                              {sst.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleCreateUser} disabled={creating}>
                    {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted rounded-full p-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.full_name || 'Sem nome'}</CardTitle>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Papel</label>
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="company">Empresa</SelectItem>
                          <SelectItem value="sst">SST</SelectItem>
                          <SelectItem value="sales">Comercial</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {user.role === 'company' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Empresa</label>
                        <Select
                          value={user.company_id || 'none'}
                          onValueChange={(value) => updateUserCompany(user.id, value === 'none' ? null : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {user.role === 'sst' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Gestora SST</label>
                        <Select
                          value={user.sst_manager_id || 'none'}
                          onValueChange={(value) => updateUserSST(user.id, value === 'none' ? null : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar gestora" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {sstManagers.map((sst) => (
                              <SelectItem key={sst.id} value={sst.id}>
                                {sst.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserManagement;
