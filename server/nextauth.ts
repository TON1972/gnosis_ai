/**
 * 🔐 NextAuth.js Configuration (SIMPLIFIED - NO DATABASE)
 * OAuth Google e Facebook otimizado para Vercel Serverless
 * Temporariamente sem operações de banco para diagnosticar timeout
 */

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { ENV } from "./_core/env";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: ENV.googleClientId,
      clientSecret: ENV.googleClientSecret,
    }),
    FacebookProvider({
      clientId: ENV.facebookClientId,
      clientSecret: ENV.facebookClientSecret,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      // Temporariamente desabilitado para diagnóstico
      console.log("[NextAuth] Sign in:", user.email);
      return true;
    },

    async session({ session, token }) {
      // Apenas retorna a sessão sem acessar banco
      if (session.user && token.sub) {
        session.user.id = parseInt(token.sub) || 0;
        session.user.role = "user";
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth",
    error: "/auth",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: ENV.jwtSecret,
};

export default NextAuth(authOptions);
