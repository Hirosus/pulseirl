import { ReservationService } from './reservation.service';

export class LeaseCleanerWorker {
  private service: ReservationService;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(service: ReservationService) {
    this.service = service;
  }

  public start(eventId: string, intervalMs: number = 1000): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(async () => {
      await this.service.reclaimExpiredLeases(eventId);
    }, intervalMs);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async runOnce(eventId: string): Promise<number> {
    return this.service.reclaimExpiredLeases(eventId);
  }
}
