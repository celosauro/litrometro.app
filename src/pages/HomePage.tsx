import { useState, useMemo, useEffect } from 'react';
import { GasPump, MagnifyingGlass, ArrowsClockwise, Crosshair } from '@phosphor-icons/react';
import { usePrecosCombustiveis } from '../hooks/usePrecosCombustiveis';
import { useGeolocalizacao } from '../hooks/useGeolocalizacao';
import { CardCombustivel } from '../components/FuelCard';
import { SeletorTipoCombustivel } from '../components/FuelTypeSelector';
import { SeletorMunicipio } from '../components/MunicipioSelector';
import { SeletorOrdenacao, type OpcaoOrdenacao } from '../components/SortSelector';
import { MapaEstabelecimentos } from '../components/MapaEstabelecimentos';
import { calcularDistanciaKm } from '../utils/distancia';
import type { TipoCombustivel, PrecoCombustivelResumo } from '../types';

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
  const [mostrarStatusLocalizacao, setMostrarStatusLocalizacao] = useState(true);
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<DadosComDistancia | null>(null);

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

  // Limpa seleção quando filtros mudam
  useEffect(() => {
    setEstabelecimentoSelecionado(null);
  }, [tipoCombustivelSelecionado, municipioSelecionado, ordenarPor, termoBusca]);

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
          const distA = a.distancia ?? Infinity;
          const distB = b.distancia ?? Infinity;
          return distA - distB;
        default:
          return 0;
      }
    });

  const handleSelecionarEstabelecimento = (item: DadosComDistancia) => {
    setEstabelecimentoSelecionado(prev => 
      prev?.cnpj === item.cnpj ? null : item
    );
  };

  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      {/* Filtros */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md shadow-sm z-40 flex-shrink-0">
        <div className="max-w-full mx-auto px-3 py-3 sm:px-4 sm:py-4">
          {/* Seletor de combustível */}
          <SeletorTipoCombustivel
            selecionado={tipoCombustivelSelecionado}
            aoMudar={setTipoCombustivelSelecionado}
          />

          {/* Filtros adicionais */}
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
            {/* Busca */}
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

            {/* Linha com selects e botões */}
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              {/* Município */}
              <div className="flex-1 sm:flex-none min-w-[120px]">
                <SeletorMunicipio
                  selecionado={municipioSelecionado}
                  aoMudar={setMunicipioSelecionado}
                />
              </div>

              {/* Ordenação */}
              <div className="flex-1 sm:flex-none min-w-[140px]">
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
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal - Split View */}
      <main className="flex-1 flex flex-col lg:flex-row w-full overflow-hidden min-h-0">
        {/* Alertas */}
        {(erro || (erroLocalizacao && mostrarStatusLocalizacao) || (localizacao && mostrarStatusLocalizacao)) && (
          <div className="px-3 py-2 sm:px-4 space-y-2 lg:hidden">
            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{erro}</p>
              </div>
            )}
            {erroLocalizacao && mostrarStatusLocalizacao && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-700 text-sm">📍 {erroLocalizacao}</p>
              </div>
            )}
            {localizacao && mostrarStatusLocalizacao && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2 text-sm text-green-700">
                <Crosshair size={16} />
                <span>Localização obtida</span>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {(carregando || carregandoLocalizacao) && !dadosFiltrados && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-600 border-t-transparent" />
            {carregandoLocalizacao && (
              <p className="mt-4 text-sm text-gray-500">Obtendo sua localização...</p>
            )}
          </div>
        )}

        {/* Split View: Lista + Mapa */}
        {dadosFiltrados && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
            {/* Sidebar - Lista de postos */}
            <aside className="flex-shrink-0 lg:w-[400px] xl:w-[450px] border-r border-gray-200 bg-white/50 flex flex-col overflow-hidden max-h-[40vh] lg:max-h-none">
              {/* Header da lista */}
              <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200 bg-white flex-shrink-0">
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  {dadosFiltrados.length} posto{dadosFiltrados.length !== 1 ? 's' : ''} encontrado{dadosFiltrados.length !== 1 ? 's' : ''}
                </p>
                {estabelecimentoSelecionado && (
                  <p className="text-xs text-blue-600 mt-1">
                    Clique no mapa ou em outro posto para mudar a seleção
                  </p>
                )}
              </div>

              {/* Lista scrollável */}
              <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 space-y-3">
                {dadosFiltrados.length === 0 ? (
                  <div className="text-center py-12">
                    <GasPump size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Nenhum posto encontrado</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Tente ajustar os filtros
                    </p>
                  </div>
                ) : (
                  dadosFiltrados.map((item) => (
                    <CardCombustivel 
                      key={`${item.cnpj}-${item.tipo_combustivel}`} 
                      dados={item}
                      distancia={item.distancia}
                      isSelected={estabelecimentoSelecionado?.cnpj === item.cnpj}
                      onClick={() => handleSelecionarEstabelecimento(item)}
                    />
                  ))
                )}
              </div>
            </aside>

            {/* Mapa */}
            <div className="flex-1 min-h-[300px] lg:min-h-0 relative">
              <MapaEstabelecimentos
                dados={dadosFiltrados}
                localizacao={localizacao}
                tipoCombustivel={tipoCombustivelSelecionado}
                estabelecimentoSelecionado={estabelecimentoSelecionado}
                onSelecionarEstabelecimento={handleSelecionarEstabelecimento}
                municipioSelecionado={municipioSelecionado}
                className="absolute inset-0"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
