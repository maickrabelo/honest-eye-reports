import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { toast } from 'sonner';
import { Search, Users, Eye, RefreshCw, Key, Copy, User, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getSafeErrorMessage } from "@/lib/errorUtils";

interface ActiveAffiliate {
  id: string;
  nome_completo: string;
  email: string;
  phone: string | null;
  cpf: string;
  tipo_pessoa: string;
  cnpj: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  referral_code: string;
  approved_at: string | null;
  user_id: string | null;
  profissao: string;
  endereco_completo: string;
  estado_civil: string;
  rg: string;
  leadsCount: number;
  companiesCount: number;
}

interface AffiliateLead {
  id: string;
  name: string;
  phone: string;
  company_name: string;
  created_at: string;
}

export const ActiveAffiliatesManager: React.FC = () => {
  const [affiliates, setAffiliates] = useState<ActiveAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<ActiveAffiliate | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<AffiliateLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordAffiliate, setPasswordAffiliate] = useState<ActiveAffiliate | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { session, role, isLoading: authLoading } = useRealAuth();

  useEffect(() => {
    if (authLoading) return;
    if (session && role === 'admin') {
      fetchActiveAffiliates();
    }
  }, [authLoading, session, role]);

  const fetchActiveAffiliates = async () => {
    setLoading(true);
    try {
      const { data: affiliatesData, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      if (error) throw error;

      const affiliatesWithStats = await Promise.all(
        (affiliatesData || []).map(async (affiliate) => {
          const { data: leads } = await supabase
            .from('affiliate_leads')
            .select('id')
            .eq('affiliate_id', affiliate.id);

          const { data: companies } = await supabase
            .from('companies')
            .select('id')
            .eq('referred_by_affiliate_id', affiliate.id);

          return {
            id: affiliate.id,
            nome_completo: affiliate.nome_completo,
            email: affiliate.email,
            phone: affiliate.phone,
            cpf: affiliate.cpf,
            tipo_pessoa: affiliate.tipo_pessoa,
            cnpj: affiliate.cnpj,
            razao_social: affiliate.razao_social,
            nome_fantasia: affiliate.nome_fantasia,
            referral_code: affiliate.referral_code,
            approved_at: affiliate.approved_at,
            user_id: affiliate.user_id,
            profissao: affiliate.profissao,
            endereco_completo: affiliate.endereco_completo,
            estado_civil: affiliate.estado_civil,
            rg: affiliate.rg,
            leadsCount: leads?.length || 0,
            companiesCount: companies?.length || 0,
          };
        })
      );

      setAffiliates(affiliatesWithStats);
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = async (password: string) => {
    if (!passwordAffiliate) return;
    if (!password || password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-with-password', {
        body: {
          email: passwordAffiliate.email,
          password,
          full_name: passwordAffiliate.nome_completo,
          role: 'affiliate',
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setGeneratedPassword(password);
      toast.success(`Usuário criado com sucesso! Login: ${passwordAffiliate.email}`);
    } catch (error: any) {
      toast.error(getSafeErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAffiliate = async (affiliate: ActiveAffiliate) => {
    setSelectedAffiliate(affiliate);
    setLoadingLeads(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_leads')
        .select('id, name, phone, company_name, created_at')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSelectedLeads(data || []);
    } catch {
      setSelectedLeads([]);
    } finally {
      setLoadingLeads(false);
    }
  };

  const filteredAffiliates = affiliates.filter(a =>
    a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.cpf.includes(searchTerm) ||
    (a.cnpj && a.cnpj.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Afiliados Ativos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{affiliates.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{affiliates.reduce((s, a) => s + a.leadsCount, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Empresas Indicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{affiliates.reduce((s, a) => s + a.companiesCount, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Afiliados Ativos</CardTitle>
              <CardDescription>Lista de todos os afiliados aprovados</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar afiliado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={fetchActiveAffiliates}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAffiliates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum afiliado encontrado" : "Nenhum afiliado ativo"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-center">Leads</TableHead>
                  <TableHead className="text-center">Empresas</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates.map((affiliate) => (
                  <TableRow key={affiliate.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSelectAffiliate(affiliate)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{affiliate.nome_completo}</p>
                        <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {affiliate.tipo_pessoa === 'pj' ? 'PJ' : 'PF'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {affiliate.tipo_pessoa === 'pj' ? affiliate.cnpj : affiliate.cpf}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{affiliate.referral_code}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{affiliate.leadsCount}</TableCell>
                    <TableCell className="text-center font-medium">{affiliate.companiesCount}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleSelectAffiliate(affiliate); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPasswordAffiliate(affiliate);
                            setGeneratedPassword('');
                            setIsPasswordOpen(true);
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedAffiliate} onOpenChange={() => setSelectedAffiliate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Afiliado</DialogTitle>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">{selectedAffiliate.nome_completo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{selectedAffiliate.tipo_pessoa === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-mono">{selectedAffiliate.cpf}</p>
                </div>
                {selectedAffiliate.tipo_pessoa === 'pj' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">CNPJ</p>
                      <p className="font-mono">{selectedAffiliate.cnpj}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Razão Social</p>
                      <p>{selectedAffiliate.razao_social}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                      <p>{selectedAffiliate.nome_fantasia}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{selectedAffiliate.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p>{selectedAffiliate.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profissão</p>
                  <p>{selectedAffiliate.profissao}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado Civil</p>
                  <p className="capitalize">{selectedAffiliate.estado_civil}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p>{selectedAffiliate.endereco_completo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código de Indicação</p>
                  <Badge variant="outline" className="font-mono">{selectedAffiliate.referral_code}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aprovado em</p>
                  <p>{selectedAffiliate.approved_at
                    ? format(new Date(selectedAffiliate.approved_at), "dd/MM/yyyy", { locale: ptBR })
                    : '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold">{selectedAffiliate.leadsCount}</p>
                    <p className="text-sm text-muted-foreground">Leads</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold">{selectedAffiliate.companiesCount}</p>
                    <p className="text-sm text-muted-foreground">Empresas Indicadas</p>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAffiliate(null);
                    setPasswordAffiliate(selectedAffiliate);
                    setGeneratedPassword('');
                    setIsPasswordOpen(true);
                  }}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Gerar Senha
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Senha de Acesso</DialogTitle>
            <DialogDescription>
              Crie uma senha para o afiliado acessar o sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Afiliado</Label>
              <p className="text-sm font-medium">{passwordAffiliate?.nome_completo}</p>
            </div>
            <div className="space-y-2">
              <Label>Email (Login)</Label>
              <p className="text-sm font-medium">{passwordAffiliate?.email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-password">Senha</Label>
              <Input
                id="affiliate-password"
                type="text"
                placeholder="Digite a senha (mínimo 6 caracteres)"
                defaultValue={generatedPassword}
              />
            </div>
            {generatedPassword && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  <strong>✓ Usuário criado com sucesso!</strong><br />
                  Login: {passwordAffiliate?.email}<br />
                  Senha: {generatedPassword}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                const input = document.getElementById('affiliate-password') as HTMLInputElement;
                handleGeneratePassword(input.value);
              }}
              disabled={isGenerating}
            >
              {isGenerating ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
