export class InMemoryRedisLockManager {
  private kv: Map<string, string> = new Map();
  private hashes: Map<string, Map<string, string>> = new Map();
  private expirations: Map<string, number> = new Map();

  public async get(key: string): Promise<string | null> {
    this.cleanExpired(key);
    return this.kv.get(key) ?? null;
  }

  public async set(key: string, val: string, ttlSeconds?: number): Promise<'OK'> {
    this.kv.set(key, val);
    if (ttlSeconds) {
      this.expirations.set(key, Date.now() + ttlSeconds * 1000);
    }
    return 'OK';
  }

  public async decrby(key: string, amount: number): Promise<number> {
    const curr = parseInt(this.kv.get(key) || '0', 10);
    const updated = curr - amount;
    this.kv.set(key, updated.toString());
    return updated;
  }

  public async incrby(key: string, amount: number): Promise<number> {
    const curr = parseInt(this.kv.get(key) || '0', 10);
    const updated = curr + amount;
    this.kv.set(key, updated.toString());
    return updated;
  }

  public async del(key: string): Promise<number> {
    const existed = this.kv.delete(key) || this.hashes.delete(key);
    this.expirations.delete(key);
    return existed ? 1 : 0;
  }

  public async exists(key: string): Promise<number> {
    this.cleanExpired(key);
    return (this.kv.has(key) || this.hashes.has(key)) ? 1 : 0;
  }

  public async executeReserveLua(
    capKey: string,
    leaseKey: string,
    ttlSeconds: number,
    userId: string,
    slots: number
  ): Promise<{ success: boolean; remaining: number; code: string }> {
    this.cleanExpired(leaseKey);
    this.cleanExpired(capKey);

    if (this.hashes.has(leaseKey) || this.kv.has(leaseKey)) {
      return { success: false, remaining: -1, code: 'USER_ALREADY_HOLDS_LEASE' };
    }

    const currentVal = this.kv.get(capKey);
    if (currentVal === undefined) {
      return { success: false, remaining: -2, code: 'EVENT_NOT_INITIALIZED' };
    }

    const currentCap = parseInt(currentVal, 10);
    if (currentCap >= slots) {
      const remaining = currentCap - slots;
      this.kv.set(capKey, remaining.toString());

      const hashData = new Map<string, string>();
      hashData.set('userId', userId);
      hashData.set('slots', slots.toString());
      hashData.set('createdAt', Date.now().toString());
      this.hashes.set(leaseKey, hashData);
      this.expirations.set(leaseKey, Date.now() + ttlSeconds * 1000);

      return { success: true, remaining, code: 'LEASE_ACQUIRED' };
    } else {
      return { success: false, remaining: currentCap, code: 'CAPACITY_EXHAUSTED' };
    }
  }

  public async executeReleaseLua(
    capKey: string,
    leaseKey: string
  ): Promise<{ success: boolean; newCap: number; code: string }> {
    if (this.hashes.has(leaseKey)) {
      const slots = parseInt(this.hashes.get(leaseKey)?.get('slots') || '1', 10);
      this.hashes.delete(leaseKey);
      this.expirations.delete(leaseKey);
      const curr = parseInt(this.kv.get(capKey) || '0', 10);
      const newCap = curr + slots;
      this.kv.set(capKey, newCap.toString());
      return { success: true, newCap, code: 'LEASE_RELEASED' };
    }
    return { success: false, newCap: 0, code: 'LEASE_NOT_FOUND' };
  }

  public getExpiredLeases(): string[] {
    const now = Date.now();
    const expired: string[] = [];
    for (const [key, expiresAt] of this.expirations.entries()) {
      if (now > expiresAt) {
        expired.push(key);
      }
    }
    return expired;
  }

  public forceExpire(key: string) {
    this.expirations.set(key, Date.now() - 1000);
  }

  private cleanExpired(key: string) {
    const exp = this.expirations.get(key);
    if (exp && Date.now() > exp) {
      this.kv.delete(key);
      this.hashes.delete(key);
      this.expirations.delete(key);
    }
  }
}
