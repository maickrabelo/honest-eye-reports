import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Shield, CheckCircle2 } from 'lucide-react';

export default function AcceptSectorInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data: inv } = await supabase
          .from('sector_viewer_invitations').select('*').eq('token', token).maybeSingle();
        if (!inv) { toast({ title: 'Convite não encontrado', variant: 'destructive' }); return; }
        if (inv.status !== 'pending') { toast({ title: 'Convite já utilizado ou revogado', variant: 'destructive' }); return; }
        if (new Date(inv.expires_at) < new Date()) { toast({ title: 'Convite expirado', variant: 'destructive' }); return; }
        setInvitation(inv);
        const { data: c } = await supabase.from('companies').select('name').eq('id', inv.company_id).maybeSingle();
        setCompanyName(c?.name ?? '');
      } finally { setLoading(false); }
    })();
  }, [token]);

  const handleSubmit = async () => {
    if (password.length < 8) {
      toast({ title: 'Senha precisa ter no mínimo 8 caracteres', variant: 'destructive' }); return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('accept-sector-viewer-invitation', {
        body: { token, password, full_name: fullName },
      });
      if (error) throw error;
      // Login
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: invitation.email, password,
      });
      if (signInErr) throw signInErr;
      setDone(true);
      setTimeout(() => navigate('/setor/dashboard'), 800);
    } catch (e: any) {
      toast({ title: 'Erro ao aceitar convite', description: e.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!invitation) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="pt-6 text-center">
        <p className="text-muted-foreground">Convite inválido ou expirado.</p>
        <Button className="mt-4" onClick={() => navigate('/')}>Início</Button>
      </CardContent></Card>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="pt-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h2 className="text-xl font-semibold mb-2">Acesso ativado!</h2>
        <p className="text-muted-foreground">Redirecionando…</p>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Acesso por setor</CardTitle>
          </div>
          <CardDescription>
            Você foi convidado para visualizar dados da avaliação{' '}
            <strong>{invitation.assessment_type.toUpperCase()}</strong> da empresa{' '}
            <strong>{companyName}</strong>.
            <br />
            <span className="text-xs">Setores liberados: {(invitation.department_names as string[]).join(', ')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={invitation.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full-name">Seu nome</Label>
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd">Defina uma senha</Label>
            <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Aceitar e acessar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
