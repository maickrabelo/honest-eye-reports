import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
}

export function ReportChat({ companyId = "" }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const { toast } = useToast();

  const initialMessage = "Olá, sou Ana, psicóloga e assistente virtual da ouvidoria. Estou aqui para ouvir sua denúncia de forma confidencial. Pode me contar o que aconteceu com detalhes. Em que posso ajudar?";

  const botResponse = useCallback(async (userMessage: string) => {
    // Simulate a bot response (replace with actual AI logic)
    await new Promise(resolve => setTimeout(resolve, 500));
    return `Obrigado pela sua mensagem: "${userMessage}". Sua denúncia foi registrada e será analisada.`;
  }, []);

  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const newMessage: ChatMessage = { text: inputText, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputText('');

    try {
      const responseText = await botResponse(inputText);
      const botMessage: ChatMessage = { text: responseText, sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);

      toast({
        title: "Denúncia enviada",
        description: "Sua denúncia foi enviada com sucesso e será analisada.",
      });
    } catch (error) {
      console.error("Erro ao obter resposta do bot:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao processar sua denúncia. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    // Simulate initial bot message
    const initialBotMessage: ChatMessage = { text: initialMessage, sender: 'bot' };
    setMessages([initialBotMessage]);
  }, [initialMessage]);

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          {messages.map((message, index) => (
            <div key={index} className={`text-sm rounded-md p-3 ${message.sender === 'user' ? 'bg-green-100 text-green-800 ml-auto w-fit' : 'bg-gray-100 text-gray-800 mr-auto w-fit'}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Digite sua mensagem..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage}><Send className="h-4 w-4 mr-2" /> Enviar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
