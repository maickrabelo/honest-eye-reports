import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Copy, RefreshCw, Send, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

const WEBHOOK_URL = `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/hotmart-webhook`;

interface WebhookConfig {
  provider: string;
  token: string | null;
  enabled: boolean;
  notes: string | null;
  updated_at: string;
}

interface WebhookLog {
  id: string;
  provider: string;
  event_type: string | null;
  status_code: number | null;
  source_ip: string | null;
  headers: any;
  payload: any;
  response: any;
  error: string | null;
  received_at: string;
}

export function WebhooksTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [cfg, setCfg] = useState<WebhookConfig | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [selected, setSelected] = useState<WebhookLog | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('webhook_configs').select('*').eq('provider', 'hotmart').maybeSingle(),
      supabase.from('webhook_logs').select('*').eq('provider', 'hotmart')
        .order('received_at', { ascending: false }).limit(50),
    ]);
    setCfg(c as any);
    setTokenInput((c as any)?.token ?? '');
    setLogs((l ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveToken = async () => {
    setSaving(true);
    const { error } = await supabase.from('webhook_configs')
      .update({ token: tokenInput.trim() || null, updated_at: new Date().toISOString() })
      .eq('provider', 'hotmart');
    setSaving(false);
    if (error) return toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    toast({ title: 'Token salvo' });
    load();
  };

  const toggleEnabled = async (enabled: boolean) => {
    const { error } = await supabase.from('webhook_configs')
      .update({ enabled }).eq('provider', 'hotmart');
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    setCfg(c => c ? { ...c, enabled } : c);
  };

  const sendTest = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke('test-hotmart-webhook', {
      body: { token: tokenInput.trim() || undefined },
    });
    setTesting(false);
    if (error) return toast({ title: 'Erro no teste', description: error.message, variant: 'destructive' });
    const ok = (data as any)?.ok;
    toast({
      title: ok ? '✓ Webhook respondeu OK' : `✗ Status ${(data as any)?.status}`,
      description: `${(data as any)?.duration_ms}ms • token: ${(data as any)?.token_used_preview}`,
      variant: ok ? 'default' : 'destructive',
    });
    load();
  };

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast({ title: 'Copiado' });
  };

  const clearLogs = async () => {
    if (!confirm('Apagar todos os logs deste webhook?')) return;
    await supabase.from('webhook_logs').delete().eq('provider', 'hotmart');
    load();
  };

  const statusColor = (s: number | null) =>
    !s ? 'secondary' : s < 300 ? 'default' : s < 500 ? 'outline' : 'destructive';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Hotmart</CardTitle>
          <CardDescription>
            Configure o hottok, teste a integração e veja os últimos eventos recebidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL do Webhook (cole na Hotmart)</Label>
            <div className="flex gap-2 mt-1">
              <Input value={WEBHOOK_URL} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(WEBHOOK_URL)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Hottok (token enviado pela Hotmart)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Cole o hottok da sua nova conta Hotmart"
                className="font-mono"
              />
              <Button variant="outline" size="icon" onClick={() => setShowToken(s => !s)}>
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button onClick={saveToken} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Quando vazio, usa o segredo <code>HOTMART_HOTTOK</code> configurado nos secrets.
            </p>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={cfg?.enabled ?? true}
                onCheckedChange={toggleEnabled}
              />
              <Label className="mb-0">
                {cfg?.enabled ? 'Webhook ativo' : 'Webhook pausado'}
              </Label>
            </div>
            <Button onClick={sendTest} disabled={testing}>
              <Send className="h-4 w-4 mr-2" />
              {testing ? 'Testando…' : 'Enviar PING de teste'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Últimas chamadas recebidas</CardTitle>
            <CardDescription>50 eventos mais recentes</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-2" /> Limpar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma chamada registrada ainda. Use o botão "Enviar PING" para testar.
            </p>
          ) : (
            <div className="border rounded-md divide-y">
              {logs.map(log => (
                <button
                  key={log.id}
                  onClick={() => setSelected(log)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left"
                >
                  <Badge variant={statusColor(log.status_code) as any}>
                    {log.status_code ?? '—'}
                  </Badge>
                  <span className="font-mono text-sm flex-1 truncate">
                    {log.event_type || '(sem event)'}
                  </span>
                  {log.error && (
                    <span className="text-xs text-destructive truncate max-w-[200px]">
                      {log.error}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.received_at).toLocaleString('pt-BR')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected?.event_type || '(sem event)'}{' '}
              <Badge variant={statusColor(selected?.status_code ?? null) as any}>
                {selected?.status_code}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {selected && new Date(selected.received_at).toLocaleString('pt-BR')} • IP: {selected?.source_ip || '—'}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              {selected.error && (
                <div>
                  <Label>Erro</Label>
                  <div className="text-destructive font-mono text-xs">{selected.error}</div>
                </div>
              )}
              <div>
                <Label>Payload recebido</Label>
                <Textarea
                  readOnly
                  value={JSON.stringify(selected.payload, null, 2)}
                  className="font-mono text-xs h-60"
                />
              </div>
              <div>
                <Label>Resposta enviada</Label>
                <Textarea
                  readOnly
                  value={JSON.stringify(selected.response, null, 2)}
                  className="font-mono text-xs h-32"
                />
              </div>
              <div>
                <Label>Headers</Label>
                <Textarea
                  readOnly
                  value={JSON.stringify(selected.headers, null, 2)}
                  className="font-mono text-xs h-32"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
