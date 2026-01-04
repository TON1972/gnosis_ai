import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Coins, Crown, Sparkles, Gift } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface BuyCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

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

export default function BuyCreditsModal({ open, onClose }: BuyCreditsModalProps) {
  const { data: activePlan } = trpc.credits.activePlan.useQuery();
  const { data: allPlans } = trpc.plans.list.useQuery();
  const isFreeUser = !activePlan || activePlan.plan.name === "free";
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  
  const createSubscriptionCheckout = trpc.payments.createSubscriptionCheckout.useMutation();
  const createCreditsCheckout = trpc.payments.createCreditsCheckout.useMutation();
  
  const getPlanId = (planName: string) => {
    const fullName = planName === "GNOSIS Premium" ? `Plano ${planName}` : `Plano ${planName}`;
    const plan = allPlans?.find(p => p.displayName === fullName);
    return plan?.id || 0;
  };
  
  const getYearlyPrice = (monthly: number) => {
    const yearly = monthly * 12;
    const discount = yearly * 0.165;
    return (yearly - discount).toFixed(2);
  };
  
  const getDisplayPrice = (priceValue: number) => {
    if (billingPeriod === 'yearly') {
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
      const result = await createSubscriptionCheckout.mutateAsync({ planId, billingPeriod });
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
            Comprar Créditos Avulso
          </DialogTitle>
          <DialogDescription className="text-lg text-[#8b6f47] text-center">
            Escolha uma das opções abaixo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          {/* ORDEM INVERTIDA: Créditos Avulso PRIMEIRO */}
          <div>
            <h3 className="text-2xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6 text-[#d4af37]" />
              Pacotes de Créditos Avulso
            </h3>
            <p className="text-sm text-[#8b6f47] mb-4">
              <strong>Créditos avulsos nunca expiram</strong> e podem ser usados em qualquer plano!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BONUS_CREDITS.map((credit, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 shadow-lg border-3 ${
                    credit.bestValue
                      ? "bg-gradient-to-br from-[#d4af37] to-[#B8860B] border-[#1e3a5f] scale-105"
                      : "bg-white/90 border-[#d4af37]"
                  } relative`}
                >
                  {credit.bestValue && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-[#1e3a5f] text-[#d4af37] px-2 py-0.5 rounded-full text-xs font-bold">
                      MELHOR CUSTO
                    </div>
                  )}
                  {credit.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-[#1e3a5f] text-[#d4af37] px-2 py-0.5 rounded-full text-xs font-bold">
                      POPULAR
                    </div>
                  )}
                  <div className="text-center mb-3">
                    <Sparkles className={`w-6 h-6 mx-auto mb-1 ${credit.bestValue ? "text-white" : "text-[#d4af37]"}`} />
                    <p className={`text-2xl font-bold ${credit.bestValue ? "text-white" : "text-[#1e3a5f]"}`}>
                      {credit.amount.toLocaleString()}
                    </p>
                    <p className={`text-xs ${credit.bestValue ? "text-white/80" : "text-[#8b6f47]"}`}>
                      créditos
                    </p>
                  </div>
                  <div className="text-center mb-3">
                    <p className={`text-xl font-bold ${credit.bestValue ? "text-white" : "text-[#1e3a5f]"}`}>
                      {credit.price}
                    </p>
                    <p className={`text-xs ${credit.bestValue ? "text-white/70" : "text-[#8b6f47]"}`}>
                      {credit.pricePerCredit}/crédito
                    </p>
                  </div>
                  <Button
                    onClick={() => handleBuyCredits(credit.amount, parseFloat(credit.price.replace('R$ ', '').replace(',', '.')))}
                    className={`w-full ${
                      credit.bestValue
                        ? "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                        : "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                    }`}
                    size="sm"
                  >
                    Comprar
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Planos de Assinatura DEPOIS (apenas para usuários FREE) */}
          {isFreeUser && (
            <div>
              <h3 className="text-2xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
                <Crown className="w-6 h-6 text-[#d4af37]" />
                Ou Faça Upgrade do Seu Plano
              </h3>
              
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
              
              <div className="grid md:grid-cols-3 gap-4">
                {PLAN_UPGRADES.map((plan, index) => {
                  const planId = getPlanId(plan.name);
                  return (
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
                      <ul className={`space-y-2 mb-4 text-sm ${
                        plan.highlight || plan.premium ? "text-white/90" : "text-[#8b6f47]"
                      }`}>
                        <li>✓ {plan.creditsInitial}</li>
                        <li>✓ {plan.creditsDaily}</li>
                        <li>✓ {plan.tools}</li>
                      </ul>
                      <Button
                        onClick={() => handleSubscribe(planId)}
                        className={`w-full ${
                          plan.highlight
                            ? "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                            : plan.premium
                            ? "bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B]"
                            : "bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f]"
                        }`}
                      >
                        Assinar Agora
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Botão Sair discreto */}
          <div className="mt-6 flex justify-center">
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              SAIR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
