import "dotenv/config";
import postgres from "postgres";

const conn = postgres(process.env.DATABASE_URL!);
async function run() {
  try {
    const res = await conn`SELECT "nameEn", "categoryEn", "categoryEs" FROM tools LIMIT 1`;
    console.log("Success:", res);
    process.exit(0);
  } catch(e) {
    console.error("ERROR:", e);
    process.exit(1);
  }
}
run();
