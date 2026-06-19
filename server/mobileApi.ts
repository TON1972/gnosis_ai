import express from "express";
import { getDb } from "./db.js";
import { 
  tools, planToolsSnake, toolCategories, 
  savedStudies, studyMessages,
  plans, credits, creditTransactions 
} from "../drizzle/schema.js";
import { eq, desc, and, asc, sql } from "drizzle-orm";
import { requireMobileAuth } from "./_core/mobileAuth.js";
import { getUserCredits, useCredits, getUserActivePlan } from "./credits.js";
import { sortPlansByDisplayOrder } from "../shared/planConstants.js";

export const mobileRouter = express.Router();

// ---------------------------------------------------------
// 1. AUTHENTICATION & PROFILE
// ---------------------------------------------------------

// Retorna os dados do usuário atual (utilizado para auto-login)
mobileRouter.get("/auth/me", requireMobileAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Atualiza/Valida créditos diários
    await getUserCredits(user.id);
    
    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    console.error("[Mobile API] Erro em /auth/me:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

mobileRouter.post("/auth/logout", requireMobileAuth, (req, res) => {
  // Mobile client deve descartar o token localmente.
  // Opcional: Inserir token em blacklist no banco.
  return res.status(200).json({ success: true, message: "Logged out" });
});


// ---------------------------------------------------------
// 2. DASHBOARD & TOOLS
// ---------------------------------------------------------

// Lista todas as ferramentas ativas (com categorias)
mobileRouter.get("/tools", requireMobileAuth, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    const toolsList = await db
      .select({
        id: tools.id,
        name: tools.name,
        displayName: tools.displayName,
        description: tools.description,
        inputPlaceholder: tools.inputPlaceholder,
        category: toolCategories.name,
        icon: tools.icon,
        isActive: tools.isActive,
      })
      .from(tools)
      .leftJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
      .where(eq(tools.isActive, true))
      .orderBy(tools.order);

    return res.status(200).json({ success: true, tools: toolsList });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


// ---------------------------------------------------------
// 3. GENERATION (CORE)
// ---------------------------------------------------------

// Endpoint para gerar conteúdo via IA (Consome invokeLLM interno)
mobileRouter.post("/tools/generate", requireMobileAuth, async (req, res) => {
  try {
    const { toolId, input, history, language } = req.body;
    
    if (!toolId || !input) {
      return res.status(400).json({ success: false, message: "toolId e input são obrigatórios." });
    }

    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    const { invokeLLM } = await import("./_core/llm.js");

    const toolRecord = await db
      .select({ 
        promptTemplate: tools.promptTemplate,
        promptTemplateEn: tools.promptTemplateEn,
        promptTemplateEs: tools.promptTemplateEs
      })
      .from(tools)
      .where(eq(tools.id, Number(toolId)))
      .limit(1);

    if (!toolRecord.length) {
      return res.status(404).json({ success: false, message: "Ferramenta não encontrada." });
    }

    let systemPrompt = toolRecord[0].promptTemplate || "Você é um assistente qualificado.";
    
    if (language === 'en' && toolRecord[0].promptTemplateEn) systemPrompt = toolRecord[0].promptTemplateEn;
    if (language === 'es' && toolRecord[0].promptTemplateEs) systemPrompt = toolRecord[0].promptTemplateEs;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: input }
    ];

    const response = await invokeLLM({ messages });
    const rawContent = response.choices[0]?.message?.content;
    const finalContent = typeof rawContent === "string" ? rawContent : "";

    // Cálculo básico de palavras para custo
    const words = finalContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    let cost = 50;
    if (words > 500) cost = 90;
    if (words > 1000) cost = 115;
    // ... simplificado, ideal é chamar a mesma função `calculateDynamicCost` do routers.ts

    return res.status(200).json({
      success: true,
      content: finalContent,
      wordCount: words,
      creditCost: cost
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


// ---------------------------------------------------------
// 4. STUDIES (MEUS ESTUDOS)
// ---------------------------------------------------------

mobileRouter.get("/studies", requireMobileAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    const studiesList = await db
      .select()
      .from(savedStudies)
      .where(eq(savedStudies.userId, user.id))
      .orderBy(desc(savedStudies.createdAt));

    return res.status(200).json({ success: true, studies: studiesList });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

mobileRouter.get("/studies/recent", requireMobileAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    const studiesList = await db
      .select()
      .from(savedStudies)
      .where(eq(savedStudies.userId, user.id))
      .orderBy(desc(savedStudies.createdAt))
      .limit(5);

    return res.status(200).json({ success: true, studies: studiesList });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

mobileRouter.post("/studies/save", requireMobileAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { toolId, toolName, input, output, creditCost, wordCount } = req.body;
    
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    const result = await db.insert(savedStudies).values({
      userId: user.id,
      toolId,
      toolName,
      input,
      output,
      creditCost,
      wordCount,
    } as any).returning({ insertedId: savedStudies.id });

    // Debitar créditos
    await useCredits(user.id, creditCost, toolName, toolId);

    return res.status(200).json({ success: true, id: result[0]?.insertedId });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

mobileRouter.get("/studies/:id", requireMobileAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const studyId = Number(req.params.id);
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    const [study] = await db
      .select()
      .from(savedStudies)
      .where(and(eq(savedStudies.id, studyId), eq(savedStudies.userId, user.id)))
      .limit(1);

    if (!study) {
      return res.status(404).json({ success: false, message: "Estudo não encontrado." });
    }

    const messages = await db
      .select()
      .from(studyMessages)
      .where(eq(studyMessages.studyId, studyId))
      .orderBy(asc(studyMessages.createdAt));

    return res.status(200).json({ success: true, study, messages: messages || [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


// ---------------------------------------------------------
// 5. CREDITS & PLANS
// ---------------------------------------------------------

mobileRouter.get("/credits/balance", requireMobileAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const balance = await getUserCredits(user.id);
    return res.status(200).json({ success: true, balance });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

mobileRouter.get("/plans", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    const plansData = sortPlansByDisplayOrder(await db.select().from(plans));
    return res.status(200).json({ success: true, plans: plansData });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

mobileRouter.get("/credits/active-plan", requireMobileAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const activePlan = await getUserActivePlan(user.id);
    return res.status(200).json({ success: true, activePlan });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------
// 6. USAGE HISTORY & AFFILIATE
// ---------------------------------------------------------

mobileRouter.get("/credits/usage-history", requireMobileAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const db = await getDb();
    if (!db) throw new Error("Banco indisponível");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, user.id),
          // or(eq(creditTransactions.type, 'usage'), eq(creditTransactions.type, 'spend')),
          sql`${creditTransactions.createdAt} >= ${thirtyDaysAgo}`
        )
      )
      .orderBy(desc(creditTransactions.createdAt));

    return res.status(200).json({ success: true, history: transactions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

mobileRouter.get("/affiliate/stats", requireMobileAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const db = await getDb();
    if (!db) throw new Error("Banco indisponível");

    const { users, affiliateCommissions } = await import("../drizzle/schema.js");

    const [affiliateUser] = await db
      .select({ affiliateCode: users.affiliateCode, commissionPercentage: users.commissionPercentage })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const commissions = await db
      .select()
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateId, user.id));

    return res.status(200).json({ 
      success: true, 
      stats: {
        code: affiliateUser?.affiliateCode,
        commissionPercentage: affiliateUser?.commissionPercentage,
        commissions: commissions
      } 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Outros endpoints como checkout nativo seriam implementados aqui.
