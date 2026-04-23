import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { List, X } from '@phosphor-icons/react';

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const menuItems = [
    { label: 'Sobre', path: '/sobre' },
    { label: 'Contato', path: '/contato' },
    { label: 'Privacidade', path: '/privacidade' },
    { label: 'Termos', path: '/termos' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão Hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-white hover:text-white/80 transition-colors p-2 rounded-lg hover:bg-white/10"
        aria-label="Menu"
      >
        {isOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-brand-700 dark:bg-brand-800 rounded-lg shadow-lg border border-white/10 overflow-hidden">
          <nav className="flex flex-col">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="px-4 py-3 text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
