import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import EmbeddedDashboard from '@/components/EmbeddedDashboard';

// Mock companies for the SST dashboard
const mockCompanies = [
  {
    id: "company1",
    name: "Tech Solutions Ltda",
    logo: "https://via.placeholder.com/150?text=TechSol",
    reportCount: 12,
    newReports: 3,
    slug: "tech-solutions"
  },
  {
    id: "company2",
    name: "Indústrias ABC",
    logo: "https://via.placeholder.com/150?text=ABC",
    reportCount: 8,
    newReports: 0,
    slug: "industrias-abc"
  },
  {
    id: "company3",
    name: "Comércio XYZ",
    logo: "https://via.placeholder.com/150?text=XYZ",
    reportCount: 5,
    newReports: 1,
    slug: "comercio-xyz"
  },
  {
    id: "company4",
    name: "Serviços Especializados",
    logo: "https://via.placeholder.com/150?text=SE",
    reportCount: 15,
    newReports: 0,
    slug: "servicos-especializados"
  },
  {
    id: "company5",
    name: "Construtora Delta",
    logo: "https://via.placeholder.com/150?text=Delta",
    reportCount: 23,
    newReports: 5,
    slug: "construtora-delta"
  },
  {
    id: "company6",
    name: "Transportadora Rápida",
    logo: "https://via.placeholder.com/150?text=TR",
    reportCount: 7,
    newReports: 2,
    slug: "transportadora-rapida"
  },
];

const SSTDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const filteredCompanies = mockCompanies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                      <img 
                        src={company.logo} 
                        alt={`Logo ${company.name}`} 
                        className="max-h-full max-w-full object-contain"
                      />
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
