import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BusinessDocument = Business & Document;

export enum BusinessCategory {
  SALON = 'salon',
  CLINIC = 'clinic',
  CONSULTANT = 'consultant',
  FITNESS = 'fitness',
  SPA = 'spa',
  DENTAL = 'dental',
  VETERINARY = 'veterinary',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Business {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: BusinessCategory, required: true })
  category: BusinessCategory;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop()
  website: string;

  @Prop({ type: Object })
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Prop({ type: Object })
  workingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };

  @Prop()
  logo: string;

  @Prop({ type: [String] })
  images: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({
    type: Object,
    default: {
      onlinePayment: true,
      cashPayment: true,
    },
  })
  paymentOptions: {
    onlinePayment: boolean;
    cashPayment: boolean;
  };
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
