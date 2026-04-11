import { Shield, Cookie, MapPin, ChartLine, Eye, Trash, UserCircle } from '@phosphor-icons/react';

export default function PrivacidadePage() {
  const dataAtualizacao = '10 de abril de 2026';

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1">
      <article className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
        <header className="text-center mb-8 sm:mb-12">
          <Shield size={64} weight="fill" className="text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Política de Privacidade
          </h1>
          <p className="text-sm text-gray-500">
            Última atualização: {dataAtualizacao}
          </p>
        </header>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* Introdução */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              O Litrômetro ("nós", "nosso" ou "site") está comprometido em proteger sua privacidade. 
              Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos 
              suas informações quando você utiliza nosso site litrometro.app.
            </p>
          </section>

          {/* Dados coletados */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 m-0">
                Dados que Coletamos
              </h2>
            </div>
            
            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">
              Dados fornecidos voluntariamente:
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Endereço de e-mail, quando você entra em contato conosco</li>
              <li>Mensagens e feedback enviados através do formulário de contato</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">
              Dados coletados automaticamente:
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Endereço IP (anonimizado)</li>
              <li>Tipo de navegador e dispositivo</li>
              <li>Páginas visitadas e tempo de permanência</li>
              <li>Origem do tráfego (como você chegou ao site)</li>
            </ul>
          </section>

          {/* Geolocalização */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <MapPin size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 m-0">
                Geolocalização
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Quando você autoriza, utilizamos a localização do seu dispositivo para:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Mostrar postos de combustível próximos a você</li>
              <li>Calcular a distância até cada estabelecimento</li>
              <li>Ordenar os resultados por proximidade</li>
            </ul>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-green-800">
                <strong>Importante:</strong> Sua localização é processada apenas no seu navegador 
                e <strong>não é enviada para nossos servidores</strong>. Você pode negar ou 
                revogar essa permissão a qualquer momento nas configurações do seu navegador.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Cookie size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 m-0">
                Cookies e Tecnologias Similares
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Utilizamos cookies e tecnologias similares para:
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">Cookies Essenciais:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Lembrar suas preferências de consentimento</li>
              <li>Manter o funcionamento adequado do site</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">Cookies de Análise (Google Analytics):</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Entender como os visitantes usam o site</li>
              <li>Identificar páginas mais populares</li>
              <li>Melhorar a experiência do usuário</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">Cookies de Publicidade (Google AdSense):</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Exibir anúncios relevantes aos seus interesses</li>
              <li>Medir a eficácia das campanhas publicitárias</li>
              <li>Limitar o número de vezes que você vê um anúncio</li>
            </ul>

            <p className="text-gray-600 text-sm mt-4">
              Você pode gerenciar suas preferências de cookies através do banner exibido na 
              primeira visita ou limpando os dados do navegador.
            </p>
          </section>

          {/* Google Analytics e AdSense */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ChartLine size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 m-0">
                Google Analytics e AdSense
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Utilizamos serviços do Google para análise de tráfego e publicidade:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>
                <strong>Google Analytics:</strong> Para entender o comportamento dos usuários 
                e melhorar o site. Os dados são anonimizados e agregados.
              </li>
              <li>
                <strong>Google AdSense:</strong> Para exibir anúncios que ajudam a manter 
                o site gratuito. O Google pode usar cookies para personalizar anúncios.
              </li>
            </ul>
            <p className="text-gray-600 text-sm mt-4">
              Para mais informações sobre como o Google usa seus dados, visite:{' '}
              <a 
                href="https://policies.google.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Política de Privacidade do Google
              </a>
            </p>
          </section>

          {/* Seus direitos */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCircle size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 m-0">
                Seus Direitos (LGPD)
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Confirmar se tratamos seus dados pessoais</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Solicitar a portabilidade dos dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
            <p className="text-gray-600 text-sm mt-4">
              Para exercer seus direitos, entre em contato pelo e-mail:{' '}
              <a href="mailto:contato@litrometro.app" className="text-blue-600 hover:underline">
                contato@litrometro.app
              </a>
            </p>
          </section>

          {/* Retenção de dados */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Trash size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 m-0">
                Retenção de Dados
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as 
              finalidades descritas nesta política. Dados de análise são mantidos de forma 
              agregada e anonimizada por até 26 meses. Mensagens de contato são mantidas 
              pelo tempo necessário para resolução e podem ser excluídas mediante solicitação.
            </p>
          </section>

          {/* Segurança */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Segurança dos Dados
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Implementamos medidas técnicas e organizacionais apropriadas para proteger 
              seus dados contra acesso não autorizado, alteração, divulgação ou destruição. 
              O site utiliza conexão segura (HTTPS) para todas as comunicações.
            </p>
          </section>

          {/* Alterações */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Alterações nesta Política
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Alterações 
              significativas serão comunicadas através de aviso no site. Recomendamos que 
              você revise esta página regularmente.
            </p>
          </section>

          {/* Contato */}
          <section className="bg-gray-50 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Dúvidas?</h2>
            <p className="text-gray-600">
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como 
              tratamos seus dados, entre em contato conosco:{' '}
              <a href="mailto:contato@litrometro.app" className="text-blue-600 hover:underline font-medium">
                contato@litrometro.app
              </a>
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
