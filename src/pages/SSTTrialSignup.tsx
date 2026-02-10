import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle2, Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SSTTrialSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    sst_name: '',
    cnpj: '',
    email: '',
    responsible_name: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sst_name || !formData.cnpj || !formData.email || !formData.responsible_name) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome da gestora, CNPJ, email e nome do responsável.',
        variant: 'destructive',
      });
      return;
    }

    const cnpjDigits = formData.cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) {
      toast({
        title: 'CNPJ inválido',
        description: 'O CNPJ deve conter 14 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-sst-trial-account', {
        body: formData,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setIsSuccess(true);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-muted to-background px-4 py-12">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-primary">Conta criada com sucesso!</CardTitle>
              <CardDescription className="text-base mt-2">
                Enviamos os dados de acesso para o email <strong>{formData.email}</strong>.
                Verifique sua caixa de entrada (e spam).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-2">
                <p>📅 Seu período de teste é de <strong>7 dias gratuitos</strong>.</p>
                <p>Durante o trial, você pode cadastrar <strong>1 empresa</strong> para testar a plataforma.</p>
                <p className="font-medium text-foreground">🔑 Sua senha inicial é o <strong>CNPJ (apenas números)</strong>.</p>
                <p>No primeiro acesso, você será solicitado a criar uma nova senha.</p>
              </div>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Ir para o Login
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gradient-to-br from-muted to-background px-4 py-12">
        <div className="container mx-auto max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl text-primary">
                Teste grátis para Gestoras SST
              </CardTitle>
              <CardDescription className="text-base">
                Experimente a plataforma por 7 dias. Cadastre 1 empresa e explore
                todas as funcionalidades de gestão SST. Sem cartão de crédito.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="sst_name">Nome da gestora SST *</Label>
                  <Input
                    id="sst_name"
                    name="sst_name"
                    value={formData.sst_name}
                    onChange={handleChange}
                    placeholder="Ex: SST Segurança do Trabalho"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email corporativo *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contato@gestora.com.br"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsible_name">Nome do responsável *</Label>
                  <Input
                    id="responsible_name"
                    name="responsible_name"
                    value={formData.responsible_name}
                    onChange={handleChange}
                    placeholder="João da Silva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-1">
                  <p>✅ Sem cartão de crédito</p>
                  <p>✅ 7 dias de acesso completo</p>
                  <p>✅ Cadastre 1 empresa durante o trial</p>
                  <p>✅ Acesso a todas as ferramentas SST</p>
                  <p>🔑 Sua senha inicial será o CNPJ (apenas números)</p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando sua conta...
                    </>
                  ) : (
                    'Iniciar teste grátis'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SSTTrialSignup;
