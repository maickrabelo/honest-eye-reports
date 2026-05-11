import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Building2, ShieldCheck } from "lucide-react";
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useNavigate } from 'react-router-dom';

const PendingApproval = () => {
  const { signOut } = useRealAuth();
  const navigate = useNavigate();

  const goTo = async (path: string) => {
    await signOut();
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 p-4">
      <a href="/" className="mb-6">
        <img src="/lovable-uploads/Logo_SOIA.png" alt="SOIA" className="h-14 object-contain" />
      </a>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Comece seu teste grátis</CardTitle>
          <CardDescription className="text-center">
            Para liberar seu acesso, escolha o tipo de conta e ative seu teste grátis de 7 dias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => goTo('/cadastro-empresa-trial')} className="w-full gap-2">
            <Building2 className="h-4 w-4" />
            Sou Empresa — Teste grátis
          </Button>
          <Button onClick={() => goTo('/cadastro-sst-trial')} variant="secondary" className="w-full gap-2">
            <ShieldCheck className="h-4 w-4" />
            Sou Gestora SST — Teste grátis
          </Button>
          <Button onClick={signOut} variant="ghost" className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
