import { Sun, Moon, Desktop } from '@phosphor-icons/react';
import { useTema } from '../contexts/TemaContext';

export function BotaoTema() {
  const { tema, alternar } = useTema();

  const icones = {
    light: <Sun size={20} weight="fill" />,
    dark: <Moon size={20} weight="fill" />,
    system: <Desktop size={20} weight="fill" />,
  };

  const titulos = {
    light: 'Modo claro (clique para escuro)',
    dark: 'Modo escuro (clique para sistema)',
    system: 'Tema do sistema (clique para claro)',
  };

  return (
    <button
      onClick={alternar}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label={titulos[tema]}
      title={titulos[tema]}
    >
      {icones[tema]}
    </button>
  );
}
