import { useEffect, useState } from 'react';
import { detectPlatform, PlatformDetection } from '../utils/pwaDetection';

export function usePlatformDetection(): PlatformDetection {
  const [platform, setPlatform] = useState<PlatformDetection>(() => detectPlatform());

  useEffect(() => {
    const refresh = () => setPlatform(detectPlatform());

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', refresh);
    window.addEventListener('resize', refresh);

    return () => {
      mediaQuery.removeEventListener('change', refresh);
      window.removeEventListener('resize', refresh);
    };
  }, []);

  return platform;
}
