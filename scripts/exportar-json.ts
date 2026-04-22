/**
 * Script de Exportação JSON
 * Exporta dados do Supabase para JSON minificado
 * 
 * Executa: npm run export:json
 * Schedule: Executado após cada coleta de 3 em 3 horas (via GitHub Actions)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TIPOS
// ============================================================================

type TipoCombustivel = 1 | 2 | 3 | 4 | 5 | 6;

/** Estrutura expandida (compatível com frontend atual) */
interface EstabelecimentoExpandido {
  cnpj: string;
  tipo_combustivel: TipoCombustivel;
  razao_social: string;
  nome_fantasia: string;
  telefone: string;
  nome_logradouro: string;
  numero_imovel: string;
  bairro: string;
  cep: string;
  codigo_ibge: string;
  municipio: string;
  latitude: number;
  longitude: number;
  valor_minimo: number;
  valor_maximo: number;
  valor_medio: number;
  valor_recente: number;
  data_recente: string;
}

/** Estrutura minificada (para produção) */
interface EstabelecimentoMinificado {
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

interface JSONMinificado {
  v: number;      // versão do schema
  t: string;      // timestamp (atualizadoEm)
  n: number;      // totalEstabelecimentos
  m: number;      // totalMunicipios
  d: EstabelecimentoMinificado[];
}

interface JSONExpandido {
  atualizadoEm: string;
  totalEstabelecimentos: number;
  totalMunicipios: number;
  estabelecimentos: EstabelecimentoExpandido[];
}

interface PrecoSupabase {
  cnpj: string;
  tipo_combustivel: number;
  razao_social: string;
  nome_fantasia: string | null;
  telefone: string | null;
  nome_logradouro: string | null;
  numero_imovel: string | null;
  bairro: string | null;
  cep: string | null;
  codigo_ibge: string;
  municipio: string;
  latitude: number | null;
  longitude: number | null;
  valor_minimo: number;
  valor_maximo: number;
  valor_medio: number;
  valor_recente: number;
  data_recente: string;
  updated_at: string;
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const DADOS_DIR = path.join(process.cwd(), 'public', 'dados');
const MUNICIPIOS_DIR = path.join(DADOS_DIR, 'municipios');
const GEOCACHE_PATH = path.join(DADOS_DIR, 'geocache.json');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

// Tipo do geocache local
interface GeoCacheEntry {
  latitude: number;
  longitude: number;
  fonte: string;
  data?: string;
  atualizadoEm?: string;
}
type GeoCache = Record<string, GeoCacheEntry>;

// Geocache carregado em memória
let geoCache: GeoCache | null = null;

function carregarGeoCache(): GeoCache {
  if (geoCache) return geoCache;
  
  let cache: GeoCache;
  if (fs.existsSync(GEOCACHE_PATH)) {
    cache = JSON.parse(fs.readFileSync(GEOCACHE_PATH, 'utf-8'));
    console.log(`📍 Geocache carregado: ${Object.keys(cache).length} coordenadas`);
  } else {
    cache = {};
    console.log('⚠️  Geocache não encontrado, usando coordenadas do Supabase');
  }
  geoCache = cache;
  return cache;
}

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error('VITE_SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórios');
  }
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      db: { schema: 'public' },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabase;
}

// ============================================================================
// FUNÇÕES DE CONVERSÃO
// ============================================================================

/**
 * Arredonda valor para N casas decimais
 */
function arredondar(valor: number, casas: number = 4): number {
  return Math.round(valor * Math.pow(10, casas)) / Math.pow(10, casas);
}

/**
 * Remove milissegundos do timestamp ISO
 */
function timestampCurto(iso: string): string {
  return iso.replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Converte dados do Supabase para formato expandido
 * Prioriza coordenadas do geocache local sobre o Supabase
 */
function converterParaExpandido(dados: PrecoSupabase[]): EstabelecimentoExpandido[] {
  const cache = carregarGeoCache();
  
  return dados.map(d => {
    // Usa coordenadas do geocache se disponíveis, senão usa do Supabase
    const geo = cache[d.cnpj];
    const latitude = geo?.latitude ?? d.latitude ?? 0;
    const longitude = geo?.longitude ?? d.longitude ?? 0;
    
    return {
      cnpj: d.cnpj,
      tipo_combustivel: d.tipo_combustivel as TipoCombustivel,
      razao_social: d.razao_social,
      nome_fantasia: d.nome_fantasia || '',
      telefone: d.telefone || '',
      nome_logradouro: d.nome_logradouro || '',
      numero_imovel: d.numero_imovel || '',
      bairro: d.bairro || '',
      cep: d.cep || '',
      codigo_ibge: d.codigo_ibge,
      municipio: d.municipio,
      latitude,
      longitude,
      valor_minimo: arredondar(d.valor_minimo),
      valor_maximo: arredondar(d.valor_maximo),
      valor_medio: arredondar(d.valor_medio),
      valor_recente: arredondar(d.valor_recente),
      data_recente: d.data_recente,
    };
  });
}

/**
 * Converte dados expandidos para formato minificado
 */
function converterParaMinificado(dados: EstabelecimentoExpandido[]): EstabelecimentoMinificado[] {
  return dados.map(d => {
    const min: EstabelecimentoMinificado = {
      c: d.cnpj,
      tp: d.tipo_combustivel,
      rs: d.razao_social,
      ib: d.codigo_ibge,
      mn: d.municipio,
      lat: arredondar(d.latitude, 6),
      lng: arredondar(d.longitude, 6),
      vn: arredondar(d.valor_minimo, 4),
      vx: arredondar(d.valor_maximo, 4),
      vm: arredondar(d.valor_medio, 4),
      vr: arredondar(d.valor_recente, 4),
      dr: timestampCurto(d.data_recente),
    };

    // Campos opcionais (omitidos se vazios para economizar bytes)
    if (d.nome_fantasia) min.nf = d.nome_fantasia;
    if (d.telefone) min.tel = d.telefone;
    if (d.nome_logradouro) min.end = d.nome_logradouro;
    if (d.numero_imovel) min.num = d.numero_imovel;
    if (d.bairro) min.ba = d.bairro;
    if (d.cep) min.cep = d.cep;

    return min;
  });
}

// ============================================================================
// BUSCA DE DADOS
// ============================================================================

/**
 * Busca todos os preços do Supabase via view (com paginação)
 * O Supabase tem limite padrão de 1000 registros
 */
async function buscarDadosSupabase(): Promise<PrecoSupabase[]> {
  const client = getSupabaseClient();
  const BATCH_SIZE = 1000;
  const todosRegistros: PrecoSupabase[] = [];
  let offset = 0;
  
  console.log('📊 Buscando dados do Supabase...');
  
  while (true) {
    const { data, error } = await client
      .from('v_precos_completos')
      .select('*')
      .order('codigo_ibge')
      .order('tipo_combustivel')
      .order('valor_recente')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      throw new Error(`Erro ao buscar dados: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    todosRegistros.push(...(data as PrecoSupabase[]));
    console.log(`   ... ${todosRegistros.length} registros`);

    if (data.length < BATCH_SIZE) {
      break;
    }

    offset += BATCH_SIZE;
  }

  if (todosRegistros.length === 0) {
    throw new Error('Nenhum dado encontrado no Supabase');
  }

  console.log(`   ✓ ${todosRegistros.length} registros encontrados`);
  return todosRegistros;
}

// ============================================================================
// GERAÇÃO DE ARQUIVOS
// ============================================================================

/**
 * Gera JSON expandido (compatibilidade)
 */
function gerarJSONExpandido(
  estabelecimentos: EstabelecimentoExpandido[],
  atualizadoEm: string
): JSONExpandido {
  const municipiosUnicos = new Set(estabelecimentos.map(e => e.codigo_ibge));
  
  return {
    atualizadoEm,
    totalEstabelecimentos: estabelecimentos.length,
    totalMunicipios: municipiosUnicos.size,
    estabelecimentos,
  };
}

/**
 * Gera JSON minificado (produção)
 */
function gerarJSONMinificado(
  estabelecimentos: EstabelecimentoExpandido[],
  atualizadoEm: string
): JSONMinificado {
  const municipiosUnicos = new Set(estabelecimentos.map(e => e.codigo_ibge));
  const minificados = converterParaMinificado(estabelecimentos);
  
  return {
    v: 1,
    t: timestampCurto(atualizadoEm),
    n: estabelecimentos.length,
    m: municipiosUnicos.size,
    d: minificados,
  };
}

/**
 * Gera JSONs por município
 */
function gerarJSONsMunicipios(
  estabelecimentos: EstabelecimentoExpandido[],
  atualizadoEm: string
): Map<string, object> {
  const porMunicipio = new Map<string, EstabelecimentoExpandido[]>();

  for (const est of estabelecimentos) {
    const lista = porMunicipio.get(est.codigo_ibge) || [];
    lista.push(est);
    porMunicipio.set(est.codigo_ibge, lista);
  }

  const jsons = new Map<string, object>();
  for (const [codigoIBGE, lista] of porMunicipio) {
    jsons.set(codigoIBGE, {
      codigoIBGE,
      municipio: lista[0].municipio,
      atualizadoEm,
      totalEstabelecimentos: lista.length,
      estabelecimentos: lista,
    });
  }

  return jsons;
}

/**
 * Salva arquivo JSON
 */
function salvarJSON(caminho: string, dados: object, minificar: boolean = false): number {
  const conteudo = minificar 
    ? JSON.stringify(dados) 
    : JSON.stringify(dados, null, 2);
  
  fs.writeFileSync(caminho, conteudo, 'utf-8');
  return conteudo.length;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('Exportação de Dados Supabase → JSON');
  console.log(`Data/Hora: ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  // Verifica configuração
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error('❌ Configure VITE_SUPABASE_URL e SUPABASE_SECRET_KEY no .env');
    process.exit(1);
  }

  // Cria diretórios se não existirem
  fs.mkdirSync(DADOS_DIR, { recursive: true });
  fs.mkdirSync(MUNICIPIOS_DIR, { recursive: true });

  // Busca dados
  const dadosBrutos = await buscarDadosSupabase();
  const atualizadoEm = new Date().toISOString();

  // Converte para formato expandido
  const estabelecimentos = converterParaExpandido(dadosBrutos);
  console.log(`\n🔄 Processando ${estabelecimentos.length} estabelecimentos...`);

  // Gera JSON expandido (compatibilidade)
  console.log('\n📁 Gerando arquivos JSON...');
  const jsonExpandido = gerarJSONExpandido(estabelecimentos, atualizadoEm);
  const tamanhoExpandido = salvarJSON(
    path.join(DADOS_DIR, 'atual.json'),
    jsonExpandido,
    false
  );
  console.log(`   atual.json: ${(tamanhoExpandido / 1024).toFixed(1)} KB`);

  // Gera JSON minificado (produção)
  const jsonMinificado = gerarJSONMinificado(estabelecimentos, atualizadoEm);
  const tamanhoMinificado = salvarJSON(
    path.join(DADOS_DIR, 'atual.min.json'),
    jsonMinificado,
    true
  );
  console.log(`   atual.min.json: ${(tamanhoMinificado / 1024).toFixed(1)} KB`);
  console.log(`   Redução: ${((1 - tamanhoMinificado / tamanhoExpandido) * 100).toFixed(1)}%`);

  // Gera JSONs por município
  const jsonsMunicipios = gerarJSONsMunicipios(estabelecimentos, atualizadoEm);
  let municipiosGerados = 0;
  for (const [codigoIBGE, dados] of jsonsMunicipios) {
    salvarJSON(
      path.join(MUNICIPIOS_DIR, `${codigoIBGE}.json`),
      dados,
      false
    );
    municipiosGerados++;
  }
  console.log(`   municipios/: ${municipiosGerados} arquivos`);

  // Resumo
  console.log('\n═'.repeat(60));
  console.log('Exportação concluída!');
  console.log('═'.repeat(60));
  console.log(`  Estabelecimentos: ${jsonExpandido.totalEstabelecimentos}`);
  console.log(`  Municípios: ${jsonExpandido.totalMunicipios}`);
  console.log(`  atual.json: ${(tamanhoExpandido / 1024).toFixed(1)} KB`);
  console.log(`  atual.min.json: ${(tamanhoMinificado / 1024).toFixed(1)} KB`);
  console.log(`  Economia: ${((1 - tamanhoMinificado / tamanhoExpandido) * 100).toFixed(1)}%`);
}

// Executa
main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
