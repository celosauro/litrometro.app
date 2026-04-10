import { memo } from 'react';
import type { TipoCombustivel } from '../types';

interface PinPrecoProps {
  valor: number;
  tipoCombustivel: TipoCombustivel;
  selecionado?: boolean;
}

const CORES_PIN: Record<TipoCombustivel, { bg: string; border: string }> = {
  1: { bg: 'bg-yellow-500', border: 'border-yellow-600' },
  2: { bg: 'bg-yellow-600', border: 'border-yellow-700' },
  3: { bg: 'bg-green-500', border: 'border-green-600' },
  4: { bg: 'bg-gray-600', border: 'border-gray-700' },
  5: { bg: 'bg-gray-700', border: 'border-gray-800' },
  6: { bg: 'bg-blue-500', border: 'border-blue-600' },
};

function PinPreco({ valor, tipoCombustivel, selecionado }: PinPrecoProps) {
  const cores = CORES_PIN[tipoCombustivel] || CORES_PIN[1];
  
  const formatarPreco = (v: number) => {
    return v.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div 
      className={`
        relative cursor-pointer transition-transform duration-150
        ${selecionado ? 'scale-125 z-10' : 'hover:scale-110'}
      `}
    >
      {/* Badge com preço */}
      <div 
        className={`
          ${cores.bg} ${cores.border}
          text-white text-xs font-bold
          px-1.5 py-0.5 rounded-md
          border-2 shadow-lg
          whitespace-nowrap
        `}
      >
        {formatarPreco(valor)}
      </div>
      
      {/* Seta apontando para baixo */}
      <div 
        className={`
          absolute left-1/2 -translate-x-1/2 -bottom-1.5
          w-0 h-0 
          border-l-4 border-l-transparent
          border-r-4 border-r-transparent
          border-t-6 ${cores.border.replace('border-', 'border-t-')}
        `}
        style={{
          borderTopWidth: '6px',
          borderTopColor: cores.border.includes('yellow-600') ? '#ca8a04' :
                          cores.border.includes('yellow-700') ? '#a16207' :
                          cores.border.includes('green-600') ? '#16a34a' :
                          cores.border.includes('gray-700') ? '#374151' :
                          cores.border.includes('gray-800') ? '#1f2937' :
                          cores.border.includes('blue-600') ? '#2563eb' : '#ca8a04'
        }}
      />
    </div>
  );
}

export default memo(PinPreco);
