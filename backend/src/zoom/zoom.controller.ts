import { Controller, Post, Delete, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZoomService } from './zoom.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateZoomMeetingDto {
  @ApiProperty()
  @IsString()
  topic: string;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agenda?: string;
}

@ApiTags('Zoom')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('zoom')
export class ZoomController {
  constructor(private readonly zoomService: ZoomService) {}

  @Post('meetings')
  @ApiOperation({ summary: 'Create a Zoom meeting' })
  createMeeting(@Body() dto: CreateZoomMeetingDto) {
    return this.zoomService.createMeeting({
      topic: dto.topic,
      startTime: new Date(dto.startTime),
      duration: dto.duration,
      agenda: dto.agenda,
    });
  }

  @Get('meetings/:id')
  @ApiOperation({ summary: 'Get Zoom meeting details' })
  getMeeting(@Param('id') id: string) {
    return this.zoomService.getMeeting(id);
  }

  @Delete('meetings/:id')
  @ApiOperation({ summary: 'Delete a Zoom meeting' })
  deleteMeeting(@Param('id') id: string) {
    return this.zoomService.deleteMeeting(id);
  }
}
