import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus, Trash2, Eye, Pencil, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OuvidoriaUserRow {
  id: string;
  email: string;
  full_name: string;
  job_title: string | null;
  access_type: string;
  status: string;
  created_at: string;
  user_id: string | null;
}

interface Props {
  companyId: string;
  canEdit: boolean;
}

const OuvidoriaUsersTab = ({ companyId, canEdit }: Props) => {
  const [users, setUsers] = useState<OuvidoriaUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    job_title: '',
    access_type: 'gestor',
  });
  const [lastLink, setLastLink] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ouvidoria_users')
      .select('id, email, full_name, job_title, access_type, status, created_at, user_id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (companyId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const invite = async () => {
    if (!form.email.includes('@') || !form.full_name.trim()) {
      toast({ variant: 'destructive', title: 'Preencha nome e e-mail válidos' });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('invite-ouvidoria-user', {
      body: { company_id: companyId, ...form },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao convidar',
        description: (data as any)?.error || error?.message,
      });
      return;
    }
    setLastLink((data as any)?.accept_url ?? null);
    toast({ title: 'Convite enviado', description: `E-mail enviado para ${form.email}` });
    setForm({ email: '', full_name: '', job_title: '', access_type: 'gestor' });
    setOpen(false);
    load();
  };

  const changeAccess = async (id: string, access_type: string) => {
    const { error } = await supabase.from('ouvidoria_users').update({ access_type }).eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('ouvidoria_users').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    toast({ title: 'Acesso removido' });
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Usuários da ouvidoria</CardTitle>
          <CardDescription>
            <strong>Gestor</strong> edita denúncias, tarefas e notas internas. <strong>Auditor</strong> apenas
            visualiza.
          </CardDescription>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Convidar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {lastLink && (
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-xs">
            <span className="truncate flex-1">{lastLink}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(lastLink);
                toast({ title: 'Link copiado' });
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum usuário adicional. Convide gestores e auditores para acompanhar o canal.
          </p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  {u.job_title && (
                    <p className="text-xs text-muted-foreground">{u.job_title}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.status === 'active' ? 'default' : 'secondary'}>
                    {u.status === 'active' ? 'Ativo' : 'Convite pendente'}
                  </Badge>
                  {canEdit ? (
                    <Select value={u.access_type} onValueChange={(v) => changeAccess(u.id, v)}>
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gestor">Gestor</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">
                      {u.access_type === 'auditor' ? (
                        <><Eye className="h-3 w-3 mr-1" />Auditor</>
                      ) : (
                        <><Pencil className="h-3 w-3 mr-1" />Gestor</>
                      )}
                    </Badge>
                  )}
                  {canEdit && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(u.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar usuário da ouvidoria</DialogTitle>
            <DialogDescription>
              A pessoa recebe um e-mail para criar a senha e acessar o painel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome completo</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Cargo (opcional)</Label>
              <Input
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                placeholder="Ex.: Analista de Compliance"
              />
            </div>
            <div>
              <Label>Tipo de acesso</Label>
              <Select
                value={form.access_type}
                onValueChange={(v) => setForm({ ...form, access_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestor">Gestor — pode editar</SelectItem>
                  <SelectItem value="auditor">Auditor — somente visualizar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={invite} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OuvidoriaUsersTab;
