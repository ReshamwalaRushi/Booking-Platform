import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as PDFDocument from 'pdfkit';
import { Booking, BookingDocument, BookingStatus, PaymentStatus } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ServicesService } from '../services/services.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { BusinessesService } from '../businesses/businesses.service';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private servicesService: ServicesService,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
    private businessesService: BusinessesService,
    private staffService: StaffService,
  ) {}

  private generateBookingNumber(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000).toString();
    return `BK-${date}-${rand}`;
  }

  async create(createBookingDto: CreateBookingDto, clientId: string): Promise<BookingDocument> {
    const service = await this.servicesService.findOne(createBookingDto.serviceId);
    const startTime = new Date(createBookingDto.startTime);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    // Check availability per-staff if staffId provided, otherwise check globally
    const conflictQuery: any = {
      business: new Types.ObjectId(createBookingDto.businessId),
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
      ],
    };

    if (createBookingDto.staffId) {
      conflictQuery.staff = new Types.ObjectId(createBookingDto.staffId);
    } else {
      conflictQuery.service = new Types.ObjectId(createBookingDto.serviceId);
    }

    const conflicting = await this.bookingModel.findOne(conflictQuery);

    if (conflicting) {
      throw new BadRequestException('Time slot is not available');
    }

    // Generate unique booking number
    let bookingNumber: string;
    let attempts = 0;
    do {
      bookingNumber = this.generateBookingNumber();
      attempts++;
    } while (attempts < 10 && await this.bookingModel.findOne({ bookingNumber }));

    const booking = new this.bookingModel({
      client: new Types.ObjectId(clientId),
      business: new Types.ObjectId(createBookingDto.businessId),
      service: new Types.ObjectId(createBookingDto.serviceId),
      staff: createBookingDto.staffId ? new Types.ObjectId(createBookingDto.staffId) : undefined,
      startTime,
      endTime,
      amount: service.price,
      currency: 'INR',
      notes: createBookingDto.notes,
      bookingNumber,
      paymentMethod: createBookingDto.paymentMethod,
    });

    const saved = await booking.save();

    try {
      await this.notificationsService.sendBookingConfirmation(saved._id.toString());
      // Real-time notification to the client
      this.notificationsGateway.notifyUser(clientId, {
        type: 'new_booking',
        message: `Your booking for "${service.name}" has been created! Booking #${bookingNumber}`,
        data: { bookingId: saved._id.toString(), bookingNumber },
      });
      // Real-time notification to the business owner
      const businessDoc = await this.businessesService.findOne(saved.business.toString());
      if (businessDoc?.owner) {
        const ownerId = businessDoc.owner.toString();
        this.notificationsGateway.notifyUser(ownerId, {
          type: 'new_booking_received',
          message: `New booking #${bookingNumber} received for "${service.name}"`,
          data: { bookingId: saved._id.toString(), bookingNumber },
        });
      }
    } catch (err) {
      this.logger.warn(`Notification failed for booking ${saved._id}: ${err.message}`);
    }

    return saved;
  }

  async findAll(filter?: { clientId?: string; businessId?: string; status?: BookingStatus; bookingNumber?: string; search?: string; fromDate?: string; toDate?: string }): Promise<BookingDocument[]> {
    const query: any = {};
    if (filter?.clientId) query.client = new Types.ObjectId(filter.clientId);
    if (filter?.businessId) query.business = new Types.ObjectId(filter.businessId);
    if (filter?.status) query.status = filter.status;
    if (filter?.bookingNumber) query.bookingNumber = { $regex: filter.bookingNumber, $options: 'i' };
    if (filter?.fromDate || filter?.toDate) {
      query.startTime = {};
      if (filter.fromDate) query.startTime.$gte = new Date(filter.fromDate);
      if (filter.toDate) query.startTime.$lte = new Date(filter.toDate + 'T23:59:59.999Z');
    }
    if (filter?.search) {
      query.$or = [
        { bookingNumber: { $regex: filter.search, $options: 'i' } },
      ];
    }

    return this.bookingModel
      .find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('business', 'name category')
      .populate('service', 'name duration price')
      .populate('staff', 'firstName lastName')
      .sort({ startTime: -1 })
      .exec();
  }

  async findByBusiness(businessId: string, ownerId: string, filter?: { search?: string; staffId?: string; status?: BookingStatus; fromDate?: string; toDate?: string }): Promise<BookingDocument[]> {
    const businesses = await this.businessesService.findByOwner(ownerId);
    const owned = businesses.find((b) => b._id.toString() === businessId);
    if (!owned) throw new ForbiddenException('Not authorized to view bookings for this business');

    const query: any = { business: new Types.ObjectId(businessId) };
    if (filter?.status) query.status = filter.status;
    if (filter?.staffId) query.staff = new Types.ObjectId(filter.staffId);
    if (filter?.fromDate || filter?.toDate) {
      query.startTime = {};
      if (filter.fromDate) query.startTime.$gte = new Date(filter.fromDate);
      if (filter.toDate) query.startTime.$lte = new Date(filter.toDate + 'T23:59:59.999Z');
    }
    if (filter?.search) {
      query.$or = [
        { bookingNumber: { $regex: filter.search, $options: 'i' } },
      ];
    }

    return this.bookingModel
      .find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('business', 'name category')
      .populate('service', 'name duration price')
      .populate('staff', 'firstName lastName')
      .sort({ startTime: -1 })
      .exec();
  }

  async findOne(id: string): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('client', 'firstName lastName email phone')
      .populate('business', 'name category address')
      .populate('service', 'name duration price requiresZoom')
      .populate('staff', 'firstName lastName')
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

  async confirm(id: string, ownerId: string): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id).populate('business').exec();
    if (!booking) throw new NotFoundException('Booking not found');

    const business = booking.business as any;
    if (business?.owner?.toString() !== ownerId) {
      throw new ForbiddenException('Not authorized to confirm this booking');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be confirmed');
    }

    return this.bookingModel
      .findByIdAndUpdate(id, { status: BookingStatus.CONFIRMED, confirmedAt: new Date() }, { new: true })
      .exec();
  }

  async markAsPaid(id: string, ownerId: string, paymentMethod?: string): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id).populate('business').exec();
    if (!booking) throw new NotFoundException('Booking not found');

    const business = booking.business as any;
    if (business?.owner?.toString() !== ownerId) {
      throw new ForbiddenException('Not authorized to update payment for this booking');
    }

    return this.bookingModel
      .findByIdAndUpdate(
        id,
        { paymentStatus: PaymentStatus.PAID, paymentMethod: paymentMethod || 'cash' },
        { new: true },
      )
      .exec();
  }

  async reschedule(id: string, newStartTime: string, clientId: string): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.client.toString() !== clientId) {
      throw new BadRequestException('Not authorized to reschedule this booking');
    }
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestException('Only pending or confirmed bookings can be rescheduled');
    }

    const service = await this.servicesService.findOne(booking.service.toString());
    const startTime = new Date(newStartTime);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    const conflictQuery: any = {
      _id: { $ne: booking._id },
      business: booking.business,
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
      ],
    };

    if (booking.staff) {
      conflictQuery.staff = booking.staff;
    } else {
      conflictQuery.service = booking.service;
    }

    const conflicting = await this.bookingModel.findOne(conflictQuery);

    if (conflicting) {
      throw new BadRequestException('The selected time slot is not available');
    }

    const updated = await this.bookingModel.findByIdAndUpdate(
      id,
      { startTime, endTime },
      { new: true },
    ).exec();

    try {
      const businessDoc = await this.businessesService.findOne(booking.business.toString());
      const newTimeFormatted = startTime.toISOString();
      this.notificationsGateway.notifyUser(clientId, {
        type: 'booking_rescheduled',
        message: `Your booking #${booking.bookingNumber || id.slice(-8)} has been rescheduled to ${newTimeFormatted}`,
        data: { bookingId: id },
      });
      if (businessDoc?.owner) {
        this.notificationsGateway.notifyUser(businessDoc.owner.toString(), {
          type: 'booking_rescheduled',
          message: `Booking #${booking.bookingNumber || id.slice(-8)} has been rescheduled to ${newTimeFormatted}`,
          data: { bookingId: id },
        });
      }
    } catch (err) {
      this.logger.warn(`Reschedule notification failed for booking ${id}: ${err.message}`);
    }

    return updated;
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

  async getAvailableSlots(businessId: string, serviceId: string, date: string, staffId?: string): Promise<{ slot: string; availableStaff: number }[]> {
    const service = await this.servicesService.findOne(serviceId);
    const dayStart = new Date(`${date}T09:00:00`);
    const dayEnd = new Date(`${date}T18:00:00`);

    const bookingQuery: any = {
      business: new Types.ObjectId(businessId),
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      startTime: { $gte: dayStart, $lt: dayEnd },
    };

    if (staffId) {
      bookingQuery.staff = new Types.ObjectId(staffId);
    }

    const existingBookings = await this.bookingModel.find(bookingQuery);

    // Count total active staff for the business
    const { count: totalStaff } = await this.staffService.getStaffCount(businessId);
    if (totalStaff === 0) {
      this.logger.warn(`Business ${businessId} has no active staff; defaulting to 1 for slot availability`);
    }
    const effectiveTotalStaff = totalStaff > 0 ? totalStaff : 1;

    const slots: { slot: string; availableStaff: number }[] = [];
    const slotDuration = service.duration * 60000;
    let current = dayStart.getTime();

    while (current + slotDuration <= dayEnd.getTime()) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current + slotDuration);

      if (staffId) {
        // Per-staff check
        const isBooked = existingBookings.some(
          (b) =>
            (b.startTime >= slotStart && b.startTime < slotEnd) ||
            (b.endTime > slotStart && b.endTime <= slotEnd),
        );
        if (!isBooked) {
          slots.push({ slot: slotStart.toISOString(), availableStaff: 1 });
        }
      } else {
        // Count bookings in this slot across all staff
        const slotBookings = existingBookings.filter(
          (b) =>
            (b.startTime >= slotStart && b.startTime < slotEnd) ||
            (b.endTime > slotStart && b.endTime <= slotEnd),
        );
        const available = Math.max(0, effectiveTotalStaff - slotBookings.length);
        if (available > 0) {
          slots.push({ slot: slotStart.toISOString(), availableStaff: available });
        }
      }
      current += slotDuration;
    }

    return slots;
  }

  async generatePdfReceipt(bookingId: string): Promise<Buffer> {
    const booking = await this.findOne(bookingId);
    const service = booking.service as any;
    const business = booking.business as any;
    const client = booking.client as any;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fillColor('#6366f1').fontSize(24).text('BookEase', 50, 50);
      doc.fillColor('#1e1b4b').fontSize(18).text('Booking Receipt', 50, 80);
      doc.fontSize(10).fillColor('#6b7280').text(`Booking #${booking.bookingNumber || booking._id.toString().slice(-8).toUpperCase()}`, 50, 105);

      // Divider
      doc.moveTo(50, 125).lineTo(545, 125).strokeColor('#e5e7eb').stroke();

      // Booking details table
      const tableTop = 145;
      const labelX = 50;
      const valueX = 250;
      let y = tableTop;

      const rows = [
        ['Business', business?.name || 'N/A'],
        ['Service', service?.name || 'N/A'],
        ['Date', new Date(booking.startTime).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })],
        ['Time', new Date(booking.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })],
        ['Duration', `${service?.duration || 0} minutes`],
        ['Client', client ? `${client.firstName} ${client.lastName}` : 'N/A'],
        ['Booking Status', booking.status.toUpperCase()],
        ['Payment Status', booking.paymentStatus.toUpperCase()],
        ['Payment Method', booking.paymentMethod || 'N/A'],
      ];

      rows.forEach(([label, value]) => {
        doc.fontSize(10).fillColor('#6366f1').font('Helvetica-Bold').text(label, labelX, y);
        doc.fontSize(10).fillColor('#1e1b4b').font('Helvetica').text(value, valueX, y);
        y += 25;
        doc.moveTo(50, y - 5).lineTo(545, y - 5).strokeColor('#f3f4f6').stroke();
      });

      // Total
      y += 10;
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#6366f1').lineWidth(1.5).stroke();
      y += 15;
      doc.fontSize(14).fillColor('#6366f1').font('Helvetica-Bold')
        .text('Total Amount:', labelX, y)
        .text(`₹${((booking.amount || 0) / 100).toFixed(2)}`, valueX, y);

      // Footer
      doc.fontSize(9).fillColor('#9ca3af').font('Helvetica')
        .text(`Generated on ${new Date().toLocaleString('en-IN')} • BookEase Platform`, 50, 750, { align: 'center' });

      doc.end();
    });
  }
}
