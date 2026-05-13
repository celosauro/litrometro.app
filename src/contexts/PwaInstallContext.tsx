import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { InstallOutcome, useInstallPrompt } from '../hooks/useInstallPrompt';
import { usePlatformDetection } from '../hooks/usePlatformDetection';
import { shouldShowInstallPrompt } from '../utils/pwaDetection';

const DISMISS_UNTIL_KEY = 'litrometro-pwa-dismiss-until';
const INSTALLED_KEY = 'litrometro-pwa-installed';

interface PwaInstallContextType {
  isMobile: boolean;
  isIOSInstruction: boolean;
  isInstallable: boolean;
  showInstallPrompt: boolean;
  dismissInstallPrompt: (days?: number) => void;
  triggerInstall: () => Promise<InstallOutcome>;
}

const PwaInstallContext = createContext<PwaInstallContextType | undefined>(undefined);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const platform = usePlatformDetection();
  const { isInstallable, installApp } = useInstallPrompt();
  const [installed, setInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(INSTALLED_KEY) === 'true';
  });
  const [dismissedUntil, setDismissedUntil] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(DISMISS_UNTIL_KEY);
  });

  useEffect(() => {
    if (platform.isStandalone) {
      setInstalled(true);
      localStorage.setItem(INSTALLED_KEY, 'true');
    }
  }, [platform.isStandalone]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === DISMISS_UNTIL_KEY) {
        setDismissedUntil(event.newValue);
      }
      if (event.key === INSTALLED_KEY) {
        setInstalled(event.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const dismissInstallPrompt = (days = 90) => {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(DISMISS_UNTIL_KEY, until);
    setDismissedUntil(until);
  };

  const triggerInstall = async (): Promise<InstallOutcome> => {
    const outcome = await installApp();

    if (outcome === 'accepted') {
      setInstalled(true);
      localStorage.setItem(INSTALLED_KEY, 'true');
    }

    return outcome;
  };

  const showInstallPrompt = useMemo(() => {
    if (!platform.isMobile) return false;
    if (installed || platform.isStandalone) return false;
    if (!shouldShowInstallPrompt(dismissedUntil)) return false;

    const isIOSInstruction = platform.isIOS && platform.isSafari;
    if (isIOSInstruction) return true;

    // Para Android Chrome/Edge, mostrar o banner independente de isInstallable
    // (o evento beforeinstallprompt pode não ter disparado ainda)
    const isAndroidChrome = platform.isAndroid && (platform.isChrome || platform.isEdge);
    return isAndroidChrome;
  }, [dismissedUntil, installed, platform]);

  const value = useMemo<PwaInstallContextType>(
    () => ({
      isMobile: platform.isMobile,
      isIOSInstruction: platform.isIOS && platform.isSafari,
      isInstallable,
      showInstallPrompt,
      dismissInstallPrompt,
      triggerInstall,
    }),
    [isInstallable, platform.isAndroid, platform.isChrome, platform.isEdge, platform.isIOS, platform.isMobile, platform.isSafari, showInstallPrompt]
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error('usePwaInstall deve ser usado dentro de PwaInstallProvider');
  }
  return context;
}
