// Tipos de combustível conforme API SEFAZ/AL
export type TipoCombustivel = 1 | 2 | 3 | 4 | 5 | 6;

export const TIPOS_COMBUSTIVEL: Record<TipoCombustivel, string> = {
  1: 'Gasolina Comum',
  2: 'Gasolina Aditivada',
  3: 'Álcool',
  4: 'Diesel Comum',
  5: 'Diesel Aditivado (S10)',
  6: 'GNV',
};

export const CORES_COMBUSTIVEL: Record<TipoCombustivel, string> = {
  1: 'bg-yellow-500',
  2: 'bg-yellow-600',
  3: 'bg-green-500',
  4: 'bg-gray-600',
  5: 'bg-gray-700',
  6: 'bg-blue-500',
};

// Dados do estabelecimento conforme API SEFAZ
export interface Estabelecimento {
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
}

// Dados de venda da API SEFAZ
export interface VendaCombustivel {
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
  estabelecimento: Estabelecimento;
}

// Resposta paginada da API SEFAZ
export interface RespostaSefaz {
  totalRegistros: number;
  totalPaginas: number;
  pagina: number;
  registrosPorPagina: number;
  registrosPagina: number;
  primeiraPagina: boolean;
  ultimaPagina: boolean;
  conteudo: VendaCombustivel[];
}

// Dados sumarizados por estabelecimento
export interface PrecoCombustivelResumo {
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

// Estrutura do JSON atual (dados atuais de todos os municípios)
export interface DadosAtuais {
  atualizadoEm: string;
  totalEstabelecimentos: number;
  totalMunicipios: number;
  estabelecimentos: PrecoCombustivelResumo[];
}

// Estrutura do JSON de resumo por município
export interface ResumoMunicipio {
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

// Estrutura do JSON de histórico diário por município
export interface HistoricoDiario {
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

// Municípios de Alagoas
export const MUNICIPIOS_AL: Record<string, string> = {
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
  '2704906': 'Mar Vermelho',
  '2704500': 'Maragogi',
  '2704609': 'Maravilha',
  '2704708': 'Marechal Deodoro',
  '2704807': 'Maribondo',
  '2705002': 'Mata Grande',
  '2705101': 'Matriz de Camaragibe',
  '2705200': 'Messias',
  '2705309': 'Minador do Negrão',
  '2705408': 'Monteirópolis',
  '2705507': 'Murici',
  '2705606': 'Novo Lino',
  '2705705': 'Olho d\'Água das Flores',
  '2705804': 'Olho d\'Água do Casado',
  '2705903': 'Olho d\'Água Grande',
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
  '2709004': 'Tanque d\'Arca',
  '2709103': 'Taquarana',
  '2709152': 'Teotônio Vilela',
  '2709202': 'Traipu',
  '2709301': 'União dos Palmares',
  '2709400': 'Viçosa',
};
