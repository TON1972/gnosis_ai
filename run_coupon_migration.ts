import * as dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Pool } = pg;

const ENV_DB = (process.env.DATABASE_URL ?? "").trim();

async function main() {
  if (!ENV_DB) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const dbUrl = new URL(ENV_DB);
  const pool = new Pool({
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 5432,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Running migration...");

    await pool.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS "allowedToolIds" TEXT;`);
    console.log("✅ Added allowedToolIds");

    await pool.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS "bonusCredits" INTEGER DEFAULT 0;`);
    console.log("✅ Added bonusCredits");

    await pool.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS "grantPlanId" INTEGER;`);
    console.log("✅ Added grantPlanId");

    await pool.query(`ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP;`);
    console.log("✅ Added expiresAt to coupon_usages");

    await pool.query(`ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS "isExpired" BOOLEAN DEFAULT FALSE;`);
    console.log("✅ Added isExpired to coupon_usages");

    console.log("\\n🎉 Migration complete!");
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await pool.end();
  }
}

main();
