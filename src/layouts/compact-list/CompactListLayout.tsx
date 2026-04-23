import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Crosshair, CaretUp, CaretDown } from '@phosphor-icons/react'
import { usePrecosCombustiveis } from '../../hooks/usePrecosCombustiveis'
import { useGeolocalizacao } from '../../hooks/useGeolocalizacao'
import { EmptyState, EmptyStateAction } from '../../components/EmptyState'
import { calcularNivelPreco } from '../../components/PriceBadge'
import { calcularDistanciaKm } from '../../utils/distancia'
import { trackFuelTypeSelect, trackMunicipalitySelect } from '../../utils/analytics'
import type { TipoCombustivel, PrecoCombustivelResumo } from '../../types'
import { TIPOS_COMBUSTIVEL, MUNICIPIOS_AL } from '../../types'
import { CompactRow } from './CompactRow'
import { MapModal } from '../cards-grid/MapModal'
import { LayoutSwitcher } from '../LayoutSwitcher'

const CODIGO_MACEIO = '2704302'

const FUEL_CHIPS: { id: TipoCombustivel; label: string }[] = [
  { id: 1, label: 'Gasolina' },
  { id: 2, label: 'Gasolina Ad.' },
  { id: 3, label: 'Etanol' },
  { id: 4, label: 'Diesel' },
  { id: 5, label: 'Diesel S10' },
  { id: 6, label: 'GNV' },
]

const FUEL_CHIP_INACTIVE_CLASSES = 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
const FUEL_CHIP_ACTIVE_CLASSES = 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/25'

type SortField = 'nome' | 'preco' | 'distancia'
type SortOrder = 'asc' | 'desc'

interface DadosComDistancia extends PrecoCombustivelResumo {
  distancia?: number
}

export function CompactListLayout() {
  const [tipoCombustivelSelecionado, setTipoCombustivelSelecionado] = useState<TipoCombustivel>(1)
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>(CODIGO_MACEIO)
  const [mostrarStatusLocalizacao, setMostrarStatusLocalizacao] = useState(true)
  const [estabelecimentoNoMapa, setEstabelecimentoNoMapa] = useState<DadosComDistancia | null>(null)
  const [sortField, setSortField] = useState<SortField>('preco')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  
  const centroidesMunicipiosRef = useRef<Array<{codigo_ibge: string; municipio: string; latitude: number; longitude: number}> | null>(null)

  const { dados, carregando, erro } = usePrecosCombustiveis({
    tipoCombustivel: tipoCombustivelSelecionado,

  })

  const { 
    localizacao, 
    erro: erroLocalizacao,
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
    
    const filtrados = [...dadosComDistancia]

    // Ordenação
    filtrados.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'nome':
          comparison = (a.nome_fantasia || a.razao_social).localeCompare(b.nome_fantasia || b.razao_social)
          break
        case 'preco':
          comparison = a.valor_recente - b.valor_recente
          break
        case 'distancia': {
          const distA = a.distancia ?? Infinity
          const distB = b.distancia ?? Infinity
          comparison = distA - distB
          break
        }
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtrados
  }, [dadosComDistancia, sortField, sortOrder])

  // CNPJ do melhor posto (menor preço)
  const cnpjMelhorPosto = useMemo(() => {
    if (!dadosFiltrados || dadosFiltrados.length === 0) return null
    const ordenadoPorPreco = [...dadosFiltrados].sort((a, b) => a.valor_recente - b.valor_recente)
    return ordenadoPorPreco[0].cnpj
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

  // Handler de ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Componente de header de coluna ordenável
  const SortHeader = ({ field, children, className = '' }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <th 
      className={`px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 
                  uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 
                  transition-colors select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortOrder === 'asc' 
            ? <CaretUp size={14} weight="bold" /> 
            : <CaretDown size={14} weight="bold" />
        )}
      </div>
    </th>
  )

  return (
    <div className="flex flex-col flex-1 w-full min-h-0">
      {/* Filtros */}
      <div className="sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm dark:shadow-gray-900/20 z-40 flex-shrink-0 border-b border-transparent dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 py-2 sm:px-4 sm:py-3 grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
          <select
            value={municipioSelecionado}
            onChange={(e) => handleMunicipioChange(e.target.value)}
            className="w-full min-w-0 sm:w-auto sm:min-w-[180px] appearance-none px-2.5 py-2 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-500"
            aria-label="Filtrar por município"
          >
            <option value="">Município</option>
            {Object.entries(MUNICIPIOS_AL).map(([codigo, nome]) => (
              <option key={codigo} value={codigo}>{nome}</option>
            ))}
          </select>

          <div className="w-full min-w-0 sm:w-auto sm:min-w-[190px]">
            <LayoutSwitcher fullWidth />
          </div>
        </div>

        <div className="sm:hidden border-t border-gray-100 dark:border-gray-700 px-3 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FUEL_CHIPS.map(fuel => (
              <button
                key={fuel.id}
                onClick={() => handleTipoCombustivelChange(fuel.id)}
                className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  tipoCombustivelSelecionado === fuel.id ? FUEL_CHIP_ACTIVE_CLASSES : FUEL_CHIP_INACTIVE_CLASSES
                }`}
              >
                {fuel.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden sm:block border-t border-gray-100 dark:border-gray-700 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-7xl mx-auto">
            {FUEL_CHIPS.map(fuel => (
              <button
                key={fuel.id}
                onClick={() => handleTipoCombustivelChange(fuel.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  tipoCombustivelSelecionado === fuel.id
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {fuel.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo principal - Tabela */}
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
          </div>

          {/* Loading state */}
          {carregando && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-100 dark:bg-gray-700" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 border-t border-gray-100 dark:border-gray-700 flex items-center px-4 gap-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 ml-auto" />
                  </div>
                ))}
              </div>
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

          {/* Tabela */}
          {!carregando && dadosFiltrados.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="w-8 px-2 py-3" />
                      <SortHeader field="nome">Posto</SortHeader>
                      <SortHeader field="preco" className="text-right">Preço</SortHeader>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                        Min/Máx
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                        Tipo
                      </th>
                      <SortHeader field="distancia" className="text-right">Dist.</SortHeader>
                      <th className="px-3 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {dadosFiltrados.map((item) => (
                      <CompactRow
                        key={`${item.cnpj}-${item.tipo_combustivel}`}
                        dados={item}
                        distancia={item.distancia}
                        isMelhor={item.cnpj === cnpjMelhorPosto}
                        priceLevel={calcularNivelPreco(item.valor_recente, todosPrecos)}
                        onAbrirMapa={() => setEstabelecimentoNoMapa(item)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
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
