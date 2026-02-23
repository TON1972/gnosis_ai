import { Request, Response } from "express";
import { stripe } from "./stripe.js";

import { getDb } from "./db.js";
import { users, subscriptions, credits, payments, plans } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

import { sendMetaEvent } from "./meta-capi.js";

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

                    // ✅ IDEMPOTENCY: Check if this event was already processed (outside transaction - read only)
                    const existingPayment = await db.select()
                        .from(payments)
                        .where(eq(payments.stripePaymentId, session.payment_intent as string || session.id))
                        .limit(1);

                    if (existingPayment.length > 0) {
                        console.log(`⚠️ [Webhook] Event already processed (payment ${existingPayment[0].id}), skipping`);
                        break;
                    }
                    const customerId = session.customer as string;

                    console.log(`💰 [Webhook] Checkout Completed:`, {
                        userId,
                        planId,
                        billingPeriod,
                        subscriptionId,
                        customerId,
                        sessionId: session.id
                    });

                    // ✅ ATOMIC TRANSACTION: All-or-nothing — if any step fails, everything rolls back
                    // and Stripe will retry the webhook
                    await db.transaction(async (tx) => {
                        // 1. Atualizar Customer ID do usuário
                        const [user] = await tx.update(users)
                            .set({ stripeCustomerId: customerId })
                            .where(eq(users.id, userId))
                            .returning();
                        console.log(`✅ [Webhook] Customer ID updated for user ${userId}`);

                        // 2. Buscar detalhes do plano
                        const [plan] = await tx.select().from(plans).where(eq(plans.id, planId));
                        if (!plan) {
                            console.error(`❌ [Webhook] Plan ${planId} not found!`);
                            throw new Error("Plano não encontrado");
                        }
                        console.log(`✅ [Webhook] Plan found:`, { planId, planName: plan.name });

                        // 3. BUSCAR DADOS REAIS DA SUBSCRIPTION NO STRIPE (Crucial para Trials)
                        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId, {
                            expand: ['latest_invoice', 'default_payment_method']
                        }) as any;

                        console.log(`✅ [Webhook] Stripe Subscription Retrieved:`, {
                            id: stripeSub.id,
                            status: stripeSub.status,
                            current_period_start: stripeSub.current_period_start,
                            current_period_end: stripeSub.current_period_end,
                            trial_start: stripeSub.trial_start,
                            trial_end: stripeSub.trial_end
                        });

                        // Determinar datas e status reais com FALLBACKS robustos
                        const trialEndTimestamp = stripeSub.trial_end;
                        const periodEndTimestamp = stripeSub.current_period_end;
                        const startDateTimestamp = stripeSub.start_date;

                        let effectivePeriodEnd = periodEndTimestamp || trialEndTimestamp;

                        if (!effectivePeriodEnd && stripeSub.status === 'active' && startDateTimestamp) {
                            console.warn('⚠️ [Webhook] Usando Fallback de Data: start_date + 30 dias');
                            effectivePeriodEnd = startDateTimestamp + (30 * 24 * 60 * 60);
                        }

                        const trialEnd = trialEndTimestamp ? new Date(trialEndTimestamp * 1000) : null;
                        let periodEnd = new Date();

                        if (effectivePeriodEnd) {
                            periodEnd = new Date(effectivePeriodEnd * 1000);
                        } else {
                            console.warn("⚠️ [Webhook] CRITICAL: current_period_end is missing even after fallbacks, using now()");
                        }

                        const nextBillingDate = trialEnd && trialEnd > new Date() ? trialEnd : periodEnd;
                        const isActiveOrTrial = ['active', 'trialing'].includes(stripeSub.status);
                        const appStatus = isActiveOrTrial ? 'active' : 'expired';

                        console.log(`✅ [Webhook] Computed values:`, {
                            appStatus,
                            stripeStatus: stripeSub.status,
                            nextBillingDate: nextBillingDate.toISOString(),
                            trialEnd: trialEnd?.toISOString(),
                            periodEnd: periodEnd.toISOString()
                        });

                        // 4. ✅ UPSERT: Tentar UPDATE primeiro, se não existir, INSERT
                        const existingSub = await tx.select()
                            .from(subscriptions)
                            .where(eq(subscriptions.userId, userId))
                            .limit(1);

                        const subscriptionData = {
                            planId: planId,
                            status: appStatus as 'active' | 'expired',
                            billingPeriod: billingPeriod,
                            stripeSubscriptionId: subscriptionId,
                            stripeStatus: stripeSub.status,
                            startDate: new Date(stripeSub.start_date * 1000),
                            endDate: periodEnd,
                            nextBillingDate: nextBillingDate,
                            updatedAt: new Date()
                        };

                        if (existingSub.length > 0) {
                            console.log(`✅ [Webhook] Updating existing subscription ${existingSub[0].id}`);
                            await tx.update(subscriptions)
                                .set(subscriptionData)
                                .where(eq(subscriptions.id, existingSub[0].id));
                        } else {
                            console.log(`⚠️ [Webhook] No subscription found, creating new one`);
                            await tx.insert(subscriptions).values({
                                userId: userId,
                                ...subscriptionData,
                                createdAt: new Date()
                            });
                        }

                        // 5. Conceder créditos do plano
                        console.log(`✅ [Webhook] Updating credits for user ${userId}`);
                        await tx.update(credits)
                            .set({
                                creditsInitial: plan.creditsInitial,
                                creditsDaily: plan.creditsDaily,
                                amount: sql`(${plan.creditsInitial}::integer + ${plan.creditsDaily}::integer + ${credits.creditsBonus})`,
                                lastDailyReset: new Date()
                            })
                            .where(eq(credits.userId, userId));

                        // 6. Registrar pagamento (inside transaction — rollback if fails)
                        const [localSub] = await tx.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
                        const amountTotal = session.amount_total;
                        await tx.insert(payments).values({
                            userId: userId,
                            subscriptionId: localSub?.id,
                            amount: amountTotal,
                            currency: session.currency || 'brl',
                            status: 'approved',
                            paymentMethod: 'stripe_subscription',
                            stripePaymentId: session.payment_intent as string || session.id,
                            externalId: subscriptionId,
                            type: `plan_${billingPeriod}`,
                            creditsAmount: 0,
                            createdAt: new Date()
                        });
                        console.log(`✅ [Webhook] Payment recorded successfully`);

                        // 7. ✅ SEND TO META CAPI (best effort — don't fail transaction for analytics)
                        if (amountTotal > 0 && user) {
                            try {
                                const metaData = session.metadata || {};
                                await sendMetaEvent({
                                    eventName: 'Purchase',
                                    email: user.email || undefined,
                                    clientIpAddress: metaData.clientIp || req.ip || undefined,
                                    clientUserAgent: metaData.clientUserAgent || (Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent']) || undefined,
                                    fbc: metaData.fbc || undefined,
                                    fbp: metaData.fbp || undefined,
                                    currency: 'BRL',
                                    value: amountTotal / 100,
                                    orderId: session.id
                                });
                            } catch (metaErr) {
                                console.warn(`⚠️ [Webhook] Meta CAPI failed (non-critical):`, metaErr);
                            }
                        }

                        console.log(`🎉 [Webhook] Subscription activation complete for User ${userId}!`);
                    }); // end transaction
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

                // ✅ FIX: Skip initial subscription invoice (already handled by checkout.session.completed)
                if (invoice.billing_reason === 'subscription_create') {
                    console.log(`ℹ️ [Webhook] Skipping initial invoice (handled by checkout.session.completed)`);
                    break;
                }

                // ✅ IDEMPOTENCY: Check if this invoice was already processed
                const existingInvoicePayment = await db.select()
                    .from(payments)
                    .where(eq(payments.externalId, invoice.id))
                    .limit(1);
                if (existingInvoicePayment.length > 0) {
                    console.log(`⚠️ [Webhook] Invoice ${invoice.id} already processed, skipping`);
                    break;
                }

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
                            nextBillingDate: sql`NOW() + ${sql.raw(`interval '${intervalStr}'`)}`,
                            lastPaymentDate: new Date(),
                            gracePeriodEndsAt: null, // ✅ Clear any active grace period
                        })
                        .where(eq(subscriptions.id, sub.id));

                    // Registrar pagamento
                    try {
                        const amountPaid = invoice.amount_paid;
                        await db.insert(payments).values({
                            userId: sub.userId,
                            subscriptionId: sub.id, // ✅ Já temos a assinatura local aqui
                            amount: amountPaid,
                            currency: invoice.currency,
                            status: 'approved',
                            paymentMethod: 'stripe_recurring',
                            stripePaymentId: invoice.payment_intent as string || invoice.id,
                            externalId: invoice.id,
                            type: `plan_${sub.billingPeriod}`,
                            createdAt: new Date()
                        });
                        console.log(`✅ Renovação registrada para User ${sub.userId} (Invoice: ${invoice.id})`);

                        // ✅ SEND TO META CAPI
                        if (amountPaid > 0) {
                            const [user] = await db.select().from(users).where(eq(users.id, sub.userId)).limit(1);
                            if (user) {
                                await sendMetaEvent({
                                    eventName: 'Purchase',
                                    email: user.email || undefined,
                                    clientIpAddress: req.ip || undefined,
                                    clientUserAgent: (Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent']) || undefined,
                                    currency: (invoice.currency || 'brl').toUpperCase(),
                                    value: amountPaid / 100,
                                    orderId: invoice.id
                                });
                            }
                        }
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
             * ✅ SUBSCRIPTION UPDATED -> Troca de plano via Stripe Portal/Dashboard
             */
            case 'customer.subscription.updated': {
                const stripeSubObj = event.data.object as any;
                const subId = stripeSubObj.id;
                const previousAttributes = (event.data as any).previous_attributes || {};

                console.log(`🔄 [Webhook] Subscription Updated: ${subId}`, {
                    status: stripeSubObj.status,
                    changedFields: Object.keys(previousAttributes)
                });

                // Find local subscription
                const [localSub] = await db.select()
                    .from(subscriptions)
                    .where(eq(subscriptions.stripeSubscriptionId, subId))
                    .limit(1);

                if (!localSub) {
                    console.warn(`⚠️ [Webhook] subscription.updated: No local sub found for ${subId}`);
                    break;
                }

                // Always sync status from Stripe
                const updateData: any = {
                    stripeStatus: stripeSubObj.status,
                    updatedAt: new Date(),
                };

                // Map Stripe status to local status
                if (['active', 'trialing'].includes(stripeSubObj.status)) {
                    updateData.status = 'active';
                } else if (stripeSubObj.status === 'past_due') {
                    updateData.status = 'grace_period';
                } else if (stripeSubObj.status === 'canceled' || stripeSubObj.status === 'unpaid') {
                    updateData.status = 'expired';
                }

                // Sync period dates
                if (stripeSubObj.current_period_end) {
                    updateData.endDate = new Date(stripeSubObj.current_period_end * 1000);
                    updateData.nextBillingDate = new Date(stripeSubObj.current_period_end * 1000);
                }

                // Detect plan/price change (items changed)
                if (previousAttributes.items) {
                    const newPriceId = stripeSubObj.items?.data?.[0]?.price?.id;
                    if (newPriceId) {
                        console.log(`🔄 [Webhook] Price changed to: ${newPriceId}`);

                        // Try to find the matching local plan by price lookup
                        // We search plans by their Stripe price metadata or by interval
                        const newInterval = stripeSubObj.items?.data?.[0]?.price?.recurring?.interval;
                        const newBillingPeriod = newInterval === 'year' ? 'yearly' : 'monthly';
                        updateData.billingPeriod = newBillingPeriod;

                        // Try to match Stripe product to local plan via metadata
                        const stripeProductId = stripeSubObj.items?.data?.[0]?.price?.product;
                        if (stripeProductId) {
                            // Check all plans to find one matching this Stripe product
                            const allPlans = await db.select().from(plans);
                            // Match by stripePriceId metadata if available, otherwise try by price amount
                            const newAmount = stripeSubObj.items?.data?.[0]?.price?.unit_amount;
                            const matchedPlan = allPlans.find(p => {
                                const planPrice = newBillingPeriod === 'yearly' ? p.priceYearly : p.priceMonthly;
                                return planPrice === newAmount;
                            });

                            if (matchedPlan) {
                                console.log(`✅ [Webhook] Matched plan: ${matchedPlan.displayName} (ID: ${matchedPlan.id})`);
                                updateData.planId = matchedPlan.id;

                                // Update credits for the new plan
                                await db.update(credits)
                                    .set({
                                        creditsInitial: matchedPlan.creditsInitial,
                                        creditsDaily: matchedPlan.creditsDaily,
                                        amount: sql`(${matchedPlan.creditsInitial}::integer + ${matchedPlan.creditsDaily}::integer + COALESCE(${credits.creditsBonus}, 0))`,
                                    })
                                    .where(eq(credits.userId, localSub.userId));
                                console.log(`✅ [Webhook] Credits updated for new plan`);
                            } else {
                                console.warn(`⚠️ [Webhook] Could not match Stripe price ${newPriceId} (amount: ${newAmount}) to any local plan`);
                            }
                        }
                    }
                }

                // Clear grace period if subscription is now active
                if (stripeSubObj.status === 'active') {
                    updateData.gracePeriodEndsAt = null;
                }

                await db.update(subscriptions)
                    .set(updateData)
                    .where(eq(subscriptions.id, localSub.id));

                console.log(`✅ [Webhook] Subscription ${subId} synced locally`);
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
                    const isDeleted = event.type === 'customer.subscription.deleted';
                    console.log(`⚠️ Stripe ${isDeleted ? 'Cancelamento' : 'Falha'}: Sub ${subscriptionId}`);
                    await db.update(subscriptions)
                        .set({
                            stripeStatus: isDeleted ? 'canceled' : 'past_due',
                            status: isDeleted ? 'expired' : 'grace_period', // ✅ FIX: Expire on deletion, grace_period on failure
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
