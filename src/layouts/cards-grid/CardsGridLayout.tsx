import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { MagnifyingGlass, Crosshair, MapTrifold } from '@phosphor-icons/react'
import { usePrecosCombustiveis } from '../../hooks/usePrecosCombustiveis'
import { useGeolocalizacao } from '../../hooks/useGeolocalizacao'
import { SeletorTipoCombustivel } from '../../components/FuelTypeSelector'
import { SeletorMunicipio } from '../../components/MunicipioSelector'
import { SkeletonCard } from '../../components/SkeletonCard'
import { EmptyState, EmptyStateAction } from '../../components/EmptyState'
import { calcularNivelPreco } from '../../components/PriceBadge'
import { calcularDistanciaKm } from '../../utils/distancia'
import { trackFuelTypeSelect, trackMunicipalitySelect, trackSearch } from '../../utils/analytics'
import type { TipoCombustivel, PrecoCombustivelResumo } from '../../types'
import { TIPOS_COMBUSTIVEL, MUNICIPIOS_AL } from '../../types'
import { FuelCardGrid } from './FuelCardGrid'
import { MapModal } from './MapModal'

const CODIGO_MACEIO = '2704302'

interface DadosComDistancia extends PrecoCombustivelResumo {
  distancia?: number
}

export function CardsGridLayout() {
  const [tipoCombustivelSelecionado, setTipoCombustivelSelecionado] = useState<TipoCombustivel>(1)
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>(CODIGO_MACEIO)
  const [termoBusca, setTermoBusca] = useState('')
  const [mostrarStatusLocalizacao, setMostrarStatusLocalizacao] = useState(true)
  const [estabelecimentoNoMapa, setEstabelecimentoNoMapa] = useState<DadosComDistancia | null>(null)
  
  const centroidesMunicipiosRef = useRef<Array<{codigo_ibge: string; municipio: string; latitude: number; longitude: number}> | null>(null)

  const { dados, carregando, erro } = usePrecosCombustiveis({
    tipoCombustivel: tipoCombustivelSelecionado,
  })

  const { 
    localizacao, 
    carregando: carregandoLocalizacao, 
    erro: erroLocalizacao,
    obterLocalizacao 
  } = useGeolocalizacao()

  // Oculta tooltips de status após 3 segundos
  useEffect(() => {
    if (localizacao || erroLocalizacao) {
      setMostrarStatusLocalizacao(true)
      const timer = setTimeout(() => setMostrarStatusLocalizacao(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [localizacao, erroLocalizacao])

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
        if (a.valor_recente !== b.valor_recente) {
          return a.valor_recente - b.valor_recente
        }
        const distA = a.distancia ?? Infinity
        const distB = b.distancia ?? Infinity
        return distA - distB
      })
  }, [dadosComDistancia, termoBusca])

  // CNPJ do melhor posto (menor preço)
  const cnpjMelhorPosto = useMemo(() => {
    if (!dadosFiltrados || dadosFiltrados.length === 0) return null
    return dadosFiltrados[0].cnpj
  }, [dadosFiltrados])

  // Array de preços para cálculo de faixas
  const todosPrecos = useMemo(() => {
    if (!dadosFiltrados) return []
    return dadosFiltrados.map(item => item.valor_recente)
  }, [dadosFiltrados])

  // Handlers com tracking de analytics
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

  // Tracking de busca com debounce
  useEffect(() => {
    if (!termoBusca || termoBusca.length < 3) return
    const timer = setTimeout(() => {
      trackSearch(termoBusca, dadosFiltrados?.length || 0)
    }, 1000)
    return () => clearTimeout(timer)
  }, [termoBusca, dadosFiltrados?.length])

  return (
    <div className="flex flex-col flex-1 w-full min-h-0">
      {/* Filtros */}
      <div className="sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm 
                      dark:shadow-gray-900/20 z-40 flex-shrink-0 border-b border-transparent dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
          {/* Seletor de combustível */}
          <SeletorTipoCombustivel
            selecionado={tipoCombustivelSelecionado}
            aoMudar={handleTipoCombustivelChange}
          />

          {/* Filtros adicionais */}
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
            {/* Busca */}
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 sm:w-5 sm:h-5"
              />
              <input
                type="text"
                placeholder="Buscar posto, bairro..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 
                           dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 
                           text-gray-900 dark:text-gray-100 placeholder-gray-400 
                           dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Linha com selects e botões */}
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              {/* Município */}
              <div className="flex-1 sm:flex-none min-w-[120px]">
                <SeletorMunicipio
                  selecionado={municipioSelecionado}
                  aoMudar={handleMunicipioChange}
                />
              </div>

              {/* Botão localização */}
              <button
                onClick={obterLocalizacao}
                disabled={carregandoLocalizacao}
                className={`btn-secondary flex items-center justify-center gap-2 px-3 sm:px-4 ${
                  localizacao 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700' 
                    : ''
                }`}
                aria-label="Obter localização"
                title={localizacao ? 'Localização obtida' : 'Obter minha localização'}
              >
                <Crosshair
                  size={18}
                  className={`sm:w-5 sm:h-5 ${carregandoLocalizacao ? 'animate-pulse' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal - Grid de Cards */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
          {/* Alertas */}
          {(erro || (erroLocalizacao && mostrarStatusLocalizacao) || (localizacao && mostrarStatusLocalizacao)) && (
            <div className="space-y-2 mb-4">
              {erro && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-400 text-sm">{erro}</p>
                </div>
              )}
              {erroLocalizacao && mostrarStatusLocalizacao && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm">📍 {erroLocalizacao}</p>
                </div>
              )}
              {localizacao && mostrarStatusLocalizacao && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-2 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <Crosshair size={16} />
                  <span>Localização obtida</span>
                </div>
              )}
            </div>
          )}

          {/* Header com contagem */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {carregando 
                ? 'Carregando...' 
                : `${dadosFiltrados.length} posto${dadosFiltrados.length !== 1 ? 's' : ''} encontrado${dadosFiltrados.length !== 1 ? 's' : ''}`
              }
            </p>
            
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <MapTrifold size={14} />
              <span>Clique em "Ver no mapa" para localizar</span>
            </div>
          </div>

          {/* Loading state */}
          {carregando && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
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

          {/* Grid de Cards */}
          {!carregando && dadosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dadosFiltrados.map((item) => (
                <FuelCardGrid
                  key={`${item.cnpj}-${item.tipo_combustivel}`}
                  dados={item}
                  distancia={item.distancia}
                  isMelhor={item.cnpj === cnpjMelhorPosto}
                  priceLevel={calcularNivelPreco(item.valor_recente, todosPrecos)}
                  onAbrirMapa={() => setEstabelecimentoNoMapa(item)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal do mapa */}
      <MapModal
        estabelecimento={estabelecimentoNoMapa}
        onClose={() => setEstabelecimentoNoMapa(null)}
      />
    </div>
  )
}
