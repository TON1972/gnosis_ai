import { eq } from "drizzle-orm";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
// ✅ Correção da tipagem: Importamos 'Pool' como valor e 'Pool' como tipo separadamente
const { Pool } = pg;
import type { Pool as PoolType } from "pg"; 

import * as schema from "../shared/schema"; 
import { ENV } from './_core/env';

// Tipos auxiliares
type InsertUser = typeof schema.users.$inferInsert;

// ✅ Singleton para evitar múltiplas conexões em funções Serverless
let _db: NodePgDatabase<typeof schema> | null = null;
let pool: PoolType | null = null; // ✅ Agora usamos PoolType aqui

export async function getDb(): Promise<NodePgDatabase<typeof schema> | null> {
  // ✅ Prioriza a URL do objeto ENV centralizado que configuramos
  const dbUrl = ENV.databaseUrl || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("[Database] DATABASE_URL não definida nas variáveis de ambiente.");
    return null;
  }

  // Se já existe uma instância ativa, reutilizamos para economizar recursos na Vercel
  if (_db) return _db;

  try {
    console.log("[Database] Iniciando conexão com o pool (Vercel Optimised)...");
    
    // ✅ Criamos uma nova instância do Pool
    const newPool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false, // Necessário para conexões externas com Supabase/Neon
      },
      // ✅ Configurações críticas para evitar erro 500 por excesso de conexões na Vercel
      max: 1, 
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    pool = newPool as unknown as PoolType;
    _db = drizzle(pool, { schema });
    
    // ✅ Teste de conexão imediato para validar a DATABASE_URL
    const client = await pool.connect();
    client.release(); 
    
    console.log("[Database] Conexão estabelecida com sucesso!");
    return _db;
  } catch (error: any) {
    console.error("[Database] Falha crítica na conexão:", error.message);
    _db = null;
    return null;
  }
}

/**
 * 🛠️ Funções de Manipulação de Dados
 */

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId é obrigatório para o upsert.");

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
          // ✅ Criação automática de assinatura para novos usuários
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
  // ✅ Busca apenas planos marcados como ativos no banco
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