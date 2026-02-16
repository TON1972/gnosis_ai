import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { getDb } from "./db.js";
import { users, plans, subscriptions, credits } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env.js";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { supabaseAdmin } from "./_core/supabaseAdmin.js";

const router = Router();

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
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/**
 * GOOGLE OAUTH
 */
router.get("/oauth/google", (req: Request, res: Response) => {
  const redirectUri = `${CALLBACK_URL_BASE}/api/oauth/google/callback`;
  const scope = "openid profile email";
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
  res.redirect(url);
});

router.get("/oauth/google/callback", async (req: Request, res: Response) => {
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
    const { email, name, id: googleId } = userData; // Use Google ID
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
      // 🚀 NOVO USUÁRIO: Cria sempre como FREE inicialmente

      // 1. Busca sempre o plano FREE (id=1)
      const [freePlan] = await db.select().from(plans).where(eq(plans.id, 1)).limit(1);
      if (!freePlan) throw new Error("Plano FREE não encontrado.");

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

      // 3. Criar Assinatura FREE
      await db.insert(subscriptions).values({
        userId: newUserId,
        planId: freePlan.id,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // 4. Criar Créditos Iniciais do FREE
      const initial = Number(freePlan.creditsInitial ?? 0);
      const daily = Number(freePlan.creditsDaily ?? 0);

      await db.insert(credits).values({
        userId: newUserId,
        amount: (initial + daily).toString(),
        creditsInitial: initial.toString(),
        creditsDaily: daily.toString(),
        type: 'initial',
        createdAt: new Date(),
      } as any);

      authUser = { id: newUserId, email, name: name || null, role: "user", loginMethod: "google" };
    }

    setSessionCookie(res, req, generateJWT(authUser));

    // Verificar se havia um plano pago pendente no cookie
    const pendingPlanId = Number(req.cookies?.pending_plan_id || 1);
    const pendingBilling = req.cookies?.pending_billing_period || 'yearly';

    // Limpa cookies
    res.clearCookie('pending_plan_id');
    res.clearCookie('pending_billing_period');

    // Se o plano pendente for pago (>1), redireciona para o checkout
    if (pendingPlanId > 1) {
      res.redirect(`/auth?google_checkout=true&plan=${pendingPlanId}&billing=${pendingBilling}`);
    } else {
      res.redirect("/dashboard");
    }

  } catch (error: any) {
    console.error("[OAuth Error]:", error);
    res.redirect(`/auth?error=${encodeURIComponent(error.message || "Unknown error")}`);
  }
});

export { router as oauthRouter };