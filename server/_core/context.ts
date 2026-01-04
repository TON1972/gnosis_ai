// server/_core/context.ts
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./env"; 

export type TrpcUser = {
  id: number;
  email: string;
  role: string;
  name?: string | null;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: TrpcUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const { req, res } = opts;
  let user: TrpcUser | null = null;

  const token = req.cookies?.[COOKIE_NAME];

  if (token) {
    try {
      // ✅ Solução: Usar fallback para process.env caso ENV.jwtSecret seja undefined
      const secret = ENV.jwtSecret || process.env.JWT_SECRET || "sua_chave_secreta_aqui";
      
      const decoded = jwt.verify(token, secret) as any;
      
      user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (err) {
      console.error("[tRPC Context] Erro ao validar token:", err);
      // Se o erro for de falta de segredo, logamos explicitamente
      if (err instanceof TypeError && err.message.includes("secret")) {
        console.error("🚨 CRÍTICO: JWT_SECRET não foi encontrado nas variáveis de ambiente!");
      }
    }
  }

  return { req, res, user };
}