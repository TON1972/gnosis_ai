import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { CheckCircle2, Crown } from "lucide-react";
import MobileMenu from "@/components/MobileMenu";

export default function PlanosPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  
  // Scroll para o topo quando a página carregar (método robusto)
  useEffect(() => {
    // Método 1: Scroll imediato
    window.scrollTo(0, 0);
    // Método 2: Forçar scroll após pequeno delay
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);
  
  const { data: activePlan } = trpc.plans.getActivePlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const plans = [
    {
      name: "FREE",
      price: "Gratuito",
      priceValue: 0,
      creditsInitial: "500 créditos iniciais",
      creditsDaily: "50 créditos/dia",
      tools: "6 de 19 ferramentas disponíveis",
      planKey: "free" as const,
      highlight: false
    },
    {
      name: "Aliança",
      price: "R$ 19,98",
      priceValue: 19.98,
      period: "/mês",
      creditsInitial: "1.500 créditos iniciais*",
      creditsDaily: "100 créditos/dia",
      tools: "10 de 19 ferramentas disponíveis",
      planKey: "alianca" as const,
      highlight: false
    },
    {
      name: "Lumen",
      price: "R$ 36,98",
      priceValue: 36.98,
      period: "/mês",
      creditsInitial: "3.000 créditos iniciais*",
      creditsDaily: "200 créditos/dia",
      tools: "Todas as 19 ferramentas",
      planKey: "lumen" as const,
      highlight: true
    },
    {
      name: "GNOSIS Premium",
      price: "R$ 68,98",
      priceValue: 68.98,
      period: "/mês",
      creditsInitial: "6.000 créditos iniciais*",
      creditsDaily: "300 créditos/dia",
      tools: "Todas as 19 ferramentas",
      planKey: "premium" as const,
      highlight: false,
      premium: true
    }
  ];

  const allTools = [
    { name: "Hermenêutica", free: true, alianca: true, lumen: true, premium: true },
    { name: "Traduções", free: true, alianca: true, lumen: true, premium: true },
    { name: "Resumos", free: true, alianca: true, lumen: true, premium: true },
    { name: "Esboços de Pregação", free: true, alianca: true, lumen: true, premium: true },
    { name: "Estudos Doutrinários", free: true, alianca: true, lumen: true, premium: true },
    { name: "Análise Teológica Comparada", free: true, alianca: true, lumen: true, premium: true },
    { name: "Teologia Sistemática", free: false, alianca: true, lumen: true, premium: true },
    { name: "Contextualização Brasileira", free: false, alianca: true, lumen: true, premium: true },
    { name: "Exegese Avançada", free: false, alianca: false, lumen: true, premium: true },
    { name: "Religiões Comparadas", free: false, alianca: true, lumen: true, premium: true },
    { name: "Referências ABNT/APA", free: false, alianca: false, lumen: true, premium: true },
    { name: "Linguagem Ministerial", free: false, alianca: true, lumen: true, premium: true },
    { name: "Redação Acadêmica", free: false, alianca: false, lumen: true, premium: true },
    { name: "Dados Demográficos", free: false, alianca: false, lumen: true, premium: true },
    { name: "Transcrição de Mídia", free: false, alianca: false, lumen: true, premium: true },
    { name: "Patrística", free: false, alianca: false, lumen: true, premium: true },
    { name: "Linha do Tempo Teológica", free: false, alianca: false, lumen: true, premium: true },
    { name: "Apologética Avançada", free: false, alianca: false, lumen: true, premium: true },
    { name: "Escatologia Bíblica", free: false, alianca: false, lumen: true, premium: true },
  ];

  // Calcula preço anual com 16,5% desconto
  const getYearlyPrice = (monthly: number) => {
    const yearly = monthly * 12;
    const discount = yearly * 0.165;
    return (yearly - discount).toFixed(2);
  };
  
  const getDisplayPrice = (plan: typeof plans[number]) => {
    if (plan.priceValue === 0) return { main: plan.price, multiplier: null };
    if (billingPeriod === 'yearly') {
      // Calcula valor mensal COM desconto de 16,5%
      const yearlyTotal = parseFloat(getYearlyPrice(plan.priceValue));
      const monthlyWithDiscount = (yearlyTotal / 12).toFixed(2).replace('.', ',');
      return { main: `R$ ${monthlyWithDiscount}`, multiplier: 'x 12' };
    }
    return { main: plan.price, multiplier: null };
  };
  
  const getDisplayPeriod = (plan: typeof plans[number]) => {
    if (plan.priceValue === 0) return '';
    return billingPeriod === 'yearly' ? '/ano' : '/mês';
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
            className={`px-8 py-4 rounded-lg font-semibold transition-all text-lg ${
              billingPeriod === 'monthly'
                ? 'bg-[#1e3a5f] text-[#d4af37] shadow-lg scale-105'
                : 'bg-white/80 text-[#8b6f47] hover:bg-white'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-8 py-4 rounded-lg font-semibold transition-all relative text-lg ${
              billingPeriod === 'yearly'
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
            <p className="blink-animation text-xl md:text-2xl font-bold text-red-600 bg-yellow-100 border-4 border-red-500 rounded-lg py-4 px-6 inline-block shadow-lg">
              🎉 ESSES SÃO VALORES PROMOCIONAIS DE FINAL DE ANO, APROVEITE A OPORTUNIDADE! 🎉
            </p>
          </div>
        )}
        
        {/* Plans Grid - Mobile: 1 coluna / Desktop: 4 colunas */}
        <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-2xl md:max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-10 md:p-8 shadow-2xl border-4 ${
                plan.highlight
                  ? "bg-gradient-to-br from-[#d4af37] to-[#B8860B] border-[#1e3a5f]"
                  : plan.premium
                  ? "bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] border-[#d4af37]"
                  : "bg-white/90 border-[#d4af37]"
              } hover:scale-105 transition-transform relative`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 bg-[#1e3a5f] text-[#d4af37] px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-bold whitespace-nowrap">
                  MAIS POPULAR
                </div>
              )}
              {plan.premium && (
                <div className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 bg-[#d4af37] text-[#1e3a5f] px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-bold flex items-center gap-1 whitespace-nowrap">
                  <Crown className="w-3 h-3 md:w-4 md:h-4" />
                  PREMIUM
                </div>
              )}
              <h4 className={`text-3xl md:text-2xl font-bold mb-6 md:mb-4 ${
                plan.highlight || plan.premium ? "text-white" : "text-[#1e3a5f]"
              }`}>
                {plan.name}
              </h4>
              <div className="mb-8">
                <span className={`text-5xl md:text-4xl font-bold ${
                  plan.highlight || plan.premium ? "text-white" : "text-[#1e3a5f]"
                }`}>
                  {getDisplayPrice(plan).main}
                </span>
                {getDisplayPrice(plan).multiplier && (
                  <span className={`text-lg ml-1 ${
                    plan.highlight || plan.premium ? "text-white/60" : "text-[#8b6f47]/60"
                  }`}>
                    {getDisplayPrice(plan).multiplier}
                  </span>
                )}
                {plan.priceValue > 0 && (
                  <span className={`text-xl ${
                    plan.highlight || plan.premium ? "text-white/80" : "text-[#8b6f47]"
                  }`}>
                    {getDisplayPeriod(plan)}
                  </span>
                )}
              </div>
              <div className="space-y-4 md:space-y-3 mb-8 md:mb-6">
                <div className={`p-4 md:p-3 rounded-lg ${
                  plan.highlight || plan.premium ? "bg-white/20" : "bg-[#FFFACD]"
                }`}>
                  <p className={`font-semibold text-lg md:text-base ${
                    plan.highlight || plan.premium ? "text-white" : "text-[#1e3a5f]"
                  }`}>
                    {plan.creditsInitial}
                  </p>
                </div>
                <div className={`p-4 md:p-3 rounded-lg ${
                  plan.highlight || plan.premium ? "bg-white/20" : "bg-[#FFFACD]"
                }`}>
                  <p className={`font-semibold text-lg md:text-base ${
                    plan.highlight || plan.premium ? "text-white" : "text-[#1e3a5f]"
                  }`}>
                    {plan.creditsDaily}
                  </p>
                </div>
                <div className={`p-4 md:p-3 rounded-lg ${
                  plan.highlight || plan.premium ? "bg-white/20" : "bg-[#FFFACD]"
                }`}>
                  <p className={`font-semibold text-lg md:text-base ${
                    plan.highlight || plan.premium ? "text-white" : "text-[#1e3a5f]"
                  }`}>
                    {plan.tools}
                  </p>
                </div>
              </div>
              <ul className="space-y-3 md:space-y-2 mb-8 md:mb-6 max-h-80 md:max-h-64 overflow-y-auto">
                {allTools.map((tool, i) => {
                  const isAvailable = tool[plan.planKey];
                  return (
                    <li key={i} className="flex items-start gap-2">
                      {isAvailable ? (
                        <CheckCircle2 className={`w-5 h-5 md:w-4 md:h-4 flex-shrink-0 mt-0.5 ${
                          plan.highlight || plan.premium ? "text-green-400" : "text-green-600"
                        }`} />
                      ) : (
                        <span className={`w-5 h-5 md:w-4 md:h-4 flex-shrink-0 mt-0.5 text-red-500 font-bold text-lg md:text-base`}>×</span>
                      )}
                      <span className={`text-sm md:text-xs ${
                        plan.highlight || plan.premium 
                          ? isAvailable ? "text-white" : "text-white/50"
                          : isAvailable ? "text-[#1e3a5f]" : "text-gray-400"
                      }`}>
                        {tool.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Button
                onClick={() => {
                  if (plan.priceValue === 0) {
                    window.location.href = "/auth";
                  } else {
                    window.location.href = "/auth";
                  }
                }}
                className={`w-full text-lg md:text-base py-6 md:py-3 ${
                  plan.highlight
                    ? "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                    : plan.premium
                    ? "bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B]"
                    : "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                }`}
              >
                {plan.priceValue === 0 ? "Começar Grátis" : "Assinar Agora"}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

