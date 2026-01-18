import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

const REMINDER_INTERVAL = 10 * 60 * 1000; // 10 minutos em milissegundos
const STORAGE_KEY = "last_upgrade_reminder";

export function useUpgradeReminder() {
    const [showModal, setShowModal] = useState(false);
    const { data: activePlan } = trpc.credits.activePlan.useQuery();

    useEffect(() => {
        // Feature desativada temporariamente
        return;

        // // Só executa para usuários com plano free
        // if (!activePlan || activePlan.plan.name !== 'free') {
        //     return;
        // }

        // // Verifica quando foi a última vez que o modal foi exibido
        // const lastShown = localStorage.getItem(STORAGE_KEY);
        // const now = Date.now();

        // if (!lastShown) {
        //     // Primeira vez: mostrar após 2 minutos de uso
        //     const timer = setTimeout(() => {
        //         setShowModal(true);
        //         localStorage.setItem(STORAGE_KEY, now.toString());
        //     }, 2 * 60 * 1000); // 2 minutos

        //     return () => clearTimeout(timer);
        // }

        // const timeSinceLastShown = now - parseInt(lastShown, 10);

        // // Se já passou o intervalo, mostra o modal
        // if (timeSinceLastShown >= REMINDER_INTERVAL) {
        //     const timer = setTimeout(() => {
        //         setShowModal(true);
        //         localStorage.setItem(STORAGE_KEY, now.toString());
        //     }, 1000); // Mostra após 1 segundo de carregamento da página

        //     return () => clearTimeout(timer);
        // }

        // // Agenda para mostrar quando o intervalo completar
        // const timer = setTimeout(() => {
        //     setShowModal(true);
        //     localStorage.setItem(STORAGE_KEY, Date.now().toString());
        // }, REMINDER_INTERVAL - timeSinceLastShown);

        // return () => clearTimeout(timer);
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
