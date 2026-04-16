import { MapPin, Phone, NavigationArrow, Star, MapPinSimple } from '@phosphor-icons/react'
import type { PrecoCombustivelResumo, TipoCombustivel } from '../../types'
import { TIPOS_COMBUSTIVEL, CORES_COMBUSTIVEL } from '../../types'
import { formatarDistancia } from '../../utils/distancia'
import { PriceBadge, type PriceLevel } from '../../components/PriceBadge'

interface FuelCardGridProps {
  dados: PrecoCombustivelResumo
  distancia?: number
  isMelhor?: boolean
  priceLevel?: PriceLevel
  onAbrirMapa?: () => void
}

export function FuelCardGrid({ dados, distancia, isMelhor, priceLevel, onAbrirMapa }: FuelCardGridProps) {
  const tipoCombustivel = dados.tipo_combustivel as TipoCombustivel
  const nomeCombustivel = TIPOS_COMBUSTIVEL[tipoCombustivel]
  const corCombustivel = CORES_COMBUSTIVEL[tipoCombustivel]

  const formatarPreco = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 3,
    })
  }

  const nomeExibicao = dados.nome_fantasia || dados.razao_social
  const temCoordenadas = dados.latitude !== 0 && dados.longitude !== 0

  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (temCoordenadas && onAbrirMapa) {
      onAbrirMapa()
    }
  }

  return (
    <article
      className={`relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 
                  shadow-sm hover:shadow-lg transition-all duration-200
                  border-2 ${
                    isMelhor
                      ? 'border-yellow-400 dark:border-yellow-500 ring-2 ring-yellow-200/50 dark:ring-yellow-500/20'
                      : 'border-gray-100 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-700'
                  }`}
    >
      {/* Banner melhor preço */}
      {isMelhor && (
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[11px] font-bold 
                        px-3 py-1 flex items-center justify-center gap-1.5">
          <Star size={12} weight="fill" />
          <span>Melhor Preço</span>
          <Star size={12} weight="fill" />
        </div>
      )}

      <div className="p-4">
        {/* Header: nome + badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2" 
                title={nomeExibicao}>
              {nomeExibicao}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {dados.municipio}
            </p>
          </div>
          
          {/* Badge de preço/distância */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {priceLevel && <PriceBadge level={priceLevel} size="sm" />}
            {distancia !== undefined && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-600 dark:text-brand-400 
                               bg-brand-50 dark:bg-brand-900/50 px-1.5 py-0.5 rounded-full">
                <NavigationArrow size={10} />
                {formatarDistancia(distancia)}
              </span>
            )}
          </div>
        </div>

        {/* Preço grande */}
        <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 
                        dark:from-gray-700/50 dark:to-gray-700/30">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {formatarPreco(dados.valor_recente)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/L</span>
            </div>
            <span className={`fuel-badge ${corCombustivel} text-[10px] px-2 py-0.5`}>
              {nomeCombustivel}
            </span>
          </div>

          {/* Min/Max discreto */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 dark:text-gray-400">
            <span>Mín: {formatarPreco(dados.valor_minimo)}</span>
            <span>Máx: {formatarPreco(dados.valor_maximo)}</span>
          </div>
        </div>

        {/* Info compacta */}
        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="flex-shrink-0 mt-0.5 text-gray-400" />
            <span className="line-clamp-1">
              {dados.nome_logradouro ? `${dados.nome_logradouro}${dados.numero_imovel ? `, ${dados.numero_imovel}` : ''} - ${dados.bairro}` : 'Endereço não informado'}
            </span>
          </div>

          {dados.telefone && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="flex-shrink-0 text-gray-400" />
              <a
                href={`tel:${dados.telefone.replace(/\D/g, '')}`}
                className="text-brand-600 dark:text-brand-400 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {dados.telefone}
              </a>
            </div>
          )}
        </div>

        {/* Botão ver no mapa */}
        {temCoordenadas && (
          <button
            onClick={handleMapClick}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 
                       rounded-xl text-sm font-medium
                       bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50
                       text-brand-700 dark:text-brand-300
                       transition-colors"
          >
            <MapPinSimple size={16} weight="fill" />
            Ver no mapa
          </button>
        )}
      </div>
    </article>
  )
}
