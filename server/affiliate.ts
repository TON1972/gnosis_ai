import { router, protectedProcedure, publicProcedure } from "./_core/trpc.js";
import { z } from "zod";
import { getDb } from "./db.js";
import { users, affiliateCommissions, affiliatePayouts, subscriptions, plans } from "../drizzle/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const affiliateRouter = router({
  // Get current user affiliate status and link
  getAffiliateStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
      columns: {
        isAffiliate: true,
        affiliateCode: true,
        commissionPercentage: true,
      }
    });

    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    return user;
  }),

  // Generate or regenerate affiliate code
  generateCode: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const code = nanoid(10).toUpperCase();

    await db.update(users)
      .set({ affiliateCode: code })
      .where(eq(users.id, ctx.user.id));

    return { code };
  }),

  // Get commissions for current user
  getCommissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const commissions = await db.select({
      id: affiliateCommissions.id,
      amount: affiliateCommissions.amount,
      status: affiliateCommissions.status,
      createdAt: affiliateCommissions.createdAt,
      referredUserName: users.name,
      planName: plans.displayName,
    })
    .from(affiliateCommissions)
    .innerJoin(users, eq(affiliateCommissions.referredUserId, users.id))
    .innerJoin(subscriptions, eq(affiliateCommissions.subscriptionId, subscriptions.id))
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(affiliateCommissions.affiliateId, ctx.user.id))
    .orderBy(desc(affiliateCommissions.createdAt));

    return commissions;
  }),

  // Get affiliate stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Total earnings (all statuses except cancelled?)
    const earnings = await db.select({
      total: sql<number>`sum(case when status != 'cancelled' then amount else 0 end)`,
      pending: sql<number>`sum(case when status = 'pending' then amount else 0 end)`,
      paid: sql<number>`sum(case when status = 'paid' then amount else 0 end)`,
    })
    .from(affiliateCommissions)
    .where(eq(affiliateCommissions.affiliateId, ctx.user.id));

    // Total referrals count
    const referrals = await db.select({
      count: sql<number>`count(*)`
    })
    .from(users)
    .where(eq(users.referredBy, ctx.user.id));

    return {
      earnings: earnings[0] || { total: 0, pending: 0, paid: 0 },
      referralsCount: referrals[0]?.count || 0,
    };
  }),

  // Super Admin: Update user affiliate status
  updateUserAffiliateStatus: protectedProcedure
    .input(z.object({
      userId: z.number(),
      isAffiliate: z.boolean(),
      commissionPercentage: z.number().min(0).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Generate a code if joining for the first time
      let updateData: any = {
        isAffiliate: input.isAffiliate,
        commissionPercentage: input.commissionPercentage,
      };

      if (input.isAffiliate) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, input.userId),
          columns: { affiliateCode: true }
        });
        if (!user?.affiliateCode) {
          updateData.affiliateCode = nanoid(10).toUpperCase();
        }
      }

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Get payout history
  getPayouts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    return await db.select()
      .from(affiliatePayouts)
      .where(eq(affiliatePayouts.affiliateId, ctx.user.id))
      .orderBy(desc(affiliatePayouts.createdAt));
  }),

  // Super Admin: Get global stats
  getGlobalStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'super_admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const stats = await db.select({
      totalCommissions: sql<number>`sum(amount)`,
      pendingCommissions: sql<number>`sum(case when status = 'pending' then amount else 0 end)`,
      paidCommissions: sql<number>`sum(case when status = 'paid' then amount else 0 end)`,
    })
    .from(affiliateCommissions);

    const activeAffiliates = await db.select({
      count: sql<number>`count(*)`
    })
    .from(users)
    .where(eq(users.isAffiliate, true));

    return {
      commissions: stats[0] || { totalCommissions: 0, pendingCommissions: 0, paidCommissions: 0 },
      activeAffiliates: activeAffiliates[0]?.count || 0,
    };
  }),

  // Super Admin: Get all commissions
  getAllCommissions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'super_admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Usando SQL bruto para facilitar o join duplo com a mesma tabela
    const commissions = await db.execute(sql`
      SELECT 
        ac.id,
        ac.amount,
        ac.status,
        ac."createdAt",
        u1.name as "affiliateName",
        u1.email as "affiliateEmail",
        u2.name as "referredUserName",
        p."displayName" as "planName"
      FROM affiliate_commissions ac
      JOIN users u1 ON ac."affiliateId" = u1.id
      JOIN users u2 ON ac."referredUserId" = u2.id
      JOIN subscriptions s ON ac."subscriptionId" = s.id
      JOIN plans p ON s."planId" = p.id
      ORDER BY ac."createdAt" DESC
    `);

    return commissions.rows || [];
  }),

  // Super Admin: Get all payouts
  getAllPayouts: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'super_admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const payoutsList = await db.select({
      id: affiliatePayouts.id,
      amount: affiliatePayouts.amount,
      status: affiliatePayouts.status,
      createdAt: affiliatePayouts.createdAt,
      paidAt: affiliatePayouts.paidAt,
      paymentMethod: affiliatePayouts.paymentMethod,
      affiliateName: users.name,
      affiliateEmail: users.email,
    })
    .from(affiliatePayouts)
    .innerJoin(users, eq(affiliatePayouts.affiliateId, users.id))
    .orderBy(desc(affiliatePayouts.createdAt));

    return payoutsList;
  }),

  // Super Admin: Process Payout
  processPayout: protectedProcedure
    .input(z.object({
      payoutId: z.number(),
      status: z.enum(['paid', 'cancelled']),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(affiliatePayouts)
        .set({ 
          status: input.status, 
          paidAt: input.status === 'paid' ? new Date() : null 
        })
        .where(eq(affiliatePayouts.id, input.payoutId));

      return { success: true };
    }),

  // Super Admin: Registrar um novo pagamento e vincular às comissões
  registerPayout: protectedProcedure
    .input(z.object({
      affiliateId: z.number(),
      amount: z.number(),
      paymentMethod: z.string().optional(),
      commissionIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      return await db.transaction(async (tx) => {
        // 1. Criar o registro de payout
        const [payout] = await tx.insert(affiliatePayouts).values({
          affiliateId: input.affiliateId,
          amount: input.amount,
          status: 'paid',
          paymentMethod: input.paymentMethod || 'Manual',
          paidAt: new Date(),
        }).returning();

        // 2. Vincular as comissões a este payout e marcar como pagas
        if (input.commissionIds.length > 0) {
          // Usamos sql bruto para o IN se o drizzle-orm/expressions não estiver disponível facilmente
          // ou simplesmente map se a lista for pequena, mas IN é melhor.
          await tx.update(affiliateCommissions)
            .set({ 
              status: 'paid',
              payoutId: payout.id,
              updatedAt: new Date()
            })
            .where(sql`${affiliateCommissions.id} IN (${sql.join(input.commissionIds, sql`, `)})`);
        }

        return payout;
      });
    }),
});
