import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'company' | 'sst' | 'pending' | 'partner' | 'affiliate' | null;

interface Profile {
  id: string;
  full_name: string | null;
  company_id: string | null;
  sst_manager_id: string | null;
  must_change_password: boolean | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
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
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const refreshRole = async () => {
    if (user) {
      const userRole = await fetchUserRole(user.id);
      setRole(userRole);
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes — does NOT control isLoading
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setRole(null);
          setProfile(null);
          return;
        }

        // Only navigate on explicit sign-in
        if (event === 'SIGNED_IN' && session?.user) {
          // Defer to avoid Supabase deadlock
          setTimeout(async () => {
            if (!isMounted) return;
            const userRole = await fetchUserRole(session.user.id);
            if (!isMounted) return;
            setRole(userRole);
            const userProfile = await fetchProfile(session.user.id);
            if (!isMounted) return;
            setProfile(userProfile);

            if (userProfile?.must_change_password) {
              navigate('/change-password');
            } else if (userRole === 'pending') {
              navigate('/pending-approval');
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
            }
          }, 0);
        }

        // For TOKEN_REFRESHED or other events: silently refresh role/profile
        // without navigating or touching isLoading
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setTimeout(async () => {
            if (!isMounted) return;
            const userRole = await fetchUserRole(session.user.id);
            if (!isMounted) return;
            setRole(userRole);
            const userProfile = await fetchProfile(session.user.id);
            if (!isMounted) return;
            setProfile(userProfile);
          }, 0);
        }
      }
    );

    // INITIAL load — the only place that controls isLoading
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userRole = await fetchUserRole(session.user.id);
          if (!isMounted) return;
          setRole(userRole);
          const userProfile = await fetchProfile(session.user.id);
          if (!isMounted) return;
          setProfile(userProfile);
        }
      } finally {
        if (isMounted) setIsLoading(false);
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
    <AuthContext.Provider value={{ user, session, profile, role, isLoading, signOut, refreshRole }}>
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
