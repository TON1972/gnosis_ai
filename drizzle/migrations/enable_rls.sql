-- ===================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ===================================
-- Esta migration habilita RLS em todas as tabelas do projeto
-- IMPORTANTE: Nenhum dado será apagado, apenas regras de segurança serão adicionadas

-- ===================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ===================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planTools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_tools ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 2. POLÍTICAS PARA TABELA: users
-- ===================================

-- Service role tem acesso total
CREATE POLICY "service_role_full_access_users"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "users_view_own_profile"
ON users FOR SELECT
TO authenticated
USING (
  id = NULLIF(current_setting('app.current_user_id', true), '')::int
);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "users_update_own_profile"
ON users FOR UPDATE
TO authenticated
USING (
  id = NULLIF(current_setting('app.current_user_id', true), '')::int
)
WITH CHECK (
  id = NULLIF(current_setting('app.current_user_id', true), '')::int
);

-- ===================================
-- 3. POLÍTICAS PARA TABELA: subscriptions
-- ===================================

CREATE POLICY "service_role_full_access_subscriptions"
ON subscriptions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "users_view_own_subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (
  "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
);

-- ===================================
-- 4. POLÍTICAS PARA TABELA: credits
-- ===================================

CREATE POLICY "service_role_full_access_credits"
ON credits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "users_view_own_credits"
ON credits FOR SELECT
TO authenticated
USING (
  "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
);

-- ===================================
-- 5. POLÍTICAS PARA TABELA: saved_studies
-- ===================================

CREATE POLICY "service_role_full_access_saved_studies"
ON saved_studies FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "users_view_own_studies"
ON saved_studies FOR SELECT
TO authenticated
USING (
  "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
);

CREATE POLICY "users_insert_own_studies"
ON saved_studies FOR INSERT
TO authenticated
WITH CHECK (
  "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
);

CREATE POLICY "users_update_own_studies"
ON saved_studies FOR UPDATE
TO authenticated
USING (
  "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
)
WITH CHECK (
  "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
);

CREATE POLICY "users_delete_own_studies"
ON saved_studies FOR DELETE
TO authenticated
USING (
  "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
);

-- ===================================
-- 6. POLÍTICAS PARA TABELA: study_messages
-- ===================================

CREATE POLICY "service_role_full_access_study_messages"
ON study_messages FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Usuários veem mensagens dos seus estudos
CREATE POLICY "users_view_own_study_messages"
ON study_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM saved_studies
    WHERE saved_studies.id = study_messages.study_id
    AND saved_studies."userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
  )
);

CREATE POLICY "users_insert_own_study_messages"
ON study_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM saved_studies
    WHERE saved_studies.id = study_messages.study_id
    AND saved_studies."userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
  )
);

-- ===================================
-- 7. POLÍTICAS PARA TABELA: credit_transactions
-- ===================================

CREATE POLICY "service_role_full_access_credit_transactions"
ON credit_transactions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "users_view_own_transactions"
ON credit_transactions FOR SELECT
TO authenticated
USING (
  "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
);

-- ===================================
-- 8. POLÍTICAS PARA TABELA: payments
-- ===================================

CREATE POLICY "service_role_full_access_payments"
ON payments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "users_view_own_payments"
ON payments FOR SELECT
TO authenticated
USING (
  "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
);

-- ===================================
-- 9. POLÍTICAS PARA TABELA: chatbot_contacts
-- ===================================

CREATE POLICY "service_role_full_access_chatbot_contacts"
ON chatbot_contacts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Qualquer pessoa pode inserir contatos (anônimos também)
CREATE POLICY "anyone_insert_chatbot_contacts"
ON chatbot_contacts FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- ===================================
-- 10. POLÍTICAS PARA TABELA: ticket_messages
-- ===================================

CREATE POLICY "service_role_full_access_ticket_messages"
ON ticket_messages FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Usuários veem mensagens do seu ticket
CREATE POLICY "users_view_own_ticket_messages"
ON ticket_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chatbot_contacts
    WHERE chatbot_contacts.id = ticket_messages."ticketId"
    AND chatbot_contacts.email = (
      SELECT email FROM users 
      WHERE id = NULLIF(current_setting('app.current_user_id', true), '')::int
    )
  )
);

CREATE POLICY "users_insert_own_ticket_messages"
ON ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chatbot_contacts
    WHERE chatbot_contacts.id = ticket_messages."ticketId"
    AND chatbot_contacts.email = (
      SELECT email FROM users 
      WHERE id = NULLIF(current_setting('app.current_user_id', true), '')::int
    )
  )
);

-- ===================================
-- 11. POLÍTICAS PARA TABELAS PÚBLICAS
-- ===================================

-- Table: plans (leitura pública)
CREATE POLICY "service_role_full_access_plans"
ON plans FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "public_read_plans"
ON plans FOR SELECT
TO authenticated, anon
USING (true);

-- Table: tools (leitura pública)
CREATE POLICY "service_role_full_access_tools"
ON tools FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "public_read_tools"
ON tools FOR SELECT
TO authenticated, anon
USING (true);

-- Table: tool_categories (leitura pública)
CREATE POLICY "service_role_full_access_tool_categories"
ON tool_categories FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "public_read_tool_categories"
ON tool_categories FOR SELECT
TO authenticated, anon
USING (true);

-- Table: planTools (leitura pública)
CREATE POLICY "service_role_full_access_planTools"
ON "planTools" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "public_read_planTools"
ON "planTools" FOR SELECT
TO authenticated, anon
USING (true);

-- Table: plan_tools (leitura pública)
CREATE POLICY "service_role_full_access_plan_tools"
ON plan_tools FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "public_read_plan_tools"
ON plan_tools FOR SELECT
TO authenticated, anon
USING (true);

-- ===================================
-- CONCLUÍDO
-- ===================================
-- RLS habilitado em todas as tabelas
-- Políticas aplicadas para proteger dados dos usuários
-- Service role mantém acesso total
-- Nenhum dado foi apagado
