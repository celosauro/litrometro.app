import { NavigationArrow, MapPin, Star, Phone } from '@phosphor-icons/react'
import type { PrecoCombustivelResumo, TipoCombustivel } from '../../types'
import { TIPOS_COMBUSTIVEL, CORES_COMBUSTIVEL } from '../../types'
import { formatarDistancia } from '../../utils/distancia'
import { PriceBadge, type PriceLevel } from '../../components/PriceBadge'

interface CompactRowProps {
  dados: PrecoCombustivelResumo
  distancia?: number
  isMelhor?: boolean
  priceLevel?: PriceLevel
  onAbrirMapa?: () => void
}

export function CompactRow({ dados, distancia, isMelhor, priceLevel, onAbrirMapa }: CompactRowProps) {
  const tipoCombustivel = dados.tipo_combustivel as TipoCombustivel
  const nomeCombustivel = TIPOS_COMBUSTIVEL[tipoCombustivel]
  const corCombustivel = CORES_COMBUSTIVEL[tipoCombustivel]
  
  const temCoordenadas = dados.latitude !== 0 && dados.longitude !== 0

  const formatarPreco = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 3,
    })
  }

  const nomeExibicao = dados.nome_fantasia || dados.razao_social
  const enderecoCurto = dados.bairro || dados.nome_logradouro || dados.municipio

  return (
    <tr 
      className={`group hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer
                  ${isMelhor ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
      onClick={temCoordenadas ? onAbrirMapa : undefined}
    >
      {/* Destaque melhor preço */}
      <td className="w-8 px-2 py-2.5">
        {isMelhor && (
          <span title="Melhor preço">
            <Star size={18} weight="fill" className="text-yellow-500" />
          </span>
        )}
      </td>

      {/* Nome do posto */}
      <td className="px-3 py-2.5 max-w-[200px]">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white truncate text-sm" title={nomeExibicao}>
            {nomeExibicao}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate block" title={enderecoCurto}>
          {enderecoCurto}
        </span>
      </td>

      {/* Preço */}
      <td className="px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="font-bold text-gray-900 dark:text-white text-base tabular-nums">
            {formatarPreco(dados.valor_recente)}
          </span>
          {priceLevel && <PriceBadge level={priceLevel} size="sm" showIcon={false} />}
        </div>
      </td>

      {/* Variação min/max */}
      <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">
        <div className="flex flex-col items-end tabular-nums">
          <span className="text-green-600 dark:text-green-400">{formatarPreco(dados.valor_minimo)}</span>
          <span className="text-red-600 dark:text-red-400">{formatarPreco(dados.valor_maximo)}</span>
        </div>
      </td>

      {/* Badge combustível */}
      <td className="px-3 py-2.5 hidden sm:table-cell">
        <span className={`fuel-badge ${corCombustivel} text-[10px] px-2 py-0.5`}>
          {nomeCombustivel}
        </span>
      </td>

      {/* Distância */}
      <td className="px-3 py-2.5 text-right">
        {distancia !== undefined ? (
          <span className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400">
            <NavigationArrow size={12} />
            {formatarDistancia(distancia)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* Ações */}
      <td className="px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {temCoordenadas && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAbrirMapa?.()
              }}
              className="p-1.5 rounded-md hover:bg-brand-100 dark:hover:bg-brand-800 
                         text-brand-600 dark:text-brand-400 transition-colors"
              title="Ver no mapa"
            >
              <MapPin size={16} weight="fill" />
            </button>
          )}
          {dados.telefone && (
            <a
              href={`tel:${dados.telefone.replace(/\D/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 
                         text-green-600 dark:text-green-400 transition-colors"
              title={`Ligar: ${dados.telefone}`}
            >
              <Phone size={16} weight="fill" />
            </a>
          )}
        </div>
      </td>
    </tr>
  )
}
