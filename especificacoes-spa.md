# Especificações Técnicas - SPA React + TypeScript + Vite

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS  
**Tipo:** Single Page Application (SPA)

---

## 1. Stack Tecnológica

### 1.1 Core

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | ^18.3.x | Biblioteca UI |
| TypeScript | ~5.6.x | Tipagem estática |
| Vite | ^6.x | Build tool / Dev server |
| Tailwind CSS | ^3.4.x | Framework CSS utility-first |

### 1.2 Dependências Recomendadas

| Pacote | Propósito |
|--------|-----------|
| @phosphor-icons/react | Biblioteca de ícones |
| @vitejs/plugin-react | Plugin React para Vite |
| vite-prerender-plugin | Pré-renderização SSG (opcional) |

### 1.3 Dependências de Desenvolvimento

| Pacote | Propósito |
|--------|-----------|
| ESLint | Linting |
| typescript-eslint | Regras ESLint para TypeScript |
| eslint-plugin-react-hooks | Regras para React Hooks |
| eslint-plugin-react-refresh | Suporte Fast Refresh |
| PostCSS | Processamento CSS |
| Autoprefixer | Prefixos CSS automáticos |

---

## 2. Configuração do Projeto

### 2.1 package.json

```json
{
  "name": "meu-projeto-spa",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@phosphor-icons/react": "^2.1.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.17.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals": "^15.14.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.6.2",
    "typescript-eslint": "^8.18.2",
    "vite": "^6.0.5"
  }
}
```

### 2.2 TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

### 2.3 Vite (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
})
```

**Com pré-renderização SSG (opcional):**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript: path.resolve(__dirname, 'src/prerender.tsx'),
      additionalPrerenderRoutes: ['/'],
    }),
  ],
  base: '/',
})
```

### 2.4 Tailwind CSS (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta customizada (exemplo baseada em sky)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        }
      }
    },
  },
  plugins: [],
}
```

### 2.5 PostCSS (postcss.config.js)

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

## 3. Arquitetura de Diretórios

```
projeto/
├── index.html           # Entry point HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── public/              # Assets estáticos (copiados sem processamento)
│   ├── favicon.ico
│   ├── robots.txt
│   └── sitemap.xml
└── src/
    ├── main.tsx         # Entry point React
    ├── App.tsx          # Componente raiz
    ├── index.css        # Estilos globais + Tailwind directives
    ├── vite-env.d.ts    # Tipos Vite
    ├── components/      # Componentes React reutilizáveis
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   ├── LoadingSpinner.tsx
    │   ├── ErrorMessage.tsx
    │   └── index.ts     # Barrel export
    ├── contexts/        # React Contexts
    │   └── AppContext.tsx
    ├── hooks/           # Custom hooks
    │   └── useData.ts
    ├── types/           # Tipos TypeScript
    │   └── index.ts
    ├── utils/           # Funções utilitárias
    │   └── helpers.ts
    └── data/            # Dados estáticos JSON (opcional)
        └── ...
```

---

## 4. Convenções de Código

### 4.1 TypeScript

- Usar `interface` para props e modelos de dados
- Exportar tipos em arquivos dedicados (`src/types/`)
- Nomenclatura PascalCase para tipos/interfaces
- Evitar `any`, preferir tipos específicos ou `unknown`

### 4.2 Componentes React

```typescript
// Padrão: Functional component com arrow function
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ 
  label, 
  onClick, 
  variant = 'primary' 
}: ButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className={variant === 'primary' ? 'bg-primary-500' : 'bg-gray-500'}
    >
      {label}
    </button>
  );
};
```

### 4.3 Barrel Exports (index.ts)

```typescript
// src/components/index.ts
export * from './Button';
export * from './Card';
export * from './LoadingSpinner';
export * from './ErrorMessage';
```

### 4.4 Custom Hooks

- Prefixo `use` obrigatório
- Retornar objeto com valores nomeados
- Gerenciar estados de loading/error internamente

```typescript
export const useData = () => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ...

  return { data, loading, error };
};
```

---

## 5. Sistema de Design

### 5.1 Estilos Globais (index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Tipografia Fluida - escala suave entre mobile e desktop */
html {
  /* Base: 14px em 320px → 16px em 1280px */
  font-size: clamp(0.875rem, 0.8rem + 0.25vw, 1rem);
}

body {
  @apply bg-gray-50 min-h-screen antialiased;
  line-height: 1.5;
}

/* Classes de tipografia fluida */
.text-fluid-xs {
  font-size: clamp(0.625rem, 0.55rem + 0.25vw, 0.75rem);
}

.text-fluid-sm {
  font-size: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
}

.text-fluid-base {
  font-size: clamp(0.875rem, 0.8rem + 0.25vw, 1rem);
}

.text-fluid-lg {
  font-size: clamp(1rem, 0.9rem + 0.35vw, 1.125rem);
}

.text-fluid-xl {
  font-size: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);
}

.text-fluid-2xl {
  font-size: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
}
```

### 5.2 Breakpoints Tailwind

| Breakpoint | Largura mínima | Uso |
|------------|----------------|-----|
| sm | 640px | Tablets pequenos |
| md | 768px | Tablets |
| lg | 1024px | Desktop |
| xl | 1280px | Desktop grande |
| 2xl | 1536px | Monitores grandes |

### 5.3 Padrões de Layout

**Container:**
```jsx
<div className="max-w-7xl mx-auto px-4">
```

**Grid responsivo:**
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```

**Cards:**
```jsx
<div className="rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white p-4">
```

**Destaque:**
```jsx
<div className="ring-2 ring-primary-500">
```

### 5.4 Paleta de Cores (Uso)

| Token | Uso recomendado |
|-------|-----------------|
| primary-50 | Backgrounds claros |
| primary-100 | Bordas sutis |
| primary-200 | Bordas, hovers |
| primary-500 | Cor principal (botões, badges) |
| primary-600 | Texto médio |
| primary-700 | Texto destaque |
| primary-800 | Texto escuro |

---

## 6. Carregamento de Dados

### 6.1 Lazy Loading com Dynamic Import

```typescript
const loadData = async (id: string) => {
  const data = await import(`../data/${id}.json`);
  return data.default;
};
```

### 6.2 Persistência com localStorage

```typescript
// Salvar
localStorage.setItem('userPreference', JSON.stringify(value));

// Carregar
const stored = localStorage.getItem('userPreference');
const value = stored ? JSON.parse(stored) : defaultValue;
```

### 6.3 Hook com localStorage

```typescript
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue] as const;
};
```

---

## 7. Acessibilidade (a11y)

| Requisito | Implementação |
|-----------|---------------|
| Inputs mobile | `font-size: 16px` mínimo (evita zoom iOS) |
| Ícones | Sempre com `aria-label` descritivo |
| Toggles/Switches | `role="switch"` + `aria-checked` |
| Labels | Associados via `htmlFor` ou aninhamento |
| Foco | Estados `:focus-visible` visíveis |
| Contraste | Mínimo 4.5:1 para texto |
| Navegação | Suporte a teclado (Tab, Enter, Escape) |

**Exemplo de toggle acessível:**

```jsx
<button
  role="switch"
  aria-checked={isEnabled}
  aria-label="Ativar modo escuro"
  onClick={() => setIsEnabled(!isEnabled)}
  className="..."
>
  {/* conteúdo */}
</button>
```

---

## 8. Scripts NPM

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento (Hot Reload) |
| `npm run build` | Compila TypeScript e gera build de produção |
| `npm run lint` | Executa verificação ESLint |
| `npm run preview` | Serve build de produção localmente |

---

## 9. Deploy

### 9.1 Build de Produção

```bash
npm run build
```

Gera pasta `dist/` com:
- `index.html` (otimizado)
- Assets hasheados em `dist/assets/`
- Arquivos de `public/` copiados

### 9.2 Hospedagem Estática

Compatível com:
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

### 9.3 GitHub Pages

1. Criar arquivo `public/CNAME` com domínio
2. Configurar GitHub Actions ou deploy manual
3. Habilitar GitHub Pages no repositório

---

## 10. Performance

### 10.1 Otimizações Automáticas (Vite)

- Tree shaking
- Code splitting automático
- Minificação (esbuild/terser)
- Hashing de assets para cache

### 10.2 Boas Práticas

- Usar `React.lazy()` para componentes grandes
- Implementar loading states
- Otimizar imagens (WebP, lazy loading)
- Evitar re-renders desnecessários (`useMemo`, `useCallback`)

---

## 11. Estrutura de Arquivos Essenciais

### 11.1 index.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Descrição do projeto" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Meu Projeto</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 11.2 main.tsx

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### 11.3 App.tsx

```typescript
const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Conteúdo */}
      </main>
    </div>
  );
};

export default App;
```

---

## 12. Checklist de Novo Projeto

- [ ] Criar projeto com `npm create vite@latest`
- [ ] Instalar dependências: `npm install`
- [ ] Configurar Tailwind CSS
- [ ] Definir paleta de cores customizada
- [ ] Criar estrutura de diretórios (`components/`, `hooks/`, `types/`, etc.)
- [ ] Configurar ESLint
- [ ] Adicionar tipografia fluida no CSS
- [ ] Criar componentes base (LoadingSpinner, ErrorMessage)
- [ ] Implementar barrel exports
- [ ] Testar build de produção
- [ ] Configurar deploy
