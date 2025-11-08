
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";

const AIAnalysisCard = () => {
  const { profile } = useRealAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);
  
  useEffect(() => {
    if (profile?.company_id) {
      loadAnalysis();
    }
  }, [profile?.company_id]);
  
  const loadAnalysis = async () => {
    if (!profile?.company_id) return;
    
    setIsLoading(true);
    
    try {
      // Buscar denúncias dos últimos 60 dias
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const { data: recentReports, error } = await supabase
        .from('reports')
        .select('*')
        .eq('company_id', profile.company_id)
        .gte('created_at', sixtyDaysAgo.toISOString());

      if (error) throw error;

      // Buscar denúncias dos 60 dias anteriores para comparação
      const oneHundredTwentyDaysAgo = new Date();
      oneHundredTwentyDaysAgo.setDate(oneHundredTwentyDaysAgo.getDate() - 120);

      const { data: previousReports, error: prevError } = await supabase
        .from('reports')
        .select('*')
        .eq('company_id', profile.company_id)
        .gte('created_at', oneHundredTwentyDaysAgo.toISOString())
        .lt('created_at', sixtyDaysAgo.toISOString());

      if (prevError) throw prevError;

      const generatedInsights: any[] = [];

      // Análise por categoria
      const categoryCount: { [key: string]: number } = {};
      const prevCategoryCount: { [key: string]: number } = {};

      recentReports?.forEach(report => {
        const cat = report.category || 'Outros';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      previousReports?.forEach(report => {
        const cat = report.category || 'Outros';
        prevCategoryCount[cat] = (prevCategoryCount[cat] || 0) + 1;
      });

      // Gerar insights por categoria
      Object.keys(categoryCount).forEach((category, index) => {
        const current = categoryCount[category];
        const previous = prevCategoryCount[category] || 0;
        const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
        
        let alert = 'Baixo';
        let trend = 'estável';
        let message = '';

        if (change > 30) {
          alert = 'Alto';
          trend = 'crescente';
          message = `Aumento significativo de ${Math.round(change)}% em denúncias de ${category} nos últimos 60 dias. Recomenda-se investigação prioritária.`;
        } else if (change > 10) {
          alert = 'Médio';
          trend = 'crescente';
          message = `Aumento moderado de ${Math.round(change)}% em denúncias de ${category}. Monitoramento contínuo recomendado.`;
        } else if (change < -10) {
          alert = 'Baixo';
          trend = 'decrescente';
          message = `Redução de ${Math.abs(Math.round(change))}% nas denúncias de ${category}. Continue monitorando as práticas atuais.`;
        } else {
          alert = 'Baixo';
          trend = 'estável';
          message = `Denúncias de ${category} mantêm-se estáveis. Total: ${current} denúncias nos últimos 60 dias.`;
        }

        if (current >= 3) { // Só mostra insights para categorias com pelo menos 3 denúncias
          generatedInsights.push({
            id: index + 1,
            category,
            alert,
            trend,
            message,
          });
        }
      });

      // Análise por departamento
      const deptCount: { [key: string]: number } = {};
      recentReports?.forEach(report => {
        if (report.department) {
          deptCount[report.department] = (deptCount[report.department] || 0) + 1;
        }
      });

      // Identificar departamento com mais denúncias
      const maxDept = Object.entries(deptCount).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
      if (maxDept[1] >= 3) {
        generatedInsights.push({
          id: generatedInsights.length + 1,
          category: maxDept[0],
          alert: maxDept[1] > 5 ? 'Alto' : 'Médio',
          trend: 'crescente',
          message: `Departamento ${maxDept[0]} concentra ${maxDept[1]} denúncias nos últimos 60 dias. Análise detalhada recomendada.`,
        });
      }

      // Análise de urgência
      const highUrgency = recentReports?.filter(r => r.urgency === 'high').length || 0;
      if (highUrgency > 0) {
        generatedInsights.push({
          id: generatedInsights.length + 1,
          category: 'Urgência Alta',
          alert: 'Alto',
          trend: 'crescente',
          message: `${highUrgency} denúncia${highUrgency > 1 ? 's' : ''} de alta urgência ${highUrgency > 1 ? 'foram' : 'foi'} registrada${highUrgency > 1 ? 's' : ''} recentemente. Atenção imediata necessária.`,
        });
      }

      if (generatedInsights.length === 0) {
        generatedInsights.push({
          id: 1,
          category: 'Geral',
          alert: 'Baixo',
          trend: 'estável',
          message: 'Nenhuma anomalia detectada. O volume de denúncias está dentro dos padrões esperados.',
        });
      }

      setInsights(generatedInsights.slice(0, 3)); // Limita a 3 insights principais
    } catch (error) {
      console.error('Error loading analysis:', error);
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getAlertBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'alto':
        return <Badge variant="default" className="bg-red-100 text-red-800 border-red-300">Alto</Badge>;
      case 'médio':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-300">Médio</Badge>;
      case 'baixo':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Baixo</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };
  
  const getTrendIcon = (trend: string) => {
    if (trend === "crescente") {
      return <span className="text-red-500">↑</span>;
    } else if (trend === "decrescente") {
      return <span className="text-green-500">↓</span>;
    }
    return <span className="text-gray-500">→</span>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-audit-secondary" />
              Análise de IA
            </CardTitle>
            <CardDescription>
              Insights automáticos baseados em tendências das denúncias
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadAnalysis} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-audit-primary/50" />
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline" className="bg-gray-100">
                      {insight.category}
                    </Badge>
                    {getAlertBadge(insight.alert)}
                  </div>
                  <div className="text-sm font-medium flex items-center">
                    Tendência: {getTrendIcon(insight.trend)} {insight.trend}
                  </div>
                </div>
                <p className="text-sm">{insight.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisCard;
