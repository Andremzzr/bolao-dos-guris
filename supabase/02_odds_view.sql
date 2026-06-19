-- ============================================
-- View para cálculo de Odds (Termômetro de Palpites)
-- ============================================
CREATE OR REPLACE VIEW view_odds AS
SELECT 
  jogo_id,
  COUNT(CASE WHEN gols_mandante > gols_visitante THEN 1 END)::INTEGER as votos_mandante,
  COUNT(CASE WHEN gols_mandante < gols_visitante THEN 1 END)::INTEGER as votos_visitante,
  COUNT(CASE WHEN gols_mandante = gols_visitante THEN 1 END)::INTEGER as votos_empate,
  COUNT(id)::INTEGER as total_votos
FROM palpites
GROUP BY jogo_id;

-- Permissões para que qualquer usuário (autenticado ou não) possa ver os totais
GRANT SELECT ON view_odds TO anon;
GRANT SELECT ON view_odds TO authenticated;
