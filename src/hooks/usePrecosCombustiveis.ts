import { useState, useEffect, useCallback } from 'react';
import type { PrecoCombustivelResumo, TipoCombustivel, DadosAtuais, ResumoMunicipio } from '../types';

interface UsePrecosCombustiveisOpcoes {
  tipoCombustivel: TipoCombustivel;
  codigoIBGE?: string;
}

interface UsePrecosCombustiveisResultado {
  dados: PrecoCombustivelResumo[] | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
  ultimaAtualizacao: string | null;
}

// Cache dos dados carregados (invalidado a cada requisição em dev)
let cacheAtual: DadosAtuais | null = null;
let cacheTimestamp: number = 0;
const cacheMunicipios: Map<string, ResumoMunicipio> = new Map();
const CACHE_TTL = import.meta.env.DEV ? 0 : 5 * 60 * 1000; // 0 em dev, 5 min em prod

/**
 * Hook para carregar preços de combustíveis do JSON estático
 */
export function usePrecosCombustiveis({ 
  tipoCombustivel, 
  codigoIBGE 
}: UsePrecosCombustiveisOpcoes): UsePrecosCombustiveisResultado {
  const [dados, setDados] = useState<PrecoCombustivelResumo[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);

  const buscarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      let estabelecimentos: PrecoCombustivelResumo[];
      let atualizadoEm: string;

      if (codigoIBGE) {
        // Busca dados de um município específico
        let dadosMunicipio = cacheMunicipios.get(codigoIBGE);
        
        if (!dadosMunicipio) {
          const resposta = await fetch(`/dados/municipios/${codigoIBGE}.json`);
          
          if (!resposta.ok) {
            if (resposta.status === 404) {
              // Município sem dados
              setDados([]);
              setUltimaAtualizacao(null);
              return;
            }
            throw new Error(`Erro ao carregar dados do município: ${resposta.status}`);
          }
          
          dadosMunicipio = await resposta.json() as ResumoMunicipio;
          cacheMunicipios.set(codigoIBGE, dadosMunicipio);
        }

        estabelecimentos = dadosMunicipio.estabelecimentos;
        atualizadoEm = dadosMunicipio.atualizadoEm;
      } else {
        // Busca todos os dados
        const agora = Date.now();
        const cacheExpirado = !cacheAtual || (agora - cacheTimestamp > CACHE_TTL);
        
        if (cacheExpirado) {
          const resposta = await fetch('/dados/atual.json');
          
          if (!resposta.ok) {
            throw new Error(`Erro ao carregar dados: ${resposta.status}`);
          }
          
          cacheAtual = await resposta.json() as DadosAtuais;
          cacheTimestamp = agora;
        }

        estabelecimentos = cacheAtual!.estabelecimentos;
        atualizadoEm = cacheAtual!.atualizadoEm;
      }

      // Filtra por tipo de combustível
      const filtrados = estabelecimentos.filter(
        (e) => e.tipo_combustivel === tipoCombustivel
      );

      // Ordena por valor recente (menor primeiro)
      filtrados.sort((a, b) => a.valor_recente - b.valor_recente);

      setDados(filtrados);
      setUltimaAtualizacao(atualizadoEm);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setErro('Erro ao carregar dados. Tente novamente.');
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }, [tipoCombustivel, codigoIBGE]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  const recarregar = useCallback(() => {
    // Limpa cache ao recarregar manualmente
    cacheAtual = null;
    cacheMunicipios.clear();
    buscarDados();
  }, [buscarDados]);

  return {
    dados,
    carregando,
    erro,
    recarregar,
    ultimaAtualizacao,
  };
}
