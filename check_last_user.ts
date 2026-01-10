
import { getDb } from "./server/db";
import { users, subscriptions, plans } from "./drizzle/schema";
import { desc, eq } from "drizzle-orm";

async function checkLastUser() {
    const db = await getDb();
    if (!db) {
        console.error("Failed to connect to DB");
        process.exit(1);
    }

    // Get last user
    const lastUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(1);

    if (lastUsers.length === 0) {
        console.log("No users found.");
        process.exit(0);
    }

    const user = lastUsers[0];
    console.log(`Last User: ${user.name} (${user.email}) - ID: ${user.id} - Method: ${user.loginMethod}`);

    // Get subscription
    const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id));

    console.log("Subscription Full Dump:", JSON.stringify(sub, null, 2));
    process.exit(0);
}

checkLastUser().catch(console.error);
