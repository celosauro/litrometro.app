Página 1
Secretaria de Estado Fazenda de Alagoas
Superintendência de Tecnologia da Informação - SUTI
Projeto
Economiza Alagoas
Manual de Orientação do
Desenvolvedor
Versão 1.0 – março de 2023
Página 2
HISTÓRICO DE REVISÕES
Data Versão Descrição
15/03/2023 1.0.0 Publicação inicial da especificação.
Página 3
CONTEÚDO
1 Introdução ...........................................................................................................................................4
2 Referências..........................................................................................................................................4
3 Visão Geral...........................................................................................................................................4
4 Considerações Técnicas.......................................................................................................................5
5 Considerações sobre os Dados............................................................................................................5
6 Serviços................................................................................................................................................6
6.1 Pesquisa de preço de produtos...................................................................................................6
6.1.1 Leiaute de dados de entrada ..................................................................................................6
6.1.2 Leiaute de dados de saída ......................................................................................................7
6.2 Pesquisa de preço de combustíveis............................................................................................9
6.2.1 Leiaute de dados de entrada ..................................................................................................9
6.2.2 Leiaute de dados de saída ....................................................................................................10
7 Mensagem de Erro ............................................................................................................................11
8 ANEXOS..............................................................................................................................................11
Página 4
1 INTRODUÇÃO
O Economiza Alagoas é um projeto da Secretaria de Fazenda do Estado de Alagoas
que tem o objetivo de divulgar informações públicas sobre as vendas de produtos realizadas
utilizando a Nota Fiscal Eletrônica - NF-e e Nota Fiscal de Consumidor Eletrônica – NFC-e.
A plataforma é composta de uma página WEB (economizaalagoas.sefaz.al.gov.br) e
de um conjunto público de serviços na forma de uma API - Application Programming Interface
(Interface de Programação de Aplicação).
Este documento tem a finalidade de fornecer as informações necessárias aos
desenvolvedores e pessoas interessadas em acessar a API de pesquisa de preços.
2 REFERÊNCIAS
Manual de Orientação do Contribuinte e demais notas técnicas dos projetos NF-e e
NFC-e. As documentações podem ser acessadas no portal abaixo:
https://www.nfe.fazenda.gov.br/
3 VISÃO GERAL
Há alguns anos o Brasil vem passando por uma revolução no comércio e na
sociedade com a implantação de diversos documentos e notas fiscais no formato digital. Todas
as informações contidas nesses documentos são automaticamente disponibilizadas para as
Secretarias de Fazenda dos Estados em tempo real.
O projeto Economiza Alagoas é uma iniciativa pioneira e inovadora no Brasil criado
em agosto de 2017 que visa disponibilizar parte dessas informações na forma de um conjunto
de API´s públicas. Todas as informações sobre os produtos e preços fornecidos nas pesquisas
são oriundas de vendas reais e nenhum dado que possa ser considerado sigiloso pelas
empresas é liberado.
Dentre vários objetivos dessa iniciativa, podemos destacar:
1) Democratização e transparência nas informações;
2) Diminuição do custo-Brasil;
3) Fomento à indústria de software;
4) Criação e melhoria nos serviços do governo;
Os serviços disponibilizados são totalmente acessíveis por qualquer cidadão e,
atualmente, sem qualquer custo para os usuários. Todos os dados fornecidos são livres para
uso particular ou comercial.
Cada pessoa ou empresa interessada em usar a API deve solicitar o acesso através do
e-mail api@sefaz.al.gov.br, informando o CPF e nome completo do responsável e o nome do
aplicativo, empresa ou a URL da página WEB onde as informações serão utilizadas, caso exista.
A SEFAZ/AL fornecerá um Token de acesso (appToken) para ser utilizado nas requisições aos
serviços.
Página 5
4 CONSIDERAÇÕES TÉCNICAS
Todos os serviços são disponibilizados através da arquitetura REST. As requisições
devem ser feitas pelo método “POST” do protocolo HTTP. A URL base (endpoint) para todos os
métodos da API é:
http://api.sefaz.al.gov.br/sfz-economiza-alagoas-api/api/public/
A troca de informações é feita no formato JSON, considerado um formato aberto,
leve e flexível para comunicação pela WEB, além de ser de fácil compreensão e reutilização.
Cada requisição deve conter informações nas áreas “header” e “body”. O “header”
deve possuir um atributo com a chave “AppToken” contendo o valor do Token de acesso
fornecido pela SEFAZ/AL. O “body” deve conter o JSON no formato específico de cada método.
Não existe qualquer restrição em relação à quantidade de solicitações feitas.
Aconselhamos apenas que os usuários que utilizem nossa API para fins comerciais ou com
grande demanda de acesso montem uma infraestrutura intermediária própria para não
sobrecarregar nossa rede. Essa arquitetura intermediária permite, também, que cada usuário
construa sua base de estatísticas e se previna contra eventuais paradas em nossos serviços.
5 CONSIDERAÇÕES SOBRE OS DADOS
Todas as informações disponibilizadas pela plataforma são obtidas a partir de vendas
reais realizadas pelos contribuintes que emitem NF-e e NFC-e no Estado de Alagoas.
Informações como descrição, código de barras e valor do produto são fornecidas a partir da
última venda realizada até o momento da pesquisa considerando as notas fiscais emitidas nos
últimos 10 (dez) dias.
Os utilizadores da API devem estar cientes dos seguintes fatos em relação aos dados:
1) Muitos contribuintes emitem notas fiscais com informações erradas, o que pode
ocasionar inconsistências nas informações fornecidas;
2) Cada contribuinte define e informa sua própria descrição do produto. Assim, leve
em consideração as abreviações no momento da pesquisa;
3) Não há obrigação do estabelecimento seguir o mesmo preço praticado fornecido
nas pesquisas, já que pode ser oriundo de algum programa de relacionamento ou
promoção temporária;
4) Cada contribuinte estabelece sua forma de distribuição de desconto na nota
fiscal. O que pode ocasionar distorções nos preços apresentados.
5) Todas as datas apresentadas na API seguem o padrão UTC ISO 8601. Ou seja, a
data é apresentada sem a informação do Timezone. Assim, cada usuário deve
atualizar a hora fornecida para o seu Timezone específico.
Página 6
6 SERVIÇOS
Esta seção apresenta os serviços disponibilizados pelo projeto, assim como o formato
dos dados a serem enviados e retornados em cada método da API.
6.1 PESQUISA DE PREÇO DE PRODUTOS
Permite a pesquisa de preços de produtos em geral através de diversos critérios.
Método: “produto/pesquisa”
6.1.1 LEIAUTE DE DADOS DE ENTRADA
Item Campo Tipo Ocorr. Valor Tam. Descrição
1 produto G 1 Critérios de seleção dos produtos.
1.1 gtin E 0-1 N 8/12/
13/14
Código de Barras do produto. Preencher com o código GTIN-8,
GTIN-12, GTIN-13 ou GTIN-14 (antigos códigos EAN, UPC e DUN14) do produto. Conteúdo deve ser enviado como texto (entre
aspas) e com os zeros não significativos.
1.2 descricao E 0-1 C 3-50 Palavras chaves de pesquisa ao produto.
Obs.: caracteres especiais como “%” e “_” serão desconsiderados.
Serão desconsiderados os termos com tamanho 1 e tamanho 2
que estejam na lista de termos ignorados ("da", "de", "do", "na",
"no").
1.2.1 ncm E 0-1 N 8 Código NCM do produto. A Nomenclatura Comum do Mercosul
(NCM) é um código de oito dígitos usado para identificar a
natureza dos produtos comercializados no Brasil e nos outros
países do Mercosul. Conteúdo deve ser enviado como texto (entre
aspas) e com os zeros não significativos.
1.2.2 gpc E 0-1 N 8 Código de classificação do produto de acordo com o segmento do
GPC (Classificação Global de Produtos) (Anexo III). Apenas para
produtos que possuam GTIN. Conteúdo deve ser enviado como
texto (entre aspas) e com os zeros não significativos.
2 estabelecimento G 1 Critérios de seleção dos estabelecimentos.
2.1 individual SG 0-1
2.1.1 cnpj E 1 N 8/14 Raiz do CNPJ ou CNPJ completo do estabelecimento. Conteúdo
deve ser enviado como texto (entre aspas) e com os zeros não
significativos.
2.2 municipio SG 0-1
2.2.1 codigoIBGE E 1 N 7 Código do município de Alagoas definido pelo IBGE. (Anexo II)
2.3 geolocalizacao SG 0-1
2.3.1 latitude E 1 N 2,1-15 Latitude de onde se encontra o dispositivo de pesquisa.
2.3.2 longitude E 1 N 2,1-15 Longitude de onde se encontra o dispositivo de pesquisa.
2.3.3 raio E 1 N 1-2 Raio de alcance (em quilômetros) dos estabelecimentos a serem
pesquisados.
3 dias E 1 N 1-2 Quantidade de dias da pesquisa.
4 pagina E 0-1 N 1-4 Número da página a ser retornado. Default: 1 (primeira página)
5 registrosPorPagina E 0-1 N 2-4 Quantidade de registros por página a ser retornada. Default: 100
Ex.:
{
 "produto": {
 "descricao": "LEITE",
 "gpc": "50000000"
 },
 "estabelecimento": {
 "geolocalizacao": {
 "latitude": -9.568061100000001,
 "longitude": -35.79424830000001,
Página 7
 "raio": 15
 }
 },
 "dias": 7,
 "pagina": 3,
 "registrosPorPagina": 500
}
6.1.1.1 VALIDAÇÕES
Campo Regra de validação Mensagem de erro
1 Um dos critérios (gtin ou descrição) de pesquisa de produto deve
ser fornecido.
Critério de pesquisa de produto não informado.
1 Apenas um dos critérios (gtin ou descrição) de pesquisa de
produto deve ser fornecido.
Mais de um critério de pesquisa de produto
informado.
1.2.1 Subcritério NCM deve ser informado apenas quando o critério
de descrição for informado.
NCM informado sem o critério de descrição do
produto.
1.2.2 Subcritério código GPC deve ser informado apenas quando o
critério de descrição for informado.
Código GPC informado sem o critério de descrição do
produto.
1.2.2 GPC deve estar contido na tabela de código válidos do anexo III. Código GPC inválido.
2 Um dos critérios de pesquisa (subgrupo) de estabelecimento
deve ser fornecido.
Critério de pesquisa de estabelecimento não
informado.
2 Apenas um dos critérios de pesquisa (subgrupo) de
estabelecimento deve ser fornecido.
Mais de um critério de pesquisa de estabelecimento
informado.
2.2.1 Código IBGE do município diferente do listado no anexo II. Código do município inválido.
2.3 Dados da latitude, longitude e raio devem ser fornecidos quando
o critério de geolocalização for informado.
Coordenadas de geolocalização não informados.
2.3.3 Raio de alcance deve estar ente 1 km e 15 km. Raio de alcance fora do intervalo permitido.
3 Período de pesquisa deve estar entre 1 e 10 dias. Período da pesquisa fora do intervalo permitido.
4 Número da página deve estar entre 1 e 9999. Número da página fora do intervalo permitido.
5 Número de registros por página deve estar entre 50 e 5.000 Registros por página fora do intervalo permitido.
6.1.2 LEIAUTE DE DADOS DE SAÍDA
Item Campo Tipo Valor Tam. Descrição
1 totalRegistros E N 1-10 Quantidade total de registros encontrados de acordo com os critérios
de pesquisa.
2 totalPaginas E N 1-5 Quantidade total de páginas. Definido de acordo com a quantidade de
registros por página requisitada.
3 pagina E N 1-5 Página atual retornada.
4 registrosPorPagina E N 1-4 Quantidade de registros por página requisitada.
5 registrosPagina E N 1-4 Quantidade de registros retornados na página.
6 primeiraPagina E C 5 Indica se a página retornada é a primeira. Valores: true ou false.
7 ultimaPagina E C 5 Indica se a página retornada é a última. Valores: true ou false.
8 conteudo L Lista que contem o conjunto de resultados da pesquisa.
8.1 produto G Informações sobre os produtos.
8.1.1 codigo E C 1-60 Código do produto fornecido pelo estabelecimento.
8.1.2 descricao E C 1-120 Descrição do produto fornecido pelo estabelecimento.
8.1.3 descricaoSefaz E C 0-120 Descrição do produto definido pela Sefaz (quando existir).
8.1.4 gtin E N 0/8-14 Código de Barras do produto. Em pesquisa que não sejam por código
de barras, é fornecido apenas quando o estabelecimento informa na
Nota Fiscal.
8.1.5 ncm E N 8 Código NCM do produto fornecido pelo estabelecimento.
8.1.6 gpc E N 1/8 Código de classificação do produto de acordo com o GPC (Classificação
Global de Produtos) (Anexo III). Retorna o valor 0 (zero) caso o
produto não tenha sido classificado ou não possui GTIN.
8.1.7 unidadeMedida E C 1-6 Unidade de medida comercial declarado na última venda.
Página 8
8.1.8 venda SG Informações sobre a venda do produto.
8.1.8.1 dataVenda E D Data e hora da última venda do produto no formato UTC. Padrão ISO
8601. Formato: YYYY-MM-DDThh:mm:ssZ
8.1.8.2 valorDeclarado E N 10,5 Valor do produto declarado pelo contribuinte na última venda.
8.1.8.3 valorVenda E N 13,5 Valor efetivo da última venda realizada.
8.2 estabelecimento G Informações sobre os estabelecimentos.
8.2.1 cnpj E N 14 CNPJ completo do estabelecimento.
8.2.2 razaoSocial E C 150 Razão Social do estabelecimento.
8.2.3 nomeFantasia E C 150 Nome fantasia do estabelecimento.
8.2.4 telefone E C 21 Telefone do estabelecimento.
8.2.5 endereco SG Endereço do estabelecimento
8.2.5.1 nomeLogradouro E C 80 Nome da rua onde se localiza o estabelecimento.
8.2.5.2 numeroImovel E C 7 Número do imóvel onde se localiza o estabelecimento.
8.2.5.3 bairro E C 50 Bairro onde se localiza o estabelecimento.
8.2.5.4 cep E N 8 CEP onde se localiza o estabelecimento.
8.2.5.5 codigoIBGE E N 7 Código do município definido pelo IBGE. (Anexo II)
8.2.5.6 municipio E C 100 Nome do município.
8.2.5.7 latitude E N 2,1-15 Latitude do estabelecimento.
8.2.5.8 longitude E N 2,1-15 Longitude do estabelecimento.
Ex.:
{
 "totalRegistros": 10345,
 "totalPaginas ": 11,
 "pagina": 11,
 "registrosPorPagina": 1000,
 "registrosPagina": 345,
 "primeiraPagina": false,
 "ultimaPagina": true,
 "conteudo": [
{
 "produto": {
 "codigo": "123456",
 "descricao": "LEITE NA CAIXA 1L",
 "descricaoSefaz": "",
 "gtin": "7894600011622",
 "ncm": 22021000,
 "gpc": 0,
 "unidadeMedida": "UN",
 "venda": {
 "dataVenda": "2018-10-11T13:51:47Z",
 "valorDeclarado": 1.65,
 "valorVenda": 1.57
 }
 },
 "estabelecimento": {
 "cnpj": "012345678901234",
 "razaoSocial": "SUPERMERCADO SEFAZ",
 "nomeFantasia": "SEFAZ/AL",
 "telefone": "(82) 3355-6688",
 "endereço": {
 "nomeLogradouro": "AV FERNANDES LIMA",
 "numeroImovel": "1500",
 "bairro": "FAROL",
 "cep": "57035000",
Página 9
 "codigoIBGE": "2704302",
 "municipio": "MACEIO",
 "latitude": -9.5478462,
 "longitude": -35.7322543
 }
 }
}
...
 ]
}
6.2 PESQUISA DE PREÇO DE COMBUSTÍVEIS
Permite a pesquisa de preços de combustíveis. A pesquisa é baseada no código da
ANP informado na Nota Fiscal pelo contribuinte.
Método: “combustivel/pesquisa”
6.2.1 LEIAUTE DE DADOS DE ENTRADA
Item Campo Tipo Ocorr. Valor Tam. Descrição
1 produto G 1 Critérios de seleção do produto.
1.1 tipoCombustivel E 1 N 1 Tipo de combustível.
Valores possíveis:
1 – Gasolina Comum;
2 – Gasolina Aditivada;
3 – Álcool;
4 – Diesel Comum;
5 – Diesel Aditivado (S10);
6 – GNV.
2 estabelecimento G 1 Critérios de seleção dos estabelecimentos.
2.1 individual SG 0-1
2.1.1 cnpj E 1 N 8/14 Raiz do CNPJ ou CNPJ completo do estabelecimento. Conteúdo
deve ser enviado como texto (entre aspas) e com os zeros não
significativos.
2.2 municipio SG 0-1
2.2.1 codigoIBGE E 1 N 7 Código do município de Alagoas definido pelo IBGE. (Anexo II)
2.3 geolocalizacao SG 0-1
2.3.1 latitude E 1 N 2,1-15 Latitude de onde se encontra o dispositivo de consulta.
2.3.2 longitude E 1 N 2,1-15 Longitude de onde se encontra o dispositivo de consulta.
2.3.3 raio E 1 N 1-2 Raio de alcance (em Quilômetros) dos estabelecimentos
pesquisados.
3 dias E 1 N 1-2 Quantidade de dias da pesquisa.
4 pagina E 0-1 N 1-4 Número da página a ser retornado. Default: 1 (primeira página)
5 registrosPorPagina E 0-1 N 2-4 Quantidade de registros por página a ser retornada. Default: 100
Ex.:
{
 "produto": {
 "tipoCombustivel": 1
 },
 "estabelecimento": {
 "individual": {
 "cnpj": "01234567"
 }
 },
 "dias": 5,
Página 10
 "pagina": 1
}
6.2.1.1 VALIDAÇÕES
Campo Descrição Mensagem
1 Critério de pesquisa do tipo de combustível deve ser informado. Tipo de combustível não informado.
1.1 Tipo de combustível diferente dos valores 1 a 6. Tipo de combustível inválido.
2 Um dos critérios de pesquisa (subgrupo) de estabelecimento
deve ser fornecido.
Critério de pesquisa de estabelecimento não
informado.
2 Apenas um dos critérios de pesquisa (subgrupo) de
estabelecimento deve ser informado.
Mais de um critério de pesquisa de estabelecimento
informado.
2.2.1 Código IBGE do município diferente do listado no anexo II. Código do município inválido.
2.3 Dados da latitude, longitude e raio devem ser fornecidos quando
o critério de geolocalização for informado
Coordenadas de geolocalização não informados.
2.3.3 Raio de alcance deve estar ente 1 km e 15 km. Raio de alcance fora do intervalo permitido.
3 Período de consulta deve estar entre 1 e 10 dias. Período da pesquisa fora do intervalo permitido.
4 Número da página deve estar entre 1 e 9999. Número da página fora do intervalo permitido.
5 Número de registros por página deve estar entre 50 e 5.000 Registros por página fora do intervalo permitido.
6.2.2 LEIAUTE DE DADOS DE SAÍDA
Item Campo Tipo Valor Tam. Descrição
1 totalRegistros E N 1-10 Quantidade total de registros encontrados de acordo com os
critérios de pesquisa.
2 totalPaginas E N 1-5 Quantidade total de páginas. Definido de acordo com a quantidade
de registros por página requisitada.
3 pagina E N 1-5 Página atual retornada.
4 registrosPorPagina E N 1-4 Quantidade de registros por página requisitada.
5 registrosPagina E N 1-4 Quantidade de registros retornados na página.
6 primeiraPagina E C 5 Indica se a página retornada é a primeira. Valores: true ou false.
7 ultimaPagina E C 5 Indica se a página retornada é a última. Valores: true ou false.
8 conteudo L Lista que contem o conjunto de resultados da pesquisa.
8.1 produto G
8.1.1 codigo E C 1-60 Código do produto definido pelo estabelecimento.
8.1.2 descricao E C 1-120 Descrição do produto definido pelo estabelecimento.
8.1.3 unidadeMedida E C 1-6 Unidade de medida comercial declarado na última venda.
8.1.4 venda SG
8.1.4.1 dataVenda E D Data e hora da última venda do produto no formato UTC. Padrão ISO
8601.Formato: YYYY-MM-DDThh:mm:ssZ
8.1.4.2 valorDeclarado E N 10,1-10 Valor do produto declarado pelo contribuinte na última venda.
8.1.4.3 valorVenda E N 13,5 Valor efetivo da última venda realizada.
8.2 estabelecimento G
8.2.1 cnpj E N 14 CNPJ completo do estabelecimento.
8.2.2 razaoSocial E C 150 Razão Social do estabelecimento.
8.2.3 nomeFantasia E C 150 Nome fantasia do estabelecimento.
8.2.4 telefone E C 21 Telefone do estabelecimento.
8.2.5 endereco SG Endereço do estabelecimento
8.2.5.1 nomeLogradouro E C 80 Nome da rua onde se localiza o estabelecimento.
8.2.5.2 numeroImovel E C 7 Número do imóvel onde se localiza o estabelecimento.
8.2.5.3 bairro E C 50 Bairro onde se localiza o estabelecimento.
8.2.5.4 cep E N 8 CEP onde se localiza o estabelecimento.
8.2.5.5 codigoIBGE E N 7 Código do município definido pelo IBGE. (Anexo II)
8.2.5.6 municipio E C 100 Nome do município.
8.2.5.7 latitude E N 2,1-15 Latitude do estabelecimento.
8.2.5.8 longitude E N 2,1-15 Longitude do estabelecimento.
Página 11
7 MENSAGEM DE ERRO
Caso haja algum problema na requisição, o sistema retornará uma mensagem com o
primeiro erro encontrado.
Item Campo Tipo Valor Tam.
1 timestamp E D Data de emissão no formato UTC. Padrão ISO 8601.Formato: YYYYMM-DDThh:mm:ssZ
2 message E C 1-150 Mensagem de erro
Ex.:
{
 "timestamp": "2018-10-11T15:45:18Z",
 "message": "TOKEN inválido ou sem autorização de acesso.",
}
8 ANEXOS
Anexo I – Títulos utilizados nas colunas de cabeçalho do leiaute
a) Coluna “Item”: identificador da linha e hierarquia dos campos.
b) Coluna “Campo”: identificador do nome do campo.
c) Coluna “Tipo”: identificador do tipo do campo.
a. G - indica que o campo é um grupo. Usado para agrupar campos de subgrupo
e elemento;
b. SG - indica que o campo é um subgrupo de um grupo;
c. L – indica que é uma lista;
d. E – indica que o campo é um elemento que conterá um valor.
d) Coluna “Ocorrência”: x-y, onde x indica a ocorrência mínima e y a ocorrência máxima.
e) Coluna “Valor”: identifica o valor que o campo do tipo elemento contém.
a. C – alfanumérico;
b. N – numérico;
c. D – data.
f) Coluna “Tamanho”: x-y, onde x indica o tamanho mínima e y a tamanho máximo.
Quando a “,” virgula estiver presente, indica a possibilidade de valores decimais.
Tamanhos separados por “/” indicam que o elemento deve ter um dos tamanhos fixos
da lista.
Anexo II – Código dos municípios do Estado de Alagoas de acordo com o IBGE.
Código IBGE Nome do Município
2700102 AGUA BRANCA
2700201 ANADIA
2700300 ARAPIRACA
2700409 ATALAIA
2700508 BARRA DE SANTO ANTONIO
2700607 BARRA DE SAO MIGUEL
2700706 BATALHA
2700805 BELEM
2700904 BELO MONTE
2701001 BOCA DA MATA
Página 12
2701100 BRANQUINHA
2701209 CACIMBINHAS
2701308 CAJUEIRO
2701357 CAMPESTRE
2701407 CAMPO ALEGRE
2701506 CAMPO GRANDE
2701605 CANAPI
2701704 CAPELA
2701803 CARNEIROS
2701902 CHA PRETA
2702009 COITE DO NOIA
2702108 COLONIA LEOPOLDINA
2702207 COQUEIRO SECO
2702306 CORURIPE
2702355 CRAIBAS
2702405 DELMIRO GOUVEIA
2702504 DOIS RIACHOS
2702553 ESTRELA DE ALAGOAS
2702603 FEIRA GRANDE
2702702 FELIZ DESERTO
2702801 FLEXEIRAS
2702900 GIRAU DO PONCIANO
2703007 IBATEGUARA
2703106 IGACI
2703205 IGREJA NOVA
2703304 INHAPI
2703403 JACARE DOS HOMENS
2703502 JACUIPE
2703601 JAPARATINGA
2703700 JARAMATAIA
2703759 JEQUIA DA PRAIA
2703809 JOAQUIM GOMES
2703908 JUNDIA
2704005 JUNQUEIRO
2704104 LAGOA DA CANOA
2704203 LIMOEIRO DE ANADIA
2704302 MACEIO
2704401 MAJOR ISIDORO
2704906 MAR VERMELHO
2704500 MARAGOGI
2704609 MARAVILHA
2704708 MARECHAL DEODORO
2704807 MARIBONDO
2705002 MATA GRANDE
2705101 MATRIZ DE CAMARAGIBE
2705200 MESSIAS
2705309 MINADOR DO NEGRAO
2705408 MONTEIROPOLIS
2705507 MURICI
2705606 NOVO LINO
2705705 OLHO D'AGUA DAS FLORES
2705804 OLHO D'AGUA DO CASADO
Página 13
2705903 OLHO D'AGUA GRANDE
2706000 OLIVENCA
2706109 OURO BRANCO
2706208 PALESTINA
2706307 PALMEIRA DOS INDIOS
2706406 PAO DE ACUCAR
2706422 PARICONHA
2706448 PARIPUEIRA
2706505 PASSO DE CAMARAGIBE
2706604 PAULO JACINTO
2706703 PENEDO
2706802 PIACABUCU
2706901 PILAR
2707008 PINDOBA
2707107 PIRANHAS
2707206 POCO DAS TRINCHEIRAS
2707305 PORTO CALVO
2707404 PORTO DE PEDRAS
2707503 PORTO REAL DO COLEGIO
2707602 QUEBRANGULO
2707701 RIO LARGO
2707800 ROTEIRO
2707909 SANTA LUZIA DO NORTE
2708006 SANTANA DO IPANEMA
2708105 SANTANA DO MUNDAU
2708204 SAO BRAS
2708303 SAO JOSE DA LAJE
2708402 SAO JOSE DA TAPERA
2708501 SAO LUIS DO QUITUNDE
2708600 SAO MIGUEL DOS CAMPOS
2708709 SAO MIGUEL DOS MILAGRES
2708808 SAO SEBASTIAO
2708907 SATUBA
2708956 SENADOR RUI PALMEIRA
2709004 TANQUE D'ARCA
2709103 TAQUARANA
2709152 TEOTONIO VILELA
2709202 TRAIPU
2709301 UNIAO DOS PALMARES
2709400 VICOSA
Anexo III – Segmentos do GPC (Classificação Global de produtos)
Código Descrição
74000000 Acampamento
64000000 Acessórios Pessoais
50000000 Alimentos / Bebidas / Tabaco
89000000 Animais Vivos
78000000 Aparelhos Elétricos
70000000 Artes/Artesanato/Bordado
62000000 Artigos de Papelaria/ Equipamentos para Escritório/ Suprimentos de Ocasião
Página 14
68000000 Audiovisual / Fotografia
86000000 Brinquedos/Jogos
63000000 Calçados
87000000 Combustíveis/Gases
66000000 Comunicação
94000000 Crops
10000000 Cuidados com os animais de estimação/Ração
79000000 Encanamento/Aquecimento/Ventilação/Condicionamento de Ar
71000000 Equipamentos Esportivos
84000000 Equipamentos para Oficina/Armazenagem de Ferramentas
82000000 Ferramentas/Equipamentos-Elétricos
80000000 Ferramentas/Equipamentos-Manuais
53000000 Higiene/Cuidados Pessoais/ Beleza
65000000 Informática/Computação
88000000 Lubrificantes
60000000 Materiais de Referência/Impressos/Textuais
81000000 Materiais para Jardinagem/Gramado
75000000 Móveis e Artigos Mobiliários para Casa e Escritório
61000000 Música
93000000 Plantas de Horticultura
47000000 Produtos de Higiene/Limpeza
83000000 Produtos para Construção
92000000 Recipientes de Armazenagem/Transporte
58000000 Segmento Transversal
85000000 Segurança/Proteção – DIY
91000000 Segurança/Vigilância
77000000 Setor Automotivo
51000000 Setor da Saúde
73000000 Utensílios de Cozinha
72000000 Utensílios Domésticos
67000000 Vestuário