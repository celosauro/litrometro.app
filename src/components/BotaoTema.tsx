import { Sun, Moon } from '@phosphor-icons/react';
import { useTema } from '../contexts/TemaContext';

interface BotaoTemaProps {
  variant?: 'default' | 'header';
}

export function BotaoTema({ variant = 'default' }: BotaoTemaProps) {
  const { temaAtual, alternar } = useTema();

  const isLight = temaAtual === 'light';
  const titulo = isLight ? 'Mudar para modo escuro' : 'Mudar para modo claro';

  const baseClasses = variant === 'header'
    ? 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center'
    : 'p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors';

  return (
    <button
      onClick={alternar}
      className={baseClasses}
      aria-label={titulo}
      title={titulo}
    >
      {isLight ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
    </button>
  );
}
