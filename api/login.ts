import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "../shared/const";
import { serialize } from "cookie";
import { supabaseAdmin } from "../server/_core/supabaseAdmin";

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;
        const db = await getDb();

        if (!db) return new Response(JSON.stringify({ success: false, message: "Erro de banco" }), { status: 500 });

        // Autenticação via Supabase
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password
        });

        if (authError) return new Response(JSON.stringify({ success: false, message: "Credenciais inválidas" }), { status: 401 });

        // Busca usuário local para gerar o JWT do sistema
        const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const user = userResults[0];

        if (!user) return new Response(JSON.stringify({ success: false, message: "Usuário não sincronizado." }), { status: 404 });

        const secret = process.env.JWT_SECRET || "chave_padrao_gnosis";
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            secret,
            { expiresIn: "7d" }
        );

        const cookieSerialized = serialize(COOKIE_NAME, token, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": cookieSerialized,
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, message: "Erro interno no servidor." }), { status: 500 });
    }
}
