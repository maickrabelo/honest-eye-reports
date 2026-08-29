import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealAuth } from '@/contexts/RealAuthContext';

export interface InternalNoteRow {
  id: string;
  note: string;
  created_at: string;
  author_name: string | null;
  author_role_title: string | null;
  author_user_id: string | null;
}

interface Props {
  companyId: string;
  reportId: string;
  channel: 'smart' | 'ia';
  canEdit: boolean;
  authorName: string;
  authorRoleTitle?: string | null;
  onChange?: (notes: InternalNoteRow[]) => void;
}

const OuvidoriaInternalNotes = ({
  companyId,
  reportId,
  channel,
  canEdit,
  authorName,
  authorRoleTitle,
  onChange,
}: Props) => {
  const [notes, setNotes] = useState<InternalNoteRow[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useRealAuth();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ouvidoria_internal_notes')
      .select('id, note, created_at, author_name, author_role_title, author_user_id')
      .eq('report_id', reportId)
      .eq('channel', channel)
      .order('created_at', { ascending: false });
    setNotes(data ?? []);
    onChange?.(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (reportId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, channel]);

  const addNote = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('ouvidoria_internal_notes').insert({
      company_id: companyId,
      report_id: reportId,
      channel,
      note: text.trim(),
      author_user_id: user?.id ?? null,
      author_name: authorName,
      author_role_title: authorRoleTitle ?? null,
    });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar nota', description: error.message });
      return;
    }
    setText('');
    load();
    toast({ title: 'Nota interna registrada' });
  };

  const removeNote = async (id: string) => {
    const { error } = await supabase.from('ouvidoria_internal_notes').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
      return;
    }
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Visível apenas para o time interno — o denunciante nunca vê estas notas.
      </div>

      {canEdit && (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Anotação interna (hipóteses, encaminhamentos, contatos...)"
            rows={3}
          />
          <Button size="sm" onClick={addNote} disabled={saving || !text.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Adicionar nota interna
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma nota interna registrada.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {notes.map((n) => (
            <div key={n.id} className="rounded-md border bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{n.author_name || 'Equipe'}</span>
                  {n.author_role_title && (
                    <Badge variant="outline" className="ml-2">{n.author_role_title}</Badge>
                  )}
                  <span className="ml-2">{new Date(n.created_at).toLocaleString('pt-BR')}</span>
                </div>
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeNote(n.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{n.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OuvidoriaInternalNotes;
