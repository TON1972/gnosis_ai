import { eq, desc, sql, like, or } from "drizzle-orm";
import { getDb } from "./db.js";
import { users, subscriptions, plans, creditTransactions, savedStudies, studyMessages } from "../drizzle/schema.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
});

export interface UserListItem {
    id: number;
    name: string | null;
    email: string | null;
    planName: string | null;
    planDisplayName: string | null;
    subscriptionStatus: string | null;
    stripeStatus: string | null;
    createdAt: Date;
    stripeCustomerId: string | null;
    creditsSpent: number;
    isAffiliate: boolean;
    couponCode: string | null;
}

export interface PaginatedUsers {
    users: UserListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * List users with pagination and search
 */
export async function listUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    planFilter?: string,
    sortBy: 'newest' | 'oldest' | 'credits_asc' | 'credits_desc' = 'newest',
    dateFrom?: Date,
    dateTo?: Date,
    couponFilter?: string,
    // Removed unused parameters
    _minCreditsUsed?: number,
    _maxCreditsUsed?: number
): Promise<PaginatedUsers> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [];

    if (search) {
        conditions.push(`(u.name ILIKE '%${search}%' OR u.email ILIKE '%${search}%')`);
    }

    if (planFilter && planFilter !== 'all') {
        conditions.push(`p.name = '${planFilter}'`);
    }

    // Date filters
    if (dateFrom) {
        conditions.push(`u."createdAt" >= '${dateFrom.toISOString()}'`);
    }

    if (dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        conditions.push(`u."createdAt" < '${endDate.toISOString()}'`);
    }

    if (couponFilter && couponFilter !== 'all') {
        conditions.push(`cp.code ILIKE '%${couponFilter}%'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Determine ORDER BY clause
    let orderByClause = `ORDER BY u."createdAt" DESC`; // Default
    if (sortBy === 'oldest') {
        orderByClause = `ORDER BY u."createdAt" ASC`;
    } else if (sortBy === 'credits_desc') {
        orderByClause = `ORDER BY credits_spent DESC NULLS LAST`;
    } else if (sortBy === 'credits_asc') {
        orderByClause = `ORDER BY credits_spent ASC NULLS FIRST`;
    }

    // HAVING clause no longer used for sorting
    const havingClause = '';

    // Get total count
    // NOTE: This count query needs to be simpler or use a subquery if we strictly need to count filtered by credits.
    // However, exact count for complex HAVING clauses might be heavy. Let's try to approximate or use a subquery count if filters are applied.

    // let total = 0; // Removed to avoid redeclaration error

    // Get total count
    // Since we removed credit filtering, we can always use the simpler count query
    const countQuery = sql.raw(`
        SELECT COUNT(DISTINCT u.id) as count 
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s."userId" AND s.status = 'active'
        LEFT JOIN plans p ON s."planId" = p.id
        LEFT JOIN coupon_usages cu ON u.id = cu."userId"
        LEFT JOIN coupons cp ON cu."couponId" = cp.id
        ${whereClause}
    `);
    const countResult = await db.execute(countQuery);
    const total = Number(countResult.rows[0]?.count || 0);

    // Get users with plan info and credits spent
    // We need to group by u.id for the SUM aggregation
    const query = sql.raw(`
        SELECT 
            u.id,
            u.name,
            u.email,
            u."stripeCustomerId",
            u."createdAt",
            p.name as plan_name,
            p."displayName" as plan_display_name,
            s.status as subscription_status,
            s."stripeStatus" as stripe_status,
            u."isAffiliate",
            COALESCE(ABS(SUM(ct.amount)), 0) as credits_spent,
            cp.code as coupon_code
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s."userId" AND s.status = 'active'
        LEFT JOIN plans p ON s."planId" = p.id
        LEFT JOIN credit_transactions ct ON u.id = ct."userId" AND ct.amount < 0
        LEFT JOIN coupon_usages cu ON u.id = cu."userId"
        LEFT JOIN coupons cp ON cu."couponId" = cp.id
        ${whereClause}
        GROUP BY u.id, p.name, p."displayName", s.status, s."stripeStatus", u."isAffiliate", cp.code
        ${orderByClause} 
        LIMIT ${limit} 
        OFFSET ${offset}
    `);

    const result = await db.execute(query);

    const usersList: UserListItem[] = result.rows.map((row) => ({
        id: Number(row.id),
        name: row.name as string | null,
        email: row.email as string | null,
        planName: row.plan_name as string | null,
        planDisplayName: row.plan_display_name as string | null,
        subscriptionStatus: row.subscription_status as string | null,
        stripeStatus: row.stripe_status as string | null,
        createdAt: new Date(row.createdAt as string),
        stripeCustomerId: row.stripeCustomerId as string | null,
        creditsSpent: Number(row.credits_spent || 0),
        isAffiliate: Boolean(row.isAffiliate),
        couponCode: row.coupon_code as string | null,
    }));

    return {
        users: usersList,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * List ALL users matching filters - for CSV export (no pagination)
 */
export async function listAllUsersForExport(
    search?: string,
    planFilter?: string,
    sortBy: 'newest' | 'oldest' | 'credits_asc' | 'credits_desc' = 'newest',
    dateFrom?: Date,
    dateTo?: Date,
    couponFilter?: string
): Promise<UserListItem[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Build WHERE conditions (same as listUsers)
    const conditions: string[] = [];

    if (search) {
        conditions.push(`(u.name ILIKE '%${search}%' OR u.email ILIKE '%${search}%')`);
    }

    if (planFilter && planFilter !== 'all') {
        conditions.push(`p.name = '${planFilter}'`);
    }

    // Date filters
    if (dateFrom) {
        conditions.push(`u."createdAt" >= '${dateFrom.toISOString()}'`);
    }

    if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        conditions.push(`u."createdAt" < '${endDate.toISOString()}'`);
    }

    if (couponFilter && couponFilter !== 'all') {
        conditions.push(`cp.code ILIKE '%${couponFilter}%'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Determine ORDER BY clause
    let orderByClause = `ORDER BY u."createdAt" DESC`;
    if (sortBy === 'oldest') {
        orderByClause = `ORDER BY u."createdAt" ASC`;
    } else if (sortBy === 'credits_desc') {
        orderByClause = `ORDER BY credits_spent DESC NULLS LAST`;
    } else if (sortBy === 'credits_asc') {
        orderByClause = `ORDER BY credits_spent ASC NULLS FIRST`;
    }

    // Get ALL users (no LIMIT/OFFSET)
    const query = sql.raw(`
        SELECT 
            u.id,
            u.name,
            u.email,
            u."stripeCustomerId",
            u."createdAt",
            p.name as plan_name,
            p."displayName" as plan_display_name,
            s.status as subscription_status,
            s."stripeStatus" as stripe_status,
            u."isAffiliate",
            COALESCE(ABS(SUM(ct.amount)), 0) as credits_spent,
            cp.code as coupon_code
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s."userId" AND s.status = 'active'
        LEFT JOIN plans p ON s."planId" = p.id
        LEFT JOIN credit_transactions ct ON u.id = ct."userId" AND ct.amount < 0
        LEFT JOIN coupon_usages cu ON u.id = cu."userId"
        LEFT JOIN coupons cp ON cu."couponId" = cp.id
        ${whereClause}
        GROUP BY u.id, p.name, p."displayName", s.status, s."stripeStatus", u."isAffiliate", cp.code
        ${orderByClause}
    `);

    const result = await db.execute(query);

    return result.rows.map((row) => ({
        id: Number(row.id),
        name: row.name as string | null,
        email: row.email as string | null,
        planName: row.plan_name as string | null,
        planDisplayName: row.plan_display_name as string | null,
        subscriptionStatus: row.subscription_status as string | null,
        stripeStatus: row.stripe_status as string | null,
        createdAt: new Date(row.createdAt as string),
        stripeCustomerId: row.stripeCustomerId as string | null,
        creditsSpent: Number(row.credits_spent || 0),
        isAffiliate: Boolean(row.isAffiliate),
        couponCode: row.coupon_code as string | null,
    }));
}

/**
 * Delete user and all related data
 */
export async function deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
        // 1. Get user info
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) {
            throw new Error("User not found");
        }

        // 2. Cancel Stripe subscription if exists
        if (user.stripeCustomerId) {
            try {
                const subscriptions = await stripe.subscriptions.list({
                    customer: user.stripeCustomerId,
                });

                for (const subscription of subscriptions.data) {
                    if (subscription.status === "active" || subscription.status === "trialing") {
                        await stripe.subscriptions.cancel(subscription.id);
                    }
                }
            } catch (stripeError) {
                console.error("Error canceling Stripe subscriptions:", stripeError);
                // Continue with deletion even if Stripe fails
            }
        }

        // 3. Delete related data from database
        // Delete study messages first (foreign key constraint)
        const userStudies = await db
            .select({ id: savedStudies.id })
            .from(savedStudies)
            .where(eq(savedStudies.userId, userId));

        for (const study of userStudies) {
            await db.delete(studyMessages).where(eq(studyMessages.studyId, study.id));
        }

        // Delete saved studies
        await db.delete(savedStudies).where(eq(savedStudies.userId, userId));

        // Delete credit transactions
        await db.delete(creditTransactions).where(eq(creditTransactions.userId, userId));

        // Delete payments (must be before subscriptions due to FK)
        await db.execute(sql`DELETE FROM payments WHERE "userId" = ${userId}`);

        // Delete subscriptions
        await db.delete(subscriptions).where(eq(subscriptions.userId, userId));

        // 4. Finally delete user
        await db.delete(users).where(eq(users.id, userId));

        return {
            success: true,
            message: `User ${user.name || user.email} deleted successfully`,
        };
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
}

/**
 * Get user details
 */
export async function getUserDetails(userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.execute(sql`
    SELECT 
      u.*,
      p.name as plan_name,
      p."displayName" as plan_display_name,
      s.status as subscription_status,
      s."stripeStatus" as stripe_status,
      s."nextBillingDate",
      s."billingPeriod",
      (SELECT COUNT(*) FROM saved_studies WHERE "userId" = u.id) as studies_count,
      (SELECT COUNT(*) FROM credit_transactions WHERE "userId" = u.id AND type = 'usage') as usage_count,
      (SELECT COALESCE(ABS(SUM(amount)), 0) FROM credit_transactions WHERE "userId" = u.id AND amount < 0) as credits_spent,
      cp.code as coupon_code
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s."userId" AND s.status = 'active'
    LEFT JOIN plans p ON s."planId" = p.id
    LEFT JOIN coupon_usages cu ON u.id = cu."userId"
    LEFT JOIN coupons cp ON cu."couponId" = cp.id
    WHERE u.id = ${userId}
    LIMIT 1
  `);

    if (result.rows.length === 0) {
        throw new Error("User not found");
    }

    return result.rows[0];
}
