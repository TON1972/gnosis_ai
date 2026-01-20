import axios from 'axios';
import crypto from 'crypto';

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN;

interface MetaEventData {
    eventName: string;
    eventTime?: number;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbc?: string;
    fbp?: string;
    currency?: string;
    value?: number;
    orderId?: string;
}

/**
 * Hash data using SHA-256 for Meta CAPI
 */
function hashData(data: string | undefined): string | undefined {
    if (!data) return undefined;
    return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

/**
 * Send event to Meta Conversions API
 */
export async function sendMetaEvent(data: MetaEventData) {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
        console.warn('Meta Pixel ID or Access Token not configured.');
        return;
    }

    const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;

    const userData: any = {
        em: hashData(data.email),
        ph: hashData(data.phone),
        fn: hashData(data.firstName),
        ln: hashData(data.lastName),
        client_ip_address: data.clientIpAddress,
        client_user_agent: data.clientUserAgent,
        fbc: data.fbc,
        fbp: data.fbp,
    };

    // Remove undefined keys
    Object.keys(userData).forEach(key => userData[key] === undefined && delete userData[key]);

    const event: any = {
        event_name: data.eventName,
        event_time: data.eventTime || Math.floor(Date.now() / 1000),
        user_data: userData,
        event_source_url: process.env.NEXTAUTH_URL || 'https://gnosis-ai-platform.vercel.app',
        action_source: 'website',
    };

    if (data.currency && data.value) {
        event.custom_data = {
            currency: data.currency,
            value: data.value,
            order_id: data.orderId,
        };
    }

    try {
        const response = await axios.post(url, {
            data: [event],
        }, {
            params: { access_token: ACCESS_TOKEN },
        });
        console.log(`Meta CAPI event '${data.eventName}' sent successfully:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error sending Meta CAPI event '${data.eventName}':`, error.response?.data || error.message);
    }
}
