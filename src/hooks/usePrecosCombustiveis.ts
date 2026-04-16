import { useState, useEffect, useCallback } from 'react';
import type { PrecoCombustivelResumo, TipoCombustivel, DadosAtuais, ResumoMunicipio } from '../types';
import { normalizarJSON, type JSONMinificado, type JSONExpandido } from '../utils/dados';

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

// Cache dos dados carregados
// TTL: 0 em dev (sempre recarrega), 30 minutos em produção
let cacheAtual: DadosAtuais | null = null;
let cacheTimestamp: number = 0;
const cacheMunicipios: Map<string, ResumoMunicipio> = new Map();
const CACHE_TTL = import.meta.env.DEV ? 0 : 30 * 60 * 1000; // 0 em dev, 30 min em prod

/**
 * Hook para carregar preços de combustíveis do JSON estático
 * Suporta tanto formato minificado (atual.min.json) quanto expandido (atual.json)
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
          // Tenta carregar o JSON minificado primeiro, fallback para expandido
          let resposta = await fetch('/dados/atual.min.json');
          
          if (!resposta.ok) {
            // Fallback para JSON expandido (compatibilidade)
            resposta = await fetch('/dados/atual.json');
          }
          
          if (!resposta.ok) {
            throw new Error(`Erro ao carregar dados: ${resposta.status}`);
          }
          
          const dadosBrutos = await resposta.json() as JSONMinificado | JSONExpandido;
          
          // Normaliza (expande se minificado)
          const dadosExpandidos = normalizarJSON(dadosBrutos);
          
          cacheAtual = {
            atualizadoEm: dadosExpandidos.atualizadoEm,
            totalEstabelecimentos: dadosExpandidos.totalEstabelecimentos,
            totalMunicipios: dadosExpandidos.totalMunicipios,
            estabelecimentos: dadosExpandidos.estabelecimentos,
          };
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
