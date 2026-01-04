import { getUserActivePlan } from "./server/credits";

async function test() {
  console.log("Testing getUserActivePlan(1)...");
  const plan = await getUserActivePlan(1);
  console.log("Result:", JSON.stringify(plan, null, 2));
}

test().catch(console.error).finally(() => process.exit(0));
