import { GasPump, MapPin, Phone, NavigationArrow, Star, Clock } from '@phosphor-icons/react'
import type { PrecoCombustivelResumo, TipoCombustivel } from '../types'
import { TIPOS_COMBUSTIVEL } from '../types'
import { formatarDistancia } from '../utils/distancia'

interface StationCardProps {
  dados: PrecoCombustivelResumo
  distancia?: number
  isMelhor?: boolean
  onClick?: () => void
}

// Cores mais vibrantes para os tipos de combustível
const FUEL_COLORS: Record<TipoCombustivel, { bg: string; text: string; icon: string }> = {
  1: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-500' },      // Gasolina Comum
  2: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'text-orange-500' },   // Gasolina Aditivada
  3: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-500' },      // Álcool
  4: { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'text-slate-500' },      // Diesel Comum
  5: { bg: 'bg-zinc-200', text: 'text-zinc-700', icon: 'text-zinc-600' },         // Diesel S10
  6: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-500' },         // GNV
}

export function StationCard({ dados, distancia, isMelhor, onClick }: StationCardProps) {
  const tipoCombustivel = dados.tipo_combustivel as TipoCombustivel
  const nomeCombustivel = TIPOS_COMBUSTIVEL[tipoCombustivel]
  const cores = FUEL_COLORS[tipoCombustivel] || FUEL_COLORS[1]

  const formatarPreco = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })
  }

  const nomeExibicao = dados.nome_fantasia || dados.razao_social
  const enderecoCurto = `${dados.bairro}${dados.municipio ? `, ${dados.municipio}` : ''}`

  return (
    <article 
      onClick={onClick}
      className={`relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm 
                  hover:shadow-lg transition-all duration-300 cursor-pointer group
                  border border-gray-100 dark:border-gray-700
                  ${isMelhor ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
    >
      {/* Badge Melhor Preço */}
      {isMelhor && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold">
            <Star size={12} weight="fill" />
            <span>Melhor</span>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header: Ícone + Info do posto */}
        <div className="flex items-start gap-3 mb-4">
          {/* Ícone da bomba */}
          <div className={`w-12 h-12 rounded-xl ${cores.bg} flex items-center justify-center flex-shrink-0`}>
            <GasPump size={24} weight="fill" className={cores.icon} />
          </div>
          
          {/* Info do posto */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {nomeExibicao}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
              <MapPin size={12} weight="fill" />
              <span className="truncate">{enderecoCurto}</span>
            </p>
            
            {/* Distância */}
            {distancia !== undefined && (
              <div className="flex items-center gap-1 mt-1.5">
                <NavigationArrow size={12} className="text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                  {formatarDistancia(distancia)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Preço em destaque */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Preço por litro</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">R$</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {formatarPreco(dados.valor_recente)}
                </span>
              </div>
            </div>
            
            {/* Badge do combustível */}
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${cores.bg} ${cores.text}`}>
              {nomeCombustivel.split(' ')[0]}
            </span>
          </div>

          {/* Variação de preço */}
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex-1">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Mínimo</span>
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                R$ {formatarPreco(dados.valor_minimo)}
              </span>
            </div>
            <div className="flex-1 text-right">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Máximo</span>
              <span className="text-xs font-medium text-red-500 dark:text-red-400">
                R$ {formatarPreco(dados.valor_maximo)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Data e telefone */}
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>
              {new Date(dados.data_recente).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short' 
              })}
            </span>
          </div>
          
          {dados.telefone && (
            <a 
              href={`tel:${dados.telefone.replace(/\D/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <Phone size={12} weight="fill" />
              <span className="hidden sm:inline">{dados.telefone}</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
