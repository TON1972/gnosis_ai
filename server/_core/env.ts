// server/_core/env.ts
import * as dotenv from "dotenv";
import path from "path";

// ✅ Carrega o .env localmente. 
dotenv.config();

// Se quiser garantir o path absoluto apenas em desenvolvimento:
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  // Debug local
  console.log("Variáveis carregadas (Local):", {
    hasDb: !!process.env.DATABASE_URL,
    hasSupabase: !!process.env.SUPABASE_URL,
    hasMp: !!process.env.MERCADOPAGO_ACCESS_TOKEN
  });
} else {
  // Debug Vercel (Production) - SEM EXIBIR VALORES REAIS
  console.log("Variáveis de Ambiente (Vercel):", {
    NODE_ENV: process.env.NODE_ENV,
    hasDb: !!process.env.DATABASE_URL,
    dbUrlLength: process.env.DATABASE_URL?.length,
    hasSupabase: !!process.env.SUPABASE_URL,
    supabaseUrlVal: process.env.SUPABASE_URL ? (process.env.SUPABASE_URL.substring(0, 10) + "...") : "MISSING",
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasJwt: !!process.env.JWT_SECRET,
    hasMp: !!process.env.MERCADOPAGO_ACCESS_TOKEN
  });
}

export const ENV = {
  // Configurações Gerais
  appUrl: process.env.APP_URL || process.env.VERCEL_URL || "http://localhost:3000",

  // Supabase (Essencial para o registro e admin)
  // .trim() evita erro comum de copiar com espaço vazio
  supabaseUrl: (process.env.SUPABASE_URL ?? "").trim(),
  supabaseServiceKey: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),

  // Autenticação e JWT
  jwtSecret: process.env.JWT_SECRET ?? "default_secret_gnosis",
  cookieSecret: process.env.JWT_SECRET ?? "default_secret_gnosis",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",

  // Database
  databaseUrl: (process.env.DATABASE_URL ?? "").trim(),

  // Infraestrutura
  isProduction: process.env.NODE_ENV === "production",
  appId: process.env.VITE_APP_ID ?? "",

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",

  // Integrações de Pagamento
  mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",

  // APIs Externas
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // OAuth Server
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",

  // OAuth Google
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",

  // Configurações de Sessão e Segurança
  sessionSecret: process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? "session_secret_gnosis",
  cookieSecure: process.env.NODE_ENV === "production",
  cookieMaxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
};