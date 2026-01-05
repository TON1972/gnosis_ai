import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Crown, Sparkles, Gift, CheckCircle2, Zap, Rocket, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

interface NoCreditsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'plans' | 'credits'; 
}

const BONUS_CREDITS = [
  { amount: 500, price: "R$ 9,90" },
  { amount: 1500, price: "R$ 24,90" },
  { amount: 2500, price: "R$ 39,90" },
  { amount: 5000, price: "R$ 69,90" },
];

export default function NoCreditsModal({ open, onClose, initialTab = 'plans' }: NoCreditsModalProps) {
  const utils = trpc.useUtils();
  const { data: allPlans, isLoading: isLoadingPlans } = trpc.plans.list.useQuery();
  const { data: allTools, isLoading: isLoadingTools } = trpc.tools.list.useQuery();
  const { data: activePlanData } = trpc.credits.activePlan.useQuery();
  
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [view, setView] = useState<'plans' | 'credits'>(initialTab);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createSubscriptionCheckout = trpc.payments.createSubscriptionCheckout.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(`Plano alterado para ${data.newPlanName} com sucesso!`);
      utils.credits.balance.invalidate();
      utils.credits.activePlan.invalidate();
    }
  });

  const createCreditsCheckout = trpc.payments.createCreditsCheckout.useMutation({
    onSuccess: () => {
      setSuccessMessage("Créditos avulsos adicionados com sucesso!");
      utils.credits.balance.invalidate();
    }
  });

  useEffect(() => {
    if (open) {
      setView(initialTab);
      setSuccessMessage(null);
    }
  }, [open, initialTab]);

  const formatPrice = (value: any) => {
    const numericValue = Number(value);
    if (isNaN(numericValue)) return "0,00";
    const baseValue = billingPeriod === 'yearly' ? (numericValue / 12) : numericValue;
    return (baseValue / 100).toFixed(2).replace('.', ',');
  };

  if (isLoadingPlans || isLoadingTools) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] md:max-w-7xl h-[95vh] md:h-auto md:max-h-[92vh] overflow-y-auto bg-gradient-to-br from-[#FFFACD] to-[#F0E68C] border-4 border-[#d4af37] p-4 md:p-8 custom-scrollbar">
        
        {successMessage ? (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-300">
            <div className="bg-green-500 p-4 rounded-full mb-6 shadow-lg">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-3xl font-black text-[#1e3a5f] mb-4">Sucesso!</h2>
            <p className="text-lg text-[#8b6f47] mb-8">{successMessage}</p>
            <Button onClick={onClose} className="bg-[#1e3a5f] text-[#d4af37] font-bold px-12 py-6 rounded-xl shadow-xl">Voltar ao Painel</Button>
          </div>
        ) : (
          <>
            <DialogHeader className="p-4 text-center">
              <DialogTitle className="text-xl md:text-3xl font-black text-[#1e3a5f] flex items-center justify-center gap-2">
                <Rocket className="w-8 h-8 text-[#d4af37]" /> IMPULSIONE SUA TEOLOGIA
              </DialogTitle>
            </DialogHeader>

            <div className="flex justify-center gap-2 mb-8 px-4">
              <Button onClick={() => setView('plans')} className={`flex-1 md:w-48 font-bold rounded-xl transition-all ${view === 'plans' ? 'bg-[#1e3a5f] text-[#d4af37] shadow-lg scale-105' : 'bg-white/50 text-[#1e3a5f]'}`}>
                <Crown className="w-4 h-4 mr-2" /> Assinaturas
              </Button>
              <Button onClick={() => setView('credits')} className={`flex-1 md:w-48 font-bold rounded-xl transition-all ${view === 'credits' ? 'bg-[#1e3a5f] text-[#d4af37] shadow-lg scale-105' : 'bg-white/50 text-[#1e3a5f]'}`}>
                <Gift className="w-4 h-4 mr-2" /> Avulsos
              </Button>
            </div>

            <div className="space-y-8 px-2">
              {view === 'plans' ? (
                <div className="animate-in fade-in duration-300">
                   <div className="flex justify-center items-center gap-4 mb-8">
                    <button onClick={() => setBillingPeriod('monthly')} className={`px-6 py-2 rounded-full font-bold text-sm border-2 transition-all ${billingPeriod === 'monthly' ? 'bg-[#1e3a5f] text-[#d4af37] border-[#1e3a5f]' : 'bg-white/50 text-[#1e3a5f] border-[#d4af37]'}`}>Mensal</button>
                    <button onClick={() => setBillingPeriod('yearly')} className={`px-6 py-2 rounded-full font-bold text-sm border-2 relative transition-all ${billingPeriod === 'yearly' ? 'bg-[#1e3a5f] text-[#d4af37] border-[#1e3a5f]' : 'bg-white/50 text-[#1e3a5f] border-[#d4af37]'}`}>
                      Anual <span className="absolute -top-3 -right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">-16,5%</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {allPlans?.map((plan: any) => {
                      const isActive = String(activePlanData?.plan?.id) === String(plan.id);
                      const isLumen = plan.name === 'lumen';
                      const isProcessing = createSubscriptionCheckout.isPending && createSubscriptionCheckout.variables?.planId === plan.id;
                      
                      return (
                        <div key={plan.id} className={`relative flex flex-col rounded-2xl p-5 border-4 shadow-xl ${isLumen ? 'bg-[#1e3a5f] border-[#d4af37] text-white ring-4 ring-[#d4af37]/20' : 'bg-white border-[#d4af37]/40 text-[#1e3a5f]'}`}>
                          {isActive && <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full z-20">ATIVO</div>}
                          <h4 className="text-lg font-black uppercase tracking-tight">{plan.displayName}</h4>
                          <div className="flex items-baseline gap-1 mt-2 mb-4">
                            <span className={`text-3xl font-black ${isLumen ? 'text-[#d4af37]' : 'text-[#1e3a5f]'}`}>R$ {formatPrice(billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly)}</span>
                            <span className="text-[10px] font-bold opacity-70">/mês</span>
                          </div>
                          <div className={`space-y-2 mb-4 p-3 rounded-xl ${isLumen ? 'bg-white/10' : 'bg-[#FFFACD]/50'}`}>
                            <p className="text-[11px] font-bold flex items-center gap-2"><Zap className="w-3 h-3" /> {Number(plan.creditsInitial).toLocaleString()} iniciais</p>
                            <p className="text-[11px] font-bold flex items-center gap-2"><Sparkles className="w-3 h-3" /> {Number(plan.creditsDaily).toLocaleString()}/dia</p>
                          </div>
                          <div className="flex-1 mb-6 space-y-1.5 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
                            {allTools?.map((tool: any) => {
                              const hasTool = plan.toolIds?.includes(String(tool.id));
                              return (
                                <div key={tool.id} className="flex items-start gap-2">
                                  {hasTool ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" /> : <span className="text-red-500 font-bold text-[10px] w-3 text-center shrink-0">×</span>}
                                  <span className={`text-[10px] leading-tight font-medium ${hasTool ? 'opacity-100' : 'opacity-40'}`}>{tool.displayName}</span>
                                </div>
                              );
                            })}
                          </div>
                          <Button 
                            onClick={() => !isActive && createSubscriptionCheckout.mutate({ planId: plan.id, billingPeriod })} 
                            disabled={isActive || createSubscriptionCheckout.isPending || plan.name === 'free'} 
                            className={`w-full font-black py-5 rounded-xl transition-all shadow-md active:scale-95 ${isActive ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-none' : isLumen ? 'bg-[#d4af37] text-[#1e3a5f] hover:bg-white' : 'bg-[#1e3a5f] text-white'}`}
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : isActive ? 'PLANO ATUAL' : plan.name === 'free' ? 'PLANO BASE' : 'MUDAR PLANO'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
                    {BONUS_CREDITS.map((credit, index) => {
                      const isProcessing = createCreditsCheckout.isPending && createCreditsCheckout.variables?.credits === credit.amount;
                      return (
                        <div key={index} className={`p-4 md:p-6 rounded-2xl border-4 text-center transition-all flex flex-col items-center ${credit.amount === 1500 ? 'border-[#d4af37] ring-2 ring-[#d4af37]/20 bg-white' : 'border-[#d4af37]/20 bg-white'}`}>
                          <Sparkles className="w-8 h-8 mb-2 text-[#d4af37]" />
                          <h5 className="text-2xl font-black text-[#1e3a5f]">{credit.amount.toLocaleString('pt-BR')}</h5>
                          <p className="text-[10px] uppercase font-bold opacity-60 mb-4 text-[#8b6f47]">Créditos</p>
                          <div className="mt-auto w-full">
                            <p className="text-xl font-black mb-4 text-[#1e3a5f]">{credit.price}</p>
                            <Button 
                              onClick={() => createCreditsCheckout.mutate({ credits: credit.amount, price: parseFloat(credit.price.replace('R$ ', '').replace(',', '.')) })} 
                              disabled={createCreditsCheckout.isPending} 
                              className={`w-full font-bold text-xs bg-[#1e3a5f] text-white active:scale-95 transition-all`}
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
              <Button variant="ghost" onClick={onClose} className="text-[#1e3a5f] font-bold hover:bg-[#d4af37]/10 px-8 py-2 rounded-lg">Talvez mais tarde</Button>
            </div>
          </>
        )}
      </DialogContent>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }`}</style>
    </Dialog>
  );
}