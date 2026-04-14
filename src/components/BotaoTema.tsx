import { Sun, Moon } from '@phosphor-icons/react';
import { useTema } from '../contexts/TemaContext';

export function BotaoTema() {
  const { temaAtual, alternar } = useTema();

  const isLight = temaAtual === 'light';
  const titulo = isLight ? 'Mudar para modo escuro' : 'Mudar para modo claro';

  return (
    <button
      onClick={alternar}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label={titulo}
      title={titulo}
    >
      {isLight ? <Sun size={20} weight="fill" /> : <Moon size={20} weight="fill" />}
    </button>
  );
}
