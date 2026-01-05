import { getDb } from "../server/db";
import { users, credits, plans, subscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "../shared/const";
import { serialize } from "cookie";
import { supabaseAdmin } from "../server/_core/supabaseAdmin";

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, planId } = body;
        const db = await getDb();

        if (!db) return new Response(JSON.stringify({ success: false, message: "Banco indisponível." }), { status: 500 });

        // 1. Criar no Supabase (Admin API)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name }
        });

        if (authError) return new Response(JSON.stringify({ success: false, message: authError.message }), { status: 400 });

        // 2. Localização do Plano
        const [selectedPlan] = await db.select().from(plans).where(eq(plans.id, Number(planId))).limit(1);
        if (!selectedPlan) throw new Error("Plano selecionado não existe.");

        // 3. Persistência no Banco Local com openId para evitar erro de constraint
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

        // 4. Ativação de Assinatura e Créditos
        await db.insert(subscriptions).values({
            userId: newUser.id,
            planId: selectedPlan.id,
            status: "active",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        const initial = Number(selectedPlan.creditsInitial ?? 0);
        const daily = Number(selectedPlan.creditsDaily ?? 0);

        await db.insert(credits).values({
            userId: newUser.id,
            amount: (initial + daily).toString(),
            creditsInitial: initial.toString(),
            creditsDaily: daily.toString(),
            type: selectedPlan.name === 'alianca' ? 'alianca' : 'initial',
            createdAt: new Date(),
        } as any);

        // ✅ 5. LOGAR AUTOMATICAMENTE: Gerar Token JWT imediatamente
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
            maxAge: 7 * 24 * 60 * 60, // 7 dias
        });

        console.log(`✅ Registro e Login Automático concluídos: ${email}`);
        return new Response(JSON.stringify({ success: true }), {
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
