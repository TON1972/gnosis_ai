import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Crown, Sparkles, Gift, CheckCircle2, Zap, Rocket, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import CreditPackages from "./CreditPackages";
import { getPlanPriceDisplay } from "@shared/planPricing";
import { getLocalizedString } from "@/lib/i18nHelper";

interface NoCreditsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'plans' | 'credits';
}

const BONUS_CREDITS = [
  { amount: 1000, price: 9.90, label: "R$ 9,90" },
  { amount: 3000, price: 24.90, label: "R$ 24,90" },
  { amount: 6000, price: 39.90, label: "R$ 39,90" },
  { amount: 10000, price: 69.90, label: "R$ 69,90" },
];

export default function NoCreditsModal({ open, onClose, initialTab = 'plans' }: NoCreditsModalProps) {
  const { t, i18n } = useTranslation();
  const { data: allPlans, isLoading: isLoadingPlans, refetch: refetchPlans } = trpc.plans.list.useQuery(undefined, {
    staleTime: 0,
  });
  const { data: allTools, isLoading: isLoadingTools } = trpc.tools.list.useQuery();
  const { data: activePlanData } = trpc.credits.activePlan.useQuery();

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [view, setView] = useState<'plans' | 'credits'>(initialTab);

  // ✅ NOVA MUTAÇÃO: Única para ambos os casos via Mercado Pago
  const createCheckout = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      // Redireciona o usuário para o checkout seguro do Mercado Pago
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
      setView(initialTab);
      void refetchPlans();
    }
  }, [open, initialTab, refetchPlans]);

  const isLoading = isLoadingPlans || isLoadingTools;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] md:max-w-7xl h-[95vh] md:h-auto md:max-h-[92vh] overflow-y-auto bg-linear-to-br from-[#FFFACD] to-[#F0E68C] border-4 border-[#d4af37] p-4 md:p-8 custom-scrollbar">

        <DialogHeader className="p-4 text-center">
          <DialogTitle className="text-xl md:text-3xl font-black text-[#1e3a5f] flex items-center justify-center gap-2">
            <Rocket className="w-8 h-8 text-[#d4af37]" /> {t('modals.credits.title')}
          </DialogTitle>
          <DialogDescription className="sr-only">Escolha planos ou créditos avulsos</DialogDescription>
        </DialogHeader>

        {/* SELETOR DE ABAS */}
        <div className="flex justify-center gap-2 mb-8 px-4">
          <Button
            onClick={() => setView('plans')}
            className={`flex-1 md:w-48 font-bold rounded-xl transition-all h-12 border-2 ${view === 'plans' ? 'bg-[#1e3a5f] text-[#d4af37] border-[#1e3a5f] shadow-lg scale-105' : 'bg-white/50 text-[#1e3a5f] border-[#d4af37]/20'}`}
          >
            <Crown className="w-4 h-4 mr-2" /> {t('modals.credits.tabs.plans')}
          </Button>
          <Button
            onClick={() => setView('credits')}
            className={`flex-1 md:w-48 font-bold rounded-xl transition-all h-12 border-2 ${view === 'credits' ? 'bg-[#1e3a5f] text-[#d4af37] border-[#1e3a5f] shadow-lg scale-105' : 'bg-white/50 text-[#1e3a5f] border-[#d4af37]/20'}`}
          >
            <Gift className="w-4 h-4 mr-2" /> {t('modals.credits.tabs.credits')}
          </Button>
        </div>

        <div className="space-y-8 px-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f]" />
              <p className="mt-4 font-bold text-[#1e3a5f]">{t('modals.credits.loading')}</p>
            </div>
          ) : view === 'plans' ? (
            /* CONTEÚDO DE PLANOS */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-center items-center gap-4 mb-8">
                <button onClick={() => setBillingPeriod('monthly')} className={`px-6 py-2 rounded-full font-bold text-sm border-2 transition-all ${billingPeriod === 'monthly' ? 'bg-[#1e3a5f] text-[#d4af37] border-[#1e3a5f]' : 'bg-white/50 text-[#1e3a5f] border-[#d4af37]'}`}>{t('modals.credits.billing.monthly')}</button>
                <button onClick={() => setBillingPeriod('yearly')} className={`px-6 py-2 rounded-full font-bold text-sm border-2 relative transition-all ${billingPeriod === 'yearly' ? 'bg-[#1e3a5f] text-[#d4af37] border-[#1e3a5f]' : 'bg-white/50 text-[#1e3a5f] border-[#d4af37]'}`}>
                  {t('modals.credits.billing.yearly')} <span className="absolute -top-3 -right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-md">{t('modals.credits.billing.off')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {allPlans?.map((plan: any) => {
                  const isActive = String(activePlanData?.plan?.id) === String(plan.id);
                  const isLumen = plan.name === 'lumen';
                  const isProcessing = createCheckout.isPending && createCheckout.variables?.id === String(plan.id);
                  const priceDisplay = getPlanPriceDisplay(
                    plan,
                    billingPeriod,
                    i18n.language,
                    t("dashboard.freePlan"),
                  );

                  return (
                    <div key={plan.id} className={`relative flex flex-col rounded-2xl p-5 border-4 shadow-xl transition-all ${isLumen ? 'bg-[#1e3a5f] border-[#d4af37] text-white ring-4 ring-[#d4af37]/20' : 'bg-white border-[#d4af37]/40 text-[#1e3a5f]'}`}>
                      {isActive && <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full z-20 shadow-md">{t('modals.credits.active')}</div>}
                      <h4 className="text-lg font-black uppercase tracking-tight">{getLocalizedString(plan, 'displayName')}</h4>
                      <div className="mt-2 mb-4">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-black ${isLumen ? 'text-[#d4af37]' : 'text-[#1e3a5f]'}`}>{priceDisplay.main}</span>
                          {priceDisplay.periodLabel && (
                            <span className="text-[10px] font-bold opacity-70">{priceDisplay.periodLabel}</span>
                          )}
                        </div>
                        {priceDisplay.sublabel && (
                          <p className={`text-[11px] font-bold mt-1 ${isLumen ? 'text-white/80' : 'text-[#8b6f47]'}`}>
                            {priceDisplay.sublabel}
                          </p>
                        )}
                      </div>
                      <div className={`space-y-2 mb-4 p-3 rounded-xl ${isLumen ? 'bg-white/10' : 'bg-[#FFFACD]/50'}`}>
                        <p className="text-[11px] font-bold flex items-center gap-2"><Zap className="w-3 h-3" /> {Number(plan.creditsInitial).toLocaleString()} {t('modals.credits.initial')}</p>
                        <p className="text-[11px] font-bold flex items-center gap-2"><Sparkles className="w-3 h-3" /> {Number(plan.creditsDaily).toLocaleString()}{t('modals.credits.daily')}</p>
                      </div>
                      <div className="flex-1 mb-6 space-y-1.5 overflow-y-auto max-h-48 pr-1 custom-scrollbar text-[10px]">
                        {allTools?.map((tool: any) => {
                          const hasTool = plan.toolIds?.includes(String(tool.id));
                          return (
                            <div key={tool.id} className="flex items-start gap-2">
                              {hasTool ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" /> : <span className="text-red-500 font-bold text-[10px] w-3 text-center shrink-0">×</span>}
                              <span className={`leading-tight font-medium ${hasTool ? 'opacity-100' : 'opacity-40'}`}>{getLocalizedString(tool, 'displayName')}</span>
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        onClick={() => !isActive && createCheckout.mutate({
                          type: 'plan',
                          id: String(plan.id),
                          price: priceDisplay.amountCents / 100,
                          title: `Plano ${getLocalizedString(plan, 'displayName')} - Gnosis AI`,
                          billingPeriod,
                          language: i18n.language,
                        })}
                        disabled={isActive || createCheckout.isPending || plan.name === 'free'}
                        className={`w-full font-black py-5 rounded-xl transition-all shadow-md active:scale-95 ${isActive ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-none' : isLumen ? 'bg-[#d4af37] text-[#1e3a5f] hover:bg-white' : 'bg-[#1e3a5f] text-white'}`}
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : isActive ? t('modals.credits.btnActive') : plan.name === 'free' ? t('modals.credits.btnBase') : t('modals.credits.btnSubscribe')}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* CONTEÚDO DE CRÉDITOS AVULSOS */
            <CreditPackages />
          )}
        </div>

        <div className="text-center pt-8">
          <Button variant="ghost" onClick={onClose} className="text-[#1e3a5f] font-bold hover:bg-[#d4af37]/10 px-8 py-2 rounded-lg transition-all">{t('modals.credits.later')}</Button>
        </div>
      </DialogContent>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }`}</style>
    </Dialog>
  );
}