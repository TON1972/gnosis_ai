-- Atualizações para Tabela "tools" (Traduções EN e ES)
ALTER TABLE "tools" ADD COLUMN "nameEn" varchar(100);
ALTER TABLE "tools" ADD COLUMN "displayNameEn" varchar(150);
ALTER TABLE "tools" ADD COLUMN "descriptionEn" text;
ALTER TABLE "tools" ADD COLUMN "inputPlaceholderEn" text;
ALTER TABLE "tools" ADD COLUMN "promptTemplateEn" text;
ALTER TABLE "tools" ADD COLUMN "categoryEn" text;

ALTER TABLE "tools" ADD COLUMN "nameEs" varchar(100);
ALTER TABLE "tools" ADD COLUMN "displayNameEs" varchar(150);
ALTER TABLE "tools" ADD COLUMN "descriptionEs" text;
ALTER TABLE "tools" ADD COLUMN "inputPlaceholderEs" text;
ALTER TABLE "tools" ADD COLUMN "promptTemplateEs" text;
ALTER TABLE "tools" ADD COLUMN "categoryEs" text;

-- Atualizações para Tabela "plans" (Traduções EN e ES)
ALTER TABLE "plans" ADD COLUMN "nameEn" varchar(50);
ALTER TABLE "plans" ADD COLUMN "displayNameEn" varchar(100);
ALTER TABLE "plans" ADD COLUMN "descriptionEn" text;

ALTER TABLE "plans" ADD COLUMN "nameEs" varchar(50);
ALTER TABLE "plans" ADD COLUMN "displayNameEs" varchar(100);
ALTER TABLE "plans" ADD COLUMN "descriptionEs" text;

-- Atualizações para Tabela "plans" (Moedas Estrangeiras: USD e EUR)
ALTER TABLE "plans" ADD COLUMN "priceUsd" integer DEFAULT 0;
ALTER TABLE "plans" ADD COLUMN "priceMonthlyUsd" integer DEFAULT 0;
ALTER TABLE "plans" ADD COLUMN "priceYearlyUsd" integer DEFAULT 0;

ALTER TABLE "plans" ADD COLUMN "priceEur" integer DEFAULT 0;
ALTER TABLE "plans" ADD COLUMN "priceMonthlyEur" integer DEFAULT 0;
ALTER TABLE "plans" ADD COLUMN "priceYearlyEur" integer DEFAULT 0;
