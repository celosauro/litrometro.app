import { useEffect, useRef, useState } from 'react';

// Constantes de configuração do AdSense
// IMPORTANTE: Substitua pelo seu ID real do Google AdSense
const ADSENSE_CLIENT_ID = 'ca-pub-3884485145925759';
const COOKIE_CONSENT_KEY = 'litrometro_cookie_consent';

// Tipos de slots de anúncios disponíveis
export type AdSlotType = 
  | 'horizontal'    // Banner horizontal (728x90 desktop, responsivo mobile)
  | 'vertical'      // Banner vertical para sidebar (300x600)
  | 'square'        // Quadrado (300x250)
  | 'in-article'    // Dentro do conteúdo
  | 'in-feed';      // Entre itens de lista

interface AdBannerProps {
  /** Tipo de slot do anúncio */
  slot: AdSlotType;
  /** ID do slot específico do AdSense (obtido no painel do AdSense) */
  adSlotId?: string;
  /** Classes CSS adicionais */
  className?: string;
  /** Mostrar placeholder quando AdSense não está disponível */
  showPlaceholder?: boolean;
}

/**
 * Componente de banner de anúncios do Google AdSense
 * 
 * Características:
 * - Só carrega após consentimento do usuário (LGPD/GDPR)
 * - Responsivo e adapta ao container
 * - Suporta múltiplos formatos de anúncio
 * - Fallback para placeholder em desenvolvimento
 * 
 * @example
 * // Banner horizontal no topo
 * <AdBanner slot="horizontal" adSlotId="1234567890" />
 * 
 * // Banner quadrado na sidebar
 * <AdBanner slot="square" adSlotId="0987654321" />
 */
export function AdBanner({ 
  slot, 
  adSlotId = '0000000000', 
  className = '',
  showPlaceholder = true 
}: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [isProduction] = useState(() => 
    typeof window !== 'undefined' && window.location.hostname === 'litrometro.app'
  );

  // Verificar consentimento de cookies
  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    setHasConsent(consent === 'accepted');

    // Listener para mudanças no consentimento
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY) {
        setHasConsent(e.newValue === 'accepted');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Carregar e inicializar AdSense
  useEffect(() => {
    if (!hasConsent || !isProduction || adLoaded) return;

    const loadAdSense = async () => {
      try {
        // Verificar se o script do AdSense já foi carregado
        if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
          const script = document.createElement('script');
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        // Inicializar o anúncio
        if (adRef.current && (window as any).adsbygoogle) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          setAdLoaded(true);
        }
      } catch (error) {
        console.warn('AdSense não pôde ser carregado:', error);
      }
    };

    loadAdSense();
  }, [hasConsent, isProduction, adLoaded]);

  // Configurações de estilo por tipo de slot
  const slotStyles: Record<AdSlotType, { style: React.CSSProperties; format: string }> = {
    horizontal: {
      style: { display: 'block', width: '100%', height: 'auto', minHeight: '90px' },
      format: 'auto'
    },
    vertical: {
      style: { display: 'block', width: '300px', height: '600px' },
      format: 'vertical'
    },
    square: {
      style: { display: 'block', width: '300px', height: '250px' },
      format: 'rectangle'
    },
    'in-article': {
      style: { display: 'block', textAlign: 'center' as const },
      format: 'fluid'
    },
    'in-feed': {
      style: { display: 'block' },
      format: 'fluid'
    }
  };

  const { style, format } = slotStyles[slot];

  // Não mostrar nada sem consentimento e sem placeholder
  if (!hasConsent && !showPlaceholder) {
    return null;
  }

  // Placeholder para desenvolvimento ou sem consentimento
  if (!isProduction || !hasConsent) {
    if (!showPlaceholder) return null;
    
    return (
      <div 
        className={`bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm ${className}`}
        style={{ ...style, minHeight: style.minHeight || '90px' }}
      >
        <div className="text-center p-4">
          <span className="block font-medium">Espaço publicitário</span>
          <span className="text-xs">
            {!hasConsent ? '(Aceite cookies para ver anúncios)' : '(Anúncio AdSense)'}
          </span>
        </div>
      </div>
    );
  }

  // Anúncio real do AdSense (apenas em produção com consentimento)
  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Hook para verificar se anúncios estão habilitados
 */
export function useAdsEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const isProduction = window.location.hostname === 'litrometro.app';
    setEnabled(consent === 'accepted' && isProduction);
  }, []);

  return enabled;
}

export default AdBanner;
