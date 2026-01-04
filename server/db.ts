import { eq } from "drizzle-orm";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import * as schema from "../shared/schema";

// Tipos auxiliares
type InsertUser = typeof schema.users.$inferInsert;

// Singleton: Mantém a conexão ativa entre execuções na Vercel (evita Cold Start lento)
let _db: NodePgDatabase<typeof schema> | null = null;
let _pool: pg.Pool | null = null;

export async function getDb(): Promise<NodePgDatabase<typeof schema> | null> {
  // ✅ Pega a URL diretamente do ambiente da Vercel
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("[Database] Erro: DATABASE_URL não encontrada.");
    return null;
  }

  if (_db) return _db;

  try {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // ISSO É OBRIGATÓRIO NA VERCEL
      max: 1
    });

    _db = drizzle(_pool, { schema });
    
    // Teste de conexão (fail-fast)
    const client = await _pool.connect();
    client.release();
    
    console.log("[Database] Conectado com sucesso à base de dados.");
    return _db;
  } catch (error: any) {
    console.error("[Database] Falha crítica na conexão:", error.message);
    _db = null;
    return null;
  }
}

/** * Funções de dados 
 */

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  try {
    const result = await db.insert(schema.users)
      .values({
        ...user,
        lastSignedIn: new Date()
      })
      .onConflictDoUpdate({
        target: schema.users.openId,
        set: {
          name: user.name,
          email: user.email,
          lastSignedIn: new Date()
        }
      })
      .returning();

    const newUser = result[0];
    if (newUser) {
      const existingSub = await db.select().from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, newUser.id))
        .limit(1);
      
      if (existingSub.length === 0) {
        const freePlan = await db.select().from(schema.plans)
          .where(eq(schema.plans.name, "free"))
          .limit(1);
        
        if (freePlan.length > 0) {
          await db.insert(schema.subscriptions).values({
            userId: newUser.id,
            planId: freePlan[0].id,
            status: "active",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          });
        }
      }
    }
  } catch (error) {
    console.error("[Database] Erro no upsertUser:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schema.users).where(eq(schema.users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllPlans() {
  const db = await getDb();
  if (!db) return [];
  // Retorna planos ativos
  return await db.select().from(schema.plans).where(eq(schema.plans.isActive, true));
}

export async function getPlanById(planId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(schema.plans).where(eq(schema.plans.id, planId)).limit(1);
  return result[0] || null;
}

export async function getToolsForPlan(planId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ tool: schema.tools })
    .from(schema.planTools)
    .innerJoin(schema.tools, eq(schema.planTools.toolId, schema.tools.id))
    .where(eq(schema.planTools.planId, planId));
  return result.map(r => r.tool);
}

export async function getAllTools() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(schema.tools).where(eq(schema.tools.isActive, true));
}