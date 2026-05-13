# 🚗 Litrômetro

> Compare preços de combustíveis em tempo real nos 102 municípios de Alagoas

[![Deploy to GitHub Pages](https://github.com/seu-usuario/litrometro/actions/workflows/deploy.yml/badge.svg)](https://github.com/seu-usuario/litrometro/actions/workflows/deploy.yml)
[![Coletar Preços](https://github.com/seu-usuario/litrometro/actions/workflows/collect-data.yml/badge.svg)](https://github.com/seu-usuario/litrometro/actions/workflows/collect-data.yml)

## 📋 Sobre

O Litrômetro é uma aplicação web gratuita que permite aos consumidores alagoanos comparar preços de combustíveis em tempo real. Os dados são obtidos diretamente do sistema [Economiza Alagoas](https://economizaalagoas.sefaz.al.gov.br) da SEFAZ/AL.

**Acesse:** [https://litrometro.app](https://litrometro.app)

---

## ✨ Funcionalidades

### 🗺️ Mapa Interativo
- Visualização de todos os postos de combustível no mapa
- Pins coloridos indicando faixa de preço (verde = barato, vermelho = caro)
- Clique no posto para ver detalhes e abrir no Google Maps

### 📍 Geolocalização
- Detecta automaticamente sua localização
- Encontra o município mais próximo automaticamente
- Ordena postos por distância quando ativado
- Calcula distância em km para cada posto

### 🔍 Filtros Avançados
- **6 tipos de combustível:** Gasolina Comum, Gasolina Aditivada, Etanol, Diesel Comum, Diesel S10, GNV
- **102 municípios** de Alagoas disponíveis
- **Busca por texto:** nome do posto, bairro ou endereço

### 📊 Histórico de Preços
- Valor mínimo, máximo e médio dos últimos 30 dias
- Identificação de variação de preços
- Destaque para o posto com melhor custo-benefício (até 5km)

### 🌓 Tema Claro/Escuro
- Detecção automática da preferência do sistema
- Alternância manual com persistência
- Mapa adapta cores ao tema

### 📱 Design Responsivo
- Interface adaptada para desktop, tablet e mobile
- Lista de postos retrátil no mobile
- Navegação otimizada por touch

### 📲 PWA Instalável
- Instalável no navegador (desktop e Android) via botão de instalação
- Ícones dedicados para atalho/tela inicial (`192x192` e `512x512`)
- Modo standalone (abre como app, sem barra tradicional do navegador)
- Service Worker com atualização automática em produção

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        COLETA (GitHub Actions)                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ API SEFAZ/AL │───▶│   Supabase   │───▶│ atual.min.json   │  │
│  │   (fonte)    │    │ (PostgreSQL) │    │   (84KB gzip)    │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│       ↑ a cada 3 horas     ↑ persiste         ↑ exporta        │
└─────────────────────────────────────────────────────────────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (GitHub Pages)                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ React + Vite │◀───│  JSON Cache  │◀───│  atual.min.json  │  │
│  │  (SPA)       │    │  (30 min)    │    │   (CDN)          │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Backend (Supabase)
- **PostgreSQL** com 5 tabelas: `municipios`, `estabelecimentos`, `precos_atuais`, `vendas_historico`, `coletas_log`
- **RLS (Row Level Security)** para acesso seguro
- **~53k registros** de histórico de vendas
- **~500 postos** cadastrados

### Frontend (React)
- **SPA** servida via GitHub Pages
- **JSON minificado** (~580KB, ~84KB gzip) com cache de 30 min
- **Zero chamadas a API** em runtime - dados 100% estáticos
- **MapLibre GL** para mapas vetoriais

---

## 🛠️ Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Estilos** | TailwindCSS |
| **Mapas** | MapLibre GL, react-map-gl |
| **Ícones** | Phosphor Icons |
| **Roteamento** | React Router v7 |
| **Backend** | Supabase (PostgreSQL) |
| **Analytics** | Google Analytics 4 |
| **CI/CD** | GitHub Actions |
| **Hosting** | GitHub Pages |

---

## 🚀 Desenvolvimento

### Pré-requisitos

- Node.js 22+
- npm
- Conta Supabase (para scripts de coleta)

### Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/litrometro.git
cd litrometro

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Iniciar servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```bash
# Frontend (Vite)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

# Backend (scripts)
SUPABASE_SECRET_KEY=sb_secret_xxx
SEFAZ_APP_TOKEN=token_sefaz

# Geocodificação (opcional)
OPENCAGE_API_KEY=xxx
LOCATIONIQ_API_KEY=xxx
```

---

## 📜 Scripts Disponíveis

### Desenvolvimento
| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build local |
| `npm run lint` | Verificar código (ESLint) |

### Validar Instalação PWA

```bash
# gerar build de produção (inclui service worker)
npm run build

# servir build localmente
npm run preview
```

Checklist rápido no navegador:
- Abrir o site em HTTPS (ou `localhost` no preview)
- Confirmar em DevTools > Application > Manifest que não há erros
- Confirmar em DevTools > Application > Service Workers que o SW está ativo
- Verificar se o botão/opção "Instalar app" aparece no navegador

### Coleta e Processamento
| Comando | Descrição |
|---------|-----------|
| `npm run collect:supabase` | Coleta preços da API SEFAZ → Supabase |
| `npm run process:history` | Atualiza snapshot e menor preço da janela móvel de 24h |
| `npm run export:json` | Exporta Supabase → `atual.min.json` |
| `npm run geocode` | Geocodifica endereços sem coordenadas |
| `npm run sync:geocache` | Sincroniza geocache local → Supabase |

---

## ⚙️ Automações (GitHub Actions)

| Workflow | Schedule | Descrição |
|----------|----------|-----------|
| **collect-data.yml** | A cada 3 horas | Coleta preços da SEFAZ e salva no Supabase |
| **export-data.yml** | A cada hora (`15 * * * *`) | Processa janela móvel de 24h, sincroniza geocache e exporta JSON |
| **deploy.yml** | Push na main | Build e deploy para GitHub Pages |

---

## 📁 Estrutura do Projeto

```
litrometro/
├── .github/workflows/       # GitHub Actions
│   ├── collect-data.yml     # Coleta a cada 3 horas
│   ├── export-data.yml      # Processa 24h e exporta JSON
│   ├── deploy.yml           # Deploy automático
├── docs/                    # Documentação
│   ├── ANALYTICS.md         # Configuração GA4
│   ├── CONFIGURACAO_SUPABASE.md
│   └── DEPLOY_GITHUB_PAGES.md
├── public/
│   └── dados/               # Dados estáticos
│       ├── atual.min.json   # Preços atuais (minificado)
│       ├── atual.json       # Preços atuais (expandido)
│       ├── geocache.json    # Cache de geocodificação
│       └── municipios-centro.json  # Centróides dos municípios
├── scripts/                 # Scripts de backend
│   ├── coletar-precos-supabase.ts  # Coleta SEFAZ → Supabase
│   ├── exportar-json.ts     # Supabase → JSON
│   ├── geocodificar.ts      # Nominatim/OpenCage/LocationIQ
│   ├── processar-historico.ts      # Cálculo de agregações
│   └── sync-geocache-supabase.ts   # Sincroniza geocache
├── src/
│   ├── components/          # Componentes React
│   │   ├── BotaoTema.tsx    # Alternador claro/escuro
│   │   ├── CookieBanner.tsx # Consentimento LGPD
│   │   ├── Footer.tsx       # Rodapé com links
│   │   ├── FuelCard.tsx     # Card de posto
│   │   ├── FuelTypeSelector.tsx    # Seletor de combustível
│   │   ├── Layout.tsx       # Layout base
│   │   ├── MapaEstabelecimentos.tsx # Mapa interativo
│   │   ├── MunicipioSelector.tsx   # Seletor de município
│   │   └── PinPreco.tsx     # Pin do mapa
│   ├── contexts/
│   │   └── TemaContext.tsx  # Contexto de tema
│   ├── hooks/
│   │   ├── useGeolocalizacao.ts    # Hook de geolocalização
│   │   └── usePrecosCombustiveis.ts # Hook de dados
│   ├── pages/               # Páginas
│   │   ├── HomePage.tsx     # Página principal
│   │   ├── ContatoPage.tsx  # Contato
│   │   ├── PrivacidadePage.tsx     # Política de privacidade
│   │   ├── SobrePage.tsx    # Sobre o projeto
│   │   └── TermosPage.tsx   # Termos de uso
│   ├── types/
│   │   └── index.ts         # Tipos TypeScript
│   └── utils/
│       ├── analytics.ts     # Eventos GA4
│       ├── dados.ts         # Expansão de JSON minificado
│       └── distancia.ts     # Cálculo Haversine
└── supabase/
    ├── schema.sql           # Schema do banco
    └── seed.sql             # Dados iniciais
```

---

## 📊 Formato de Dados

### JSON Minificado (`atual.min.json`)

O JSON de produção é minificado para reduzir tamanho (~580KB → ~84KB gzip):

```json
{
  "v": 2,           // versão do schema
  "t": "2026-04-15T12:00:00Z",  // timestamp
  "n": 1852,        // total de registros
  "m": 98,          // total de municípios
  "d": [{           // dados
    "c": "12345678000199",    // cnpj
    "tp": 1,                  // tipo_combustivel
    "rs": "POSTO XYZ LTDA",   // razao_social
    "nf": "AUTO POSTO XYZ",   // nome_fantasia
    "ib": "2704302",          // codigo_ibge
    "mn": "Maceió",           // municipio
    "lat": -9.65,             // latitude
    "lng": -35.72,            // longitude
    "vn": 5.89,               // valor_minimo
    "vx": 6.29,               // valor_maximo
    "vm": 6.05,               // valor_medio
    "vr": 5.99,               // valor_recente
    "v24": 5.87,              // valor_minimo_24h (ou fallback em vr)
    "x24": 6.01,              // valor_maximo_24h
    "m24": 5.93,              // valor_medio_24h
    "d24": "2026-04-15T17:12:00Z", // data_minimo_24h
    "c24": 12,                // contagem_vendas_24h
    "j24i": "2026-04-14T18:00:00Z", // inicio da janela móvel
    "j24f": "2026-04-15T18:00:00Z", // fim da janela móvel
    "u24": "2026-04-15T18:05:00Z",  // processamento 24h
    "dr": "2026-04-15T18:00:00Z"  // data_recente
  }]
}
```

---

## 📄 Licença

Este projeto é de código aberto. Os dados de preços são de domínio público, fornecidos pela SEFAZ/AL através do programa Economiza Alagoas.

## 🤝 Contribuindo

Contribuições são bem-vindas! 

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Contato

- **Email:** contato@litrometro.app
- **Site:** [litrometro.app](https://litrometro.app)

---

<p align="center">Feito com ❤️ para os alagoanos</p>
