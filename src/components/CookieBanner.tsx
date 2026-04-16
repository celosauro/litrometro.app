import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { trackCookieConsent } from '../utils/analytics';

const COOKIE_CONSENT_KEY = 'litrometro_cookie_consent';

type ConsentStatus = 'accepted' | 'rejected' | null;

export function CookieBanner() {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus;
    if (savedConsent) {
      setConsentStatus(savedConsent);
      if (savedConsent === 'accepted') {
        enableAnalytics();
      }
    } else {
      // Mostrar banner após um pequeno delay para não atrapalhar o carregamento inicial
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const enableAnalytics = () => {
    // Ativar Google Analytics apenas após consentimento
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
      });
    }
  };

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setConsentStatus('accepted');
    setIsVisible(false);
    enableAnalytics();
    trackCookieConsent(true);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    setConsentStatus('rejected');
    setIsVisible(false);
    trackCookieConsent(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || consentStatus) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              🍪 Utilizamos cookies
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Este site utiliza cookies e tecnologias semelhantes para melhorar sua experiência, 
              analisar o tráfego e exibir anúncios personalizados. Ao clicar em "Aceitar", você 
              concorda com o uso de cookies conforme nossa{' '}
              <a href="/privacidade" className="text-brand-600 dark:text-brand-400 hover:underline">
                Política de Privacidade
              </a>.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
              >
                Aceitar todos
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Recusar não essenciais
              </button>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
