import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import EmbeddedDashboard from '@/components/EmbeddedDashboard';
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
  reportCount: number;
  newReports: number;
}

const SSTDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useRealAuth();
  const { toast } = useToast();

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

      // Get user's profile to find sst_manager_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('sst_manager_id')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData?.sst_manager_id) {
        toast({
          title: "Erro",
          description: "Seu perfil não está vinculado a uma gestora SST.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get companies assigned to this SST manager
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('company_sst_assignments')
        .select('company_id')
        .eq('sst_manager_id', profileData.sst_manager_id);

      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData || assignmentsData.length === 0) {
        setCompanies([]);
        setIsLoading(false);
        return;
      }

      const companyIds = assignmentsData.map(a => a.company_id);

      // Get company details
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, logo_url, slug')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      // Get report counts for each company
      const companiesWithCounts = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count: totalCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);

          const { count: newCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('status', 'pending');

          return {
            ...company,
            reportCount: totalCount || 0,
            newReports: newCount || 0,
          };
        })
      );

      setCompanies(companiesWithCounts);
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

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleCompanyClick = (companySlug: string) => {
    setSelectedCompany(companySlug);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-green-800">Gestão SST</h1>
              <p className="text-gray-600">Monitore todas as empresas sob sua gestão</p>
            </div>
            
            {selectedCompany && (
              <Button 
                variant="outline"
                onClick={() => setSelectedCompany(null)}
                className="mb-4"
              >
                Voltar para lista de empresas
              </Button>
            )}
            
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
          
          {selectedCompany ? (
            <EmbeddedDashboard companyId={selectedCompany} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <Card 
                  key={company.id} 
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCompanyClick(company.slug)}
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
                  <CardContent className="pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total de denúncias:</span>
                      <span className="font-medium">{company.reportCount}</span>
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
              
              {filteredCompanies.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-gray-100 rounded-full p-4 mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Nenhuma empresa encontrada</h3>
                  <p className="text-gray-500">Tente ajustar sua busca ou entre em contato com o suporte.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SSTDashboard;
