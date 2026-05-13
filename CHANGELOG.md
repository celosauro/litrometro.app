# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/),
e este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Adicionado
- **Tema escuro no mapa**: Suporte a tema escuro integrado ao `TemaContext`, alternando entre estilos Positron (claro) e Dark Matter (escuro) do CartoCDN
- **Tooltip de contagem de postos**: Exibição de "X postos no mapa" no canto superior esquerdo do mapa com fundo semitransparente
- **Ícone de geolocalização flutuante**: Botão GPS repositionado para o canto inferior direito do mapa com margem adequada (bottom-14 right-4)
  - Estado visual diferenciado quando localização é obtida (verde)
  - Animação de carregamento quando localizando
  - Tooltip descritivo no hover

### Removido
- **Botões de zoom do mapa**: Controles de +/- removido do interface (NavigationControl)
  - Funcionalidade de zoom mantida através de gestos nativos (scroll, pinch, etc.)
- **Workflow GitHub Actions: geocode-data.yml**: Removido por estar obsoleto
  - Razão: Escrevia diretamente na tabela `estabelecimentos`, conflitando com novo pipeline geo que usa `upsert_estabelecimento_geo()` RPC
- **Workflow GitHub Actions: process-history.yml**: Removido por estar não funcional
  - Razão: Script não gera commits git, apenas atualiza tabela `precos_atuais` no Supabase

### Alterado
- **Espaçamento dos filtros superiores**:
  - Aumentado gap entre componentes: `gap-2.5` (antes: gap-2)
  - Aumentado padding vertical: `py-3` (antes: py-2)
- **Padding da página FindFuelHomePage**:
  - Ajustado para reservar espaço da barra fixa de filtro combustível: `pb-[calc(84px+env(safe-area-inset-bottom))]`
- **Componente MapaEstabelecimentos.tsx**:
  - Removido import `NavigationControl` do react-map-gl
  - Adicionados props `carregandoLocalizacao` e `onLocalizacaoClick`
  - Integração com `useTema()` hook para aplicar tema dinâmico
  - Nova constante `MAP_STYLES` com URLs de estilos claro/escuro
- **Componente FindFuelHomePage.tsx**:
  - Passagem de props de geolocalização para MapaEstabelecimentos
  - Remoção do botão GPS da barra superior (movido para mapa)

### Corrigido
- **Sobreposição de elementos no mapa**:
  - Ícone GPS agora posicionado sem conflitar com controles de zoom (removidos) ou texto de atribuição
- **Visibilidade da barra de filtro em resoluções mobile**: Barra fixa no rodapé com suporte a safe-area-inset para dispositivos com notch

### Técnico
- **CI/CD simplificado**: 3 workflows ativos mantidos (collect-data, deploy, export-data)
- **Dependências**: Nenhuma nova dependência adicionada (usa CartoCDN para estilos, react-map-gl/maplibre já presente)
- **Compatibilidade**: Mantida compatibilidade com navegadores que suportam CSS custom properties e safe-area-inset
- **Performance**: Sem impacto na performance; gestos nativos mais responsivos que controles de UI
- **Acessibilidade**: Ícone GPS mantém aria-label e title para leitores de tela e tooltips

## Notas Adicionais

### Migração de Workflow
Se estava usando `geocode-data.yml` ou `process-history.yml` em automações, descontinue as referências. Os dados de geolocalização agora são gerenciados exclusivamente pelo novo pipeline que usa RPC `upsert_estabelecimento_geo()`.

### Temas do Mapa
Os estilos do mapa agora se sincronizam automaticamente com a preferência de tema da aplicação:
- **Light**: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- **Dark**: `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`

Ambos os estilos incluem dados de ruas, fronteiras e topografia, com boa cobertura para Brasil.
