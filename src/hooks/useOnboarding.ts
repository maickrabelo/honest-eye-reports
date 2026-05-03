import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';

const ONBOARDING_STORAGE_KEY = 'soia_onboarding_completed';

function getLocalCompleted(): string[] {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setLocalCompleted(pages: string[]) {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(pages));
  } catch {}
}

export function useOnboarding(pageId: string) {
  const { role, profile, isLoading: authLoading } = useRealAuth();
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (authLoading) {
      setIsReady(false);
      return;
    }

    // Skip if no profile
    if (!profile) {
      setShouldShowTour(false);
      setIsReady(true);
      return;
    }

    const isSstOwner = role === 'sst' && !!profile.sst_manager_id;
    const isCompanyOwner = role === 'company' && !!profile.company_id;

    if (!isSstOwner && !isCompanyOwner) {
      setShouldShowTour(false);
      setIsReady(true);
      return;
    }

    // Quick check: if already completed locally, skip DB call
    const localCompleted = getLocalCompleted();
    if (localCompleted.includes(pageId)) {
      setShouldShowTour(false);
      setIsReady(true);
      return;
    }

    const checkOnboarding = async () => {
      try {
        if (isSstOwner) {
          const { data, error } = await supabase
            .from('sst_managers')
            .select('onboarding_completed_pages, subscription_status')
            .eq('id', profile.sst_manager_id!)
            .single();
          if (error) throw error;
          if (data?.subscription_status !== 'trial') {
            setShouldShowTour(false);
            setIsReady(true);
            return;
          }
          const completedPages = (data?.onboarding_completed_pages as string[]) || [];
          if (completedPages.length > 0) {
            setLocalCompleted([...new Set([...localCompleted, ...completedPages])]);
          }
          setShouldShowTour(!completedPages.includes(pageId));
        } else if (isCompanyOwner) {
          // Para empresa: controle apenas via localStorage (independente de status de assinatura)
          setShouldShowTour(true);
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
        setShouldShowTour(false);
      } finally {
        setIsReady(true);
      }
    };

    checkOnboarding();
  }, [authLoading, profile?.sst_manager_id, profile?.company_id, role, pageId]);

  const completeTour = useCallback(async () => {
    if (!profile) return;

    setShouldShowTour(false);
    const localCompleted = getLocalCompleted();
    if (!localCompleted.includes(pageId)) {
      setLocalCompleted([...localCompleted, pageId]);
    }

    if (role === 'sst' && profile.sst_manager_id) {
      try {
        const { data } = await supabase
          .from('sst_managers')
          .select('onboarding_completed_pages')
          .eq('id', profile.sst_manager_id)
          .single();
        const completedPages = (data?.onboarding_completed_pages as string[]) || [];
        if (!completedPages.includes(pageId)) {
          await supabase
            .from('sst_managers')
            .update({ onboarding_completed_pages: [...completedPages, pageId] })
            .eq('id', profile.sst_manager_id);
        }
      } catch (err) {
        console.error('Error completing tour:', err);
      }
    }
  }, [profile?.sst_manager_id, profile?.company_id, role, pageId]);

  const resetTour = useCallback(async () => {
    const localCompleted = getLocalCompleted();
    setLocalCompleted(localCompleted.filter((p) => p !== pageId));
    setShouldShowTour(true);

    if (role === 'sst' && profile?.sst_manager_id) {
      try {
        const { data } = await supabase
          .from('sst_managers')
          .select('onboarding_completed_pages')
          .eq('id', profile.sst_manager_id)
          .single();
        const completedPages = (data?.onboarding_completed_pages as string[]) || [];
        await supabase
          .from('sst_managers')
          .update({ onboarding_completed_pages: completedPages.filter((p) => p !== pageId) })
          .eq('id', profile.sst_manager_id);
      } catch (err) {
        console.error('Error resetting tour:', err);
      }
    }
  }, [profile?.sst_manager_id, role, pageId]);

  return { shouldShowTour, completeTour, resetTour, isReady };
}
