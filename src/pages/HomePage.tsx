import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlass, X, List } from '@phosphor-icons/react';
import { usePrecosCombustiveis } from '../hooks/usePrecosCombustiveis';
import { useGeolocalizacao } from '../hooks/useGeolocalizacao';
import { LocationIcon } from '../components/LocationIcon';
import { CardCombustivel } from '../components/FuelCard';
import { SeletorTipoCombustivel } from '../components/FuelTypeSelector';
import { SeletorMunicipio } from '../components/MunicipioSelector';
import { MapaEstabelecimentos } from '../components/MapaEstabelecimentos';
import { SkeletonCardList } from '../components/SkeletonCard';
import { EmptyState, EmptyStateAction } from '../components/EmptyState';
import { calcularNivelPreco, calcularEconomia } from '../components/PriceBadge';
import { calcularDistanciaKm } from '../utils/distancia';
import { trackFuelTypeSelect, trackMunicipalitySelect, trackSearch} from '../utils/analytics';
import type { TipoCombustivel, PrecoCombustivelResumo } from '../types';
import { TIPOS_COMBUSTIVEL, MUNICIPIOS_AL } from '../types';

// Código IBGE de Maceió (padrão quando não há localização)
const CODIGO_MACEIO = '2704302';

interface DadosComDistancia extends PrecoCombustivelResumo {
  distancia?: number;
}

export default function HomePage() {
  const [tipoCombustivelSelecionado, setTipoCombustivelSelecionado] = useState<TipoCombustivel>(1);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>(CODIGO_MACEIO);
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarStatusLocalizacao, setMostrarStatusLocalizacao] = useState(true);
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<DadosComDistancia | null>(null);
  const [mostrarListaMobile, setMostrarListaMobile] = useState(false);
  // Dados visíveis no viewport do mapa (filtrados por bounds)
  const [dadosVisiveis, setDadosVisiveis] = useState<DadosComDistancia[]>([]);
  
  // Cache dos centróides dos municípios
  const centroidesMunicipiosRef = useRef<Array<{codigo_ibge: string; municipio: string; latitude: number; longitude: number}> | null>(null);

  // Carrega TODOS os dados (filtro por município agora é feito pelo mapa)
  const { dados, carregando, erro } = usePrecosCombustiveis({
    tipoCombustivel: tipoCombustivelSelecionado,
  });

  const { 
    localizacao, 
    carregando: carregandoLocalizacao, 
    erro: erroLocalizacao,
    obterLocalizacao 
  } = useGeolocalizacao();

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
    if (!localizacao) return;
    
    // Função assíncrona para buscar centróides e encontrar município mais próximo
    const atualizarMunicipio = async () => {
      try {
        // Carrega centróides se ainda não tiver
        if (!centroidesMunicipiosRef.current) {
          const resposta = await fetch('/dados/municipios-centro.json');
          if (resposta.ok) {
            centroidesMunicipiosRef.current = await resposta.json();
          }
        }
        
        const centroides = centroidesMunicipiosRef.current;
        if (!centroides || centroides.length === 0) return;
        
        let menorDistancia = Infinity;
        let municipioMaisProximo = CODIGO_MACEIO;
        
        for (const mun of centroides) {
          const dist = calcularDistanciaKm(
            localizacao.latitude,
            localizacao.longitude,
            mun.latitude,
            mun.longitude
          );
          if (dist < menorDistancia) {
            menorDistancia = dist;
            municipioMaisProximo = mun.codigo_ibge;
          }
        }
        
        setMunicipioSelecionado(municipioMaisProximo);
      } catch (error) {
        console.error('Erro ao buscar município mais próximo:', error);
      }
    };
    
    atualizarMunicipio();
  }, [localizacao]);

  // Limpa seleção quando filtros mudam
  useEffect(() => {
    setEstabelecimentoSelecionado(null);
  }, [tipoCombustivelSelecionado, municipioSelecionado, termoBusca]);

  // Calcula distância para cada estabelecimento (TODOS os dados)
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

  // Callback quando o mapa atualiza dados visíveis (filtrados por bounds)
  const handleDadosVisiveis = useCallback((visiveis: DadosComDistancia[]) => {
    setDadosVisiveis(visiveis);
  }, []);

  // Filtra e ordena os dados VISÍVEIS no mapa (para a lista)
  const dadosFiltradosBase = useMemo(() => {
    if (!dadosVisiveis.length) return [];
    
    return dadosVisiveis
      .filter((item) => {
        if (!termoBusca) return true;
        const busca = termoBusca.toLowerCase();
        return (
          item.nome_fantasia.toLowerCase().includes(busca) ||
          item.razao_social.toLowerCase().includes(busca) ||
          item.bairro.toLowerCase().includes(busca)
        );
      })
      .sort((a, b) => {
        // Ordena por menor preço, desempata por distância
        if (a.valor_recente !== b.valor_recente) {
          return a.valor_recente - b.valor_recente;
        }
        const distA = a.distancia ?? Infinity;
        const distB = b.distancia ?? Infinity;
        return distA - distB;
      });
  }, [dadosVisiveis, termoBusca]);

  // Identifica o melhor posto (prioriza postos até 5km, depois menor preço)
  const cnpjMelhorPosto = useMemo(() => {
    if (!dadosFiltradosBase || dadosFiltradosBase.length === 0) return null;
    
    // Verifica se temos localização disponível
    const comDistancia = dadosFiltradosBase.filter(item => item.distancia !== undefined);
    const temLocalizacao = comDistancia.length > 0;
    
    if (temLocalizacao) {
      // Limite de distância preferencial (5km)
      const DISTANCIA_MAXIMA_PREFERENCIAL = 5;
      
      // Postos dentro de 5km
      const postosProximos = comDistancia.filter(item => item.distancia! <= DISTANCIA_MAXIMA_PREFERENCIAL);
      
      if (postosProximos.length > 0) {
        // Se há postos dentro de 5km, pega o de menor preço entre eles
        const melhor = postosProximos.reduce((melhor, atual) => 
          atual.valor_recente < melhor.valor_recente ? atual : melhor
        );
        return melhor.cnpj;
      } else {
        // Se não há postos dentro de 5km, usa score combinado para todos
        const precos = comDistancia.map(i => i.valor_recente);
        const distancias = comDistancia.map(i => i.distancia!);
        
        const minPreco = Math.min(...precos);
        const maxPreco = Math.max(...precos);
        const rangePreco = maxPreco - minPreco || 1;
        
        const minDist = Math.min(...distancias);
        const maxDist = Math.max(...distancias);
        const rangeDist = maxDist - minDist || 1;
        
        let melhor = comDistancia[0];
        let melhorScore = Infinity;
        
        for (const item of comDistancia) {
          // Score normalizado com peso maior para distância
          const precoNorm = (item.valor_recente - minPreco) / rangePreco;
          const distNorm = (item.distancia! - minDist) / rangeDist;
          const score = precoNorm + (distNorm * 1.5); // Distância com peso 1.5x
          
          if (score < melhorScore) {
            melhorScore = score;
            melhor = item;
          }
        }
        
        return melhor.cnpj;
      }
    } else {
      // Sem localização: apenas menor preço
      const menorPreco = dadosFiltradosBase.reduce((melhor, atual) => 
        atual.valor_recente < melhor.valor_recente ? atual : melhor
      );
      return menorPreco.cnpj;
    }
  }, [dadosFiltradosBase]);

  // Lista final com o melhor posto sempre no topo
  const dadosFiltrados = useMemo(() => {
    if (!dadosFiltradosBase || dadosFiltradosBase.length === 0) return [];
    if (!cnpjMelhorPosto) return dadosFiltradosBase;
    
    // Encontra o melhor posto
    const indiceMelhor = dadosFiltradosBase.findIndex(item => item.cnpj === cnpjMelhorPosto);
    
    // Se o melhor já está no topo, retorna a lista original
    if (indiceMelhor <= 0) return dadosFiltradosBase;
    
    // Move o melhor para o topo
    const melhor = dadosFiltradosBase[indiceMelhor];
    const resto = dadosFiltradosBase.filter((_, i) => i !== indiceMelhor);
    
    return [melhor, ...resto];
  }, [dadosFiltradosBase, cnpjMelhorPosto]);

  // Array de preços para cálculo de faixas (nível de preço e economia)
  const todosPrecos = useMemo(() => {
    if (!dadosFiltrados) return [];
    return dadosFiltrados.map(item => item.valor_recente);
  }, [dadosFiltrados]);

  const handleSelecionarEstabelecimento = (item: DadosComDistancia) => {
    setEstabelecimentoSelecionado(prev => 
      prev?.cnpj === item.cnpj ? null : item
    );
  };

  // Handlers com tracking de analytics
  const handleTipoCombustivelChange = useCallback((tipo: TipoCombustivel) => {
    setTipoCombustivelSelecionado(tipo);
    trackFuelTypeSelect(TIPOS_COMBUSTIVEL[tipo], tipo);
  }, []);

  const handleMunicipioChange = useCallback((codigo: string) => {
    setMunicipioSelecionado(codigo);
    if (codigo) {
      const nome = MUNICIPIOS_AL[codigo] || codigo;
      trackMunicipalitySelect(nome, codigo);
    }
  }, []);

  // Tracking de busca com debounce
  useEffect(() => {
    if (!termoBusca || termoBusca.length < 3) return;
    const timer = setTimeout(() => {
      trackSearch(termoBusca, dadosFiltrados?.length || 0);
    }, 1000);
    return () => clearTimeout(timer);
  }, [termoBusca, dadosFiltrados?.length]);

  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      {/* Filtros */}
      <div className="sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm dark:shadow-gray-900/20 z-40 flex-shrink-0 border-b border-transparent dark:border-gray-700">
        <div className="max-w-full mx-auto px-3 py-3 sm:px-4 sm:py-4">
          {/* Seletor de combustível */}
          <SeletorTipoCombustivel
            selecionado={tipoCombustivelSelecionado}
            aoMudar={handleTipoCombustivelChange}
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
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Linha com selects e botões */}
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              {/* Município */}
              <div className="flex-1 sm:flex-none min-w-[120px]">
                <SeletorMunicipio
                  selecionado={municipioSelecionado}
                  aoMudar={handleMunicipioChange}
                />
              </div>

              {/* Botão localização */}
              <button
                onClick={obterLocalizacao}
                disabled={carregandoLocalizacao}
                className={`btn-secondary flex items-center justify-center gap-2 px-3 sm:px-4 ${
                  localizacao ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700' : ''
                }`}
                aria-label="Obter localização"
                title={localizacao ? 'Localização obtida' : 'Obter minha localização'}
              >
                <LocationIcon size={18} className={carregandoLocalizacao ? 'animate-pulse' : ''} />
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
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-700 dark:text-red-400 text-sm">{erro}</p>
              </div>
            )}
            {erroLocalizacao && mostrarStatusLocalizacao && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-yellow-700 dark:text-yellow-400 text-sm">📍 {erroLocalizacao}</p>
              </div>
            )}
            {localizacao && mostrarStatusLocalizacao && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-2 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <LocationIcon size={16} />
                <span>Localização obtida</span>
              </div>
            )}
          </div>
        )}

        {/* Loading state - Skeleton Cards */}
        {carregando && !dadosFiltrados?.length && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
            {/* Sidebar skeleton */}
            <aside className="lg:w-[400px] xl:w-[450px] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-hidden hidden lg:flex">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <SkeletonCardList count={4} />
              </div>
            </aside>
            {/* Map placeholder */}
            <div className="flex-1 min-h-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-600 dark:border-brand-400 border-t-transparent mx-auto" />
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Carregando mapa...</p>
              </div>
            </div>
          </div>
        )}

        {/* Split View: Lista + Mapa */}
        {dadosFiltrados && dadosFiltrados.length >= 0 && !carregando && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 relative">
            {/* Sidebar - Lista de postos */}
            <aside className={`lg:w-[400px] xl:w-[450px] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-hidden ${mostrarListaMobile ? 'absolute inset-0 z-30 flex' : 'hidden lg:flex'}`}>
              {/* Header da lista */}
              <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 flex items-center justify-between">
                <div>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">
                    {dadosFiltrados.length} posto{dadosFiltrados.length !== 1 ? 's' : ''} encontrado{dadosFiltrados.length !== 1 ? 's' : ''}
                  </p>
                  {estabelecimentoSelecionado && (
                    <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                      Clique no mapa ou em outro posto para mudar a seleção
                    </p>
                  )}
                </div>
                {/* Botão fechar lista mobile */}
                <button
                  onClick={() => setMostrarListaMobile(false)}
                  className="lg:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Fechar lista"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Lista scrollável */}
              <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 space-y-3">
                {dadosFiltrados.length === 0 ? (
                  <EmptyState 
                    variant={termoBusca ? 'no-results' : 'empty'}
                    action={
                      termoBusca ? (
                        <EmptyStateAction onClick={() => setTermoBusca('')}>
                          Limpar busca
                        </EmptyStateAction>
                      ) : municipioSelecionado !== '' ? (
                        <EmptyStateAction onClick={() => setMunicipioSelecionado('')}>
                          Ver todos os municípios
                        </EmptyStateAction>
                      ) : undefined
                    }
                  />
                ) : (
                  dadosFiltrados.map((item) => (
                    <CardCombustivel 
                      key={`${item.cnpj}-${item.tipo_combustivel}`} 
                      dados={item}
                      distancia={item.distancia}
                      isSelected={estabelecimentoSelecionado?.cnpj === item.cnpj}
                      isMelhor={item.cnpj === cnpjMelhorPosto}
                      priceLevel={calcularNivelPreco(item.valor_recente, todosPrecos)}
                      economia={calcularEconomia(item.valor_recente, todosPrecos)}
                      onClick={() => handleSelecionarEstabelecimento(item)}
                    />
                  ))
                )}
              </div>
            </aside>

            {/* Mapa */}
            <div className="flex-1 min-h-0 relative">
              <MapaEstabelecimentos
                dados={dadosComDistancia || []}
                localizacao={localizacao}
                tipoCombustivel={tipoCombustivelSelecionado}
                estabelecimentoSelecionado={estabelecimentoSelecionado}
                onSelecionarEstabelecimento={handleSelecionarEstabelecimento}
                municipioSelecionado={municipioSelecionado}
                cnpjMelhor={cnpjMelhorPosto}
                onDadosVisiveis={handleDadosVisiveis}
                className="absolute inset-0"
              />
              
              {/* Botão flutuante para mostrar lista no mobile */}
              <button
                onClick={() => setMostrarListaMobile(true)}
                className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-brand-700 active:bg-brand-800 transition-colors z-20"
              >
                <List size={20} weight="bold" />
                <span className="text-sm font-medium">Ver lista ({dadosFiltrados.length})</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
