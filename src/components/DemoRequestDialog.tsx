import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fbqTrack } from '@/lib/metaPixel';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
}

const DemoRequestDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  source = 'demo_form_sst',
  whatsappNumber = '5511999406560',
  whatsappMessage = 'Olá! Gostaria de agendar uma demonstração do SOIA.',
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company_name: '', employee_count: '', message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha nome, email e telefone.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('demo_leads').insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company_name: form.company_name || null,
        employee_count: form.employee_count || null,
        message: form.message || null,
        source,
      });
      if (error) throw error;

      fbqTrack('Lead', { content_name: 'Solicitar Demonstração' });

      toast({ title: 'Solicitação enviada!', description: 'Você será redirecionado para o WhatsApp.' });
      onOpenChange(false);
      setForm({ name: '', email: '', phone: '', company_name: '', employee_count: '', message: '' });

      window.open(
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`,
        '_blank'
      );
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Demonstração</DialogTitle>
          <DialogDescription>
            Preencha seus dados e te chamamos no WhatsApp para agendar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
            <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Empresa</Label>
            <Input id="company_name" name="company_name" value={form.company_name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee_count">Nº de colaboradores</Label>
            <Input id="employee_count" name="employee_count" value={form.employee_count} onChange={handleChange} placeholder="Ex: 50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (opcional)</Label>
            <Textarea id="message" name="message" value={form.message} onChange={handleChange} rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar e ir para o WhatsApp'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DemoRequestDialog;
