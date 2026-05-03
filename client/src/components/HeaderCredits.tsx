import { trpc } from "@/lib/trpc";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
 
export default function HeaderCredits() {
    const { t, i18n } = useTranslation();
    const { data: credits, isLoading } = trpc.credits.balance.useQuery();
 
    const currentLocale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
 
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full animate-pulse">
                <div className="w-4 h-4 bg-white/20 rounded-full" />
                <div className="w-12 h-4 bg-white/20 rounded" />
            </div>
        );
    }
 
    return (
        <div className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 bg-[#FFFACD]/10 hover:bg-[#FFFACD]/20 border border-[#d4af37]/30 rounded-full transition-colors group cursor-default">
            <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#d4af37] fill-[#d4af37]" />
            <span className="text-xs md:text-sm font-bold text-[#d4af37]">
                {credits?.total?.toLocaleString(currentLocale) || 0}
            </span>
            <span className="text-xs text-[#d4af37]/70 hidden sm:inline">{t('home.creditsLbl')}</span>
        </div>
    );
}
