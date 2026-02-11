import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';

export function useOnboarding(pageId: string) {
  const { role, profile, isLoading: authLoading } = useRealAuth();
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (authLoading || !profile?.sst_manager_id || role !== 'sst') {
      setShouldShowTour(false);
      setIsReady(true);
      return;
    }

    const checkOnboarding = async () => {
      try {
        const { data, error } = await supabase
          .from('sst_managers')
          .select('onboarding_completed_pages, subscription_status')
          .eq('id', profile.sst_manager_id!)
          .single();

        if (error) throw error;

        // Only show for trial accounts
        if (data?.subscription_status !== 'trial') {
          setShouldShowTour(false);
          setIsReady(true);
          return;
        }

        const completedPages = (data?.onboarding_completed_pages as string[]) || [];
        setShouldShowTour(!completedPages.includes(pageId));
      } catch (err) {
        console.error('Error checking onboarding status:', err);
        setShouldShowTour(false);
      } finally {
        setIsReady(true);
      }
    };

    checkOnboarding();
  }, [authLoading, profile?.sst_manager_id, role, pageId]);

  const completeTour = async () => {
    if (!profile?.sst_manager_id) return;

    try {
      // Fetch current completed pages
      const { data } = await supabase
        .from('sst_managers')
        .select('onboarding_completed_pages')
        .eq('id', profile.sst_manager_id)
        .single();

      const completedPages = (data?.onboarding_completed_pages as string[]) || [];
      
      if (!completedPages.includes(pageId)) {
        const updated = [...completedPages, pageId];
        await supabase
          .from('sst_managers')
          .update({ onboarding_completed_pages: updated })
          .eq('id', profile.sst_manager_id);
      }

      setShouldShowTour(false);
    } catch (err) {
      console.error('Error completing tour:', err);
      setShouldShowTour(false);
    }
  };

  return { shouldShowTour, completeTour, isReady };
}