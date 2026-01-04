import { jwtVerify } from "jose";
import "dotenv/config";

// Token do cookie (cole aqui o valor completo do cookie app_session_id)
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // SUBSTITUIR COM O TOKEN REAL

const JWT_SECRET = process.env.JWT_SECRET;

console.log("JWT_SECRET exists:", !!JWT_SECRET);
console.log("JWT_SECRET length:", JWT_SECRET?.length || 0);

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing!");
  process.exit(1);
}

try {
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  const { payload } = await jwtVerify(token, secretKey, {
    algorithms: ["HS256"],
  });
  
  console.log("✅ Token is VALID!");
  console.log("Payload:", payload);
} catch (error) {
  console.error("❌ Token verification FAILED!");
  console.error("Error:", error.message);
}
