import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "../../shared/const.js";
import { ENV } from "./env.js";

export type TrpcUser = {
  id: number;
  email: string;
  role: string;
  name?: string | null;
  sessionId?: string; // ✅ Adicionado
};

export type TrpcContext = {
  req: Request | any;
  resHeaders: Headers;
  user: TrpcUser | null;
};


export async function createContext(
  opts: FetchCreateContextFnOptions | CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: TrpcUser | null = null;

  // Normalização para suportar tanto Express (local) quanto Vercel Function (Request/Response standard)
  const isExpress = !('headers' in opts.req && typeof (opts.req as any).headers.get === 'function');

  let req: any = opts.req;
  let resHeaders: Headers;
  let cookieHeader: string | undefined | null;

  if (isExpress) {
    // --- AMBIENTE EXPRESS (Local Dev) ---
    // Em Express, headers é um objeto simples
    const expressReq = opts.req as any;
    const expressRes = (opts as any).res;

    cookieHeader = expressReq.headers['cookie'];

    // Polyfill do Headers para que o routers.ts funcione sem alteração
    resHeaders = new Headers();

    // Intercepta .append e .set para escrever diretamente no response do Express
    const originalAppend = resHeaders.append.bind(resHeaders);
    resHeaders.append = (name: string, value: string) => {
      originalAppend(name, value);
      if (expressRes && !expressRes.headersSent) {
        expressRes.append(name, value);
      }
    };

    const originalSet = resHeaders.set.bind(resHeaders);
    resHeaders.set = (name: string, value: string) => {
      originalSet(name, value);
      if (expressRes && !expressRes.headersSent) {
        expressRes.setHeader(name, value);
      }
    };

  } else {
    // --- AMBIENTE VERCEL (Fetch API) ---
    req = opts.req as Request;
    // O adapter fetch já fornece resHeaders que serão usados na resposta final
    // Segurança: se undefined, inicializa um novo Headers (embora não vá persistir na resposta do fetch handler se não for o mesmo objeto)
    resHeaders = (opts as FetchCreateContextFnOptions).resHeaders || new Headers();
    cookieHeader = req.headers.get("cookie");
  }

  // Lógica de Autenticação (Comum a ambos)
  // Prioriza cookie já parseado pelo Express se disponível
  const cookies = (req as any).cookies || {};
  let token = cookies[COOKIE_NAME];

  // Se não achou em req.cookies (Ex: Vercel ou falha no parser), tenta headers
  if (!token && cookieHeader) {
    try {
      const parsed = Object.fromEntries(
        cookieHeader.split("; ").map((c: string) => {
          const [key, ...v] = c.split("=");
          return [key, v.join("=")];
        })
      );
      token = parsed[COOKIE_NAME];
    } catch (err) {
      console.error("[tRPC Context] Erro ao parsear cookie header:", err);
    }
  }

  if (token) {
    try {
      // Fallback seguro para secret
      const secret = ENV.jwtSecret || process.env.JWT_SECRET || "sua_chave_secreta_aqui";
      const decoded = jwt.verify(token, secret) as any;
      user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId, // ✅ Mapear Session ID
      };
      console.log(`[ContextDebug] Decoded Token for User ${user.id}. SessionID: ${user.sessionId}`);
    } catch (jwtError) {
      // Token inválido ou expirado - ignorar silenciosamente
    }
  }

  return { req, resHeaders, user };
}