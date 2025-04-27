
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const OpenAIConfig = () => {
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma chave de API válida.",
        variant: "destructive",
      });
      return;
    }

    // Store API key in localStorage for now
    localStorage.setItem('openai_api_key', apiKey);
    
    toast({
      title: "Configuração salva",
      description: "A chave de API foi salva com sucesso.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container max-w-3xl">
          <h1 className="text-3xl font-bold text-green-800 mb-8">Configuração da OpenAI</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>API da OpenAI</CardTitle>
              <CardDescription>
                Configure a chave de API da OpenAI para habilitar os recursos de IA nas denúncias
                e na análise de dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
                  Chave de API
                </label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="mt-2 text-sm text-gray-500">
                  A chave de API será usada para o chat de denúncias e para a análise de IA.
                </p>
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configuração
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OpenAIConfig;
