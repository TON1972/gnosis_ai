// server/index.ts

import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import jwt from "jsonwebtoken";

import { appRouter } from "../routers.js";
import { oauthRouter } from "../oauth.js";
import { createContext } from "./context.js";
import { serveStatic, setupVite } from "./vite.js";
import { handleMercadoPagoWebhook } from "./webhookHandler.js";
import { handleStripeWebhook } from "../stripeWebhook.js";
import { handleResendWebhook } from "../resendWebhook.js";
import { COOKIE_NAME } from "../../shared/const.js";
import { getSessionCookieOptions } from "./cookies.js";
import { mobileRouter } from "../mobileApi.js";
import { ensureUserFreeAccess } from "../freeAccess.js";

// Integração com Banco de Dados e Schema
import { getDb } from "../db.js";
import { users, credits } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// ✅ Import do cliente Admin (essencial para evitar o erro "User not allowed")
import { supabaseAdmin } from "./supabaseAdmin.js";

const app = express();

/**
 * ⚠️ STRIPE WEBHOOK NEEDS RAW BODY
 * Must be defined BEFORE global express.json()
 */
app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api", oauthRouter);

/**
 * 🚀 REGISTRO - SUPABASE + PLANOS + CRÉDITOS
 */
// server/index.ts

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

import { z } from "zod";

// Schema de Validação
const registerSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  email: z.string().email("Email inválido").refine((email) => {
    const lowerEmail = email.toLowerCase();

    // 1. Validar provedores comuns estritamente
    if (lowerEmail.includes("@gmail")) {
      return lowerEmail.endsWith("@gmail.com");
    }
    if (lowerEmail.includes("@hotmail")) {
      return lowerEmail.endsWith("@hotmail.com") || lowerEmail.endsWith("@hotmail.com.br");
    }
    if (lowerEmail.includes("@outlook")) {
      return lowerEmail.endsWith("@outlook.com") || lowerEmail.endsWith("@outlook.com.br");
    }
    if (lowerEmail.includes("@yahoo")) {
      return lowerEmail.endsWith("@yahoo.com") || lowerEmail.endsWith("@yahoo.com.br");
    }

    // 2. Lista negra geral de typos para outros domínios
    const typos = [".comcom", ".coom", ".comm", ".cmo", ".con", ".ocmoc"];
    return !typos.some(typo => lowerEmail.endsWith(typo));
  }, "Email com formato inválido ou com erro de digitação. Verifique o provedor (ex: @gmail.com)."),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  planId: z.any().optional(),
  affiliateCode: z.string().optional(),
  coupon: z.string().optional()
});

app.post("/api/register", async (req, res) => {
  try {
    // Validate Input
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0].message
      });
    }

    const { name, email, password, affiliateCode } = parseResult.data;
    const db = await getDb();

    if (!db) return res.status(500).json({ success: false, message: "Banco indisponível." });

    // 1. Criar no Supabase (Admin API)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (authError) return res.status(400).json({ success: false, message: authError.message });

    const hashedPassword = await bcrypt.hash(password, 10);
    const openId = `supabase:${authData.user.id}`;
    const sessionId = crypto.randomUUID();

    let referredById = null;
    if (affiliateCode) {
      const [affiliate] = await db.select({ id: users.id }).from(users).where(eq(users.affiliateCode, affiliateCode)).limit(1);
      if (affiliate) {
        referredById = affiliate.id;
        console.log(`>>> DEBUG REGISTER: User referred by ${affiliateCode} (User ID: ${referredById})`);
      }
    }

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      supabaseId: authData.user.id,
      openId: openId,
      loginMethod: "password",
      role: "user",
      currentSessionId: sessionId,
      referredBy: referredById
    } as any).returning({ id: users.id, email: users.email, role: users.role });

    const freePlan = await ensureUserFreeAccess(db, newUser.id);

    if (parseResult.data.coupon) {
      const { coupons, couponUsages } = await import("../../shared/schema.js");
      const [couponRecord] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, parseResult.data.coupon))
        .limit(1);

      if (!couponRecord) {
        return res.status(400).json({ success: false, message: "Cupom não encontrado." });
      }

      const now = new Date();
      const isExpired = couponRecord.expirationDate && new Date(couponRecord.expirationDate) < now;
      if (!couponRecord.isActive || isExpired) {
        return res.status(400).json({ success: false, message: "Cupom inválido ou expirado." });
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
        console.log(`>>> DEBUG REGISTER: Applied ${bonusFromCoupon} bonus credits from coupon ${couponRecord.code}.`);
      }
    }

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role, sessionId },
      process.env.JWT_SECRET || "sua_chave_secreta_aqui",
      { expiresIn: "7d" }
    );

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`✅ Registro Free e login automático: ${email}`);
    return res.status(200).json({
      success: true,
      token,
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
      requiresCheckout: false,
      basicPlanId: freePlan.id,
    });

  } catch (error: any) {
    console.error("Erro interno no registro:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 🔐 LOGIN - INTEGRAÇÃO SUPABASE + JWT LOCAL
 */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await getDb();

    if (!db) return res.status(500).json({ success: false, message: "Erro de banco" });

    // Autenticação via Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError) return res.status(401).json({ success: false, message: "Credenciais inválidas" });

    // Busca usuário local para gerar o JWT do sistema
    const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userResults[0];

    if (!user) return res.status(404).json({ success: false, message: "Usuário não sincronizado." });

    try {
      await ensureUserFreeAccess(db, user.id);
    } catch (err) {
      console.error("[login] ensureUserFreeAccess failed:", err);
    }

    // ✅ NOVO: Gerar e salvar Session ID para invalidar logins anteriores
    const sessionId = crypto.randomUUID();
    await db.update(users).set({ currentSessionId: sessionId, lastSignedIn: new Date() }).where(eq(users.id, user.id));

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, sessionId }, // ✅ Incluir Session ID no Token
      process.env.JWT_SECRET || "chave_padrao_gnosis",
      { expiresIn: "7d" }
    );

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ 
      success: true, 
      token, 
      user: { id: user.id, email: user.email, role: user.role } 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Erro interno no servidor." });
  }
});

/**
 * 🚀 CALLBACK GOOGLE OAUTH (Corrigido para JWT + Supabase)
 */


app.post("/api/webhooks/mercadopago", handleMercadoPagoWebhook);
app.post("/api/webhooks/resend", handleResendWebhook);

app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
app.use("/api/v1/mobile", mobileRouter);

const PORT = Number(process.env.PORT) || 3000;
if (process.env.NODE_ENV === "development") {
  const server = createServer(app);
  setupVite(app, server);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🔥 Gnosis AI rodando em http://localhost:${PORT}`);
  });
} else {
  serveStatic(app);
}

export default app;