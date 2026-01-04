import { eq } from "drizzle-orm";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import type { Pool as PoolType } from "pg"; 

import * as schema from "../shared/schema"; 
import { ENV } from './_core/env';

// Tipos auxiliares
type InsertUser = typeof schema.users.$inferInsert;

// ✅ Singleton para evitar múltiplas conexões em funções Serverless
let _db: NodePgDatabase<typeof schema> | null = null;
let _pool: PoolType | null = null;

/**
 * Inicializa e retorna a instância do banco de dados.
 * Otimizado para Vercel: Reutiliza a conexão se ela já existir.
 */
export async function getDb(): Promise<NodePgDatabase<typeof schema> | null> {
  // ✅ Prioriza a URL injetada pela Vercel. 
  // Lembre-se: O '@' na sua senha deve ser '%40' na variável de ambiente.
  const dbUrl = process.env.DATABASE_URL || ENV.databaseUrl;
  
  if (!dbUrl) {
    console.error("[Database] Erro: DATABASE_URL não definida.");
    return null;
  }

  if (_db) return _db;

  try {
    console.log("[Database] Conectando ao Supabase (SSL ativo)...");
    
    _pool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false, // Mandatório para conexões externas Supabase
      },
      // Configurações críticas para evitar erro 500 em Serverless
      max: 1, 
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Teste de conexão (fail-fast)
    const client = await _pool.connect();
    client.release(); 
    
    _db = drizzle(_pool, { schema });
    console.log("[Database] Conectado com sucesso!");
    return _db;
  } catch (error: any) {
    console.error("[Database] Falha na conexão:", error.message);
    if (_pool) {
      await _pool.end().catch(() => {});
      _pool = null;
    }
    _db = null;
    return null;
  }
}

/**
 * 🛠️ Funções de Manipulação de Dados
 */

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId é obrigatório.");

  const db = await getDb();
  if (!db) throw new Error("Banco de dados offline.");

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