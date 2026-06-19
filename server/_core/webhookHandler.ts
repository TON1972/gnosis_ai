import { getMercadoPago } from '../mercadopago.js';
import { getDb } from '../db.js';
import { subscriptions, creditTransactions, payments, credits, plans, users } from '../../drizzle/schema.js';
import { eq, sql, desc, and } from 'drizzle-orm';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { sendMetaEvent } from '../meta-capi.js';
import { processAffiliateCommission } from '../affiliate_utils.js';

console.log(">>> LOADING webhookHandler.ts");

export async function handleMercadoPagoWebhook(req: ExpressRequest, res: ExpressResponse) {
    try {
        console.log("🔔 [Webhook] Recebido:", JSON.stringify(req.body, null, 2));
        await processPaymentLogic(req.body, req);
        res.setHeader("ngrok-skip-browser-warning", "true");
        return res.status(200).send("OK");
    } catch (error: any) {
        console.error("❌ [Webhook Express Error]:", error.message);
        return res.status(200).send("OK");
    }
}

export async function handleMercadoPagoWebhookStandard(req: Request) {
    try {
        const body = await req.json();
        console.log("🔔 [Webhook Standard] Recebido:", JSON.stringify(body, null, 2));
        await processPaymentLogic(body);
        return new Response("OK", {
            status: 200,
            headers: { "ngrok-skip-browser-warning": "true" }
        });
    } catch (error: any) {
        console.error("❌ [Webhook Standard Error]:", error.message);
        return new Response("OK", { status: 200 });
    }
}

export async function processPaymentLogic(body: any, expressReq?: ExpressRequest) {
    const { type, data } = body;

    // Suporte a diferentes formatos de webhook (alguns enviam type='payment', outros topic='payment')
    const eventType = type || body.topic;

    // Suporte a eventos de assinatura (criação/aprovação)
    if (eventType === 'subscription_preapproval') {
        const preapprovalId = String(data?.id || body.resource);
        console.log(`✅ [Webhook] Assinatura criada/atualizada. ID: ${preapprovalId}`);
        // Aqui poderíamos ativar a assinatura imediatamente se já não estiver
        return;
    }

    if (eventType !== "payment") return;

    const paymentId = String(data?.id || body.resource);
    if (!paymentId) {
        console.error("❌ Erro: Webhook sem Payment ID.");
        return;
    }

    const { payment } = getMercadoPago();
    const paymentDetails = await payment.get({ id: paymentId });

    if (paymentDetails.status === "approved") {
        const database = await getDb();
        if (!database) return;

        // ✅ IDEMPOTENCY: Check if this payment was already processed
        const existingPayment = await database.select()
            .from(payments)
            .where(eq(payments.mercadoPagoId, paymentId))
            .limit(1);

        if (existingPayment.length > 0) {
            console.log(`⚠️ [MercadoPago] Payment ${paymentId} already processed (ID: ${existingPayment[0].id}), skipping`);
            return;
        }


        const meta = paymentDetails.metadata || {};
        const externalRef = paymentDetails.external_reference || "";

        // ✅ LÓGICA DE RECUPERAÇÃO DE USER ID
        let userId = Number(meta.user_id);

        // ... (lógica de extração de userID mantida pelos trechos anteriores, mas vamos reforçar)
        if (isNaN(userId) && externalRef) {
            const parts = externalRef.split('-');
            if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
                userId = Number(parts[1]);
            }
        }

        if (!userId || isNaN(userId)) {
            console.error(`❌ Erro: User ID não identificado.`);
            return;
        }

        // ✅ TENTA RECUPERAR ASSINATURA ATIVA
        let subscriptionId: number | null = null;
        const currentSub = await database.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
        if (currentSub.length > 0) {
            subscriptionId = currentSub[0].id;
        }

        // 3. IDENTIFICAÇÃO DO TIPO (ANTECIPADA PARA O INSERT)
        const hasCreditsMeta = meta.credits !== undefined && meta.credits !== null;
        const isSubscriptionRef = externalRef.startsWith('sub-');
        const isSubscription = (meta.type === 'subscription' || isSubscriptionRef) && !hasCreditsMeta;
        const isManualSubscription = meta.type === 'manual_subscription';
        const isCredits = hasCreditsMeta || meta.type === 'credits' || externalRef.startsWith('credits-');

        let transactionType = 'unknown';
        let creditsAmount = 0;

        if (isCredits) {
            transactionType = 'credit';
            // Tenta pegar amount (repetindo lógica abaixo)
            let amountToAdd = Number(meta.credits || meta.target_id);
            if ((!amountToAdd || isNaN(amountToAdd)) && externalRef) {
                const parts = externalRef.split('-');
                if (parts.length >= 3 && parts[0] === 'credits' && !isNaN(Number(parts[2]))) {
                    amountToAdd = Number(parts[2]);
                }
            }
            creditsAmount = amountToAdd || 0;
        } else if (isSubscription) {
            const period = meta.billing_period || meta.billingPeriod;
            transactionType = period === 'yearly' ? 'plan_yearly' : 'plan_monthly';
        } else if (isManualSubscription) {
            transactionType = 'plan_manual';
        }

        // 1. REGISTRA O PAGAMENTO (Atualizado com novos campos)
        const amountTotal = Math.round((paymentDetails.transaction_amount || 0) * 100);
        await database.insert(payments).values({
            userId: userId,
            subscriptionId: subscriptionId,
            amount: amountTotal,
            currency: 'BRL',
            status: 'approved',
            paymentMethod: paymentDetails.payment_method_id,
            mercadoPagoId: paymentId,
            externalId: externalRef,
            // ✅ NOVOS CAMPOS
            type: transactionType,
            creditsAmount: creditsAmount,
            createdAt: new Date()
        } as any).onConflictDoUpdate({
            target: [payments.id],
            set: { status: 'approved', mercadoPagoId: paymentId } as any
        }).catch((err) => console.error("Erro ao salvar pagamento:", err));

        // 2. CREDITS (Type safety fix)
        await database.insert(credits)
            .values({
                userId,
                amount: 0,
                creditsBonus: 0,
                creditsInitial: 0,
                creditsDaily: 0,
                type: 'initial'
            } as any)
            .onConflictDoNothing();

        // 3. LÓGICA DE ATUALIZAÇÃO (Reusa as variáveis definidas acima)
        console.log(`[Debug] Type Check: Sub=${isSubscription}, Manual=${isManualSubscription}, Credits=${isCredits}`);

        // --- FLUXO DE PLANOS ---
        if (isSubscription || isManualSubscription) {
            let planId = Number(meta.plan_id || meta.target_id);

            // Fallback: Extrair Plan ID do external_reference (sub-UserID-PlanID-Date)
            if (!planId && isSubscriptionRef) {
                const parts = externalRef.split('-');
                if (parts.length >= 3 && !isNaN(Number(parts[2]))) {
                    planId = Number(parts[2]);
                    console.log(`[Debug] PlanID extraído do ExternalRef: ${planId}`);
                }
            }

            if (!planId) {
                console.error("❌ Erro: Plan ID não encontrado.");
                return;
            }

            const [plan] = await database.select().from(plans).where(eq(plans.id, planId));

            if (plan) {
                // Se for 'yearly', adiciona 1 ano, senão 1 mês
                // Verifica tanto 'billing_period' quanto 'billingPeriod'
                const billingPeriod = meta.billing_period || meta.billingPeriod || 'monthly';
                const interval = billingPeriod === 'yearly' ? '1 year' : '1 month';

                const [existingSub] = await database.select()
                    .from(subscriptions)
                    .where(eq(subscriptions.userId, userId))
                    .limit(1);

                const subscriptionUpdate = {
                    planId,
                    status: 'active' as const,
                    billingPeriod: billingPeriod,
                    updatedAt: new Date(),
                    lastPaymentDate: new Date(),
                    endDate: sql`NOW() + ${sql.raw(`interval '${interval}'`)}`
                };

                if (existingSub) {
                    await database.update(subscriptions)
                        .set(subscriptionUpdate as any)
                        .where(eq(subscriptions.userId, userId));
                } else {
                    await database.insert(subscriptions).values({
                        userId,
                        ...subscriptionUpdate,
                        startDate: new Date(),
                        createdAt: new Date(),
                    } as any);
                }

                // Atualiza os créditos BASE do plano
                await database.update(credits)
                    .set({
                        creditsInitial: plan.creditsInitial,
                        creditsDaily: plan.creditsDaily,
                        // Recalcula o total mantendo os bônus acumulados
                        amount: sql`(${plan.creditsInitial} + ${plan.creditsDaily} + COALESCE(${credits.creditsBonus}, 0))`
                    })
                    .where(eq(credits.userId, userId));

                console.log(`✅ Plano ${plan.displayName} ativado para User ${userId}.`);

                // ✅ NOVO: Processar comissão de afiliado
                if (subscriptionId && amountTotal > 0) {
                    await processAffiliateCommission(userId, subscriptionId, amountTotal);
                }
            }
        }

        // --- FLUXO DE CRÉDITOS AVULSOS ---
        else if (isCredits) {
            // Tenta pegar amount de 'credits' (novo) ou 'target_id' (antigo)
            let amountToAdd = Number(meta.credits || meta.target_id);

            // Fallback: Se não achar no metadata, tenta extrair do external_reference (ex: credits-9-6000-123123)
            if ((!amountToAdd || isNaN(amountToAdd)) && externalRef) {
                const parts = externalRef.split('-');
                // Formato esperado: credits-{userId}-{amount}-{timestamp}
                // Logo, parts[0]=credits, parts[1]=userId, parts[2]=amount
                if (parts.length >= 3 && parts[0] === 'credits' && !isNaN(Number(parts[2]))) {
                    amountToAdd = Number(parts[2]);
                    console.log(`[Debug] Amount extraído do ExternalRef: ${amountToAdd}`);
                }
            }

            // Fallback 2: Se ainda assim falhar, tenta estimar pelo valor pago (ex: R$1 = 10 créditos - apenas exemplo)
            // Mas idealmente o metadado ou external_reference deve vir correto.

            if (amountToAdd > 0) {
                await database.update(credits)
                    .set({
                        creditsBonus: sql`COALESCE(${credits.creditsBonus}, 0) + ${amountToAdd}`,
                        amount: sql`COALESCE(${credits.amount}, 0) + ${amountToAdd}`
                    })
                    .where(eq(credits.userId, userId));

                await database.insert(creditTransactions).values({
                    userId,
                    amount: amountToAdd,
                    type: 'bonus',
                    description: `Recarga via Mercado Pago: ${amountToAdd} créditos`
                });
                console.log(`✅ ${amountToAdd} Créditos adicionados para User ${userId}.`);
            } else {
                console.warn(`⚠️ Webhook de créditos recebido mas quantidade zerada ou não identificada. Meta: ${JSON.stringify(meta)}`);
            }
        }

        // ✅ 4. SEND TO META CAPI
        if (amountTotal > 0) {
            const [user] = await database.select().from(users).where(eq(users.id, userId)).limit(1);
            if (user) {
                await sendMetaEvent({
                    eventName: 'Purchase',
                    email: user.email || undefined,
                    clientIpAddress: expressReq?.ip || undefined,
                    clientUserAgent: (Array.isArray(expressReq?.headers['user-agent']) ? expressReq?.headers['user-agent'][0] : expressReq?.headers['user-agent']) || undefined,
                    currency: 'BRL',
                    value: amountTotal / 100,
                    orderId: paymentId
                });
            }
        }
    }
}