import { useEffect, useState } from 'react';
import { WifiSlash } from '@phosphor-icons/react';

/**
 * Indicador de status offline
 * Mostra um badge quando o usuário está sem conexão
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-[100] animate-pulse"
      role="status"
      aria-live="polite"
    >
      <WifiSlash size={20} weight="bold" />
      <span className="text-sm font-medium">Você está offline</span>
    </div>
  );
}
