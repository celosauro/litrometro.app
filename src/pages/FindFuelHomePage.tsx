import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { MagnifyingGlass, Crosshair, FunnelSimple, CaretDown, X, GasPump } from '@phosphor-icons/react'
import { usePrecosCombustiveis } from '../hooks/usePrecosCombustiveis'
import { useGeolocalizacao } from '../hooks/useGeolocalizacao'
import { MapaEstabelecimentos } from '../components/MapaEstabelecimentos'
import { StationCard } from '../components/StationCard'
import { SkeletonCard } from '../components/SkeletonCard'
import { EmptyState, EmptyStateAction } from '../components/EmptyState'
import { AdBanner } from '../components/AdBanner'
import { calcularDistanciaKm } from '../utils/distancia'
import { trackFuelTypeSelect, trackMunicipalitySelect, trackSearch } from '../utils/analytics'
import type { TipoCombustivel, PrecoCombustivelResumo } from '../types'
import { TIPOS_COMBUSTIVEL, MUNICIPIOS_AL } from '../types'

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

interface DadosComDistancia extends PrecoCombustivelResumo {
  distancia?: number
}

export default function FindFuelHomePage() {
  const [tipoCombustivelSelecionado, setTipoCombustivelSelecionado] = useState<TipoCombustivel>(1)
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>(CODIGO_MACEIO)
  const [termoBusca, setTermoBusca] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<DadosComDistancia | null>(null)
  
  const centroidesMunicipiosRef = useRef<Array<{codigo_ibge: string; municipio: string; latitude: number; longitude: number}> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { dados, carregando } = usePrecosCombustiveis({
    tipoCombustivel: tipoCombustivelSelecionado,
    codigoIBGE: municipioSelecionado || undefined,
  })

  const { 
    localizacao, 
    carregando: carregandoLocalizacao, 
    obterLocalizacao 
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
  }, [tipoCombustivelSelecionado, municipioSelecionado, termoBusca])

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

  // Filtra e ordena os dados
  const dadosFiltrados = useMemo(() => {
    if (!dadosComDistancia) return []
    
    return dadosComDistancia
      .filter((item) => {
        if (!termoBusca) return true
        const busca = termoBusca.toLowerCase()
        return (
          item.nome_fantasia.toLowerCase().includes(busca) ||
          item.razao_social.toLowerCase().includes(busca) ||
          item.bairro.toLowerCase().includes(busca)
        )
      })
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
  }, [dadosComDistancia, termoBusca])

  // CNPJ do melhor posto
  const cnpjMelhorPosto = useMemo(() => {
    if (!dadosFiltrados || dadosFiltrados.length === 0) return null
    return dadosFiltrados[0].cnpj
  }, [dadosFiltrados])

  // Handlers
  const handleTipoCombustivelChange = useCallback((tipo: TipoCombustivel) => {
    setTipoCombustivelSelecionado(tipo)
    setMostrarFiltros(false) // Fecha o painel de filtros
    trackFuelTypeSelect(TIPOS_COMBUSTIVEL[tipo], tipo)
  }, [])

  const handleMunicipioChange = useCallback((codigo: string) => {
    setMunicipioSelecionado(codigo)
    setMostrarFiltros(false) // Fecha o painel de filtros
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

  // Tracking de busca com debounce
  useEffect(() => {
    if (!termoBusca || termoBusca.length < 3) return
    const timer = setTimeout(() => {
      trackSearch(termoBusca, dadosFiltrados?.length || 0)
    }, 1000)
    return () => clearTimeout(timer)
  }, [termoBusca, dadosFiltrados?.length])

  const municipioNome = MUNICIPIOS_AL[municipioSelecionado] || 'Alagoas'

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden">
      {/* Seção do Mapa com Filtros sobrepostos */}
      <section className="relative h-[40vh] sm:h-[45vh] flex-shrink-0 z-10 overflow-hidden">
        {/* Mapa */}
        <div className="absolute inset-0">
          <MapaEstabelecimentos
            dados={dadosFiltrados}
            localizacao={localizacao}
            tipoCombustivel={tipoCombustivelSelecionado}
            estabelecimentoSelecionado={estabelecimentoSelecionado}
            onSelecionarEstabelecimento={handleCardClick}
            municipioSelecionado={municipioSelecionado}
            cnpjMelhor={cnpjMelhorPosto}
            className="w-full h-full"
          />
        </div>

        {/* Overlays do mapa */}
        <div className="absolute inset-x-0 top-0 p-3 sm:p-4 z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Barra de busca */}
            <div className="flex-1 relative">
              <MagnifyingGlass 
                size={18} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                placeholder="Buscar posto ou bairro..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-gray-800 
                           text-sm text-gray-900 dark:text-white placeholder-gray-400
                           shadow-lg border-0 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              {termoBusca && (
                <button 
                  onClick={() => setTermoBusca('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Botão filtros */}
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`p-3 rounded-2xl shadow-lg transition-all
                         ${mostrarFiltros 
                           ? 'bg-brand-600 text-white' 
                           : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                         }`}
            >
              <FunnelSimple size={20} weight="bold" />
            </button>

            {/* Botão localização */}
            <button
              onClick={obterLocalizacao}
              disabled={carregandoLocalizacao}
              className={`p-3 rounded-2xl shadow-lg transition-all
                         ${localizacao 
                           ? 'bg-brand-600 text-white' 
                           : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                         }`}
            >
              <Crosshair size={20} weight="bold" className={carregandoLocalizacao ? 'animate-pulse' : ''} />
            </button>
          </div>
        </div>

        {/* Painel de filtros expandido */}
        {mostrarFiltros && (
          <div className="absolute inset-x-0 top-[68px] sm:top-[76px] p-3 z-30 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 pointer-events-auto border border-gray-100 dark:border-gray-700">
              {/* Município */}
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Município
                </label>
                <div className="relative">
                  <select
                    value={municipioSelecionado}
                    onChange={(e) => {
                      handleMunicipioChange(e.target.value)
                      setMostrarFiltros(false)
                    }}
                    className="w-full appearance-none pl-3 pr-10 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 
                               text-sm text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Todos os municípios</option>
                    {Object.entries(MUNICIPIOS_AL).map(([codigo, nome]) => (
                      <option key={codigo} value={codigo}>{nome}</option>
                    ))}
                  </select>
                  <CaretDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Chips de combustível */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Tipo de Combustível
                </label>
                <div className="flex flex-wrap gap-2">
                  {FUEL_CHIPS.map(fuel => (
                    <button
                      key={fuel.id}
                      onClick={() => {
                        handleTipoCombustivelChange(fuel.id)
                        setMostrarFiltros(false)
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                 ${tipoCombustivelSelecionado === fuel.id
                                   ? 'bg-brand-600 text-white shadow-md'
                                   : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                 }`}
                    >
                      {fuel.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Barra de Chips de Combustível - Separada do mapa */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 overflow-x-auto relative z-30">
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

      {/* Lista de Postos */}
      <section ref={listRef} className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!carregando && dadosFiltrados.length === 0 && (
            <EmptyState 
              variant={termoBusca ? 'no-results' : 'empty'}
              action={
                termoBusca ? (
                  <EmptyStateAction onClick={() => setTermoBusca('')}>
                    Limpar busca
                  </EmptyStateAction>
                ) : municipioSelecionado !== '' ? (
                  <EmptyStateAction onClick={() => setMunicipioSelecionado('')}>
                    Ver todos os municípios
                  </EmptyStateAction>
                ) : undefined
              }
            />
          )}

          {/* Grid de cards */}
          {!carregando && dadosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dadosFiltrados.map((item) => (
                <StationCard
                  key={`${item.cnpj}-${item.tipo_combustivel}`}
                  dados={item}
                  distancia={item.distancia}
                  isMelhor={item.cnpj === cnpjMelhorPosto}
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
