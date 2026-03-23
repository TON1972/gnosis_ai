import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  DollarSign, 
  Users, 
  Copy, 
  Check, 
  ArrowLeft, 
  TrendingUp, 
  Wallet,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DashboardMobileMenu from "@/components/DashboardMobileMenu";
import HeaderCredits from "@/components/HeaderCredits";
import Footer from "@/components/Footer";

export default function AffiliatePage() {
  const { user: authUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const { data: dbUser } = trpc.auth.me.useQuery(undefined, {
    enabled: !!authUser,
  });
  const user = (dbUser || authUser) as any;

  const { data: status, isLoading: loadingStatus } = trpc.affiliate.getAffiliateStatus.useQuery();
  const { data: stats, isLoading: loadingStats } = trpc.affiliate.getStats.useQuery();
  const { data: commissions, isLoading: loadingCommissions } = trpc.affiliate.getCommissions.useQuery();
  const { data: payouts, isLoading: loadingPayouts } = trpc.affiliate.getPayouts.useQuery();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!loadingStatus && !status?.isAffiliate) {
    return (
      <div className="min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-4 border-[#1e3a5f] shadow-2xl">
          <div className="bg-[#1e3a5f] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="text-[#d4af37] w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 uppercase">Acesso Restrito</h2>
          <p className="text-[#8b6f47] mb-8 font-medium">
            Você ainda não possui acesso ao programa de afiliados. Entre em contato com o suporte para solicitar sua afiliação.
          </p>
          <Button 
            onClick={() => setLocation("/dashboard")}
            className="w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#152944] font-bold h-12"
          >
            Voltar ao Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const affiliateLink = `${window.location.origin}/auth?ref=${status?.affiliateCode || ""}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: Date | string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full uppercase border border-orange-200"><Clock className="w-3 h-3" /> Pendente</span>;
      case 'paid':
        return <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full uppercase border border-green-200"><CheckCircle2 className="w-3 h-3" /> Pago</span>;
      case 'cancelled':
        return <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full uppercase border border-red-200"><XCircle className="w-3 h-3" /> Cancelado</span>;
      default:
        return <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-full uppercase border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <span className="flex items-center gap-1.5 md:gap-4 hover:opacity-80 transition-opacity cursor-pointer">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 md:h-16 md:w-16 object-contain" />
                <h1 className="hidden md:block text-3xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
                <h1 className="block md:hidden text-lg font-bold text-[#d4af37] leading-tight">GNOSIS AI</h1>
              </span>
            </Link>
            <div className="flex items-center gap-1.5 md:gap-3">
              <HeaderCredits />
              <DashboardMobileMenu user={user} onLogout={() => { logout(); setLocation("/"); }} />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/dashboard")}
              className="mb-4 text-[#1e3a5f] hover:bg-[#1e3a5f]/10 font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <h2 className="text-3xl font-black text-[#1e3a5f] uppercase tracking-tight">Painel do Afiliado</h2>
            <p className="text-[#8b6f47] font-medium">Gerencie suas indicações e comissões</p>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-[#1e3a5f] uppercase">Sua Comissão</span>
            <span className="text-2xl font-black text-[#d4af37] bg-[#1e3a5f] px-4 py-1 rounded-lg border-2 border-[#d4af37] shadow-md">
              {status?.commissionPercentage}%
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border-4 border-[#1e3a5f] shadow-xl hover:translate-y-[-4px] transition-transform">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#1e3a5f] rounded-xl shadow-md">
                <TrendingUp className="text-[#d4af37] w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Ganhos Totais</p>
                <p className="text-2xl font-black text-[#1e3a5f]">
                  R$ {Number(stats?.earnings?.total || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-4 border-[#1e3a5f] shadow-xl hover:translate-y-[-4px] transition-transform">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-xl shadow-md border-2 border-[#1e3a5f]/10">
                <Clock className="text-white w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Pendente</p>
                <p className="text-2xl font-black text-orange-600">
                  R$ {Number(stats?.earnings?.pending || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-4 border-[#1e3a5f] shadow-xl hover:translate-y-[-4px] transition-transform">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-xl shadow-md border-2 border-[#1e3a5f]/10">
                <Wallet className="text-white w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Pago</p>
                <p className="text-2xl font-black text-green-700">
                  R$ {Number(stats?.earnings?.paid || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-4 border-[#1e3a5f] shadow-xl hover:translate-y-[-4px] transition-transform">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#d4af37] rounded-xl shadow-md border-2 border-[#1e3a5f]/10">
                <Users className="text-[#1e3a5f] w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Indicações</p>
                <p className="text-2xl font-black text-[#1e3a5f]">
                  {stats?.referralsCount || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Link Seção */}
        <Card className="mb-8 overflow-hidden border-4 border-[#1e3a5f] shadow-2xl bg-[#1e3a5f]">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#d4af37] rounded-lg shadow-sm">
                <Users className="w-5 h-5 text-[#1e3a5f]" />
              </div>
              <h3 className="text-xl font-black text-[#d4af37] uppercase tracking-wide">Seu Link de Afiliado</h3>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Input 
                  readOnly 
                  value={affiliateLink}
                  className="bg-white/10 border-2 border-[#d4af37]/30 text-white h-14 pr-12 font-medium focus:border-[#d4af37] focus:ring-0"
                />
              </div>
              <Button 
                onClick={copyToClipboard}
                size="lg"
                className="bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B] font-black h-14 px-8 shadow-lg transition-all"
              >
                {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                {copied ? "Copiado!" : "Copiar Link"}
              </Button>
            </div>
            
            <p className="mt-4 text-[#d4af37]/70 text-sm font-medium">
              Compartilhe este link com seus amigos e seguidores para ganhar comissões em cada indicação.
            </p>
          </div>
        </Card>

        {/* Tabelas de Histórico */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card className="border-4 border-[#1e3a5f] shadow-xl overflow-hidden bg-white">
            <div className="bg-[#1e3a5f] p-4 border-b-4 border-[#d4af37]">
              <h3 className="text-lg font-black text-[#d4af37] uppercase flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Histórico de Comissões
              </h3>
            </div>
            <div className="overflow-x-auto">
              {loadingCommissions ? (
                <div className="p-8 text-center text-[#1e3a5f] font-bold animate-pulse">Carregando comissões...</div>
              ) : !commissions || commissions.length === 0 ? (
                <div className="p-12 text-center text-gray-400 font-medium">Nenhuma comissão registrada ainda.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-[#f8f9fa] border-b border-gray-100">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-black text-[#1e3a5f] uppercase">Indicado</th>
                      <th className="text-left py-4 px-6 text-xs font-black text-[#1e3a5f] uppercase">Valor</th>
                      <th className="text-left py-4 px-6 text-xs font-black text-[#1e3a5f] uppercase">Status</th>
                      <th className="text-left py-4 px-6 text-xs font-black text-[#1e3a5f] uppercase">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((comm: any) => (
                      <tr key={comm.id} className="border-b border-gray-50 hover:bg-[#FFFACD]/30 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-[#1e3a5f]">{comm.referredUserName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{comm.planName}</p>
                        </td>
                        <td className="py-4 px-6 font-black text-[#1e3a5f]">R$ {Number(comm.amount).toFixed(2)}</td>
                        <td className="py-4 px-6">{getStatusBadge(comm.status)}</td>
                        <td className="py-4 px-6 text-xs font-bold text-gray-400">{formatDate(comm.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          <Card className="border-4 border-[#1e3a5f] shadow-xl overflow-hidden bg-white">
            <div className="bg-[#1e3a5f] p-4 border-b-4 border-[#d4af37]">
              <h3 className="text-lg font-black text-[#d4af37] uppercase flex items-center gap-2">
                <Wallet className="w-5 h-5" /> Histórico de Pagamentos
              </h3>
            </div>
            <div className="overflow-x-auto">
              {loadingPayouts ? (
                <div className="p-8 text-center text-[#1e3a5f] font-bold animate-pulse">Carregando pagamentos...</div>
              ) : !payouts || payouts.length === 0 ? (
                <div className="p-12 text-center text-gray-400 font-medium">Nenhum pagamento registrado ainda.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-[#f8f9fa] border-b border-gray-100">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-black text-[#1e3a5f] uppercase">Valor</th>
                      <th className="text-left py-4 px-6 text-xs font-black text-[#1e3a5f] uppercase">Método</th>
                      <th className="text-left py-4 px-6 text-xs font-black text-[#1e3a5f] uppercase">Status</th>
                      <th className="text-left py-4 px-6 text-xs font-black text-[#1e3a5f] uppercase">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout: any) => (
                      <tr key={payout.id} className="border-b border-gray-50 hover:bg-[#FFFACD]/30 transition-colors">
                        <td className="py-4 px-6 font-black text-[#1e3a5f]">R$ {Number(payout.amount).toFixed(2)}</td>
                        <td className="py-4 px-6 text-xs font-bold text-[#1e3a5f] uppercase">{payout.method}</td>
                        <td className="py-4 px-6">{getStatusBadge(payout.status)}</td>
                        <td className="py-4 px-6 text-xs font-bold text-gray-400">{formatDate(payout.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
