import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '../../shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

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

  // ✅ Set RLS context for database queries
  // This allows RLS policies to use current_setting('app.current_user_id')
  if (ctx.user.id) {
    const { getDb } = await import('../db');
    const { sql } = await import('drizzle-orm');
    const db = await getDb();
    if (db) {
      try {
        await db.execute(sql`SET LOCAL app.current_user_id = ${ctx.user.id.toString()}`);
      } catch (error) {
        console.error('Failed to set RLS context:', error);
        // Don't fail the request if RLS context setting fails
        // This allows the app to work even if RLS is not enabled yet
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
