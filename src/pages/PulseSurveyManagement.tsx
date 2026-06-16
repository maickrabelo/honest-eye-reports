import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Trash2, Plus, Save, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PULSE_SURVEY_TEMPLATES } from '@/data/pulseSurveyTemplates';

interface Company { id: string; name: string }
interface QDraft { id?: string; text: string; category: string; order_index: number; required: boolean }

const FREQS = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
];

export default function PulseSurveyManagement() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user, role, profile, isLoading: authLoading } = useRealAuth();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [useEmojis, setUseEmojis] = useState(true);
  const [managerEmail, setManagerEmail] = useState('');
  const [status, setStatus] = useState<'active' | 'paused' | 'archived'>('active');
  const [questions, setQuestions] = useState<QDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    if (!['admin', 'sst', 'company'].includes(role || '')) { navigate('/dashboard'); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, authLoading, id]);

  const load = async () => {
    setLoading(true);
    try {
      // Carregar empresas
      if (role === 'admin') {
        const { data } = await supabase.from('companies').select('id, name').order('name');
        setCompanies(data || []);
      } else if (role === 'sst' && profile?.id) {
        const { data: prof } = await supabase.from('profiles').select('sst_manager_id').eq('id', profile.id).single();
        if (prof?.sst_manager_id) {
          const { data } = await supabase
            .from('company_sst_assignments')
            .select('company:companies!inner(id, name)')
            .eq('sst_manager_id', prof.sst_manager_id);
          setCompanies(((data || []).map((a: any) => a.company).filter(Boolean)));
        }
      } else if (role === 'company' && profile?.company_id) {
        const { data } = await supabase.from('companies').select('id, name').eq('id', profile.company_id);
        setCompanies(data || []);
        setCompanyId(profile.company_id);
      }

      if (managerEmail === '' && user?.email) setManagerEmail(user.email);

      if (isEdit && id) {
        const { data: s } = await supabase.from('pulse_surveys').select('*').eq('id', id).single();
        if (s) {
          setCompanyId(s.company_id);
          setTitle(s.title);
          setDescription(s.description || '');
          setFrequency(s.frequency);
          setUseEmojis(s.use_emojis);
          setManagerEmail(s.manager_email);
          setStatus(s.status as any);
        }
        const { data: qs } = await supabase
          .from('pulse_survey_questions')
          .select('*').eq('pulse_survey_id', id).order('order_index');
        setQuestions((qs || []).map((q: any) => ({
          id: q.id, text: q.text, category: q.category || '', order_index: q.order_index, required: q.required,
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const t = PULSE_SURVEY_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    if (!title) setTitle(`Pulse: ${t.name}`);
    setQuestions(
      t.questions.map((q, i) => ({ text: q.text, category: q.category, order_index: i, required: true }))
    );
  };

  const addQuestion = () => {
    setQuestions((p) => [...p, { text: '', category: '', order_index: p.length, required: true }]);
  };

  const updateQuestion = (i: number, patch: Partial<QDraft>) => {
    setQuestions((p) => p.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  };

  const removeQuestion = (i: number) => {
    setQuestions((p) => p.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order_index: idx })));
  };

  const save = async () => {
    if (!companyId) return toast({ title: 'Selecione a empresa', variant: 'destructive' });
    if (!title.trim()) return toast({ title: 'Informe um título', variant: 'destructive' });
    if (!managerEmail.trim()) return toast({ title: 'Informe o email do gestor', variant: 'destructive' });
    const validQs = questions.filter((q) => q.text.trim());
    if (validQs.length === 0) return toast({ title: 'Adicione pelo menos uma pergunta', variant: 'destructive' });

    setSaving(true);
    try {
      let surveyId = id;
      if (isEdit && id) {
        const { error } = await supabase.from('pulse_surveys').update({
          company_id: companyId, title, description, frequency, use_emojis: useEmojis,
          manager_email: managerEmail, status,
        }).eq('id', id);
        if (error) throw error;
        // Reset perguntas: simples - apaga e recria
        await supabase.from('pulse_survey_questions').delete().eq('pulse_survey_id', id);
      } else {
        const { data, error } = await supabase.from('pulse_surveys').insert({
          company_id: companyId, title, description, frequency, use_emojis: useEmojis,
          manager_email: managerEmail, status, created_by: user!.id,
        }).select('id').single();
        if (error) throw error;
        surveyId = data!.id;
      }

      const { error: qErr } = await supabase.from('pulse_survey_questions').insert(
        validQs.map((q, i) => ({
          pulse_survey_id: surveyId,
          text: q.text, category: q.category || null,
          order_index: i, required: q.required,
        }))
      );
      if (qErr) throw qErr;

      toast({ title: isEdit ? 'Campanha atualizada' : 'Campanha criada' });
      navigate('/pulse-survey');
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="outline" size="sm" onClick={() => navigate('/pulse-survey')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-6">{isEdit ? 'Editar' : 'Nova'} Campanha Pulse Survey</h1>

        <Card className="mb-6">
          <CardHeader><CardTitle>Configuração</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Empresa</Label>
              {role !== 'company' && (
                <div className="relative mt-1 mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar empresa..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
              <Select value={companyId} onValueChange={setCompanyId} disabled={role === 'company'}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {filteredCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pulse mensal de bem-estar" />
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Frequência</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="paused">Pausada</SelectItem>
                    <SelectItem value="archived">Arquivada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Email do gestor (recebe o resumo)</Label>
              <Input type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label className="text-base">Usar emojis na escala</Label>
                <p className="text-sm text-muted-foreground">
                  {useEmojis ? '😡 😕 😐 🙂 😄 (5 níveis)' : 'Likert 1 a 5 (Discordo → Concordo)'}
                </p>
              </div>
              <Switch checked={useEmojis} onCheckedChange={setUseEmojis} />
            </div>
          </CardContent>
        </Card>

        {!isEdit && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Templates prontos</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                {PULSE_SURVEY_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t.id)}
                    className="text-left rounded-lg border p-4 hover:border-primary hover:bg-accent transition"
                  >
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                    <Badge variant="secondary" className="mt-2">{t.questions.length} perguntas</Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Perguntas ({questions.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={addQuestion} className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Selecione um template acima ou adicione perguntas manualmente.
              </p>
            )}
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground mt-2">{i + 1}.</span>
                  <Textarea
                    value={q.text}
                    onChange={(e) => updateQuestion(i, { text: e.target.value })}
                    placeholder="Texto da pergunta"
                    rows={2}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeQuestion(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Input
                  value={q.category}
                  onChange={(e) => updateQuestion(i, { category: e.target.value })}
                  placeholder="Categoria (opcional)"
                  className="ml-6 w-auto md:w-1/2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/pulse-survey')}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar alterações' : 'Criar campanha'}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
