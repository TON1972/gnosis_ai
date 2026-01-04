import { getToolsForPlan } from "./server/db";

async function test() {
  console.log("Testing getToolsForPlan(1)...");
  const tools = await getToolsForPlan(1);
  console.log("Result:", JSON.stringify(tools, null, 2));
}

test().catch(console.error);
