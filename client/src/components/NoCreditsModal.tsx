import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Coins } from "lucide-react";
import CreditPackages from "./CreditPackages";

interface NoCreditsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: "plans" | "credits";
  reason?: "empty" | "buy";
}

export default function NoCreditsModal({ open, onClose, reason = "buy" }: NoCreditsModalProps) {
  const { t } = useTranslation();
  const isEmpty = reason === "empty";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] md:max-w-5xl h-[95vh] md:h-auto md:max-h-[92vh] overflow-y-auto bg-linear-to-br from-[#FFFACD] to-[#F0E68C] border-4 border-[#d4af37] p-4 md:p-8 custom-scrollbar">
        <DialogHeader className="p-4 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1e3a5f] credits-cta--urgent">
            <Coins className="h-7 w-7 text-[#d4af37]" aria-hidden />
          </div>
          <DialogTitle className="text-xl md:text-3xl font-black text-[#1e3a5f]">
            {isEmpty
              ? t("modals.credits.emptyTitle", "Saldo insuficiente")
              : t("modals.credits.title")}
          </DialogTitle>
          <DialogDescription className="text-sm md:text-base text-[#8b6f47] text-center max-w-2xl mx-auto leading-relaxed">
            {isEmpty
              ? t(
                  "modals.credits.emptyBody",
                  "Esta ferramenta precisa de créditos. Recarregue agora — os avulsos não vencem e servem em qualquer estudo.",
                )
              : t(
                  "modals.credits.buyBody",
                  "500 iniciais + 50 por dia na conta Free. Precisa de mais? Escolha um pacote. Avulsos não vencem.",
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="px-2 pt-2">
          <CreditPackages />
        </div>

        <div className="text-center pt-8">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[#1e3a5f] font-bold hover:bg-[#d4af37]/10 min-h-11 px-8 rounded-lg"
          >
            {t("modals.credits.later")}
          </Button>
        </div>
      </DialogContent>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }`}</style>
    </Dialog>
  );
}
