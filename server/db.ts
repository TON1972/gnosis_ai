import { eq } from "drizzle-orm";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema"; // Importamos tudo como schema
import { ENV } from './_core/env';

// Tipos auxiliares
type InsertUser = typeof schema.users.$inferInsert;

// Definimos o tipo do banco explicitamente usando o schema
let _db: NodePgDatabase<typeof schema> | null = null;
let pool: Pool | null = null;

export async function getDb(): Promise<NodePgDatabase<typeof schema> | null> {
  const dbUrl = process.env.DATABASE_URL || process.env.URL_DO_BANCO_DE_DADOS;
  
  if (!_db && dbUrl) {
    try {
      console.log("[Database] Conectando com node-postgres (SSL Fix)...");
      
      pool = new Pool({
        connectionString: dbUrl,
        // ✅ Se 'require' falhou, o Supabase em algumas redes 
        // aceita melhor o objeto de configuração explícito
        ssl: {
          rejectUnauthorized: false,
        },
        // Configurações para evitar queda de socket
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      _db = drizzle(pool, { schema });
      
      // ✅ Teste de fogo: Se falhar aqui, a URL ou a rede está bloqueada
      const client = await pool.connect();
      client.release(); // Libera o cliente de volta para o pool
      
      console.log("[Database] Conexão estabelecida com sucesso!");
    } catch (error: any) {
      console.error("[Database] Falha na conexão:", error.message);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");

  const db = await getDb();
  if (!db) return;

  try {
    const result = await db.insert(schema.users)
      .values({
        ...user,
        role: user.openId === ENV.ownerOpenId ? 'super_admin' : (user.role || 'user'),
        lastSignedIn: new Date()
      })
      .onConflictDoUpdate({
        target: schema.users.openId,
        set: {
          name: user.name,
          email: user.email,
          lastSignedIn: new Date(),
          role: user.openId === ENV.ownerOpenId ? 'super_admin' : (user.role || 'user')
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
          });
        }
      }
    }
  } catch (error) {
    console.error("[Database] Erro no upsertUser:", error);
    throw error;
  }
}

// Funções de busca simplificadas
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schema.users).where(eq(schema.users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllPlans() {
  const db = await getDb();
  if (!db) return [];
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