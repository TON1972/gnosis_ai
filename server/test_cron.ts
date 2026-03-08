import "dotenv/config";
import { processAutomations } from "./cron.js";

async function run() {
  console.log("Starting cron test...");
  await processAutomations();
  console.log("Cron test finished.");
}
run().catch(console.error);
