import { eq } from "drizzle-orm";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import { ENV } from "./_core/env.js";
import * as schema from "../drizzle/schema.js";
import { sortPlansByDisplayOrder } from "../shared/planConstants.js";

// Tipos auxiliares
type InsertUser = typeof schema.users.$inferInsert;

// Singleton: Mantém a conexão ativa entre execuções na Vercel (evita Cold Start lento)
let _db: NodePgDatabase<typeof schema> | null = null;
let _pool: pg.Pool | null = null;

export async function getDb(): Promise<NodePgDatabase<typeof schema> | null> {
  // ✅ Pega a URL diretamente do objeto ENV (já com trim() e validações)
  const connectionString = ENV.databaseUrl;

  if (!connectionString) {
    console.error("[Database] Erro: DATABASE_URL não encontrada (string vazia ou undefined).");
    return null;
  }

  // Debug avançado para identificar caracteres invisíveis ou formatação errada
  console.log(`[Database] Debug URL: Length=${connectionString.length}, Chars=[${connectionString.substring(0, 10)}...]`);
  console.log(`[Database] Validando formato...`);
  try {
    const u = new URL(connectionString);
    console.log(`[Database] URL válida! Protocol: ${u.protocol}, Host: ${u.hostname}, Port: ${u.port}, Path: ${u.pathname}`);
  } catch (e: any) {
    console.error(`[Database] ❌ URL INVÁLIDA detetada pelo parser nativo: ${e.message}`);
    console.error(`[Database] Verifique se sua DATABASE_URL no .env contém espaços, aspas ou caracteres especiais não codificados.`);
  }

  if (_db) return _db;

  try {
    console.log("[Database] Criando Pool com configuração manual (Bypassing pg-connection-string)...");

    // Parse manual da URL para evitar erro 'searchParams' no driver
    const dbUrl = new URL(connectionString);
    const config = {
      host: dbUrl.hostname,
      port: Number(dbUrl.port) || 5432,
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1), // Remove a barra inicial
      ssl: { rejectUnauthorized: false },
      max: 1
    };

    console.log(`[Database] Config gerada - Host: ${config.host}, DB: ${config.database}, User: ${config.user ? '***' : 'missing'}`);

    _pool = new Pool(config);

    console.log("[Database] Pool criado. Inicializando Drizzle...");
    _db = drizzle(_pool, { schema });

    // Teste de conexão (fail-fast)
    console.log("[Database] Testando conexão com .connect()...");
    const client = await _pool.connect();
    client.release();

    console.log("[Database] Conectado com sucesso à base de dados.");
    return _db;
  } catch (error: any) {
    console.error(`[Database] Falha crítica na conexão (Line unknown): ${error.message}`);
    console.error(error.stack); // Log do stack para debug
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

    // Novos usuários não recebem assinatura automática — pagamento obrigatório no cadastro.
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
  return sortPlansByDisplayOrder(
    await db.select().from(schema.plans).where(eq(schema.plans.isActive, true))
  );
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
    .from(schema.planToolsSnake) // ✅ Fix: Usar a tabela correta (plan_tools)
    .innerJoin(schema.tools, eq(schema.planToolsSnake.toolId, schema.tools.id))
    .where(eq(schema.planToolsSnake.planId, planId));
  return result.map(r => r.tool);
}

export async function getAllTools() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(schema.tools).where(eq(schema.tools.isActive, true));
}