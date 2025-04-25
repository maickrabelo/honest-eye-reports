
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnonymousReportButton from '@/components/AnonymousReportButton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-audit-primary to-audit-secondary py-20 text-white">
          <div className="audit-container text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Promovendo Transparência e Integridade
            </h1>
            <p className="text-xl sm:text-2xl mb-10 max-w-3xl mx-auto opacity-90 animate-fade-in">
              Uma plataforma segura para denúncias e auditoria interna, ajudando empresas a manterem seus valores éticos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Link to="/report">
                <Button size="lg" variant="secondary" className="bg-white text-audit-primary hover:bg-gray-100">
                  Fazer Denúncia
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Acessar Sistema
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="audit-container">
            <h2 className="section-title text-center mb-12">Como Funciona</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 border rounded-lg shadow-sm text-center card-hover">
                <div className="w-16 h-16 bg-audit-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-audit-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-audit-primary">Denuncie</h3>
                <p className="text-gray-600">
                  Envie denúncias de forma anônima ou identificada, com suporte para anexar provas e documentos.
                </p>
              </div>

              <div className="p-6 border rounded-lg shadow-sm text-center card-hover">
                <div className="w-16 h-16 bg-audit-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-audit-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-audit-secondary">Analise</h3>
                <p className="text-gray-600">
                  Nossa IA analisa automaticamente as denúncias, categoriza e identifica padrões para acelerar investigações.
                </p>
              </div>

              <div className="p-6 border rounded-lg shadow-sm text-center card-hover">
                <div className="w-16 h-16 bg-audit-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-audit-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-audit-accent">Resolva</h3>
                <p className="text-gray-600">
                  Acompanhe o progresso das denúncias e mantenha um histórico completo das ações tomadas e resultados.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Anonymous Reporting Section */}
        <section className="py-16 bg-gray-50">
          <div className="audit-container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="section-title mb-6">Denúncia Anônima</h2>
              <p className="text-lg text-gray-600 mb-8">
                Preocupado com sua privacidade? Você pode fazer denúncias completamente anônimas, 
                garantindo sua segurança enquanto ajuda a melhorar o ambiente de trabalho.
              </p>
              <AnonymousReportButton />
            </div>
          </div>
        </section>

        {/* Analytics Preview */}
        <section className="py-16 bg-white">
          <div className="audit-container">
            <div className="flex flex-col lg:flex-row gap-10 items-center justify-between">
              <div className="lg:w-1/2">
                <h2 className="section-title">Análise Inteligente</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Nossa plataforma utiliza inteligência artificial para analisar denúncias, 
                  identificar tendências e gerar insights valiosos para sua empresa.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Categorização automática de denúncias",
                    "Identificação de padrões recorrentes",
                    "Relatórios detalhados por departamento",
                    "Métricas de resolução e eficiência"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-audit-secondary flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button className="bg-audit-primary hover:bg-audit-primary/90">
                    Ver Dashboard
                  </Button>
                </Link>
              </div>
              <div className="lg:w-1/2 bg-gray-100 rounded-lg p-6 shadow-md">
                <div className="aspect-video bg-white rounded-md shadow-sm p-4">
                  <div className="h-full flex flex-col">
                    <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-audit-primary">Visão Geral de Denúncias</h3>
                      <div className="text-sm text-gray-500">Último mês</div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-full max-w-sm">
                        <div className="h-4 bg-gray-200 rounded-full mb-6"></div>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          {[65, 42, 28].map((h, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <div style={{ height: h }} className={`w-12 rounded-t-md ${i === 0 ? 'bg-audit-primary' : i === 1 ? 'bg-audit-secondary' : 'bg-audit-accent'}`}></div>
                              <div className="text-xs mt-2 text-gray-500">{['RH', 'Comercial', 'Produção'][i]}</div>
                            </div>
                          ))}
                        </div>
                        <div className="h-4 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-audit-primary to-audit-secondary text-white">
          <div className="audit-container text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Pronto para melhorar a transparência?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Implemente hoje mesmo nossa solução de auditoria e aumente a integridade na sua empresa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" variant="secondary" className="bg-white text-audit-primary hover:bg-gray-100">
                  Acessar Sistema
                </Button>
              </Link>
              <Link to="/report">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Fazer Denúncia
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
