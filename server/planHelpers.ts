import { eq, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../drizzle/schema.js";
import { BASIC_PLAN_NAME, LEGACY_FREE_PLAN_NAME } from "../shared/planConstants.js";

type Db = NodePgDatabase<typeof schema>;

export async function getBasicPlan(db: Db) {
  const [plan] = await db
    .select()
    .from(schema.plans)
    .where(or(eq(schema.plans.name, BASIC_PLAN_NAME), eq(schema.plans.name, LEGACY_FREE_PLAN_NAME)))
    .limit(1);

  return plan ?? null;
}
