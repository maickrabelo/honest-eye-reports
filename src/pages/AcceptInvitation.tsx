import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "needs_login" | "wrong_email" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [invitedEmail, setInvitedEmail] = useState<string>("");
  const [accountInfo, setAccountInfo] = useState<{ type: string; name: string } | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token inválido.");
        return;
      }

      // Buscar dados públicos do convite (a sessão é necessária para RLS — usamos uma query simples)
      // Como RLS bloqueia leitura anônima, fazemos via accept-invitation que valida tudo
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Sem login: tentar buscar info básica via fetch direto (retornar info mínima)
        // Como não temos endpoint público, mostramos tela genérica
        setStatus("needs_login");
        return;
      }

      // Tem sessão: chamar accept-invitation
      try {
        const { data, error } = await supabase.functions.invoke("accept-invitation", {
          body: { invitation_token: token },
        });
        if (error) throw error;
        if ((data as any)?.error) {
          const msg = (data as any).error as string;
          if (msg.includes("convite é para")) {
            setInvitedEmail(msg.match(/para (.+?)\./)?.[1] || "");
            setStatus("wrong_email");
            setMessage(msg);
            return;
          }
          throw new Error(msg);
        }

        setStatus("success");
        toast({ title: "Convite aceito!", description: "Redirecionando..." });

        // Forçar refresh do auth context
        setTimeout(() => {
          if (data.account_type === "sst") {
            window.location.href = "/sst-dashboard";
          } else {
            window.location.href = "/dashboard";
          }
        }, 1500);
      } catch (e: any) {
        setStatus("error");
        setMessage(e.message || "Erro ao aceitar convite.");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <a href="/" className="mb-6">
        <img src="/lovable-uploads/Logo_SOIA.png" alt="SOIA" className="h-14 object-contain" />
      </a>
      <Card className="w-full max-w-md">
        {status === "loading" && (
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Processando convite...</p>
          </CardContent>
        )}

        {status === "needs_login" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Convite recebido</CardTitle>
              <CardDescription>
                Para aceitar o convite, faça login ou crie sua conta no SOIA usando o e-mail que recebeu o convite.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => navigate(`/auth?invitation=${token}`)}
              >
                Continuar
              </Button>
            </CardContent>
          </>
        )}

        {status === "wrong_email" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>E-mail incorreto</CardTitle>
              <CardDescription>{message}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate(`/auth?invitation=${token}`);
                }}
              >
                Sair e usar outro e-mail
              </Button>
            </CardContent>
          </>
        )}

        {status === "success" && (
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <h2 className="text-xl font-semibold">Convite aceito!</h2>
            <p className="text-muted-foreground">Redirecionando para o dashboard...</p>
          </CardContent>
        )}

        {status === "error" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Não foi possível aceitar</CardTitle>
              <CardDescription>{message}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
                Voltar ao início
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default AcceptInvitation;
