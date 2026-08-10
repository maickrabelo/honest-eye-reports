import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CLASA_QUESTIONS,
  CLASA_CATEGORY_LABELS,
  CLASA_OPEN_QUESTION,
  calculateCLASAScores,
} from "@/data/clasaQuestions";
import { GraduationCap, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  companies: { name: string; logo_url: string | null } | null;
}

const QUESTIONS_PER_PAGE = 5;

export default function CLASAForm() {
  const { assessmentId } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [classGroup, setClassGroup] = useState("");
  const [surveyPeriod, setSurveyPeriod] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [openFeedback, setOpenFeedback] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(CLASA_QUESTIONS.length / QUESTIONS_PER_PAGE) + 1; // +1 = página final (campo aberto)
  const isLastPage = currentPage === totalPages - 1;

  const currentQuestions = useMemo(() => {
    const start = currentPage * QUESTIONS_PER_PAGE;
    return CLASA_QUESTIONS.slice(start, start + QUESTIONS_PER_PAGE);
  }, [currentPage]);

  useEffect(() => { fetchAssessment(); }, [assessmentId]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('clasa_assessments')
        .select('id, title, description, is_active, companies (name, logo_url)')
        .eq('id', assessmentId)
        .maybeSingle();
      if (err) throw err;
      if (!data) { setError('Avaliação não encontrada.'); return; }
      if (!data.is_active) { setError('Esta avaliação não está ativa no momento.'); return; }
      setAssessment(data as any);

      const { data: depts } = await supabase
        .from('clasa_departments')
        .select('id, name')
        .eq('assessment_id', assessmentId)
        .order('order_index');
      setDepartments((depts as any[]) || []);
    } catch (e) {
      console.error(e);
      setError('Erro ao carregar a avaliação.');
    } finally {
      setLoading(false);
    }
  };

  const progress = (Object.keys(answers).length / CLASA_QUESTIONS.length) * 100;
  const canGoNext = currentQuestions.every(q => answers[q.number] !== undefined);

  const handleNext = () => {
    if (currentPage === 0 && (!classGroup.trim() || !surveyPeriod.trim())) {
      toast({ title: 'Preencha os dados iniciais', description: 'Informe a turma e o mês/ano da pesquisa.', variant: 'destructive' });
      return;
    }
    if (currentPage < totalPages - 1) {
      setCurrentPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!CLASA_QUESTIONS.every(q => answers[q.number] !== undefined)) {
      toast({ title: 'Respostas incompletas', description: 'Responda todas as questões antes de enviar.', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      const scores = calculateCLASAScores(answers);
      const respondentToken = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      // ID gerado no cliente: respondentes anônimos não têm permissão de leitura,
      // então o insert não pode usar RETURNING (.select()).
      const responseId = crypto.randomUUID();

      const { error: respError } = await supabase
        .from('clasa_responses')
        .insert({
          id: responseId,
          assessment_id: assessmentId,
          department: selectedDepartment || null,
          respondent_token: respondentToken,
          demographics: { classGroup: classGroup.trim(), surveyPeriod: surveyPeriod.trim() },
          open_feedback: openFeedback.trim() || null,
          total_score: scores.totalScore,
          risk_level: scores.globalLevel,
          completed_at: new Date().toISOString(),
        });
      if (respError) throw respError;

      const rows = Object.entries(answers).map(([n, v]) => ({
        response_id: responseId,
        question_number: parseInt(n),
        answer_value: v,
      }));
      const { error: ansError } = await supabase.from('clasa_answers').insert(rows);
      if (ansError) throw ansError;

      setIsCompleted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erro ao enviar', description: e.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Ops!</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-2xl font-semibold">Resposta enviada!</h2>
            <p className="text-muted-foreground">
              Obrigado por participar. Suas respostas são <strong>anônimas</strong> e serão analisadas de forma agregada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            {assessment?.companies?.logo_url && (
              <img src={assessment.companies.logo_url} alt={assessment.companies.name} className="h-14 mx-auto mb-3 object-contain" />
            )}
            <div className="inline-flex items-center gap-2 justify-center text-primary mb-1">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm font-medium">Diagnóstico Aprendizes CLASA — NR-01</span>
            </div>
            <CardTitle className="text-2xl">{assessment?.title}</CardTitle>
            {assessment?.description && <CardDescription>{assessment.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progress} />
            <p className="text-xs text-center text-muted-foreground">
              {Object.keys(answers).length} de {CLASA_QUESTIONS.length} questões respondidas · Página {currentPage + 1} de {totalPages}
            </p>
          </CardContent>
        </Card>

        {currentPage === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Iniciais</CardTitle>
              <CardDescription>Nenhum dado pessoal é solicitado. Sua resposta é anônima.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Turma / Período do Programa *</Label>
                <Input value={classGroup} onChange={e => setClassGroup(e.target.value)} placeholder="Ex: Turma 2026.1 — manhã" />
              </div>
              <div className="space-y-2">
                <Label>Mês / Ano da Pesquisa *</Label>
                <Input value={surveyPeriod} onChange={e => setSurveyPeriod(e.target.value)} placeholder="Ex: 07/2026" />
              </div>
              {departments.length > 0 && (
                <div className="space-y-2">
                  <Label>Setor / Turma cadastrada</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!isLastPage && currentQuestions.map(q => (
          <Card key={q.number}>
            <CardHeader>
              <p className="text-xs font-medium text-primary uppercase tracking-wide">{CLASA_CATEGORY_LABELS[q.category]}</p>
              <CardTitle className="text-base font-medium leading-relaxed">{q.number}. {q.text}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[q.number]?.toString() || ''}
                onValueChange={v => setAnswers(prev => ({ ...prev, [q.number]: parseInt(v) }))}
                className="space-y-2"
              >
                {q.options.map(opt => (
                  <div key={opt.value} className="flex items-start gap-3 rounded-lg border border-border p-3 hover:border-primary/40 transition-colors">
                    <RadioGroupItem value={opt.value.toString()} id={`q${q.number}-${opt.value}`} className="mt-0.5" />
                    <Label htmlFor={`q${q.number}-${opt.value}`} className="font-normal leading-relaxed cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        {isLastPage && (
          <Card>
            <CardHeader>
              <p className="text-xs font-medium text-primary uppercase tracking-wide">Espaço para Manifestação</p>
              <CardTitle className="text-base font-medium leading-relaxed">{CLASA_OPEN_QUESTION}</CardTitle>
              <CardDescription>Opcional</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea rows={6} value={openFeedback} onChange={e => setOpenFeedback(e.target.value)} placeholder="Escreva aqui..." />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between gap-3 pb-8">
          <Button variant="outline" onClick={handlePrev} disabled={currentPage === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          {isLastPage ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Enviar Respostas
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canGoNext}>
              Próxima <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
