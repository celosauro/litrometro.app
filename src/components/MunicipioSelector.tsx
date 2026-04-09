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
    <div className="relative min-w-[180px]">
      <select
        value={selecionado}
        onChange={(e) => aoMudar(e.target.value)}
        className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        <option value="">Todos os municípios</option>
        {municipios.map(([codigo, nome]) => (
          <option key={codigo} value={codigo}>
            {nome}
          </option>
        ))}
      </select>
      <CaretDown
        size={20}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}
