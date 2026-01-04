import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Coins, Crown, Sparkles, Gift, ArrowRight, CheckCircle2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface NoCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

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

const PLAN_UPGRADES = [
  {
    name: "Aliança",
    price: "R$ 19,98",
    priceValue: 19.98,
    period: "/mês",
    creditsInitial: "1.500 créditos iniciais",
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
    creditsInitial: "3.000 créditos iniciais",
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
    creditsInitial: "6.000 créditos iniciais",
    creditsDaily: "300 créditos/dia",
    tools: "Todas as 19 ferramentas",
    planKey: "premium" as const,
    highlight: false,
    premium: true
  }
];

const BONUS_CREDITS = [
  { amount: 500, price: "R$ 9,90", pricePerCredit: "R$ 0,0198" },
  { amount: 1500, price: "R$ 24,90", pricePerCredit: "R$ 0,0166", popular: true },
  { amount: 2500, price: "R$ 39,90", pricePerCredit: "R$ 0,0160" },
  { amount: 5000, price: "R$ 69,90", pricePerCredit: "R$ 0,0140", bestValue: true },
];

export default function NoCreditsModal({ open, onClose }: NoCreditsModalProps) {
  const { data: activePlan } = trpc.credits.activePlan.useQuery();
  const { data: allPlans } = trpc.plans.list.useQuery();
  const isFreeUser = !activePlan || activePlan.plan.name === "free";
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  // Removido paymentType - assinaturas agora só aceitam renovação automática (cartão)
  
  const createSubscriptionCheckout = trpc.payments.createSubscriptionCheckout.useMutation();
  // Removido createManualPaymentCheckout - assinaturas agora só aceitam renovação automática
  const createCreditsCheckout = trpc.payments.createCreditsCheckout.useMutation();
  
  // Map plan names to IDs from database
  const getPlanId = (planName: string) => {
    // Add "Plano" prefix to match database displayName
    const fullName = planName === "GNOSIS Premium" ? `Plano ${planName}` : `Plano ${planName}`;
    const plan = allPlans?.find(p => p.displayName === fullName);
    return plan?.id || 0;
  };
  
  // Calcula preço anual com 16,5% desconto
  const getYearlyPrice = (monthly: number) => {
    const yearly = monthly * 12;
    const discount = yearly * 0.165;
    return (yearly - discount).toFixed(2);
  };
  
  const getDisplayPrice = (priceValue: number) => {
    if (billingPeriod === 'yearly') {
      // Calcula valor mensal COM desconto de 16,5%
      const yearlyTotal = parseFloat(getYearlyPrice(priceValue));
      const monthlyWithDiscount = (yearlyTotal / 12).toFixed(2).replace('.', ',');
      return { main: `R$ ${monthlyWithDiscount}`, multiplier: 'x 12' };
    }
    return { main: `R$ ${priceValue.toFixed(2).replace('.', ',')}`, multiplier: null };
  };
  
  const getDisplayPeriod = () => {
    return billingPeriod === 'yearly' ? '/ano' : '/mês';
  };
  
  const handleSubscribe = async (planId: number) => {
    try {
      // Assinaturas agora só aceitam renovação automática (cartão de crédito)
      const result = await createSubscriptionCheckout.mutateAsync({ planId, billingPeriod });
      
      // Redirecionar para checkout do Mercado Pago
      if (result.init_point) {
        window.location.href = result.init_point;
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };
  
  const handleBuyCredits = async (credits: number, price: number) => {
    try {
      const result = await createCreditsCheckout.mutateAsync({ credits, price });
      // Redirecionar para checkout do Mercado Pago
      if (result.init_point) {
        window.location.href = result.init_point;
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#FFFACD] to-[#F0E68C] border-4 border-[#d4af37]">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-[#1e3a5f] text-center">
            <Coins className="w-10 h-10 inline-block mr-3 text-[#d4af37]" />
            Seus Créditos Acabaram!
          </DialogTitle>
          <DialogDescription className="text-lg text-[#8b6f47] text-center">
            Escolha uma das opções abaixo para continuar usando a GNOSIS AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          {/* Plan Upgrades (only for FREE users) */}
          {isFreeUser && (
            <div>
              <h3 className="text-2xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
                <Crown className="w-6 h-6 text-[#d4af37]" />
                Faça Upgrade do Seu Plano
              </h3>
              
              {/* Period Toggle - Apenas Mensal/Anual (Renovação Automática) */}
              <div className="flex justify-center items-center gap-3 mb-6">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    billingPeriod === 'monthly'
                      ? 'bg-[#1e3a5f] text-[#d4af37] shadow-lg'
                      : 'bg-white/80 text-[#8b6f47] hover:bg-white'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all relative ${
                    billingPeriod === 'yearly'
                      ? 'bg-[#1e3a5f] text-[#d4af37] shadow-lg'
                      : 'bg-white/80 text-[#8b6f47] hover:bg-white'
                  }`}
                >
                  Anual
                  <span className="absolute -top-1 -right-1 bg-[#d4af37] text-[#1e3a5f] text-xs px-1.5 py-0.5 rounded-full font-bold">
                    -16,5%
                  </span>
                </button>
              </div>
              
              {/* Mensagem promocional - apenas para usuários FREE */}
              {isFreeUser && (
                <div className="mb-6 text-center">
                  <style>{`
                    @keyframes blink {
                      0%, 100% { opacity: 1; }
                      50% { opacity: 0.3; }
                    }
                    .blink-animation {
                      animation: blink 1.5s ease-in-out infinite;
                    }
                  `}</style>
                  <p className="blink-animation text-lg md:text-xl font-bold text-red-600 bg-yellow-100 border-4 border-red-500 rounded-lg py-3 px-4 inline-block shadow-lg">
                    🎉 ESSES SÃO VALORES PROMOCIONAIS DE FINAL DE ANO, APROVEITE A OPORTUNIDADE! 🎉
                  </p>
                </div>
              )}
              
              <div className="grid md:grid-cols-3 gap-4">
                {PLAN_UPGRADES.map((plan, index) => (
                  <div
                    key={index}
                    className={`rounded-xl p-6 shadow-lg border-3 ${
                      plan.highlight
                        ? "bg-gradient-to-br from-[#d4af37] to-[#B8860B] border-[#1e3a5f] scale-105"
                        : plan.premium
                        ? "bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] border-[#d4af37]"
                        : "bg-white/90 border-[#d4af37]"
                    } relative`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#1e3a5f] text-[#d4af37] px-3 py-1 rounded-full text-xs font-bold">
                        RECOMENDADO
                      </div>
                    )}
                    <h4 className={`text-xl font-bold mb-3 ${
                      plan.highlight || plan.premium ? "text-white" : "text-[#1e3a5f]"
                    }`}>
                      {plan.name}
                    </h4>
                    <div className="mb-4">
                      <span className={`text-3xl font-bold ${
                        plan.highlight || plan.premium ? "text-white" : "text-[#1e3a5f]"
                      }`}>
                        {getDisplayPrice(plan.priceValue).main}
                      </span>
                      {getDisplayPrice(plan.priceValue).multiplier && (
                        <span className={`text-sm ml-1 ${
                          plan.highlight || plan.premium ? "text-white/60" : "text-[#8b6f47]/60"
                        }`}>
                          {getDisplayPrice(plan.priceValue).multiplier}
                        </span>
                      )}
                      <span className={`text-sm ${
                        plan.highlight || plan.premium ? "text-white/80" : "text-[#8b6f47]"
                      }`}>
                        {getDisplayPeriod()}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className={`text-sm font-semibold ${
                        plan.highlight || plan.premium ? "text-white" : "text-[#1e3a5f]"
                      }`}>
                        {plan.creditsInitial}
                      </p>
                      <p className={`text-sm font-semibold ${
                        plan.highlight || plan.premium ? "text-white" : "text-[#1e3a5f]"
                      }`}>
                        {plan.creditsDaily}
                      </p>
                      <p className={`text-sm font-semibold ${
                        plan.highlight || plan.premium ? "text-white" : "text-[#1e3a5f]"
                      }`}>
                        {plan.tools}
                      </p>
                    </div>
                    <ul className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                      {allTools.map((tool, i) => {
                        const isAvailable = tool[plan.planKey];
                        return (
                          <li key={i} className="flex items-start gap-2">
                            {isAvailable ? (
                              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                plan.highlight || plan.premium ? "text-green-400" : "text-green-600"
                              }`} />
                            ) : (
                              <span className={`w-4 h-4 flex-shrink-0 mt-0.5 text-red-500 font-bold`}>×</span>
                            )}
                            <span className={`text-xs ${
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
                      onClick={() => handleSubscribe(getPlanId(plan.name))}
                      disabled={createSubscriptionCheckout.isPending}
                      className={`w-full ${
                        plan.highlight
                          ? "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                          : plan.premium
                          ? "bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B]"
                          : "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                      }`}
                    >
                      {createSubscriptionCheckout.isPending ? 'Processando...' : 'Assinar Agora'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bonus Credits */}
          <div>
            <h3 className="text-2xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6 text-[#d4af37]" />
              Ou Compre Créditos Avulsos (Permanentes)
            </h3>
            <p className="text-sm text-[#8b6f47] mb-4">
              Créditos avulsos <strong>nunca expiram</strong> e podem ser usados em qualquer plano!
            </p>
            {/* PIX Message */}
            <div className="mb-4 bg-green-500 text-white px-4 py-2 rounded-lg text-center shadow-lg">
              <p className="text-sm md:text-base font-bold">
                💸 OPÇÃO DE COMPRA DE CRÉDITOS AVULSO POR PIX LIBERADO, MAIS RÁPIDO E PRÁTICO!
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {BONUS_CREDITS.map((credit, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 shadow-lg border-3 ${
                    credit.bestValue
                      ? "bg-gradient-to-br from-[#d4af37] to-[#B8860B] border-[#1e3a5f]"
                      : credit.popular
                      ? "bg-white/95 border-[#d4af37] border-4"
                      : "bg-white/90 border-[#d4af37]"
                  } relative`}
                >
                  {credit.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#d4af37] text-[#1e3a5f] px-3 py-1 rounded-full text-xs font-bold">
                      POPULAR
                    </div>
                  )}
                  {credit.bestValue && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#1e3a5f] text-[#d4af37] px-3 py-1 rounded-full text-xs font-bold">
                      MELHOR VALOR
                    </div>
                  )}
                  <div className="text-center mb-4">
                    <Sparkles className={`w-8 h-8 mx-auto mb-2 ${
                      credit.bestValue ? "text-white" : "text-[#d4af37]"
                    }`} />
                    <p className={`text-3xl font-bold ${
                      credit.bestValue ? "text-white" : "text-[#1e3a5f]"
                    }`}>
                      {credit.amount.toLocaleString('pt-BR')}
                    </p>
                    <p className={`text-sm ${
                      credit.bestValue ? "text-white/80" : "text-[#8b6f47]"
                    }`}>
                      créditos
                    </p>
                  </div>
                  <div className="text-center mb-4">
                    <p className={`text-2xl font-bold ${
                      credit.bestValue ? "text-white" : "text-[#1e3a5f]"
                    }`}>
                      {credit.price}
                    </p>
                    <p className={`text-xs ${
                      credit.bestValue ? "text-white/70" : "text-[#8b6f47]"
                    }`}>
                      {credit.pricePerCredit}/crédito
                    </p>
                  </div>
                  <Button
                    onClick={() => handleBuyCredits(credit.amount, parseFloat(credit.price.replace('R$ ', '').replace(',', '.')))}
                    disabled={createCreditsCheckout.isPending}
                    className={`w-full ${
                      credit.bestValue
                        ? "bg-white text-[#1e3a5f] hover:bg-gray-100"
                        : "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                    }`}
                  >
                    {createCreditsCheckout.isPending ? 'Processando...' : 'Comprar'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <div className="text-center pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-[#d4af37] text-[#1e3a5f] hover:bg-[#d4af37] hover:text-white"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

