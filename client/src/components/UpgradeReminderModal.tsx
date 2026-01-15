import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, CheckCircle2, X } from "lucide-react";
import { useLocation } from "wouter";

interface UpgradeReminderModalProps {
    open: boolean;
    onClose: () => void;
}

export default function UpgradeReminderModal({ open, onClose }: UpgradeReminderModalProps) {
    const [, setLocation] = useLocation();

    const handleUpgrade = () => {
        onClose();
        setLocation("/");
        setTimeout(() => {
            const plansSection = document.getElementById("planos");
            plansSection?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] border-4 border-[#d4af37] text-white">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                    <X className="h-4 w-4 text-[#d4af37]" />
                    <span className="sr-only">Fechar</span>
                </button>

                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-3xl font-bold text-[#d4af37]">
                        <Crown className="w-8 h-8" />
                        Potencialize Seus Estudos!
                    </DialogTitle>
                    <DialogDescription className="text-gray-300 text-lg">
                        Descubra todo o potencial da GNOSIS AI com um plano premium
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Benefícios */}
                    <div className="bg-white/10 rounded-xl p-6 space-y-4">
                        <h3 className="text-xl font-bold text-[#d4af37] flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Por que fazer upgrade?
                        </h3>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm">
                                    <strong className="text-[#d4af37]">Mais créditos diários:</strong> Até 200 créditos por dia para estudos ilimitados
                                </p>
                            </div>

                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm">
                                    <strong className="text-[#d4af37]">Acesso a todas as ferramentas:</strong> 19 ferramentas especializadas de teologia
                                </p>
                            </div>

                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm">
                                    <strong className="text-[#d4af37]">Créditos iniciais generosos:</strong> Até 20.000 créditos para começar
                                </p>
                            </div>

                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm">
                                    <strong className="text-[#d4af37]">Suporte prioritário:</strong> Atendimento diferenciado
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Promoção */}
                    <div className="bg-gradient-to-r from-[#d4af37] to-[#B8860B] rounded-xl p-4 text-center">
                        <p className="text-[#1e3a5f] font-bold text-lg">
                            🎉 PREÇOS PROMOCIONAIS DE LANÇAMENTO! 🎉
                        </p>
                        <p className="text-[#1e3a5f] text-sm mt-1">
                            A partir de R$ 9,90/mês
                        </p>
                    </div>

                    {/* Botões */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={handleUpgrade}
                            className="flex-1 bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B] font-bold py-6 text-lg"
                        >
                            <Crown className="w-5 h-5 mr-2" />
                            Ver Planos e Preços
                        </Button>

                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1e3a5f] font-bold py-6"
                        >
                            Continuar com Plano Free
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
