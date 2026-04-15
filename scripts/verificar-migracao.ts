import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function main() {
  const { count: est } = await sb.from('estabelecimentos').select('*', { count: 'exact', head: true });
  const { count: preco } = await sb.from('precos_atuais').select('*', { count: 'exact', head: true });
  const { count: hist } = await sb.from('vendas_historico').select('*', { count: 'exact', head: true });

  console.log('📊 Dados no Supabase:');
  console.log(`   Estabelecimentos: ${est}`);
  console.log(`   Preços atuais: ${preco}`);
  console.log(`   Vendas histórico: ${hist}`);
}

main().catch(console.error);
