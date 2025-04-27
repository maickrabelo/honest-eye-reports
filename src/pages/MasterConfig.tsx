
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BackButton from '@/components/BackButton';

const MasterConfig = () => {
  const [openaiKey, setOpenaiKey] = useState('');
  const { toast } = useToast();

  const handleSaveConfig = () => {
    // In a real app, this would save to your backend
    localStorage.setItem('openai_api_key', openaiKey);
    toast({
      title: "Configurações salvas",
      description: "As chaves de API foram atualizadas com sucesso."
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-green-50 py-8">
        <div className="audit-container max-w-4xl">
          <BackButton />
          <h1 className="text-3xl font-bold text-green-800 mb-8">Configurações do Sistema</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Configuração da OpenAI</CardTitle>
              <CardDescription>
                Configure a chave da API da OpenAI para habilitar o chat de denúncias e análise de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="Chave da API da OpenAI"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    A chave será usada para o processamento do chat de denúncias e análise de IA
                  </p>
                </div>
                <Button onClick={handleSaveConfig} className="bg-green-700 hover:bg-green-800">
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MasterConfig;
