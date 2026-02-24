import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  findMy(
    @CurrentUser() user: any,
    @Query('status') status?: BookingStatus,
    @Query('businessId') businessId?: string,
  ) {
    return this.bookingsService.findAll({ clientId: user.userId, status, businessId });
  }

  @Get('business/:businessId')
  @ApiOperation({ summary: 'Get all bookings for a business (business owner only)' })
  findByBusiness(@Param('businessId') businessId: string, @CurrentUser() user: any) {
    return this.bookingsService.findByBusiness(businessId, user.userId);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Get available time slots' })
  @ApiQuery({ name: 'businessId', required: true })
  @ApiQuery({ name: 'serviceId', required: true })
  @ApiQuery({ name: 'date', required: true })
  getAvailableSlots(
    @Query('businessId') businessId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    return this.bookingsService.getAvailableSlots(businessId, serviceId, date);
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

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark booking as completed (business owner only)' })
  complete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.complete(id, user.userId);
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
