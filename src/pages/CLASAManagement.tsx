import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { useHasCLASAAccess } from "@/hooks/useHasCLASAAccess";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DepartmentManager, DepartmentManagerHandle, UnallocatedEmployeesDialog } from "@/components/climate-survey/DepartmentManager";
import { QRCodePreview } from "@/components/climate-survey/QRCodePreview";
import { useCompanyEmployeeCount } from "@/hooks/useCompanyEmployeeCount";
import { CLASA_QUESTIONS, CLASA_CATEGORY_ORDER, CLASA_CATEGORY_LABELS } from "@/data/clasaQuestions";
import { ArrowLeft, Save, GraduationCap, Search, Loader2 } from "lucide-react";

interface Company { id: string; name: string; slug: string | null; }
interface Department { id?: string; name: string; employee_count: number; order_index: number; }

export default function CLASAManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useRealAuth();
  const { hasAccess, isLoading: accessLoading } = useHasCLASAAccess();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearch, setCompanySearch] = useState("");

  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showUnallocatedDialog, setShowUnallocatedDialog] = useState(false);
  const [pendingRemaining, setPendingRemaining] = useState(0);
  const deptManagerRef = useRef<DepartmentManagerHandle>(null);
  const { employeeCount: companyEmployeeCount } = useCompanyEmployeeCount(companyId || null);

  useEffect(() => {
    if (authLoading || accessLoading) return;
    if (!user) { navigate('/auth'); return; }
    if (!hasAccess) { navigate('/'); return; }
    fetchData();
  }, [user, hasAccess, authLoading, accessLoading, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let companiesData: Company[] = [];

      if (role === 'sst') {
        const { data: profile } = await supabase.from('profiles').select('sst_manager_id').eq('id', user?.id).single();
        if (profile?.sst_manager_id) {
          const { data: rows } = await supabase
            .from('company_sst_assignments')
            .select('company:companies!inner(id, name, slug)')
            .eq('sst_manager_id', profile.sst_manager_id);
          companiesData = ((rows ?? []) as any[]).map(r => r.company).filter(Boolean);
        }
      } else if (role === 'company') {
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single();
        if (profile?.company_id) {
          const { data } = await supabase.from('companies').select('id, name, slug').eq('id', profile.company_id);
          companiesData = data || [];
        }
      } else {
        const { data } = await supabase.from('companies').select('id, name, slug').order('name');
        companiesData = data || [];
      }
      companiesData.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
      setCompanies(companiesData);
      if (companiesData.length === 1 && !id) setCompanyId(companiesData[0].id);

      if (id) {
        const { data: assessment, error } = await supabase.from('clasa_assessments').select('*').eq('id', id).single();
        if (error) throw error;
        if (assessment) {
          setCompanyId(assessment.company_id);
          setTitle(assessment.title);
          setDescription(assessment.description || "");
          setStartDate(assessment.start_date?.split('T')[0] || "");
          setEndDate(assessment.end_date?.split('T')[0] || "");
          setIsActive(assessment.is_active);
          const { data: depts } = await supabase.from('clasa_departments').select('*').eq('assessment_id', id).order('order_index');
          setDepartments((depts as any[]) || []);
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyId) { toast({ title: 'Empresa obrigatória', variant: 'destructive' }); return; }
    if (!title.trim()) { toast({ title: 'Título obrigatório', variant: 'destructive' }); return; }

    const validation = deptManagerRef.current?.validateAllocation();
    if (validation && validation.ok === false) {
      if (validation.reason === 'overflow') {
        toast({ title: 'Excesso de participantes', description: 'A soma das turmas excede o total da empresa.', variant: 'destructive' });
        return;
      }
      if (validation.reason === 'unallocated') {
        setPendingRemaining(validation.remaining);
        setShowUnallocatedDialog(true);
        return;
      }
    }
    await persist();
  };

  const persist = async () => {
    try {
      setSaving(true);
      const payload = {
        company_id: companyId,
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: isActive,
        created_by: user?.id,
      };

      let assessmentId = id;
      if (id) {
        const { error } = await supabase.from('clasa_assessments').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('clasa_assessments').insert(payload).select().single();
        if (error) throw error;
        assessmentId = data.id;
      }

      if (assessmentId) {
        const existingIds = departments.filter(d => d.id).map(d => d.id);
        if (id) {
          await supabase
            .from('clasa_departments')
            .delete()
            .eq('assessment_id', assessmentId)
            .not('id', 'in', `(${existingIds.length > 0 ? existingIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);
        }
        for (const dept of departments) {
          if (dept.id) {
            await supabase.from('clasa_departments').update({
              name: dept.name, employee_count: dept.employee_count, order_index: dept.order_index,
            }).eq('id', dept.id);
          } else {
            await supabase.from('clasa_departments').insert({
              assessment_id: assessmentId, name: dept.name, employee_count: dept.employee_count, order_index: dept.order_index,
            });
          }
        }
      }

      toast({ title: 'Salvo com sucesso!', description: id ? 'A avaliação foi atualizada.' : 'A avaliação foi criada.' });
      navigate('/clasa-dashboard');
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getFormUrl = () => {
    const company = companies.find(c => c.id === companyId);
    return company?.slug && id ? `${window.location.origin}/clasa/${company.slug}/${id}` : null;
  };

  if (authLoading || accessLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clasa-dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              {id ? 'Editar Diagnóstico CLASA' : 'Novo Diagnóstico CLASA'}
            </h1>
            <p className="text-muted-foreground">Clima, bem-estar e riscos psicossociais (NR-01) para aprendizes</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Configure os detalhes da avaliação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Empresa *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar empresa..." value={companySearch} onChange={e => setCompanySearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                    <SelectContent>
                      {companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase())).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Diagnóstico Aprendizes CLASA 2026" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Descreva o objetivo desta avaliação..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <Label htmlFor="isActive">Avaliação Ativa</Label>
                    <p className="text-sm text-muted-foreground">Permite que os aprendizes respondam</p>
                  </div>
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Turmas / Setores</CardTitle>
                <CardDescription>Configure as turmas que serão avaliadas (opcional)</CardDescription>
              </CardHeader>
              <CardContent>
                <DepartmentManager
                  ref={deptManagerRef}
                  departments={departments}
                  onChange={setDepartments}
                  companyEmployeeCount={companyEmployeeCount}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Ações</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar Avaliação'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/clasa-dashboard')}>Cancelar</Button>
              </CardContent>
            </Card>

            {id && getFormUrl() && <QRCodePreview url={getFormUrl()!} />}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />Sobre o Questionário</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Instrumento inédito de <strong>Diagnóstico de Clima, Bem-Estar e Riscos Psicossociais (NR-01)</strong> para jovens aprendizes.</p>
                <p><strong>{CLASA_QUESTIONS.length} questões</strong> objetivas (escala 1 a 3) + 1 campo aberto, distribuídas em {CLASA_CATEGORY_ORDER.length} eixos:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {CLASA_CATEGORY_ORDER.map(c => (
                    <li key={c}>{CLASA_CATEGORY_LABELS[c]}</li>
                  ))}
                </ul>
                <p className="pt-2">1 = Proteção · 2 = Alerta · 3 = Risco. O índice final é normalizado de 0 a 100.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <UnallocatedEmployeesDialog
        open={showUnallocatedDialog}
        onOpenChange={setShowUnallocatedDialog}
        remaining={pendingRemaining}
        onConfirm={() => { setShowUnallocatedDialog(false); persist(); }}
      />
      <Footer />
    </div>
  );
}
