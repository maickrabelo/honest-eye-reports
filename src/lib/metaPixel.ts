// Meta Pixel + Conversions API helper
// - fires browser pixel via fbq()
// - mirrors event server-side via /functions/v1/meta-capi
// - shares the same event_id for deduplication
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export const META_PIXEL_ID = '3291187004514210';

export type StandardEvent =
  | 'PageView'
  | 'Lead'
  | 'CompleteRegistration'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'ViewContent'
  | 'Contact';

export interface CapiUserData {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  external_id?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : undefined;
};

const newEventId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const fbqTrack = (
  event: StandardEvent,
  params?: Record<string, any>,
  userData?: CapiUserData,
) => {
  const event_id = newEventId();

  // 1) Browser Pixel
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      const opts = { eventID: event_id };
      if (params) window.fbq('track', event, params, opts);
      else window.fbq('track', event, {}, opts);
    }
  } catch (e) {
    console.warn('[MetaPixel] fbq failed', e);
  }

  // 2) Server-side Conversions API (fire-and-forget)
  try {
    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');
    supabase.functions
      .invoke('meta-capi', {
        body: {
          event_name: event,
          event_id,
          event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
          action_source: 'website',
          custom_data: params || {},
          user_data: {
            ...(userData || {}),
            fbp,
            fbc,
            client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          },
        },
      })
      .catch((e) => console.warn('[MetaCAPI] invoke failed', e));
  } catch (e) {
    console.warn('[MetaCAPI] dispatch failed', e);
  }
};
