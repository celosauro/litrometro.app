import { useState, useCallback, useEffect } from 'react';

interface Coordenadas {
  latitude: number;
  longitude: number;
  timestamp?: number; // Usado para forçar atualização mesmo com mesmas coordenadas
}

interface UseGeolocalizacaoReturn {
  localizacao: Coordenadas | null;
  carregando: boolean;
  erro: string | null;
  permissaoNegada: boolean;
  obterLocalizacao: () => void;
}

// Localização padrão para desenvolvimento (Maceió)
const LOCALIZACAO_DEV = {
  latitude: -9.661185,
  longitude: -35.706977,
};

// Verifica se está em ambiente de desenvolvimento
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export function useGeolocalizacao(): UseGeolocalizacaoReturn {
  const [localizacao, setLocalizacao] = useState<Coordenadas | null>(null);
  const [carregando, setCarregando] = useState(true); // Inicia como true pois solicita automaticamente
  const [erro, setErro] = useState<string | null>(null);
  const [permissaoNegada, setPermissaoNegada] = useState(false);

  const obterLocalizacao = useCallback(() => {
    // Em localhost, usa localização de desenvolvimento
    if (isLocalhost) {
      setCarregando(true);
      // Pequeno delay para simular requisição
      setTimeout(() => {
        // Adiciona timestamp para garantir que React detecte como nova localização
        setLocalizacao({ 
          ...LOCALIZACAO_DEV,
          timestamp: Date.now()
        });
        setCarregando(false);
        setPermissaoNegada(false);
        setErro(null);
      }, 300);
      return;
    }

    if (!navigator.geolocation) {
      setErro('Geolocalização não suportada pelo navegador');
      return;
    }

    setCarregando(true);
    setErro(null);

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setLocalizacao({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
          timestamp: Date.now(),
        });
        setCarregando(false);
        setPermissaoNegada(false);
      },
      (error) => {
        setCarregando(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErro('Permissão de localização negada');
            setPermissaoNegada(true);
            break;
          case error.POSITION_UNAVAILABLE:
            setErro('Localização indisponível');
            break;
          case error.TIMEOUT:
            setErro('Tempo esgotado ao obter localização');
            break;
          default:
            setErro('Erro ao obter localização');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache de 5 minutos
      }
    );
  }, []);

  // Solicita localização automaticamente ao iniciar
  useEffect(() => {
    obterLocalizacao();
  }, [obterLocalizacao]);

  return {
    localizacao,
    carregando,
    erro,
    permissaoNegada,
    obterLocalizacao,
  };
}
