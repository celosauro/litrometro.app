import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { trackThemeChange } from '../utils/analytics';

type Tema = 'light' | 'dark' | 'system';

interface TemaContextType {
  tema: Tema;
  temaAtual: 'light' | 'dark';
  setTema: (tema: Tema) => void;
  alternar: () => void;
}

const TemaContext = createContext<TemaContextType | undefined>(undefined);

const STORAGE_KEY = 'litrometro-tema';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(tema: 'light' | 'dark') {
  const root = document.documentElement;
  if (tema === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(STORAGE_KEY) as Tema | null;
    return saved || 'light';
  });

  const [temaAtual, setTemaAtual] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(STORAGE_KEY) as Tema | null;
    if (saved && saved !== 'system') return saved;
    return getSystemTheme();
  });

  // Aplica tema ao mudar
  useEffect(() => {
    const efetivo = tema === 'system' ? getSystemTheme() : tema;
    setTemaAtual(efetivo);
    applyTheme(efetivo);
  }, [tema]);

  // Escuta mudanças no tema do sistema
  useEffect(() => {
    if (tema !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const novoTema = e.matches ? 'dark' : 'light';
      setTemaAtual(novoTema);
      applyTheme(novoTema);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [tema]);

  const setTema = useCallback((novoTema: Tema) => {
    setTemaState(novoTema);
    localStorage.setItem(STORAGE_KEY, novoTema);
    trackThemeChange(novoTema);
  }, []);

  const alternar = useCallback(() => {
    const proximo = tema === 'light' ? 'dark' : 'light';
    setTema(proximo);
  }, [tema, setTema]);

  return (
    <TemaContext.Provider value={{ tema, temaAtual, setTema, alternar }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema(): TemaContextType {
  const context = useContext(TemaContext);
  if (!context) {
    throw new Error('useTema deve ser usado dentro de TemaProvider');
  }
  return context;
}
