import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('count')
  @ApiOperation({ summary: 'Get staff count and limit for a business' })
  @ApiQuery({ name: 'businessId', required: true })
  getStaffCount(@Query('businessId') businessId: string) {
    return this.staffService.getStaffCount(businessId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff for a business' })
  @ApiQuery({ name: 'businessId', required: true })
  findAll(@Query('businessId') businessId: string) {
    return this.staffService.findAll(businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff member by ID' })
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new staff member' })
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update staff member' })
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, updateStaffDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Remove staff member' })
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }
}
