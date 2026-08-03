import React, { useState } from "react";
import { Link } from "wouter";
import { isPaidTierPlan } from "@/lib/planHelpers";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE } from "@/const";
import DashboardMobileMenu from "@/components/DashboardMobileMenu";
import NoCreditsModal from "@/components/NoCreditsModal";
import PaymentHistory from "@/components/PaymentHistory";
import { User, CreditCard, Package, Zap, Calendar, Gift, Info, TrendingUp, Settings } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import NotificationSettings from "@/components/NotificationSettings";
import { useTranslation } from "react-i18next";
 
export default function PerfilPage() {
  const { t, i18n } = useTranslation();
  const { user, logout, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
 
  const { data: credits } = trpc.credits.balance.useQuery();
  const { data: activePlan } = trpc.credits.activePlan.useQuery();
  const { data: usageHistory, isLoading: isLoadingHistory } = trpc.credits.usageHistory.useQuery();
 
  const currentLocale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
 
  // Mutation para criar sessão do portal
  const createPortalSession = trpc.payments.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(t('profile.portalError', { defaultValue: 'Erro ao acessar portal: ' }) + error.message);
    }
  });
 
  // Scroll ao topo ao carregar
  React.useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);
 
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1e3a5f] to-[#0f1f3a] flex items-center justify-center">
        <div className="text-[#d4af37] text-xl">{t('profile.loading')}</div>
      </div>
    );
  }
 
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1e3a5f] to-[#0f1f3a] flex items-center justify-center">
        <div className="text-[#d4af37] text-xl">{t('profile.loginRequired')}</div>
      </div>
    );
  }
 
  const totalCredits = credits?.total || 0;
  const isLowCredits = totalCredits < 100;
 
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a5f] to-[#0f1f3a]">
      {/* Header */}
      <header className="bg-[#1e3a5f] border-b border-[#d4af37]/20 sticky top-0 z-30">
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <span className="flex items-center gap-1.5 md:gap-4 hover:opacity-80 transition-opacity cursor-pointer">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 md:h-16 md:w-16 object-contain" loading="lazy" />
                <h1 className="hidden md:block text-3xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
                <h1 className="block md:hidden text-lg font-bold text-[#d4af37] leading-tight">GNOSIS AI</h1>
              </span>
            </Link>
 
            {/* Ícone de Perfil e Menu Hambúrguer */}
            <div className="flex items-center gap-1.5 md:gap-3">
              <Link href="/perfil">
                <button className="p-1.5 md:p-2 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors" aria-label={t('profile.title')}>
                  <User className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </Link>
 
              <DashboardMobileMenu
                user={user}
                onLogout={logout}
              />
            </div>
          </div>
        </div>
      </header>
 
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[#d4af37] mb-8 text-center">{t('profile.title')}</h1>
 
          {/* Botões de Ação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Botão Planos e Preços / Compra de Créditos */}
            <Button
              onClick={() => setShowModal(true)}
              className="bg-[#d4af37] hover:bg-[#b8941f] text-[#1e3a5f] font-bold py-6 text-lg flex items-center justify-center gap-3"
            >
              <Package className="w-6 h-6" />
              {t('profile.btnPlans')}
            </Button>
 
            {/* Botão Voltar ao Dashboard */}
            <Link href="/dashboard">
              <Button
                className="w-full bg-[#2a4a7f] hover:bg-[#1e3a5f] text-[#d4af37] font-bold py-6 text-lg border-2 border-[#d4af37] flex items-center justify-center gap-3"
              >
                <CreditCard className="w-6 h-6" />
                {t('profile.btnBackDashboard')}
              </Button>
            </Link>
            {/* Botão Gerenciar Assinatura (Só aparece se nao for Free) */}
            {isPaidTierPlan(activePlan?.plan?.name) && (
              <Button
                onClick={() => createPortalSession.mutate()}
                disabled={createPortalSession.isPending}
                className="col-span-1 md:col-span-2 bg-[#1e3a5f] hover:bg-[#2a4a7f] text-[#d4af37] font-bold py-6 text-lg border-2 border-[#d4af37] flex items-center justify-center gap-3"
              >
                {createPortalSession.isPending ? t('profile.loading') : (
                  <>
                    <Settings className="w-6 h-6" />
                    {t('profile.btnManageSubscription')}
                  </>
                )}
              </Button>
            )}
 
          </div>
 
 
          {/* Dados do Usuário */}
          <Card className="bg-[#2a4a7f] border-[#d4af37]/20 p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                <User className="w-10 h-10 text-[#d4af37]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#d4af37]">{user.name || t('profile.defaultUserName')}</h2>
                <p className="text-gray-300">{user.email || "email@exemplo.com"}</p>
              </div>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plano Atual */}
              <div className="bg-[#1e3a5f] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">{t('profile.currentPlan')}</h3>
                <p className="text-xl font-bold text-[#d4af37]">
                  {activePlan?.plan?.displayName || t('dashboard.freePlan')}
                  {user?.role === 'admin' || user?.role === 'super_admin' ? (
                    <span className="ml-2 px-2 py-0.5 bg-[#d4af37] text-white text-xs font-bold rounded">ADMIN</span>
                  ) : null}
                </p>
              </div>
 
              {/* Método de Login */}
              <div className="bg-[#1e3a5f] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">{t('profile.loginMethod')}</h3>
                <p className="text-lg text-gray-300">
                  {user.loginMethod || "Email"}
                </p>
              </div>
            </div>
          </Card>
 
          {/* Painel de Créditos - Igual ao Dashboard */}
          <Card className="bg-gradient-to-br from-[#FFFACD] to-[#F0E68C] border-4 border-[#d4af37] p-6 mb-6">
            <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4">{t('profile.creditsTitle')}</h2>
 
            {/* Total Credits Display */}
            <div className="bg-white/80 rounded-xl p-6 mb-4 border-2 border-[#d4af37]">
              <div className="text-center">
                <p className="text-sm text-[#8b6f47] mb-2">{t('profile.balanceLabel')}</p>
                <p className={`text-5xl font-bold ${isLowCredits ? 'text-red-600' : 'text-[#1e3a5f]'}`}>
                  {totalCredits.toLocaleString(currentLocale)}
                </p>
                <p className="text-sm text-[#8b6f47] mt-2">{t('profile.availableCredits')}</p>
              </div>
            </div>
 
            {/* Credit Breakdown */}
            <div className="space-y-3 mb-4">
              {/* Daily Credits */}
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-[#d4af37]">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#d4af37]" />
                  <span className="text-sm font-semibold text-[#1e3a5f]">{t('profile.dailyLabel')}</span>
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
                    <span className="text-sm font-semibold text-[#1e3a5f]">{t('profile.initialLabel')}</span>
                    {credits?.initialExpiry && (
                      <span className="text-xs text-[#8b6f47]">
                        {t('profile.expiresLabel')}: {new Date(credits.initialExpiry).toLocaleDateString(currentLocale)}
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
                  <span className="text-sm font-semibold text-[#1e3a5f]">{t('profile.bonusLabel')}</span>
                </div>
                <span className="text-lg font-bold text-[#1e3a5f]">
                  {credits?.bonus || 0}
                </span>
              </div>
            </div>
 
            {/* Info Box */}
            <div className="bg-[#1e3a5f]/10 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-[#1e3a5f] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#8b6f47]">
                  <strong>{t('profile.usageOrder')}</strong>
                  {" "}{t('profile.usageInfo')}
                </p>
              </div>
            </div>
 
            {isLowCredits && (
              <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3 mt-4">
                <p className="text-sm text-red-700 font-semibold text-center">
                  {t('profile.lowCreditsWarning')}
                </p>
              </div>
            )}
          </Card>
 
          {/* Gráfico de Consumo dos Últimos 30 Dias */}
          <Card className="bg-[#2a4a7f] border-[#d4af37]/20 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-[#d4af37]" />
              <h2 className="text-2xl font-bold text-[#d4af37]">{t('profile.chartTitle')}</h2>
            </div>
 
            {isLoadingHistory ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-[#d4af37]">{t('profile.chartLoading')}</div>
              </div>
            ) : usageHistory && usageHistory.length > 0 ? (
              <div className="bg-white/90 rounded-xl p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usageHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d4af37" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      stroke="#1e3a5f"
                      tick={{ fill: '#1e3a5f', fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis
                      stroke="#1e3a5f"
                      tick={{ fill: '#1e3a5f', fontSize: 12 }}
                      label={{ value: t('profile.chartYLabel'), angle: -90, position: 'insideLeft', fill: '#1e3a5f' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFACD',
                        border: '2px solid #d4af37',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value as string);
                        return date.toLocaleDateString(currentLocale);
                      }}
                      formatter={(value: number) => [`${value} ${t('home.creditsLbl')}`, t('profile.chartUsageLabel')]}
                    />
                    <Line
                      type="monotone"
                      dataKey="usage"
                      stroke="#1e3a5f"
                      strokeWidth={3}
                      dot={{ fill: '#d4af37', r: 4 }}
                      activeDot={{ r: 6, fill: '#d4af37' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
 
                <div className="mt-4 p-3 bg-[#FFFACD] rounded-lg border-2 border-[#d4af37]">
                  <p className="text-sm text-[#1e3a5f] text-center">
                    <strong>{t('profile.chartTotalLabel')}</strong> {usageHistory.reduce((sum, day) => sum + day.usage, 0).toLocaleString(currentLocale)} {t('home.creditsLbl')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-white/90 rounded-xl">
                <p className="text-[#8b6f47]">{t('profile.chartNoData')}</p>
              </div>
            )}
          </Card>
 
          {/* Histórico de Pagamentos */}
          <PaymentHistory />

          {/* Notificações Push (PWA) */}
          <NotificationSettings />


        </div>
      </main>
 
      <Footer />
 
      {/* Modal de Planos e Créditos */}
      <NoCreditsModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
