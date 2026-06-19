import { eq, and, sql } from "drizzle-orm";
import { getDb } from "./db.js";
// Certifique-se de que o caminho do schema está correto conforme seu projeto (shared ou drizzle)
import { credits, creditTransactions, subscriptions, users, plans } from "../drizzle/schema.js";

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
    } as any);
    result = await db.select().from(credits).where(eq(credits.userId, userId)).limit(1);
  }

  const data = result[0];
  const now = new Date();

  // 4. Lógica de Reset Diário
  let daily = Number(data.creditsDaily) || 0;
  let initial = Number(data.creditsInitial) || 0;
  let bonus = Number(data.creditsBonus) || 0;

  const lastReset = data.lastDailyReset ? new Date(data.lastDailyReset) : new Date(0);

  // Se passou 1 dia desde o último reset
  if (Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)) >= 1) {
    const userActivePlan = await getUserActivePlan(userId);
    daily = userActivePlan?.plan.creditsDaily ?? 50;

    // Recalcula o total
    const totalAmount = initial + daily + bonus;

    await db.update(credits)
      .set({
        creditsDaily: daily.toString(),
        lastDailyReset: now,
        // Ao resetar o diário, atualizamos o 'amount' total (soma de todos)
        amount: totalAmount.toString()
      } as any)
      .where(eq(credits.userId, userId));
  }

  return {
    initial: initial,
    daily: daily,
    bonus: bonus,
    total: initial + daily + bonus,
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
    return null;
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

  // 0. Atualiza/Checa reset diário ANTES de ler o saldo
  await getUserCredits(userId);

  // 1. Busca saldos atuais
  const currentCredit = await db.select().from(credits).where(eq(credits.userId, userId)).limit(1);

  if (currentCredit.length === 0) {
    throw new Error("Créditos não encontrados.");
  }

  const data = currentCredit[0];
  let daily = Number(data.creditsDaily) || 0;
  let monthly = Number(data.creditsInitial) || 0; // Usando campo initial como mensal/acumulado
  let bonus = Number(data.creditsBonus) || 0;
  const total = daily + monthly + bonus;

  // 2. Validação de Saldo
  if (total < amount) {
    throw new Error("Créditos insuficientes para realizar esta análise.");
  }

  // 3. Lógica de Consumo em Cascata (Daily -> Monthly -> Bonus)
  let remainingCost = amount;
  let spentDaily = 0;
  let spentMonthly = 0;
  let spentBonus = 0;

  // Consome Diário
  if (daily > 0) {
    const debit = Math.min(daily, remainingCost);
    daily -= debit;
    remainingCost -= debit;
    spentDaily = debit;
  }

  // Consome Mensal (Initial)
  if (remainingCost > 0 && monthly > 0) {
    const debit = Math.min(monthly, remainingCost);
    monthly -= debit;
    remainingCost -= debit;
    spentMonthly = debit;
  }

  // Consome Bonus
  if (remainingCost > 0 && bonus > 0) {
    const debit = Math.min(bonus, remainingCost);
    bonus -= debit;
    remainingCost -= debit;
    spentBonus = debit;
  }

  // Recalcula total final
  const newTotal = daily + monthly + bonus;

  // 4. Atualiza Banco
  await db
    .update(credits)
    .set({
      amount: newTotal.toString(),
      creditsDaily: daily.toString(),
      creditsInitial: monthly.toString(),
      creditsBonus: bonus.toString()
    } as any)
    .where(eq(credits.userId, userId));

  // 5. REGISTRO NO HISTÓRICO
  await db.insert(creditTransactions).values({
    userId,
    toolId: toolId || null,
    amount: (-amount).toString(),
    type: 'usage',
    description: `Uso: ${toolName} (D:${spentDaily}, M:${spentMonthly}, B:${spentBonus})`,
    balanceBefore: total,
    balanceAfter: newTotal,
    toolUsed: toolName,
    createdAt: new Date(),
  } as any);

  return { success: true };
}