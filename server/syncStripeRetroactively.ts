import 'dotenv/config'; // Load .env variables
import { stripe } from "./stripe";
import { getDb } from "./db";
import { users, subscriptions, credits, plans } from "../drizzle/schema";
import { eq, isNull, isNotNull, and } from "drizzle-orm";

/**
 * Script para sincronizar assinaturas do Stripe retroativamente
 * 
 * Problema: Usuários pagaram mas stripeSubscriptionId está NULL no banco
 * Solução: Buscar assinaturas ativas no Stripe e vincular aos usuários corretos
 */
export async function syncStripeSubscriptionsRetroactively() {
    console.log('🔄 [Sync] Iniciando sincronização retroativa de assinaturas...\n');

    const db = await getDb();
    if (!db) {
        console.error('❌ [Sync] Database not available');
        return;
    }

    try {
        // 1. Buscar todos os usuários com stripeCustomerId mas sem stripeSubscriptionId
        const usersWithoutSubId = await db
            .select({
                userId: users.id,
                email: users.email,
                stripeCustomerId: users.stripeCustomerId,
                subscriptionId: subscriptions.id,
                currentPlanId: subscriptions.planId,
            })
            .from(users)
            .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
            .where(
                and(
                    isNotNull(users.stripeCustomerId),
                    isNull(subscriptions.stripeSubscriptionId)
                )
            );

        console.log(`📊 [Sync] Encontrados ${usersWithoutSubId.length} usuários para sincronizar\n`);

        if (usersWithoutSubId.length === 0) {
            console.log('✅ [Sync] Nenhuma sincronização necessária!');
            return;
        }

        let syncedCount = 0;
        let errorCount = 0;

        // 2. Para cada usuário, buscar assinatura ativa no Stripe
        for (const user of usersWithoutSubId) {
            console.log(`\n🔍 [Sync] Processando: ${user.email} (User ID: ${user.userId})`);
            console.log(`   Stripe Customer: ${user.stripeCustomerId}`);

            try {
                // Buscar assinaturas deste customer no Stripe
                const stripeSubscriptions = await stripe.subscriptions.list({
                    customer: user.stripeCustomerId!,
                    limit: 10,
                });

                if (stripeSubscriptions.data.length === 0) {
                    console.log('   ⚠️  Nenhuma assinatura encontrada no Stripe');
                    continue;
                }

                // Pegar a primeira assinatura ativa ou trialing
                const activeSub = stripeSubscriptions.data.find(
                    sub => sub.status === 'active' || sub.status === 'trialing'
                );

                if (!activeSub) {
                    console.log('   ⚠️  Nenhuma assinatura ativa/trialing encontrada');
                    continue;
                }

                console.log(`   ✅ Assinatura encontrada:`, {
                    id: activeSub.id,
                    status: activeSub.status,
                    plan: activeSub.items.data[0]?.price.id
                });

                // ✅ IMPORTANTE: .list() não retorna todos os campos, precisamos fazer .retrieve()
                console.log(`   🔄 Buscando dados completos da assinatura...`);
                const fullSub = await stripe.subscriptions.retrieve(activeSub.id, {
                    expand: ['latest_invoice', 'default_payment_method']
                }) as any;

                // DEBUG: Ver o que realmente está vindo
                console.log(`   🐛 DEBUG - Keys disponíveis:`, Object.keys(fullSub));
                // Se for o usuário problemático, logar tudo
                if (activeSub.id === 'sub_1SovbXHWDafJwDEnBhNZyM9U') {
                    console.log('   🐛 FULL OBJECT:', JSON.stringify(fullSub, null, 2));
                }

                // 3. Atualizar o banco de dados  
                const trialEndTimestamp = fullSub.trial_end;
                const periodEndTimestamp = fullSub.current_period_end;
                const startDateTimestamp = fullSub.start_date;

                // ✅ IMPORTANTE: Durante trial, current_period_end pode ser undefined
                // Nesse caso, usamos trial_end como o período final
                let effectivePeriodEnd = periodEndTimestamp || trialEndTimestamp;

                // FALBACK EXTREMO: Se for 'active' e não tiver data, assumir start_date + 30 dias
                if (!effectivePeriodEnd && fullSub.status === 'active' && startDateTimestamp) {
                    console.log('   ⚠️ Usando Fallback: start_date + 30 dias');
                    effectivePeriodEnd = startDateTimestamp + (30 * 24 * 60 * 60);
                }

                if (!effectivePeriodEnd) {
                    console.log(`   ⚠️  Nem current_period_end nem trial_end disponíveis, pulando...`);
                    continue;
                }

                const trialEnd = trialEndTimestamp ? new Date(trialEndTimestamp * 1000) : null;
                const periodEnd = new Date(effectivePeriodEnd * 1000);
                const startDate = startDateTimestamp ? new Date(startDateTimestamp * 1000) : new Date();

                const nextBillingDate = trialEnd && trialEnd > new Date() ? trialEnd : periodEnd;
                const isActiveOrTrial = ['active', 'trialing'].includes(fullSub.status);
                const appStatus = isActiveOrTrial ? 'active' : 'expired';

                console.log(`   ✅ Dados processados:`, {
                    periodEnd: periodEnd.toISOString(),
                    nextBillingDate: nextBillingDate.toISOString(),
                    status: appStatus,
                    isTrialing: fullSub.status === 'trialing'
                });

                // Tentar identificar o plano baseado no price ID ou deixar o atual
                // (você pode melhorar isso mapeando price IDs para plan IDs)
                const planId = user.currentPlanId || 1; // Default para FREE se não tiver

                if (user.subscriptionId) {
                    // Atualizar assinatura existente
                    await db.update(subscriptions)
                        .set({
                            stripeSubscriptionId: fullSub.id,
                            stripeStatus: fullSub.status,
                            status: appStatus as 'active' | 'expired',
                            startDate: startDate,
                            endDate: periodEnd,
                            nextBillingDate: nextBillingDate,
                            updatedAt: new Date()
                        })
                        .where(eq(subscriptions.id, user.subscriptionId));

                    console.log(`   ✅ Assinatura ${user.subscriptionId} atualizada com Stripe ID: ${fullSub.id}`);
                } else {
                    // Criar nova assinatura (caso não exista)
                    await db.insert(subscriptions).values({
                        userId: user.userId,
                        planId: planId,
                        status: appStatus as 'active' | 'expired',
                        billingPeriod: 'monthly',
                        stripeSubscriptionId: fullSub.id,
                        stripeStatus: fullSub.status,
                        startDate: startDate,
                        endDate: periodEnd,
                        nextBillingDate: nextBillingDate,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    console.log(`   ✅ Nova assinatura criada com Stripe ID: ${fullSub.id}`);
                }

                syncedCount++;

            } catch (error: any) {
                console.error(`   ❌ Erro ao processar usuário ${user.userId}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ [Sync] Sincronização concluída!`);
        console.log(`   Total processado: ${usersWithoutSubId.length}`);
        console.log(`   Sincronizados: ${syncedCount}`);
        console.log(`   Erros: ${errorCount}`);
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ [Sync] Erro geral na sincronização:', error);
    }
}

// Permitir executar diretamente
if (require.main === module) {
    syncStripeSubscriptionsRetroactively()
        .then(() => {
            console.log('✅ Script finalizado');
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Erro fatal:', err);
            process.exit(1);
        });
}
