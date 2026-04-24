-- ============================================================================
-- LITROMETRO - MIGRACAO INCREMENTAL (2026-04-24)
-- Separacao de geografia + view de consolidacao v2
-- ============================================================================

BEGIN;

-- 1) Camada de geografia consolidada
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

CREATE INDEX IF NOT EXISTS idx_geo_current_source
  ON estabelecimento_geo_current(geocode_source);

-- 2) Camada de eventos de geografia (auditoria)
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

CREATE INDEX IF NOT EXISTS idx_geo_event_cnpj_data
  ON estabelecimento_geo_event(cnpj, registrado_em DESC);

-- 3) RLS + policies (idempotente)
ALTER TABLE estabelecimento_geo_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE estabelecimento_geo_event ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'estabelecimento_geo_current'
      AND policyname = 'Leitura pública geocurrent'
  ) THEN
    CREATE POLICY "Leitura pública geocurrent"
      ON estabelecimento_geo_current
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'estabelecimento_geo_event'
      AND policyname = 'Leitura pública geoevent'
  ) THEN
    CREATE POLICY "Leitura pública geoevent"
      ON estabelecimento_geo_event
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'estabelecimento_geo_current'
      AND policyname = 'Escrita service_role geocurrent'
  ) THEN
    CREATE POLICY "Escrita service_role geocurrent"
      ON estabelecimento_geo_current
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'estabelecimento_geo_event'
      AND policyname = 'Escrita service_role geoevent'
  ) THEN
    CREATE POLICY "Escrita service_role geoevent"
      ON estabelecimento_geo_event
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END;
$$;

-- 4) Funcao de upsert de geografia com prioridade de fonte
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

-- 5) Backfill inicial a partir do modelo legado
INSERT INTO estabelecimento_geo_current (
  cnpj,
  latitude,
  longitude,
  geocode_source,
  prioridade_fonte,
  validado_manual,
  atualizado_em
)
SELECT
  cnpj,
  latitude,
  longitude,
  COALESCE(geocode_source, 'sefaz') AS geocode_source,
  CASE
    WHEN geocode_source = 'manual' THEN 100
    WHEN geocode_source = 'google-maps-poi' THEN 90
    WHEN geocode_source = 'google' THEN 80
    WHEN geocode_source = 'google-maps-search' THEN 70
    WHEN geocode_source = 'locationiq' THEN 65
    WHEN geocode_source = 'opencage' THEN 60
    WHEN geocode_source = 'nominatim' THEN 50
    ELSE 10
  END AS prioridade_fonte,
  (geocode_source = 'manual') AS validado_manual,
  NOW() AS atualizado_em
FROM estabelecimentos
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
ON CONFLICT (cnpj) DO UPDATE
SET latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    geocode_source = EXCLUDED.geocode_source,
    prioridade_fonte = EXCLUDED.prioridade_fonte,
    validado_manual = EXCLUDED.validado_manual,
    atualizado_em = EXCLUDED.atualizado_em;

-- 6) View de consolidacao v2 para export
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
  m.nome AS municipio,
  COALESCE(g.latitude, e.latitude) AS latitude,
  COALESCE(g.longitude, e.longitude) AS longitude,
  COALESCE(g.geocode_source, e.geocode_source) AS geocode_source,
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

COMMIT;
