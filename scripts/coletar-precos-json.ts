/**
 * Script de coleta de preços de combustíveis - MVP com JSON
 * Executa via GitHub Actions a cada hora
 * Consulta a API SEFAZ/AL e salva em arquivos JSON
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// Tipos conforme API SEFAZ/AL
type TipoCombustivel = 1 | 2 | 3 | 4 | 5 | 6;

interface VendaCombustivel {
  produto: {
    codigo: string;
    descricao: string;
    unidadeMedida: string;
    venda: {
      dataVenda: string;
      valorDeclarado: number;
      valorVenda: number;
    };
  };
  estabelecimento: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    telefone: string;
    endereco: {
      nomeLogradouro: string;
      numeroImovel: string;
      bairro: string;
      cep: string;
      codigoIBGE: string;
      municipio: string;
      latitude: number;
      longitude: number;
    };
  };
}

interface RespostaSefaz {
  totalRegistros: number;
  totalPaginas: number;
  pagina: number;
  registrosPorPagina: number;
  registrosPagina: number;
  primeiraPagina: boolean;
  ultimaPagina: boolean;
  conteudo: VendaCombustivel[];
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

interface HistoricoDiario {
  data: string;
  codigoIBGE: string;
  municipio: string;
  coletadoEm: string;
  vendas: {
    cnpj: string;
    tipo_combustivel: TipoCombustivel;
    valor_venda: number;
    data_venda: string;
  }[];
}

// Configuração
const SEFAZ_API_URL = 'http://api.sefaz.al.gov.br/sfz-economiza-alagoas-api/api/public/combustivel/pesquisa';
const SEFAZ_APP_TOKEN = process.env.SEFAZ_APP_TOKEN!;
const DADOS_DIR = path.join(process.cwd(), 'public', 'dados');

// Lista de todos os municípios de Alagoas (código IBGE)
const MUNICIPIOS_AL: Record<string, string> = {
  '2700102': 'Água Branca',
  '2700201': 'Anadia',
  '2700300': 'Arapiraca',
  '2700409': 'Atalaia',
  '2700508': 'Barra de Santo Antônio',
  '2700607': 'Barra de São Miguel',
  '2700706': 'Batalha',
  '2700805': 'Belém',
  '2700904': 'Belo Monte',
  '2701001': 'Boca da Mata',
  '2701100': 'Branquinha',
  '2701209': 'Cacimbinhas',
  '2701308': 'Cajueiro',
  '2701357': 'Campestre',
  '2701407': 'Campo Alegre',
  '2701506': 'Campo Grande',
  '2701605': 'Canapi',
  '2701704': 'Capela',
  '2701803': 'Carneiros',
  '2701902': 'Chã Preta',
  '2702009': 'Coité do Nóia',
  '2702108': 'Colônia Leopoldina',
  '2702207': 'Coqueiro Seco',
  '2702306': 'Coruripe',
  '2702355': 'Craíbas',
  '2702405': 'Delmiro Gouveia',
  '2702504': 'Dois Riachos',
  '2702553': 'Estrela de Alagoas',
  '2702603': 'Feira Grande',
  '2702702': 'Feliz Deserto',
  '2702801': 'Flexeiras',
  '2702900': 'Girau do Ponciano',
  '2703007': 'Ibateguara',
  '2703106': 'Igaci',
  '2703205': 'Igreja Nova',
  '2703304': 'Inhapi',
  '2703403': 'Jacaré dos Homens',
  '2703502': 'Jacuípe',
  '2703601': 'Japaratinga',
  '2703700': 'Jaramataia',
  '2703759': 'Jequiá da Praia',
  '2703809': 'Joaquim Gomes',
  '2703908': 'Jundiá',
  '2704005': 'Junqueiro',
  '2704104': 'Lagoa da Canoa',
  '2704203': 'Limoeiro de Anadia',
  '2704302': 'Maceió',
  '2704401': 'Major Isidoro',
  '2704500': 'Maragogi',
  '2704609': 'Maravilha',
  '2704708': 'Marechal Deodoro',
  '2704807': 'Maribondo',
  '2704906': 'Mar Vermelho',
  '2705002': 'Mata Grande',
  '2705101': 'Matriz de Camaragibe',
  '2705200': 'Messias',
  '2705309': 'Minador do Negrão',
  '2705408': 'Monteirópolis',
  '2705507': 'Murici',
  '2705606': 'Novo Lino',
  '2705705': "Olho d'Água das Flores",
  '2705804': "Olho d'Água do Casado",
  '2705903': "Olho d'Água Grande",
  '2706000': 'Olivença',
  '2706109': 'Ouro Branco',
  '2706208': 'Palestina',
  '2706307': 'Palmeira dos Índios',
  '2706406': 'Pão de Açúcar',
  '2706422': 'Pariconha',
  '2706448': 'Paripueira',
  '2706505': 'Passo de Camaragibe',
  '2706604': 'Paulo Jacinto',
  '2706703': 'Penedo',
  '2706802': 'Piaçabuçu',
  '2706901': 'Pilar',
  '2707008': 'Pindoba',
  '2707107': 'Piranhas',
  '2707206': 'Poço das Trincheiras',
  '2707305': 'Porto Calvo',
  '2707404': 'Porto de Pedras',
  '2707503': 'Porto Real do Colégio',
  '2707602': 'Quebrangulo',
  '2707701': 'Rio Largo',
  '2707800': 'Roteiro',
  '2707909': 'Santa Luzia do Norte',
  '2708006': 'Santana do Ipanema',
  '2708105': 'Santana do Mundaú',
  '2708204': 'São Brás',
  '2708303': 'São José da Laje',
  '2708402': 'São José da Tapera',
  '2708501': 'São Luís do Quitunde',
  '2708600': 'São Miguel dos Campos',
  '2708709': 'São Miguel dos Milagres',
  '2708808': 'São Sebastião',
  '2708907': 'Satuba',
  '2708956': 'Senador Rui Palmeira',
  '2709004': "Tanque d'Arca",
  '2709103': 'Taquarana',
  '2709152': 'Teotônio Vilela',
  '2709202': 'Traipu',
  '2709301': 'União dos Palmares',
  '2709400': 'Viçosa',
};

const TIPOS_COMBUSTIVEL: TipoCombustivel[] = [1, 2, 3, 4, 5, 6];

const NOMES_COMBUSTIVEL: Record<TipoCombustivel, string> = {
  1: 'Gasolina Comum',
  2: 'Gasolina Aditivada',
  3: 'Álcool',
  4: 'Diesel Comum',
  5: 'Diesel S10',
  6: 'GNV',
};

/**
 * Processa argumentos de linha de comando
 * Uso: npx tsx scripts/coletar-precos-json.ts [codigo_ibge | nome_municipio]
 * Exemplo: npx tsx scripts/coletar-precos-json.ts 2704302
 * Exemplo: npx tsx scripts/coletar-precos-json.ts maceio
 */
function obterMunicipiosFiltrados(): Record<string, string> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Sem argumentos = todos os municípios
    return MUNICIPIOS_AL;
  }

  const filtro = args[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const resultado: Record<string, string> = {};

  for (const [codigo, nome] of Object.entries(MUNICIPIOS_AL)) {
    const nomeNormalizado = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Busca por código IBGE ou nome (parcial)
    if (codigo === args[0] || nomeNormalizado.includes(filtro)) {
      resultado[codigo] = nome;
    }
  }

  if (Object.keys(resultado).length === 0) {
    console.error(`❌ Município não encontrado: "${args[0]}"`);
    console.log('\nMunicípios disponíveis:');
    Object.entries(MUNICIPIOS_AL).forEach(([cod, nome]) => {
      console.log(`  ${cod}: ${nome}`);
    });
    process.exit(1);
  }

  return resultado;
}

/**
 * Garante que um diretório exista
 */
function garantirDiretorio(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Salva JSON em arquivo
 */
function salvarJSON(caminho: string, dados: unknown): void {
  const dir = path.dirname(caminho);
  garantirDiretorio(dir);
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}

/**
 * Carrega JSON de arquivo (se existir)
 */
function carregarJSON<T>(caminho: string): T | null {
  if (!fs.existsSync(caminho)) {
    return null;
  }
  const conteudo = fs.readFileSync(caminho, 'utf-8');
  return JSON.parse(conteudo) as T;
}

/**
 * Consulta a API SEFAZ para um tipo de combustível e município
 */
async function consultarPrecosCombustivel(
  tipoCombustivel: TipoCombustivel,
  codigoIBGE: string,
  pagina: number = 1
): Promise<RespostaSefaz | null> {
  const body = {
    produto: {
      tipoCombustivel,
    },
    estabelecimento: {
      municipio: {
        codigoIBGE: parseInt(codigoIBGE, 10),
      },
    },
    dias: 10,
    pagina,
    registrosPorPagina: 500,
  };

  try {
    const response = await fetch(SEFAZ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AppToken': SEFAZ_APP_TOKEN,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na API SEFAZ (${codigoIBGE}, tipo ${tipoCombustivel}): ${response.status} - ${errorText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao consultar API SEFAZ (${codigoIBGE}, tipo ${tipoCombustivel}):`, error);
    return null;
  }
}

/**
 * Busca todas as páginas de um município/combustível
 */
async function buscarTodasPaginas(
  tipoCombustivel: TipoCombustivel,
  codigoIBGE: string
): Promise<VendaCombustivel[]> {
  const todosResultados: VendaCombustivel[] = [];
  let pagina = 1;
  let temMais = true;

  while (temMais) {
    const resposta = await consultarPrecosCombustivel(tipoCombustivel, codigoIBGE, pagina);
    
    if (!resposta || resposta.conteudo.length === 0) {
      break;
    }

    todosResultados.push(...resposta.conteudo);
    temMais = !resposta.ultimaPagina;
    pagina++;

    // Pequeno delay para não sobrecarregar a API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return todosResultados;
}

/**
 * Sumariza os dados por estabelecimento
 */
function sumarizarPorEstabelecimento(
  vendas: VendaCombustivel[],
  tipoCombustivel: TipoCombustivel
): PrecoCombustivelResumo[] {
  const mapaResumo = new Map<string, PrecoCombustivelResumo>();

  for (const venda of vendas) {
    const cnpj = venda.estabelecimento.cnpj;
    const valor = venda.produto.venda.valorVenda;
    const dataVenda = new Date(venda.produto.venda.dataVenda);

    const existente = mapaResumo.get(cnpj);

    if (!existente) {
      mapaResumo.set(cnpj, {
        cnpj,
        tipo_combustivel: tipoCombustivel,
        razao_social: venda.estabelecimento.razaoSocial,
        nome_fantasia: venda.estabelecimento.nomeFantasia || '',
        telefone: venda.estabelecimento.telefone || '',
        nome_logradouro: venda.estabelecimento.endereco.nomeLogradouro || '',
        numero_imovel: venda.estabelecimento.endereco.numeroImovel || '',
        bairro: venda.estabelecimento.endereco.bairro || '',
        cep: venda.estabelecimento.endereco.cep || '',
        codigo_ibge: venda.estabelecimento.endereco.codigoIBGE,
        municipio: venda.estabelecimento.endereco.municipio,
        latitude: venda.estabelecimento.endereco.latitude || 0,
        longitude: venda.estabelecimento.endereco.longitude || 0,
        valor_minimo: valor,
        valor_maximo: valor,
        valor_medio: valor,
        valor_recente: valor,
        data_recente: venda.produto.venda.dataVenda,
      });
    } else {
      const dataExistente = new Date(existente.data_recente);
      
      existente.valor_minimo = Math.min(existente.valor_minimo, valor);
      existente.valor_maximo = Math.max(existente.valor_maximo, valor);
      existente.valor_medio = (existente.valor_medio + valor) / 2;
      
      if (dataVenda > dataExistente) {
        existente.valor_recente = valor;
        existente.data_recente = venda.produto.venda.dataVenda;
      }
    }
  }

  return Array.from(mapaResumo.values());
}

/**
 * Cria o resumo de um município
 */
function criarResumoMunicipio(
  codigoIBGE: string,
  estabelecimentos: PrecoCombustivelResumo[]
): ResumoMunicipio {
  const combustiveis: ResumoMunicipio['combustiveis'] = {};

  for (const tipo of TIPOS_COMBUSTIVEL) {
    const postosTipo = estabelecimentos.filter(e => e.tipo_combustivel === tipo);
    if (postosTipo.length > 0) {
      const valores = postosTipo.map(p => p.valor_recente);
      combustiveis[tipo] = {
        totalPostos: postosTipo.length,
        valorMinimo: Math.min(...valores),
        valorMaximo: Math.max(...valores),
        valorMedio: valores.reduce((a, b) => a + b, 0) / valores.length,
      };
    }
  }

  return {
    codigoIBGE,
    municipio: MUNICIPIOS_AL[codigoIBGE] || codigoIBGE,
    atualizadoEm: new Date().toISOString(),
    totalEstabelecimentos: estabelecimentos.length,
    combustiveis,
    estabelecimentos,
  };
}

/**
 * Salva histórico diário
 */
function salvarHistorico(
  codigoIBGE: string,
  vendas: VendaCombustivel[],
  data: string,
  tipoCombustivel: TipoCombustivel
): void {
  if (vendas.length === 0) return;

  const novasVendas = vendas.map(v => ({
    cnpj: v.estabelecimento.cnpj,
    tipo_combustivel: tipoCombustivel,
    valor_venda: v.produto.venda.valorVenda,
    data_venda: v.produto.venda.dataVenda,
  }));

  const caminhoHistorico = path.join(DADOS_DIR, 'historico', data, `${codigoIBGE}.json`);
  
  // Carrega histórico existente e faz merge
  const historicoExistente = carregarJSON<HistoricoDiario>(caminhoHistorico);
  
  let vendasFinais = novasVendas;
  
  if (historicoExistente) {
    // Evita duplicatas usando cnpj + tipo + data_venda + valor (para maior precisão)
    const vendasExistentes = new Set(
      historicoExistente.vendas.map(v => 
        `${v.cnpj}-${v.tipo_combustivel}-${v.data_venda}-${v.valor_venda.toFixed(5)}`
      )
    );
    const vendasUnicas = novasVendas.filter(
      v => !vendasExistentes.has(
        `${v.cnpj}-${v.tipo_combustivel}-${v.data_venda}-${v.valor_venda.toFixed(5)}`
      )
    );
    vendasFinais = [...historicoExistente.vendas, ...vendasUnicas];
  }

  const historicoDiario: HistoricoDiario = {
    data,
    codigoIBGE,
    municipio: MUNICIPIOS_AL[codigoIBGE] || codigoIBGE,
    coletadoEm: new Date().toISOString(),
    vendas: vendasFinais,
  };

  salvarJSON(caminhoHistorico, historicoDiario);
}

/**
 * Função principal
 */
async function main(): Promise<void> {
  // Processa argumentos
  const municipiosParaProcessar = obterMunicipiosFiltrados();
  const totalMunicipios = Object.keys(municipiosParaProcessar).length;
  const modoTeste = totalMunicipios < Object.keys(MUNICIPIOS_AL).length;

  console.log('='.repeat(60));
  console.log('Coleta de preços de combustíveis - MVP JSON');
  console.log(`Data/Hora: ${new Date().toISOString()}`);
  if (modoTeste) {
    console.log(`Modo: TESTE (${totalMunicipios} município(s))`);
  } else {
    console.log(`Modo: COMPLETO (${totalMunicipios} municípios)`);
  }
  console.log('='.repeat(60));

  // Valida token
  if (!SEFAZ_APP_TOKEN) {
    console.error('❌ SEFAZ_APP_TOKEN não configurado!');
    console.error('   - Local: configure no arquivo .env');
    console.error('   - GitHub Actions: configure em Settings → Secrets → SEFAZ_APP_TOKEN');
    process.exit(1);
  }
  console.log(`✓ Token configurado`);

  // Garante estrutura de diretórios
  garantirDiretorio(path.join(DADOS_DIR, 'municipios'));
  garantirDiretorio(path.join(DADOS_DIR, 'historico'));

  const dataHoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todosEstabelecimentos: PrecoCombustivelResumo[] = [];
  const municipiosProcessados = new Set<string>();

  // Itera por município
  for (const [codigoIBGE, nomeMunicipio] of Object.entries(municipiosParaProcessar)) {
    console.log(`\n📍 Processando ${nomeMunicipio} (${codigoIBGE})...`);
    
    const estabelecimentosMunicipio: PrecoCombustivelResumo[] = [];
    const vendasMunicipio: VendaCombustivel[] = [];

    // Itera por tipo de combustível
    for (const tipoCombustivel of TIPOS_COMBUSTIVEL) {
      console.log(`  ⛽ ${NOMES_COMBUSTIVEL[tipoCombustivel]}...`);
      const vendas = await buscarTodasPaginas(tipoCombustivel, codigoIBGE);
      
      if (vendas.length > 0) {
        console.log(`     ${vendas.length} vendas encontradas`);
        vendasMunicipio.push(...vendas);
        
        const resumos = sumarizarPorEstabelecimento(vendas, tipoCombustivel);
        estabelecimentosMunicipio.push(...resumos);
        
        // Salva histórico por tipo de combustível (corrige bug do tipo incorreto)
        salvarHistorico(codigoIBGE, vendas, dataHoje, tipoCombustivel);
        
        // Mostra faixa de preço
        if (resumos.length > 0) {
          const precos = resumos.map(r => r.valor_recente);
          const min = Math.min(...precos);
          const max = Math.max(...precos);
          console.log(`     ${resumos.length} postos | R$ ${min.toFixed(3)} - R$ ${max.toFixed(3)}`);
        }
      } else {
        console.log(`     Nenhuma venda`);
      }

      // Delay entre tipos
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (estabelecimentosMunicipio.length > 0) {
      // Salva resumo do município
      const resumoMunicipio = criarResumoMunicipio(codigoIBGE, estabelecimentosMunicipio);
      const caminhoMunicipio = path.join(DADOS_DIR, 'municipios', `${codigoIBGE}.json`);
      salvarJSON(caminhoMunicipio, resumoMunicipio);
      
      // Adiciona aos totais
      todosEstabelecimentos.push(...estabelecimentosMunicipio);
      municipiosProcessados.add(codigoIBGE);
      
      console.log(`  ✓ ${estabelecimentosMunicipio.length} estabelecimentos salvos`);
    }

    // Delay entre municípios
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Salva JSON atual (todos os dados)
  const dadosAtuais: DadosAtuais = {
    atualizadoEm: new Date().toISOString(),
    totalEstabelecimentos: todosEstabelecimentos.length,
    totalMunicipios: municipiosProcessados.size,
    estabelecimentos: todosEstabelecimentos,
  };
  
  const caminhoAtual = path.join(DADOS_DIR, 'atual.json');
  salvarJSON(caminhoAtual, dadosAtuais);

  console.log('\n' + '='.repeat(60));
  console.log('Coleta finalizada!');
  console.log(`Total: ${todosEstabelecimentos.length} estabelecimentos`);
  console.log(`Municípios: ${municipiosProcessados.size}`);
  console.log(`Arquivos salvos em: ${DADOS_DIR}`);
  console.log('='.repeat(60));
}

// Executa
main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
