import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { GasPump } from '@phosphor-icons/react'
import { usePrecosCombustiveis } from '../hooks/usePrecosCombustiveis'
import { useGeolocalizacao } from '../hooks/useGeolocalizacao'
import { MapaEstabelecimentos } from '../components/MapaEstabelecimentos'
import { StationCard } from '../components/StationCard'
import { SkeletonCard } from '../components/SkeletonCard'
import { EmptyState, EmptyStateAction } from '../components/EmptyState'
import { AdBanner } from '../components/AdBanner'
import { calcularDistanciaKm } from '../utils/distancia'
import { trackFuelTypeSelect, trackMunicipalitySelect } from '../utils/analytics'
import type { TipoCombustivel, PrecoCombustivelResumo } from '../types'
import { TIPOS_COMBUSTIVEL, MUNICIPIOS_AL } from '../types'
import { LayoutSwitcher } from '../layouts'

const CODIGO_MACEIO = '2704302'

// Tipos de combustível simplificados para os chips
const FUEL_CHIPS: { id: TipoCombustivel; label: string; shortLabel: string }[] = [
  { id: 1, label: 'Gasolina', shortLabel: 'Gas' },
  { id: 2, label: 'Gasolina Ad.', shortLabel: 'G.Ad' },
  { id: 3, label: 'Etanol', shortLabel: 'Eta' },
  { id: 4, label: 'Diesel', shortLabel: 'Die' },
  { id: 5, label: 'Diesel S10', shortLabel: 'S10' },
  { id: 6, label: 'GNV', shortLabel: 'GNV' },
]

const FUEL_CHIP_INACTIVE_CLASSES = 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
const FUEL_CHIP_ACTIVE_CLASSES = 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/25'

interface DadosComDistancia extends PrecoCombustivelResumo {
  distancia?: number
}

export default function FindFuelHomePage() {
  const [tipoCombustivelSelecionado, setTipoCombustivelSelecionado] = useState<TipoCombustivel>(1)
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>(CODIGO_MACEIO)
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<DadosComDistancia | null>(null)
  // Dados visíveis no viewport atual do mapa
  const [dadosVisiveis, setDadosVisiveis] = useState<DadosComDistancia[]>([])
  
  const centroidesMunicipiosRef = useRef<Array<{codigo_ibge: string; municipio: string; latitude: number; longitude: number}> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { dados, carregando } = usePrecosCombustiveis({
    tipoCombustivel: tipoCombustivelSelecionado,

  })

  const { 
    localizacao, 
  } = useGeolocalizacao()

  // Atualiza município baseado na localização do usuário
  useEffect(() => {
    if (!localizacao) return
    
    const atualizarMunicipio = async () => {
      try {
        if (!centroidesMunicipiosRef.current) {
          const resposta = await fetch('/dados/municipios-centro.json')
          if (resposta.ok) {
            centroidesMunicipiosRef.current = await resposta.json()
          }
        }
        
        const centroides = centroidesMunicipiosRef.current
        if (!centroides || centroides.length === 0) return
        
        let menorDistancia = Infinity
        let municipioMaisProximo = CODIGO_MACEIO
        
        for (const mun of centroides) {
          const dist = calcularDistanciaKm(
            localizacao.latitude,
            localizacao.longitude,
            mun.latitude,
            mun.longitude
          )
          if (dist < menorDistancia) {
            menorDistancia = dist
            municipioMaisProximo = mun.codigo_ibge
          }
        }
        
        setMunicipioSelecionado(municipioMaisProximo)
      } catch (error) {
        console.error('Erro ao buscar município mais próximo:', error)
      }
    }
    
    atualizarMunicipio()
  }, [localizacao])

  // Limpa seleção quando filtros mudam
  useEffect(() => {
    setEstabelecimentoSelecionado(null)
  }, [tipoCombustivelSelecionado, municipioSelecionado])

  // Calcula distância para cada estabelecimento
  const dadosComDistancia: DadosComDistancia[] | undefined = useMemo(() => {
    if (!dados) return undefined
    
    return dados.map(item => {
      let distancia: number | undefined
      
      if (localizacao && item.latitude !== 0 && item.longitude !== 0) {
        distancia = calcularDistanciaKm(
          localizacao.latitude,
          localizacao.longitude,
          item.latitude,
          item.longitude
        )
      }
      
      return { ...item, distancia }
    })
  }, [dados, localizacao])

  // Callback quando o mapa atualiza dados visíveis (filtrados por viewport)
  const handleDadosVisiveis = useCallback((visiveis: DadosComDistancia[]) => {
    setDadosVisiveis(visiveis)
  }, [])

  // Filtra e ordena os dados VISÍVEIS no mapa (para a lista)
  const dadosFiltrados = useMemo(() => {
    if (!dadosVisiveis.length) return []
    
    return dadosVisiveis
      .sort((a, b) => {
        // Ordena por menor preço primeiro
        if (a.valor_recente !== b.valor_recente) {
          return a.valor_recente - b.valor_recente
        }
        // Desempata por distância
        const distA = a.distancia ?? Infinity
        const distB = b.distancia ?? Infinity
        return distA - distB
      })
  }, [dadosVisiveis])

  // CNPJ do melhor posto
  const cnpjMelhorPosto = useMemo(() => {
    if (!dadosFiltrados || dadosFiltrados.length === 0) return null
    return dadosFiltrados[0].cnpj
  }, [dadosFiltrados])

  // Handlers
  const handleTipoCombustivelChange = useCallback((tipo: TipoCombustivel) => {
    setTipoCombustivelSelecionado(tipo)
    trackFuelTypeSelect(TIPOS_COMBUSTIVEL[tipo], tipo)
  }, [])

  const handleMunicipioChange = useCallback((codigo: string) => {
    setMunicipioSelecionado(codigo)
    if (codigo) {
      const nome = MUNICIPIOS_AL[codigo] || codigo
      trackMunicipalitySelect(nome, codigo)
    }
  }, [])

  const handleCardClick = (item: DadosComDistancia) => {
    setEstabelecimentoSelecionado(prev => 
      prev?.cnpj === item.cnpj ? null : item
    )
    // Scroll para o topo do mapa
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const municipioNome = MUNICIPIOS_AL[municipioSelecionado] || 'Alagoas'

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden">
      {/* Barra superior de filtros - fora do mapa */}
      <section className="relative z-40 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 sm:px-4 sm:py-3">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 overflow-visible">
          {/* Município */}
          <select
            value={municipioSelecionado}
            onChange={(e) => handleMunicipioChange(e.target.value)}
            className="w-full min-w-0 sm:w-auto sm:min-w-[180px] appearance-none px-2.5 py-2 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-700
                       text-xs sm:text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600
                       focus:ring-2 focus:ring-brand-500"
            aria-label="Filtrar por município"
          >
            <option value="">Município</option>
            {Object.entries(MUNICIPIOS_AL).map(([codigo, nome]) => (
              <option key={codigo} value={codigo}>{nome}</option>
            ))}
          </select>

          {/* Tipo de visualização */}
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[190px]">
            <LayoutSwitcher fullWidth />
          </div>
        </div>
      </section>

      {/* Seção do Mapa com Filtros sobrepostos */}
      <section className="relative flex-1 min-h-0 sm:h-[45vh] sm:flex-none sm:min-h-[45vh] flex-shrink-0 z-10 overflow-hidden">
        {/* Mapa */}
        <div className="absolute inset-0">
          <MapaEstabelecimentos
            dados={dadosComDistancia || []}
            localizacao={localizacao}
            tipoCombustivel={tipoCombustivelSelecionado}
            estabelecimentoSelecionado={estabelecimentoSelecionado}
            onSelecionarEstabelecimento={handleCardClick}
            municipioSelecionado={municipioSelecionado}
            cnpjMelhor={cnpjMelhorPosto}
            onDadosVisiveis={handleDadosVisiveis}
            className="w-full h-full"
          />
        </div>

      </section>

        {/* Tipos de combustível - mobile fora do mapa */}
        <section className="sm:hidden flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FUEL_CHIPS.map(fuel => (
              <button
                key={fuel.id}
                onClick={() => handleTipoCombustivelChange(fuel.id)}
                className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all
                           ${tipoCombustivelSelecionado === fuel.id
                             ? FUEL_CHIP_ACTIVE_CLASSES
                             : FUEL_CHIP_INACTIVE_CLASSES
                           }`}
              >
                {fuel.label}
              </button>
            ))}
          </div>
        </section>

      {/* Barra de Chips de Combustível - Separada do mapa */}
      <div className="hidden sm:block flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 overflow-x-auto relative z-30">
        <div className="flex gap-2 scrollbar-hide max-w-7xl mx-auto">
          {FUEL_CHIPS.map(fuel => (
            <button
              key={fuel.id}
              onClick={() => handleTipoCombustivelChange(fuel.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all
                         ${tipoCombustivelSelecionado === fuel.id
                           ? 'bg-brand-600 text-white shadow-md'
                           : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                         }`}
            >
              {fuel.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Postos (somente desktop/tablet) */}
      <section ref={listRef} className="hidden sm:block flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6">
          {/* Banner de Anúncio - Oculto no mobile, placeholder só em desktop */}
          <div className="hidden sm:block mb-4">
            <AdBanner slot="horizontal" adSlotId="9777713471" showPlaceholder={false} />
          </div>

          {/* Header da lista */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Postos em {municipioNome}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {carregando 
                  ? 'Carregando...' 
                  : `${dadosFiltrados.length} resultado${dadosFiltrados.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>

            {/* Ícone do combustível selecionado */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100 dark:bg-brand-900/30">
              <GasPump size={16} weight="fill" className="text-brand-600 dark:text-brand-400" />
              <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
                {TIPOS_COMBUSTIVEL[tipoCombustivelSelecionado]}
              </span>
            </div>
          </div>

          {/* Loading */}
          {carregando && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!carregando && dadosFiltrados.length === 0 && (
            <EmptyState 
              variant="empty"
              action={
                municipioSelecionado !== '' ? (
                  <EmptyStateAction onClick={() => setMunicipioSelecionado('')}>
                    Ver todos os municípios
                  </EmptyStateAction>
                ) : undefined
              }
            />
          )}

          {/* Grid de cards */}
          {!carregando && dadosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {dadosFiltrados.map((item) => (
                <StationCard
                  key={`${item.cnpj}-${item.tipo_combustivel}`}
                  dados={item}
                  distancia={item.distancia}
                  isMelhor={item.cnpj === cnpjMelhorPosto}
                  localizacaoUsuario={localizacao}
                  onClick={() => handleCardClick(item)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
