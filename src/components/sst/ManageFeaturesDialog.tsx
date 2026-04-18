import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { Loader2, ShieldAlert, Brain, Flame, ClipboardList, GraduationCap } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company: { id: string; name: string } | null;
}

const FEATURES = [
  { key: 'ouvidoria_enabled', label: 'Canal de Ouvidoria', desc: 'Recebimento de denúncias', Icon: ShieldAlert },
  { key: 'psicossocial_enabled', label: 'Riscos Psicossociais', desc: 'HSE-IT e COPSOQ II', Icon: Brain },
  { key: 'burnout_enabled', label: 'Avaliação de Burnout', desc: 'Questionário MBI/LBQ', Icon: Flame },
  { key: 'clima_enabled', label: 'Pesquisas de Clima', desc: 'Clima organizacional', Icon: ClipboardList },
  { key: 'treinamentos_enabled', label: 'Treinamentos', desc: 'Módulos educativos', Icon: GraduationCap },
] as const;

type FeatureKey = typeof FEATURES[number]['key'];

const DEFAULTS: Record<FeatureKey, boolean> = {
  ouvidoria_enabled: true,
  psicossocial_enabled: true,
  burnout_enabled: true,
  clima_enabled: true,
  treinamentos_enabled: true,
};

export default function ManageFeaturesDialog({ open, onOpenChange, company }: Props) {
  const { user } = useRealAuth();
  const { toast } = useToast();
  const [values, setValues] = useState<Record<FeatureKey, boolean>>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !company) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('company_feature_access')
        .select('*')
        .eq('company_id', company.id)
        .maybeSingle();
      if (data) {
        setValues({
          ouvidoria_enabled: data.ouvidoria_enabled,
          psicossocial_enabled: data.psicossocial_enabled,
          burnout_enabled: data.burnout_enabled,
          clima_enabled: data.clima_enabled,
          treinamentos_enabled: data.treinamentos_enabled,
        });
      } else {
        setValues(DEFAULTS);
      }
      setLoading(false);
    })();
  }, [open, company]);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    const { error } = await supabase
      .from('company_feature_access')
      .upsert({
        company_id: company.id,
        ...values,
        updated_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id' });
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Ferramentas atualizadas', description: `Configurações salvas para ${company.name}.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ferramentas disponíveis</DialogTitle>
          <DialogDescription>
            Habilite ou desabilite os módulos para <strong>{company?.name}</strong>. As mudanças refletem no painel da empresa.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-3 py-2">
            {FEATURES.map(({ key, label, desc, Icon }) => (
              <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <Switch
                  checked={values[key]}
                  onCheckedChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
                />
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
