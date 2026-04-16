import { memo } from 'react';
import { Star } from '@phosphor-icons/react';

interface PinPrecoProps {
  valor: number;
  selecionado?: boolean;
  isMelhor?: boolean;
}

function PinPreco({ valor, selecionado, isMelhor }: PinPrecoProps) {
  const formatarPreco = (v: number) => {
    return v.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Cores baseadas na paleta atual (brand-*) ou dourado para melhor preço
  const bgClass = isMelhor 
    ? 'bg-gradient-to-r from-yellow-400 to-amber-500' 
    : 'bg-brand-600';
  const borderClass = isMelhor 
    ? 'border-amber-600' 
    : 'border-brand-700';

  return (
    <div 
      className={`
        relative cursor-pointer transition-transform duration-150
        ${selecionado || isMelhor ? 'scale-125 z-10' : 'hover:scale-110'}
      `}
    >
      {/* Estrela para melhor preço */}
      {isMelhor && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-md">
          <Star size={16} weight="fill" />
        </div>
      )}
      {/* Badge com preço */}
      <div 
        className={`
          ${bgClass} ${borderClass}
          text-white text-xs font-bold
          px-1.5 py-0.5 rounded-md
          border-2 shadow-lg
          whitespace-nowrap
          ${isMelhor ? 'ring-2 ring-yellow-300 ring-offset-1' : ''}
        `}
      >
        {formatarPreco(valor)}
      </div>
      
      {/* Seta apontando para baixo - usa cor sólida via style */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent"
        style={{
          borderTopWidth: '6px',
          borderTopStyle: 'solid',
          borderTopColor: isMelhor ? '#d97706' : 'rgb(var(--color-brand-700))'
        }}
      />
    </div>
  );
}

export default memo(PinPreco);
