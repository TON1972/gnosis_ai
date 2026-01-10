import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  pgEnum,
  primaryKey
} from "drizzle-orm/pg-core";

/**
 * Enums para PostgreSQL
 */
export const roleEnum = pgEnum("role", ["user", "admin", "super_admin"]);
export const subStatusEnum = pgEnum("status", ["active", "cancelled", "expired", "grace_period", "blocked"]);
export const billingPeriodEnum = pgEnum("billingPeriod", ["monthly", "yearly"]);
export const transactionTypeEnum = pgEnum("type", ["initial", "daily", "bonus", "usage"]);
export const departmentEnum = pgEnum("department", ["tecnico", "financeiro", "comercial", "outros"]);
export const contactStatusEnum = pgEnum("contact_status", ["pending", "contacted", "resolved"]);
export const senderTypeEnum = pgEnum("senderType", ["admin", "client"]);

/**
 * Users Table
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  supabaseId: varchar("supabaseId", { length: 255 }),
  clerkId: varchar("clerkId", { length: 255 }), // Legacy Clerk ID
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }), // Stripe Customer ID
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Plans Table
 */
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  price: integer("price"), // Legacy / Single Price
  priceMonthly: integer("priceMonthly").notNull(),
  priceYearly: integer("priceYearly").notNull(),
  creditsInitial: integer("creditsInitial").notNull(),
  creditsDaily: integer("creditsDaily").notNull(),
  toolsCount: integer("toolsCount").notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

/**
 * Subscriptions Table
 */
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  planId: integer("planId").notNull(),
  status: subStatusEnum("status").default("active").notNull(),
  billingPeriod: billingPeriodEnum("billingPeriod").default("monthly").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  nextBillingDate: timestamp("nextBillingDate"),
  gracePeriodEndsAt: timestamp("gracePeriodEndsAt"),
  lastPaymentDate: timestamp("lastPaymentDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  cancelledAt: timestamp("cancelledAt"), // Legacy
  mercadoPagoSubscriptionId: varchar("mercadoPagoSubscriptionId", { length: 100 }), // Legacy / Credits
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }), // Stripe Subscription ID
  stripeStatus: varchar("stripeStatus", { length: 50 }), // active, trialing, past_due, etc.
});

/**
 * Credits Table (Main Balance)
 */
export const credits = pgTable("credits", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  amount: integer("amount").notNull().default(0),
  type: varchar("type", { length: 50 }).notNull(),
  isExpired: boolean("isExpired").default(false), // Legacy
  expiresAt: timestamp("expiresAt"),
  creditsInitial: integer("creditsInitial").default(0),
  creditsDaily: integer("creditsDaily").default(0),
  creditsBonus: integer("creditsBonus").default(0),
  lastDailyReset: timestamp("lastDailyReset").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow(),

});


export const savedStudies = pgTable("saved_studies", {
  id: serial("id").primaryKey(),
  // ✅ Usamos "userId" exatamente como no seu SQL (case-sensitive)
  toolId: integer("toolId"), // ✅ Certifique-se que esta linha existe
  userId: integer("userId").notNull(),
  toolName: varchar("toolName", { length: 100 }).notNull(),
  input: text("input").notNull(),
  output: text("output").notNull(),
  // ✅ Novos campos para o novo modelo de cobrança
  wordCount: integer("word_count").default(0),
  creditCost: integer("creditCost").default(50),
  creditCostSnake: integer("credit_cost").default(50), // PRESERVE DATA
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type SavedStudy = typeof savedStudies.$inferSelect;
export type InsertSavedStudy = typeof savedStudies.$inferInsert;

// drizzle/schema.ts (ou shared/schema.ts)
export const studyMessages = pgTable("study_messages", {
  id: serial("id").primaryKey(),
  studyId: integer("study_id").references(() => savedStudies.id, { onDelete: 'cascade' }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  wordCount: integer("word_count").default(0),
  creditCost: integer("credit_cost").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  // Forçamos o Drizzle a usar as aspas para manter o case-sensitive do seu SQL
  userId: integer("userId").notNull(),
  toolId: integer("toolId"),
  amount: integer("amount").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  description: text("description"),
  balanceBefore: integer("balanceBefore"),
  balanceAfter: integer("balanceAfter"),
  toolUsed: text("toolUsed"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;


/**
 * Tools Table
 */
export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("displayName", { length: 150 }).notNull(),
  description: text("description"),
  inputPlaceholder: text("inputPlaceholder"), // ✅ Nova Coluna
  promptTemplate: text("promptTemplate"), // camelCase in DB
  promptTemplateSnake: text("prompt_template"), // PRESERVE DATA
  creditCost: integer("creditCost").default(50),
  category: text("category"),
  categoryId: integer("categoryId").references(() => toolCategories.id), // ✅ A nova coluna
  icon: text("icon"),
  isActive: boolean("isActive").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
});


export type Tool = typeof tools.$inferSelect;
export type InsertTool = typeof tools.$inferInsert;

// ✅ Definição da tabela de categorias
export const toolCategories = pgTable("tool_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

/**
 * Plan-Tool relationship
 */
export const planTools = pgTable("planTools", {
  id: serial("id").primaryKey(),
  planId: integer("planId").notNull(),
  toolId: integer("toolId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// PRESERVE DATA
export const planToolsSnake = pgTable("plan_tools", {
  planId: integer("planId").notNull(),
  toolId: integer("toolId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.planId, t.toolId] }),
}));

/**
 * Chatbot contact requests
 */
export const chatbotContacts = pgTable("chatbot_contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  department: departmentEnum("department").notNull(),
  message: text("message"),
  status: contactStatusEnum("status").default("pending").notNull(),
  assignedTo: integer("assignedTo"),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Ticket messages
 */
export const ticketMessages = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticketId").notNull(),
  senderId: integer("senderId"),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderType: senderTypeEnum("senderType").notNull(),
  message: text("message").notNull(),
  isRead: integer("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * ✅ Definição local da tabela payments (já que não está no seu schema.ts)
 * Isso permite que o Drizzle entenda a tabela que você criou via SQL.
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  subscriptionId: integer("subscriptionId").references(() => subscriptions.id), // ✅ Adicionado
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  mercadoPagoId: varchar("mercadoPagoId", { length: 100 }),
  stripePaymentId: varchar("stripePaymentId", { length: 255 }), // Stripe Payment Intent ID
  externalId: varchar("externalId", { length: 100 }),
  type: varchar("type", { length: 50 }), // 'credit', 'plan_monthly', 'plan_yearly', 'plan_manual'
  creditsAmount: integer("creditsAmount").default(0), // Quantidade de créditos comprados (se aplicável)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});