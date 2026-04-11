import { useState, useMemo, useEffect } from 'react';
import { GasPump, MagnifyingGlass, ArrowsClockwise, Crosshair, List, MapTrifold } from '@phosphor-icons/react';
import { usePrecosCombustiveis } from '../hooks/usePrecosCombustiveis';
import { useGeolocalizacao } from '../hooks/useGeolocalizacao';
import { CardCombustivel } from '../components/FuelCard';
import { SeletorTipoCombustivel } from '../components/FuelTypeSelector';
import { SeletorMunicipio } from '../components/MunicipioSelector';
import { SeletorOrdenacao, type OpcaoOrdenacao } from '../components/SortSelector';
import { MapaEstabelecimentos } from '../components/MapaEstabelecimentos';
import { calcularDistanciaKm } from '../utils/distancia';
import type { TipoCombustivel, PrecoCombustivelResumo } from '../types';

type VisualizacaoAtual = 'lista' | 'mapa';

// Código IBGE de Maceió (padrão quando não há localização)
const CODIGO_MACEIO = '2704302';

interface DadosComDistancia extends PrecoCombustivelResumo {
  distancia?: number;
}

export default function HomePage() {
  const [tipoCombustivelSelecionado, setTipoCombustivelSelecionado] = useState<TipoCombustivel>(1);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>(CODIGO_MACEIO);
  const [ordenarPor, setOrdenarPor] = useState<OpcaoOrdenacao>('preco_asc');
  const [termoBusca, setTermoBusca] = useState('');
  const [visualizacao, setVisualizacao] = useState<VisualizacaoAtual>('lista');
  const [mostrarStatusLocalizacao, setMostrarStatusLocalizacao] = useState(true);

  const { dados, carregando, erro, recarregar } = usePrecosCombustiveis({
    tipoCombustivel: tipoCombustivelSelecionado,
    codigoIBGE: municipioSelecionado || undefined,
  });

  const { 
    localizacao, 
    carregando: carregandoLocalizacao, 
    erro: erroLocalizacao,
    obterLocalizacao 
  } = useGeolocalizacao();

  // Ordena por distância automaticamente quando localização for obtida
  useEffect(() => {
    if (localizacao) {
      setOrdenarPor('distancia');
    }
  }, [localizacao]);

  // Oculta tooltips de status após 3 segundos
  useEffect(() => {
    if (localizacao || erroLocalizacao) {
      setMostrarStatusLocalizacao(true);
      const timer = setTimeout(() => {
        setMostrarStatusLocalizacao(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [localizacao, erroLocalizacao]);

  // Atualiza município baseado na localização do usuário
  useEffect(() => {
    if (localizacao && dados && dados.length > 0) {
      // Encontra o estabelecimento mais próximo para determinar o município
      let menorDistancia = Infinity;
      let municipioMaisProximo = CODIGO_MACEIO;

      for (const item of dados) {
        if (item.latitude !== 0 && item.longitude !== 0) {
          const dist = calcularDistanciaKm(
            localizacao.latitude,
            localizacao.longitude,
            item.latitude,
            item.longitude
          );
          if (dist < menorDistancia) {
            menorDistancia = dist;
            municipioMaisProximo = item.codigo_ibge;
          }
        }
      }

      setMunicipioSelecionado(municipioMaisProximo);
    }
  }, [localizacao, dados]);

  // Calcula distância para cada estabelecimento
  const dadosComDistancia: DadosComDistancia[] | undefined = useMemo(() => {
    if (!dados) return undefined;
    
    return dados.map(item => {
      let distancia: number | undefined;
      
      if (localizacao && item.latitude !== 0 && item.longitude !== 0) {
        distancia = calcularDistanciaKm(
          localizacao.latitude,
          localizacao.longitude,
          item.latitude,
          item.longitude
        );
      }
      
      return { ...item, distancia };
    });
  }, [dados, localizacao]);

  // Filtra e ordena os dados
  const dadosFiltrados = dadosComDistancia
    ?.filter((item) => {
      if (!termoBusca) return true;
      const busca = termoBusca.toLowerCase();
      return (
        item.nome_fantasia.toLowerCase().includes(busca) ||
        item.razao_social.toLowerCase().includes(busca) ||
        item.bairro.toLowerCase().includes(busca)
      );
    })
    .sort((a, b) => {
      switch (ordenarPor) {
        case 'preco_asc':
          return a.valor_recente - b.valor_recente;
        case 'preco_desc':
          return b.valor_recente - a.valor_recente;
        case 'data':
          return new Date(b.data_recente).getTime() - new Date(a.data_recente).getTime();
        case 'distancia':
          // Estabelecimentos sem distância ficam no final
          const distA = a.distancia ?? Infinity;
          const distB = b.distancia ?? Infinity;
          return distA - distB;
        default:
          return 0;
      }
    });

  return (
    <div className="flex flex-col flex-1 w-full">
      {/* Filtros */}
      <div className="sticky top-[56px] sm:top-[72px] bg-white/90 backdrop-blur-md shadow-sm z-40">
        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
          {/* Seletor de combustível */}
          <SeletorTipoCombustivel
            selecionado={tipoCombustivelSelecionado}
            aoMudar={setTipoCombustivelSelecionado}
          />

          {/* Filtros adicionais */}
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
            {/* Busca - full width em mobile */}
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 sm:w-5 sm:h-5"
              />
              <input
                type="text"
                placeholder="Buscar posto, bairro..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Linha com selects e botão */}
            <div className="flex gap-2 sm:gap-3">
              {/* Município */}
              <div className="flex-1 sm:flex-none">
                <SeletorMunicipio
                  selecionado={municipioSelecionado}
                  aoMudar={setMunicipioSelecionado}
                />
              </div>

              {/* Ordenação */}
              <div className="flex-1 sm:flex-none">
                <SeletorOrdenacao 
                  selecionado={ordenarPor} 
                  aoMudar={setOrdenarPor}
                  localizacaoDisponivel={!!localizacao}
                />
              </div>

              {/* Botão localização */}
              <button
                onClick={obterLocalizacao}
                disabled={carregandoLocalizacao}
                className={`btn-secondary flex items-center justify-center gap-2 px-3 sm:px-4 ${
                  localizacao ? 'bg-green-100 text-green-700 border-green-300' : ''
                }`}
                aria-label="Obter localização"
                title={localizacao ? 'Localização obtida' : 'Obter minha localização'}
              >
                <Crosshair
                  size={18}
                  className={`sm:w-5 sm:h-5 ${carregandoLocalizacao ? 'animate-pulse' : ''}`}
                />
              </button>

              {/* Botão atualizar */}
              <button
                onClick={() => recarregar()}
                disabled={carregando}
                className="btn-secondary flex items-center justify-center gap-2 px-3 sm:px-4"
                aria-label="Atualizar dados"
              >
                <ArrowsClockwise
                  size={18}
                  className={`sm:w-5 sm:h-5 ${carregando ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Atualizar</span>
              </button>

              {/* Toggle Lista/Mapa */}
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                <button
                  onClick={() => setVisualizacao('lista')}
                  className={`flex items-center justify-center px-3 py-2 transition-colors ${
                    visualizacao === 'lista'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Ver lista"
                  title="Ver lista"
                >
                  <List size={18} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setVisualizacao('mapa')}
                  className={`flex items-center justify-center px-3 py-2 transition-colors ${
                    visualizacao === 'mapa'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Ver no mapa"
                  title="Ver no mapa"
                >
                  <MapTrifold size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <main className="w-full max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 flex-1">
        {/* Estado de erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-red-700 text-sm sm:text-base">{erro}</p>
          </div>
        )}

        {/* Erro de localização */}
        {erroLocalizacao && mostrarStatusLocalizacao && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-yellow-700 text-sm sm:text-base">📍 {erroLocalizacao}</p>
          </div>
        )}

        {/* Indicador de localização obtida */}
        {localizacao && mostrarStatusLocalizacao && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6 flex items-center gap-2 text-sm text-green-700">
            <Crosshair size={16} />
            <span>Localização obtida - ordenando por proximidade disponível</span>
          </div>
        )}

        {/* Estado de loading - apenas carregamento inicial (sem dados) */}
        {(carregando || carregandoLocalizacao) && !dadosFiltrados && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-600 border-t-transparent" />
            {carregandoLocalizacao && (
              <p className="mt-4 text-sm text-gray-500">Obtendo sua localização...</p>
            )}
          </div>
        )}

        {/* Lista de postos */}
        {dadosFiltrados && visualizacao === 'lista' && (
          <>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-sm sm:text-base text-gray-600">
                {dadosFiltrados.length} posto{dadosFiltrados.length !== 1 ? 's' : ''} encontrado{dadosFiltrados.length !== 1 ? 's' : ''}
              </p>
            </div>

            {dadosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <GasPump size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhum posto encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Tente ajustar os filtros ou selecionar outro município
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {dadosFiltrados.map((item) => (
                  <CardCombustivel 
                    key={`${item.cnpj}-${item.tipo_combustivel}`} 
                    dados={item}
                    distancia={item.distancia}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Visualização em mapa */}
        {dadosFiltrados && visualizacao === 'mapa' && (
          <MapaEstabelecimentos
            dados={dadosFiltrados}
            localizacao={localizacao}
            tipoCombustivel={tipoCombustivelSelecionado}
          />
        )}
      </main>
    </div>
  );
}
