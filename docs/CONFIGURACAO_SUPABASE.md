# Configuração do Supabase para o Litrômetro

Este guia explica como configurar o Supabase para conectar a aplicação Litrômetro.

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **New Project**
3. Preencha os dados:
   - **Name**: `litrometro` (ou outro nome de sua preferência)
   - **Database Password**: Crie uma senha forte (guarde-a!)
   - **Region**: Escolha a região mais próxima (ex: `South America (São Paulo)`)
4. Clique em **Create new project** e aguarde a criação (~2 minutos)

---

## 2. Criar a Tabela de Preços

Após o projeto ser criado:

1. No menu lateral, vá em **SQL Editor**
2. Clique em **New query**
3. Cole o conteúdo do arquivo `supabase/schema.sql` deste projeto:

```sql
-- Tabela principal de preços de combustíveis
CREATE TABLE IF NOT EXISTS precos_combustiveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj VARCHAR(14) NOT NULL,
  tipo_combustivel SMALLINT NOT NULL CHECK (tipo_combustivel BETWEEN 1 AND 6),
  razao_social VARCHAR(150) NOT NULL,
  nome_fantasia VARCHAR(150),
  telefone VARCHAR(21),
  nome_logradouro VARCHAR(80),
  numero_imovel VARCHAR(7),
  bairro VARCHAR(50),
  cep VARCHAR(8),
  codigo_ibge VARCHAR(7) NOT NULL,
  municipio VARCHAR(100) NOT NULL,
  latitude DECIMAL(17, 15),
  longitude DECIMAL(18, 15),
  valor_minimo DECIMAL(10, 4) NOT NULL,
  valor_maximo DECIMAL(10, 4) NOT NULL,
  valor_medio DECIMAL(10, 4) NOT NULL,
  valor_recente DECIMAL(10, 4) NOT NULL,
  data_recente TIMESTAMPTZ NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_estabelecimento_combustivel UNIQUE (cnpj, tipo_combustivel)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_precos_tipo_combustivel ON precos_combustiveis(tipo_combustivel);
CREATE INDEX IF NOT EXISTS idx_precos_municipio ON precos_combustiveis(codigo_ibge);
CREATE INDEX IF NOT EXISTS idx_precos_valor_recente ON precos_combustiveis(tipo_combustivel, valor_recente);

-- Habilitar Row Level Security
ALTER TABLE precos_combustiveis ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Permitir leitura pública" ON precos_combustiveis
  FOR SELECT USING (true);

-- Política de escrita via service role
CREATE POLICY "Permitir escrita via service role" ON precos_combustiveis
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION atualizar_coluna_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER atualizar_precos_combustiveis_atualizado_em
  BEFORE UPDATE ON precos_combustiveis
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_coluna_atualizado_em();
```

4. Clique em **Run** para executar o SQL

---

## 3. Obter as Credenciais

### 3.1 Para o Frontend (chave pública)

1. No menu lateral, vá em **Project Settings** (ícone de engrenagem)
2. Clique em **API** no submenu
3. Copie os valores:

| Campo | Descrição |
|-------|-----------|
| **Project URL** | URL do projeto (ex: `https://xxxxx.supabase.co`) |
| **anon public** | Chave pública para o frontend |

### 3.2 Para o Script de Coleta (chave privada)

Na mesma página de API, copie também:

| Campo | Descrição |
|-------|-----------|
| **service_role** | Chave privada para o backend (⚠️ NUNCA exponha no frontend!) |

---

## 4. Configurar Variáveis de Ambiente

### 4.1 Desenvolvimento Local

Crie um arquivo `.env` na raiz do projeto (copie do `.env.example`):

```bash
# Frontend (Vite)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Script de coleta (rodar localmente para testes)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-role-key-aqui
SEFAZ_APP_TOKEN=seu-token-sefaz-aqui
```

### 4.2 GitHub Actions (Produção)

Configure os **Secrets** no repositório GitHub:

1. Vá no repositório → **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret**
3. Adicione os seguintes secrets:

| Secret Name | Valor |
|-------------|-------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key |
| `SEFAZ_APP_TOKEN` | Token da API SEFAZ/AL |

### 4.3 Deploy do Frontend (Vercel/Netlify)

Configure as variáveis de ambiente no painel do serviço de deploy:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key (pública) |

---

## 5. Estrutura da Tabela

### Campos da tabela `precos_combustiveis`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único (gerado automaticamente) |
| `cnpj` | VARCHAR(14) | CNPJ do estabelecimento |
| `tipo_combustivel` | SMALLINT | 1=Gasolina, 2=Gasolina Adit., 3=Álcool, 4=Diesel, 5=Diesel S10, 6=GNV |
| `razao_social` | VARCHAR(150) | Razão social do estabelecimento |
| `nome_fantasia` | VARCHAR(150) | Nome fantasia |
| `telefone` | VARCHAR(21) | Telefone de contato |
| `nome_logradouro` | VARCHAR(80) | Nome da rua |
| `numero_imovel` | VARCHAR(7) | Número do imóvel |
| `bairro` | VARCHAR(50) | Bairro |
| `cep` | VARCHAR(8) | CEP |
| `codigo_ibge` | VARCHAR(7) | Código IBGE do município |
| `municipio` | VARCHAR(100) | Nome do município |
| `latitude` | DECIMAL | Latitude do estabelecimento |
| `longitude` | DECIMAL | Longitude do estabelecimento |
| `valor_minimo` | DECIMAL | Menor preço registrado |
| `valor_maximo` | DECIMAL | Maior preço registrado |
| `valor_medio` | DECIMAL | Preço médio |
| `valor_recente` | DECIMAL | Preço mais recente |
| `data_recente` | TIMESTAMPTZ | Data/hora do preço mais recente |
| `atualizado_em` | TIMESTAMPTZ | Última atualização do registro |

---

## 6. Políticas de Segurança (RLS)

A tabela usa Row Level Security com duas políticas:

### Leitura Pública
```sql
CREATE POLICY "Permitir leitura pública" ON precos_combustiveis
  FOR SELECT USING (true);
```
→ Qualquer pessoa pode ler os dados (necessário para o frontend funcionar)

### Escrita Restrita
```sql
CREATE POLICY "Permitir escrita via service role" ON precos_combustiveis
  FOR ALL USING (auth.role() = 'service_role');
```
→ Apenas o script de coleta (usando a service_role key) pode inserir/atualizar dados

---

## 7. Testando a Conexão

### Frontend
```bash
npm run dev
```
Abra o navegador e verifique se os dados carregam (inicialmente vazio).

### Script de Coleta
```bash
npm run collect
```
Executa a coleta de dados da API SEFAZ/AL e salva no Supabase.

---

## 8. Monitoramento

### Verificar Dados no Supabase

1. No menu lateral, vá em **Table Editor**
2. Selecione a tabela `precos_combustiveis`
3. Visualize os registros inseridos

### Logs de API

1. Vá em **Logs** → **API**
2. Monitore as requisições ao banco de dados

### Métricas de Uso

1. Vá em **Reports** → **Database**
2. Acompanhe queries, conexões e performance

---

## 9. Limites do Plano Gratuito

O Supabase Free Tier inclui:

- ✅ 500 MB de banco de dados
- ✅ 1 GB de bandwidth/mês
- ✅ 50.000 requisições de autenticação/mês
- ✅ 50 MB de storage
- ⚠️ Pausa após 7 dias de inatividade (reativa automaticamente)

Para produção com alto volume, considere o plano Pro ($25/mês).

---

## Troubleshooting

### Erro: "relation 'precos_combustiveis' does not exist"
→ Execute o SQL do schema no SQL Editor

### Erro: "new row violates row-level security policy"
→ Verifique se está usando a `service_role` key no script de coleta

### Erro: "Invalid API key"
→ Confira se as variáveis de ambiente estão corretas

### Dados não aparecem no frontend
→ Verifique se a política de leitura pública foi criada
