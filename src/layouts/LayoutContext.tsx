import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type LayoutId, LAYOUTS, getLayoutInfo, type LayoutInfo } from './types';

interface LayoutContextType {
  /** ID do layout atual */
  layoutAtual: LayoutId;
  /** Informações do layout atual */
  layoutInfo: LayoutInfo;
  /** Lista de todos os layouts disponíveis */
  layouts: LayoutInfo[];
  /** Altera o layout ativo */
  alterarLayout: (id: LayoutId) => void;
}

const STORAGE_KEY = 'litrometro-layout';

const LayoutContext = createContext<LayoutContextType | null>(null);

/** Hook para acessar o contexto de layout */
export function useLayout(): LayoutContextType {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout deve ser usado dentro de LayoutProvider');
  }
  return context;
}

interface LayoutProviderProps {
  children: ReactNode;
}

/** Provider que gerencia o estado do layout selecionado */
export function LayoutProvider({ children }: LayoutProviderProps) {
  const [layoutAtual, setLayoutAtual] = useState<LayoutId>(() => {
    // Recupera do localStorage se disponível
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo && LAYOUTS.some(l => l.id === salvo)) {
        return salvo as LayoutId;
      }
    }
    return 'default';
  });

  // Persiste no localStorage quando muda
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, layoutAtual);
  }, [layoutAtual]);

  const alterarLayout = (id: LayoutId) => {
    if (LAYOUTS.some(l => l.id === id)) {
      setLayoutAtual(id);
    }
  };

  const layoutInfo = getLayoutInfo(layoutAtual);

  return (
    <LayoutContext.Provider
      value={{
        layoutAtual,
        layoutInfo,
        layouts: LAYOUTS,
        alterarLayout
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
