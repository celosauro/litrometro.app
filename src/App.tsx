import { useState, useMemo, useEffect } from 'react';
import { GasPump, MagnifyingGlass, ArrowsClockwise, Crosshair } from '@phosphor-icons/react';
import { usePrecosCombustiveis } from './hooks/usePrecosCombustiveis';
import { useGeolocalizacao } from './hooks/useGeolocalizacao';
import { CardCombustivel } from './components/FuelCard';
import { SeletorTipoCombustivel } from './components/FuelTypeSelector';
import { SeletorMunicipio } from './components/MunicipioSelector';
import { SeletorOrdenacao, type OpcaoOrdenacao } from './components/SortSelector';
import { calcularDistanciaKm } from './utils/distancia';
import type { TipoCombustivel, PrecoCombustivelResumo } from './types';

interface DadosComDistancia extends PrecoCombustivelResumo {
  distancia?: number;
}

export default function App() {
  const [tipoCombustivelSelecionado, setTipoCombustivelSelecionado] = useState<TipoCombustivel>(1);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>('');
  const [ordenarPor, setOrdenarPor] = useState<OpcaoOrdenacao>('preco_asc');
  const [termoBusca, setTermoBusca] = useState('');

  const { dados, carregando, erro, recarregar, ultimaAtualizacao } = usePrecosCombustiveis({
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <GasPump size={28} weight="fill" className="text-blue-600 sm:w-8 sm:h-8" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Litrômetro</h1>
                <p className="text-xs sm:text-sm text-gray-500">Preços de combustíveis em Alagoas</p>
              </div>
            </div>
            
            {ultimaAtualizacao && (
              <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Atualizado: {new Date(ultimaAtualizacao).toLocaleString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}
          </div>
        </div>
      </header>

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
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Estado de erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-red-700 text-sm sm:text-base">{erro}</p>
          </div>
        )}

        {/* Erro de localização */}
        {erroLocalizacao && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-yellow-700 text-sm sm:text-base">📍 {erroLocalizacao}</p>
          </div>
        )}

        {/* Indicador de localização obtida */}
        {localizacao && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6 flex items-center gap-2 text-sm text-green-700">
            <Crosshair size={16} />
            <span>Localização obtida - ordenando por proximidade disponível</span>
          </div>
        )}

        {/* Estado de loading - dados ou localização */}
        {(carregando || carregandoLocalizacao) && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-600 border-t-transparent" />
            {carregandoLocalizacao && (
              <p className="mt-4 text-sm text-gray-500">Obtendo sua localização...</p>
            )}
          </div>
        )}

        {/* Lista de postos */}
        {!carregando && !carregandoLocalizacao && dadosFiltrados && (
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
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 text-center text-xs sm:text-sm text-gray-500">
          <p>
            Dados fornecidos pela{' '}
            <a
              href="https://economizaalagoas.sefaz.al.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              SEFAZ/AL - Economiza Alagoas
            </a>
          </p>
          <p className="mt-1">
            Os preços são baseados em vendas reais e podem não refletir o valor atual no estabelecimento.
          </p>
        </div>
      </footer>
    </div>
  );
}
