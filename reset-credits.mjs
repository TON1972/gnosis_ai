import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { users, userCredits } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function resetCredits() {
  try {
    // Find user by email
    const userResult = await db.select().from(users).where(eq(users.email, "ton2.cunha@gmail.com")).limit(1);
    
    if (userResult.length === 0) {
      console.log("❌ User not found!");
      return;
    }
    
    const user = userResult[0];
    console.log("✅ User found:", user.id, user.name, user.email);
    
    // Delete existing credits
    await db.delete(userCredits).where(eq(userCredits.userId, user.id));
    console.log("✅ Deleted old credits");
    
    console.log("✅ Credits reset! Next login will create new credits with 500 initial + 50 daily");
  } catch (error) {
    console.error("❌ Error:", error);
  }
  process.exit(0);
}

resetCredits();
