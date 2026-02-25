import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoCompleteBookings(): Promise<void> {
    const now = new Date();
    const result = await this.bookingModel.updateMany(
      {
        status: BookingStatus.CONFIRMED,
        endTime: { $lte: now },
      },
      {
        $set: { status: BookingStatus.COMPLETED, completedAt: now },
      },
    );
    if (result.modifiedCount > 0) {
      this.logger.log(`Auto-completed ${result.modifiedCount} past bookings`);
    }
  }
}
