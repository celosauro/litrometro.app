import { GasPump, Database, Target, Users, Heart } from '@phosphor-icons/react';

export default function SobrePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1">
      <article className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
        <header className="text-center mb-8 sm:mb-12">
          <GasPump size={64} weight="fill" className="text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Sobre o Litrômetro
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sua ferramenta gratuita para encontrar os melhores preços de combustíveis em Alagoas.
          </p>
        </header>

        <div className="space-y-8 sm:space-y-12">
          {/* Missão */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Target size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Nossa Missão</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              O Litrômetro foi criado para ajudar os consumidores alagoanos a economizar no 
              abastecimento de seus veículos. Acreditamos que a transparência nos preços é 
              fundamental para uma economia mais justa, permitindo que você compare valores 
              e escolha onde abastecer com base em informações reais e atualizadas.
            </p>
          </section>

          {/* Fonte dos dados */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Fonte dos Dados</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Todos os preços exibidos no Litrômetro são obtidos diretamente do sistema{' '}
              <a 
                href="https://economizaalagoas.sefaz.al.gov.br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                Economiza Alagoas
              </a>, 
              uma iniciativa da Secretaria de Estado da Fazenda de Alagoas (SEFAZ/AL).
            </p>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Os preços são baseados em vendas reais registradas 
                através de notas fiscais eletrônicas (NFC-e). Isso significa que os valores 
                refletem transações efetivas, mas podem não corresponder ao preço atual praticado 
                pelo estabelecimento, que pode ter sido atualizado após a última venda registrada.
              </p>
            </div>
          </section>

          {/* Como funciona */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Users size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Como Funciona</h2>
            </div>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Coletamos dados de preços de combustíveis de todos os 102 municípios de Alagoas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Atualizamos as informações várias vezes ao dia para garantir dados recentes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Você pode filtrar por tipo de combustível, município e ordenar por preço ou proximidade.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Com sua localização, mostramos os postos mais próximos de você no mapa.</span>
              </li>
            </ul>
          </section>

          {/* Tipos de combustível */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Combustíveis Monitorados
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { nome: 'Gasolina Comum', cor: 'bg-amber-100 text-amber-800' },
                { nome: 'Gasolina Aditivada', cor: 'bg-orange-100 text-orange-800' },
                { nome: 'Etanol', cor: 'bg-green-100 text-green-800' },
                { nome: 'Diesel S10', cor: 'bg-yellow-100 text-yellow-800' },
                { nome: 'Diesel S500', cor: 'bg-lime-100 text-lime-800' },
                { nome: 'GNV', cor: 'bg-blue-100 text-blue-800' },
              ].map((combustivel) => (
                <div 
                  key={combustivel.nome}
                  className={`${combustivel.cor} rounded-lg px-3 py-2 text-sm font-medium text-center`}
                >
                  {combustivel.nome}
                </div>
              ))}
            </div>
          </section>

          {/* Agradecimento */}
          <section className="text-center pt-8 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <span>Feito com</span>
              <Heart size={20} weight="fill" className="text-red-500" />
              <span>para os alagoanos</span>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
