import { Controller, Get, Query, UseGuards, Redirect } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('auth-url')
  @ApiOperation({ summary: 'Get Google Calendar OAuth URL' })
  getAuthUrl() {
    return { url: this.calendarService.getAuthUrl() };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Google Calendar OAuth callback' })
  @ApiQuery({ name: 'code', required: true })
  async handleCallback(@Query('code') code: string) {
    const tokens = await this.calendarService.getTokens(code);
    return { tokens };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('events')
  @ApiOperation({ summary: 'Get calendar events' })
  @ApiQuery({ name: 'timeMin', required: false })
  @ApiQuery({ name: 'timeMax', required: false })
  async getEvents(
    @CurrentUser() user: any,
    @Query('timeMin') timeMin?: string,
    @Query('timeMax') timeMax?: string,
  ) {
    return [];
  }
}
