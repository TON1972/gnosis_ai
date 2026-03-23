-- 1. Limpeza de possíveis tentativas anteriores (Snake Case)
DROP TABLE IF EXISTS "affiliate_payouts";
DROP TABLE IF EXISTS "affiliate_commissions";

DO $$ 
BEGIN 
    -- Remove colunas antigas da tabela users se existirem
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='affiliate_code') THEN
        ALTER TABLE "users" DROP COLUMN "affiliate_code";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_affiliate') THEN
        ALTER TABLE "users" DROP COLUMN "is_affiliate";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='commission_percentage') THEN
        ALTER TABLE "users" DROP COLUMN "commission_percentage";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referred_by') THEN
        ALTER TABLE "users" DROP COLUMN "referred_by";
    END IF;
END $$;

-- 2. Atualização da tabela users com colunas Camel Case e lastSignedIn
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "affiliateCode" VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS "isAffiliate" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "commissionPercentage" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "referredBy" INTEGER REFERENCES "users"("id"),
ADD COLUMN IF NOT EXISTS "lastSignedIn" TIMESTAMP DEFAULT NOW();

-- 3. Criação da tabela affiliate_commissions (Camel Case)
CREATE TABLE "affiliate_commissions" (
    "id" SERIAL PRIMARY KEY,
    "affiliateId" INTEGER NOT NULL REFERENCES "users"("id"),
    "referredUserId" INTEGER NOT NULL REFERENCES "users"("id"),
    "subscriptionId" INTEGER NOT NULL REFERENCES "subscriptions"("id"),
    "amount" INTEGER NOT NULL, -- em centavos
    "status" VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled
    "payoutId" INTEGER REFERENCES "affiliate_payouts"("id"),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 4. Criação da tabela affiliate_payouts (Camel Case)
CREATE TABLE "affiliate_payouts" (
    "id" SERIAL PRIMARY KEY,
    "affiliateId" INTEGER NOT NULL REFERENCES "users"("id"),
    "amount" INTEGER NOT NULL,
    "status" VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS "idx_users_affiliateCode" ON "users"("affiliateCode");
CREATE INDEX IF NOT EXISTS "idx_users_referredBy" ON "users"("referredBy");
CREATE INDEX IF NOT EXISTS "idx_commissions_affiliateId" ON "affiliate_commissions"("affiliateId");
CREATE INDEX IF NOT EXISTS "idx_payouts_affiliateId" ON "affiliate_payouts"("affiliateId");
