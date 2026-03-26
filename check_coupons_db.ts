import { getDb } from "./server/db.js";
import { coupons } from "./drizzle/schema.js";

async function checkCoupons() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }
  const allCoupons = await db.select().from(coupons);
  console.log("--- COUPONS IN DATABASE ---");
  console.log(JSON.stringify(allCoupons, null, 2));
  process.exit(0);
}

checkCoupons();
