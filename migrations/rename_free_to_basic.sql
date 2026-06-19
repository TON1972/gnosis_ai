-- Renomeia plano Free → Basic com preços de assinatura
UPDATE plans
SET
  name = 'basic',
  "displayName" = 'Plano Basic',
  "displayNameEn" = COALESCE(NULLIF("displayNameEn", ''), 'Basic Plan'),
  "priceMonthly" = 497,
  "priceYearly" = 4668,
  description = COALESCE(description, 'Plano de entrada com ferramentas básicas')
WHERE name IN ('free', 'basic');
