-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    "discountDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "expirationDate" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create coupon_usages table
CREATE TABLE IF NOT EXISTS coupon_usages (
    id SERIAL PRIMARY KEY,
    "couponId" INTEGER NOT NULL REFERENCES coupons(id),
    "userId" INTEGER NOT NULL REFERENCES users(id),
    "usedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
