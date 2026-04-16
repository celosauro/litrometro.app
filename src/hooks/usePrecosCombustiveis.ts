import { useState, useEffect, useCallback } from 'react';
import type { PrecoCombustivelResumo, TipoCombustivel, DadosAtuais } from '../types';
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

// Cache global - TTL 30min prod, 0 dev
let cacheAtual: DadosAtuais | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = import.meta.env.DEV ? 0 : 30 * 60 * 1000;

/**
 * Hook para carregar preços de combustíveis
 * Usa apenas atual.min.json - filtra por município e tipo no cliente
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
      // Carrega dados completos (com cache)
      const agora = Date.now();
      const cacheExpirado = !cacheAtual || (agora - cacheTimestamp > CACHE_TTL);
      
      if (cacheExpirado) {
        // Tenta minificado primeiro, fallback expandido
        let resposta = await fetch('/dados/atual.min.json');
        
        if (!resposta.ok) {
          resposta = await fetch('/dados/atual.json');
        }
        
        if (!resposta.ok) {
          throw new Error(`Erro ao carregar dados: ${resposta.status}`);
        }
        
        const dadosBrutos = await resposta.json() as JSONMinificado | JSONExpandido;
        const dadosExpandidos = normalizarJSON(dadosBrutos);
        
        cacheAtual = {
          atualizadoEm: dadosExpandidos.atualizadoEm,
          totalEstabelecimentos: dadosExpandidos.totalEstabelecimentos,
          totalMunicipios: dadosExpandidos.totalMunicipios,
          estabelecimentos: dadosExpandidos.estabelecimentos,
        };
        cacheTimestamp = agora;
      }

      // Filtra por município (se especificado) e tipo de combustível
      let filtrados = cacheAtual!.estabelecimentos.filter(e => {
        const matchTipo = e.tipo_combustivel === tipoCombustivel;
        const matchMunicipio = !codigoIBGE || e.codigo_ibge === codigoIBGE;
        return matchTipo && matchMunicipio;
      });

      // Ordena por valor recente (menor primeiro)
      filtrados.sort((a, b) => a.valor_recente - b.valor_recente);

      setDados(filtrados);
      setUltimaAtualizacao(cacheAtual!.atualizadoEm);
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
    cacheAtual = null;
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
