
import { Request, Response } from "express";

export const runtime = 'nodejs';

const CALLBACK_URL_BASE = (process.env.NODE_ENV === "development" || !process.env.NODE_ENV)
    ? "http://localhost:3000"
    : (process.env.NEXTAUTH_URL || "https://gnosis-ai-platform.vercel.app");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

export default function handler(req: Request, res: Response) {
    const redirectUri = `${CALLBACK_URL_BASE}/api/oauth/google/callback`;
    const scope = "openid profile email";
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

    res.redirect(url);
}
