import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  client: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  business: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentIntentId: string;

  @Prop()
  amount: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop()
  notes: string;

  @Prop()
  googleCalendarEventId: string;

  @Prop()
  zoomMeetingId: string;

  @Prop()
  zoomJoinUrl: string;

  @Prop()
  zoomStartUrl: string;

  @Prop({ default: false })
  reminderSent: boolean;

  @Prop({ type: [Object] })
  reminders: { type: string; sentAt: Date; scheduledFor: Date }[];

  @Prop()
  cancellationReason: string;

  @Prop()
  cancelledAt: Date;

  @Prop()
  confirmedAt: Date;

  @Prop()
  completedAt: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
