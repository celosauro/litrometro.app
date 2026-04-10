# Deploy no GitHub Pages com Domínio Personalizado (Cloudflare)

Este guia explica como configurar o deploy automático do Litrômetro no GitHub Pages com um domínio personalizado gerenciado pelo Cloudflare.

---

## Pré-requisitos

- Repositório no GitHub
- Domínio registrado e gerenciado pelo Cloudflare
- Acesso ao painel do Cloudflare

---

## Parte 1: Configurar GitHub Pages

### 1.1 Habilitar GitHub Pages no Repositório

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Pages**
3. Em **Source**, selecione **GitHub Actions**

### 1.2 Criar Workflow de Deploy

O workflow já está configurado em `.github/workflows/deploy.yml`. Ele:
- Faz build da aplicação com Vite
- Publica no GitHub Pages automaticamente em cada push na branch `main`

---

## Parte 2: Configurar Domínio no Cloudflare

### 2.1 Adicionar Registros DNS

No painel do Cloudflare, vá em **DNS** → **Records** e adicione:

#### Opção A: Domínio raiz (litrometro.app)

| Tipo | Nome | Conteúdo | Proxy | TTL |
|------|------|----------|-------|-----|
| A | @ | 185.199.108.153 | DNS only | Auto |
| A | @ | 185.199.109.153 | DNS only | Auto |
| A | @ | 185.199.110.153 | DNS only | Auto |
| A | @ | 185.199.111.153 | DNS only | Auto |

#### Opção B: Subdomínio www (www.litrometro.app)

| Tipo | Nome | Conteúdo | Proxy | TTL |
|------|------|----------|-------|-----|
| CNAME | www | celosauro.github.io | DNS only | Auto |

> ⚠️ **Importante:** Configure como **DNS only** (nuvem cinza), não "Proxied" (nuvem laranja). O GitHub Pages precisa gerenciar o SSL.

> 💡 **Domínios .app:** Estes domínios **exigem HTTPS** por padrão (HSTS preloaded). O GitHub Pages gera o certificado automaticamente.

### 2.2 Configurar SSL/TLS no Cloudflare

1. Vá em **SSL/TLS** → **Overview**
2. Selecione **Full** (não Full Strict)
3. Em **Edge Certificates**, certifique-se que **Always Use HTTPS** está ativado

---

## Parte 3: Configurar Domínio no GitHub

### 3.1 Adicionar Domínio Personalizado

1. Vá em **Settings** → **Pages**
2. Em **Custom domain**, digite: `litrometro.app`
3. Clique em **Save**
4. Aguarde a verificação DNS (pode levar alguns minutos)
5. Marque **Enforce HTTPS** quando disponível

### 3.2 Criar Arquivo CNAME

O arquivo `public/CNAME` já está configurado com `litrometro.app`. Este arquivo é copiado automaticamente para a pasta de build.

---

## Parte 4: Verificar Deploy

### 4.1 Executar Deploy Manual

1. Vá em **Actions** → **Deploy to GitHub Pages**
2. Clique em **Run workflow** → **Run workflow**
3. Aguarde o workflow completar (geralmente 1-2 minutos)

### 4.2 Verificar Propagação DNS

Use estas ferramentas para verificar:
- https://dnschecker.org (verifique registros A ou CNAME)
- https://www.whatsmydns.net

A propagação pode levar de 5 minutos a 48 horas, mas geralmente é rápida com Cloudflare.

### 4.3 Testar Acesso

Após a propagação, acesse:
- `https://litrometro.app`
- `https://www.litrometro.app` (se configurou www)

---

## Troubleshooting

### Erro: "DNS check unsuccessful"

- Verifique se os registros DNS estão corretos no Cloudflare
- Certifique-se que o proxy está **desativado** (DNS only)
- Aguarde alguns minutos para propagação

### Erro: "Certificate not yet created"

- O GitHub leva até 15 minutos para gerar o certificado SSL
- Verifique se o DNS está propagado corretamente

### Erro 404 após deploy

- Verifique se o arquivo `CNAME` está na pasta `public/`
- Verifique se o workflow completou sem erros
- Confirme que o domínio está configurado em Settings → Pages

### Site não carrega com HTTPS

- No Cloudflare, SSL/TLS deve estar em **Full** (não Off ou Flexible)
- Aguarde o GitHub gerar o certificado

---

## Estrutura de Arquivos Relevantes

```
litrometro/
├── .github/
│   └── workflows/
│       ├── deploy.yml        # Deploy para GitHub Pages
│       └── collect-data.yml  # Coleta de preços (já existente)
├── public/
│   ├── CNAME                 # Seu domínio personalizado
│   └── dados/                # Dados coletados
├── vite.config.ts            # Configuração do Vite (base path)
└── ...
```

---

## Referências

- [GitHub Pages Custom Domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Cloudflare DNS Records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
- [GitHub Pages IP Addresses](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain)
