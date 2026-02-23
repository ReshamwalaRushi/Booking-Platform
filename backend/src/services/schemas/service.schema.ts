import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceDocument = Service & Document;

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  business: Types.ObjectId;

  @Prop({ required: true })
  duration: number; // minutes

  @Prop({ required: true })
  price: number; // cents

  @Prop({ default: 'USD' })
  currency: string;

  @Prop()
  category: string;

  @Prop({ type: [String] })
  images: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 1 })
  maxCapacity: number;

  @Prop({ default: false })
  requiresZoom: boolean;

  @Prop({ type: [String] })
  staffIds: string[];
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
