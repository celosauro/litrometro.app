import { MapPin, Phone, Clock, TrendUp, TrendDown, NavigationArrow, Star, MapPinLine } from '@phosphor-icons/react';
import type { PrecoCombustivelResumo, TipoCombustivel } from '../types';
import { TIPOS_COMBUSTIVEL, CORES_COMBUSTIVEL } from '../types';
import { formatarDistancia } from '../utils/distancia';

interface CardCombustivelProps {
  dados: PrecoCombustivelResumo;
  distancia?: number;
  isSelected?: boolean;
  isMelhor?: boolean;
  onClick?: () => void;
}

export function CardCombustivel({ dados, distancia, isSelected, isMelhor, onClick }: CardCombustivelProps) {
  const tipoCombustivel = dados.tipo_combustivel as TipoCombustivel;
  const nomeCombustivel = TIPOS_COMBUSTIVEL[tipoCombustivel];
  const corCombustivel = CORES_COMBUSTIVEL[tipoCombustivel];
  
  const formatarPreco = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 3,
    });
  };

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatarEndereco = () => {
    const partes = [
      dados.nome_logradouro,
      dados.numero_imovel ? `nº ${dados.numero_imovel}` : null,
      dados.bairro,
    ].filter(Boolean);
    return partes.join(', ');
  };

  const nomeExibicao = dados.nome_fantasia || dados.razao_social;
  const temCoordenadas = dados.latitude !== 0 && dados.longitude !== 0;

  return (
    <div 
      className={`fuel-card cursor-pointer transition-all border-2 ${
        isMelhor
          ? 'border-yellow-400 dark:border-yellow-500 ring-2 ring-yellow-200 dark:ring-yellow-500/30 shadow-lg'
          : isSelected 
            ? 'border-blue-500 shadow-lg scale-[1.02] bg-blue-50/50 dark:bg-blue-900/20' 
            : 'border-transparent hover:shadow-md hover:scale-[1.01]'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Badge de melhor preço */}
      {isMelhor && (
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold px-3 py-1 flex items-center justify-center gap-1.5">
          <Star size={14} weight="fill" />
          <span>{distancia !== undefined ? 'Melhor Custo-Benefício' : 'Melhor Preço'}</span>
          <Star size={14} weight="fill" />
        </div>
      )}
      {/* Header com badge */}
      <div className="px-3 pt-3 pb-1.5 sm:px-4 sm:pt-4 sm:pb-2 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base" title={nomeExibicao}>
              {nomeExibicao}
            </h3>
            {distancia !== undefined && (
              <span className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <NavigationArrow size={12} />
                {formatarDistancia(distancia)}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1" title={dados.municipio}>
            <span>{dados.municipio}</span>
            {!temCoordenadas && (
              <span 
                className="inline-flex items-center gap-0.5 text-[10px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full"
                title="Localização indisponível nos dados da SEFAZ"
              >
                <MapPinLine size={10} />
                <span className="hidden sm:inline">Fora do mapa</span>
              </span>
            )}
          </p>
        </div>
        <span className={`fuel-badge ${corCombustivel} flex-shrink-0`}>
          {nomeCombustivel}
        </span>
      </div>

      {/* Preço principal */}
      <div className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-baseline gap-1 sm:gap-2">
          <span className="price-display">{formatarPreco(dados.valor_recente)}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">/litro</span>
        </div>
        
        {/* Variação de preço */}
        <div className="mt-1.5 sm:mt-2 flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <TrendDown size={14} className="sm:w-4 sm:h-4" />
            <span>Mín: {formatarPreco(dados.valor_minimo)}</span>
          </div>
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <TrendUp size={14} className="sm:w-4 sm:h-4" />
            <span>Máx: {formatarPreco(dados.valor_maximo)}</span>
          </div>
        </div>
      </div>

      {/* Informações do estabelecimento */}
      <div className="fuel-card-info px-3 py-2 sm:px-4 sm:py-3 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-start gap-2">
          <MapPin size={16} className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500 sm:w-[18px] sm:h-[18px]" />
          <span className="line-clamp-2">{formatarEndereco() || 'Endereço não informado'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Phone size={16} className="flex-shrink-0 text-gray-400 dark:text-gray-500 sm:w-[18px] sm:h-[18px]" />
          {dados.telefone ? (
            <a
              href={`tel:${dados.telefone.replace(/\D/g, '')}`}
              className="text-blue-600 dark:text-blue-400 hover:underline active:text-blue-800 dark:active:text-blue-300"
            >
              {dados.telefone}
            </a>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">Não informado</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
          <Clock size={16} className="flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
          <span>Atualizado: {formatarData(dados.data_recente)}</span>
        </div>
      </div>

      {/* Link para mapa */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 mt-auto">
        <a
          href={
            temCoordenadas
              ? `https://www.google.com/maps/search/?api=1&query=${dados.latitude},${dados.longitude}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${dados.nome_logradouro}, ${dados.numero_imovel}, ${dados.bairro}, ${dados.municipio}, AL`
                )}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center btn-secondary text-xs sm:text-sm"
        >
          {temCoordenadas ? 'Ver no mapa' : 'Buscar endereço'}
        </a>
      </div>
    </div>
  );
}
