import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { emailAutomations, automationLogs, users, subscriptions, credits, plans } from '../drizzle/schema.js';
import { eq, and, sql, lt, gte, lte, inArray, desc } from "drizzle-orm";

const { Client } = pg;

async function testAutomation() {
    const client = new Client({ connectionString: 'postgresql://postgres.oogjsbskwuetvatgmwgb:HJwCCoI6VJ1SFgnG@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true' });
    await client.connect();
    const db = drizzle(client);

    const [automation] = await db.select().from(emailAutomations).where(eq(emailAutomations.id, 8));
    console.log("Testing Automation:", automation.name);
    console.log("Trigger Date:", automation.triggerDate);
    
    const now = new Date();
    console.log("Now:", now);

    let targetUsers = [];
    const getBaseQuery = () => {
        let query = db.select({
            id: users.id,
            email: users.email,
            name: users.name,
        }).from(users);

        if (automation.targetPlans) {
            console.log("Target plan filtering applied:", automation.targetPlans);
            const planNames = automation.targetPlans.split(',').filter(Boolean);
            if (planNames.length > 0) {
                query = query
                    .innerJoin(subscriptions, eq(users.id, subscriptions.userId))
                    .innerJoin(plans, eq(subscriptions.planId, plans.id))
                    .where(inArray(plans.name, planNames));
            }
        }
        return query;
    };

    if (automation.triggerType === 'specific_date') {
        if (automation.triggerDate && new Date(automation.triggerDate) <= now) {
            console.log("Date condition passed!");
            targetUsers = await getBaseQuery();
        } else {
            console.log("Date condition FAILED!");
        }
    }

    console.log("Target users found:", targetUsers.length);
    console.log("Target users mapped IDs:", targetUsers.map(u => u.id));
    await client.end();
}
testAutomation().catch(console.error);
