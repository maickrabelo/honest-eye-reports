import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import usePageSEO from '@/hooks/usePageSEO';
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z.string().trim().min(10, 'Telefone inválido').max(20),
  company_name: z.string().trim().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').max(200),
});

interface AffiliateData {
  id: string;
  nome_completo: string;
  referral_code: string;
  redirect_url: string | null;
  status: string;
}

const AffiliateLanding = () => {
  const { referralCode } = useParams<{ referralCode: string }>();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', company_name: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  usePageSEO({
    title: 'Sistema NR-01 | Levantamento de Riscos Psicossociais | SOIA',
    description: 'Sistema completo para NR-01 e levantamento de riscos psicossociais no trabalho.',
  });

  useEffect(() => {
    const fetchAffiliate = async () => {
      if (!referralCode) return;
      try {
        const { data, error } = await supabase
          .from('affiliates')
          .select('id, nome_completo, referral_code, redirect_url, status')
          .eq('referral_code', referralCode)
          .eq('status', 'approved')
          .single();

        if (error || !data) {
          console.error('Affiliate not found:', error);
          setAffiliate(null);
        } else {
          setAffiliate(data as AffiliateData);
        }
      } catch (err) {
        console.error('Error fetching affiliate:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAffiliate();
  }, [referralCode]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = leadSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!affiliate) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('affiliate_leads').insert({
        affiliate_id: affiliate.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        company_name: form.company_name.trim(),
        referral_code: affiliate.referral_code,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Dados enviados com sucesso!');

      const redirectUrl = affiliate.redirect_url || 
        'https://wa.me/5534997359222';
      
      setTimeout(() => {
        window.open(redirectUrl, '_blank');
      }, 1000);
    } catch (err) {
      console.error('Error submitting lead:', err);
      toast.error('Erro ao enviar dados. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Link inválido ou expirado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />

        {/* Lead Capture Form */}
        <section id="lead-form" className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-2xl mx-auto px-4">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                  {submitted ? 'Obrigado pelo interesse!' : 'Solicite uma apresentação gratuita'}
                </CardTitle>
                {!submitted && (
                  <p className="text-muted-foreground mt-2">
                    Preencha seus dados e entraremos em contato rapidamente.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <CheckCircle className="h-16 w-16 text-primary" />
                    <p className="text-center text-muted-foreground">
                      Seus dados foram enviados com sucesso. Você será redirecionado em instantes...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
                        className={errors.phone ? 'border-destructive' : ''}
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_name">Nome da empresa *</Label>
                      <Input
                        id="company_name"
                        placeholder="Nome da sua empresa"
                        value={form.company_name}
                        onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                        className={errors.company_name ? 'border-destructive' : ''}
                      />
                      {errors.company_name && <p className="text-sm text-destructive">{errors.company_name}</p>}
                    </div>

                    <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Enviar
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <FeaturesSection />
        <BenefitsSection />
        <HowItWorksSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default AffiliateLanding;
