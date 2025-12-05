import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, Save, ArrowLeft, Copy, QrCode, Link as LinkIcon } from "lucide-react";
import { gptwQuestions, gptwCategories, openQuestions, npsQuestion } from "@/data/gptwQuestions";

interface Company {
  id: string;
  name: string;
  slug: string;
}

export default function ClimateSurveyManagement() {
  const { id } = useParams();
  const isEditing = id && id !== 'new';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, isLoading: authLoading } = useRealAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [formData, setFormData] = useState({
    title: 'Pesquisa de Clima Organizacional',
    description: 'Sua opinião é muito importante para nós. Responda com sinceridade.',
    company_id: '',
    is_active: true
  });

  useEffect(() => {
    if (!authLoading) {
      if (role !== 'admin') {
        toast({ title: "Acesso negado", variant: "destructive" });
        navigate('/climate-dashboard');
        return;
      }
      fetchData();
    }
  }, [authLoading, role]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, slug')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // If editing, fetch survey data
      if (isEditing) {
        const { data: surveyData, error: surveyError } = await supabase
          .from('climate_surveys')
          .select('*')
          .eq('id', id)
          .single();

        if (surveyError) throw surveyError;
        if (surveyData) {
          setFormData({
            title: surveyData.title,
            description: surveyData.description || '',
            company_id: surveyData.company_id,
            is_active: surveyData.is_active
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.company_id) {
      toast({ title: "Selecione uma empresa", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('climate_surveys')
          .update({
            title: formData.title,
            description: formData.description,
            is_active: formData.is_active
          })
          .eq('id', id);

        if (error) throw error;
        toast({ title: "Pesquisa atualizada com sucesso!" });
      } else {
        // Create survey
        const { data: surveyData, error: surveyError } = await supabase
          .from('climate_surveys')
          .insert({
            title: formData.title,
            description: formData.description,
            company_id: formData.company_id,
            is_active: formData.is_active
          })
          .select()
          .single();

        if (surveyError) throw surveyError;

        // Create questions from GPTW template
        const questionsToInsert = [
          ...gptwQuestions.map((q, index) => ({
            survey_id: surveyData.id,
            question_text: q.text,
            question_type: q.type as 'likert' | 'single_choice' | 'multiple_choice' | 'scale_0_10' | 'open_text',
            category: q.category,
            order_index: index,
            is_required: true
          })),
          {
            survey_id: surveyData.id,
            question_text: npsQuestion.text,
            question_type: 'scale_0_10' as const,
            category: 'nps',
            order_index: gptwQuestions.length,
            is_required: true
          },
          ...openQuestions.map((q, index) => ({
            survey_id: surveyData.id,
            question_text: q.text,
            question_type: 'open_text' as const,
            category: 'open',
            order_index: gptwQuestions.length + 1 + index,
            is_required: false
          }))
        ];

        const { error: questionsError } = await supabase
          .from('survey_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;

        toast({ title: "Pesquisa criada com sucesso!" });
        navigate('/climate-dashboard');
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      toast({ title: "Erro ao salvar pesquisa", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getSurveyUrl = () => {
    const company = companies.find(c => c.id === formData.company_id);
    if (!company) return '';
    return `${window.location.origin}/pesquisa/${company.slug}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copiado!" });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/climate-dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Editar Pesquisa' : 'Nova Pesquisa de Clima'}</CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Atualize as informações da pesquisa'
                : 'Configure uma nova pesquisa baseada no modelo GPTW'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Selection */}
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Select 
                value={formData.company_id} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, company_id: val }))}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título da Pesquisa *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Pesquisa de Clima 2024"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Instruções e informações para os participantes"
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pesquisa Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que funcionários respondam a pesquisa
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            {/* Survey URL */}
            {formData.company_id && (
              <div className="space-y-2 pt-4 border-t">
                <Label>Link da Pesquisa</Label>
                <div className="flex gap-2">
                  <Input
                    value={getSurveyUrl()}
                    readOnly
                    className="bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(getSurveyUrl())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Compartilhe este link com os funcionários para responderem a pesquisa
                </p>
              </div>
            )}

            {/* Questions Preview */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Perguntas Incluídas</h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>{gptwQuestions.length}</strong> afirmativas GPTW (escala Likert 1-5)</p>
                <p><strong>1</strong> pergunta NPS (escala 0-10)</p>
                <p><strong>{openQuestions.length}</strong> perguntas abertas (opcional)</p>
                <p className="text-muted-foreground">
                  Categorias: {gptwCategories.map(c => c.name).join(', ')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Salvar Alterações' : 'Criar Pesquisa'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
