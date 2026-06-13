import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorUtils";

interface Props {
  companies: any[];
  sstManagers: any[];
  onCreated: () => void;
}

const CreateUserDialog: React.FC<Props> = ({ companies, sstManagers, onCreated }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'sales' as string,
    company_id: '',
    sst_manager_id: '',
  });

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
      setOpen(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'sales', company_id: '', sst_manager_id: '' });
      onCreated();
    } catch (error: any) {
      toast({ title: "Erro ao criar usuário", description: getSafeErrorMessage(error), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
  );
};

export default React.memo(CreateUserDialog);
