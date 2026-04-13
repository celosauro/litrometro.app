/**
 * Script de geocodificação de estabelecimentos
 * Executa via GitHub Actions diariamente ou manualmente
 * Busca coordenadas via Nominatim (OpenStreetMap) para estabelecimentos sem localização
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// Configuração
const DADOS_DIR = path.join(process.cwd(), 'public', 'dados');
const GEOCACHE_PATH = path.join(DADOS_DIR, 'geocache.json');
const ATUAL_PATH = path.join(DADOS_DIR, 'atual.json');

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
    fonte: 'sefaz' | 'nominatim';
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
async function geocodificarEndereco(
  logradouro: string,
  numero: string,
  bairro: string,
  municipio: string
): Promise<{ latitude: number; longitude: number } | null> {
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
  
  // Nominatim API (gratuito, limite de 1 req/segundo)
  const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'br',
  });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Litrometro/1.0 (https://litrometro.pages.dev)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as Array<{ lat: string; lon: string }>;
    
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error(`  ⚠ Erro geocodificação: ${error}`);
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

  if (estabelecimentosUnicos.length === 0) {
    console.log('\n✓ Todos os estabelecimentos já possuem coordenadas!');
    salvarGeoCache();
    return;
  }

  console.log(`\n🗺️ Geocodificando ${estabelecimentosUnicos.length} estabelecimentos sem coordenadas...`);
  console.log('   (Limite: 1 requisição/segundo - Nominatim)\n');

  let sucesso = 0;
  let falha = 0;

  for (let i = 0; i < estabelecimentosUnicos.length; i++) {
    const est = estabelecimentosUnicos[i];
    const progresso = `[${i + 1}/${estabelecimentosUnicos.length}]`;
    
    // Tenta geocodificar
    const coords = await geocodificarEndereco(
      est.nome_logradouro,
      est.numero_imovel,
      est.bairro,
      est.municipio
    );

    if (coords) {
      geoCache[est.cnpj] = {
        ...coords,
        fonte: 'nominatim',
        atualizadoEm: new Date().toISOString(),
      };
      console.log(`${progresso} ✓ ${est.nome_fantasia || est.razao_social} - ${est.municipio}`);
      sucesso++;
    } else {
      console.log(`${progresso} ✗ ${est.nome_fantasia || est.razao_social} - ${est.municipio}`);
      falha++;
    }

    // Respeita limite de 1 req/segundo do Nominatim
    if (i < estabelecimentosUnicos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
  }

  // Salva cache atualizado
  salvarGeoCache();
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
