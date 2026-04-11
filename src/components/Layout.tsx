import { Outlet, Link, useLocation } from 'react-router-dom';
import { GasPump } from '@phosphor-icons/react';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <GasPump size={28} weight="fill" className="text-blue-600 sm:w-8 sm:h-8" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Litrômetro</h1>
                <p className="text-xs sm:text-sm text-gray-500">Preços de combustíveis em Alagoas</p>
              </div>
            </Link>
            
            {!isHomePage && (
              <Link 
                to="/" 
                className="text-sm text-blue-600 hover:underline"
              >
                ← Voltar ao início
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo da página */}
      <Outlet />

      {/* Footer */}
      <Footer />

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}
