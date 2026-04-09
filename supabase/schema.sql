-- Tabela principal de preços de combustíveis
-- Execute este SQL no Supabase SQL Editor

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
  
  -- Índice único para evitar duplicatas
  CONSTRAINT unique_estabelecimento_combustivel UNIQUE (cnpj, tipo_combustivel)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_precos_tipo_combustivel ON precos_combustiveis(tipo_combustivel);
CREATE INDEX IF NOT EXISTS idx_precos_municipio ON precos_combustiveis(codigo_ibge);
CREATE INDEX IF NOT EXISTS idx_precos_valor_recente ON precos_combustiveis(tipo_combustivel, valor_recente);

-- Habilitar Row Level Security
ALTER TABLE precos_combustiveis ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (qualquer um pode ler)
CREATE POLICY "Permitir leitura pública" ON precos_combustiveis
  FOR SELECT USING (true);

-- Política de escrita apenas para service role (usado pelo script)
CREATE POLICY "Permitir escrita via service role" ON precos_combustiveis
  FOR ALL USING (auth.role() = 'service_role');

-- Função para atualizar atualizado_em automaticamente
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
