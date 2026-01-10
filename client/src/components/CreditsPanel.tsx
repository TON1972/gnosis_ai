import { Coins, Calendar, Zap, Gift, Info, TrendingUp, ShoppingCart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import NoCreditsModal from "./NoCreditsModal";

// ✅ Atualizado para aceitar o tipo da aba opcionalmente
interface CreditsPanelProps {
  onNeedCredits?: (tab: 'plans' | 'credits') => void;
}

export default function CreditsPanel({ onNeedCredits }: CreditsPanelProps) {
  const { user } = useAuth();
  const [modalConfig, setModalConfig] = useState<{ open: boolean; tab: 'plans' | 'credits' }>({
    open: false,
    tab: 'plans'
  });

  const { data: credits, isLoading: isLoadingCredits } = trpc.credits.balance.useQuery();
  const { data: activePlan, isLoading: isLoadingPlan } = trpc.credits.activePlan.useQuery();

  const isLoading = isLoadingCredits || isLoadingPlan;

  if (isLoading) {
    return (
      <div className="bg-white/90 rounded-2xl p-6 shadow-xl border-4 border-[#d4af37]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#FFFACD] rounded"></div>
          <div className="h-20 bg-[#FFFACD] rounded"></div>
        </div>
      </div>
    );
  }

  const totalCredits = credits?.total || 0;
  const isLowCredits = totalCredits < 100;

  // ✅ CORREÇÃO: Agora passa a 'tab' para a função externa
  const handleOpenModal = (tab: 'plans' | 'credits') => {
    if (onNeedCredits) {
      onNeedCredits(tab); // Passa a aba escolhida para o pai (ToolPage)
    } else {
      setModalConfig({ open: true, tab }); // Usa o estado interno (Dashboard)
    }
  };

  return (
    <div className="bg-linear-to-br from-[#FFFACD] to-[#F0E68C] rounded-2xl p-4 md:p-6 shadow-xl border-4 border-[#d4af37]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-3 bg-[#1e3a5f] rounded-lg shadow-md">
            <Coins className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-[#1e3a5f]">Seus Créditos</h3>
            <p className="text-xs md:text-sm text-[#8b6f47]">
              {activePlan?.plan?.displayName || "Plano Inicial"}
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <span className="ml-2 px-2 py-0.5 bg-[#d4af37] text-white text-[10px] font-bold rounded shadow-sm">ADMIN</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Total Credits Display */}
      <div className="bg-white/80 rounded-xl p-4 md:p-6 mb-4 border-2 border-[#d4af37] shadow-inner">
        <div className="text-center">
          <p className="text-xs md:text-sm text-[#8b6f47] mb-2 font-bold uppercase tracking-widest">Saldo Total</p>
          <p className={`text-4xl md:text-5xl font-black ${isLowCredits ? 'text-red-600' : 'text-[#1e3a5f]'}`}>
            {totalCredits.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-[#8b6f47] mt-2 font-bold">créditos disponíveis</p>
        </div>
      </div>

      {/* Credit Breakdown */}
      <div className="grid grid-cols-1 gap-2 mb-4">
        {[
          { label: "Diários", value: credits?.daily, icon: Zap, color: "text-amber-500" },
          { label: "Iniciais", value: credits?.initial, icon: Calendar, color: "text-blue-500", expiry: credits?.initialExpiry },
          { label: "Avulsos", value: credits?.bonus, icon: Gift, color: "text-purple-500" }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-[#d4af37]/40 shadow-sm">
            <div className="flex items-center gap-2">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#1e3a5f]">{item.label}</span>
                {item.expiry && (
                  <span className="text-[10px] text-[#8b6f47] font-medium">
                    Expira: {new Date(item.expiry).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
            <span className="text-lg font-black text-[#1e3a5f]">{item.value || 0}</span>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-[#1e3a5f]/5 rounded-lg p-3 mb-6 border border-[#1e3a5f]/10 shadow-sm">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-[#1e3a5f] mt-0.5 shrink-0" />
          <p className="text-[11px] leading-tight text-[#8b6f47] font-medium">
            <strong>Ordem de uso:</strong> Diários → Iniciais → Avulsos. Créditos diários renovam todo dia, iniciais expiram em 30 dias, avulsos são permanentes.
          </p>
        </div>
      </div>

      {/* ✅ UPSELL CARD ANIMADO */}
      {isLowCredits && (
        <div className="mb-6 relative overflow-hidden rounded-xl border-2 border-[#d4af37] bg-[#1e3a5f] p-4 shadow-xl animate-in zoom-in duration-500">
          {/* Efeitos de Fundo */}
          <div className="absolute inset-0 bg-linear-to-r from-[#1e3a5f] via-[#2a4a7f] to-[#1e3a5f]"></div>
          <div className="btn-shine absolute inset-0 opacity-20"></div>

          <div className="relative z-10 text-center">
            <div className="mx-auto bg-[#d4af37] w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-lg animate-pulse">
              <Zap className="w-6 h-6 text-[#1e3a5f] fill-[#1e3a5f]" />
            </div>

            <h4 className="text-[#d4af37] font-black text-lg uppercase leading-tight mb-1">
              {activePlan?.plan?.name === 'free' ? "Desbloqueie o Poder!" : "Não pare agora!"}
            </h4>
            <p className="text-white/80 text-xs font-medium mb-3">
              {activePlan?.plan?.name === 'free'
                ? "Seus créditos acabaram? Evolua para o Pro e tenha acesso ilimitado!"
                : "Seus créditos estão baixos. Garanta mais avulsos que nunca expiram!"}
            </p>

            <Button
              onClick={() => handleOpenModal(activePlan?.plan?.name === 'free' ? 'plans' : 'credits')}
              className="w-full bg-[#d4af37] text-[#1e3a5f] font-black hover:bg-[#ffe066] hover:scale-105 transition-all shadow-lg text-sm h-10"
            >
              {activePlan?.plan?.name === 'free' ? "VIRAR PREMIUM" : "RECARREGAR"}
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Só mostra o botão normal de upgrade se NÃO for o card de upsell do free, para evitar duplicidade visual */}
        {(activePlan?.plan?.name !== 'free' || !isLowCredits) && (
          <Button
            onClick={() => handleOpenModal('plans')}
            className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#152944] h-12 shadow-lg font-black flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <TrendingUp className="w-5 h-5" />
            FAZER UPGRADE AGORA
          </Button>
        )}

        <Button
          onClick={() => handleOpenModal('credits')}
          variant="outline"
          className="w-full border-2 border-[#d4af37] text-[#1e3a5f] hover:bg-[#d4af37]/10 h-12 font-black flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <ShoppingCart className="w-5 h-5" />
          COMPRAR AVULSOS
        </Button>
      </div>

      {/* Só renderiza o modal interno se não houver controle externo (Ex: no Dashboard) */}
      {!onNeedCredits && (
        <NoCreditsModal
          open={modalConfig.open}
          onClose={() => setModalConfig({ ...modalConfig, open: false })}
          initialTab={modalConfig.tab}
        />
      )}
    </div>
  );
}