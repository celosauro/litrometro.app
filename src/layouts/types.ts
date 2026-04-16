/**
 * Tipos para sistema de layouts alternativos
 */

export type LayoutId = 'default' | 'cards-grid' | 'compact-list';

export interface LayoutInfo {
  id: LayoutId;
  nome: string;
  descricao: string;
  icone: string;
}

/** Layouts disponíveis no sistema */
export const LAYOUTS: LayoutInfo[] = [
  { 
    id: 'default', 
    nome: 'Padrão', 
    descricao: 'Lista + Mapa lado a lado', 
    icone: '📋' 
  },
  { 
    id: 'cards-grid', 
    nome: 'Cards', 
    descricao: 'Grade de cards com mapa em modal', 
    icone: '🗃️' 
  },
  { 
    id: 'compact-list', 
    nome: 'Lista', 
    descricao: 'Tabela compacta e densa', 
    icone: '📊' 
  },
];

/** Busca informações de um layout pelo ID */
export function getLayoutInfo(id: LayoutId): LayoutInfo {
  return LAYOUTS.find(l => l.id === id) || LAYOUTS[0];
}
