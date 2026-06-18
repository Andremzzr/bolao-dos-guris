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

CREATE TABLE IF NOT EXISTS palpites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  jogo_id INTEGER NOT NULL,
  gols_mandante INTEGER NOT NULL DEFAULT 0,
  gols_visitante INTEGER NOT NULL DEFAULT 0,
  pontuacao INTEGER NOT NULL DEFAULT 0,
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
  COALESCE(SUM(p.pontuacao), 0)::INTEGER AS pontos,

  -- Estatísticas detalhadas
  COUNT(CASE WHEN p.pontuacao = 5 THEN 1 END)::INTEGER AS acertos_exatos,
  COUNT(CASE WHEN p.pontuacao IN (3, 5) THEN 1 END)::INTEGER AS acertos_vencedor,
  COUNT(CASE WHEN r.finalizado = true THEN 1 END)::INTEGER AS jogos_computados,
  COUNT(p.id)::INTEGER AS total_palpites,

  DENSE_RANK() OVER (
    ORDER BY
      COALESCE(SUM(p.pontuacao), 0) DESC,
      -- Desempate: mais acertos exatos
      COUNT(CASE WHEN p.pontuacao = 5 THEN 1 END) DESC
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

-- ============================================
-- 7. Triggers para cálculo de pontuação
-- ============================================

-- Função para atualizar palpites quando o resultado final for modificado
CREATE OR REPLACE FUNCTION trigger_resultado_pontuacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.finalizado = true THEN
    UPDATE palpites p
    SET pontuacao = (
      CASE
        WHEN p.gols_mandante = NEW.gols_mandante AND p.gols_visitante = NEW.gols_visitante THEN 5
        WHEN SIGN(p.gols_mandante - p.gols_visitante) = SIGN(NEW.gols_mandante - NEW.gols_visitante) THEN 3
        ELSE 0
      END
    )
    WHERE p.jogo_id = NEW.jogo_id;
  ELSE
    UPDATE palpites p SET pontuacao = 0 WHERE p.jogo_id = NEW.jogo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualiza_pontuacao_resultado
AFTER INSERT OR UPDATE ON resultados
FOR EACH ROW EXECUTE FUNCTION trigger_resultado_pontuacao();

-- Função para calcular pontuação quando um palpite é inserido ou atualizado
CREATE OR REPLACE FUNCTION trigger_palpite_pontuacao()
RETURNS TRIGGER AS $$
DECLARE
  r_finalizado BOOLEAN;
  r_gols_mandante INTEGER;
  r_gols_visitante INTEGER;
BEGIN
  SELECT finalizado, gols_mandante, gols_visitante 
  INTO r_finalizado, r_gols_mandante, r_gols_visitante
  FROM resultados WHERE jogo_id = NEW.jogo_id;

  IF FOUND AND r_finalizado = true THEN
    NEW.pontuacao := (
      CASE
        WHEN NEW.gols_mandante = r_gols_mandante AND NEW.gols_visitante = r_gols_visitante THEN 5
        WHEN SIGN(NEW.gols_mandante - NEW.gols_visitante) = SIGN(r_gols_mandante - r_gols_visitante) THEN 3
        ELSE 0
      END
    );
  ELSE
    NEW.pontuacao := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcula_pontuacao_palpite
BEFORE INSERT OR UPDATE ON palpites
FOR EACH ROW EXECUTE FUNCTION trigger_palpite_pontuacao();
