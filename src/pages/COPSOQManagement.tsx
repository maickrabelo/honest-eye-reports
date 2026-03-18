import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, ArrowLeft, FileText, Building2, Copy, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DepartmentManager, SurveyDepartment } from '@/components/climate-survey/DepartmentManager';
import { QRCodePreview } from '@/components/climate-survey/QRCodePreview';

interface Company { id: string; name: string; slug: string; }

export default function COPSOQManagement() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, role, profile, isLoading: authLoading } = useRealAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [departments, setDepartments] = useState<SurveyDepartment[]>([]);
  const isEditing = !!id;
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/auth');
      else if (!['admin', 'sst'].includes(role || '')) navigate('/dashboard');
    }
  }, [user, role, authLoading]);

  useEffect(() => {
    if (!authLoading && user && ['admin', 'sst'].includes(role || '') && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [authLoading, user, role, id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      let companiesData: Company[] = [];
      if (role === 'admin') {
        const { data } = await supabase.from('companies').select('id, name, slug').order('name');
        companiesData = data || [];
      } else if (role === 'sst' && profile?.id) {
        const { data: pd } = await supabase.from('profiles').select('sst_manager_id').eq('id', profile.id).single();
        if (pd?.sst_manager_id) {
          const { data: assignments } = await supabase.from('company_sst_assignments').select('company_id').eq('sst_manager_id', pd.sst_manager_id);
          const ids = assignments?.map(a => a.company_id) || [];
          if (ids.length > 0) {
            const { data } = await supabase.from('companies').select('id, name, slug').in('id', ids).order('name');
            companiesData = data || [];
          }
        }
      }
      setCompanies(companiesData);

      if (id) {
        const { data: assessment, error } = await supabase.from('copsoq_assessments' as any).select('*').eq('id', id).single();
        if (error) throw error;
        const a = assessment as any;
        setSelectedCompany(a.company_id);
        setTitle(a.title);
        setDescription(a.description || '');
        setStartDate(a.start_date ? a.start_date.split('T')[0] : '');
        setEndDate(a.end_date ? a.end_date.split('T')[0] : '');
        setIsActive(a.is_active);
        const { data: depts } = await supabase.from('copsoq_departments' as any).select('*').eq('assessment_id', id).order('order_index');
        setDepartments((depts as any[]) || []);
      } else if (companiesData.length === 1) {
        setSelectedCompany(companiesData[0].id);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompany || !title) {
      toast({ title: 'Campos obrigatórios', description: 'Selecione uma empresa e informe o título.', variant: 'destructive' });
      return;
    }
    try {
      setIsSaving(true);
      const data = { company_id: selectedCompany, title, description: description || null, start_date: startDate || null, end_date: endDate || null, is_active: isActive, created_by: user?.id };
      let assessmentId = id;

      if (isEditing) {
        const { error } = await supabase.from('copsoq_assessments' as any).update(data).eq('id', id);
        if (error) throw error;
      } else {
        const { data: result, error } = await supabase.from('copsoq_assessments' as any).insert(data).select('id').single();
        if (error) throw error;
        assessmentId = (result as any).id;
      }

      if (assessmentId) {
        await supabase.from('copsoq_departments' as any).delete().eq('assessment_id', assessmentId);
        if (departments.length > 0) {
          const deptData = departments.map((d, i) => ({ assessment_id: assessmentId, name: d.name, employee_count: d.employee_count, order_index: i }));
          const { error } = await supabase.from('copsoq_departments' as any).insert(deptData);
          if (error) throw error;
        }
      }

      toast({ title: isEditing ? 'Avaliação atualizada' : 'Avaliação criada', description: 'A avaliação COPSOQ II foi salva com sucesso.' });
      navigate('/psychosocial-dashboard');
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const getFormUrl = () => {
    const company = companies.find(c => c.id === selectedCompany);
    if (!company || !id) return '';
    return `${window.location.origin}/copsoq/${company.slug}/${id}`;
  };

  if (authLoading || isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/psychosocial-dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              {isEditing ? 'Editar Avaliação COPSOQ II' : 'Nova Avaliação COPSOQ II'}
            </h1>
            <p className="text-muted-foreground mt-1">Configure os detalhes da avaliação de riscos psicossociais</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Informações Gerais</CardTitle><CardDescription>Defina os dados básicos da avaliação</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Empresa *</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany} disabled={isEditing}>
                    <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                    <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}><div className="flex items-center gap-2"><Building2 className="h-4 w-4" />{c.name}</div></SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Título *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Avaliação COPSOQ II 2024" /></div>
                <div className="space-y-2"><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o objetivo..." rows={3} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Data de Início</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Data de Término</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div><Label>Avaliação Ativa</Label><p className="text-sm text-muted-foreground">Permite que funcionários respondam</p></div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Setores / Departamentos</CardTitle><CardDescription>Configure os setores para segmentação</CardDescription></CardHeader>
              <CardContent><DepartmentManager departments={departments} onChange={setDepartments} /></CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Ações</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleSave} className="w-full gap-2" disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar Avaliação</Button>
                <Button variant="outline" onClick={() => navigate('/psychosocial-dashboard')} className="w-full">Cancelar</Button>
              </CardContent>
            </Card>
            {isEditing && selectedCompany && getFormUrl() && (
              <Card>
                <CardHeader><CardTitle>Link do Formulário COPSOQ</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <QRCodePreview url={getFormUrl()} size={150} />
                  <Button variant="outline" className="w-full gap-2" onClick={() => { navigator.clipboard.writeText(getFormUrl()); toast({ title: 'Link copiado!' }); }}><Copy className="h-4 w-4" />Copiar Link</Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle>Sobre o COPSOQ II</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>O COPSOQ II (Copenhagen Psychosocial Questionnaire) é um instrumento validado internacionalmente para avaliação de fatores psicossociais no trabalho.</p>
                <p>A versão curta contém 41 questões que avaliam 23 dimensões organizadas em 6 grupos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Exigências do Trabalho</li>
                  <li>Organização e Conteúdo</li>
                  <li>Relações e Liderança</li>
                  <li>Interface Trabalho-Indivíduo</li>
                  <li>Saúde e Bem-estar</li>
                  <li>Valores no Local de Trabalho</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
