import PaymentRequiredGate from "@/components/PaymentRequiredGate";
import BasicMigrationGate, {
  BasicMigrationModalContent,
} from "@/components/BasicMigrationModal";
import { usePlanAccess } from "@/hooks/usePlanAccess";

type PlanRequiredModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Modal bloqueante ao clicar em ferramenta sem plano ativo.
 */
export default function PlanRequiredModal({
  open,
  onOpenChange,
}: PlanRequiredModalProps) {
  const { data: planAccess, isLoading } = usePlanAccess();

  if (!open || isLoading || !planAccess || planAccess.canUseTools) {
    return null;
  }

  if (planAccess.reason === "migration") {
    return (
      <BasicMigrationModalContent
        open
        allowDismiss={false}
        deadlineIso={planAccess.migrationDeadline ?? ""}
        startDateIso={planAccess.migrationStartDate ?? ""}
        defaultPlanId={planAccess.defaultPlanId}
        onDismiss={() => onOpenChange(false)}
      />
    );
  }

  return (
    <PaymentRequiredGate forceOpen allowClose={false} onClose={() => onOpenChange(false)} />
  );
}

/** Gate global: bloqueia dashboard para quem precisa pagar (não-migração) */
export function PlanAccessGate() {
  const { data: planAccess, isLoading } = usePlanAccess();

  if (isLoading || !planAccess || planAccess.canUseTools) return null;

  if (planAccess.reason === "migration") {
    return <BasicMigrationGate />;
  }

  return <PaymentRequiredGate forceOpen allowClose={false} />;
}
