/**
 * Utilitário de Analytics para o Litrômetro
 * 
 * Funções tipadas para disparar eventos do Google Analytics 4.
 * Respeita o consentimento do usuário (gerenciado pelo CookieBanner).
 */

// Tipos para o gtag global
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'consent',
      action: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Verifica se o gtag está disponível e o consentimento foi dado
 */
function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Dispara um evento genérico no GA4
 */
function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return;
  
  try {
    window.gtag?.('event', eventName, params);
  } catch (error) {
    // Silencia erros de analytics para não afetar UX
    console.debug('[Analytics] Erro ao disparar evento:', eventName, error);
  }
}

/**
 * Rastreia seleção de tipo de combustível
 */
export function trackFuelTypeSelect(fuelType: string, fuelTypeCode: number): void {
  trackEvent('fuel_type_select', {
    fuel_type: fuelType,
    fuel_type_code: fuelTypeCode,
  });
}

/**
 * Rastreia seleção de município
 */
export function trackMunicipalitySelect(municipalityName: string, municipalityCode: string): void {
  trackEvent('municipality_select', {
    municipality_name: municipalityName,
    municipality_code: municipalityCode,
  });
}

/**
 * Rastreia permissão de geolocalização
 */
export function trackLocationPermission(status: 'granted' | 'denied' | 'unavailable' | 'dev_mode'): void {
  trackEvent('location_permission', {
    permission_status: status,
  });
}

/**
 * Rastreia visualização de posto no mapa
 */
export function trackStationView(
  stationName: string,
  stationCnpj: string,
  fuelType: string,
  price: number,
  distance?: number
): void {
  trackEvent('station_view', {
    station_name: stationName,
    station_cnpj: stationCnpj,
    fuel_type: fuelType,
    price: price,
    distance_km: distance ?? null,
  });
}

/**
 * Rastreia mudança de tema
 */
export function trackThemeChange(theme: 'light' | 'dark' | 'system'): void {
  trackEvent('theme_change', {
    theme: theme,
  });
}

/**
 * Rastreia visualização de página (para SPAs)
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle ?? document.title,
  });
}

/**
 * Rastreia busca de posto
 */
export function trackSearch(searchTerm: string, resultsCount: number): void {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

/**
 * Rastreia aceite/recusa de cookies
 */
export function trackCookieConsent(accepted: boolean): void {
  trackEvent('cookie_consent', {
    consent_given: accepted,
  });
}
