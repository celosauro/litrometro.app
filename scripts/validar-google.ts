/**
 * Script de validação de coordenadas usando Google Maps Geocoding API
 * 
 * Compara coordenadas existentes com as retornadas pelo Google Maps
 * e corrige automaticamente as que estiverem muito distantes.
 * 
 * Uso:
 *   npx tsx scripts/validar-google.ts                    # Apenas validar
 *   npx tsx scripts/validar-google.ts --corrigir         # Validar e corrigir
 *   npx tsx scripts/validar-google.ts --limite=50        # Limitar a 50 estabelecimentos
 *   npx tsx scripts/validar-google.ts --municipio=Maceió # Filtrar por município
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Configurações
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const DADOS_DIR = path.join(process.cwd(), 'public', 'dados');
const ATUAL_JSON = path.join(DADOS_DIR, 'atual.json');
const GEOCACHE_JSON = path.join(DADOS_DIR, 'geocache.json');
const GOOGLE_CACHE_JSON = path.join(DADOS_DIR, 'geocache-google.json');
const RELATORIO_JSON = path.join(DADOS_DIR, 'validacao-google.json');

// Limiares de distância (em metros)
const LIMITE_OK = 100;          // < 100m = coordenadas corretas
const LIMITE_SUSPEITO = 500;    // 100-500m = suspeito, verificar
// > 500m = incorreto, corrigir automaticamente

// Confiança das fontes (para decidir se deve sobrescrever)
const CONFIANCA_FONTES: Record<string, number> = {
  'manual': 100,      // Correção manual = mais confiável
  'google': 95,       // Google Maps = muito confiável
  'sefaz': 90,        // Dados originais do SEFAZ
  'opencage': 70,     // OpenCage
  'nominatim': 60,    // Nominatim
  'locationiq': 50,   // LocationIQ
};

interface Estabelecimento {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  nome_logradouro: string;
  numero_imovel: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  codigo_ibge: number;
  cep: string;
  latitude: number;
  longitude: number;
}

interface DadosAtuais {
  atualizadoEm: string;
  totalEstabelecimentos: number;
  totalMunicipios: number;
  estabelecimentos: Estabelecimento[];
}

interface CacheEntry {
  latitude: number;
  longitude: number;
  fonte: string;
  data?: string;
  endereco_formatado?: string;
}

interface GoogleGeocodeResult {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
    };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
}

interface ResultadoValidacao {
  cnpj: string;
  nome: string;
  endereco: string;
  municipio: string;
  coordenadas_atuais: { lat: number; lng: number };
  coordenadas_google: { lat: number; lng: number } | null;
  distancia_metros: number | null;
  status: 'OK' | 'SUSPEITO' | 'INCORRETO' | 'NOVO' | 'ERRO_API';
  corrigido: boolean;
  fonte_atual: string;
}

// Calcula distância entre dois pontos (Haversine formula)
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Busca coordenadas no Google Maps
async function geocodeGoogle(endereco: string): Promise<{ lat: number; lng: number; formatted: string } | null> {
  if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_MAPS_API_KEY não configurada no .env');
    return null;
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', endereco);
  url.searchParams.set('key', GOOGLE_API_KEY);
  url.searchParams.set('region', 'br');
  url.searchParams.set('language', 'pt-BR');

  try {
    const response = await fetch(url.toString());
    const data: GoogleGeocodeResult = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted: result.formatted_address
      };
    }

    if (data.status === 'ZERO_RESULTS') {
      return null;
    }

    console.error(`⚠️ Google API erro: ${data.status}`);
    return null;
  } catch (error) {
    console.error(`❌ Erro ao chamar Google API: ${error}`);
    return null;
  }
}

// Carrega ou cria cache do Google
function carregarCacheGoogle(): Record<string, CacheEntry> {
  try {
    if (fs.existsSync(GOOGLE_CACHE_JSON)) {
      return JSON.parse(fs.readFileSync(GOOGLE_CACHE_JSON, 'utf-8'));
    }
  } catch (error) {
    console.error('⚠️ Erro ao carregar cache do Google, criando novo');
  }
  return {};
}

// Salva cache do Google
function salvarCacheGoogle(cache: Record<string, CacheEntry>): void {
  fs.writeFileSync(GOOGLE_CACHE_JSON, JSON.stringify(cache, null, 2), 'utf-8');
}

// Monta endereço completo para geocodificação
function montarEndereco(est: Estabelecimento): string {
  const partes = [
    est.nome_logradouro,
    est.numero_imovel,
    est.bairro,
    est.municipio,
    'AL',
    'Brasil'
  ].filter(Boolean);
  
  return partes.join(', ');
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const corrigir = args.includes('--corrigir');
  const limiteArg = args.find(a => a.startsWith('--limite='));
  const limite = limiteArg ? parseInt(limiteArg.split('=')[1]) : Infinity;
  const municipioArg = args.find(a => a.startsWith('--municipio='));
  const municipioFiltro = municipioArg ? municipioArg.split('=')[1] : null;

  console.log('🔍 Validação de Coordenadas com Google Maps');
  console.log('━'.repeat(50));
  console.log(`Modo: ${corrigir ? 'VALIDAR E CORRIGIR' : 'APENAS VALIDAR'}`);
  if (limite < Infinity) console.log(`Limite: ${limite} estabelecimentos`);
  if (municipioFiltro) console.log(`Município: ${municipioFiltro}`);
  console.log('━'.repeat(50));

  if (!GOOGLE_API_KEY) {
    console.error('❌ Configure GOOGLE_MAPS_API_KEY no arquivo .env');
    process.exit(1);
  }

  // Carregar dados
  const dadosAtuais: DadosAtuais = JSON.parse(fs.readFileSync(ATUAL_JSON, 'utf-8'));
  const atual = dadosAtuais.estabelecimentos;
  const geocache: Record<string, CacheEntry> = JSON.parse(fs.readFileSync(GEOCACHE_JSON, 'utf-8'));
  const googleCache = carregarCacheGoogle();

  console.log(`📊 ${atual.length} estabelecimentos no atual.json`);
  console.log(`📍 ${Object.keys(geocache).length} entradas no geocache.json`);
  console.log(`🔍 ${Object.keys(googleCache).length} entradas no cache Google`);
  console.log('');

  // Filtrar estabelecimentos
  let estabelecimentos = atual;
  if (municipioFiltro) {
    estabelecimentos = atual.filter(e => 
      e.municipio.toLowerCase().includes(municipioFiltro.toLowerCase())
    );
    console.log(`🏙️ ${estabelecimentos.length} estabelecimentos em ${municipioFiltro}`);
  }

  // Remover duplicatas por CNPJ
  const cnpjsUnicos = new Map<string, Estabelecimento>();
  for (const est of estabelecimentos) {
    if (!cnpjsUnicos.has(est.cnpj)) {
      cnpjsUnicos.set(est.cnpj, est);
    }
  }
  estabelecimentos = Array.from(cnpjsUnicos.values()).slice(0, limite);
  
  console.log(`🎯 Validando ${estabelecimentos.length} estabelecimentos únicos`);
  console.log('');

  const resultados: ResultadoValidacao[] = [];
  let validados = 0;
  let corrigidos = 0;
  let erros = 0;
  let ok = 0;
  let suspeitos = 0;
  let incorretos = 0;

  for (const est of estabelecimentos) {
    const endereco = montarEndereco(est);
    const cacheEntry = geocache[est.cnpj];
    const fonteAtual = cacheEntry?.fonte || 'desconhecida';

    // Pular se já foi corrigido manualmente
    if (fonteAtual === 'manual') {
      console.log(`⏭️ ${est.nome_fantasia || est.razao_social} - correção manual, pulando`);
      resultados.push({
        cnpj: est.cnpj,
        nome: est.nome_fantasia || est.razao_social,
        endereco,
        municipio: est.municipio,
        coordenadas_atuais: { lat: est.latitude, lng: est.longitude },
        coordenadas_google: null,
        distancia_metros: null,
        status: 'OK',
        corrigido: false,
        fonte_atual: fonteAtual
      });
      ok++;
      continue;
    }

    // Verificar cache do Google
    let googleCoords = googleCache[est.cnpj];
    
    if (!googleCoords) {
      // Buscar no Google
      console.log(`🔍 Geocodificando: ${est.nome_fantasia || est.razao_social}`);
      const resultado = await geocodeGoogle(endereco);
      
      if (resultado) {
        googleCoords = {
          latitude: resultado.lat,
          longitude: resultado.lng,
          fonte: 'google',
          data: new Date().toISOString(),
          endereco_formatado: resultado.formatted
        };
        googleCache[est.cnpj] = googleCoords;
        
        // Salvar cache a cada 50 entradas
        if (Object.keys(googleCache).length % 50 === 0) {
          salvarCacheGoogle(googleCache);
        }
      } else {
        console.log(`❌ Google não encontrou: ${endereco}`);
        resultados.push({
          cnpj: est.cnpj,
          nome: est.nome_fantasia || est.razao_social,
          endereco,
          municipio: est.municipio,
          coordenadas_atuais: { lat: est.latitude, lng: est.longitude },
          coordenadas_google: null,
          distancia_metros: null,
          status: 'ERRO_API',
          corrigido: false,
          fonte_atual: fonteAtual
        });
        erros++;
        continue;
      }
      
      // Rate limiting: 100ms entre chamadas (10 QPS)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calcular distância
    const distancia = calcularDistancia(
      est.latitude, est.longitude,
      googleCoords.latitude, googleCoords.longitude
    );

    let status: 'OK' | 'SUSPEITO' | 'INCORRETO' | 'NOVO';
    if (!est.latitude || !est.longitude || (est.latitude === 0 && est.longitude === 0)) {
      status = 'NOVO';
    } else if (distancia < LIMITE_OK) {
      status = 'OK';
      ok++;
    } else if (distancia < LIMITE_SUSPEITO) {
      status = 'SUSPEITO';
      suspeitos++;
    } else {
      status = 'INCORRETO';
      incorretos++;
    }

    const resultado: ResultadoValidacao = {
      cnpj: est.cnpj,
      nome: est.nome_fantasia || est.razao_social,
      endereco,
      municipio: est.municipio,
      coordenadas_atuais: { lat: est.latitude, lng: est.longitude },
      coordenadas_google: { lat: googleCoords.latitude, lng: googleCoords.longitude },
      distancia_metros: Math.round(distancia),
      status,
      corrigido: false,
      fonte_atual: fonteAtual
    };

    // Exibir status
    const distanciaStr = distancia < 1000 
      ? `${Math.round(distancia)}m` 
      : `${(distancia/1000).toFixed(1)}km`;
    
    const emoji = status === 'OK' ? '✅' : status === 'SUSPEITO' ? '⚠️' : '❌';
    console.log(`${emoji} ${est.nome_fantasia || est.razao_social} - ${distanciaStr} (${status})`);

    // Corrigir se solicitado e necessário
    if (corrigir && (status === 'INCORRETO' || status === 'NOVO')) {
      const confiancaAtual = CONFIANCA_FONTES[fonteAtual] || 0;
      const confiancaGoogle = CONFIANCA_FONTES['google'];

      if (confiancaGoogle > confiancaAtual) {
        // Atualizar geocache
        geocache[est.cnpj] = {
          latitude: googleCoords.latitude,
          longitude: googleCoords.longitude,
          fonte: 'google',
          data: new Date().toISOString(),
          endereco_formatado: googleCoords.endereco_formatado
        };

        // Atualizar atual.json (todas as ocorrências do CNPJ)
        for (const e of atual) {
          if (e.cnpj === est.cnpj) {
            e.latitude = googleCoords.latitude;
            e.longitude = googleCoords.longitude;
          }
        }

        resultado.corrigido = true;
        corrigidos++;
        console.log(`   ↳ 🔧 Corrigido: (${googleCoords.latitude}, ${googleCoords.longitude})`);
      }
    }

    resultados.push(resultado);
    validados++;
  }

  // Salvar caches e dados
  salvarCacheGoogle(googleCache);
  
  if (corrigir && corrigidos > 0) {
    fs.writeFileSync(GEOCACHE_JSON, JSON.stringify(geocache, null, 2), 'utf-8');
    dadosAtuais.estabelecimentos = atual;
    dadosAtuais.atualizadoEm = new Date().toISOString();
    fs.writeFileSync(ATUAL_JSON, JSON.stringify(dadosAtuais, null, 2), 'utf-8');
    console.log('');
    console.log('💾 Arquivos atualizados: geocache.json, atual.json');
  }

  // Salvar relatório
  const relatorio = {
    data: new Date().toISOString(),
    modo: corrigir ? 'corrigir' : 'validar',
    total_validados: validados,
    ok,
    suspeitos,
    incorretos,
    erros,
    corrigidos,
    resultados: resultados.filter(r => r.status !== 'OK')
  };
  fs.writeFileSync(RELATORIO_JSON, JSON.stringify(relatorio, null, 2), 'utf-8');

  // Resumo final
  console.log('');
  console.log('━'.repeat(50));
  console.log('📊 RESUMO DA VALIDAÇÃO');
  console.log('━'.repeat(50));
  console.log(`✅ OK (< ${LIMITE_OK}m): ${ok}`);
  console.log(`⚠️ Suspeitos (${LIMITE_OK}-${LIMITE_SUSPEITO}m): ${suspeitos}`);
  console.log(`❌ Incorretos (> ${LIMITE_SUSPEITO}m): ${incorretos}`);
  console.log(`🔴 Erros API: ${erros}`);
  if (corrigir) {
    console.log(`🔧 Corrigidos: ${corrigidos}`);
  }
  console.log('');
  console.log(`📄 Relatório salvo em: ${RELATORIO_JSON}`);
  
  // Listar suspeitos e incorretos
  const problematicos = resultados.filter(r => r.status === 'SUSPEITO' || r.status === 'INCORRETO');
  if (problematicos.length > 0 && !corrigir) {
    console.log('');
    console.log('⚠️ Estabelecimentos com coordenadas problemáticas:');
    for (const r of problematicos.slice(0, 10)) {
      console.log(`   - ${r.nome} (${r.municipio}): ${r.distancia_metros}m de diferença`);
    }
    if (problematicos.length > 10) {
      console.log(`   ... e mais ${problematicos.length - 10} outros`);
    }
    console.log('');
    console.log('💡 Execute com --corrigir para aplicar as correções automaticamente');
  }
}

main().catch(console.error);
