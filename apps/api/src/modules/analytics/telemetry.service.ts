export interface FunnelEvent {
  eventName: 'drop_viewed' | 'hold_acquired' | 'checkout_completed' | 'invite_shared';
  userId: string;
  eventId: string;
  variant: 'A' | 'B';
  experimentKey: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface FunnelConversionReport {
  experimentKey: string;
  variantA: {
    views: number;
    holds: number;
    completions: number;
    viewToHoldRate: number;
    holdToCompletionRate: number;
    overallConversionRate: number;
  };
  variantB: {
    views: number;
    holds: number;
    completions: number;
    viewToHoldRate: number;
    holdToCompletionRate: number;
    overallConversionRate: number;
  };
  conversionLiftPercentage: number;
}

export class TelemetryService {
  private events: FunnelEvent[] = [];

  public track(event: FunnelEvent): void {
    this.events.push(event);
  }

  public getFunnelReport(experimentKey: string): FunnelConversionReport {
    const expEvents = this.events.filter(e => e.experimentKey === experimentKey);

    const counts = {
      A: { views: 0, holds: 0, completions: 0 },
      B: { views: 0, holds: 0, completions: 0 }
    };

    for (const ev of expEvents) {
      const v = ev.variant;
      if (ev.eventName === 'drop_viewed') counts[v].views++;
      else if (ev.eventName === 'hold_acquired') counts[v].holds++;
      else if (ev.eventName === 'checkout_completed') counts[v].completions++;
    }

    const calcRates = (c: { views: number; holds: number; completions: number }) => {
      const viewToHoldRate = c.views > 0 ? (c.holds / c.views) * 100 : 0;
      const holdToCompletionRate = c.holds > 0 ? (c.completions / c.holds) * 100 : 0;
      const overallConversionRate = c.views > 0 ? (c.completions / c.views) * 100 : 0;
      return {
        views: c.views,
        holds: c.holds,
        completions: c.completions,
        viewToHoldRate: Math.round(viewToHoldRate * 10) / 10,
        holdToCompletionRate: Math.round(holdToCompletionRate * 10) / 10,
        overallConversionRate: Math.round(overallConversionRate * 10) / 10
      };
    };

    const variantA = calcRates(counts.A);
    const variantB = calcRates(counts.B);

    const lift =
      variantB.overallConversionRate > 0
        ? Math.round(
            ((variantA.overallConversionRate - variantB.overallConversionRate) /
              variantB.overallConversionRate) *
              1000
          ) / 10
        : 0;

    return {
      experimentKey,
      variantA,
      variantB,
      conversionLiftPercentage: lift
    };
  }

  public getRawEvents(): FunnelEvent[] {
    return [...this.events];
  }

  public clear(): void {
    this.events = [];
  }
}
