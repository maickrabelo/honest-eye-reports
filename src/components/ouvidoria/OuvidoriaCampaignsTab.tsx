import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, Send, Mail, Trash2, Plus, Users, AlertTriangle } from 'lucide-react';
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

interface ContactRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
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
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [subject, setSubject] = useState('Canal de Ouvidoria — sua voz importa');
  const [message, setMessage] = useState(
    'Nossa empresa disponibiliza um canal de ouvidoria seguro e anônimo para relatos de assédio, fraude, riscos e outras situações. Sua identidade é preservada e você acompanha o caso por um protocolo.'
  );
  const [sending, setSending] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newContact, setNewContact] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [{ data: camps }, { data: list }] = await Promise.all([
      supabase
        .from('ouvidoria_campaigns')
        .select('id, subject, status, recipients_count, sent_count, failed_count, created_at, error_message')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('ouvidoria_mailing_list')
        .select('id, email, full_name, created_at')
        .eq('company_id', companyId)
        .order('email', { ascending: true }),
    ]);
    setCampaigns(camps ?? []);
    setContacts(list ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (companyId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const addEmails = (found: string[], source: string) => {
    const known = new Set([
      ...contacts.map((c) => c.email.toLowerCase()),
      ...emails.map((e) => e.toLowerCase()),
    ]);
    const dupes = found.filter((e) => known.has(e));
    const fresh = found.filter((e) => !known.has(e));
    setEmails((prev) => Array.from(new Set([...prev, ...fresh])));
    setDuplicates(dupes);

    if (fresh.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhum e-mail novo',
        description: `Todos os ${dupes.length} e-mails já estavam cadastrados na lista.`,
      });
      return;
    }
    toast({
      title: `${fresh.length} e-mails ${source}`,
      description: dupes.length
        ? `${dupes.length} ignorados por duplicidade (veja a lista abaixo).`
        : undefined,
    });
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const found = extractEmails(text);
    if (found.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhum e-mail encontrado no arquivo' });
      return;
    }
    addEmails(found, 'importados');
  };

  const addContactManually = async () => {
    const found = extractEmails(newContact);
    if (found.length === 0) {
      toast({ variant: 'destructive', title: 'Informe um e-mail válido' });
      return;
    }
    const existing = new Set(contacts.map((c) => c.email.toLowerCase()));
    const fresh = found.filter((e) => !existing.has(e));
    const dupes = found.filter((e) => existing.has(e));
    if (fresh.length === 0) {
      toast({ variant: 'destructive', title: 'E-mail já cadastrado na lista' });
      return;
    }
    setSavingContact(true);
    const { error } = await supabase
      .from('ouvidoria_mailing_list')
      .insert(fresh.map((email) => ({ company_id: companyId, email })));
    setSavingContact(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
      return;
    }
    setNewContact('');
    toast({
      title: `${fresh.length} contato(s) adicionado(s)`,
      description: dupes.length ? `${dupes.length} ignorados por duplicidade.` : undefined,
    });
    load();
  };

  const removeContact = async (id: string) => {
    const { error } = await supabase.from('ouvidoria_mailing_list').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleContact = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedEmails = contacts.filter((c) => selected.has(c.id)).map((c) => c.email);
  const finalRecipients = Array.from(new Set([...selectedEmails, ...emails]));

  const send = async () => {
    if (finalRecipients.length === 0) {
      toast({ variant: 'destructive', title: 'Selecione contatos ou importe novos e-mails' });
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke('send-ouvidoria-campaign', {
      body: {
        company_id: companyId,
        subject,
        message,
        emails: finalRecipients,
        channel_url: channelUrl,
      },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      let description = (data as any)?.error || error?.message;
      try {
        const ctx = (error as any)?.context;
        if (ctx?.text) {
          const raw = await ctx.text();
          const parsed = JSON.parse(raw);
          description = parsed?.error || raw || description;
        }
      } catch {
        /* ignore */
      }
      toast({ variant: 'destructive', title: 'Erro no disparo', description });
      return;
    }
    toast({
      title: 'Disparo concluído',
      description: `${(data as any)?.sent ?? 0} e-mails enviados.`,
    });
    setEmails([]);
    setDuplicates([]);
    setSelected(new Set());
    load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Divulgação do canal por e-mail</CardTitle>
          <CardDescription>
            Use a lista de contatos já cadastrados e/ou importe um CSV com novos e-mails para enviar o
            convite com o link do canal.
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
            <Badge variant="secondary">{emails.length} novos e-mails</Badge>
            <Badge variant="outline">{selectedEmails.length} da lista</Badge>
            {emails.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEmails([]);
                  setDuplicates([]);
                }}
              >
                Limpar novos
              </Button>
            )}
          </div>

          {duplicates.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
              <p className="flex items-center gap-2 font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                {duplicates.length} e-mail(s) ignorado(s) por duplicidade
              </p>
              <p className="mt-1 break-all text-muted-foreground">{duplicates.join(', ')}</p>
            </div>
          )}

          <div>
            <Label>Ou cole os e-mails (separados por vírgula, ponto e vírgula ou linha)</Label>
            <Textarea
              rows={3}
              placeholder="joao@empresa.com, maria@empresa.com"
              onBlur={(e) => {
                const found = extractEmails(e.target.value);
                if (found.length) {
                  addEmails(found, 'adicionados');
                  e.target.value = '';
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

          <Button onClick={send} disabled={sending || !canEdit || finalRecipients.length === 0}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Disparar convite ({finalRecipients.length})
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" /> Lista de contatos ({contacts.length})
          </CardTitle>
          <CardDescription>
            E-mails que já receberam a divulgação. Selecione para reutilizar em um novo disparo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <Input
                className="max-w-xs"
                placeholder="novo@empresa.com"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
              />
              <Button variant="outline" onClick={addContactManually} disabled={savingContact}>
                {savingContact ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Adicionar
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum contato cadastrado ainda.</p>
          ) : (
            <>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(new Set(contacts.map((c) => c.id)))}
                >
                  Selecionar todos
                </Button>
                {selected.size > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                    Limpar seleção
                  </Button>
                )}
              </div>
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-2"
                  >
                    <label className="flex min-w-0 items-center gap-2 text-sm">
                      <Checkbox
                        checked={selected.has(c.id)}
                        onCheckedChange={() => toggleContact(c.id)}
                      />
                      <span className="truncate">{c.email}</span>
                    </label>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeContact(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
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
