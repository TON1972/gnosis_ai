import webpush from "web-push";
import { eq, and } from "drizzle-orm";
import {
  pushSubscriptions,
  notificationPreferences,
  users,
} from "../drizzle/schema.js";
import { getDb } from "./db.js";
import { ENV } from "./_core/env.js";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type PushCategory =
  | "subscriptionAlerts"
  | "creditAlerts"
  | "studyAlerts"
  | "ticketAlerts"
  | "marketingAlerts";

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    return false;
  }
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      ENV.vapidSubject,
      ENV.vapidPublicKey,
      ENV.vapidPrivateKey
    );
    vapidConfigured = true;
  }
  return true;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function buildPushBody(content: string, maxLength = 200): string {
  const text = stripHtml(content);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

async function isCategoryEnabled(
  userId: number,
  category?: PushCategory
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const prefs = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (prefs.length === 0) return true;

  const pref = prefs[0];
  if (!pref.pushEnabled) return false;
  if (category && pref[category] === false) return false;

  return true;
}

export async function sendPushToUser(
  userId: number,
  payload: PushPayload,
  category?: PushCategory
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapid()) {
    return { sent: 0, failed: 0 };
  }

  const enabled = await isCategoryEnabled(userId, category);
  if (!enabled) {
    return { sent: 0, failed: 0 };
  }

  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, true)
      )
    );

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
      sent++;
      await db
        .update(pushSubscriptions)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushSubscriptions.id, sub.id));
    } catch (err: unknown) {
      failed++;
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await db
          .update(pushSubscriptions)
          .set({ isActive: false })
          .where(eq(pushSubscriptions.id, sub.id));
      }
      console.warn(`[Push] Failed for user ${userId}:`, err);
    }
  }

  return { sent, failed };
}

export async function sendPushByEmail(
  email: string,
  payload: PushPayload,
  category?: PushCategory
): Promise<{ sent: number; failed: number }> {
  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userRows.length === 0) {
    return { sent: 0, failed: 0 };
  }

  return sendPushToUser(userRows[0].id, payload, category);
}

export const AUTOMATION_PUSH_CATEGORY: Record<string, PushCategory | undefined> =
  {
    subscription_expiring: "subscriptionAlerts",
    low_credits: "creditAlerts",
    inactive_user: "studyAlerts",
    periodic: "marketingAlerts",
    bulk: "marketingAlerts",
    specific_date: "marketingAlerts",
    tool_usage: "studyAlerts",
  };
