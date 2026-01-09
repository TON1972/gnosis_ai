import { MercadoPagoConfig, Preference, Payment, PreApproval } from 'mercadopago';

// Inicializar cliente Mercado Pago (Lazy)
let client: MercadoPagoConfig | null = null;
let preference: Preference | null = null;
let payment: Payment | null = null;
let preapproval: PreApproval | null = null;

// Use APP_URL se definido, senão constrói a URL do Vercel (que vem sem https://), ou fallback para localhost
const BASE_URL = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://unobstructed-speculatively-ricky.ngrok-free.dev');

export function getMercadoPago() {
  if (!client) {
    const token = process.env.MP_ACCESS_TOKEN || '';
    if (!token) console.warn("[MercadoPago] Token não configurado!");

    client = new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 5000 },
    });
    preference = new Preference(client);
    payment = new Payment(client);
    preapproval = new PreApproval(client);
  }
  return { client, preference: preference!, payment: payment!, preapproval: preapproval! };
}

/**
 * Criar assinatura recorrente (PreApproval)
 * "Netflix Style" - Cobrança automática
 */
export async function createSubscriptionCheckout(params: {
  planId: number;
  planName: string;
  price: number;
  duration: number; // Ignorado na lógica de recorrência, usado apenas se necessário
  billingPeriod: 'monthly' | 'yearly';
  userId: number;
  userEmail: string;
}) {
  const { planId, planName, price, billingPeriod, userId, userEmail } = params;

  try {
    const { preapproval } = getMercadoPago();

    const frequency = billingPeriod === 'yearly' ? 12 : 1;
    const frequencyType = 'months';

    const response = await preapproval.create({
      body: {
        reason: `Assinatura ${planName} - GNOSIS AI`,
        auto_recurring: {
          frequency: frequency,
          frequency_type: frequencyType,
          transaction_amount: price,
          currency_id: 'BRL',
          // billing_day e billing_day_proportional removidos para evitar erro de TS
          // O padrão é cobrar no momento da criação
        },
        // payer_email removido para evitar conflito de "Different Countries"
        // O usuário preencherá o email no checkout do Mercado Pago
        // payer_email: userEmail, 
        back_url: `${BASE_URL}/dashboard?payment=success`,
        external_reference: `sub-${userId}-${planId}-${Date.now()}`, // Identificador para Webhook
      }
    });

    return {
      id: response.id,
      init_point: response.init_point!, // URL para o fluxo de assinatura
      // sandbox_init_point não existe no tipo PreApprovalResponse, usamos init_point padrão
    };
  } catch (error) {
    console.error('[MercadoPago] Erro ao criar assinatura recorrente:', error);
    throw new Error('Falha ao criar assinatura autom\u00e1tica');
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
      // payer: {
      //   email: userEmail,
      // },
      back_urls: {
        success: `${BASE_URL}/dashboard?payment=success`,
        failure: `${BASE_URL}/dashboard?payment=failure`,
        pending: `${BASE_URL}/dashboard?payment=pending`,
      },
      notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
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

    const { preference } = getMercadoPago();
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
      // payer: {
      //   email: userEmail,
      // },
      back_urls: {
        success: `${BASE_URL}/dashboard?payment=success`,
        failure: `${BASE_URL}/dashboard?payment=failure`,
        pending: `${BASE_URL}/dashboard?payment=pending`,
      },
      notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
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

    const { preference } = getMercadoPago();
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
    const { payment } = getMercadoPago();
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
