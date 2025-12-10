
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Bell, Shield, ClipboardList } from "lucide-react";
import { useRealAuth } from '@/contexts/RealAuthContext';
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navbar = ({ companyId }: { companyId?: string } = {}) => {
  const { user, role, signOut, profile } = useRealAuth();
  const isLoggedIn = !!user;
  const [sstLogo, setSstLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchSSTLogo = async () => {
      const targetCompanyId = companyId || profile?.company_id;
      if (!targetCompanyId) return;

      try {
        // Get SST manager assigned to this company
        const { data: assignment } = await supabase
          .from('company_sst_assignments')
          .select('sst_manager_id')
          .eq('company_id', targetCompanyId)
          .maybeSingle();

        if (assignment?.sst_manager_id) {
          // Get SST manager logo
          const { data: sstManager } = await supabase
            .from('sst_managers')
            .select('logo_url')
            .eq('id', assignment.sst_manager_id)
            .maybeSingle();

          if (sstManager?.logo_url) {
            setSstLogo(sstManager.logo_url);
          }
        }
      } catch (error) {
        console.error('Error fetching SST logo:', error);
      }
    };

    fetchSSTLogo();
  }, [companyId, profile?.company_id]);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="audit-container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/b77f9a5e-5823-4448-99b1-897fb16908a1.png" 
                alt="SOIA Logo" 
                className="h-8"
              />
              {sstLogo && (
                <>
                  <span className="text-muted-foreground mx-1 text-xl">+</span>
                  <img 
                    src={sstLogo} 
                    alt="SST Logo" 
                    className="h-16"
                  />
                </>
              )}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"></span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3">
                      <div className="hidden md:block text-sm text-right">
                        <div className="font-medium">{profile?.full_name || 'Usuário'}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-audit-accent flex items-center justify-center text-white">
                        {(profile?.full_name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {role === 'admin' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/master-dashboard" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Painel Admin
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/user-management" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Gestão de Usuários
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/climate-dashboard" className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Pesquisa de Clima
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {role === 'company' && (
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    {role === 'sst' && (
                      <DropdownMenuItem asChild>
                        <Link to="/sst-dashboard">Dashboard SST</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Perfil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  className="hidden sm:inline-flex"
                  onClick={() => document.getElementById('cta-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Contato
                </Button>
                <Link to="/auth">
                  <Button className="bg-audit-primary hover:bg-audit-primary/90">
                    Área do Cliente
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
