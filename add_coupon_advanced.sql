-- ============================================
-- MIGRATION: Advanced Coupon Management System
-- ============================================

-- 1. Novas colunas na tabela coupons
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS "allowedToolIds" TEXT; -- JSON array de IDs, ex: "[1,5,12]"
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS "bonusCredits" INTEGER DEFAULT 0; -- Créditos bônus concedidos
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS "grantPlanId" INTEGER REFERENCES plans(id); -- Plano concedido (null = customizado)

-- 2. Novas colunas na tabela coupon_usages (controle de expiração por uso)
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP; -- Data em que as regras do cupom expiram
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS "isExpired" BOOLEAN DEFAULT FALSE; -- Flag de expirado
