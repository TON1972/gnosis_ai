import { Request, Response } from "express";
import { stripe } from "./stripe";
import { getDb } from "./db";
import { users, subscriptions, credits, payments, plans } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function handleStripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    if (!WEBHOOK_SECRET) {
        console.error("❌ STRIPE_WEBHOOK_SECRET não configurada.");
        return res.status(500).send("Webhook Secret missing");
    }

    if (!sig) {
        return res.status(400).send("No signature");
    }

    let event;

    try {
        // IMPORTANTE: req.body deve ser o RAW BUFFER. Middleware específico configurado no mount.
        event = stripe.webhooks.constructEvent(req.body, sig as string, WEBHOOK_SECRET);
    } catch (err: any) {
        console.error(`❌ Erro webhook assinatura: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const db = await getDb();
    if (!db) return res.status(500).send("DB Error");

    try {
        switch (event.type) {
            /**
             * ✅ CHECKOUT COMPLETED -> Primeira assinatura
             */
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

                    // 1. Atualizar Customer ID do usuário
                    await db.update(users)
                        .set({ stripeCustomerId: customerId })
                        .where(eq(users.id, userId));

                    // 2. Buscar detalhes do plano
                    const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
                    if (!plan) throw new Error("Plano não encontrado");

                    // 3. BUSCAR DADOS REAIS DA SUBSCRIPTION NO STRIPE (Crucial para Trials)
                    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

                    // Determinar datas e status reais
                    // Se tiver trial, o 'current_period_end' pode ser o fim do trial ou do primeiro ciclo, 
                    // mas 'trial_end' é a fonte da verdade para o fim do teste.
                    const trialEnd = stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null;
                    const periodEnd = new Date(stripeSub.current_period_end * 1000);

                    // Se estiver em trial, o próximo faturamento é no fim do trial
                    const nextBillingDate = trialEnd && trialEnd > new Date() ? trialEnd : periodEnd;

                    // Mapeamento de status (trialing -> active para nosso sistema permitir acesso)
                    // Mas salvamos o status real do Stripe em 'stripeStatus'
                    const isActiveOrTrial = ['active', 'trialing'].includes(stripeSub.status);
                    const appStatus = isActiveOrTrial ? 'active' : 'expired';

                    console.log(`🔍 Sub Details: Status=${stripeSub.status}, TrialEnd=${trialEnd?.toISOString()}`);

                    // 4. Atualizar assinatura com dados precisos
                    const intervalStr = billingPeriod === 'yearly' ? '1 year' : '1 month';

                    await db.update(subscriptions)
                        .set({
                            planId: planId,
                            status: appStatus,
                            billingPeriod: billingPeriod,
                            stripeSubscriptionId: subscriptionId,
                            stripeStatus: stripeSub.status, // 'active' ou 'trialing'
                            startDate: new Date(stripeSub.start_date * 1000),
                            endDate: periodEnd, // Data "técnica" do fim do ciclo atual do Stripe
                            nextBillingDate: nextBillingDate, // ✅ CRUCIAL PARA O CHECK DE PAGAMENTO
                            updatedAt: new Date()
                        })
                        .where(eq(subscriptions.userId, userId));

                    // 5. Conceder créditos do plano
                    await db.update(credits)
                        .set({
                            creditsInitial: plan.creditsInitial,
                            creditsDaily: plan.creditsDaily,
                            amount: sql`(${plan.creditsInitial}::integer + ${plan.creditsDaily}::integer + ${credits.creditsBonus})`,
                            lastDailyReset: new Date()
                        })
                        .where(eq(credits.userId, userId));

                    // 6. Registrar pagamento (mesmo que seja 0 no trial, é bom ter registro da 'ativação')
                    const [localSub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);

                    try {
                        await db.insert(payments).values({
                            userId: userId,
                            subscriptionId: localSub?.id,
                            amount: session.amount_total, // Será 0 se for trial sem charge imediata
                            currency: session.currency || 'brl',
                            status: 'approved',
                            paymentMethod: 'stripe_subscription',
                            stripePaymentId: session.payment_intent as string || session.id,
                            externalId: subscriptionId,
                            type: `plan_${billingPeriod}`,
                            creditsAmount: 0,
                            createdAt: new Date()
                        });
                        console.log(`✅ Assinatura ativada para User ${userId} (Stripe: ${session.id})`);
                    } catch (paymentErr) {
                        console.error("❌ Erro ao gravar registro de pagamento/ativação:", paymentErr);
                    }
                }
                break;
            }

            /**
             * ✅ INVOICE PAID -> Renovação automática
             */
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any;
                const subscriptionId = invoice.subscription as string;

                if (!subscriptionId) break; // Se for fatura avulsa ignorar (por enquanto)

                // Buscar usuário pela subscriptionId
                const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

                if (sub) {
                    console.log(`🔄 Stripe Renovação: User ${sub.userId} -> Sub ${subscriptionId}`);

                    // Renovar data de expiração
                    const intervalStr = sub.billingPeriod === 'yearly' ? '1 year' : '1 month';
                    await db.update(subscriptions)
                        .set({
                            status: 'active',
                            stripeStatus: 'active',
                            endDate: sql`NOW() + ${sql.raw(`interval '${intervalStr}'`)}`,
                            lastPaymentDate: new Date()
                        })
                        .where(eq(subscriptions.id, sub.id));

                    // Registrar pagamento
                    try {
                        await db.insert(payments).values({
                            userId: sub.userId,
                            subscriptionId: sub.id, // ✅ Já temos a assinatura local aqui
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

                    // REFILS DE CRÉDITOS? 
                    // Se for renovação mensal, devemos refilar os créditos mensais?
                    // Sim, a lógica de créditos diários/mensais pode precisar de reset manual ou apenas contar com o 'creditsInitial' disponivel
                    // Por simplicidade, vamos garantir que o usuário tenha o saldo do plano novamente se for "reset mensal"
                    // Mas como seu sistema é 'diário' + 'inicial', talvez 'inicial' seja o 'mensal'.
                    // Vou assumir que renovamos os créditos:

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

            /**
             * ❌ PAGAMENTO FALHOU / ASSINATURA CANCELADA
             */
            case 'customer.subscription.deleted':
            case 'invoice.payment_failed': {
                const subscriptionObj = event.data.object as any;
                const subscriptionId = subscriptionObj.id || subscriptionObj.subscription;

                if (subscriptionId) {
                    console.log(`⚠️ Stripe Falha/Cancelamento: Sub ${subscriptionId}`);
                    await db.update(subscriptions)
                        .set({
                            stripeStatus: event.type === 'customer.subscription.deleted' ? 'canceled' : 'past_due',
                            // Não removemos o acesso imediatamente, deixamos o checkSubscriptionStatus lidar com datas ou mudamos status local se quiser
                            // status: 'expired' 
                        })
                        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
                }
                break;
            }
        }

        res.json({ received: true });
    } catch (err: any) {
        console.error(`Error processing webhook: ${err.message}`);
        res.status(500).send("Webhook Processing Error");
    }
}
