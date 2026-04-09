import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, KeyRound, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    cnpj?: string | null;
    email?: string | null;
  } | null;
}

interface ResetResult {
  email: string;
  tempPassword: string;
  relatedCompanies: { name: string; cnpj: string | null }[];
}

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  open,
  onOpenChange,
  company,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setResult(null);
      setCopiedField(null);
    }
  }, [open]);

  const generateTempPassword = (companyName: string) => {
    const clean = companyName.replace(/[^a-zA-Z]/g, '').substring(0, 8);
    const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    return `${capitalized}2026!`;
  };

  const handleReset = async () => {
    if (!company) return;

    setIsLoading(true);
    try {
      // Find the user linked to this company
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, company_id')
        .eq('company_id', company.id);

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        toast({ title: "Nenhum usuário encontrado", description: "Não há usuário vinculado a esta empresa.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const userId = profiles[0].id;

      // Get user email from user_companies or find via all companies linked
      // First get all companies this user has access to
      const { data: userCompanies } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', userId);

      const companyIds = userCompanies?.map(uc => uc.company_id) || [company.id];
      if (!companyIds.includes(company.id)) {
        companyIds.push(company.id);
      }

      // Get all related companies with CNPJs
      const { data: relatedCompanies } = await supabase
        .from('companies')
        .select('name, cnpj')
        .in('id', companyIds);

      // We need the email - call list-users edge function
      const { data: listData, error: listError } = await supabase.functions.invoke('list-users', {
        body: {},
      });

      if (listError) throw listError;

      const userInfo = listData?.users?.find((u: any) => u.id === userId);
      if (!userInfo?.email) {
        toast({ title: "Email não encontrado", description: "Não foi possível localizar o email deste usuário.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const email = userInfo.email;
      const tempPassword = generateTempPassword(company.name);

      // Reset password via edge function
      const { data: resetData, error: resetError } = await supabase.functions.invoke('create-user-with-password', {
        body: {
          email,
          password: tempPassword,
          full_name: userInfo.user_metadata?.full_name || profiles[0].full_name || company.name,
          role: 'company',
          company_id: company.id,
        },
      });

      if (resetError) throw resetError;
      if (!resetData?.success) throw new Error(resetData?.error || 'Erro ao resetar senha');

      setResult({
        email,
        tempPassword,
        relatedCompanies: relatedCompanies || [{ name: company.name, cnpj: company.cnpj || null }],
      });

      toast({ title: "Senha resetada!", description: "A senha temporária foi gerada com sucesso." });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({ title: "Erro ao resetar senha", description: error.message || 'Tente novamente.', variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Resetar Senha
          </DialogTitle>
          <DialogDescription>
            {result
              ? 'Senha temporária gerada. Compartilhe as credenciais abaixo com o cliente.'
              : `Resetar a senha de acesso da empresa ${company?.name}?`}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              <p>Uma nova senha temporária será gerada. O usuário deverá alterá-la no primeiro acesso.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleReset} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetando...
                  </>
                ) : (
                  'Confirmar Reset'
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email de acesso</label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm font-mono flex-1 truncate">{result.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={() => copyToClipboard(result.email, 'email')}
                >
                  {copiedField === 'email' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Senha temporária</label>
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <span className="text-sm font-mono font-bold flex-1">{result.tempPassword}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={() => copyToClipboard(result.tempPassword, 'password')}
                >
                  {copiedField === 'password' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Related CNPJs */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                CNPJs vinculados a este email ({result.relatedCompanies.length})
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {result.relatedCompanies.map((rc, idx) => (
                  <div key={idx} className="p-2.5 bg-muted rounded-lg text-sm">
                    <p className="font-medium text-foreground truncate">{rc.name}</p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {rc.cnpj || 'CNPJ não cadastrado'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  const text = `Email: ${result.email}\nSenha: ${result.tempPassword}\n\nEmpresas:\n${result.relatedCompanies.map(rc => `- ${rc.name} (${rc.cnpj || 'sem CNPJ'})`).join('\n')}`;
                  copyToClipboard(text, 'all');
                }}
                className="gap-2"
              >
                {copiedField === 'all' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                Copiar tudo
              </Button>
              <Button onClick={() => onOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
