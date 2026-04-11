import { Link } from 'react-router-dom';

export function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Links de navegação */}
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4 sm:mb-6 text-sm">
          <Link to="/sobre" className="text-gray-600 hover:text-blue-600 transition-colors">
            Sobre
          </Link>
          <Link to="/contato" className="text-gray-600 hover:text-blue-600 transition-colors">
            Contato
          </Link>
          <Link to="/privacidade" className="text-gray-600 hover:text-blue-600 transition-colors">
            Política de Privacidade
          </Link>
          <Link to="/termos" className="text-gray-600 hover:text-blue-600 transition-colors">
            Termos de Uso
          </Link>
        </nav>

        {/* Fonte dos dados */}
        <div className="text-center text-xs sm:text-sm text-gray-500 space-y-1">
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
          <p>
            Os preços são baseados em vendas reais e podem não refletir o valor atual no estabelecimento.
          </p>
          <p className="mt-3 text-gray-400">
            © {anoAtual} Litrômetro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
