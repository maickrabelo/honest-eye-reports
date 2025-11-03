
import React, { useState, useEffect, useRef } from 'react';
import TrackReportModal from '@/components/TrackReportModal';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCheck, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface ReportChatProps {
  companyId?: string;
}

const initialMessages = [
  {
    role: "system",
    content: "Olá, sou Ana, assistente virtual da ouvidoria. Estou aqui para ouvir sua denúncia de forma confidencial. Pode me contar o que aconteceu com detalhes. Em que posso ajudar?",
  },
];

export const ReportChat: React.FC<ReportChatProps> = ({ companyId }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [summary, setSummary] = useState("");
  const [reportId, setReportId] = useState("");
  const [showIdDialog, setShowIdDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const generateReportId = () => {
      const prefix = "REP";
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${prefix}-${year}-${randomNum}`;
    };
    
    setReportId(generateReportId());
  }, []);

  // Removed automatic scrolling - user can scroll manually if needed

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatReportId = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    if (cleanNum.length <= 3) {
      return `REP-${new Date().getFullYear()}-${cleanNum.padStart(3, '0')}`;
    }
    const year = cleanNum.slice(0, 4);
    const seq = cleanNum.slice(4, 7);
    return `REP-${year}-${seq}`;
  };

  const handleSendMessage = async () => {
    if (input.trim() === "") return;
    
    const userMessage = {
      role: "user",
      content: input,
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      console.log("Sending message to AI...");
      
      const { data, error } = await supabase.functions.invoke('chat-report', {
        body: { 
          messages: updatedMessages.filter(m => m.role !== "system" || m.content.includes("Ana"))
        }
      });

      if (error) {
        console.error("Error calling chat function:", error);
        throw error;
      }

      if (!data || !data.choices || !data.choices[0]) {
        throw new Error("Resposta inválida da IA");
      }

      // Remove markdown formatting characters from AI response
      const cleanContent = data.choices[0].message.content
        .replace(/\*\*/g, '')  // Remove bold markers
        .replace(/\*/g, '')    // Remove italic markers
        .replace(/#{1,6}\s/g, '') // Remove heading markers
        .replace(/`/g, '');    // Remove code markers

      const aiResponse = {
        role: "assistant" as const,
        content: cleanContent,
      };
      
      console.log("AI response received:", aiResponse.content);
      setMessages(prev => [...prev, aiResponse]);
      
      // Show finish button hint after several exchanges
      if (updatedMessages.filter(m => m.role === "user").length >= 3 && !isComplete) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: "system",
            content: "Para finalizar a denúncia e gerar o relatório, clique no botão 'Finalizar Denúncia' abaixo."
          }]);
        }, 1000);
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível processar sua mensagem. Por favor, tente novamente.",
        variant: "destructive",
      });
      
      // Remove the user message if there was an error
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishReport = async () => {
    setIsLoading(true);
    
    try {
      console.log("Generating report summary...");
      
      // Extract only the conversation between user and assistant
      const conversationText = messages
        .filter(m => m.role !== "system")
        .map(m => `${m.role === "user" ? "Denunciante" : "Ouvidoria"}: ${m.content}`)
        .join("\n\n");
      
      console.log("Conversation text:", conversationText);
      
      // Send to AI with a specific system prompt for summarization
      const { data, error } = await supabase.functions.invoke('chat-report', {
        body: { 
          messages: [
            {
              role: "system",
              content: `Você é um analista de ouvidoria especializado em criar resumos executivos de denúncias.
              Sua tarefa é analisar a conversa completa e criar um resumo profissional e imparcial.
              
              O resumo deve conter:
              1. Natureza da denúncia (tipo de incidente)
              2. Quando e onde ocorreu
              3. Pessoas envolvidas (sem nomes, use "denunciante", "superior", "colega", etc)
              4. Gravidade e impacto
              
              Use linguagem formal, objetiva e imparcial. Máximo de 4-5 frases.`
            },
            {
              role: "user",
              content: `Analise esta conversa de denúncia e crie um resumo executivo:\n\n${conversationText}`
            }
          ]
        }
      });

      if (error) {
        console.error("Error generating summary:", error);
        throw error;
      }

      if (!data || !data.choices || !data.choices[0]) {
        throw new Error("Resposta inválida ao gerar resumo");
      }

      // Remove markdown formatting from summary
      const cleanSummary = data.choices[0].message.content
        .replace(/\*\*/g, '')  // Remove bold markers
        .replace(/\*/g, '')    // Remove italic markers
        .replace(/#{1,6}\s/g, '') // Remove heading markers
        .replace(/`/g, '');    // Remove code markers

      console.log("Summary generated:", cleanSummary);
      
      setSummary(cleanSummary);
      setIsComplete(true);
      setShowIdDialog(true);
    } catch (error) {
      console.error("Error in handleFinishReport:", error);
      toast({
        title: "Erro ao gerar resumo",
        description: "Não foi possível gerar o resumo. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!companyId) {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Extract conversation for description
      const conversationText = messages
        .filter(m => m.role !== "system")
        .map(m => `${m.role === "user" ? "Denunciante" : "Ouvidoria"}: ${m.content}`)
        .join("\n\n");

      const { data, error } = await supabase
        .from('reports')
        .insert({
          company_id: companyId,
          title: summary.substring(0, 100) || "Denúncia via chat",
          description: conversationText,
          category: "Outros",
          is_anonymous: true,
          status: "pending",
          urgency: "medium",
          tracking_code: reportId
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving report:', error);
        throw error;
      }

      console.log('Report saved:', data);
      
      toast({
        title: "Denúncia enviada com sucesso!",
        description: "Você receberá atualizações sobre o andamento.",
      });
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error in handleSaveReport:', error);
      toast({
        title: "Erro ao salvar denúncia",
        description: "Não foi possível salvar a denúncia. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    <>
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-1 border-2 border-audit-secondary">
            ID: {reportId}
          </Badge>
          <TrackReportModal />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Guarde este ID para acompanhar sua denúncia posteriormente.
        </p>
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Chat da Ouvidoria</span>
            {isComplete && <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Finalizado</Badge>}
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
      
      {/* Dialog to show report ID */}
      <Dialog open={showIdDialog} onOpenChange={setShowIdDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Denúncia Registrada</DialogTitle>
            <DialogDescription>
              Guarde o código de acompanhamento para consultar o status de sua denúncia no futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 p-4">
            <div className="bg-gray-50 w-full p-6 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Código de Acompanhamento:</p>
              <p className="text-2xl font-bold text-audit-primary">{reportId}</p>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Anote este código em um local seguro. Você precisará dele para acompanhar o status da denúncia.
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button 
              variant="outline" 
              onClick={() => {
                navigator.clipboard.writeText(reportId);
                toast({
                  title: "Código copiado",
                  description: "O código de acompanhamento foi copiado para a área de transferência."
                });
              }}
              className="mr-2"
            >
              Copiar código
            </Button>
            <Button onClick={() => {
              setShowIdDialog(false);
              setShowTrackingDialog(true);
            }}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
