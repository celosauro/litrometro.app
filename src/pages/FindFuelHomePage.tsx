import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { usePrecosCombustiveis } from '../hooks/usePrecosCombustiveis'
import { useGeolocalizacao } from '../hooks/useGeolocalizacao'
import { MapaEstabelecimentos } from '../components/MapaEstabelecimentos'
import { LocationIcon } from '../components/LocationIcon'
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
  const [recentralizarToken, setRecentralizarToken] = useState(0)
  // Dados visíveis no viewport atual do mapa
  const [dadosVisiveis, setDadosVisiveis] = useState<DadosComDistancia[]>([])
  
  const centroidesMunicipiosRef = useRef<Array<{codigo_ibge: string; municipio: string; latitude: number; longitude: number}> | null>(null)

  const { dados } = usePrecosCombustiveis({
    tipoCombustivel: tipoCombustivelSelecionado,

  })

  const { 
    localizacao, 
    carregando: carregandoLocalizacao,
    obterLocalizacao,
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

  const handleLocalizacaoClick = useCallback(() => {
    setRecentralizarToken((valorAtual) => valorAtual + 1)
    obterLocalizacao()
  }, [obterLocalizacao])

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden pb-[calc(84px+env(safe-area-inset-bottom))] sm:pb-0">
      {/* Barra superior de filtros - fora do mapa */}
      <section className="relative z-40 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 sm:px-4 sm:py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-[1fr_1fr_auto] items-center gap-2.5 sm:flex sm:items-center sm:gap-4 lg:gap-5 overflow-visible">
          {/* Município */}
          <select
            value={municipioSelecionado}
            onChange={(e) => handleMunicipioChange(e.target.value)}
            className="w-full min-w-0 sm:flex-none sm:w-[240px] lg:w-[280px] appearance-none px-2.5 py-2 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-700
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
          <div className="w-full min-w-0 sm:flex-none sm:w-[200px] lg:w-[220px]">
            <LayoutSwitcher fullWidth />
          </div>

          {/* Localização */}
          <button
            type="button"
            onClick={handleLocalizacaoClick}
            disabled={carregandoLocalizacao}
            className={`btn-secondary inline-flex h-10 w-10 items-center justify-center rounded-lg sm:rounded-xl sm:ml-auto
              ${localizacao ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700' : ''}
              ${carregandoLocalizacao ? 'opacity-70 cursor-wait' : ''}`}
            aria-label="Centralizar mapa na minha localização"
            title={localizacao ? 'Recentralizar mapa na minha localização' : 'Obter minha localização'}
          >
            <LocationIcon size={18} className={carregandoLocalizacao ? 'animate-pulse' : ''} />
          </button>
        </div>
      </section>

      {/* Seção do Mapa com Filtros sobrepostos */}
      <section className="relative flex-1 min-h-0 z-10 overflow-hidden">
        {/* Mapa */}
        <div className="absolute inset-0">
          <MapaEstabelecimentos
            dados={dadosComDistancia || []}
            localizacao={localizacao}
            recentralizarToken={recentralizarToken}
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

        {/* Tipos de combustível - mobile fixo no rodapé */}
        <section className="sm:hidden fixed bottom-0 left-0 right-0 z-50 min-h-[72px] flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(0,0,0,0.08)]">
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
    </div>
  )
}
