import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Mail, ArrowRight, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fbqTrack } from '@/lib/metaPixel';

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_MS = 5 * 60 * 1000;

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const subId = params.get('sub') || params.get('session_id');
  const [status, setStatus] = useState<'pending' | 'active' | 'failed'>('pending');
  const [info, setInfo] = useState<{ email?: string; planName?: string; invoiceUrl?: string }>({});

  useEffect(() => {
    if (!subId) return;
    const start = Date.now();
    let timer: number | undefined;

    const poll = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('asaas-check-payment', {
          body: null,
          method: 'GET' as any,
          // workaround: pass via query string
          ...({} as any),
        });
        // Use direct fetch as invoke has GET issues
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-check-payment?subscriptionId=${subId}`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });
        const json = await res.json();

        if (json.email || json.planName || json.invoiceUrl) {
          setInfo({ email: json.email, planName: json.planName, invoiceUrl: json.invoiceUrl });
        }
        if (json.status === 'active') {
          setStatus((prev) => {
            if (prev !== 'active') {
              fbqTrack('Purchase', {
                currency: 'BRL',
                value: typeof json.value === 'number' ? json.value : 0,
                content_name: json.planName,
                content_type: 'subscription',
              }, {
                email: json.email,
                country: 'br',
              });
            }
            return 'active';
          });
          return;
        }
        if (Date.now() - start > POLL_MAX_MS) {
          // keep pending; user can return later
          return;
        }
        timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch (e) {
        console.error('Polling error', e);
        timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [subId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="flex justify-center">
            {status === 'active' ? (
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <Clock className="w-12 h-12 text-muted-foreground animate-pulse" />
              </div>
            )}
          </div>

          {status === 'active' ? (
            <>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Pagamento Confirmado!</h1>
                <p className="text-muted-foreground">
                  Seu plano {info.planName ?? ''} está ativo.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <Mail className="w-6 h-6 text-primary" />
                  <p className="font-medium">Verifique seu email</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enviamos suas credenciais para <strong>{info.email}</strong>. No primeiro
                  acesso será solicitada a troca de senha.
                </p>
              </div>

              <Button size="lg" onClick={() => navigate('/auth')} className="w-full">
                Acessar a plataforma
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Aguardando confirmação</h1>
                <p className="text-muted-foreground text-sm">
                  Pagamentos via PIX ou boleto podem levar alguns minutos para confirmar.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando status...
              </div>

              {info.invoiceUrl && (
                <Button variant="outline" onClick={() => window.open(info.invoiceUrl, '_blank')} className="w-full">
                  Reabrir página de pagamento
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                Pode fechar esta página — assim que o pagamento for confirmado, enviaremos as
                credenciais para seu email.
              </p>
            </>
          )}

          <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
            Voltar ao início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;
