import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getAllPlans, getToolsForPlan, getAllTools } from "./db";
// Gnosis.log removido - usando OAuth apenas
import {
  savedStudies,
  users,
  creditTransactions,
  // chatbotContacts, 
  // ticketMessages,
  tools,      // ✅ Adicionado
  planTools,   // ✅ Adicionado
  toolCategories,
  studyMessages,
  plans,
  payments,
  credits,
  subscriptions,
} from "../drizzle/schema";
import { getDb } from "./db";
import { eq, desc, sql, and, lt, gte, or, asc } from "drizzle-orm";
import { getUserCredits, useCredits, getUserActivePlan } from "./credits";
import { checkSubscriptionStatus, markSubscriptionPaid } from "./subscriptionStatus";
import { getUserStats, getFinancialCalendar, getDelinquentUsers } from "./admin";
import { createSubscriptionCheckout, createCreditsCheckout, createManualPaymentCheckout } from "./mercadopago";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { chatbotContacts, ticketMessages } from "../drizzle/schema";
import { z } from "zod";
//import {  userCredits } from "@shared/schema";

// Helper para garantir conexão com DB
async function getValidatedDb() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  return db;
}

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
          planId: planTools.planId,
          toolId: planTools.toolId
        }).from(planTools);

        // 3. Mescla os dados convertendo IDs para String para comparação segura
        return plansData.map(plan => ({
          ...plan,
          toolIds: allRelations
            .filter(rel => String(rel.planId) === String(plan.id))
            .map(rel => String(rel.toolId))
        }));
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
            category: tools.category,
            icon: tools.icon
          })
          .from(tools)
          .innerJoin(planTools, eq(planTools.toolId, tools.id))
          .where(eq(planTools.planId, input.planId));
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
        .select()
        .from(tools)
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
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const db = await getValidatedDb();

        const toolRecord = await db
          .select({ promptTemplate: tools.promptTemplate })
          .from(tools)
          .where(
            or(
              eq(tools.name, input.toolId),
              isNaN(Number(input.toolId)) ? undefined : eq(tools.id, Number(input.toolId))
            )
          )
          .limit(1);

        const systemPrompt = toolRecord[0]?.promptTemplate || "Você é um assistente de estudos bíblicos altamente qualificado.";

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
        creditCost: z.number(), // Valor dinâmico baseado nas palavras
        wordCount: z.number(),  // Total de palavras contadas
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getValidatedDb();

        // 1. Grava o estudo no histórico
        await db.insert(savedStudies).values({
          userId: ctx.user.id,
          toolId: input.toolId,
          toolName: input.toolName,
          input: input.input,
          output: input.output,
          creditCost: input.creditCost,
          wordCount: input.wordCount,
        } as any);

        // 2. ✅ COMANDO DE SUBTRAÇÃO: Debita o saldo do usuário
        // Esta função atualiza a tabela 'users' e registra a transação
        await useCredits(
          ctx.user.id,
          input.creditCost, // O valor dinâmico calculado (ex: 90, 115)
          input.toolName,
          input.toolId
        );

        // 3. Cleanup: Mantém apenas os 100 últimos estudos
        const thresholdStudy = await db
          .select({ id: savedStudies.id })
          .from(savedStudies)
          .where(eq(savedStudies.userId, ctx.user.id))
          .orderBy(desc(savedStudies.createdAt))
          .offset(100)
          .limit(1);

        if (thresholdStudy.length > 0) {
          await db.delete(savedStudies)
            .where(
              and(
                eq(savedStudies.userId, ctx.user.id),
                lt(savedStudies.id, thresholdStudy[0].id)
              )
            );
        }

        return { success: true };
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
  }),
  admin: router({
    userStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
      }
      return await getUserStats();
    }),

    financialCalendar: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Acesso negado');
      }
      return await getFinancialCalendar();
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

    // ✅ 1. Listagem completa para a tabela (com o JOIN para a categoria)
    listAllTools: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
      const db = await getDb();
      if (!db) throw new Error("Falha ao conectar com o banco de dados");

      return await db.select({
        id: tools.id,
        displayName: tools.displayName,
        description: tools.description,
        creditCost: tools.creditCost,
        isActive: tools.isActive,
        categoryName: toolCategories.name, // Nome da categoria via Join
        categoryId: tools.categoryId,
        promptTemplate: tools.promptTemplate
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

    // ✅ 3. Mutation para Criar ou Editar (Upsert)
    // server/routers.ts

    // server/routers.ts -> dentro de admin: router({ ... })

    // server/routers.ts -> dentro do router 'admin'
    // server/routers.ts -> admin: router({ ... })

    // server/routers.ts

    upsertTool: protectedProcedure
      .input(z.object({
        id: z.number().optional().nullable(),
        displayName: z.string().min(1),
        description: z.string().optional().nullable(),
        promptTemplate: z.string().optional().nullable(),
        creditCost: z.number().min(0),
        categoryId: z.number().optional().nullable(),
        isActive: z.boolean().default(true),
        planIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') throw new Error('Acesso negado');
        const db = await getValidatedDb();

        const toolData = {
          displayName: input.displayName,
          description: input.description,
          promptTemplate: input.promptTemplate,
          creditCost: input.creditCost,
          categoryId: input.categoryId,
          isActive: input.isActive ? "true" : "false", // Ajuste conforme seu schema
          name: input.displayName.toLowerCase().replace(/\s+/g, '_'),
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

    // ✅ 5. Listar quais planos estão vinculados a uma ferramenta específica
    getToolPlans: protectedProcedure
      .input(z.object({ toolId: z.number().optional().nullable() }))
      .query(async ({ input }) => {
        if (!input.toolId) return [];
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        return await db
          .select({ planId: planTools.planId })
          .from(planTools)
          .where(eq(planTools.toolId, input.toolId));
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

        // 1. Registrar na tabela 'payments'
        await db.insert(payments).values({
          userId: ctx.user.id,
          amount: Math.round(input.price * 100), // Armazenar em cents
          currency: 'BRL',
          status: 'approved',
          paymentMethod: 'credit_purchase'
        });

        // 2. Atualizar o saldo (creditsBonus e amount total)
        await db.update(credits)
          .set({
            creditsBonus: sql`${credits.creditsBonus} + ${input.credits}`,
            amount: sql`${credits.amount} + ${input.credits}`
          })
          .where(eq(credits.userId, ctx.user.id));

        return { success: true, message: "Créditos adicionados!" };
      }),

    /**
     * ✅ UPGRADE DE PLANO
     */
    createSubscriptionCheckout: protectedProcedure
    .input(z.object({
      planId: z.union([z.number(), z.string()]),
      billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Conexão com o banco falhou");

      const targetPlanId = Number(input.planId);
      const [targetPlan] = await db.select().from(plans).where(eq(plans.id, targetPlanId));
      if (!targetPlan) throw new Error('Plano destino não encontrado');

      const amount = input.billingPeriod === 'yearly' ? targetPlan.priceYearly : targetPlan.priceMonthly;

      // 1. Registrar transação
      await db.insert(payments).values({
        userId: ctx.user.id,
        amount: amount,
        currency: 'BRL',
        status: 'approved',
        paymentMethod: 'plan_transition'
      });

      // 2. Atualizar Assinatura
      const intervalPeriod = input.billingPeriod === 'yearly' ? '1 year' : '1 month';
      await db.update(subscriptions)
        .set({
          planId: targetPlanId,
          billingPeriod: input.billingPeriod,
          updatedAt: new Date(),
          endDate: sql`NOW() + ${sql.raw(`interval '${intervalPeriod}'`)}`,
          status: 'active'
        })
        .where(eq(subscriptions.userId, ctx.user.id));

      // 3. Atualizar Créditos (CORREÇÃO DA SOMA SQL)
      // Usamos cast explícito para garantir que o Postgres trate os inputs como inteiros
      await db.update(credits)
        .set({
          creditsInitial: targetPlan.creditsInitial,
          creditsDaily: targetPlan.creditsDaily,
          expiresAt: sql`NOW() + interval '30 days'`, 
          amount: sql`(${targetPlan.creditsInitial}::integer + ${targetPlan.creditsDaily}::integer + ${credits.creditsBonus})`
        })
        .where(eq(credits.userId, ctx.user.id));

      return { success: true, newPlanName: targetPlan.displayName };
    }),
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

});

// No final do server/routers.ts
export type AppRouter = typeof appRouter;