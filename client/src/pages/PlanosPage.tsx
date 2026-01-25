import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { CheckCircle2, Crown, Loader2 } from "lucide-react";
import MobileMenu from "@/components/MobileMenu";
import CreditPackages from "@/components/CreditPackages";

export default function PlanosPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [, setLocation] = useLocation();

  // Scroll para o topo quando a página carregar (método robusto)
  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);

  // Queries
  const { data: activePlan } = trpc.credits.activePlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Buscar planos e tools do banco (Dinâmico)
  const { data: plansData, isLoading: isLoadingPlans } = trpc.plans.list.useQuery();
  const { data: toolsData, isLoading: isLoadingTools } = trpc.tools.list.useQuery();

  const isLoading = isLoadingPlans || isLoadingTools;

  // Lógica de Preço
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

  const createCheckout = trpc.payments.createCheckoutSession.useMutation();

  const handlePlanClick = async (planId: number | string) => {
    if (isAuthenticated) {
      if (activePlan?.plan?.id === Number(planId)) {
        // Já possui este plano
        return;
      }

      const plan = plansData?.find(p => p.id === Number(planId));
      if (!plan) return;

      const billing = billingPeriod;
      const priceCents = billing === 'yearly' ? plan.priceYearly : plan.priceMonthly;
      const price = priceCents / 100;

      try {
        const checkout = await createCheckout.mutateAsync({
          type: 'plan',
          id: String(plan.id),
          price: price,
          title: `Assinatura Plano ${plan.displayName} (${billing === 'yearly' ? 'Anual' : 'Mensal'}) - Gnosis AI`,
          billingPeriod: billing
        });

        if (checkout.init_point) {
          window.location.href = checkout.init_point;
        } else {
          console.error("Erro checkout: link vazio");
        }
      } catch (error) {
        console.error("Erro ao iniciar upgrade:", error);
      }

    } else {
      window.location.href = `/auth?tab=register&plan=${planId}&billing=${billingPeriod}`;
    }
  };

  return (
    <div className="public-page min-h-screen bg-gradient-to-b from-[#FFFACD] to-[#F0E68C]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-2">
            <Link href="/">
              <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 object-contain" loading="lazy" />
                <h1 className="hidden md:block text-3xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
                <h1 className="block md:hidden text-3xl font-bold text-[#d4af37]">GNOSIS AI</h1>
              </div>
            </Link>

            {/* Menu Hambúrguer (Desktop e Mobile) */}
            <MobileMenu
              isAuthenticated={isAuthenticated}
              onLogout={logout}
              loginUrl="/auth"
              user={user}
            />
          </div>
        </div>
      </header>

      {/* Plans Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1e3a5f] text-center mb-8">
          Planos e Preços
        </h1>

        {/* Billing Period Toggle */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-8 py-4 rounded-lg font-semibold transition-all text-lg ${billingPeriod === 'monthly'
              ? 'bg-[#1e3a5f] text-[#d4af37] shadow-lg scale-105'
              : 'bg-white/80 text-[#8b6f47] hover:bg-white'
              }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-8 py-4 rounded-lg font-semibold transition-all relative text-lg ${billingPeriod === 'yearly'
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

        <p className="text-lg md:text-xl text-[#8b6f47] text-center mb-12">
          * Créditos iniciais dos planos pagos são renovados a cada 30 dias
        </p>

        {/* Mensagem promocional */}
        {(!isAuthenticated || !activePlan || activePlan.plan.name === 'free') && (
          <div className="mb-12 text-center">
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
            <p className="blink-animation md:hidden text-xl font-bold text-red-600 bg-yellow-100 border-4 border-red-500 rounded-lg py-4 px-6 inline-block shadow-lg">
              🎉 VALORES PROMOCIONAIS DE LANÇAMENTO! 🎉
            </p>
          </div>
        )}

        {/* Plans Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f]" />
          </div>
        ) : (
          <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-2xl md:max-w-7xl mx-auto">
            {plansData?.map((plan: any) => {
              const isHighlight = plan.name === 'lumen';
              const isPremium = plan.name === 'premium';
              const isFree = plan.name === 'free';
              const priceDisplay = getDisplayPrice(plan);

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-10 md:p-8 shadow-2xl border-4 ${isHighlight
                    ? "bg-gradient-to-br from-[#d4af37] to-[#B8860B] border-[#1e3a5f]"
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
                  <h4 className={`text-3xl md:text-2xl font-bold mb-6 md:mb-4 ${isHighlight || isPremium ? "text-white" : "text-[#1e3a5f]"
                    }`}>
                    {plan.displayName}
                  </h4>
                  <div className="mb-8">
                    <span className={`text-5xl md:text-4xl font-bold ${isHighlight || isPremium ? "text-white" : "text-[#1e3a5f]"
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
                      <span className={`text-xl ${isHighlight || isPremium ? "text-white/80" : "text-[#8b6f47]"
                        }`}>
                        {getDisplayPeriod(plan)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-4 md:space-y-3 mb-8 md:mb-6">
                    <div className={`p-4 md:p-3 rounded-lg ${isHighlight || isPremium ? "bg-white/20" : "bg-[#FFFACD]"
                      }`}>
                      <p className={`font-semibold text-lg md:text-base ${isHighlight || isPremium ? "text-white" : "text-[#1e3a5f]"
                        }`}>
                        {plan.creditsInitial?.toLocaleString()} créditos iniciais{isFree ? "" : "*"}
                      </p>
                    </div>
                    <div className={`p-4 md:p-3 rounded-lg ${isHighlight || isPremium ? "bg-white/20" : "bg-[#FFFACD]"
                      }`}>
                      <p className={`font-semibold text-lg md:text-base ${isHighlight || isPremium ? "text-white" : "text-[#1e3a5f]"
                        }`}>
                        {plan.creditsDaily?.toLocaleString()} créditos/dia
                      </p>
                    </div>
                    <div className={`p-4 md:p-3 rounded-lg ${isHighlight || isPremium ? "bg-white/20" : "bg-[#FFFACD]"
                      }`}>
                      <p className={`font-semibold text-lg md:text-base ${isHighlight || isPremium ? "text-white" : "text-[#1e3a5f]"
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
                  <ul className="space-y-3 md:space-y-2 mb-8 md:mb-6 max-h-80 md:max-h-64 overflow-y-auto custom-scrollbar">
                    {toolsData?.map((tool: any, i: number) => {
                      const isAvailable = plan.toolIds?.includes(String(tool.id));
                      return (
                        <li key={i} className="flex items-start gap-2">
                          {isAvailable ? (
                            <CheckCircle2 className={`w-5 h-5 md:w-4 md:h-4 flex-shrink-0 mt-0.5 ${isHighlight || isPremium ? "text-green-400" : "text-green-600"
                              }`} />
                          ) : (
                            <span className={`w-5 h-5 md:w-4 md:h-4 flex-shrink-0 mt-0.5 text-red-500 font-bold text-lg md:text-base`}>×</span>
                          )}
                          <span className={`text-sm md:text-xs ${isHighlight || isPremium
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
                    className={`w-full text-lg md:text-base py-6 md:py-3 ${isHighlight
                      ? "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                      : isPremium
                        ? "bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B]"
                        : "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                      }`}
                  >
                    {isFree ? "Começar Grátis" : "Assinar Agora"}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Credit Packages Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-2xl md:max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] text-center mb-8">
            Ou recarregue com Créditos Avulsos
          </h2>
          <CreditPackages />
        </div>
      </section>
    </div>
  );
}
