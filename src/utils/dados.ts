/**
 * Utilitários para manipulação de dados JSON compactos
 * Expande campos abreviados do formato minificado para o formato completo
 */

import type { TipoCombustivel, PrecoCombustivelResumo } from '../types';

// ============================================================================
// TIPOS DO JSON MINIFICADO
// ============================================================================

/** Estrutura minificada do JSON de produção */
export interface EstabelecimentoMinificado {
  c: string;      // cnpj
  tp: TipoCombustivel; // tipo_combustivel
  rs: string;     // razao_social
  nf?: string;    // nome_fantasia (omitido se vazio)
  tel?: string;   // telefone (omitido se vazio)
  end?: string;   // nome_logradouro (omitido se vazio)
  num?: string;   // numero_imovel (omitido se vazio)
  ba?: string;    // bairro (omitido se vazio)
  cep?: string;   // cep (omitido se vazio)
  ib: string;     // codigo_ibge
  mn: string;     // municipio
  lat: number;    // latitude
  lng: number;    // longitude
  vn: number;     // valor_minimo
  vx: number;     // valor_maximo
  vm: number;     // valor_medio
  vr: number;     // valor_recente
  dr: string;     // data_recente
}

/** Estrutura do JSON minificado completo */
export interface JSONMinificado {
  v: number;      // versão do schema
  t: string;      // timestamp (atualizadoEm)
  n: number;      // totalEstabelecimentos
  m: number;      // totalMunicipios
  d: EstabelecimentoMinificado[];
}

/** Estrutura do JSON expandido (legado) */
export interface JSONExpandido {
  atualizadoEm: string;
  totalEstabelecimentos: number;
  totalMunicipios: number;
  estabelecimentos: PrecoCombustivelResumo[];
}

// ============================================================================
// FUNÇÕES DE EXPANSÃO
// ============================================================================

/**
 * Expande um estabelecimento minificado para o formato completo
 */
export function expandirEstabelecimento(min: EstabelecimentoMinificado): PrecoCombustivelResumo {
  return {
    cnpj: min.c,
    tipo_combustivel: min.tp,
    razao_social: min.rs,
    nome_fantasia: min.nf || '',
    telefone: min.tel || '',
    nome_logradouro: min.end || '',
    numero_imovel: min.num || '',
    bairro: min.ba || '',
    cep: min.cep || '',
    codigo_ibge: min.ib,
    municipio: min.mn,
    latitude: min.lat,
    longitude: min.lng,
    valor_minimo: min.vn,
    valor_maximo: min.vx,
    valor_medio: min.vm,
    valor_recente: min.vr,
    data_recente: min.dr,
  };
}

/**
 * Expande JSON minificado completo para formato expandido
 */
export function expandirJSON(minificado: JSONMinificado): JSONExpandido {
  return {
    atualizadoEm: minificado.t,
    totalEstabelecimentos: minificado.n,
    totalMunicipios: minificado.m,
    estabelecimentos: minificado.d.map(expandirEstabelecimento),
  };
}

/**
 * Detecta se o JSON está no formato minificado
 */
export function isJSONMinificado(dados: unknown): dados is JSONMinificado {
  return (
    typeof dados === 'object' &&
    dados !== null &&
    'v' in dados &&
    'd' in dados &&
    Array.isArray((dados as JSONMinificado).d)
  );
}

/**
 * Normaliza JSON (expande se minificado, retorna como está se expandido)
 */
export function normalizarJSON(dados: JSONMinificado | JSONExpandido): JSONExpandido {
  if (isJSONMinificado(dados)) {
    return expandirJSON(dados);
  }
  return dados as JSONExpandido;
}

// ============================================================================
// MAPEAMENTO DE CAMPOS (referência)
// ============================================================================

/**
 * Mapeamento de campos minificados → expandidos
 * Útil para documentação e debugging
 */
export const MAPEAMENTO_CAMPOS = {
  c: 'cnpj',
  tp: 'tipo_combustivel',
  rs: 'razao_social',
  nf: 'nome_fantasia',
  tel: 'telefone',
  end: 'nome_logradouro',
  num: 'numero_imovel',
  ba: 'bairro',
  cep: 'cep',
  ib: 'codigo_ibge',
  mn: 'municipio',
  lat: 'latitude',
  lng: 'longitude',
  vn: 'valor_minimo',
  vx: 'valor_maximo',
  vm: 'valor_medio',
  vr: 'valor_recente',
  dr: 'data_recente',
} as const;

/**
 * Mapeamento de metadados do JSON
 */
export const MAPEAMENTO_META = {
  v: 'version',
  t: 'atualizadoEm',
  n: 'totalEstabelecimentos',
  m: 'totalMunicipios',
  d: 'estabelecimentos',
} as const;
