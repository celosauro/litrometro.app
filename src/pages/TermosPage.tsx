import { FileText, Warning, Scales, Copyright, Handshake, Gavel } from '@phosphor-icons/react';

export default function TermosPage() {
  const dataAtualizacao = '10 de abril de 2026';

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1">
      <article className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
        <header className="text-center mb-8 sm:mb-12">
          <FileText size={64} weight="fill" className="text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Termos de Uso
          </h1>
          <p className="text-sm text-gray-500">
            Última atualização: {dataAtualizacao}
          </p>
        </header>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* Introdução */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              Bem-vindo ao Litrômetro! Ao acessar e usar nosso site (litrometro.app), você 
              concorda com estes Termos de Uso. Por favor, leia-os atentamente antes de 
              utilizar nossos serviços.
            </p>
          </section>

          {/* Aceitação */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Handshake size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 m-0">
                Aceitação dos Termos
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Ao acessar ou usar o Litrômetro, você declara que leu, compreendeu e concorda 
              em ficar vinculado a estes Termos de Uso e à nossa Política de Privacidade. 
              Se você não concordar com qualquer parte destes termos, não utilize o site.
            </p>
          </section>

          {/* Descrição do serviço */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Descrição do Serviço
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              O Litrômetro é uma plataforma gratuita que agrega e exibe informações sobre 
              preços de combustíveis praticados em postos de abastecimento no estado de Alagoas. 
              As informações são obtidas do sistema Economiza Alagoas da SEFAZ/AL.
            </p>
            <p className="text-gray-600 leading-relaxed">
              O serviço inclui:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
              <li>Consulta de preços de diferentes tipos de combustíveis</li>
              <li>Filtros por município e tipo de combustível</li>
              <li>Ordenação por preço, distância ou data de atualização</li>
              <li>Visualização em lista ou mapa</li>
              <li>Localização de postos próximos (com permissão do usuário)</li>
            </ul>
          </section>

          {/* Isenção de responsabilidade */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Warning size={28} className="text-amber-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 m-0">
                Isenção de Responsabilidade
              </h2>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 font-medium mb-2">Importante:</p>
              <p className="text-amber-700 text-sm">
                Os preços exibidos no Litrômetro são baseados em dados públicos fornecidos 
                pela SEFAZ/AL, obtidos a partir de vendas reais registradas em notas fiscais 
                eletrônicas (NFC-e).
              </p>
            </div>

            <p className="text-gray-600 leading-relaxed mb-4">
              O Litrômetro <strong>não garante</strong>:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>
                <strong>Precisão dos preços atuais:</strong> Os preços podem ter sido 
                alterados pelo estabelecimento após a última venda registrada no sistema 
                da SEFAZ/AL.
              </li>
              <li>
                <strong>Disponibilidade do combustível:</strong> O combustível pode estar 
                em falta no momento da sua visita ao estabelecimento.
              </li>
              <li>
                <strong>Qualidade do serviço dos postos:</strong> Não avaliamos nem 
                endossamos a qualidade do atendimento ou dos combustíveis vendidos.
              </li>
              <li>
                <strong>Exatidão das coordenadas:</strong> A localização dos 
                estabelecimentos no mapa é aproximada.
              </li>
            </ul>
          </section>

          {/* Uso adequado */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scales size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 m-0">
                Uso Adequado
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Ao utilizar o Litrômetro, você concorda em:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Usar o serviço apenas para fins pessoais e não comerciais</li>
              <li>Não tentar acessar, copiar ou extrair dados de forma automatizada (scraping)</li>
              <li>Não interferir no funcionamento do site ou sobrecarregar nossos servidores</li>
              <li>Não utilizar o serviço para qualquer finalidade ilegal</li>
              <li>Não reproduzir, duplicar ou revender o serviço sem autorização</li>
            </ul>
          </section>

          {/* Propriedade intelectual */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Copyright size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 m-0">
                Propriedade Intelectual
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              O site Litrômetro, incluindo seu design, logotipo, textos, gráficos e código, 
              é protegido por direitos autorais e outras leis de propriedade intelectual.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Dados de preços:</strong> Os dados de preços de combustíveis são de 
              domínio público, fornecidos pela SEFAZ/AL através do sistema Economiza Alagoas. 
              O Litrômetro apenas organiza e apresenta estas informações de forma acessível.
            </p>
          </section>

          {/* Disponibilidade */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Disponibilidade do Serviço
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Nos esforçamos para manter o Litrômetro disponível 24 horas por dia, 7 dias 
              por semana. No entanto, não garantimos disponibilidade ininterrupta. O serviço 
              pode ficar indisponível temporariamente para manutenção, atualizações ou por 
              circunstâncias fora do nosso controle.
            </p>
          </section>

          {/* Limitação de responsabilidade */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Gavel size={28} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 m-0">
                Limitação de Responsabilidade
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Na máxima extensão permitida pela lei aplicável, o Litrômetro e seus 
              criadores não serão responsáveis por:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Danos diretos, indiretos, incidentais ou consequenciais</li>
              <li>Perda de lucros, dados ou oportunidades de negócio</li>
              <li>Decisões tomadas com base nas informações do site</li>
              <li>Problemas causados por terceiros (postos, SEFAZ/AL, etc.)</li>
            </ul>
          </section>

          {/* Links externos */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Links para Sites Externos
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O Litrômetro pode conter links para sites externos, incluindo o site da 
              SEFAZ/AL. Não temos controle sobre o conteúdo ou práticas de privacidade 
              desses sites e não somos responsáveis por eles. Recomendamos que você leia 
              as políticas de cada site que visitar.
            </p>
          </section>

          {/* Modificações */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Modificações dos Termos
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Reservamos o direito de modificar estes Termos de Uso a qualquer momento. 
              Alterações significativas serão comunicadas através de aviso no site. O uso 
              continuado do serviço após modificações constitui aceitação dos novos termos.
            </p>
          </section>

          {/* Lei aplicável */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Lei Aplicável
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. 
              Qualquer disputa será submetida ao foro da comarca de Maceió, Estado de Alagoas, 
              com exclusão de qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          {/* Contato */}
          <section className="bg-gray-50 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Dúvidas?</h2>
            <p className="text-gray-600">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:{' '}
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
