import { AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

export default function SubscriptionWarningBanner() {
  const { data: subscriptionStatus, refetch } = trpc.subscription.status.useQuery();
  const [isVisible, setIsVisible] = useState(true);

  // Refetch status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [refetch]);

  if (!subscriptionStatus || subscriptionStatus.status === "active") {
    return null; // No warning needed
  }

  if (subscriptionStatus.status === "blocked") {
    // Account is blocked
    return (
      <div className="bg-red-600 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-lg">CONTA BLOQUEADA</p>
              <p className="text-sm">
                Sua assinatura está bloqueada por falta de pagamento. Renove agora para continuar usando as ferramentas.
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.location.href = "/dashboard"}
            className="bg-white text-red-600 hover:bg-gray-100 font-bold flex items-center gap-2 whitespace-nowrap"
          >
            <CreditCard className="w-5 h-5" />
            RENOVAR AGORA
          </Button>
        </div>
      </div>
    );
  }

  if (subscriptionStatus.status === "grace_period" && isVisible) {
    // Grace period active
    const hoursLeft = subscriptionStatus.daysUntilBlock 
      ? Math.ceil(subscriptionStatus.daysUntilBlock * 24) 
      : 72;

    // Determine color based on hours left
    let bgColor = "bg-yellow-500"; // 48-72h
    if (hoursLeft <= 24) {
      bgColor = "bg-orange-600"; // 0-24h (mais urgente)
    } else if (hoursLeft <= 48) {
      bgColor = "bg-orange-500"; // 24-48h
    }

    return (
      <div className={`${bgColor} text-gray-900 py-4 px-6 shadow-lg sticky top-0 z-50 animate-pulse`}>
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold text-lg">CARO USUÁRIO, O VENCIMENTO DA SUA ASSINATURA EXPIROU</p>
              <p className="text-sm">
                Favor fazer a renovação dentro das próximas {hoursLeft} horas. É um prazer tê-lo conosco!
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => window.location.href = "/dashboard"}
              className="bg-gray-900 text-white hover:bg-gray-800 font-bold flex items-center gap-2 whitespace-nowrap"
            >
              <CreditCard className="w-5 h-5" />
              CLIQUE AQUI PARA RENOVAR!
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              variant="outline"
              className="border-gray-900 text-gray-900 hover:bg-gray-100"
            >
              ✕
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

