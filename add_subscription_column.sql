-- Adiciona coluna para rastrear ID da assinatura no Mercado Pago
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "mercadoPagoSubscriptionId" VARCHAR(100);
