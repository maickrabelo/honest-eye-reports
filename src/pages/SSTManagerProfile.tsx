import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { Upload, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TeamManagementCard from '@/components/collaborators/TeamManagementCard';
import { Link } from 'react-router-dom';

interface SSTManagerData {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  slug: string | null;
}

const SSTManagerProfile = () => {
  const { profile, refreshRole } = useRealAuth();
  const { toast } = useToast();
  const [sst, setSst] = useState<SSTManagerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  const sstManagerId = profile?.sst_manager_id || null;

  const load = async () => {
    if (!sstManagerId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('sst_managers')
      .select('id, name, cnpj, email, phone, address, logo_url, slug')
      .eq('id', sstManagerId)
      .maybeSingle();
    if (!error && data) {
      setSst(data as SSTManagerData);
      setForm({ name: data.name || '', phone: data.phone || '', address: data.address || '' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [sstManagerId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sst) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('sst_managers')
        .update({ name: form.name, phone: form.phone, address: form.address })
        .eq('id', sst.id);
      if (error) throw error;
      toast({ title: 'Cadastro atualizado', description: 'Os dados foram salvos.' });
      await load();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sst) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo grande', description: 'Logo deve ter até 2MB.', variant: 'destructive' });
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `sst/${sst.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('company-logos').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('company-logos').getPublicUrl(path);
      const { error: updErr } = await supabase
        .from('sst_managers').update({ logo_url: pub.publicUrl }).eq('id', sst.id);
      if (updErr) throw updErr;
      toast({ title: 'Logo atualizada' });
      await load();
      await refreshRole();
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!sst) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground">Gestora SST não encontrada.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-muted/30 py-8">
        <div className="container mx-auto max-w-5xl px-4">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link to="/sst-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-primary mb-2">Perfil da Gestora SST</h1>
          <p className="text-muted-foreground mb-8">
            Atualize a logo e os dados da sua gestora — usados no white label e nos relatórios.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Logo da gestora</CardTitle>
                <CardDescription>Usada em relatórios e páginas white label</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="bg-muted w-full aspect-square rounded-md flex items-center justify-center overflow-hidden border">
                  {sst.logo_url ? (
                    <img src={sst.logo_url} alt="Logo" className="max-w-full max-h-full object-contain p-3" />
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center">
                      <Upload size={48} />
                      <span className="mt-2 text-sm">Sem logo</span>
                    </div>
                  )}
                </div>
                <Label htmlFor="logo" className="w-full cursor-pointer">
                  <div className="flex items-center justify-center py-2 px-4 border-2 border-dashed border-border rounded-md hover:border-primary transition-colors">
                    {uploadingLogo ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                    ) : (
                      <><Upload className="mr-2 h-4 w-4" /> {sst.logo_url ? 'Alterar logo' : 'Adicionar logo'}</>
                    )}
                  </div>
                  <input id="logo" type="file" accept="image/*" className="hidden"
                    onChange={handleLogoUpload} disabled={uploadingLogo} />
                </Label>
                <p className="text-xs text-muted-foreground text-center">
                  PNG/JPG até 2MB. Recomendado fundo transparente.
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Informações da gestora</CardTitle>
                <CardDescription>Dados exibidos em relatórios e comunicações</CardDescription>
              </CardHeader>
              <form onSubmit={handleSave}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da gestora *</Label>
                    <Input id="name" value={form.name}
                      onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input value={sst.cnpj || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={sst.email || ''} disabled />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={form.phone}
                      onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço completo</Label>
                    <Textarea id="address" value={form.address}
                      onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Rua, número, bairro, cidade/UF, CEP" rows={3} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar alterações'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="mt-6">
            <TeamManagementCard
              accountType="sst"
              accountId={sst.id}
              accountName={sst.name}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SSTManagerProfile;
