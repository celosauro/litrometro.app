import { useState, useMemo, useEffect, useRef } from 'react';
import { GasPump, MagnifyingGlass, Crosshair, List, X } from '@phosphor-icons/react';
import { usePrecosCombustiveis } from '../hooks/usePrecosCombustiveis';
import { useGeolocalizacao } from '../hooks/useGeolocalizacao';
import { CardCombustivel } from '../components/FuelCard';
import { SeletorTipoCombustivel } from '../components/FuelTypeSelector';
import { SeletorMunicipio } from '../components/MunicipioSelector';
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
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarStatusLocalizacao, setMostrarStatusLocalizacao] = useState(true);
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<DadosComDistancia | null>(null);
  const [mostrarListaMobile, setMostrarListaMobile] = useState(false);
  
  // Cache dos centróides dos municípios
  const centroidesMunicipiosRef = useRef<Array<{codigo_ibge: string; municipio: string; latitude: number; longitude: number}> | null>(null);

  const { dados, carregando, erro } = usePrecosCombustiveis({
    tipoCombustivel: tipoCombustivelSelecionado,
    codigoIBGE: municipioSelecionado || undefined,
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

  // Filtra e ordena os dados (base)
  const dadosFiltradosBase = useMemo(() => {
    if (!dadosComDistancia) return [];
    
    return dadosComDistancia
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
  }, [dadosComDistancia, termoBusca]);

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
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 relative">
            {/* Sidebar - Lista de postos */}
            <aside className={`lg:w-[400px] xl:w-[450px] border-r border-gray-200 bg-white flex flex-col overflow-hidden ${mostrarListaMobile ? 'absolute inset-0 z-30 flex' : 'hidden lg:flex'}`}>
              {/* Header da lista */}
              <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200 bg-white flex-shrink-0 flex items-center justify-between">
                <div>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">
                    {dadosFiltrados.length} posto{dadosFiltrados.length !== 1 ? 's' : ''} encontrado{dadosFiltrados.length !== 1 ? 's' : ''}
                  </p>
                  {estabelecimentoSelecionado && (
                    <p className="text-xs text-blue-600 mt-1">
                      Clique no mapa ou em outro posto para mudar a seleção
                    </p>
                  )}
                </div>
                {/* Botão fechar lista mobile */}
                <button
                  onClick={() => setMostrarListaMobile(false)}
                  className="lg:hidden p-2 rounded-full hover:bg-gray-100"
                  aria-label="Fechar lista"
                >
                  <X size={20} className="text-gray-600" />
                </button>
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
                      isMelhor={item.cnpj === cnpjMelhorPosto}
                      onClick={() => handleSelecionarEstabelecimento(item)}
                    />
                  ))
                )}
              </div>
            </aside>

            {/* Mapa */}
            <div className="flex-1 min-h-0 relative">
              <MapaEstabelecimentos
                dados={dadosFiltrados}
                localizacao={localizacao}
                tipoCombustivel={tipoCombustivelSelecionado}
                estabelecimentoSelecionado={estabelecimentoSelecionado}
                onSelecionarEstabelecimento={handleSelecionarEstabelecimento}
                municipioSelecionado={municipioSelecionado}
                cnpjMelhor={cnpjMelhorPosto}
                className="absolute inset-0"
              />
              
              {/* Botão flutuante para mostrar lista no mobile */}
              <button
                onClick={() => setMostrarListaMobile(true)}
                className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-blue-700 active:bg-blue-800 transition-colors z-20"
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
