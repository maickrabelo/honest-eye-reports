
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
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const LoginCard = () => {
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Por favor, preencha todos os campos.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      
      toast({
        title: "Login bem-sucedido",
        description: "Você foi autenticado com sucesso.",
      });
      
      // Redirect based on user role
      const savedUser = localStorage.getItem('honest_eyes_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.role === 'company') {
          navigate('/dashboard');
        } else if (user.role === 'sst') {
          navigate('/sst-dashboard');
        } else if (user.role === 'master') {
          navigate('/master-dashboard');
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Credenciais inválidas. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
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
          <div className="text-sm text-muted-foreground">
            <p>Para testar diferentes perfis de acesso, use:</p>
            <ul className="list-disc list-inside mt-1">
              <li>company@example.com (acesso empresa)</li>
              <li>sst@example.com (acesso gestão SST)</li>
              <li>master@example.com (acesso master)</li>
              <li>Qualquer senha é aceita</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button 
            type="submit" 
            className="w-full bg-audit-primary hover:bg-audit-primary/90"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
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
