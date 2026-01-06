import { handleMercadoPagoWebhookStandard } from "../../server/_core/webhookHandler";

export const runtime = 'nodejs';

export async function POST(req: Request) {
    // 1. Processa a lógica
    const response = await handleMercadoPagoWebhookStandard(req);

    // 2. Injeta o header que pula o aviso do ngrok
    // Isso permite que o Mercado Pago entregue a notificação
    const newHeaders = new Headers(response.headers);
    newHeaders.set("ngrok-skip-browser-warning", "true");

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}