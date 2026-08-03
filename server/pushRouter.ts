import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc.js";
import { getDb } from "./db.js";
import {
  pushSubscriptions,
  notificationPreferences,
} from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";
import { TRPCError } from "@trpc/server";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const preferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  subscriptionAlerts: z.boolean().optional(),
  creditAlerts: z.boolean().optional(),
  studyAlerts: z.boolean().optional(),
  ticketAlerts: z.boolean().optional(),
  marketingAlerts: z.boolean().optional(),
});

const defaultPreferences = {
  pushEnabled: true,
  subscriptionAlerts: true,
  creditAlerts: true,
  studyAlerts: true,
  ticketAlerts: true,
  marketingAlerts: false,
};

function getUserAgent(req: unknown): string | null {
  if (!req || typeof req !== "object") return null;
  const headers = (req as { headers?: unknown }).headers;
  if (!headers) return null;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get("user-agent");
  }
  const expressHeaders = headers as Record<string, string | string[] | undefined>;
  const ua = expressHeaders["user-agent"];
  return Array.isArray(ua) ? ua[0] : ua ?? null;
}

export const pushRouter = router({
  getVapidPublicKey: publicProcedure.query(() => ({
    publicKey: ENV.vapidPublicKey || null,
    supported: Boolean(ENV.vapidPublicKey && ENV.vapidPrivateKey),
  })),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return defaultPreferences;

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, ctx.user.id))
      .limit(1);

    if (prefs.length === 0) return defaultPreferences;
    return prefs[0];
  }),

  subscribe: protectedProcedure
    .input(subscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Push notifications não configuradas no servidor.",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(pushSubscriptions)
          .set({
            userId: ctx.user.id,
            p256dh: input.keys.p256dh,
            auth: input.keys.auth,
            userAgent: getUserAgent(ctx.req),
            isActive: true,
          })
          .where(eq(pushSubscriptions.id, existing[0].id));
      } else {
        await db.insert(pushSubscriptions).values({
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          userAgent: getUserAgent(ctx.req),
        });
      }

      const prefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id))
        .limit(1);

      if (prefs.length === 0) {
        await db.insert(notificationPreferences).values({
          userId: ctx.user.id,
        });
      }

      return { success: true };
    }),

  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(pushSubscriptions)
        .set({ isActive: false })
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        );

      return { success: true };
    }),

  updatePreferences: protectedProcedure
    .input(preferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existing = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(notificationPreferences)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(notificationPreferences.userId, ctx.user.id));
      } else {
        await db.insert(notificationPreferences).values({
          userId: ctx.user.id,
          ...input,
        });
      }

      return { success: true };
    }),
});
