/**
 * Script para gerar ícones PWA em PNG a partir dos SVGs
 * Usa a biblioteca sharp para conversão
 * 
 * Uso: npx tsx scripts/generate-pwa-icons.ts
 */

import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

interface IconConfig {
  input: string;
  output: string;
  width: number;
  height: number;
}

const icons: IconConfig[] = [
  {
    input: 'icon-192.svg',
    output: 'icon-192.png',
    width: 192,
    height: 192
  },
  {
    input: 'icon-512.svg',
    output: 'icon-512.png',
    width: 512,
    height: 512
  },
  {
    input: 'apple-touch-icon.svg',
    output: 'apple-touch-icon.png',
    width: 180,
    height: 180
  },
  {
    input: 'favicon.svg',
    output: 'favicon-32.png',
    width: 32,
    height: 32
  },
  {
    input: 'favicon.svg',
    output: 'favicon-16.png',
    width: 16,
    height: 16
  },
  {
    input: 'og-image.svg',
    output: 'og-image.png',
    width: 1200,
    height: 630
  }
];

async function generateIcons() {
  console.log('🎨 Gerando ícones PWA...\n');

  for (const icon of icons) {
    const inputPath = join(publicDir, icon.input);
    const outputPath = join(publicDir, icon.output);

    if (!existsSync(inputPath)) {
      console.log(`⚠️  Arquivo não encontrado: ${icon.input}`);
      continue;
    }

    try {
      const svgBuffer = readFileSync(inputPath);
      
      await sharp(svgBuffer)
        .resize(icon.width, icon.height)
        .png()
        .toFile(outputPath);

      console.log(`✅ ${icon.output} (${icon.width}x${icon.height})`);
    } catch (error) {
      console.error(`❌ Erro ao gerar ${icon.output}:`, error);
    }
  }

  console.log('\n🎉 Geração de ícones concluída!');
}

generateIcons().catch(console.error);
