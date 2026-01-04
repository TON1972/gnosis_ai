import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { getDb } from "./db";
import { users } from "../shared/schema"; 
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

const router = Router();

const CALLBACK_URL_BASE = process.env.NODE_ENV === "development" 
  ? "http://localhost:3000" 
  : (process.env.NEXTAUTH_URL || "https://gnosis-ai-platform.vercel.app");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  loginMethod: string;
}

function generateJWT(user: AuthUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    ENV.jwtSecret,
    { expiresIn: "7d" }
  );
}

function setSessionCookie(res: Response, req: Request, token: string) {
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/**
 * GOOGLE OAUTH
 */
router.get("/oauth/google", (req: Request, res: Response) => {
  const redirectUri = `${CALLBACK_URL_BASE}/api/oauth/google/callback`;
  const scope = "openid profile email";
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
  res.redirect(url);
});

router.get("/oauth/google/callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== "string") return res.redirect("/auth?error=google_no_code");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${CALLBACK_URL_BASE}/api/oauth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const userData = await userRes.json();
    const { email, name } = userData;
    const openId = `google:${email}`;

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    let authUser: AuthUser;

    if (existing.length > 0) {
      const dbUser = existing[0];
      authUser = { id: dbUser.id, email: dbUser.email!, name: dbUser.name, role: dbUser.role, loginMethod: dbUser.loginMethod || "google" };
    } else {
      // ✅ Sintaxe PostgreSQL Returning
      const [inserted] = await db.insert(users).values({
        email,
        openId,
        name: name || null,
        role: "user",
        loginMethod: "google",
      }).returning();
      
      authUser = { id: inserted.id, email, name: name || null, role: "user", loginMethod: "google" };
    }

    setSessionCookie(res, req, generateJWT(authUser));
    res.redirect("/dashboard");
  } catch (error) {
    console.error("[OAuth Error]:", error);
    res.redirect("/auth?error=google_callback_failed");
  }
});

export { router as oauthRouter };