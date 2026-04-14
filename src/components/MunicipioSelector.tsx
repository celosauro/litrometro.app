import { CaretDown } from '@phosphor-icons/react';
import { MUNICIPIOS_AL } from '../types';

interface SeletorMunicipioProps {
  selecionado: string;
  aoMudar: (codigoIBGE: string) => void;
}

export function SeletorMunicipio({ selecionado, aoMudar }: SeletorMunicipioProps) {
  const municipios = Object.entries(MUNICIPIOS_AL).sort((a, b) =>
    a[1].localeCompare(b[1])
  );

  return (
    <div className="relative w-full sm:w-auto sm:min-w-[180px]">
      <select
        value={selecionado}
        onChange={(e) => aoMudar(e.target.value)}
        className="w-full appearance-none pl-3 pr-8 sm:pl-4 sm:pr-10 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        <option value="">Todos os municípios</option>
        {municipios.map(([codigo, nome]) => (
          <option key={codigo} value={codigo}>
            {nome}
          </option>
        ))}
      </select>
      <CaretDown
        size={16}
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none sm:w-5 sm:h-5"
      />
    </div>
  );
}
