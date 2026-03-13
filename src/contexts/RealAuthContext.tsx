import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { sendAccessLog } from '@/hooks/useAccessLogger';

type UserRole = 'admin' | 'company' | 'sst' | 'pending' | 'partner' | 'affiliate' | null;

interface Profile {
  id: string;
  full_name: string | null;
  company_id: string | null;
  sst_manager_id: string | null;
  must_change_password: boolean | null;
}

export interface UserCompany {
  id: string;
  name: string;
  cnpj: string | null;
  logo_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  isTrialExpired: boolean;
  trialEndsAt: string | null;
  companies: UserCompany[];
  activeCompanyId: string | null;
  switchCompany: (companyId: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const RealAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [companies, setCompanies] = useState<UserCompany[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const hasInitializedRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.role as UserRole;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const fetchUserCompanies = async (userId: string): Promise<UserCompany[]> => {
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select('company_id, companies:company_id(id, name, cnpj, logo_url)')
        .eq('user_id', userId);

      if (error) throw error;
      if (!data) return [];

      return data
        .map((row: any) => row.companies)
        .filter(Boolean)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          cnpj: c.cnpj,
          logo_url: c.logo_url,
        }));
    } catch (error) {
      console.error('Error fetching user companies:', error);
      return [];
    }
  };

  const switchCompany = async (companyId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ company_id: companyId })
        .eq('id', user.id);

      if (error) throw error;

      setActiveCompanyId(companyId);
      setProfile(prev => prev ? { ...prev, company_id: companyId } : prev);
      await checkTrialStatus(companyId, profile?.sst_manager_id ?? null);
      
      const selected = companies.find(c => c.id === companyId);
      toast({
        title: "Empresa alterada",
        description: `Agora acessando: ${selected?.name || 'Empresa'}`,
      });
    } catch (error: any) {
      console.error('Error switching company:', error);
      toast({
        title: "Erro ao trocar empresa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const checkTrialStatus = async (companyId: string | null, sstManagerId: string | null) => {
    const [companyResult, sstResult] = await Promise.all([
      companyId
        ? supabase.from('companies').select('subscription_status, trial_ends_at').eq('id', companyId).single()
        : Promise.resolve({ data: null }),
      sstManagerId
        ? supabase.from('sst_managers').select('subscription_status, trial_ends_at').eq('id', sstManagerId).single()
        : Promise.resolve({ data: null }),
    ]);

    const company = companyResult?.data;
    if (company?.subscription_status === 'trial' && company?.trial_ends_at) {
      setTrialEndsAt(company.trial_ends_at);
      setIsTrialExpired(new Date() > new Date(company.trial_ends_at));
      return;
    }

    const sstManager = sstResult?.data;
    if (sstManager?.subscription_status === 'trial' && sstManager?.trial_ends_at) {
      setTrialEndsAt(sstManager.trial_ends_at);
      setIsTrialExpired(new Date() > new Date(sstManager.trial_ends_at));
      return;
    }

    setIsTrialExpired(false);
    setTrialEndsAt(null);
  };

  const loadFullUserData = async (userId: string) => {
    const [userRole, userProfile, userCompanies] = await Promise.all([
      fetchUserRole(userId),
      fetchProfile(userId),
      fetchUserCompanies(userId),
    ]);
    return { userRole, userProfile, userCompanies };
  };

  const refreshRole = async () => {
    if (user) {
      const { userRole, userProfile, userCompanies } = await loadFullUserData(user.id);
      setRole(userRole);
      setProfile(userProfile);
      setCompanies(userCompanies);
      setActiveCompanyId(userProfile?.company_id ?? null);
      await checkTrialStatus(userProfile?.company_id ?? null, userProfile?.sst_manager_id ?? null);
    }
  };

  const navigateByRole = (userRole: UserRole, userProfile: Profile | null, userCompanies: UserCompany[]) => {
    if (userProfile?.must_change_password) {
      navigate('/change-password');
    } else if (userRole === 'pending') {
      navigate('/pending-approval');
    } else if (userRole === 'company' && userCompanies.length > 1) {
      navigate('/select-company');
    } else if (userRole === 'admin') {
      navigate('/master-dashboard');
    } else if (userRole === 'company') {
      navigate('/dashboard');
    } else if (userRole === 'sst') {
      navigate('/sst-dashboard');
    } else if (userRole === 'partner') {
      navigate('/parceiro/dashboard');
    } else if (userRole === 'affiliate') {
      navigate('/afiliado/dashboard');
    } else if ((userRole as string) === 'sales') {
      navigate('/sales-dashboard');
    }
  };

  const isLoginPage = (path: string) => {
    return path === '/auth' || path === '/';
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        setSession(prev => {
          if (prev?.access_token === session?.access_token) return prev;
          return session;
        });
        setUser(prev => {
          if (prev?.id === session?.user?.id) return prev;
          return session?.user ?? null;
        });

        if (event === 'SIGNED_OUT') {
          sendAccessLog({
            event_type: 'logout',
            page_path: window.location.pathname,
            user_id: session?.user?.id ?? null,
            user_email: session?.user?.email ?? null,
          });
          setRole(null);
          setProfile(null);
          setCompanies([]);
          setActiveCompanyId(null);
          setIsTrialExpired(false);
          setTrialEndsAt(null);
          hasRedirectedRef.current = false;
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            if (!isMounted) return;
            const { userRole, userProfile, userCompanies } = await loadFullUserData(session.user.id);
            if (!isMounted) return;
            setRole(userRole);
            setProfile(userProfile);
            setCompanies(userCompanies);
            setActiveCompanyId(userProfile?.company_id ?? null);
            await checkTrialStatus(userProfile?.company_id ?? null, userProfile?.sst_manager_id ?? null);

            sendAccessLog({
              event_type: 'login',
              page_path: window.location.pathname,
              user_id: session.user.id,
              user_email: session.user.email ?? null,
              user_role: userRole ?? null,
            });

            const currentPath = window.location.pathname;
            if (hasInitializedRef.current && !hasRedirectedRef.current && isLoginPage(currentPath)) {
              hasRedirectedRef.current = true;
              navigateByRole(userRole, userProfile, userCompanies);
            }
          }, 0);
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setTimeout(async () => {
            if (!isMounted) return;
            const { userRole, userProfile, userCompanies } = await loadFullUserData(session.user.id);
            if (!isMounted) return;
            setRole(userRole);
            setProfile(userProfile);
            setCompanies(userCompanies);
            setActiveCompanyId(userProfile?.company_id ?? null);
            await checkTrialStatus(userProfile?.company_id ?? null, userProfile?.sst_manager_id ?? null);
          }, 0);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { userRole, userProfile, userCompanies } = await loadFullUserData(session.user.id);
          if (!isMounted) return;
          setRole(userRole);
          setProfile(userProfile);
          setCompanies(userCompanies);
          setActiveCompanyId(userProfile?.company_id ?? null);
          await checkTrialStatus(userProfile?.company_id ?? null, userProfile?.sst_manager_id ?? null);
        }
      } finally {
        if (isMounted) {
          hasInitializedRef.current = true;
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
      setCompanies([]);
      setActiveCompanyId(null);
      setIsTrialExpired(false);
      setTrialEndsAt(null);
      hasRedirectedRef.current = false;
      navigate('/auth');
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, profile, role, isLoading, isTrialExpired, trialEndsAt, 
      companies, activeCompanyId, switchCompany,
      signOut, refreshRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useRealAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useRealAuth must be used within a RealAuthProvider');
  }
  return context;
};
