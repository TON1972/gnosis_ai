// server/index.ts

import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser"; 
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import jwt from "jsonwebtoken";

import { appRouter } from "../routers";
import { oauthRouter } from "../oauth"; 
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleMercadoPagoWebhook } from "./webhookHandler";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

import { getDb } from "../db";
import { users, credits, plans, subscriptions } from "../../shared/schema"; 
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabaseAdmin";

const app = express();

// Configurações básicas
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api", oauthRouter);

/**
 * 🚀 REGISTRO - SUPABASE + PLANOS + CRÉDITOS
 */
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, planId } = req.body;
    const db = await getDb();
    
    if (!db) return res.status(500).json({ success: false, message: "Banco indisponível." });

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (authError) return res.status(400).json({ success: false, message: authError.message });

    const [selectedPlan] = await db.select().from(plans).where(eq(plans.id, Number(planId))).limit(1);
    if (!selectedPlan) throw new Error("Plano selecionado não existe.");

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

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || "sua_chave_secreta_aqui",
      { expiresIn: "7d" }
    );

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    return res.status(200).json({ success: true });
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

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ success: false, message: "Credenciais inválidas" });

    const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userResults[0];
    if (!user) return res.status(404).json({ success: false, message: "Usuário não sincronizado." });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "chave_padrao_gnosis",
      { expiresIn: "7d" }
    );

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Erro interno no servidor." });
  }
});

app.post("/api/webhooks/mercadopago", handleMercadoPagoWebhook);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// ✅ AJSUTE PARA VERCEL: Lógica de inicialização diferenciada
if (process.env.NODE_ENV === "development") {
  const PORT = Number(process.env.PORT) || 3000;
  const server = createServer(app);
  setupVite(app, server); // Vite só deve rodar em dev
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🔥 Servidor local: http://localhost:${PORT}`);
  });
} else {
  // Em produção na Vercel, apenas servimos os estáticos se necessário,
  // mas o 'export default app' é quem manda.
  serveStatic(app);
}

// ✅ OBRIGATÓRIO PARA VERCEL
export default app;