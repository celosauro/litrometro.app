/**
 * Script para atualizar coordenadas dos centros dos municípios
 * Usa Nominatim (OpenStreetMap) para obter centro urbano real
 * Atualiza apenas se diferença > 1km
 */

import fs from 'fs';
import path from 'path';

const MUNICIPIOS_CENTRO_PATH = path.join(process.cwd(), 'public/dados/municipios-centro.json');
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const DELAY_MS = 1100; // 1.1s entre requests (rate limit)

interface MunicipioCentro {
  codigo_ibge: string;
  municipio: string;
  latitude: number;
  longitude: number;
}

/**
 * Calcula distância entre dois pontos em km (fórmula Haversine)
 */
function calcularDistanciaKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
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
 * Busca coordenadas do centro urbano via Nominatim
 */
async function buscarCoordenadas(municipio: string): Promise<{ lat: number; lon: number } | null> {
  const query = `${municipio}, Alagoas, Brasil`;
  const url = `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Litrometro/1.0 (https://litrometro.app; contato@litrometro.app)'
      }
    });

    if (!response.ok) {
      console.error(`❌ Erro HTTP ${response.status} para ${municipio}`);
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error(`❌ Erro ao buscar ${municipio}:`, error);
    return null;
  }
}

/**
 * Aguarda um tempo em ms
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🗺️  Atualizador de Coordenadas dos Municípios');
  console.log('================================================\n');

  // Ler arquivo atual
  const conteudo = fs.readFileSync(MUNICIPIOS_CENTRO_PATH, 'utf-8');
  const municipios: MunicipioCentro[] = JSON.parse(conteudo);

  console.log(`📍 Total de municípios: ${municipios.length}`);
  console.log(`⏱️  Tempo estimado: ~${Math.ceil(municipios.length * DELAY_MS / 1000 / 60)} minutos\n`);

  // Fazer backup
  const backupPath = MUNICIPIOS_CENTRO_PATH.replace('.json', `-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, conteudo);
  console.log(`💾 Backup salvo em: ${path.basename(backupPath)}\n`);

  let atualizados = 0;
  let erros = 0;
  let semMudanca = 0;

  for (let i = 0; i < municipios.length; i++) {
    const mun = municipios[i];
    process.stdout.write(`[${i + 1}/${municipios.length}] ${mun.municipio.padEnd(25)} `);

    const coords = await buscarCoordenadas(mun.municipio);

    if (!coords) {
      console.log('❌ Não encontrado');
      erros++;
      await sleep(DELAY_MS);
      continue;
    }

    const distancia = calcularDistanciaKm(
      mun.latitude, mun.longitude,
      coords.lat, coords.lon
    );

    if (distancia > 1) {
      // Atualizar
      const oldLat = mun.latitude.toFixed(4);
      const oldLon = mun.longitude.toFixed(4);
      mun.latitude = coords.lat;
      mun.longitude = coords.lon;
      console.log(`✅ Atualizado (${distancia.toFixed(1)}km) [${oldLat},${oldLon}] → [${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}]`);
      atualizados++;
    } else {
      console.log(`⏭️  OK (${distancia.toFixed(2)}km)`);
      semMudanca++;
    }

    await sleep(DELAY_MS);
  }

  // Salvar arquivo atualizado
  fs.writeFileSync(
    MUNICIPIOS_CENTRO_PATH,
    JSON.stringify(municipios, null, 2),
    'utf-8'
  );

  console.log('\n================================================');
  console.log('📊 Resumo:');
  console.log(`   ✅ Atualizados: ${atualizados}`);
  console.log(`   ⏭️  Sem mudança: ${semMudanca}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log(`\n✨ Arquivo atualizado: ${path.basename(MUNICIPIOS_CENTRO_PATH)}`);
}

main().catch(console.error);
