import { pgTable, serial, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- TABELA DE USUÁRIOS ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  supabaseId: varchar("supabaseId", { length: 255 }), // Adicionado
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  password: text("password"),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  currentSessionId: varchar("currentSessionId", { length: 255 }), // Session Control
  lastSignedIn: timestamp("lastSignedIn"),
  
  // Affiliate System
  affiliateCode: varchar("affiliateCode", { length: 64 }).unique(),
  isAffiliate: boolean("isAffiliate").default(false),
  commissionPercentage: integer("commissionPercentage").default(0),
  referredBy: integer("referredBy").references(() => users.id),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(), // Adicionado para consistência
});

// --- TABELA DE PLANOS ---
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  description: text("description"),
  price: integer("price").notNull().default(0),
  priceMonthly: integer("priceMonthly").notNull().default(0),
  priceYearly: integer("priceYearly").notNull().default(0),
  creditsInitial: integer("creditsInitial").default(500),
  creditsDaily: integer("creditsDaily").default(50),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
});

// --- TABELA DE FERRAMENTAS ---
export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("displayName", { length: 150 }), // Adicionado para exibir nomes legíveis
  description: text("description"),
  category: text("category"), // Adicionado para os filtros do Dashboard
  icon: text("icon"), // Adicionado para os ícones dinâmicos
  isActive: boolean("isActive").default(true),
  order: integer("order").default(0), // Adicionado para ordenação
  createdAt: timestamp("createdAt").defaultNow(),
});

// --- RELAÇÃO PLANOS X FERRAMENTAS ---
export const planTools = pgTable("plan_tools", {
  id: serial("id").primaryKey(),
  planId: integer("planId").references(() => plans.id).notNull(),
  toolId: integer("toolId").references(() => tools.id).notNull(),
});

// --- TABELA DE ASSINATURAS ---
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull(),
  planId: integer("planId").references(() => plans.id).notNull(),
  status: varchar("status", { length: 20 }).default("active"),
  billingPeriod: varchar("billingPeriod", { length: 20 }).default("monthly"), // Adicionado (Erro 500)
  startDate: timestamp("startDate").defaultNow(), // Adicionado (Erro 500)
  endDate: timestamp("endDate"), // Adicionado (Erro 500)
  nextBillingDate: timestamp("nextBillingDate"), // Adicionado (Erro 500)
  gracePeriodEndsAt: timestamp("gracePeriodEndsAt"), // Adicionado (Erro 500)
  lastPaymentDate: timestamp("lastPaymentDate"), // Adicionado (Erro 500)
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(), // Adicionado (Erro 500)
  mercadoPagoSubscriptionId: varchar("mercadoPagoSubscriptionId", { length: 100 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeStatus: varchar("stripeStatus", { length: 50 }),
});

// --- TABELA DE CRÉDITOS (Ajustada para unificar com user_credits) ---
export const credits = pgTable("credits", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull().unique(),
  amount: integer("amount").notNull(), // Total (2000)
  type: varchar("type", { length: 50 }).notNull(),
  expiresAt: timestamp("expiresAt"), // ✅ Resolvido erro TS(2339)
  isExpired: boolean("isExpired").default(false), // ✅ Resolvido erro TS(2339)

  // Colunas de lógica diária migradas para cá
  creditsInitial: integer("creditsInitial").default(0),
  creditsDaily: integer("creditsDaily").default(0),
  creditsBonus: integer("creditsBonus").default(0),
  lastDailyReset: timestamp("lastDailyReset").defaultNow(),

  createdAt: timestamp("createdAt").defaultNow(),
});

// --- TABELA DE CONTROLE DE CRÉDITOS (user_credits) ---
export const userCredits = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  creditsInitial: integer("creditsInitial").default(500),
  creditsDaily: integer("creditsDaily").default(50),
  creditsBonus: integer("creditsBonus").default(0),
  creditsInitialExpiry: timestamp("creditsInitialExpiry"),
  lastDailyReset: timestamp("lastDailyReset").defaultNow(),
});

// --- LOG DE TRANSAÇÕES ---
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  amount: integer("amount").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  toolUsed: varchar("toolUsed", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- TABELA DE ESTUDOS SALVOS ---
export const savedStudies = pgTable("saved_studies", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  toolName: varchar("toolName", { length: 100 }).notNull(),
  input: text("input").notNull(),
  output: text("output").notNull(),
  creditCost: integer("creditCost").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- EMAIL MARKETING LOGS ---
export const sentEmails = pgTable("sent_emails", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  audienceSize: integer("audienceSize").notNull(),
  targetPlans: text("targetPlans"), // Comma separated or JSON string of plans
  targetRoles: text("targetRoles"), // Comma separated or JSON string of roles
  targetSubscriptions: text("targetSubscriptions"), // active, inactive, etc.
  targetEmails: text("targetEmails"), // Comma separated specific emails
  status: varchar("status", { length: 50 }).default("sent"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  sentBy: integer("sentBy").references(() => users.id),
});

// --- TABELA DE PAGAMENTOS DE AFILIADOS ---
export const affiliatePayouts = pgTable("affiliate_payouts", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliateId").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, completed, failed
  paymentMethod: text("paymentMethod"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// --- TABELA DE COMISSÕES DE AFILIADOS ---
export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliateId").references(() => users.id).notNull(),
  referredUserId: integer("referredUserId").references(() => users.id).notNull(),
  subscriptionId: integer("subscriptionId").references(() => subscriptions.id).notNull(),
  amount: integer("amount").notNull(), // Em centavos
  status: varchar("status", { length: 20 }).default("pending"), // pending, paid, cancelled
  payoutId: integer("payoutId").references(() => affiliatePayouts.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// --- RELAÇÕES DE AFILIADOS ---
export const affiliateCommissionsRelations = relations(affiliateCommissions, ({ one }) => ({
  affiliate: one(users, {
    fields: [affiliateCommissions.affiliateId],
    references: [users.id],
    relationName: "affiliate",
  }),
  referredUser: one(users, {
    fields: [affiliateCommissions.referredUserId],
    references: [users.id],
    relationName: "referredUser",
  }),
  subscription: one(subscriptions, {
    fields: [affiliateCommissions.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const affiliatePayoutsRelations = relations(affiliatePayouts, ({ one }) => ({
  affiliate: one(users, {
    fields: [affiliatePayouts.affiliateId],
    references: [users.id],
  }),
}));

// --- TABELA DE CUPONS ---
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountDays: integer("discountDays").notNull().default(30),
  isActive: boolean("isActive").default(true).notNull(),
  expirationDate: timestamp("expirationDate"),
  // --- Novos campos: Gerenciamento Avançado ---
  allowedToolIds: text("allowedToolIds"), // JSON array de IDs, ex: "[1,5,12]"
  bonusCredits: integer("bonusCredits").default(0), // Créditos bônus concedidos
  grantPlanId: integer("grantPlanId"), // Plano concedido (null = customizado)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// --- TABELA DE USO DE CUPONS ---
export const couponUsages = pgTable("coupon_usages", {
  id: serial("id").primaryKey(),
  couponId: integer("couponId").references(() => coupons.id).notNull(),
  userId: integer("userId").references(() => users.id).notNull(),
  usedAt: timestamp("usedAt").defaultNow().notNull(),
  // --- Novos campos: Controle de expiração por uso ---
  expiresAt: timestamp("expiresAt"), // Data em que as regras do cupom expiram
  isExpired: boolean("isExpired").default(false), // Flag de expirado
});