/**
 * EmptyState - Componente para estados vazios
 * Exibe ilustração, mensagem e ação opcional
 */

import { GasPump, MagnifyingGlass, MapPin, FunnelSimple } from '@phosphor-icons/react';
import { ReactNode } from 'react';

type EmptyStateVariant = 'no-results' | 'no-location' | 'error' | 'empty';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: ReactNode;
}

const variantConfig: Record<EmptyStateVariant, { icon: ReactNode; title: string; description: string }> = {
  'no-results': {
    icon: <MagnifyingGlass size={56} weight="thin" className="text-gray-300 dark:text-gray-600" />,
    title: 'Nenhum posto encontrado',
    description: 'Tente ajustar os filtros ou buscar por outro termo',
  },
  'no-location': {
    icon: <MapPin size={56} weight="thin" className="text-gray-300 dark:text-gray-600" />,
    title: 'Localização indisponível',
    description: 'Ative a localização para encontrar postos próximos',
  },
  'error': {
    icon: <GasPump size={56} weight="thin" className="text-red-300 dark:text-red-600" />,
    title: 'Erro ao carregar dados',
    description: 'Não foi possível carregar os preços. Tente novamente.',
  },
  'empty': {
    icon: <FunnelSimple size={56} weight="thin" className="text-gray-300 dark:text-gray-600" />,
    title: 'Sem resultados',
    description: 'Não há postos para os filtros selecionados',
  },
};

export function EmptyState({ 
  variant = 'no-results', 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  const config = variantConfig[variant];
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      {/* Ícone com fundo suave */}
      <div className="mb-4 p-4 rounded-full bg-gray-100 dark:bg-gray-700/50">
        {config.icon}
      </div>
      
      {/* Título */}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title || config.title}
      </h3>
      
      {/* Descrição */}
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-4">
        {description || config.description}
      </p>
      
      {/* Ação opcional */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * EmptyStateAction - Botão de ação para EmptyState
 */
interface EmptyStateActionProps {
  onClick: () => void;
  children: ReactNode;
}

export function EmptyStateAction({ onClick, children }: EmptyStateActionProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
    >
      {children}
    </button>
  );
}
