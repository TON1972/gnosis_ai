import Stripe from 'stripe';
import { resolveAppBaseUrl } from './appUrl.js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const BASE_URL = resolveAppBaseUrl();

if (!STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY não configurada!");
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
    typescript: true,
});


/**
 * Cria um cliente no Stripe
 */
export async function createStripeCustomer(email: string, name?: string) {
    try {
        const customer = await stripe.customers.create({
            email,
            name,
        });
        return customer;
    } catch (error) {
        console.error("Erro ao criar customer Stripe:", error);
        throw new Error("Erro ao criar cliente no Stripe");
    }
}

/**
 * Cria uma sessão de checkout para assinatura
 */
export async function createStripeCheckout(params: {
    planId: number;
    planName: string;
    price: number;
    currency?: 'brl' | 'usd' | 'eur';
    billingPeriod: 'monthly' | 'yearly';
    userId: number;
    userEmail: string;
    customerId: string; // ✅ Agora obrigatório
    trialDays?: number;
    // ✅ Dados para Meta CAPI (Pixel)
    fbc?: string;
    fbp?: string;
    clientIp?: string;
    clientUserAgent?: string;
}) {
    const { planId, planName, price, currency = 'brl', billingPeriod, userId, userEmail, customerId, trialDays, fbc, fbp, clientIp, clientUserAgent } = params;

    const unitAmount = Math.round(price * 100);
    const isYearly = String(billingPeriod).toLowerCase().trim() === 'yearly';
    const hasTrial = !!(trialDays && trialDays > 0);
    const useOneTimeYearly = isYearly && !hasTrial;

    console.log(`[Stripe] Creating checkout for ${userEmail}. Mode: ${useOneTimeYearly ? 'PAYMENT (One-time yearly)' : 'SUBSCRIPTION'}${hasTrial ? ` (trial ${trialDays}d)` : ''}`);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: useOneTimeYearly ? 'payment' : 'subscription',
            customer: customerId, // ✅ Usamos Customer ID em vez de email
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: isYearly ? `Plano ${planName} - GNOSIS AI (Anual)` : `Plano ${planName} - GNOSIS AI`,
                            description: hasTrial
                                ? `Teste grátis de ${trialDays} dias — cobrança automática após o período`
                                : isYearly
                                  ? `Pagamento Único (Acesso por 1 Ano)`
                                  : `Assinatura Mensal`,
                        },
                        unit_amount: unitAmount,
                        ...(useOneTimeYearly ? {} : {
                            recurring: {
                                interval: isYearly ? 'year' : 'month',
                            }
                        }),
                    },
                    quantity: 1,
                },
            ],
            payment_method_options: useOneTimeYearly ? {
                card: {
                    installments: {
                        enabled: true
                    }
                }
            } : undefined,
            metadata: {
                userId: userId.toString(),
                planId: planId.toString(),
                billingPeriod: billingPeriod,
                type: 'subscription',
                // ✅ Armazena dados originais do usuário para o Webhook usar no CAPI
                fbc: fbc || "",
                fbp: fbp || "",
                clientIp: clientIp || "",
                clientUserAgent: clientUserAgent || ""
            },
            subscription_data: hasTrial ? {
                trial_period_days: trialDays,
                metadata: {
                    userId: userId.toString(),
                    planId: planId.toString(),
                    billingPeriod: billingPeriod,
                },
            } : undefined,
            payment_intent_data: useOneTimeYearly ? {
                description: `Compra de Plano Anual - ${planName}`,
                metadata: {
                    userId: userId.toString(),
                    planId: planId.toString(),
                    billingPeriod: 'yearly'
                }
            } : undefined,
            success_url: `${BASE_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${BASE_URL}/dashboard?payment=cancelled`,
            allow_promotion_codes: true,
        });

        return {
            id: session.id,
            url: session.url,
        };
    } catch (error) {
        console.error("Erro ao criar checkout Stripe:", error);
        throw new Error("Erro ao iniciar pagamento com Stripe");
    }
}

/**
 * Cria uma sessão do Portal do Cliente Stripe (para gerenciar assinaturas/cartões)
 */
export async function createPortalSession(customerId: string) {
    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${BASE_URL}/perfil`,
        });

        return session.url;
    } catch (error) {
        console.error("Erro ao criar sessão do portal Stripe:", error);
        throw new Error("Erro ao acessar portal de cobrança");
    }
}
