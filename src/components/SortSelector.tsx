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
    <div className="relative min-w-[160px]">
      <select
        value={selecionado}
        onChange={(e) => aoMudar(e.target.value as OpcaoOrdenacao)}
        className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        {opcoesOrdenacao.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
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

export type { OpcaoOrdenacao };
