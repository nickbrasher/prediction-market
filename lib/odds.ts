export interface OutcomeWithPool {
  id: string;
  label: string;
  poolTotal: number;
}

export function calcImpliedProbability(outcome: OutcomeWithPool, allOutcomes: OutcomeWithPool[]): number {
  const total = allOutcomes.reduce((sum, o) => sum + o.poolTotal, 0);
  if (total === 0) return 1 / allOutcomes.length;
  return outcome.poolTotal / total;
}

export function calcPayout(betAmount: number, outcomeBetterPool: number, totalPool: number): number {
  if (outcomeBetterPool === 0) return 0;
  return Math.floor((betAmount / outcomeBetterPool) * totalPool);
}

export function formatOdds(prob: number): string {
  if (prob <= 0) return "N/A";
  const decimal = 1 / prob;
  return `${decimal.toFixed(2)}x`;
}

export function formatPct(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`;
}
