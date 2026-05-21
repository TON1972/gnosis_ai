import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getDb } from "../db.js";
import { users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

interface MobileAuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    sessionId?: string;
  };
}

export const requireMobileAuth = async (req: MobileAuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Token não fornecido ou inválido." });
    }

    const token = authHeader.split(" ")[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "chave_padrao_gnosis") as any;
    
    if (!decoded.userId) {
      return res.status(401).json({ success: false, message: "Token inválido." });
    }

    // Connect to DB and check session
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, message: "Erro de conexão com o banco de dados." });
    }

    const [userRecord] = await db
      .select({ id: users.id, email: users.email, role: users.role, currentSessionId: users.currentSessionId })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!userRecord) {
      return res.status(401).json({ success: false, message: "Usuário não encontrado." });
    }

    // Verify session ID to prevent multiple devices login (if enforced by the system)
    if (userRecord.currentSessionId && decoded.sessionId && userRecord.currentSessionId !== decoded.sessionId) {
      return res.status(401).json({ success: false, message: "Sessão expirada. Você conectou em outro dispositivo." });
    }

    // Attach user to request
    req.user = {
      id: userRecord.id,
      email: userRecord.email!,
      role: userRecord.role,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error: any) {
    console.error("[MobileAuth] Erro de autenticação:", error.message);
    return res.status(401).json({ success: false, message: "Token expirado ou inválido." });
  }
};
