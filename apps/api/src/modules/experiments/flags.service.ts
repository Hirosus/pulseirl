import { FeatureFlagConfig, evaluateFlag, EvaluationResult } from '@pulseirl/shared';

export class FeatureFlagService {
  private flags: Map<string, FeatureFlagConfig> = new Map();

  constructor() {
    this.seedDefaultFlags();
  }

  private seedDefaultFlags() {
    this.registerFlag({
      key: 'fast_checkout_holdout',
      rolloutPercentage: 50,
      description: 'A/B test: 1-tap instant reservation versus traditional confirmation modal',
      enabled: true,
      whitelistUsers: ['usr_admin_lagos', 'usr_qa_test']
    });

    this.registerFlag({
      key: 'ai_vibe_matchmaker',
      rolloutPercentage: 100,
      description: 'Enables real-time attendee compatibility scoring on mobile passes',
      enabled: true
    });
  }

  public registerFlag(config: FeatureFlagConfig): void {
    this.flags.set(config.key, config);
  }

  public updateRollout(key: string, percentage: number): boolean {
    const flag = this.flags.get(key);
    if (!flag) return false;
    flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    return true;
  }

  public setEnabled(key: string, enabled: boolean): boolean {
    const flag = this.flags.get(key);
    if (!flag) return false;
    flag.enabled = enabled;
    return true;
  }

  public evaluate(key: string, userId: string): EvaluationResult {
    const flag = this.flags.get(key);
    if (!flag) {
      return {
        flagKey: key,
        enabled: false,
        variant: 'B',
        reason: 'DISABLED',
        bucket: -1
      };
    }
    return evaluateFlag(flag, { userId });
  }

  public getAllFlags(): FeatureFlagConfig[] {
    return Array.from(this.flags.values());
  }
}
