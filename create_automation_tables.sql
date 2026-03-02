-- Criação da tabela de automações de e-mail
CREATE TABLE IF NOT EXISTS "email_automations" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "triggerType" TEXT NOT NULL, -- 'bulk', 'subscription_expiring', 'low_credits', 'inactive_user'
  "triggerValue" INTEGER, -- Dias antes da expiração ou limite de créditos
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "targetPlans" TEXT, -- IDs de planos separados por vírgula
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL
);

-- Criação da tabela de logs de automação
CREATE TABLE IF NOT EXISTS "automation_logs" (
  "id" SERIAL PRIMARY KEY,
  "automationId" INTEGER REFERENCES "email_automations"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL,
  "sentAt" TIMESTAMP DEFAULT now() NOT NULL,
  "status" TEXT DEFAULT 'sent'
);

-- Adição para Row Level Security (RLS)
ALTER TABLE "email_automations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "automation_logs" ENABLE ROW LEVEL SECURITY;

-- Política para Super Admin (CRUD total em automações)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'email_automations' AND policyname = 'Super Admin Manage Automations'
    ) THEN
        CREATE POLICY "Super Admin Manage Automations" ON "email_automations"
        FOR ALL TO public
        USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text::int AND role = 'super_admin'))
        WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text::int AND role = 'super_admin'));
    END IF;
END
$$;

-- Política para Super Admin (Leitura de logs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'automation_logs' AND policyname = 'Super Admin View Logs'
    ) THEN
        CREATE POLICY "Super Admin View Logs" ON "automation_logs"
        FOR SELECT TO public
        USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text::int AND role = 'super_admin'));
    END IF;
END
$$;

-- Política para o Processo de Automação (Inserção de logs)
-- Note: Se o processo rodar pelo backend com service_role, o RLS é ignorado por padrão.
-- Caso contrário, esta política permite inserção se o usuário for super_admin.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'automation_logs' AND policyname = 'Super Admin Insert Logs'
    ) THEN
        CREATE POLICY "Super Admin Insert Logs" ON "automation_logs"
        FOR INSERT TO public
        WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text::int AND role = 'super_admin'));
    END IF;
END
$$;

-- Índice para busca rápida de logs por usuário e automação
CREATE INDEX IF NOT EXISTS "idx_automation_logs_user_auto" ON "automation_logs" ("userId", "automationId");
