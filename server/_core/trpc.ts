import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '../../shared/const.js';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context.js";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // ✅ Validate Session ID for concurrency control
  if (ctx.user.id) {
    const { getDb } = await import('../db');
    const { users } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');

    const db = await getDb();
    if (db) {
      // Check user session
      const [dbUser] = await db.select({ currentSessionId: users.currentSessionId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

      // Access sessionId from user context (needs strict type augmentation or casting if not in type definition yet)
      const tokenSessionId = (ctx.user as any).sessionId;

      console.log(`[AuthDebug] User: ${ctx.user.id} | DB Session: ${dbUser?.currentSessionId} | Token Session: ${tokenSessionId}`);

      if (dbUser && dbUser.currentSessionId && tokenSessionId && dbUser.currentSessionId !== tokenSessionId) {
        console.log('[AuthDebug] Session Mismatch! Throwing Unauthorized.');
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Sessão expirada. Você conectou em outro dispositivo."
        });
      } else if (!tokenSessionId) {
        // If token has no session ID (old token), we might want to allow or block.
        // For now, let's log it. strict mode would block it.
        console.log('[AuthDebug] Token has NO Session ID (Legacy Token?)');
      }

      // Set RLS Context (Existing logic)
      const { sql } = await import('drizzle-orm');
      try {
        await db.execute(sql`SELECT set_config('app.current_user_id', ${ctx.user.id.toString()}, true)`);
      } catch (error) {
        console.error('Failed to set RLS context:', error);
      }
    }
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
