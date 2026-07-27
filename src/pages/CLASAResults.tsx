import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useHasCLASAAccess } from '@/hooks/useHasCLASAAccess';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, GraduationCap, Loader2, MessageSquare, Users } from 'lucide-react';
import {
  CLASA_QUESTIONS,
  CLASA_CATEGORY_LABELS,
  CLASA_RISK_LABELS,
  CLASA_RISK_COLORS,
  calculateCLASAScores,
  getRiskLevel,
  toRiskIndex,
} from '@/data/clasaQuestions';
import { generateCLASAReportPDF } from '@/components/clasa/CLASAReportPDF';

const CHUNK = 25;

export default function CLASAResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useRealAuth();
  const { hasAccess, isLoading: accessLoading } = useHasCLASAAccess();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [department, setDepartment] = useState('all');

  useEffect(() => {
    if (authLoading || accessLoading) return;
    if (!user) { navigate('/auth'); return; }
    if (!hasAccess) { navigate('/'); return; }
    load();
  }, [user, hasAccess, authLoading, accessLoading, id]);

  const load = async () => {
    try {
      setLoading(true);
      const { data: a, error } = await supabase
        .from('clasa_assessments')
        .select('*, companies (name)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      setAssessment(a);

      const { data: resp } = await supabase
        .from('clasa_responses')
        .select('*')
        .eq('assessment_id', id)
        .not('completed_at', 'is', null);
      const respList = (resp as any[]) || [];
      setResponses(respList);

      const ids = respList.map(r => r.id);
      const all: any[] = [];
      for (let i = 0; i < ids.length; i += CHUNK) {
        const { data: ans } = await supabase
          .from('clasa_answers')
          .select('*')
          .in('response_id', ids.slice(i, i + CHUNK));
        all.push(...((ans as any[]) || []));
      }
      setAnswers(all);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erro ao carregar resultados', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const departments = useMemo(() => {
    const set = new Set<string>();
    responses.forEach(r => { if (r.department) set.add(r.department); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [responses]);

  const filteredResponses = useMemo(
    () => (department === 'all' ? responses : responses.filter(r => r.department === department)),
    [responses, department]
  );

  const stats = useMemo(() => {
    const ids = new Set(filteredResponses.map(r => r.id));
    const rel = answers.filter(a => ids.has(a.response_id));

    const sums: Record<number, { sum: number; n: number }> = {};
    rel.forEach(a => {
      if (!sums[a.question_number]) sums[a.question_number] = { sum: 0, n: 0 };
      sums[a.question_number].sum += a.answer_value;
      sums[a.question_number].n += 1;
    });

    const means: Record<number, number> = {};
    CLASA_QUESTIONS.forEach(q => {
      const s = sums[q.number];
      means[q.number] = s && s.n ? s.sum / s.n : 0;
    });

    const scores = calculateCLASAScores(means);
    const questionMeans = CLASA_QUESTIONS.map(q => ({ number: q.number, mean: means[q.number] }))
      .filter(q => q.mean > 0);

    return { ...scores, questionMeans };
  }, [filteredResponses, answers]);

  const departmentBreakdown = useMemo(() => {
    return departments.map(name => {
      const rs = responses.filter(r => r.department === name);
      const ids = new Set(rs.map(r => r.id));
      const rel = answers.filter(a => ids.has(a.response_id));
      const mean = rel.length ? rel.reduce((s, a) => s + a.answer_value, 0) / rel.length : 0;
      return { name, responses: rs.length, index: toRiskIndex(mean) };
    });
  }, [departments, responses, answers]);

  const openFeedbacks = useMemo(
    () => filteredResponses.map(r => (r.open_feedback || '').trim()).filter(Boolean),
    [filteredResponses]
  );

  const handleExportPDF = () => {
    if (filteredResponses.length === 0) {
      toast({ title: 'Sem respostas', description: 'Não há respostas para gerar o relatório.', variant: 'destructive' });
      return;
    }
    generateCLASAReportPDF({
      title: assessment?.title || 'Diagnóstico Aprendizes CLASA',
      companyName: assessment?.companies?.name || '-',
      period: department === 'all' ? 'Todas as turmas' : department,
      totalResponses: filteredResponses.length,
      globalIndex: stats.globalIndex,
      globalLevel: stats.globalLevel,
      byCategory: stats.byCategory.filter(c => c.answered > 0),
      questionMeans: stats.questionMeans,
      departmentBreakdown,
      openFeedbacks,
    });
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
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-secondary py-10">
          <div className="container mx-auto px-4 relative z-10">
            <Button variant="ghost" size="sm" onClick={() => navigate('/clasa-dashboard')} className="mb-4 gap-2 text-white/70 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm mb-3">
                  <GraduationCap className="h-4 w-4" /> Aprendizes CLASA — NR-01
                </div>
                <h1 className="text-3xl font-bold text-white">{assessment?.title}</h1>
                <p className="text-white/70 mt-1">{assessment?.companies?.name}</p>
              </div>
              <Button onClick={handleExportPDF} className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                <Download className="h-4 w-4" /> Baixar Relatório PDF
              </Button>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">{filteredResponses.length} respostas concluídas</span>
            </div>
            {departments.length > 0 && (
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-full md:w-[280px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas / setores</SelectItem>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {filteredResponses.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Nenhuma resposta ainda</h3>
                <p className="text-muted-foreground text-sm">Compartilhe o link da avaliação com os aprendizes.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Índice global de risco psicossocial</CardTitle>
                  <CardDescription>0 = totalmente protetivo · 100 = risco máximo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-4 mb-3">
                    <span className="text-5xl font-bold" style={{ color: CLASA_RISK_COLORS[stats.globalLevel] }}>{stats.globalIndex}</span>
                    <span className="text-muted-foreground mb-2">/100</span>
                    <Badge className="mb-2" style={{ backgroundColor: CLASA_RISK_COLORS[stats.globalLevel] }}>
                      {CLASA_RISK_LABELS[stats.globalLevel]}
                    </Badge>
                  </div>
                  <Progress value={stats.globalIndex} />
                  <p className="text-sm text-muted-foreground mt-3">Média geral das respostas: {stats.globalMean.toFixed(2)} (escala 1 a 3)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Resultado por eixo temático</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  {stats.byCategory.filter(c => c.answered > 0).map(cat => (
                    <div key={cat.category}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium">{CLASA_CATEGORY_LABELS[cat.category]}</span>
                        <span className="text-sm font-semibold" style={{ color: CLASA_RISK_COLORS[cat.level] }}>
                          {cat.index}/100 · {CLASA_RISK_LABELS[cat.level]}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${cat.index}%`, backgroundColor: CLASA_RISK_COLORS[cat.level] }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {departments.length > 0 && department === 'all' && (
                <Card>
                  <CardHeader><CardTitle>Comparativo por turma / setor</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {departmentBreakdown.map(d => {
                      const lvl = getRiskLevel(d.index);
                      return (
                        <div key={d.name}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-medium">{d.name} <span className="text-muted-foreground">({d.responses})</span></span>
                            <span className="text-sm font-semibold" style={{ color: CLASA_RISK_COLORS[lvl] }}>{d.index}/100</span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${d.index}%`, backgroundColor: CLASA_RISK_COLORS[lvl] }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento por questão</CardTitle>
                  <CardDescription>Média de 1 (proteção) a 3 (risco)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.questionMeans.map(qm => {
                    const q = CLASA_QUESTIONS.find(x => x.number === qm.number)!;
                    const idx = toRiskIndex(qm.mean);
                    const lvl = getRiskLevel(idx);
                    return (
                      <div key={qm.number} className="border-b border-border pb-3 last:border-0">
                        <div className="flex justify-between gap-4">
                          <p className="text-sm">
                            <span className="font-medium">Q{q.number}.</span> {q.text}
                          </p>
                          <span className="text-sm font-semibold whitespace-nowrap" style={{ color: CLASA_RISK_COLORS[lvl] }}>
                            {qm.mean.toFixed(2)} · {idx}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {openFeedbacks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />Manifestações dos aprendizes</CardTitle>
                    <CardDescription>{openFeedbacks.length} comentário(s) anônimo(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {openFeedbacks.map((f, i) => (
                      <p key={i} className="text-sm bg-muted/50 rounded-lg p-3 border border-border">{f}</p>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
