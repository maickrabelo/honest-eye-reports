// Meta Pixel helper — wraps fbq() so we don't crash if it's not loaded yet.
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export const META_PIXEL_ID = '3291187004514210';

type StandardEvent =
  | 'PageView'
  | 'Lead'
  | 'CompleteRegistration'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'ViewContent'
  | 'Contact';

export const fbqTrack = (event: StandardEvent, params?: Record<string, any>) => {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      if (params) window.fbq('track', event, params);
      else window.fbq('track', event);
    }
  } catch (e) {
    // fail silently — pixel is non-critical
    console.warn('[MetaPixel] track failed', e);
  }
};
