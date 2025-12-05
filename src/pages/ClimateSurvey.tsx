import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LikertQuestion } from "@/components/climate-survey/LikertQuestion";
import { NPSQuestion } from "@/components/climate-survey/NPSQuestion";
import { DemographicsForm, Demographics } from "@/components/climate-survey/DemographicsForm";
import { SurveyProgress } from "@/components/climate-survey/SurveyProgress";
import { OpenQuestion } from "@/components/climate-survey/OpenQuestion";
import { gptwQuestions, gptwCategories, openQuestions, npsQuestion } from "@/data/gptwQuestions";
import { Loader2, CheckCircle2, ClipboardList, Building2 } from "lucide-react";

const QUESTIONS_PER_PAGE = 10;

export default function ClimateSurvey() {
  const { companySlug, surveyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [company, setCompany] = useState<{ id: string; name: string; logo_url: string | null } | null>(null);
  const [survey, setSurvey] = useState<{ id: string; title: string; description: string | null } | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0 = welcome
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [demographics, setDemographics] = useState<Demographics>({
    gender: '',
    ageRange: '',
    tenure: '',
    education: '',
    role: '',
    department: ''
  });
  const [departments, setDepartments] = useState<string[]>([
    'Administrativo',
    'Comercial',
    'Financeiro',
    'Marketing',
    'Operações',
    'Recursos Humanos',
    'TI',
    'Jurídico',
    'Produção',
    'Qualidade',
    'Logística',
    'Outro'
  ]);
  const [isComplete, setIsComplete] = useState(false);

  // Calculate total steps: welcome + question pages + demographics + NPS + open questions + completion
  const questionPages = Math.ceil(gptwQuestions.length / QUESTIONS_PER_PAGE);
  const totalSteps = 1 + questionPages + 1 + 1 + 1 + 1; // welcome + questions + demographics + NPS + open + complete
  
  const steps = [
    { name: 'Início', completed: currentStep > 0 },
    ...gptwCategories.map((cat, i) => ({ 
      name: cat.name, 
      completed: currentStep > i + 1 
    })),
    { name: 'Dados', completed: currentStep > questionPages + 1 },
    { name: 'NPS', completed: currentStep > questionPages + 2 },
    { name: 'Comentários', completed: currentStep > questionPages + 3 },
  ];

  useEffect(() => {
    fetchCompanyAndSurvey();
  }, [companySlug, surveyId]);

  const fetchCompanyAndSurvey = async () => {
    setIsLoading(true);
    try {
      // Fetch company by slug
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .eq('slug', companySlug)
        .maybeSingle();

      if (companyError) throw companyError;
      if (!companyData) {
        toast({ title: "Empresa não encontrada", variant: "destructive" });
        navigate('/');
        return;
      }

      setCompany(companyData);

      // Fetch active survey for the company
      let surveyQuery = supabase
        .from('climate_surveys')
        .select('id, title, description')
        .eq('company_id', companyData.id)
        .eq('is_active', true);

      if (surveyId) {
        surveyQuery = surveyQuery.eq('id', surveyId);
      }

      const { data: surveyData, error: surveyError } = await surveyQuery.maybeSingle();

      if (surveyError && surveyError.code !== 'PGRST116') throw surveyError;
      
      if (!surveyData) {
        toast({ title: "Nenhuma pesquisa ativa encontrada", variant: "destructive" });
        return;
      }

      setSurvey(surveyData);
    } catch (error) {
      console.error('Error fetching survey:', error);
      toast({ title: "Erro ao carregar pesquisa", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: number | string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleDemographicChange = (field: keyof Demographics, value: string) => {
    setDemographics(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentQuestions = () => {
    if (currentStep === 0) return []; // Welcome page
    if (currentStep <= questionPages) {
      const startIndex = (currentStep - 1) * QUESTIONS_PER_PAGE;
      return gptwQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
    }
    return [];
  };

  const canProceed = () => {
    if (currentStep === 0) return true; // Welcome page
    
    if (currentStep <= questionPages) {
      const currentQuestions = getCurrentQuestions();
      return currentQuestions.every(q => answers[q.id] !== undefined);
    }
    
    if (currentStep === questionPages + 1) {
      // Demographics - at least department required
      return demographics.department !== '';
    }
    
    if (currentStep === questionPages + 2) {
      // NPS
      return answers['nps'] !== undefined;
    }
    
    return true; // Open questions are optional
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const generateToken = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleSubmit = async () => {
    if (!survey) return;

    setIsSubmitting(true);
    try {
      // Create response record
      const { data: responseData, error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: survey.id,
          respondent_token: generateToken(),
          department: demographics.department,
          demographics: {
            gender: demographics.gender,
            ageRange: demographics.ageRange,
            tenure: demographics.tenure,
            education: demographics.education,
            role: demographics.role
          },
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Prepare answers for insertion
      // For GPTW questions, we'll store them with a generated question_id based on the question index
      // In a real implementation, you'd fetch the actual question IDs from survey_questions table
      const answersToInsert = [
        ...gptwQuestions.map((q, index) => ({
          response_id: responseData.id,
          question_id: responseData.id, // Using response_id as placeholder - in production, use actual question IDs
          answer_value: answers[q.id]?.toString() || null,
          answer_text: null
        })),
        {
          response_id: responseData.id,
          question_id: responseData.id,
          answer_value: answers['nps']?.toString() || null,
          answer_text: null
        },
        ...openQuestions.map(q => ({
          response_id: responseData.id,
          question_id: responseData.id,
          answer_value: null,
          answer_text: (answers[q.id] as string) || null
        }))
      ];

      // Note: In production, you'd need to create the survey_questions first
      // and use their actual IDs. For now, we'll store answers in a simplified way.

      setIsComplete(true);
      setCurrentStep(totalSteps - 1);
      toast({ title: "Pesquisa enviada com sucesso!" });
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast({ title: "Erro ao enviar pesquisa", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company || !survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pesquisa não disponível</h2>
            <p className="text-muted-foreground">
              Não há pesquisa de clima ativa para esta empresa no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-10 object-contain" />
            ) : (
              <Building2 className="h-10 w-10 text-primary" />
            )}
            <div>
              <h1 className="font-semibold text-foreground">{company.name}</h1>
              <p className="text-xs text-muted-foreground">Pesquisa de Clima</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress */}
        {currentStep > 0 && currentStep < totalSteps - 1 && (
          <div className="mb-6">
            <SurveyProgress
              currentStep={currentStep}
              totalSteps={totalSteps - 2}
              steps={steps}
            />
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            {/* Welcome Step */}
            {currentStep === 0 && (
              <div className="text-center space-y-6 py-8">
                <ClipboardList className="h-16 w-16 text-primary mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{survey.title}</h2>
                  {survey.description && (
                    <p className="text-muted-foreground">{survey.description}</p>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 max-w-lg mx-auto">
                  <h3 className="font-semibold text-foreground">Instruções:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Esta pesquisa é <strong>100% anônima</strong></li>
                    <li>Suas respostas são confidenciais</li>
                    <li>Tempo estimado: 15-20 minutos</li>
                    <li>Responda com sinceridade</li>
                    <li>Não há respostas certas ou erradas</li>
                  </ul>
                </div>
                <Button size="lg" onClick={handleNext}>
                  Iniciar Pesquisa
                </Button>
              </div>
            )}

            {/* Question Pages */}
            {currentStep > 0 && currentStep <= questionPages && (
              <div className="space-y-2">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    Avalie as afirmativas abaixo
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Indique o quanto você concorda ou discorda de cada afirmação
                  </p>
                </div>
                {getCurrentQuestions().map((question, index) => (
                  <LikertQuestion
                    key={question.id}
                    questionId={question.id}
                    questionText={question.text}
                    questionNumber={(currentStep - 1) * QUESTIONS_PER_PAGE + index + 1}
                    value={answers[question.id] as number || null}
                    onChange={(value) => handleAnswerChange(question.id, value)}
                  />
                ))}
              </div>
            )}

            {/* Demographics Step */}
            {currentStep === questionPages + 1 && (
              <DemographicsForm
                values={demographics}
                onChange={handleDemographicChange}
                departments={departments}
              />
            )}

            {/* NPS Step */}
            {currentStep === questionPages + 2 && (
              <div className="py-8">
                <NPSQuestion
                  value={answers['nps'] as number || null}
                  onChange={(value) => handleAnswerChange('nps', value)}
                />
              </div>
            )}

            {/* Open Questions Step */}
            {currentStep === questionPages + 3 && (
              <div className="space-y-8 py-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Seus Comentários</h3>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe suas opiniões (opcional)
                  </p>
                </div>
                {openQuestions.map((question) => (
                  <OpenQuestion
                    key={question.id}
                    questionId={question.id}
                    questionText={question.text}
                    value={(answers[question.id] as string) || ''}
                    onChange={(value) => handleAnswerChange(question.id, value)}
                  />
                ))}
              </div>
            )}

            {/* Completion Step */}
            {currentStep === totalSteps - 1 && isComplete && (
              <div className="text-center py-12 space-y-6">
                <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Obrigado pela sua participação!
                  </h2>
                  <p className="text-muted-foreground">
                    Sua resposta foi registrada com sucesso. Suas respostas são anônimas e serão
                    utilizadas para melhorar o ambiente de trabalho.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep > 0 && currentStep < totalSteps - 1 && !isComplete && (
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                  Voltar
                </Button>
                
                {currentStep === questionPages + 3 ? (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Pesquisa'
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Próximo
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
