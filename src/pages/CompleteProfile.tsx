import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSmsPlan } from '@/hooks/useSmsPlan';
import srSmsLogo from '@/assets/sr-sms-logo.png.asset.json';

const formatCpfCnpj = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
};

const CompleteProfile: React.FC = () => {
  const { user, profile, role, isLoading, refreshRole } = useRealAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<{ kind: 'company' | 'sst'; id: string } | null>(null);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }
    if (!profile) return;
    const load = async () => {
      try {
        if (profile.sst_manager_id) {
          const { data } = await supabase
            .from('sst_managers')
            .select('cnpj, phone, address')
            .eq('id', profile.sst_manager_id)
            .maybeSingle();
          setTarget({ kind: 'sst', id: profile.sst_manager_id });
          setCpfCnpj(data?.cnpj ?? '');
          setPhone(data?.phone ?? '');
          setAddress(data?.address ?? '');
        } else if (profile.company_id) {
          const { data } = await supabase
            .from('companies')
            .select('cnpj, phone, address')
            .eq('id', profile.company_id)
            .maybeSingle();
          setTarget({ kind: 'company', id: profile.company_id });
          setCpfCnpj(data?.cnpj ?? '');
          setPhone(data?.phone ?? '');
          setAddress(data?.address ?? '');
        } else {
          // Nothing to complete — go to dashboard
          redirectToDashboard();
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, profile]);

  const redirectToDashboard = () => {
    if (role === 'admin') navigate('/master-dashboard');
    else if (role === 'sst') navigate('/sst-dashboard');
    else if (role === 'partner') navigate('/parceiro/dashboard');
    else if (role === 'affiliate') navigate('/afiliado/dashboard');
    else if ((role as string) === 'sales') navigate('/sales-dashboard');
    else navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;

    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
      toast({ title: 'CPF/CNPJ inválido', description: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.', variant: 'destructive' });
      return;
    }
    if (cleanPhone.length < 10) {
      toast({ title: 'Telefone inválido', description: 'Informe um telefone com DDD.', variant: 'destructive' });
      return;
    }
    if (address.trim().length < 5) {
      toast({ title: 'Endereço inválido', description: 'Informe um endereço completo.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const table = target.kind === 'company' ? 'companies' : 'sst_managers';
      const { error } = await supabase
        .from(table)
        .update({ cnpj: cleanCpfCnpj, phone: cleanPhone, address: address.trim() })
        .eq('id', target.id);
      if (error) throw error;

      toast({ title: 'Cadastro completo!', description: 'Suas informações foram salvas.' });
      await refreshRole();
      setTimeout(redirectToDashboard, 800);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Erro ao salvar',
        description: err?.message?.includes('companies_cnpj_key') || err?.message?.includes('sst_managers_cnpj_key')
          ? 'Este CPF/CNPJ já está cadastrado em outra conta.'
          : (err?.message ?? 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <a href="/" className="mb-6">
        <img src="/lovable-uploads/Logo_SOIA.png" alt="SOIA" className="h-14 object-contain" />
      </a>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete seu cadastro</CardTitle>
          <CardDescription>
            Para liberar todos os recursos, precisamos de algumas informações adicionais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
              <Input
                id="cpfCnpj"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço completo</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                rows={3}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar e continuar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
