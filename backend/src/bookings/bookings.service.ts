import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ServicesService } from '../services/services.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BusinessesService } from '../businesses/businesses.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private servicesService: ServicesService,
    private notificationsService: NotificationsService,
    private businessesService: BusinessesService,
  ) {}

  async create(createBookingDto: CreateBookingDto, clientId: string): Promise<BookingDocument> {
    const service = await this.servicesService.findOne(createBookingDto.serviceId);
    const startTime = new Date(createBookingDto.startTime);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    const conflicting = await this.bookingModel.findOne({
      business: new Types.ObjectId(createBookingDto.businessId),
      service: new Types.ObjectId(createBookingDto.serviceId),
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
      ],
    });

    if (conflicting) {
      throw new BadRequestException('Time slot is not available');
    }

    const booking = new this.bookingModel({
      client: new Types.ObjectId(clientId),
      business: new Types.ObjectId(createBookingDto.businessId),
      service: new Types.ObjectId(createBookingDto.serviceId),
      startTime,
      endTime,
      amount: service.price,
      currency: service.currency,
      notes: createBookingDto.notes,
    });

    const saved = await booking.save();

    try {
      await this.notificationsService.sendBookingConfirmation(saved._id.toString());
    } catch (err) {
      this.logger.warn(`Notification failed for booking ${saved._id}: ${err.message}`);
    }

    return saved;
  }

  async findAll(filter?: { clientId?: string; businessId?: string; status?: BookingStatus }): Promise<BookingDocument[]> {
    const query: any = {};
    if (filter?.clientId) query.client = new Types.ObjectId(filter.clientId);
    if (filter?.businessId) query.business = new Types.ObjectId(filter.businessId);
    if (filter?.status) query.status = filter.status;

    return this.bookingModel
      .find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('business', 'name category')
      .populate('service', 'name duration price')
      .sort({ startTime: 1 })
      .exec();
  }

  async findByBusiness(businessId: string, ownerId: string): Promise<BookingDocument[]> {
    const businesses = await this.businessesService.findByOwner(ownerId);
    const owned = businesses.find((b) => b._id.toString() === businessId);
    if (!owned) throw new ForbiddenException('Not authorized to view bookings for this business');

    return this.bookingModel
      .find({ business: new Types.ObjectId(businessId) })
      .populate('client', 'firstName lastName email phone')
      .populate('business', 'name category')
      .populate('service', 'name duration price')
      .sort({ startTime: 1 })
      .exec();
  }

  async findOne(id: string): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('client', 'firstName lastName email phone')
      .populate('business', 'name category address')
      .populate('service', 'name duration price requiresZoom')
      .exec();
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async update(id: string, updateDto: UpdateBookingDto): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');

    if (updateDto.status === BookingStatus.CONFIRMED) {
      updateDto['confirmedAt'] = new Date();
    }
    if (updateDto.status === BookingStatus.CANCELLED) {
      updateDto['cancelledAt'] = new Date();
    }

    return this.bookingModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  async cancel(id: string, clientId: string, reason?: string): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.client.toString() !== clientId) {
      throw new BadRequestException('Not authorized to cancel this booking');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    return this.bookingModel
      .findByIdAndUpdate(
        id,
        {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async complete(id: string, ownerId: string): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id).populate('business').exec();
    if (!booking) throw new NotFoundException('Booking not found');

    const business = booking.business as any;
    if (business?.owner?.toString() !== ownerId) {
      throw new ForbiddenException('Not authorized to complete this booking');
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be marked as completed');
    }
    if (new Date(booking.endTime) > new Date()) {
      throw new BadRequestException('Cannot complete a booking before its end time');
    }

    return this.bookingModel
      .findByIdAndUpdate(
        id,
        { status: BookingStatus.COMPLETED, completedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async getAvailableSlots(businessId: string, serviceId: string, date: string): Promise<string[]> {
    const service = await this.servicesService.findOne(serviceId);
    const dayStart = new Date(`${date}T09:00:00`);
    const dayEnd = new Date(`${date}T18:00:00`);

    const existingBookings = await this.bookingModel.find({
      business: new Types.ObjectId(businessId),
      service: new Types.ObjectId(serviceId),
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      startTime: { $gte: dayStart, $lt: dayEnd },
    });

    const slots: string[] = [];
    const slotDuration = service.duration * 60000;
    let current = dayStart.getTime();

    while (current + slotDuration <= dayEnd.getTime()) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current + slotDuration);
      const isBooked = existingBookings.some(
        (b) =>
          (b.startTime >= slotStart && b.startTime < slotEnd) ||
          (b.endTime > slotStart && b.endTime <= slotEnd),
      );
      if (!isBooked) {
        slots.push(slotStart.toISOString());
      }
      current += slotDuration;
    }

    return slots;
  }
}
