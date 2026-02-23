import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('businesses/pending')
  @ApiOperation({ summary: 'Get pending business verifications' })
  getPendingBusinesses() {
    return this.adminService.getPendingBusinesses();
  }

  @Get('businesses')
  @ApiOperation({ summary: 'Get all businesses (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getAllBusinesses(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.getAllBusinesses(+page, +limit);
  }

  @Patch('businesses/:id/verify')
  @ApiOperation({ summary: 'Approve or reject a business' })
  verifyBusiness(
    @Param('id') id: string,
    @Body('approved') approved: boolean,
    @Body('notes') notes?: string,
  ) {
    return this.adminService.verifyBusiness(id, approved, notes);
  }

  @Patch('businesses/:id/status')
  @ApiOperation({ summary: 'Suspend or activate a business' })
  updateBusinessStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.updateBusinessStatus(id, isActive);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getAllUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.getAllUsers(+page, +limit);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Ban or suspend a user' })
  updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.updateUserStatus(id, isActive, reason);
  }
}
