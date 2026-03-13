import React from 'react';
import { useRealAuth, UserCompany } from '@/contexts/RealAuthContext';
import { Building2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const CompanySelector: React.FC = () => {
  const { companies, switchCompany, isLoading, user, role } = useRealAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSelect = async (company: UserCompany) => {
    await switchCompany(company.id);
    // Navigate based on role after selecting company
    if (role === 'admin') navigate('/master-dashboard');
    else if (role === 'sst') navigate('/sst-dashboard');
    else if (role === 'partner') navigate('/parceiro/dashboard');
    else if (role === 'affiliate') navigate('/afiliado/dashboard');
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Selecione a Empresa</h1>
          <p className="text-muted-foreground">
            Seu email tem acesso a {companies.length} empresas. Escolha qual deseja acessar.
          </p>
        </div>

        <div className="space-y-3">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/40 group"
              onClick={() => handleSelect(company)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="h-12 w-12 rounded-lg object-contain border bg-white p-1"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{company.name}</h3>
                  {company.cnpj && (
                    <p className="text-sm text-muted-foreground">CNPJ: {company.cnpj}</p>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanySelector;
