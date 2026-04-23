import { Envelope, MapPin } from '@phosphor-icons/react';

const GOOGLE_FORMS_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdWE5d9524uLMi16LDqGw7PJVKMUf78MNS_b7oETonLk7lHtA/viewform?embedded=true';

export default function ContatoPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1">
      <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8">
        <header className="text-center mb-8 sm:mb-12">
          <Envelope size={64} weight="fill" className="text-brand-600 dark:text-brand-400 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contato
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tem dúvidas, sugestões ou encontrou algum problema? Preencha o formulário abaixo!
          </p>
        </header>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Formulário Google Forms */}
          <section>
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <iframe
                src={GOOGLE_FORMS_URL}
                title="Formulário de Contato"
                width="100%"
                height="700"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                className="block"
              >
                Carregando formulário...
              </iframe>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
              Formulário seguro fornecido pelo Google Forms
            </p>
          </section>

          {/* Alternativa por e-mail */}
          <section className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/50 rounded-full flex items-center justify-center">
                <Envelope size={24} className="text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Prefere enviar um e-mail diretamente?
              </p>
              <a
                href="mailto:contato@litrometro.app"
                className="text-brand-600 dark:text-brand-400 font-medium hover:underline text-sm"
              >
                contato@litrometro.app
              </a>
            </div>
          </section>

          {/* Aviso sobre preços */}
          <section className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin size={24} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Sobre os Preços</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
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
