/**
 * 🔐 NextAuth.js Express Handler
 * Integra NextAuth.js com Express para Vercel Serverless
 */

import { Request, Response } from "express";
import NextAuth from "next-auth";
import { authOptions } from "./nextauth";

// Criar handler NextAuth
const handler = NextAuth(authOptions);

/**
 * Handler para rotas NextAuth no Express
 * Converte req/res do Express para formato NextAuth
 */
export async function handleNextAuth(req: Request, res: Response) {
  // NextAuth espera req.query como objeto
  req.query = req.query || {};
  
  // NextAuth espera req.body como objeto
  req.body = req.body || {};
  
  // Chamar handler NextAuth
  return handler(req as any, res as any);
}
