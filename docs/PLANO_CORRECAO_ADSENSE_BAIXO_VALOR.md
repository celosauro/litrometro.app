# Plano de Correcao AdSense - Conteudo de Baixo Valor

## 1. Objetivo

Documentar, de forma detalhada, todas as alteracoes sugeridas para elevar a qualidade editorial e tecnica do Litrometro e reduzir o risco de reprovacao por "Conteudo de baixo valor" no Google AdSense.

Este documento descreve apenas o plano de mudancas. A implementacao sera feita em etapa posterior.

---

## 2. Base de Politica Utilizada

As recomendacoes abaixo foram mapeadas com base nestas diretrizes oficiais:

- AdSense: requisitos minimos de conteudo e experiencia do usuario.
- AdSense: conteudo exclusivo, evitar duplicacao e melhorar navegacao.
- Search spam policies: conteudo superficial com pouco ou nenhum valor agregado.
- Publisher policies: inventario sem conteudo do editor ou com baixo valor.

Links de referencia:

- https://support.google.com/adsense/answer/10502938
- https://support.google.com/adsense/answer/10015918
- https://support.google.com/webmasters/answer/9044175
- https://support.google.com/publisherpolicies/answer/11035931

---

## 3. Diagnostico Consolidado do Projeto

### 3.1 Pontos fortes ja existentes

- Pagina de privacidade e termos ja possuem conteudo consistente.
- Estrutura de navegacao principal existe e esta funcional.
- Ha sinais tecnicos de SEO base (title, description, canonical, sitemap, robots, JSON-LD no HTML base).
- Produto tem utilidade real (comparacao de preco de combustivel) com dados publicos relevantes.

### 3.2 Pontos de risco para "baixo valor"

- Cobertura editorial publica ainda pequena para um dominio monetizado.
- Home focada quase exclusivamente em interface utilitaria (filtros e mapa), com pouca camada explicativa.
- Forte dependencia de dados de terceiros sem conteudo analitico suficiente por pagina.
- Pagina de contato com baixo conteudo textual proprio (predominio de embed).
- SEO e metadados ainda concentrados no HTML base, sem estrategia robusta por rota.

---

## 4. Estrategia de Correcao (Visao Geral)

As alteracoes estao agrupadas em 7 frentes:

1. Conteudo editorial original e aprofundado.
2. Paginas de valor por municipio e combustivel.
3. Transparencia, autoria e confianca (E-E-A-T).
4. UX e arquitetura de navegacao para descoberta de conteudo.
5. SEO tecnico por rota e indexabilidade.
6. Governanca de anuncios (quando habilitados).
7. Dossie de reconsideracao para submissao no AdSense.

---

## 5. Alteracoes Sugeridas em Detalhe

## 5.1 Frente A - Conteudo editorial original (alta prioridade)

### A.1 Criar secao editorial na Home

Problema atacado: Home utilitaria com baixa densidade de conteudo interpretativo.

Mudanca sugerida: adicionar bloco editorial abaixo da experiencia principal contendo:

- Como os dados sao coletados e atualizados.
- Limitacoes dos precos (defasagem por NFC-e).
- Como interpretar diferenca de preco por regiao.
- Boas praticas para economizar ao abastecer.

Resultado esperado: aumentar valor informacional na principal URL indexada do dominio.

Arquivos provaveis de implementacao:

- src/pages/FindFuelHomePage.tsx
- src/pages/HomePage.tsx (se mantida em algum layout)
- src/components (novo componente editorial)

### A.2 Criar paginas de apoio com conteudo autoral

Mudanca sugerida: incluir paginas dedicadas, com texto original e utilitario:

- /metodologia (coleta, tratamento, limites e confiabilidade)
- /como-interpretar-precos (guia pratico de leitura dos dados)
- /faq (perguntas frequentes reais de usuario)
- /fontes-e-atualizacao (origem, frequencia e governanca dos dados)

Resultado esperado: ampliar quantidade de paginas com conteudo substancial, nao apenas interface.

Arquivos provaveis de implementacao:

- src/pages/MetodologiaPage.tsx
- src/pages/ComoInterpretarPrecosPage.tsx
- src/pages/FaqPage.tsx
- src/pages/FontesAtualizacaoPage.tsx
- src/App.tsx
- src/components/HamburgerMenu.tsx
- src/components/Footer.tsx

### A.3 Fortalecer a pagina de contato

Problema atacado: pagina potencialmente superficial (embed dominante).

Mudanca sugerida: manter formulario, mas adicionar conteudo proprio:

- Tipos de solicitacao aceitos.
- Prazo de resposta.
- Procedimento para correcao de dados.
- Orientacao sobre divergencia de precos.

Arquivo provavel:

- src/pages/ContatoPage.tsx

---

## 5.2 Frente B - Conteudo programatico com valor real (alta prioridade)

### B.1 Criar paginas por municipio com analise textual

Problema atacado: falta de cobertura editorial escalavel e especifica.

Mudanca sugerida: criar rota por municipio com conteudo textual dinamico e nao apenas listagem:

- Resumo do cenario local (faixa de preco, dispersao, combustivel mais vantajoso).
- Insights calculados (diferenca entre menor e maior preco, tendencia curta).
- Orientacoes para economia no contexto daquele municipio.

Importante: nao criar paginas "template vazias". Cada rota deve exibir insights concretos com dados locais e texto contextual util.

Arquivos provaveis:

- src/pages/MunicipioPage.tsx
- src/utils (funcoes de resumo e geracao de insights)
- src/App.tsx
- public/sitemap.xml (geracao dinamica ou atualizacao manual inicial)

### B.2 (Opcional posterior) paginas por municipio + combustivel

Observacao: so executar apos B.1 consolidado. Evitar multiplicar paginas sem densidade.

---

## 5.3 Frente C - Transparencia e confianca (media-alta prioridade)

### C.1 Reforcar sinais de autoria e governanca

Mudanca sugerida: ampliar a pagina Sobre com:

- Quem mantem o projeto.
- Responsavel editorial/tecnico.
- Criterios de qualidade e atualizacao.
- Historico de evolucao relevante.

Arquivo provavel:

- src/pages/SobrePage.tsx

### C.2 Inserir politica de correcao de dados

Mudanca sugerida: criar secao especifica (na metodologia ou pagina dedicada) sobre:

- Como reportar erro.
- Como a correcao e validada.
- Em quanto tempo o ajuste entra em producao.

---

## 5.4 Frente D - UX e arquitetura de navegacao (media prioridade)

### D.1 Melhorar discoverability de conteudo

Mudanca sugerida: incluir no header/menu links para paginas editoriais novas.

Arquivos provaveis:

- src/components/HamburgerMenu.tsx
- src/components/Footer.tsx

### D.2 Adicionar links contextuais entre paginas

Exemplos:

- Home -> Metodologia, FAQ, Municipio.
- Municipio -> Como interpretar precos.
- Sobre -> Fontes e atualizacao.

Objetivo: aumentar navegacao sem caminhos mortos e reforcar valor percebido.

---

## 5.5 Frente E - SEO tecnico por rota (alta prioridade)

### E.1 Implementar metadados por pagina

Problema atacado: SEO concentrado no HTML base.

Mudanca sugerida: adotar estrategia de head por rota (ex.: react-helmet-async) com:

- title unico por rota
- description unica por rota
- canonical por rota
- OG/Twitter por rota principal

Arquivos provaveis:

- src/main.tsx
- src/App.tsx
- src/pages/*

### E.2 Dados estruturados especificos por pagina

Mudanca sugerida: manter JSON-LD global e complementar paginas-chave com schema apropriado (WebPage, FAQPage, BreadcrumbList por rota).

### E.3 Reforcar sitemap para novas rotas editoriais

Mudanca sugerida: atualizar sitemap para incluir URLs novas e relevantes.

Arquivo:

- public/sitemap.xml

---

## 5.6 Frente F - Governanca de anuncios (media prioridade)

Mesmo que o foco da reprovacao seja valor de conteudo, documentar regras de monetizacao para evitar bloqueios futuros:

- Nao exibir anuncios em paginas com conteudo insuficiente.
- Evitar excesso de anuncios versus conteudo do editor.
- Nao usar anuncios em telas de transicao/comportamentais sem conteudo.
- Priorizar anuncio apenas em paginas ja robustas editorialmente.

Arquivos provaveis para revisao futura:

- src/components/AdBanner.tsx
- paginas onde blocos forem habilitados

---

## 5.7 Frente G - Dossie para pedido de revisao (alta prioridade)

Antes de pedir revisao no AdSense, montar material objetivo com:

- Lista de paginas novas criadas.
- Exemplos de conteudo original adicionado.
- Evidencias de melhoria de navegacao e UX.
- Registro de data das mudancas.

Formato recomendado:

- docs/REVISAO_ADSENSE_DOSSIE.md

---

## 6. Priorizacao Recomendada (Ordem de Execucao)

1. Frente A (conteudo editorial base) + Frente E (SEO por rota).
2. Frente B.1 (paginas por municipio com insights reais).
3. Frente C (autoria e governanca).
4. Frente D (navegacao e links internos).
5. Frente F (governanca de anuncios).
6. Frente G (dossie e solicitacao de revisao).

---

## 7. Criterios de Aceite por Frente

## 7.1 Conteudo

- Home possui secao editorial substantiva e util.
- Minimo de 4 paginas editoriais novas publicadas.
- Contato deixa de ser predominantemente embed sem contexto.

## 7.2 Escala com qualidade

- Paginas por municipio tem analise textual real baseada em dados.
- Nao ha rotas com texto generico vazio/repetitivo.

## 7.3 SEO/Indexacao

- Cada rota principal possui title/description/canonical proprios.
- Sitemap reflete novas paginas relevantes.

## 7.4 Experiencia

- Conteudo editorial e facilmente encontravel no menu e rodape.
- Existem links internos contextuais entre paginas.

## 7.5 Monetizacao segura

- Regras de exibicao evitam paginas de baixo valor com anuncios.

---

## 8. Riscos e Mitigacoes

### Risco 1: gerar muitas paginas rasas

Mitigacao: so publicar paginas programaticas quando houver insights minimos e texto util por rota.

### Risco 2: conteudo repetitivo entre municipios

Mitigacao: templates com variacao por dados locais (faixa, dispersao, comparativos, observacoes).

### Risco 3: aumento de superficie sem discoverability

Mitigacao: reforcar navegacao e links internos desde a Home.

### Risco 4: solicitar revisao cedo demais

Mitigacao: usar checklist final e dossie de evidencias antes da submissao.

---

## 9. Checklist Final Pre-Submissao no AdSense

- [ ] Home com conteudo editorial robusto.
- [ ] Paginas de metodologia, FAQ, interpretacao e fontes publicadas.
- [ ] Pagina de contato fortalecida com conteudo proprio.
- [ ] Paginas por municipio com valor real publicadas (fase inicial).
- [ ] Metadados por rota implementados.
- [ ] Sitemap atualizado.
- [ ] Navegacao interna revisada.
- [ ] Regras de anuncios alinhadas a conteudo robusto.
- [ ] Dossie de revisao preparado.

---

## 10. Escopo Fora Desta Fase

Nao fazem parte desta etapa de documentacao:

- Mudancas de design visual nao relacionadas a valor editorial/UX.
- Alteracoes de pipeline de dados que nao impactem conteudo para o usuario final.
- Otimizacoes avancadas de performance sem relacao com aprovacao de politicas.

---

## 11. Proximo Passo

Apos validacao deste plano, iniciar implementacao faseada pela ordem de priorizacao definida na secao 6.
