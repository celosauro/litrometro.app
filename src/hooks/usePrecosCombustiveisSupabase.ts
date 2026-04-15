import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { PrecoCompleto } from '../lib/database.types';
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

// ============================================================================
// CACHE SUPABASE - TTL de 1 hora
// ============================================================================
interface CacheEntry {
  dados: PrecoCombustivelResumo[];
  atualizadoEm: string;
  timestamp: number;
}

// Cache por chave: "tipoCombustivel-codigoIBGE" ou "tipoCombustivel-todos"
const cacheSupabase: Map<string, CacheEntry> = new Map();
const CACHE_TTL_SUPABASE = import.meta.env.DEV ? 0 : 60 * 60 * 1000; // 0 em dev, 1 hora em prod

function getCacheKey(tipoCombustivel: TipoCombustivel, codigoIBGE?: string): string {
  return `${tipoCombustivel}-${codigoIBGE || 'todos'}`;
}

function getCachedData(tipoCombustivel: TipoCombustivel, codigoIBGE?: string): CacheEntry | null {
  const key = getCacheKey(tipoCombustivel, codigoIBGE);
  const cached = cacheSupabase.get(key);
  
  if (!cached) return null;
  
  const agora = Date.now();
  const expirado = agora - cached.timestamp > CACHE_TTL_SUPABASE;
  
  if (expirado) {
    cacheSupabase.delete(key);
    return null;
  }
  
  return cached;
}

function setCachedData(
  tipoCombustivel: TipoCombustivel, 
  codigoIBGE: string | undefined,
  dados: PrecoCombustivelResumo[],
  atualizadoEm: string
): void {
  const key = getCacheKey(tipoCombustivel, codigoIBGE);
  cacheSupabase.set(key, {
    dados,
    atualizadoEm,
    timestamp: Date.now(),
  });
}

// Limpa cache de uma chave específica (usado pelo recarregar)
function invalidateCache(tipoCombustivel: TipoCombustivel, codigoIBGE?: string): void {
  const key = getCacheKey(tipoCombustivel, codigoIBGE);
  cacheSupabase.delete(key);
}

// ============================================================================
// CACHE JSON (fallback) - TTL de 1 hora
// ============================================================================
let cacheAtualJSON: DadosAtuais | null = null;
let cacheTimestampJSON: number = 0;
const cacheMunicipiosJSON: Map<string, ResumoMunicipio> = new Map();
const CACHE_TTL_JSON = import.meta.env.DEV ? 0 : 60 * 60 * 1000; // 0 em dev, 1 hora em prod

/**
 * Converte dados do Supabase para o formato esperado pelo app
 */
function converterParaResumo(dados: PrecoCompleto[]): PrecoCombustivelResumo[] {
  return dados.map((d) => ({
    cnpj: d.cnpj,
    tipo_combustivel: d.tipo_combustivel,
    razao_social: d.razao_social,
    nome_fantasia: d.nome_fantasia || '',
    telefone: d.telefone || '',
    nome_logradouro: d.nome_logradouro || '',
    numero_imovel: d.numero_imovel || '',
    bairro: d.bairro || '',
    cep: d.cep || '',
    codigo_ibge: d.codigo_ibge,
    municipio: d.municipio,
    latitude: d.latitude || 0,
    longitude: d.longitude || 0,
    valor_minimo: d.valor_minimo,
    valor_maximo: d.valor_maximo,
    valor_medio: d.valor_medio,
    valor_recente: d.valor_recente,
    data_recente: d.data_recente,
  }));
}

/**
 * Busca dados do Supabase (com cache)
 */
async function buscarDoSupabase(
  tipoCombustivel: TipoCombustivel,
  codigoIBGE?: string,
  forcarRecarregar: boolean = false
): Promise<{ dados: PrecoCombustivelResumo[]; atualizadoEm: string } | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  // Verifica cache (exceto se forçar recarregar)
  if (!forcarRecarregar) {
    const cached = getCachedData(tipoCombustivel, codigoIBGE);
    if (cached) {
      console.log(`[Cache Supabase] HIT: tipo=${tipoCombustivel}, ibge=${codigoIBGE || 'todos'}`);
      return { dados: cached.dados, atualizadoEm: cached.atualizadoEm };
    }
  }

  console.log(`[Cache Supabase] MISS: tipo=${tipoCombustivel}, ibge=${codigoIBGE || 'todos'}`);

  try {
    let query = supabase
      .from('v_precos_completos')
      .select('*')
      .eq('tipo_combustivel', tipoCombustivel)
      .order('valor_recente', { ascending: true });

    if (codigoIBGE) {
      query = query.eq('codigo_ibge', codigoIBGE);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro Supabase:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return { dados: [], atualizadoEm: new Date().toISOString() };
    }

    // Cast para o tipo correto (views não são inferidas automaticamente)
    const dadosTypados = data as unknown as PrecoCompleto[];
    const atualizadoEm = dadosTypados.reduce((max, d) => 
      d.updated_at > max ? d.updated_at : max, 
      dadosTypados[0].updated_at
    );

    const dadosConvertidos = converterParaResumo(dadosTypados);
    
    // Salva no cache
    setCachedData(tipoCombustivel, codigoIBGE, dadosConvertidos, atualizadoEm);

    return {
      dados: dadosConvertidos,
      atualizadoEm,
    };
  } catch (error) {
    console.error('Erro ao buscar do Supabase:', error);
    return null;
  }
}

/**
 * Busca dados do JSON estático (fallback)
 */
async function buscarDoJSON(
  tipoCombustivel: TipoCombustivel,
  codigoIBGE?: string
): Promise<{ dados: PrecoCombustivelResumo[]; atualizadoEm: string }> {
  let estabelecimentos: PrecoCombustivelResumo[];
  let atualizadoEm: string;

  if (codigoIBGE) {
    let dadosMunicipio = cacheMunicipiosJSON.get(codigoIBGE);
    
    if (!dadosMunicipio) {
      const resposta = await fetch(`/dados/municipios/${codigoIBGE}.json`);
      
      if (!resposta.ok) {
        if (resposta.status === 404) {
          return { dados: [], atualizadoEm: new Date().toISOString() };
        }
        throw new Error(`Erro ao carregar dados do município: ${resposta.status}`);
      }
      
      dadosMunicipio = await resposta.json() as ResumoMunicipio;
      cacheMunicipiosJSON.set(codigoIBGE, dadosMunicipio);
    }

    estabelecimentos = dadosMunicipio.estabelecimentos;
    atualizadoEm = dadosMunicipio.atualizadoEm;
  } else {
    const agora = Date.now();
    const cacheExpirado = !cacheAtualJSON || (agora - cacheTimestampJSON > CACHE_TTL_JSON);
    
    if (cacheExpirado) {
      const resposta = await fetch('/dados/atual.json');
      
      if (!resposta.ok) {
        throw new Error(`Erro ao carregar dados: ${resposta.status}`);
      }
      
      cacheAtualJSON = await resposta.json() as DadosAtuais;
      cacheTimestampJSON = agora;
    }

    estabelecimentos = cacheAtualJSON!.estabelecimentos;
    atualizadoEm = cacheAtualJSON!.atualizadoEm;
  }

  const filtrados = estabelecimentos.filter(
    (e) => e.tipo_combustivel === tipoCombustivel
  );

  filtrados.sort((a, b) => a.valor_recente - b.valor_recente);

  return { dados: filtrados, atualizadoEm };
}

/**
 * Hook para carregar preços de combustíveis
 * Usa Supabase se configurado, fallback para JSON estático
 * Cache de 1 hora em produção (0 em dev para facilitar testes)
 */
export function usePrecosCombustiveisSupabase({ 
  tipoCombustivel, 
  codigoIBGE 
}: UsePrecosCombustiveisOpcoes): UsePrecosCombustiveisResultado {
  const [dados, setDados] = useState<PrecoCombustivelResumo[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);

  const buscarDados = useCallback(async (forcarRecarregar: boolean = false) => {
    setCarregando(true);
    setErro(null);

    try {
      // Invalida cache se forçar recarregar
      if (forcarRecarregar) {
        invalidateCache(tipoCombustivel, codigoIBGE);
      }

      // Tenta buscar do Supabase primeiro
      let resultado = await buscarDoSupabase(tipoCombustivel, codigoIBGE, forcarRecarregar);
      
      // Fallback para JSON se Supabase não disponível ou erro
      if (!resultado) {
        resultado = await buscarDoJSON(tipoCombustivel, codigoIBGE);
      }

      setDados(resultado.dados);
      setUltimaAtualizacao(resultado.atualizadoEm);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }, [tipoCombustivel, codigoIBGE]);

  useEffect(() => {
    buscarDados(false); // Não força recarregar no mount
  }, [buscarDados]);

  return {
    dados,
    carregando,
    erro,
    recarregar: () => buscarDados(true), // Força recarregar quando usuário clica
    ultimaAtualizacao,
  };
}

/**
 * Hook para buscar estatísticas gerais
 */
export function useEstatisticasSupabase() {
  const [estatisticas, setEstatisticas] = useState<{
    totalEstabelecimentos: number;
    totalMunicipios: number;
    atualizadoEm: string | null;
  } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscar() {
      try {
        if (isSupabaseConfigured) {
          // Busca do Supabase
          const { data, error } = await supabase
            .from('v_estatisticas')
            .select('*')
            .single();

          if (!error && data) {
            // Cast para o tipo correto (views não são inferidas automaticamente)
            const stats = data as unknown as {
              total_estabelecimentos: number;
              total_municipios: number;
              atualizado_em: string | null;
            };
            setEstatisticas({
              totalEstabelecimentos: stats.total_estabelecimentos,
              totalMunicipios: stats.total_municipios,
              atualizadoEm: stats.atualizado_em,
            });
            return;
          }
        }

        // Fallback para JSON
        const resposta = await fetch('/dados/atual.json');
        if (resposta.ok) {
          const dados = await resposta.json() as DadosAtuais;
          setEstatisticas({
            totalEstabelecimentos: dados.totalEstabelecimentos,
            totalMunicipios: dados.totalMunicipios,
            atualizadoEm: dados.atualizadoEm,
          });
        }
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
      } finally {
        setCarregando(false);
      }
    }

    buscar();
  }, []);

  return { estatisticas, carregando };
}
