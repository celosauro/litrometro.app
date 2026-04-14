const fs = require('fs');
const path = require('path');

const geocache = JSON.parse(fs.readFileSync('./public/dados/geocache.json'));

// Contar por fonte no geocache
const total = Object.keys(geocache).length;
const porFonte = {};
let geocacheZerado = 0;
Object.entries(geocache).forEach(([cnpj, d]) => {
  const fonte = d.fonte || 'desconhecido';
  porFonte[fonte] = (porFonte[fonte] || 0) + 1;
  if (d.latitude === 0 || d.longitude === 0) {
    geocacheZerado++;
  }
});

console.log('=== GEOCACHE ===');
console.log('Total no cache:', total);
console.log('Por fonte:', porFonte);
console.log('Com coordenadas zeradas no cache:', geocacheZerado);

// Contar estabelecimentos únicos nos arquivos de municípios
const municipiosDir = './public/dados/municipios';
const cnpjsUnicos = new Set();
const cnpjsSemCoordenada = new Set();

fs.readdirSync(municipiosDir).forEach(file => {
  if (file.endsWith('.json')) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(municipiosDir, file)));
      // Estrutura: { codigoIBGE, estabelecimentos: [...] }
      const estabelecimentos = data.estabelecimentos;
      if (!Array.isArray(estabelecimentos)) return;
      estabelecimentos.forEach(item => {
        cnpjsUnicos.add(item.cnpj);
        if (item.latitude === 0 || item.longitude === 0) {
          cnpjsSemCoordenada.add(item.cnpj);
        }
      });
    } catch (e) {
      // Ignorar arquivos com erro
    }
  }
});

console.log('');
console.log('=== ESTABELECIMENTOS ===');
console.log('Total únicos:', cnpjsUnicos.size);
console.log('Com coordenadas zeradas:', cnpjsSemCoordenada.size);
console.log('Com coordenadas válidas:', cnpjsUnicos.size - cnpjsSemCoordenada.size);

// Verificar quantos CNPJs sem coordenada estão no geocache
let noGeocacheMasZerado = 0;
let foraDoCachePrecisaGeocode = 0;
cnpjsSemCoordenada.forEach(cnpj => {
  if (geocache[cnpj]) {
    // Está no cache mas mostra coordenada zerada = algo errado
    noGeocacheMasZerado++;
  } else {
    // Não está no cache, precisa geocodificar
    foraDoCachePrecisaGeocode++;
  }
});

console.log('');
console.log('=== PENDENTES PARA GEOCODIFICAR ===');
console.log('No cache mas com problema:', noGeocacheMasZerado);
console.log('Fora do cache (pendentes):', foraDoCachePrecisaGeocode);
console.log('');
console.log('>>> TOTAL A GEOCODIFICAR:', foraDoCachePrecisaGeocode);
