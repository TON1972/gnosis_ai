
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getDb } from "../../../server/db";
import { users, plans, subscriptions, credits } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../../../server/_core/env";
import { COOKIE_NAME } from "../../../shared/const";
import { getSessionCookieOptions } from "../../../server/_core/cookies";
import { supabaseAdmin } from "../../../server/_core/supabaseAdmin";

export const runtime = 'nodejs';

const CALLBACK_URL_BASE = (process.env.NODE_ENV === "development" || !process.env.NODE_ENV)
    ? "http://localhost:3000"
    : (process.env.NEXTAUTH_URL || "https://gnosis-ai-platform.vercel.app");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

interface AuthUser {
    id: number;
    email: string;
    name: string | null;
    role: string;
    loginMethod: string;
}

function generateJWT(user: AuthUser): string {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        ENV.jwtSecret,
        { expiresIn: "7d" }
    );
}

function setSessionCookie(res: Response, req: Request, token: string) {
    const cookieOptions = getSessionCookieOptions(req);
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
}

export default async function handler(req: Request, res: Response) {
    try {
        const { code } = req.query;
        if (!code || typeof code !== "string") return res.redirect("/auth?error=google_no_code");

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: `${CALLBACK_URL_BASE}/api/oauth/google/callback`,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenRes.json();
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const userData = await userRes.json();
        const { email, name, id: googleId } = userData;
        const openId = `google:${googleId}`;

        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Verifica se usuário já existe
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

        let authUser: AuthUser;

        if (existing.length > 0) {
            const dbUser = existing[0];
            authUser = { id: dbUser.id, email: dbUser.email!, name: dbUser.name, role: dbUser.role, loginMethod: dbUser.loginMethod || "google" };
        } else {
            // 🚀 NOVO USUÁRIO: Recupera plano do cookie e cria estrutura completa

            // 1. Recuperar plano pendente do cookie
            // Em Vercel functions/Express, req.cookies pode não estar populado sem middleware, mas Vercel costuma popular
            const pendingPlanId = Number(req.cookies?.pending_plan_id || 1);

            const [selectedPlan] = await db.select().from(plans).where(eq(plans.id, pendingPlanId)).limit(1);

            // Fallback para plano 1 se não encontrar (segurança)
            const safePlan = selectedPlan || (await db.select().from(plans).where(eq(plans.id, 1)).limit(1))[0];

            if (!safePlan) throw new Error("Sistema sem planos configurados.");

            // 2. Criar Usuário Local

            // A. Sincronizar com Supabase Auth (Criar usuário lá se não existir)
            let supabaseId = "";
            try {
                const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    email_confirm: true,
                    user_metadata: { full_name: name }
                });

                if (authError) {
                    const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
                    const found = listUsers.users.find(u => u.email === email);
                    if (found) {
                        supabaseId = found.id;
                    } else {
                        console.error("Erro ao criar usuário no Supabase:", authError);
                    }
                } else {
                    supabaseId = authUser.user.id;
                }
            } catch (err) {
                console.error("Erro ao conectar Supabase Admin:", err);
            }

            // B. Inserir no Banco Local
            const [inserted] = await db.insert(users).values({
                email,
                openId,
                supabaseId: supabaseId || null,
                name: name || null,
                role: "user",
                loginMethod: "google",
            }).returning();

            const newUserId = inserted.id;

            // 3. Criar Assinatura
            await db.insert(subscriptions).values({
                userId: newUserId,
                planId: safePlan.id,
                status: "active",
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });

            // 4. Criar Créditos Iniciais
            const initial = Number(safePlan.creditsInitial ?? 0);
            const daily = Number(safePlan.creditsDaily ?? 0);

            await db.insert(credits).values({
                userId: newUserId,
                amount: (initial + daily).toString(),
                creditsInitial: initial.toString(),
                creditsDaily: daily.toString(),
                type: safePlan.name === 'alianca' ? 'alianca' : 'initial',
                createdAt: new Date(),
            } as any);

            authUser = { id: newUserId, email, name: name || null, role: "user", loginMethod: "google" };

            // Limpa o cookie de plano
            res.setHeader('Set-Cookie', `pending_plan_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        }

        // Set Session Cookie e Redirect
        const token = generateJWT(authUser);
        const cookieOptions = getSessionCookieOptions(req);
        // Vercel serverless functions usam setHeader para cookies
        // Mas se res for Response do express, res.cookie funciona. Vamos garantir com setHeader que é universal.
        // Concatenando múltiplos cookies se necessário, mas aqui é o principal.
        res.setHeader('Set-Cookie', [
            `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
            `pending_plan_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        ]);

        res.redirect("/dashboard");
    } catch (error: any) {
        console.error("[OAuth Error]:", error);
        res.redirect(`/auth?error=${encodeURIComponent(error.message || "Unknown error")}`);
    }
}
