-- Execute este SQL no seu banco de dados (Supabase/Postgres) para adicionar as colunas que faltam

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "mercadoPagoId" varchar(100);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "externalId" varchar(100);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "subscriptionId" integer REFERENCES "subscriptions"("id");
