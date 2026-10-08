import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../drizzle/schema.js";
import { getFreePlan } from "./freeAccess.js";

type Db = NodePgDatabase<typeof schema>;

/** Plano de entrada do aluno. Prefere `free`; cai no Basic só se for gratuito. */
export async function getBasicPlan(db: Db) {
  return getFreePlan(db);
}
