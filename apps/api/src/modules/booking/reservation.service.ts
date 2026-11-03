import { InMemoryRedisLockManager } from '../../infrastructure/redis/redis.client';
import { DatabaseMemoryStore } from '../../infrastructure/db/client';
import crypto from 'crypto';

export interface BookingConfirmationResult {
  success: boolean;
  bookingId?: string;
  qrSignature?: string;
  error?: string;
  idempotentReplay?: boolean;
}

export class ReservationService {
  private redis: InMemoryRedisLockManager;

  constructor(redisClient?: InMemoryRedisLockManager) {
    this.redis = redisClient ?? new InMemoryRedisLockManager();
  }

  public async initializeEventInventory(eventId: string, totalCapacity: number): Promise<void> {
    const capKey = `event:${eventId}:available`;
    await this.redis.set(capKey, totalCapacity.toString());
    
    // Seed DB slots in memory store
    for (let i = 1; i <= totalCapacity; i++) {
      const slotId = `slot_${eventId}_${i}`;
      DatabaseMemoryStore.slots.set(slotId, {
        id: slotId,
        eventId,
        slotNumber: i,
        status: 'AVAILABLE'
      });
    }
  }

  public async acquireHold(
    eventId: string,
    userId: string,
    slotCount: number = 1,
    ttlSeconds: number = 300
  ): Promise<{ success: boolean; leaseKey?: string; remaining: number; error?: string }> {
    const capKey = `event:${eventId}:available`;
    const leaseKey = `reserve:${eventId}:${userId}`;

    const res = await this.redis.executeReserveLua(capKey, leaseKey, ttlSeconds, userId, slotCount);
    
    if (res.success) {
      return {
        success: true,
        leaseKey,
        remaining: res.remaining
      };
    } else {
      return {
        success: false,
        remaining: res.remaining,
        error: res.code
      };
    }
  }

  public async confirmBooking(
    leaseKey: string,
    userId: string,
    eventId: string,
    idempotencyKey: string
  ): Promise<BookingConfirmationResult> {
    // 1. Idempotency Check
    if (DatabaseMemoryStore.idempotencyKeys.has(idempotencyKey)) {
      // Find existing booking
      for (const booking of DatabaseMemoryStore.bookings.values()) {
        if (booking.idempotencyKey === idempotencyKey) {
          return {
            success: true,
            bookingId: booking.id,
            qrSignature: booking.qrSignature,
            idempotentReplay: true
          };
        }
      }
    }

    // 2. Verify Lease exists in Redis
    const hasLease = await this.redis.exists(leaseKey);
    if (!hasLease) {
      return {
        success: false,
        error: 'LEASE_EXPIRED_OR_INVALID'
      };
    }

    // 3. PostgreSQL Transaction Simulation with SELECT ... FOR UPDATE
    let targetSlot = null;
    for (const slot of DatabaseMemoryStore.slots.values()) {
      if (slot.eventId === eventId && slot.status === 'AVAILABLE') {
        targetSlot = slot;
        break;
      }
    }

    if (!targetSlot) {
      return {
        success: false,
        error: 'NO_PHYSICAL_SLOT_AVAILABLE'
      };
    }

    // Commit slot locking inside transaction
    targetSlot.status = 'CONFIRMED';
    targetSlot.heldByUserId = userId;

    const bookingId = `bk_${crypto.randomUUID().slice(0, 8)}`;
    const qrSignature = crypto
      .createHmac('sha256', 'pulseirl_secret_key_lagos')
      .update(`${bookingId}:${userId}:${eventId}:${targetSlot.slotNumber}`)
      .digest('hex');

    const bookingRecord = {
      id: bookingId,
      userId,
      eventId,
      slotId: targetSlot.id,
      idempotencyKey,
      qrSignature,
      status: 'CONFIRMED' as const,
      createdAt: new Date()
    };

    DatabaseMemoryStore.bookings.set(bookingId, bookingRecord);
    DatabaseMemoryStore.idempotencyKeys.add(idempotencyKey);

    // 4. Delete Redis lease since booking is finalized
    await this.redis.del(leaseKey);

    return {
      success: true,
      bookingId,
      qrSignature,
      idempotentReplay: false
    };
  }

  public async reclaimExpiredLeases(eventId: string): Promise<number> {
    const expiredKeys = this.redis.getExpiredLeases();
    let reclaimed = 0;
    const capKey = `event:${eventId}:available`;

    for (const key of expiredKeys) {
      if (key.startsWith(`reserve:${eventId}:`)) {
        await this.redis.executeReleaseLua(capKey, key);
        reclaimed++;
      }
    }
    return reclaimed;
  }

  public async getAvailableCapacity(eventId: string): Promise<number> {
    const val = await this.redis.get(`event:${eventId}:available`);
    return val ? parseInt(val, 10) : 0;
  }

  public getRedisClient(): InMemoryRedisLockManager {
    return this.redis;
  }
}
