import { getDb } from "../server/db.js";
import { users, credits } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "../shared/const.js";
import { serialize } from "cookie";
import { supabaseAdmin } from "../server/_core/supabaseAdmin.js";
import { ensureUserFreeAccess } from "../server/freeAccess.js";

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

        const freePlan = await ensureUserFreeAccess(db, newUser.id);

        if (coupon) {
            const { coupons, couponUsages } = await import("../shared/schema.js");
            const [couponRecord] = await db.select().from(coupons).where(eq(coupons.code, coupon)).limit(1);
            const now = new Date();
            const isExpired = couponRecord?.expirationDate && new Date(couponRecord.expirationDate) < now;

            if (!couponRecord) {
                return new Response(JSON.stringify({ success: false, message: "Cupom não encontrado." }), { status: 400 });
            }
            if (!couponRecord.isActive || isExpired) {
                return new Response(JSON.stringify({ success: false, message: "Cupom inválido ou expirado." }), { status: 400 });
            }

            const couponExpiresAt = new Date(Date.now() + couponRecord.discountDays * 24 * 60 * 60 * 1000);
            await db.insert(couponUsages).values({
                couponId: couponRecord.id,
                userId: newUser.id,
                usedAt: new Date(),
                expiresAt: couponExpiresAt,
                isExpired: false,
            });

            const bonusFromCoupon = Number(couponRecord.bonusCredits ?? 0);
            if (bonusFromCoupon > 0) {
                const [row] = await db.select().from(credits).where(eq(credits.userId, newUser.id)).limit(1);
                if (row) {
                    await db.update(credits).set({
                        creditsBonus: (Number(row.creditsBonus) || 0) + bonusFromCoupon,
                        amount: (Number(row.amount) || 0) + bonusFromCoupon,
                    }).where(eq(credits.id, row.id));
                }
            }
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

        console.log(`✅ Registro Free concluído: ${email}`);
        return new Response(JSON.stringify({
            success: true,
            requiresCheckout: false,
            basicPlanId: freePlan.id,
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
