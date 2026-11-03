/**
 * PulseIRL Concurrency Stress Test Benchmark
 * Simulates high-demand flash ticket drops with 1,000 concurrent requests
 * competing for 50 spots. Measures latency percentiles and verifies 0 double-bookings.
 */
import { ReservationService } from '../apps/api/src/modules/booking/reservation.service';
import { DatabaseMemoryStore } from '../apps/api/src/infrastructure/db/client';

async function runBenchmark() {
  console.log('===============================================================');
  console.log(' PULSE:IRL HIGH-CONCURRENCY RESERVATION BENCHMARK ');
  console.log('===============================================================');

  DatabaseMemoryStore.reset();
  const service = new ReservationService();
  const eventId = 'ev_benchmark_flash_drop';
  const totalCapacity = 50;
  const totalRequests = 1000;

  console.log(`[SETUP] Initializing event ${eventId} with ${totalCapacity} available spots.`);
  await service.initializeEventInventory(eventId, totalCapacity);

  console.log(`[LOAD] Firing ${totalRequests} concurrent reservation requests...`);

  const latencies: number[] = [];
  const startTime = Date.now();

  const promises = Array.from({ length: totalRequests }, async (_, i) => {
    const t0 = performance.now();
    const res = await service.acquireHold(eventId, `worker_user_${i}`, 1, 300);
    const duration = performance.now() - t0;
    latencies.push(duration);
    return res;
  });

  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startTime;

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)].toFixed(2);
  const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);
  const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(2);

  const successful = results.filter(r => r.success);
  const rejected = results.filter(r => !r.success);

  console.log('\n--- BENCHMARK RESULTS ---');
  console.log(`Total Requests:         ${totalRequests}`);
  console.log(`Total Duration:         ${totalDuration}ms`);
  console.log(`Throughput:             ${Math.round((totalRequests / (totalDuration || 1)) * 1000)} req/sec`);
  console.log(`P50 Latency:            ${p50}ms`);
  console.log(`P95 Latency:            ${p95}ms`);
  console.log(`P99 Latency:            ${p99}ms`);
  console.log(`Successful Holds:       ${successful.length} (Expected: ${totalCapacity})`);
  console.log(`Rejected (Exhausted):   ${rejected.length} (Expected: ${totalRequests - totalCapacity})`);

  // Final Settlement Verification
  console.log('\n[SETTLEMENT] Committing confirmed bookings to simulated PostgreSQL transaction...');
  for (const hold of successful) {
    const confirmRes = await service.confirmBooking(
      hold.leaseKey!,
      'worker_user',
      eventId,
      `idem_${hold.leaseKey}`
    );
    if (!confirmRes.success) {
      throw new Error(`Settlement failed for lease ${hold.leaseKey}`);
    }
  }

  const finalCapacity = await service.getAvailableCapacity(eventId);
  const totalBookingsInDb = DatabaseMemoryStore.bookings.size;

  console.log(`Final Redis Available:  ${finalCapacity}`);
  console.log(`PostgreSQL Bookings:    ${totalBookingsInDb}`);
  console.log(`Double-Booking Errors:  ${totalBookingsInDb === totalCapacity ? '0 (PASSED)' : 'FAILED'}`);
  console.log('===============================================================\n');
}

runBenchmark().catch(console.error);
