/**
 * Script de processamento de histórico de preços
 * Executa diariamente para calcular min/max/médio dos últimos 10 dias
 * Atualiza o arquivo atual.json com os valores agregados
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// Tipos
type TipoCombustivel = 1 | 2 | 3 | 4 | 5 | 6;

interface VendaHistorico {
  cnpj: string;
  tipo_combustivel: TipoCombustivel;
  valor_venda: number;
  data_venda: string;
}

interface HistoricoDiario {
  data: string;
  codigoIBGE: string;
  municipio: string;
  coletadoEm: string;
  vendas: VendaHistorico[];
}

interface PrecoCombustivelResumo {
  cnpj: string;
  tipo_combustivel: TipoCombustivel;
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

interface VendasAgregadas {
  valores: number[];
  dataRecente: Date;
  valorRecente: number;
}

// Configuração
const DADOS_DIR = path.join(process.cwd(), 'public', 'dados');
const HISTORICO_DIR = path.join(DADOS_DIR, 'historico');
const ATUAL_FILE = path.join(DADOS_DIR, 'atual.json');
const DIAS_HISTORICO = 10;

const NOMES_COMBUSTIVEIS: Record<TipoCombustivel, string> = {
  1: 'Gasolina Comum',
  2: 'Gasolina Aditivada',
  3: 'Etanol',
  4: 'Diesel Comum',
  5: 'Diesel S10',
  6: 'GNV',
};

/**
 * Obtém as datas dos últimos N dias disponíveis no histórico
 */
function obterDatasHistorico(dias: number): string[] {
  const datas: string[] = [];
  
  // Lista todas as pastas de data no histórico
  if (!fs.existsSync(HISTORICO_DIR)) {
    console.error('❌ Diretório de histórico não encontrado:', HISTORICO_DIR);
    return datas;
  }

  const pastas = fs.readdirSync(HISTORICO_DIR)
    .filter(nome => /^\d{4}-\d{2}-\d{2}$/.test(nome))
    .sort()
    .reverse(); // Mais recente primeiro

  return pastas.slice(0, dias);
}

/**
 * Lê todos os arquivos de histórico de uma data
 */
function lerHistoricoData(data: string): HistoricoDiario[] {
  const pastaData = path.join(HISTORICO_DIR, data);
  
  if (!fs.existsSync(pastaData)) {
    return [];
  }

  const arquivos = fs.readdirSync(pastaData)
    .filter(nome => nome.endsWith('.json'));

  const historicos: HistoricoDiario[] = [];

  for (const arquivo of arquivos) {
    try {
      const conteudo = fs.readFileSync(path.join(pastaData, arquivo), 'utf-8');
      const historico = JSON.parse(conteudo) as HistoricoDiario;
      historicos.push(historico);
    } catch (error) {
      console.warn(`⚠️ Erro ao ler ${data}/${arquivo}:`, error);
    }
  }

  return historicos;
}

/**
 * Carrega o arquivo atual.json existente
 */
function carregarAtual(): DadosAtuais | null {
  if (!fs.existsSync(ATUAL_FILE)) {
    console.error('❌ Arquivo atual.json não encontrado');
    return null;
  }

  try {
    const conteudo = fs.readFileSync(ATUAL_FILE, 'utf-8');
    return JSON.parse(conteudo) as DadosAtuais;
  } catch (error) {
    console.error('❌ Erro ao ler atual.json:', error);
    return null;
  }
}

/**
 * Salva o arquivo atual.json atualizado
 */
function salvarAtual(dados: DadosAtuais): void {
  fs.writeFileSync(ATUAL_FILE, JSON.stringify(dados, null, 2));
}

/**
 * Gera chave única para CNPJ + tipo combustível
 */
function gerarChave(cnpj: string, tipoCombustivel: TipoCombustivel): string {
  return `${cnpj}-${tipoCombustivel}`;
}

/**
 * Processa o histórico e calcula agregações
 */
function processarHistorico(): Map<string, VendasAgregadas> {
  const agregacoes = new Map<string, VendasAgregadas>();
  
  // Obtém datas disponíveis
  const datas = obterDatasHistorico(DIAS_HISTORICO);
  
  if (datas.length === 0) {
    console.warn('⚠️ Nenhuma data de histórico encontrada');
    return agregacoes;
  }

  console.log(`📅 Processando ${datas.length} dias de histórico: ${datas[datas.length - 1]} a ${datas[0]}`);

  // Processa cada dia
  for (const data of datas) {
    const historicos = lerHistoricoData(data);
    
    for (const historico of historicos) {
      for (const venda of historico.vendas) {
        const chave = gerarChave(venda.cnpj, venda.tipo_combustivel);
        const dataVenda = new Date(venda.data_venda);

        const existente = agregacoes.get(chave);

        if (!existente) {
          agregacoes.set(chave, {
            valores: [venda.valor_venda],
            dataRecente: dataVenda,
            valorRecente: venda.valor_venda,
          });
        } else {
          existente.valores.push(venda.valor_venda);
          
          // Atualiza valor mais recente se necessário
          if (dataVenda > existente.dataRecente) {
            existente.dataRecente = dataVenda;
            existente.valorRecente = venda.valor_venda;
          }
        }
      }
    }
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
 * Atualiza os dados do atual.json com as agregações do histórico
 */
function atualizarDadosAtuais(
  dadosAtuais: DadosAtuais,
  agregacoes: Map<string, VendasAgregadas>
): DadosAtuais {
  let atualizados = 0;
  let naoEncontrados = 0;

  for (const estabelecimento of dadosAtuais.estabelecimentos) {
    const chave = gerarChave(estabelecimento.cnpj, estabelecimento.tipo_combustivel);
    const agregacao = agregacoes.get(chave);

    if (agregacao) {
      const stats = calcularEstatisticas(agregacao.valores);
      
      estabelecimento.valor_minimo = Number(stats.min.toFixed(4));
      estabelecimento.valor_maximo = Number(stats.max.toFixed(4));
      estabelecimento.valor_medio = Number(stats.medio.toFixed(4));
      estabelecimento.valor_recente = Number(agregacao.valorRecente.toFixed(4));
      estabelecimento.data_recente = agregacao.dataRecente.toISOString();
      
      atualizados++;
    } else {
      naoEncontrados++;
    }
  }

  // Atualiza timestamp
  dadosAtuais.atualizadoEm = new Date().toISOString();

  console.log(`✅ Atualizados: ${atualizados} estabelecimentos`);
  if (naoEncontrados > 0) {
    console.log(`⚠️ Sem histórico: ${naoEncontrados} estabelecimentos`);
  }

  return dadosAtuais;
}

/**
 * Exibe resumo das estatísticas por tipo de combustível
 */
function exibirResumo(dadosAtuais: DadosAtuais): void {
  console.log('\n📊 Resumo por Combustível:');
  console.log('─'.repeat(60));

  for (const tipo of [1, 2, 3, 4, 5, 6] as TipoCombustivel[]) {
    const estabelecimentos = dadosAtuais.estabelecimentos.filter(
      e => e.tipo_combustivel === tipo
    );

    if (estabelecimentos.length > 0) {
      const precos = estabelecimentos.map(e => e.valor_recente);
      const min = Math.min(...precos);
      const max = Math.max(...precos);
      const media = precos.reduce((a, b) => a + b, 0) / precos.length;

      console.log(`  ${NOMES_COMBUSTIVEIS[tipo]}:`);
      console.log(`    Postos: ${estabelecimentos.length}`);
      console.log(`    Preço: R$ ${min.toFixed(3)} - R$ ${max.toFixed(3)} (média: R$ ${media.toFixed(3)})`);
    }
  }
}

/**
 * Verifica se há variação nos valores (para debug)
 */
function verificarVariacao(dadosAtuais: DadosAtuais): void {
  let comVariacao = 0;
  let semVariacao = 0;

  for (const est of dadosAtuais.estabelecimentos) {
    if (est.valor_minimo !== est.valor_maximo) {
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
  console.log('Processamento de Histórico de Preços');
  console.log(`Data/Hora: ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  // Carrega dados atuais
  const dadosAtuais = carregarAtual();
  if (!dadosAtuais) {
    process.exit(1);
  }

  console.log(`\n📦 Arquivo atual.json carregado:`);
  console.log(`   Estabelecimentos: ${dadosAtuais.estabelecimentos.length}`);
  console.log(`   Última atualização: ${dadosAtuais.atualizadoEm}`);

  // Processa histórico
  console.log('\n🔄 Processando histórico...');
  const agregacoes = processarHistorico();
  console.log(`   Total de combinações CNPJ+combustível: ${agregacoes.size}`);

  // Atualiza dados
  console.log('\n📝 Atualizando valores...');
  const dadosAtualizados = atualizarDadosAtuais(dadosAtuais, agregacoes);

  // Salva
  salvarAtual(dadosAtualizados);
  console.log(`\n💾 Arquivo atual.json salvo`);

  // Resumo
  exibirResumo(dadosAtualizados);
  verificarVariacao(dadosAtualizados);

  console.log('\n═'.repeat(60));
  console.log('Processamento concluído!');
  console.log('═'.repeat(60));
}

// Executa
main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
