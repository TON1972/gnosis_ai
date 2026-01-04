-- GNOSIS AI Database Migration for Supabase (PostgreSQL)
-- Generated from Drizzle schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  "clerkId" VARCHAR(128) UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  "displayName" VARCHAR(100) NOT NULL,
  "priceMonthly" INTEGER NOT NULL,
  "priceYearly" INTEGER NOT NULL,
  "creditsInitial" INTEGER NOT NULL,
  "creditsDaily" INTEGER NOT NULL,
  "toolsCount" INTEGER NOT NULL,
  description TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tools table
CREATE TABLE IF NOT EXISTS tools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  "displayName" VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  "creditCost" INTEGER NOT NULL DEFAULT 10,
  icon VARCHAR(50),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Plan-Tools relationship table
CREATE TABLE IF NOT EXISTS "planTools" (
  id SERIAL PRIMARY KEY,
  "planId" INTEGER NOT NULL,
  "toolId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("planId", "toolId")
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "planId" INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'grace_period', 'blocked')),
  "billingPeriod" VARCHAR(10) NOT NULL DEFAULT 'monthly' CHECK ("billingPeriod" IN ('monthly', 'yearly')),
  "startDate" TIMESTAMP NOT NULL DEFAULT NOW(),
  "endDate" TIMESTAMP,
  "nextBillingDate" TIMESTAMP,
  "cancelledAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  type VARCHAR(20) NOT NULL CHECK (type IN ('initial', 'daily', 'bonus', 'refund')),
  "expiresAt" TIMESTAMP,
  "isExpired" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS "creditTransactions" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "toolId" INTEGER,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend', 'expire', 'refund')),
  description TEXT,
  "balanceBefore" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "subscriptionId" INTEGER,
  "mercadoPagoId" VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
  "paymentMethod" VARCHAR(50),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users("clerkId");
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits("userId");
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON "creditTransactions"("userId");
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments("userId");

-- Insert default plans
INSERT INTO plans (name, "displayName", "priceMonthly", "priceYearly", "creditsInitial", "creditsDaily", "toolsCount", description) VALUES
('free', 'FREE', 0, 0, 500, 50, 5, 'Plano gratuito com acesso limitado'),
('alianca', 'Aliança', 1898, 19104, 2000, 200, 10, 'Plano Aliança com mais recursos'),
('lumen', 'Lumen', 3798, 38208, 5000, 500, 15, 'Plano Lumen com recursos avançados'),
('premium', 'Premium', 5698, 57312, 10000, 1000, 19, 'Plano Premium com acesso total')
ON CONFLICT (name) DO NOTHING;

-- Insert all 19 tools
INSERT INTO tools (name, "displayName", description, category, "creditCost", icon) VALUES
('analise-contextual', 'Análise Contextual', 'Analisa o contexto histórico, cultural e literário de passagens bíblicas', 'Estudo', 10, 'BookOpen'),
('interpretacao-teologica', 'Interpretação Teológica', 'Oferece interpretações teológicas profundas de textos bíblicos', 'Teologia', 15, 'Brain'),
('estudo-palavras', 'Estudo de Palavras', 'Estuda palavras-chave em hebraico e grego com suas nuances', 'Linguística', 12, 'Languages'),
('comparacao-versoes', 'Comparação de Versões', 'Compara diferentes traduções bíblicas lado a lado', 'Comparação', 8, 'GitCompare'),
('analise-historica', 'Análise Histórica', 'Contextualiza eventos bíblicos no cenário histórico', 'História', 10, 'Clock'),
('temas-biblicos', 'Temas Bíblicos', 'Explora temas teológicos ao longo da Bíblia', 'Teologia', 12, 'Library'),
('personagens-biblicos', 'Personagens Bíblicos', 'Analisa personagens bíblicos e suas jornadas', 'Estudo', 10, 'Users'),
('profecias', 'Profecias', 'Estuda profecias bíblicas e seus cumprimentos', 'Profecia', 15, 'Sparkles'),
('parabolas', 'Parábolas', 'Interpreta parábolas de Jesus e seus significados', 'Ensino', 10, 'MessageCircle'),
('milagres', 'Milagres', 'Analisa milagres bíblicos e seus propósitos', 'Estudo', 10, 'Zap'),
('genealogias', 'Genealogias', 'Explora genealogias bíblicas e suas conexões', 'História', 8, 'GitBranch'),
('geografia-biblica', 'Geografia Bíblica', 'Estuda locais e rotas geográficas da Bíblia', 'Geografia', 10, 'Map'),
('cronologia-biblica', 'Cronologia Bíblica', 'Organiza eventos bíblicos em ordem cronológica', 'História', 10, 'Calendar'),
('simbolismo', 'Simbolismo', 'Interpreta símbolos e metáforas bíblicas', 'Interpretação', 12, 'Eye'),
('tipologia', 'Tipologia', 'Identifica tipos e antítipos bíblicos', 'Teologia', 15, 'Link'),
('hermeneutica', 'Hermenêutica', 'Aplica princípios de interpretação bíblica', 'Metodologia', 15, 'GraduationCap'),
('apologetica', 'Apologética', 'Defende a fé cristã com argumentos bíblicos', 'Defesa', 12, 'Shield'),
('aplicacao-pratica', 'Aplicação Prática', 'Aplica ensinamentos bíblicos à vida moderna', 'Prática', 10, 'Target'),
('escatologia-biblica', 'Escatologia Bíblica', 'Estuda eventos do fim dos tempos e profecias apocalípticas', 'Profecia', 15, 'Flame')
ON CONFLICT (name) DO NOTHING;

-- Link tools to plans
-- FREE plan (5 tools)
INSERT INTO "planTools" ("planId", "toolId") 
SELECT p.id, t.id FROM plans p, tools t 
WHERE p.name = 'free' AND t.name IN ('analise-contextual', 'comparacao-versoes', 'temas-biblicos', 'parabolas', 'aplicacao-pratica')
ON CONFLICT DO NOTHING;

-- Aliança plan (10 tools)
INSERT INTO "planTools" ("planId", "toolId")
SELECT p.id, t.id FROM plans p, tools t
WHERE p.name = 'alianca' AND t.name IN ('analise-contextual', 'interpretacao-teologica', 'estudo-palavras', 'comparacao-versoes', 'analise-historica', 'temas-biblicos', 'personagens-biblicos', 'parabolas', 'milagres', 'aplicacao-pratica')
ON CONFLICT DO NOTHING;

-- Lumen plan (15 tools)
INSERT INTO "planTools" ("planId", "toolId")
SELECT p.id, t.id FROM plans p, tools t
WHERE p.name = 'lumen' AND t.name IN ('analise-contextual', 'interpretacao-teologica', 'estudo-palavras', 'comparacao-versoes', 'analise-historica', 'temas-biblicos', 'personagens-biblicos', 'profecias', 'parabolas', 'milagres', 'genealogias', 'geografia-biblica', 'cronologia-biblica', 'simbolismo', 'aplicacao-pratica')
ON CONFLICT DO NOTHING;

-- Premium plan (all 19 tools)
INSERT INTO "planTools" ("planId", "toolId")
SELECT p.id, t.id FROM plans p, tools t
WHERE p.name = 'premium'
ON CONFLICT DO NOTHING;
