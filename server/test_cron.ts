import "dotenv/config";
import { processAutomations } from "./cron.js";

async function run() {
  console.log("Starting manual cron execution...");
  
  const start = Date.now();
  await processAutomations();
  const end = Date.now();
  
  console.log(`Cron execution finished in ${((end - start) / 1000).toFixed(2)}s`);
}

run().catch(console.error);
