export enum RealtimeEventType {
  INVENTORY_DELTA = 'INVENTORY_DELTA',
  LOCK_ACQUIRED = 'LOCK_ACQUIRED',
  LOCK_RELEASED = 'LOCK_RELEASED',
  DROP_STATE_CHANGED = 'DROP_STATE_CHANGED',
  HEARTBEAT = 'HEARTBEAT'
}

export interface InventoryDeltaPayload {
  eventId: string;
  remainingSeats: number;
  totalCapacity: number;
  dropStatus: string;
  velocityRps: number;
  timestamp: number;
}

export interface LockAuditPayload {
  eventId: string;
  slotNumber?: number;
  userId: string;
  ttlSeconds: number;
  timestamp: number;
}
