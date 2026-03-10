import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';

export type BrandColorTheme = 'navy' | 'green' | 'orange' | 'purple';

interface ColorPalette {
  primary: string;
  primaryDark: string;
  primaryMid: string;
  primaryLight: string;
  primary50: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
}

const COLOR_PALETTES: Record<BrandColorTheme, ColorPalette> = {
  navy: {
    primary: '220 56% 24%',
    primaryDark: '220 56% 18%',
    primaryMid: '217 91% 60%',
    primaryLight: '214 100% 97%',
    primary50: '214 95% 93%',
    gradientFrom: '#1e3a5f',
    gradientVia: '#1e40af',
    gradientTo: '#2563eb',
  },
  green: {
    primary: '158 75% 22%',
    primaryDark: '158 75% 15%',
    primaryMid: '158 56% 42%',
    primaryLight: '138 76% 97%',
    primary50: '138 76% 93%',
    gradientFrom: '#14532d',
    gradientVia: '#166534',
    gradientTo: '#15803d',
  },
  orange: {
    primary: '20 91% 34%',
    primaryDark: '20 91% 25%',
    primaryMid: '21 90% 48%',
    primaryLight: '33 100% 96%',
    primary50: '33 100% 92%',
    gradientFrom: '#7c2d12',
    gradientVia: '#9a3412',
    gradientTo: '#ea580c',
  },
  purple: {
    primary: '274 72% 32%',
    primaryDark: '274 72% 22%',
    primaryMid: '263 70% 58%',
    primaryLight: '270 100% 98%',
    primary50: '270 100% 95%',
    gradientFrom: '#3b0764',
    gradientVia: '#581c87',
    gradientTo: '#7c3aed',
  },
};

interface WhiteLabelBrand {
  brandLogo: string | null;
  brandName: string | null;
  sstSlug: string | null;
  brandColor: BrandColorTheme | null;
  isWhiteLabel: boolean;
  isLoading: boolean;
  setBrandColorDB: (color: BrandColorTheme) => Promise<void>;
  getColorPalette: () => ColorPalette;
}

const WhiteLabelContext = createContext<WhiteLabelBrand>({
  brandLogo: null,
  brandName: null,
  sstSlug: null,
  brandColor: null,
  isWhiteLabel: false,
  isLoading: true,
  setBrandColorDB: async () => {},
  getColorPalette: () => COLOR_PALETTES.green,
});

const applyColorTheme = (color: BrandColorTheme | null) => {
  const palette = COLOR_PALETTES[color || 'green'];
  const root = document.documentElement;
  root.style.setProperty('--sst-primary', palette.primary);
  root.style.setProperty('--sst-primary-dark', palette.primaryDark);
  root.style.setProperty('--sst-primary-mid', palette.primaryMid);
  root.style.setProperty('--sst-primary-light', palette.primaryLight);
  root.style.setProperty('--sst-primary-50', palette.primary50);
  root.style.setProperty('--sst-gradient-from', palette.gradientFrom);
  root.style.setProperty('--sst-gradient-via', palette.gradientVia);
  root.style.setProperty('--sst-gradient-to', palette.gradientTo);
};

export const WhiteLabelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [sstSlug, setSstSlug] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState<BrandColorTheme | null>(null);
  const [sstManagerId, setSstManagerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const { user, role, profile } = useRealAuth();

  const getColorPalette = useCallback(() => {
    return COLOR_PALETTES[brandColor || 'green'];
  }, [brandColor]);

  const setBrandColorDB = useCallback(async (color: BrandColorTheme) => {
    if (!sstManagerId) {
      console.error('No SST manager ID found, cannot save color');
      return;
    }
    const { error } = await supabase
      .from('sst_managers')
      .update({ brand_color: color })
      .eq('id', sstManagerId);
    if (error) {
      console.error('Error saving brand color:', error);
    } else {
      setBrandColor(color);
      applyColorTheme(color);
    }
  }, [sstManagerId]);

  useEffect(() => {
    const detectBranding = async () => {
      setIsLoading(true);

      try {
        // 1. Check URL path: /sst/:slug
        const sstPathMatch = location.pathname.match(/^\/sst\/([^/]+)/);
        if (sstPathMatch) {
          const slug = sstPathMatch[1];
          const { data: sstManager } = await supabase
            .from('sst_managers')
            .select('logo_url, name, slug, brand_color, id')
            .eq('slug', slug)
            .maybeSingle();

          if (sstManager) {
            setBrandLogo(sstManager.logo_url);
            setBrandName(sstManager.name);
            setSstSlug(sstManager.slug);
            setSstManagerId(sstManager.id);
            const color = sstManager.brand_color as BrandColorTheme | null;
            setBrandColor(color);
            applyColorTheme(color);
            setIsLoading(false);
            return;
          }
        }

        // 2. Check logged-in user
        if (user && profile) {
          // SST user -> get their own SST manager
          if (role === 'sst' && profile.sst_manager_id) {
            const { data: sstManager } = await supabase
              .from('sst_managers')
              .select('logo_url, name, slug, brand_color, id')
              .eq('id', profile.sst_manager_id)
              .maybeSingle();

            if (sstManager) {
              setBrandLogo(sstManager.logo_url || null);
              setBrandName(sstManager.name);
              setSstSlug(sstManager.slug);
              setSstManagerId(sstManager.id);
              const color = (sstManager as any).brand_color as BrandColorTheme | null;
              setBrandColor(color);
              applyColorTheme(color);
              setIsLoading(false);
              return;
            }
          }

          // Company user -> check if company has an SST assignment
          if (role === 'company' && profile.company_id) {
            const { data: assignment } = await supabase
              .from('company_sst_assignments')
              .select('sst_manager_id')
              .eq('company_id', profile.company_id)
              .maybeSingle();

            if (assignment?.sst_manager_id) {
              const { data: sstManager } = await supabase
                .from('sst_managers')
                .select('logo_url, name, slug, brand_color, id')
                .eq('id', assignment.sst_manager_id)
                .maybeSingle();

              if (sstManager) {
                setBrandLogo(sstManager.logo_url || null);
                setBrandName(sstManager.name);
                setSstSlug(sstManager.slug);
                setSstManagerId(sstManager.id);
                const color = (sstManager as any).brand_color as BrandColorTheme | null;
                setBrandColor(color);
                applyColorTheme(color);
                setIsLoading(false);
                return;
              }
            }
          }
        }

        // No branding detected - reset to defaults
        setBrandLogo(null);
        setBrandName(null);
        setSstSlug(null);
        setBrandColor(null);
        setSstManagerId(null);
        applyColorTheme(null);
      } catch (error) {
        console.error('Error detecting white-label branding:', error);
        setBrandLogo(null);
        setBrandName(null);
        setSstSlug(null);
        setBrandColor(null);
        setSstManagerId(null);
      } finally {
        setIsLoading(false);
      }
    };

    detectBranding();
  }, [location.pathname, user, role, profile]);

  return (
    <WhiteLabelContext.Provider value={{ brandLogo, brandName, sstSlug, brandColor, isWhiteLabel: !!brandLogo || !!brandColor, isLoading, setBrandColorDB, getColorPalette }}>
      {children}
    </WhiteLabelContext.Provider>
  );
};

export const useWhiteLabel = () => useContext(WhiteLabelContext);
