import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookingStatus } from './schemas/booking.schema';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  create(@Body() createBookingDto: CreateBookingDto, @CurrentUser() user: any) {
    return this.bookingsService.create(createBookingDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get bookings for current user' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiQuery({ name: 'businessId', required: false })
  @ApiQuery({ name: 'bookingNumber', required: false })
  findMy(
    @CurrentUser() user: any,
    @Query('status') status?: BookingStatus,
    @Query('businessId') businessId?: string,
    @Query('bookingNumber') bookingNumber?: string,
  ) {
    status = !status ? BookingStatus.PENDING : status;
    return this.bookingsService.findAll({ status, businessId, bookingNumber });
  }

  @Get('business/:businessId')
  @ApiOperation({ summary: 'Get all bookings for a business (business owner only)' })
  @ApiQuery({ name: 'search', required: false })
  findByBusiness(
    @Param('businessId') businessId: string,
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
    return this.bookingsService.findByBusiness(businessId, user.userId, search);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Get available time slots' })
  @ApiQuery({ name: 'businessId', required: true })
  @ApiQuery({ name: 'serviceId', required: true })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'staffId', required: false })
  getAvailableSlots(
    @Query('businessId') businessId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.bookingsService.getAvailableSlots(businessId, serviceId, date, staffId);
  }

  @Get(':id/receipt')
  @ApiOperation({ summary: 'Download PDF receipt for a booking' })
  async downloadReceipt(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.bookingsService.generatePdfReceipt(id);
    const booking = await this.bookingsService.findOne(id);
    const filename = `receipt-${(booking as any).bookingNumber || id.slice(-8)}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking status' })
  update(@Param('id') id: string, @Body() updateDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateDto);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm a booking (business owner only)' })
  confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.confirm(id, user.userId);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ summary: 'Mark booking as paid (business owner only)' })
  markAsPaid(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('paymentMethod') paymentMethod?: string,
  ) {
    return this.bookingsService.markAsPaid(id, user.userId, paymentMethod);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark booking as completed (business owner only)' })
  complete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.complete(id, user.userId);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a booking' })
  reschedule(@Param('id') id: string, @Body('startTime') startTime: string, @CurrentUser() user: any) {
    return this.bookingsService.reschedule(id, startTime, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiQuery({ name: 'reason', required: false })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('reason') reason?: string,
  ) {
    return this.bookingsService.cancel(id, user.userId, reason);
  }
}
