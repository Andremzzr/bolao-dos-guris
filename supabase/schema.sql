-- ============================================
-- Bolão Copa do Mundo 2026
-- Script SQL para Supabase (PostgreSQL)
-- ============================================

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Resultados (preenchida manualmente pelo admin)
CREATE TABLE IF NOT EXISTS resultados (
  jogo_id INTEGER PRIMARY KEY,
  gols_mandante INTEGER NOT NULL DEFAULT 0,
  gols_visitante INTEGER NOT NULL DEFAULT 0,
  finalizado BOOLEAN DEFAULT false
);

-- 3. Tabela de Palpites
CREATE TABLE IF NOT EXISTS palpites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  jogo_id INTEGER NOT NULL,
  gols_mandante INTEGER NOT NULL DEFAULT 0,
  gols_visitante INTEGER NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (usuario_id, jogo_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_palpites_usuario ON palpites(usuario_id);
CREATE INDEX IF NOT EXISTS idx_palpites_jogo ON palpites(jogo_id);
CREATE INDEX IF NOT EXISTS idx_resultados_finalizado ON resultados(finalizado);

-- ============================================
-- 4. View de Ranking (Classificação)
-- Pontuação: 25 (exato) / 18 (vencedor+saldo) / 10 (vencedor) / 0 (erro)
-- ============================================
CREATE OR REPLACE VIEW view_ranking AS
SELECT
  u.id AS usuario_id,
  u.nome,
  COALESCE(SUM(
    CASE
      -- Acerto exato do placar: 25 pontos
      WHEN p.gols_mandante = r.gols_mandante
        AND p.gols_visitante = r.gols_visitante
      THEN 25

      -- Acerto do vencedor + saldo de gols: 18 pontos
      WHEN SIGN(p.gols_mandante - p.gols_visitante) = SIGN(r.gols_mandante - r.gols_visitante)
        AND (p.gols_mandante - p.gols_visitante) = (r.gols_mandante - r.gols_visitante)
      THEN 18

      -- Acerto apenas do vencedor/empate: 10 pontos
      WHEN SIGN(p.gols_mandante - p.gols_visitante) = SIGN(r.gols_mandante - r.gols_visitante)
      THEN 10

      -- Erro total: 0 pontos
      ELSE 0
    END
  ), 0)::INTEGER AS pontos,

  -- Estatísticas detalhadas
  COUNT(CASE
    WHEN r.finalizado = true
      AND p.gols_mandante = r.gols_mandante
      AND p.gols_visitante = r.gols_visitante
    THEN 1
  END)::INTEGER AS acertos_exatos,

  COUNT(CASE
    WHEN r.finalizado = true
      AND SIGN(p.gols_mandante - p.gols_visitante) = SIGN(r.gols_mandante - r.gols_visitante)
      AND (p.gols_mandante - p.gols_visitante) = (r.gols_mandante - r.gols_visitante)
      AND NOT (p.gols_mandante = r.gols_mandante AND p.gols_visitante = r.gols_visitante)
    THEN 1
  END)::INTEGER AS acertos_saldo,

  COUNT(CASE
    WHEN r.finalizado = true
      AND SIGN(p.gols_mandante - p.gols_visitante) = SIGN(r.gols_mandante - r.gols_visitante)
      AND (p.gols_mandante - p.gols_visitante) != (r.gols_mandante - r.gols_visitante)
    THEN 1
  END)::INTEGER AS acertos_vencedor,

  COUNT(CASE WHEN r.finalizado = true THEN 1 END)::INTEGER AS jogos_computados,

  COUNT(p.id)::INTEGER AS total_palpites,

  DENSE_RANK() OVER (
    ORDER BY
      COALESCE(SUM(
        CASE
          WHEN p.gols_mandante = r.gols_mandante
            AND p.gols_visitante = r.gols_visitante
          THEN 25
          WHEN SIGN(p.gols_mandante - p.gols_visitante) = SIGN(r.gols_mandante - r.gols_visitante)
            AND (p.gols_mandante - p.gols_visitante) = (r.gols_mandante - r.gols_visitante)
          THEN 18
          WHEN SIGN(p.gols_mandante - p.gols_visitante) = SIGN(r.gols_mandante - r.gols_visitante)
          THEN 10
          ELSE 0
        END
      ), 0) DESC,
      -- Desempate: mais acertos exatos
      COUNT(CASE
        WHEN r.finalizado = true
          AND p.gols_mandante = r.gols_mandante
          AND p.gols_visitante = r.gols_visitante
        THEN 1
      END) DESC
  )::INTEGER AS posicao

FROM usuarios u
LEFT JOIN palpites p ON u.id = p.usuario_id
LEFT JOIN resultados r ON p.jogo_id = r.jogo_id AND r.finalizado = true
GROUP BY u.id, u.nome;

-- ============================================
-- 5. Row Level Security (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE palpites ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;

-- Políticas para 'usuarios'
CREATE POLICY "Qualquer um pode ler usuarios"
  ON usuarios FOR SELECT TO anon USING (true);

CREATE POLICY "Qualquer um pode criar usuario"
  ON usuarios FOR INSERT TO anon WITH CHECK (true);

-- Políticas para 'palpites'
CREATE POLICY "Qualquer um pode ler palpites"
  ON palpites FOR SELECT TO anon USING (true);

CREATE POLICY "Qualquer um pode criar palpite"
  ON palpites FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Qualquer um pode atualizar palpite"
  ON palpites FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Políticas para 'resultados' (somente leitura para anon)
CREATE POLICY "Qualquer um pode ler resultados"
  ON resultados FOR SELECT TO anon USING (true);

-- ============================================
-- 6. Função para upsert de palpites
-- ============================================
CREATE OR REPLACE FUNCTION upsert_palpite(
  p_usuario_id UUID,
  p_jogo_id INTEGER,
  p_gols_mandante INTEGER,
  p_gols_visitante INTEGER
)
RETURNS palpites
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resultado palpites;
BEGIN
  INSERT INTO palpites (usuario_id, jogo_id, gols_mandante, gols_visitante, atualizado_em)
  VALUES (p_usuario_id, p_jogo_id, p_gols_mandante, p_gols_visitante, now())
  ON CONFLICT (usuario_id, jogo_id)
  DO UPDATE SET
    gols_mandante = EXCLUDED.gols_mandante,
    gols_visitante = EXCLUDED.gols_visitante,
    atualizado_em = now()
  RETURNING * INTO resultado;

  RETURN resultado;
END;
$$;
