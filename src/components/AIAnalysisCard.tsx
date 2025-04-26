
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

const AIAnalysisCard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);
  
  // Simula a análise da IA
  useEffect(() => {
    loadAnalysis();
  }, []);
  
  const loadAnalysis = () => {
    setIsLoading(true);
    
    // Em um ambiente real, aqui seria uma chamada para sua API que usa a OpenAI
    setTimeout(() => {
      const mockInsights = [
        {
          id: 1,
          category: "RH",
          alert: "Alto",
          trend: "crescente",
          message: "Aumento significativo de 35% em denúncias relacionadas a assédio moral no setor de RH nas últimas 4 semanas. Recomenda-se investigação prioritária e treinamento de liderança.",
        },
        {
          id: 2,
          category: "Produção",
          alert: "Médio",
          trend: "estável",
          message: "Padrão recorrente de denúncias sobre segurança no trabalho na área de produção. 70% mencionam equipamentos inadequados. Sugestão: auditoria de segurança imediata.",
        },
        {
          id: 3,
          category: "Comercial",
          alert: "Baixo",
          trend: "decrescente",
          message: "Redução de 15% nas denúncias após implementação do novo código de conduta. Recomenda-se manter as práticas atuais e continuar monitoramento.",
        },
      ];
      
      setInsights(mockInsights);
      setIsLoading(false);
    }, 1500);
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
