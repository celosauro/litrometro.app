export interface PlatformDetection {
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isEdge: boolean;
  isMobile: boolean;
  isStandalone: boolean;
}

function getUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent || '';
}

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  const isMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isNavigatorStandalone =
    typeof navigator !== 'undefined' &&
    'standalone' in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  return isMediaStandalone || isNavigatorStandalone;
}

export function detectPlatform(): PlatformDetection {
  const userAgent = getUserAgent();
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome|CriOS|Edg|OPR/i.test(userAgent);
  const isChrome = /Chrome|CriOS/i.test(userAgent) && !/Edg|OPR/i.test(userAgent);
  const isEdge = /Edg/i.test(userAgent);
  const isMobile = isIOS || isAndroid;

  return {
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isEdge,
    isMobile,
    isStandalone: isStandaloneMode(),
  };
}

export function shouldShowInstallPrompt(dismissedUntil: string | null): boolean {
  if (!dismissedUntil) return true;

  const dismissedUntilDate = new Date(dismissedUntil);
  if (Number.isNaN(dismissedUntilDate.getTime())) return true;

  return Date.now() > dismissedUntilDate.getTime();
}
