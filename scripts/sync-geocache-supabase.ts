/**
 * Sync geocache.json → Supabase
 * One-time migration: push existing coordinates to Supabase
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const GEOCACHE_PATH = path.join(process.cwd(), 'public', 'dados', 'geocache.json');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

interface GeoCache {
  [cnpj: string]: {
    latitude: number;
    longitude: number;
    fonte: string;
    atualizadoEm: string;
  };
}

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      db: { schema: 'public' },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabase;
}

async function main(): Promise<void> {
  console.log('═'.repeat(50));
  console.log('Sync Geocache → Supabase');
  console.log('═'.repeat(50));

  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error('❌ Need VITE_SUPABASE_URL & SUPABASE_SECRET_KEY');
    process.exit(1);
  }

  // Load geocache
  if (!fs.existsSync(GEOCACHE_PATH)) {
    console.error('❌ geocache.json not found');
    process.exit(1);
  }

  const geoCache: GeoCache = JSON.parse(fs.readFileSync(GEOCACHE_PATH, 'utf-8'));
  const cnpjs = Object.keys(geoCache);
  console.log(`📍 ${cnpjs.length} coords in geocache`);

  // Update Supabase one by one (only existing rows)
  const client = getSupabase();
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < cnpjs.length; i++) {
    const cnpj = cnpjs[i];
    const coords = geoCache[cnpj];

    const { error, count } = await client
      .from('estabelecimentos')
      .update({
        latitude: coords.latitude,
        longitude: coords.longitude,
        geocode_source: coords.fonte,
      })
      .eq('cnpj', cnpj);

    if (error) {
      errors++;
    } else if (count === 0) {
      skipped++; // CNPJ not in Supabase
    } else {
      updated++;
    }

    if ((i + 1) % 50 === 0 || i === cnpjs.length - 1) {
      process.stdout.write(`\r   Progress: ${i+1}/${cnpjs.length} (updated: ${updated})`);
    }
  }

  console.log('\n');
  console.log('═'.repeat(50));
  console.log(`✅ Done! Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors}`);
  console.log('═'.repeat(50));
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
