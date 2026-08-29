import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Send, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CampaignRow {
  id: string;
  subject: string;
  status: string;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  error_message: string | null;
}

interface Props {
  companyId: string;
  channelUrl: string;
  canEdit: boolean;
}

const extractEmails = (text: string): string[] => {
  const matches = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase())));
};

const OuvidoriaCampaignsTab = ({ companyId, channelUrl, canEdit }: Props) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState('Canal de Ouvidoria — sua voz importa');
  const [message, setMessage] = useState(
    'Nossa empresa disponibiliza um canal de ouvidoria seguro e anônimo para relatos de assédio, fraude, riscos e outras situações. Sua identidade é preservada e você acompanha o caso por um protocolo.'
  );
  const [sending, setSending] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ouvidoria_campaigns')
      .select('id, subject, status, recipients_count, sent_count, failed_count, created_at, error_message')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20);
    setCampaigns(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (companyId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const found = extractEmails(text);
    if (found.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhum e-mail encontrado no arquivo' });
      return;
    }
    setEmails((prev) => Array.from(new Set([...prev, ...found])));
    toast({ title: `${found.length} e-mails importados` });
  };

  const send = async () => {
    if (emails.length === 0) {
      toast({ variant: 'destructive', title: 'Importe ou cole ao menos um e-mail' });
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke('send-ouvidoria-campaign', {
      body: { company_id: companyId, subject, message, emails, channel_url: channelUrl },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      toast({
        variant: 'destructive',
        title: 'Erro no disparo',
        description: (data as any)?.error || error?.message,
      });
      return;
    }
    toast({
      title: 'Disparo concluído',
      description: `${(data as any)?.sent ?? 0} e-mails enviados.`,
    });
    setEmails([]);
    load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Divulgação do canal por e-mail</CardTitle>
          <CardDescription>
            Importe um CSV com a lista de e-mails dos colaboradores e envie o convite com o link do
            canal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={!canEdit}>
              <Upload className="h-4 w-4 mr-2" /> Importar CSV
            </Button>
            <Badge variant="secondary">{emails.length} destinatários</Badge>
            {emails.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setEmails([])}>
                Limpar lista
              </Button>
            )}
          </div>

          <div>
            <Label>Ou cole os e-mails (separados por vírgula, ponto e vírgula ou linha)</Label>
            <Textarea
              rows={3}
              placeholder="joao@empresa.com, maria@empresa.com"
              onBlur={(e) => {
                const found = extractEmails(e.target.value);
                if (found.length) {
                  setEmails((prev) => Array.from(new Set([...prev, ...found])));
                  e.target.value = '';
                  toast({ title: `${found.length} e-mails adicionados` });
                }
              }}
              disabled={!canEdit}
            />
          </div>

          <div>
            <Label>Assunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!canEdit} />
          </div>

          <div>
            <Label>Mensagem</Label>
            <Textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            O botão do e-mail levará para: <span className="break-all">{channelUrl}</span>
          </div>

          <Button onClick={send} disabled={sending || !canEdit || emails.length === 0}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Disparar convite ({emails.length})
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de disparos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum disparo realizado ainda.</p>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {c.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString('pt-BR')}
                    </p>
                    {c.error_message && (
                      <p className="text-xs text-destructive">{c.error_message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary">{c.sent_count}/{c.recipients_count} enviados</Badge>
                    {c.failed_count > 0 && (
                      <Badge variant="destructive">{c.failed_count} falhas</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OuvidoriaCampaignsTab;
