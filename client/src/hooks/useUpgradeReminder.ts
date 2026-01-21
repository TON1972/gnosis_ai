import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

const REMINDER_INTERVAL = 15 * 60 * 1000; // 15 minutos em milissegundos
const STORAGE_KEY = "last_upgrade_reminder";

export function useUpgradeReminder() {
    const [showModal, setShowModal] = useState(false);
    const { data: activePlan } = trpc.credits.activePlan.useQuery();

    useEffect(() => {
        // Só executa para usuários com plano free
        if (!activePlan || activePlan.plan.name !== 'free') {
            return;
        }

        // Verifica se já mostramos NESTA sessão
        const sessionShown = sessionStorage.getItem("upgrade_reminder_shown");

        if (!sessionShown) {
            const timer = setTimeout(() => {
                setShowModal(true);
                // Marca como mostrado nesta sessão
                sessionStorage.setItem("upgrade_reminder_shown", "true");
            }, 1000); // 1 segundo de delay para não ser invasivo demais logo no render

            return () => clearTimeout(timer);
        }
    }, [activePlan]);

    const handleClose = () => {
        setShowModal(false);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
    };

    return {
        showModal,
        handleClose,
        isFreePlan: activePlan?.plan.name === 'free'
    };
}
