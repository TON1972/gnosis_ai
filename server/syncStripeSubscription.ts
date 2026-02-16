import Stripe from "stripe";
import { stripe } from "./stripe.js";
import { getDb } from "./db.js";
import { users, subscriptions as subscriptionsTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Script para sincronizar dados do Stripe para usuários cuja assinatura
 * no banco está sem stripeSubscriptionId e stripeStatus
 */
export async function syncStripeSubscriptionForUser(userEmail: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 1. Buscar usuário no banco
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);

    if (!user) {
        throw new Error(`User not found: ${userEmail}`);
    }

    if (!user.stripeCustomerId) {
        throw new Error(`User ${userEmail} doesn't have a Stripe Customer ID`);
    }

    console.log(`🔍 User found: ${user.name} (${user.email})`);
    console.log(`📋 Stripe Customer ID: ${user.stripeCustomerId}`);

    // 2. Buscar assinaturas no Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        limit: 10,
    });

    console.log(`📊 Found ${stripeSubscriptions.data.length} subscription(s) in Stripe`);

    if (stripeSubscriptions.data.length === 0) {
        throw new Error(`No subscriptions found in Stripe for customer ${user.stripeCustomerId}`);
    }

    // 3. Pegar a assinatura ativa ou em trial
    const activeOrTrialSub: Stripe.Subscription | undefined = stripeSubscriptions.data.find(
        sub => sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeOrTrialSub) {
        console.warn('⚠️ No active or trialing subscription found in Stripe');
        console.log('Available subscriptions:', stripeSubscriptions.data.map(s => ({
            id: s.id,
            status: s.status,
            created: new Date(s.created * 1000)
        })));
        throw new Error('No active/trialing subscription to sync');
    }

    console.log(`✅ Found ${activeOrTrialSub.status} subscription: ${activeOrTrialSub.id}`);
    console.log(`   Current period: ${new Date((activeOrTrialSub as any).current_period_start * 1000).toISOString()} - ${new Date((activeOrTrialSub as any).current_period_end * 1000).toISOString()}`);
    if ((activeOrTrialSub as any).trial_end) {
        console.log(`   Trial end: ${new Date((activeOrTrialSub as any).trial_end * 1000).toISOString()}`);
    }

    // 4. Atualizar assinatura no banco
    const trialEnd = (activeOrTrialSub as any).trial_end ? new Date((activeOrTrialSub as any).trial_end * 1000) : null;
    const periodEnd = new Date((activeOrTrialSub as any).current_period_end * 1000);
    const nextBillingDate = trialEnd && trialEnd > new Date() ? trialEnd : periodEnd;

    const [localSub] = await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.userId, user.id))
        .limit(1);

    if (!localSub) {
        throw new Error(`No local subscription found for user ${userEmail}`);
    }

    await db.update(subscriptionsTable)
        .set({
            stripeSubscriptionId: activeOrTrialSub.id,
            stripeStatus: activeOrTrialSub.status,
            startDate: new Date((activeOrTrialSub as any).start_date * 1000),
            endDate: periodEnd,
            nextBillingDate: nextBillingDate,
            updatedAt: new Date()
        })
        .where(eq(subscriptionsTable.id, localSub.id));

    console.log(`✅ Subscription synced successfully!`);
    console.log(`   Subscription ID: ${activeOrTrialSub.id}`);
    console.log(`   Status: ${activeOrTrialSub.status}`);
    console.log(`   Next billing: ${nextBillingDate.toISOString()}`);

    return {
        success: true,
        subscriptionId: activeOrTrialSub.id,
        status: activeOrTrialSub.status,
        nextBillingDate
    };
}

// Se executado diretamente
if (require.main === module) {
    const email = process.argv[2];
    if (!email) {
        console.error('❌ Usage: ts-node syncStripeSubscription.ts <user-email>');
        process.exit(1);
    }

    syncStripeSubscriptionForUser(email)
        .then(result => {
            console.log('✅ Done:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
}
