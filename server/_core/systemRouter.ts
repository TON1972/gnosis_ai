import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { users, userCredits, plans } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  migrateUserCredits: adminProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get FREE plan
      const freePlanResult = await db.select().from(plans).where(eq(plans.name, 'free')).limit(1);
      if (freePlanResult.length === 0) {
        throw new Error("FREE plan not found in database");
      }
      const freePlan = freePlanResult[0];

      // Get all users
      const allUsers = await db.select().from(users);
      
      let migrated = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const user of allUsers) {
        try {
          // Check if user already has credits
          const existingCredits = await db.select().from(userCredits).where(eq(userCredits.userId, user.id)).limit(1);
          
          if (existingCredits.length > 0) {
            skipped++;
            continue;
          }

          // Create credits for user
          const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
          
          await db.insert(userCredits).values({
            userId: user.id,
            creditsInitial: freePlan.creditsInitial,
            creditsDaily: freePlan.creditsDaily,
            creditsBonus: 0,
            creditsInitialExpiry: expiryDate,
            lastDailyReset: new Date(),
          });

          migrated++;
        } catch (error) {
          errors.push(`User ${user.id} (${user.email}): ${error}`);
        }
      }

      return {
        success: true,
        totalUsers: allUsers.length,
        migrated,
        skipped,
        errors,
      };
    }),
});
