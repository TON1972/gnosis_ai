import { handleMercadoPagoWebhookStandard } from "../server/_core/webhookHandler";

export const runtime = 'nodejs';

export async function POST(req: Request) {
    return handleMercadoPagoWebhookStandard(req);
}
