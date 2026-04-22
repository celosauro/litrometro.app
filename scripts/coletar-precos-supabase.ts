/**
 * Script de coleta de preços de combustíveis - Versão Supabase
 * Executa via GitHub Actions a cada 3 horas
 * Consulta a API SEFAZ/AL e salva no Supabase + JSON (fallback)
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

interface EstabelecimentoExistente {
  cnpj: string;
  latitude: number | null;
  longitude: number | null;
  geocode_source: string | null;
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
const SEFAZ_API_URL = 'http://api.sefaz.al.gov.br/sfz-economiza-alagoas-api/api/public/combustivel/pesquisa';
const SEFAZ_APP_TOKEN = process.env.SEFAZ_APP_TOKEN!;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

// Lista de municípios de Alagoas (código IBGE)
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

const BATCH_SIZE_ESTABELECIMENTOS = 1000;
const BATCH_SIZE_PRECOS = 2000;
const BATCH_SIZE_HISTORICO = 2000;

const NOMES_COMBUSTIVEL: Record<TipoCombustivel, string> = {
  1: 'Gasolina Comum',
  2: 'Gasolina Aditivada',
  3: 'Álcool',
  4: 'Diesel Comum',
  5: 'Diesel S10',
  6: 'GNV',
};

// Municípios com muitos postos (>30) - executar individualmente para evitar timeout
const MUNICIPIOS_GRANDES = [
  '2704302', // Maceió (~200+ postos)
  '2700300', // Arapiraca (~100 postos)
  '2707701', // Rio Largo (~30 postos)
  '2704708', // Marechal Deodoro (~25 postos)
  '2709152', // Teotônio Vilela (~20 postos)
];

// Número de batches para dividir municípios pequenos
const TOTAL_BATCHES = 3;

// Cliente Supabase (secret key para escrita)
// Usando tipagem mais flexível para operações de escrita
let supabase: SupabaseClient | null = null;

/**
 * Configuração do cliente Supabase
 * @see https://supabase.com/docs/reference/javascript/initializing
 */
function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    return null;
  }
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: false, // Script de backend não precisa
        persistSession: false,   // Script de backend não precisa
      },
      global: {
        headers: {
          'x-application-name': 'litrometro-collector',
        },
      },
    });
  }
  return supabase;
}

/**
 * Processa argumentos de linha de comando
 * Suporta:
 *   --batch N      Processa batch N de municípios pequenos (1 a TOTAL_BATCHES)
 *   --grandes      Lista os municípios grandes (para debug)
 *   --pequenos     Processa todos os municípios pequenos
 *   <nome>         Filtra por nome ou código IBGE do município
 *   (vazio)        Processa TODOS os municípios
 */
function obterMunicipiosFiltrados(): Record<string, string> {
  const args = process.argv
    .slice(2)
    .filter((arg) => arg !== '--skip-healthcheck' && arg !== '--healthcheck-only');
  
  // Sem argumentos = todos os municípios
  if (args.length === 0) {
    return MUNICIPIOS_AL;
  }

  const comando = args[0].toLowerCase();

  // --grandes: lista municípios grandes (para uso no workflow)
  if (comando === '--grandes') {
    const resultado: Record<string, string> = {};
    for (const codigo of MUNICIPIOS_GRANDES) {
      if (MUNICIPIOS_AL[codigo]) {
        resultado[codigo] = MUNICIPIOS_AL[codigo];
      }
    }
    console.log(`📊 Municípios grandes (${MUNICIPIOS_GRANDES.length}): ${Object.values(resultado).join(', ')}`);
    return resultado;
  }

  // --pequenos: todos os municípios pequenos
  if (comando === '--pequenos') {
    const resultado: Record<string, string> = {};
    for (const [codigo, nome] of Object.entries(MUNICIPIOS_AL)) {
      if (!MUNICIPIOS_GRANDES.includes(codigo)) {
        resultado[codigo] = nome;
      }
    }
    console.log(`📊 Municípios pequenos: ${Object.keys(resultado).length}`);
    return resultado;
  }

  // --batch N: processa batch N de municípios pequenos
  if (comando === '--batch') {
    const batchNum = parseInt(args[1], 10);
    
    if (isNaN(batchNum) || batchNum < 1 || batchNum > TOTAL_BATCHES) {
      console.error(`❌ Batch inválido. Use --batch 1 até --batch ${TOTAL_BATCHES}`);
      process.exit(1);
    }

    // Filtra apenas municípios pequenos
    const pequenos = Object.entries(MUNICIPIOS_AL)
      .filter(([codigo]) => !MUNICIPIOS_GRANDES.includes(codigo))
      .sort((a, b) => a[1].localeCompare(b[1])); // Ordena por nome para consistência

    const tamanhoGrupo = Math.ceil(pequenos.length / TOTAL_BATCHES);
    const inicio = (batchNum - 1) * tamanhoGrupo;
    const fim = Math.min(inicio + tamanhoGrupo, pequenos.length);
    
    const batchMunicipios = pequenos.slice(inicio, fim);
    const resultado = Object.fromEntries(batchMunicipios);
    
    console.log(`📊 Batch ${batchNum}/${TOTAL_BATCHES}: ${batchMunicipios.length} municípios`);
    console.log(`   De "${batchMunicipios[0]?.[1]}" até "${batchMunicipios[batchMunicipios.length - 1]?.[1]}"`);
    
    return resultado;
  }

  // Filtro por nome ou código IBGE (comportamento original)
  const filtro = comando.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const resultado: Record<string, string> = {};

  for (const [codigo, nome] of Object.entries(MUNICIPIOS_AL)) {
    const nomeNormalizado = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (codigo === args[0] || nomeNormalizado.includes(filtro)) {
      resultado[codigo] = nome;
    }
  }

  if (Object.keys(resultado).length === 0) {
    console.error(`❌ Município não encontrado: "${args[0]}"`);
    process.exit(1);
  }

  return resultado;
}

/**
 * Helper: fetch com timeout e retry
 */
async function fetchComRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  timeoutMs: number = 30000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let tentativa = 1; tentativa <= maxRetries; tentativa++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error as Error;
      
      const isTimeout = (error as Error).name === 'AbortError' || 
                        (error as Error).message?.includes('timeout') ||
                        (error as Error).message?.includes('TIMEOUT') ||
                        String(error).includes('ConnectTimeoutError');
      
      console.warn(`  ⚠️  Tentativa ${tentativa}/${maxRetries} falhou${isTimeout ? ' (timeout)' : ''}`);
      
      if (tentativa < maxRetries) {
        // Espera exponencial: 2s, 4s, 8s...
        const delay = Math.min(2000 * Math.pow(2, tentativa - 1), 10000);
        console.log(`     Aguardando ${delay/1000}s antes de retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Consulta a API SEFAZ
 */
async function consultarPrecosCombustivel(
  tipoCombustivel: TipoCombustivel,
  codigoIBGE: string,
  pagina: number = 1
): Promise<RespostaSefaz | null> {
  const body = {
    produto: { tipoCombustivel },
    estabelecimento: {
      municipio: { codigoIBGE: parseInt(codigoIBGE, 10) },
    },
    dias: 10,
    pagina,
    registrosPorPagina: 500,
  };

  try {
    const response = await fetchComRetry(
      SEFAZ_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AppToken': SEFAZ_APP_TOKEN,
        },
        body: JSON.stringify(body),
      },
      3,  // maxRetries
      30000  // timeoutMs (30s)
    );

    if (!response.ok) {
      console.error(`Erro API SEFAZ (${codigoIBGE}, tipo ${tipoCombustivel}): ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao consultar API SEFAZ (${codigoIBGE}, tipo ${tipoCombustivel}):`, (error as Error).message);
    return null;
  }
}

/**
 * Health check da API SEFAZ antes da coleta completa.
 * Interrompe o script cedo quando a API está indisponível.
 */
async function verificarSaudeSefaz(): Promise<{ saudavel: boolean; erro?: string }> {
  try {
    // Usa a MESMA função de consulta real para evitar falso negativo por payload diferente.
    const data = await consultarPrecosCombustivel(1, '2704302', 1);
    if (!data) {
      return {
        saudavel: false,
        erro: 'SEFAZ sem resposta válida na consulta de teste',
      };
    }

    return { saudavel: true };
  } catch (error) {
    return {
      saudavel: false,
      erro: `Falha de conectividade com SEFAZ: ${(error as Error).message}`,
    };
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
    // Delay entre páginas para não sobrecarregar a API
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return todosResultados;
}

/**
 * Processa vendas e prepara dados para inserção
 */
function processarVendas(
  vendas: VendaCombustivel[],
  tipoCombustivel: TipoCombustivel
): {
  estabelecimentos: EstabelecimentoInsert[];
  precos: PrecoAtualInsert[];
  historico: VendaHistoricoInsert[];
} {
  const estabelecimentosMap = new Map<string, EstabelecimentoInsert>();
  const precosMap = new Map<string, PrecoAtualInsert>();
  const historico: VendaHistoricoInsert[] = [];

  for (const venda of vendas) {
    const cnpj = venda.estabelecimento.cnpj;
    const valor = venda.produto.venda.valorVenda;
    const dataVenda = venda.produto.venda.dataVenda;

    // Estabelecimento (upsert por CNPJ)
    if (!estabelecimentosMap.has(cnpj)) {
      estabelecimentosMap.set(cnpj, {
        cnpj,
        razao_social: venda.estabelecimento.razaoSocial,
        nome_fantasia: venda.estabelecimento.nomeFantasia || null,
        telefone: venda.estabelecimento.telefone || null,
        nome_logradouro: venda.estabelecimento.endereco.nomeLogradouro || null,
        numero_imovel: venda.estabelecimento.endereco.numeroImovel || null,
        bairro: venda.estabelecimento.endereco.bairro || null,
        cep: venda.estabelecimento.endereco.cep || null,
        codigo_ibge: venda.estabelecimento.endereco.codigoIBGE,
        latitude: venda.estabelecimento.endereco.latitude || null,
        longitude: venda.estabelecimento.endereco.longitude || null,
        geocode_source: 'sefaz',
      });
    }

    // Preço atual (agrupa por CNPJ + tipo)
    const chavePreco = `${cnpj}-${tipoCombustivel}`;
    const precoExistente = precosMap.get(chavePreco);
    
    if (!precoExistente) {
      precosMap.set(chavePreco, {
        cnpj,
        tipo_combustivel: tipoCombustivel,
        valor_minimo: valor,
        valor_maximo: valor,
        valor_medio: valor,
        valor_recente: valor,
        data_recente: dataVenda,
      });
    } else {
      precoExistente.valor_minimo = Math.min(precoExistente.valor_minimo, valor);
      precoExistente.valor_maximo = Math.max(precoExistente.valor_maximo, valor);
      precoExistente.valor_medio = (precoExistente.valor_medio + valor) / 2;
      
      if (new Date(dataVenda) > new Date(precoExistente.data_recente)) {
        precoExistente.valor_recente = valor;
        precoExistente.data_recente = dataVenda;
      }
    }

    // Histórico (todas as vendas individuais)
    historico.push({
      cnpj,
      tipo_combustivel: tipoCombustivel,
      valor_venda: valor,
      data_venda: dataVenda,
    });
  }

  return {
    estabelecimentos: Array.from(estabelecimentosMap.values()),
    precos: Array.from(precosMap.values()),
    historico,
  };
}

/**
 * Insere/atualiza dados no Supabase
 */
async function salvarNoSupabase(
  estabelecimentos: EstabelecimentoInsert[],
  precos: PrecoAtualInsert[],
  historico: VendaHistoricoInsert[]
): Promise<{ sucesso: boolean; erro?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { sucesso: false, erro: 'Supabase não configurado' };
  }

  try {
    // 1. Upsert estabelecimentos
    if (estabelecimentos.length > 0) {
      const estabelecimentosMesclados = await mesclarCoordenadasValidadas(estabelecimentos);
      for (let i = 0; i < estabelecimentosMesclados.length; i += BATCH_SIZE_ESTABELECIMENTOS) {
        const batch = estabelecimentosMesclados.slice(i, i + BATCH_SIZE_ESTABELECIMENTOS);
        const { error: errEstab } = await client
          .from('estabelecimentos')
          .upsert(batch, {
            onConflict: 'cnpj',
            ignoreDuplicates: false,
          });

        if (errEstab) {
          console.error('Erro ao inserir estabelecimentos (batch):', errEstab);
          return { sucesso: false, erro: errEstab.message };
        }
      }
    }

    // 2. Upsert preços atuais
    if (precos.length > 0) {
      for (let i = 0; i < precos.length; i += BATCH_SIZE_PRECOS) {
        const batch = precos.slice(i, i + BATCH_SIZE_PRECOS);
        const { error: errPrecos } = await client
          .from('precos_atuais')
          .upsert(batch, {
            onConflict: 'cnpj,tipo_combustivel',
            ignoreDuplicates: false,
          });

        if (errPrecos) {
          console.error('Erro ao inserir preços (batch):', errPrecos);
          return { sucesso: false, erro: errPrecos.message };
        }
      }
    }

    // 3. Insert histórico (ignora duplicatas via constraint)
    if (historico.length > 0) {
      for (let i = 0; i < historico.length; i += BATCH_SIZE_HISTORICO) {
        const batch = historico.slice(i, i + BATCH_SIZE_HISTORICO);
        const { error: errHist } = await client
          .from('vendas_historico')
          .upsert(batch, {
            onConflict: 'cnpj,tipo_combustivel,data_venda,valor_venda',
            ignoreDuplicates: true,
          });
        
        if (errHist) {
          console.error('Erro ao inserir histórico (batch):', errHist);
          // Continua mesmo com erro no histórico
        }
      }
    }

    return { sucesso: true };
  } catch (error) {
    return { sucesso: false, erro: String(error) };
  }
}

async function buscarEstabelecimentosExistentes(
  cnpjs: string[]
): Promise<Map<string, EstabelecimentoExistente>> {
  const client = getSupabaseClient();
  const existentes = new Map<string, EstabelecimentoExistente>();

  if (!client || cnpjs.length === 0) {
    return existentes;
  }

  const batchSize = 500;

  for (let i = 0; i < cnpjs.length; i += batchSize) {
    const batch = cnpjs.slice(i, i + batchSize);
    const { data, error } = await client
      .from('estabelecimentos')
      .select('cnpj, latitude, longitude, geocode_source')
      .in('cnpj', batch);

    if (error) {
      throw new Error(`Erro ao buscar estabelecimentos existentes: ${error.message}`);
    }

    for (const registro of (data || []) as EstabelecimentoExistente[]) {
      existentes.set(registro.cnpj, registro);
    }
  }

  return existentes;
}

function devePreservarCoordenadasExistentes(existente: EstabelecimentoExistente): boolean {
  return Boolean(
    existente.latitude !== null &&
    existente.longitude !== null &&
    existente.geocode_source &&
    existente.geocode_source !== 'sefaz'
  );
}

async function mesclarCoordenadasValidadas(
  estabelecimentos: EstabelecimentoInsert[]
): Promise<EstabelecimentoInsert[]> {
  const existentes = await buscarEstabelecimentosExistentes(
    estabelecimentos.map(estabelecimento => estabelecimento.cnpj)
  );

  let preservados = 0;

  const mesclados = estabelecimentos.map(estabelecimento => {
    const existente = existentes.get(estabelecimento.cnpj);
    if (!existente || !devePreservarCoordenadasExistentes(existente)) {
      return estabelecimento;
    }

    preservados++;
    return {
      ...estabelecimento,
      latitude: existente.latitude,
      longitude: existente.longitude,
      geocode_source: existente.geocode_source || estabelecimento.geocode_source,
    };
  });

  if (preservados > 0) {
    console.log(`  📍 ${preservados} coordenadas validadas preservadas no Supabase`);
  }

  return mesclados;
}

/**
 * Cria ou atualiza log de coleta
 */
async function criarLogColeta(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('coletas_log')
    .insert({ status: 'running' })
    .select('id')
    .single();

  if (error) {
    console.error('Erro ao criar log de coleta:', error);
    return null;
  }

  return data.id;
}

async function atualizarLogColeta(
  id: string,
  status: 'success' | 'partial' | 'error',
  totais: { vendas: number; estabelecimentos: number; municipios: number },
  erro?: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  await client
    .from('coletas_log')
    .update({
      finalizado_em: new Date().toISOString(),
      total_vendas: totais.vendas,
      total_estabelecimentos: totais.estabelecimentos,
      total_municipios: totais.municipios,
      status,
      erro,
    })
    .eq('id', id);
}

/**
 * Função principal
 */
async function main(): Promise<void> {
  const argumentos = process.argv.slice(2);
  const somenteHealthcheck = argumentos.includes('--healthcheck-only');
  const ignorarHealthcheck = argumentos.includes('--skip-healthcheck');

  // Valida configurações
  if (!SEFAZ_APP_TOKEN) {
    console.error('❌ SEFAZ_APP_TOKEN não configurado!');
    process.exit(1);
  }

  if (!ignorarHealthcheck) {
    console.log('🩺 Verificando saúde da API SEFAZ...');
    const saudeSefaz = await verificarSaudeSefaz();
    if (!saudeSefaz.saudavel) {
      console.error(`❌ API SEFAZ indisponível. Coleta interrompida: ${saudeSefaz.erro}`);
      process.exit(1);
    }
    console.log('✓ API SEFAZ saudável');

    if (somenteHealthcheck) {
      return;
    }
  }

  const municipiosParaProcessar = obterMunicipiosFiltrados();
  const totalMunicipios = Object.keys(municipiosParaProcessar).length;

  console.log('='.repeat(60));
  console.log('Coleta de preços - Versão SUPABASE');
  console.log(`Data/Hora: ${new Date().toISOString()}`);
  console.log(`Municípios: ${totalMunicipios}`);
  console.log('='.repeat(60));

  const supabaseDisponivel = Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
  console.log(`✓ SEFAZ Token configurado`);
  console.log(`${supabaseDisponivel ? '✓' : '⚠'} Supabase ${supabaseDisponivel ? 'configurado' : 'NÃO configurado (apenas log)'}`);
  
  // Cria log de coleta
  const logId = await criarLogColeta();
  if (logId) {
    console.log(`✓ Log de coleta criado: ${logId}`);
  }

  // Contadores
  let totalVendas = 0;
  let totalEstabelecimentos = 0;
  const municipiosComDados = new Set<string>();
  let erros = 0;

  // Fase 1: coleta completa em memória
  const estabelecimentosColetados: EstabelecimentoInsert[] = [];
  const precosColetados: PrecoAtualInsert[] = [];
  const historicoColetado: VendaHistoricoInsert[] = [];

  // Processa cada município
  for (const [codigoIBGE, nomeMunicipio] of Object.entries(municipiosParaProcessar)) {
    console.log(`\n📍 ${nomeMunicipio} (${codigoIBGE})...`);
    
    const estabelecimentosMunicipio: EstabelecimentoInsert[] = [];
    const precosMunicipio: PrecoAtualInsert[] = [];
    const historicoMunicipio: VendaHistoricoInsert[] = [];

    // Processa cada tipo de combustível
    for (const tipoCombustivel of TIPOS_COMBUSTIVEL) {
      const vendas = await buscarTodasPaginas(tipoCombustivel, codigoIBGE);
      
      if (vendas.length > 0) {
        const { estabelecimentos, precos, historico } = processarVendas(vendas, tipoCombustivel);
        
        estabelecimentosMunicipio.push(...estabelecimentos);
        precosMunicipio.push(...precos);
        historicoMunicipio.push(...historico);
        
        console.log(`  ⛽ ${NOMES_COMBUSTIVEL[tipoCombustivel]}: ${vendas.length} vendas, ${precos.length} postos`);
      }

      // Delay entre tipos de combustível para não sobrecarregar a API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (precosMunicipio.length > 0) {
      estabelecimentosColetados.push(...estabelecimentosMunicipio);
      precosColetados.push(...precosMunicipio);
      historicoColetado.push(...historicoMunicipio);
      municipiosComDados.add(codigoIBGE);

      console.log(`  ✓ Coletado: ${precosMunicipio.length} preços, ${historicoMunicipio.length} vendas`);
    } else {
      console.log('  • Sem dados no período para este município');
    }

    // Delay entre municípios para não sobrecarregar a API
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Fase 2: persistência em lote no Supabase
  if (precosColetados.length > 0) {
    const estabelecimentosUnicos = Array.from(
      new Map(estabelecimentosColetados.map((estabelecimento) => [estabelecimento.cnpj, estabelecimento])).values()
    );

    const precosUnicos = Array.from(
      new Map(precosColetados.map((preco) => [`${preco.cnpj}-${preco.tipo_combustivel}`, preco])).values()
    );

    console.log('\n💾 Persistindo dados em lote no Supabase...');
    console.log(`  - Estabelecimentos únicos: ${estabelecimentosUnicos.length}`);
    console.log(`  - Preços únicos: ${precosUnicos.length}`);
    console.log(`  - Histórico bruto: ${historicoColetado.length}`);

    const resultado = await salvarNoSupabase(
      estabelecimentosUnicos,
      precosUnicos,
      historicoColetado
    );

    if (resultado.sucesso) {
      totalVendas = historicoColetado.length;
      totalEstabelecimentos = estabelecimentosUnicos.length;
      console.log('  ✓ Persistência em lote concluída');
    } else {
      erros++;
      console.log(`  ❌ Erro na persistência em lote: ${resultado.erro}`);
    }
  }

  // Atualiza log de coleta
  if (logId) {
    const status = erros === 0 ? 'success' : erros < totalMunicipios ? 'partial' : 'error';
    await atualizarLogColeta(logId, status, {
      vendas: totalVendas,
      estabelecimentos: totalEstabelecimentos,
      municipios: municipiosComDados.size,
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('Coleta finalizada!');
  console.log(`Total vendas: ${totalVendas}`);
  console.log(`Total estabelecimentos: ${totalEstabelecimentos}`);
  console.log(`Municípios com dados: ${municipiosComDados.size}`);
  console.log(`Erros: ${erros}`);
  console.log('='.repeat(60));

  if (erros > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
