import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StaffDocument = Staff & Document;

@Schema({ timestamps: true })
export class Staff {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId: Types.ObjectId;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  avatar: string;

  @Prop()
  bio: string;

  @Prop({
    type: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 },
        startTime: String,
        endTime: String,
        isAvailable: { type: Boolean, default: true },
      },
    ],
    default: [],
  })
  workingHours: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Service' }], default: [] })
  assignedServices: Types.ObjectId[];

  @Prop({
    type: [{ startDate: Date, endDate: Date, reason: String }],
    default: [],
  })
  timeOff: { startDate: Date; endDate: Date; reason: string }[];

  @Prop({ default: true })
  isActive: boolean;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
