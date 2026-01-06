-- Adiciona colunas para histórico detalhado de pagamentos
ALTER TABLE payments ADD COLUMN IF NOT EXISTS "type" VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS "creditsAmount" INTEGER DEFAULT 0;
