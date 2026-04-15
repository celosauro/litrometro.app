/**
 * Script de migração de dados JSON para Supabase
 * Migra: atual.json + histórico de vendas
 * Usa UPSERT para atualizar existentes e inserir novos
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tipos
type TipoCombustivel = 1 | 2 | 3 | 4 | 5 | 6;

interface EstabelecimentoJSON {
  cnpj: string;
  tipo_combustivel: TipoCombustivel;
  razao_social: string;
  nome_fantasia: string;
  telefone: string;
  nome_logradouro: string;
  numero_imovel: string;
  bairro: string;
  cep: string;
  codigo_ibge: number | string;
  municipio: string;
  latitude: number;
  longitude: number;
  valor_minimo: number;
  valor_maximo: number;
  valor_medio: number;
  valor_recente: number;
  data_recente: string;
}

interface DadosAtuaisJSON {
  atualizadoEm: string;
  totalEstabelecimentos: number;
  totalMunicipios: number;
  estabelecimentos: EstabelecimentoJSON[];
}

interface VendaHistoricoJSON {
  cnpj: string;
  tipo_combustivel: TipoCombustivel;
  valor_venda: number;
  data_venda: string;
}

interface HistoricoDiarioJSON {
  data: string;
  codigoIBGE: string;
  municipio: string;
  coletadoEm: string;
  vendas: VendaHistoricoJSON[];
}

interface EstabelecimentoInsert {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  telefone: string | null;
  nome_logradouro: string | null;
  numero_imovel: string | null;
  bairro: string | null;
  cep: string | null;
  codigo_ibge: string;
  latitude: number | null;
  longitude: number | null;
  geocode_source: string;
}

interface PrecoAtualInsert {
  cnpj: string;
  tipo_combustivel: TipoCombustivel;
  valor_minimo: number;
  valor_maximo: number;
  valor_medio: number;
  valor_recente: number;
  data_recente: string;
}

interface VendaHistoricoInsert {
  cnpj: string;
  tipo_combustivel: TipoCombustivel;
  valor_venda: number;
  data_venda: string;
}

// Configuração
const DADOS_DIR = path.join(process.cwd(), 'public', 'dados');
const ATUAL_FILE = path.join(DADOS_DIR, 'atual.json');
const HISTORICO_DIR = path.join(DADOS_DIR, 'historico');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

// Cliente Supabase
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error('VITE_SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórios');
  }
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      db: { schema: 'public' },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabase;
}

/**
 * Converte codigo_ibge para string (normalização)
 */
function normalizarCodigoIBGE(codigo: number | string): string {
  return String(codigo).padStart(7, '0');
}

/**
 * Carrega o arquivo atual.json
 */
function carregarAtual(): DadosAtuaisJSON | null {
  if (!fs.existsSync(ATUAL_FILE)) {
    console.error('❌ Arquivo atual.json não encontrado');
    return null;
  }
  const conteudo = fs.readFileSync(ATUAL_FILE, 'utf-8');
  return JSON.parse(conteudo);
}

/**
 * Lista todas as pastas de histórico
 */
function listarDatasHistorico(): string[] {
  if (!fs.existsSync(HISTORICO_DIR)) {
    return [];
  }
  return fs.readdirSync(HISTORICO_DIR)
    .filter(nome => /^\d{4}-\d{2}-\d{2}$/.test(nome))
    .sort();
}

/**
 * Carrega todos os arquivos de histórico de uma data
 */
function carregarHistoricoData(data: string): HistoricoDiarioJSON[] {
  const pastaData = path.join(HISTORICO_DIR, data);
  if (!fs.existsSync(pastaData)) {
    return [];
  }

  const arquivos = fs.readdirSync(pastaData).filter(n => n.endsWith('.json'));
  const historicos: HistoricoDiarioJSON[] = [];

  for (const arquivo of arquivos) {
    try {
      const conteudo = fs.readFileSync(path.join(pastaData, arquivo), 'utf-8');
      historicos.push(JSON.parse(conteudo));
    } catch (error) {
      console.warn(`⚠️ Erro ao ler ${data}/${arquivo}`);
    }
  }

  return historicos;
}

/**
 * Extrai estabelecimentos únicos do atual.json
 */
function extrairEstabelecimentos(dados: DadosAtuaisJSON): Map<string, EstabelecimentoInsert> {
  const mapa = new Map<string, EstabelecimentoInsert>();

  for (const est of dados.estabelecimentos) {
    if (!mapa.has(est.cnpj)) {
      mapa.set(est.cnpj, {
        cnpj: est.cnpj,
        razao_social: est.razao_social,
        nome_fantasia: est.nome_fantasia || null,
        telefone: est.telefone || null,
        nome_logradouro: est.nome_logradouro || null,
        numero_imovel: est.numero_imovel || null,
        bairro: est.bairro || null,
        cep: est.cep || null,
        codigo_ibge: normalizarCodigoIBGE(est.codigo_ibge),
        latitude: est.latitude || null,
        longitude: est.longitude || null,
        geocode_source: 'sefaz',
      });
    }
  }

  return mapa;
}

/**
 * Extrai preços atuais do atual.json
 */
function extrairPrecos(dados: DadosAtuaisJSON): PrecoAtualInsert[] {
  return dados.estabelecimentos.map(est => ({
    cnpj: est.cnpj,
    tipo_combustivel: est.tipo_combustivel,
    valor_minimo: est.valor_minimo,
    valor_maximo: est.valor_maximo,
    valor_medio: est.valor_medio,
    valor_recente: est.valor_recente,
    data_recente: est.data_recente,
  }));
}

/**
 * Migra estabelecimentos para o Supabase
 */
async function migrarEstabelecimentos(
  estabelecimentos: EstabelecimentoInsert[]
): Promise<number> {
  const client = getSupabaseClient();
  const BATCH_SIZE = 100;
  let inseridos = 0;

  for (let i = 0; i < estabelecimentos.length; i += BATCH_SIZE) {
    const batch = estabelecimentos.slice(i, i + BATCH_SIZE);
    
    const { error } = await client
      .from('estabelecimentos')
      .upsert(batch, { onConflict: 'cnpj' });

    if (error) {
      console.error(`❌ Erro ao inserir estabelecimentos (batch ${i / BATCH_SIZE + 1}):`, error.message);
    } else {
      inseridos += batch.length;
    }
  }

  return inseridos;
}

/**
 * Migra preços atuais para o Supabase
 */
async function migrarPrecos(precos: PrecoAtualInsert[]): Promise<number> {
  const client = getSupabaseClient();
  const BATCH_SIZE = 100;
  let inseridos = 0;

  console.log(`   Iniciando... (${Math.ceil(precos.length / BATCH_SIZE)} batches)`);

  for (let i = 0; i < precos.length; i += BATCH_SIZE) {
    const batch = precos.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    const { error, count } = await client
      .from('precos_atuais')
      .upsert(batch, { onConflict: 'cnpj,tipo_combustivel' });

    if (error) {
      console.error(`❌ Erro batch ${batchNum}:`, error.message);
    } else {
      inseridos += batch.length;
      process.stdout.write(`\r   Progresso: ${inseridos}/${precos.length}`);
    }
  }
  console.log(); // Nova linha após progresso

  return inseridos;
}

/**
 * Migra histórico de vendas para o Supabase
 */
async function migrarHistorico(datas: string[]): Promise<{ vendas: number; dias: number }> {
  const client = getSupabaseClient();
  let totalVendas = 0;
  let diasProcessados = 0;

  for (const data of datas) {
    const historicos = carregarHistoricoData(data);
    if (historicos.length === 0) continue;

    const vendasDia: VendaHistoricoInsert[] = [];

    for (const historico of historicos) {
      for (const venda of historico.vendas) {
        vendasDia.push({
          cnpj: venda.cnpj,
          tipo_combustivel: venda.tipo_combustivel,
          valor_venda: venda.valor_venda,
          data_venda: venda.data_venda,
        });
      }
    }

    // Insere em batches com UPSERT (constraint: unique_venda)
    const BATCH_SIZE = 500;
    let inseridosDia = 0;
    
    for (let i = 0; i < vendasDia.length; i += BATCH_SIZE) {
      const batch = vendasDia.slice(i, i + BATCH_SIZE);
      
      // Usa UPSERT com a constraint correta (inclui valor_venda)
      const { error } = await client
        .from('vendas_historico')
        .upsert(batch, { 
          onConflict: 'cnpj,tipo_combustivel,data_venda,valor_venda',
          ignoreDuplicates: true 
        });

      if (error) {
        // Ignora erros de FK (CNPJ não existe em estabelecimentos)
        if (error.message.includes('violates foreign key constraint')) {
          // Silencioso - CNPJs órfãos são esperados
        } else if (!error.message.includes('unique')) {
          console.error(`\n❌ Erro histórico ${data}:`, error.message);
        }
      } else {
        inseridosDia += batch.length;
      }
    }

    totalVendas += inseridosDia;
    diasProcessados++;
    console.log(`   📅 ${data}: ${inseridosDia} vendas (${historicos.length} municípios)`);
  }

  return { vendas: totalVendas, dias: diasProcessados };
}

/**
 * Verifica CNPJs que não existem na tabela de estabelecimentos
 */
async function verificarCNPJsOrfaos(datas: string[]): Promise<Set<string>> {
  const client = getSupabaseClient();
  const cnpjsHistorico = new Set<string>();

  // Coleta todos os CNPJs do histórico
  for (const data of datas) {
    const historicos = carregarHistoricoData(data);
    for (const historico of historicos) {
      for (const venda of historico.vendas) {
        cnpjsHistorico.add(venda.cnpj);
      }
    }
  }

  // Verifica quais existem no Supabase
  const { data, error } = await client
    .from('estabelecimentos')
    .select('cnpj');

  if (error) {
    console.error('❌ Erro ao verificar estabelecimentos:', error.message);
    return cnpjsHistorico;
  }

  const cnpjsExistentes = new Set(data?.map(e => e.cnpj) || []);
  const orfaos = new Set<string>();

  for (const cnpj of cnpjsHistorico) {
    if (!cnpjsExistentes.has(cnpj)) {
      orfaos.add(cnpj);
    }
  }

  return orfaos;
}

/**
 * Função principal
 */
async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('Migração de Dados JSON → Supabase');
  console.log(`Data/Hora: ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  // Verifica configuração
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error('❌ Configure VITE_SUPABASE_URL e SUPABASE_SECRET_KEY no .env');
    process.exit(1);
  }
  console.log('✓ Supabase configurado');

  // Carrega dados
  console.log('\n📦 Carregando dados JSON...');
  const dadosAtuais = carregarAtual();
  if (!dadosAtuais) {
    process.exit(1);
  }
  console.log(`   atual.json: ${dadosAtuais.estabelecimentos.length} registros`);

  const datasHistorico = listarDatasHistorico();
  console.log(`   Histórico: ${datasHistorico.length} dias (${datasHistorico[0]} a ${datasHistorico[datasHistorico.length - 1]})`);

  // Extrai dados
  console.log('\n🔄 Processando dados...');
  const estabelecimentos = extrairEstabelecimentos(dadosAtuais);
  console.log(`   Estabelecimentos únicos: ${estabelecimentos.size}`);

  const precos = extrairPrecos(dadosAtuais);
  console.log(`   Preços atuais: ${precos.length}`);

  // Migra estabelecimentos
  console.log('\n📤 Migrando estabelecimentos...');
  const estInseridos = await migrarEstabelecimentos(Array.from(estabelecimentos.values()));
  console.log(`   ✅ ${estInseridos} estabelecimentos (UPSERT)`);

  // Migra preços
  console.log('\n📤 Migrando preços atuais...');
  const precosInseridos = await migrarPrecos(precos);
  console.log(`   ✅ ${precosInseridos} preços (UPSERT)`);

  // Migra histórico
  console.log('\n📤 Migrando histórico de vendas...');
  const { vendas, dias } = await migrarHistorico(datasHistorico);
  console.log(`   ✅ ${vendas} vendas em ${dias} dias`);

  // Verifica CNPJs órfãos
  console.log('\n🔍 Verificando integridade...');
  const orfaos = await verificarCNPJsOrfaos(datasHistorico);
  if (orfaos.size > 0) {
    console.log(`   ⚠️ ${orfaos.size} CNPJs no histórico sem estabelecimento cadastrado`);
    console.log(`      (vendas desses CNPJs foram ignoradas por FK)`);
  } else {
    console.log(`   ✅ Todos os CNPJs têm estabelecimento cadastrado`);
  }

  // Resumo
  console.log('\n═'.repeat(60));
  console.log('Migração concluída!');
  console.log('═'.repeat(60));
  console.log(`  Estabelecimentos: ${estInseridos}`);
  console.log(`  Preços atuais: ${precosInseridos}`);
  console.log(`  Vendas históricas: ${vendas}`);
  console.log(`  Dias de histórico: ${dias}`);
}

// Executa
main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
