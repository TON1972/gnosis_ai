// server/_core/env.ts
import * as dotenv from "dotenv";
import path from "path";

// ✅ Carrega o .env garantindo o caminho absoluto a partir da raiz do projeto
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const ENV = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",

  // Supabase (Essencial para o supabaseAdmin.ts)
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // Manus OAuth & JWT
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "default_secret_gnosis",
  jwtSecret: process.env.JWT_SECRET ?? "default_secret_gnosis",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  
  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",
  
  // Environment
  isProduction: process.env.NODE_ENV === "production",
  
  // OpenAI (para as ferramentas de IA)
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  
  // Mercado Pago
  mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
  
  // Forge API
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  
  // OAuth Google
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  
  // Session & Cookies
  sessionSecret: process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? "session_secret_gnosis",
  cookieSecure: process.env.NODE_ENV === "production",
  cookieMaxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias por padrão
};