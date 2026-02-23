import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  appointmentId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    type: { text: String, respondedAt: Date },
    default: null,
  })
  response: { text: string; respondedAt: Date } | null;

  @Prop({ default: true })
  isVisible: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
