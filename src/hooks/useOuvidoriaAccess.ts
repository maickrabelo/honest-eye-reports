import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';

export type OuvidoriaAccessType = 'gestor' | 'auditor';

export interface OuvidoriaAccess {
  loading: boolean;
  /** Pode editar denúncias, criar tarefas, notas internas, enviar campanhas */
  canEdit: boolean;
  /** Tipo de acesso do usuário atual (null = acesso nativo da conta) */
  accessType: OuvidoriaAccessType | null;
  /** Nome exibido nas atualizações internas */
  authorName: string;
  authorRoleTitle: string | null;
}

/**
 * Permissões da Ouvidoria (Smart e IA).
 * Usuários convidados como "auditor" só visualizam.
 */
export const useOuvidoriaAccess = (companyId?: string | null): OuvidoriaAccess => {
  const { profile, user, role } = useRealAuth();
  const [state, setState] = useState<OuvidoriaAccess>({
    loading: true,
    canEdit: true,
    accessType: null,
    authorName: '',
    authorRoleTitle: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const fallbackName =
        (profile as any)?.full_name || (user as any)?.email || 'Equipe da ouvidoria';

      if (!companyId || !user?.id) {
        if (active) {
          setState({
            loading: false,
            canEdit: true,
            accessType: null,
            authorName: fallbackName,
            authorRoleTitle: null,
          });
        }
        return;
      }

      let { data } = await supabase
        .from('ouvidoria_users')
        .select('access_type, full_name, job_title, status')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      // Vincula convites pendentes ao usuário recém-criado
      if (!data && (user as any)?.email) {
        const email = String((user as any).email).toLowerCase();
        const { data: linked } = await supabase
          .from('ouvidoria_users')
          .update({ user_id: user.id, status: 'active' })
          .eq('company_id', companyId)
          .eq('email', email)
          .is('user_id', null)
          .select('access_type, full_name, job_title, status')
          .maybeSingle();
        if (linked) data = linked;
      }


      if (!active) return;

      const accessType = (data?.access_type as OuvidoriaAccessType | undefined) ?? null;
      setState({
        loading: false,
        canEdit: role === 'admin' ? true : accessType !== 'auditor',
        accessType,
        authorName: data?.full_name || fallbackName,
        authorRoleTitle: data?.job_title ?? null,
      });
    })();
    return () => {
      active = false;
    };
  }, [companyId, user?.id, profile, role]);

  return state;
};
