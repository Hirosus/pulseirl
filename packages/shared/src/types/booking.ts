import { z } from 'zod';

export enum BookingStatus {
  PENDING_HOLD = 'PENDING_HOLD',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export const ReservationRequestSchema = z.object({
  eventId: z.string().min(1, 'eventId is required'),
  userId: z.string().min(1, 'userId is required'),
  slotCount: z.number().int().min(1, 'slotCount must be at least 1').max(4, 'max 4 tickets per user'),
  idempotencyKey: z.string().min(1, 'idempotencyKey is required')
});

export type ReservationRequest = z.infer<typeof ReservationRequestSchema>;

export interface ReservationHoldResponse {
  success: boolean;
  leaseKey?: string;
  expiresAt?: number;
  remainingSeats: number;
  error?: string;
}

export interface BookingConfirmationRequest {
  leaseKey: string;
  userId: string;
  eventId: string;
  idempotencyKey: string;
}

export interface TicketPassPayload {
  ticketId: string;
  eventId: string;
  userId: string;
  slotNumber: number;
  issuedAt: number;
  qrSignature: string;
}
