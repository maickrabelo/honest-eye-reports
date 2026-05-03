import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { fbqTrack } from '@/lib/metaPixel';

/**
 * Tracks Meta Pixel PageView on every SPA route change.
 * The initial PageView is fired by the inline script in index.html.
 */
export const MetaPixelRouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    // Skip the very first render — index.html already fires PageView on load
    fbqTrack('PageView');
  }, [location.pathname, location.search]);
  return null;
};
