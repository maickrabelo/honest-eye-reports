import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Users, TrendingUp } from 'lucide-react';

interface HSEITAssessmentStats {
  id: string;
  title: string;
  is_active: boolean;
  total_employees: number;
  response_count: number;
}

export default function HSEITParticipationCard({ companyId }: { companyId: string }) {
  const [assessments, setAssessments] = useState<HSEITAssessmentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHSEITStats();
  }, [companyId]);

  const fetchHSEITStats = async () => {
    try {
      // Fetch active HSE-IT assessments for this company
      const { data: assessmentsData, error } = await supabase
        .from('hseit_assessments')
        .select('id, title, is_active')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error || !assessmentsData?.length) {
        setAssessments([]);
        return;
      }

      const stats: HSEITAssessmentStats[] = [];

      for (const assessment of assessmentsData) {
        // Get departments total employee count
        const { data: depts } = await supabase
          .from('hseit_departments')
          .select('employee_count')
          .eq('assessment_id', assessment.id);

        const totalEmployees = depts?.reduce((sum, d) => sum + (d.employee_count || 0), 0) || 0;

        // Get completed response count
        const { data: responses } = await supabase
          .from('hseit_responses')
          .select('id')
          .eq('assessment_id', assessment.id)
          .not('completed_at', 'is', null);

        stats.push({
          id: assessment.id,
          title: assessment.title,
          is_active: assessment.is_active,
          total_employees: totalEmployees,
          response_count: responses?.length || 0,
        });
      }

      setAssessments(stats);
    } catch (err) {
      console.error('Error fetching HSE-IT stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || assessments.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Avaliações HSE-IT Ativas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assessments.map((a) => {
          const rate = a.total_employees > 0
            ? Math.round((a.response_count / a.total_employees) * 100)
            : 0;

          return (
            <div key={a.id} className="space-y-2 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{a.title}</span>
                <Badge variant="default" className="text-xs">Ativa</Badge>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span><strong className="text-foreground">{a.response_count}</strong> respostas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  <span><strong className="text-foreground">{rate}%</strong> de participação</span>
                </div>
                {a.total_employees > 0 && (
                  <span className="text-xs">({a.response_count}/{a.total_employees} colaboradores)</span>
                )}
              </div>
              {a.total_employees > 0 && (
                <Progress value={Math.min(rate, 100)} className="h-2" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
