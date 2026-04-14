import { Outlet, Link, useLocation } from 'react-router-dom';
import { GasPump } from '@phosphor-icons/react';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { BotaoTema } from './BotaoTema';

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col ${isHomePage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/20 sticky top-0 z-50 flex-shrink-0 border-b border-transparent dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <GasPump size={28} weight="fill" className="text-blue-600 dark:text-blue-400 sm:w-8 sm:h-8" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Litrômetro</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Preços de combustíveis em Alagoas</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-3">
              {!isHomePage && (
                <Link 
                  to="/" 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ← Voltar ao início
                </Link>
              )}
              <BotaoTema />
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
    </div>
  );
}
