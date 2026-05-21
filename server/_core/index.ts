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

// Integração com Banco de Dados e Schema
import { getDb } from "../db.js";
import { users, credits, plans, subscriptions } from "../../shared/schema.js";
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

    const { name, email, password, planId, affiliateCode } = parseResult.data;
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

    // 2. Localização do Plano FREE (Sempre iniciar como Free)
    // O frontend cuidará do upgrade se o usuário selecionou um pago
    // 2. Localização do Plano FREE (Hard-coded fallback ID: 1)
    const [freePlan] = await db.select().from(plans).where(eq(plans.name, 'free')).limit(1);

    // HARD FAIL-SAFE: Se não achar, usa ID 1.
    const freePlanId = freePlan ? freePlan.id : 1;
    console.log(`>>> DEBUG REGISTER: Params planId: ${planId} (IGNORED) -> Enforcing Plan ID: ${freePlanId}`);

    if (!freePlan && freePlanId !== 1) throw new Error("Plano gratuito não encontrado e fallback falhou.");

    // 3. Persistência no Banco Local com openId para evitar erro de constraint
    const hashedPassword = await bcrypt.hash(password, 10);
    const openId = `supabase:${authData.user.id}`;
    const sessionId = crypto.randomUUID(); // ✅ Gerar Session ID

    // 2.5 Verificar Afiliado
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
      currentSessionId: sessionId, // ✅ Salvar Session ID
      referredBy: referredById
    } as any).returning({ id: users.id, email: users.email, role: users.role });

    // 4. Ativação de Assinatura e Créditos
    console.log(`>>> DEBUG REGISTER: Processing Registration for User ${newUser.id}`);

    let targetPlanId = freePlanId;
    let targetPlan = freePlan;
    let subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    let usedCouponId = null;

    // Lógica de Cupom Avançado
    if (parseResult.data.coupon) {
      const { coupons, couponUsages } = await import("../../shared/schema.js");
      const [couponRecord] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, parseResult.data.coupon))
        .limit(1);

      if (couponRecord) {
        const now = new Date();
        const isExpired = couponRecord.expirationDate && new Date(couponRecord.expirationDate) < now;
        
        if (couponRecord.isActive && !isExpired) {
          // Calcular data de expiração do cupom para o usuário
          const couponExpiresAt = new Date(Date.now() + couponRecord.discountDays * 24 * 60 * 60 * 1000);
          
          // Se o cupom tem um plano vinculado, usar esse plano
          if (couponRecord.grantPlanId) {
            const [grantedPlan] = await db.select().from(plans).where(eq(plans.id, couponRecord.grantPlanId)).limit(1);
            if (grantedPlan) {
              targetPlanId = grantedPlan.id;
              targetPlan = grantedPlan;
              subscriptionEndDate = couponExpiresAt;
              console.log(`>>> DEBUG REGISTER: Coupon ${couponRecord.code} granting plan "${grantedPlan.displayName}" for ${couponRecord.discountDays} days.`);
            }
          } else {
            // Sem plano vinculado - fica no Free mas com ferramentas customizadas
            subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Free padrão
            console.log(`>>> DEBUG REGISTER: Coupon ${couponRecord.code} granting custom tools for ${couponRecord.discountDays} days (no plan change).`);
          }
          
          usedCouponId = couponRecord.id;
          
          // Guardar dados do cupom para registrar uso com expiração
          (req as any)._couponExpiresAt = couponExpiresAt;
          (req as any)._couponBonusCredits = couponRecord.bonusCredits || 0;
        } else {
          console.log(`>>> DEBUG REGISTER: Coupon ${parseResult.data.coupon} is inactive or expired.`);
          return res.status(400).json({ success: false, message: "Cupom inválido ou expirado." });
        }
      } else {
        console.log(`>>> DEBUG REGISTER: Coupon ${parseResult.data.coupon} not found.`);
        return res.status(400).json({ success: false, message: "Cupom não encontrado." });
      }
    }

    await db.insert(subscriptions).values({
      userId: newUser.id,
      planId: targetPlanId,
      status: "active",
      startDate: new Date(),
      endDate: subscriptionEndDate
    });

    if (usedCouponId) {
      const { couponUsages } = await import("../../shared/schema.js");
      await db.insert(couponUsages).values({
        couponId: usedCouponId,
        userId: newUser.id,
        usedAt: new Date(),
        expiresAt: (req as any)._couponExpiresAt || null,
        isExpired: false,
      });
    }

    const initial = Number(targetPlan.creditsInitial ?? 0);
    const daily = Number(targetPlan.creditsDaily ?? 0);
    const bonusFromCoupon = Number((req as any)._couponBonusCredits ?? 0);

    await db.insert(credits).values({
      userId: newUser.id,
      amount: (initial + daily + bonusFromCoupon).toString(),
      creditsInitial: initial.toString(),
      creditsDaily: daily.toString(),
      creditsBonus: bonusFromCoupon.toString(),
      type: 'initial',
      createdAt: new Date(),
    } as any);

    if (bonusFromCoupon > 0) {
      console.log(`>>> DEBUG REGISTER: Applied ${bonusFromCoupon} bonus credits from coupon.`);
    }

    // ✅ 5. LOGAR AUTOMATICAMENTE: Gerar Token JWT imediatamente
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role, sessionId }, // ✅ Incluir Session ID
      process.env.JWT_SECRET || "sua_chave_secreta_aqui",
      { expiresIn: "7d" }
    );

    // Definir o cookie de sessão
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`✅ Registro e Login Automático concluídos: ${email}`);
    return res.status(200).json({ 
      success: true, 
      token, 
      user: { id: newUser.id, email: newUser.email, role: newUser.role } 
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