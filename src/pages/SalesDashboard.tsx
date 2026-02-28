import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, AlertCircle, Loader2, ExternalLink, Copy, ClipboardList, Brain, Flame, Building2, Users, Rocket, Link2 } from "lucide-react";
import { QRCodeDownloader } from "@/components/QRCodeDownloader";
import { useNavigate } from 'react-router-dom';
import EmbeddedDashboard from '@/components/EmbeddedDashboard';
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { useToast } from "@/hooks/use-toast";
import { SalesTeamTab } from '@/components/admin/SalesTeamTab';
import { Progress } from '@/components/ui/progress';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  reportCount: number;
  newReports: number;
}

const SalesDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoStep, setDemoStep] = useState('');
  const navigate = useNavigate();
  const { user, session, role, isLoading: authLoading, profile, refreshRole } = useRealAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        navigate('/auth');
        return;
      }
      if (role && (role as string) !== 'sales' && role !== 'admin') {
        navigate('/');
        return;
      }
      fetchCompanies();
    }
  }, [user, role, authLoading, navigate]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);

      if (!profile?.company_id) {
        setCompanies([]);
        setIsLoading(false);
        return;
      }

      // Get company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, logo_url, slug, cnpj, email, phone, address')
        .eq('id', profile.company_id)
        .single();

      if (companyError) throw companyError;
      if (!companyData) {
        setCompanies([]);
        setIsLoading(false);
        return;
      }

      // Get report counts
      const [totalResult, newResult] = await Promise.all([
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyData.id),
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyData.id)
          .eq('status', 'pending'),
      ]);

      setCompanies([{
        ...companyData,
        reportCount: totalResult.count || 0,
        newReports: newResult.count || 0,
      }]);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProvisionDemo = async () => {
    setDemoLoading(true);
    setDemoProgress(5);
    setDemoStep('Iniciando criação da conta demo...');

    try {
      setDemoProgress(10);
      setDemoStep('Criando empresa demo...');

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

      await refreshRole();
      await fetchCompanies();

      toast({ title: 'Conta demo criada!', description: 'Todos os módulos estão prontos para demonstração.' });
    } catch (err: any) {
      toast({ title: 'Erro ao criar conta demo', description: err.message, variant: 'destructive' });
      setDemoProgress(0);
      setDemoStep('');
    } finally {
      setDemoLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasDemoCompany = profile?.company_id && companies.length > 0;

  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-800" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-green-800">Painel Comercial</h1>
              <p className="text-gray-600">Gerencie seus leads e acesse a conta demo</p>
            </div>
            {selectedCompany && (
              <Button
                variant="outline"
                onClick={() => setSelectedCompany(null)}
              >
                Voltar para lista de empresas
              </Button>
            )}
          </div>

          <Tabs defaultValue="demo" className="space-y-6">
            <TabsList>
              <TabsTrigger value="demo" className="gap-1.5">
                <Building2 className="h-4 w-4" />Conta Demo
              </TabsTrigger>
              <TabsTrigger value="crm" className="gap-1.5">
                <Users className="h-4 w-4" />CRM
              </TabsTrigger>
            </TabsList>

            <TabsContent value="demo">
              {hasDemoCompany ? (
                <>
                  {/* Suas Ferramentas */}
                  <div className="bg-green-700 text-white rounded-lg px-5 py-3 mb-4">
                    <h2 className="text-lg font-semibold tracking-wide">Suas Ferramentas</h2>
                  </div>
                  <div className="flex flex-wrap gap-3 mb-8">
                    <Button
                      onClick={() => navigate('/hseit-dashboard')}
                      variant="outline"
                      className="border-green-600 text-green-800 font-semibold hover:bg-green-50 shadow-sm"
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Avaliação HSE-IT
                    </Button>

                    <Button
                      onClick={() => navigate('/burnout-dashboard')}
                      variant="outline"
                      className="border-green-600 text-green-800 font-semibold hover:bg-green-50 shadow-sm"
                    >
                      <Flame className="mr-2 h-4 w-4" />
                      Avaliação Burnout
                    </Button>

                    <Button
                      onClick={() => navigate('/climate-dashboard')}
                      variant="outline"
                      className="border-green-600 text-green-800 font-semibold hover:bg-green-50 shadow-sm"
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Pesquisas de Clima
                    </Button>
                  </div>

                  {selectedCompany ? (
                    <EmbeddedDashboard companyId={selectedCompany} />
                  ) : (
                    <>
                      <div className="mb-4">
                        <h2 className="text-2xl font-bold text-green-800">Portal de Ouvidoria das Empresas</h2>
                        <p className="text-gray-500">Clique para visualizar as informações do canal de ouvidoria de cada empresa</p>
                      </div>

                      {companies.length > 1 && (
                        <div className="flex justify-end mb-4">
                          <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              placeholder="Buscar empresa..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCompanies.map((company) => (
                          <Card
                            key={company.id}
                            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedCompany(company.slug)}
                          >
                            <div className="relative">
                              {company.newReports > 0 && (
                                <div className="absolute top-2 right-2">
                                  <Badge className="bg-red-500 text-white border-none">
                                    {company.newReports} {company.newReports === 1 ? 'nova denúncia' : 'novas denúncias'}
                                  </Badge>
                                </div>
                              )}
                              <div className="h-32 bg-gray-100 flex items-center justify-center p-4">
                                {company.logo_url ? (
                                  <img
                                    src={company.logo_url}
                                    alt={`Logo ${company.name}`}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                ) : (
                                  <div className="text-gray-400 text-4xl font-bold">
                                    {company.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{company.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-2 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Total de denúncias:</span>
                                <span className="font-medium">{company.reportCount}</span>
                              </div>

                              <div className="pt-2 border-t space-y-2">
                                <p className="text-xs text-gray-500 font-medium">Canal de Denúncias:</p>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`${window.location.origin}/report/${company.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-primary hover:underline flex items-center gap-1 flex-1 truncate"
                                  >
                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{window.location.origin}/report/{company.slug}</span>
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => copyToClipboard(`${window.location.origin}/report/${company.slug}`, e)}
                                    className="h-6 px-2"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <QRCodeDownloader
                                  url={`${window.location.origin}/report/${company.slug}`}
                                  filename={`qrcode-${company.slug}.png`}
                                  size="sm"
                                  className="w-full"
                                />
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                              {company.newReports > 0 ? (
                                <div className="w-full py-2 text-sm flex items-center justify-center text-red-600 bg-red-50 rounded-md">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Nova atividade detectada
                                </div>
                              ) : (
                                <Button variant="outline" className="w-full">
                                  Ver dashboard
                                </Button>
                              )}
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </>
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

            <TabsContent value="crm">
              <SalesTeamTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SalesDashboard;
