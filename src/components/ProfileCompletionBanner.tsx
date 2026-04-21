import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  companyId: string | null;
}

/**
 * Banner shown on the company dashboard when key profile fields are missing
 * (logo, phone or address). The whistleblowing page uses these to brand
 * the public report channel.
 */
const ProfileCompletionBanner: React.FC<Props> = ({ companyId }) => {
  const [missing, setMissing] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('companies')
        .select('logo_url, phone, address, name')
        .eq('id', companyId)
        .maybeSingle();
      if (!active || !data) return;
      const m: string[] = [];
      if (!data.logo_url) m.push('logo');
      if (!data.phone) m.push('telefone');
      if (!data.address) m.push('endereço');
      if (!data.name) m.push('nome');
      setMissing(m);
    })();
    return () => { active = false; };
  }, [companyId]);

  if (dismissed || missing.length === 0) return null;

  return (
    <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <AlertCircle className="h-4 w-4 !text-amber-600" />
      <AlertTitle>Complete o cadastro da sua empresa</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Faltam: <strong>{missing.join(', ')}</strong>. A logo e os dados aparecem na página pública do canal de denúncias.
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            Agora não
          </Button>
          <Button size="sm" asChild>
            <Link to="/profile">Completar cadastro</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ProfileCompletionBanner;
