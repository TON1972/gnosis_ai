import { processWebhook } from '../mercadopago';
import { getDb } from '../db';
import { subscriptions, creditTransactions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';

// Lógica agnóstica de framework para processar o webhook
export async function processWebhookLogic(body: any): Promise<{ status: number, body: any }> {
  try {
    console.log('[Webhook] Recebido webhook do Mercado Pago:', body);

    const webhookData = await processWebhook(body);

    if (!webhookData) {
      return { status: 200, body: { received: true } };
    }

    const { type, status, metadata, externalReference } = webhookData;

    // Processar apenas pagamentos aprovados
    if (status !== 'approved') {
      console.log(`[Webhook] Pagamento ${status}, ignorando`);
      return { status: 200, body: { received: true } };
    }

    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Processar baseado no tipo
    if (metadata.type === 'subscription') {
      // Atualizar assinatura do usuário
      const userId = metadata.user_id;
      const planId = metadata.plan_id;
      const duration = metadata.duration || 1; // Duração em meses (1 = mensal, 12 = anual)
      const billingPeriod = metadata.billing_period || 'monthly';

      // Calcular data de término baseada na duração
      const daysToAdd = duration * 30; // Aproximadamente 30 dias por mês
      const endDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

      // Verificar se já existe assinatura ativa
      const existingSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (existingSubscription.length > 0) {
        // Atualizar assinatura existente
        await db
          .update(subscriptions)
          .set({
            planId: planId,
            status: 'active',
            endDate: endDate,
          })
          .where(eq(subscriptions.userId, userId));
      } else {
        // Criar nova assinatura
        await db.insert(subscriptions).values({
          userId: userId,
          planId: planId,
          status: 'active',
          endDate: endDate,
        });
      }

      console.log(`[Webhook] Assinatura ${billingPeriod} atualizada para usuário ${userId}, plano ${planId}, válida até ${endDate.toISOString()}`);
    } else if (metadata.type === 'credits') {
      // Adicionar créditos avulsos
      const userId = metadata.user_id;
      const credits = metadata.credits;

      await db.insert(creditTransactions).values({
        userId: userId,
        amount: credits,
        type: 'bonus',
        description: `Compra de ${credits} créditos avulsos`,
      });

      console.log(`[Webhook] ${credits} créditos adicionados para usuário ${userId}`);
    }

    return { status: 200, body: { received: true, processed: true } };
  } catch (error) {
    console.error('[Webhook] Erro ao processar webhook:', error);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}

/**
 * Handler para webhooks do Mercado Pago (Express)
 */
export async function handleMercadoPagoWebhook(req: ExpressRequest, res: ExpressResponse) {
  const result = await processWebhookLogic(req.body);
  res.status(result.status).json(result.body);
}

/**
 * Handler para webhooks do Mercado Pago (Vercel Serverless / Standard Request)
 */
export async function handleMercadoPagoWebhookStandard(req: Request): Promise<Response> {
  const body = await req.json();
  const result = await processWebhookLogic(body);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' }
  });
}
