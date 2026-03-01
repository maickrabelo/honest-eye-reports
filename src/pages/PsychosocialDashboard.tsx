import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealAuth } from '@/contexts/RealAuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Brain, FileText, Loader2 } from 'lucide-react';
import HSEITDashboardContent from '@/components/psychosocial/HSEITDashboardContent';
import COPSOQDashboardContent from '@/components/psychosocial/COPSOQDashboardContent';
import { useEffect } from 'react';

export default function PsychosocialDashboard() {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useRealAuth();
  const [activeTab, setActiveTab] = useState('hseit');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      const r = role as string | null;
      if (!r || !['admin', 'sst', 'sales'].includes(r)) {
        navigate('/');
        return;
      }
    }
  }, [user, role, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const backPath = (role as string) === 'sales' ? '/sales-dashboard' : '/sst-dashboard';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button variant="outline" size="sm" onClick={() => navigate(backPath)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Avaliação de Riscos Psicossociais
          </h1>
          <p className="text-muted-foreground mt-1">
            Ferramentas validadas internacionalmente para gestão de riscos psicossociais no trabalho
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="hseit" className="gap-2">
              <Brain className="h-4 w-4" />
              HSE-IT
            </TabsTrigger>
            <TabsTrigger value="copsoq" className="gap-2">
              <FileText className="h-4 w-4" />
              COPSOQ II
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hseit">
            <HSEITDashboardContent />
          </TabsContent>

          <TabsContent value="copsoq">
            <COPSOQDashboardContent />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
