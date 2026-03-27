import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle, Loader2, ExternalLink, Copy, ClipboardList, Plus, Brain, Flame, Building2, Pencil, Trash2, Link2, ArrowRight, BarChart3, Shield } from "lucide-react";
import { QRCodeDownloader } from "@/components/QRCodeDownloader";
import { useNavigate } from 'react-router-dom';
import EmbeddedDashboard from '@/components/EmbeddedDashboard';
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { useToast } from "@/hooks/use-toast";
import AddCompanyDialog from '@/components/sst/AddCompanyDialog';
import EditCompanyDialog from '@/components/sst/EditCompanyDialog';
import DeleteCompanyDialog from '@/components/sst/DeleteCompanyDialog';
import SSTCompanyCounter from '@/components/sst/SSTCompanyCounter';
import TrialBanner from '@/components/TrialBanner';
import TrialExpiredOverlay from '@/components/TrialExpiredOverlay';
import OnboardingTour, { TourStep } from '@/components/OnboardingTour';
import { useOnboarding } from '@/hooks/useOnboarding';
import SoniaChat from '@/components/SoniaChat';
import { SoniaChatProvider, SoniaChatLayout } from '@/contexts/SoniaChatContext';

const sstDashboardSteps: TourStep[] = [
  {
    targetId: 'sst-tools-bar',
    title: '🛠️ Suas Ferramentas',
    description: 'Aqui ficam todas as ferramentas disponíveis para você gerenciar a saúde ocupacional das suas empresas.',
    position: 'bottom',
  },
  {
    targetId: 'tool-hseit',
    title: '🧠 Riscos Psicossociais',
    description: 'Avalie os riscos psicossociais das empresas usando metodologias HSE-IT e COPSOQ, reconhecidas internacionalmente.',
    position: 'bottom',
  },
  {
    targetId: 'tool-burnout',
    title: '🔥 Avaliação Burnout',
    description: 'Aplique questionários de avaliação de risco de Síndrome de Burnout nos colaboradores.',
    position: 'bottom',
  },
  {
    targetId: 'tool-climate',
    title: '📋 Pesquisas de Clima',
    description: 'Crie e gerencie pesquisas de clima organizacional personalizadas.',
    position: 'bottom',
  },
  {
    targetId: 'tool-new-company',
    title: '🏢 Nova Empresa',
    description: 'Cadastre novas empresas para gerenciar. No plano trial, você pode ter até 2 empresas.',
    position: 'bottom',
  },
  {
    targetId: 'sst-link',
    title: '🔗 Link da Página Inicial',
    description: 'Este é o link da sua página pública. Compartilhe com suas empresas clientes para que acessem o canal de ouvidoria.',
    position: 'bottom',
  },
  {
    targetId: 'company-cards',
    title: '📊 Empresas Cadastradas',
    description: 'Aqui você visualiza todas as empresas cadastradas e acessa o portal de ouvidoria de cada uma.',
    position: 'top',
  },
];

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

const tools = [
  {
    id: 'tool-hseit',
    icon: Brain,
    title: 'Riscos Psicossociais',
    description: 'HSE-IT e COPSOQ validados internacionalmente',
    highlights: ['HSE-IT', 'COPSOQ II', 'Plano de ação'],
    path: '/psychosocial-dashboard',
  },
  {
    id: 'tool-burnout',
    icon: Flame,
    title: 'Avaliação Burnout',
    description: 'Questionários científicos de esgotamento',
    highlights: ['MBI validado', 'Relatório PDF', 'Dashboard'],
    path: '/burnout-dashboard',
  },
  {
    id: 'tool-climate',
    icon: ClipboardList,
    title: 'Pesquisas de Clima',
    description: 'Clima organizacional personalizado',
    highlights: ['NPS', 'Personalizável', 'Relatórios'],
    path: '/climate-dashboard',
  },
];

const SSTDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [sstManagerId, setSstManagerId] = useState<string | null>(null);
  const [maxCompanies, setMaxCompanies] = useState(50);
  const [sstSlug, setSstSlug] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading, isTrialExpired, trialEndsAt } = useRealAuth();
  const { toast } = useToast();
  const { shouldShowTour, completeTour } = useOnboarding('sst-dashboard');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (role !== 'sst') {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta página.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      fetchCompanies();
    }
  }, [user, role, authLoading, navigate, toast]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('sst_manager_id')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData?.sst_manager_id) {
        toast({ title: "Erro", description: "Seu perfil não está vinculado a uma gestora SST.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const currentSstManagerId = profileData.sst_manager_id;
      setSstManagerId(currentSstManagerId);

      const [sstResult, assignmentsResult] = await Promise.all([
        supabase.from('sst_managers').select('max_companies, slug').eq('id', currentSstManagerId).single(),
        supabase.from('company_sst_assignments').select('company_id').eq('sst_manager_id', currentSstManagerId),
      ]);

      const { data: sstData } = sstResult;
      const { data: assignmentsData, error: assignmentsError } = assignmentsResult;

      if (sstData?.max_companies) setMaxCompanies(sstData.max_companies);
      if (sstData?.slug) setSstSlug(sstData.slug);
      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData || assignmentsData.length === 0) {
        setCompanies([]);
        setIsLoading(false);
        return;
      }

      const companyIds = assignmentsData.map(a => a.company_id);
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, logo_url, slug, cnpj, email, phone, address')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      const companiesWithCounts = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count: totalCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('company_id', company.id);
          const { count: newCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('company_id', company.id).eq('status', 'pending');
          return { ...company, reportCount: totalCount || 0, newReports: newCount || 0 };
        })
      );

      setCompanies(companiesWithCounts);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast({ title: "Erro ao carregar empresas", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  const handleCompanyClick = (companySlug: string) => {
    setSelectedCompany(companySlug);
  };

  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Link copiado!", description: "O link foi copiado para a área de transferência." });
    } catch {
      toast({ title: "Erro ao copiar", description: "Não foi possível copiar o link.", variant: "destructive" });
    }
  };

  const totalReports = companies.reduce((sum, c) => sum + c.reportCount, 0);
  const pendingReports = companies.reduce((sum, c) => sum + c.newReports, 0);

  return (
    <SoniaChatProvider>
    <SoniaChatLayout>
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-background">
        {/* Hero Header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-secondary py-12 md:py-16">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

          <div className="audit-container relative z-10">
            {isTrialExpired && <TrialExpiredOverlay />}
            {trialEndsAt && !isTrialExpired && <TrialBanner trialEndsAt={trialEndsAt} />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-4">
                  <Shield className="h-4 w-4" />
                  <span>Painel de Gestão SST</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Gestão SST</h1>
                <p className="text-white/70 mt-1">Monitore todas as empresas sob sua gestão</p>
              </div>
              {selectedCompany && (
                <Button variant="secondary" onClick={() => setSelectedCompany(null)} className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                  Voltar para lista de empresas
                </Button>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {[
                { value: companies.length.toString(), label: 'Empresas', icon: Building2 },
                { value: totalReports.toString(), label: 'Total Denúncias', icon: BarChart3 },
                { value: pendingReports.toString(), label: 'Pendentes', icon: AlertCircle },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <stat.icon className="h-5 w-5 text-white/80" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/60">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="audit-container py-8">
          {/* Tools Section */}
          <div id="sst-tools-bar" className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Suas Ferramentas</h2>
                <p className="text-muted-foreground text-sm mt-1">Ferramentas para gestão de saúde ocupacional</p>
              </div>
              <Button
                id="tool-new-company"
                onClick={() => setIsAddCompanyOpen(true)}
                disabled={companies.length >= maxCompanies}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Empresa
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {tools.map((tool, idx) => (
                <Card
                  key={tool.id}
                  id={tool.id}
                  className="group cursor-pointer border border-border hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 animate-fade-in"
                  style={{ animationDelay: `${idx * 100 + 200}ms` }}
                  onClick={() => navigate(tool.path)}
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4 group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
                      <tool.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tool.highlights.map((h, hIdx) => (
                        <span key={hIdx} className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          {h}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      Acessar <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* SST Link */}
          {sstSlug && (
            <div id="sst-link" className="mb-8 flex items-center gap-3 p-4 bg-card rounded-xl border border-border shadow-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Sua página pública</p>
                <a
                  href={`${window.location.origin}/sst/${sstSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate block"
                >
                  {window.location.origin}/sst/{sstSlug}
                </a>
              </div>
              <Button variant="outline" size="sm" onClick={(e) => copyToClipboard(`${window.location.origin}/sst/${sstSlug}`, e)} className="gap-1.5">
                <Copy className="h-4 w-4" /> Copiar
              </Button>
            </div>
          )}

          {selectedCompany ? (
            <EmbeddedDashboard companyId={selectedCompany} />
          ) : (
            <>
              {/* Companies Section */}
              <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Portal de Ouvidoria</h2>
                    <p className="text-muted-foreground text-sm">Clique para acessar o canal de ouvidoria de cada empresa</p>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input placeholder="Buscar empresa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <SSTCompanyCounter currentCount={companies.length} maxCompanies={maxCompanies} />
              </div>

              <div id="company-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company, idx) => (
                  <Card
                    key={company.id}
                    className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer border border-border animate-fade-in"
                    style={{ animationDelay: `${idx * 80}ms` }}
                    onClick={() => handleCompanyClick(company.slug)}
                  >
                    <div className="relative">
                      {company.newReports > 0 && (
                        <div className="absolute top-3 right-3 z-10">
                          <Badge className="bg-destructive text-destructive-foreground border-none shadow-lg animate-pulse">
                            {company.newReports} {company.newReports === 1 ? 'nova' : 'novas'}
                          </Badge>
                        </div>
                      )}
                      <div className="h-28 bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4 group-hover:from-primary/10 group-hover:to-secondary/10 transition-colors duration-500">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt={`Logo ${company.name}`} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="text-3xl font-bold text-primary/30 group-hover:text-primary/50 transition-colors">
                            {company.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCompany(company);
                            setIsEditCompanyOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total de denúncias:</span>
                        <span className="font-semibold text-foreground">{company.reportCount}</span>
                      </div>

                      <div className="pt-2 border-t border-border space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Canal de Denúncias:</p>
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
                          <Button variant="ghost" size="sm" onClick={(e) => copyToClipboard(`${window.location.origin}/report/${company.slug}`, e)} className="h-6 px-2">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <QRCodeDownloader url={`${window.location.origin}/report/${company.slug}`} filename={`qrcode-${company.slug}.png`} size="sm" className="w-full" />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {company.newReports > 0 ? (
                        <div className="w-full py-2 text-sm flex items-center justify-center text-destructive bg-destructive/10 rounded-lg font-medium">
                          <AlertCircle className="h-4 w-4 mr-1.5" />
                          Nova atividade detectada
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Ver dashboard
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}

                {filteredCompanies.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-muted rounded-full p-4 mb-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">Nenhuma empresa encontrada</h3>
                    <p className="text-muted-foreground">Tente ajustar sua busca ou adicione uma nova empresa.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      {sstManagerId && (
        <AddCompanyDialog open={isAddCompanyOpen} onOpenChange={setIsAddCompanyOpen} sstManagerId={sstManagerId} onCompanyAdded={fetchCompanies} />
      )}
      <EditCompanyDialog open={isEditCompanyOpen} onOpenChange={setIsEditCompanyOpen} company={editingCompany} onCompanyUpdated={fetchCompanies} />
      {shouldShowTour && <OnboardingTour steps={sstDashboardSteps} onComplete={() => completeTour()} />}
    </div>
    </SoniaChatLayout>
    <SoniaChat sstManagerId={sstManagerId} contextType="sst" />
    </SoniaChatProvider>
  );
};

export default SSTDashboard;
