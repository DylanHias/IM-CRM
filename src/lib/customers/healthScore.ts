export type HealthTier = 'healthy' | 'atRisk' | 'critical';

export interface HealthBreakdown {
  total: number;
  recency: number;
  pipeline: number;
  frequency: number;
}

export interface HealthScoreInput {
  lastActivityAt: string | null;
  openOpportunityCount: number;
  activityCountLast90Days: number;
  now?: Date;
}

const WEIGHT_RECENCY = 0.4;
const WEIGHT_PIPELINE = 0.3;
const WEIGHT_FREQUENCY = 0.3;

export function scoreHealth(input: HealthScoreInput): HealthBreakdown {
  const now = input.now ?? new Date();
  const daysSince = input.lastActivityAt
    ? (now.getTime() - new Date(input.lastActivityAt).getTime()) / 86400000
    : null;

  const recency =
    daysSince === null || daysSince < 0 ? 0 :
    daysSince <= 7 ? 100 :
    daysSince <= 14 ? 85 :
    daysSince <= 30 ? 65 :
    daysSince <= 60 ? 35 :
    daysSince <= 90 ? 15 : 0;

  const opps = Math.max(0, input.openOpportunityCount);
  const pipeline =
    opps === 0 ? 10 :
    opps === 1 ? 55 :
    opps === 2 ? 75 :
    opps === 3 ? 90 : 100;

  const acts = Math.max(0, input.activityCountLast90Days);
  const frequency =
    acts === 0 ? 0 :
    acts <= 2 ? 40 :
    acts <= 5 ? 70 :
    acts <= 9 ? 90 : 100;

  const total = Math.round(
    WEIGHT_RECENCY * recency + WEIGHT_PIPELINE * pipeline + WEIGHT_FREQUENCY * frequency,
  );

  return { total, recency, pipeline, frequency };
}

export function healthTier(score: number | null | undefined): HealthTier {
  if (score === null || score === undefined) return 'critical';
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'atRisk';
  return 'critical';
}

export function healthTierLabel(tier: HealthTier): string {
  return tier === 'healthy' ? 'Healthy' : tier === 'atRisk' ? 'At risk' : 'Critical';
}

export function healthTierBadgeVariant(tier: HealthTier): 'success' | 'warning' | 'destructive' {
  return tier === 'healthy' ? 'success' : tier === 'atRisk' ? 'warning' : 'destructive';
}

export const HEALTH_TIERS: HealthTier[] = ['healthy', 'atRisk', 'critical'];

export const HEALTH_WEIGHTS = {
  recency: WEIGHT_RECENCY,
  pipeline: WEIGHT_PIPELINE,
  frequency: WEIGHT_FREQUENCY,
} as const;
