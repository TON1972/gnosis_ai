import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
import { getAllPlans, getToolsForPlan, getAllTools } from "./db.js";
import { sortPlansByDisplayOrder, NEW_USER_TRIAL_DAYS } from "../shared/planConstants.js";
// Gnosis.log removido - usando OAuth apenas
import {
  savedStudies,
  users,
  creditTransactions,
  chatbotContacts,
  ticketMessages,
  tools,      // ✅ Adicionado
  planTools,   // ✅ Adicionado
  planToolsSnake, // ✅ Adicionado para corrigir vinculação de planos
  toolCategories,
  studyMessages,
  plans,
  payments,
  credits,
  subscriptions,
  dashboardSettings,
} from "../drizzle/schema.js";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getDb } from "./db.js";
import { eq, desc, sql, and, lt, gte, or, asc } from "drizzle-orm";
import { getUserCredits, useCredits, getUserActivePlan } from "./credits.js";
import { getBasicMigrationStatus } from "./basicMigration.js";
import { checkSubscriptionStatus, markSubscriptionPaid } from "./subscriptionStatus.js";
import { getUserStats, getFinancialCalendar, getDelinquentUsers, getUsersByPlan, getToolUsageStats } from "./admin.js";
import { getStripeFinancialData } from "./stripeFinancial.js";
import { listUsers, deleteUser, getUserDetails } from "./userManagement.js";
import { createSubscriptionCheckout, createCreditsCheckout, createManualPaymentCheckout } from "./mercadopago.js";
import { createStripeCheckout, createPortalSession } from "./stripe.js";
import { invokeLLM } from "./_core/llm.js";
import { notifyOwner } from "./_core/notification.js";
import {
  marketingEmailSchema, audienceFilterSchema, getTargetAudience,
  sendMarketingEmail, getSentEmailsList, marketingGroupSchema,
  createMarketingGroup, getMarketingGroups, deleteMarketingGroup
} from "./marketing.js";
import {
  createAutomation, updateAutomation, deleteAutomation, listAutomations,
  automationSchema, getAutomationStats
} from "./automation.js";
import { affiliateRouter } from "./affiliate.js";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getPlanPriceQuote } from "../shared/planPricing.js";
//import {  userCredits } from "@shared/schema";

// Helper para garantir conexão com DB
async function getValidatedDb() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  return db;
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});

function calculateDynamicCost(text: string): { words: number; cost: number } {
  // Remove espaços extras e conta palavras
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;

  let cost = 50; // Valor base inicial

  if (words <= 500) cost = 50;
  else if (words <= 750) cost = 90;
  else if (words <= 1000) cost = 115;
  else if (words <= 1250) cost = 150;
  else if (words <= 1500) cost = 190;
  else if (words <= 1800) cost = 220;
  else if (words <= 2100) cost = 260;
  else if (words <= 2400) cost = 300;
  else if (words <= 2700) cost = 335;
  else if (words <= 3000) cost = 375;
  else if (words <= 3400) cost = 425;
  else if (words <= 3800) cost = 480;
  else if (words <= 4200) cost = 525;
  else if (words <= 5000) cost = 625;
  else cost = 625; // Teto máximo conforme sua tabela

  return { words, cost };
}

export const appRouter = router({
  system: systemRouter,
  affiliate: affiliateRouter,


  settings: router({
    getDashboardConfig: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return null;
      const config = await db.select().from(dashboardSettings).where(eq(dashboardSettings.id, 1)).limit(1);
      return config[0] || { videoUrl: "", videoTitle: "", showVideo: false };
    }),

    updateDashboardConfig: protectedProcedure
      .input(z.object({
        videoUrl: z.string(),
        videoTitle: z.string(),
        showVideo: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error("Acesso negado");
        }

        const db = await getValidatedDb();

        // Upsert logic using standard SQL if onConflictDoUpdate is tricky with type inference here,
        // but Drizzle standard is cleaner. Let's try simple check-and-update or insert.
        const existing = await db.select().from(dashboardSettings).where(eq(dashboardSettings.id, 1)).limit(1);

        if (existing.length > 0) {
          await db.update(dashboardSettings)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(dashboardSettings.id, 1));
        } else {
          await db.insert(dashboardSettings).values({
            id: 1,
            ...input,
            updatedAt: new Date()
          });
        }

        return { success: true };
      }),
  }),

  auth: router({
    /**
     * ✅ CORREÇÃO: Busca o usuário completo no banco para incluir o NOME
     */
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) return null;

      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      // ✅ Validação de contagem diária no login
      await getUserCredits(ctx.user.id);

      return result[0] || null;
    }),

    // logout: publicProcedure.mutation(async ({ ctx }) => {
    //   await new Promise<void>((resolve, reject) => {
    //     ctx.req.logout((err) => {
    //       if (err) {
    //         reject(err)
    //       } else {
    //         resolve();
    //       }
    //     });
    //   });

    //   return {
    //     success: true,
    //   } as const;
    // }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      // Em vez de ctx.req.logout(), limpamos o cookie manualmente
      ctx.resHeaders.append(
        "Set-Cookie",
        `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
      );

      return {
        success: true,
      } as const;
    }),
    /**
     * Refresh user session data from database
     */
    refreshSession: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const freshUser = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (freshUser.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      // ✅ Validação de contagem diária no refresh
      await getUserCredits(ctx.user.id);

      return freshUser[0];
    }),
  }),

  plans: router({
    list: publicProcedure.query(async () => {
      try {
        const db = await getDb();
        if (!db) return [];

        // 1. Busca os planos
        const plansData = await db.select().from(plans);

        // 2. Busca apenas as colunas existentes na tabela de junção
        // Removido o "id" que causava o erro
        const allRelations = await db.select({
          planId: planToolsSnake.planId,
          toolId: planToolsSnake.toolId
        }).from(planToolsSnake);

        // 3. Mescla os dados convertendo IDs para String para comparação segura
        return sortPlansByDisplayOrder(
          plansData.map(plan => ({
            ...plan,
            toolIds: allRelations
              .filter(rel => String(rel.planId) === String(plan.id))
              .map(rel => String(rel.toolId))
          }))
        );
      } catch (error) {
        console.error("Erro ao listar planos:", error);
        return [];
      }
    }),

    getTools: publicProcedure
      .input(z.object({ planId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db
          .select({
            id: tools.id,
            name: tools.name,
            displayName: tools.displayName,
            displayNameEn: tools.displayNameEn,
            displayNameEs: tools.displayNameEs,
            category: tools.category,
            icon: tools.icon
          })
          .from(tools)
          .innerJoin(planToolsSnake, eq(planToolsSnake.toolId, tools.id))
          .where(eq(planToolsSnake.planId, input.planId));
      }),
  }),

  tools: router({
    /**
     * Retorna a lista completa com categorias do banco
     */
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select({
          id: tools.id,
          name: tools.name,
          displayName: tools.displayName,
          description: tools.description,
          inputPlaceholder: tools.inputPlaceholder,
          promptTemplate: tools.promptTemplate,
          creditCost: tools.creditCost,
          // ✅ Retornamos o nome da categoria vindo da tabela relacionada
          category: toolCategories.name,
          // Mantemos o categoryId se precisar
          categoryId: tools.categoryId,
          // ✅ English fields
          nameEn: tools.nameEn,
          displayNameEn: tools.displayNameEn,
          descriptionEn: tools.descriptionEn,
          inputPlaceholderEn: tools.inputPlaceholderEn,
          promptTemplateEn: tools.promptTemplateEn,
          categoryEn: toolCategories.nameEn,

          // ✅ Spanish fields
          nameEs: tools.nameEs,
          displayNameEs: tools.displayNameEs,
          descriptionEs: tools.descriptionEs,
          inputPlaceholderEs: tools.inputPlaceholderEs,
          promptTemplateEs: tools.promptTemplateEs,
          categoryEs: toolCategories.nameEs,

          icon: tools.icon,
          isActive: tools.isActive,
          order: tools.order,
          createdAt: tools.createdAt,
        })
        .from(tools)
        .leftJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
        .where(eq(tools.isActive, true))
        .orderBy(tools.id);
    }),

    // server/routers.ts
    // server/routers.ts

    generate: protectedProcedure
      .input(z.object({
        toolId: z.string(),
        input: z.string(),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string()
        })).optional(),
        language: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import("./_core/llm.js");
        const db = await getValidatedDb();

        const toolRecord = await db
          .select({ 
            promptTemplate: tools.promptTemplate,
            promptTemplateEn: tools.promptTemplateEn,
            promptTemplateEs: tools.promptTemplateEs
          })
          .from(tools)
          .where(
            or(
              eq(tools.name, input.toolId),
              isNaN(Number(input.toolId)) ? undefined : eq(tools.id, Number(input.toolId))
            )
          )
          .limit(1);

        let systemPrompt = toolRecord[0]?.promptTemplate || "Você é um assistente de estudos bíblicos altamente qualificado.";
        
        // Use translated prompt template if available
        if (input.language?.startsWith('en') && toolRecord[0]?.promptTemplateEn) {
          systemPrompt = toolRecord[0].promptTemplateEn;
        } else if (input.language?.startsWith('es') && toolRecord[0]?.promptTemplateEs) {
          systemPrompt = toolRecord[0].promptTemplateEs;
        }

        // Force language constraint
        let langInstruction = "IMPORTANTE: Responda OBRIGATORIAMENTE em Português do Brasil.";
        if (input.language?.startsWith('en')) {
          langInstruction = "IMPORTANT: You MUST respond strictly in English.";
        } else if (input.language?.startsWith('es')) {
          langInstruction = "IMPORTANTE: Debes responder ESTRICTAMENTE en Español.";
        }

        systemPrompt += `\n\n${langInstruction}`;

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...(input.history || []).map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content
          })),
          { role: "user" as const, content: input.input }
        ];

        const response = await invokeLLM({ messages });
        const rawContent = response.choices[0]?.message?.content;

        let finalContent = "";
        if (typeof rawContent === "string") {
          finalContent = rawContent;
        } else if (Array.isArray(rawContent)) {
          finalContent = rawContent.map((part) => ("text" in part ? part.text : "")).join("\n");
        }

        // ✅ NOVO: Cálculo dinâmico baseado no resultado da IA
        const { words, cost } = calculateDynamicCost(finalContent);

        return {
          content: finalContent || "Erro ao gerar conteúdo.",
          wordCount: words,   // Envia para o frontend exibir
          creditCost: cost    // Envia para o frontend salvar
        };
      }),
  }),

  studies: router({
    // server/routers.ts

    save: protectedProcedure
      .input(z.object({
        toolId: z.number(),
        toolName: z.string(),
        input: z.string(),
        output: z.string(),
        creditCost: z.number(),
        wordCount: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getValidatedDb();

        // 1. Grava o estudo e ARMAZENA na variável 'result'
        const result = await db.insert(savedStudies).values({
          userId: ctx.user.id,
          toolId: input.toolId,
          toolName: input.toolName,
          input: input.input,
          output: input.output,
          creditCost: input.creditCost,
          wordCount: input.wordCount,
        } as any).returning({ insertedId: savedStudies.id }); // ✅ Agora 'result' existe

        // 2. Debita o saldo
        await useCredits(ctx.user.id, input.creditCost, input.toolName, input.toolId);

        // 3. Cleanup (Mantém 100)
        const thresholdStudy = await db
          .select({ id: savedStudies.id })
          .from(savedStudies)
          .where(eq(savedStudies.userId, ctx.user.id))
          .orderBy(desc(savedStudies.createdAt))
          .offset(100)
          .limit(1);

        if (thresholdStudy.length > 0) {
          await db.delete(savedStudies)
            .where(and(eq(savedStudies.userId, ctx.user.id), lt(savedStudies.id, thresholdStudy[0].id)));
        }

        // ✅ Agora o result[0] vai funcionar perfeitamente
        return {
          success: true,
          id: result[0]?.insertedId
        };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(savedStudies)
        .where(eq(savedStudies.userId, ctx.user.id))
        .orderBy(desc(savedStudies.createdAt));
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Adicionada checagem de userId para evitar que um usuário delete o estudo de outro via API
        await db
          .delete(savedStudies)
          .where(
            and(
              eq(savedStudies.id, input.id),
              eq(savedStudies.userId, ctx.user.id)
            )
          );

        return { success: true };
      }),

    // ✅ ADICIONE ESTE PROCEDIMENTO
    getWithMessages: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getValidatedDb();

        // 1. Procura o estudo principal
        const [study] = await db
          .select()
          .from(savedStudies)
          .where(
            and(
              eq(savedStudies.id, input.id),
              eq(savedStudies.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!study) throw new Error("Estudo não encontrado");

        // 2. BUSCA AS MENSAGENS (Aqui é onde o carregamento falha geralmente)
        const messages = await db
          .select()
          .from(studyMessages) // Certifica-te que este nome de tabela está correto no schema
          .where(eq(studyMessages.studyId, input.id))
          .orderBy(asc(studyMessages.createdAt));

        // O retorno PRECISA ter esta estrutura para o frontend funcionar
        return {
          study,
          messages: messages || []
        };
      }),

    // Mantenha o addMessage que criamos anteriormente
    addMessage: protectedProcedure
      .input(z.object({
        studyId: z.number(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        wordCount: z.number(),
        creditCost: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getValidatedDb(); //

        await db.insert(studyMessages).values({
          studyId: input.studyId,
          role: input.role,
          content: input.content,
          wordCount: input.wordCount,
          creditCost: input.creditCost,
        });

        if (input.role === "assistant" && input.creditCost > 0) {
          await useCredits(ctx.user.id, input.creditCost, "Continuidade de Estudo", 0);
        }

        return { success: true };
      }),
  }),

  credits: router({
    balance: protectedProcedure.query(async ({ ctx }) => {
      return await getUserCredits(ctx.user.id);
    }),

    activePlan: protectedProcedure.query(async ({ ctx }) => {
      return await getUserActivePlan(ctx.user.id);
    }),

    basicMigrationStatus: protectedProcedure.query(async ({ ctx }) => {
      return await getBasicMigrationStatus(ctx.user.id);
    }),

    use: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        toolName: z.string(),
        toolId: z.number().optional().nullable(), // ✅ Capturando o ID
      }))
      .mutation(async ({ ctx, input }) => {
        // ✅ CORREÇÃO: Passando o toolId para a função que processa o banco
        return await useCredits(
          ctx.user.id,
          input.amount,
          input.toolName,
          input.toolId ?? undefined // Passa o ID se existir
        );
      }),

    usageHistory: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(
          and(
            eq(creditTransactions.userId, ctx.user.id),
            // ✅ CORREÇÃO: Deve bater com o tipo salvo em useCredits (geralmente 'spend' ou 'usage')
            // Se você usa 'spend' no useCredits, use 'spend' aqui.
            or(
              eq(creditTransactions.type, 'usage'),
              eq(creditTransactions.type, 'spend')
            ),
            gte(creditTransactions.createdAt, thirtyDaysAgo)
          )
        )
        .orderBy(desc(creditTransactions.createdAt)); // Ordenar do mais novo para o mais antigo

      const dailyUsage = new Map<string, number>();

      transactions.forEach(tx => {
        const date = (tx.createdAt as Date).toISOString().split('T')[0];
        const current = dailyUsage.get(date) || 0;
        dailyUsage.set(date, current + Math.abs(tx.amount));
      });

      const result = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          usage: dailyUsage.get(dateStr) || 0,
        });
      }

      return result;
    }),

    paymentHistory: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(payments)
        .where(eq(payments.userId, ctx.user.id))
        .orderBy(desc(payments.createdAt));
    }),
  }),

  admin: router({
    userStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
      }
      return await getUserStats();
    }),

    usersByPlan: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
      }
      return await getUsersByPlan();
    }),

    financialCalendar: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
      }
      return await getFinancialCalendar();
    }),

    stripeFinancialData: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
      }
      return await getStripeFinancialData();
    }),

    listUsers: protectedProcedure
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        planFilter: z.string().optional(),
        sortBy: z.enum(['newest', 'oldest', 'credits_asc', 'credits_desc']).default('newest'),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        couponFilter: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        // Convert date strings to Date objects
        const dateFrom = input.dateFrom ? new Date(input.dateFrom) : undefined;
        const dateTo = input.dateTo ? new Date(input.dateTo) : undefined;

        return await listUsers(
          input.page,
          input.limit,
          input.search,
          input.planFilter,
          input.sortBy,
          dateFrom,
          dateTo,
          input.couponFilter
        );
      }),

    exportUsers: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        planFilter: z.string().optional(),
        sortBy: z.enum(['newest', 'oldest', 'credits_asc', 'credits_desc']).default('newest'),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        couponFilter: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        // Convert date strings to Date objects
        const dateFrom = input.dateFrom ? new Date(input.dateFrom) : undefined;
        const dateTo = input.dateTo ? new Date(input.dateTo) : undefined;

        const { listAllUsersForExport } = await import('./userManagement.js');
        return await listAllUsersForExport(
          input.search,
          input.planFilter,
          input.sortBy,
          dateFrom,
          dateTo,
          input.couponFilter
        );
      }),

    getUserDetails: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }
        return await getUserDetails(input.userId);
      }),

    deleteUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }
        return await deleteUser(input.userId);
      }),

    // No seu appRouter dentro de admin:
    delinquentUsers: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          days: z.number().optional(), // Mantemos para compatibilidade
        }).optional() // Torna o objeto inteiro opcional
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        // Lógica para converter as strings em objetos Date
        const startDate = input?.startDate ? new Date(input.startDate) : undefined;
        const endDate = input?.endDate ? new Date(input.endDate) : new Date();

        // Se o usuário enviou 'days' em vez de datas específicas
        if (input?.days && !input.startDate) {
          const start = new Date();
          start.setDate(start.getDate() - input.days);
          return await getDelinquentUsers(start, endDate);
        }

        return await getDelinquentUsers(startDate, endDate);
      }),

    toolUsageStats: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        const startDate = input?.startDate ? new Date(input.startDate) : undefined;
        const endDate = input?.endDate ? new Date(input.endDate) : undefined;

        return await getToolUsageStats(startDate, endDate);
      }),

    deleteSupportRequest: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Deleta mensagens relacionadas primeiro (se houver constraints)
        // Se o banco tiver ON DELETE CASCADE, isso não seria estritamente necessário, 
        // mas é boa prática garantir na aplicação também.
        await db
          .delete(ticketMessages)
          .where(eq(ticketMessages.ticketId, input.id));

        await db
          .delete(chatbotContacts)
          .where(eq(chatbotContacts.id, input.id));

        return { success: true };
      }),

    supportRequests: protectedProcedure
      .input(z.object({
        status: z.enum(['pending', 'contacted', 'resolved', 'all']).optional(),
        department: z.enum(['tecnico', 'financeiro', 'comercial', 'outros', 'all']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        const db = await getDb();
        if (!db) return [];

        const conditions = [];
        if (input.status && input.status !== 'all') {
          conditions.push(eq(chatbotContacts.status, input.status));
        }
        if (input.department && input.department !== 'all') {
          conditions.push(eq(chatbotContacts.department, input.department));
        }

        if (ctx.user.role === 'admin') {
          conditions.push(eq(chatbotContacts.assignedTo, ctx.user.id));
        }

        let requests;
        if (conditions.length > 0) {
          requests = await db
            .select()
            .from(chatbotContacts)
            .where(and(...conditions))
            .orderBy(desc(chatbotContacts.createdAt));
        } else {
          requests = await db
            .select()
            .from(chatbotContacts)
            .orderBy(desc(chatbotContacts.createdAt));
        }

        return requests;
      }),

    updateSupportStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'contacted', 'resolved']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db
          .update(chatbotContacts)
          .set({ status: input.status })
          .where(eq(chatbotContacts.id, input.id));

        return { success: true };
      }),

    assignSupportRequest: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        adminId: z.number().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db
          .update(chatbotContacts)
          .set({ assignedTo: input.adminId })
          .where(eq(chatbotContacts.id, input.requestId));

        if (input.adminId) {
          const assignedAdmin = await db
            .select()
            .from(users)
            .where(eq(users.id, input.adminId))
            .limit(1);

          if (assignedAdmin.length > 0) {
            const request = await db
              .select()
              .from(chatbotContacts)
              .where(eq(chatbotContacts.id, input.requestId))
              .limit(1);

            if (request.length > 0) {
              await notifyOwner({
                title: '📩 Solicitação de Suporte Atribuída',
                content: `**Admin:** ${assignedAdmin[0].name}\n**Solicitação:** ${request[0].name} (${request[0].email})\n**Departamento:** ${request[0].department}`,
              });
            }
          }
        }

        return { success: true };
      }),

    listAdminsForAssignment: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
      }

      const db = await getDb();
      if (!db) return [];

      const admins = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(sql`${users.role} IN ('admin', 'super_admin')`);

      return admins;
    }),

    getTicketMessages: protectedProcedure
      .input(z.object({ ticketId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        const db = await getDb();
        if (!db) return [];

        const messages = await db
          .select()
          .from(ticketMessages)
          .where(eq(ticketMessages.ticketId, input.ticketId))
          .orderBy(ticketMessages.createdAt);

        return messages;
      }),

    sendTicketMessage: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        message: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db.insert(ticketMessages).values({
          ticketId: input.ticketId,
          senderId: ctx.user.id,
          senderName: ctx.user.name || 'Admin',
          senderType: 'admin',
          message: input.message,
          isRead: 0,
        });

        const ticket = await db
          .select()
          .from(chatbotContacts)
          .where(eq(chatbotContacts.id, input.ticketId))
          .limit(1);

        if (ticket.length > 0) {
          const { sendTicketEmail } = await import('./ticketEmail');
          await sendTicketEmail({
            clientEmail: ticket[0].email,
            clientName: ticket[0].name,
            ticketId: input.ticketId,
            adminName: ctx.user.name || 'Equipe GNOSIS AI',
            message: input.message,
          });
        }

        return { success: true };
      }),

    getUnreadCounts: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
      }

      const db = await getDb();
      if (!db) return [];

      const unreadCounts = await db
        .select({
          ticketId: ticketMessages.ticketId,
          count: sql<number>`COUNT(*)`
        })
        .from(ticketMessages)
        .where(and(
          eq(ticketMessages.senderType, 'client'),
          eq(ticketMessages.isRead, 0)
        ))
        .groupBy(ticketMessages.ticketId);

      return unreadCounts;
    }),

    // ✅ NOVO: Atualizar Planos
    updatePlan: protectedProcedure
      .input(z.object({
        planId: z.number(),
        creditsDaily: z.number().nonnegative(),
        creditsInitial: z.number().nonnegative(),
        priceMonthly: z.number().nonnegative().optional(),
        priceYearly: z.number().nonnegative().optional(),
        nameEn: z.string().optional(),
        displayNameEn: z.string().optional(),
        descriptionEn: z.string().optional(),
        nameEs: z.string().optional(),
        displayNameEs: z.string().optional(),
        descriptionEs: z.string().optional(),
        priceUsd: z.number().nonnegative().optional(),
        priceMonthlyUsd: z.number().nonnegative().optional(),
        priceYearlyUsd: z.number().nonnegative().optional(),
        priceEur: z.number().nonnegative().optional(),
        priceMonthlyEur: z.number().nonnegative().optional(),
        priceYearlyEur: z.number().nonnegative().optional(),
        syncUsers: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // 1. Atualiza o PLANO
        await db
          .update(plans)
          .set({
            creditsDaily: input.creditsDaily,
            creditsInitial: input.creditsInitial,
            ...(input.priceMonthly !== undefined ? { priceMonthly: Math.round(input.priceMonthly * 100) } : {}),
            ...(input.priceYearly !== undefined ? { priceYearly: Math.round(input.priceYearly * 100) } : {}),
            ...(input.nameEn !== undefined ? { nameEn: input.nameEn } : {}),
            ...(input.displayNameEn !== undefined ? { displayNameEn: input.displayNameEn } : {}),
            ...(input.descriptionEn !== undefined ? { descriptionEn: input.descriptionEn } : {}),
            ...(input.nameEs !== undefined ? { nameEs: input.nameEs } : {}),
            ...(input.displayNameEs !== undefined ? { displayNameEs: input.displayNameEs } : {}),
            ...(input.descriptionEs !== undefined ? { descriptionEs: input.descriptionEs } : {}),
            ...(input.priceUsd !== undefined ? { priceUsd: Math.round(input.priceUsd * 100) } : {}),
            ...(input.priceMonthlyUsd !== undefined ? { priceMonthlyUsd: Math.round(input.priceMonthlyUsd * 100) } : {}),
            ...(input.priceYearlyUsd !== undefined ? { priceYearlyUsd: Math.round(input.priceYearlyUsd * 100) } : {}),
            ...(input.priceEur !== undefined ? { priceEur: Math.round(input.priceEur * 100) } : {}),
            ...(input.priceMonthlyEur !== undefined ? { priceMonthlyEur: Math.round(input.priceMonthlyEur * 100) } : {}),
            ...(input.priceYearlyEur !== undefined ? { priceYearlyEur: Math.round(input.priceYearlyEur * 100) } : {}),
          })
          .where(eq(plans.id, input.planId));

        // 2. Se solicitado, sincroniza usários ATIVOS naquele plano
        if (input.syncUsers) {
          // Busca usuários com assinatura ativa deste plano
          const activeSubs = await db
            .select({ userId: subscriptions.userId })
            .from(subscriptions)
            .where(and(
              eq(subscriptions.planId, input.planId),
              eq(subscriptions.status, 'active')
            ));

          const userIds = activeSubs.map(s => s.userId);

          if (userIds.length > 0) {
            // Atualiza os créditos desses usuários
            // CUIDADO: Isso reseta o saldo mensal para o novo valor do plano
            // Mas preserva o bônus, pois somamos (novoDaily + novoInitial + bonusAtual)
            // Porém, o SQL update direto não consegue ler o 'bonus' individualmente fácil num batch update simples
            // sem um join complexo ou subquery.

            // Abordagem segura: Loop (se forem muitos usuários, pode ser lento, mas é seguro para calcular total)
            // OU usar SQL raw para update em massa performático.

            // Vamos usar SQL Raw para update em massa e recálculo
            await db.execute(sql`
              UPDATE credits
              SET 
                "creditsDaily" = ${input.creditsDaily},
                "creditsInitial" = ${input.creditsInitial},
                "amount" = ${input.creditsDaily} + ${input.creditsInitial} + "creditsBonus"
              WHERE "userId" IN ${userIds}
            `);
          }
        }

        return { success: true };
      }),

    sendClientTicketMessage: publicProcedure
      .input(z.object({
        ticketId: z.number(),
        message: z.string().min(1),
        clientName: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db.insert(ticketMessages).values({
          ticketId: input.ticketId,
          senderId: 0,
          senderName: input.clientName,
          senderType: 'client',
          message: input.message,
          isRead: 0,
        });

        return { success: true };
      }),

    markTicketAsRead: protectedProcedure
      .input(z.object({ ticketId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db
          .update(ticketMessages)
          .set({ isRead: 1 })
          .where(and(
            eq(ticketMessages.ticketId, input.ticketId),
            eq(ticketMessages.senderType, 'client')
          ));

        return { success: true };
      }),

    archiveTicket: protectedProcedure
      .input(z.object({ ticketId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db
          .update(chatbotContacts)
          .set({ archived: true })
          .where(eq(chatbotContacts.id, input.ticketId));

        return { success: true };
      }),

    unarchiveTicket: protectedProcedure
      .input(z.object({ ticketId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new Error('Acesso negado');
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db
          .update(chatbotContacts)
          .set({ archived: false })
          .where(eq(chatbotContacts.id, input.ticketId));

        return { success: true };
      }),

    listAdmins: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'super_admin') {
        throw new Error('Apenas Super Administradores podem listar administradores');
      }
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(sql`${users.role} IN ('admin', 'super_admin')`);
    }),

    addAdmin: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        role: z.enum(['admin', 'super_admin']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new Error('Apenas Super Administradores podem adicionar administradores');
        }
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (user.length === 0) {
          throw new Error('Usuário não encontrado com este email');
        }

        await db
          .update(users)
          .set({ role: input.role })
          .where(eq(users.id, user[0].id));

        return { success: true };
      }),

    removeAdmin: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new Error('Apenas Super Administradores podem remover administradores');
        }
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const targetUser = await db
          .select()
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1);

        if (targetUser.length > 0 && targetUser[0].role === 'super_admin') {
          throw new Error('Não é possível remover Super Administradores');
        }

        await db
          .update(users)
          .set({ role: 'user' })
          .where(eq(users.id, input.userId));

        return { success: true };
      }),

    /**
     * ✅ ALTERAR PLANO DO USUÁRIO (SUPER ADMIN)
     */
    updateUserPlan: protectedProcedure
      .input(z.object({
        userId: z.number(),
        planId: z.number(),
        billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new Error('Apenas Super Administradores podem realizar essa ação.');
        }

        const db = await getValidatedDb();

        const [targetPlan] = await db.select().from(plans).where(eq(plans.id, input.planId));
        if (!targetPlan) throw new Error('Plano não encontrado.');

        // 1. Atualizar ou Criar Assinatura
        const existingSub = await db.select().from(subscriptions).where(eq(subscriptions.userId, input.userId)).limit(1);

        const startDate = new Date();
        const endDate = new Date();
        if (input.billingPeriod === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        if (existingSub.length > 0) {
          await db.update(subscriptions)
            .set({
              planId: input.planId,
              status: 'active',
              billingPeriod: input.billingPeriod,
              updatedAt: new Date(),
              startDate: startDate,
              endDate: endDate,
              // Mantemos o stripeSubscriptionId se existir, ou limpamos se for migração manual pura?
              // Melhor não limpar para não quebrar webhook se tiver, mas aqui é manual override.
            })
            .where(eq(subscriptions.userId, input.userId));
        } else {
          await db.insert(subscriptions).values({
            userId: input.userId,
            planId: input.planId,
            status: 'active',
            billingPeriod: input.billingPeriod,
            startDate: startDate,
            endDate: endDate,
          } as any);
        }

        // 2. Atualizar Créditos (Resetar para os limites do novo plano)
        // ATENÇÃO: Isso reseta o saldo do usuário para o padrão do plano.

        // Calcular base credits em JS para evitar erro de parâmetros na query
        const baseCredits = targetPlan.creditsInitial + targetPlan.creditsDaily;

        // Correção do amount usando SQL para somar com bonus existente corretamente
        await db.execute(sql`
          UPDATE credits 
          SET 
            "creditsInitial" = ${targetPlan.creditsInitial},
            "creditsDaily" = ${targetPlan.creditsDaily},
            "expiresAt" = ${endDate},
            "amount" = ${baseCredits} + COALESCE("creditsBonus", 0)
          WHERE "userId" = ${input.userId}
        `);

        return { success: true, planName: targetPlan.displayName };
      }),

    // ✅ 1. Listagem completa para a tabela (com o JOIN para a categoria)
    listAllTools: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
      const db = await getDb();
      if (!db) throw new Error("Falha ao conectar com o banco de dados");

      return await db.select({
        id: tools.id,
        displayName: tools.displayName,
        description: tools.description,
        inputPlaceholder: tools.inputPlaceholder,
        creditCost: tools.creditCost,
        isActive: tools.isActive,
        categoryName: toolCategories.name,
        categoryId: tools.categoryId,
        promptTemplate: tools.promptTemplate,
        nameEn: tools.nameEn,
        displayNameEn: tools.displayNameEn,
        descriptionEn: tools.descriptionEn,
        inputPlaceholderEn: tools.inputPlaceholderEn,
        promptTemplateEn: tools.promptTemplateEn,
        categoryEn: tools.categoryEn,
        nameEs: tools.nameEs,
        displayNameEs: tools.displayNameEs,
        descriptionEs: tools.descriptionEs,
        inputPlaceholderEs: tools.inputPlaceholderEs,
        promptTemplateEs: tools.promptTemplateEs,
        categoryEs: tools.categoryEs,
      })
        .from(tools)
        .leftJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
        .orderBy(tools.id);
    }),

    // ✅ 2. Listagem de categorias para o Select do Modal
    listCategories: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados não disponível");
      return await db.select().from(toolCategories).orderBy(toolCategories.name);
    }),

    // server/routers.ts

    upsertCategory: protectedProcedure
      .input(z.object({
        id: z.number().optional().nullable(),
        name: z.string().min(1),
        nameEn: z.string().optional().nullable(),
        nameEs: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
        const db = await getDb();
        if (!db) throw new Error("Banco de dados não disponível");

        if (input.id) {
          await db.update(toolCategories)
            .set({ name: input.name, nameEn: input.nameEn, nameEs: input.nameEs })
            .where(eq(toolCategories.id, input.id));
          return { success: true, categoryId: input.id };
        } else {
          const inserted = await db.insert(toolCategories)
            .values({ name: input.name, nameEn: input.nameEn, nameEs: input.nameEs })
            .returning({ id: toolCategories.id });
          return { success: true, categoryId: inserted[0].id };
        }
      }),

    deleteCategory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
        const db = await getDb();
        if (!db) throw new Error("Banco de dados não disponível");
        
        await db.update(tools).set({ categoryId: null }).where(eq(tools.categoryId, input.id));
        await db.delete(toolCategories).where(eq(toolCategories.id, input.id));
        return { success: true };
      }),

    upsertTool: protectedProcedure
      .input(z.object({
        id: z.number().optional().nullable(),
        displayName: z.string().min(1),
        description: z.string().optional().nullable(),
        inputPlaceholder: z.string().nullable(),
        promptTemplate: z.string().optional().nullable(),
        creditCost: z.number().min(0),
        categoryId: z.number().optional().nullable(),
        isActive: z.boolean().default(true),
        planIds: z.array(z.number()).optional(),
        nameEn: z.string().optional().nullable(),
        displayNameEn: z.string().optional().nullable(),
        descriptionEn: z.string().optional().nullable(),
        inputPlaceholderEn: z.string().optional().nullable(),
        promptTemplateEn: z.string().optional().nullable(),
        categoryEn: z.string().optional().nullable(),
        nameEs: z.string().optional().nullable(),
        displayNameEs: z.string().optional().nullable(),
        descriptionEs: z.string().optional().nullable(),
        inputPlaceholderEs: z.string().optional().nullable(),
        promptTemplateEs: z.string().optional().nullable(),
        categoryEs: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
        const db = await getValidatedDb();

        const toolData = {
          displayName: input.displayName,
          description: input.description,
          inputPlaceholder: input.inputPlaceholder,
          promptTemplate: input.promptTemplate,
          creditCost: input.creditCost,
          categoryId: input.categoryId,
          isActive: input.isActive ? "true" : "false", // Ajuste conforme seu schema
          name: input.displayName.toLowerCase().replace(/\s+/g, '_'),
          nameEn: input.nameEn,
          displayNameEn: input.displayNameEn,
          descriptionEn: input.descriptionEn,
          inputPlaceholderEn: input.inputPlaceholderEn,
          promptTemplateEn: input.promptTemplateEn,
          categoryEn: input.categoryEn,
          nameEs: input.nameEs,
          displayNameEs: input.displayNameEs,
          descriptionEs: input.descriptionEs,
          inputPlaceholderEs: input.inputPlaceholderEs,
          promptTemplateEs: input.promptTemplateEs,
          categoryEs: input.categoryEs,
        };

        let toolId = input.id;

        // 1. Salva a ferramenta principal
        if (toolId) {
          await db.update(tools).set(toolData as any).where(eq(tools.id, toolId));
        } else {
          const inserted = await db.insert(tools).values(toolData as any).returning({ id: tools.id });
          toolId = inserted[0].id;
        }

        // 2. ✅ GERENCIAMENTO DE PLANOS COM SQL PURO
        if (toolId && input.planIds !== undefined) {
          // Limpa vínculos antigos
          await db.execute(sql`DELETE FROM plan_tools WHERE "toolId" = ${toolId}`);

          if (input.planIds.length > 0) {
            // Inserimos um por um usando SQL puro para garantir que o banco ignore o ID e createdAt
            for (const pId of input.planIds) {
              await db.execute(sql`
            INSERT INTO plan_tools ("planId", "toolId") 
            VALUES (${pId}, ${toolId})
          `);
            }
          }
        }

        return { success: true };
      }),
    // ✅ 4. Mutation para Deletar
    deleteTool: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Remove vínculos em planos antes de deletar a ferramenta
        await db.delete(planTools).where(eq(planTools.toolId, input.id));
        return await db.delete(tools).where(eq(tools.id, input.id));
      }),

    // ✅ NOVO: Gerenciar Cupons (Super Admin)
    listCoupons: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { coupons } = await import("../drizzle/schema.js");
      return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    }),

    createCoupon: protectedProcedure
      .input(z.object({
        code: z.string().min(1).toUpperCase(),
        description: z.string().optional(),
        discountDays: z.number().int().positive(),
        expirationDate: z.string().optional().nullable(),
        allowedToolIds: z.string().optional().nullable(), // JSON array string
        bonusCredits: z.number().int().min(0).default(0),
        grantPlanId: z.number().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
        const db = await getValidatedDb();
        const { coupons } = await import("../drizzle/schema.js");
        
        await db.insert(coupons).values({
          code: input.code,
          description: input.description,
          discountDays: input.discountDays,
          expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
          allowedToolIds: input.allowedToolIds || null,
          bonusCredits: input.bonusCredits || 0,
          grantPlanId: input.grantPlanId || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        return { success: true };
      }),

    toggleCouponStatus: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
        const db = await getValidatedDb();
        const { coupons } = await import("../drizzle/schema.js");
        
        await db.update(coupons)
          .set({ isActive: input.isActive, updatedAt: new Date() })
          .where(eq(coupons.id, input.id));
        
        return { success: true };
      }),

    deleteCoupon: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
        const db = await getValidatedDb();
        const { coupons } = await import("../drizzle/schema.js");
        
        await db.delete(coupons).where(eq(coupons.id, input.id));
        return { success: true };
      }),

    editCoupon: protectedProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().min(1).toUpperCase(),
        description: z.string().optional(),
        discountDays: z.number().int().positive(),
        expirationDate: z.string().optional().nullable(),
        isActive: z.boolean(),
        allowedToolIds: z.string().optional().nullable(), // JSON array string
        bonusCredits: z.number().int().min(0).default(0),
        grantPlanId: z.number().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
        const db = await getValidatedDb();
        const { coupons } = await import("../drizzle/schema.js");
        
        await db.update(coupons)
          .set({ 
            code: input.code,
            description: input.description,
            discountDays: input.discountDays,
            expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
            isActive: input.isActive,
            allowedToolIds: input.allowedToolIds || null,
            bonusCredits: input.bonusCredits || 0,
            grantPlanId: input.grantPlanId || null,
            updatedAt: new Date() 
          })
          .where(eq(coupons.id, input.id));
        
        return { success: true };
      }),

    // ✅ NOVO: Obter ferramentas liberadas por cupom ativo do usuário
    getActiveCouponTools: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return { tools: [], bonusCredits: 0, couponCode: null, expiresAt: null };
        
        const { coupons, couponUsages } = await import("../drizzle/schema.js");
        
        // Busca uso de cupom ativo (não expirado) do usuário
        const usages = await db
          .select({
            couponId: couponUsages.couponId,
            expiresAt: couponUsages.expiresAt,
            isExpired: couponUsages.isExpired,
          })
          .from(couponUsages)
          .where(eq(couponUsages.userId, ctx.user.id));
        
        // Filtrar cupons não expirados
        const now = new Date();
        const activeUsage = usages.find(u => {
          if (u.isExpired) return false;
          if (u.expiresAt && new Date(u.expiresAt) < now) return false;
          return true;
        });
        
        if (!activeUsage) return { tools: [], bonusCredits: 0, couponCode: null, expiresAt: null };
        
        // Busca dados do cupom
        const [coupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.id, activeUsage.couponId))
          .limit(1);
        
        if (!coupon) return { tools: [], bonusCredits: 0, couponCode: null, expiresAt: null };
        
        // Parse tool IDs
        let toolIds: number[] = [];
        if (coupon.allowedToolIds) {
          try {
            toolIds = JSON.parse(coupon.allowedToolIds);
          } catch { toolIds = []; }
        }
        
        return {
          tools: toolIds,
          bonusCredits: coupon.bonusCredits || 0,
          couponCode: coupon.code,
          expiresAt: activeUsage.expiresAt?.toISOString() || null,
          grantPlanId: coupon.grantPlanId || null,
        };
      }),

    // ✅ 5. Listar quais planos estão vinculados a uma ferramenta específica
    getToolPlans: protectedProcedure
      .input(z.object({ toolId: z.number().optional().nullable() }))
      .query(async ({ input }) => {
        if (!input.toolId) return [];
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        return await db
          .select({ planId: planToolsSnake.planId })
          .from(planToolsSnake)
          .where(eq(planToolsSnake.toolId, input.toolId));
      }),

    // ✅ 6. Atualizar os vínculos (Múltiplos planos para uma ferramenta)
    updateToolPlans: protectedProcedure
      .input(z.object({
        toolId: z.number(),
        planIds: z.array(z.number())
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(planTools).where(eq(planTools.toolId, input.toolId));

        if (input.planIds.length > 0) {
          const valuesToInsert = input.planIds.map(planId => ({
            toolId: input.toolId,
            planId: planId
          }));
          await db.insert(planTools).values(valuesToInsert);
        }

        return { success: true };
      }),

  }),

  subscription: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      return await checkSubscriptionStatus(ctx.user.id);
    }),

    markPaid: protectedProcedure.mutation(async ({ ctx }) => {
      await markSubscriptionPaid(ctx.user.id);
      return { success: true };
    }),
  }),

  payments: router({
    /**
   * ✅ GERA LINK MERCADO PAGO PARA CRÉDITOS OU PLANOS
   */
    createCheckoutSession: protectedProcedure
      .input(z.object({
        type: z.enum(['credits', 'plan']),
        id: z.string(),
        price: z.number(),
        title: z.string(),
        billingPeriod: z.enum(['monthly', 'yearly']).optional(),
        language: z.string().optional(),
        startTrial: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database error");

          // Precisamos do email do usuário para o checkout
          const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id));
          if (!user || !user.email) throw new Error("Usuário não encontrado");

          if (input.type === 'credits') {
            // Delegate to shared helper
            return await createCreditsCheckout({
              credits: Number(input.id), // id is the amount of credits for this type
              price: input.price,
              userId: ctx.user.id,
              userEmail: user.email
            });
          } else {
            // NEW STRIPE INTEGRATION FOR PLANS
            let customerId = user.stripeCustomerId;

            if (!customerId) {
              // Create Stripe Customer
              const { createStripeCustomer } = await import("./stripe.js");
              const newCustomer = await createStripeCustomer(user.email, user.name || "Novo Cliente");
              customerId = newCustomer.id;

              // Update user in DB
              const { users } = await import("../drizzle/schema.js"); // Dynamic import to avoid cycles/conflicts if any
              await db.update(users)
                .set({ stripeCustomerId: customerId })
                .where(eq(users.id, user.id));
            }

            // Delegate to Stripe helper
            const [targetPlan] = await db.select().from(plans).where(eq(plans.id, Number(input.id))).limit(1);
            if (!targetPlan) throw new Error("Plano não encontrado");

            const planName = targetPlan.displayName;
            const billingPeriod = input.billingPeriod || 'monthly';
            const priceQuote = getPlanPriceQuote(targetPlan, billingPeriod, input.language);
            const price = priceQuote.amountCents / 100;
            const trialDays = input.startTrial === false ? undefined : NEW_USER_TRIAL_DAYS;
            const useMercadoPagoManualYearly =
              billingPeriod === 'yearly' && priceQuote.currency === 'brl' && !trialDays;
            const useMercadoPagoSubscription =
              priceQuote.currency === 'brl' && !useMercadoPagoManualYearly;

            if (useMercadoPagoManualYearly) {
              const mpSession = await createManualPaymentCheckout({
                planId: Number(input.id),
                planName: planName,
                price: price,
                duration: 1, // 1 ano
                billingPeriod: 'yearly',
                userId: ctx.user.id,
                userEmail: user.email
              });

              return {
                id: mpSession.id,
                init_point: mpSession.init_point,
              };
            } else if (useMercadoPagoSubscription) {
              const mpSession = await createSubscriptionCheckout({
                planId: Number(input.id),
                planName: planName,
                price: price,
                duration: billingPeriod === 'yearly' ? 12 : 1,
                billingPeriod,
                userId: ctx.user.id,
                userEmail: user.email,
                trialDays,
              });

              return {
                id: mpSession.id,
                init_point: mpSession.init_point,
              };
            } else {
              // ✅ Extrair dados de rastreamento (Cookies Meta)
              let fbc = "";
              let fbp = "";
              const cookieHeader = ctx.req.headers.get?.("cookie") || ctx.req.headers.cookie;

              if (cookieHeader) {
                const cookies: Record<string, string> = {};
                cookieHeader.split(";").forEach((c: string) => {
                  const [key, val] = c.trim().split("=");
                  cookies[key] = val;
                });
                fbc = cookies["_fbc"] || "";
                fbp = cookies["_fbp"] || "";
              }

              const clientIp = (ctx.req.headers.get?.("x-forwarded-for") || ctx.req.headers["x-forwarded-for"] || ctx.req.socket?.remoteAddress || "").split(',')[0].trim();
              const clientUserAgent = ctx.req.headers.get?.("user-agent") || ctx.req.headers["user-agent"] || "";

              const stripeSession = await createStripeCheckout({
                planId: Number(input.id),
                planName: planName,
                price: price,
                currency: priceQuote.currency,
                billingPeriod,
                userId: ctx.user.id,
                userEmail: user.email,
                customerId: customerId,
                trialDays,
                fbc,
                fbp,
                clientIp,
                clientUserAgent
              });

              // O frontend espera `init_point`, mas o Stripe retorna `url`
              return {
                id: stripeSession.id,
                init_point: stripeSession.url, // Mapeamos url do Stripe para init_point
              };
            }
          }
        } catch (error: any) {
          console.error("❌ ERRO NO MP:", error.message);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),
    /**
     * ✅ COMPRA DE CRÉDITOS AVULSOS
     */
    createCreditsCheckout: protectedProcedure
      .input(z.object({
        credits: z.number().positive(),
        price: z.number().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Conexão com o banco falhou");

        const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id));
        if (!user || !user.email) throw new Error("Usuário inválido");

        // Chama a função do Mercado Pago importada das linhas 27
        const result = await createCreditsCheckout({
          credits: input.credits,
          price: input.price,
          userId: ctx.user.id,
          userEmail: user.email
        });

        // Retorna o init_point para o frontend redirecionar
        return result;
      }),

    /**
     * ✅ Cria sessão do Portal de Cobrança (Stripe)
     */
    createPortalSession: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database error");

        const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id));

        if (!user || !user.stripeCustomerId) {
          throw new Error("Você ainda não possui uma assinatura vinculada.");
        }

        const url = await createPortalSession(user.stripeCustomerId);
        return { url };
      }),

    /**
     * ✅ UPGRADE DE PLANO
     */
    // ✅ REMOVIDO: createSubscriptionCheckout
    // Esse endpoint ativava planos como 'approved' SEM verificar pagamento real no Stripe.
    // Toda ativação de plano agora passa exclusivamente pelo webhook do Stripe
    // (checkout.session.completed) ou pelo admin (updateUserPlan).
    // Para upgrades, use createCheckoutSession com type: 'plan'.
  }),

  chatbot: router({
    getAIResponse: publicProcedure
      .input(z.object({
        message: z.string(),
        conversationHistory: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const systemPrompt = `Você é o assistente virtual da GNOSIS AI...`;
          const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...(input.conversationHistory || []),
            { role: 'user' as const, content: input.message },
          ];

          const response = await invokeLLM({ messages });

          return {
            response: response.choices[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.',
          };
        } catch (error) {
          return { response: 'Erro no processamento.' };
        }
      }),

    saveContact: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        department: z.enum(['tecnico', 'financeiro', 'comercial', 'outros']),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.insert(chatbotContacts).values({
          name: input.name,
          email: input.email,
          department: input.department,
          message: input.message || null,
          status: 'pending',
        });
        return { success: true };
      }),
  }),

  marketing: router({
    getAudience: protectedProcedure
      .input(audienceFilterSchema)
      .query(async ({ input }) => {
        return await getTargetAudience(input);
      }),

    sendEmail: protectedProcedure
      .input(marketingEmailSchema)
      .mutation(async ({ ctx, input }) => {
        return await sendMarketingEmail(ctx, input);
      }),

    getLogs: protectedProcedure
      .query(async ({ ctx }) => {
        return await getSentEmailsList(ctx);
      }),

    createGroup: protectedProcedure
      .input(marketingGroupSchema)
      .mutation(async ({ ctx, input }) => {
        return await createMarketingGroup(ctx, input);
      }),

    getGroups: protectedProcedure
      .query(async ({ ctx }) => {
        return await getMarketingGroups(ctx);
      }),

    deleteGroup: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await deleteMarketingGroup(ctx, input);
      }),
  }),

  /**
   * ✅ EMAIL AUTOMATION SYSTEM (SUPER ADMIN)
   */
  automations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await listAutomations(ctx);
    }),
    getStats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getAutomationStats(ctx, input);
      }),
    create: protectedProcedure
      .input(automationSchema)
      .mutation(async ({ ctx, input }) => {
        return await createAutomation(ctx, input);
      }),
    update: protectedProcedure
      .input(automationSchema.extend({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await updateAutomation(ctx, input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await deleteAutomation(ctx, input);
      }),
  }),
});

// No final do server/routers.ts
export type AppRouter = typeof appRouter;