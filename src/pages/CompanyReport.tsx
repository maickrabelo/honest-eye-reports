
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ReportChat } from '@/components/ReportChatContent';

// Mock company data
const mockCompanies = [
  {
    slug: "tech-solutions",
    name: "Tech Solutions Ltda",
    logo: "https://via.placeholder.com/150?text=TechSol",
  },
  {
    slug: "industrias-abc",
    name: "Indústrias ABC",
    logo: "https://via.placeholder.com/150?text=ABC",
  },
  {
    slug: "comercio-xyz",
    name: "Comércio XYZ",
    logo: "https://via.placeholder.com/150?text=XYZ",
  },
];

const CompanyReport = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [company, setCompany] = useState<{ name: string, logo: string } | null>(null);
  
  useEffect(() => {
    // In a real app, fetch company data from an API
    const foundCompany = mockCompanies.find(c => c.slug === companySlug);
    if (foundCompany) {
      setCompany(foundCompany);
    }
  }, [companySlug]);

  if (!company) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-audit-primary mb-2">Empresa não encontrada</h1>
            <p>O link que você acessou não corresponde a nenhuma empresa registrada.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container max-w-4xl">
          <div className="mb-8 text-center">
            <div className="flex flex-col items-center">
              <img 
                src={company.logo} 
                alt={`Logo ${company.name}`} 
                className="h-16 object-contain mb-4"
              />
              <h1 className="text-3xl font-bold text-audit-primary">Ouvidoria {company.name}</h1>
              <p className="text-gray-600 mt-2">
                Aqui você pode registrar sua denúncia de forma anônima e segura.
              </p>
            </div>
          </div>
          
          {/* Reuse the ReportChat component */}
          <ReportChat companyId={companySlug || ""} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyReport;
