const PRODUCTION_APP_URL = "https://www.gnosisai.global";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Normaliza uma URL base da aplicação (APP_URL, VERCEL_URL, etc.).
 * Evita URLs inválidas como `https://http://localhost:3000`.
 */
export function normalizeAppBaseUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return "";

  url = stripTrailingSlash(url);

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (/^localhost/i.test(url) || /^127\.\d+\.\d+\.\d+/i.test(url)) {
    return `http://${url}`;
  }

  return `https://${url}`;
}

/**
 * URL pública base da app para redirects (Stripe, OAuth, etc.).
 */
export function resolveAppBaseUrl(): string {
  const candidates = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_URL,
    process.env.OAUTH_SERVER_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    const normalized = normalizeAppBaseUrl(candidate);
    if (normalized) return normalized;
  }

  return process.env.NODE_ENV === "production"
    ? PRODUCTION_APP_URL
    : "http://localhost:3000";
}

function isLocalOrPrivateUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return true;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (/^192\.168\./.test(hostname) || /^10\./.test(hostname)) return true;
    return false;
  } catch {
    return true;
  }
}

/**
 * Mercado Pago exige back_url/notification_url HTTPS e acessíveis publicamente.
 * Em dev local, usa MP_PUBLIC_URL ou o domínio de produção como fallback.
 */
export function resolveMercadoPagoBaseUrl(): string {
  const explicit = process.env.MP_PUBLIC_URL?.trim();
  if (explicit) {
    return normalizeAppBaseUrl(explicit);
  }

  const appBase = resolveAppBaseUrl();
  if (!isLocalOrPrivateUrl(appBase)) {
    return appBase;
  }

  const fallback = process.env.APP_URL?.trim()
    ? normalizeAppBaseUrl(process.env.APP_URL)
    : PRODUCTION_APP_URL;

  if (!isLocalOrPrivateUrl(fallback)) {
    console.warn(
      `[MercadoPago] back_url local (${appBase}) — usando URL pública: ${fallback}`,
    );
    return fallback;
  }

  console.warn(
    `[MercadoPago] Usando URL pública padrão: ${PRODUCTION_APP_URL}`,
  );
  return PRODUCTION_APP_URL;
}
