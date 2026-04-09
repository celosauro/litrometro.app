import { TIPOS_COMBUSTIVEL, CORES_COMBUSTIVEL, type TipoCombustivel } from '../types';

interface SeletorTipoCombustivelProps {
  selecionado: TipoCombustivel;
  aoMudar: (tipo: TipoCombustivel) => void;
}

export function SeletorTipoCombustivel({ selecionado, aoMudar }: SeletorTipoCombustivelProps) {
  const tiposCombustivel = Object.entries(TIPOS_COMBUSTIVEL) as [string, string][];

  return (
    <div className="flex flex-wrap gap-2">
      {tiposCombustivel.map(([tipoStr, nome]) => {
        const tipo = Number(tipoStr) as TipoCombustivel;
        const estaSelecionado = tipo === selecionado;
        const classeCor = CORES_COMBUSTIVEL[tipo];

        return (
          <button
            key={tipo}
            onClick={() => aoMudar(tipo)}
            className={`
              fuel-type-btn
              ${estaSelecionado
                ? `fuel-type-btn-active ${classeCor}`
                : 'fuel-type-btn-inactive'
              }
            `}
          >
            {nome}
          </button>
        );
      })}
    </div>
  );
}
