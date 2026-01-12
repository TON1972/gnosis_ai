import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Coins, Crown, Sparkles, Gift, CheckCircle2, Zap, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface BuyCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

const BONUS_CREDITS = [
  { amount: 1000, price: 9.90, label: "R$ 9,90" },
  { amount: 3000, price: 24.90, label: "R$ 24,90" },
  { amount: 6000, price: 39.90, label: "R$ 39,90" },
  { amount: 10000, price: 69.90, label: "R$ 69,90" },
];

export default function BuyCreditsModal({ open, onClose }: BuyCreditsModalProps) {
  const { data: allPlans, isLoading: isLoadingPlans } = trpc.plans.list.useQuery();
  const { data: allTools, isLoading: isLoadingTools } = trpc.tools.list.useQuery();
  const { data: activePlanData } = trpc.credits.activePlan.useQuery();

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [view, setView] = useState<'credits' | 'plans'>('credits');

  const createCheckout = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    },
    onError: (error) => {
      toast.error("Erro ao iniciar pagamento: " + error.message);
    }
  });

  useEffect(() => {
    if (open) {
      // Default to credits view as it's the "Buy Credits" modal
      setView('credits');
    }
  }, [open]);

  const formatPriceDisplay = (value: any) => {
    const numericValue = Number(value);
    if (isNaN(numericValue)) return "0,00";
    // O banco guarda em cents, então dividimos por 100
    const baseValue = billingPeriod === 'yearly' ? (numericValue / 12) : numericValue;
    return (baseValue / 100).toFixed(2).replace('.', ',');
  };

  const isLoading = isLoadingPlans || isLoadingTools;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] md:max-w-7xl h-[95vh] md:h-auto md:max-h-[92vh] overflow-y-auto bg-gradient-to-br from-[#FFFACD] to-[#F0E68C] border-4 border-[#d4af37] p-4 md:p-8 custom-scrollbar">
        <DialogHeader className="p-4 text-center">
          <DialogTitle className="text-xl md:text-3xl font-black text-[#1e3a5f] flex items-center justify-center gap-2">
            <Coins className="w-8 h-8 md:w-10 md:h-10 text-[#d4af37]" />
            Comprar Créditos Avulso
          </DialogTitle>
          <DialogDescription className="text-base md:text-lg text-[#8b6f47] text-center">
            Escolha uma das opções abaixo para impulsionar seus estudos
          </DialogDescription>
        </DialogHeader>

        {/* SELETOR DE ABAS */}
        <div className="flex justify-center gap-2 mb-8 px-4">
          <Button
            onClick={() => setView('credits')}
            className={`flex-1 md:w-48 font-bold rounded-xl transition-all h-12 border-2 ${view === 'credits' ? 'bg-[#1e3a5f] text-[#d4af37] border-[#1e3a5f] shadow-lg scale-105' : 'bg-white/50 text-[#1e3a5f] border-[#d4af37]/20'}`}
          >
            <Gift className="w-4 h-4 mr-2" /> Avulsos
          </Button>
          <Button
            onClick={() => setView('plans')}
            className={`flex-1 md:w-48 font-bold rounded-xl transition-all h-12 border-2 ${view === 'plans' ? 'bg-[#1e3a5f] text-[#d4af37] border-[#1e3a5f] shadow-lg scale-105' : 'bg-white/50 text-[#1e3a5f] border-[#d4af37]/20'}`}
          >
            <Crown className="w-4 h-4 mr-2" /> Assinaturas
          </Button>
        </div>

        <div className="space-y-8 px-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f]" />
              <p className="mt-4 font-bold text-[#1e3a5f]">Carregando ofertas...</p>
            </div>
          ) : view === 'plans' ? (
            /* CONTEÚDO DE PLANOS */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-center items-center gap-4 mb-8">
                <button onClick={() => setBillingPeriod('monthly')} className={`px-6 py-2 rounded-full font-bold text-sm border-2 transition-all ${billingPeriod === 'monthly' ? 'bg-[#1e3a5f] text-[#d4af37] border-[#1e3a5f]' : 'bg-white/50 text-[#1e3a5f] border-[#d4af37]'}`}>Mensal</button>
                <button onClick={() => setBillingPeriod('yearly')} className={`px-6 py-2 rounded-full font-bold text-sm border-2 relative transition-all ${billingPeriod === 'yearly' ? 'bg-[#1e3a5f] text-[#d4af37] border-[#1e3a5f]' : 'bg-white/50 text-[#1e3a5f] border-[#d4af37]'}`}>
                  Anual <span className="absolute -top-3 -right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-md">-16,5%</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {allPlans?.map((plan: any) => {
                  const isActive = String(activePlanData?.plan?.id) === String(plan.id);
                  const isLumen = plan.name === 'lumen';
                  const isProcessing = createCheckout.isPending && createCheckout.variables?.id === String(plan.id);
                  const price = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;

                  return (
                    <div key={plan.id} className={`relative flex flex-col rounded-2xl p-5 border-4 shadow-xl transition-all ${isLumen ? 'bg-[#1e3a5f] border-[#d4af37] text-white ring-4 ring-[#d4af37]/20' : 'bg-white border-[#d4af37]/40 text-[#1e3a5f]'}`}>
                      {isActive && <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full z-20 shadow-md">ATIVO</div>}
                      <h4 className="text-lg font-black uppercase tracking-tight">{plan.displayName}</h4>
                      <div className="flex items-baseline gap-1 mt-2 mb-4">
                        <span className={`text-3xl font-black ${isLumen ? 'text-[#d4af37]' : 'text-[#1e3a5f]'}`}>R$ {formatPriceDisplay(price)}</span>
                        <span className="text-[10px] font-bold opacity-70">/mês</span>
                      </div>
                      <div className={`space-y-2 mb-4 p-3 rounded-xl ${isLumen ? 'bg-white/10' : 'bg-[#FFFACD]/50'}`}>
                        <p className="text-[11px] font-bold flex items-center gap-2"><Zap className="w-3 h-3" /> {Number(plan.creditsInitial).toLocaleString()} iniciais</p>
                        <p className="text-[11px] font-bold flex items-center gap-2"><Sparkles className="w-3 h-3" /> {Number(plan.creditsDaily).toLocaleString()}/dia</p>
                      </div>
                      <div className="flex-1 mb-6 space-y-1.5 overflow-y-auto max-h-48 pr-1 custom-scrollbar text-[10px]">
                        {allTools?.map((tool: any) => {
                          const hasTool = plan.toolIds?.includes(String(tool.id));
                          return (
                            <div key={tool.id} className="flex items-start gap-2">
                              {hasTool ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" /> : <span className="text-red-500 font-bold text-[10px] w-3 text-center shrink-0">×</span>}
                              <span className={`leading-tight font-medium ${hasTool ? 'opacity-100' : 'opacity-40'}`}>{tool.displayName}</span>
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        onClick={() => !isActive && createCheckout.mutate({
                          type: 'plan',
                          id: String(plan.id),
                          price: price / 100,
                          title: `Plano ${plan.displayName} - Gnosis AI`,
                          billingPeriod
                        })}
                        disabled={isActive || createCheckout.isPending || plan.name === 'free'}
                        className={`w-full font-black py-5 rounded-xl transition-all shadow-md active:scale-95 ${isActive ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-none' : isLumen ? 'bg-[#d4af37] text-[#1e3a5f] hover:bg-white' : 'bg-[#1e3a5f] text-white'}`}
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : isActive ? 'PLANO ATUAL' : plan.name === 'free' ? 'PLANO BASE' : 'ASSINAR AGORA'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* CONTEÚDO DE CRÉDITOS AVULSOS */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {BONUS_CREDITS.map((credit, index) => {
                const isProcessing = createCheckout.isPending && createCheckout.variables?.id === String(credit.amount);
                return (
                  <div key={index} className="p-4 md:p-6 rounded-2xl border-4 text-center transition-all flex flex-col items-center bg-white border-[#d4af37]/20 shadow-md hover:border-[#d4af37] hover:shadow-xl group">
                    <Sparkles className="w-8 h-8 mb-2 text-[#d4af37] group-hover:scale-125 transition-transform" />
                    <h5 className="text-2xl font-black text-[#1e3a5f]">{credit.amount.toLocaleString('pt-BR')}</h5>
                    <p className="text-[10px] uppercase font-bold opacity-60 mb-4 text-[#8b6f47]">Créditos</p>
                    <div className="mt-auto w-full">
                      <p className="text-xl font-black mb-4 text-[#1e3a5f]">{credit.label}</p>
                      <Button
                        onClick={() => createCheckout.mutate({
                          type: 'credits',
                          id: String(credit.amount),
                          price: credit.price,
                          title: `Recarga de ${credit.amount} créditos - Gnosis AI`
                        })}
                        disabled={createCheckout.isPending}
                        className="w-full font-bold text-xs bg-[#1e3a5f] text-white active:scale-95 transition-all hover:bg-[#d4af37] hover:text-[#1e3a5f]"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'COMPRAR'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-center pt-8">
          <Button variant="ghost" onClick={onClose} className="text-[#1e3a5f] font-bold hover:bg-[#d4af37]/10 px-8 py-2 rounded-lg transition-all">Fechar</Button>
        </div>
      </DialogContent>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }`}</style>
    </Dialog>
  );
}
