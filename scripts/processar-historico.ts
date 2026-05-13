/**
 * Script de processamento de histórico de preços - Versão Supabase
 * Executa diariamente para calcular min/max/médio dos últimos N dias
 * Consulta vendas_historico e atualiza precos_atuais no Supabase
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tipos
type TipoCombustivel = 1 | 2 | 3 | 4 | 5 | 6;

interface VendaHistorico {
  cnpj: string;
  tipo_combustivel: TipoCombustivel;
  valor_venda: number;
  data_venda: string;
}

interface PrecoAtual {
  cnpj: string;
  tipo_combustivel: TipoCombustivel;
  valor_minimo: number;
  valor_maximo: number;
  valor_medio: number;
  valor_recente: number;
  valor_minimo_24h: number | null;
  valor_maximo_24h: number | null;
  valor_medio_24h: number | null;
  data_minimo_24h: string | null;
  data_inicio_janela_24h: string;
  data_fim_janela_24h: string;
  contagem_vendas_24h: number;
  atualizado_24h_em: string;
  data_recente: string;
}

interface VendasAgregadas {
  valores: number[];
  dataRecente: Date;
  valorRecente: number;
  dataMinimo: Date;
  valorMinimo: number;
}

// Configuração
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const DIAS_HISTORICO = parseInt(process.env.DIAS_HISTORICO || '30', 10);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis VITE_SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórias');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

const NOMES_COMBUSTIVEIS: Record<TipoCombustivel, string> = {
  1: 'Gasolina Comum',
  2: 'Gasolina Aditivada',
  3: 'Etanol',
  4: 'Diesel Comum',
  5: 'Diesel S10',
  6: 'GNV',
};

/**
 * Gera chave única para CNPJ + tipo combustível
 */
function gerarChave(cnpj: string, tipoCombustivel: TipoCombustivel): string {
  return `${cnpj}-${tipoCombustivel}`;
}

/**
 * Consulta vendas_historico no Supabase dos últimos N dias
 * Retorna agregações por CNPJ + tipo_combustivel
 */
async function consultarHistoricoSupabase(dias: number): Promise<Map<string, VendasAgregadas>> {
  const agregacoes = new Map<string, VendasAgregadas>();
  
  // Data limite: N dias atrás
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - dias);
  const dataLimiteISO = dataLimite.toISOString();

  console.log(`📅 Buscando vendas desde ${dataLimiteISO.split('T')[0]} (últimos ${dias} dias)`);

  // Busca todas as vendas com paginação
  const PAGE_SIZE = 1000;
  let offset = 0;
  let totalVendas = 0;

  while (true) {
    const { data, error } = await supabase
      .from('vendas_historico')
      .select('cnpj, tipo_combustivel, valor_venda, data_venda')
      .gte('data_venda', dataLimiteISO)
      .order('data_venda', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('❌ Erro ao consultar vendas_historico:', error.message);
      break;
    }

    if (!data || data.length === 0) break;

    // Agrega os dados
    for (const venda of data as VendaHistorico[]) {
      const chave = gerarChave(venda.cnpj, venda.tipo_combustivel);
      const dataVenda = new Date(venda.data_venda);

      const existente = agregacoes.get(chave);

      if (!existente) {
        agregacoes.set(chave, {
          valores: [venda.valor_venda],
          dataRecente: dataVenda,
          valorRecente: venda.valor_venda,
          dataMinimo: dataVenda,
          valorMinimo: venda.valor_venda,
        });
      } else {
        existente.valores.push(venda.valor_venda);
        
        // Atualiza valor mais recente se necessário
        if (dataVenda > existente.dataRecente) {
          existente.dataRecente = dataVenda;
          existente.valorRecente = venda.valor_venda;
        }

        if (venda.valor_venda < existente.valorMinimo) {
          existente.valorMinimo = venda.valor_venda;
          existente.dataMinimo = dataVenda;
        }
      }
    }

    totalVendas += data.length;
    offset += PAGE_SIZE;

    // Se retornou menos que PAGE_SIZE, é a última página
    if (data.length < PAGE_SIZE) break;
  }

  console.log(`   Total de vendas processadas: ${totalVendas.toLocaleString()}`);
  return agregacoes;
}

async function consultarHistorico24h(
  dataLimiteISO: string,
  dataFimISO: string
): Promise<Map<string, VendasAgregadas>> {
  const agregacoes = new Map<string, VendasAgregadas>();
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('vendas_historico')
      .select('cnpj, tipo_combustivel, valor_venda, data_venda')
      .gte('data_venda', dataLimiteISO)
      .lte('data_venda', dataFimISO)
      .order('data_venda', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('❌ Erro ao consultar janela 24h:', error.message);
      break;
    }

    if (!data || data.length === 0) break;

    for (const venda of data as VendaHistorico[]) {
      const chave = gerarChave(venda.cnpj, venda.tipo_combustivel);
      const dataVenda = new Date(venda.data_venda);

      const existente = agregacoes.get(chave);

      if (!existente) {
        agregacoes.set(chave, {
          valores: [venda.valor_venda],
          dataRecente: dataVenda,
          valorRecente: venda.valor_venda,
          dataMinimo: dataVenda,
          valorMinimo: venda.valor_venda,
        });
      } else {
        existente.valores.push(venda.valor_venda);
        if (dataVenda > existente.dataRecente) {
          existente.dataRecente = dataVenda;
          existente.valorRecente = venda.valor_venda;
        }

        if (venda.valor_venda < existente.valorMinimo) {
          existente.valorMinimo = venda.valor_venda;
          existente.dataMinimo = dataVenda;
        }
      }
    }

    offset += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }

  return agregacoes;
}

/**
 * Calcula estatísticas a partir dos valores
 */
function calcularEstatisticas(valores: number[]): { min: number; max: number; medio: number } {
  if (valores.length === 0) {
    return { min: 0, max: 0, medio: 0 };
  }

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const soma = valores.reduce((acc, val) => acc + val, 0);
  const medio = soma / valores.length;

  return { min, max, medio };
}

/**
 * Atualiza precos_atuais no Supabase com as agregações
 */
async function atualizarPrecosAtuais(
  agregacoesHistorico: Map<string, VendasAgregadas>,
  agregacoes24h: Map<string, VendasAgregadas>,
  inicioJanela24hISO: string,
  fimJanela24hISO: string
): Promise<number> {
  const updates: PrecoAtual[] = [];
  const agoraISO = new Date().toISOString();

  for (const [chave, agregacao] of agregacoesHistorico) {
    const [cnpj, tipoCombustivelStr] = chave.split('-');
    const tipo_combustivel = parseInt(tipoCombustivelStr, 10) as TipoCombustivel;
    const stats = calcularEstatisticas(agregacao.valores);
    const stats24hBase = agregacoes24h.get(chave);
    const stats24h = stats24hBase ? calcularEstatisticas(stats24hBase.valores) : null;

    const dataMinimo24h = stats24hBase ? stats24hBase.dataMinimo.toISOString() : null;

    updates.push({
      cnpj,
      tipo_combustivel,
      valor_minimo: Number(stats.min.toFixed(4)),
      valor_maximo: Number(stats.max.toFixed(4)),
      valor_medio: Number(stats.medio.toFixed(4)),
      valor_recente: Number(agregacao.valorRecente.toFixed(4)),
      valor_minimo_24h: stats24h ? Number(stats24h.min.toFixed(4)) : null,
      valor_maximo_24h: stats24h ? Number(stats24h.max.toFixed(4)) : null,
      valor_medio_24h: stats24h ? Number(stats24h.medio.toFixed(4)) : null,
      data_minimo_24h: dataMinimo24h,
      data_inicio_janela_24h: inicioJanela24hISO,
      data_fim_janela_24h: fimJanela24hISO,
      contagem_vendas_24h: stats24hBase ? stats24hBase.valores.length : 0,
      atualizado_24h_em: agoraISO,
      data_recente: agregacao.dataRecente.toISOString(),
    });
  }

  // Upsert em lotes de 500
  const BATCH_SIZE = 500;
  let totalAtualizados = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('precos_atuais')
      .upsert(batch, { 
        onConflict: 'cnpj,tipo_combustivel',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`❌ Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
    } else {
      totalAtualizados += batch.length;
    }
  }

  return totalAtualizados;
}

/**
 * Exibe resumo das estatísticas por tipo de combustível
 */
async function exibirResumo(): Promise<void> {
  console.log('\n📊 Resumo por Combustível:');
  console.log('─'.repeat(60));

  for (const tipo of [1, 2, 3, 4, 5, 6] as TipoCombustivel[]) {
    const { data, error } = await supabase
      .from('precos_atuais')
      .select('valor_recente, valor_minimo_24h')
      .eq('tipo_combustivel', tipo);

    if (error || !data || data.length === 0) continue;

    const precos = data.map(p => p.valor_minimo_24h ?? p.valor_recente);
    const min = Math.min(...precos);
    const max = Math.max(...precos);
    const media = precos.reduce((a, b) => a + b, 0) / precos.length;

    console.log(`  ${NOMES_COMBUSTIVEIS[tipo]}:`);
    console.log(`    Postos: ${data.length}`);
    console.log(`    Preço: R$ ${min.toFixed(3)} - R$ ${max.toFixed(3)} (média: R$ ${media.toFixed(3)})`);
  }
}

/**
 * Verifica se há variação nos valores (para debug)
 */
async function verificarVariacao(): Promise<void> {
  const { data, error } = await supabase
    .from('precos_atuais')
    .select('valor_minimo, valor_maximo');

  if (error || !data) return;

  let comVariacao = 0;
  let semVariacao = 0;

  for (const preco of data) {
    if (preco.valor_minimo !== preco.valor_maximo) {
      comVariacao++;
    } else {
      semVariacao++;
    }
  }

  console.log(`\n📈 Variação de preços:`);
  console.log(`  Com variação (min ≠ max): ${comVariacao}`);
  console.log(`  Sem variação (min = max): ${semVariacao}`);
}

/**
 * Função principal
 */
async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('Processamento de Histórico de Preços (Supabase)');
  console.log(`Data/Hora: ${new Date().toISOString()}`);
  console.log(`Período: últimos ${DIAS_HISTORICO} dias`);
  console.log('═'.repeat(60));

  const fimJanela24h = new Date();
  const inicioJanela24h = new Date(fimJanela24h.getTime() - (24 * 60 * 60 * 1000));
  const inicioJanela24hISO = inicioJanela24h.toISOString();
  const fimJanela24hISO = fimJanela24h.toISOString();

  // Consulta histórico no Supabase
  console.log('\n🔄 Consultando histórico no Supabase...');
  const agregacoesHistorico = await consultarHistoricoSupabase(DIAS_HISTORICO);
  console.log(`   Total de combinações CNPJ+combustível: ${agregacoesHistorico.size}`);

  console.log(`\n🕒 Calculando janela móvel 24h: ${inicioJanela24hISO} -> ${fimJanela24hISO}`);
  const agregacoes24h = await consultarHistorico24h(inicioJanela24hISO, fimJanela24hISO);
  console.log(`   Combinações com vendas na janela 24h: ${agregacoes24h.size}`);

  if (agregacoesHistorico.size === 0) {
    console.warn('⚠️ Nenhum dado de histórico encontrado. Saindo.');
    process.exit(0);
  }

  // Atualiza precos_atuais no Supabase
  console.log('\n📝 Atualizando precos_atuais no Supabase...');
  const totalAtualizados = await atualizarPrecosAtuais(
    agregacoesHistorico,
    agregacoes24h,
    inicioJanela24hISO,
    fimJanela24hISO
  );
  console.log(`✅ Atualizados: ${totalAtualizados} registros`);

  // Resumo
  await exibirResumo();
  await verificarVariacao();

  console.log('\n═'.repeat(60));
  console.log('Processamento concluído!');
  console.log('═'.repeat(60));
}

// Executa
main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
