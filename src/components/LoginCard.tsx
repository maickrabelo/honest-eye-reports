
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const LoginCard = () => {
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulação de autenticação (seria substituída por um sistema real)
    if (email && password) {
      toast({
        title: "Login bem-sucedido",
        description: "Você foi autenticado com sucesso.",
      });
      
      // Redirecionamento (seria implementado com sistema de autenticação real)
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Por favor, preencha todos os campos.",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto card-hover animate-fade-in">
      <CardHeader>
        <CardTitle className="text-audit-primary">Login</CardTitle>
        <CardDescription>
          Acesse sua conta para gerenciar denúncias e relatórios.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <a 
                href="#" 
                className="text-sm text-audit-secondary hover:underline"
              >
                Esqueceu a senha?
              </a>
            </div>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button type="submit" className="w-full bg-audit-primary hover:bg-audit-primary/90">
            Entrar
          </Button>
          <p className="text-sm text-center mt-4">
            Não tem uma conta?{" "}
            <a href="#" className="text-audit-secondary font-medium hover:underline">
              Fale com seu administrador
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginCard;
