-- ============================================================================
-- LITRÔMETRO - Schema Supabase (PostgreSQL)
-- Versão: 2.0 - Schema Normalizado
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. TABELA: municipios
-- Cadastro dos 102 municípios de Alagoas
-- ============================================================================
CREATE TABLE IF NOT EXISTS municipios (
  codigo_ibge VARCHAR(7) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  uf CHAR(2) NOT NULL DEFAULT 'AL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE municipios IS 'Cadastro dos municípios de Alagoas (102 registros)';
COMMENT ON COLUMN municipios.codigo_ibge IS 'Código IBGE do município (7 dígitos)';

-- ============================================================================
-- 2. TABELA: estabelecimentos
-- Postos de combustível únicos por CNPJ
-- ============================================================================
CREATE TABLE IF NOT EXISTS estabelecimentos (
  cnpj VARCHAR(14) PRIMARY KEY,
  razao_social VARCHAR(150) NOT NULL,
  nome_fantasia VARCHAR(150),
  telefone VARCHAR(21),
  nome_logradouro VARCHAR(80),
  numero_imovel VARCHAR(7),
  bairro VARCHAR(50),
  cep VARCHAR(8),
  codigo_ibge VARCHAR(7) NOT NULL REFERENCES municipios(codigo_ibge),
  latitude DECIMAL(17, 15),
  longitude DECIMAL(18, 15),
  geocode_source VARCHAR(20) DEFAULT 'sefaz',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE estabelecimentos IS 'Postos de combustível únicos (~500 registros)';
COMMENT ON COLUMN estabelecimentos.geocode_source IS 'Origem das coordenadas: sefaz, google, manual';

-- Índices para estabelecimentos
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_municipio ON estabelecimentos(codigo_ibge);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_geo ON estabelecimentos(latitude, longitude);

-- ============================================================================
-- 2.1 TABELAS: geocoding separado do cadastro
-- Camada oficial de geografia para reduzir conflitos com coleta de preço
-- ============================================================================
CREATE TABLE IF NOT EXISTS estabelecimento_geo_current (
  cnpj VARCHAR(14) PRIMARY KEY REFERENCES estabelecimentos(cnpj) ON DELETE CASCADE,
  latitude DECIMAL(17, 15) NOT NULL,
  longitude DECIMAL(18, 15) NOT NULL,
  geocode_source VARCHAR(30) NOT NULL,
  prioridade_fonte SMALLINT NOT NULL DEFAULT 0,
  confianca NUMERIC(5, 4),
  validado_manual BOOLEAN NOT NULL DEFAULT FALSE,
  observacao TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE estabelecimento_geo_current IS 'Coordenada atual consolidada por CNPJ (fonte oficial de geografia)';
COMMENT ON COLUMN estabelecimento_geo_current.prioridade_fonte IS 'Prioridade da fonte para evitar sobrescrita por origem menos confiável';

CREATE INDEX IF NOT EXISTS idx_geo_current_source ON estabelecimento_geo_current(geocode_source);

CREATE TABLE IF NOT EXISTS estabelecimento_geo_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj VARCHAR(14) NOT NULL REFERENCES estabelecimentos(cnpj) ON DELETE CASCADE,
  latitude DECIMAL(17, 15) NOT NULL,
  longitude DECIMAL(18, 15) NOT NULL,
  geocode_source VARCHAR(30) NOT NULL,
  confianca NUMERIC(5, 4),
  observacao TEXT,
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE estabelecimento_geo_event IS 'Histórico de alterações de geocoding por CNPJ';

CREATE INDEX IF NOT EXISTS idx_geo_event_cnpj_data ON estabelecimento_geo_event(cnpj, registrado_em DESC);

-- ============================================================================
-- 3. TABELA: precos_atuais
-- Snapshot atual de preços (substitui atual.json)
-- ============================================================================
CREATE TABLE IF NOT EXISTS precos_atuais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj VARCHAR(14) NOT NULL REFERENCES estabelecimentos(cnpj) ON DELETE CASCADE,
  tipo_combustivel SMALLINT NOT NULL CHECK (tipo_combustivel BETWEEN 1 AND 6),
  valor_minimo DECIMAL(10, 4) NOT NULL,
  valor_maximo DECIMAL(10, 4) NOT NULL,
  valor_medio DECIMAL(10, 4) NOT NULL,
  valor_recente DECIMAL(10, 4) NOT NULL,
  data_recente TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_preco_estabelecimento_combustivel UNIQUE (cnpj, tipo_combustivel)
);

COMMENT ON TABLE precos_atuais IS 'Preços atuais por estabelecimento/combustível (~1.852 registros)';
COMMENT ON COLUMN precos_atuais.tipo_combustivel IS '1=Gasolina, 2=Gasolina Aditivada, 3=Etanol, 4=Diesel, 5=Diesel S10, 6=GNV';
COMMENT ON COLUMN precos_atuais.valor_minimo IS 'Menor valor dos últimos 10 dias';
COMMENT ON COLUMN precos_atuais.valor_maximo IS 'Maior valor dos últimos 10 dias';
COMMENT ON COLUMN precos_atuais.valor_medio IS 'Média dos últimos 10 dias';
COMMENT ON COLUMN precos_atuais.valor_recente IS 'Valor da venda mais recente';

-- Índices para precos_atuais
CREATE INDEX IF NOT EXISTS idx_precos_tipo ON precos_atuais(tipo_combustivel);
CREATE INDEX IF NOT EXISTS idx_precos_valor ON precos_atuais(tipo_combustivel, valor_recente);
CREATE INDEX IF NOT EXISTS idx_precos_cnpj ON precos_atuais(cnpj);

-- ============================================================================
-- 4. TABELA: vendas_historico
-- Histórico de vendas individuais (substitui historico/*.json)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj VARCHAR(14) NOT NULL REFERENCES estabelecimentos(cnpj) ON DELETE CASCADE,
  tipo_combustivel SMALLINT NOT NULL CHECK (tipo_combustivel BETWEEN 1 AND 6),
  valor_venda DECIMAL(10, 4) NOT NULL,
  data_venda TIMESTAMPTZ NOT NULL,
  coletado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Deduplicação: mesma venda não é inserida duas vezes
  CONSTRAINT unique_venda UNIQUE (cnpj, tipo_combustivel, data_venda, valor_venda)
);

COMMENT ON TABLE vendas_historico IS 'Histórico de vendas individuais (~10k-50k registros/dia)';
COMMENT ON COLUMN vendas_historico.valor_venda IS 'Valor unitário da venda em R$';
COMMENT ON COLUMN vendas_historico.data_venda IS 'Timestamp exato da venda (da API SEFAZ)';

-- Índices para vendas_historico
CREATE INDEX IF NOT EXISTS idx_historico_data ON vendas_historico(data_venda DESC);
CREATE INDEX IF NOT EXISTS idx_historico_cnpj_tipo ON vendas_historico(cnpj, tipo_combustivel);
CREATE INDEX IF NOT EXISTS idx_historico_coletado ON vendas_historico(coletado_em DESC);

-- ============================================================================
-- 5. TABELA: coletas_log
-- Log de execuções de coleta para auditoria
-- ============================================================================
CREATE TABLE IF NOT EXISTS coletas_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalizado_em TIMESTAMPTZ,
  total_vendas INTEGER DEFAULT 0,
  total_estabelecimentos INTEGER DEFAULT 0,
  total_municipios INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'error')),
  erro TEXT
);

COMMENT ON TABLE coletas_log IS 'Log de execuções de coleta para auditoria';

-- Índice para coletas_log
CREATE INDEX IF NOT EXISTS idx_coletas_iniciado ON coletas_log(iniciado_em DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estabelecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estabelecimento_geo_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE estabelecimento_geo_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE precos_atuais ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE coletas_log ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (SELECT)
CREATE POLICY "Leitura pública municipios" ON municipios FOR SELECT USING (true);
CREATE POLICY "Leitura pública estabelecimentos" ON estabelecimentos FOR SELECT USING (true);
CREATE POLICY "Leitura pública geocurrent" ON estabelecimento_geo_current FOR SELECT USING (true);
CREATE POLICY "Leitura pública geoevent" ON estabelecimento_geo_event FOR SELECT USING (true);
CREATE POLICY "Leitura pública precos" ON precos_atuais FOR SELECT USING (true);
CREATE POLICY "Leitura pública historico" ON vendas_historico FOR SELECT USING (true);
CREATE POLICY "Leitura pública coletas" ON coletas_log FOR SELECT USING (true);

-- Políticas de escrita apenas para service_role
CREATE POLICY "Escrita service_role municipios" ON municipios FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Escrita service_role estabelecimentos" ON estabelecimentos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Escrita service_role geocurrent" ON estabelecimento_geo_current FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Escrita service_role geoevent" ON estabelecimento_geo_event FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Escrita service_role precos" ON precos_atuais FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Escrita service_role historico" ON vendas_historico FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Escrita service_role coletas" ON coletas_log FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS: Atualização automática de updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Upsert de geocoding com proteção por prioridade de fonte
CREATE OR REPLACE FUNCTION upsert_estabelecimento_geo(
  p_cnpj VARCHAR(14),
  p_lat DECIMAL(17, 15),
  p_lng DECIMAL(18, 15),
  p_source VARCHAR(30),
  p_prioridade SMALLINT,
  p_confianca NUMERIC(5, 4),
  p_obs TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO estabelecimento_geo_event (
    cnpj,
    latitude,
    longitude,
    geocode_source,
    confianca,
    observacao
  ) VALUES (
    p_cnpj,
    p_lat,
    p_lng,
    p_source,
    p_confianca,
    p_obs
  );

  INSERT INTO estabelecimento_geo_current (
    cnpj,
    latitude,
    longitude,
    geocode_source,
    prioridade_fonte,
    confianca,
    observacao,
    atualizado_em
  ) VALUES (
    p_cnpj,
    p_lat,
    p_lng,
    p_source,
    p_prioridade,
    p_confianca,
    p_obs,
    NOW()
  )
  ON CONFLICT (cnpj) DO UPDATE
  SET latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      geocode_source = EXCLUDED.geocode_source,
      prioridade_fonte = EXCLUDED.prioridade_fonte,
      confianca = EXCLUDED.confianca,
      observacao = EXCLUDED.observacao,
      atualizado_em = EXCLUDED.atualizado_em
  WHERE EXCLUDED.prioridade_fonte >= estabelecimento_geo_current.prioridade_fonte;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_estabelecimentos_updated_at
  BEFORE UPDATE ON estabelecimentos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_precos_updated_at
  BEFORE UPDATE ON precos_atuais
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at();

-- ============================================================================
-- VIEWS: Consultas otimizadas para o frontend
-- ============================================================================

-- View: Preços com dados do estabelecimento (substitui atual.json)
CREATE OR REPLACE VIEW v_precos_completos AS
SELECT 
  e.cnpj,
  p.tipo_combustivel,
  e.razao_social,
  e.nome_fantasia,
  e.telefone,
  e.nome_logradouro,
  e.numero_imovel,
  e.bairro,
  e.cep,
  e.codigo_ibge,
  m.nome as municipio,
  e.latitude,
  e.longitude,
  p.valor_minimo,
  p.valor_maximo,
  p.valor_medio,
  p.valor_recente,
  p.data_recente,
  p.updated_at
FROM precos_atuais p
JOIN estabelecimentos e ON p.cnpj = e.cnpj
JOIN municipios m ON e.codigo_ibge = m.codigo_ibge;

COMMENT ON VIEW v_precos_completos IS 'Preços com dados completos do estabelecimento (compatível com atual.json)';

-- View v2: prioriza camada separada de geocoding quando disponível
CREATE OR REPLACE VIEW v_precos_completos_v2 AS
SELECT
  e.cnpj,
  p.tipo_combustivel,
  e.razao_social,
  e.nome_fantasia,
  e.telefone,
  e.nome_logradouro,
  e.numero_imovel,
  e.bairro,
  e.cep,
  e.codigo_ibge,
  m.nome as municipio,
  COALESCE(g.latitude, e.latitude) as latitude,
  COALESCE(g.longitude, e.longitude) as longitude,
  COALESCE(g.geocode_source, e.geocode_source) as geocode_source,
  p.valor_minimo,
  p.valor_maximo,
  p.valor_medio,
  p.valor_recente,
  p.data_recente,
  p.updated_at
FROM precos_atuais p
JOIN estabelecimentos e ON p.cnpj = e.cnpj
JOIN municipios m ON e.codigo_ibge = m.codigo_ibge
LEFT JOIN estabelecimento_geo_current g ON g.cnpj = e.cnpj;

COMMENT ON VIEW v_precos_completos_v2 IS 'Preços com coordenadas da camada geo separada (fallback para estabelecimentos)';

-- View: Resumo por município (substitui municipios/*.json)
CREATE OR REPLACE VIEW v_resumo_municipios AS
SELECT 
  m.codigo_ibge,
  m.nome as municipio,
  p.tipo_combustivel,
  COUNT(DISTINCT e.cnpj) as total_postos,
  MIN(p.valor_recente) as valor_minimo,
  MAX(p.valor_recente) as valor_maximo,
  AVG(p.valor_recente) as valor_medio
FROM municipios m
JOIN estabelecimentos e ON m.codigo_ibge = e.codigo_ibge
JOIN precos_atuais p ON e.cnpj = p.cnpj
GROUP BY m.codigo_ibge, m.nome, p.tipo_combustivel;

COMMENT ON VIEW v_resumo_municipios IS 'Resumo de preços por município (compatível com municipios/*.json)';

-- View: Estatísticas gerais
CREATE OR REPLACE VIEW v_estatisticas AS
SELECT 
  COUNT(DISTINCT e.cnpj) as total_estabelecimentos,
  COUNT(DISTINCT e.codigo_ibge) as total_municipios,
  MAX(p.updated_at) as atualizado_em
FROM estabelecimentos e
JOIN precos_atuais p ON e.cnpj = p.cnpj;

COMMENT ON VIEW v_estatisticas IS 'Estatísticas gerais do sistema';
