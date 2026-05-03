import "dotenv/config";
import postgres from "postgres";

const conn = postgres(process.env.DATABASE_URL!);
async function run() {
  try {
    const cats = await conn`SELECT * FROM tool_categories`;
    console.log("Categories:", cats);
    process.exit(0);
  } catch(e) {
    console.error("ERROR:", e);
    process.exit(1);
  }
}
run();
