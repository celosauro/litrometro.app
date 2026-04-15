import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env'
  );
}

/**
 * Configuração do cliente Supabase
 * @see https://supabase.com/docs/reference/javascript/initializing
 */
const clientOptions: SupabaseClientOptions<'public'> = {
  // Configuração do banco de dados
  db: {
    schema: 'public',
  },
  // Configuração de autenticação
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // Configuração global
  global: {
    headers: {
      'x-application-name': 'litrometro',
    },
  },
};

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabasePublishableKey || '',
  clientOptions
);

// Verificar se Supabase está configurado
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
