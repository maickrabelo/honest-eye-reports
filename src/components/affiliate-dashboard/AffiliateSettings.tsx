import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, Save, Loader2 } from 'lucide-react';

interface AffiliateSettingsProps {
  affiliateId: string;
}

export const AffiliateSettings = ({ affiliateId }: AffiliateSettingsProps) => {
  const [redirectUrl, setRedirectUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('affiliates')
        .select('redirect_url')
        .eq('id', affiliateId)
        .single();
      if (data?.redirect_url) setRedirectUrl(data.redirect_url);
      setLoading(false);
    };
    fetch();
  }, [affiliateId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ redirect_url: redirectUrl || null })
        .eq('id', affiliateId);
      if (error) throw error;
      toast.success('URL de redirecionamento salva!');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="redirect_url">URL de redirecionamento após captura do lead</Label>
          <Input
            id="redirect_url"
            placeholder="https://seu-site.com/obrigado"
            value={redirectUrl}
            onChange={e => setRedirectUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Após o lead preencher o formulário, será aberta uma nova aba com esta URL. 
            Se não configurado, será direcionado para o WhatsApp.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </CardContent>
    </Card>
  );
};
