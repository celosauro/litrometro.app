import { useState, useMemo, useCallback } from 'react';
import {
  Map,
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  ScaleControl,
} from 'react-map-gl/maplibre';

import PinPreco from './PinPreco';
import type { PrecoCombustivelResumo, TipoCombustivel } from '../types';
import { TIPOS_COMBUSTIVEL } from '../types';
import { formatarDistancia } from '../utils/distancia';

// Tiles gratuitos do CartoCDN
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Centro de Alagoas (fallback quando não há localização)
const CENTRO_ALAGOAS = {
  latitude: -9.57,
  longitude: -36.78,
  zoom: 7,
};

interface DadosComDistancia extends PrecoCombustivelResumo {
  distancia?: number;
}

interface MapaEstabelecimentosProps {
  dados: DadosComDistancia[];
  localizacao?: { latitude: number; longitude: number } | null;
  tipoCombustivel: TipoCombustivel;
}

export function MapaEstabelecimentos({ 
  dados, 
  localizacao, 
  tipoCombustivel 
}: MapaEstabelecimentosProps) {
  const [popupInfo, setPopupInfo] = useState<DadosComDistancia | null>(null);

  // Calcula o centro inicial do mapa
  const viewInicial = useMemo(() => {
    if (localizacao) {
      return {
        latitude: localizacao.latitude,
        longitude: localizacao.longitude,
        zoom: 13,
      };
    }
    
    // Se tiver dados, centraliza no primeiro estabelecimento
    if (dados.length > 0) {
      const primeiro = dados[0];
      if (primeiro.latitude !== 0 && primeiro.longitude !== 0) {
        return {
          latitude: primeiro.latitude,
          longitude: primeiro.longitude,
          zoom: 12,
        };
      }
    }
    
    return CENTRO_ALAGOAS;
  }, [localizacao, dados]);

  // Filtra estabelecimentos com coordenadas válidas
  const estabelecimentosComCoordenadas = useMemo(() => {
    return dados.filter(item => item.latitude !== 0 && item.longitude !== 0);
  }, [dados]);

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

  const handleMarkerClick = useCallback((e: any, item: DadosComDistancia) => {
    e.originalEvent.stopPropagation();
    setPopupInfo(item);
  }, []);

  return (
    <div className="w-full h-[500px] sm:h-[calc(100vh-280px)] min-h-[400px] rounded-lg overflow-hidden shadow-lg">
      <Map
        initialViewState={viewInicial}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Controles */}
        <GeolocateControl position="top-left" />
        <NavigationControl position="top-left" />
        <ScaleControl position="bottom-left" />

        {/* Marcadores */}
        {estabelecimentosComCoordenadas.map((item) => (
          <Marker
            key={`${item.cnpj}-${item.tipo_combustivel}`}
            longitude={item.longitude}
            latitude={item.latitude}
            anchor="bottom"
            onClick={(e) => handleMarkerClick(e, item)}
          >
            <PinPreco 
              valor={item.valor_recente} 
              tipoCombustivel={item.tipo_combustivel}
              selecionado={popupInfo?.cnpj === item.cnpj}
            />
          </Marker>
        ))}

        {/* Popup */}
        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            maxWidth="280px"
          >
            <div className="p-1">
              {/* Nome do posto */}
              <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">
                {popupInfo.nome_fantasia || popupInfo.razao_social}
              </h3>
              
              {/* Tipo de combustível */}
              <span className="inline-block text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mb-2">
                {TIPOS_COMBUSTIVEL[tipoCombustivel]}
              </span>
              
              {/* Preço */}
              <div className="text-lg font-bold text-green-600 mb-1">
                {formatarPreco(popupInfo.valor_recente)}
              </div>
              
              {/* Endereço */}
              <p className="text-xs text-gray-600 mb-1">
                {[
                  popupInfo.nome_logradouro,
                  popupInfo.numero_imovel ? `nº ${popupInfo.numero_imovel}` : null,
                  popupInfo.bairro,
                ].filter(Boolean).join(', ')}
              </p>
              
              {/* Distância */}
              {popupInfo.distancia !== undefined && (
                <p className="text-xs text-blue-600 font-medium mb-1">
                  📍 {formatarDistancia(popupInfo.distancia)}
                </p>
              )}
              
              {/* Data */}
              <p className="text-xs text-gray-400">
                Atualizado: {formatarData(popupInfo.data_recente)}
              </p>
              
              {/* Link Google Maps */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${popupInfo.latitude},${popupInfo.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-blue-500 hover:text-blue-700 underline"
              >
                Ver no Google Maps →
              </a>
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Legenda / Info */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow text-xs text-gray-600">
        {estabelecimentosComCoordenadas.length} postos no mapa
      </div>
    </div>
  );
}
