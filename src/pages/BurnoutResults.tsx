import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  ArrowLeft, 
  Flame, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  FileText
} from "lucide-react";
import {
  BURNOUT_QUESTIONS_SORTED,
  BURNOUT_CATEGORY_LABELS,
  BURNOUT_CATEGORY_COLORS,
  BURNOUT_RISK_LABELS,
  BURNOUT_RISK_COLORS,
  BURNOUT_RISK_RECOMMENDATIONS,
  BurnoutCategory,
  BurnoutRiskLevel,
  calculateCategoryPercentage,
  getBurnoutRiskLevel
} from "@/data/burnoutQuestions";

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  companies: { name: string; logo_url: string | null } | null;
}

interface Response {
  id: string;
  department: string | null;
  total_score: number;
  risk_level: string;
  completed_at: string;
}

interface Answer {
  response_id: string;
  question_number: number;
  answer_value: number;
}

export default function BurnoutResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useRealAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (role !== 'admin' && role !== 'sst') {
        navigate('/dashboard');
        return;
      }
      fetchData();
    }
  }, [user, role, authLoading, navigate, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('burnout_assessments')
        .select('id, title, description, companies (name, logo_url)')
        .eq('id', id)
        .single();
        
      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData as Assessment);
      
      // Fetch responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('burnout_responses')
        .select('id, department, total_score, risk_level, completed_at')
        .eq('assessment_id', id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });
        
      if (responsesError) throw responsesError;
      setResponses(responsesData || []);
      
      // Fetch all answers
      if (responsesData && responsesData.length > 0) {
        const responseIds = responsesData.map(r => r.id);
        const { data: answersData, error: answersError } = await supabase
          .from('burnout_answers')
          .select('response_id, question_number, answer_value')
          .in('response_id', responseIds);
          
        if (answersError) throw answersError;
        setAnswers(answersData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os resultados da avaliação.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const departments = [...new Set(responses.filter(r => r.department).map(r => r.department!))];
  
  const avgScore = responses.length > 0
    ? Math.round(responses.reduce((sum, r) => sum + r.total_score, 0) / responses.length)
    : 0;
    
  const overallRiskLevel = getBurnoutRiskLevel(avgScore);
  
  const riskDistribution = Object.entries(
    responses.reduce((acc, r) => {
      const level = r.risk_level as BurnoutRiskLevel;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<BurnoutRiskLevel, number>)
  ).map(([level, count]) => ({
    name: BURNOUT_RISK_LABELS[level as BurnoutRiskLevel],
    value: count,
    color: BURNOUT_RISK_COLORS[level as BurnoutRiskLevel]
  }));

  // Category averages
  const categoryData = (['exaustao', 'despersonalizacao', 'desmotivacao'] as BurnoutCategory[]).map(category => {
    const allAnswers = answers.map(a => ({ questionNumber: a.question_number, value: a.answer_value }));
    const percentage = calculateCategoryPercentage(allAnswers, category);
    return {
      category: BURNOUT_CATEGORY_LABELS[category],
      value: Math.round(percentage),
      fill: BURNOUT_CATEGORY_COLORS[category]
    };
  });

  // Department analysis
  const departmentData = departments.map(dept => {
    const deptResponses = responses.filter(r => r.department === dept);
    const deptAnswers = answers.filter(a => 
      deptResponses.some(r => r.id === a.response_id)
    );
    
    const avgDeptScore = deptResponses.length > 0
      ? Math.round(deptResponses.reduce((sum, r) => sum + r.total_score, 0) / deptResponses.length)
      : 0;
      
    const deptRiskLevel = getBurnoutRiskLevel(avgDeptScore);
    
    const categoryScores = (['exaustao', 'despersonalizacao', 'desmotivacao'] as BurnoutCategory[]).map(cat => ({
      category: BURNOUT_CATEGORY_LABELS[cat],
      value: calculateCategoryPercentage(
        deptAnswers.map(a => ({ questionNumber: a.question_number, value: a.answer_value })),
        cat
      )
    }));
    
    return {
      department: dept,
      responseCount: deptResponses.length,
      avgScore: avgDeptScore,
      riskLevel: deptRiskLevel,
      categories: categoryScores
    };
  });

  // Critical questions (highest average scores)
  const questionAverages = BURNOUT_QUESTIONS_SORTED.map(question => {
    const questionAnswers = answers.filter(a => a.question_number === question.number);
    const avgValue = questionAnswers.length > 0
      ? questionAnswers.reduce((sum, a) => sum + a.answer_value, 0) / questionAnswers.length
      : 0;
    return {
      ...question,
      avgValue: Math.round(avgValue * 100) / 100,
      percentage: ((avgValue - 1) / 5) * 100
    };
  }).sort((a, b) => b.avgValue - a.avgValue);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/burnout-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              Resultados: {assessment?.title}
            </h1>
            <p className="text-muted-foreground">
              {assessment?.companies?.name} • {responses.length} respostas
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Gerar Relatório PDF
          </Button>
        </div>

        {responses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma resposta ainda</h3>
              <p className="text-muted-foreground">
                Compartilhe o link da avaliação para começar a coletar respostas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{responses.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pontuação Média</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgScore}</div>
                  <p className="text-xs text-muted-foreground">de 120 pontos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nível de Risco Geral</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Badge 
                    style={{ backgroundColor: BURNOUT_RISK_COLORS[overallRiskLevel], color: 'white' }}
                  >
                    {BURNOUT_RISK_LABELS[overallRiskLevel]}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Setores Avaliados</CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{departments.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Distribution & Category Chart */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Níveis de Risco</CardTitle>
                  <CardDescription>Quantidade de funcionários por nível</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {riskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Média por Categoria</CardTitle>
                  <CardDescription>Percentual de risco por dimensão</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="category" width={120} />
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 border rounded shadow">
                                  <p className="font-medium">{payload[0].payload.category}</p>
                                  <p className="text-sm">{payload[0].value}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Analysis */}
            {departmentData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Análise por Setor</CardTitle>
                  <CardDescription>Semáforo de risco e detalhamento por departamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Setor</TableHead>
                        <TableHead className="text-center">Respostas</TableHead>
                        <TableHead className="text-center">Pontuação Média</TableHead>
                        <TableHead className="text-center">Nível de Risco</TableHead>
                        <TableHead className="text-center">Exaustão</TableHead>
                        <TableHead className="text-center">Despersonalização</TableHead>
                        <TableHead className="text-center">Desmotivação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departmentData.map(dept => (
                        <TableRow key={dept.department}>
                          <TableCell className="font-medium">{dept.department}</TableCell>
                          <TableCell className="text-center">{dept.responseCount}</TableCell>
                          <TableCell className="text-center">{dept.avgScore}</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              style={{ 
                                backgroundColor: BURNOUT_RISK_COLORS[dept.riskLevel], 
                                color: 'white' 
                              }}
                            >
                              {BURNOUT_RISK_LABELS[dept.riskLevel]}
                            </Badge>
                          </TableCell>
                          {dept.categories.map(cat => (
                            <TableCell key={cat.category} className="text-center">
                              <span className="text-sm">{Math.round(cat.value)}%</span>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Radar Chart per Department */}
            {departmentData.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {departmentData.map(dept => (
                  <Card key={dept.department}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{dept.department}</CardTitle>
                      <Badge 
                        className="w-fit"
                        style={{ 
                          backgroundColor: BURNOUT_RISK_COLORS[dept.riskLevel], 
                          color: 'white' 
                        }}
                      >
                        {BURNOUT_RISK_LABELS[dept.riskLevel]}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={dept.categories}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar
                              name={dept.department}
                              dataKey="value"
                              stroke="#f97316"
                              fill="#f97316"
                              fillOpacity={0.5}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Critical Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Questões Críticas</CardTitle>
                <CardDescription>Top 10 questões com maior pontuação média</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Questão</TableHead>
                      <TableHead className="text-center">Categoria</TableHead>
                      <TableHead className="text-center">Média</TableHead>
                      <TableHead className="text-center">% Risco</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questionAverages.slice(0, 10).map((q, index) => (
                      <TableRow key={q.number}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{q.text}</TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline"
                            style={{ 
                              borderColor: BURNOUT_CATEGORY_COLORS[q.category],
                              color: BURNOUT_CATEGORY_COLORS[q.category]
                            }}
                          >
                            {BURNOUT_CATEGORY_LABELS[q.category]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{q.avgValue.toFixed(1)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full"
                                style={{ 
                                  width: `${q.percentage}%`,
                                  backgroundColor: q.percentage > 60 ? '#ef4444' : q.percentage > 40 ? '#f97316' : '#22c55e'
                                }}
                              />
                            </div>
                            <span className="text-sm">{Math.round(q.percentage)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
                <CardDescription>
                  Condutas sugeridas com base no nível de risco geral: {BURNOUT_RISK_LABELS[overallRiskLevel]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${BURNOUT_RISK_COLORS[overallRiskLevel]}15` }}>
                    <p className="font-medium mb-2" style={{ color: BURNOUT_RISK_COLORS[overallRiskLevel] }}>
                      Conduta Recomendada:
                    </p>
                    <p className="text-muted-foreground">
                      {BURNOUT_RISK_RECOMMENDATIONS[overallRiskLevel].conduta}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Ações Sugeridas:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {BURNOUT_RISK_RECOMMENDATIONS[overallRiskLevel].acoes.map((acao, i) => (
                        <li key={i}>{acao}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
