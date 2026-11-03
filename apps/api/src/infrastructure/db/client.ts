export interface MockDatabaseSlot {
  id: string;
  eventId: string;
  slotNumber: number;
  status: 'AVAILABLE' | 'HELD' | 'CONFIRMED';
  heldByUserId?: string;
  heldUntil?: Date;
}

export interface MockDatabaseBooking {
  id: string;
  userId: string;
  eventId: string;
  slotId: string;
  idempotencyKey: string;
  qrSignature: string;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: Date;
}

export class DatabaseMemoryStore {
  public static events: Map<string, any> = new Map();
  public static slots: Map<string, MockDatabaseSlot> = new Map();
  public static bookings: Map<string, MockDatabaseBooking> = new Map();
  public static idempotencyKeys: Set<string> = new Set();

  public static reset() {
    this.events.clear();
    this.slots.clear();
    this.bookings.clear();
    this.idempotencyKeys.clear();
  }
}
