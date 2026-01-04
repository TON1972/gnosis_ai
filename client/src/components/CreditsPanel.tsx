import { Coins, Calendar, Zap, Gift, Info, TrendingUp, ShoppingCart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

interface CreditsPanelProps {
  onNeedCredits?: () => void;
}

export default function CreditsPanel({ onNeedCredits }: CreditsPanelProps) {
  const { user } = useAuth();
  
  // ✅ Chamadas mantidas conforme sua estrutura
  const { data: credits, isLoading: isLoadingCredits } = trpc.credits.balance.useQuery();
  const { data: activePlan, isLoading: isLoadingPlan } = trpc.credits.activePlan.useQuery();

  // Consolida o estado de carregamento
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

  // ✅ Ajuste de mapeamento: No seu backend 'getUserCredits' retorna initial, daily, bonus e total direto.
  const totalCredits = credits?.total || 0;
  const isLowCredits = totalCredits < 100;

  return (
    <div className="bg-linear-to-br from-[#FFFACD] to-[#F0E68C] rounded-2xl p-4 md:p-6 shadow-xl border-4 border-[#d4af37]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-3 bg-[#1e3a5f] rounded-lg">
            <Coins className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-[#1e3a5f]">Seus Créditos</h3>
            <p className="text-xs md:text-sm text-[#8b6f47]">
              {/* ✅ Ajuste: activePlan no seu router retorna { subscription, plan } */}
              {activePlan?.plan?.displayName || "Plano Inicial"}
              {user?.role === 'admin' || user?.role === 'super_admin' ? (
                <span className="ml-2 px-2 py-0.5 bg-[#d4af37] text-white text-xs font-bold rounded">ADMIN</span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      {/* Total Credits Display */}
      <div className="bg-white/80 rounded-xl p-4 md:p-6 mb-4 border-2 border-[#d4af37]">
        <div className="text-center">
          <p className="text-xs md:text-sm text-[#8b6f47] mb-2">Saldo Total</p>
          <p className={`text-3xl md:text-5xl font-bold ${isLowCredits ? 'text-red-600' : 'text-[#1e3a5f]'}`}>
            {totalCredits.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-[#8b6f47] mt-2">créditos disponíveis</p>
        </div>
      </div>

      {/* Credit Breakdown */}
      <div className="space-y-3 mb-4">
        {/* Daily Credits */}
        <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-[#d4af37]">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#d4af37]" />
            <span className="text-sm font-semibold text-[#1e3a5f]">Créditos Diários</span>
          </div>
          <span className="text-lg font-bold text-[#1e3a5f]">
            {credits?.daily || 0}
          </span>
        </div>

        {/* Initial Credits */}
        <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-[#d4af37]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#d4af37]" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#1e3a5f]">Créditos Iniciais</span>
              {/* ✅ Ajuste: initialExpiry conforme retornado pelo balance query */}
              {credits?.initialExpiry && (
                <span className="text-xs text-[#8b6f47]">
                  Expira: {new Date(credits.initialExpiry).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
          <span className="text-lg font-bold text-[#1e3a5f]">
            {credits?.initial || 0}
          </span>
        </div>

        {/* Bonus Credits */}
        <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-[#d4af37]">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#d4af37]" />
            <span className="text-sm font-semibold text-[#1e3a5f]">Créditos Avulsos</span>
          </div>
          <span className="text-lg font-bold text-[#1e3a5f]">
            {credits?.bonus || 0}
          </span>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[#1e3a5f]/10 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-[#1e3a5f] mt-0.5 shrink-0" />
          <p className="text-xs text-[#8b6f47]">
            <strong>Ordem de uso:</strong> Diários → Iniciais → Avulsos. 
            Créditos diários renovam todo dia, iniciais expiram em 30 dias, avulsos são permanentes.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {isLowCredits && (
          <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3 mb-3">
            <p className="text-sm text-red-700 font-semibold text-center">
              ⚠️ Créditos baixos! Considere fazer upgrade ou comprar créditos avulsos.
            </p>
          </div>
        )}
        
        <Button
          onClick={onNeedCredits}
          className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] font-bold flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-5 h-5" />
          Upgrade de Plano
        </Button>
        
        <Button
          onClick={onNeedCredits}
          className="w-full bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B] font-bold flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          Comprar Créditos Avulsos
        </Button>
      </div>
    </div>
  );
}