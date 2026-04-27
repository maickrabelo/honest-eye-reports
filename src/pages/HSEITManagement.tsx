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
import { Loader2, Save, ArrowLeft, ClipboardList, Building2, Copy } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DepartmentManager, SurveyDepartment, DepartmentManagerHandle, UnallocatedEmployeesDialog } from '@/components/climate-survey/DepartmentManager';
import { QRCodePreview } from '@/components/climate-survey/QRCodePreview';
import { useCompanyEmployeeCount } from '@/hooks/useCompanyEmployeeCount';

interface Company {
  id: string;
  name: string;
  slug: string;
}

export default function HSEITManagement() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, role, profile, isLoading: authLoading } = useRealAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  // Form state
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [departments, setDepartments] = useState<SurveyDepartment[]>([]);
  const [collectionMode, setCollectionMode] = useState<string>('form');
  const [showUnallocatedDialog, setShowUnallocatedDialog] = useState(false);
  const [pendingRemaining, setPendingRemaining] = useState(0);
  const deptManagerRef = useRef<DepartmentManagerHandle>(null);
  const { employeeCount: companyEmployeeCount } = useCompanyEmployeeCount(selectedCompany || null);

  const isEditing = !!id;

  // Auth guard - only for redirects
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!['admin', 'sst', 'company'].includes(role || '')) {
        navigate('/dashboard');
      }
    }
  }, [user, role, authLoading]);

  // Data fetching - only on mount and when assessment id changes
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (!authLoading && user && ['admin', 'sst', 'company'].includes(role || '') && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [authLoading, user, role, id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch companies
      let companiesData: Company[] = [];
      
      if (role === 'admin') {
        const { data } = await supabase
          .from('companies')
          .select('id, name, slug')
          .order('name');
        companiesData = data || [];
      } else if (role === 'sst' && profile?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('sst_manager_id')
          .eq('id', profile.id)
          .single();
        
        if (profileData?.sst_manager_id) {
          const { data: assignments } = await supabase
            .from('company_sst_assignments')
            .select('company_id')
            .eq('sst_manager_id', profileData.sst_manager_id);
          
          const companyIds = assignments?.map(a => a.company_id) || [];
          
          if (companyIds.length > 0) {
            const { data } = await supabase
              .from('companies')
              .select('id, name, slug')
              .in('id', companyIds)
              .order('name');
            companiesData = data || [];
          }
        }
      } else if (role === 'company' && profile?.company_id) {
        const { data } = await supabase
          .from('companies')
          .select('id, name, slug')
          .eq('id', profile.company_id);
        companiesData = data || [];
      }
      
      setCompanies(companiesData);
      
      // If editing, fetch assessment data
      if (id) {
        const { data: assessment, error } = await supabase
          .from('hseit_assessments')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        setSelectedCompany(assessment.company_id);
        setTitle(assessment.title);
        setDescription(assessment.description || '');
        setStartDate(assessment.start_date ? assessment.start_date.split('T')[0] : '');
        setEndDate(assessment.end_date ? assessment.end_date.split('T')[0] : '');
        setIsActive(assessment.is_active);
        setCollectionMode((assessment as any).collection_mode || 'form');
        
        // Fetch departments
        const { data: depts } = await supabase
          .from('hseit_departments')
          .select('*')
          .eq('assessment_id', id)
          .order('order_index');
        
        setDepartments(depts || []);
      } else if (companiesData.length === 1) {
        setSelectedCompany(companiesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados da avaliação.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompany || !title) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione uma empresa e informe o título da avaliação.',
        variant: 'destructive'
      });
      return;
    }

    const validation = deptManagerRef.current?.validateAllocation();
    if (validation && validation.ok === false) {
      if (validation.reason === 'overflow') {
        toast({
          title: 'Excesso de colaboradores',
          description: 'A soma dos setores excede o total de colaboradores da empresa.',
          variant: 'destructive'
        });
        return;
      }
      if (validation.reason === 'unallocated') {
        setPendingRemaining(validation.remaining);
        setShowUnallocatedDialog(true);
        return;
      }
    }

    await persistAssessment();
  };

  const persistAssessment = async () => {
    try {
      setIsSaving(true);
      
      const assessmentData = {
        company_id: selectedCompany,
        title,
        description: description || null,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: isActive,
        created_by: user?.id,
        collection_mode: collectionMode,
      };

      let assessmentId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('hseit_assessments')
          .update(assessmentData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('hseit_assessments')
          .insert(assessmentData)
          .select('id')
          .single();
        
        if (error) throw error;
        assessmentId = data.id;
      }

      // Update departments
      if (assessmentId) {
        // Delete existing departments
        await supabase
          .from('hseit_departments')
          .delete()
          .eq('assessment_id', assessmentId);
        
        // Insert new departments (skip ones marked as deleted in the UI)
        const activeDepts = departments.filter((d) => !d.isDeleted);
        if (activeDepts.length > 0) {
          const deptData = activeDepts.map((d, index) => ({
            assessment_id: assessmentId,
            name: d.name,
            employee_count: d.employee_count,
            order_index: index
          }));
          
          const { error } = await supabase
            .from('hseit_departments')
            .insert(deptData);
          
          if (error) throw error;
        }
      }

      toast({
        title: isEditing ? 'Avaliação atualizada' : 'Avaliação criada',
        description: 'A avaliação HSE-IT foi salva com sucesso.'
      });

      navigate('/hseit-dashboard');
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a avaliação.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getFormUrl = () => {
    const company = companies.find(c => c.id === selectedCompany);
    if (!company || !id) return '';
    return `${window.location.origin}/hseit/${company.slug}/${id}`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hseit-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              {isEditing ? 'Editar Avaliação HSE-IT' : 'Nova Avaliação HSE-IT'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure os detalhes da avaliação de riscos psicossociais
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
                <CardDescription>
                  Defina os dados básicos da avaliação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa *</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany} disabled={isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {company.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Avaliação *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Avaliação HSE-IT 2024"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o objetivo desta avaliação..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Avaliação Ativa</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que funcionários respondam a avaliação
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>

                {/* Collection Mode */}
                <div className="flex items-center justify-between pt-2 pb-2 px-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Modo de Coleta
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {collectionMode === 'ai' ? 'SOnIA guia o respondente pergunta a pergunta' : 'Formulário tradicional com todas as perguntas'}
                    </p>
                  </div>
                  <Switch
                    checked={collectionMode === 'ai'}
                    onCheckedChange={(checked) => setCollectionMode(checked ? 'ai' : 'form')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Departments */}
            <Card>
              <CardHeader>
                <CardTitle>Setores / Departamentos</CardTitle>
                <CardDescription>
                  Configure os setores da empresa para segmentação das respostas
                </CardDescription>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleSave} className="w-full gap-2" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Avaliação
                </Button>
                <Button variant="outline" onClick={() => navigate('/hseit-dashboard')} className="w-full">
                  Cancelar
                </Button>
              </CardContent>
            </Card>

            {/* QR Code Preview */}
            {isEditing && selectedCompany && getFormUrl() && (
              <Card>
                <CardHeader>
                  <CardTitle>Link do Formulário HSE-IT</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <QRCodePreview url={getFormUrl()} size={150} />
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(getFormUrl());
                      toast({ title: 'Link copiado!' });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copiar Link
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* HSE-IT Info */}
            <Card>
              <CardHeader>
                <CardTitle>Sobre o HSE-IT</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  O HSE-IT (Health and Safety Executive - Indicator Tool) é uma ferramenta validada para
                  avaliar riscos psicossociais no ambiente de trabalho.
                </p>
                <p>
                  O questionário contém 35 questões que avaliam 7 dimensões:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Demandas</li>
                  <li>Controle</li>
                  <li>Apoio da Chefia</li>
                  <li>Apoio dos Colegas</li>
                  <li>Relacionamentos</li>
                  <li>Papel/Cargo</li>
                  <li>Mudanças</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <UnallocatedEmployeesDialog
        open={showUnallocatedDialog}
        onOpenChange={setShowUnallocatedDialog}
        remaining={pendingRemaining}
        onConfirm={() => {
          setShowUnallocatedDialog(false);
          persistAssessment();
        }}
      />

      <Footer />
    </div>
  );
}
