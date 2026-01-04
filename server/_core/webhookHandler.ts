import { Request, Response } from 'express';
import { processWebhook } from '../mercadopago';
import { getDb } from '../db';
import { subscriptions, creditTransactions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Handler para webhooks do Mercado Pago
 */
export async function handleMercadoPagoWebhook(req: Request, res: Response) {
  try {
    console.log('[Webhook] Recebido webhook do Mercado Pago:', req.body);

    const webhookData = await processWebhook(req.body);

    if (!webhookData) {
      return res.status(200).json({ received: true });
    }

    const { type, status, metadata, externalReference } = webhookData;

    // Processar apenas pagamentos aprovados
    if (status !== 'approved') {
      console.log(`[Webhook] Pagamento ${status}, ignorando`);
      return res.status(200).json({ received: true });
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

    res.status(200).json({ received: true, processed: true });
  } catch (error) {
    console.error('[Webhook] Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

