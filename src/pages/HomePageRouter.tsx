import { useLayout, CardsGridLayout, CompactListLayout } from '../layouts'
import FindFuelHomePage from './FindFuelHomePage'

/**
 * HomePageRouter - Renderiza o layout selecionado
 * Wrapper que decide qual versão da página inicial exibir baseado no contexto de layout
 */
export default function HomePageRouter() {
  const { layoutAtual } = useLayout()

  switch (layoutAtual) {
    case 'cards-grid':
      return <CardsGridLayout />
    case 'compact-list':
      return <CompactListLayout />
    case 'default':
    default:
      return <FindFuelHomePage />
  }
}
