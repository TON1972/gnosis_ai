import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";
import { useLocation } from "wouter";

interface UpgradeReminderModalProps {
    open: boolean;
    onClose: () => void;
}

export default function UpgradeReminderModal({ open, onClose }: UpgradeReminderModalProps) {
    const [, setLocation] = useLocation();

    const handleUpgrade = () => {
        onClose();
        setLocation("/dashboard");
        setTimeout(() => {
            const plansSection = document.getElementById("planos");
            plansSection?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-[600px] bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] border-4 border-[#d4af37] text-white p-0 overflow-hidden border-box">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 z-50 rounded-full bg-black/20 p-1.5 hover:bg-black/40 transition-colors"
                >
                    <X className="h-5 w-5 text-white" />
                    <span className="sr-only">Fechar</span>
                </button>

                <div className="px-5 py-8 sm:p-8 space-y-5 sm:space-y-6">
                    <DialogHeader className="pt-2 sm:pt-0">
                        <DialogTitle className="text-center">
                            <span className="block text-xs sm:text-2xl font-bold text-white mb-1 sm:mb-2 uppercase tracking-wide">
                                Oferta válida SOMENTE
                            </span>
                            <span className="block text-lg sm:text-4xl font-extrabold text-[#d4af37] bg-white/10 py-1 sm:py-2 px-3 sm:px-4 rounded-lg inline-block transform -rotate-1 shadow-lg backdrop-blur-sm">
                                "até 28/02"
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 sm:space-y-6 bg-white/10 rounded-xl p-4 sm:p-6">
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <CheckCircle2 className="w-5 h-5 sm:w-8 sm:h-8 text-[#d4af37] flex-shrink-0 mt-0.5 sm:mt-1" />
                                <div>
                                    <h3 className="font-bold text-sm sm:text-xl text-[#d4af37] mb-0.5 sm:mb-1">FREE</h3>
                                    <p className="text-xs sm:text-lg text-gray-200 leading-tight">
                                        De 6 para <span className="font-bold text-white">todas as 20 ferramentas liberadas!</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 sm:gap-4">
                                <CheckCircle2 className="w-5 h-5 sm:w-8 sm:h-8 text-[#d4af37] flex-shrink-0 mt-0.5 sm:mt-1" />
                                <div>
                                    <h3 className="font-bold text-sm sm:text-xl text-[#d4af37] mb-0.5 sm:mb-1">Bônus de Créditos</h3>
                                    <p className="text-xs sm:text-lg text-gray-200 leading-tight">
                                        Créditos Iniciais aumentados de 1.000 para <span className="font-bold text-white">1.500</span> e diários de 50 para <span className="font-bold text-white">100</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-2 sm:space-y-4">
                        <p className="text-sm sm:text-2xl font-bold text-white italic leading-tight">
                            "A revolução em termos de Estudos Bíblicos Profundos chegou, aproveite!"
                        </p>
                        <p className="text-sm sm:text-lg text-[#d4af37]">
                            Graça e Paz!
                        </p>
                    </div>

                    <div className="pt-2 sm:pt-4">
                        <Button
                            onClick={handleUpgrade}
                            className="w-full bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B] font-bold py-3 sm:py-6 text-base sm:text-xl rounded-xl shadow-lg transform transition hover:scale-[1.02]"
                        >
                            APROVEITAR AGORA
                        </Button>
                        <p className="text-center mt-3 sm:mt-4">
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white underline text-xs sm:text-sm"
                            >
                                Fechar e continuar navegando
                            </button>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
