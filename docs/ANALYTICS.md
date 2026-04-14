# Configuração do Google Analytics 4

Este documento descreve a configuração do Google Analytics 4 (GA4) no Litrômetro.

## Informações da Propriedade

- **Measurement ID:** `G-W50QD7RD94`
- **Propriedade:** Litrômetro - Produção
- **Fuso horário:** Brasília (GMT-3)
- **Moeda:** BRL

## Consentimento e LGPD

O tracking de analytics respeita o consentimento do usuário:

1. **Consentimento padrão negado:** O GA4 é carregado, mas `analytics_storage` e `ad_storage` são negados por padrão
2. **Banner de cookies:** O `CookieBanner.tsx` apresenta opções de aceitar ou recusar
3. **Ativação sob demanda:** Apenas após aceite, o consentimento é atualizado para `granted`

```javascript
// Configuração inicial (index.html)
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied'
});

// Após aceite (CookieBanner.tsx)
gtag('consent', 'update', {
  'analytics_storage': 'granted',
  'ad_storage': 'granted'
});
```

## Eventos Rastreados

### Eventos Automáticos (Enhanced Measurement)
- `page_view` - Visualização de página
- `scroll` - Rolagem de 90% da página
- `click` - Cliques em links externos

### Eventos Customizados

| Evento | Descrição | Parâmetros |
|--------|-----------|------------|
| `fuel_type_select` | Seleção de tipo de combustível | `fuel_type`, `fuel_type_code` |
| `municipality_select` | Seleção de município | `municipality_name`, `municipality_code` |
| `location_permission` | Resultado da permissão de geolocalização | `permission_status` (granted/denied/unavailable/dev_mode) |
| `station_view` | Clique em posto no mapa | `station_name`, `station_cnpj`, `fuel_type`, `price`, `distance_km` |
| `theme_change` | Mudança de tema claro/escuro | `theme` (light/dark/system) |
| `cookie_consent` | Aceite ou recusa de cookies | `consent_given` (true/false) |
| `search` | Busca de postos (debounce 1s, mín 3 chars) | `search_term`, `results_count` |
| `page_view` | Navegação SPA | `page_path`, `page_title` |

## Arquivos Relacionados

| Arquivo | Função |
|---------|--------|
| `index.html` | Script gtag e configuração inicial |
| `src/utils/analytics.ts` | Funções de tracking tipadas |
| `src/components/CookieBanner.tsx` | Gerenciamento de consentimento |
| `src/pages/HomePage.tsx` | Tracking de combustível, município, busca |
| `src/hooks/useGeolocalizacao.ts` | Tracking de permissão de localização |
| `src/components/MapaEstabelecimentos.tsx` | Tracking de visualização de posto |
| `src/contexts/TemaContext.tsx` | Tracking de mudança de tema |
| `src/App.tsx` | Tracking de page views SPA |

## Verificação e Debug

### Em Desenvolvimento
1. Abrir Chrome DevTools > Network
2. Filtrar por "collect" ou "google-analytics"
3. Verificar requests sendo enviados

### Extensão Recomendada
- **Google Analytics Debugger** (Chrome Extension)
- Mostra eventos em tempo real no console

### Em Produção
1. GA4 > Reports > Realtime
2. Verificar eventos aparecendo
3. Aguardar 24-48h para dados consolidados

## Painel do GA4

### Configurações Recomendadas

1. **Admin > Data Settings > Data Retention**
   - Definir: 14 meses (máximo gratuito)

2. **Admin > Events > Conversions**
   - Marcar como conversão:
     - `location_permission` (engajamento alto)
     - `station_view` (interação principal)

3. **Admin > Audiences**
   - Criar públicos:
     - "Usuários com localização" (`location_permission = granted`)
     - "Usuários engajados" (`session_duration > 60s`)

4. **Admin > Data Streams > Configure tag settings > Internal traffic**
   - Adicionar IPs de desenvolvimento para excluir do tracking

## Privacidade

A página [/privacidade](/privacidade) documenta:
- Quais dados são coletados
- Como cookies são utilizados
- Direitos do usuário (LGPD)
- Links para políticas do Google

## Troubleshooting

### Eventos não aparecem
1. Verificar se consentimento foi dado (localStorage: `litrometro_cookie_consent`)
2. Verificar se `gtag` está disponível (`window.gtag`)
3. Verificar Network tab por erros de request

### Dados inconsistentes
1. GA4 pode levar até 48h para consolidar dados
2. Use Realtime reports para verificação imediata
3. Verifique filtros de tráfego interno
