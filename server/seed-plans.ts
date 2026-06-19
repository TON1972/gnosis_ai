import { getDb } from "./db.js";
import { plans, tools, planTools } from "../drizzle/schema.js";

/**
 * Seed script to populate plans and tools
 * Run with: pnpm tsx server/seed-plans.ts
 */

// Calcula preço anual com 16,6% desconto
const calculateYearlyPrice = (monthly: number) => {
  const yearlyWithoutDiscount = monthly * 12;
  const discount = yearlyWithoutDiscount * 0.166;
  return Math.round(yearlyWithoutDiscount - discount);
};

const PLANS_DATA = [
  {
    name: "basic",
    displayName: "Plano Basic",
    displayNameEn: "Basic Plan",
    priceMonthly: 497,
    priceYearly: 4668,
    creditsInitial: 500,
    creditsDaily: 50,
    toolsCount: 6,
    description: "Plano de entrada com ferramentas básicas",
  },
  {
    name: "alianca",
    displayName: "Plano Aliança",
    priceMonthly: 1998, // R$ 19,98
    priceYearly: calculateYearlyPrice(1998), // R$ 199,80 com 16,6% desconto
    creditsInitial: 1500, // cumulative, 30-day validity
    creditsDaily: 150, // non-cumulative
    toolsCount: 10,
    description: "Plano intermediário com 10 ferramentas",
  },
  {
    name: "lumen",
    displayName: "Plano Lumen",
    priceMonthly: 3698, // R$ 36,98
    priceYearly: calculateYearlyPrice(3698), // R$ 369,80 com 16,6% desconto
    creditsInitial: 3000, // cumulative, 30-day validity
    creditsDaily: 300, // non-cumulative
    toolsCount: 18,
    description: "Plano completo com todas as 18 ferramentas",
  },
  {
    name: "premium",
    displayName: "Plano GNOSIS Premium",
    priceMonthly: 6898, // R$ 68,98
    priceYearly: calculateYearlyPrice(6898), // R$ 689,80 com 16,6% desconto
    creditsInitial: 8000, // cumulative, 30-day validity
    creditsDaily: 400, // non-cumulative (UPDATED from 800)
    toolsCount: 18,
    description: "Plano premium com todas as 18 ferramentas e mais créditos",
  },
];

const TOOLS_DATA = [
  {
    name: "hermeneutica",
    displayName: "Hermenêutica",
    description: "Análise de contexto histórico, cultural e literário",
    category: "estudo_biblico",
    order: 1,
  },
  {
    name: "exegese",
    displayName: "Exegese",
    description: "Interpretação crítica e detalhada",
    category: "estudo_biblico",
    order: 2,
  },
  {
    name: "traducoes",
    displayName: "Traduções",
    description: "Hebraico, Aramaico e Grego",
    category: "estudo_biblico",
    order: 3,
  },
  {
    name: "resumos",
    displayName: "Resumos",
    description: "Sínteses personalizadas",
    category: "estudo_biblico",
    order: 4,
  },
  {
    name: "esbocos",
    displayName: "Esboços de Pregação",
    description: "Estruturas para sermões",
    category: "pratica",
    order: 5,
  },
  {
    name: "estudos_doutrinarios",
    displayName: "Estudos Doutrinários",
    description: "Análises teológicas profundas",
    category: "teologia",
    order: 6,
  },
  {
    name: "analise_teologica",
    displayName: "Análise Teológica Comparada",
    description: "Comparação entre correntes teológicas",
    category: "teologia",
    order: 7,
  },
  {
    name: "teologia_sistematica",
    displayName: "Teologia Sistemática",
    description: "Estudo organizado de temas teológicos",
    category: "teologia",
    order: 8,
  },
  {
    name: "religioes_comparadas",
    displayName: "Religiões Comparadas",
    description: "Estudo comparativo de religiões",
    category: "teologia",
    order: 9,
  },
  {
    name: "contextualizacao_brasileira",
    displayName: "Contextualização Brasileira",
    description: "Corpus exclusivo brasileiro",
    category: "contexto",
    order: 10,
  },
  {
    name: "referencias_abnt_apa",
    displayName: "Gerador de Referências ABNT/APA",
    description: "Formatação acadêmica de referências",
    category: "academico",
    order: 11,
  },
  {
    name: "linguagem_ministerial",
    displayName: "Análise de Linguagem Ministerial",
    description: "Análise de discursos ministeriais",
    category: "academico",
    order: 12,
  },
  {
    name: "redacao_academica",
    displayName: "Assistente de Redação Acadêmica",
    description: "Auxílio em trabalhos acadêmicos",
    category: "academico",
    order: 13,
  },
  {
    name: "dados_demograficos",
    displayName: "Análise de Dados Demográficos",
    description: "Dados estatísticos de igrejas",
    category: "dados",
    order: 14,
  },
  {
    name: "transcricao",
    displayName: "Transcrição de Mídia",
    description: "Transcrição de áudios e vídeos",
    category: "midia",
    order: 15,
  },
  {
    name: "patristica",
    displayName: "Patrística",
    description: "Explora o pensamento dos Pais da Igreja sobre temas e textos com contexto histórico",
    category: "teologia",
    order: 16,
  },
  {
    name: "linha_tempo_teologica",
    displayName: "Linha do Tempo Teológica",
    description: "Gera linha do tempo teológica interativa e cronológica sobre doutrinas e movimentos",
    category: "teologia",
    order: 17,
  },
  {
    name: "apologetica_avancada",
    displayName: "Apologética Avançada",
    description: "Ferramenta de defesa racional e sistemática da fé cristã, com base em filosofia, história, teologia bíblica e evidências empíricas",
    category: "teologia",
    order: 18,
  },
];

// Tools excluded from Aliança plan (8 excluded, 10 included)
const ALIANCA_EXCLUDED_TOOLS = [
  "exegese",
  "referencias_abnt_apa",
  "redacao_academica",
  "dados_demograficos",
  "transcricao",
  "patristica",
  "linha_tempo_teologica",
  "apologetica_avancada",
];

// FREE plan now has 6 basic tools
const FREE_TOOLS = [
  "hermeneutica",
  "traducoes",
  "resumos",
  "esbocos",
  "estudos_doutrinarios",
  "analise_teologica",
];

async function seedPlansAndTools() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  console.log("🌱 Seeding plans and tools...");

  try {
    // Insert plans
    console.log("📋 Inserting plans...");
    await db.delete(plans); // Clear existing
    const insertedPlans = await db.insert(plans).values(PLANS_DATA).returning();
    console.log(`✅ Inserted ${insertedPlans.length} plans`);

    // Get plan IDs
    const allPlans = await db.select().from(plans);
    const planMap = new Map(allPlans.map(p => [p.name, p.id]));

    // Insert tools
    console.log("🔧 Inserting tools...");
    await db.delete(tools); // Clear existing
    const insertedTools = await db.insert(tools).values(TOOLS_DATA).returning();
    console.log(`✅ Inserted ${insertedTools.length} tools`);

    // Get tool IDs
    const allTools = await db.select().from(tools);
    const toolMap = new Map(allTools.map(t => [t.name, t.id]));

    // Create plan-tool relationships
    console.log("🔗 Creating plan-tool relationships...");
    await db.delete(planTools); // Clear existing

    const planToolsData = [];

    // Basic plan - ferramentas básicas
    const basicPlanId = planMap.get("basic") ?? planMap.get("free")!;
    for (const toolName of FREE_TOOLS) {
      const toolId = toolMap.get(toolName);
      if (toolId) {
        planToolsData.push({ planId: basicPlanId, toolId });
      }
    }

    // ALIANÇA plan - 10 tools (excluding 5 specific ones)
    const aliancaPlanId = planMap.get("alianca")!;
    for (const tool of allTools) {
      if (!ALIANCA_EXCLUDED_TOOLS.includes(tool.name)) {
        planToolsData.push({ planId: aliancaPlanId, toolId: tool.id });
      }
    }

    // LUMEN and PREMIUM - all 18 tools
    const lumenPlanId = planMap.get("lumen")!;
    const premiumPlanId = planMap.get("premium")!;
    for (const tool of allTools) {
      planToolsData.push({ planId: lumenPlanId, toolId: tool.id });
      planToolsData.push({ planId: premiumPlanId, toolId: tool.id });
    }

    await db.insert(planTools).values(planToolsData);
    console.log(`✅ Created ${planToolsData.length} plan-tool relationships`);

    console.log("\n✨ Seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  - BASIC: 6 tools`);
    console.log(`  - ALIANÇA: 10 tools (excluding: ${ALIANCA_EXCLUDED_TOOLS.join(", ")})`);
    console.log(`  - LUMEN: 18 tools (all)`);
    console.log(`  - PREMIUM: 18 tools (all)`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPlansAndTools();
}

export { seedPlansAndTools };

