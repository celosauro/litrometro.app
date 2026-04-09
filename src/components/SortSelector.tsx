import { CaretDown } from '@phosphor-icons/react';

type OpcaoOrdenacao = 'preco_asc' | 'preco_desc' | 'data';

interface SeletorOrdenacaoProps {
  selecionado: OpcaoOrdenacao;
  aoMudar: (opcao: OpcaoOrdenacao) => void;
}

const opcoesOrdenacao: { valor: OpcaoOrdenacao; rotulo: string }[] = [
  { valor: 'preco_asc', rotulo: 'Menor preço' },
  { valor: 'preco_desc', rotulo: 'Maior preço' },
  { valor: 'data', rotulo: 'Mais recente' },
];

export function SeletorOrdenacao({ selecionado, aoMudar }: SeletorOrdenacaoProps) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[160px]">
      <select
        value={selecionado}
        onChange={(e) => aoMudar(e.target.value as OpcaoOrdenacao)}
        className="w-full appearance-none pl-3 pr-8 sm:pl-4 sm:pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        {opcoesOrdenacao.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
      <CaretDown
        size={16}
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none sm:w-5 sm:h-5"
      />
    </div>
  );
}

export type { OpcaoOrdenacao };
