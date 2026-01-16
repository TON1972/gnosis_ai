import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

export interface StripeFinancialData {
    balance: {
        available: number;
        pending: number;
        currency: string;
    };
    recentPayments: Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        created: number;
        customer: string | null;
        customerName: string | null;
        customerEmail: string | null;
        description: string | null;
    }>;
    activeSubscriptions: {
        total: number;
        monthlyRevenue: number;
        yearlyRevenue: number;
    };
    upcomingRenewals: Array<{
        subscriptionId: string;
        customerId: string;
        customerName: string | null;
        customerEmail: string | null;
        amount: number;
        currency: string;
        nextBillingDate: number;
        planName: string;
    }>;
}

/**
 * Get comprehensive financial data from Stripe
 */
export async function getStripeFinancialData(): Promise<StripeFinancialData> {
    try {
        // 1. Get balance
        const balance = await stripe.balance.retrieve();
        const balanceData = {
            available: balance.available[0]?.amount || 0,
            pending: balance.pending[0]?.amount || 0,
            currency: balance.available[0]?.currency || "brl",
        };

        // 2. Get recent payments (last 20)
        const paymentIntents = await stripe.paymentIntents.list({
            limit: 20,
            expand: ['data.customer'],
        });

        const recentPayments = await Promise.all(
            paymentIntents.data.map(async (pi) => {
                let customerName = null;
                let customerEmail = null;

                if (pi.customer) {
                    const customerId = typeof pi.customer === 'string' ? pi.customer : pi.customer.id;
                    try {
                        const customer = await stripe.customers.retrieve(customerId);
                        if (!customer.deleted) {
                            customerName = customer.name || null;
                            customerEmail = customer.email || null;
                        }
                    } catch (error) {
                        console.error('Error fetching customer:', error);
                    }
                }

                return {
                    id: pi.id,
                    amount: pi.amount,
                    currency: pi.currency,
                    status: pi.status,
                    created: pi.created,
                    customer: typeof pi.customer === 'string' ? pi.customer : null,
                    customerName,
                    customerEmail,
                    description: pi.description,
                };
            })
        );

        // 3. Get active and trialing subscriptions
        const [activeSubsResponse, trialingSubsResponse] = await Promise.all([
            stripe.subscriptions.list({ status: "active", limit: 100 }),
            stripe.subscriptions.list({ status: "trialing", limit: 100 })
        ]);

        const allSubscriptions = [...activeSubsResponse.data, ...trialingSubsResponse.data];

        let monthlyRevenue = 0;
        let yearlyRevenue = 0;

        const upcomingRenewals = await Promise.all(
            allSubscriptions.map(async (sub) => {
                const amount = sub.items.data[0]?.price.unit_amount || 0;
                const interval = sub.items.data[0]?.price.recurring?.interval || "month";

                // Calculate revenue (only count active subscriptions for current revenue)
                if (sub.status === "active") {
                    if (interval === "month") {
                        monthlyRevenue += amount;
                    } else if (interval === "year") {
                        yearlyRevenue += amount;
                        monthlyRevenue += amount / 12; // Convert yearly to monthly equivalent
                    }
                }

                let customerName = null;
                let customerEmail = null;

                const customerId = typeof sub.customer === 'string' ? sub.customer : '';
                if (customerId) {
                    try {
                        const customer = await stripe.customers.retrieve(customerId);
                        if (!customer.deleted) {
                            customerName = customer.name || null;
                            customerEmail = customer.email || null;
                        }
                    } catch (error) {
                        console.error('Error fetching customer:', error);
                    }
                }

                // Use trial_end for trialing subs, current_period_end for active subs
                const nextBillingDate = sub.status === "trialing" && (sub as any).trial_end
                    ? (sub as any).trial_end
                    : (sub as any).current_period_end;

                return {
                    subscriptionId: sub.id,
                    customerId,
                    customerName,
                    customerEmail,
                    amount,
                    currency: sub.currency,
                    nextBillingDate,
                    planName: sub.items.data[0]?.price.nickname || "Plan",
                };
            })
        );

        const activeSubscriptions = {
            total: allSubscriptions.length,
            monthlyRevenue,
            yearlyRevenue,
        };

        return {
            balance: balanceData,
            recentPayments,
            activeSubscriptions,
            upcomingRenewals: upcomingRenewals.slice(0, 10), // Top 10 upcoming renewals
        };
    } catch (error) {
        console.error("Error fetching Stripe financial data:", error);
        throw new Error("Failed to fetch financial data from Stripe");
    }
}

/**
 * Get revenue statistics for a specific period
 */
export async function getStripeRevenueStats(days: number = 30) {
    try {
        const startDate = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

        const charges = await stripe.charges.list({
            created: { gte: startDate },
            limit: 100,
        });

        const successfulCharges = charges.data.filter((c) => c.status === "succeeded");

        const totalRevenue = successfulCharges.reduce((acc, charge) => acc + charge.amount, 0);
        const averageTransaction = successfulCharges.length > 0
            ? totalRevenue / successfulCharges.length
            : 0;

        return {
            totalRevenue,
            transactionCount: successfulCharges.length,
            averageTransaction,
            period: days,
        };
    } catch (error) {
        console.error("Error fetching revenue stats:", error);
        throw new Error("Failed to fetch revenue statistics");
    }
}
