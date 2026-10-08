import { Button } from "./ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const BONUS_CREDITS = [
  { amount: 1000, price: 9.9, label: "R$ 9,90", featured: false },
  { amount: 3000, price: 24.9, label: "R$ 24,90", featured: false },
  { amount: 6000, price: 39.9, label: "R$ 39,90", featured: true },
  { amount: 10000, price: 69.9, label: "R$ 69,90", featured: false },
];

export default function CreditPackages() {
  const { t } = useTranslation();
  const createCheckout = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    },
    onError: (error) => {
      toast.error(t("modals.credits.paymentError") + error.message);
    },
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {BONUS_CREDITS.map((credit) => {
        const isProcessing = createCheckout.isPending && createCheckout.variables?.id === String(credit.amount);
        return (
          <div
            key={credit.amount}
            className={cn(
              "relative p-4 md:p-6 rounded-2xl border-4 text-center flex flex-col items-center bg-white transition-colors duration-200",
              credit.featured
                ? "credits-pack--featured border-[#d4af37] bg-[#1e3a5f] text-white"
                : "border-[#d4af37]/25 hover:border-[#d4af37]",
            )}
          >
            {credit.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#d4af37] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1e3a5f]">
                {t("home.bestValue", "Melhor valor")}
              </span>
            )}
            <Sparkles
              className={cn("w-8 h-8 mb-2", credit.featured ? "text-[#d4af37]" : "text-[#d4af37]")}
              aria-hidden
            />
            <h5
              className={cn(
                "text-2xl font-black tabular-nums",
                credit.featured ? "text-[#d4af37]" : "text-[#1e3a5f]",
              )}
            >
              {credit.amount.toLocaleString(t("common.locale", { defaultValue: "pt-BR" }))}
            </h5>
            <p
              className={cn(
                "text-[10px] uppercase font-bold mb-4 tracking-wider",
                credit.featured ? "text-white/70" : "text-[#8b6f47]",
              )}
            >
              {t("modals.credits.pkgSubtitle")}
            </p>
            <div className="mt-auto w-full">
              <p className={cn("text-xl font-black mb-4", credit.featured ? "text-white" : "text-[#1e3a5f]")}>
                {credit.label}
              </p>
              <Button
                onClick={() =>
                  createCheckout.mutate({
                    type: "credits",
                    id: String(credit.amount),
                    price: credit.price,
                    title: `Recarga de ${credit.amount} créditos - Gnosis AI`,
                  })
                }
                disabled={createCheckout.isPending}
                className={cn(
                  "credits-cta w-full min-h-11 font-bold text-xs hover:bg-[#ffe066]",
                  credit.featured && "credits-cta--urgent",
                )}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : t("home.btnBuy")}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
