import "dotenv/config";
import postgres from "postgres";

const conn = postgres(process.env.DATABASE_URL!);
async function run() {
  try {
    await conn`ALTER TABLE tool_categories ADD COLUMN IF NOT EXISTS "nameEn" text;`;
    await conn`ALTER TABLE tool_categories ADD COLUMN IF NOT EXISTS "nameEs" text;`;
    console.log("Columns added successfully!");
    process.exit(0);
  } catch(e) {
    console.error("ERROR:", e);
    process.exit(1);
  }
}
run();
