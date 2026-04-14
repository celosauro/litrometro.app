# 🚗 Litrômetro

> Compare preços de combustíveis em todos os 102 municípios de Alagoas

[![Deploy to GitHub Pages](https://github.com/seu-usuario/litrometro/actions/workflows/deploy.yml/badge.svg)](https://github.com/seu-usuario/litrometro/actions/workflows/deploy.yml)

## 📋 Sobre

O Litrômetro é uma aplicação web gratuita que permite aos consumidores alagoanos comparar preços de combustíveis em tempo real. Os dados são obtidos diretamente do sistema [Economiza Alagoas](https://economizaalagoas.sefaz.al.gov.br) da SEFAZ/AL.

**Acesse:** [https://litrometro.app](https://litrometro.app)

## ✨ Funcionalidades

- 🗺️ **Mapa interativo** com todos os postos de combustível
- 📍 **Geolocalização** para encontrar postos próximos
- 🔍 **Filtros** por tipo de combustível e município
- 🌓 **Tema claro/escuro** com detecção automática do sistema
- 📱 **Responsivo** para desktop e mobile
- ⭐ **Destaque** do melhor preço em até 5km

## 🛠️ Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **Estilos:** TailwindCSS
- **Mapas:** MapLibre GL + react-map-gl
- **Ícones:** Phosphor Icons
- **Analytics:** Google Analytics 4
- **Deploy:** GitHub Pages

## 🚀 Desenvolvimento

### Pré-requisitos

- Node.js 22+
- npm ou yarn

### Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/litrometro.git
cd litrometro

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Verificar código |

## 📊 Analytics

O projeto utiliza Google Analytics 4 para métricas de uso. Veja [docs/ANALYTICS.md](docs/ANALYTICS.md) para detalhes sobre:

- Configuração do GA4
- Eventos rastreados
- Consentimento e LGPD
- Debug e troubleshooting

## 📁 Estrutura do Projeto

```
litrometro/
├── docs/                    # Documentação
│   ├── ANALYTICS.md        # Configuração do GA4
│   ├── CONFIGURACAO_SUPABASE.md
│   └── DEPLOY_GITHUB_PAGES.md
├── public/
│   └── dados/              # Dados estáticos (JSON)
├── scripts/                # Scripts de coleta
│   ├── coletar-precos-json.ts
│   └── geocodificar.ts
├── src/
│   ├── components/         # Componentes React
│   ├── contexts/           # Contextos (tema)
│   ├── hooks/              # Hooks customizados
│   ├── pages/              # Páginas da aplicação
│   ├── types/              # Tipos TypeScript
│   └── utils/              # Utilitários (analytics, distância)
└── supabase/               # Schema do banco
```

## 🔄 Coleta de Dados

Os preços são coletados automaticamente via GitHub Actions:

- **Coleta de preços:** A cada hora
- **Geocodificação:** Uma vez por dia

Veja [.github/workflows/](/.github/workflows/) para detalhes.

## 📄 Licença

Este projeto é de código aberto. Os dados de preços são de domínio público, fornecidos pela SEFAZ/AL.

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma issue ou envie um pull request.

## 📞 Contato

- **Email:** contato@litrometro.app
- **Site:** [litrometro.app](https://litrometro.app)

---

Feito com ❤️ para os alagoanos
