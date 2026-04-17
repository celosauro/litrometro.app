# Guia de SEO e Google AdSense - Litrômetro

Este documento descreve todas as otimizações de SEO e a implementação do Google AdSense realizadas no projeto.

---

## 📋 Sumário

1. [Melhorias de SEO](#-melhorias-de-seo)
   - [1.1 Preconnect e DNS Prefetch](#11-preconnect-e-dns-prefetch)
   - [1.2 Dados Estruturados JSON-LD](#12-dados-estruturados-json-ld)
   - [1.3 PWA Manifest](#13-pwa-manifest)
2. [Implementação do Google AdSense](#-implementação-do-google-adsense)
   - [2.1 Arquivo ads.txt](#21-arquivo-adstxt)
   - [2.2 Componente AdBanner](#22-componente-adbanner)
   - [2.3 Integração com CookieBanner](#23-integração-com-cookiebanner)
3. [Checklist de Configuração](#-checklist-de-configuração)
4. [Como Usar os Anúncios](#-como-usar-os-anúncios)

---

## 🔍 Melhorias de SEO

### 1.1 Preconnect e DNS Prefetch

**Arquivo:** `index.html`

**O que foi adicionado:**
```html
<!-- Preconnect para recursos externos (melhora performance) -->
<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin />
<link rel="preconnect" href="https://www.google-analytics.com" crossorigin />
<link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin />
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />
<link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
```

**Por que isso é importante:**
- `preconnect` estabelece conexões antecipadas com servidores externos
- Reduz latência de carregamento de scripts de terceiros (Analytics, AdSense)
- `dns-prefetch` faz a resolução DNS antes de ser necessária
- Melhora Core Web Vitals (LCP, FID)

---

### 1.2 Dados Estruturados JSON-LD

**Arquivo:** `index.html`

**Schemas implementados:**

#### WebApplication
Define o site como uma aplicação web gratuita:
```json
{
  "@type": "WebApplication",
  "name": "Litrômetro",
  "applicationCategory": "UtilitiesApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "BRL"
  },
  "featureList": [
    "Comparação de preços de combustíveis",
    "Mapa interativo de postos",
    "Filtro por município",
    "Filtro por tipo de combustível",
    "Dados atualizados da SEFAZ/AL"
  ]
}
```

#### Organization
Define a identidade da organização:
```json
{
  "@type": "Organization",
  "name": "Litrômetro",
  "url": "https://litrometro.app/",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "url": "https://litrometro.app/contato"
  }
}
```

#### WebSite
Define informações do site:
```json
{
  "@type": "WebSite",
  "url": "https://litrometro.app/",
  "name": "Litrômetro",
  "inLanguage": "pt-BR"
}
```

#### BreadcrumbList
Define navegação estrutural:
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Início",
      "item": "https://litrometro.app/"
    }
  ]
}
```

**Por que isso é importante:**
- Melhora a compreensão do site pelos motores de busca
- Habilita rich snippets nos resultados de pesquisa
- Pode mostrar informações adicionais no Google (preço, avaliações, etc.)

**Validação:**
- Use a ferramenta [Rich Results Test](https://search.google.com/test/rich-results) do Google
- Cole a URL `https://litrometro.app/` para verificar os schemas

---

### 1.3 PWA Manifest

**Arquivo:** `public/manifest.json`

**Configurações incluídas:**
```json
{
  "name": "Litrômetro - Preços de Combustíveis em Alagoas",
  "short_name": "Litrômetro",
  "display": "standalone",
  "theme_color": "#1A4D2E",
  "background_color": "#ffffff",
  "icons": [...],
  "shortcuts": [
    {
      "name": "Ver preços de Gasolina",
      "url": "/?combustivel=gasolina"
    }
  ]
}
```

**Benefícios:**
- Permite instalação do app na tela inicial (mobile/desktop)
- Ícones específicos para diferentes dispositivos
- Atalhos rápidos para funções comuns
- Melhora a experiência do usuário

**Ações necessárias:**
1. Criar ícones em `public/`:
   - `icon-192.png` (192x192 pixels)
   - `icon-512.png` (512x512 pixels)
   - `apple-touch-icon.png` (180x180 pixels)

---

## 💰 Implementação do Google AdSense

### 2.1 Arquivo ads.txt

**Arquivo:** `public/ads.txt`

**Conteúdo atual (placeholder):**
```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

**Passos para configurar:**

1. **Criar conta no Google AdSense:**
   - Acesse: https://www.google.com/adsense
   - Faça login com sua conta Google
   - Adicione o site `litrometro.app`

2. **Obter o ID do publicador:**
   - No painel do AdSense, vá em "Conta" > "Informações da conta"
   - Copie o "ID do editor" (formato: `pub-XXXXXXXXXXXXXXXX`)

3. **Atualizar ads.txt:**
   ```
   google.com, pub-SEU_ID_REAL, DIRECT, f08c47fec0942fa0
   ```

4. **Verificar:**
   - Após deploy, acesse: `https://litrometro.app/ads.txt`
   - O arquivo deve estar acessível publicamente

---

### 2.2 Componente AdBanner

**Arquivo:** `src/components/AdBanner.tsx`

**Características:**
- ✅ Só carrega após consentimento do usuário (LGPD)
- ✅ Responsivo e adapta ao container
- ✅ Suporta múltiplos formatos de anúncio
- ✅ Placeholder em desenvolvimento/sem consentimento

**Formatos disponíveis:**

| Slot | Descrição | Dimensões |
|------|-----------|-----------|
| `horizontal` | Banner horizontal | 728x90 (responsivo) |
| `vertical` | Sidebar | 300x600 |
| `square` | Quadrado | 300x250 |
| `in-article` | Dentro do conteúdo | Fluido |
| `in-feed` | Entre itens de lista | Fluido |

**Exemplo de uso:**
```tsx
import { AdBanner } from './components/AdBanner';

// Em qualquer página/componente:
<AdBanner 
  slot="horizontal" 
  adSlotId="1234567890"  // ID do slot no AdSense
  className="my-4"
/>
```

**Passos para criar slots no AdSense:**

1. No painel do AdSense, vá em "Anúncios" > "Por bloco de anúncios"
2. Clique em "Criar novo bloco de anúncios"
3. Escolha o tipo (display, in-article, etc.)
4. Configure nome e tamanho
5. Copie o `data-ad-slot` gerado (número de 10 dígitos)
6. Use esse ID no componente `AdBanner`

---

### 2.3 Integração com CookieBanner

**Arquivo:** `src/components/CookieBanner.tsx`

**Fluxo de consentimento:**

```
┌─────────────────┐
│  Usuário acessa │
│     o site      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cookie banner   │
│    aparece      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Aceitar│ │Recusar│
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────────────┐  ┌───────────────┐
│ Analytics: ✅ │  │ Analytics: ❌ │
│ AdSense:   ✅ │  │ AdSense:   ❌ │
│ Ads visíveis  │  │ Placeholder   │
└───────────────┘  └───────────────┘
```

**Eventos disparados:**
```javascript
// Quando usuário aceita/rejeita
window.dispatchEvent(new CustomEvent('litrometro:consent-changed', { 
  detail: { consent: 'accepted' | 'rejected' } 
}));
```

**Dados salvos no localStorage:**
```javascript
localStorage.getItem('litrometro_cookie_consent')
// Retorna: 'accepted' | 'rejected' | null
```

---

## ✅ Checklist de Configuração

### Antes do Deploy

- [ ] Criar conta no Google AdSense
- [ ] Obter ID do publicador (`pub-XXXXXXXXXXXXXXXX`)
- [ ] Atualizar `public/ads.txt` com ID real
- [ ] Atualizar `ADSENSE_CLIENT_ID` em:
  - [ ] `src/components/AdBanner.tsx`
  - [ ] `src/components/CookieBanner.tsx`
  - [ ] `index.html` (script placeholder)
- [ ] Criar ícones PWA:
  - [ ] `public/icon-192.png`
  - [ ] `public/icon-512.png`
  - [ ] `public/apple-touch-icon.png`
- [ ] Solicitar revisão do site no AdSense

### Após o Deploy

- [ ] Verificar `https://litrometro.app/ads.txt`
- [ ] Verificar `https://litrometro.app/manifest.json`
- [ ] Testar instalação PWA no mobile
- [ ] Validar JSON-LD no [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Aguardar aprovação do AdSense (2-14 dias)

---

## 🎯 Como Usar os Anúncios

### Adicionar banner na página inicial

```tsx
// src/pages/FindFuelHomePage.tsx
import { AdBanner } from '../components/AdBanner';

export default function FindFuelHomePage() {
  return (
    <main>
      {/* Banner no topo */}
      <AdBanner slot="horizontal" adSlotId="SEU_SLOT_ID" className="mb-4" />
      
      {/* Conteúdo da página */}
      <div>...</div>
      
      {/* Banner no rodapé */}
      <AdBanner slot="horizontal" adSlotId="OUTRO_SLOT_ID" className="mt-4" />
    </main>
  );
}
```

### Adicionar banner na sidebar (desktop)

```tsx
<aside className="hidden lg:block w-[300px]">
  <AdBanner slot="vertical" adSlotId="SEU_SLOT_ID" />
</aside>
```

### Adicionar entre itens de lista

```tsx
{estabelecimentos.map((est, index) => (
  <>
    <StationCard key={est.id} {...est} />
    {/* Banner a cada 5 itens */}
    {(index + 1) % 5 === 0 && (
      <AdBanner slot="in-feed" adSlotId="SEU_SLOT_ID" className="my-2" />
    )}
  </>
))}
```

---

## 📚 Referências

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Schema.org - WebApplication](https://schema.org/WebApplication)
- [Google AdSense Help](https://support.google.com/adsense)
- [Web App Manifest](https://web.dev/add-manifest/)
- [Core Web Vitals](https://web.dev/vitals/)

---

*Última atualização: Abril 2026*
