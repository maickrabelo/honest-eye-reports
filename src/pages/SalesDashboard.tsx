import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { SalesTeamTab } from '@/components/admin/SalesTeamTab';
import { BarChart3, Users, Loader2, CheckCircle2, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SalesDashboard = () => {
  const navigate = useNavigate();
  const { session, role, isLoading, profile, refreshRole } = useRealAuth();
  const { toast } = useToast();

  const [demoLoading, setDemoLoading] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoStep, setDemoStep] = useState('');
  const [demoReady, setDemoReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      navigate('/auth');
      return;
    }
    if (role && (role as string) !== 'sales' && role !== 'admin') {
      navigate('/');
    }
  }, [isLoading, session, role, navigate]);

  // Check if demo company already exists
  useEffect(() => {
    if (profile?.company_id) {
      setDemoReady(true);
    }
  }, [profile?.company_id]);

  const handleProvisionDemo = async () => {
    setDemoLoading(true);
    setDemoProgress(5);
    setDemoStep('Iniciando criação da conta demo...');

    try {
      setDemoProgress(10);
      setDemoStep('Criando empresa demo...');

      // Simulate progress while waiting for the edge function
      const progressInterval = setInterval(() => {
        setDemoProgress(prev => {
          if (prev >= 85) { clearInterval(progressInterval); return prev; }
          const increment = prev < 30 ? 5 : prev < 60 ? 3 : 1;
          return prev + increment;
        });
        setDemoStep(prev => {
          if (prev.includes('Criando empresa')) return 'Gerando avaliações HSE-IT...';
          if (prev.includes('HSE-IT')) return 'Gerando avaliações de Burnout...';
          if (prev.includes('Burnout')) return 'Criando pesquisa de clima...';
          if (prev.includes('clima')) return 'Inserindo denúncias demo...';
          if (prev.includes('denúncias')) return 'Finalizando dados...';
          return prev;
        });
      }, 2000);

      const { data, error } = await supabase.functions.invoke('create-sales-demo', {});

      clearInterval(progressInterval);

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setDemoProgress(100);
      setDemoStep('Conta demo criada com sucesso!');

      // Refresh auth context to get new company_id
      await refreshRole();
      setDemoReady(true);

      toast({ title: 'Conta demo criada!', description: 'Todos os módulos estão prontos para demonstração.' });
    } catch (err: any) {
      toast({ title: 'Erro ao criar conta demo', description: err.message, variant: 'destructive' });
      setDemoProgress(0);
      setDemoStep('');
    } finally {
      setDemoLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Painel Comercial</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus leads e acesse a conta demo</p>
        </div>

        <Tabs defaultValue="crm" className="space-y-4">
          <TabsList>
            <TabsTrigger value="crm" className="gap-1.5">
              <Users className="h-4 w-4" />CRM
            </TabsTrigger>
            <TabsTrigger value="demo" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />Conta Demo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crm">
            <SalesTeamTab />
          </TabsContent>

          <TabsContent value="demo">
            {demoReady ? (
              <div className="text-center py-16">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">Conta Demo Ativa</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  Sua conta demo está configurada com todos os módulos e dados de exemplo. 
                  Use os links abaixo para acessar cada dashboard durante demonstrações.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate('/dashboard')} variant="default">
                    <BarChart3 className="h-4 w-4 mr-2" />Dashboard de Denúncias
                  </Button>
                  <Button onClick={() => navigate('/hseit-dashboard')} variant="outline">
                    HSE-IT Dashboard
                  </Button>
                  <Button onClick={() => navigate('/burnout-dashboard')} variant="outline">
                    Burnout Dashboard
                  </Button>
                  <Button onClick={() => navigate('/climate-survey-dashboard')} variant="outline">
                    Pesquisa de Clima
                  </Button>
                </div>
              </div>
            ) : demoLoading || demoProgress > 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-6">
                <Rocket className="h-12 w-12 text-primary animate-bounce" />
                <div className="w-full max-w-md space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{demoStep}</span>
                    <span>{demoProgress}%</span>
                  </div>
                  <Progress value={demoProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground text-center">
                    Criando empresa, avaliações HSE-IT, Burnout, Pesquisa de Clima e denúncias demo...
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Configurar Conta Demo</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  Clique no botão abaixo para criar uma empresa demo completa com dados de exemplo 
                  em todos os módulos: denúncias, HSE-IT, Burnout e Pesquisa de Clima.
                </p>
                <Button onClick={handleProvisionDemo} size="lg">
                  <Rocket className="h-4 w-4 mr-2" />Criar Conta Demo
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default SalesDashboard;
