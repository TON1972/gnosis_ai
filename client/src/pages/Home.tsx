import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import VersePopup from "@/components/VersePopup";
import TutorialCarousel from "@/components/TutorialCarousel";
import MobileMenu from "@/components/MobileMenu";
import BuyCreditsModal from "@/components/BuyCreditsModal";
import { trpc } from "@/lib/trpc";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link, useLocation } from "wouter";
import React, { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import {
  BookOpen,
  Languages,
  FileText,
  Presentation,
  BookMarked,
  Scale,
  GraduationCap,
  Globe,
  FileCheck,
  Mic,
  BarChart,
  PenTool,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Crown,
  Gift,
  ShoppingCart,
  Loader2,
  Calendar
} from "lucide-react";

// Mapeamento de ícones baseados no nome da tool no banco de dados (seed-plans.ts)
const ICON_MAP: Record<string, any> = {
  // DB Names (Updated to match check_tool_names.ts output)
  "hermenêutica_avançada": BookOpen,
  "traduções": Languages,
  "resumos_bíblicos": FileText,
  "esboços_de_pregação": Presentation,
  "exegese_avançada": Sparkles,
  "escatologia_bíblica_avançada": FileCheck,
  "apologética_avançada": Scale,
  "teologia_sistemática": GraduationCap,
  "análise_teológica_comparada": Scale,
  "patrística": BookMarked,
  "história_da_igreja_detalhada": BookMarked,
  "linha_do_tempo_teológica": Calendar,
  "contextualização_brasileira": Globe,
  "religiões_comparadas": Globe,
  "estudos_doutrinários": BookOpen,
  "referências_abnt/apa": FileCheck,
  "redação_acadêmica": PenTool,
  "linguagem_ministerial": Mic,
  "dados_demográficos": BarChart,
  // Fallbacks for mismatches
  "default": Sparkles
};

const theologians = [
  "Agostinho de Hipona",
  "Tomás de Aquino",
  "Martinho Lutero",
  "João Calvino",
  "John Wesley",
  "Karl Barth",
  "C.S. Lewis",
  "Dietrich Bonhoeffer",
  "N.T. Wright",
  "Timothy Keller"
];

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: activePlan } = trpc.credits.activePlan.useQuery(undefined, { enabled: isAuthenticated });

  // Buscar planos e tools do banco
  const { data: plansData, isLoading: isLoadingPlans } = trpc.plans.list.useQuery();
  const { data: toolsData, isLoading: isLoadingTools } = trpc.tools.list.useQuery();

  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);

  const getDisplayPrice = (plan: any) => {
    if (plan.priceMonthly === 0) return { main: "Gratuito", multiplier: null };

    // O banco retorna valores em centavos (integer)
    const priceMonthly = plan.priceMonthly / 100;
    const priceYearly = plan.priceYearly / 100;

    if (billingPeriod === 'yearly') {
      // Exibe o valor mensal equivalente no plano anual
      const monthlyEquivalent = (priceYearly / 12).toFixed(2).replace('.', ',');
      return { main: `R$ ${monthlyEquivalent}`, multiplier: 'x 12' };
    }

    return { main: `R$ ${priceMonthly.toFixed(2).replace('.', ',')}`, multiplier: null };
  };

  const getDisplayPeriod = (plan: any) => {
    if (plan.priceMonthly === 0) return '';
    return billingPeriod === 'yearly' ? '/ano' : '/mês';
  };

  const handlePlanClick = (planId: number | string) => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      // ✅ Redirecionamento com parâmetros para abrir o cadastro e selecionar o plano
      window.location.href = `/auth?tab=register&plan=${planId}&billing=${billingPeriod}`;
    }
  };

  const getIconForTool = (toolName: string) => {
    // Tenta encontrar pelo nome exato, senão usa default
    const IconComponent = ICON_MAP[toolName] || ICON_MAP["default"];
    return <IconComponent className="w-8 h-8" />;
  };

  const isLoading = isLoadingPlans || isLoadingTools;

  return (
    <div className="public-page min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 object-contain" loading="lazy" />
              <h1 className="hidden md:block text-3xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
              <h1 className="block md:hidden text-3xl font-bold text-[#d4af37]">GNOSIS AI</h1>
            </div>

            <MobileMenu
              isAuthenticated={isAuthenticated}
              onLogout={logout}
              loginUrl="/auth"
              user={user}
            />
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-[#1e3a5f] mb-6">
            Estudos Bíblicos Profundos com IA
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-[#8b6f47] mb-8 leading-relaxed">
            Explore as Escrituras com ferramentas avançadas de inteligência artificial,
            desenvolvidas especialmente para pastores, teólogos e estudantes de seminário.
          </p>

          <div className="mb-12">
            <TutorialCarousel />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/faq">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-[#d4af37] text-lg px-8 py-6 rounded-xl shadow-xl"
              >
                Perguntas Frequentes
              </Button>
            </Link>
            <Button
              onClick={() => {
                const el = document.getElementById('planos');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              size="lg"
              className="bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] text-xl px-12 py-6 rounded-xl shadow-2xl"
            >
              Começar Agora
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-16">
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1e3a5f] text-center mb-8 md:mb-12">
          Ferramentas Principais
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
            {(() => {
              const DISPLAY_ORDER = [
                "hermenêutica_avançada",
                "traduções",
                "resumos_bíblicos",
                "exegese_avançada",
                "escatologia_bíblica_avançada",
                "esboços_de_pregação",
                "apologética_avançada",
                "teologia_sistemática",
                "história_da_igreja_detalhada", // ou história_da_igreja_detalhada se for o caso
                "linha_do_tempo_teológica"
              ];

              const displayNameOverrides: Record<string, string> = {
                "hermenêutica_avançada": "Hermenêutica Avançada",
                "traduções": "Traduções",
                "resumos_bíblicos": "Resumos Bíblicos",
                "exegese_avançada": "Exegese Avançada",
                "escatologia_bíblica_avançada": "Escatologia Bíblica",
                "esboços_de_pregação": "Esboços de Pregação",
                "apologética_avançada": "Apologética Avançada",
                "teologia_sistemática": "Teologia Sistemática",
                "patrística": "História da Igreja Detalhada",
                "história_da_igreja_detalhada": "História da Igreja Detalhada",
                "linha_do_tempo_teológica": "Linha do Tempo Teológica"
              };

              const displayedTools = toolsData
                ?.filter((tool: any) => DISPLAY_ORDER.includes(tool.name))
                .sort((a: any, b: any) => {
                  return DISPLAY_ORDER.indexOf(a.name) - DISPLAY_ORDER.indexOf(b.name);
                });

              return displayedTools?.map((tool: any) => {
                const isMobileOnly = tool.name === "linha_do_tempo_teológica";
                const visibilityClass = isMobileOnly ? "block md:hidden" : "block";
                const finalName = displayNameOverrides[tool.name] || tool.displayName || tool.name;

                return (
                  <div
                    key={tool.id}
                    className={`bg-white/90 rounded-2xl p-8 shadow-xl border-4 border-[#d4af37] hover:scale-105 transition-transform ${visibilityClass}`}
                  >
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                      <div className="p-3 bg-[#1e3a5f] rounded-lg text-[#d4af37]">
                        {getIconForTool(tool.name)}
                      </div>
                      <h4 className="text-sm md:text-xl font-bold text-[#1e3a5f] text-center md:text-left">{finalName}</h4>
                    </div>
                    <p className="text-[#8b6f47]">{tool.description}</p>
                  </div>
                );
              });
            })()}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/faq">
            <span className="inline-flex items-center gap-2 px-8 py-4 bg-[#d4af37] text-[#1e3a5f] rounded-xl font-bold text-lg hover:bg-[#B8860B] transition-colors shadow-lg cursor-pointer">
              <Sparkles className="w-6 h-6" />
              Entre outras poderosas ferramentas para estudos acadêmicos, clique aqui e veja!
              <ArrowRight className="w-6 h-6" />
            </span>
          </Link>
        </div>
      </section >

      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="bg-white/90 rounded-2xl p-6 md:p-12 shadow-2xl border-4 border-[#d4af37] max-w-5xl mx-auto">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1e3a5f] text-center mb-6 md:mb-8">
            Fundamentada nos Mais Proeminentes Teólogos da História
          </h3>
          <p className="text-xl text-[#8b6f47] text-center mb-8">
            Nossa IA foi treinada com obras e pensamentos de renomados teólogos cristãos:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {theologians.map((theologian, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-[#FFFACD] rounded-lg border-2 border-[#d4af37]">
                <CheckCircle2 className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
                <span className="text-[#1e3a5f] font-semibold">{theologian}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-lg text-[#8b6f47] italic font-semibold">
            Entre muitos outros...
          </p>
        </div>
      </section>

      <section id="planos" className="container mx-auto px-4 py-8 md:py-16">
        <h3 className="hidden md:block text-2xl md:text-3xl lg:text-4xl font-bold text-[#1e3a5f] text-center mb-4">
          Escolha Seu Plano
        </h3>

        <div className="hidden md:flex justify-center items-center gap-4 mb-6">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${billingPeriod === 'monthly'
              ? 'bg-[#1e3a5f] text-[#d4af37] shadow-lg scale-105'
              : 'bg-white/80 text-[#8b6f47] hover:bg-white'
              }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${billingPeriod === 'yearly'
              ? 'bg-[#1e3a5f] text-[#d4af37] shadow-lg scale-105'
              : 'bg-white/80 text-[#8b6f47] hover:bg-white'
              }`}
          >
            Anual
            <span className="absolute -top-2 -right-2 bg-[#d4af37] text-[#1e3a5f] text-xs px-2 py-1 rounded-full font-bold">
              -16,5%
            </span>
          </button>
        </div>

        <p className="hidden md:block text-base md:text-lg lg:text-xl text-[#8b6f47] text-center mb-8 md:mb-12">
          * Créditos iniciais dos planos pagos são renovados a cada 30 dias
        </p>

        {(!isAuthenticated || !activePlan || activePlan.plan.name === 'free') && (
          <div className="mb-8 text-center">
            <style>{`
              @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
              .blink-animation {
                animation: blink 1.5s ease-in-out infinite;
              }
            `}</style>
            <p className="blink-animation hidden md:inline-block text-2xl font-bold text-red-600 bg-yellow-100 border-4 border-red-500 rounded-lg py-4 px-6 shadow-lg">
              🎉 ESSES SÃO VALORES PROMOCIONAIS DE LANÇAMENTO, APROVEITE A OPORTUNIDADE! 🎉
            </p>

            <div className="mt-6">
              <Button
                onClick={() => {
                  const el = document.getElementById('pricing-grid');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#d4af37] md:bg-[#d4af37] bg-gradient-to-r from-red-500 to-red-600 md:from-[#d4af37] md:to-[#d4af37] text-white md:text-[#1e3a5f] rounded-xl font-bold text-lg hover:bg-[#B8860B] transition-colors shadow-lg cursor-pointer"
              >
                PLANOS E PREÇOS
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f]" />
          </div>
        ) : (
          <>
            {/* Mobile: Botão para página de planos */}
            <div className="md:hidden flex flex-col items-center justify-center space-y-6">
              <p className="text-lg text-[#8b6f47] text-center px-4">
                Confira todos os detalhes dos nossos planos e escolha o ideal para o seu ministério.
              </p>
              <Link href="/planos">
                <Button
                  size="lg"
                  className="bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] text-xl px-12 py-6 rounded-xl shadow-2xl w-full max-w-xs"
                >
                  Ver Planos e Preços
                </Button>
              </Link>
            </div>

            {/* Desktop: Grid de Planos Completo */}
            <div id="pricing-grid" className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
              {plansData?.map((plan: any) => {
                const isHighlight = plan.name === 'lumen';
                const isPremium = plan.name === 'premium';
                const isFree = plan.name === 'free';

                const priceDisplay = getDisplayPrice(plan);

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl p-8 shadow-2xl border-4 ${isHighlight
                      ? "bg-gradient-to-br from-[#d4af37] to-[#B8860B] border-[#1e3a5f] scale-105"
                      : isPremium
                        ? "bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] border-[#d4af37]"
                        : "bg-white/90 border-[#d4af37]"
                      } hover:scale-105 transition-transform relative`}
                  >
                    {isHighlight && (
                      <div className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 bg-[#1e3a5f] text-[#d4af37] px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-bold whitespace-nowrap">
                        MAIS POPULAR
                      </div>
                    )}
                    {isPremium && (
                      <div className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 bg-[#d4af37] text-[#1e3a5f] px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-bold flex items-center gap-1 whitespace-nowrap">
                        <Crown className="w-3 h-3 md:w-4 md:h-4" />
                        PREMIUM
                      </div>
                    )}
                    <h4 className={`text-2xl font-bold mb-4 ${isHighlight || isPremium ? "text-white" : "text-[#1e3a5f]"
                      }`}>
                      {plan.displayName}
                    </h4>
                    <div className="mb-6">
                      <span className={`text-4xl font-bold ${isHighlight || isPremium ? "text-white" : "text-[#1e3a5f]"
                        }`}>
                        {priceDisplay.main}
                      </span>
                      {priceDisplay.multiplier && (
                        <span className={`text-lg ml-1 ${isHighlight || isPremium ? "text-white/60" : "text-[#8b6f47]/60"
                          }`}>
                          {priceDisplay.multiplier}
                        </span>
                      )}
                      {!isFree && (
                        <span className={`text-lg ${isHighlight || isPremium ? "text-white/80" : "text-[#8b6f47]"
                          }`}>
                          {getDisplayPeriod(plan)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className={`p-3 rounded-lg ${isHighlight || isPremium ? "bg-white/20" : "bg-[#FFFACD]"
                        }`}>
                        <p className={`font-semibold ${isHighlight || isPremium ? "text-white" : "text-[#1e3a5f]"
                          }`}>
                          {plan.creditsInitial?.toLocaleString()} créditos iniciais{isFree ? "" : "*"}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${isHighlight || isPremium ? "bg-white/20" : "bg-[#FFFACD]"
                        }`}>
                        <p className={`font-semibold ${isHighlight || isPremium ? "text-white" : "text-[#1e3a5f]"
                          }`}>
                          {plan.creditsDaily?.toLocaleString()} créditos/dia
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${isHighlight || isPremium ? "bg-white/20" : "bg-[#FFFACD]"
                        }`}>
                        <p className={`font-semibold ${isHighlight || isPremium ? "text-white" : "text-[#1e3a5f]"
                          }`}>
                          {(() => {
                            const validToolsCount = toolsData?.filter((t: any) =>
                              plan.toolIds?.includes(String(t.id))
                            ).length || 0;
                            const totalToolsCount = toolsData?.length || 19;

                            return validToolsCount === totalToolsCount
                              ? `(Todas as ${totalToolsCount} ferramentas)`
                              : `(${validToolsCount} de ${totalToolsCount} ferramentas disponíveis)`;
                          })()}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                      {toolsData?.map((tool: any, i: number) => {
                        // Verifica se a ferramenta está inclusa no plano
                        const isAvailable = plan.toolIds?.includes(String(tool.id));
                        return (
                          <li key={i} className="flex items-start gap-2">
                            {isAvailable ? (
                              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isHighlight || isPremium ? "text-green-400" : "text-green-600"
                                }`} />
                            ) : (
                              <span className={`w-4 h-4 flex-shrink-0 mt-0.5 text-red-500 font-bold`}>×</span>
                            )}
                            <span className={`text-xs ${isHighlight || isPremium
                              ? isAvailable ? "text-white" : "text-white/50"
                              : isAvailable ? "text-[#1e3a5f]" : "text-gray-400"
                              }`}>
                              {tool.displayName}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <Button
                      onClick={() => handlePlanClick(plan.id)}
                      className={`w-full ${isHighlight
                        ? "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                        : isPremium
                          ? "bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B]"
                          : "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                        }`}
                    >
                      {isFree ? "Começar Grátis" : "Assinar Agora"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="hidden md:block container mx-auto px-4 py-8">
        <div className="text-center">
          <Link href="/faq">
            <Button
              size="lg"
              className="bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B] text-xl px-12 py-6 rounded-xl shadow-2xl"
            >
              Perguntas Frequentes
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="bg-gradient-to-br from-[#FFFACD] to-[#F0E68C] rounded-2xl p-6 md:p-12 shadow-2xl border-4 border-[#d4af37] max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <Gift className="w-12 h-12 md:w-16 md:h-16 text-[#d4af37] mx-auto mb-4" />
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1e3a5f] mb-4">
              Acabaram Seus Créditos?
            </h3>
            <p className="text-xl text-[#8b6f47] font-semibold">
              Faça um Upgrade de Plano ou Compre Créditos Avulso!
            </p>
            <div className="mt-6 bg-green-500 text-white px-6 py-3 rounded-lg inline-block shadow-lg">
              <p className="text-base md:text-lg font-bold">
                💸 OPÇÃO DE COMPRA DE CRÉDITOS AVULSO POR PIX LIBERADO, MAIS RÁPIDO E PRÁTICO!
              </p>
            </div>

            <div className="md:hidden mt-6 flex justify-center">
              <Button
                onClick={() => setShowBuyCreditsModal(true)}
                size="lg"
                className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 text-sm px-8 py-4 rounded-lg shadow-xl font-bold flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                COMPRAR CRÉDITOS AVULSO
              </Button>
            </div>
          </div>

          <div id="credits-grid" className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white/90 rounded-xl p-6 shadow-lg border-3 border-[#d4af37] relative">
              <div className="text-center mb-4">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#d4af37]" />
                <p className="text-3xl font-bold text-[#1e3a5f]">1.000</p>
                <p className="text-sm text-[#8b6f47]">créditos</p>
              </div>
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-[#1e3a5f]">R$ 9,90</p>
              </div>
              <Button
                onClick={() => window.location.href = "/auth?tab=login"}
                className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
              >
                Comprar
              </Button>
            </div>

            <div className="bg-white/95 rounded-xl p-6 shadow-lg border-4 border-[#d4af37] relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#d4af37] text-[#1e3a5f] px-3 py-1 rounded-full text-xs font-bold">
                POPULAR
              </div>
              <div className="text-center mb-4">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#d4af37]" />
                <p className="text-3xl font-bold text-[#1e3a5f]">3.000</p>
                <p className="text-sm text-[#8b6f47]">créditos</p>
              </div>
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-[#1e3a5f]">R$ 24,90</p>
              </div>
              <Button
                onClick={() => window.location.href = "/auth?tab=login"}
                className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
              >
                Comprar
              </Button>
            </div>

            <div className="bg-white/90 rounded-xl p-6 shadow-lg border-3 border-[#d4af37] relative">
              <div className="text-center mb-4">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#d4af37]" />
                <p className="text-3xl font-bold text-[#1e3a5f]">6.000</p>
                <p className="text-sm text-[#8b6f47]">créditos</p>
              </div>
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-[#1e3a5f]">R$ 39,90</p>
              </div>
              <Button
                onClick={() => window.location.href = "/auth?tab=login"}
                className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
              >
                Comprar
              </Button>
            </div>

            <div className="bg-gradient-to-br from-[#d4af37] to-[#B8860B] rounded-xl p-6 shadow-lg border-3 border-[#1e3a5f] relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#1e3a5f] text-[#d4af37] px-3 py-1 rounded-full text-xs font-bold">
                MELHOR VALOR
              </div>
              <div className="text-center mb-4">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-white" />
                <p className="text-3xl font-bold text-white">10.000</p>
                <p className="text-sm text-[#8b6f47]">créditos</p>
              </div>
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-white">R$ 69,90</p>
              </div>
              <Button
                onClick={() => window.location.href = "/auth?tab=login"}
                className="w-full bg-white text-[#1e3a5f] hover:bg-gray-100"
              >
                Comprar
              </Button>
            </div>
          </div>

          <div className="text-center mt-6 md:mt-8">
            <p className="text-sm md:text-base text-[#8b6f47]">
              <strong>Créditos avulsos nunca expiram</strong> e podem ser usados em qualquer plano!
            </p>
          </div>

          <div className="md:hidden mt-8 flex justify-center">
            <Link href="/faq">
              <Button
                size="lg"
                className="bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B] text-xl px-12 py-6 rounded-xl shadow-2xl"
              >
                Perguntas Frequentes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="bg-white/90 rounded-2xl p-6 md:p-12 shadow-2xl border-4 border-[#d4af37] max-w-5xl mx-auto text-center">
          <Globe className="w-12 h-12 md:w-16 md:h-16 text-[#d4af37] mx-auto mb-4 md:mb-6" />
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1e3a5f] mb-4 md:mb-6">
            Contextualização Brasileira Exclusiva
          </h3>
          <p className="text-base md:text-lg lg:text-xl text-[#8b6f47] leading-relaxed">
            Nossa ferramenta de Contextualização Brasileira oferece referências que os melhores
            softwares estrangeiros não possuem. Desenvolvida especialmente para a realidade
            brasileira, com corpus exclusivo sobre cultura, sociedade e religiosidade do Brasil.
          </p>
        </div>
      </section>

      <Footer />

      <VersePopup />

      <BuyCreditsModal
        open={showBuyCreditsModal}
        onClose={() => setShowBuyCreditsModal(false)}
      />
    </div >
  );
}