import { z } from 'zod';

export enum EventStatus {
  UPCOMING = 'UPCOMING',
  LIVE_DROP = 'LIVE_DROP',
  SOLD_OUT = 'SOLD_OUT',
  CONCLUDED = 'CONCLUDED'
}

export const EventDetailsSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  venue: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().int().positive(),
  availableSeats: z.number().int().min(0),
  status: z.nativeEnum(EventStatus)
});

export type EventDetails = z.infer<typeof EventDetailsSchema>;

export interface InventoryDeltaBroadcast {
  eventId: string;
  availableSeats: number;
  totalCapacity: number;
  dropStatus: EventStatus;
  timestamp: number;
}
