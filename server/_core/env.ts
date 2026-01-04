// server/_core/env.ts
import * as dotenv from "dotenv";
import path from "path";

// ✅ Carrega o .env localmente. 
// Em produção (Vercel), as variáveis já estão no process.env, então o dotenv apenas ignora se não achar o arquivo.
dotenv.config(); 

// Se quiser garantir o path absoluto apenas em desenvolvimento:
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}

export const ENV = {
  // Configurações Gerais
  appUrl: process.env.APP_URL || process.env.VERCEL_URL || "http://localhost:3000",

  // Supabase (Essencial para o registro e admin)
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // Autenticação e JWT
  jwtSecret: process.env.JWT_SECRET ?? "default_secret_gnosis",
  cookieSecret: process.env.JWT_SECRET ?? "default_secret_gnosis",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  
  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",
  
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
  
  // OAuth Google
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  
  // Configurações de Sessão e Segurança
  sessionSecret: process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? "session_secret_gnosis",
  cookieSecure: process.env.NODE_ENV === "production",
  cookieMaxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
};