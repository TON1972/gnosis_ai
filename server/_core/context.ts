// server/_core/context.ts
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "../../shared/const";
import { ENV } from "./env";

export type TrpcUser = {
  id: number;
  email: string;
  role: string;
  name?: string | null;
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user: TrpcUser | null;
};

export async function createContext({
  req,
  resHeaders,
}: FetchCreateContextFnOptions): Promise<TrpcContext> {
  let user: TrpcUser | null = null;

  // Em serverless, cookies vêm no header 'cookie'
  const cookieHeader = req.headers.get("cookie");

  if (cookieHeader) {
    try {
      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => c.split("="))
      );
      const token = cookies[COOKIE_NAME];

      if (token) {
        // Solução: Usar fallback para process.env caso ENV.jwtSecret seja undefined
        const secret = ENV.jwtSecret || process.env.JWT_SECRET || "sua_chave_secreta_aqui";

        const decoded = jwt.verify(token, secret) as any;

        user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    } catch (err) {
      console.error("[tRPC Context] Erro ao validar token:", err);
      if (err instanceof TypeError && err.message.includes("secret")) {
        console.error("🚨 CRÍTICO: JWT_SECRET não foi encontrado nas variáveis de ambiente!");
      }
    }
  }

  return { req, resHeaders, user };
}