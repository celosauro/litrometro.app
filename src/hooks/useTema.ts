import { useState, useEffect, useCallback } from 'react';

type Tema = 'light' | 'dark' | 'system';

interface UseTemaReturn {
  tema: Tema;
  temaAtual: 'light' | 'dark';
  setTema: (tema: Tema) => void;
  alternar: () => void;
}

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

export function useTema(): UseTemaReturn {
  const [tema, setTemaState] = useState<Tema>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem(STORAGE_KEY) as Tema | null;
    return saved || 'system';
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
  }, []);

  const alternar = useCallback(() => {
    const ordem: Tema[] = ['light', 'dark', 'system'];
    const idx = ordem.indexOf(tema);
    const proximo = ordem[(idx + 1) % ordem.length];
    setTema(proximo);
  }, [tema, setTema]);

  return { tema, temaAtual, setTema, alternar };
}
