import { trpc } from "@/lib/trpc";

export function usePlanAccess() {
  const query = trpc.credits.planAccess.useQuery(undefined, {
    staleTime: 30_000,
  });

  return {
    ...query,
    canUseTools: query.data?.canUseTools ?? false,
    requiresPlan: query.data ? !query.data.canUseTools : false,
    isMigration: query.data?.reason === "migration",
    isPaymentRequired: query.data?.reason === "payment_required",
  };
}
