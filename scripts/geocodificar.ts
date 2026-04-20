/**
 * Script de geocodificação de estabelecimentos
 * Executa via GitHub Actions ou manualmente
 * Busca coordenadas usando múltiplos provedores em cascata:
 * 1. Nominatim (OpenStreetMap) - gratuito, 1 req/s
 * 2. OpenCage - 2.500/dia gratuito (se configurado)
 * 3. LocationIQ - 5.000/dia gratuito (se configurado)
 * 
 * ATUALIZA: geocache.json + Supabase estabelecimentos
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuração
const DADOS_DIR = path.join(process.cwd(), 'public', 'dados');
const GEOCACHE_PATH = path.join(DADOS_DIR, 'geocache.json');
const ATUAL_PATH = path.join(DADOS_DIR, 'atual.json');
const MUNICIPIOS_CENTRO_PATH = path.join(DADOS_DIR, 'municipios-centro.json');

// Distância máxima aceitável do centro do município (em km)
// Municípios de Alagoas são pequenos, 50km é razoável
const DISTANCIA_MAXIMA_KM = 50;

// Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

// API Keys (opcionais - fallbacks)
const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY || '';
const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY || '';

// Cache de falhas - evita repetir requisições para endereços não encontrados
// Expira após 24 horas
const FALHA_CACHE_PATH = path.join(DADOS_DIR, 'geocache-falhas.json');
const FALHA_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas

// Tipo de resultado de geocodificação
interface GeoResult {
  latitude: number;
  longitude: number;
  fonte: 'nominatim' | 'opencage' | 'locationiq';
}

interface FalhaCache {
  [cnpj: string]: {
    tentativas: number;
    ultimaTentativa: string;
  };
}

interface PrecoCombustivelResumo {
  cnpj: string;
  tipo_combustivel: number;
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

interface DadosAtuais {
  atualizadoEm: string;
  totalEstabelecimentos: number;
  totalMunicipios: number;
  estabelecimentos: PrecoCombustivelResumo[];
}

interface GeoCache {
  [cnpj: string]: {
    latitude: number;
    longitude: number;
    fonte: 'sefaz' | 'nominatim' | 'opencage' | 'locationiq';
    atualizadoEm: string;
  };
}

interface ResumoMunicipio {
  codigoIBGE: string;
  municipio: string;
  atualizadoEm: string;
  totalEstabelecimentos: number;
  combustiveis: {
    [tipo: number]: {
      totalPostos: number;
      valorMinimo: number;
      valorMaximo: number;
      valorMedio: number;
    };
  };
  estabelecimentos: PrecoCombustivelResumo[];
}

interface CentroMunicipio {
  codigo_ibge: string;
  municipio: string;
  latitude: number;
  longitude: number;
}

// Cache de geocodificação em memória
let geoCache: GeoCache = {};
let falhaCache: FalhaCache = {};
let centrosMunicipios: Map<string, CentroMunicipio> = new Map();

/**
 * Calcula distância entre dois pontos usando fórmula de Haversine (em km)
 */
function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Carrega os centros dos municípios
 */
function carregarCentrosMunicipios(): void {
  if (fs.existsSync(MUNICIPIOS_CENTRO_PATH)) {
    try {
      const conteudo: CentroMunicipio[] = JSON.parse(
        fs.readFileSync(MUNICIPIOS_CENTRO_PATH, 'utf-8')
      );
      for (const centro of conteudo) {
        centrosMunicipios.set(centro.codigo_ibge, centro);
      }
      console.log(`✓ Centros de municípios carregados (${centrosMunicipios.size})`);
    } catch (error) {
      console.warn('⚠ Erro ao carregar centros de municípios');
    }
  }
}

/**
 * Valida se as coordenadas estão dentro de uma distância razoável do município
 * E se não estão mais perto de outro município
 * Retorna true se válido, false se muito longe ou mais perto de outra cidade
 */
function validarCoordenadas(
  latitude: number,
  longitude: number,
  codigoIBGE: string,
  nomeMunicipio: string
): { valido: boolean; distancia: number; motivo?: string } {
  const centroEsperado = centrosMunicipios.get(codigoIBGE);
  
  if (!centroEsperado) {
    // Se não temos o centro, aceita mas avisa
    return { valido: true, distancia: -1, motivo: 'centro não encontrado' };
  }
  
  const distanciaEsperada = calcularDistanciaKm(
    latitude,
    longitude,
    centroEsperado.latitude,
    centroEsperado.longitude
  );
  
  // Verificação 1: distância máxima do centro
  if (distanciaEsperada > DISTANCIA_MAXIMA_KM) {
    return {
      valido: false,
      distancia: distanciaEsperada,
      motivo: `${distanciaEsperada.toFixed(1)}km do centro de ${nomeMunicipio} (máx: ${DISTANCIA_MAXIMA_KM}km)`
    };
  }
  
  // Verificação 2: mais perto de outro município?
  let municipioMaisProximo = centroEsperado;
  let distanciaMaisProxima = distanciaEsperada;
  
  centrosMunicipios.forEach((centro, codigo) => {
    if (codigo === codigoIBGE) return;
    
    const dist = calcularDistanciaKm(latitude, longitude, centro.latitude, centro.longitude);
    if (dist < distanciaMaisProxima) {
      distanciaMaisProxima = dist;
      municipioMaisProximo = centro;
    }
  });
  
  if (municipioMaisProximo.codigo_ibge !== codigoIBGE) {
    return {
      valido: false,
      distancia: distanciaEsperada,
      motivo: `mais perto de ${municipioMaisProximo.municipio} (${distanciaMaisProxima.toFixed(1)}km) que de ${nomeMunicipio} (${distanciaEsperada.toFixed(1)}km)`
    };
  }
  
  return { valido: true, distancia: distanciaEsperada };
}

/**
 * Carrega o cache de falhas
 */
function carregarFalhaCache(): void {
  if (fs.existsSync(FALHA_CACHE_PATH)) {
    try {
      const conteudo = fs.readFileSync(FALHA_CACHE_PATH, 'utf-8');
      falhaCache = JSON.parse(conteudo);
      
      // Remove entradas expiradas
      const agora = Date.now();
      let removidas = 0;
      for (const cnpj of Object.keys(falhaCache)) {
        const entrada = falhaCache[cnpj];
        const idade = agora - new Date(entrada.ultimaTentativa).getTime();
        if (idade > FALHA_EXPIRY_MS) {
          delete falhaCache[cnpj];
          removidas++;
        }
      }
      if (removidas > 0) {
        console.log(`✓ ${removidas} falhas expiradas removidas do cache`);
      }
    } catch {
      falhaCache = {};
    }
  }
}

/**
 * Salva o cache de falhas
 */
function salvarFalhaCache(): void {
  fs.writeFileSync(FALHA_CACHE_PATH, JSON.stringify(falhaCache, null, 2));
}

/**
 * Verifica se deve pular tentativa (muitas falhas recentes)
 */
function devePularTentativa(cnpj: string): boolean {
  const entrada = falhaCache[cnpj];
  if (!entrada) return false;
  
  // Se falhou 3+ vezes nas últimas 24h, pula
  if (entrada.tentativas >= 3) {
    return true;
  }
  
  return false;
}

/**
 * Registra uma falha de geocodificação
 */
function registrarFalha(cnpj: string): void {
  const entrada = falhaCache[cnpj] || { tentativas: 0, ultimaTentativa: '' };
  entrada.tentativas++;
  entrada.ultimaTentativa = new Date().toISOString();
  falhaCache[cnpj] = entrada;
}

/**
 * Carrega o cache de geocodificação
 */
function carregarGeoCache(): void {
  if (fs.existsSync(GEOCACHE_PATH)) {
    try {
      const conteudo = fs.readFileSync(GEOCACHE_PATH, 'utf-8');
      geoCache = JSON.parse(conteudo);
      console.log(`✓ Cache carregado (${Object.keys(geoCache).length} endereços)`);
    } catch {
      console.warn('⚠ Erro ao carregar cache, iniciando vazio');
      geoCache = {};
    }
  }
}

/**
 * Salva o cache de geocodificação
 */
function salvarGeoCache(): void {
  fs.writeFileSync(GEOCACHE_PATH, JSON.stringify(geoCache, null, 2), 'utf-8');
}

/**
 * Salva JSON em arquivo
 */
function salvarJSON(caminho: string, dados: unknown): void {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}

// Supabase client (lazy init)
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null;
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      db: { schema: 'public' },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabase;
}

/**
 * Atualiza coordenadas no Supabase
 */
async function atualizarSupabase(
  cnpj: string,
  latitude: number,
  longitude: number,
  fonte: string
): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client
    .from('estabelecimentos')
    .update({ latitude, longitude, geocode_source: fonte })
    .eq('cnpj', cnpj);

  return !error;
}

/**
 * Geocodifica um endereço usando Nominatim (OpenStreetMap)
 */
async function geocodificarNominatim(
  query: string
): Promise<{ latitude: number; longitude: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'br',
  });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Litrometro/1.0 (https://litrometro.app)',
      },
    });

    if (!response.ok) return null;

    const data = await response.json() as Array<{ lat: string; lon: string }>;
    
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    // Silencia erros
  }

  return null;
}

/**
 * Geocodifica um endereço usando OpenCage
 * Docs: https://opencagedata.com/api
 */
async function geocodificarOpenCage(
  query: string
): Promise<{ latitude: number; longitude: number } | null> {
  if (!OPENCAGE_API_KEY) return null;

  const url = `https://api.opencagedata.com/geocode/v1/json?` + new URLSearchParams({
    q: query,
    key: OPENCAGE_API_KEY,
    countrycode: 'br',
    limit: '1',
    no_annotations: '1',
  });

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json() as {
      results: Array<{ geometry: { lat: number; lng: number } }>;
    };
    
    if (data.results && data.results.length > 0) {
      return {
        latitude: data.results[0].geometry.lat,
        longitude: data.results[0].geometry.lng,
      };
    }
  } catch (error) {
    // Silencia erros
  }

  return null;
}

/**
 * Geocodifica um endereço usando LocationIQ
 * Docs: https://locationiq.com/docs
 */
async function geocodificarLocationIQ(
  query: string
): Promise<{ latitude: number; longitude: number } | null> {
  if (!LOCATIONIQ_API_KEY) return null;

  const url = `https://us1.locationiq.com/v1/search?` + new URLSearchParams({
    q: query,
    key: LOCATIONIQ_API_KEY,
    countrycodes: 'br',
    format: 'json',
    limit: '1',
  });

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json() as Array<{ lat: string; lon: string }>;
    
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    // Silencia erros
  }

  return null;
}

/**
 * Tenta geocodificar com uma query específica usando todos os provedores
 */
async function tentarGeocodificar(
  query: string
): Promise<{ latitude: number; longitude: number; fonte: 'nominatim' | 'opencage' | 'locationiq' } | null> {
  // Tenta Nominatim primeiro (gratuito, sem API key)
  let coords = await geocodificarNominatim(query);
  if (coords) {
    return { ...coords, fonte: 'nominatim' };
  }
  
  // Fallback: OpenCage (se configurado)
  if (OPENCAGE_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 200));
    coords = await geocodificarOpenCage(query);
    if (coords) {
      return { ...coords, fonte: 'opencage' };
    }
  }
  
  // Fallback: LocationIQ (se configurado)
  if (LOCATIONIQ_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 200));
    coords = await geocodificarLocationIQ(query);
    if (coords) {
      return { ...coords, fonte: 'locationiq' };
    }
  }

  return null;
}

/**
 * Geocodifica um endereço usando múltiplos provedores em cascata
 * Valida se as coordenadas estão próximas do município esperado
 */
async function geocodificarEndereco(
  logradouro: string,
  numero: string,
  bairro: string,
  municipio: string,
  codigoIBGE: string
): Promise<GeoResult | null> {
  // Estratégias de busca, da mais específica para a mais genérica
  const estrategias: string[] = [];
  
  // 1. Endereço completo
  const partesCompletas = [logradouro, numero, bairro, municipio, 'AL', 'Brasil']
    .filter(p => p && p.trim() && p !== 'S/N' && p !== 'SN');
  if (partesCompletas.length >= 3) {
    estrategias.push(partesCompletas.join(', '));
  }
  
  // 2. Sem número
  const semNumero = [logradouro, bairro, municipio, 'AL', 'Brasil']
    .filter(p => p && p.trim());
  if (semNumero.length >= 3) {
    estrategias.push(semNumero.join(', '));
  }
  
  // 3. Só logradouro + município
  if (logradouro && municipio) {
    estrategias.push(`${logradouro}, ${municipio}, AL, Brasil`);
  }
  
  // 4. Só bairro + município
  if (bairro && municipio && bairro.toUpperCase() !== 'ZONA RURAL') {
    estrategias.push(`${bairro}, ${municipio}, AL, Brasil`);
  }
  
  // 5. Só município (fallback para centro da cidade)
  if (municipio) {
    estrategias.push(`${municipio}, Alagoas, Brasil`);
  }
  
  // Remove duplicatas mantendo ordem
  const estrategiasUnicas = Array.from(new Set(estrategias));
  
  // Tenta cada estratégia
  for (const query of estrategiasUnicas) {
    const coords = await tentarGeocodificar(query);
    
    if (coords) {
      // Valida se está no município correto
      const validacao = validarCoordenadas(
        coords.latitude,
        coords.longitude,
        codigoIBGE,
        municipio
      );
      
      if (validacao.valido) {
        if (validacao.distancia >= 0) {
          console.log(`     → Query: "${query.substring(0, 50)}..." → ${validacao.distancia.toFixed(1)}km do centro ✓`);
        }
        return coords;
      } else {
        console.log(`     → Query: "${query.substring(0, 50)}..." → REJEITADO: ${validacao.motivo}`);
        // Continua tentando outras estratégias
        await new Promise(resolve => setTimeout(resolve, 1100)); // Rate limit Nominatim
      }
    } else {
      // Rate limit entre tentativas
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
  }

  return null;
}

/**
 * Função principal
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Geocodificação de estabelecimentos');
  console.log(`Data/Hora: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // Carrega dados atuais
  if (!fs.existsSync(ATUAL_PATH)) {
    console.error('❌ Arquivo atual.json não encontrado!');
    console.error('   Execute primeiro: npm run collect');
    process.exit(1);
  }

  const dadosAtuais: DadosAtuais = JSON.parse(fs.readFileSync(ATUAL_PATH, 'utf-8'));
  console.log(`✓ ${dadosAtuais.totalEstabelecimentos} estabelecimentos carregados`);

  // Carrega caches e centros de municípios
  carregarGeoCache();
  carregarFalhaCache();
  carregarCentrosMunicipios();

  // Valida e remove coordenadas incorretas do cache
  const estabelecimentosPorCNPJ = new Map<string, { codigo_ibge: string; municipio: string }>();
  for (const est of dadosAtuais.estabelecimentos) {
    if (!estabelecimentosPorCNPJ.has(est.cnpj)) {
      estabelecimentosPorCNPJ.set(est.cnpj, { codigo_ibge: est.codigo_ibge, municipio: est.municipio });
    }
  }
  
  let coordenadasInvalidas = 0;
  const cnpjsParaRemover: string[] = [];
  
  for (const [cnpj, cache] of Object.entries(geoCache)) {
    const est = estabelecimentosPorCNPJ.get(cnpj);
    if (!est) continue;
    
    const validacao = validarCoordenadas(cache.latitude, cache.longitude, est.codigo_ibge, est.municipio);
    if (!validacao.valido) {
      console.log(`⚠️ Coordenadas inválidas removidas: ${cnpj} (${validacao.motivo}, ${validacao.distancia?.toFixed(1)}km)`);
      cnpjsParaRemover.push(cnpj);
      coordenadasInvalidas++;
    }
  }
  
  for (const cnpj of cnpjsParaRemover) {
    delete geoCache[cnpj];
  }
  
  if (coordenadasInvalidas > 0) {
    console.log(`✓ ${coordenadasInvalidas} coordenadas inválidas removidas do cache`);
    salvarGeoCache();
  }

  // Salva coordenadas da SEFAZ no cache (se ainda não estiverem e forem válidas)
  let novosDoSefaz = 0;
  let sefazInvalidos = 0;
  for (const est of dadosAtuais.estabelecimentos) {
    if (est.latitude !== 0 && est.longitude !== 0 && !geoCache[est.cnpj]) {
      // Valida coordenadas da SEFAZ antes de adicionar ao cache
      const validacao = validarCoordenadas(est.latitude, est.longitude, est.codigo_ibge, est.municipio);
      if (validacao.valido) {
        geoCache[est.cnpj] = {
          latitude: est.latitude,
          longitude: est.longitude,
          fonte: 'sefaz',
          atualizadoEm: new Date().toISOString(),
        };
        novosDoSefaz++;
      } else {
        sefazInvalidos++;
      }
    }
  }
  if (novosDoSefaz > 0) {
    console.log(`✓ ${novosDoSefaz} novos endereços válidos da SEFAZ adicionados ao cache`);
  }
  if (sefazInvalidos > 0) {
    console.log(`⚠️ ${sefazInvalidos} endereços da SEFAZ rejeitados (coordenadas fora do município)`);
  }

  // Identifica estabelecimentos que precisam de geocodificação:
  // - Sem coordenadas (latitude=0 ou longitude=0)
  // - Ou com coordenadas mas não no cache (coordenadas inválidas foram removidas)
  const precisaGeocodificar = dadosAtuais.estabelecimentos.filter(
    e => !geoCache[e.cnpj]
  );

  // Agrupa por CNPJ para evitar duplicatas (mesmo posto com diferentes combustíveis)
  const cnpjsUnicos = Array.from(new Set(precisaGeocodificar.map(e => e.cnpj)));
  const estabelecimentosUnicos = cnpjsUnicos.map(
    cnpj => precisaGeocodificar.find(e => e.cnpj === cnpj)!
  );

  // Filtra estabelecimentos que já falharam muitas vezes (serão retentados após 24h)
  const paraGeocodificar = estabelecimentosUnicos.filter(e => !devePularTentativa(e.cnpj));
  const pulados = estabelecimentosUnicos.length - paraGeocodificar.length;

  if (paraGeocodificar.length === 0 && pulados > 0) {
    console.log(`\n⏳ ${pulados} estabelecimentos aguardando cooldown (muitas falhas recentes)`);
    console.log('✓ Todos os estabelecimentos já foram tentados!');
    salvarGeoCache();
    salvarFalhaCache();
    return;
  }

  if (paraGeocodificar.length === 0) {
    console.log('\n✓ Todos os estabelecimentos já possuem coordenadas!');
    salvarGeoCache();
    return;
  }

  console.log(`\n🗺️ Geocodificando ${paraGeocodificar.length} estabelecimentos sem coordenadas...`);
  if (pulados > 0) {
    console.log(`   (${pulados} pulados por falhas recentes - tentativa após 24h)`);
  }
  
  // Mostra provedores disponíveis
  const provedores = ['Nominatim'];
  if (OPENCAGE_API_KEY) provedores.push('OpenCage');
  if (LOCATIONIQ_API_KEY) provedores.push('LocationIQ');
  console.log(`   Provedores: ${provedores.join(' → ')}\n`);

  let sucesso = 0;
  let falha = 0;

  for (let i = 0; i < paraGeocodificar.length; i++) {
    const est = paraGeocodificar[i];
    const progresso = `[${i + 1}/${paraGeocodificar.length}]`;
    
    console.log(`${progresso} 🔍 ${est.nome_fantasia || est.razao_social} - ${est.municipio}`);
    
    // Tenta geocodificar com validação de município
    const coords = await geocodificarEndereco(
      est.nome_logradouro,
      est.numero_imovel,
      est.bairro,
      est.municipio,
      est.codigo_ibge
    );

    if (coords) {
      geoCache[est.cnpj] = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        fonte: coords.fonte,
        atualizadoEm: new Date().toISOString(),
      };
      
      // Update Supabase too
      await atualizarSupabase(est.cnpj, coords.latitude, coords.longitude, coords.fonte);
      
      console.log(`${progresso} ✓ Geocodificado com sucesso [${coords.fonte}]`);
      sucesso++;
    } else {
      console.log(`${progresso} ✗ Não foi possível geocodificar (coordenadas inválidas ou não encontradas)`);
      registrarFalha(est.cnpj);
      falha++;
    }

    // Rate limit entre estabelecimentos (já incluso nas tentativas internas)
  }

  // Salva caches atualizados
  salvarGeoCache();
  salvarFalhaCache();
  console.log(`\n✓ Cache salvo: ${GEOCACHE_PATH}`);

  // Aplica coordenadas do cache aos dados e salva
  let atualizados = 0;
  for (const est of dadosAtuais.estabelecimentos) {
    if ((est.latitude === 0 || est.longitude === 0) && geoCache[est.cnpj]) {
      est.latitude = geoCache[est.cnpj].latitude;
      est.longitude = geoCache[est.cnpj].longitude;
      atualizados++;
    }
  }

  if (atualizados > 0) {
    // Salva atual.json atualizado
    salvarJSON(ATUAL_PATH, dadosAtuais);
    console.log(`✓ ${atualizados} registros atualizados em atual.json`);

    // Atualiza arquivos de município
    const municipiosDir = path.join(DADOS_DIR, 'municipios');
    const arquivos = fs.readdirSync(municipiosDir).filter(f => f.endsWith('.json'));
    
    for (const arquivo of arquivos) {
      const caminho = path.join(municipiosDir, arquivo);
      const resumo: ResumoMunicipio = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
      
      let modificado = false;
      for (const est of resumo.estabelecimentos) {
        if ((est.latitude === 0 || est.longitude === 0) && geoCache[est.cnpj]) {
          est.latitude = geoCache[est.cnpj].latitude;
          est.longitude = geoCache[est.cnpj].longitude;
          modificado = true;
        }
      }

      if (modificado) {
        salvarJSON(caminho, resumo);
      }
    }
    console.log(`✓ Arquivos de município atualizados`);
  }

  // Estatísticas finais
  const totalComCoordenadas = dadosAtuais.estabelecimentos.filter(
    e => e.latitude !== 0 && e.longitude !== 0
  ).length;

  console.log('\n' + '='.repeat(60));
  console.log('Geocodificação finalizada!');
  console.log(`Sucesso: ${sucesso} | Falha: ${falha}`);
  console.log(`Total com coordenadas: ${totalComCoordenadas}/${dadosAtuais.totalEstabelecimentos}`);
  console.log(`Cache: ${Object.keys(geoCache).length} endereços`);
  console.log('='.repeat(60));
}

// Executa
main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
