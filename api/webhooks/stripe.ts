import { getDb } from "../../server/db";
import { users, subscriptions, credits, payments, plans } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { stripe } from "../../server/stripe";

export const runtime = 'nodejs';

// Disable body parsing, we need raw body for Stripe
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper utility to read raw body
async function getRawBody(req: Request): Promise<Buffer> {
    const arrayBuffer = await req.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error("❌ STRIPE_WEBHOOK_SECRET não configurada.");
        return new Response("Webhook Secret missing", { status: 500 });
    }

    const sig = req.headers.get('stripe-signature');

    if (!sig) {
        return new Response("No signature", { status: 400 });
    }

    let event;

    try {
        const rawBody = await getRawBody(req);
        event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
    } catch (err: any) {
        console.error(`❌ Erro webhook assinatura: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const db = await getDb();
    if (!db) return new Response("DB Error", { status: 500 });

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any;
                const metadata = session.metadata;

                if (metadata?.type === 'subscription') {
                    const userId = Number(metadata.userId);
                    const planId = Number(metadata.planId);
                    const billingPeriod = metadata.billingPeriod as 'monthly' | 'yearly';
                    const subscriptionId = session.subscription as string;
                    const customerId = session.customer as string;

                    console.log(`💰 Stripe Checkout: User ${userId} -> Plan ${planId} (${billingPeriod})`);

                    await db.update(users)
                        .set({ stripeCustomerId: customerId })
                        .where(eq(users.id, userId));

                    const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
                    if (!plan) throw new Error("Plano não encontrado");

                    const intervalStr = billingPeriod === 'yearly' ? '1 year' : '1 month';

                    await db.update(subscriptions)
                        .set({
                            planId: planId,
                            status: 'active',
                            billingPeriod: billingPeriod,
                            stripeSubscriptionId: subscriptionId,
                            stripeStatus: 'active',
                            startDate: new Date(),
                            endDate: sql`NOW() + ${sql.raw(`interval '${intervalStr}'`)}`,
                            updatedAt: new Date()
                        })
                        .where(eq(subscriptions.userId, userId));

                    await db.update(credits)
                        .set({
                            creditsInitial: plan.creditsInitial,
                            creditsDaily: plan.creditsDaily,
                            amount: sql`(${plan.creditsInitial}::integer + ${plan.creditsDaily}::integer + ${credits.creditsBonus})`,
                            lastDailyReset: new Date()
                        })
                        .where(eq(credits.userId, userId));

                    // Registrar pagamento com ID Local da assinatura
                    const [localSub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);

                    try {
                        await db.insert(payments).values({
                            userId: userId,
                            subscriptionId: localSub?.id, // ID Local
                            amount: session.amount_total,
                            currency: session.currency || 'brl',
                            status: 'approved',
                            paymentMethod: 'stripe_subscription',
                            stripePaymentId: session.payment_intent as string || session.id,
                            externalId: subscriptionId,
                            type: `plan_${billingPeriod}`,
                            creditsAmount: 0,
                            createdAt: new Date()
                        });
                        console.log(`✅ Pagamento registrado para User ${userId} (Stripe: ${session.id})`);
                    } catch (paymentErr) {
                        console.error("❌ Erro ao gravar pagamento (Stripe):", paymentErr);
                    }
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any;
                const subscriptionId = invoice.subscription as string;

                if (!subscriptionId) break;

                const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

                if (sub) {
                    console.log(`🔄 Stripe Renovação: User ${sub.userId} -> Sub ${subscriptionId}`);

                    const intervalStr = sub.billingPeriod === 'yearly' ? '1 year' : '1 month';
                    await db.update(subscriptions)
                        .set({
                            status: 'active',
                            stripeStatus: 'active',
                            endDate: sql`NOW() + ${sql.raw(`interval '${intervalStr}'`)}`,
                            lastPaymentDate: new Date()
                        })
                        .where(eq(subscriptions.id, sub.id));

                    try {
                        await db.insert(payments).values({
                            userId: sub.userId,
                            subscriptionId: sub.id,
                            amount: invoice.amount_paid,
                            currency: invoice.currency,
                            status: 'approved',
                            paymentMethod: 'stripe_recurring',
                            stripePaymentId: invoice.payment_intent as string || invoice.id,
                            externalId: invoice.id,
                            type: `plan_${sub.billingPeriod}`,
                            createdAt: new Date()
                        });
                        console.log(`✅ Renovação registrada para User ${sub.userId} (Invoice: ${invoice.id})`);
                    } catch (invErr) {
                        console.error("❌ Erro ao gravar renovação (Stripe):", invErr);
                    }

                    const [plan] = await db.select().from(plans).where(eq(plans.id, sub.planId));
                    if (plan) {
                        await db.update(credits)
                            .set({
                                amount: sql`(${plan.creditsInitial}::integer + ${plan.creditsDaily}::integer + ${credits.creditsBonus})`
                            })
                            .where(eq(credits.userId, sub.userId));
                    }
                }
                break;
            }

            case 'customer.subscription.deleted':
            case 'invoice.payment_failed': {
                const subscriptionObj = event.data.object as any;
                const subscriptionId = subscriptionObj.id || subscriptionObj.subscription;

                if (subscriptionId) {
                    console.log(`⚠️ Stripe Falha/Cancelamento: Sub ${subscriptionId}`);
                    await db.update(subscriptions)
                        .set({
                            stripeStatus: event.type === 'customer.subscription.deleted' ? 'canceled' : 'past_due',
                        })
                        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
                }
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });

    } catch (err: any) {
        console.error(`Error processing webhook: ${err.message}`);
        return new Response("Webhook Processing Error", { status: 500 });
    }
}
