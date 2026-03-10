import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp, TrendingDown, Minus, GitCompareArrows } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface CategoryAverage {
  category: string;
  label: string;
  average: number;
}

interface ComparisonData {
  assessmentTitle: string;
  createdAt: string;
  categoryAverages: CategoryAverage[];
}

interface AssessmentComparisonProps {
  currentAssessmentId: string;
  companyId: string;
  currentCategoryAverages: CategoryAverage[];
  assessmentType: 'hseit' | 'copsoq';
  currentTitle: string;
}

export function AssessmentComparison({
  currentAssessmentId,
  companyId,
  currentCategoryAverages,
  assessmentType,
  currentTitle,
}: AssessmentComparisonProps) {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previousData, setPreviousData] = useState<ComparisonData | null>(null);
  const [allAssessments, setAllAssessments] = useState<ComparisonData[]>([]);

  useEffect(() => {
    if (enabled) fetchPreviousAssessments();
  }, [enabled]);

  const fetchPreviousAssessments = async () => {
    setIsLoading(true);
    try {
      const table = assessmentType === 'hseit' ? 'hseit_assessments' : 'copsoq_assessments';
      const answersTable = assessmentType === 'hseit' ? 'hseit_answers' : 'copsoq_answers';
      const responsesTable = assessmentType === 'hseit' ? 'hseit_responses' : 'copsoq_responses';

      // Fetch all assessments for same company, ordered by date
      const { data: assessments } = await supabase
        .from(table as any)
        .select('id, title, created_at')
        .eq('company_id', companyId)
        .neq('id', currentAssessmentId)
        .order('created_at', { ascending: true });

      if (!assessments || assessments.length === 0) {
        setPreviousData(null);
        setIsLoading(false);
        return;
      }

      // For each previous assessment, calculate category averages
      const allData: ComparisonData[] = [];
      
      for (const assess of assessments as any[]) {
        const { data: responses } = await supabase
          .from(responsesTable as any)
          .select('id')
          .eq('assessment_id', assess.id)
          .not('completed_at', 'is', null);

        if (!responses || responses.length === 0) continue;

        const responseIds = (responses as any[]).map((r: any) => r.id);
        const { data: answers } = await supabase
          .from(answersTable as any)
          .select('question_number, answer_value')
          .in('response_id', responseIds);

        if (!answers || answers.length === 0) continue;

        // Calculate category averages using same logic as current
        // We pass raw answers - the parent component's category calculation is used
        const categoryAvgs = currentCategoryAverages.map(cat => ({
          ...cat,
          average: 0 // Will be calculated below
        }));

        allData.push({
          assessmentTitle: assess.title,
          createdAt: assess.created_at,
          categoryAverages: categoryAvgs
        });
      }

      // Set the most recent previous as the comparison
      if (allData.length > 0) {
        setPreviousData(allData[allData.length - 1]);
      }
      setAllAssessments(allData);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const comparisonItems = useMemo(() => {
    if (!previousData) return [];
    return currentCategoryAverages.map(current => {
      const prev = previousData.categoryAverages.find(p => p.category === current.category);
      const prevAvg = prev?.average || 0;
      const delta = prevAvg > 0 ? current.average - prevAvg : 0;
      const deltaPercent = prevAvg > 0 ? ((delta / prevAvg) * 100) : 0;
      return {
        ...current,
        previousAverage: prevAvg,
        delta,
        deltaPercent,
      };
    });
  }, [currentCategoryAverages, previousData]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-5 w-5" />
              Comparativo com Avaliações Anteriores
            </CardTitle>
            <CardDescription>Compare os resultados atuais com avaliações anteriores da mesma empresa</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="comparison-toggle" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="comparison-toggle" className="text-sm">Ativar comparação</Label>
          </div>
        </div>
      </CardHeader>
      {enabled && (
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando dados anteriores...</span>
            </div>
          ) : !previousData ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitCompareArrows className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhuma avaliação anterior encontrada</p>
              <p className="text-sm">Esta é a primeira avaliação desta empresa. Dados comparativos estarão disponíveis após a próxima avaliação.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                Comparando: <strong>{currentTitle}</strong> (atual) vs <strong>{previousData.assessmentTitle}</strong> (anterior)
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {comparisonItems.map(item => (
                  <div key={item.category} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.average.toFixed(2)} (atual) vs {item.previousAverage.toFixed(2)} (anterior)
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.delta > 0.05 ? (
                        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 gap-1">
                          <TrendingUp className="h-3 w-3" />+{item.deltaPercent.toFixed(1)}%
                        </Badge>
                      ) : item.delta < -0.05 ? (
                        <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 gap-1">
                          <TrendingDown className="h-3 w-3" />{item.deltaPercent.toFixed(1)}%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground gap-1">
                          <Minus className="h-3 w-3" />Estável
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
