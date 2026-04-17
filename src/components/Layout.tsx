import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bell } from '@phosphor-icons/react';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { BotaoTema } from './BotaoTema';

// Ícone do Litrômetro - pin + bomba de gasolina (estilo lineal/outline)
export function LogoIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M16 3 C10 3 5 8 5 14 C5 21 16 29 16 29 C16 29 27 21 27 14 C27 8 22 3 16 3Z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinejoin="round"
      />
      <circle cx="16" cy="12.5" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
      <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="12.5" y="9" width="5" height="7" rx="0.5"/>
        <line x1="13.5" y1="11" x2="16.5" y2="11"/>
        <line x1="13.5" y1="13" x2="16.5" y2="13"/>
        <path d="M17.5 10 L19 10 Q20.5 10 20.5 11.5 L20.5 14.5"/>
      </g>
    </svg>
  );
}

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
                <LogoIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
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
              <button 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 
                           flex items-center justify-center text-white transition-colors"
                aria-label="Notificações"
              >
                <Bell size={20} weight="bold" />
              </button>
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
