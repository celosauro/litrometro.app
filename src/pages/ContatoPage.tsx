import { Envelope, MapPin, Clock } from '@phosphor-icons/react';

export default function ContatoPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1">
      <article className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
        <header className="text-center mb-8 sm:mb-12">
          <Envelope size={64} weight="fill" className="text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Contato
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tem dúvidas, sugestões ou encontrou algum problema? Entre em contato conosco!
          </p>
        </header>

        <div className="max-w-xl mx-auto space-y-8">
          {/* E-mail */}
          <section className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Envelope size={32} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">E-mail</h2>
            <a 
              href="mailto:contato@litrometro.app"
              className="text-lg text-blue-600 hover:underline font-medium"
            >
              contato@litrometro.app
            </a>
            <p className="text-sm text-gray-500 mt-2">
              Responderemos o mais breve possível.
            </p>
          </section>

          {/* Tempo de resposta */}
          <section className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock size={24} className="text-gray-600" />
              <h3 className="font-semibold text-gray-900">Tempo de Resposta</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Procuramos responder todas as mensagens em até 48 horas úteis. 
              Para questões urgentes, por favor indique no assunto do e-mail.
            </p>
          </section>

          {/* O que podemos ajudar */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Como podemos ajudar?
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-gray-600">
                  <strong>Reportar erros:</strong> Encontrou um preço incorreto ou um posto com informações desatualizadas?
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-gray-600">
                  <strong>Sugestões:</strong> Tem ideias de novas funcionalidades ou melhorias para o site?
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-gray-600">
                  <strong>Parcerias:</strong> Interessado em parcerias comerciais ou institucionais?
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-gray-600">
                  <strong>Imprensa:</strong> Solicitações de entrevistas ou informações para matérias jornalísticas.
                </span>
              </li>
            </ul>
          </section>

          {/* Aviso sobre preços */}
          <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">Sobre os Preços</h3>
                <p className="text-sm text-yellow-700">
                  Os preços exibidos são obtidos da SEFAZ/AL e baseados em vendas reais. 
                  Se você encontrou uma divergência significativa, pode ser que o posto 
                  tenha alterado o preço após a última venda registrada. De qualquer forma, 
                  agradecemos seu feedback!
                </p>
              </div>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
