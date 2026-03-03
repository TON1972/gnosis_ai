import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  DollarSign,
  TrendingUp,
  UserPlus,
  Crown,
  ArrowUpRight,
  Percent
} from "lucide-react";

export function StatsKPIs({ stats, layout = "grid" }: { stats: any, layout?: "grid" | "stack" }) {
  const cards = [
    {
      title: "Base de Usuários",
      value: stats?.totalUsers,
      subValue: "Crescimento orgânico",
      icon: Users,
      color: "border-blue-500",
      iconBg: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Usuários Gratuitos",
      value: stats?.freeUsers,
      subValue: "Lead Conversion",
      icon: UserPlus,
      color: "border-slate-400",
      iconBg: "bg-slate-50",
      textColor: "text-slate-600",
    },
    {
      title: "Assinantes Premium",
      value: stats?.paidUsers,
      subValue: "Receita Recorrente",
      icon: Crown,
      color: "border-green-500",
      iconBg: "bg-green-50",
      textColor: "text-green-600",
      isPremium: true
    },
  ];

  return (
    <div className={layout === "grid" ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "flex flex-col gap-6 h-full"}>
      {cards.map((card, i) => (
        <Card key={i} className={`group p-6 bg-white border-l-8 ${card.color} shadow-sm hover:shadow-lg transition-all duration-300 ${layout === "stack" ? "flex-1 flex flex-col justify-center" : ""}`}>
          <div className="flex justify-between items-start w-full">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.15em]">
                {card.title}
              </p>

              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black text-[#1e3a5f] tracking-tighter">
                  {card.value?.toLocaleString('pt-BR') || 0}
                </p>
                {card.isPremium && (
                  <ArrowUpRight className="w-4 h-4 text-green-500 font-bold" />
                )}
              </div>
              <p className="text-[10px] font-semibold text-gray-400">
                {card.subValue}
              </p>
            </div>
            <div className={`p-3 ${card.iconBg} rounded-xl group-hover:rotate-6 transition-transform duration-300`}>
              <card.icon className={`w-5 h-5 ${card.textColor}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function StatsInsights({ stats }: { stats: any }) {
  const conversionRate = stats?.totalUsers
    ? ((stats.paidUsers / stats.totalUsers) * 100).toFixed(1)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="p-8 bg-white shadow-sm border border-gray-100 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1e3a5f] uppercase tracking-tight">Conversão da Base</h3>
              <p className="text-sm font-medium text-gray-400">Usuários FREE vs PREMIUM</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black text-purple-600 tracking-tighter">{conversionRate}%</span>
          </div>
        </div>

        <div className="space-y-3">
          <Progress value={Number(conversionRate)} className="h-4 bg-gray-100 rounded-full" />
          <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
            <span>Foco em Aquisição</span>
            <span>Meta de Retenção</span>
          </div>
        </div>
      </Card>

      <Card className="p-8 bg-linear-to-br from-[#1e3a5f] to-[#2a4a7f] text-white shadow-lg border-none relative overflow-hidden flex flex-col justify-center">
        <TrendingUp className="absolute -right-5 -bottom-5 w-48 h-48 text-white/5 rotate-12" />
        <div className="relative z-10">
          <h3 className="text-[#d4af37] font-black uppercase text-xs tracking-[0.3em] mb-4">Saúde do Ecossistema</h3>
          <div className="space-y-2">
            <p className="text-3xl font-black italic tracking-tighter leading-none">CRESCIMENTO EM DIA</p>
            <p className="text-base font-medium text-white/80 leading-relaxed max-w-[320px]">
              A taxa de cancelamento (Churn) reduziu 4% nesta semana. Sua base de assinantes está saudável.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function StatsOverview({ stats }: { stats: any }) {
  return (
    <div className="space-y-8">
      <StatsKPIs stats={stats} />
      <StatsInsights stats={stats} />
    </div>
  );
}