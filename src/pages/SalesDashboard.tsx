import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { SalesTeamTab } from '@/components/admin/SalesTeamTab';
import { BarChart3, Users } from 'lucide-react';

const SalesDashboard = () => {
  const navigate = useNavigate();
  const { session, role, isLoading } = useRealAuth();

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
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Conta Demo</h3>
              <p className="text-sm max-w-md mx-auto">
                Sua conta demo está disponível com todos os módulos e dados de exemplo para demonstrações.
                Acesse o dashboard completo para apresentar aos clientes.
              </p>
              <div className="mt-4">
                <a href="/dashboard" className="text-primary hover:underline text-sm">
                  Acessar Dashboard Demo →
                </a>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default SalesDashboard;
