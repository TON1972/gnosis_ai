import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { getDb } from "./db.js";
import { users, subscriptions, plans } from "../drizzle/schema.js";

/**
 * Admin functions for dashboard
 */

export interface UserStats {
  totalUsers: number;
  freeUsers: number;
  paidUsers: number;
}

export interface PlanDistribution {
  planName: string;
  displayName: string;
  userCount: number;
  color: string;
}

export interface FinancialDay {
  date: string;
  subscriptionsExpiring: number;
  totalValue: number;
}

export interface DelinquentUser {
  userId: number;
  userName: string;
  userEmail: string;
  planName: string;
  nextBillingDate: Date;
  daysOverdue: number;
  subscriptionValue: number;
}

export interface ToolUsageStat {
  toolId: number;
  toolName: string;
  studyCount: number;
  messageCount: number;
  userCount: number;
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Query real data from Supabase
  // Count paid and free users based on active subscriptions AND Stripe payment
  const userStatsResult = await db.execute(sql`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      COUNT(DISTINCT CASE 
        WHEN s.status = 'active' AND p.name NOT IN ('free', 'basic') 
        THEN u.id 
      END) as paid_users,
      (SELECT COUNT(*) FROM users) - COUNT(DISTINCT CASE 
        WHEN s.status = 'active' AND p.name NOT IN ('free', 'basic') 
        THEN u.id 
      END) as free_users
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s."userId"
    LEFT JOIN plans p ON s."planId" = p.id
  `);

  const totalUsers = Number(userStatsResult.rows[0]?.total_users || 0);
  const paidUsers = Number(userStatsResult.rows[0]?.paid_users || 0);
  const freeUsers = Number(userStatsResult.rows[0]?.free_users || 0);

  return {
    totalUsers,
    freeUsers,
    paidUsers,
  };
}

/**
 * Get distribution of users by plan
 */
export async function getUsersByPlan(): Promise<PlanDistribution[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(sql`
    SELECT 
      p.name as plan_name,
      p."displayName" as display_name,
      COUNT(DISTINCT u.id) as user_count
    FROM users u
    INNER JOIN subscriptions s ON u.id = s."userId"
    INNER JOIN plans p ON s."planId" = p.id
    WHERE s.status = 'active'
    GROUP BY p.name, p."displayName"
    ORDER BY user_count DESC
  `);

  // Define cores para cada plano
  const colorMap: Record<string, string> = {
    'basic': '#94a3b8',
    'free': '#94a3b8',
    'lumen': '#3b82f6',
    'alianca': '#8b5cf6',
    'premium': '#d4af37',
  };

  return result.rows.map((row) => ({
    planName: row.plan_name as string,
    displayName: row.display_name as string,
    userCount: Number(row.user_count || 0),
    color: colorMap[row.plan_name as string] || '#6b7280',
  }));
}

/**
 * Get financial calendar for current month
 */
export async function getFinancialCalendar(): Promise<FinancialDay[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Query subscriptions expiring this month using raw SQL
  const result = await db.execute(sql`
    SELECT 
      s."nextBillingDate",
      p."priceMonthly",
      p."priceYearly",
      s."billingPeriod"
    FROM subscriptions s
    INNER JOIN plans p ON s."planId" = p.id
    WHERE s.status = 'active'
      AND p.name != 'FREE'
      AND s."nextBillingDate" >= ${startOfMonth}
      AND s."nextBillingDate" <= ${endOfMonth}
    ORDER BY s."nextBillingDate"
  `);

  // Group by date
  const calendar: Record<string, { count: number; total: number }> = {};

  for (const row of result.rows) {
    const nextBillingDate = row.nextBillingDate as Date;
    if (!nextBillingDate) continue;

    const dateKey = new Date(nextBillingDate).toISOString().split("T")[0];
    const priceMonthly = Number(row.priceMonthly || 0);
    const priceYearly = Number(row.priceYearly || 0);
    const billingPeriod = row.billingPeriod as string;

    const value =
      billingPeriod === "yearly"
        ? (priceYearly || priceMonthly * 12) / 100
        : priceMonthly / 100;

    if (!calendar[dateKey]) {
      calendar[dateKey] = { count: 0, total: 0 };
    }

    calendar[dateKey].count++;
    calendar[dateKey].total += value;
  }

  // Convert to array
  const financialDays: FinancialDay[] = [];
  for (const [date, data] of Object.entries(calendar)) {
    financialDays.push({
      date,
      subscriptionsExpiring: data.count,
      totalValue: data.total,
    });
  }

  return financialDays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get list of delinquent users
 */
export async function getDelinquentUsers(
  startDate?: Date,
  endDate?: Date
): Promise<DelinquentUser[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();

  // Build SQL query with optional date filters
  let query = sql`
    SELECT 
      u.id as "userId",
      u.name as "userName",
      u.email as "userEmail",
      p."displayName" as "planName",
      s."nextBillingDate",
      p."priceMonthly",
      p."priceYearly",
      s."billingPeriod"
    FROM subscriptions s
    INNER JOIN users u ON s."userId" = u.id
    INNER JOIN plans p ON s."planId" = p.id
    WHERE s.status IN ('grace_period', 'blocked')
      AND p.name != 'FREE'
  `;

  // Add date filters if provided
  if (startDate) {
    query = sql`${query} AND s."nextBillingDate" >= ${startDate}`;
  }
  if (endDate) {
    query = sql`${query} AND s."nextBillingDate" <= ${endDate}`;
  }

  query = sql`${query} ORDER BY s."nextBillingDate" DESC`;

  const result = await db.execute(query);

  return result.rows.map((row) => {
    const nextBillingDate = row.nextBillingDate as Date | null;
    const daysOverdue = nextBillingDate
      ? Math.floor(
        (now.getTime() - new Date(nextBillingDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      : 0;

    const priceMonthly = Number(row.priceMonthly || 0);
    const priceYearly = Number(row.priceYearly || 0);
    const billingPeriod = row.billingPeriod as string;

    const subscriptionValue =
      billingPeriod === "yearly"
        ? (priceYearly || priceMonthly * 12) / 100
        : priceMonthly / 100;

    return {
      userId: Number(row.userId),
      userName: (row.userName as string) || "Sem nome",
      userEmail: (row.userEmail as string) || "Sem email",
      planName: row.planName as string,
      nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : new Date(),
      daysOverdue,
      subscriptionValue,
    };
  });
}

/**
 * Get tool usage statistics (studies, messages, speakers)
 */
export async function getToolUsageStats(
  startDate?: Date,
  endDate?: Date
): Promise<ToolUsageStat[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Base query for studies and users
  let query = sql`
    WITH tool_metrics AS (
      SELECT 
        COALESCE(ss."toolId", 0) as tool_id,
        "toolName" as tool_name,
        COUNT(DISTINCT ss.id) as study_count,
        COUNT(DISTINCT ss."userId") as user_count
      FROM saved_studies ss
      WHERE 1=1
  `;

  if (startDate) {
    query = sql`${query} AND ss."createdAt" >= ${startDate}`;
  }
  if (endDate) {
    query = sql`${query} AND ss."createdAt" <= ${endDate}`;
  }

  query = sql`${query}
      GROUP BY COALESCE(ss."toolId", 0), "toolName"
    ),
    message_metrics AS (
      SELECT 
        COALESCE(ss."toolId", 0) as tool_id,
        COUNT(DISTINCT sm.id) as message_count
      FROM study_messages sm
      JOIN saved_studies ss ON sm.study_id = ss.id
      WHERE 1=1
  `;

  if (startDate) {
    query = sql`${query} AND sm.created_at >= ${startDate}`;
  }
  if (endDate) {
    query = sql`${query} AND sm.created_at <= ${endDate}`;
  }

  query = sql`${query}
      GROUP BY COALESCE(ss."toolId", 0)
    )
    SELECT 
      tm.tool_id,
      tm.tool_name,
      tm.study_count,
      tm.user_count,
      COALESCE(mm.message_count, 0) as message_count
    FROM tool_metrics tm
    LEFT JOIN message_metrics mm ON tm.tool_id = mm.tool_id
    ORDER BY tm.study_count DESC
  `;

  const result = await db.execute(query);

  return result.rows.map((row) => ({
    toolId: Number(row.tool_id),
    toolName: String(row.tool_name),
    studyCount: Number(row.study_count),
    messageCount: Number(row.message_count),
    userCount: Number(row.user_count),
  }));
}

