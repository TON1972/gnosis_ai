import { eq, and, sql } from "drizzle-orm";
import { getDb } from "./db";
// Certifique-se de que o caminho do schema está correto conforme seu projeto (shared ou drizzle)
import { credits, creditTransactions, subscriptions, plans, users } from "../drizzle/schema";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Obtém o saldo detalhado do usuário
 */
export async function getUserCredits(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Verificação de Admin (Créditos Infinitos)
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userResult.length > 0 && (userResult[0].role === 'admin' || userResult[0].role === 'super_admin')) {
    return { initial: 999999, daily: 999999, bonus: 999999, total: 999999, initialExpiry: null };
  }

  // 2. Busca o registro de créditos do usuário
  let result = await db.select().from(credits).where(eq(credits.userId, userId)).limit(1);

  // 3. Cria registro inicial caso não exista (Primeiro acesso)
  if (result.length === 0) {
    const userActivePlan = await getUserActivePlan(userId);
    const isAlianca = userActivePlan?.plan.id === 4;
    const initialAmount = isAlianca ? 2000 : (userActivePlan?.plan.creditsInitial ?? 500);
    const dailyAmount = userActivePlan?.plan.creditsDaily ?? 50;

    await db.insert(credits).values({
      userId,
      amount: (initialAmount + dailyAmount).toString(), // Mantendo consistência de string se necessário
      creditsInitial: initialAmount.toString(),
      creditsDaily: dailyAmount.toString(),
      creditsBonus: "0",
      type: isAlianca ? "alianca" : "initial",
      expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
    }as any);
    result = await db.select().from(credits).where(eq(credits.userId, userId)).limit(1);
  }

  const data = result[0];
  const now = new Date();

  // 4. Lógica de Reset Diário
  let daily = Number(data.creditsDaily) || 0;
  const lastReset = data.lastDailyReset ? new Date(data.lastDailyReset) : new Date(0);
  
  // Se passou 1 dia desde o último reset
  if (Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)) >= 1) {
    const userActivePlan = await getUserActivePlan(userId);
    daily = userActivePlan?.plan.creditsDaily ?? 50;
    
    await db.update(credits)
      .set({ 
        creditsDaily: daily.toString(), 
        lastDailyReset: now,
        // Ao resetar o diário, atualizamos o 'amount' total (soma de todos)
        amount: sql`${credits.creditsInitial} + ${daily.toString()} + ${credits.creditsBonus}`
      }as any)
      .where(eq(credits.userId, userId));
  }

  return {
    initial: Number(data.creditsInitial) || 0,
    daily: daily,
    bonus: Number(data.creditsBonus) || 0,
    total: Number(data.amount) || 0, // O amount deve refletir o saldo real
    initialExpiry: data.expiresAt,
  };
}

/**
 * Obtém o plano ativo do usuário
 */
export async function getUserActivePlan(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const subs = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .limit(1);

  if (subs.length === 0) {
    const freePlan = await db.select().from(plans).where(eq(plans.name, 'free')).limit(1);
    return freePlan.length > 0 ? { subscription: null, plan: freePlan[0] } : null;
  }

  const planResults = await db.select().from(plans).where(eq(plans.id, subs[0].planId)).limit(1);
  return planResults.length > 0 ? { subscription: subs[0], plan: planResults[0] } : null;
}

/**
 * Deduz créditos do saldo do usuário e registra a transação
 */
export async function useCredits(userId: number, amount: number, toolName: string, toolId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Validação de Saldo Insuficiente
  const currentBalance = await db.select({ 
    amount: credits.amount 
  }).from(credits).where(eq(credits.userId, userId)).limit(1);

  if (currentBalance.length === 0 || Number(currentBalance[0].amount) < amount) {
    throw new Error("Créditos insuficientes para realizar esta análise.");
  }

  const spendAmount = Math.abs(amount) * -1;

  // 2. ATUALIZAÇÃO DO SALDO (Subtração real no banco)
  await db
    .update(credits)
    .set({
      // Deduzimos do amount principal
      amount: sql`CAST(${credits.amount} AS INTEGER) + ${spendAmount}`
    })
    .where(eq(credits.userId, userId));

  // 3. REGISTRO NO HISTÓRICO
  await db.insert(creditTransactions).values({
    userId,
    toolId: toolId || null,
    amount: spendAmount.toString(),
    type: 'usage',
    description: `Uso: ${toolName}`,
    createdAt: new Date(),
  }as any);

  return { success: true };
}