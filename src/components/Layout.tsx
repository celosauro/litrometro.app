import { Outlet, Link, useLocation } from 'react-router-dom';
import { GasPump } from '@phosphor-icons/react';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { BotaoTema } from './BotaoTema';
import { OfflineIndicator } from './OfflineIndicator';

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 flex flex-col ${isHomePage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Header - Estilo Find Fuel */}
      <header className="bg-brand-600 dark:bg-brand-700 sticky top-0 z-50 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <GasPump size={24} weight="fill" className="text-white sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Litrômetro</h1>
                <p className="text-[10px] sm:text-xs text-white/70 font-medium">Preços de Alagoas</p>
              </div>
            </Link>
            
            {/* Ações do header */}
            <div className="flex items-center gap-1 sm:gap-2">
              {!isHomePage && (
                <Link 
                  to="/" 
                  className="text-sm text-white/80 hover:text-white transition-colors px-3 py-1.5"
                >
                  ← Voltar
                </Link>
              )}
              <BotaoTema variant="header" />
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo da página */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <Outlet />
      </div>

      {/* Footer - oculto na home para dar espaço ao mapa */}
      {!isHomePage && <Footer />}

      {/* Cookie Banner */}
      <CookieBanner />

      {/* Indicador de status offline */}
      <OfflineIndicator />
    </div>
  );
}
