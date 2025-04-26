
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, CheckCheck, Loader2, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

// Mensagens iniciais do chatbot
const initialMessages = [
  {
    role: "system",
    content: "Olá, sou Ana, psicóloga e assistente virtual da ouvidoria. Estou aqui para ouvir sua denúncia de forma confidencial. Pode me contar o que aconteceu com detalhes. Em que posso ajudar?",
  },
];

const ReportChat = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [summary, setSummary] = useState("");
  const [reportId, setReportId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Gera um ID de relatório aleatório
  useEffect(() => {
    const generateReportId = () => {
      const prefix = "REP";
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${prefix}-${year}-${randomNum}`;
    };
    
    setReportId(generateReportId());
  }, []);

  // Auto-scroll quando novas mensagens são adicionadas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Simula o envio da mensagem para a API da OpenAI
  const handleSendMessage = async () => {
    if (input.trim() === "") return;
    
    const userMessage = {
      role: "user",
      content: input,
    };
    
    setMessages([...messages, userMessage]);
    setInput("");
    setIsLoading(true);

    // Em um ambiente real, aqui você enviaria a mensagem para a API da OpenAI
    // Simulando resposta da IA
    setTimeout(() => {
      let aiResponse;
      
      // Simulação de resposta baseada no número de mensagens trocadas
      if (messages.length < 3) {
        aiResponse = {
          role: "assistant",
          content: "Obrigada por compartilhar isso. Pode me dar mais detalhes sobre quando e onde isso aconteceu?",
        };
      } else if (messages.length < 5) {
        aiResponse = {
          role: "assistant",
          content: "Compreendo sua situação. Havia outras pessoas presentes quando isso ocorreu? Como você se sentiu?",
        };
      } else {
        aiResponse = {
          role: "assistant",
          content: "Agradeço por confiar em nós para relatar essa situação. Gostaria de compartilhar mais algum detalhe ou podemos finalizar o relatório da denúncia?",
        };
      }
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
      
      // Se já tiver muitas mensagens, oferece finalizar
      if (messages.length > 6 && !isComplete) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: "system",
            content: "Para finalizar a denúncia e gerar o relatório, clique no botão 'Finalizar Denúncia' abaixo."
          }]);
        }, 1000);
      }
    }, 1500);
  };

  // Finaliza a denúncia e gera o resumo
  const handleFinishReport = () => {
    setIsLoading(true);
    
    // Simulando processamento da IA para gerar resumo
    setTimeout(() => {
      const userMessages = messages
        .filter(msg => msg.role === "user")
        .map(msg => msg.content)
        .join(" ");
      
      // Em um ambiente real, enviaria todo o histórico para a API da OpenAI gerar um resumo
      const generatedSummary = `Denúncia sobre situação de desconforto no ambiente de trabalho. 
      O denunciante relatou problemas de conduta inadequada por parte de superiores, 
      incluindo possíveis casos de assédio moral. Incidente ocorreu principalmente no setor comercial 
      durante reuniões de equipe. Necessita investigação imediata.`;
      
      setSummary(generatedSummary);
      setIsComplete(true);
      setIsLoading(false);
      
      toast({
        title: "Denúncia registrada com sucesso!",
        description: `Seu código de acompanhamento: ${reportId}`,
      });
    }, 2000);
  };

  // Salva a denúncia no banco de dados e retorna à página inicial
  const handleSaveReport = () => {
    setIsLoading(true);
    
    // Em um ambiente real, aqui você enviaria os dados para seu banco de dados
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Denúncia enviada com sucesso!",
        description: "Você receberá atualizações sobre o andamento.",
      });
      
      // Redirecionamento para a página inicial após alguns segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }, 1500);
  };

  // Renderiza as mensagens do chat
  const renderMessages = () => {
    return messages.map((message, index) => {
      if (message.role === "system") {
        return (
          <div key={index} className="bg-muted/50 p-4 rounded-md mb-4 text-center">
            <p className="text-sm">{message.content}</p>
          </div>
        );
      }
      
      const isUser = message.role === "user";
      return (
        <div 
          key={index} 
          className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
        >
          <div 
            className={`max-w-[80%] rounded-lg p-3 ${
              isUser 
                ? 'bg-audit-primary text-white rounded-br-none' 
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}
          >
            <p className="text-sm">{message.content}</p>
            {isUser && (
              <div className="flex justify-end mt-1">
                <CheckCheck size={16} className="text-white/70" />
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-audit-primary mb-2">Nova Denúncia</h1>
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-lg px-4 py-1 border-2 border-audit-secondary">
                ID: {reportId}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Guarde este ID para acompanhar sua denúncia posteriormente.
            </p>
          </div>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Chat da Ouvidoria</span>
                {isComplete && <Badge variant="success">Finalizado</Badge>}
              </CardTitle>
              <CardDescription>
                Converse com nossa assistente virtual para registrar sua denúncia.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="h-[400px] overflow-y-auto mb-4 p-2">
                {renderMessages()}
                {isLoading && (
                  <div className="flex justify-center my-2">
                    <Loader2 className="h-5 w-5 animate-spin text-audit-primary" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {isComplete ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium text-lg mb-2">Resumo da Denúncia</h3>
                  <p className="text-gray-700">{summary}</p>
                  <div className="mt-4 flex items-center">
                    <span className="text-sm font-medium mr-2">Status:</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Registrada
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isLoading || isComplete}
                    className="flex-grow"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isLoading || isComplete || !input.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between border-t pt-4">
              {!isComplete ? (
                <div className="w-full flex justify-end">
                  <Button 
                    onClick={handleFinishReport}
                    disabled={isLoading || messages.length < 5}
                    variant={messages.length < 5 ? "outline" : "default"}
                    className="ml-auto"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Finalizar Denúncia
                  </Button>
                </div>
              ) : (
                <div className="w-full flex justify-end">
                  <Button 
                    onClick={handleSaveReport}
                    disabled={isLoading}
                    className="bg-audit-primary hover:bg-audit-primary/90"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Confirmar e Enviar
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportChat;
