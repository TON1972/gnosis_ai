import { getDb } from "../server/db.js";
import { users, credits, plans, subscriptions } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "../shared/const.js";
import { serialize } from "cookie";
import { supabaseAdmin } from "../server/_core/supabaseAdmin.js";
import { getBasicPlan } from "../server/planHelpers.js";

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, coupon } = body;
        const db = await getDb();

        if (!db) return new Response(JSON.stringify({ success: false, message: "Banco indisponível." }), { status: 500 });

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name }
        });

        if (authError) return new Response(JSON.stringify({ success: false, message: authError.message }), { status: 400 });

        const basicPlan = await getBasicPlan(db);
        if (!basicPlan) {
            return new Response(JSON.stringify({ success: false, message: "Plano Basic não configurado." }), { status: 500 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const openId = `supabase:${authData.user.id}`;

        const [newUser] = await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            supabaseId: authData.user.id,
            openId: openId,
            loginMethod: "password",
            role: "user"
        } as any).returning({ id: users.id, email: users.email, role: users.role });

        let grantAccessWithoutPayment = false;
        let targetPlan = basicPlan;
        let subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (coupon) {
            const { coupons, couponUsages } = await import("../shared/schema.js");
            const [couponRecord] = await db.select().from(coupons).where(eq(coupons.code, coupon)).limit(1);

            if (couponRecord?.isActive && couponRecord.grantPlanId) {
                const [grantedPlan] = await db.select().from(plans).where(eq(plans.id, couponRecord.grantPlanId)).limit(1);
                if (grantedPlan) {
                    grantAccessWithoutPayment = true;
                    targetPlan = grantedPlan;
                    subscriptionEndDate = new Date(Date.now() + couponRecord.discountDays * 24 * 60 * 60 * 1000);

                    await db.insert(couponUsages).values({
                        couponId: couponRecord.id,
                        userId: newUser.id,
                        usedAt: new Date(),
                        expiresAt: subscriptionEndDate,
                        isExpired: false,
                    });
                }
            }
        }

        if (grantAccessWithoutPayment) {
            await db.insert(subscriptions).values({
                userId: newUser.id,
                planId: targetPlan.id,
                status: "active",
                startDate: new Date(),
                endDate: subscriptionEndDate
            });

            const initial = Number(targetPlan.creditsInitial ?? 0);
            const daily = Number(targetPlan.creditsDaily ?? 0);

            await db.insert(credits).values({
                userId: newUser.id,
                amount: (initial + daily).toString(),
                creditsInitial: initial.toString(),
                creditsDaily: daily.toString(),
                type: 'initial',
                createdAt: new Date(),
            } as any);
        }

        const secret = process.env.JWT_SECRET || "sua_chave_secreta_aqui";
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email, role: newUser.role },
            secret,
            { expiresIn: "7d" }
        );

        const cookieSerialized = serialize(COOKIE_NAME, token, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60,
        });

        console.log(`✅ Registro concluído: ${email} (checkout=${!grantAccessWithoutPayment})`);
        return new Response(JSON.stringify({
            success: true,
            requiresCheckout: !grantAccessWithoutPayment,
            basicPlanId: basicPlan.id,
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": cookieSerialized,
            },
        });

    } catch (error: any) {
        console.error("Erro interno no registro:", error);
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
