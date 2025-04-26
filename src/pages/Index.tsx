
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnonymousReportButton from '@/components/AnonymousReportButton';
import TrackReportModal from '@/components/TrackReportModal';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-audit-primary to-audit-accent text-white py-16 md:py-24">
          <div className="audit-container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Sistema de Auditoria e Ouvidoria
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Plataforma segura para denúncias e acompanhamento de casos, com processamento inteligente e análise detalhada.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <AnonymousReportButton />
              <TrackReportModal className="bg-white text-audit-primary hover:bg-gray-100" />
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="audit-container">
            <h2 className="text-3xl font-bold text-center mb-12 text-audit-primary">
              Como Funciona
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Faça sua denúncia",
                  description: "Relate situações através de nosso chat inteligente que ajuda você a explicar com detalhes o que aconteceu.",
                  icon: "💬",
                },
                {
                  title: "Acompanhe o processo",
                  description: "Utilize o código fornecido para acompanhar o status da sua denúncia de forma confidencial.",
                  icon: "🔍",
                },
                {
                  title: "Receba atualizações",
                  description: "Fique informado em tempo real sobre o andamento da sua denúncia e ações tomadas.",
                  icon: "📱",
                },
              ].map((feature, idx) => (
                <div key={idx} className="bg-gray-50 p-6 rounded-lg text-center hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 text-audit-primary">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="audit-container">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              {[
                { value: "98%", label: "Resolução" },
                { value: "24h", label: "Tempo médio de resposta" },
                { value: "100%", label: "Confidencialidade" },
                { value: "+2000", label: "Casos processados" },
              ].map((stat, idx) => (
                <div key={idx} className="p-6">
                  <div className="text-4xl font-bold text-audit-primary mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-audit-secondary text-white">
          <div className="audit-container text-center">
            <h2 className="text-3xl font-bold mb-6">
              Pronto para melhorar a transparência na sua organização?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de empresas que já utilizam nossa plataforma para criar um ambiente de trabalho mais seguro e transparente.
            </p>
            <Button 
              onClick={() => navigate('/login')}
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-audit-secondary"
            >
              Comece Agora
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
