import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ExportUserDataDialog = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!email.trim()) {
      toast({ title: 'Informe um e-mail', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) throw new Error('Não autenticado');

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-user-data?email=${encodeURIComponent(email.trim())}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${session.session.access_token}` } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Falha ao exportar');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || `user-export-${email}.json`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: 'Exportação concluída', description: filename });
      setOpen(false);
      setEmail('');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" /> Exportar dados de usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar dados de usuário</DialogTitle>
          <DialogDescription>
            Gera um JSON completo (perfil, papéis, empresas, gestora SST, avaliações HSE-IT/COPSOQ/Burnout/Clima, PGR e denúncias) no mesmo formato usado nas exportações anteriores.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="export-email">E-mail do usuário</Label>
          <Input
            id="export-email"
            type="email"
            placeholder="usuario@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExport()}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exportando…</> : <><Download className="mr-2 h-4 w-4" />Exportar JSON</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
