import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, Users, AlertTriangle, TrendingUp, BarChart3, ClipboardList } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  HSEIT_QUESTIONS,
  HSEIT_CATEGORY_LABELS,
  HSEITCategory,
  calculateCategoryAverage,
  calculateOverallAverage,
  getRiskLevel,
  getHealthImpact,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  HEALTH_IMPACT_LABELS,
  HEALTH_IMPACT_COLORS,
  normalizeScore
} from '@/data/hseitQuestions';
import { ChartConfig } from '@/components/ui/chart';
import { CategoryRiskIndicators } from '@/components/hseit/CategoryRiskIndicators';
import { HSEITReportPDF } from '@/components/hseit/HSEITReportPDF';

interface Assessment {
  id: string;
  title: string;
  companies: {
    name: string;
  };
}

interface Answer {
  questionNumber: number;
  value: number;
}

interface Response {
  id: string;
  department: string | null;
  answers: Answer[];
}

export default function HSEITResults() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, role, isLoading: authLoading } = useRealAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (!['admin', 'sst', 'company'].includes(role || '')) {
        navigate('/dashboard');
        return;
      }
      fetchData();
    }
  }, [user, role, authLoading, id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('hseit_assessments')
        .select('id, title, companies(name)')
        .eq('id', id)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData as unknown as Assessment);

      // Fetch responses with answers
      const { data: responsesData, error: responsesError } = await supabase
        .from('hseit_responses')
        .select('id, department')
        .eq('assessment_id', id)
        .not('completed_at', 'is', null);

      if (responsesError) throw responsesError;

      // Fetch all answers for these responses
      const responseIds = responsesData?.map(r => r.id) || [];
      let allAnswers: { response_id: string; question_number: number; answer_value: number }[] = [];

      if (responseIds.length > 0) {
        const { data: answersData } = await supabase
          .from('hseit_answers')
          .select('response_id, question_number, answer_value')
          .in('response_id', responseIds);

        allAnswers = answersData || [];
      }

      // Map responses with their answers
      const mappedResponses: Response[] = (responsesData || []).map(r => ({
        id: r.id,
        department: r.department,
        answers: allAnswers
          .filter(a => a.response_id === r.id)
          .map(a => ({ questionNumber: a.question_number, value: a.answer_value }))
      }));

      setResponses(mappedResponses);

      // Extract unique departments
      const depts = [...new Set(mappedResponses.map(r => r.department).filter(Boolean) as string[])];
      setDepartments(depts);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os resultados.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter responses by department
  const filteredResponses = useMemo(() => {
    if (selectedDepartment === 'all') return responses;
    return responses.filter(r => r.department === selectedDepartment);
  }, [responses, selectedDepartment]);

  // Calculate aggregated answers for filtered responses
  const aggregatedAnswers = useMemo(() => {
    const allAnswers: Answer[] = [];
    filteredResponses.forEach(r => {
      allAnswers.push(...r.answers);
    });
    return allAnswers;
  }, [filteredResponses]);

  // Calculate category averages
  const categoryAverages = useMemo(() => {
    if (aggregatedAnswers.length === 0) return {};

    const categories: HSEITCategory[] = ['demands', 'control', 'managerSupport', 'peerSupport', 'relationships', 'role', 'change'];
    const averages: Record<string, number> = {};

    categories.forEach(category => {
      averages[category] = calculateCategoryAverage(aggregatedAnswers, category);
    });

    return averages;
  }, [aggregatedAnswers]);

  // Overall average
  const overallAverage = useMemo(() => {
    return calculateOverallAverage(aggregatedAnswers);
  }, [aggregatedAnswers]);

  // Radar chart data
  const radarData = useMemo(() => {
    return Object.entries(categoryAverages).map(([category, value]) => ({
      category: HSEIT_CATEGORY_LABELS[category as HSEITCategory],
      value: value,
      fullMark: 5
    }));
  }, [categoryAverages]);

  // Risk level distribution
  const riskDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      very_low: 0,
      low: 0,
      moderate: 0,
      high: 0,
      very_high: 0
    };

    Object.values(categoryAverages).forEach(avg => {
      const level = getRiskLevel(avg);
      distribution[level]++;
    });

    return Object.entries(distribution).map(([level, count]) => ({
      name: RISK_LEVEL_LABELS[level as keyof typeof RISK_LEVEL_LABELS],
      value: count,
      color: RISK_LEVEL_COLORS[level as keyof typeof RISK_LEVEL_COLORS]
    }));
  }, [categoryAverages]);

  // Health impact distribution
  const healthDistribution = useMemo(() => {
    const distribution = {
      favorable: 0,
      intermediate: 0,
      risk: 0
    };

    Object.values(categoryAverages).forEach(avg => {
      const impact = getHealthImpact(avg);
      distribution[impact]++;
    });

    return Object.entries(distribution).map(([impact, count]) => ({
      name: HEALTH_IMPACT_LABELS[impact as keyof typeof HEALTH_IMPACT_LABELS],
      value: count,
      color: HEALTH_IMPACT_COLORS[impact as keyof typeof HEALTH_IMPACT_COLORS]
    }));
  }, [categoryAverages]);

  // Question averages
  const questionAverages = useMemo(() => {
    const questionGroups: Record<number, number[]> = {};

    aggregatedAnswers.forEach(answer => {
      if (!questionGroups[answer.questionNumber]) {
        questionGroups[answer.questionNumber] = [];
      }
      questionGroups[answer.questionNumber].push(answer.value);
    });

    return HSEIT_QUESTIONS.map(q => {
      const values = questionGroups[q.number] || [];
      const rawAvg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const normalizedAvg = values.length > 0 
        ? values.reduce((sum, v) => sum + normalizeScore(v, q.isInverted), 0) / values.length 
        : 0;

      return {
        number: q.number,
        text: q.text,
        category: HSEIT_CATEGORY_LABELS[q.category],
        average: normalizedAvg,
        riskLevel: getRiskLevel(normalizedAvg),
        responseCount: values.length
      };
    }).sort((a, b) => a.average - b.average); // Sort by worst first
  }, [aggregatedAnswers]);

  // High risk count
  const highRiskCount = useMemo(() => {
    return Object.values(categoryAverages).filter(avg => {
      const level = getRiskLevel(avg);
      return level === 'high' || level === 'very_high';
    }).length;
  }, [categoryAverages]);

  const chartConfig: ChartConfig = {
    value: { label: 'Média' }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessment || filteredResponses.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sem Respostas</h2>
              <p className="text-muted-foreground mb-4">
                Esta avaliação ainda não possui respostas suficientes para gerar o relatório.
              </p>
              <Button onClick={() => navigate('/hseit-dashboard')}>
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/hseit-dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                Resultados HSE-IT
              </h1>
              <p className="text-muted-foreground mt-1">
                {assessment.title} - {assessment.companies?.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {departments.length > 0 && (
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os setores</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <HSEITReportPDF
              assessment={assessment}
              responses={filteredResponses}
              categoryAverages={categoryAverages}
              overallAverage={overallAverage}
              departments={departments}
              questionAverages={questionAverages}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Respostas</p>
                  <p className="text-2xl font-bold">{filteredResponses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Geral</p>
                  <p className="text-2xl font-bold">{overallAverage.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${HEALTH_IMPACT_COLORS[getHealthImpact(overallAverage)]}20` }}>
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: HEALTH_IMPACT_COLORS[getHealthImpact(overallAverage)] }}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Impacto Saúde</p>
                  <p className="text-2xl font-bold">
                    {HEALTH_IMPACT_LABELS[getHealthImpact(overallAverage)]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categorias em Risco</p>
                  <p className="text-2xl font-bold">{highRiskCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Perfil por Categoria</CardTitle>
              <CardDescription>Média das 7 dimensões HSE-IT (1-5)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Média"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Health Impact Pie */}
          <Card>
            <CardHeader>
              <CardTitle>Semáforo de Saúde</CardTitle>
              <CardDescription>Distribuição do impacto para saúde por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {healthDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Detalhamento por Categoria</CardTitle>
            <CardDescription>Média e nível de risco de cada dimensão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={radarData}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 5]} />
                  <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {radarData.map((entry, index) => {
                      const riskLevel = getRiskLevel(entry.value);
                      return (
                        <Cell key={`cell-${index}`} fill={RISK_LEVEL_COLORS[riskLevel]} />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Indicators with Recommendations */}
        <div className="mb-8">
          <CategoryRiskIndicators categoryAverages={categoryAverages} />
        </div>

        {/* Question Table - Top 10 Critical */}
        <Card>
          <CardHeader>
            <CardTitle>Questões Mais Críticas</CardTitle>
            <CardDescription>Top 10 questões com menor pontuação (maior risco)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Questão</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Média</TableHead>
                  <TableHead className="text-center">Nível</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionAverages.slice(0, 10).map((q) => (
                  <TableRow key={q.number}>
                    <TableCell className="font-medium">{q.number}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate" title={q.text}>{q.text}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{q.category}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {q.average.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        style={{
                          backgroundColor: `${RISK_LEVEL_COLORS[q.riskLevel]}20`,
                          color: RISK_LEVEL_COLORS[q.riskLevel],
                          borderColor: RISK_LEVEL_COLORS[q.riskLevel]
                        }}
                        variant="outline"
                      >
                        {RISK_LEVEL_LABELS[q.riskLevel]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
