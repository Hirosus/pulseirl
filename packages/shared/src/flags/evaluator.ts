import { getBucket } from './murmurhash';
import { FeatureFlagConfig } from '../types/flags';

export interface EvaluationContext {
  userId: string;
  userAttributes?: Record<string, any>;
}

export interface EvaluationResult {
  flagKey: string;
  enabled: boolean;
  variant: 'A' | 'B';
  reason: 'DISABLED' | 'WHITELIST' | 'ROLLOUT_MATCH' | 'HOLDOUT';
  bucket: number;
}

export function evaluateFlag(
  flag: FeatureFlagConfig,
  context: EvaluationContext
): EvaluationResult {
  const { key, rolloutPercentage, enabled, whitelistUsers } = flag;
  const { userId } = context;

  if (!enabled) {
    return {
      flagKey: key,
      enabled: false,
      variant: 'B',
      reason: 'DISABLED',
      bucket: -1
    };
  }

  // Check Whitelist override
  if (whitelistUsers && whitelistUsers.includes(userId)) {
    return {
      flagKey: key,
      enabled: true,
      variant: 'A',
      reason: 'WHITELIST',
      bucket: 0
    };
  }

  const bucket = getBucket(userId, key);
  const isInExperiment = bucket < rolloutPercentage;

  return {
    flagKey: key,
    enabled: isInExperiment,
    variant: isInExperiment ? 'A' : 'B',
    reason: isInExperiment ? 'ROLLOUT_MATCH' : 'HOLDOUT',
    bucket
  };
}
