import { Button } from "./ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const BONUS_CREDITS = [
    { amount: 1000, price: 9.90, label: "R$ 9,90" },
    { amount: 3000, price: 24.90, label: "R$ 24,90" },
    { amount: 6000, price: 39.90, label: "R$ 39,90" },
    { amount: 10000, price: 69.90, label: "R$ 69,90" },
];

export default function CreditPackages() {
    const createCheckout = trpc.payments.createCheckoutSession.useMutation({
        onSuccess: (data) => {
            if (data.init_point) {
                window.location.href = data.init_point;
            }
        },
        onError: (error) => {
            toast.error("Erro ao iniciar pagamento: " + error.message);
        }
    });

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {BONUS_CREDITS.map((credit, index) => {
                const isProcessing = createCheckout.isPending && createCheckout.variables?.id === String(credit.amount);
                return (
                    <div key={index} className="p-4 md:p-6 rounded-2xl border-4 text-center transition-all flex flex-col items-center bg-white border-[#d4af37]/20 shadow-md hover:border-[#d4af37] hover:shadow-xl group">
                        <Sparkles className="w-8 h-8 mb-2 text-[#d4af37] group-hover:scale-125 transition-transform" />
                        <h5 className="text-2xl font-black text-[#1e3a5f]">{credit.amount.toLocaleString('pt-BR')}</h5>
                        <p className="text-[10px] uppercase font-bold opacity-60 mb-4 text-[#8b6f47]">Créditos</p>
                        <div className="mt-auto w-full">
                            <p className="text-xl font-black mb-4 text-[#1e3a5f]">{credit.label}</p>
                            <Button
                                onClick={() => createCheckout.mutate({
                                    type: 'credits',
                                    id: String(credit.amount),
                                    price: credit.price,
                                    title: `Recarga de ${credit.amount} créditos - Gnosis AI`
                                })}
                                disabled={createCheckout.isPending}
                                className="w-full font-bold text-xs bg-[#1e3a5f] text-white active:scale-95 transition-all hover:bg-[#d4af37] hover:text-[#1e3a5f]"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'COMPRAR'}
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
