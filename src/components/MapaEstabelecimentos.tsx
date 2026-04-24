import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Map,
  Marker,
  NavigationControl,
  ScaleControl,
  Source,
  Layer,
} from 'react-map-gl/maplibre';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';

import PinPreco from './PinPreco';
import { StationCard } from './StationCard';
import { trackStationView } from '../utils/analytics';
import type { PrecoCombustivelResumo, TipoCombustivel } from '../types';
import { TIPOS_COMBUSTIVEL } from '../types';
import { useTema } from '../contexts/TemaContext';

// Tiles gratuitos do CartoCDN - suporta tema escuro
const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
} as const;

// Centro de Alagoas (fallback quando não há localização)
const CENTRO_ALAGOAS = {
  latitude: -9.57,
  longitude: -36.78,
  zoom: 7,
};

// Layers for clustering
const clusterLayer: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'postos',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#22c55e', 10, '#16a34a', 30, '#15803d'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff',
  },
};

const clusterCountLayer: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'postos',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['Open Sans Bold'],
    'text-size': 14,
  },
  paint: {
    'text-color': '#ffffff',
  },
};

interface DadosComDistancia extends PrecoCombustivelResumo {
  distancia?: number;
}

interface MapaEstabelecimentosProps {
  dados: DadosComDistancia[];
  localizacao?: { latitude: number; longitude: number } | null;
  recentralizarToken?: number;
  tipoCombustivel: TipoCombustivel;
  estabelecimentoSelecionado?: DadosComDistancia | null;
  onSelecionarEstabelecimento?: (item: DadosComDistancia) => void;
  municipioSelecionado?: string;
  cnpjMelhor?: string | null;
  className?: string;
  // Callback quando dados visíveis mudam (filtrados por bounds)
  onDadosVisiveis?: (dados: DadosComDistancia[]) => void;
}

// Cache dos centros dos municípios (carregado uma vez)
let centrosMunicipiosCache: Array<{codigo_ibge: string; latitude: number; longitude: number}> | null = null;

async function carregarCentrosMunicipios() {
  if (centrosMunicipiosCache) return centrosMunicipiosCache;
  try {
    const resp = await fetch('/dados/municipios-centro.json');
    if (resp.ok) {
      centrosMunicipiosCache = await resp.json();
    }
  } catch (e) {
    console.error('Erro ao carregar centros dos municípios:', e);
  }
  return centrosMunicipiosCache;
}

export function MapaEstabelecimentos({ 
  dados, 
  localizacao, 
  recentralizarToken,
  tipoCombustivel,
  estabelecimentoSelecionado,
  onSelecionarEstabelecimento,
  municipioSelecionado,
  cnpjMelhor,
  className = '',
  onDadosVisiveis,
}: MapaEstabelecimentosProps) {
  const { temaAtual } = useTema();
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<DadosComDistancia | null>(null);
  const [mapCarregado, setMapCarregado] = useState(false);
  // Guarda o último município para o qual o mapa voou
  const ultimoFlyToRef = useRef<string | null>(null);
  // Guarda o timestamp da última localização processada
  const ultimoTimestampLocRef = useRef<number | null>(null);
  // Zoom atual para decidir entre clusters e markers individuais
  const [zoomAtual, setZoomAtual] = useState(7);
  // Limite de zoom para mostrar markers individuais (acima disso, sem cluster)
  const ZOOM_PARA_MARKERS = 11;
  // Contagem de postos visíveis no viewport atual
  const [contadorVisiveis, setContadorVisiveis] = useState(0);

  // Filtra dados por bounds do mapa e notifica parent
  const atualizarDadosVisiveis = useCallback(() => {
    const map = mapRef.current;
    if (!map || !dados.length) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const visiveis = dados.filter(item => {
      if (item.latitude === 0 && item.longitude === 0) return false;
      return (
        item.longitude >= bounds.getWest() &&
        item.longitude <= bounds.getEast() &&
        item.latitude >= bounds.getSouth() &&
        item.latitude <= bounds.getNorth()
      );
    });

    setContadorVisiveis(visiveis.length);
    onDadosVisiveis?.(visiveis);
  }, [dados, onDadosVisiveis]);

  // Callback quando o mapa carrega
  const handleMapLoad = useCallback(() => {
    setMapCarregado(true);
  }, []);

  // Handler para movimento do mapa
  const handleMoveEnd = useCallback((evt: ViewStateChangeEvent) => {
    setZoomAtual(evt.viewState.zoom);
    atualizarDadosVisiveis();
  }, [atualizarDadosVisiveis]);

  // Atualiza dados visíveis quando dados mudam OU mapa carrega
  useEffect(() => {
    if (mapCarregado && dados.length) {
      // Delay pequeno para garantir que o mapa renderizou
      const timer = setTimeout(() => {
        atualizarDadosVisiveis();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dados, mapCarregado, atualizarDadosVisiveis]);

  // Voa para o estabelecimento selecionado
  // Usa cnpj como dependência para garantir detecção de mudança
  const estabelecimentoCnpj = estabelecimentoSelecionado?.cnpj;
  useEffect(() => {
    if (!mapCarregado) return;
    if (!estabelecimentoSelecionado) return;
    if (estabelecimentoSelecionado.latitude === 0 && estabelecimentoSelecionado.longitude === 0) return;
    
    // Voa para a localização do estabelecimento
    mapRef.current?.flyTo({
      center: [estabelecimentoSelecionado.longitude, estabelecimentoSelecionado.latitude],
      zoom: 16,
      duration: 800,
      essential: true,
    });
    setPopupInfo(estabelecimentoSelecionado);
  }, [estabelecimentoCnpj, mapCarregado, estabelecimentoSelecionado]);

  // Voa para a localização do usuário quando ela é obtida
  useEffect(() => {
    if (!mapCarregado) return;
    if (!localizacao) return;
    
    // Verifica se é uma nova solicitação de localização (usando timestamp)
    const timestamp = (localizacao as { timestamp?: number }).timestamp;
    if (timestamp && ultimoTimestampLocRef.current === timestamp) {
      return;
    }
    
    // Salva o timestamp atual
    if (timestamp) {
      ultimoTimestampLocRef.current = timestamp;
    }
    
    // Voa para a localização do usuário
    mapRef.current?.flyTo({
      center: [localizacao.longitude, localizacao.latitude],
      zoom: 13,
      duration: 1000,
      essential: true,
    });
  }, [localizacao, mapCarregado]);

  // Recentraliza explicitamente quando solicitado pelo botão de localização.
  useEffect(() => {
    if (!mapCarregado || !localizacao) return;

    mapRef.current?.flyTo({
      center: [localizacao.longitude, localizacao.latitude],
      zoom: 13,
      duration: 900,
      essential: true,
    });
  }, [recentralizarToken, localizacao, mapCarregado]);

  // Voa para o centro do município quando o município muda
  useEffect(() => {
    if (!mapCarregado) return;
    
    // Se não tem município selecionado, não faz nada
    if (!municipioSelecionado) return;
    
    // Cria uma chave única para este município
    const chaveAtual = `municipio_${municipioSelecionado}`;
    
    // Se já voamos para este município, não voa novamente
    if (ultimoFlyToRef.current === chaveAtual) {
      return;
    }
    
    // Função assíncrona para voar para o centro do município
    const voarParaCentro = async () => {
      const centros = await carregarCentrosMunicipios();
      const centroMunicipio = centros?.find(c => c.codigo_ibge === municipioSelecionado);
      
      if (!centroMunicipio) return;
      
      const map = mapRef.current;
      if (map) {
        map.flyTo({
          center: [centroMunicipio.longitude, centroMunicipio.latitude],
          zoom: 12,
          duration: 1000,
          essential: true,
        });
        
        // Marca que já voamos para este município
        ultimoFlyToRef.current = chaveAtual;
      }
      
      // Fecha popup ao mudar município
      setPopupInfo(null);
    };
    
    voarParaCentro();
  }, [mapCarregado, municipioSelecionado]);

  // Calcula o centro inicial do mapa
  const viewInicial = useMemo(() => {
    if (localizacao) {
      return {
        latitude: localizacao.latitude,
        longitude: localizacao.longitude,
        zoom: 13,
      };
    }
    
    // Default: centro de Alagoas
    return CENTRO_ALAGOAS;
  }, [localizacao]);

  // Cria GeoJSON para clustering
  const geojsonData = useMemo(() => {
    const features = dados
      .filter(item => item.latitude !== 0 && item.longitude !== 0)
      .map(item => ({
        type: 'Feature' as const,
        properties: {
          cnpj: item.cnpj,
          valor: item.valor_recente,
          nome: item.nome_fantasia || item.razao_social,
          isMelhor: item.cnpj === cnpjMelhor,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [item.longitude, item.latitude],
        },
      }));
    
    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [dados, cnpjMelhor]);

  // Filtra estabelecimentos com coordenadas válidas
  const estabelecimentosComCoordenadas = useMemo(() => {
    return dados.filter(item => item.latitude !== 0 && item.longitude !== 0);
  }, [dados]);

  const handleMarkerClick = useCallback((e: any, item: DadosComDistancia) => {
    e.originalEvent.stopPropagation();
    setPopupInfo(item);
    onSelecionarEstabelecimento?.(item);
    
    // Track station view
    trackStationView(
      item.nome_fantasia || item.razao_social,
      item.cnpj,
      TIPOS_COMBUSTIVEL[tipoCombustivel],
      item.valor_recente,
      item.distancia
    );
  }, [onSelecionarEstabelecimento, tipoCombustivel]);

  return (
    <div className={`relative w-full h-full min-h-[300px] overflow-hidden ${className}`}>
      <Map
        ref={mapRef}
        initialViewState={viewInicial}
        mapStyle={MAP_STYLES[temaAtual]}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleMapLoad}
        onMoveEnd={handleMoveEnd}
        onClick={() => setPopupInfo(null)}
      >
        {/* Controles - posicionados para não conflitar com overlays */}
        <NavigationControl position="bottom-right" showCompass={false} />
        <ScaleControl position="bottom-left" />

        {/* Clustering para zoom baixo */}
        {zoomAtual < ZOOM_PARA_MARKERS && (
          <Source
            id="postos"
            type="geojson"
            data={geojsonData}
            cluster={true}
            clusterMaxZoom={ZOOM_PARA_MARKERS - 1}
            clusterRadius={50}
          >
            <Layer {...clusterLayer} />
            <Layer {...clusterCountLayer} />
          </Source>
        )}

        {/* Marcadores individuais para zoom alto */}
        {zoomAtual >= ZOOM_PARA_MARKERS && estabelecimentosComCoordenadas.map((item) => (
          <Marker
            key={`${item.cnpj}-${item.tipo_combustivel}`}
            longitude={item.longitude}
            latitude={item.latitude}
            anchor="bottom"
            onClick={(e) => handleMarkerClick(e, item)}
          >
            <PinPreco 
              valor={item.valor_recente} 
              selecionado={estabelecimentoSelecionado?.cnpj === item.cnpj || popupInfo?.cnpj === item.cnpj}
              isMelhor={item.cnpj === cnpjMelhor}
            />
          </Marker>
        ))}

      </Map>

      {popupInfo && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-4">
          <div className="pointer-events-auto relative w-[320px] max-w-[94vw] sm:w-[360px]">
            <button
              type="button"
              onClick={() => setPopupInfo(null)}
              className="absolute -right-3 -top-3 z-40 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              aria-label="Fechar detalhes do posto"
            >
              <span aria-hidden="true">X</span>
            </button>

            <StationCard
              dados={popupInfo}
              distancia={popupInfo.distancia}
              isMelhor={popupInfo.cnpj === cnpjMelhor}
              localizacaoUsuario={localizacao}
            />
          </div>
        </div>
      )}
      
      {/* Legenda / Info - canto inferior esquerdo para não conflitar */}
      <div className="absolute bottom-4 left-12 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
        {contadorVisiveis} postos no mapa
      </div>
    </div>
  );
}
