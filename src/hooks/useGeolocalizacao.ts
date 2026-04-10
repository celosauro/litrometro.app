import { useState, useCallback, useEffect } from 'react';

interface Coordenadas {
  latitude: number;
  longitude: number;
}

interface UseGeolocalizacaoReturn {
  localizacao: Coordenadas | null;
  carregando: boolean;
  erro: string | null;
  permissaoNegada: boolean;
  obterLocalizacao: () => void;
}

export function useGeolocalizacao(): UseGeolocalizacaoReturn {
  const [localizacao, setLocalizacao] = useState<Coordenadas | null>(null);
  const [carregando, setCarregando] = useState(true); // Inicia como true pois solicita automaticamente
  const [erro, setErro] = useState<string | null>(null);
  const [permissaoNegada, setPermissaoNegada] = useState(false);

  const obterLocalizacao = useCallback(() => {
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
