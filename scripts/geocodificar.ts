/**
 * Script de geocodificação de estabelecimentos
 * Executa via GitHub Actions ou manualmente
 * Busca coordenadas usando múltiplos provedores em cascata:
 * 1. Nominatim (OpenStreetMap) - gratuito, 1 req/s
 * 2. OpenCage - 2.500/dia gratuito (se configurado)
 * 3. LocationIQ - 5.000/dia gratuito (se configurado)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// Configuração
const DADOS_DIR = path.join(process.cwd(), 'public', 'dados');
const GEOCACHE_PATH = path.join(DADOS_DIR, 'geocache.json');
const ATUAL_PATH = path.join(DADOS_DIR, 'atual.json');

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

// Cache de geocodificação em memória
let geoCache: GeoCache = {};
let falhaCache: FalhaCache = {};

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
 * Geocodifica um endereço usando múltiplos provedores em cascata
 */
async function geocodificarEndereco(
  logradouro: string,
  numero: string,
  bairro: string,
  municipio: string
): Promise<GeoResult | null> {
  // Monta query de busca
  const partes = [
    logradouro,
    numero,
    bairro,
    municipio,
    'AL',
    'Brasil'
  ].filter(p => p && p.trim());
  
  const query = partes.join(', ');
  
  // Tenta Nominatim primeiro (gratuito, sem API key)
  let coords = await geocodificarNominatim(query);
  if (coords) {
    return { ...coords, fonte: 'nominatim' };
  }
  
  // Fallback: OpenCage (se configurado)
  if (OPENCAGE_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
    coords = await geocodificarOpenCage(query);
    if (coords) {
      return { ...coords, fonte: 'opencage' };
    }
  }
  
  // Fallback: LocationIQ (se configurado)
  if (LOCATIONIQ_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
    coords = await geocodificarLocationIQ(query);
    if (coords) {
      return { ...coords, fonte: 'locationiq' };
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

  // Carrega cache
  carregarGeoCache();
  carregarFalhaCache();

  // Salva coordenadas da SEFAZ no cache (se ainda não estiverem)
  let novosDoSefaz = 0;
  for (const est of dadosAtuais.estabelecimentos) {
    if (est.latitude !== 0 && est.longitude !== 0 && !geoCache[est.cnpj]) {
      geoCache[est.cnpj] = {
        latitude: est.latitude,
        longitude: est.longitude,
        fonte: 'sefaz',
        atualizadoEm: new Date().toISOString(),
      };
      novosDoSefaz++;
    }
  }
  if (novosDoSefaz > 0) {
    console.log(`✓ ${novosDoSefaz} novos endereços da SEFAZ adicionados ao cache`);
  }

  // Identifica estabelecimentos sem coordenadas que não estão no cache
  const semCoordenadas = dadosAtuais.estabelecimentos.filter(
    e => (e.latitude === 0 || e.longitude === 0) && !geoCache[e.cnpj]
  );

  // Agrupa por CNPJ para evitar duplicatas (mesmo posto com diferentes combustíveis)
  const cnpjsUnicos = Array.from(new Set(semCoordenadas.map(e => e.cnpj)));
  const estabelecimentosUnicos = cnpjsUnicos.map(
    cnpj => semCoordenadas.find(e => e.cnpj === cnpj)!
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
    
    // Tenta geocodificar
    const coords = await geocodificarEndereco(
      est.nome_logradouro,
      est.numero_imovel,
      est.bairro,
      est.municipio
    );

    if (coords) {
      geoCache[est.cnpj] = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        fonte: coords.fonte,
        atualizadoEm: new Date().toISOString(),
      };
      console.log(`${progresso} ✓ ${est.nome_fantasia || est.razao_social} - ${est.municipio} [${coords.fonte}]`);
      sucesso++;
    } else {
      console.log(`${progresso} ✗ ${est.nome_fantasia || est.razao_social} - ${est.municipio}`);
      registrarFalha(est.cnpj);
      falha++;
    }

    // Respeita limite de 1 req/segundo do Nominatim
    if (i < paraGeocodificar.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
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
