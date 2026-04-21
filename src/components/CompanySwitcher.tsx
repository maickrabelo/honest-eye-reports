import React, { useEffect, useState } from 'react';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import AddCompanyDialog from '@/components/AddCompanyDialog';

const CompanySwitcher: React.FC = () => {
  const { companies, activeCompanyId, switchCompany, profile } = useRealAuth();
  const [isCorporate, setIsCorporate] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const cid = activeCompanyId || profile?.company_id;
    if (!cid) { setIsCorporate(false); return; }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('companies').select('trial_plan_slug').eq('id', cid).maybeSingle();
      if (active) setIsCorporate(data?.trial_plan_slug === 'corporate');
    })();
    return () => { active = false; };
  }, [activeCompanyId, profile?.company_id]);

  if (companies.length <= 1 && !isCorporate) return null;

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-xs">{activeCompany?.name || 'Empresa'}</span>
            <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground">Trocar empresa</p>
          </div>
          <DropdownMenuSeparator />
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => switchCompany(company.id)}
              className="flex items-center gap-3 py-2"
            >
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-7 w-7 rounded object-contain border bg-white p-0.5 flex-shrink-0"
                />
              ) : (
                <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{company.name}</p>
                {company.cnpj && (
                  <p className="text-xs text-muted-foreground">{company.cnpj}</p>
                )}
              </div>
              {company.id === activeCompanyId && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          {isCorporate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.preventDefault(); setAddOpen(true); }}
                className="flex items-center gap-2 py-2 text-primary"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Adicionar CNPJ</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AddCompanyDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
};

export default CompanySwitcher;
