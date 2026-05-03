import React from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Calendar, CreditCard, Package } from 'lucide-react';
import { useTranslation } from "react-i18next";
 
export default function PaymentHistory() {
    const { t, i18n } = useTranslation();
    const { data: history, isLoading } = trpc.credits.paymentHistory.useQuery();
 
    const currentLocale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
    const currentCurrency = i18n.language === 'pt' ? 'BRL' : 'USD'; // Simplified currency logic
 
    if (isLoading) {
        return (
            <Card className="bg-[#2a4a7f] border-[#d4af37]/20 p-6 mb-6">
                <h2 className="text-2xl font-bold text-[#d4af37] mb-4">{t('paymentHistory.title')}</h2>
                <div className="text-center py-8 text-gray-300">{t('paymentHistory.loading')}</div>
            </Card>
        );
    }
 
    if (!history || history.length === 0) {
        return (
            <Card className="bg-[#2a4a7f] border-[#d4af37]/20 p-6 mb-6">
                <h2 className="text-2xl font-bold text-[#d4af37] mb-4">{t('paymentHistory.title')}</h2>
                <div className="text-center py-8 text-gray-300 bg-[#1e3a5f]/50 rounded-lg">
                    {t('paymentHistory.empty')}
                </div>
            </Card>
        );
    }
 
    // Helper para formatar moeda
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(currentLocale, {
            style: 'currency',
            currency: currentCurrency,
        }).format(amount / 100); // Amount vem armazenado em centavos
    };
 
    // Helper para formatar data
    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString(currentLocale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
 
    // Helper para ícone e texto por tipo
    const getTypeInfo = (type: string | null) => {
        switch (type) {
            case 'credit':
                return { icon: <CreditCard className="w-5 h-5 text-green-400" />, label: t('paymentHistory.typeCredits') };
            case 'plan_monthly':
                return { icon: <Package className="w-5 h-5 text-blue-400" />, label: t('paymentHistory.typeMonthly') };
            case 'plan_yearly':
                return { icon: <Package className="w-5 h-5 text-purple-400" />, label: t('paymentHistory.typeYearly') };
            case 'plan_manual':
                return { icon: <Package className="w-5 h-5 text-orange-400" />, label: t('paymentHistory.typeManual') };
            default:
                return { icon: <Calendar className="w-5 h-5 text-gray-400" />, label: t('paymentHistory.typeDefault') };
        }
    };
 
    return (
        <Card className="bg-[#2a4a7f] border-[#d4af37]/20 p-6 mb-6">
            <h2 className="text-2xl font-bold text-[#d4af37] mb-4">{t('paymentHistory.title')}</h2>
 
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#d4af37]/30 text-[#d4af37]">
                            <th className="p-3 font-semibold">{t('paymentHistory.dateCol')}</th>
                            <th className="p-3 font-semibold">{t('paymentHistory.descCol')}</th>
                            <th className="p-3 font-semibold text-right">{t('paymentHistory.valueCol')}</th>
                            <th className="p-3 font-semibold text-center">{t('paymentHistory.statusCol')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4af37]/10">
                        {history.map((tx) => {
                            const { icon, label } = getTypeInfo(tx.type);
                            return (
                                <tr key={tx.id} className="hover:bg-[#1e3a5f]/50 transition-colors text-gray-200">
                                    <td className="p-3 text-sm">{formatDate(tx.createdAt)}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            {icon}
                                            <div>
                                                <div className="font-medium text-white">{label}</div>
                                                {(tx.creditsAmount || 0) > 0 && (
                                                    <div className="text-xs text-green-400">{t('paymentHistory.creditsAdded', { amount: tx.creditsAmount })}</div>
                                                )}
                                                {tx.mercadoPagoId ? (
                                                    <div className="text-xs text-gray-400" title={`MP ID: ${tx.mercadoPagoId}`}>Ref: {tx.externalId?.split('-')[0] || 'N/A'}</div>
                                                ) : tx.stripePaymentId ? (
                                                    <div className="text-xs text-gray-400" title={`Stripe ID: ${tx.stripePaymentId}`}>Ref: {tx.stripePaymentId.slice(-8)}</div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right font-medium text-white">
                                        {formatCurrency(tx.amount)}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                            tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {tx.status === 'approved' ? t('paymentHistory.statusApproved') : tx.status === 'pending' ? t('paymentHistory.statusPending') : tx.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
