import { Card } from "@/components/ui/card";
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    Calendar,
    Users,
    ArrowUpRight,
    Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StripeFinancialData {
    balance: {
        available: number;
        pending: number;
        currency: string;
    };
    recentPayments: Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        created: number;
        customer: string | null;
        customerName: string | null;
        customerEmail: string | null;
        description: string | null;
    }>;
    activeSubscriptions: {
        total: number;
        monthlyRevenue: number;
        yearlyRevenue: number;
    };
    upcomingRenewals: Array<{
        subscriptionId: string;
        customerId: string;
        customerName: string | null;
        customerEmail: string | null;
        amount: number;
        currency: string;
        nextBillingDate: number;
        planName: string;
    }>;
}

interface FinancialDashboardProps {
    data: StripeFinancialData | null;
}

export function FinancialDashboard({ data }: FinancialDashboardProps) {
    if (!data) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-gray-400">Carregando dados financeiros...</p>
            </div>
        );
    }

    const formatCurrency = (amount: number, currency: string = "brl") => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    };

    const formatDate = (timestamp: number | null | undefined) => {
        if (!timestamp || isNaN(timestamp)) {
            return "Data não disponível";
        }
        try {
            const date = new Date(timestamp * 1000);
            if (isNaN(date.getTime())) {
                return "Data inválida";
            }
            return format(date, "dd 'de' MMM, yyyy", {
                locale: ptBR,
            });
        } catch (error) {
            return "Data inválida";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "succeeded":
                return "bg-green-100 text-green-700";
            case "processing":
                return "bg-blue-100 text-blue-700";
            case "requires_payment_method":
                return "bg-yellow-100 text-yellow-700";
            case "canceled":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "succeeded":
                return "Pago";
            case "processing":
                return "Processando";
            case "requires_payment_method":
                return "Aguardando";
            case "canceled":
                return "Cancelado";
            default:
                return status;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Cards de Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Saldo Disponível */}
                <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-90">
                                Saldo Disponível
                            </p>
                            <p className="text-3xl font-black mt-2">
                                {formatCurrency(data.balance.available)}
                            </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                {/* Saldo Pendente */}
                <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-90">
                                Saldo Pendente
                            </p>
                            <p className="text-3xl font-black mt-2">
                                {formatCurrency(data.balance.pending)}
                            </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                {/* Receita Mensal Recorrente */}
                <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-lg">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-90">
                                MRR (Mensal)
                            </p>
                            <p className="text-3xl font-black mt-2">
                                {formatCurrency(data.activeSubscriptions.monthlyRevenue)}
                            </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                {/* Assinaturas Ativas */}
                <Card className="p-6 bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] text-white border-none shadow-lg">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
                                Assinaturas Ativas
                            </p>
                            <p className="text-3xl font-black mt-2">
                                {data.activeSubscriptions.total}
                            </p>
                        </div>
                        <div className="p-3 bg-[#d4af37]/20 rounded-xl">
                            <Users className="w-6 h-6 text-[#d4af37]" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Seção: Pagamentos Recentes e Próximas Renovações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pagamentos Recentes */}
                <Card className="p-6 bg-white shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-50 rounded-xl">
                            <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#1e3a5f] uppercase tracking-tight">
                                Pagamentos Recentes
                            </h3>
                            <p className="text-sm text-gray-400">Últimas 10 transações</p>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {data.recentPayments.slice(0, 10).map((payment) => (
                            <div
                                key={payment.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm text-[#1e3a5f]">
                                            {formatCurrency(payment.amount, payment.currency)}
                                        </p>
                                        <span
                                            className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${getStatusColor(
                                                payment.status
                                            )}`}
                                        >
                                            {getStatusText(payment.status)}
                                        </span>
                                    </div>
                                    {payment.customerName && (
                                        <p className="text-xs font-semibold text-[#1e3a5f] mt-1">
                                            {payment.customerName}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {payment.description || "Pagamento de assinatura"}
                                    </p>
                                    {payment.customerEmail && (
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {payment.customerEmail}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-gray-300 mt-1">
                                        {formatDate(payment.created)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Próximas Renovações */}
                <Card className="p-6 bg-white shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#1e3a5f] uppercase tracking-tight">
                                Próximas Renovações
                            </h3>
                            <p className="text-sm text-gray-400">Cobranças agendadas</p>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {data.upcomingRenewals.map((renewal) => (
                            <div
                                key={renewal.subscriptionId}
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm text-[#1e3a5f]">
                                            {formatCurrency(renewal.amount, renewal.currency)}
                                        </p>
                                        <ArrowUpRight className="w-3 h-3 text-green-500" />
                                    </div>
                                    {renewal.customerName && (
                                        <p className="text-xs font-semibold text-[#1e3a5f] mt-1">
                                            {renewal.customerName}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {renewal.planName}
                                    </p>
                                    {renewal.customerEmail && (
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {renewal.customerEmail}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-gray-300 mt-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(renewal.nextBillingDate)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
        </div>
    );
}
