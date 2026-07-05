-- Tabela para armazenar as inscrições de push notifications dos usuários
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (usuario_id, subscription)
);

-- Políticas de segurança (RLS)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário pode ver as inscrições (para enviar notificação no front, ou o admin)
-- Se quiser restringir, pode deixar apenas a API do backend (via service_role) ler.
-- Por enquanto, vamos permitir select para a role anon e authenticated
CREATE POLICY "Permitir leitura de push_subscriptions" ON push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de push_subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir update de push_subscriptions" ON push_subscriptions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete de push_subscriptions" ON push_subscriptions FOR DELETE USING (true);
