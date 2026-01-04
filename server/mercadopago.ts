import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Inicializar cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  },
});

const preference = new Preference(client);
const payment = new Payment(client);

/**
 * Criar preferência de pagamento para assinatura
 */
export async function createSubscriptionCheckout(params: {
  planId: number;
  planName: string;
  price: number;
  duration: number;
  billingPeriod: 'monthly' | 'yearly';
  userId: number;
  userEmail: string;
}) {
  const { planId, planName, price, duration, billingPeriod, userId, userEmail } = params;

  try {
    const preferenceData = {
      items: [
        {
          id: `plan-${planId}`,
          title: `Assinatura ${planName} - GNOSIS AI`,
          description: `Plano ${planName} ${billingPeriod === 'yearly' ? 'anual' : 'mensal'} com renovação automática`,
          quantity: 1,
          unit_price: price,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: userEmail,
      },
      back_urls: {
        success: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/payment/success',
        failure: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/payment/failure',
        pending: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/payment/pending',
      },
      notification_url: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/api/webhooks/mercadopago',
      metadata: {
        user_id: userId,
        plan_id: planId,
        type: 'subscription',
        duration: duration,
        billing_period: billingPeriod,
      },
      statement_descriptor: 'GNOSIS AI',
      external_reference: `sub-${userId}-${planId}-${Date.now()}`,
      payment_methods: {
        excluded_payment_methods: billingPeriod === 'yearly' ? [{ id: 'pix' }] : [], // PIX apenas para pagamentos mensais
        excluded_payment_types: [], // Aceitar todos os tipos de pagamento (cartão, débito, boleto, etc)
        installments: 12, // Permitir parcelamento em até 12x
        default_installments: 1,
      },
    };

    const response = await preference.create({ body: preferenceData });
    
    return {
      id: response.id,
      init_point: response.init_point, // URL para checkout
      sandbox_init_point: response.sandbox_init_point, // URL para testes
    };
  } catch (error) {
    console.error('[MercadoPago] Erro ao criar checkout de assinatura:', error);
    throw new Error('Falha ao criar checkout de pagamento');
  }
}

/**
 * Criar preferência de pagamento para créditos avulsos
 */
export async function createCreditsCheckout(params: {
  credits: number;
  price: number;
  userId: number;
  userEmail: string;
}) {
  const { credits, price, userId, userEmail } = params;

  try {
    const preferenceData = {
      items: [
        {
          id: `credits-${credits}`,
          title: `${credits.toLocaleString('pt-BR')} Créditos - GNOSIS AI`,
          description: `Pacote de ${credits.toLocaleString('pt-BR')} créditos avulsos`,
          quantity: 1,
          unit_price: price,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: userEmail,
      },
      back_urls: {
        success: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/payment/success',
        failure: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/payment/failure',
        pending: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/payment/pending',
      },
      notification_url: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/api/webhooks/mercadopago',
      metadata: {
        user_id: userId,
        credits: credits,
        type: 'credits',
      },
      statement_descriptor: 'GNOSIS AI',
      external_reference: `credits-${userId}-${credits}-${Date.now()}`,
      payment_methods: {
        excluded_payment_methods: [], // Permitir PIX para créditos avulsos
        excluded_payment_types: [],
        installments: 12, // Permitir parcelamento em até 12x
      },
    };

    const response = await preference.create({ body: preferenceData });
    
    return {
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    };
  } catch (error) {
    console.error('[MercadoPago] Erro ao criar checkout de créditos:', error);
    throw new Error('Falha ao criar checkout de pagamento');
  }
}

/**
 * Criar preferência de pagamento manual (pagamento único com PIX)
 */
export async function createManualPaymentCheckout(params: {
  planId: number;
  planName: string;
  price: number;
  duration: number;
  billingPeriod: 'monthly' | 'yearly';
  userId: number;
  userEmail: string;
}) {
  const { planId, planName, price, duration, billingPeriod, userId, userEmail } = params;

  try {
    const preferenceData = {
      items: [
        {
          id: `manual-plan-${planId}`,
          title: `Pagamento ${planName} ${billingPeriod === 'yearly' ? 'Anual' : 'Mensal'} - GNOSIS AI`,
          description: `Plano ${planName} ${billingPeriod === 'yearly' ? 'anual' : 'mensal'} - Pagamento único (renovação manual)`,
          quantity: 1,
          unit_price: price,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: userEmail,
      },
      back_urls: {
        success: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/payment/success',
        failure: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/payment/failure',
        pending: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/payment/pending',
      },
      notification_url: 'https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/api/webhooks/mercadopago',
      metadata: {
        user_id: userId,
        plan_id: planId,
        type: 'manual_subscription', // Tipo diferente para identificar no webhook
        duration: duration,
        billing_period: billingPeriod,
      },
      statement_descriptor: 'GNOSIS AI',
      external_reference: `manual-sub-${userId}-${planId}-${Date.now()}`,
      payment_methods: {
        excluded_payment_methods: [], // Permitir PIX para pagamento manual
        excluded_payment_types: [],
        installments: 12, // Permitir parcelamento em até 12x
      },
    };

    const response = await preference.create({ body: preferenceData });
    
    return {
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    };
  } catch (error) {
    console.error('[MercadoPago] Erro ao criar checkout manual:', error);
    throw new Error('Falha ao criar checkout de pagamento');
  }
}

/**
 * Verificar status de um pagamento
 */
export async function getPaymentStatus(paymentId: string) {
  try {
    const paymentData = await payment.get({ id: paymentId });
    
    return {
      id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      transaction_amount: paymentData.transaction_amount,
      metadata: paymentData.metadata,
      external_reference: paymentData.external_reference,
    };
  } catch (error) {
    console.error('[MercadoPago] Erro ao buscar status do pagamento:', error);
    throw new Error('Falha ao verificar status do pagamento');
  }
}

/**
 * Processar webhook do Mercado Pago
 */
export async function processWebhook(data: any) {
  try {
    const { type, data: webhookData } = data;

    // Mercado Pago envia notificações de diferentes tipos
    if (type === 'payment') {
      const paymentId = webhookData.id;
      const paymentInfo = await getPaymentStatus(paymentId);

      return {
        type: 'payment',
        paymentId,
        status: paymentInfo.status,
        metadata: paymentInfo.metadata,
        externalReference: paymentInfo.external_reference,
      };
    }

    return null;
  } catch (error) {
    console.error('[MercadoPago] Erro ao processar webhook:', error);
    throw error;
  }
}

