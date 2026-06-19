
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getDb } from "../../../server/db.js";
import { users } from "../../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { ENV } from "../../../server/_core/env.js";
import { COOKIE_NAME } from "../../../shared/const.js";
import { getSessionCookieOptions } from "../../../server/_core/cookies.js";
import { supabaseAdmin } from "../../../server/_core/supabaseAdmin.js";

export const runtime = 'nodejs';

const CALLBACK_URL_BASE = (process.env.NODE_ENV === "development" || !process.env.NODE_ENV)
    ? "http://localhost:3000"
    : (process.env.NEXTAUTH_URL || "https://gnosis-ai.vercel.app");

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

        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

        let authUser: AuthUser;
        let isNewUser = false;

        if (existing.length > 0) {
            const dbUser = existing[0];
            authUser = { id: dbUser.id, email: dbUser.email!, name: dbUser.name, role: dbUser.role, loginMethod: dbUser.loginMethod || "google" };
        } else {
            isNewUser = true;

            let supabaseId = "";
            try {
                const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
                    supabaseId = authUserData.user.id;
                }
            } catch (err) {
                console.error("Erro ao conectar Supabase Admin:", err);
            }

            const [inserted] = await db.insert(users).values({
                email,
                openId,
                supabaseId: supabaseId || null,
                name: name || null,
                role: "user",
                loginMethod: "google",
            }).returning();

            authUser = { id: inserted.id, email, name: name || null, role: "user", loginMethod: "google" };
        }

        const token = generateJWT(authUser);
        const pendingPlanId = Number(req.cookies?.pending_plan_id || 0);
        const pendingBilling = req.cookies?.pending_billing_period || 'yearly';

        res.setHeader('Set-Cookie', [
            `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
            `pending_plan_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
            `pending_billing_period=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        ]);

        if (isNewUser) {
            if (pendingPlanId > 0) {
                res.redirect(`/dashboard?requirePayment=1&plan=${pendingPlanId}&billing=${pendingBilling}`);
            } else {
                res.redirect("/dashboard?requirePayment=1");
            }
        } else if (pendingPlanId > 0) {
            res.redirect(`/auth?google_checkout=true&plan=${pendingPlanId}&billing=${pendingBilling}`);
        } else {
            res.redirect("/dashboard?freshLogin=1");
        }
    } catch (error: any) {
        console.error("[OAuth Error]:", error);
        res.redirect(`/auth?error=${encodeURIComponent(error.message || "Unknown error")}`);
    }
}
