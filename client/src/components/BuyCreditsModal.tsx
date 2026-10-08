import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import CreditPackages from "./CreditPackages";

interface BuyCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BuyCreditsModal({ open, onClose }: BuyCreditsModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] md:max-w-5xl h-[95vh] md:h-auto md:max-h-[92vh] overflow-y-auto bg-gradient-to-br from-[#FFFACD] to-[#F0E68C] border-4 border-[#d4af37] p-4 md:p-8 custom-scrollbar">
        <DialogHeader className="p-4 text-center">
          <DialogTitle className="text-xl md:text-3xl font-black text-[#1e3a5f] flex items-center justify-center gap-2">
            <Coins className="w-8 h-8 md:w-10 md:h-10 text-[#d4af37]" />
            {t("home.btnBuyAvulso", "Comprar créditos avulsos")}
          </DialogTitle>
          <DialogDescription className="text-base md:text-lg text-[#8b6f47] text-center">
            {t("home.creditsNeverExpireMsg")}
          </DialogDescription>
        </DialogHeader>

        <CreditPackages />

        <div className="text-center pt-8">
          <Button variant="ghost" onClick={onClose} className="text-[#1e3a5f] font-bold hover:bg-[#d4af37]/10 px-8 py-2 rounded-lg transition-all">
            {t("modals.credits.later")}
          </Button>
        </div>
      </DialogContent>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }`}</style>
    </Dialog>
  );
}
